const { MongoClient } = require('mongodb');
const { mongo: mongoConfig } = require('../helpers/config');

class Database {
  constructor(url, db_name) {
    this.db_name = db_name;
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

        this.db = client.db(this.db_name);
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

async function setupDB(connectString, db_name) {
  database = new Database(connectString, db_name);
  await database.connect();
}

module.exports = {
  setupDB,
  getDB
};
