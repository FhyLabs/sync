import { pluginManager } from "./PluginManager.js";

export class Connection {
  constructor({ endpoint, mode = "auto", format = "json", ondata = () => {}, onerror = () => {} }) {
    this.endpoint = endpoint;
    this.mode = mode; // 'auto'|'sse'|'ws'|'polling'
    this.format = format;
    this.ondata = ondata;
    this.onerror = onerror;

    this.socket = null;
    this.source = null;
    this.pollTimer = null;

    this.reconnectAttempts = 0;
    this.maxReconnect = 10;
  }

  detectMode() {
    if (this.mode !== "auto") return this.mode;
    if (typeof EventSource !== "undefined") return "sse";
    if (typeof WebSocket !== "undefined") return "ws";
    return "polling";
  }

  async start() {
    this.selected = this.detectMode();
    pluginManager.trigger("sync:connect", { endpoint: this.endpoint, mode: this.selected });
    if (this.selected === "sse") return this.startSSE();
    if (this.selected === "ws") return this.startWS();
    return this.startPolling();
  }

  stop() {
    if (this.source) { try { this.source.close(); } catch(_){}; this.source = null; }
    if (this.socket) { try { this.socket.close(); } catch(_){}; this.socket = null; }
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    pluginManager.trigger("sync:disconnect", { endpoint: this.endpoint });
  }

  startSSE() {
    try {
      this.source = new EventSource(this.endpoint);
      this.source.onmessage = e => this._handle(e.data);
      this.source.onerror = e => this._handleError(e);
    } catch (err) {
      this._handleError(err);
      this.startPolling();
    }
  }

  startWS() {
    try {
      this.socket = new WebSocket(this.endpoint.replace(/^http/, 'ws'));
      this.socket.onmessage = e => this._handle(e.data);
      this.socket.onclose = () => this._reconnect();
      this.socket.onerror = (e) => this._handleError(e);
    } catch (err) {
      this._handleError(err);
      this.startPolling();
    }
  }

  startPolling(interval = 3000) {
    this.pollTimer = setInterval(async () => {
      try {
        await this.ondata();
      } catch (err) {
        this._handleError(err);
      }
    }, interval);
    this.ondata().catch(err => this._handleError(err));
  }

  _handle(raw) {
    try {
      const parsed = this.format === "json" ? JSON.parse(raw) : raw;
      this.reconnectAttempts = 0;
      this.ondata(parsed);
    } catch (err) {
      if (typeof raw === "object") {
        this.ondata(raw);
      } else {
        this._handleError(err);
      }
    }
  }

  _handleError(err) {
    pluginManager.trigger("sync:error", { endpoint: this.endpoint, error: err });
    this.onerror(err);
    this._reconnect();
  }

  _reconnect() {
    if (this.reconnectAttempts >= this.maxReconnect) return;
    this.reconnectAttempts++;
    const backoff = Math.min(30000, 500 * (2 ** this.reconnectAttempts));
    setTimeout(() => {
      try { this.start(); } catch (e) { console.error("Reconnect failed", e); }
    }, backoff);
  }
}
