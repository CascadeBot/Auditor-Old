const { MongoClient } = require('mongodb');
const { mongo: mongoConfig } = require('../helpers/config');

class Database {
  constructor(url, dbName) {
    this.dbname = dbName;
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

        this.db = client.db(this.dbName);
        this.users = this.db.collection(mongoConfig.collections.users);
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

async function setupDB(connectString, dbName) {
  database = new Database(connectString, dbName);
  await database.connect();
}

module.exports = {
  setupDB,
  getDB
};
