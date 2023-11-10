"use strict";
const {
  db: { host, port, name },
} = require("../configs/config.mongdb");

const connectString = `mongodb://${host}:${port}/${name}`;
const { default: mongoose } = require("mongoose");
const { countConnect, checkOverLoad } = require("../helpers/check.connect");
class Database {
  constructor() {
    this.connect();
  }
  //connect
  connect(type = "mongodb") {
    if (1 === 1) {
      mongoose.set("debug", true);
      mongoose.set("debug", { color: true });
    }

    mongoose
      .connect(connectString, { maxPoolSize: 50 })
      .then((_) => {
        countConnect();
        console.log("connected mongodb success", connectString);
        // checkOverLoad();
      })
      .catch((err) => console.log("error connect"));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb;
