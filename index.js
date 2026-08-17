const discordUI = require("./src/index");
(async () => {
  await discordUI.Messages.send("hi");
  await discordUI.Messages.send("/deposit", { amount: 1 });
  discordUI.Messages.onMessage((message) => {
    console.log("new message", message);
  });
  discordUI.Messages.onMessageEdit((message) => {
    console.log("update!", message);
  });
})();
discordUI.Messages.stopListening();
