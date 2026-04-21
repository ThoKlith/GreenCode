#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';

// Cartelle da ignorare sempre
const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
  'coverage', '.nyc_output', '__pycache__', '.venv', 'venv',
  '.idea', '.vscode', '.vs', 'vendor', 'target', 'bin', 'obj',
  '.svn', '.hg', '.terraform', '.angular', '.gradle'
]);

// Estensioni sorgente accettate
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs',
  '.css', '.scss', '.html', '.php', '.rb', '.c', '.cpp', '.h',
  '.cs', '.swift', '.kt', '.vue', '.svelte', '.astro'
]);

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
      if (ALLOWED_EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

program
  .name('ecocode')
  .description("Analisi locale di sostenibilità energetica del codice sorgente")
  .version('1.0.0');

program
  .command('analyze')
  .description('Analizza la cartella corrente e genera un report reale')
  .option('-h, --host <url>', 'URL della Web App EcoCode', 'http://localhost:3000')
  .option('-m, --max-files <n>', 'Numero massimo di file da analizzare', '35')
  .action(async (options) => {
    const maxFiles = parseInt(options.max_files || options.maxFiles, 10) || 35;

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

    spinner.start(`Lettura del contenuto di ${selectedFiles.length} file...`);

    let sourceCodeBundle = '';
    let totalChars = 0;
    const MAX_CHARS = 500000; // ~500KB di testo max complessivi
    const MAX_SINGLE_FILE = 80000; // ~80KB per singolo file

    for (const filePath of selectedFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.length > MAX_SINGLE_FILE) continue; // Salta file enormi (bundle, minified)
        if (totalChars + content.length > MAX_CHARS) break; // Raggiunti limiti

        const relativePath = path.relative(cwd, filePath).replace(/\\/g, '/');
        sourceCodeBundle += `\n--- FILE: ${relativePath} ---\n${content}\n\n`;
        totalChars += content.length;
      } catch {
        // Salta file non leggibili
      }
    }

    spinner.succeed(`Preparato bundle: ${chalk.cyan(selectedFiles.length)} file, ${chalk.cyan((totalChars / 1024).toFixed(1))} KB di codice`);

    spinner.start('Invio al server EcoCode per analisi AI con Gemini...');

    try {
      const response = await fetch(`${options.host}/api/reports/local/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName,
          source_code: sourceCodeBundle
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore durante l'invio del report.");
      }

      spinner.succeed(chalk.green('Analisi AI completata con successo!\n'));

      // Stampa riepilogo
      console.log(chalk.bold('┌──────────────────────────────────────────┐'));
      console.log(chalk.bold('│        📊 RISULTATI ANALISI REALE        │'));
      console.log(chalk.bold('├──────────────────────────────────────────┤'));

      const classColor = ['A', 'B'].includes(data.energy_class) ? chalk.green : ['C', 'D'].includes(data.energy_class) ? chalk.yellow : chalk.red;
      console.log(`  Classe Energetica:     ${classColor.bold(data.energy_class)}`);
      console.log(`  CO2 Stimata:           ${chalk.white(data.co2_estimate)} kg/anno`);
      console.log(`  Efficienza Codice:     ${chalk.cyan(data.efficiency_score)}/100`);
      console.log(`  Ottimizzazione AI:     ${chalk.cyan(data.ai_optimization_score)}/100`);
      console.log(`  Vulnerabilità trovate: ${chalk.yellow(data.snippet_count)}`);

      console.log(chalk.bold('└──────────────────────────────────────────┘'));

      console.log('\n' + chalk.bold('🌍 Report completo con soluzioni AI:'));
      console.log(chalk.blueBright.underline.bold(`   ${data.url}`));
      console.log(chalk.gray('\n   Apri il link nel browser per visualizzare la dashboard.\n'));

    } catch (error) {
      spinner.fail(chalk.red('Analisi fallita.'));
      console.error(chalk.red(`\n❌ Errore: ${error.message}`));
      console.log(chalk.gray(`\nVerifica che:`));
      console.log(chalk.gray(`  1. La Web App EcoCode sia in esecuzione su ${options.host}`));
      console.log(chalk.gray(`  2. La tabella 'local_reports' esista nel database Supabase`));
      console.log(chalk.gray(`  3. La variabile GEMINI_API_KEY sia configurata nel .env.local\n`));
    }
  });

program.parse();
