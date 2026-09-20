// Scenario: aggregating and ranking analysis findings into a report.
// Represents a medium-frequency flow. Deterministic, offline.
const findings = [];
for (let i = 0; i < 60000; i++) {
  findings.push({
    id: i,
    file: "src/f" + (i % 200) + ".ts",
    severity: (i * 7) % 5,
    cost: (i * 13) % 1000,
  });
}

const byFile = new Map();
for (const f of findings) {
  const cur = byFile.get(f.file) || 0;
  byFile.set(f.file, cur + f.cost * (f.severity + 1));
}
const ranked = [...byFile.entries()].sort((a, b) => b[1] - a[1]);
console.log(`  [aggregate] files ranked=${ranked.length} worst=${ranked[0][0]}`);
