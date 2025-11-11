export function shallowEqual(a, b) {
  if (!a || !b) return false;
  const k1 = Object.keys(a), k2 = Object.keys(b);
  if (k1.length !== k2.length) return false;
  return k1.every(k => a[k] === b[k]);
}
