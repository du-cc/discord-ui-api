function emojiString(node) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  if (node.tagName === "SVG") return "";
  if (
    node.tagName === "SPAN" &&
    (/hiddenVisually/.test(node.className) || /timestamp/.test(node.className))
  )
    return "";

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

/**
 * Extract information and builds a Object
 *
 * @returns {Object}
 *
 * Format:
 * {
 *   id, channelId, content,
 *   author: { username, avatar, id, type },
 *   createdTimestamp, editedTimestamp,
 *   embeds, element,
 *   reply: { message_id, author, content, application_command, isUnknown } | null
 * }
 */
function extractMessage(el) {
  if (!el) return null;

  const idMatch = el.id?.match(/chat-messages-(\d+)-(\d+)/);

  const content = el.querySelector(
    '[class*="contents"] [id*="message-content"]',
  );

  const author_username = el.querySelector(
    '[id*="message-username"] [class*="username"]',
  )?.textContent;
  const author_avatar = el.querySelector('img[class*="avatar"]')?.src;
  const author_id = author_avatar?.includes("assets")
    ? null
    : author_avatar?.match(/(?:users|avatars)\/(\d+)\//)[1];
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
      type: author_type,
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

  // classic embeds
  container
    .querySelectorAll('article[class*="embedFull_"], article[class*="embed_"]')
    .forEach((embedEl) => {
      const title_element = embedEl.querySelector('[class*="embedTitle_"]');
      const description_element = embedEl.querySelector(
        '[class*="embedDescription_"]',
      );
      const author_element = embedEl.querySelector(
        '[class*="embedAuthorName_"]',
      );
      const footer_element = embedEl.querySelector(
        '[class*="embedFooterText_"]',
      );
      const image_element = embedEl.querySelector(
        'img[class*="embedImage_"], img[class*="embedThumbnail_"]',
      );

      const fields = Array.from(
        embedEl.querySelectorAll('[class*="embedField_"]'),
      ).map((fieldEl) => {
        const name_element = fieldEl.querySelector(
          '[class*="embedFieldName_"]',
        );
        const value_element = fieldEl.querySelector(
          '[class*="embedFieldValue_"]',
        );
        return {
          name: name_element ? emojiString(name_element) : null,
          value: value_element ? emojiString(value_element) : null,
          element: fieldEl,
        };
      });

      blocks.push({
        type: "embed",
        title: title_element ? emojiString(title_element) : null,
        description: description_element
          ? emojiString(description_element)
          : null,
        author: author_element ? emojiString(author_element) : null,
        footer: footer_element ? emojiString(footer_element) : null,
        imageUrl: image_element?.src ?? null,
        fields,
        element: embedEl,
      });
    });

  // Components V2 sections
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
  const reply = el.querySelector(
    '[id*="message-reply-context"], [class*="repliedMessage_"]',
  );

  if (!reply) return null;

  // case for application commands
  const application_command = reply.querySelector(
    '[class*="appLauncherOnboardingCommandName"]',
  );

  const message = application_command
    ? application_command
    : reply.querySelector('[id*="message-content"]');

  const message_id = application_command
    ? null
    : message?.id.match(/message-content-(\d.*)/)?.[1];

  const author_username = reply.querySelector(
    '[class*="username"]',
  ).textContent;
  const author_avatar = reply.querySelector(
    'img[class*="replyAvatar"], img[class*="executedCommandAvatar"]',
  ).src;
  var author_id = author_avatar.includes("assets")
    ? null
    : author_avatar.match(/(?:users|avatars)\/(\d+)\//)[1];
  const author_type = reply.querySelector('[aria-label$="App"]')
    ? "app"
    : "user";

  return {
    message_id: message_id,
    author: {
      username: author_username,
      avatar: author_avatar,
      id: author_id,
      type: author_type,
    },
    content: emojiString(message),
    application_command: !!application_command,
    isUnknown: !!reply.querySelector('[class*="repliedTextPlaceholder"]'),
  };
}

module.exports = { extractMessage, extractEmbeds, extractReplyReference };
