const Message = require('../structures/Message');

const cache = new Map(); // id

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