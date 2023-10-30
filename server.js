const { notify } = require("./src/app");
const app = require("./src/app");

const PORT = 2000;

const server = app.listen(PORT, () => {
  console.log(`WSV ecommmer start with 2000 ${PORT}`);
});

process.on("SIGINT", () => {
  server.close(() => console.log("Exit Server Express"));
  //   notify.send(ping...)
});
