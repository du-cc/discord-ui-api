const BaseManager = require('./BaseManager');
const User = require('../structures/User');
const extractUser = require('../extractors/UserExtractor');

class UserManager extends BaseManager {
  constructor(client) {
    super(client, User);
    this.elements = new Map();
    this.observers = new Map();
  }

  add(el) {
    const data = extractUser(el);
    if (!data.id) return null;

    const user = this._upsert(data);
    this.elements.set(data.id, el);
    return user;
  }

  addFromPartial(id, data) {
    if (!id) return null;
    return this._upsert({ id, ...data });
  }

  _upsert(data) {
    let user = this.cache.get(data.id);
    if (user) {
      user._patch(data);
    } else {
      user = new User(this.client, data);
      this.cache.set(data.id, user);
    }
    return user;
  }

  scanExisting() {
    const nodes = document.querySelectorAll('[class*="member"][class*="listItem"]'); // adjust selector once confirmed against real DOM
    for (const el of nodes) this.add(el);
    return this.cache;
  }
}

module.exports = UserManager;