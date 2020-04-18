const { MongoClient } = require('mongodb');
const { mongo: mongoConfig } = require('../helpers/config');

class Database {
  constructor(url) {
    this.rootClient = new MongoClient(url, {
      useUnifiedTopology: true
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.rootClient.connect((err, client) => {
        this.client = client;
        if (err) return reject("Failed to connect to Mongodb");
        console.log("Connected successfully to server");

        // TODO db name not in config anymore
        this.db = client.db(mongoConfig.db_name);
        this.users = this.db.collection(mongoConfig.collections.users);
        this.sessions = this.db.collection(mongoConfig.collections.sessions);
        this.guilds = this.db.collection(mongoConfig.collections.guilds);
        this.patrons = this.db.collection(mongoConfig.collections.patrons);

        resolve(this);
      });
    })
  }
}

let database;

function getDB() {
  return database;
}

async function setupDB() {
  database = new Database(mongoConfig.connection_string);
  await database.connect();
}

module.exports = {
  setupDB,
  getDB
};
