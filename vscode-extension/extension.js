const fs = require("node:fs");
const path = require("node:path");
const vscode = require("vscode");
const { analyzeAstFile } = require("./astEngine");

const ECO_SOURCE = "EcoCode";
const SUPPORTED_LANGUAGES = new Set([
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact",
]);
const ENV_CANDIDATES = [".env", ".env.local", ".env.development", ".env.example"];

/** @type {vscode.DiagnosticCollection | undefined} */
let diagnosticsCollection;
/** @type {Map<string, NodeJS.Timeout>} */
const analysisTimers = new Map();
/** @type {Map<string, vscode.Diagnostic[]>} */
const documentDiagnostics = new Map();

/** @type {vscode.TextEditorDecorationType | undefined} */
let frontendDecoration;
/** @type {vscode.TextEditorDecorationType | undefined} */
let cautionDecoration;

function activate(context) {
  diagnosticsCollection = vscode.languages.createDiagnosticCollection("ecocode");
  frontendDecoration = vscode.window.createTextEditorDecorationType({
    textDecoration: "underline wavy rgba(56, 214, 133, 0.85)",
    overviewRulerColor: "rgba(56, 214, 133, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  });
  cautionDecoration = vscode.window.createTextEditorDecorationType({
    textDecoration: "underline wavy rgba(241, 196, 15, 0.9)",
    overviewRulerColor: "rgba(241, 196, 15, 0.8)",
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  });

  context.subscriptions.push(diagnosticsCollection, frontendDecoration, cautionDecoration);

  const hoverProvider = vscode.languages.registerHoverProvider(
    [
      { scheme: "file", language: "javascript" },
      { scheme: "file", language: "javascriptreact" },
      { scheme: "file", language: "typescript" },
      { scheme: "file", language: "typescriptreact" },
    ],
    {
      provideHover(document, position) {
        const diagnostics = diagnosticsCollection ? diagnosticsCollection.get(document.uri) ?? [] : [];
        const hit = diagnostics.find((d) => d.range.contains(position));
        if (!hit) return null;

        const hint = explainImpact(hit.message);
        const markdown = new vscode.MarkdownString(
          [
            "### EcoCode Insight",
            "",
            `**${hit.message}**`,
            "",
            `${hint}`,
            "",
            "_Suggerimento: usa la lampadina (Quick Fix) per applicare Eco-Fix AI._",
          ].join("\n")
        );
        markdown.isTrusted = false;
        return new vscode.Hover(markdown, hit.range);
      },
    }
  );

  const codeActionProvider = vscode.languages.registerCodeActionsProvider(
    [
      { scheme: "file", language: "javascript" },
      { scheme: "file", language: "javascriptreact" },
      { scheme: "file", language: "typescript" },
      { scheme: "file", language: "typescriptreact" },
    ],
    {
      provideCodeActions(document, _range, context) {
        const ecocodeDiagnostics = context.diagnostics.filter((d) => d.source === ECO_SOURCE);
        return ecocodeDiagnostics.map((diagnostic) => {
          const action = new vscode.CodeAction(
            "EcoCode: Applica ottimizzazione AI",
            vscode.CodeActionKind.QuickFix
          );
          action.diagnostics = [diagnostic];
          action.command = {
            command: "ecocode.applyEcoFix",
            title: "Applica Eco-Fix",
            arguments: [document.uri, diagnostic.range, diagnostic.message],
          };
          return action;
        });
      },
    },
    { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
  );

  const applyEcoFixCommand = vscode.commands.registerCommand(
    "ecocode.applyEcoFix",
    async (uri, range, issueDescription) => {
      if (!(uri instanceof vscode.Uri) || !(range instanceof vscode.Range)) {
        vscode.window.showErrorMessage("EcoCode non ha trovato un contesto valido per applicare il fix.");
        return;
      }

      const document = await vscode.workspace.openTextDocument(uri);
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder) {
        vscode.window.showInformationMessage("Apri una cartella workspace per usare Eco-Fix AI.");
        return;
      }

      const keyInfo = readApiKeysFromEnv(workspaceFolder.uri.fsPath);
      if (!keyInfo) {
        const choice = await vscode.window.showInformationMessage(
          "Eco-Fix AI richiede OPENAI_API_KEY o GEMINI_API_KEY in .env, .env.local, .env.development o .env.example.",
          "Apri .env"
        );
        if (choice === "Apri .env") {
          await openOrCreateEnv(workspaceFolder.uri.fsPath);
        }
        return;
      }

      const targetRange = expandToContextRange(document, range, 2);
      const snippet = document.getText(targetRange);
      const fileLabel = path.basename(document.fileName);

      let replacement;
      try {
        replacement = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "EcoCode: generazione Eco-Fix in corso...",
            cancellable: false,
          },
          async () => {
            const prompt = buildEcoFixPrompt(snippet, issueDescription, fileLabel);
            return generateEcoFix(prompt, keyInfo);
          }
        );
      } catch (error) {
        vscode.window.showErrorMessage(formatEcoFixError(error));
        return;
      }

      if (!replacement || !replacement.trim()) {
        vscode.window.showErrorMessage("Eco-Fix non ha restituito una proposta valida.");
        return;
      }

      const edit = new vscode.WorkspaceEdit();
      edit.replace(uri, targetRange, replacement.trimEnd());
      const applied = await vscode.workspace.applyEdit(edit);
      if (!applied) {
        vscode.window.showErrorMessage("Impossibile applicare Eco-Fix automaticamente.");
        return;
      }

      await document.save();
      analyzeDocument(document);
      vscode.window.showInformationMessage("Eco-Fix applicato: codice ottimizzato con successo.");
    }
  );

  context.subscriptions.push(hoverProvider, codeActionProvider, applyEcoFixCommand);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => scheduleAnalysis(doc, 20)),
    vscode.workspace.onDidSaveTextDocument((doc) => scheduleAnalysis(doc, 0)),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticsCollection.delete(doc.uri);
      documentDiagnostics.delete(doc.uri.toString());
      clearTimer(doc.uri);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (!isRealtimeEnabled()) return;
      scheduleAnalysis(event.document);
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        applyDecorations(editor, documentDiagnostics.get(editor.document.uri.toString()) ?? []);
      }
    })
  );

  // Analyze already-open editors at activation.
  for (const editor of vscode.window.visibleTextEditors) {
    scheduleAnalysis(editor.document, 10);
  }
}

function deactivate() {
  for (const timer of analysisTimers.values()) {
    clearTimeout(timer);
  }
  analysisTimers.clear();
  documentDiagnostics.clear();
  if (diagnosticsCollection) {
    diagnosticsCollection.clear();
    diagnosticsCollection.dispose();
  }
}

function isRealtimeEnabled() {
  return vscode.workspace.getConfiguration("ecocode").get("enableRealtime", true);
}

function getDebounceMs() {
  return vscode.workspace.getConfiguration("ecocode").get("analysisDebounceMs", 350);
}

function isSupportedDocument(document) {
  return document.uri.scheme === "file" && SUPPORTED_LANGUAGES.has(document.languageId);
}

function clearTimer(uri) {
  const key = uri.toString();
  const existing = analysisTimers.get(key);
  if (existing) {
    clearTimeout(existing);
    analysisTimers.delete(key);
  }
}

function scheduleAnalysis(document, explicitDelay) {
  if (!isSupportedDocument(document) || !diagnosticsCollection) return;

  const key = document.uri.toString();
  clearTimer(document.uri);

  const delay = typeof explicitDelay === "number" ? explicitDelay : getDebounceMs();
  const timer = setTimeout(() => {
    analysisTimers.delete(key);
    analyzeDocument(document);
  }, delay);

  analysisTimers.set(key, timer);
}

function analyzeDocument(document) {
  if (!diagnosticsCollection || !isSupportedDocument(document)) return;

  let parsed;
  try {
    parsed = analyzeAstFile(document.fileName, document.getText());
  } catch {
    diagnosticsCollection.delete(document.uri);
    documentDiagnostics.delete(document.uri.toString());
    return;
  }

  const diagnostics = parsed.findings.map((finding) => createDiagnosticFromFinding(document, finding));
  diagnosticsCollection.set(document.uri, diagnostics);
  documentDiagnostics.set(document.uri.toString(), diagnostics);

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && activeEditor.document.uri.toString() === document.uri.toString()) {
    applyDecorations(activeEditor, diagnostics);
  }
}

function createDiagnosticFromFinding(document, finding) {
  const lineIndex = Math.max(0, Math.min(document.lineCount - 1, (finding.line || 1) - 1));
  const line = document.lineAt(lineIndex);
  const startChar = Math.max(0, line.firstNonWhitespaceCharacterIndex);
  const endChar = Math.max(startChar + 1, line.range.end.character);
  const range = new vscode.Range(lineIndex, startChar, lineIndex, endChar);

  const diagnostic = new vscode.Diagnostic(
    range,
    finding.description,
    vscode.DiagnosticSeverity.Information
  );
  diagnostic.source = ECO_SOURCE;
  diagnostic.code = finding.category;
  return diagnostic;
}

function applyDecorations(editor, diagnostics) {
  if (!frontendDecoration || !cautionDecoration) return;

  const greenRanges = [];
  const yellowRanges = [];

  for (const diagnostic of diagnostics) {
    if (diagnostic.source !== ECO_SOURCE) continue;
    const category = String(diagnostic.code || "");
    if (category.includes("Frontend")) {
      greenRanges.push(diagnostic.range);
    } else {
      yellowRanges.push(diagnostic.range);
    }
  }

  editor.setDecorations(frontendDecoration, greenRanges);
  editor.setDecorations(cautionDecoration, yellowRanges);
}

function explainImpact(message) {
  if (message.includes("loop") || message.includes("N+1")) {
    return "Questo pattern aumenta lavoro CPU/DB ad ogni iterazione, rallenta il server e spreca energia.";
  }
  if (message.includes("temperatura alta")) {
    return "Temperature elevate generano output meno stabili e consumano piu token del necessario.";
  }
  if (message.includes("map() senza key")) {
    return "Senza key stabile React puo ri-renderizzare in eccesso, con piu consumo su client e batteria.";
  }
  if (message.includes("dipendenza pesante")) {
    return "Import pesanti aumentano bundle e parse time: piu CPU su browser e tempi di caricamento peggiori.";
  }
  return "Questa porzione di codice puo incrementare consumo computazionale e costo energetico complessivo.";
}

function readApiKeysFromEnv(workspaceRoot) {
  let openai = null;
  let gemini = null;

  for (const envName of ENV_CANDIDATES) {
    const envPath = path.join(workspaceRoot, envName);
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const raw = fs.readFileSync(envPath, "utf8");
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!match) continue;

      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key === "OPENAI_API_KEY" && value) openai = value;
      if (key === "GEMINI_API_KEY" && value) gemini = value;
    }
  }

  if (!openai && !gemini) return null;
  return {
    openaiApiKey: openai,
    geminiApiKey: gemini,
  };
}

function formatEcoFixError(error) {
  const message = error instanceof Error ? error.message : String(error || "Errore sconosciuto");

  if (/gemini api error:\s*429/i.test(message) || /exceeded your current quota/i.test(message)) {
    return "Gemini ha superato la quota (429). Aggiungi credito/billing Gemini o configura OPENAI_API_KEY per il fallback automatico.";
  }

  if (/openai api error:\s*429/i.test(message)) {
    return "OpenAI ha superato la quota (429). Controlla billing/limiti o configura GEMINI_API_KEY come alternativa.";
  }

  return `Eco-Fix non disponibile: ${message}`;
}

async function tryProviderEcoFix(provider, prompt, apiKey) {
  if (provider === "gemini") {
    const data = await callGemini(prompt, apiKey);
    return data.fixedCode;
  }

  const data = await callOpenAI(prompt, apiKey);
  return data.fixedCode;
}

async function generateEcoFix(prompt, keyInfo) {
  const geminiKey = keyInfo?.geminiApiKey || null;
  const openaiKey = keyInfo?.openaiApiKey || null;

  if (!geminiKey && !openaiKey) {
    throw new Error("Nessuna API key valida trovata.");
  }

  // Prefer Gemini first (costo spesso minore), con fallback automatico su OpenAI.
  if (geminiKey) {
    try {
      return await tryProviderEcoFix("gemini", prompt, geminiKey);
    } catch (geminiError) {
      if (openaiKey) {
        try {
          return await tryProviderEcoFix("openai", prompt, openaiKey);
        } catch {
          throw geminiError;
        }
      }
      throw geminiError;
    }
  }

  // Solo OpenAI disponibile.
  return tryProviderEcoFix("openai", prompt, openaiKey);
}

async function openOrCreateEnv(workspaceRoot) {
  const envPath = path.join(workspaceRoot, ".env");
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(
      envPath,
      [
        "# EcoCode AI key",
        "# OPENAI_API_KEY=",
        "# GEMINI_API_KEY=",
        "",
      ].join("\n"),
      "utf8"
    );
  }

  const doc = await vscode.workspace.openTextDocument(envPath);
  await vscode.window.showTextDocument(doc, { preview: false });
}

function expandToContextRange(document, range, paddingLines) {
  const startLine = Math.max(0, range.start.line - paddingLines);
  const endLine = Math.min(document.lineCount - 1, range.end.line + paddingLines);
  const start = new vscode.Position(startLine, 0);
  const end = document.lineAt(endLine).range.end;
  return new vscode.Range(start, end);
}

function buildEcoFixPrompt(snippet, issueDescription, filename) {
  return [
    "Agisci come Senior Green Software Engineer.",
    "Ottimizza solo il frammento seguente per ridurre CPU, rete e uso memoria, mantenendo il comportamento funzionale.",
    `Problema rilevato da EcoCode: ${issueDescription}`,
    `File: ${filename}`,
    "Restituisci SOLO JSON valido nel formato {\"fixedCode\":\"...\"}.",
    "",
    "Snippet originale:",
    "```",
    snippet,
    "```",
  ].join("\n");
}

async function callOpenAI(prompt, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${body.slice(0, 160)}`);
  }

  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI ha restituito una risposta vuota.");
  }

  return parseModelJson(content);
}

async function callGemini(prompt, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${body.slice(0, 160)}`);
  }

  const result = await response.json();
  const content = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Gemini ha restituito una risposta vuota.");
  }

  return parseModelJson(content);
}

function parseModelJson(rawText) {
  const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed.fixedCode !== "string") {
    throw new Error("Risposta modello non valida: fixedCode mancante.");
  }
  return parsed;
}

module.exports = {
  activate,
  deactivate,
};
