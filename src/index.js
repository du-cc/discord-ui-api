const store = require('./utils/store');

const discordUI = {
  // fetching
  Messages: require("./managers/MessageManager"),

  // store access
  getMessage: store.get,
  getAllMessages: store.all,
  clearStore: store.clear,

};

if (typeof window !== 'undefined') {
  window.discordUI = discordUI;
}

module.exports = discordUI;