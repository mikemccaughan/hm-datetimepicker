import DateHelper from "./DateHelper.mjs";
import { LogLevel, Logger } from "./Logger.mjs";
/**
 * A specific part of a date. See #validTypes for a list of parts.
 */
export default class DatePart {
  #name;
  #index;
  #length;
  #value;
  #type;
  #setter;
  #onLengthChanged;
  #onIndexChanged;

  constructor(type, value, index, length, setter) {
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
    if (typeof type === "string") {
      this.type = type;
    } else if (typeof type === "object") {
      this.index = type.index;
      this.value = type.value;
      this.type = type.type;
      this.name = type.name;
      this.setter =
        type.setter ?? type.type?.length
          ? DateHelper.unitToSetter[type.type[0]] ??
            DateHelper.unitToSetter[type.type[0].toUpperCase()]
          : undefined;
      this.length = type.length;
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
   * @param {DatePart} part The part of the date to guess more infomration about
   * @returns {DatePart} A more fleshed out object with more formatting information
   */
  static buildFromFormattedPart(part) {
    const returnValue = new DatePart({
      ...part,
      length: part.value.length,
    });
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
            if (isNaN(parseInt(part.value, 10))) {
              returnValue.month = "narrow";
            } else {
              returnValue.month = "numeric";
            }
          } else if (returnValue.length === 2) {
            if (part.value[0] === "0") {
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
          if (returnValue.length === 2 && part.value[0] === "0") {
            returnValue[part.type] = "2-digit";
          } else {
            returnValue[part.type] = "numeric";
          }
          break;
        case "millisecond":
          returnValue.millisecond = returnValue.length.toString();
          break;
        case "fractionalSecondDigits":
          returnValue.fractionalSecondDigits = returnValue.length.toString();
          break;
        case "timeZoneName":
          if (returnValue.length <= 2) {
            returnValue.timeZoneName = "shortGeneric";
          } else if (/^GMT(\+|−)\d{4}$/.test(part.value)) {
            returnValue.timeZoneName = "longOffset";
          } else if (/^GMT(\+|−)\d+$/.test(part.value)) {
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
          returnValue.literal = part.value;
          break;
        default:
          break;
      }
    }
    return returnValue;
  }

  get onIndexChanged() {
    return this.#onIndexChanged;
  }
  set onIndexChanged(value) {
    if (this.#onIndexChanged !== value && typeof value === "function") {
      this.#onIndexChanged = value;
    }
  }

  get onLengthChanged() {
    return this.#onLengthChanged;
  }
  set onLengthChanged(value) {
    if (this.#onLengthChanged !== value && typeof value === "function") {
      this.#onLengthChanged = value;
    }
  }

  /**
   * {number|undefined} The index of the start of the date part in the string value;
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
   * {number|undefined} The length of the date part in the string value
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
   * {number} The index of the end of the date part in the string value
   */
  get end() {
    return this.index + this.length;
  }

  /**
   * {number|string|undefined} The value of the date part in the string value (mainly used for literals)
   */
  get value() {
    return this.#value;
  }
  set value(value) {
    if (this.#value !== value) {
      this.#value = value;
      this.#length = value.length;
    }
  }

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
   * {string|undefined} The type of date part (date part or "literal")
   */
  get type() {
    return this.#type;
  }
  set type(value) {
    if (this.#type !== value) {
      if (this.#validTypes.includes(value)) {
        this.#type = value;
      } else {
        const error = `The value "${value}" is not a valid DatePart type`;
        Logger.error(error);
        throw new Error(error);
      }
    }
  }

  /**
   * {DatePartSetter|undefined} The function to use to set the date part in a Date object
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
        Logger.error(error);
        throw new Error(error);
      }
    }
  }

  /**
   * {string|undefined} The name of the part (can be any string value)
   */
  get name() {
    return this.#name;
  }
  set name(value) {
    if (this.#name !== value) {
      this.#name = value;
    }
  }

  get millisecond() {
    return this.fractionalSecondDigits;
  }
  set millisecond(value) {
    if (this.fractionalSecondDigits !== value) {
      this.fractionalSecondDigits = value;
    }
  }

  // Each valid type of date part has its own property, each with its own default.
  literal = undefined;
  dateStyle = undefined;
  timeStyle = undefined;
  calendar = "gregory";
  dayPeriod = undefined;
  numberingSystem = "latn";
  localeMatcher = "best fit";
  timeZone = "UTC";
  hour12 = undefined;
  hourCycle = "h23";
  formatMatcher = "best fit";
  weekday = undefined;
  era = undefined;
  year = undefined;
  month = undefined;
  day = undefined;
  hour = undefined;
  minute = undefined;
  second = undefined;
  fractionalSecondDigits = undefined;
  /**
   * Defines how the time zone will be formatted. Note that not all values are supported on all platforms.
   */
  timeZoneName = undefined;

  static sortMe(a, b) {
    return (a.index ?? 0) - (b.index ?? 0);
  }
}

/**
 * Provides a structured collection of DatePart objects so that adding, removing, and moving
 * parts within the collection is easier.
 */
export class DatePartCollection extends Set {
  /**
   * Creates an instance of a collection of DatePart objects
   * @param {DatePart[]|undefined} parts An array of DatePart objects to add to this
   * collection, or undefined to create an empty collection.
   */
  constructor(parts) {
    if (!parts || parts.length === 0) {
      super();
    } else {
      const values = Array.from(parts).map((part, idx, arr) => {
        const newPart = new DatePart(part);
        if (!"index" in part) {
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
          !part.type in part && // There is no property named for the type (e.g., part.month where part.type === 'month')
          "value" in part &&
          part.value != null // part.value is filled in
        ) {
          newPart = {
            ...newPart,
            ...DatePart.buildFromFormattedPart(part),
          };
        }
        return newPart;
      });
      values.sort(DatePart.sortMe);
      super(values);
    }
  }
  /**
   * Adds a part to the collection.
   * @param {DatePart} part The DatePart to add (part.index will determine where it will be added; at the end if index is undefined or null)
   */
  add(part, runCompleted = false) {
    const values = [...this];
    if ("index" in part && part.index != null) {
      if (!"length" in part || part.length == null) {
        if ("value" in part && part.value != null) {
          part.length = part.value.length;
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
        partsAfter.forEach((p) => (p.index += part.length));
      } else if ("length" in part && part.length != null && partsAfter.length) {
        const idx = values.findIndex((p) => p.index === partsAfter.at(0).index);
        partsAfter.forEach((p) => (p.index += part.length));
      }
    } else if (values.length) {
      const { index, length } = values.at(-1);
      const lastIndex = {
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
      part.length = part.value?.length ?? 1;
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
  partIndexChanged(part, index) {
    this.reindex();
  }
  partLengthChanged(part, length) {
    this.reindex();
  }
  sortAndReplace(values) {
    values.sort(DatePart.sortMe);
    super.clear();
    for (const value of values) {
      super.add(value);
    }
    return this;
  }
  reindex(values) {
    values = values ?? [...this];
    values.sort(DatePart.sortMe);
    let index = 0;
    let lastIndex = -1;
    let lastLength = -1;
    for (const part of values) {
      if (index === 0) {
        if (part.index !== 0) {
          Logger.warn(
            `The first part by index does not have an index of 0, which is odd, so we're setting it now!`
          );
          part.index = 0;
        }
      } else if (part.index !== lastIndex + lastLength) {
        Logger.warn(
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
  getByType(type) {
    return [...this].find((p) => p.type === type);
  }
  hasType(type) {
    return [...this].some((p) => p.type === type);
  }
}
