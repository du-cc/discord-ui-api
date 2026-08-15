const Base = require("./Base");

class Message extends Base {
  constructor(client, element, channel) {
    super(client);

    /**
     * DOM element of the message element.
     * @type {Element}
     */
    this.element = element;

    // TODO: TO BE IMPLEMENTED
    /**
     * The channel that the message was sent in
     * @type {TextChannel|DMChannel}
     */
    this.channel = channel;

    /**
     * Whether this message has been deleted
     * @type {boolean}
     */
    this.deleted = false;

    this._patch(el);
  }

  // re-reads whatever is currently in the DOM node
  _patch(el) {
    this.id = el.id?.replace("chat-messages-", "") ?? null;

    const contentEl = document.querySelector('[class*="messageContent"]');
    if (contentEl) this.content = contentEl.textContent;

    const authorEl = el.querySelector('[class*="username"]');
    if (authorEl) this.author = authorEl.textContent;

    const timeEl = el.querySelector("time");
    if (timeEl) this.timestamp = timeEl.dateTime;

    const editedEl = el.querySelector('[class*="edited"]');
    this.edited = !!editedEl;

    return this;
  }

  refresh() {
    this._patch(this.el);
    return this;
  }

  toString() {
    return this.content;
  }
}

module.exports = Message;
