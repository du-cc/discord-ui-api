const store = require('./store');
const { fetchMessages, fetchMessage, getLatestMessage } = require('./messages');

const discordUI = {
  // fetching
  fetchMessages,
  fetchMessage,
  getLatestMessage,

  // store access
  getMessage: store.get,
  getAllMessages: store.all,
  clearStore: store.clear,

};

if (typeof window !== 'undefined') {
  window.discordUI = discordUI;
}

module.exports = discordUI;