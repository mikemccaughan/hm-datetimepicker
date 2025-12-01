//import DateHelper from "../DateHelper.mjs";
import DatePart from "../DatePart.mjs";

/**
 * @typedef ParseFormatOptions Options for parsing or formatting a Date
 * @property {string|undefined} timeZone The IANA time zone name or "UTC" (the default)
 * @property {string|string[]|undefined} formats The format used, or an array of such formats to try when parsing. If an array is given when formatting, the first will be used.
 * @property {string[]|undefined} locales The locale used, expressed an array (e.g., a single locale should be provided like ['en-US'])
 * @property {"full"|"long"|"medium"|"short"|undefined} dateStyle The date formatting style to use. Overrides the use of `formats` and any of the individual date parts.
 * @property {"full"|"long"|"medium"|"short"|undefined} timeStyle The time formatting style to use. Overrides the use of `formats` and any of the individual time parts.
 * @property {"buddhist"|"chinese"|"coptic"|"dangi"|"ethioaa"|"ethiopic"|"gregory"|"hebrew"|"indian"|"islamic"|"islamic-umalqura"|"islamic-tbla"|"islamic-civil"|"islamic-rgsa"|"iso8601"|"japanese"|"persian"|"roc"|undefined} calendar The calendar to use. Currently only "gregory" and "japanese" are supported.
 * @property {"narrow"|"short"|"long"|undefined} dayPeriod The way day periods are formatted (e.g., "am"|"noon"|"in the morning"). Only has an effect if hour12 is determined to be true or if hourCycle is determined to be "h11" or "h12".
 * @property {"arab"|"arabext"|"bali"|"beng"|"deva"|"fullwide"|"gujr"|"guru"|"hanidec"|"khmr"|"knda"|"laoo"|"latn"|"limb"|"mlym"|"mong"|"mymr"|"orya"|"tamldec"|"telu"|"thai"|"tibt"|undefined} numberingSystem The numbering system used. Currently only "latn" is supported.
 * @property {"lookup"|"best fit"|undefined} localeMatcher The locale matching algorithm to use. Default is "best fit".
 * @property {boolean} hour12 Whether to use 12-hour time (i.e., not 24-hour time). Defaults to being determined by locale. Overrides the `hc` language tag and the `hourCycle` option when present.
 * @property {"h11"|"h12"|"h23"|"h24"|undefined} hourCycle The hour cycle used. Defaults to being determined by locale. Overrides the `hc` language tag. Overridden by `hour12` if both provided.
 * @property {"basic"|"best fit"|undefined} formatMatcher The format matching algorithm to use. Default is "best fit".
 * @property {"long"|"short"|"narrow"|undefined} weekday Whether the weekday is included. Ignored when parsing.
 * @property {"long"|"short"|"narrow"|undefined} era Whether the era is included. Used with the Japanese Calendar system to determine the correct Gregorian year. Used with the Gregorian calendar if the sign is not provided (e.g., 1 BC = -1, 1 AD = 1).
 * @property {"numeric"|"2-digit"|undefined} year How years are represented in the value. "2-digit" is equivalent to using "yy" in a format.
 * @property {"numeric"|"2-digit"|"long"|"short"|"narrow"|undefined} month How months are represented in the format. "2-digit" is equivalent to using "MM" in a format. See [format tokens](/tokens) for more info.
 * @property {"numeric"|"2-digit"|undefined} day How days are represented in the value. "2-digit" is equivalent to using "dd" in a format.
 * @property {"numeric"|"2-digit"|undefined} hour How the hour is represented in the value. "2-digit" is equivalent to "hh" or "HH" (if hour12 is false or hourCycle is "h23" or "h24") in a format.
 * @property {"numeric"|"2-digit"|undefined} minute How the minute is represented in the value. "2-digit" is equivalent to "mm" in a format.
 * @property {"numeric"|"2-digit"|undefined} second How the second is represented in the value. "2-digit" is equivalent to "ss" in a format.
 * @property {"0"|"1"|"2"|"3"|0|1|2|3|undefined} fractionalSecondDigits The number of digits used to represent fractions of a second (additional digits are truncated). Equivalent to the number of "f" characters in a format.
 * @property {"long"|"short"|"longOffset"|"shortOffset"|"longGeneric"|"shortGeneric"|undefined} timeZoneName How the time zone is represented in the value. Only the "longOffset" and "shortOffset" will be parsed.
 */

/**
 * A regular expression that validates a BCP 47 language tag
 */
export const bcp47re =
  /^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-(?<extension>[0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(?<privateUse>x(-[A-Za-z0-9]{1,8})+))?)|(?<privateUse1>x(-[A-Za-z0-9]{1,8})+))$/;

/**
 * Maps between a format string part and its corresponding option for Intl.DateTimeFormat.
 */
export const stringsToFormatMap = {
  /**
   * Formats to ISO 8601 format (using UTC; same as calling toISOString)
   */
  iso: {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecond: null,
    fractionalSecondDigits: 3,
    timeZone: "UTC",
    isStyle: true,
    name: "iso",
    type: "iso",
  },
  /**
   * Formats a date in a "full" format; cannot be combined with other formatting strings except times with named formats.
   */
  ud: {
    dateStyle: "full",
    isStyle: true,
    name: "date-full",
    type: "date",
  },
  /**
   * Formats a time in a "full" format; cannot be combined with other formatting strings except dates with named formats.
   */
  ut: {
    timeStyle: "full",
    isStyle: true,
    name: "time-full",
    type: "time",
  },
  /**
   * Formats a date and time in a "full" format; cannot be combined with other formatting strings.
   */
  u: {
    dateStyle: "full",
    timeStyle: "full",
    isStyle: true,
    name: "date-time-full",
    type: "date-time",
  },
  /**
   * Formats a date in a "long" format; cannot be combined with other formatting strings except times with named formats.
   */
  ld: {
    dateStyle: "long",
    isStyle: true,
    name: "date-long",
    type: "date",
  },
  /**
   * Formats a time in a "long" format; cannot be combined with other formatting strings except dates with named formats.
   */
  lt: {
    timeStyle: "long",
    isStyle: true,
    name: "time-long",
    type: "time",
  },
  /**
   * Formats a date and time in a "long" format; cannot be combined with other formatting strings.
   */
  l: {
    dateStyle: "long",
    timeStyle: "long",
    isStyle: true,
    name: "date-time-long",
    type: "date-time",
  },
  /**
   * Formats a date in a "medium" format; cannot be combined with other formatting strings except times with named formats.
   */
  ed: {
    dateStyle: "medium",
    isStyle: true,
    name: "date-medium",
    type: "date",
  },
  /**
   * Formats a time in a "medium" format; cannot be combined with other formatting strings except dates with named formats.
   */
  et: {
    timeStyle: "medium",
    isStyle: true,
    name: "time-medium",
    type: "time",
  },
  /**
   * Formats a date and time in a "medium" format; cannot be combined with other formatting strings.
   */
  eu: {
    dateStyle: "medium",
    timeStyle: "medium",
    isStyle: true,
    name: "date-time-medium",
    type: "date-time",
  },
  /**
   * Formats a date in a "short" format; cannot be combined with other formatting strings except times with named formats.
   */
  rd: {
    dateStyle: "short",
    isStyle: true,
    name: "date-short",
    type: "date",
  },
  /**
   * Formats a time in a "short" format; cannot be combined with other formatting strings except dates with named formats.
   */
  rt: {
    timeStyle: "short",
    isStyle: true,
    name: "time-short",
    type: "time",
  },
  /**
   * Formats a date and time in a "short" format; cannot be combined with other formatting strings.
   */
  r: {
    dateStyle: "short",
    timeStyle: "short",
    isStyle: true,
    name: "date-time-short",
    type: "date-time",
  },
  /**
   * Formats the era in a "long" format; e.g. Anno Domini
   */
  GGG: {
    era: "long",
    name: "era-long",
    type: "era",
  },
  /**
   * Formats the era in a "short" format; e.g. AD
   */
  GG: {
    era: "short",
    name: "era-short",
    type: "era",
  },
  /**
   * Formats the era in a "narrow" format; e.g. A
   */
  G: {
    era: "narrow",
    name: "era-narrow",
    type: "era",
  },
  /**
   * Formats the year using the minimum number of digits needed; e.g., 2021, 12 (for the year 12 AD), -12 (for the year 12 BC)
   * Note that while it has four letters, it won't necessarily use four digits.
   */
  yyyy: {
    year: "numeric",
    name: "year-4-digit",
    type: "year",
  },
  /**
   * Formats the year using 2 digits; e.g., 00 refers to any year that ends in 00 (100, 1100, 1900, 2000, etc.)
   */
  yy: {
    year: "2-digit",
    name: "year-2-digit",
    type: "year",
  },
  /**
   * Formats the year using the minimum number of digits needed; e.g., 2021, 12 (for the year 12 AD), -12 (for the year 12 BC)
   */
  y: {
    year: "numeric",
    name: "year-numeric",
    type: "year",
  },
  /**
   * Formats the month name in a "narrow" format; e.g., J, M, D (note that two months can share a narrow name; March is also formatted as M)
   */
  MMMMM: {
    month: "narrow",
    name: "month-narrow",
    type: "month",
  },
  /**
   * Formats the month name in a "long" format; e.g., January, May, December
   */
  MMMM: {
    month: "long",
    name: "month-long",
    type: "month",
  },
  /**
   * Formats the month name in a "short" format; e.g., Jan, May, Dec
   */
  MMM: {
    month: "short",
    name: "month-short",
    type: "month",
  },
  /**
   * Formats the month number using two digits; e.g., 01, 05, 12
   */
  MM: {
    month: "2-digit",
    name: "month-2-digit",
    type: "month",
  },
  /**
   * Formats the month number using the minimum number of digits needed; e.g., 1, 5, 12
   */
  M: {
    month: "numeric",
    name: "month-numeric",
    type: "month",
  },
  /**
   * Formats the weekday name in a "long" format; e.g., Sunday, Thursday, Saturday
   */
  EEEE: {
    weekday: "long",
    name: "weekday-long",
    type: "weekday",
  },
  /**
   * Formats the weekday name in a "short" format; e.g., Sun, Thu, Sat
   */
  EEE: {
    weekday: "short",
    name: "weekday-short",
    type: "weekday",
  },
  /**
   * Formats the weekday name in a "narrow" format; e.g., S, T, S (note that two different days can share a narrow name)
   */
  EEEEE: {
    weekday: "narrow",
    name: "weekday-narrow",
    type: "weekday",
  },
  /**
   * Formats the day using two digits; e.g., 01, 05, 12
   */
  dd: {
    day: "2-digit",
    name: "day-2-digit",
    type: "day",
  },
  /**
   * Formats the day using the minimum number of digits needed; e.g., 1, 5, 12
   */
  d: {
    day: "numeric",
    name: "day-numeric",
    type: "day",
  },
  /**
   * Formats the hour using two digits, on a 24 hour cycle; e.g., 00, 12, 23
   */
  HH: {
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    name: "hour-h23-2-digit",
    type: "hour",
  },
  /**
   * Formats the hour using two digits, on a 12 hour cycle; e.g., 12, 12, 11
   */
  hh: {
    hour: "2-digit",
    hour12: true,
    hourCycle: "h12",
    name: "hour-h12-2-digit",
    type: "hour",
  },
  /**
   * Formats the hour using the minimum number of digits needed, on a 24 hour cycle; e.g., 0, 12, 23
   */
  H: {
    hour: "numeric",
    hour12: false,
    hourCycle: "h23",
    name: "hour-h23-numeric",
    type: "hour",
  },
  /**
   * Formats the hour using the minimum number of digits needed, on a 12 hour cycle; e.g., 12, 12, 11
   */
  h: {
    hour: "numeric",
    hour12: true,
    hourCycle: "h12",
    name: "hour-h12-numeric",
    type: "hour",
  },
  /**
   * Formats the minute using two digits; e.g., 01, 05, 12
   */
  mm: {
    minute: "2-digit",
    name: "minute-2-digit",
    type: "minute",
  },
  /**
   * Formats the minute using the minimum number of digits needed; e.g., 1, 5, 12
   */
  m: {
    minute: "numeric",
    name: "minute-numeric",
    type: "minute",
  },
  /**
   * Formats the second using two digits; e.g., 01, 05, 12
   */
  ss: {
    second: "2-digit",
    name: "second-2-digit",
    type: "second",
  },
  /**
   * Formats the second using the minimum number of digits needed; e.g., 1, 5, 12
   */
  s: {
    second: "numeric",
    name: "second-numeric",
    type: "second",
  },
  /**
   * Formats the number of milliseconds using 3 digits; e.g., 001, 012, 235
   */
  fff: {
    fractionalSecond: null,
    fractionalSecondDigits: 3,
    name: "millisecond-3-digit",
    type: "millisecond",
  },
  /**
   * Formats the number of decaseconds using 2 digits; e.g., 00, 01, 24
   */
  ff: {
    fractionalSecond: null,
    fractionalSecondDigits: 2,
    name: "millisecond-2-digit",
    type: "millisecond",
  },
  /**
   * Formats the number of centiseconds using 2 digits; e.g., 0, 0, 2
   */
  f: {
    fractionalSecond: null,
    fractionalSecondDigits: 1,
    name: "millisecond-1-digit",
    type: "millisecond",
  },
  /**
   * Formats the time zone used for formatting using a "long" format (implementation-dependent); e.g., GMT-05:00, GMT-01:01:36, Coordinated Universal Time
   */
  kk: {
    timeZoneName: "long",
    name: "timeZoneName-long",
    type: "timeZoneName",
  },
  /**
   * Formats the time zone used for formatting using a "short" format (implementation-dependent); e.g., GMT-5, GMT-01:01:36, UTC
   */
  k: {
    timeZoneName: "short",
    name: "timeZoneName-short",
    type: "timeZoneName",
  },
  /**
   * Formats the time of day using a "long" format (implementation-dependent); e.g., "in the night", "in the evening", "PM"
   */
  aaa: {
    dayPeriod: "long",
    name: "dayPeriod-long",
    type: "dayPeriod",
  },
  /**
   * Formats the time of day using a "short" format (implementation-dependent); e.g., "in the night", "in the evening", "PM"
   */
  aa: {
    dayPeriod: "short",
    name: "dayPeriod-short",
    type: "dayPeriod",
  },
  /**
   * Formats the time of day using a "short" format (implementation-dependent); e.g., "in the night", "in the evening", "P"
   */
  a: {
    dayPeriod: "narrow",
    name: "dayPeriod-narrow",
    type: "dayPeriod",
  },
};
/**
 * @typedef { (value: Date, amount: number, useUTC: boolean) => number } adder A function which adds a given amount of a unit to a Date.
 */
/**
 * Maps between a date unit and the function needed to add an amount of that unit to a Date.
 * @type {Record<string, adder>}
 */
export const unitToAdder = {
  y: (value, amount, useUTC = true) =>
    useUTC
      ? value.setUTCFullYear(value.getUTCFullYear() + amount)
      : value.setFullYear(value.getFullYear() + amount),
  q: (value, amount, useUTC = true) =>
    useUTC
      ? value.setUTCMonth(value.getUTCMonth() + amount * 3)
      : value.setMonth(value.getMonth() + amount * 3),
  M: (value, amount, useUTC = true) =>
    useUTC
      ? value.setUTCMonth(value.getUTCMonth() + amount)
      : value.setMonth(value.getMonth() + amount),
  d: (value, amount, useUTC = true) =>
    useUTC
      ? value.setUTCDate(value.getUTCDate() + amount)
      : value.setDate(value.getDate() + amount),
  w: (value, amount, useUTC = true) =>
    useUTC
      ? value.setUTCDate(value.getUTCDate() + amount * 7)
      : value.setDate(value.getDate() + amount * 7),
  H: (value, amount, useUTC = true) =>
    useUTC
      ? value.setUTCHours(value.getUTCHours() + amount)
      : value.setHours(value.getHours() + amount),
  m: (value, amount, useUTC = true) =>
    useUTC
      ? value.setUTCMinutes(value.getUTCMinutes() + amount)
      : value.setMinutes(value.getMinutes() + amount),
  s: (value, amount, useUTC = true) =>
    useUTC
      ? value.setUTCSeconds(value.getUTCSeconds() + amount)
      : value.setSeconds(value.getSeconds() + amount),
  f: (value, amount, useUTC = true) =>
    useUTC
      ? value.setUTCMilliseconds(value.getUTCMilliseconds() + amount)
      : value.setMilliseconds(value.getMilliseconds() + amount),
};
/**
 * @typedef { (date: Date, value: number, useUTC: boolean) => number } DatePartSetter A function which, given a Date and a value, will set a part of the Date to the given value.
 */
/**
 * Maps between a unit and a function that will set that unit on a Date instance to a given value.
 * @type {Record<string, DatePartSetter>}
 */
export const unitToSetter = {
  y: (date, value, useUTC = true) =>
    useUTC ? date.setUTCFullYear(value) : date.setFullYear(value),
  M: (date, value, useUTC = true) =>
    useUTC ? date.setUTCMonth(value) : date.setMonth(value),
  d: (date, value, useUTC = true) =>
    useUTC ? date.setUTCDate(value) : date.setDate(value),
  H: (date, value, useUTC = true) =>
    useUTC ? date.setUTCHours(value) : date.setHours(value),
  m: (date, value, useUTC = true) =>
    useUTC ? date.setUTCMinutes(value) : date.setMinutes(value),
  s: (date, value, useUTC = true) =>
    useUTC ? date.setUTCSeconds(value) : date.setSeconds(value),
  f: (date, value, useUTC = true) =>
    useUTC ? date.setUTCMilliseconds(value) : date.setMilliseconds(value),
};
/**
 * @typedef {object} ValidationResult Encapsulates the result of a validation.
 * @property {boolean} valid Indicates whether the value (as a whole) is valid.
 * @property {any|any[]} value If valid is true, contains the normalized valid value.
 * @property {any|any[]} invalidValues If valid is not true, contains any invalid values.
 */
/**
 * Validates the locales.W
 * @param {string|string[]|undefined|null} locales The locales to validate.
 * @returns {ValidationResult} The result of the validation.
 */
export function validateLocales(locales) {
  if (typeof locales === "string") {
    console.warn(`The value passed to validateLocales should be an array; making one now...`);
    locales = [locales];
  }
  if (typeof locales === "undefined" || locales === null) {
    console.warn(`The value passed to validateLocales was undefined or null; the value returned will be an array with the locale of the host ("${getProbableClientLocale()}").`);
    locales = [getProbableClientLocale()];
  }
  if (!Array.isArray(locales)) {
    const error = `The value passed to locales was not an array: ${locales}`;
    console.error(error);
    return { valid: false, invalidValues: [locales], value: null, error: error };
  }
  const invalidLocales = locales.flat().filter((tag) => !bcp47re.test(tag));
  return {
    valid: invalidLocales.length === 0,
    invalidValues: invalidLocales,
    value: locales.flat().filter((tag) => bcp47re.test(tag)),
    error: `The following locales were invalid: ${invalidLocales}`
  };
}

/**
 * Validates that the array of formats given are all valid
 * @param {string|string[]|undefined} formats A format string, an array of format strings, or undefined
 * @param {string[]|undefined} locales An array of locales, or undefined
 * @returns {ValidationResult} The result of the validation, with the value always as an array of strings.
 */
export function validateFormats(formats, locales) {
  locales = validateLocales(locales).value;
  if (typeof formats === "string") {
    formats = [formats];
  }
  if (typeof formats === "undefined" || formats === null) {
    formats = [getDefaultFormatForLocale(locales)];
  }
  if (!Array.isArray(formats)) {
    console.error(`Unable to make the specified formats ("${formats}") into an array.`)
    return {valid:false,invalidValues:[formats].flat(),value:undefined};
  }
  return {valid:true,invalidValues:undefined,value:formats};
}
/**
 * Validates the options provided are within the allowable values or ranges.
 * @param {ParseFormatOptions|undefined|null} options Options provided to parse or format.
 * @returns {ParseFormatOptions} The options, with defaults set to those of the default locale or the first provided locale, if any.
 * If a value is not allowed, a warning will appear in the console, and the default value will be used.
 */
export function validateOptions(options) {
  const resolvedOptions = new Intl.DateTimeFormat([], { 
    dateStyle: "short",
    timeStyle: "short",
  }).resolvedOptions();
  let {
    timeZone,
    formats,
    locales,
    dateStyle,
    timeStyle,
    calendar,
    dayPeriod,
    numberingSystem,
    localeMatcher,
    hour12,
    hourCycle,
    formatMatcher,
    weekday,
    era,
    year,
    month,
    day,
    hour,
    minute,
    second,
    fractionalSecondDigits,
    timeZoneName,
  } = options ?? resolvedOptions;
  const validateAgainstList = (value, list, name, def) => {
    if (value && value.length && !list.includes(value)) {
      console.warn(
        `The provided ${name}, "${value}", is not valid. The default, "${def}" will be used.`
      );
      return def ?? undefined;
    }
    return value ?? def ?? undefined;
  };
  timeZone = validateAgainstList(
    timeZone,
    Intl.supportedValuesOf("timeZone"),
    "timeZone",
    resolvedOptions.timeZone
  );
  let { valid, invalidValues, value } = validateFormats(formats);
  if (!valid) {
    console.warn(`An invalid format, or invalid set of formats, "${invalidValues}" was provided; the default, "${getDefaultFormatForLocale([getProbableClientLocale()])} will be used."`);
    formats = value?.length ? value.flat() : [getDefaultFormatForLocale([getProbableClientLocale()])].flat();
  }
  ({ valid, invalidValues, value } = validateLocales(locales));
  if (!valid) {
    console.warn(
      `A locale, or set of locales, "${invalidValues}" was provided, the current, "${getProbableClientLocale()}" will be used.`
    );
    locales = value?.length ? value.flat() : [getProbableClientLocale()].flat();
    console.log('locales', locales);
  }
  locales = value?.length ? value.flat() : [getProbableClientLocale()].flat();
  calendar = validateAgainstList(
    calendar,
    [
      "buddhist",
      "chinese",
      "coptic",
      "dangi",
      "ethioaa",
      "ethiopic",
      "gregory",
      "hebrew",
      "indian",
      "islamic",
      "islamic-umalqura",
      "islamic-tbla",
      "islamic-civil",
      "islamic-rgsa",
      "iso8601",
      "japanese",
      "persian",
      "roc",
      "islamicc",
    ],
    "calendar",
    resolvedOptions.calendar
  );
  calendar = calendar === "islamicc" ? "islamic-civil" : calendar;
  numberingSystem = validateAgainstList(
    numberingSystem,
    [
      "arab",
      "arabext",
      "bali",
      "beng",
      "deva",
      "fullwide",
      "gujr",
      "guru",
      "hanidec",
      "khmr",
      "knda",
      "laoo",
      "latn",
      "limb",
      "mlym",
      "mong",
      "mymr",
      "orya",
      "tamldec",
      "telu",
      "thai",
      "tibt",
    ],
    "numberingSystem",
    resolvedOptions.numberingSystem
  );
  localeMatcher = validateAgainstList(
    localeMatcher,
    ["lookup", "best fit"],
    "localeMatcher",
    "best fit"
  );
  if (typeof hour12 !== "boolean") {
    console.warn(
      `The provided hour12 value, "${hour12}", is not valid. The default, ${resolvedOptions.hour12} will be used.`
    );
    hour12 = undefined;
  }
  hour12 = validateAgainstList(
    hour12,
    [true, false],
    "hour12",
    undefined
  );
  hour12 ??= resolvedOptions.hour12 ?? hourCycle ? undefined : false;
  hourCycle = validateAgainstList(
    hourCycle,
    ["h11", "h12", "h23", "h24"],
    "hourCycle",
    resolvedOptions.hourCycle
  );
  hourCycle ??= hour12 ? "h12" : "h23";
  formatMatcher = validateAgainstList(
    formatMatcher,
    ["basic", "best fit"],
    "formatMatcher",
    "best fit"
  );
  weekday = validateAgainstList(
    weekday,
    ["long", "short", "narrow"],
    "weekday",
    resolvedOptions.weekday
  );
  era = validateAgainstList(
    era,
    ["long", "short", "narrow"],
    "era",
    resolvedOptions.era
  );
  year = validateAgainstList(
    year,
    ["numeric", "2-digit"],
    "year",
    resolvedOptions.year
  );
  month = validateAgainstList(
    month,
    ["numeric", "2-digit"],
    "month",
    resolvedOptions.month
  );
  day = validateAgainstList(
    day,
    ["numeric", "2-digit"],
    "day",
    resolvedOptions.day
  );
  hour = validateAgainstList(
    hour,
    ["numeric", "2-digit"],
    "hour",
    resolvedOptions.hour
  );
  minute = validateAgainstList(
    minute,
    ["numeric", "2-digit"],
    "minute",
    resolvedOptions.minute
  );
  second = validateAgainstList(
    second,
    ["numeric", "2-digit"],
    "second",
    resolvedOptions.second
  );
  fractionalSecondDigits = validateAgainstList(
    fractionalSecondDigits,
    ["0", "1", "2", "3", 0, 1, 2, 3],
    "fractionalSecondDigits",
    resolvedOptions.fractionalSecondDigits
  );
  fractionalSecondDigits ??= 0;
  timeZoneName = validateAgainstList(
    timeZoneName,
    [
      "long",
      "short",
      "longOffset",
      "shortOffset",
      "longGeneric",
      "shortGeneric",
    ],
    "timeZoneName",
    resolvedOptions.timeZoneName
  );
  return {
    timeZone,
    formats,
    locales,
    dateStyle,
    timeStyle,
    calendar,
    dayPeriod,
    numberingSystem,
    localeMatcher,
    hour12,
    hourCycle,
    formatMatcher,
    weekday,
    era,
    year,
    month,
    day,
    hour,
    minute,
    second,
    fractionalSecondDigits,
    timeZoneName,
  };
}

/**
 * Returns the first element of the given array, when sufficiently flattened, or the item itself
 * if not an array.
 * @param {any[] | any} arr Array of values or arrays or single value
 * @returns {any} If given a single value, returns the single value; if given a single dimension array,
 * returns the first item; if given a multiple-dimension array, flattens the array until the
 * first element is not an array and returns that first element.
 */
export function flatToFirst(arr) {
  let value = Array.isArray(arr) && arr.length ? arr[0] : arr;
  while (Array.isArray(value)) {
    value = value[0];
  }

  return value;
}
/**
 * Gets the likely "locale" used by the host.
 * @returns {string|undefined} The locale used by Intl.DateTimeFormat when not specified.
 */
export function getProbableClientLocale() {
  return new Intl.DateTimeFormat().resolvedOptions().locale;
}
/**
 * Gets the name of the time zone of the current environment.
 * @param {string|string[]|undefined|null} locales The locale "A string with a BCP 47 language tag,
 * or an array of such strings. To use the browser's default locale, pass
 * an empty array."
 * @returns The time zone name, from the resolved options given by Intl.DateTimeFormat. Contrast with
 * getPossibleClientTimeZoneNames which guesses based on offset from UTC. However, there is nothing
 * forcing implementations to provide `timeZone` with the resolvedOptions.
 */
export function getProbableClientTimeZoneName(locales) {
  /*const localesResult = DateHelper.parseLocales(locales);
  if (!localesResult.valid) {
    throw new Error(localesResult.error);
  }*/
  const defaultFormat = new Intl.DateTimeFormat([]/*localesResult.value*/);
  const options = defaultFormat.resolvedOptions();
  return options?.timeZone;
}
/**
 * Gets the default format string for the specified locale
 * @param {string[]} locales The locale "A string with a BCP 47 language tag,
 * or an array of such strings. To use the browser's default locale, pass
 * an empty array."
 * @param {string} style The style of date and time to get the format of.
 * Can be "full", "long", "medium", or "short" (default).
 * @returns {string} The date format for the locale.
 */
export function getDefaultFormatForLocale(locales, style = "short") {
  if (![undefined, null, "full", "long", "medium", "short"].includes(style)) {
    throw new Error(
      `style must be undefined, null, "full", "long", "medium", or "short"`
    );
  }
  style ??= "short";
  const localesResult = validateLocales(locales);
  if (!localesResult.valid) {
    throw new Error(localesResult.error);
  }
  let defaultFormat = new Intl.DateTimeFormat(localesResult.value);
  // resolvedOptions should theoretically contain information about at least year, month, and day formatting rules
  const options = defaultFormat.resolvedOptions();
  defaultFormat = new Intl.DateTimeFormat(localesResult.value, {
    dateStyle: style,
    timeStyle: style,
  });
  const referenceDate = new Date(2022, 1, 2, 2, 2, 2, 2); // 2022-02-02T02:02:02.002Z
  // formatToParts generates an array of parts, each of which have a type and a value
  const formatted = defaultFormat.formatToParts(referenceDate);
  let format = "";
  for (let i = 0, z = formatted.length; i < z; i++) {
    let part = {
      ...formatted[i],
      ...(options[formatted[i].type]
        ? { [formatted[i].type]: options[formatted[i].type] }
        : guessDatePartFromFormatPart(formatted[i])),
    };
    // part.type is going to be 'year', 'month', 'day', 'literal', ...
    let type = part[part.type];
    // type will have the formatting options for the given type (likely undefined for literal)
    // reverse of stringsToFormatMap
    switch (part.type) {
      case "year":
        switch (type) {
          case "numeric":
            part.field = "y";
            break;
          case "2-digit":
            part.field = "yy";
            break;
        }
        break;
      case "month":
        switch (type) {
          case "numeric":
            part.field = "M";
            break;
          case "2-digit":
            part.field = "MM";
            break;
          case "short":
            part.field = "MMM";
            break;
          case "long":
            part.field = "MMMM";
            break;
          case "narrow":
            part.field = "MMMMM";
            break;
        }
        break;
      case "day":
        switch (type) {
          case "numeric":
            part.field = "d";
            break;
          case "2-digit":
            part.field = "dd";
            break;
        }
        break;
      case "era":
        switch (type) {
          case "narrow":
            part.field = "GGGGG";
            break;
          case "short":
            part.field = "GGG";
            break;
          case "long":
            part.field = "GGGG";
            break;
        }
        break;
      case "hour":
        switch (type) {
          case "numeric":
            part.field = "h";
            break;
          case "2-digit":
            part.field = "hh";
            break;
        }
        break;
      case "minute":
        switch (type) {
          case "numeric":
            part.field = "m";
            break;
          case "2-digit":
            part.field = "mm";
            break;
        }
        break;
      case "second":
        switch (type) {
          case "numeric":
            part.field = "s";
            break;
          case "2-digit":
            part.field = "ss";
            break;
        }
        break;
      case "weekday":
        switch (type) {
          case "short":
            part.field = "EEE";
            break;
          case "long":
            part.field = "EEEE";
            break;
          case "narrow":
            part.field = "EEEEE";
            break;
        }
        break;
      case "dayPeriod":
        switch (type) {
          case "narrow":
            part.field = "a";
            break;
          case "short":
            part.field = "aaa";
            break;
          case "long":
            part.field = "aaaa";
            break;
        }
        break;
      case "timeZoneName":
        switch (type) {
          case "longGeneric":
            part.field = "vvvv";
            break;
          case "shortGeneric":
            part.field = "v";
            break;
          case "longOffset":
            part.field = "ZZZZ";
            break;
          case "shortOffset":
            part.field = "ZZZ";
            break;
          case "long":
            part.field = "zzzz";
            break;
          case "short":
            part.field = "zzz";
            break;
        }
        break;
      case "literal":
        part.field = part.value;
        break;
    }
    format += part.field ?? "";
  }
  return format;
}
/**
 * Uses basic heuristics to get better formatting information, based on the results
 * of formatting the date using some defaults.
 * @param {DatePart} part The part of the date to guess more infomration about
 * @returns {DatePart} A more fleshed out object with more formatting information
 */
function guessDatePartFromFormatPart(part) {
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
          // if the one they are looking for is not present.
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
