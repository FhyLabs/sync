export class PluginManager {
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

export const pluginManager = new PluginManager();
