/**
 * @typedef ParseFormatOptions Options for parsing or formatting a Date
 * @property {string|undefined} timeZone The IANA time zone name or "UTC" (the default)
 * @property {string|string[]|undefined} formats The format used, or an array of such formats to try
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
const bcp47re =
  /^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-(?<extension>[0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(?<privateUse>x(-[A-Za-z0-9]{1,8})+))?)|(?<privateUse1>x(-[A-Za-z0-9]{1,8})+))$/;

/**
 * Maps between a format string part and its corresponding option for Intl.DateTimeFormat.
 */
const stringsToFormatMap = {
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
    name: "iso",
  },
  /**
   * Formats a date in a "full" format; cannot be combined with other formatting strings except times with named formats.
   */
  ud: {
    dateStyle: "full",
    name: "date-full",
  },
  /**
   * Formats a time in a "full" format; cannot be combined with other formatting strings except dates with named formats.
   */
  ut: {
    timeStyle: "full",
    name: "time-full",
  },
  /**
   * Formats a date and time in a "full" format; cannot be combined with other formatting strings.
   */
  u: {
    dateStyle: "full",
    timeStyle: "full",
    name: "date-time-full",
  },
  /**
   * Formats a date in a "long" format; cannot be combined with other formatting strings except times with named formats.
   */
  ld: {
    dateStyle: "long",
    name: "date-long",
  },
  /**
   * Formats a time in a "long" format; cannot be combined with other formatting strings except dates with named formats.
   */
  lt: {
    timeStyle: "long",
    name: "time-long",
  },
  /**
   * Formats a date and time in a "long" format; cannot be combined with other formatting strings.
   */
  l: {
    dateStyle: "long",
    timeStyle: "long",
    name: "date-time-long",
  },
  /**
   * Formats a date in a "medium" format; cannot be combined with other formatting strings except times with named formats.
   */
  ed: {
    dateStyle: "medium",
    name: "date-medium",
  },
  /**
   * Formats a time in a "medium" format; cannot be combined with other formatting strings except dates with named formats.
   */
  et: {
    timeStyle: "medium",
    name: "time-medium",
  },
  /**
   * Formats a date and time in a "medium" format; cannot be combined with other formatting strings.
   */
  eu: {
    dateStyle: "medium",
    timeStyle: "medium",
    name: "date-time-medium",
  },
  /**
   * Formats a date in a "short" format; cannot be combined with other formatting strings except times with named formats.
   */
  rd: {
    dateStyle: "short",
    name: "date-time-short",
  },
  /**
   * Formats a time in a "short" format; cannot be combined with other formatting strings except dates with named formats.
   */
  rt: {
    timeStyle: "short",
    name: "time-short",
  },
  /**
   * Formats a date and time in a "short" format; cannot be combined with other formatting strings.
   */
  r: {
    dateStyle: "short",
    timeStyle: "short",
    name: "date-time-short",
  },
  /**
   * Formats the era in a "long" format; e.g. Anno Domini
   */
  GGG: {
    era: "long",
    name: "era-long",
  },
  /**
   * Formats the era in a "short" format; e.g. AD
   */
  GG: {
    era: "short",
    name: "era-short",
  },
  /**
   * Formats the era in a "narrow" format; e.g. A
   */
  G: {
    era: "narrow",
    name: "era-narrow",
  },
  /**
   * Formats the year using the minimum number of digits needed; e.g., 2021, 12 (for the year 12 AD), -12 (for the year 12 BC)
   * Note that while it has four letters, it won't necessarily use four digits.
   */
  yyyy: {
    year: "numeric",
    name: "year-4-digit",
  },
  /**
   * Formats the year using 2 digits; e.g., 00 refers to any year that ends in 00 (100, 1100, 1900, 2000, etc.)
   */
  yy: {
    year: "2-digit",
    name: "year-2-digit",
  },
  /**
   * Formats the year using the minimum number of digits needed; e.g., 2021, 12 (for the year 12 AD), -12 (for the year 12 BC)
   */
  y: {
    year: "numeric",
    name: "year-numeric",
  },
  /**
   * Formats the month name in a "narrow" format; e.g., J, M, D (note that two months can share a narrow name; March is also formatted as M)
   */
  MMMMM: {
    month: "narrow",
    name: "month-narrow",
  },
  /**
   * Formats the month name in a "long" format; e.g., January, May, December
   */
  MMMM: {
    month: "long",
    name: "month-long",
  },
  /**
   * Formats the month name in a "short" format; e.g., Jan, May, Dec
   */
  MMM: {
    month: "short",
    name: "month-short",
  },
  /**
   * Formats the month number using two digits; e.g., 01, 05, 12
   */
  MM: {
    month: "2-digit",
    name: "month-2-digit",
  },
  /**
   * Formats the month number using the minimum number of digits needed; e.g., 1, 5, 12
   */
  M: {
    month: "numeric",
    name: "month-numeric",
  },
  /**
   * Formats the weekday name in a "long" format; e.g., Sunday, Thursday, Saturday
   */
  EEEE: {
    weekday: "long",
    name: "weekday-long",
  },
  /**
   * Formats the weekday name in a "short" format; e.g., Sun, Thu, Sat
   */
  EEE: {
    weekday: "short",
    name: "weekday-short",
  },
  /**
   * Formats the weekday name in a "narrow" format; e.g., S, T, S (note that two different days can share a narrow name)
   */
  EEEEE: {
    weekday: "narrow",
    name: "weekday-narrow",
  },
  /**
   * Formats the day using two digits; e.g., 01, 05, 12
   */
  dd: {
    day: "2-digit",
    name: "day-2-digit",
  },
  /**
   * Formats the day using the minimum number of digits needed; e.g., 1, 5, 12
   */
  d: {
    day: "numeric",
    name: "day-numeric",
  },
  /**
   * Formats the hour using two digits, on a 24 hour cycle; e.g., 00, 12, 23
   */
  HH: {
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    name: "hour-h23-2-digit",
  },
  /**
   * Formats the hour using two digits, on a 12 hour cycle; e.g., 12, 12, 11
   */
  hh: {
    hour: "2-digit",
    hour12: true,
    hourCycle: "h12",
    name: "hour-h12-2-digit",
  },
  /**
   * Formats the hour using the minimum number of digits needed, on a 24 hour cycle; e.g., 0, 12, 23
   */
  H: {
    hour: "numeric",
    hour12: false,
    hourCycle: "h23",
    name: "hour-h23-numeric",
  },
  /**
   * Formats the hour using the minimum number of digits needed, on a 12 hour cycle; e.g., 12, 12, 11
   */
  h: {
    hour: "numeric",
    hour12: true,
    hourCycle: "h12",
    name: "hour-h12-numeric",
  },
  /**
   * Formats the minute using two digits; e.g., 01, 05, 12
   */
  mm: {
    minute: "2-digit",
    name: "minute-2-digit",
  },
  /**
   * Formats the minute using the minimum number of digits needed; e.g., 1, 5, 12
   */
  m: {
    minute: "numeric",
    name: "minute-numeric",
  },
  /**
   * Formats the second using two digits; e.g., 01, 05, 12
   */
  ss: {
    second: "2-digit",
    name: "second-2-digit",
  },
  /**
   * Formats the second using the minimum number of digits needed; e.g., 1, 5, 12
   */
  s: {
    second: "numeric",
    name: "second-numeric",
  },
  /**
   * Formats the number of milliseconds using 3 digits; e.g., 001, 012, 235
   */
  fff: {
    fractionalSecond: null,
    fractionalSecondDigits: 3,
    name: "millisecond-3-digit",
  },
  /**
   * Formats the number of decaseconds using 2 digits; e.g., 00, 01, 24
   */
  ff: {
    fractionalSecond: null,
    fractionalSecondDigits: 2,
    name: "millisecond-2-digit",
  },
  /**
   * Formats the number of centiseconds using 2 digits; e.g., 0, 0, 2
   */
  f: {
    fractionalSecond: null,
    fractionalSecondDigits: 1,
    name: "millisecond-1-digit",
  },
  /**
   * Formats the time zone used for formatting using a "long" format (implementation-dependent); e.g., GMT-05:00, GMT-01:01:36, Coordinated Universal Time
   */
  kk: {
    timeZoneName: "long",
    name: "timeZoneName-long",
  },
  /**
   * Formats the time zone used for formatting using a "short" format (implementation-dependent); e.g., GMT-5, GMT-01:01:36, UTC
   */
  k: {
    timeZoneName: "short",
    name: "timeZoneName-short",
  },
  /**
   * Formats the time of day using a "long" format (implementation-dependent); e.g., "in the night", "in the evening", "PM"
   */
  aaa: {
    dayPeriod: "long",
    name: "dayPeriod-long",
  },
  /**
   * Formats the time of day using a "short" format (implementation-dependent); e.g., "in the night", "in the evening", "PM"
   */
  aa: {
    dayPeriod: "short",
    name: "dayPeriod-short",
  },
  /**
   * Formats the time of day using a "short" format (implementation-dependent); e.g., "in the night", "in the evening", "P"
   */
  a: {
    dayPeriod: "narrow",
    name: "dayPeriod-narrow",
  },
};
const unitToAdder = {
  'y': (value, amount, useUTC = true) => useUTC ? value.setUTCFullYear(value.getUTCFullYear() + amount) : value.setFullYear(value.getFullYear() + amount),
  'q': (value, amount, useUTC = true) => useUTC ? value.setUTCMonth(value.getUTCMonth() + amount * 3) : value.setMonth(value.getMonth() + amount * 3),
  'M': (value, amount, useUTC = true) => useUTC ? value.setUTCMonth(value.getUTCMonth() + amount) : value.setMonth(value.getMonth() + amount),
  'd': (value, amount, useUTC = true) => useUTC ? value.setUTCDate(value.getUTCDate() + amount) : value.setDate(value.getDate() + amount),
  'w': (value, amount, useUTC = true) => useUTC ? value.setUTCDate(value.getUTCDate() + amount * 7) : value.setDate(value.getDate() + amount * 7),
  'H': (value, amount, useUTC = true) => useUTC ? value.setUTCHours(value.getUTCHours() + amount) : value.setHours(value.getHours() + amount),
  'm': (value, amount, useUTC = true) => useUTC ? value.setUTCMinutes(value.getUTCMinutes() + amount) : value.setMinutes(value.getMinutes() + amount),
  's': (value, amount, useUTC = true) => useUTC ? value.setUTCSeconds(value.getUTCSeconds() + amount) : value.setSeconds(value.getSeconds() + amount),
  'f': (value, amount, useUTC = true) => useUTC ? value.setUTCMilliseconds(value.getUTCMilliseconds() + amount) : value.setMilliseconds(value.getMilliseconds() + amount),
};
const unitToSetter = {
  'y': (date, value, useUTC = true) => useUTC ? date.setUTCFullYear(value) : date.setFullYear(value),
  'M': (date, value, useUTC = true) => useUTC ? date.setUTCMonth(value) : date.setMonth(value),
  'd': (date, value, useUTC = true) => useUTC ? date.setUTCDate(value) : date.setDate(value),
  'H': (date, value, useUTC = true) => useUTC ? date.setUTCHours(value) : date.setHours(value),
  'm': (date, value, useUTC = true) => useUTC ? date.setUTCMinutes(value) : date.setMinutes(value),
  's': (date, value, useUTC = true) => useUTC ? date.setUTCSeconds(value) : date.setSeconds(value),
  'f': (date, value, useUTC = true) => useUTC ? date.setUTCMilliseconds(value) : date.setMilliseconds(value),
};
function trySetDatePartFromPart(value, part, date, options) {
  if (!part || part.index == null) {
    console.error(`The part specified, ${part?JSON.stringify(part):part}, is not valid`);
    return { success: false };
  }
  const indexOfPartEndByAlphaNum = options.indexesOfNonAlphaNumChars.find((i) => i > part.index);
  const indexOfPartEndByNum = options.indexesOfNonNumChars.find((i) => i > part.index);
  //console.log('indexOfPartEndByAlphaNum',indexOfPartEndByAlphaNum);
  //console.log('indexOfPartEndByNum',indexOfPartEndByNum);
  //console.log('part.index + part.length',part.index + part.length);
  const endingIndex = Math.max(Math.min(
    indexOfPartEndByAlphaNum ?? Number.POSITIVE_INFINITY, 
    indexOfPartEndByNum ?? Number.POSITIVE_INFINITY), 
    part.index + part.length);
  part.end = endingIndex;
  let partValue = value.slice(part.index, part.end).replace(/[^\p{N}]/ug, '');
  //console.log(partValue);
  if (!Number.isNaN(+partValue) && +partValue !== 0) {
    if (part.name.startsWith('month')) {
      partValue = +partValue - 1;
    }
    part.setter(date, +partValue, options.timeZone === 'UTC');
    return { success: true, value: partValue };
  } else {
    console.warn(`The ${part.name} portion, "${value.slice(part.index, part.end)}" was not able to be parsed as a number; #trySetDatePartFromPart`);
  }

  return { success: false };
}
/**
   * Uses parts pulled from a format to create a Date from a string value, using options.
   * @param {string} value The original string getting parsed
   * @param {any[]} parts An array of objects representing the parts of a Date that have been parsed from value
   * @param {number} parts[0].index The index of the date part in the format (and, theoretically, value)
   * @param {number} parts[0].length The length of the date part in the format (and, theoretically, value)
   * @param {any} parts[0]['?'] Various part-specific information (e.g., month: '2-digit' tells us that the 
   * month part will be a two-digit number)
   * @param {object} options Optional hash of overrides for the properties set on the object.
   * @param {string} options.locale The locale in which to format the date (must be a valid BCP 47 language tag)
   * @param {string} options.format The format in which to format the date (must be a valid format string, or 'iso')
   * @param {string} options.timeZone The time zone in which to format the date (must be a valid IANA time zone name, or 'UTC')
   * @returns {Date} The Date value parsed by using the parts to extract data from value.
   */
  function getDateFromParts(value, parts, options) {
    // Currently only parsing numeric values and month names, but not weekdays; not sure what to do with a weekday even if I did
    // parse it successfully; Given a year, a month, and a day, I'd already know the weekday, so what if the parsed one is 
    // different? If I get a year, a month, and a weekday, I'd need a week number to know what day it is, and there currently is no
    // token for week number.
    const nonAlphaNumChars = new Set([...value].filter((c) => /[^\p{L}\p{N}]/u.test(c)));
    const indexesOfNonAlphaNumChars = [...value].map((c, i) => (nonAlphaNumChars.has(c) ? i : null)).filter((i) => i !== null);
    options.indexesOfNonAlphaNumChars = indexesOfNonAlphaNumChars;
    const nonNumChars = new Set([...value].filter((c) => /[^\p{N}]/u.test(c)));
    const indexesOfNonNumChars = [...value].map((c, i) => (nonNumChars.has(c) ? i : null)).filter((i) => i !== null);
    options.indexesOfNonNumChars = indexesOfNonNumChars;
    let month;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const yearPart = parts.find((p) => p.year?.length);
    if (!trySetDatePartFromPart(value, yearPart, date, options).success) {
      console.warn(`Did not set the year portion of the date in "${value}", keeping as ${date.getFullYear()}...`);
    }
    const monthPart = parts.find((p) => p.month?.length);
    if (!trySetDatePartFromPart(value, monthPart, date, options).success) {
        // map month names
        const form = monthPart.month;
        const months = new Array(12)
          .fill(0)
          .map((_, i) => new Date(2021, i, 1))
          .map((d) => d.toLocaleString(options.locale, { month: form }));
        month = months.indexOf(value.slice(monthPart.index, monthPart.end));
        if (month > -1) {
          //console.log('month', month);
          monthPart.setter(date, month, options.timeZone === 'UTC');
        } else {
          console.warn(`The month portion, "${value.slice(monthPart.index, monthPart.end)}" was not able to be parsed as a month name`);
        }
    }
    const dayPart = parts.find((p) => p.day?.length);
    if (!trySetDatePartFromPart(value, dayPart, date, options).success) {
      console.warn(`Did not set the day portion of the date in "${value}", keeping as ${date.getDate()}...`);
    }
    const hourPart = parts.find((p) => p.hour?.length);
    if (!trySetDatePartFromPart(value, hourPart, date, options).success) {
      console.warn(`Did not set the hour portion of the date in "${value}", keeping as ${date.getHours()}...`);
    }
    const minutePart = parts.find((p) => p.minute?.length);
    if (!trySetDatePartFromPart(value, minutePart, date, options).success) {
      console.warn(`Did not set the minute portion of the date in "${value}", keeping as ${date.getMinutes()}...`);
    }
    const secondPart = parts.find((p) => p.second?.length);
    if (!trySetDatePartFromPart(value, secondPart, date, options).success) {
      console.warn(`Did not set the second portion of the date in "${value}", keeping as ${date.getSeconds()}...`);
    }
    const millisecondPart = parts.find((p) => p.fractionalSecondDigits);
    if (!trySetDatePartFromPart(value, millisecondPart, date, options).success) {
      console.warn(`Did not set the millisecond portion of the date in "${value}", keeping as ${date.getMilliseconds()}...`);
    }
    return date;
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
  const {
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
  } = validateOptions(options);
  let result = new Date(undefined);
  if (value == null) {
    console.warn("parseDate: value is undefined or null");
    return value;
  }
  if (value instanceof Date) {
    console.warn("parseDate: value is Date object");
    value = formatDate(value, options);
  }
  if (typeof value === "number" && !Number.isNaN(value)) {
    console.warn("parseDate: value is number");
    value = formatDate(new Date(value), options);
  }
  // value is string
  if (value.length === 0) {
    console.warn("parseDate: value is empty string");
    // Invalid Date
    return result;
  }
  // Figure out how to carve up format(s) into parts and parse the parts from the value...
  const stringsToFind = Object.keys(stringsToFormatMap);
  let parts = [];
  formats = Array.isArray(formats) ? formats : [formats];
  while (formats.some((f) => Array.isArray(f))) {
    formats = formats.flat();
  }
  let formatUsed = formats[0];
  let date;
  for (let f of formats) {
    formatUsed = f;
    f = f === "iso" ? "y-MM-ddTHH:mm:ss.fffZ" : f;
    for (let stringToFind of stringsToFind) {
      while (f.includes(stringToFind)) {
        let part = { ...stringsToFormatMap[stringToFind] };
        part.setter = unitToSetter[stringToFind.at(0)];
        part.index = f.indexOf(stringToFind);
        part.length = ["y", "yyyy"].includes(stringToFind)
          ? 4 /* Have to put a number on it */
          : stringToFind.length;
        parts.push(part);
        f = f.replace(stringToFind, "_".repeat(part.length));
      }
      if (!stringsToFind.some((s) => f.includes(s))) {
        break;
      }
    }
    if (!stringsToFind.some((s) => f.includes(s))) {
      date = DateHelper.#getDateFromParts(value, parts, options);
      // now format it back to see if we get the same thing back
      const reformatted = DateHelper.formatDate(date, options);
      if (reformatted === value) {
        break;
      }

      continue;
    }
  }

  return date;
}

/**
 * Validates the options provided are within the allowable values or ranges.
 * @param {ParseFormatOptions|undefined|null} options Options provided to parse or format.
 * @returns {ParseFormatOptions} The options, with defaults set to those of the default locale or the first provided locale, if any.
 * If a value is not allowed, a warning will appear in the console, and the default value will be used.
 */
export function validateOptions(options) {
  const resolvedOptions = new Intl.DateTimeFormat().resolvedOptions();
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
      return undefined;
    }
    return value;
  };
  timeZone = validateAgainstList(
    timeZone,
    Intl.supportedValuesOf("timeZone"),
    "timeZone",
    resolvedOptions.timeZone
  );
  timeZone ??= resolvedOptions.timeZone;
  let { possibleLocales, isValid, invalidLocales } = Array.isArray(locales)
    ? {
        possibleLocales: locales.flat(),
        isValid: locales.flat().every((tag) => bcp47re.test(tag)),
        invalidLocales: locales.flat().filter((tag) => !bcp47re.test(tag)),
      }
    : typeof locales === "string"
    ? {
        possibleLocales: [locales],
        isValid: bcp47re.test(locales),
        invalidLocales: bcp47re.test(locales) ? [] : [locales],
      }
    : { possibleLocales: [], isValid: false, invalidLocales: [locales] };
  if (!isValid) {
    console.warn(
      `A locale, or set of locales, "${invalidLocales}" was provided, the current, "${resolvedOptions.locale}" will be used.`
    );
    locales = possibleLocales.length ? possibleLocales : undefined;
  }
  locales ??= [resolvedOptions.locale].flat();
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
  calendar ??= resolvedOptions.calendar;
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
  numberingSystem ??= resolvedOptions.numberingSystem;
  localeMatcher = validateAgainstList(
    localeMatcher,
    ["lookup", "best fit"],
    "localeMatcher",
    "best fit"
  );
  localeMatcher ??= "best fit";
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
    resolvedOptions.hour12
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
  formatMatcher ??= "best fit";
  weekday = validateAgainstList(
    weekday,
    ["long", "short", "narrow"],
    "weekday",
    resolvedOptions.weekday
  );
  weekday ??= resolvedOptions.weekday;
  era = validateAgainstList(
    era,
    ["long", "short", "narrow"],
    "era",
    resolvedOptions.era
  );
  era ??= resolvedOptions.era;
  year = validateAgainstList(
    year,
    ["numeric", "2-digit"],
    "year",
    resolvedOptions.year
  );
  year ??= resolvedOptions.year;
  month = validateAgainstList(
    month,
    ["numeric", "2-digit"],
    "month",
    resolvedOptions.month
  );
  month ??= resolvedOptions.month;
  day = validateAgainstList(
    day,
    ["numeric", "2-digit"],
    "day",
    resolvedOptions.day
  );
  day ??= resolvedOptions.day;
  hour = validateAgainstList(
    hour,
    ["numeric", "2-digit"],
    "hour",
    resolvedOptions.hour
  );
  hour ??= resolvedOptions.hour;
  minute = validateAgainstList(
    minute,
    ["numeric", "2-digit"],
    "minute",
    resolvedOptions.minute
  );
  minute ??= resolvedOptions.minute;
  second = validateAgainstList(
    second,
    ["numeric", "2-digit"],
    "second",
    resolvedOptions.second
  );
  second ??= resolvedOptions.second;
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
  timeZoneName ??= resolvedOptions.timeZoneName;
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
