const BaseManager = require("./BaseManager");
const Message = require("../structures/Message");
const extractMessage = require("../extractors/MessageExtractor");

class MessageManager extends BaseManager {
  constructor(client) {
    super(client, Message);
    this.elements = new Map();
    this.observers = new Map();
  }

  add(el) {
    const data = extractMessage(el);
    if (!data.id) return null;

    // edge case: if continuous message
    if (!data.authorId) {
    const messages = [...this.cache.values()];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].authorId) {
        data.authorId = messages[i].authorId;
        const fallbackUser = this.client.users.cache.get(data.authorId);
        data.authorUsername = fallbackUser?.username ?? null;
        data.authorAvatarUrl = fallbackUser?.avatarUrl ?? null;
        break;
      }
    }
  }

    if (data.authorId) {
      this.client.users.addFromPartial(data.authorId, {
        username: data.authorUsername,
        avatarUrl: data.authorAvatarUrl,
      });
    }

    let message = this.cache.get(data.id);
    if (message) {
      message._patch(data);
    } else {
      message = new Message(this.client, data);
      this.cache.set(data.id, message);
    }

    this.elements.set(data.id, el);
    return message;
  }

  scanExisting() {
    const nodes = document.querySelectorAll('[id^="chat-messages-"]');
    for (const el of nodes) {
      const message = this.add(el);
      if (message) this._observe(message.id, el);
    }
    return this.cache;
  }

  _observe(id, el) {
    if (this.observers.has(id)) return;
    const observer = new MutationObserver(() => {
      this.add(el);
      this.client.emit("messageUpdate", this.cache.get(id));
    });
    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.observers.set(id, observer);
  }

  remove(id) {
    this.observers.get(id)?.disconnect();
    this.observers.delete(id);
    this.elements.delete(id);
    super.remove(id);
  }
}

module.exports = MessageManager;
