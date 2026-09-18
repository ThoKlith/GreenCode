# 🌱 GreenCode - Intelligent Code Sustainability

GreenCode is an ecosystem made of a Web App, a CLI and a VS Code extension that automatically analyzes the sustainability, energy performance and impact of a software project. It identifies energy bottlenecks, optimizes queries and highlights slow UI components that drain the batteries of your users' devices.

## How to use it

You have three (extremely cool) ways to use GreenCode depending on your needs:

### 1. 🌐 Web App (for public repos)
Got a public GitHub repository? Open the Web App, paste your GitHub project URL, and let our cloud analysis engine compute the Energy Score and give you visual refactoring suggestions right in our premium dashboard.

### 2. 💻 Local CLI (for private repos)
Working on company code that's off-limits for the web, or private repos?
You can use our **GreenCode CLI** (Node.js). The computation happens locally via static AST analysis: the code is never sent to the backend.

#### End-user installation (recommended)

Open your project folder and run:

```bash
npx ecocode@latest analyze
```

Useful options:

```bash
# use a different host (e.g. staging or local)
npx ecocode@latest analyze --host http://localhost:3000

# limit the analyzed files
npx ecocode@latest analyze --max-files 50

# run and dynamically profile a local file (CPU -> mWh -> CO2)
npx ecocode@latest profile ./dist/index.js

# profile the whole project through configured scenarios
npx ecocode@latest profile project --config ./ecocode.profile.json --repeat 5
```

Dynamic project profiling (multi-scenario):

1. Create `ecocode.profile.json` in the root (you can start from `ecocode.profile.example.json`).
2. Define the real scenarios to run (JS/MJS/CJS entrypoints) and an optional weight.
3. Run `npx ecocode@latest profile project` to get a weighted CPU/mWh/gCO2e average.

Example config:

```json
{
	"repeat": 3,
	"scenarios": [
		{
			"name": "API startup",
			"file": "./dist/server.js",
			"weight": 3
		},
		{
			"name": "Daily batch",
			"file": "./dist/jobs/daily.js",
			"weight": 1
		}
	]
}
```

#### Local CLI development (for contributors)

Make sure you've cloned the split-repo and are inside the `cli` folder.

1. Install the CLI packages:
```bash
cd cli
npm install
```

2. Link the `ecocode` command globally on your local terminal for development:
```bash
npm link
```
*(From now on you can run `ecocode` in any folder on your machine)*

3. Analyze a local source folder:
Go into your shiny project and type:
```bash
ecocode analyze
```

#### npm publish (maintainer)

To make the CLI available to everyone via `npx ecocode@latest analyze`:

1. Create the `NPM_TOKEN` secret on GitHub (Settings > Secrets and variables > Actions).
2. Bump the version in `cli/package.json` (e.g. `npm version patch` inside `cli`).
3. Create and push a release tag:

```bash
git tag ecocode-v1.0.1
git push origin ecocode-v1.0.1
```

The `.github/workflows/publish-cli.yml` workflow will automatically publish to npm.

#### What does the CLI do under the hood?
- Scans JS/TS/React and computes the Energy Score 100% locally via AST parsing.
- Detects inefficiencies (Frontend Bloat, DB Inefficiency, AI Waste) directly on the user's machine.
- Sends only report metadata (scores, filename, line, category) to the backend for the visual dashboard.
- No line of source code is sent to the server.

#### Eco-Fix (Web + local)
- On the public Web App users are not asked to enter personal API keys.
- The Eco-Fix button uses the server-side AI engine (NVIDIA NIM), configured with `NVIDIA_API_KEY`.
- If you self-host locally, set the same variable in `.env.local` and start the app.
- For privacy, the local report stores only metadata: when you open Eco-Fix you manually paste the code block to optimize.

### 3. 🧩 VS Code Extension (real-time coding)
Want to keep a high Energy Score (Class A) while you code, without changing your flow?
With the GreenCode VS Code extension you get real-time energy linting, hover explanations and AI Quick Fixes right from the editor lightbulb.

For the AI Eco-Fix, the extension automatically reads the key from the `.env` file of the open folder:
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

If the key is missing, you'll get a gentle notification with a quick link to create one.

Marketplace: https://marketplace.visualstudio.com/items?itemName=klith.ecocode-energy-lint-klith

--- 

## Internal Development

1. Make sure to set the environment variables in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` + Supabase key, and `NVIDIA_API_KEY` (NVIDIA NIM AI engine) if you work on the Web part.
2. Run the `schema.sql` dump inside the Supabase editor project. This enables storing `local_reports` and the open RLS for the CLI.

© 2026 GreenCode. Made with 💚.
