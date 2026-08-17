(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/structures/Message.js
  var require_Message = __commonJS({
    "src/structures/Message.js"(exports, module) {
      var Message = class {
        constructor(data) {
          this.id = data.id;
          this.channelId = data.channelId;
          this._patch(data);
        }
        _patch(data) {
          if ("content" in data) this.content = data.content;
          if ("author" in data) this.author = data.author;
          if ("embeds" in data) this.embeds = data.embeds;
          if ("element" in data) this.element = data.element;
          if ("reply" in data) this.reply = data.reply;
          if ("createdTimestamp" in data) this.createdTimestamp = data.createdTimestamp;
          if ("editedTimestamp" in data) this.editedTimestamp = data.editedTimestamp;
          return this;
        }
        get isReply() {
          return Boolean(this.reply);
        }
        get isEdited() {
          return Boolean(this.editedTimestamp);
        }
        toString() {
          return this.content ?? "";
        }
      };
      module.exports = Message;
    }
  });

  // src/utils/store.js
  var require_store = __commonJS({
    "src/utils/store.js"(exports, module) {
      var Message = require_Message();
      var cache = /* @__PURE__ */ new Map();
      function upsert(data) {
        if (!data?.id) return null;
        const existing = cache.get(data.id);
        if (existing) {
          existing._patch(data);
          return existing;
        }
        const message = new Message(data);
        cache.set(data.id, message);
        return message;
      }
      function get(id) {
        return cache.get(id) ?? null;
      }
      function all() {
        return [...cache.values()];
      }
      function remove(id) {
        return cache.delete(id);
      }
      function clear() {
        cache.clear();
      }
      module.exports = { upsert, get, all, remove, clear, cache };
    }
  });

  // src/utils/extractor.js
  var require_extractor = __commonJS({
    "src/utils/extractor.js"(exports, module) {
      function emojiString(node) {
        if (!node) return null;
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType !== Node.ELEMENT_NODE) return "";
        if (node.tagName === "SVG") return "";
        if (node.tagName === "IMG" && /emoji/.test(node.className)) {
          const id = node.getAttribute("data-id");
          const name = (node.getAttribute("alt") ?? node.getAttribute("data-name") ?? "").replace(/^:|:$/g, "");
          if (!id) return name ? `:${name}:` : "";
          const animated = node.src?.includes(".gif") ? "a" : "";
          return `<${animated}:${name}:${id}>`;
        }
        return Array.from(node.childNodes).map(emojiString).join("");
      }
      function extractMessage(el) {
        if (!el) return null;
        const idMatch = el.id?.match(/chat-messages-(\d+)-(\d+)/);
        const content = el.querySelector(
          '[class*="contents"] [id*="message-content"]'
        );
        const author_username = el.querySelector(
          '[id*="message-username"] [class*="username"]'
        )?.textContent;
        const author_avatar = el.querySelector('img[class*="avatar"]')?.src;
        const author_id = author_avatar?.includes("assets") ? null : author_avatar?.match(/(?:users|avatars)\/(\d+)\//)[1];
        const author_type = el.querySelector('[aria-label$="App"]') ? "app" : "user";
        const timestamp_element = el.querySelector('[id*="message-timestamp"]');
        const edited_element = el.querySelector('time:has([class*="edited"])');
        const data = {
          id: idMatch[2],
          channelId: idMatch[1],
          content: emojiString(content),
          author: {
            username: author_username,
            avatar: author_avatar,
            id: author_id,
            type: author_type
          },
          createdTimestamp: timestamp_element?.dateTime ?? null,
          editedTimestamp: edited_element?.dateTime ?? null,
          embeds: extractEmbeds(el),
          element: el,
          reply: {
            ...extractReplyReference(el)
          }
        };
        return data;
      }
      function extractEmbeds(el) {
        const container = el.querySelector('[id*="message-accessories"]');
        if (!container) return [];
        function getLabelText(containerEl) {
          if (!containerEl) return null;
          const labelEl = containerEl.querySelector('[class*="label_"]');
          if (labelEl) return emojiString(labelEl);
          const emojiImg = containerEl.querySelector('img[class*="emoji"]');
          if (emojiImg) return emojiString(emojiImg);
          return containerEl.textContent?.trim() || null;
        }
        const blocks = [];
        container.querySelectorAll('article[class*="embedFull_"], article[class*="embed_"]').forEach((embedEl) => {
          const title_element = embedEl.querySelector('[class*="embedTitle_"]');
          const description_element = embedEl.querySelector('[class*="embedDescription_"]');
          const author_element = embedEl.querySelector('[class*="embedAuthorName_"]');
          const footer_element = embedEl.querySelector('[class*="embedFooterText_"]');
          const image_element = embedEl.querySelector('img[class*="embedImage_"], img[class*="embedThumbnail_"]');
          const fields = Array.from(embedEl.querySelectorAll('[class*="embedField_"]')).map((fieldEl) => {
            const name_element = fieldEl.querySelector('[class*="embedFieldName_"]');
            const value_element = fieldEl.querySelector('[class*="embedFieldValue_"]');
            return {
              name: name_element ? emojiString(name_element) : null,
              value: value_element ? emojiString(value_element) : null,
              element: fieldEl
            };
          });
          blocks.push({
            type: "embed",
            title: title_element ? emojiString(title_element) : null,
            description: description_element ? emojiString(description_element) : null,
            author: author_element ? emojiString(author_element) : null,
            footer: footer_element ? emojiString(footer_element) : null,
            imageUrl: image_element?.src ?? null,
            fields,
            element: embedEl
          });
        });
        container.querySelectorAll('[class*="section_"]').forEach((sectionEl) => {
          const title = sectionEl.querySelector("h3");
          const subtitle = sectionEl.querySelector("small");
          const accessoryEl = sectionEl.querySelector('[class*="accessory_"]');
          blocks.push({
            type: "section",
            title: title ? emojiString(title) : null,
            subtitle: subtitle ? emojiString(subtitle) : null,
            buttonLabel: getLabelText(accessoryEl),
            element: sectionEl,
            buttonElement: accessoryEl?.querySelector("button") ?? null
          });
        });
        container.querySelectorAll(
          '[class*="markdownContainer_"]:not([class*="section_"] [class*="markdownContainer_"])'
        ).forEach((textEl) => {
          blocks.push({
            type: "text",
            text: emojiString(textEl),
            element: textEl
          });
        });
        container.querySelectorAll(
          '[class*="children_"]:not([class*="section_"] [class*="children_"])'
        ).forEach((rowEl) => {
          const buttonEls = rowEl.querySelectorAll(
            ':scope > button[class*="button_"]'
          );
          if (!buttonEls.length) return;
          blocks.push({
            type: "buttons",
            buttons: Array.from(buttonEls).map((btn) => ({
              label: getLabelText(btn),
              element: btn
            })),
            element: rowEl
          });
        });
        container.querySelectorAll('[class*="divider_"]').forEach((dividerEl) => {
          blocks.push({ type: "divider", element: dividerEl });
        });
        return blocks;
      }
      function extractReplyReference(el) {
        const reply = el.querySelector(
          '[id*="message-reply-context"], [class*="repliedMessage_"]'
        );
        if (!reply) return null;
        const application_command = reply.querySelector(
          '[class*="appLauncherOnboardingCommandName"]'
        );
        const message = application_command ? application_command : reply.querySelector('[id*="message-content"]');
        const message_id = application_command ? null : message?.id.match(/message-content-(\d.*)/)?.[1];
        const author_username = reply.querySelector(
          '[class*="username"]'
        ).textContent;
        const author_avatar = reply.querySelector(
          'img[class*="replyAvatar"], img[class*="executedCommandAvatar"]'
        ).src;
        var author_id = author_avatar.includes("assets") ? null : author_avatar.match(/(?:users|avatars)\/(\d+)\//)[1];
        const author_type = reply.querySelector('[aria-label$="App"]') ? "app" : "user";
        return {
          message_id,
          author: {
            username: author_username,
            avatar: author_avatar,
            id: author_id,
            type: author_type
          },
          content: emojiString(message),
          application_command: !!application_command,
          isUnknown: !!reply.querySelector('[class*="repliedTextPlaceholder"]')
        };
      }
      module.exports = { extractMessage, extractEmbeds, extractReplyReference };
    }
  });

  // src/utils/util.js
  var require_util = __commonJS({
    "src/utils/util.js"(exports, module) {
      async function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      module.exports = { sleep };
    }
  });

  // src/managers/MessageManager.js
  var require_MessageManager = __commonJS({
    "src/managers/MessageManager.js"(exports, module) {
      var { extractMessage } = require_extractor();
      var store = require_store();
      var util = require_util();
      function processElement(el, previousAuthor) {
        const data = extractMessage(el);
        if (!data?.id) return null;
        if (!data.author?.id && previousAuthor?.id) {
          data.author = { ...previousAuthor };
        }
        return store.upsert(data);
      }
      function fetch(id, fresh = false) {
        if (arguments.length == 0) {
          const nodes = document.querySelectorAll(
            '[id^="chat-messages-"][class^="messageListItem"]'
          );
          const results = [];
          for (const el of nodes) {
            console.log(el);
            const previousAuthor = results.findLast((m) => m.author?.id)?.author;
            const message = processElement(el, previousAuthor);
            if (message) results.push(message);
          }
          return results;
        }
        if (arguments.length >= 1) {
          if (!fresh) {
            return store.get(id) ?? null;
          }
          id = String(id);
          const el = document.querySelector(`[id$="-${id}"][id^="chat-messages-"]`);
          if (!el) {
            console.warn(
              `[discord-dom-reader] Could not find message ${id} in the DOM (not rendered / scrolled away?)`
            );
            return null;
          }
          const previousAuthor = store.get(id)?.author;
          return processElement(el, previousAuthor);
        }
      }
      function latest() {
        const messages = store.all();
        if (!messages.length) return null;
        return messages.reduce((latest2, msg) => {
          if (!msg.createdTimestamp) return latest2;
          if (!latest2) return msg;
          return new Date(msg.createdTimestamp) > new Date(latest2.createdTimestamp) ? msg : latest2;
        }, null);
      }
      async function send(msg, args) {
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
          clipboardData: new DataTransfer()
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
          bubbles: true
        });
        e.dispatchEvent(sendEvent);
        if (!args) {
          await util.sleep(200);
          e.dispatchEvent(sendEvent);
        }
      }
      var listeners = /* @__PURE__ */ new Set();
      var containerObserver = null;
      function onMessage(callback) {
        listeners.add(callback);
        if (containerObserver) return;
        const container = document.querySelector('ol[data-list-id="chat-messages"]');
        containerObserver = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType !== 1) continue;
              if (!node.matches?.('[id^="chat-messages-"][class^="messageListItem"]'))
                continue;
              const message = processElement(node);
              if (!message) continue;
              if (message.reply?.application_command === true && message.content === "Sending command...") {
                continue;
              }
              listeners.forEach((fn) => fn(message));
            }
          }
        });
        containerObserver.observe(container, { childList: true, subtree: true });
        return () => listeners.delete(callback);
      }
      function stopListening() {
        containerObserver?.disconnect();
        containerObserver = null;
        listeners.clear();
      }
      module.exports = { fetch, latest, send, onMessage, stopListening };
    }
  });

  // src/index.js
  var require_src = __commonJS({
    "src/index.js"(exports, module) {
      var store = require_store();
      var discordUI2 = {
        // fetching
        Messages: require_MessageManager(),
        // store access
        getMessage: store.get,
        getAllMessages: store.all,
        clearStore: store.clear
      };
      if (typeof window !== "undefined") {
        window.discordUI = discordUI2;
      }
      module.exports = discordUI2;
    }
  });
})();
