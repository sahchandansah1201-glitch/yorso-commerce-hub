import { assertSupabaseIsPrototypeOnly, loadApiConfig } from "./config.js";
import { createApiServer } from "./server.js";

const config = loadApiConfig();
assertSupabaseIsPrototypeOnly(config);

const server = createApiServer(config);

server.listen(config.port, config.host, () => {
  console.log(`YORSO API listening on http://${config.host}:${config.port}`);
});

const shutdown = (signal: NodeJS.Signals) => {
  console.log(`YORSO API received ${signal}, shutting down.`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
