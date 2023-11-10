const { default: mongoose } = require("mongoose");
const os = require("os");

const _SECOND = 5000;

// count Connect
const countConnect = () => {
  const numConnection = mongoose.connections.length;

  return console.log(`Number of connects: $${numConnection}`);
};

// check over load

const checkOverLoad = () => {
  setInterval(() => {
    const numConnection = mongoose.connections.length;
    const numCores = os.cpus().length;
    const memoryUsage = process.memoryUsage().rss;
    const maxConnections = numCores * 5;

    console.log(`active connections ${numConnection}`);
    console.log(`memory usage: ${memoryUsage / 1024 / 1024} MB`);

    if (numConnection > maxConnections) {
      console.log("connection oeverload detected");
    }
  }, _SECOND);
};

module.exports = { countConnect, checkOverLoad };
