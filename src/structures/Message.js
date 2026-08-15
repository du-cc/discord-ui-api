/**
 * Represents a single Discord message.
 *
 * Data format:
 * {
 *   id, channelId, content,
 *   author: { username, avatar, id },
 *   createdTimestamp, editedTimestamp,
 *   embeds, element,
 *   reply: { message_id, author: { username, avatar, id }, content } | null
 * }
 */
class Message {
  constructor(data) {
    this.id = data.id;
    this.channelId = data.channelId;
    this._patch(data);
  }

  _patch(data) {
    if ('content' in data) this.content = data.content;
    if ('author' in data) this.author = data.author;
    if ('embeds' in data) this.embeds = data.embeds;
    if ('element' in data) this.element = data.element;
    if ('reply' in data) this.reply = data.reply;
    if ('createdTimestamp' in data) this.createdTimestamp = data.createdTimestamp;
    if ('editedTimestamp' in data) this.editedTimestamp = data.editedTimestamp;
    return this;
  }

  get isReply() {
    return Boolean(this.reply);
  }

  get isEdited() {
    return Boolean(this.editedTimestamp);
  }

  toString() {
    return this.content ?? '';
  }
}

module.exports = Message;