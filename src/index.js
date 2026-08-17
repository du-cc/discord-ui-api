const store = require('./utils/store');

const discordUI = {
  Messages: require("./managers/MessageManager"),
  Store: require("./utils/store")

};

if (typeof window !== 'undefined') {
  window.discordUI = discordUI;
}

module.exports = discordUI;