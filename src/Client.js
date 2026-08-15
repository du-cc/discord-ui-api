const MessageManager = require('./managers/MessageManager');
const UserManager = require('./managers/UserManager');

class Client {
  constructor() {
    this.listeners = new Map(); // tiny custom emitter, from earlier
    this.users = new UserManager(this);
    this.messages = new MessageManager(this);
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
    return this;
  }

  emit(event, ...args) {
    (this.listeners.get(event) ?? []).forEach(fn => fn(...args));
  }

  init() {
    this.users.scanExisting?.(); // optional chaining in case UserManager has no scanExisting yet
    this.messages.scanExisting();
  }
}

module.exports = Client;