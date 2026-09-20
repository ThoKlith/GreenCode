// Scenario: scanning source files (tokenizing + counting patterns).
// Represents the most common flow: reading and scanning code. Deterministic, offline.
const sample = "const x = arr.map(v => v*2).filter(Boolean); for (let i=0;i<n;i++){ total += i; } ";
let text = "";
for (let i = 0; i < 4000; i++) text += sample;

let calls = 0, statements = 0, arrows = 0;
for (let pass = 0; pass < 20; pass++) {
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") calls++;
    else if (c === ";") statements++;
    else if (c === ">") arrows++;
  }
}
console.log(`  [scan] calls=${calls} statements=${statements} arrows=${arrows}`);
