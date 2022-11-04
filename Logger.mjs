/**
 * Provides an enumeration of the possible levels of logging done to the console.
 */
export class LogLevel {
  static Trace = -2;
  static Debug = -1;
  static Log = 0;
  static Warn = 1;
  static Error = 2;
  static Silent = Number.POSITIVE_INFINITY;
}
/**
 * Provides a wrapper around the global `console` to allow for filtering by a static
 * LogLevel property.
 */
export class Logger {
  static #staticLogLevel = LogLevel.Error;
  /**
   * Gets or sets the LogLevel, which determines what gets sent to the console.
   */
  static get LogLevel() {
    return this.#staticLogLevel;
  }
  static set LogLevel(value) {
    this.#staticLogLevel = value;
  }

  static trace(...args) {
    if (this.LogLevel <= LogLevel.Trace) {
      console.trace(args);
    }
  }
  static debug(...args) {
    if (this.LogLevel <= LogLevel.Debug) {
      console.debug(args);
    }
  }
  static log(...args) {
    if (this.LogLevel <= LogLevel.Log) {
      console.log(...args);
    }
  }
  static warn(...args) {
    if (this.LogLevel <= LogLevel.Warn) {
      console.warn(...args);
    }
  }
  static error(...args) {
    if (this.LogLevel <= LogLevel.Error) {
      console.error(args);
    }
  }
}
