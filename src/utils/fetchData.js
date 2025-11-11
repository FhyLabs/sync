export async function fetchData(url, opts = {}) {
  try {
    const res = await fetch(url, { mode: "cors", ...opts });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("application/json")) return await res.json();
    return await res.text();
  } catch (err) {
    throw err;
  }
}
