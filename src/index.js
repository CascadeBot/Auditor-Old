const express = require("express");
const app = express();
const { server: serverOptions, mongo: mongoConfig, discord: discordConfig } = require("./helpers/config");
const { setupDB } = require("./setup/db");
const { setupRoutes } = require("./setup/routes");
const { setupDiscord } = require("./setup/discord");

async function init() {
  await setupDB(mongoConfig.connection_string, mongoConfig.db_name);
  setupRoutes(app);

  setupDiscord();

  app.listen(serverOptions.port, () => {
    console.log(`Server is running on localhost:${serverOptions.port}`)
  });
}

init().catch((reason) => {
  console.error(reason);
});
