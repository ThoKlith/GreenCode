# GreenCode CLI (`ecocode`)

Measure the **real energy & CO₂ impact** of your code — right from the terminal.

GreenCode gives your codebase an **energy class (A–G)**, like a home appliance, and can
**actually run your code** to measure real CPU energy (mWh) and estimated CO₂.

```bash
npx ecocode@latest analyze
```

No install needed — `npx` runs the latest version.

---

## Commands

### `analyze` — static estimate of the whole folder (no setup)
Scans the current folder (AST), rates it A–G, and generates an online report.
```bash
npx ecocode@latest analyze
npx ecocode@latest analyze --max-files 50
```

### `profile <file>` — real measurement of ONE file (no setup)
Actually executes a file and measures real user/system CPU → energy (mWh) and CO₂.
```bash
npx ecocode@latest profile ./dist/index.js
```

### `profile-project` — real measurement of the WHOLE project (needs a config)
Runs several **real scenarios** of your project, each with a weight, and returns a
**weighted energy KPI** for the whole codebase.

```bash
npx ecocode@latest init            # creates a starter ecocode.profile.json
# edit the scenarios to point at your real entrypoints, then:
npx ecocode@latest profile-project
```

---

## Why does `profile-project` need `ecocode.profile.json`?

Because it measures **real** energy by **actually running code** — and only you know
*which* files represent your app and how much each matters. You declare that once:

```json
{
  "repeat": 3,
  "scenarios": [
    { "name": "API startup", "file": "./dist/server.js", "weight": 3 },
    { "name": "Daily batch", "file": "./dist/jobs/daily.js", "weight": 1 }
  ]
}
```

- `file` — a runnable entrypoint (`.js` / `.mjs` / `.cjs`).
- `weight` — how much that flow matters in real usage (higher counts more in the average).
- `repeat` — runs per scenario (more runs = less noise).

> `analyze` and `profile <file>` need **no config** and work anywhere. Only the weighted
> whole-project measurement needs the JSON. Run `ecocode init` to scaffold it.

---

## How energy is estimated

From the **real measured CPU time**:

```
Energy_mWh = (CPU_Time_ms × Standard_CPU_Wattage) / 3600
```

Defaults: Standard CPU power **65 W**, grid carbon intensity **442 gCO₂e/kWh**. These are
transparent model constants (shown in the output), so the numbers are best used for
**relative comparisons** (before/after an optimization) as well as absolute estimates.

## Safety

`profile` and `profile-project` **run code locally**. Only profile files you trust.

## Links

- Web app & full docs: https://green-code-swart.vercel.app
