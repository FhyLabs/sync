export function renderData(el, data, renderFnName, { diff = false } = {}) {
  if (renderFnName && typeof window[renderFnName] === "function") {
    const html = window[renderFnName](data);
    if (diff) {
      if (el.__lastHTML !== html) {
        el.innerHTML = html;
        el.__lastHTML = html;
      }
    } else {
      el.innerHTML = html;
      el.__lastHTML = html;
    }
  } else {
    if (typeof data === "object") {
      const html = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
      if (diff) {
        if (el.__lastHTML !== html) {
          el.innerHTML = html;
          el.__lastHTML = html;
        }
      } else {
        el.innerHTML = html;
        el.__lastHTML = html;
      }
    } else {
      el.textContent = data;
    }
  }
}
