const { extractMessage } = require("../util/extractor");
const store = require("../util/store");
const Message = require("../structures/Message");

/**
 * Extracts and upserts a message into the store.
 */
function processElement(el, previousAuthor) {
  const data = extractMessage(el);
  if (!data?.id) return null;

  if (!data.author?.id && previousAuthor?.id) {
    data.author = { ...previousAuthor };
  }
  return store.upsert(data);
}

/**
 * @public
 * Fetches every message currently rendered in the DOM and upserts each
 * into the store.
 *
 * @returns {Array<Message>} - An array of Message
 */
function fetchMessages() {
  const nodes = document.querySelectorAll('[id^="chat-messages-"][class^="messageListItem"');
  const results = [];

  for (const el of nodes) {
    // case for continuous message
    console.log(el);
    const previousAuthor = results.findLast((m) => m.author?.id)?.author;

    const message = processElement(el, previousAuthor);
    if (message) results.push(message);
  }

  return results;
}

/**
 * @public
 * Refetch a message by id. Returns the latest version of the Message or null if the message isn't rendered (out of view)
 *
 * @param {String|Number} id - Message id
 * @param {Boolean} [fresh=false] - True = Fetch from DOM, False = Fetch from cache
 *
 * @returns {Message}
 */
function fetchMessage(id, fresh = false) {
  if (!fresh) {
    return store.get(id) ?? null;
  }

  id = String(id);

  // <li id="chat-messages-<channelId>-<id>">
  const el = document.querySelector(`[id$="-${id}"][id^="chat-messages-"]`);
  if (!el) {
    console.warn(
      `[discord-dom-reader] Could not find message ${id} in the DOM (not rendered / scrolled away?)`,
    );
    return null;
  }

  const previousAuthor = store.get(id)?.author;
  return processElement(el, previousAuthor);
}

/**
 * @public
 * Returns the most recently created message currently in the store.
 *
 * @returns {Message}
 */
function getLatestMessage() {
  const messages = store.all();
  if (!messages.length) return null;

  return messages.reduce((latest, msg) => {
    if (!msg.createdTimestamp) return latest;
    if (!latest) return msg;
    return new Date(msg.createdTimestamp) > new Date(latest.createdTimestamp)
      ? msg
      : latest;
  }, null);
}

module.exports = { fetchMessages, fetchMessage, getLatestMessage };
