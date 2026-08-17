const { extractMessage } = require("../utils/extractor");
const store = require("../utils/store");
const util = require("../utils/util");

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
 * No parameters:
 * Fetches every message currently rendered in the DOM and upserts each
 * into the store.
 * @returns {Array<Message>} - Array of Messages
 *
 * Fetches a message by id. Returns the latest version of the Message or null
 * if the message isn't rendered (out of view)
 * @param {String|Number} id - Message id
 * @param {Boolean} [fresh=false] - True = Fetch from DOM, False = Fetch from cache
 * @returns {Message} - Message object
 *
 * @returns {Message}
 */
function fetch(id, fresh = false) {
  // all
  if (arguments.length == 0) {
    const nodes = document.querySelectorAll(
      '[id^="chat-messages-"][class^="messageListItem"]',
    );
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

  // by id
  if (arguments.length >= 1) {
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
}

/**
 * @public
 * Returns the most recently created message currently in the store.
 *
 * @returns {Message}
 */
function latest() {
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

/**
 * @public
 * Sends a message
 *
 * @param {String} msg - Message to send / Application command to send (/help)
 * @param {Object} args - Arguments for application commands
 */
async function send(msg, args) {
  // application commands
  if (msg.startsWith("/")) {
    if (args) {
      for (var key in args) {
        msg += ` ${key}: ${args[key]}`;
      }
    }
  }

  const pasteEvent = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData: new DataTransfer(),
  });
  pasteEvent.clipboardData.setData("text/plain", msg);

  const e = document.querySelector('[role="textbox"]');
  e.dispatchEvent(pasteEvent);

  await util.sleep(500);

  const sendEvent = new KeyboardEvent("keydown", {
    key: "Enter",
    code: "Enter",
    which: 13,
    keyCode: 13,
    bubbles: true,
  });

  e.dispatchEvent(sendEvent);

  if (!args) {
    await util.sleep(200);
    e.dispatchEvent(sendEvent);
  }
}

// Listener

const listeners = new Set();
let containerObserver = null;

/**
 * @public
 * Callback when new message appears
 *
 * @param {(message: Message) => void} callback
 * @returns {() => void} unsubscribe function
 */
function onMessage(callback) {
  listeners.add(callback);
  if (containerObserver) return; // already watching

  const container = document.querySelector('ol[data-list-id="chat-messages"]');

  containerObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (!node.matches?.('[id^="chat-messages-"][class^="messageListItem"]'))
          continue;

        const message = processElement(node);
        if (!message) continue;

        if (
          message.reply?.application_command === true &&
          message.content === "Sending command..."
        ) {
          continue;
        }

        listeners.forEach((fn) => fn(message));
      }
    }
  });

  containerObserver.observe(container, { childList: true, subtree: true });
  return () => listeners.delete(callback);
}

/**
 * @public
 * Stops watching for new messages
 */
function stopListening() {
  containerObserver?.disconnect();
  containerObserver = null;
  listeners.clear();
}

module.exports = { fetch, latest, send, onMessage, stopListening };
