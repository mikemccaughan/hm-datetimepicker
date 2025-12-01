import DatePart, { DatePartCollection } from "../DatePart.mjs";
import {
  stringsToFormatMap,
  unitToSetter,
  validateFormats,
  validateOptions,
} from "./common.mjs";
import format from "./formatter.mjs";

/**
 * @typedef trySetDatePartFromPartResult The result of an attempt to set a part of a date
 * @property {boolean} success true if the part was set; otherwise, false
 * @property {any} value The value of the part set (probably a number)
 */
/**
 * Attempts to set the part of the date specified.
 * @param {string} value The value being parsed
 * @param {DatePart} part The part being parsed
 * @param {Date} date The Date under construction
 * @param {ParseFormatOptions} options The options for parsing
 * @returns {trySetDatePartFromPartResult} The result of setting the part.
 */
function trySetDatePartFromPart(value, part, date, options) {
  if (!part || part.index == null) {
    console.error(
      `The part specified, ${part ? JSON.stringify(part) : part}, is not valid`
    );
    return { success: false };
  }
  const indexOfPartEndByAlphaNum = options.indexesOfNonAlphaNumChars.find(
    (i) => i > part.index
  );
  const indexOfPartEndByNum = options.indexesOfNonNumChars.find(
    (i) => i > part.index
  );
  const endingIndex = Math.max(
    Math.min(
      indexOfPartEndByAlphaNum ?? Number.POSITIVE_INFINITY,
      indexOfPartEndByNum ?? Number.POSITIVE_INFINITY
    ),
    part.index + part.length
  );
  if (part.end !== endingIndex) {
    part.length = part.end - part.index;
  }
  let partValue = value.slice(part.index, part.end).replace(/[^\p{N}]/gu, "");
  //console.log(partValue);
  if (!Number.isNaN(+partValue) && +partValue !== 0) {
    if (part.name.startsWith("month")) {
      partValue = +partValue - 1;
    }
    part.setter?.(date, +partValue, options.timeZone === "UTC");
    return { success: true, value: partValue };
  } else {
    console.warn(
      `The ${part.name} portion, "${value.slice(
        part.index,
        part.end
      )}" was not able to be parsed as a number; #trySetDatePartFromPart`
    );
  }

  return { success: false };
}
/**
 * Uses parts pulled from a format to create a Date from a string value, using options.
 * @param {string} value The original string getting parsed
 * @param {DatePartCollection} parts An array of objects representing the parts of a Date that have been parsed from value
 * @param {ParseFormatOptions} options Optional hash of overrides for the properties set on the object.
 * @returns {Date} The Date value parsed by using the parts to extract data from value.
 */
function getDateFromParts(value, parts, options) {
  // Currently only parsing numeric values and month names, but not weekdays; not sure what to do with a weekday even if I did
  // parse it successfully; Given a year, a month, and a day, I'd already know the weekday, so what if the parsed one is
  // different? If I get a year, a month, and a weekday, I'd need a week number to know what day it is, and there currently is no
  // token for week number.
  const nonAlphaNumChars = new Set(
    [...value].filter((c) => /[^\p{L}\p{N}]/u.test(c))
  );
  const indexesOfNonAlphaNumChars = [...value]
    .map((c, i) => (nonAlphaNumChars.has(c) ? i : null))
    .filter((i) => i !== null);
  options.indexesOfNonAlphaNumChars = indexesOfNonAlphaNumChars;
  const nonNumChars = new Set([...value].filter((c) => /[^\p{N}]/u.test(c)));
  const indexesOfNonNumChars = [...value]
    .map((c, i) => (nonNumChars.has(c) ? i : null))
    .filter((i) => i !== null);
  options.indexesOfNonNumChars = indexesOfNonNumChars;
  let month;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const yearPart = parts.getByType("year");
  if (!trySetDatePartFromPart(value, yearPart, date, options).success) {
    console.warn(
      `Did not set the year portion of the date in "${value}", keeping as ${date.getFullYear()}...`
    );
  }
  const monthPart = parts.getByType("month");
  if (!trySetDatePartFromPart(value, monthPart, date, options).success) {
    // map month names
    const form = monthPart.month;
    const months = new Array(12)
      .fill(0)
      .map((_, i) => new Date(2021, i, 1)) // not a leap year
      .map((d) => d.toLocaleString(options.locales, { month: form }));
    month = months.indexOf(value.slice(monthPart.index, monthPart.end));
    if (month > -1) {
      //console.log('month', month);
      monthPart.setter?.(date, month, options.timeZone === "UTC");
    } else {
      console.warn(
        `The month portion, "${value.slice(
          monthPart.index,
          monthPart.end
        )}" was not able to be parsed as a month name`
      );
    }
  }
  const dayPart = parts.getByType("day");
  if (!trySetDatePartFromPart(value, dayPart, date, options).success) {
    console.warn(
      `Did not set the day portion of the date in "${value}", keeping as ${date.getDate()}...`
    );
  }
  const hourPart = parts.getByType("hour");
  if (!trySetDatePartFromPart(value, hourPart, date, options).success) {
    console.warn(
      `Did not set the hour portion of the date in "${value}", keeping as ${date.getHours()}...`
    );
  }
  const minutePart = parts.getByType("minute");
  if (!trySetDatePartFromPart(value, minutePart, date, options).success) {
    console.warn(
      `Did not set the minute portion of the date in "${value}", keeping as ${date.getMinutes()}...`
    );
  }
  const secondPart = parts.getByType("second");
  if (!trySetDatePartFromPart(value, secondPart, date, options).success) {
    console.warn(
      `Did not set the second portion of the date in "${value}", keeping as ${date.getSeconds()}...`
    );
  }
  const millisecondPart =
    parts.getByType("fractionalSecondDigits") ?? parts.getByType("millisecond");
  if (!trySetDatePartFromPart(value, millisecondPart, date, options).success) {
    console.warn(
      `Did not set the millisecond portion of the date in "${value}", keeping as ${date.getMilliseconds()}...`
    );
  }
  return date;
}

/**
 * 
 * @param {string} format The format string for the value being parsed, with the date parts replaced with underscores (_). This happens during the parse function.
 * @returns {DatePart[]|Partial<DatePart>[]} The DatePart object representing the literal strings
 */
function parseLiteralsFromFormat(format) {
  const literalsPass0 = [...format];
  const literalsPass1 = literalsPass0.map((char, index) =>
    char === "_" ? null : [index, char]
  );
  const literalsPass2 = literalsPass1.filter((item) => item != null);
  const literalsPass3 = literalsPass2.reduce(
    (agg, [index, value], idx, arr) => [
      ...agg,
      arr[idx - 1]?.[0] === index - 1
        ? [index, `${arr[idx - 1][1]}${value}`]
        : arr[idx + 1]?.[0] === index + 1
        ? undefined
        : !(arr[idx - 1]?.[0] === index - 1) &&
          !(arr[idx + 1]?.[0] === index + 1)
        ? [index, value]
        : undefined,
    ],
    []
  );
  const literalsPass4 = literalsPass3.filter((f) => f !== undefined);
  const literalsPass5 = literalsPass4.map(([index, value], idx) => ({
    type: "literal",
    name: `literal${idx}`,
    index,
    value,
  }));

  const literals = literalsPass5.map((literal) => new DatePart(literal));
  return literals;
}

/**
 * Parses a value as a Date, using the browser's current time zone offset, locale, and format by default
 * @param {string|number|Date|object|null|undefined} value The value to parse as a Date object
 * @param {ParseFormatOptions|undefined} options The (optional) options to use when parsing the value as a Date
 * @returns {Date|null|undefined} The value, parsed as a Date, or null or undefined, if the value is either of those values.
 * @description Note that locale in this case refers to a BCP47 language tags, not a location.
 * The term "locale" is used in the ECMA-262 (ECMAScript/JavaScript) and ECMA-402 (ECMAScript Internationalization API) standards.
 * The following extension keys are allowed: `nu` (Numbering system), `ca` (Calendar), and `hc` (Hour cycle), although these may be set as separate properties in the options as well.
 * `options` may include any of the properties available to options passed to the Intl.DateTimeFormat constructor as well.
 */
export default function parse(value, options) {
  if (value == null) {
    return value;
  }
  let { formats } = (options = validateOptions(options));
  let result = new Date(undefined);
  if (value == null) {
    console.warn("parse: value is undefined or null");
    return value;
  }
  if (value instanceof Date) {
    console.warn("parse: value is Date object");
    return value;
    // value = format(value, options);
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    console.warn("parse: value is number");
    return new Date(value);
    // value = format(new Date(value), options);
  }
  // value is string
  if (value.length === 0) {
    console.warn("parse: value is empty string");
    // Invalid Date
    return result;
  }
  let parts = new DatePartCollection();
  formats = validateFormats(formats).value ?? [];
  while (formats.some((f) => Array.isArray(f))) {
    formats = formats.flat();
  }
  let formatUsed = formats?.[0];
  const stringsToFind = Object.keys(stringsToFormatMap).filter((s) =>
    (formats ?? []).some((f) => f.includes(s))
  );
  let date;
  for (let f of formats) {
    formatUsed = f;
    f = f === "iso" ? "y-MM-ddTHH:mm:ss.fffZ" : f;
    for (let stringToFind of stringsToFind) {
      while (f.includes(stringToFind)) {
        let part = new DatePart({ ...stringsToFormatMap[stringToFind] });
        part.setter = unitToSetter[stringToFind.at(0)];
        part.index = f.indexOf(stringToFind);
        part.length = ["y", "yyyy"].includes(stringToFind)
          ? 4 /* Have to put a number on it */
          : part[part.type]?.includes("2")
          ? 2
          : stringToFind.length;
        parts = parts.add(part, false);
        f = f.replace(stringToFind, "_".repeat(part.length));
      }
      if (!stringsToFind.some((s) => f.includes(s))) {
        break;
      }
    }
    if (!stringsToFind.some((s) => f.includes(s))) {
      const literals = parseLiteralsFromFormat(f);
      parts = new DatePartCollection([...parts, ...literals]);
      parts = parts.reindex();
      date = getDateFromParts(value, parts, options);
      // now format it back to see if we get the same thing back
      const reformatted = format(date, options);
      if (reformatted === value) {
        break;
      }

      continue;
    }
  }

  return date;
}
