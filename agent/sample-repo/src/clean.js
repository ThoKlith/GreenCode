export function sumIds(users) {
  let t = 0;
  for (const u of users) t += u.id;
  return t;
}
export const byId = new Map();
export function index(users) { for (const u of users) byId.set(u.id, u); }
