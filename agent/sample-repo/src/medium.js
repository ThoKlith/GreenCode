export function joinNames(users) {
  let s = "";
  for (let i = 0; i < users.length; i++) { s += users[i].name + ","; }
  return s;
}
