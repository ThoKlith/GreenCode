// Scenario: deep complexity analysis (nested-loop detection) — the heavy path.
// Represents a rare but expensive flow. Deterministic, offline.
const N = 1600;
const values = new Array(N);
for (let i = 0; i < N; i++) values[i] = (i * 2654435761) >>> 0;

let acc = 0;
for (let i = 0; i < N; i++) {
  for (let j = 0; j < N; j++) {
    acc = (acc + ((values[i] ^ values[j]) % 97)) >>> 0;
  }
}
console.log(`  [deep] complexity score=${acc}`);
