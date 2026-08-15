function extractMessage(el) {
  const content_element = el.querySelector('[id*="message-content"]');
  const username_element = el.querySelector('[class*="username_"]');
  const avatar_element = el.querySelector('img[class*="avatar_"]');
  const timestamp_element = el.querySelector('[id*="message-timestamp"]');
  const edited_element = el.querySelector('time:has([class*="edited"])');

  const authorIdMatch = avatar_element?.src.match(/\/avatars\/(\d+)\//);

  return {
    // Format: chat-messages-<channelId>-<id>
    id: el.id?.match(/chat-messages-(\d.*)-(\d.*)/)[2] ?? null,
    channelId: el.id?.match(/chat-messages-(\d.*)-(\d.*)/)[1] ?? null,
    
    content: content_element?.textContent ?? null,
    authorId: authorIdMatch ? authorIdMatch[1] : null,
    authorUsername: username_element?.getAttribute('data-text') ?? username_element?.textContent ?? null,
    authorAvatarUrl: avatar_element?.src ?? null,
    createdTimestamp: timestamp_element?.dateTime ?? null,
    editedTimestamp: edited_element?.dateTime ?? null,
  };
}

module.exports = extractMessage;