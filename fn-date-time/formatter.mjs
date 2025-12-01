import DatePart, { DatePartCollection } from "../DatePart.mjs";
import DateTimeFormattingOptions from "../DateTimeFormattingOptions.mjs";
import { stringsToFormatMap, flatToFirst, validateOptions } from "./common.mjs";
import parse from "./parser.mjs";

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
 * Parses a format into a collection of DateParts, similar to DateTimeFormat's formatToParts.
 * @param {string} format The format to parse
 * @param {ParseFormatOptions} options General options for all functions.
 * @returns {DatePartCollection} A collection of DateParts detailing the format in terms
 * of how to format each part and any literal strings to add between parts.
 */
function parseFormatToParts(format, options) {
  options = validateOptions(options);
  const styles = ["ud", "ut", "u", "ld", "lt", "l", "ed", "et", "eu", "rd", "rt", "r", "iso"];
  const stringsToFind = Object.keys(stringsToFormatMap);
  let formatted = format;
  let result = new DatePartCollection();
  let stringsInFormat = stringsToFind.filter((f) => formatted.includes(f));
  for (let i = 0, z = stringsInFormat.length; i < z; i++) {
    f = stringsInFormat[i];
    const part = new DatePart(stringsToFormatMap[f]);
    if (!part.isStyle) {
      part.field = f;
      part.index = formatted.indexOf(f);
      part.length = Math.max(
        f.length,
        part[part.type]?.toString().includes("2") ? 2 : 0
      );
      result.add(part, i === z - 1);
      formatted = formatted.replace(f, "_".repeat(f.length));
    } else if (f === "iso") {
      // Always the same array of objects
      return new DatePartCollection([
        {
          ...stringsToFormatMap.yyyy,
          index: 0,
          length: 4,
          field: "yyyy",
        },
        { type: "literal", index: 5, length: 1, value: "-" },
        {
          ...stringsToFormatMap.MM,
          index: 6,
          length: 2,
          field: "MM",
        },
        { type: "literal", index: 8, length: 1, value: "-" },
        {
          ...stringsToFormatMap.dd,
          index: 9,
          length: 2,
          field: "dd",
        },
        { type: "literal", index: 11, length: 1, value: "T" },
        {
          ...stringsToFormatMap.HH,
          index: 12,
          length: 2,
          field: "HH",
        },
        { type: "literal", index: 14, length: 1, value: ":" },
        {
          ...stringsToFormatMap.mm,
          index: 15,
          length: 2,
          field: "mm",
        },
        { type: "literal", index: 17, length: 1, value: ":" },
        {
          ...stringsToFormatMap.ss,
          index: 18,
          length: 2,
          field: "ss",
        },
        { type: "literal", index: 20, length: 1, value: "." },
        {
          ...stringsToFormatMap.fff,
          index: 21,
          length: 3,
          field: "fff",
        },
        { type: "literal", index: 24, length: 1, value: "Z" },
      ]);
    } else {
      // TODO: Figure out what to do with format styles (e.g., dateStyle: "long")
      delete part.isStyle;
      const formatOptions = DateTimeFormattingOptions.fromDatePart(part);
      const parts = new Intl.DateTimeFormat(options.locales, formatOptions.toDateTimeFormatOptions()).formatToParts().map((p) => new DatePart(p));
      result.addRange(parts, i === z - 1);
    }
  }

  const literalsPass0 = [...formatted];
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

  return new DatePartCollection(
    [...result, ...literals].sort((a, b) => a.index - b.index)
  );
}
/**
 * Formats the part of the date specified
 * @param {Date} date The Date object to format
 * @param {DatePart} part The part of the date to format
 * @param {ParseFormatOptions} options Optional hash of overrides for the properties set on the object.
 * @returns {string} The specified part of the date, formatted per the instructions in part.
 */
function formatDatePart(date, part, options) {
  if (part.type === "literal") {
    return part.value;
  }
  let { locales, formats, timeZone } = validateOptions(options);
  if (isNaN(date.valueOf())) {
    throw new Error(`The date given, "${date}", is not a valid Date.`);
  }

  const locale = flatToFirst(locales);
  const format = flatToFirst(formats);

  const partOptions = new DatePart(part);
  partOptions.timeZone = timeZone;
  let value = null;
  // v8 and others require the entire time to be formatted to override individual
  // elements of the time, so this code fills in the higher units of time.
  if (
    partOptions.hasOwnProperty("minute") &&
    !partOptions.hasOwnProperty("hour")
  ) {
    partOptions.hour = partOptions.minute;
    partOptions.hour12 = partOptions.hour !== "2-digit";
  }

  if (
    partOptions.hasOwnProperty("second") &&
    !partOptions.hasOwnProperty("minute") &&
    !partOptions.hasOwnProperty("hour")
  ) {
    partOptions.minute = partOptions.second;
    partOptions.hour = partOptions.minute;
    partOptions.hour12 = partOptions.hour !== "2-digit";
  }

  if (
    partOptions.hasOwnProperty("dayPeriod") &&
    !partOptions.hasOwnProperty("minute") &&
    !partOptions.hasOwnProperty("hour")
  ) {
    partOptions.hour = partOptions.minute = "numeric";
    partOptions.hour12 = true;
  }

  const formatOptions = DateTimeFormattingOptions.fromDatePart(partOptions);
  let dateTimeFormatOption = undefined;
  if (formatOptions.valid) {
    dateTimeFormatOption = formatOptions.toDateTimeFormatOptions();
  }
  const formatter = new Intl.DateTimeFormat(locale, dateTimeFormatOption);
  const formattedParts = formatter.formatToParts(date);
  const partType =
    partOptions.type === "millisecond" ? "fractionalSecond" : partOptions.type;
  let optionName = partType;
  let option = partOptions[optionName];
  const resolvedOptions = formatter.resolvedOptions();
  let resolvedOption = resolvedOptions[optionName];
  if (option == null) {
    const formatKeys = Object.keys(partOptions);
    optionName = formatKeys[1];
    option = partOptions[optionName];
    resolvedOption = resolvedOptions[optionName];
  }

  value = formattedParts.find((part) => part.type === partType)?.value;
  // v8 resolves hourCycle as 'h24' even when set as 'h23'
  // so this code checks for those mismatches and accounts for them, where it can
  if (
    (resolvedOption !== option && value && value.length) ||
    (optionName === "hour" && value && value.length)
  ) {
    if (
      optionName === "hour" &&
      partOptions.hourCycle === "h23" &&
      resolvedOptions.hourCycle === "h24"
    ) {
      optionName = "hourCycle";
      option = partOptions[optionName];
      resolvedOption = resolvedOptions[optionName];
    }

    // While the code above might fix the problem in v8 & SpiderMonkey,
    // I have doubts about JavaScriptCore so I'm leaving this in.
    if (resolvedOption === "numeric" && option === "2-digit") {
      value = `00${value}`.slice(-2);
    } else if (resolvedOption === "2-digit" && option === "numeric") {
      value = parseInt(value).toString();
    } else if (
      optionName === "hourCycle" &&
      resolvedOption === "h24" &&
      option === "h23" &&
      value === "24"
    ) {
      value = "00";
    }
  }

  return value;
}

/**
 * Formats a Date (or something parseable as a Date) to a format
 * @param {Date|number|string|undefined|null} value The value to format
 * @param {ParseFormatOptions|undefined} options The options to use when formatting
 * @returns {string|undefined|null} The formatted Date, or null if value was null or undefined if value was undefined.
 * @description If `options` is not provided, the default values for the current locale will be used.
 * Throws an error if `value` cannot be parsed as a Date.
 */
export default function format(value, options) {
  if (value == null) {
    return value;
  }

  options = validateOptions(options);
  const date = parse(value, options);
  if (isNaN(date.valueOf())) {
    throw new Error(`The value given, "${value}", is not a valid Date.`);
  }

  const locale = flatToFirst(options.locales);
  const format = flatToFirst(options.formats);
  if (format == null) {
    // When format is not specified, format to the locale's default "short" style for date and time
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: options.timeZone,
    }).format(date);
  }

  const formatParts = parseFormatToParts(format, options);
  const result = [];
  for (const part of formatParts) {
    let value = formatDatePart(date, part, options);
    if (value && value.length) {
      result.push(value);
    } else {
      Logger.warn(
        `Unable to format part "${
          part.name
        }" for date "${date.toISOString()}" using options "${JSON.stringify(
          options
        )}".`
      );
    }
  }

  return result.join("");
}
