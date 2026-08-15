class BaseManager {
  constructor(client, holds) {
    Object.defineProperty(this, "client", { value: client });
    this.holds = holds;
    this.cache = new Map();
  }

  get(id) {
    return this.cache.get(id);
  }

  add(element) {
    const id = this._resolveId(element);
    if (this.cache.has(id)) {
      const existing = this.cache.get(id);
      existing.refresh();
      return existing;
    }

    const instance = new this.holds(this.client, element);
    this.cache.set(id, instance);
    return instance;
  }

  remove(id) {
    this.cache.delete(id);
  }

  /**
   * Resolves a data entry to a instance ID.
   * @param {Element|Object} idOrInstance The id or instance of something in this Manager
   * @returns {?Snowflake}
   */
  _resolveId(element) {
    return element.id;
  }
}

module.exports = BaseManager;
