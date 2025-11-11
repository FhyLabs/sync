export default {
  "sync:onload"(ctx) { console.log("Sync onload:", ctx); },
  "sync:beforeUpdate"(ctx) { console.log("Sync beforeUpdate:", ctx); },
  "sync:afterUpdate"(ctx) { console.log("Sync afterUpdate:", ctx); },
  "sync:error"(ctx) { console.error("Sync error:", ctx); },
  "sync:connect"(ctx) { console.log("Connection open:", ctx); },
  "sync:disconnect"(ctx) { console.log("Connection closed:", ctx); }
};
