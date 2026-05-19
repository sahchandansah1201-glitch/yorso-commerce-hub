import { assertSelfHostedProductionRuntime, loadApiConfig } from "./config.js";
import { ApiLifecycle, shutdownApiServer } from "./lifecycle.js";
import { createApiServer } from "./server.js";

const config = loadApiConfig();
assertSelfHostedProductionRuntime(config);

const lifecycle = new ApiLifecycle();
const server = createApiServer(config, { lifecycle });

server.listen(config.port, config.host, () => {
  console.log(`YORSO API listening on http://${config.host}:${config.port}`);
});

let shutdownStarted = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (shutdownStarted) return;
  shutdownStarted = true;

  void shutdownApiServer({
    server,
    lifecycle,
    signal,
    drainDelayMs: config.shutdownDrainDelayMs,
    graceTimeoutMs: config.shutdownGraceTimeoutMs,
  }).then(
    (result) => {
      process.exit(result.forced ? 1 : 0);
    },
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
