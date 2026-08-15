// works from a member-list element (has more fields available)
function extractUser(el) {
  const avatar_element = el.querySelector('img[class*="avatar"]');
  const username_element = el.querySelector('[class*="username"]');
  const status_element = el.querySelector('[class*="status"]');

  const idMatch = avatar_element?.src.match(/\/avatars\/(\d+)\//);

  return {
    id: idMatch ? idMatch[1] : null,
    username: username_element?.getAttribute('data-text') ?? username_element?.textContent ?? null,
    avatarUrl: avatar_element?.src ?? null,
    status: status_element?.getAttribute('aria-label') ?? null,
  };
}

module.exports = extractUser;