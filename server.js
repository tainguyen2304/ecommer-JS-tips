const app = require("./src/app");

const {
  app: { port },
} = require("./src/configs/config.mongdb");

const server = app.listen(port, () => {
  console.log(`WSV ecommmer start with ${port}`);
});

process.on("SIGINT", () => {
  server.close(() => console.log("Exit Server Express"));
  //   notify.send(ping...)
});
