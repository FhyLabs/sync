import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";

const app = express();
const PORT = 3000;
const __dirname = process.cwd();

app.use(cors());
app.use(express.static(__dirname));

app.get("/local-data.json", (req, res) => {
  try {
    const file = path.join(__dirname, "local-data.json");
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);

    data.timestamp = new Date().toISOString();
    res.json(data);
  } catch (e) {
    console.error("❌ Error local-data:", e.message);
    res.status(500).json({ error: "Failed to load local-data.json" });
  }
});

app.get("/example-api.json", (req, res) => {
  try {
    const file = path.join(__dirname, "example-api.json");
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);

    data.timestamp = new Date().toISOString();
    data.random = Math.floor(Math.random() * 1000);

    res.json(data);
  } catch (e) {
    console.error("❌ Error example-api:", e.message);
    res.status(500).json({ error: "Failed to load example-api.json" });
  }
});

app.get("/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = () => {
    const payload = JSON.stringify({
      message: "Hello from SSE 👋",
      time: new Date().toISOString(),
      random: Math.floor(Math.random() * 9999)
    });
    res.write(`data: ${payload}\n\n`);
  };

  sendEvent();
  const interval = setInterval(sendEvent, 2000);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});

const wss = new WebSocketServer({ noServer: true });
const activeClients = new Set();

wss.on("connection", (ws) => {
  activeClients.add(ws);
  console.log("⚡ WebSocket connected (clients:", activeClients.size, ")");

  const sendRandom = () => {
    const msg = JSON.stringify({
      message: "Ping from WebSocket 💬",
      time: new Date().toISOString(),
      random: Math.floor(Math.random() * 9999)
    });
    ws.send(msg);
  };

  const interval = setInterval(sendRandom, 3000);

  ws.on("close", () => {
    activeClients.delete(ws);
    clearInterval(interval);
    console.log("❌ WebSocket disconnected (clients:", activeClients.size, ")");
  });
});

const server = app.listen(PORT, () => {
  console.log(`✅ API Server running at: http://localhost:${PORT}`);
  console.log(`📄 Open in browser: http://localhost:${PORT}/index.html`);
});

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});
