const express = require("express");
const app = express();
const { server: serverOptions, mongo: mongoConfig } = require("./helpers/config");
const { setupDB } = require("./setup/db");
const { setupRoutes } = require("./setup/routes");

async function init() {
  await setupDB(mongoConfig.connection_string, mongoConfig.dbName);
  setupRoutes(app);
  app.listen(serverOptions.port, () => {
    console.log(`Server is running on localhost:${serverOptions.port}`)
  });
}

init().catch((reason) => {
  console.error(reason);
});
