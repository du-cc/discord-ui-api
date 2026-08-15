const Base = require('./Base');

class User extends Base {
  constructor(client, data) {
    super(client);
    this.id = data.id;
    this._patch(data);
  }

  _patch(data) {
    if ('username' in data) this.username = data.username;
    if ('avatarUrl' in data) this.avatarUrl = data.avatarUrl;
    return this;
  }

  toString() {
    return this.username;
  }
}

module.exports = User;