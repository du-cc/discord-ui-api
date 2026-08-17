const discordUI = require("./src/index");
(async () => {
  await discordUI.Messages.send("hi");
  await discordUI.Messages.send("/deposit", { amount: 1 });
  discordUI.Messages.onMessage((message) => {
    console.log("new message", message);
    setTimeout(() => {
      const fresh = discordUI.Messages.fetch(message.id, true);
      console.log("fresh embed element:", fresh.embeds[0]?.element);
    }, 1000);
  });
})();
discordUI.Messages.stopListening();
