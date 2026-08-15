// turns emoji <img>s into <:name:id> and concat them with textContent
function emojiString(node) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  if (node.tagName === "IMG" && /emoji/.test(node.className)) {
    const id = node.getAttribute("data-id");
    const name = (
      node.getAttribute("alt") ??
      node.getAttribute("data-name") ??
      ""
    ).replace(/^:|:$/g, "");
    if (!id) return name ? `:${name}:` : "";
    const animated = node.src?.includes(".gif") ? "a" : "";
    return `<${animated}:${name}:${id}>`;
  }

  return Array.from(node.childNodes).map(emojiString).join("");
}

function extractMessage(el) {
  if (!el) return null;
  // case for channel head (this is the start of #blabla channel)
  if (el.tagName !== "LI") return null;

  const idMatch = el.id?.match(/chat-messages-(\d+)-(\d+)/);

  const content = el.querySelector(
    '[class*="contents"] [id*="message-content"]',
  );

  const author_username = el.querySelector('[class*="username"]')?.textContent;
  const author_avatar = el.querySelector('img[class*="avatar"]')?.src;
  const author_id = author_avatar?.match(/(?:users|avatars)\/(\d+)\//)[1];

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
    },
    createdTimestamp: timestamp_element?.dateTime ?? null,
    editedTimestamp: edited_element?.dateTime ?? null,
    embeds: extractEmbeds(el),
    element: el,
    reply: {
      ...extractReplyReference(el),
    },
  };

  return data;
}

function extractEmbeds(el) {
  const container = el.querySelector('[id*="message-accessories"]');
  if (!container) return [];

  // for component v2 objects, turn into string / emoji
  function getLabelText(containerEl) {
    if (!containerEl) return null;
    const labelEl = containerEl.querySelector('[class*="label_"]');
    if (labelEl) return emojiString(labelEl);

    const emojiImg = containerEl.querySelector('img[class*="emoji"]');
    if (emojiImg) return emojiString(emojiImg);

    return containerEl.textContent?.trim() || null;
  }

  const blocks = [];

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
      buttonElement: accessoryEl?.querySelector("button") ?? null,
    });
  });

  container
    .querySelectorAll(
      '[class*="markdownContainer_"]:not([class*="section_"] [class*="markdownContainer_"])',
    )
    .forEach((textEl) => {
      blocks.push({
        type: "text",
        text: emojiString(textEl),
        element: textEl,
      });
    });

  container
    .querySelectorAll(
      '[class*="children_"]:not([class*="section_"] [class*="children_"])',
    )
    .forEach((rowEl) => {
      const buttonEls = rowEl.querySelectorAll(
        ':scope > button[class*="button_"]',
      );
      if (!buttonEls.length) return;
      blocks.push({
        type: "buttons",
        buttons: Array.from(buttonEls).map((btn) => ({
          label: getLabelText(btn),
          element: btn,
        })),
        element: rowEl,
      });
    });

  container.querySelectorAll('[class*="divider_"]').forEach((dividerEl) => {
    blocks.push({ type: "divider", element: dividerEl });
  });

  return blocks;
}

function extractReplyReference(el) {
  // experiment: blame discord (some reply do not have any source id eg:"click to view message/command")
  function getReactProps(el) {
    const key = Object.keys(el).find(
      (k) => k.startsWith("__reactProps$") || k.startsWith("__reactFiber$"),
    );
    return key ? el[key] : null;
  }

  function getReplyTargetId(messageEl) {
    const replyContext = messageEl.querySelector(
      '[id^="message-reply-context-"]',
    );
    if (!replyContext) return null;

    let fiberKey = Object.keys(replyContext).find((k) =>
      k.startsWith("__reactFiber$"),
    );
    let fiber = fiberKey ? replyContext[fiberKey] : null;

    // walk up the fiber tree looking for message/messageReference data
    let node = fiber;
    for (let i = 0; i < 15 && node; i++) {
      const props = node.memoizedProps;
      const ref = props?.message?.messageReference ?? props?.messageReference;
      if (ref?.message_id) return ref.message_id;
      node = node.return;
    }
    return null;
  }
  const reply = el.querySelector(
    '[id*="message-reply-context"], [class*="repliedMessage_"]',
  );

  if (!reply) return null;
  // case for application commands
  if (reply.querySelector('[class*="appLauncherOnboardingCommandName"]'))
    return null;

  const message = reply.querySelector('[id*="message-content"]');
  // const message_id = message.id.match(/message-content-(\d.*)/)[1];
  const message_id = getReplyTargetId(el);

  const author_username = reply.querySelector(
    '[class*="username"]',
  ).textContent;
  const author_avatar = reply.querySelector('img[class*="replyAvatar"]').src;
  const author_id = author_avatar.match(/(?:users|avatars)\/(\d+)\//)[1];

  return {
    message_id: message_id,
    author: {
      username: author_username,
      avatar: author_avatar,
      id: author_id,
    },
    content: emojiString(message),
  };
}

module.exports = { extractMessage, extractEmbeds, extractReplyReference };
