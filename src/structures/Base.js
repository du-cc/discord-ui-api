class Base {
  constructor(client) {
    Object.defineProperty(this, 'client', { value: client });
  }
  _patch(data) { return data; }
}

module.exports = Base;