var SyncLib = (function () {
  'use strict';

  const isFullUrl = (url) => /^https?:\/\//i.test(url);
  const resolveUrl = (base, endpoint) => {
    try {
      if (isFullUrl(endpoint)) return endpoint;
      return new URL(endpoint, base).toString();
    } catch (err) {
      return endpoint;
    }
  };

  async function fetchData(url, opts = {}) {
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

  function renderData(el, data, renderFnName, { diff = false } = {}) {
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

  class PluginManager {
    constructor() {
      this.plugins = [];
      this.hooks = {};
    }

    use(plugin) {
      if (!plugin) return;
      this.plugins.push(plugin);
      const knownHooks = ["sync:onload","sync:beforeUpdate","sync:afterUpdate","sync:error","sync:connect","sync:disconnect"];
      for (const h of knownHooks) {
        if (typeof plugin[h] === "function") {
          this.hooks[h] = this.hooks[h] || [];
          this.hooks[h].push(plugin[h].bind(plugin));
        }
      }
    }

    on(hook, fn) {
      this.hooks[hook] = this.hooks[hook] || [];
      this.hooks[hook].push(fn);
    }

    trigger(hook, payload) {
      (this.hooks[hook] || []).forEach(fn => {
        try { fn(payload); } catch (err) { console.error(`[SyncLib Plugin Error][${hook}]`, err); }
      });
    }
  }

  const pluginManager = new PluginManager();

  class SyncElement {
    constructor(el) {
      this.el = el;
      this.rawEndpoint = el.dataset.endpoint;
      this.endpoint = resolveUrl(window.location.origin, this.rawEndpoint);
      this.format = (el.dataset.format || "auto").toLowerCase();
      this.renderFn = el.dataset.render || null;
      this.interval = parseInt(el.dataset.interval || "5000", 10);
      this.mode = (el.dataset.mode || "auto").toLowerCase();
      this.diff = el.dataset.diff === "true";
      this.cache = el.dataset.cache === "true";
      this.started = false;
      this.connection = null;
      this.timer = null;

      this.init();
    }

    async init() {
      pluginManager.trigger("sync:onload", { element: this.el, endpoint: this.endpoint });
      this.start();
    }

    async start() {
      if (this.started) return;
      this.started = true;

      if (this.mode === "auto") {
        if (this.endpoint.startsWith("ws")) this.mode = "websocket";
        else if (this.endpoint.endsWith(".json")) this.mode = "polling";
        else if (this.endpoint.includes("/stream")) this.mode = "sse";
        else this.mode = "polling";
      }

      pluginManager.trigger("sync:connect", { element: this.el, mode: this.mode });

      switch (this.mode) {
        case "polling": this.startPolling(); break;
        case "sse": this.startSSE(); break;
        case "websocket": this.startWebSocket(); break;
        case "event": this.startEvent(); break;
        case "local": this.loadOnce(); break;
        default: console.warn("Unknown sync mode:", this.mode);
      }
    }

    async startPolling() {
      const fetchAndRender = async () => {
        pluginManager.trigger("sync:beforeUpdate", { element: this.el, endpoint: this.endpoint });
        try {
          const data = await fetchData(this.endpoint);
          this._onData(data);
        } catch (err) {
          this._onError(err);
        }
      };
      await fetchAndRender();
      this.timer = setInterval(fetchAndRender, this.interval);
    }

    startSSE() {
      try {
        const evt = new EventSource(this.endpoint);
        evt.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            this._onData(data);
          } catch {
            this._onData(e.data);
          }
        };
        evt.onerror = (err) => this._onError(err);
        this.connection = evt;
      } catch (err) {
        this._onError(err);
      }
    }

    startWebSocket() {
      try {
        const ws = new WebSocket(this.endpoint);
        ws.onopen = () => pluginManager.trigger("sync:connect", { element: this.el, mode: "websocket" });
        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            this._onData(data);
          } catch {
            this._onData(msg.data);
          }
        };
        ws.onerror = (err) => this._onError(err);
        ws.onclose = () => pluginManager.trigger("sync:disconnect", { element: this.el });
        this.connection = ws;
      } catch (err) {
        this._onError(err);
      }
    }

    startEvent() {
      // manual trigger mode
      this.el.addEventListener("sync:trigger", async () => {
        pluginManager.trigger("sync:beforeUpdate", { element: this.el, endpoint: this.endpoint });
        try {
          const data = await fetchData(this.endpoint);
          this._onData(data);
        } catch (err) {
          this._onError(err);
        }
      });
    }

    async loadOnce() {
      try {
        const data = await fetchData(this.endpoint);
        this._onData(data);
      } catch (err) {
        this._onError(err);
      }
    }

    _onData(payload) {
      try {
        pluginManager.trigger("sync:beforeUpdate", { element: this.el, data: payload });
        renderData(this.el, payload, this.renderFn, { diff: this.diff });
        pluginManager.trigger("sync:afterUpdate", { element: this.el, data: payload });
      } catch (err) {
        this._onError(err);
      }
    }

    _onError(err) {
      pluginManager.trigger("sync:error", { element: this.el, error: err });
    }

    stop() {
      if (this.timer) clearInterval(this.timer);
      if (this.connection) {
        if (this.mode === "sse") this.connection.close();
        if (this.mode === "websocket") this.connection.close();
      }
      this.started = false;
      pluginManager.trigger("sync:disconnect", { element: this.el, endpoint: this.endpoint });
    }
  }

  class SyncManager {
    constructor() {
      this.instances = [];
      this.selector = '[sync="true"]';
    }

    start(selector = null) {
      const sel = selector || this.selector;
      document.querySelectorAll(sel).forEach(el => {
        if (el.__syncInstance) return;
        const inst = new SyncElement(el);
        el.__syncInstance = inst;
        this.instances.push(inst);
      });
      pluginManager.trigger("sync:manager:start", { count: this.instances.length });
      return this.instances;
    }

    stop() {
      this.instances.forEach(i => i.stop());
      this.instances = [];
      pluginManager.trigger("sync:manager:stop", {});
    }
  }

  // Single global manager instance
  const manager = new SyncManager();

  const SyncLib = {
    start: (selector) => manager.start(selector),
    stop: () => manager.stop(),
    on: (event, handler) => pluginManager.on(event, handler),
    use: (plugin) => pluginManager.use(plugin),
    _manager: manager,
  };

  window.SyncLib = SyncLib;
  document.addEventListener("DOMContentLoaded", () => SyncLib.start());

  return SyncLib;

})();
//# sourceMappingURL=sync.js.map
