# EcoCode VS Code Extension

EcoCode porta il controllo energetico del codice direttamente nell'editor:

- Lint energetico in tempo reale durante scrittura e salvataggio.
- Hover esplicativi su ogni sottolineatura.
- Quick Fix con AI per ottimizzare in automatico i blocchi piu costosi.

## Funzionamento

L'estensione riusa lo stesso motore AST della CLI EcoCode (regole equivalenti), cosi i risultati restano coerenti tra editor, CLI e dashboard.

## Privacy e API key

Eco-Fix AI cerca le chiavi nel file `.env` della cartella workspace aperta:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Se non trova nessuna chiave, mostra una notifica gentile con shortcut per creare/aprire `.env`.

## Sviluppo locale

```bash
cd vscode-extension
npm install
```

Poi apri la cartella `vscode-extension` in VS Code e premi `F5` per avviare l'Extension Development Host.
