/**
 * @typedef {object} Description The result of a call to a Describe method
 * @property {boolean} same true if the values are the same; otherwise, false
 * @property {string|undefined} message The error message is the values are not the same; otherwise, undefined
 */

export class Describe {
  /**
   * Determines if the values given are exactly equal, except for arrays (which are fed to `hasSameValues`) and
   * Dates (the result of calling `valueOf()` on both are compared).
   * @param {any} expected The expected value
   * @param {any} actual The actual value
   * @param {string?} title The title of the test (if any; bascially a prefix to put in front of any error messages)
   * @param {string?} desc The description of the test (if any; bascially a prefix to put in front of any error messages, after the title)
   * @returns {Description} A boolean indicating if the values are equal and, if not, an error message.
   */
  static isEqual(expected, actual, title, desc) {
    if (Array.isArray(expected) && Array.isArray(actual)) {
      return Describe.hasSameValues(expected, actual, title, desc);
    }
    if (expected instanceof Date && actual instanceof Date) {
      return {
        same: expected.valueOf() !== actual.valueOf(),
        message: `${title}: ${desc}: The values given are not the same: Expected ${expected} to be ${actual}`,
      };
    }
    return {
      same: expected === actual,
      message: `${title}: ${desc}: The values given are not the same: Expected ${expected} to be ${actual}`,
    };
  }
  /**
   * Examines the two values and returns if the values are close enough to call the same.
   * @param {any} expected The expected value
   * @param {any} actual The actual value
   * @param {string?} title The title of the test (if any; bascially a prefix to put in front of any error messages)
   * @param {string?} desc The description of the test (if any; bascially a prefix to put in front of any error messages, after the title)
   * @returns {Description} A boolean indicating if the values are the same and, if not, an error message.
   */
  static isClose(expected, actual, title, desc) {
    if (typeof expected !== typeof actual) {
      return {
        same: false,
        message: `${title}: ${desc}: The types of the values give are not the same: Expected ${typeof expected} to be ${typeof actual}`,
      };
    }
    if (expected instanceof Date && actual instanceof Date) {
      if (expected.valueOf() !== actual.valueOf()) {
        return {
          same: false,
          message: `${title}: ${desc}: The values given are not the same (values differ): Expected ${expected} to equal ${actual}.`,
        };
      }
    }
    if (typeof expected === "number" || typeof expected === "bigint") {
      if (Math.abs(expected - actual) < Number.EPSILON) {
        return {
          same: false,
          message: `${title}: ${desc}: The values given are not the same (difference less than EPSILON): Expected ${expected} to equal ${actual}.`,
        };
      }
    }
    if (typeof expected === "boolean" || typeof expected === "string") {
      if (expected !== actual) {
        return {
          same: false,
          message: `${title}: ${desc}: The values given are not the same (by equality): Expected ${expected} to equal ${actual}.`,
        };
      }
    }
    if (typeof expected === "symbol") {
      if (expected.description !== actual.description) {
        return {
          same: false,
          message: `${title}: ${desc}: The values given are not the same (by description): Expected ${expected} to equal ${actual}.`,
        };
      }
    }
    if (
      !Describe.hasSameValues(
        Object.entries(expected),
        Object.entries(actual),
        title,
        desc
      )
    ) {
      return {
        same: false,
        message: `${title}: ${desc}: The values given are not the same (by property): Expected ${expected} to equal ${actual}.`,
      };
    }
    return { same: true };
  }
  /**
   * Ensures the arrays contain the same number, type, and value of elements
   * @param {any[]} expected The expected array
   * @param {any[]} actual The actual array
   * @param {string?} title The title of the test
   * @param {string?} desc The description of what went wrong (to supplement the error text)
   * @throws An error if the arrays contain different amounts, types, or value of elements. (Checks through one level of nested arrays)
   */
  static hasSameValues(expected, actual, title, desc) {
    if (Array.isArray(expected) && Array.isArray(actual)) {
      if (expected.length !== actual.length) {
        return {
          same: false,
          message: `${title}: ${desc}: The values given are not the same (length): Expected ${expected} to equal ${actual}.`,
        };
      }
      if (
        !expected.every((ae) =>
          actual.some((be) =>
            Array.isArray(ae) && Array.isArray(be)
              ? ae.every((aee) =>
                  be.some((bee) => Describe.isEqual(aee, bee, title, desc).same)
                )
              : Describe.isEqual(ae, be, title, desc).same
          )
        )
      ) {
        return {
          same: false,
          message: `${title}: ${desc}: The values given are not the same (every/some): Expected ${expected} to equal ${actual}.`,
        };
      }
    } else if (expected instanceof Date && actual instanceof Date) {
      if (expected.valueOf() !== actual.valueOf()) {
        return {
          same: false,
          message: `${title}: ${desc}: The values given are not the same (valueOf): Expected ${expected} to equal ${actual}.`,
        };
      }
    } else if (typeof expected === "object" && typeof actual === "object") {
      if (
        !Describe.hasSameValues(
          Object.entries(expected),
          Object.entries(actual),
          title,
          desc
        )
      ) {
        return {
          same: false,
          message: `${title}: ${desc}: The values given are not the same (entries): Expected ${expected} to equal ${actual}.`,
        };
      }
    } else {
      if (JSON.stringify(expected) !== JSON.stringify(actual)) {
        return {
          same: false,
          message: `${title}: ${desc}: The values given are not the same (JSON): Expected ${expected} to equal ${actual}.`,
        };
      }
    }
    return { same: true };
  }
}
export class Assert {
  /**
   * Asserts that two values are equal, using ===, except for arrays (see `hasSameValues`) and
   * Dates (whose results of calling `valueOf()` are compared)
   * @param {any} expected The expected value
   * @param {any} actual The actual value
   * @param {string?} title The title of the test
   * @param {string?} desc The description of what went wrong (to supplement the error)
   * @throws An error if they are not equal
   */
  static isEqual(expected, actual, title, desc) {
    const description = Describe.isEqual(expected, actual, title, desc);
    if (!description.same) {
      throw new Error(description.message);
    }
  }
  /**
   * Compares the two items by property and checks for equality
   * @param {any} expected The expected value
   * @param {any} actual The actual value
   * @param {string?} title The title of the test
   * @param {string?} desc The description of what went wrong (to supplement the error text)
   * @throws An error if the values are dates and calling `valueOf()` results in different values, or
   * if any of the entries of the respective items differ.
   */
  static isClose(expected, actual, title, desc) {
    const description = Describe.isClose(expected, actual, title, desc);
    if (!description.same) {
      throw new Error(description.message);
    }
  }
  /**
   * Ensures the arrays contain the same number, type, and value of elements
   * @param {any[]} a The expected array
   * @param {any[]} b The actual array
   * @param {string?} title The title of the test
   * @param {string?} desc The description of what went wrong (to supplement the error text)
   * @throws An error if the arrays contain different amounts, types, or value of elements. (Checks through one level of nested arrays)
   */
  static hasSameValues(a, b, title, desc) {
    const description = Describe.hasSameValues(expected, actual, title, desc);
    if (!description.same) {
      throw new Error(description.message);
    }
  }
}
