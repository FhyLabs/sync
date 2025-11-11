import { SyncElement } from "./SyncElement.js";
import { pluginManager } from "./PluginManager.js";

export class SyncManager {
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
