import { resolveUrl } from "../utils/helpers.js";
import { fetchData } from "../utils/fetchData.js";
import { renderData } from "../utils/render.js";
import { pluginManager } from "./PluginManager.js";

export class SyncElement {
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
