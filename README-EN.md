[ID](README.md)

# Sync

**Sync** is a lightweight JavaScript-based synchronization library that automatically updates HTML elements from various data sources — such as **Local JSON**, **API**, or **WebSocket** — using various modes: `polling`, `sse`, `websocket`, `event`, `local`, and `auto`.

---

## Struktur Proyek

```
sync/
├─ package.json
├─ rollup.config.js
├─ README.md
├─ LICENSE
├─ src/
│  ├─ index.js
│  ├─ core/
│  │  ├─ SyncManager.js
│  │  ├─ SyncElement.js
│  │  ├─ Connection.js
│  │  └─ PluginManager.js
│  ├─ utils/
│  │  ├─ fetchData.js
│  │  ├─ render.js
│  │  ├─ helpers.js
│  │  └─ diff.js
│  └─ plugins/
│     ├─ logger.js
│     └─ cachePlugin.js
└─ dist/
   ├─ sync.js
   └─ sync.min.js
```

---

## Key Features

* Real-time updates
* Plugin system
* Automatic formatting
* Full URL support
* Lightweight and fast
* Multi-mode synchronization

---

## API Reference

### Global API

| Method | Description |
| ---------------------------- | ------------------------------------------------------- |
| `SyncLib.start(selector?)` | Starts synchronization for elements with `sync="true"`. |
| `SyncLib.stop()` | Stops all active synchronization processes. |
| `SyncLib.on(event, handler)` | Adds a global event listener. |
| `SyncLib.use(plugin)` | Registers a custom plugin. |

### Plugin Hooks

| Hook | Triggered When |
| ------------------- | ------------------------------------------ |
| `sync:onload` | The element is first initialized. |
| `sync:beforeUpdate` | Before new data is rendered. |
| `sync:afterUpdate` | After the data has been successfully updated. |
| `sync:error` | An error occurred during fetching or rendering. |
| `sync:connect` | The real-time connection was successfully established. |
| `sync:disconnect` | The real-time connection was lost. |

---

## Usage

### Add Script Library

```html
<script src="https://cdn.jsdelivr.net/gh/FhyLabs/sync@v1.0.0/dist/sync.min.js"></script>
```

This library will automatically process all elements that have the `sync="true"` attribute.

---

### Mode: Polling (Local / API)

```html
<!-- Local JSON -->
<div sync="true"
  data-endpoint="./local-data.json"
  data-format="json"
  data-interval="3000"
  data-mode="polling">
  <h2>Local JSON (Polling)</h2>
  <pre>Loading...</pre>
</div>

<!-- API JSON -->
<div sync="true"
  data-endpoint="https://api.example.com/data"
  data-format="json"
  data-interval="3000"
  data-mode="polling">
  <h2>API JSON (Polling)</h2>
  <pre>Loading...</pre>
</div>

<script src="https://cdn.jsdelivr.net/gh/FhyLabs/sync@v1.0.0/dist/sync.min.js"></script>
<script>
  SyncLib.on("sync:afterUpdate", ({ element, data }) => {
    element.querySelector("pre").textContent = JSON.stringify(data, null, 2);
  });
</script>
```

---

### Mode: SSE (Server-Sent Events)

```html
<div sync="true"
  data-endpoint="http://localhost:3000/sse"
  data-format="json"
  data-mode="sse">
  <h2>SSE Mode</h2>
  <pre>Connecting...</pre>
</div>

<script src="https://cdn.jsdelivr.net/gh/FhyLabs/sync@v1.0.0/dist/sync.min.js"></script>
<script>
  SyncLib.on("sync:connect", ({ element }) => {
    element.querySelector("pre").textContent = "Connected via SSE";
  });

  SyncLib.on("sync:afterUpdate", ({ element, data }) => {
    element.querySelector("pre").textContent = JSON.stringify(data, null, 2);
  });
</script>
```

---

### Mode: WebSocket

```html
<div sync="true"
  data-endpoint="ws://localhost:3000/ws"
  data-format="json"
  data-mode="websocket">
  <h2>WebSocket Mode</h2>
  <pre>Connecting...</pre>
</div>

<script src="https://cdn.jsdelivr.net/gh/FhyLabs/sync@v1.0.0/dist/sync.min.js"></script>
<script>
  SyncLib.on("sync:connect", ({ element }) => {
    element.querySelector("pre").textContent = "WebSocket Connected";
  });

  SyncLib.on("sync:afterUpdate", ({ element, data }) => {
    element.querySelector("pre").textContent = JSON.stringify(data, null, 2);
  });
</script>
```

---

### Mode: Event (Manual Trigger)

```html
<div id="manual-box" sync="true"
  data-endpoint="./example-api.json"
  data-format="json"
  data-mode="event">
  <h2>Manual Trigger (Event)</h2>
  <button id="reloadBtn">Reload</button>
  <pre>Waiting...</pre>
</div>

<script src="https://cdn.jsdelivr.net/gh/FhyLabs/sync@v1.0.0/dist/sync.min.js"></script>
<script>
  const manualEl = document.getElementById("manual-box");
  const btn = document.getElementById("reloadBtn");

  btn.addEventListener("click", () => {
    manualEl.dispatchEvent(new Event("sync:trigger"));
  });

  SyncLib.on("sync:afterUpdate", ({ element, data }) => {
    element.querySelector("pre").textContent = JSON.stringify(data, null, 2);
  });
</script>
```

---

### Mode: Local (Load Once)

```html
<div sync="true"
  data-endpoint="./local-data.json"
  data-format="json"
  data-mode="local">
  <h2>Local JSON (Load Once)</h2>
  <pre>Loading...</pre>
</div>

<script src="https://cdn.jsdelivr.net/gh/FhyLabs/sync@v1.0.0/dist/sync.min.js"></script>
<script>
  SyncLib.on("sync:afterUpdate", ({ element, data }) => {
    element.querySelector("pre").textContent = JSON.stringify(data, null, 2);
  });
</script>
```

---

### Mode: Auto

```html
<div sync="true"
  data-endpoint="./example-api.json"
  data-format="json"
  data-mode="auto">
  <h2>Auto Mode</h2>
  <pre>Detecting...</pre>
</div>

<script src="https://cdn.jsdelivr.net/gh/FhyLabs/sync@v1.0.0/dist/sync.min.js"></script>
<script>
  SyncLib.on("sync:connect", ({ element, mode }) => {
    element.querySelector("pre").textContent = `Connected via ${mode}`;
  });

  SyncLib.on("sync:afterUpdate", ({ element, data }) => {
    element.querySelector("pre").textContent = JSON.stringify(data, null, 2);
  });
</script>
```

---

### Global Event Listener (Optional)

```html
<script>
  document.addEventListener("DOMContentLoaded", () => {
    SyncLib.on("sync:error", ({ element, error }) => {
      const pre = element.querySelector("pre");
      pre.textContent = "❌ " + (error?.message || error);
    });

    SyncLib.on("sync:disconnect", ({ element }) => {
      const pre = element.querySelector("pre");
      pre.textContent = "⚠️ Disconnected";
    });
  });
</script>
```

---

## Example of Creating a Plugin

```js
const LoggerPlugin = {
  "sync:afterUpdate"({ element, data }) {
    console.log("Updated element:", element, "Data:", data);
  },
  "sync:error"({ element, error }) {
    console.warn("Sync error:", error.message);
  }
};

SyncLib.use(LoggerPlugin);
```

This plugin will automatically display a log every time an element is updated or an error occurs.

---

## Debugging

Displays all active instances:

```js
console.log(SyncLib._manager.instances);
```

Stop all syncing:

```js
SyncLib.stop();
```