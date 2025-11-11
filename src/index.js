import { SyncManager } from "./core/SyncManager.js";
import { pluginManager } from "./core/PluginManager.js";

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
export default SyncLib;
