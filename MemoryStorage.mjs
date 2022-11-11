/**
 * Implements the Storage API for a simple in-memory cache.
 */
export default class MemoryStorage /*extends Storage*/ {
  #items = new Map();
  constructor() {
    /* super(); */
  }
  clear() {
    this.#items.clear();
  }
  getItem(key) {
    return this.#items.get(key);
  }
  setItem(key, value) {
    this.#items.set(key, value);
  }
  removeItem(key) {
    this.#items.delete(key);
  }
  key(index) {
    return Array.from(this.#items.keys()).at(index);
  }
  get length() {
    return this.#items.size;
  }
}
