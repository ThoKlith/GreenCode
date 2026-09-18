// File di esempio con sprechi energetici reali
const users = [];
for (let i = 0; i < 5000; i++) users.push({ id: i, name: "user" + i, tags: ["a","b","c"] });

// Anti-pattern 1: ricerca O(n^2) dentro un loop (dovrebbe usare una Map/Set)
function countDuplicatesByName(list) {
  let dup = 0;
  for (let i = 0; i < list.length; i++) {
    for (let j = 0; j < list.length; j++) {
      if (i !== j && list[i].name === list[j].name) dup++;
    }
  }
  return dup;
}

// Anti-pattern 2: costruzione stringa con += in loop (dovrebbe usare array.join)
function buildReport(list) {
  let out = "";
  for (let i = 0; i < list.length; i++) {
    out += list[i].id + ":" + list[i].name + ";";
  }
  return out;
}

// Anti-pattern 3: JSON.parse/stringify ripetuto degli stessi dati nel loop
function reserialize(list) {
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    const clone = JSON.parse(JSON.stringify(list[i]));
    total += clone.tags.length;
  }
  return total;
}

let acc = 0;
acc += countDuplicatesByName(users);
acc += buildReport(users).length;
acc += reserialize(users);
console.log(acc);
