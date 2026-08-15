const Base = require('./Base');

class Message extends Base {
  constructor(client, data) {
    super(client);
    this.id = data.id;
    this.channelId = data.channelId;
    this._patch(data);
  }

  _patch(data) {
    if ('content' in data) this.content = data.content;
    if ('authorId' in data) this.authorId = data.authorId;
    if ('createdTimestamp' in data) this.createdTimestamp = data.createdTimestamp;
    if ('editedTimestamp' in data) this.editedTimestamp = data.editedTimestamp;
    return this;
  }

  get author() {
    return this.client.users.cache.get(this.authorId);
  }

  toString() {
    return this.content;
  }
}

module.exports = Message;