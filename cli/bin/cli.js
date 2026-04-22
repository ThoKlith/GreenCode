#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

// Cartelle da ignorare sempre
const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
  'coverage', '.nyc_output', '__pycache__', '.venv', 'venv',
  '.idea', '.vscode', '.vs', 'vendor', 'target', 'bin', 'obj',
  '.svn', '.hg', '.terraform', '.angular', '.gradle'
]);

const AST_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

// File da ignorare per nome
const IGNORED_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.DS_Store', 'Thumbs.db', '.env', '.env.local'
]);

function walkDir(dir, fileList = [], depth = 0) {
  if (depth > 8) return fileList; // Limita la profondità per sicurezza

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return fileList;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walkDir(fullPath, fileList, depth + 1);
    } else if (entry.isFile()) {
      if (IGNORED_FILES.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (AST_EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

function getScriptKind(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.tsx') return ts.ScriptKind.TSX;
  if (ext === '.jsx') return ts.ScriptKind.JSX;
  if (ext === '.ts') return ts.ScriptKind.TS;
  return ts.ScriptKind.JS;
}

function detectCategory(description) {
  if (description.includes('AI')) return 'Spreco AI';
  if (description.includes('DB') || description.includes('query') || description.includes('N+1')) return 'Inefficienza DB';
  return 'Frontend Bloat';
}

function createFinding({ findings, seenKeys, file, sourceFile, node, description }) {
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  const dedupeKey = `${file}:${line}:${description}`;
  if (seenKeys.has(dedupeKey)) return;
  seenKeys.add(dedupeKey);

  findings.push({
    id: `vuln-${findings.length + 1}`,
    filename: file,
    line,
    category: detectCategory(description),
    description
  });
}

function isMapCallExpression(node) {
  return (
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'map' &&
    node.arguments.length > 0
  );
}

function isJsxLike(node) {
  return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
}

function getReturnedJsxNodes(callback) {
  const jsxNodes = [];

  if (ts.isArrowFunction(callback) && callback.body && isJsxLike(callback.body)) {
    jsxNodes.push(callback.body);
    return jsxNodes;
  }

  const body = callback.body;
  const visit = (node) => {
    if (ts.isReturnStatement(node) && node.expression && isJsxLike(node.expression)) {
      jsxNodes.push(node.expression);
    }
    ts.forEachChild(node, visit);
  };

  if (body) visit(body);
  return jsxNodes;
}

function jsxNodeHasKey(jsxNode) {
  if (ts.isJsxElement(jsxNode)) {
    return jsxNode.openingElement.attributes.properties.some(
      (a) => ts.isJsxAttribute(a) && a.name.text === 'key'
    );
  }

  if (ts.isJsxSelfClosingElement(jsxNode)) {
    return jsxNode.attributes.properties.some(
      (a) => ts.isJsxAttribute(a) && a.name.text === 'key'
    );
  }

  // I frammenti shorthand <>...</> non possono avere key: segnaliamo il caso nel contesto map.
  if (ts.isJsxFragment(jsxNode)) {
    return false;
  }

  return true;
}

function analyzeAstFile(filePath, content) {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath)
  );
  const relativeFile = filePath.replace(/\\/g, '/');
  const findings = [];
  const seenFindingKeys = new Set();

  let dbLoopCount = 0;
  let aiCallCount = 0;
  let aiCallSites = 0;
  let frontBloatCount = 0;

  function isAiCall(node) {
    const text = node.getText(sourceFile);
    return /openai|gemini|anthropic|chat\.completions|generateContent/i.test(text);
  }

  function isDbCall(node) {
    const text = node.getText(sourceFile);
    return /select\(|query\(|execute\(|findMany\(|prisma\.|supabase\.|mysql|postgres|mongodb/i.test(text);
  }

  function visit(node, inLoop = false) {
    if (ts.isImportDeclaration(node)) {
      const imp = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
      if (/lodash|moment|chart\.js|aws-sdk|firebase|three|antd/i.test(imp)) {
        frontBloatCount += 1;
        createFinding({
          findings,
          seenKeys: seenFindingKeys,
          file: relativeFile,
          sourceFile,
          node,
          description: `Frontend Bloat: dipendenza pesante importata (${imp}).`
        });
      }
    }

    if (ts.isCallExpression(node)) {
      const text = node.getText(sourceFile);
      if (/SELECT\s+\*/i.test(text)) {
        dbLoopCount += 1;
        createFinding({
          findings,
          seenKeys: seenFindingKeys,
          file: relativeFile,
          sourceFile,
          node,
          description: 'Inefficienza DB: query con SELECT * non ottimizzata.'
        });
      }

      if (inLoop && isDbCall(node)) {
        dbLoopCount += 1;
        createFinding({
          findings,
          seenKeys: seenFindingKeys,
          file: relativeFile,
          sourceFile,
          node,
          description: 'Inefficienza DB: possibile query N+1 dentro un loop.'
        });
      }

      if (isAiCall(node)) {
        aiCallSites += 1;
        if (inLoop) {
          aiCallCount += 1;
          createFinding({
            findings,
            seenKeys: seenFindingKeys,
            file: relativeFile,
            sourceFile,
            node,
            description: 'Spreco AI: chiamata a modello AI dentro un loop.'
          });
        }
      }

      const tempArg = node.arguments.find((arg) => /temperature\s*:\s*([0-9.]+)/i.test(arg.getText(sourceFile)));
      if (tempArg && /temperature\s*:\s*([1-9]|\d{2,})/i.test(tempArg.getText(sourceFile))) {
        aiCallCount += 1;
        createFinding({
          findings,
          seenKeys: seenFindingKeys,
          file: relativeFile,
          sourceFile,
          node,
          description: 'Spreco AI: temperatura alta aumenta token inutili e variabilita di output.'
        });
      }

      if (isMapCallExpression(node)) {
        const callback = node.arguments[0];
        if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
          const returnedJsxNodes = getReturnedJsxNodes(callback);
          for (const jsxNode of returnedJsxNodes) {
            if (!jsxNodeHasKey(jsxNode)) {
              frontBloatCount += 1;
              createFinding({
                findings,
                seenKeys: seenFindingKeys,
                file: relativeFile,
                sourceFile,
                node: jsxNode,
                description: 'Frontend Bloat: elemento JSX restituito da map() senza key, possibile re-render superfluo.'
              });
            }
          }
        }
      }
    }

    const loopNode = ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node);
    ts.forEachChild(node, (child) => visit(child, inLoop || loopNode));
  }

  visit(sourceFile, false);

  if (aiCallSites >= 4) {
    aiCallCount += 1;
    findings.push({
      id: `vuln-${findings.length + 1}`,
      filename: relativeFile,
      line: 1,
      category: 'Spreco AI',
      description: 'Spreco AI: molte integrazioni modello senza evidente caching lato applicazione.'
    });
  }

  return {
    findings,
    counts: {
      frontend: frontBloatCount,
      db: dbLoopCount,
      ai: aiCallCount
    }
  };
}

function dedupeFindings(findings) {
  const unique = [];
  const seen = new Set();

  for (const finding of findings) {
    const key = `${finding.filename}:${finding.line}:${finding.category}:${finding.description}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...finding, id: `vuln-${unique.length + 1}` });
  }

  return unique;
}

function computeReport(projectName, snippets, counters) {
  const penalty = counters.frontend * 6 + counters.db * 9 + counters.ai * 7;
  const efficiencyScore = Math.max(20, 100 - penalty);
  const aiOptimizationScore = Math.max(20, 100 - counters.ai * 12);
  const co2Estimate = Number((0.08 + (100 - efficiencyScore) * 0.012).toFixed(2));

  let energyClass = 'G';
  if (efficiencyScore >= 90) energyClass = 'A';
  else if (efficiencyScore >= 80) energyClass = 'B';
  else if (efficiencyScore >= 70) energyClass = 'C';
  else if (efficiencyScore >= 60) energyClass = 'D';
  else if (efficiencyScore >= 50) energyClass = 'E';
  else if (efficiencyScore >= 40) energyClass = 'F';

  return {
    project_name: projectName,
    energy_class: energyClass,
    co2_estimate: co2Estimate,
    efficiency_score: efficiencyScore,
    ai_optimization_score: aiOptimizationScore,
    snippets: snippets.slice(0, 40)
  };
}

program
  .name('ecocode')
  .description("Analisi locale di sostenibilità energetica del codice sorgente")
  .version('1.1.2');

program
  .command('analyze')
  .description('Analizza la cartella corrente in locale (AST) e invia solo metadati')
  .option('-h, --host <url>', 'URL della Web App EcoCode', process.env.ECOCODE_HOST || 'https://green-code-swart.vercel.app')
  .option('-m, --max-files <n>', 'Numero massimo di file da analizzare', '80')
  .action(async (options) => {
    const maxFiles = parseInt(options.max_files || options.maxFiles, 10) || 80;

    console.log(chalk.green.bold('\n🌱 EcoCode CLI - Analisi Reale del Codice Sorgente\n'));

    const spinner = ora('Scansione ricorsiva dei file sorgenti locali...').start();

    const cwd = process.cwd();
    const projectName = path.basename(cwd);
    const allFiles = walkDir(cwd);

    spinner.succeed(`Trovati ${chalk.cyan(allFiles.length)} file sorgenti nel progetto ${chalk.bold(projectName)}`);

    if (allFiles.length === 0) {
      console.log(chalk.red('\n❌ Nessun file sorgente trovato nella cartella corrente.'));
      console.log(chalk.gray('Assicurati di lanciare il comando nella root del tuo progetto.\n'));
      process.exit(1);
    }

    // Seleziona i file da analizzare (i primi N)
    const selectedFiles = allFiles.slice(0, maxFiles);

    spinner.start(`Analisi AST locale su ${selectedFiles.length} file...`);

    const findings = [];
    const counters = { frontend: 0, db: 0, ai: 0 };

    for (const filePath of selectedFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (!content.trim()) continue;

        const parsed = analyzeAstFile(path.relative(cwd, filePath), content);
        findings.push(...parsed.findings);
        counters.frontend += parsed.counts.frontend;
        counters.db += parsed.counts.db;
        counters.ai += parsed.counts.ai;
      } catch {
        // Salta file non leggibili o con parsing non valido
      }
    }

    const uniqueFindings = dedupeFindings(findings);
    const reportPayload = computeReport(projectName, uniqueFindings, counters);

    spinner.succeed(`Analisi locale completata: ${chalk.cyan(reportPayload.snippets.length)} inefficienze trovate`);

    spinner.start('Invio al server EcoCode (solo metadati del report)...');

    try {
      const host = String(options.host || '').replace(/\/+$/, '');
      const endpoint = `${host}/api/reports/local`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload)
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const raw = await response.text();
        const preview = raw.slice(0, 120).replace(/\s+/g, ' ');
        throw new Error(`Risposta non JSON da ${endpoint} (status ${response.status}). Anteprima: ${preview}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore durante l'invio del report.");
      }

      spinner.succeed(chalk.green('Analisi locale completata e report salvato!\n'));

      // Stampa riepilogo
      console.log(chalk.bold('┌──────────────────────────────────────────┐'));
      console.log(chalk.bold('│        📊 RISULTATI ANALISI REALE        │'));
      console.log(chalk.bold('├──────────────────────────────────────────┤'));

      const classColor = ['A', 'B'].includes(reportPayload.energy_class) ? chalk.green : ['C', 'D'].includes(reportPayload.energy_class) ? chalk.yellow : chalk.red;
      console.log(`  Classe Energetica:     ${classColor.bold(reportPayload.energy_class)}`);
      console.log(`  CO2 Stimata:           ${chalk.white(reportPayload.co2_estimate)} kg/anno`);
      console.log(`  Efficienza Codice:     ${chalk.cyan(reportPayload.efficiency_score)}/100`);
      console.log(`  Ottimizzazione AI:     ${chalk.cyan(reportPayload.ai_optimization_score)}/100`);
      console.log(`  Vulnerabilità trovate: ${chalk.yellow(reportPayload.snippets.length)}`);

      console.log(chalk.bold('└──────────────────────────────────────────┘'));

      console.log('\n' + chalk.bold('🌍 Report completo con soluzioni AI:'));
      console.log(chalk.blueBright.underline.bold(`   ${data.url}`));
      console.log(chalk.gray('\n   Apri il link nel browser per visualizzare la dashboard.\n'));

    } catch (error) {
      spinner.fail(chalk.red('Analisi fallita.'));
      console.error(chalk.red(`\n❌ Errore: ${error.message}`));
      console.log(chalk.gray(`\nVerifica che:`));
      console.log(chalk.gray(`  1. L'endpoint API sia raggiungibile su ${options.host}`));
      console.log(chalk.gray(`     Suggerimento: ecocode analyze --host https://green-code-swart.vercel.app`));
      console.log(chalk.gray(`  2. La tabella 'local_reports' esista nel database Supabase`));
      console.log(chalk.gray(`  3. Le variabili server (OPENROUTER_API_KEY/GEMINI_API_KEY) siano configurate in deploy\n`));
    }
  });

program.parse();
