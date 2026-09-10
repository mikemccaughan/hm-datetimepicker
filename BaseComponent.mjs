import { LogLevel } from "./Logger.mjs";

/**
 * BaseComponent is a base class for custom HTML elements that provides common functionality such as logging and error handling.
 */
export default class BaseComponent extends HTMLElement {
  #prefix = "base-component";
  #logLevel = LogLevel.Error;
  /**
   * Initializes a new instance of the BaseComponent class.
   * @param {string} prefix The prefix for the component.
   * @param {LogLevel} logLevel The log level to use when logging.
   */
  constructor(prefix, logLevel = LogLevel.Error) {
    super();
    this.#prefix = prefix;
    this.#logLevel = logLevel;
  }
  /**
   * Gets the log level for the component.
   * @returns {LogLevel} The log level.
   */
  get logLevel() {
    return this.#logLevel;
  }
  /**
   * Sets the log level for the component.
   * @param {LogLevel} value The log level.
   */
  set logLevel(value) {
    if (this.#logLevel !== value) {
        this.#logLevel = value;
    }
  }
  /**
   * Wraps a call to fn in a try/catch, using a standard method for raising an event if
   * the error occurs, and only throwing the error if that event is not handled.
   * @param {Function} fn Function to call in `context` with arguments `args`.
   * @param {any} context The `this` for the function call
   * @param  {...any} args The arguments (if any) for the function call
   */
  doOrDoNot(fn, context = this, ...args) {
    try {
      fn.call(context, ...args);
    } catch (err) {
      const errorEvent = new Event("error", {
        message: err.message,
        filename: err.filename,
        lineno: err.lineno,
        colno: err.colno,
        error: err,
      });
      if (
        this.dispatchEventAndReport(`${this.#prefix}-error`, errorEvent, err)
      ) {
        throw err;
      }
    }
  }
  /**
   * Dispatches an event of the given name and reports on whether consumers should
   * proceed or not.
   * @param {string} eventName The name of the event to dispatch
   * @param {Event} originalEvent The original event raised
   * @param {any} value The value to pass along to consumers of the event
   * @returns true if either the event's cancelable attribute value is false,
   * or the event's preventDefault method was not triggered; otherwise, false
   */
  dispatchEventAndReport(eventName, originalEvent, value) {
    let proceed = true;
    const event = new CustomEvent(eventName, {
      detail: {
        originalEvent,
        value,
        component: this,
      },
    });
    proceed = this.dispatchEvent(event);
    return proceed;
  }
}
