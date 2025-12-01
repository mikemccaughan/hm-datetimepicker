/**
 * Sets the portion of the date associated with a particular DatePart to the given value
 * @callback DatePart~setter
 * @param {Date} date The Date whose year portion will be set
 * @param {number} value The value to which to set the year
 * @param {boolean=} [useUTC=true] true (default) to use UTC method to set the year; otherwise will use local date method.
 * @returns {void}
 */

import DateTimeFormattingOptions from "./DateTimeFormattingOptions.mjs";

/**
 * @typedef {(date: Date, value: number, useUTC: boolean) => void} DatePartSetter Sets the year portion of the date to the given value
 * @param {Date} date The Date whose year portion will be set
 * @param {number} value The value to which to set the year
 * @param {boolean=} [useUTC=true] true (default) to use UTC method to set the year; otherwise will use local date method.
 * @returns {void}
 */

/**
 * @typedef {"literal"|"dateStyle"|"timeStyle"|"calendar"|"dayPeriod"|"numberingSystem"|"localeMatcher"|"timeZone"|"hour12"|"hourCycle"|"formatMatcher"|"weekday"|"era"|"year"|"month"|"day"|"hour"|"minute"|"second"|"fractionalSecondDigits"|"millisecond"|"timeZoneName"} DatePartType
 */

/**
 * A specific part of a date. See #validTypes for a list of parts.
 */
export default class DatePart {
  /**
   * @type {string|undefined}
   */
  #name;
  /**
   * @type {number|undefined}
   */
  #index;
  /**
   * @type {number|undefined}
   */
  #length;
  /**
   * @type {string|number|undefined}
   */
  #value;
  /**
   * @type {DatePartType|undefined}
   */
  #type;
  /**
   * @type {string|undefined}
   */
  #field;
  /**
   * @type {boolean|undefined}
   */
  #isStyle;
  /**
   * @type {DatePartSetter|undefined}
   */
  #setter;
  /**
   * @type {function|undefined}
   */
  #onLengthChanged;
  /**
   * @type {function|undefined}
   */
  #onIndexChanged;

  /**
   * @param {DatePartType|Partial<DatePart>|undefined} type The type of DatePart
   * @param {string|number|undefined} value The value of the DatePart
   * @param {number|undefined} index The index of the DatePart
   * @param {number|undefined} length The length of the DatePart
   * @param {DatePartSetter|undefined} setter The function which sets the DatePart in the date
   */
  constructor(
    type,
    value = undefined,
    index = undefined,
    length = undefined,
    setter = undefined
  ) {
    if (typeof setter === "function") {
      this.setter = setter;
    }
    if (typeof length === "number") {
      this.length = length;
    }
    if (typeof index === "number") {
      this.index = index;
    }
    this.value = value;
    if (typeof type === "string" && this.#validTypes.includes(type)) {
      this.type = this.getValidType(type);
    } else if (typeof type === "object") {
      this.index = type.index;
      this.value = type.value;
      this.type = type.type;
      this.name = type.name;
      this.setter = type.setter;
      this.length = type.length ?? type.value?.toString()?.length;
      this.calendar = type.calendar;
      this.dateStyle = type.dateStyle;
      this.day = type.day;
      this.dayPeriod = type.dayPeriod;
      this.era = type.era;
      this.formatMatcher = type.formatMatcher ?? "best fit";
      this.fractionalSecondDigits =
        type.fractionalSecondDigits ?? type.millisecond;
      this.hour = type.hour;
      this.hour12 = type.hour12 ?? type.name?.startsWith("hour-h1");
      this.hourCycle = type.hourCycle;
      this.literal = type.literal;
      this.localeMatcher = type.localeMatcher ?? "best fit";
      this.millisecond = this.fractionalSecondDigits ?? type.millisecond;
      this.minute = type.minute;
      this.month = type.month;
      this.numberingSystem = type.numberingSystem ?? "latn";
      this.second = type.second;
      this.timeStyle = type.timeStyle;
      this.timeZone = type.timeZone;
      this.timeZoneName = type.timeZoneName;
      this.weekday = type.weekday;
      this.year = type.year;
      this.onIndexChanged = type.onIndexChanged;
      this.onLengthChanged = type.onLengthChanged;
    }
  }
  /**
   * Uses basic heuristics to get better formatting information, based on the results
   * of formatting the date using some defaults.
   * @param {DatePart|Partial<DatePart>} part The part of the date to guess more information about
   * @returns {DatePart} A more fleshed out object with more formatting information
   */
  static buildFromFormattedPart(part) {
    const returnValue = new DatePart(part);
    returnValue.length ??= part.value?.toString()?.length
    if (!part[part.type]) {
      switch (part.type) {
        case "era":
        case "dayPeriod":
          if (returnValue.length === 1) {
            returnValue[part.type] = "narrow";
          } else if (returnValue.length === 2) {
            returnValue[part.type] = "short";
          } else {
            returnValue[part.type] = "long";
          }
          break;
        case "weekday":
          if (returnValue.length === 1) {
            returnValue.weekday = "narrow";
          } else if (returnValue.length === 3) {
            returnValue.weekday = "short";
          } else {
            returnValue.weekday = "long";
          }
          break;
        case "month":
          if (returnValue.length === 1) {
            if (isNaN(parseInt(part.value?.toString(), 10))) {
              returnValue.month = "narrow";
            } else {
              returnValue.month = "numeric";
            }
          } else if (returnValue.length === 2) {
            if (part.value?.toString()?.[0] === "0") {
              returnValue.month = "2-digit";
            } else {
              returnValue.month = "numeric";
            }
          } else if (returnValue.length === 3) {
            returnValue.month = "short";
          } else {
            returnValue.month = "long";
          }
        case "year":
        case "day":
        case "hour":
        case "minute":
        case "second":
          if (returnValue.length === 2 && part.value?.toString()?.[0] === "0") {
            returnValue[part.type] = "2-digit";
          } else {
            returnValue[part.type] = "numeric";
          }
          break;
        case "millisecond":
          if ([0, 1, 2, 3].includes(returnValue.length)) {
            returnValue.millisecond = returnValue.length;
          }
          break;
        case "fractionalSecondDigits":
          if ([0, 1, 2, 3].includes(returnValue.length)) {
            returnValue.fractionalSecondDigits = returnValue.length;
          }
          break;
        case "timeZoneName":
          if (returnValue.length <= 2) {
            returnValue.timeZoneName = "shortGeneric";
          } else if (/^GMT(\+|−)\d{4}$/.test(part.value?.toString())) {
            returnValue.timeZoneName = "longOffset";
          } else if (/^GMT(\+|−)\d+$/.test(part.value?.toString())) {
            // Note that some implementations use this format for "short" also
            // Consumers should provide the proper value instead of making me guess
            // if they want better control
            returnValue.timeZoneName = "shortOffset";
          } else if (returnValue.length === 3) {
            returnValue.timeZoneName = "short";
          } else {
            // No way to distinguish between "long", "longGeneric", and some values
            // of "shortGeneric". Also, implementations can fallback to another value
            // if the one their looking for is not present.
            returnValue.timeZoneName = "long";
          }
        case "literal":
          returnValue.literal = part.value?.toString();
          break;
        default:
          break;
      }
    }
    return returnValue;
  }

  /**
   * @type {function|undefined} A function called when the index property is changed.
   */
  get onIndexChanged() {
    return this.#onIndexChanged;
  }
  set onIndexChanged(value) {
    if (this.#onIndexChanged !== value && typeof value === "function") {
      this.#onIndexChanged = value;
    }
  }

  /**
   * @type {function|undefined} A function called when the length property is changed.
   */
  get onLengthChanged() {
    return this.#onLengthChanged;
  }
  set onLengthChanged(value) {
    if (this.#onLengthChanged !== value && typeof value === "function") {
      this.#onLengthChanged = value;
    }
  }

  /**
   * @type {number|undefined} index The index of the start of the date part in the string value;
   */
  get index() {
    return this.#index;
  }
  set index(value) {
    if (this.#index !== value) {
      this.#index = value;
      if (typeof this.#onIndexChanged === "function") {
        this.#onIndexChanged(this, value);
      }
    }
  }

  /**
   * @type {number|undefined} length The length of the date part in the string value
   */
  get length() {
    return this.#length;
  }
  set length(value) {
    if (this.#length !== value) {
      this.#length = value;
      if (typeof this.#onLengthChanged === "function") {
        this.#onLengthChanged(this, value);
      }
    }
  }

  /**
   * @type {number} end The read-only index of the end of the date part in the string value
   */
  get end() {
    return this.index + this.length;
  }

  /**
   * @type {number|string|undefined} value The value of the date part in the string value (mainly used for literals)
   */
  get value() {
    return this.#value;
  }
  set value(value) {
    if (this.#value !== value) {
      this.#value = value;
      if (value != null) {
        this.length ??= value.toString().length;
      }
    }
  }

  /**
   * An array of the valid values for the type property.
   */
  #validTypes = [
    "literal",
    "dateStyle",
    "timeStyle",
    "calendar",
    "dayPeriod",
    "numberingSystem",
    "localeMatcher",
    "timeZone",
    "hour12",
    "hourCycle",
    "formatMatcher",
    "weekday",
    "era",
    "year",
    "month",
    "day",
    "hour",
    "minute",
    "second",
    "fractionalSecondDigits",
    "millisecond",
    "timeZoneName",
  ];

  /**
   * Ensures value is a valid value for the type property, or undefined.
   * @param {string|undefined} value The value for consideration.
   * @returns {DatePartType|undefined} The value, converted to a DatePartType or undefined;
   */
  getValidType(value) {
    return (
      (typeof value === "string" &&
        this.#validTypes.includes(value) &&
        value) ||
      undefined
    );
  }

  /**
   * The type of date part (date part or "literal")
   * @type {DatePartType|undefined}
   */
  get type() {
    return this.#type;
  }
  set type(value) {
    if (this.#type !== value) {
      if (this.#validTypes.includes(value)) {
        this.#type = this.getValidType(value);
      } else {
        const error = `The value "${value}" is not a valid DatePart type`;
        console.error(error);
        throw new Error(error);
      }
    }
  }

  /**
   * The field of the date part in the format (the "format string"; e.g., "MM" in "MM/dd/y")
   * @type {string|undefined}
   */
  get field() {
    return this.#field;
  }
  set field(value) {
    if (this.#field !== value) {
      this.#field = value;
      this.length ??= value.toString().length;
    }
  }

  /**
   * true if the part is meant for formatting the entirety of a date, time, or both; otherwise, false or undefined.
   * @type {boolean|undefined}
   */
  get isStyle() {
    return this.#isStyle;
  }
  set isStyle(value) {
    if (this.#isStyle !== value) {
      if (typeof value === "boolean") {
        this.#isStyle = value;
      } else {
        const error = `The value "${value}" is not valid for DatePart isStyle`;
        console.error(error);
        throw new Error(error);
      }
    }
  }

  /**
   * The function to use to set the date part in a Date object
   * @type {DatePartSetter|undefined}
   */
  get setter() {
    return this.#setter;
  }
  set setter(value) {
    if (this.#setter !== value) {
      if (typeof value === "function") {
        this.#setter = value;
      } else {
        const error = `setter must be set to a function that sets the date part to the given value, received ${value}`;
        console.error(error);
        throw new Error(error);
      }
    }
  }

  /**
   * The name of the part (can be any string value)
   * @type {string|undefined}
   */
  get name() {
    return this.#name;
  }
  set name(value) {
    if (this.#name !== value) {
      this.#name = value;
    }
  }

  /**
   * The number of digits of the fractional second to show.
   * @alias fractionalSecondDigits
   * @type {"0"|"1"|"2"|"3"|0|1|2|3|undefined}
   */
  get millisecond() {
    return this.fractionalSecondDigits;
  }
  set millisecond(value) {
    if (this.fractionalSecondDigits !== value) {
      this.fractionalSecondDigits = value;
    }
  }

  // Each valid type of date part has its own property, each with its own default.
  /**
   * A literal value
   * @type {string | undefined}
   */
  literal = undefined;
  /**
   * The style with which to format the date
   * @type {"long"|"short"|"narrow"|undefined}
   */
  dateStyle = undefined;
  /**
   * The style with which to format the time
   * @type {"long"|"short"|"narrow"|undefined}
   */
  timeStyle = undefined;
  /**
   * The calendar to use
   * @type {"buddhist"|"chinese"|"coptic"|"dangi"|"ethioaa"|"ethiopic"|"gregory"|"hebrew"|"indian"|"islamic"|"islamic-umalqura"|"islamic-tbla"|"islamic-civil"|"islamic-rgsa"|"iso8601"|"japanese"|"persian"|"roc"|undefined}
   */
  calendar = "gregory";
  /**
   * The format to use when parsing or formatting the day period ("am", "pm", "in the morning")
   * @type {"long"|"short"|"narrow"|undefined}
   */
  dayPeriod = undefined;
  /**
   * The numbering system to use
   * @type {"arab"|"arabext"|"bali"|"beng"|"deva"|"fullwide"|"gujr"|"guru"|"hanidec"|"khmr"|"knda"|"laoo"|"latn"|"limb"|"mlym"|"mong"|"mymr"|"orya"|"tamldec"|"telu"|"thai"|"tibt"|undefined}
   */
  numberingSystem = "latn";
  /**
   * The matching algorithm to use for the locale.
   * @type {"lookup"|"best fit"|undefined}
   */
  localeMatcher = "best fit";
  /**
   * The time zone in which to format or parse date time values.
   * @type {"UTC"|string|undefined}
   */
  timeZone = "UTC";
  /**
   * true to format or parse the hour using 12-hour times (e.g., 12am, 3pm); false to format or parse the hour using 24-hour time (e.g., 0 (or 24 if hourCycle is "h24"), 15)
   * @type {boolean|undefined}
   */
  hour12 = undefined;
  /**
   * The hour cycle to use.
   * @type {"h11"|"h12"|"h23"|"h24"|undefined}
   */
  hourCycle = "h23";
  /**
   * The matching algorithm to use for the format.
   * @type {"basic"|"best fit"|undefined}
   */
  formatMatcher = "best fit";
  /**
   * How to format weekdays. Ignored when parsing.
   * @type {"long"|"short"|"narrow"|undefined}
   */
  weekday = undefined;
  /**
   * The format to use when parsing or formatting the era of the date.
   * @type {"long"|"short"|"narrow"|undefined}
   */
  era = undefined;
  /**
   * The format to use when parsing or formatting the year of the date.
   * @type {"numeric"|"2-digit"|undefined}
   */
  year = undefined;
  /**
   * The format to use when parsing or formatting the month of the date.
   * @type {"numeric"|"2-digit"|"long"|"short"|"narrow"|undefined}
   */
  month = undefined;
  /**
   * The format to use when parsing or formatting the day of the date.
   * @type {"numeric"|"2-digit"|undefined}
   */
  day = undefined;
  /**
   * The format to use when parsing or formatting the hour of the date.
   * @type {"numeric"|"2-digit"|undefined}
   */
  hour = undefined;
  /**
   * The format to use when parsing or formatting the minute of the date.
   * @type {"numeric"|"2-digit"|undefined}
   */
  minute = undefined;
  /**
   * The format to use when parsing or formatting the second of the date.
   * @type {"numeric"|"2-digit"|undefined}
   */
  second = undefined;
  /**
   * The format to use when parsing or formatting the fractional seconds of the date.
   * @type {"0"|"1"|"2"|"3"|0|1|2|3|undefined}
   */
  fractionalSecondDigits = undefined;
  /**
   * Defines how the time zone will be formatted. Note that not all values are supported on all platforms.
   * @type {string|undefined}
   */
  timeZoneName = undefined;

  /**
   * Provides a method for sorting DatePart objects.
   * @param {DatePart|undefined} a The first DatePart
   * @param {DatePart|undefined} b The first DatePart
   */
  static sortMe(a, b) {
    return (a.index ?? 0) - (b.index ?? 0);
  }
}

/**
 * Provides a structured collection of DatePart objects so that adding, removing, and moving
 * parts within the collection is easier.
 * @extends Set<DatePart>
 */
export class DatePartCollection extends Set /*<DatePart>*/ {
  /**
   * Creates an instance of a collection of DatePart objects
   * @param {Partial<DatePart>[]|DatePart[]|Iterable<DatePart>|Iterable<Partial<DatePart>>|undefined} parts An array of DatePart objects to add to this
   * collection, or undefined to create an empty collection.
   */
  constructor(parts) {
    if (!parts || [...parts].length === 0) {
      super();
    } else {
      parts.sort(DatePart.sortMe);
      const values = Array.from(parts).map((part, idx, arr) => {
        let newPart = new DatePart(part);
        if (!("index" in part)) {
          if (idx === 0) {
            newPart.index = 0;
          } else if (
            arr
              .slice(0, idx - 1)
              .every((p) => p.index != null && p.length != null)
          ) {
            newPart.index = arr
              .slice(0, idx - 1)
              .reduce((agg, cur) => agg + cur.index + cur.length, 1);
          }
        }
        if (
          "type" in part &&
          part.type != null && // part.type is filled in
          !(part.type in part) && // There is no property named for the type (e.g., part.month where part.type === 'month')
          "value" in part &&
          part.value != null // part.value is filled in
        ) {
          newPart = DatePart.buildFromFormattedPart(newPart);
        }
        return newPart /* as DatePart*/;
      });
      values.sort(DatePart.sortMe);
      super(values);
    }
  }
  /**
   * Adds a part to the collection.
   * @param {DatePart} part The DatePart to add (part.index will determine where it will be added; at the end if index is undefined or null)
   * @param {boolean} runCompleted (optional; default = false) true if the run has completed; otherwise, false
   * @returns {this} The current collection, with the part added.
   */
  add(part, runCompleted = false) {
    const values = [...this];
    if ("index" in part && part.index != null) {
      if (!("length" in part) || part.length == null) {
        if ("value" in part && part.value != null) {
          part.length = part.value.toString().length;
        } else {
          part.length = null;
        }
      }
      const partsAfter = values
        .filter((p) => p.index > part.index)
        .sort(DatePart.sortMe);
      const partAt = values.findIndex((p) => p.index === part.index);
      if (partAt > -1 && "length" in part && part.length != null) {
        values.at(partAt).index = part.end;
        partsAfter.forEach((p) => (p.index = p.index + part.length));
      } else if ("length" in part && part.length != null && partsAfter.length) {
        partsAfter.forEach((p) => (p.index = p.index + part.length));
      }
    } else if (values.length) {
      const { index, length } = values.at(-1);
      let lastIndex = {
        idx: this.size - 1,
        index,
        length,
      };
      if (index == null) {
        lastIndex = values.reduce(
          (agg, cur, idx) =>
            Math.max(agg.index, cur.index) === cur.index
              ? {
                  idx,
                  index: cur.index,
                  length: cur.length,
                }
              : agg,
          { idx: 0, index: 0, length: 0 }
        );
      }
      part.index = lastIndex.index + lastIndex.length;
      part.length = part.value?.toString()?.length ?? 1;
    }

    if (!part.onIndexChanged) {
      part.onIndexChanged = this.partIndexChanged.bind(this);
    }
    if (!part.onLengthChanged) {
      part.onLengthChanged = this.partLengthChanged.bind(this);
    }
    values.push(part);
    if (runCompleted) {
      return this.reindex(values);
    }
    return this.sortAndReplace(values);
  }
  /**
   * Adds an array of parts to the collection.
   * @param {DatePart} part The DateParts to add (part.index of each part will determine where it will be added; at the end if index is undefined or null)
   * @param {boolean} runCompleted (optional; default = false) true if the run has completed; otherwise, false
   * @returns {this} The current collection, with the parts added.
   */
  addRange(parts, runCompleted = false) {
    for (const part of parts.slice(0, -1)) {
      this.add(part, false);
    }
    return this.add(parts.at(-1), runCompleted);
  }
  /**
   * Removes the specified part from the collection.
   * @param {DatePart} part The DatePart to remove
   * @param {boolean} runCompleted (optional; default = false) true if the run has completed; otherwise, false
   * @returns {this} The current collection, with the part removed.
   */
  remove(part, runCompleted = false) {
    const values = [...this];
    if (part.onIndexChanged) {
      part.onIndexChanged = null;
    }
    if (part.onLengthChanged) {
      part.onLengthChanged = null;
    }
    const index = values.findIndex(
      (p) => p.index === part.index && p.type === part.type
    );
    if (index > -1) {
      values.splice(index, 1);
    }
    if (runCompleted) {
      return this.reindex(values);
    }
    return this.sortAndReplace(values);
  }
  /**
   * Runs when the index of a DatePart in the collection changes.
   * @param {DatePart} part The DatePart whose index has changed.
   * @param {number} index The new index.
   * @param {boolean|undefined} reindex true to reindex the collection; otherwise, false (the defaualt)
   */
  partIndexChanged(part, index, reindex = false) {
    console.log(`DatePart ${JSON.stringify(part)} had its index changed to ${index}`);
    if (reindex) {
      this.reindex();
    }
  }
  /**
   * Runs when the length of a DatePart in the collection changes.
   * @param {DatePart} part The DatePart whose length has changed.
   * @param {number} length The new length.
   * @param {boolean|undefined} reindex true to reindex the collection; otherwise, false (the defaualt)
   */
  partLengthChanged(part, length, reindex = false) {
    console.log(`DatePart ${JSON.stringify(part)} had its length changed to ${length}`);
    if (reindex) {
      this.reindex();
    }
  }
  /**
   * Sorts the values that make up the collection, clears the collection,
   * and readds all of the values in index order.
   * @param {DatePart[]} values The array of DateParts that make up the collection.
   * @returns {this} The current collection.
   */
  sortAndReplace(values) {
    values = values.sort(DatePart.sortMe);
    super.clear();
    for (const value of values) {
      super.add(value);
    }
    return this;
  }
  /**
   * Reindexes the collection.
   * @param {DatePart[]|undefined} values The array of DateParts that make up the collection. If undefined or not provided, uses the current values.
   * @returns {this} The current collection, with the values sorted by index and all of the indexes updated to be contiguous.
   */
  reindex(values = undefined) {
    values = values ?? [...this];
    values = values.sort(DatePart.sortMe);
    let index = 0;
    let lastIndex = -1;
    let lastLength = -1;
    for (const part of values) {
      if (index === 0) {
        if (part.index !== 0) {
          console.warn(
            `The first part by index does not have an index of 0, which is odd, so we're setting it now!`
          );
          part.index = 0;
        }
      } else if (part.index !== lastIndex + lastLength) {
        console.warn(
          `This part's index (${part.index}) is not equal to the last part's index (${lastIndex}) plus its length (${lastLength})... Setting it now!`
        );
        part.index = lastIndex + lastLength;
      }
      index++;
      lastIndex = part.index;
      lastLength = part.length;
      if (!part.onIndexChanged) {
        part.onIndexChanged = this.partIndexChanged.bind(this);
      }
      if (!part.onLengthChanged) {
        part.onLengthChanged = this.partLengthChanged.bind(this);
      }
    }
    return this.sortAndReplace(values);
  }
  /**
   * Gets the first DatePart in the collection with the given type.
   * @param {string} type The type of DatePart to find.
   * @param {number|undefined} startAt The index at which to start looking, or undefined to start at 0.
   * @returns The first DatePart with the given type in the collection.
   */
  getByType(type, startAt = 0) {
    return [...this]
      .sort(DatePart.sortMe)
      .find((p, i) => i >= startAt && p.type === type);
  }
  /**
   * Determines whether the collection contains a DatePart of the given type.
   * @param {string} type The type of DatePart to find.
   * @returns {boolean} true if the collection contains a DatePart of the given type; otherwise, false.
   */
  hasType(type) {
    return [...this].some((p) => p.type === type);
  }
  /**
   * Implements the iterable protocol for the DatePartCollection and allows the collection to be consumed by most syntaxes expecting iterables.
   * @returns {IterableIterator<DatePart>} A new iterable iterator object that yields the DateParts in the collection.
   */
  [Symbol.iterator]() {
    return super.values();
  }
  /**
   * 
   * @returns {DateTimeFormattingOptions} The current DatePart data, expressed as a single set of expressions,
   * suitable for passing to DateHelper
   */
  toDateTimeFormattingOptions() /*: DateTimeFormattingOptions */ {
    return DateTimeFormattingOptions.fromDatePart(this);
  }
}
