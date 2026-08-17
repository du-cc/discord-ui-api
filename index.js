const s = require("./src/index");
console.log(s.Messages.fetch());
(async () => {
  await s.Messages.send("hi");
  await s.Messages.send("/help");
  s.Messages.onMessage((message) => {
    console.log("new message", message);
  });
})();
