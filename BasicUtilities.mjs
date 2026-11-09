import DateHelper, { DateComparisonGranularity } from "./DateHelper.mjs";
/**
 * Provides an enumeration of the possible granularities by which numbers can be compared.
 */
export class NumberComparisonGranularity {
  static Thousands = 1000;
  static Hundreds = 100;
  static Tens = 10;
  static Integer = 1;
  static Tenths = 0.1;
  static Hundredths = 0.01;
  static Thousandths = 0.001;
  static Default = -1;
  static Custom = 0;
}

/**
 * Encompasses the arguments to the BasicUtilities.deepEquals function.
 */
export class DeepEqualityArgs {
  /**
   * Validates the order of the elements in the two arrays. Defaults to false.
   */
  validateElementOrder = false;
  /**
   * Validates the order of the own properties in the two objects. Defaults to false.
   */
  validatePropertyOrder = false;
  /**
   * The granularity with which to compare Date objects. Defaults to "ms", milliseconds.
   * Other possible values are expressed as members of the DateComparisonGranularity class.
   */
  dateGranularity = DateComparisonGranularity.Default;
  /**
   * The function to use when dateGranularity is set to "?" (Custom). Defaults to a function
   * that does the same thing as the default; that is, one that returns whether the value of
   * the Date objects are equal.
   * @param {Date} a The first date to compare.
   * @param {Date} b The second date to compare.
   * @returns {boolean} true if the dates are the same at the custom granularity; otherwise, false.
   */
  dateGranularityCustom = (a, b) => a.valueOf() === b.valueOf();
  /**
   * The granularity with which to compare numbers. This is essentially the maximum value
   * by which the two numbers may differ. Defaults to Number.EPSILON (essentially 0).
   */
  numberGranularity = NumberComparisonGranularity.Default;
  /**
   * The function to use when numberGranularity is set to -1 (Custom). Defaults to a function
   * that does the same thing as the default; that is, one that takes the absolute value of the
   * difference between the two numbers and returns whether it is less than Number.EPSILON.
   * @param {number} a The first number to compare.
   * @param {number} b The second number to compare.
   * @returns {boolean} true if the numbers are the same at the custom granularity; otherwise, false.
   */
  numberGranularityCustom = (a, b) => Math.abs(a - b) < Number.EPSILON;
}

/**
 * Provides utility methods, mostly around equality.
 */
export default class BasicUtilities {
  /**
   * Checks if the given value is null.
   * @param {unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is null; otherwise, false.
   */
  static isNull(value) /* asserts value is null */ {
    return typeof value === "object" && value === null;
  }
  /**
   * Checks if the given value is undefined.
   * @param {unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is undefined; otherwise, false.
   */
  static isUndefined(value) /* asserts value is undefined */ {
    return typeof value === "undefined";
  }
  /**
   * Checks if the given value is null or undefined.
   * @param {unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is null or undefined, otherwise false.
   */
  static isNU(value) /* asserts value is null or value is undefined */ {
    return BasicUtilities.isNull(value) || BasicUtilities.isUndefined(value);
  }
  /**
   * Checks if the given value is null, undefined, or an empty string or array.
   * @param {unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is null, undefined, or an empty string or array, otherwise false.
   */
  static isNUEmpty(
    value,
  ) /* asserts value is null or value is undefined or value is an empty string or value is empty array */ {
    return (
      BasicUtilities.isNU(value) ||
      (typeof value === "string" && value.length === 0) ||
      (Array.isArray(value) && value.length === 0)
    );
  }
  /**
   * Checks if the given value is a string with content.
   * @param {unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is a string with a positive `length`, otherwise false.
   */
  static isStringWithContent(value) /* asserts value is a string */ {
    return !BasicUtilities.isNUEmpty(value) && typeof value === "string";
  }
  /**
   * Checks if the given value is an array with a positive length.
   * @param {unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is an array with a positive `length`, otherwise false.
   */
  static isArrayWithContent(value) /* asserts value is an array */ {
    return !BasicUtilities.isNUEmpty(value) && Array.isArray(value);
  }
  /**
   * Checks if the given value is a number or a string that can be converted to a number.
   * @param {unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is a finite number or a string that can be converted to a finite number; otherwise, false.
   */
  static isNumeric(value) /* asserts value is a number or a string */ {
    return (
      !BasicUtilities.isNUEmpty(value) &&
      ((typeof value === "number" && isFinite(value)) ||
        (BasicUtilities.isStringWithContent(value) &&
          typeof value === "string" &&
          !isNaN(parseFloat(value)) &&
          isFinite(parseFloat(value))))
    );
  }
  /**
   * Checks if the given value is a number.
   * @param {unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is a number; otherwise, false.
   */
  static isNumber(value) /* asserts value is a number and value is finite */ {
    return !BasicUtilities.isNU(value) && typeof value === "number" && isFinite(value);
  }
  /**
   * Checks if the given value is a valid Date object.
   * @param {unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is a valid Date object; otherwise, false.
   */
  static isValidDate(
    value,
  ) /* asserts value is not null and value is not undefined and value is a valid Date object */ {
    return (
      !BasicUtilities.isNU(value) &&
      typeof value === "object" &&
      value instanceof Date &&
      !isNaN(value.valueOf())
    );
  }
  /**
   * Checks if both arguments are of the same type. This is a surface-level check, and does not check for deep equality.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} b The second item to compare
   * @returns {boolean} true if the two values are the same type type; otherwise false.
   */
  static areTheSameType(a, b) /* asserts a is the same type as b */ {
    return typeof a === typeof b;
  }
  /**
   * Checks if both arguments are null. This is a surface-level check, and does not check for deep equality.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} b The second item to compare
   * @returns {boolean} true if the two values are both null; otherwise false.
   */
  static areBothNull(a, b) /* asserts a is null and b is null */ {
    return BasicUtilities.isNull(a) && BasicUtilities.isNull(b);
  }
  /**
   * Checks if both arguments are undefined. This is a surface-level check, and does not check for deep equality.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} b The second item to compare
   * @returns {boolean} true if the two values are both undefined; otherwise false.
   */
  static areBothUndefined(a, b) /* asserts a is undefined and b is undefined */ {
    return BasicUtilities.isUndefined(a) && BasicUtilities.isUndefined(b);
  }
  /**
   * Checks if both arguments are objects. This is a surface-level check, and does not check for deep equality.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} b The second item to compare
   * @returns {boolean} true if the two values are both objects; otherwise false.
   */
  static areBothObjects(a, b) /* asserts a is an object and b is an object */ {
    return typeof a === "object" && typeof b === "object" && !BasicUtilities.areBothNull(a, b);
  }
  /**
   * Checks if both arguments are arrays. This is a surface-level check, and does not check for deep equality.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} b The second item to compare
   * @returns {boolean} true if the two values are both arrays; otherwise false.
   */
  static areBothArrays(a, b) /* asserts a is an array and b is an array */ {
    return BasicUtilities.isArrayWithContent(a) && BasicUtilities.isArrayWithContent(b);
  }
  /**
   * Checks if both arguments are numbers. This is a surface-level check, and does not check for deep equality.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} b The second item to compare
   * @returns {boolean} true if the two values are both numbers; otherwise false.
   */
  static areBothNumbers(a, b) /* asserts a is a number and b is a number */ {
    return BasicUtilities.isNumber(a) && BasicUtilities.isNumber(b);
  }
  /**
   * Checks if both arguments are strings with length. This is a surface-level check, and does not check for deep equality.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} b The second item to compare
   * @returns {boolean} true if the two values are both strings with length; otherwise false.
   */
  static areBothStrings(a, b) /* asserts a is a string and b is a string */ {
    return BasicUtilities.isStringWithContent(a) && BasicUtilities.isStringWithContent(b);
  }
  /**
   * Checks if both arguments are functions. This is a surface-level check, and does not check for deep equality.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} b The second item to compare
   * @returns {boolean} true if the two values are both functions; otherwise false.
   */
  static areBothFunctions(a, b) /* asserts a is a function and b is a function */ {
    return typeof a === "function" && typeof b === "function";
  }
  /**
   * Checks if both arguments are dates. This is a surface-level check, and does not check for deep equality.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | object | Date | null | undefined} b The second item to compare
   * @returns {boolean} true if the two values are both dates; otherwise false.
   */
  static areBothDates(a, b) /* asserts a is a Date and b is a Date */ {
    return (
      BasicUtilities.areBothObjects(a, b) &&
      BasicUtilities.isValidDate(a) &&
      BasicUtilities.isValidDate(b)
    );
  }
  /**
   * Checks if both arguments have equal lengths. This is a surface-level check, and does not check for deep equality.
   * @param {string | unknown[]} a The first item to compare
   * @param {string | unknown[]} b The second item to compare
   * @returns {boolean} true if the two values both have equal lengths; otherwise false.
   */
  static haveEqualLength(a, b) {
    return a.length === b.length;
  }
  /**
   * Checks if both arguments have same elements. This is a surface-level check, and does not check for deep equality.
   * @param {unknown[]} a The first array to compare
   * @param {unknown[]} b The second array to compare
   * @param {DeepEqualityArgs} deepArgs The arguments to the function.
   * @returns {boolean} true if the two arrays have same elements; otherwise false.
   */
  static haveEqualElements(a, b, deepArgs = new DeepEqualityArgs()) {
    return a.every((aItem) => b.some((bItem) => BasicUtilities.deepEquals(aItem, bItem, deepArgs)));
  }
  /**
   * Checks if both arguments have same elements at the same indices. This is a surface-level check, and does not check for deep equality.
   * @param {unknown[]} a The first array to compare
   * @param {unknown[]} b The second array to compare
   * @param {DeepEqualityArgs} deepArgs The arguments to the function.
   * @returns {boolean} true if the two arrays have same elements at the same indices; otherwise false.
   */
  static haveEqualElementsByIndex(a, b, deepArgs = new DeepEqualityArgs()) {
    return a.every((aItem, index) => BasicUtilities.deepEquals(aItem, b[index], deepArgs));
  }
  /**
   * Checks if both items specified have the same value.
   * @param {function | string | number | boolean | bigint | Record<string, unknown> | unknown | unknown[] | object | Date | null | undefined} a The first item to compare
   * @param {function | string | number | boolean | bigint | Record<string, unknown> | unknown | unknown[] | object | Date | null | undefined} b The second item to compare
   * @param {boolean} deep true to use deep comparison (same as calling deepEquals);
   *  otherwise (default), don't use deep comparison
   * @param {DeepEqualityArgs} deepArgs The DeepEqualityArgs instance to use when deep = true.
   * @returns {boolean} true, if a and b have the same base value (for objects, share the
   *  same keys and values; for arrays, share the same elements; for both, in any order,
   *  unless both deep and validatePropertyOrder are true)
   * @remarks Throws custom Error if JSON.stringify throws.
   */
  static areTheSame(a, b, deep = false, deepArgs = new DeepEqualityArgs()) {
    if (deep) {
      // Passing deep == true calls deepEquals
      return BasicUtilities.deepEquals(a, b, deepArgs);
    }
    if (!BasicUtilities.areTheSameType(a, b) && typeof a !== typeof b) {
      // Essentially preempting any === vs == typos. Also checks for one being
      // undefined and the other not.
      return false;
    }
    if (BasicUtilities.isUndefined(a) || BasicUtilities.isUndefined(b)) {
      // If both are undefined, then they are the same.
      return (
        BasicUtilities.areBothUndefined(a, b) &&
        typeof a === "undefined" &&
        typeof b === "undefined"
      );
    }
    if (BasicUtilities.isNull(a) || BasicUtilities.isNull(b)) {
      // If both are null, then they are the same.
      return BasicUtilities.areBothNull(a, b) && a === null && b === null;
    }
    const aAndBAreBothStrings =
      BasicUtilities.areBothStrings(a, b) && typeof a === "string" && typeof b === "string";
    if (aAndBAreBothStrings) {
      return (
        BasicUtilities.haveEqualLength(a, b) && BasicUtilities.haveEqualElements([...a], [...b])
      );
    }
    const aAndBAreBothFunctions = typeof a === "function" && typeof b === "function";
    if (aAndBAreBothFunctions) {
      // for functions, we're just checking their "toString" output and "name" values.
      // Need typeof checks because assertions don't work in this context.
      return a.name === b.name && a.toString() === b.toString();
    }
    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);
    if (!aIsArray || !bIsArray) {
      // If one's an array and the other isn't, they are not the same.
      return aIsArray && bIsArray;
    } else if (aIsArray && bIsArray) {
      // Check arrays at a surface level (if deep === true, we never get here)
      // difference between this and deepEquals: this compares dates by value only in arrays
      return (
        a.length === b.length &&
        a.every((aItem) => b.some((bItem) => BasicUtilities.areTheSame(aItem, bItem)))
      );
    }
    const aIsDate = typeof a === "object" && a instanceof Date;
    const bIsDate = typeof b === "object" && b instanceof Date;
    if (!aIsDate || !bIsDate) {
      // If one's a Date and the other isn't, they are not the same.
      return aIsDate && bIsDate;
    } else if (aIsDate && bIsDate) {
      // Just checks the value, so the dates must be the same down to the millisecond.
      // To use dateGranularity, deep must be true.
      return a.valueOf() === b.valueOf();
    }
    if (BasicUtilities.areBothObjects(a, b) && typeof a === "object" && typeof b === "object") {
      if (BasicUtilities.areBothNull(a, b) && a === null && b === null) {
        // Since typeof null === 'object', but running Object.keys(null) throws a TypeError.
        return true;
      }
      // difference between this and deepEquals: this compares object references
      return a === b;
    }
    if (
      !["bigint", "boolean", "function", "number", "object", "string", "undefined"].includes(
        typeof a,
      ) &&
      !["bigint", "boolean", "function", "number", "object", "string", "undefined"].includes(
        typeof b,
      ) &&
      !aIsArray &&
      !bIsArray &&
      !aIsDate &&
      !bIsDate
    ) {
      // if it's not a special type (i.e. it's a number, string, Boolean, BigInt, etc.), just use equality
      return a === b;
    }

    return false;
  }
  /**
   * Does a deep comparison of two arrays.
   * @param {unknown[]} a The first array to compare.
   * @param {unknown[]} b The second array to compare.
   * @param {DeepEqualityArgs} deepArgs The arguments to the function.
   * @returns {boolean} true if the two arrays are the same; otherwise false.
   */
  static deepEqualsArrays(a, b, deepArgs = new DeepEqualityArgs()) {
    const aAndBOfSameType = BasicUtilities.areTheSameType(a, b);
    if (!aAndBOfSameType) {
      return false;
    }
    const aAndBAreBothNull = BasicUtilities.areBothNull(a, b);
    if (aAndBAreBothNull) {
      return true;
    }
    const aAndBAreBothUndefined = BasicUtilities.areBothUndefined(a, b);
    if (aAndBAreBothUndefined) {
      return true;
    }
    const aAndBAreBothArrays = BasicUtilities.areBothArrays(a, b);
    if (!aAndBAreBothArrays) {
      throw new Error(
        `Both values specified must be arrays according to the Array.isArray function.`,
      );
    }
    const aAndBLengthsAreEqual = BasicUtilities.haveEqualLength(a, b);
    const aAndBHaveDeepEqualItemsByIndex = BasicUtilities.haveEqualElementsByIndex(a, b, deepArgs);
    const aAndBHaveDeepEqualItemsByAnyIndex = BasicUtilities.haveEqualElements(a, b, deepArgs);
    return (
      aAndBLengthsAreEqual &&
      (deepArgs.validateElementOrder
        ? aAndBHaveDeepEqualItemsByIndex
        : aAndBHaveDeepEqualItemsByAnyIndex)
    );
  }
  /**
   * Does a deep comparison of two values.
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | unknown[] | object | Date | null | undefined} a The first item to compare
   * @param {string | number | boolean | bigint | Record<string, unknown> | unknown | unknown[] | object | Date | null | undefined} b The second item to compare
   * @param {DeepEqualityArgs} deepArgs The arguments to the function.
   * @returns {boolean} true, if a and b have the same base value (for objects, share the
   *  same keys and values; for arrays, share the same elements; for both, in any order,
   *  unless both validatePropertyOrder are true)
   */
  static deepEquals(a, b, deepArgs) {
    const aAndBOfSameType = BasicUtilities.areTheSameType(a, b);
    if (!aAndBOfSameType) {
      return false;
    }
    const aAndBAreBothNull = BasicUtilities.areBothNull(a, b);
    if (aAndBAreBothNull) {
      return true;
    }
    const aAndBAreBothUndefined = BasicUtilities.areBothUndefined(a, b);
    if (aAndBAreBothUndefined) {
      return true;
    }
    const aAndBAreBothArrays = BasicUtilities.areBothArrays(a, b);
    if (!aAndBAreBothArrays) {
      return false;
    }
    const aAndBAreBothObjects = BasicUtilities.areBothObjects(a, b);
    const aAndBAreBothNumbers = BasicUtilities.areBothNumbers(a, b);
    const aAndBAreBothFunctions = BasicUtilities.areBothFunctions(a, b);
    const aAndBAreBothDates = BasicUtilities.areBothDates(a, b);
    const aAndBAreBothStrings = BasicUtilities.areBothStrings(a, b);
    if (
      !aAndBAreBothObjects &&
      !aAndBAreBothFunctions &&
      !aAndBAreBothNumbers &&
      !aAndBAreBothStrings &&
      !aAndBAreBothArrays &&
      !aAndBAreBothDates
    ) {
      return a === b;
    }
    if (aAndBAreBothNumbers && typeof a === "number" && typeof b === "number") {
      if (deepArgs.numberGranularity === NumberComparisonGranularity.Custom) {
        return deepArgs.numberGranularityCustom(a, b);
      } else if (deepArgs.numberGranularity === NumberComparisonGranularity.Default) {
        return Math.abs(a - b) <= Number.EPSILON;
      } else {
        return (
          Math.abs(a - b) <= deepArgs.numberGranularity ||
          /* Frickin IEEE754 floating point */
          (deepArgs.numberGranularity === 0.1 &&
            Math.abs(a - b)
              .toFixed(18)
              .localeCompare("0.100000000000000089") === 0) ||
          (deepArgs.numberGranularity === 0.01 &&
            Math.abs(a - b)
              .toFixed(18)
              .localeCompare("0.010000000000000009") === 0)
        );
      }
    }
    if (
      aAndBAreBothDates &&
      typeof a === "object" &&
      a instanceof Date &&
      typeof b === "object" &&
      b instanceof Date
    ) {
      return (
        DateHelper.diffDates(a, b, deepArgs.dateGranularity, deepArgs.dateGranularityCustom)
          .amount === 0
      );
    }
    if (aAndBAreBothArrays && Array.isArray(a) && Array.isArray(b)) {
      // Note that unlike areTheSame, deepEquals checks order of array items also
      return (
        BasicUtilities.haveEqualLength(a, b) &&
        BasicUtilities.haveEqualElementsByIndex(a, b, deepArgs)
      );
    }
    if (aAndBAreBothObjects && typeof a === "object" && typeof b === "object") {
      if (BasicUtilities.areBothNull(a, b)) {
        // Since typeof null === 'object', but running Object.entries(null) throws a TypeError.
        return true;
      }
    }
    // Deep equals compares the entries of each object
    if (
      aAndBAreBothObjects &&
      !aAndBAreBothNull &&
      typeof a === "object" &&
      typeof b === "object" &&
      a !== null &&
      b !== null
    ) {
      const aEntries = Object.entries(a);
      const bEntries = Object.entries(b);
      // Uses an array comparison of the result of Object.entries using deepEquals
      return BasicUtilities.deepEqualsArrays(aEntries, bEntries, deepArgs);
    }
    if (aAndBAreBothFunctions && typeof a === "function" && typeof b === "function") {
      // for functions, we're just checking their "toString" output and "name" values.
      return a.name === b.name && a.toString() === b.toString();
    }
    if (aAndBAreBothStrings && typeof a === "string" && typeof b === "string") {
      return (
        BasicUtilities.haveEqualLength(a, b) &&
        BasicUtilities.haveEqualElementsByIndex([...a], [...b], deepArgs)
      );
    }

    return false;
  }
  /**
   * Converts the first letter of a string to upper case and the rest to lower case.
   * @param {string} value The variable to inspect, copy, and alter.
   * @returns {string | boolean} The `value`, with the first letter in upper case and subsequent letters in lower case,
   * or false if `value` is not a string.
   */
  static firstCapital(value) /* asserts value is a string */ {
    return (
      BasicUtilities.isStringWithContent(value) &&
      (value.length < 2
        ? value.toUpperCase()
        : `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`)
    );
  }
  /**
   * Converts a string to title case.
   * @param {string} value The variable to inspect, copy, and alter.
   * @returns {string | boolean} The `value`, with every word in it set to have its initial letter in upper case
   * and subsequent letters in lower case, or false if `value` is not a string.
   */
  static titleCase(value) /* asserts value is a string */ {
    return (
      BasicUtilities.isStringWithContent(value) &&
      value.replace(/\b\w\b/g, (word) => "" + BasicUtilities.firstCapital(word))
    );
  }
  /**
   * Parses a boolean value from a string or other type.
   * @param {string | unknown | null | undefined} value The variable to inspect.
   * @returns {boolean} true if `value` is a string and one of 'true', 'yes', 'y', or '1' when set to lower case, or if `value` is
   * of any other type, and applying `!!` to it returns true; otherwise, false.
   */
  static parseBoolean(value) {
    if (typeof value === "string") {
      // array of common 'true' values; more nuanced than any string = true.
      return ["true", "yes", "y", "1"].includes(value.toLowerCase());
    } else {
      return !!value;
    }
  }
}
