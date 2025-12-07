// Still no reliable import of JSON files; zone1970.mjs is a copy of zone1970.json as
// an ESM file (basically tacking `export default` before the data).
import tzdb from "./zone1970.mjs";
import { LogLevel, Logger } from "./Logger.mjs";
import DatePart, { DatePartCollection } from "./DatePart.mjs";
import DateTimeFormattingOptions from "./DateTimeFormattingOptions.mjs";

// TypeDefs
/**
 * @typedef {object} TimeZoneInfo Information about a time zone
 * @property {string} countryCodes The comma-delimited list of ISO 3166 2-character country codes which the time zone covers
 * @property {string} coords The latitude and longitude of the timezone's principal location in ISO 6709 sign-degrees-minutes-seconds format
 * @property {string} timeZoneName The name of the time zone as provided by IANA
 * @property {string} utcOffsetDST The offset from UTC when the time zone is in Daylight Saving Time
 * @property {string} utcOffsetStandard The offset from UTC when the time zone is in Standard Time
 * @property {string|undefined} comments Present if and only if a country has multiple timezones
 */
/**
 * @typedef {object} DateHelperOptions Options to use when formattting or parsing dates using DateHelper
 * @property {string|string[]|undefined} locale The locale in which to format the date (must be a valid
 * BCP 47 language tag), or an array of such strings, or undefined or null (to use the browser's default)
 * @property {string|string[]|undefined} format The format in which to format the date (must be a valid
 * format string), or an array of such strings, or undefined or null (to use the locale's default format)
 * @property {string|string[]|undefined} timeZone The time zone in which to format the date (must be a
 * valid IANA time zone name, or 'UTC', or undefined or null to use 'UTC')
 */
/**
 * @typedef {object} NamesByLocale Caches a list of names for each locale for faster lookup
 * @property {object} NamesByLocale.<locale> The "locale" (BCP-47 language identifier) by which to cache to array of names
 * @property {string[]} NamesByLocale.<locale>.<width> The "width" (DateTimeFormat identifier) by which to cache to array of names
 * So the values (for month names, e.g.) will be like:
 * {
 *   "en-US": {
 *     "long": [
 *       "January",
 *       "February",
 *       ...
 *       "December",
 *     ],
 *     "short": [
 *       "Jan",
 *       "Feb",
 *       ...
 *       "Dec",
 *     ],
 *     "narrow": [
 *       "J",
 *       "F",
 *       ...
 *       "D",
 *     ],
 *   }
 * }
 */
/**
 * @typedef {object} ParseDateHelperOptionResult An object representing the result of parsing one of the three properties of a DateHelperOption.
 * @property {boolean} valid true if the value(s) given are valid; otherwise, false
 * @property {string|string[]|undefined|null} value a string or array of strings with the valid value(s)
 * @property {string|undefined|null} error a string, containing the errors that have occurred, if any
 */
/**
 * @typedef {(date, value, useUTC = true) => void} DatePartSetter Sets the year portion of the date to the given value
 * @param {Date} date The Date whose year portion will be set
 * @param {number} value The value to which to set the year
 * @param {boolean?} useUTC true (default) to use UTC method to set the year; otherwise will use local date method.
 * @returns {void}
 */
/**
 * @typedef {object} trySetDatePartFromPartReturnValue
 * @property {boolean} success true if attempt was successful; otherwise, false
 * @property {string|number|undefined} value value of the part set if attempt was successful; otherwise, undefined
 */

/**
 * Provides an enumeration of the possible granularities by which dates can be compared.
 */
export class DateComparisonGranularity {
  static Era = "era";
  static Year = "y";
  static Quarter = "q";
  static Month = "mo";
  static Week = "w";
  static Day = "d";
  static Hour = "h";
  static Minute = "mn";
  static Second = "s";
  static Millisecond = "ms";
  static Default = "ms";
  static Custom = "?";
}
/**
 * Provides basic instance and static date and time formatting functionality.
 */
export default class DateHelper {
  // Basic constants of time.
  /**
   * Number of milliseconds per second
   */
  static msPerSecond = 1000;
  /**
   * Number of milliseconds per minute
   */
  static msPerMinute = DateHelper.msPerSecond * 60;
  /**
   * Number of milliseconds per hour
   */
  static msPerHour = DateHelper.msPerMinute * 60;
  /**
   * Number of milliseconds per day
   */
  static msPerDay = DateHelper.msPerHour * 24;
  /**
   * Number of milliseconds per week
   */
  static msPerWeek = DateHelper.msPerDay * 7;
  /**
   * Number of milliseconds per standard year
   */
  static msPerYear = DateHelper.msPerDay * 365;
  /**
   * Number of milliseconds per leap year
   */
  static msPerLeapYear = DateHelper.msPerDay * 366;
  /***
   * Regular expression for validating BCP 47 language tags, for use as a locale.
   */
  static bcp47re =
    /^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-(?<extension>[0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(?<privateUse>x(-[A-Za-z0-9]{1,8})+))?)|(?<privateUse1>x(-[A-Za-z0-9]{1,8})+))$/;
  /**
   * A map between a format string and the option(s) to pass to Intl.DateTimeFormat.
   * NOTE: The order of the keys matters! JavaScript iterates (since ES2015) in insertion order,
   * so it will search through the keys in the order they are laid out here. Thus, if you have
   * a number of formats with the same letter repeated, put the longest version first, or it will
   * do a partial match (e.g., GGGGG has to come before GGGG, or a format string with GGGGG would
   * be matched by GGGG, and it would use the "long" version of the era plus an extra G in the
   * output, instead of the "narrow" version of the era).
   * Note: There are a large number of format strings that are unused. These are mostly sourced
   * from Unicode's CLDR
   */
  static stringsToFormatMap = {
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
    cud: {
      dateStyle: "full",
      name: "date-full",
    },
    /**
     * Formats a time in a "full" format; cannot be combined with other formatting strings except dates with named formats.
     */
    cut: {
      timeStyle: "full",
      name: "time-full",
    },
    /**
     * Formats a date and time in a "full" format; cannot be combined with other formatting strings.
     */
    cu: {
      dateStyle: "full",
      timeStyle: "full",
      name: "date-time-full",
    },
    /**
     * Formats a date in a "long" format; cannot be combined with other formatting strings except times with named formats.
     */
    cld: {
      dateStyle: "long",
      name: "date-long",
    },
    /**
     * Formats a time in a "long" format; cannot be combined with other formatting strings except dates with named formats.
     */
    clt: {
      timeStyle: "long",
      name: "time-long",
    },
    /**
     * Formats a date and time in a "long" format; cannot be combined with other formatting strings.
     */
    cl: {
      dateStyle: "long",
      timeStyle: "long",
      name: "date-time-long",
    },
    /**
     * Formats a date in a "medium" format; cannot be combined with other formatting strings except times with named formats.
     */
    ced: {
      dateStyle: "medium",
      name: "date-medium",
    },
    /**
     * Formats a time in a "medium" format; cannot be combined with other formatting strings except dates with named formats.
     */
    cet: {
      timeStyle: "medium",
      name: "time-medium",
    },
    /**
     * Formats a date and time in a "medium" format; cannot be combined with other formatting strings.
     */
    ceu: {
      dateStyle: "medium",
      timeStyle: "medium",
      name: "date-time-medium",
    },
    /**
     * Formats a date in a "short" format; cannot be combined with other formatting strings except times with named formats.
     */
    crd: {
      dateStyle: "short",
      name: "date-time-short",
    },
    /**
     * Formats a time in a "short" format; cannot be combined with other formatting strings except dates with named formats.
     */
    crt: {
      timeStyle: "short",
      name: "time-short",
    },
    /**
     * Formats a date and time in a "short" format; cannot be combined with other formatting strings.
     */
    cr: {
      dateStyle: "short",
      timeStyle: "short",
      name: "date-time-short",
    },
    /**
     * Formats the era in a "narrow" format; e.g. A
     */
    GGGGG: {
      era: "narrow",
      name: "era-narrow",
      type: "era",
    },
    /**
     * Formats the era in a "long" format (known as "Wide" in Unicode TR35); e.g. Anno Domini
     */
    GGGG: {
      era: "long",
      name: "era-long",
      type: "era",
    },
    /**
     * Formats the era in a "short" format (known as "Abbreviated" in Unicode TR35); e.g. AD
     */
    GGG: {
      era: "short",
      name: "era-short",
      type: "era",
    },
    /**
     * Formats the year using a minimum of 4 digits, zero-padding where needed; e.g., 2021, 0012 (for the year 12 AD), -0012 (for the year 12 BC)
     * Note that while it has four letters, it won't necessarily use four digits (could be 20173 for that year).
     */
    yyyy: {
      year: "numeric",
      name: "year-4-digit",
      type: "year",
    },
    /**
     * Formats the year using exactly 2 digits; e.g., 00 refers to any year that ends in 00 (100, 1100, 1900, 2000, etc.)
     */
    yy: {
      year: "2-digit",
      name: "year-2-digit",
      type: "year",
    },
    /**
     * Formats the year using "a singe number designating the year of this calendar system, encompassing all supra-year fields."
     * From Unicode TR35 (not sure this is available via Intl)
     * !! Unsupported !!
     */
    yu: {
      year: "extended-numeric",
      name: "year-extended-numeric",
      type: "year",
      supported: false,
    },
    /**
     * Formats the year using the "narrow cyclic year name" From Unicode TR35 (not sure this is available via Intl)
     * !! Unsupported !!
     */
    yUUUUU: {
      year: "cyclic-narrow",
      name: "year-cyclic-narrow",
      type: "year",
      supported: false,
    },
    /**
     * Formats the year using the "wide cyclic year name" From Unicode TR35 (not sure this is available via Intl)
     * !! Unsupported !!
     */
    yUUUU: {
      year: "cyclic-long",
      name: "year-cyclic-long",
      type: "year",
      supported: false,
    },
    /**
     * Formats the year using the "abbreviated cyclic year name" From Unicode TR35 (not sure this is available via Intl)
     * !! Unsupported !!
     */
    yU: {
      year: "cyclic-short",
      name: "year-cyclic-short",
      type: "year",
      supported: false,
    },
    /**
     * Formats the year using a "related Gregorian year (numeric)" From Unicode TR35 (not sure this is available via Intl)
     * This would be added to a format string in addition to other year formatting information, e.g. "yr(EEy)年M月d日" with
     * locale "ja-JP-u-ca-japanese" to produce "2012(平成24)年1月15日"
     * !! Unsupported !!
     */
    yr: {
      year: "related-gregorian",
      name: "year-related-gregorian",
      type: "year",
      supported: false,
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
     * Formats the quarter name in a "narrow" format; e.g., 1, 3
     * !! Unsupported !!
     */
    QQQQQ: {
      quarter: "narrow",
      name: "quarter-narrow",
      type: "quarter",
      supported: false,
    },
    /**
     * Formats the quarter name in a "long" format (known as "Wide" in Unicode TR35); e.g., 1st quarter, 3rd quarter
     * !! Unsupported !!
     */
    QQQQ: {
      quarter: "long",
      name: "quarter-long",
      type: "quarter",
      supported: false,
    },
    /**
     * Formats the quarter name in a "short" format (known as "Abbreviate" in Unicode TR35); e.g., Q1, Q3
     * !! Unsupported !!
     */
    QQQ: {
      quarter: "short",
      name: "quarter-short",
      type: "quarter",
      supported: false,
    },
    /**
     * Formats the quarter number using a minimum of 2 digits; e.g., 01, 03
     * !! Unsupported !!
     */
    QQ: {
      quarter: "2-digit",
      name: "quarter-2-digit",
      type: "quarter",
      supported: false,
    },
    /**
     * Formats the quarter number using the minimum number of digits; e.g., 1, 3
     * !! Unsupported !!
     */
    Q: {
      quarter: "numeric",
      name: "quarter-numeric",
      type: "quarter",
      supported: false,
    },
    /**
     * Formats the quarter name in a "narrow" format, in Stand-Alone mode; e.g., 1, 3
     * !! Unsupported !!
     */
    qqqqq: {
      quarter: "narrow",
      name: "quarter-narrow-standalone",
      type: "quarter",
      supported: false,
    },
    /**
     * Formats the quarter name in a "long" format (known as "Wide" in Unicode TR35), in Stand-Alone mode; e.g., 1st quarter, 3rd quarter
     * !! Unsupported !!
     */
    qqqq: {
      quarter: "long-standalone",
      name: "quarter-long-standalone",
      type: "quarter",
      supported: false,
    },
    /**
     * Formats the quarter name in a "short" format (known as "Abbreviate" in Unicode TR35), in Stand-Alone mode; e.g., Q1, Q3
     * !! Unsupported !!
     */
    qqq: {
      quarter: "short",
      name: "quarter-short-standalone",
      type: "quarter",
      supported: false,
    },
    /**
     * Formats the quarter number using a minimum of 2 digits, in Stand-Alone mode; e.g., 01, 03
     * !! Unsupported !!
     */
    qq: {
      quarter: "2-digit",
      name: "quarter-2-digit-standalone",
      type: "quarter",
      supported: false,
    },
    /**
     * Formats the quarter number using the minimum number of digits, in Stand-Alone mode; e.g., 1, 3
     * !! Unsupported !!
     */
    q: {
      quarter: "numeric",
      name: "quarter-numeric-standalone",
      type: "quarter",
      supported: false,
    },
    /**
     * For use when formatted with other date parts. Use L forms for standalone months.
     * Formats the month name in a "narrow" format; e.g., J, M, D (note that two months can share a narrow name; March is also formatted as M)
     */
    MMMMM: {
      month: "narrow",
      name: "month-narrow",
      type: "month",
    },
    /**
     * For use when formatted with other date parts. Use L forms for standalone months.
     * Formats the month name in a "long" format (called "Wide" in Unicode TR35); e.g., January, May, December
     */
    MMMM: {
      month: "long",
      name: "month-long",
      type: "month",
    },
    /**
     * For use when formatted with other date parts. Use L forms for standalone months.
     * Formats the month name in a "short" format (called "Abbreviated" in Unicode TR35); e.g., Jan, May, Dec
     */
    MMM: {
      month: "short",
      name: "month-short",
      type: "month",
    },
    /**
     * For use when formatted with other date parts. Use L forms for standalone months.
     * Formats the month number using two digits; e.g., 01, 05, 12
     */
    MM: {
      month: "2-digit",
      name: "month-2-digit",
      type: "month",
    },
    /**
     * For use when formatted with other date parts. Use L forms for standalone months.
     * Formats the month number using the minimum number of digits needed; e.g., 1, 5, 12
     */
    M: {
      month: "numeric",
      name: "month-numeric",
      type: "month",
    },
    /**
     * For use when formatted without other date parts. Use M forms for foratting with other parts.
     * See https://unicode.org/reports/tr35/tr35-dates.html#months_days_quarters_eras
     * Formats the month name in a "narrow" format; e.g., J, M, D (note that two months can share a narrow name; March is also formatted as M)
     * !! Unsupported !!
     */
    LLLLL: {
      month: "narrow",
      name: "month-narrow-standalone",
      type: "month",
      supported: false,
    },
    /**
     * For use when formatted without other date parts. Use M forms for foratting with other parts.
     * See https://unicode.org/reports/tr35/tr35-dates.html#months_days_quarters_eras
     * Formats the month name in a "long" format (called "Wide" in Unicode TR35); e.g., January, May, December
     * !! Unsupported !!
     */
    LLLL: {
      month: "long",
      name: "month-long-standalone",
      type: "month",
      supported: false,
    },
    /**
     * For use when formatted without other date parts. Use M forms for foratting with other parts.
     * See https://unicode.org/reports/tr35/tr35-dates.html#months_days_quarters_eras
     * Formats the month name in a "short" format (called "Abbreviated" in Unicode TR35); e.g., Jan, May, Dec
     * !! Unsupported !!
     */
    LLL: {
      month: "short",
      name: "month-short-standalone",
      type: "month",
      supported: false,
    },
    /**
     * For use when formatted without other date parts. Use M forms for foratting with other parts.
     * See https://unicode.org/reports/tr35/tr35-dates.html#months_days_quarters_eras
     * Formats the month number using two digits; e.g., 01, 05, 12
     * !! Unsupported !!
     */
    LL: {
      month: "2-digit",
      name: "month-2-digit-standalone",
      type: "month",
      supported: false,
    },
    /**
     * For use when formatted without other date parts. Use M forms for foratting with other parts.
     * See https://unicode.org/reports/tr35/tr35-dates.html#months_days_quarters_eras
     * Formats the month number using the minimum number of digits needed; e.g., 1, 5, 12
     * !! Unsupported !!
     */
    L: {
      month: "numeric",
      name: "month-numeric-standalone",
      type: "month",
      supported: false,
    },
    /**
     * Formats the week of the year using a minimum of 2 digits.
     * If used with year, use Y instead of y for year formats.
     * !! Unsupported !!
     */
    ww: {
      week: "2-digit",
      name: "week-2-digit",
      tyoe: "week",
      supported: false,
    },
    /**
     * Formats the week of the year using the minimum number of digits.
     * If used with year, use Y instead of y for year formats.
     * !! Unsupported !!
     */
    w: {
      week: "numeric",
      name: "week-numeric",
      tyoe: "week",
      supported: false,
    },
    /**
     * Formats the week of the month using the minimum number of digits.
     * !! Unsupported !!
     */
    W: {
      week: "numeric",
      name: "week-month-numeric",
      tyoe: "week",
      supported: false,
    },
    /**
     * Formats the weekday name in a "abbr" format (known as "Short" in Unicode TR35);
     * e.g., Su, Tu, Sa
     * !! Unsupported !!
     */
    EEEEEE: {
      weekday: "abbr",
      name: "weekday-abbr",
      type: "weekday",
      supported: false,
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
     * Formats the weekday name in a "abbr" format (known as "Short" in Unicode TR35);
     * e.g., Su, Th, Sa
     * !! Unsupported !!
     */
    eeeeee: {
      weekday: "abbr",
      name: "weekday-abbr",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday name in a "narrow" format; e.g., S, T, S (note that two different days can share a narrow name)
     * !! Unsupported !!
     */
    eeeee: {
      weekday: "narrow",
      name: "weekday-narrow",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday name in a "long" format; e.g., Sunday, Thursday, Saturday
     * !! Unsupported !!
     */
    eeee: {
      weekday: "long",
      name: "weekday-long",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday name in a "short" format; e.g., Sun, Thu, Sat
     * !! Unsupported !!
     */
    eee: {
      weekday: "short",
      name: "weekday-short",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday number using a minimum of 2 digits, based on the local starting day of the week.
     * e.g., If Sunday is the start of the week, 01 (Sun), 05 (Thu). 07 (Sat)
     * !! Unsupported !!
     */
    ee: {
      weekday: "2-digit",
      name: "weekday-2-digit",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday number using the minimum number of digits, based on the local starting day of the week.
     * e.g., If Sunday is the start of the week, 1 (Sun), 5 (Thu). 7 (Sat)
     * !! Unsupported !!
     */
    e: {
      weekday: "numeric",
      name: "weekday-numeric",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday name in a "abbr" format (known as "Short" in Unicode TR35), using Stand-Alone rules;
     * e.g., Su, Th, Sa
     * !! Unsupported !!
     */
    cccccc: {
      weekday: "abbr",
      name: "weekday-abbr-standalone",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday name in a "narrow" format; e.g., S, T, S (note that two different days can share a narrow name), using Stand-Alone rules
     * !! Unsupported !!
     */
    ccccc: {
      weekday: "narrow",
      name: "weekday-narrow-standalone",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday name in a "long" format; e.g., Sunday, Thursday, Saturday, using Stand-Alone rules
     * !! Unsupported !!
     */
    cccc: {
      weekday: "long",
      name: "weekday-long-standalone",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday name in a "short" format; e.g., Sun, Thu, Sat, using Stand-Alone rules
     * !! Unsupported !!
     */
    ccc: {
      weekday: "short",
      name: "weekday-short-standalone",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday number using the minimum number of digits, based on the local starting day of the week, using Stand-Alone rules.
     * e.g., If Sunday is the start of the week, 01 (Sun), 05 (Thu). 07 (Sat)
     * !! Unsupported !!
     */
    cc: {
      weekday: "numeric",
      name: "weekday-numeric-standalone",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the weekday number using the minimum number of digits, based on the local starting day of the week, using Stand-Alone rules.
     * e.g., If Sunday is the start of the week, 1 (Sun), 5 (Thu). 7 (Sat)
     * !! Unsupported !!
     */
    c: {
      weekday: "numeric",
      name: "weekday-numeric-standalone",
      type: "weekday",
      supported: false,
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
     * Formats the day of the year using the minimum number of digits needed; e.g., 1, 12, 365
     * The number of characters, determines the minimum number of digits in the output:
     * e.g., DDD will return 001, 012, 365
     * !! Unsupported !!
     */
    D: {
      day: "numeric",
      name: "day-of-year-numeric",
      type: "day",
      supported: false,
    },
    /**
     * Formats the day of the week in the month using the minimum number of digits needed; e.g., 1, 2, 5
     * For example, the second Wednesday in July would be formatted as 2.
     * !! Unsupported !!
     */
    F: {
      day: "numeric",
      name: "weekday-of-month-numeric",
      type: "weekday",
      supported: false,
    },
    /**
     * Formats the Julian day (modified - represents midnight local, rather than noon UTC) using the minimum number of digits needed;
     * e.g., 2451334
     * The number of characters, determines the minimum number of digits in the output:
     * e.g., gggggggg will return 02451334
     * !! Unsupported !!
     */
    g: {
      day: "numeric",
      name: "day-julian-numeric",
      type: "day",
      supported: false,
    },
    /**
     * Formats the hour using two digits, on a 23 hour cycle; e.g., 00, 12, 23
     */
    HH: {
      hour: "2-digit",
      hour12: false,
      hourCycle: "h23",
      name: "hour-h23-2-digit",
      type: "hour",
    },
    /**
     * Formats the hour using the minimum number of digits needed, on a 23 hour cycle; e.g., 0, 12, 23
     */
    H: {
      hour: "numeric",
      hour12: false,
      hourCycle: "h23",
      name: "hour-h23-numeric",
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
     * Formats the time as the number of milliseconds that have elapsed since midnight of the current date.
     * e.g., 0, 12000, 44515558, 86399999 (max value).
     * The number of characters, determines the minimum number of digits in the output:
     * e.g., AAAAAAAA will return 00000000, 00012000, 44515558, 86399999
     * !! Unsupported !!
     */
    A: {
      millisecond: "numeric",
      name: "millisecond-total-numeric",
      type: "millisecond",
      supported: false,
    },
    /**
     * Formats the number of milliseconds using 3 digits (corresponds to SSS in Unicode TR35); e.g., 001, 012, 235
     */
    fff: {
      fractionalSecond: null,
      fractionalSecondDigits: 3,
      name: "millisecond-3-digit",
      type: "millisecond",
    },
    /**
     * Formats the number of decaseconds using 2 digits (corresponds to SSS in Unicode TR35); e.g., 00, 01, 23
     */
    ff: {
      fractionalSecond: null,
      fractionalSecondDigits: 2,
      name: "millisecond-2-digit",
      type: "millisecond",
    },
    /**
     * Formats the number of centiseconds using 2 digits (corresponds to SSS in Unicode TR35); e.g., 0, 0, 2
     */
    f: {
      fractionalSecond: null,
      fractionalSecondDigits: 1,
      name: "millisecond-1-digit",
      type: "millisecond",
    },
    /**
     * Formats the time zone used for formatting using a "longGeneric" format (implementation-dependent); e.g., Pacific Time
     * !! Unsupported outside of supporting browsers !!
     */
    vvvv: {
      timeZoneName: "longGeneric",
      name: "timeZoneName-longGeneric",
      type: "timeZoneName",
    },
    /**
     * Formats the time zone used for formatting using a "shortGeneric" format (implementation-dependent); e.g., Los Angeles Zeit
     * !! Unsupported outside of supporting browsers !!
     */
    v: {
      timeZoneName: "shortGeneric",
      name: "timeZoneName-shortGeneric",
      type: "timeZoneName",
    },
    /**
     * Formats the time zone used for formatting using a "longOffset" format (implementation-dependent); e.g., GMT-0500, GMT-010136
     * !! Unsupported outside of supporting browsers !!
     */
    ZZZZ: {
      timeZoneName: "longOffset",
      name: "timeZoneName-longOffset",
      type: "timeZoneName",
    },
    /**
     * Formats the time zone used for formatting using a "shortOffset" format (implementation-dependent); e.g., GMT-5, GMT-1
     * !! Unsupported outside of supporting browsers !!
     */
    ZZZ: {
      timeZoneName: "shortOffset",
      name: "timeZoneName-shortOffset",
      type: "timeZoneName",
    },
    /**
     * Formats the time zone used for formatting using a "long" format (implementation-dependent); e.g., Pacific Standard Time, Coordinated Universal Time
     */
    zzzz: {
      timeZoneName: "long",
      name: "timeZoneName-long",
      type: "timeZoneName",
    },
    /**
     * Formats the time zone used for formatting using a "short" format (implementation-dependent); e.g., PST, GMT-8, UTC
     */
    zzz: {
      timeZoneName: "short",
      name: "timeZoneName-short",
      type: "timeZoneName",
    },
    /**
     * Formats the time of day using a "narrow" format (implementation-dependent); e.g., "p", "a", "p"
     */
    aaaaa: {
      dayPeriod: "narrow",
      name: "dayPeriod-narrow",
      type: "dayPeriod",
    },
    /**
     * Formats the time of day using a "long" format (implementation-dependent, known as "Wide" in Unicode TR35);
     * e.g., "pm", "am", "post meridiem"
     */
    aaaa: {
      dayPeriod: "long",
      name: "dayPeriod-long",
      type: "dayPeriod",
    },
    /**
     * Formats the time of day using a "short" format (implementation-dependent, known as "Abbreviated" in Unicode TR35);
     * e.g., "pm", "am", "PM"
     */
    aaa: {
      dayPeriod: "short",
      name: "dayPeriod-short",
      type: "dayPeriod",
    },
    /**
     * Formats the time of day using a "narrow" format (implementation-dependent); e.g., "p", "mid", "noon"
     * !! Unsupported !!
     */
    bbbbb: {
      dayPeriod: "narrow",
      name: "dayPeriod-narrow",
      type: "dayPeriod",
      supported: false,
    },
    /**
     * Formats the time of day using a "long" format (implementation-dependent, known as "Wide" in Unicode TR35);
     * e.g., "post meridiem", "midnight", "noon"
     * !! Unsupported !!
     */
    bbbb: {
      dayPeriod: "long",
      name: "dayPeriod-long",
      type: "dayPeriod",
      supported: false,
    },
    /**
     * Formats the time of day using a "short" format (implementation-dependent);
     * e.g., "at night", "midnight", "noon"
     * !! Unsupported !!
     */
    bbb: {
      dayPeriod: "short",
      name: "dayPeriod-short",
      type: "dayPeriod",
      supported: false,
    },
    /**
     * Formats the time of day using a "narrow" format (implementation-dependent);
     * e.g., "at night", "at night", "at night"
     * !! Unsupported !!
     */
    BBBBB: {
      dayPeriod: "narrow",
      name: "dayPeriod-narrow",
      type: "dayPeriod",
      supported: false,
    },
    /**
     * Formats the time of day using a "long" format (implementation-dependent, known as "Wide" in Unicode TR35);
     * e.g., "at night", "at night", "at night"
     * !! Unsupported !!
     */
    BBBB: {
      dayPeriod: "long",
      name: "dayPeriod-long",
      type: "dayPeriod",
      supported: false,
    },
    /**
     * Formats the time of day using a "short" format (implementation-dependent);
     * e.g., "at night", "at night", "at night"
     * !! Unsupported !!
     */
    BBB: {
      dayPeriod: "short",
      name: "dayPeriod-short",
      type: "dayPeriod",
      supported: false,
    },
  };

  #locales;
  #formats;
  #timeZone;

  /**
   * Creates a new instance of the DateHelper class, so that options do not need to be passed in every call.
   * @param locales The locale in which to format the date (must be a valid BCP 47 language tag), or an
   * array of such strings, or undefined or null (to use the browser's default)
   * @param formats The format in which to format the date (must be a valid format string), or an array of
   * such strings, or undefined or null (to use the locale's default format)
   * @param timeZone The time zone in which to format the date (must be a valid IANA time zone name, or
   * 'UTC', or undefined or null to use 'UTC')
   */
  constructor(locales, formats, timeZone, logLevel = LogLevel.Error) {
    this.locales = locales;
    this.formats = formats;
    this.timeZone = timeZone;
    Logger.LogLevel = logLevel;
  }
  /**
   * The names of the months, by locale.
   * @type {NamesByLocale}
   */
  static #monthNames = {};

  /**
   * The names of the days of the week, by locale.
   * @type {NamesByLocale}
   */
  static #weekdayNames = {};

  /**
   * The locale in which to format dates (must be a valid BCP 47 language tag), or an array of such strings, or undefined or null (to use the browser's default)
   * @returns {string|string[]|undefined|null} The locale, or an array of such
   */
  get locales() {
    return this.#locales;
  }
  set locales(value) {
    const localeResult = DateHelper.parseLocales(value);
    if (!localeResult.valid) {
      throw new Error(localeResult.error);
    }
    this.#locales = localeResult.value;
  }
  /**
   * The format in which to format the date (must be a valid format string), or an array of such strings, or undefined or null (to use the locale's default format)
   * @returns {string|string[]|undefined|null} The format for the date/time, or an array of such
   */
  get formats() {
    return this.#formats;
  }
  set formats(value) {
    let formatsResult = DateHelper.parseFormats(value);
    if (!formatsResult.valid) {
      throw new Error(formatsResult.error);
    }
    if (this.#formats !== formatsResult.value) {
      this.#formats = formatsResult.value;
    }
  }
  /**
   * The time zone in which to format the date (must be a valid IANA time zone name, or 'UTC', or undefined or null to use 'UTC')
   * @returns {string|string[]|undefined|null} The time zone name, or an array of such
   */
  get timeZone() {
    return this.#timeZone;
  }
  set timeZone(value) {
    const timeZoneResult = DateHelper.parseTimeZone(value);
    if (!timeZoneResult.valid) {
      throw new Error(timeZoneResult.error);
    }
    if (this.#timeZone !== timeZoneResult.value) {
      this.#timeZone = timeZoneResult.value;
    }
  }
  /**
   * Returns a Date object representing the current date and time with the options given.
   * @param {DateHelperOptions} options An object with locale, format, and timeZone properties
   * @param {undefined} options.locale Will be ignored if present.
   * @param {undefined} options.format Will be ignored if present.
   * @returns {Date} a new Date instance, representing the current date and time in the given time zone.
   */
  static now(options) {
    options = { ...this.validateOptions(options), format: "y-MM-ddTHH:mm:ss.fffZ" };
    const isoFormat = this.formatDate(new Date(), options);
    console.log(`now(${JSON.stringify(options)})`,  isoFormat);
    return this.parseDate(isoFormat, options);
  }
  /**
   * Returns a Date object representing the current date at midnight with the options given.
   * @param {DateHelperOptions} options An object with locale, format, and timeZone properties
   * @param {undefined} options.locale Will be ignored if present.
   * @param {undefined} options.format Will be ignored if present.
   * @returns {Date} a new Date instance, representing the current date at midnight in the given time zone.
   */
  static today(options) {
    const { timeZone } = this.validateOptions(options);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isoFormat = this.formatDate(now, {
      format: "iso",
      timeZone,
    });
    return new Date(isoFormat);
  }
  /**
   * Maps a date unit to a method that adds an amount of that unit to a value.
   * Defaults to using UTC methods to do so.
   */
  static unitToAdder = {
    /**
     * Adds the given amount to the year portion of the date
     * @param {Date} date The Date to whose year portion the value will be added
     * @param {number} amount The amount to add to the year
     * @param {boolean?} useUTC true (default) to use UTC method to set the year; otherwise will use local date method.
     * @returns {void}
     */
    y: (value, amount, useUTC = true) =>
      useUTC
        ? value.setUTCFullYear(value.getUTCFullYear() + amount)
        : value.setFullYear(value.getFullYear() + amount),
    /**
     * Adds the given amount of quarters to the month portion of the date
     * @param {Date} date The Date to whose month portion the value will be added
     * @param {number} amount The amount of quarters to add to the month
     * @param {boolean?} useUTC true (default) to use UTC method to set the month; otherwise will use local date method.
     * @returns {void}
     */
    q: (value, amount, useUTC = true) =>
      useUTC
        ? value.setUTCMonth(value.getUTCMonth() + amount * 3)
        : value.setMonth(value.getMonth() + amount * 3),
    /**
     * Adds the given amount to the month portion of the date
     * @param {Date} date The Date to whose month portion the value will be added
     * @param {number} amount The amount to add to the month
     * @param {boolean?} useUTC true (default) to use UTC method to set the month; otherwise will use local date method.
     * @returns {void}
     */
    M: (value, amount, useUTC = true) =>
      useUTC
        ? value.setUTCMonth(value.getUTCMonth() + amount)
        : value.setMonth(value.getMonth() + amount),
    /**
     * Adds the given amount to the day portion of the date
     * @param {Date} date The Date to whose day portion the value will be added
     * @param {number} amount The amount to add to the day
     * @param {boolean?} useUTC true (default) to use UTC method to set the day; otherwise will use local date method.
     * @returns {void}
     */
    d: (value, amount, useUTC = true) =>
      useUTC
        ? value.setUTCDate(value.getUTCDate() + amount)
        : value.setDate(value.getDate() + amount),
    /**
     * Adds the given amount of weeks to the day portion of the date
     * @param {Date} date The Date to whose day portion the value will be added
     * @param {number} amount The amount of weeks to add to the day
     * @param {boolean?} useUTC true (default) to use UTC method to set the day; otherwise will use local date method.
     * @returns {void}
     */
    w: (value, amount, useUTC = true) =>
      useUTC
        ? value.setUTCDate(value.getUTCDate() + amount * 7)
        : value.setDate(value.getDate() + amount * 7),
    /**
     * Adds the given amount to the hour portion of the date
     * @param {Date} date The Date to whose hour portion the value will be added
     * @param {number} amount The amount to add to the hour
     * @param {boolean?} useUTC true (default) to use UTC method to set the hour; otherwise will use local date method.
     * @returns {void}
     */
    H: (value, amount, useUTC = true) =>
      useUTC
        ? value.setUTCHours(value.getUTCHours() + amount)
        : value.setHours(value.getHours() + amount),
    /**
     * Adds the given amount to the minute portion of the date
     * @param {Date} date The Date to whose minute portion the value will be added
     * @param {number} amount The amount to add to the minute
     * @param {boolean?} useUTC true (default) to use UTC method to set the minute; otherwise will use local date method.
     * @returns {void}
     */
    m: (value, amount, useUTC = true) =>
      useUTC
        ? value.setUTCMinutes(value.getUTCMinutes() + amount)
        : value.setMinutes(value.getMinutes() + amount),
    /**
     * Adds the given amount to the second portion of the date
     * @param {Date} date The Date to whose second portion the value will be added
     * @param {number} amount The amount to add to the second
     * @param {boolean?} useUTC true (default) to use UTC method to set the second; otherwise will use local date method.
     * @returns {void}
     */
    s: (value, amount, useUTC = true) =>
      useUTC
        ? value.setUTCSeconds(value.getUTCSeconds() + amount)
        : value.setSeconds(value.getSeconds() + amount),
    /**
     * Adds the given amount to the millisecond portion of the date
     * @param {Date} date The Date to whose millisecond portion the value will be added
     * @param {number} amount The amount to add to the millisecond
     * @param {boolean?} useUTC true (default) to use UTC method to set the millisecond; otherwise will use local date method.
     * @returns {void}
     */
    f: (value, amount, useUTC = true) =>
      useUTC
        ? value.setUTCMilliseconds(value.getUTCMilliseconds() + amount)
        : value.setMilliseconds(value.getMilliseconds() + amount),
  };
  /**
   * Maps a date unit to a method that sets that unit on a Date to a value.
   * Defaults to using UTC methods to do so.
   */
  static unitToSetter = {
    /**
     * Sets the year portion of the date to the given value
     * @param {Date} date The Date whose year portion will be set
     * @param {number} value The value to which to set the year
     * @param {boolean?} useUTC true (default) to use UTC method to set the year; otherwise will use local date method.
     * @returns {void}
     */
    y: (date, value, useUTC = true) =>
      useUTC ? date.setUTCFullYear(value) : date.setFullYear(value),
    /**
     * Sets the month portion of the date to the given value
     * @param {Date} date The Date whose month portion will be set
     * @param {number} value The value to which to set the month (0 = January, 11 = December)
     * @param {boolean?} useUTC true (default) to use UTC method to set the month; otherwise will use local date method.
     * @returns {void}
     */
    M: (date, value, useUTC = true) =>
      useUTC ? date.setUTCMonth(value) : date.setMonth(value),
    /**
     * Sets the day portion of the date to the given value
     * @param {Date} date The Date whose day portion will be set
     * @param {number} value The value to which to set the day
     * @param {boolean?} useUTC true (default) to use UTC method to set the day; otherwise will use local date method.
     * @returns {void}
     */
    d: (date, value, useUTC = true) =>
      useUTC ? date.setUTCDate(value) : date.setDate(value),
    /**
     * Sets the hour portion of the date to the given value
     * @param {Date} date The Date whose hour portion will be set
     * @param {number} value The value to which to set the hour
     * @param {boolean?} useUTC true (default) to use UTC method to set the hour; otherwise will use local date method.
     * @returns {void}
     */
    H: (date, value, useUTC = true) =>
      useUTC ? date.setUTCHours(value) : date.setHours(value),
    /**
     * Sets the minute portion of the date to the given value
     * @param {Date} date The Date whose minute portion will be set
     * @param {number} value The value to which to set the minute
     * @param {boolean?} useUTC true (default) to use UTC method to set the minute; otherwise will use local date method.
     * @returns {void}
     */
    m: (date, value, useUTC = true) =>
      useUTC ? date.setUTCMinutes(value) : date.setMinutes(value),
    /**
     * Sets the second portion of the date to the given value
     * @param {Date} date The Date whose second portion will be set
     * @param {number} value The value to which to set the second
     * @param {boolean?} useUTC true (default) to use UTC method to set the second; otherwise will use local date method.
     * @returns {void}
     */
    s: (date, value, useUTC = true) =>
      useUTC ? date.setUTCSeconds(value) : date.setSeconds(value),
    /**
     * Sets the millisecond portion of the date to the given value
     * @param {Date} date The Date whose millisecond portion will be set
     * @param {number} value The value to which to set the millisecond
     * @param {boolean?} useUTC true (default) to use UTC method to set the millisecond; otherwise will use local date method.
     * @returns {void}
     */
    f: (date, value, useUTC = true) =>
      useUTC ? date.setUTCMilliseconds(value) : date.setMilliseconds(value),
  };
  /**
   * Adds a given amount of a unit to a Date.
   * @param {Date|string|number} value The Date to which to add the amount of the given unit
   * @param {number} amount The amount to add (may be negative to subtract)
   * @param {string} unit The unit to add (must be one of 'y' (year), 'q' (quarter), 'M' (month), 'w' (week), 'd' (day),
   * 'H' (hour), 'm' (minute), 's' (second), 'f' (millisecond))
   * @param {boolean} useUTC true (default) to use UTC methods to add the amount; otherwise false to use local methods
   * @returns {Date} A new Date instance with the amount added. Note that when adding months, the day is kept to one
   * as close to the one in value as possible while still setting the month correctly. For instance if value is 2022-01-31,
   * amount is 1, and unit is 'M', the result will be 2022-02-28, since February only had 28 days in 2022. If the value was
   * 2024-01-31, and the rest the same, the result would be 2024-02-29, since February will have 29 days in 2024.
   */
  static add(value, amount, unit, useUTC = true) {
    if (!Object.keys(this.unitToAdder).includes(unit)) {
      Logger.warn(
        `unit passed to DateHelper.add was not in the list; "${unit}" is not one of 'y','q','M','w','d','H','m','s','f'.`
      );
      return value;
    }
    const newValue =
      typeof value === "number" ||
      (typeof value === "object" && value instanceof Date)
        ? new Date(value.valueOf())
        : DateHelper.parseDate(value, {});
    if (unit !== "M") {
      DateHelper.unitToAdder[unit](newValue, amount, useUTC);
    } else {
      newValue = DateHelper.setClosestDayInMonth(
        value,
        value.getMonth() + amount,
        null,
        useUTC
      );
    }
    return newValue;
  }
  /**
   * Sets the month on value to month, keeping the date as close to the same as possible.
   * @param {Date} value The date which will have its month set to month.
   * @param {number} month The month (0-indexed, so 0 = January, 11 = December)
   * @param {number|null|undefined} targetDay The target day to hit, if not the same as the date in value
   * @param {boolean} useUTC true (default) to use UTC functions; otherwise, false
   * @returns {Date} The date, now with month set appropriately, and the date set as close to
   * the same as value's, while staying in the same month.
   */
  static setClosestDayInMonth(value, month, targetDay, useUTC = true) {
    const originalDay =
      targetDay ?? (useUTC ? value.getUTCDate() : value.getDate());
    const newValue =
      typeof value === "number" ||
      (typeof value === "object" && value instanceof Date)
        ? new Date(value.valueOf())
        : DateHelper.parseDate(value, {});
    const newMonth = month === -1 ? 11 : month === 12 ? 0 : month;
    if (newMonth !== month && month === 12) {
      DateHelper.unitToAdder["y"](newValue, 1, useUTC);
    } else if (newMonth !== month && month === -1) {
      DateHelper.unitToAdder["y"](newValue, -1, useUTC);
    }
    month = newMonth;
    DateHelper.unitToSetter["M"](newValue, month, useUTC);
    // Setting the month to, say, February when the date is March 30th will result in a date of March 2nd
    // (non-leap year) or March 1st (leap year). If such a thing happens, subtract days until the original
    // month is achieved.
    if (useUTC) {
      if (newValue.getUTCMonth() > month) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" is not in the month desired`
        );
      }
      while (newValue.getUTCMonth() > month) {
        newValue.setUTCDate(newValue.getUTCDate() - 1);
      }
      //
      if (
        newValue.getUTCDate() !== originalDay &&
        DateHelper.getLastDayOfMonth(newValue) >= originalDay
      ) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" does not have the day desired (${originalDay})`
        );
        newValue.setUTCDate(originalDay);
      }
    } else {
      if (newValue.getMonth() > month) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" is not in the month desired`
        );
      }
      while (newValue.getMonth() > month) {
        newValue.setDate(newValue.getDate() - 1);
      }
      //
      if (
        newValue.getDate() !== originalDay &&
        DateHelper.getLastDayOfMonth(newValue) >= originalDay
      ) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" does not have the day desired (${originalDay})`
        );
        newValue.setDate(originalDay);
      }
    }
    return newValue;
  }
  /**
   * Sets the year on value to year, keeping the date as close to the same as possible.
   * @param {Date} value The date which will have its year set to year.
   * @param {number} year The year
   * @param {number|null|undefined} targetDay The target day to hit, if not the same as the date in value
   * @param {boolean} useUTC true (default) to use UTC functions; otherwise, false
   * @returns {Date} The date, now with year set appropriately, and the date set as close to
   * the same as value's, while staying in the same year.
   */
  static setClosestDayInYear(value, year, targetDay, useUTC = true) {
    const originalDay =
      targetDay ?? (useUTC ? value.getUTCDate() : value.getDate());
    const newValue =
      typeof value === "number" ||
      (typeof value === "object" && value instanceof Date)
        ? new Date(value.valueOf())
        : DateHelper.parseDate(value, {});
    DateHelper.unitToSetter["y"](newValue, year, useUTC);
    if (useUTC) {
      if (newValue.getUTCFullYear() > year) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" is not in the year desired`
        );
      }
      while (newValue.getUTCFullYear() > year) {
        newValue.setUTCDate(newValue.getUTCDate() - 1);
      }
      // Setting the year to, say, 2021 when the date is Feb 29, 2020, will cause the date to be
      // March 1, 2021 instead of Feb 2021. This makes it Feb 28, 2021.
      if (newValue.getUTCMonth() > month) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" is not in the month desired`
        );
      }
      while (newValue.getUTCMonth() > month) {
        newValue.setUTCDate(newValue.getUTCDate() - 1);
      }
      //
      if (
        newValue.getUTCDate() !== originalDay &&
        DateHelper.getLastDayOfMonth(newValue) >= originalDay
      ) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" does not have the day desired (${originalDay})`
        );
        newValue.setUTCDate(originalDay);
      }
    } else {
      if (newValue.getFullYear() > year) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" is not in the year desired`
        );
      }
      while (newValue.getFullYear() > year) {
        newValue.setDate(newValue.getDate() - 1);
      }
      if (newValue.getMonth() > month) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" is not in the month desired`
        );
      }
      while (newValue.getMonth() > month) {
        newValue.setDate(newValue.getDate() - 1);
      }
      //
      if (
        newValue.getDate() !== originalDay &&
        DateHelper.getLastDayOfMonth(newValue) >= originalDay
      ) {
        Logger.warn(
          `The date set, "${newValue
            .toISOString()
            .substring(0, 10)}" does not have the day desired (${originalDay})`
        );
        newValue.setDate(originalDay);
      }
    }

    return newValue;
  }
  /**
   * Validates that the options specified are indeed valid.
   * @param {DateHelperOptions} options An object with locale, format, and timeZone properties
   * @returns {DateHelperOptions} an object of the same shape as its argument, but now with known-good
   *  values.
   * @throws Error when any one of the properties are invalid
   */
  static validateOptions(options) {
    let { locale, format, timeZone } = options ?? {};
    const localeResult = DateHelper.parseLocales(locale);
    if (!localeResult.valid) {
      throw new Error(localeResult.error);
    }
    locale = localeResult.value;
    const formatResult = DateHelper.parseFormats(format);
    if (!formatResult.valid) {
      throw new Error(formatResult.error);
    }
    format = formatResult.value;
    const timeZoneResult = DateHelper.parseTimeZone(timeZone);
    if (!timeZoneResult.valid) {
      throw new Error(timeZoneResult.error);
    }
    timeZone = timeZoneResult.value;
    return { locale, format, timeZone };
  }
  /**
   * Parses the format(s) to ensure it/they are correct
   * @param {string|string[]|undefined|null} formats The format in which to format the date,
   *  or an array of such strings, or undefined or null (to use the locale's
   *  default format)
   * @returns {ParseDateHelperOptionResult} an object with possibly three properties;
   *  "valid", a Boolean indicating if the value(s) are correct;
   *  "value", a string or array of strings with the valid value(s);
   *  "error", a string, containing the errors that have occurred, if any;
   */
  static parseFormats(formats) {
    if (typeof formats === "undefined" || formats == null) {
      return {
        valid: true,
        value: [],
      };
    } else if (Array.isArray(formats)) {
      while (formats.some((f) => Array.isArray(f))) {
        formats = formats.flat();
      }
      const aggregateResult = formats.reduce(
        (agg, cur) => {
          const curResult = DateHelper.parseFormats(cur);
          agg.valid = agg.valid && curResult.valid;
          agg.value = [...agg.value, curResult.value];
          agg.error = `${agg.error}\n${curResult.error}`;
          return agg;
        },
        { valid: true, value: [], error: "" }
      );
      return aggregateResult;
    } else if (typeof formats === "string") {
      if (
        !Object.keys(DateHelper.stringsToFormatMap).some((k) =>
          formats.includes(k)
        )
      ) {
        const error = `The format provided, "${formats}", does not contain any valid format strings`;
        Logger.error(error);
        return {
          valid: false,
          error,
        };
      }
      const unsupportedFormatStrings = Object.keys(
        DateHelper.stringsToFormatMap
      ).filter(
        (k) =>
          formats.includes(k) &&
          DateHelper.stringsToFormatMap[k].supported === false
      );
      if (unsupportedFormatStrings.length) {
        const formattedUnsupported = JSON.stringify(
          unsupportedFormatStrings
        ).replace(/(\[|\])/g, "");
        const error = `The format provided, "${formats}", contains some unsupported format strings: ${formattedUnsupported}`;
        Logger.error(error);
        return {
          valid: false,
          error,
        };
      }
      return { valid: true, value: [formats] };
    } else {
      const error = `The format provided, "${formats}", is not a valid format`;
      Logger.error(error);
      return {
        valid: false,
        error,
      };
    }
  }
  /**
   * Generates an array of month names and stores them in the #monthNames
   * private static property, then returns that property.
   * @param {string} locale A valid BCP47 string or array of such
   *  representing the "locales" to use when generating month names.
   * @param {"long"|"short"|"narrow"} width The style of the month name
   *  to generate. Can only be "long", "short", or "narrow".
   * @returns {NamesByLocale} The month names, by locale and width/style
   */
  static #setMonthNames(locale, width) {
    locale = DateHelper.flatToFirst(locale);
    this.#monthNames[locale] ??= {};
    if (
      !Array.isArray(this.#monthNames[locale][width]) ||
      this.#monthNames[locale][width].length !== 12
    ) {
      let monthFormatter = new Intl.DateTimeFormat(locale, { month: width });
      this.#monthNames[locale][width] = Array.from({ length: 12 }, (_, i) =>
        monthFormatter.format(new Date(2022, i, 1))
      );
    }
    return this.#monthNames;
  }
  /**
   * Generates an array of weekday names and stores them in the #weekdayNames
   * private static property, then returns that property.
   * @param {string} locale A valid BCP47 string or array of such
   *  representing the "locales" to use when generating weekday names.
   * @param {"long"|"short"|"narrow"} width The style of the weekday name
   *  to generate. Can only be "long", "short", or "narrow".
   * @returns {NamesByLocale} The weekday names, by locale and width/style
   */
  static #setWeekdayNames(locale, width) {
    locale = DateHelper.flatToFirst(locale);
    this.#weekdayNames[locale] ??= {};
    if (
      !Array.isArray(this.#weekdayNames[locale][width]) ||
      this.#weekdayNames[locale][width].length !== 7
    ) {
      let weekdayFormatter = new Intl.DateTimeFormat(locale, {
        weekday: width,
      });
      this.#weekdayNames[locale][width] = Array.from(
        { length: 7 },
        (_, i) => weekdayFormatter.format(new Date(2022, 9, 2 + i)) // 2022-10-02 was a Sunday
      );
    }
    return this.#weekdayNames;
  }
  /**
   * Parses locales as BCP47 strings
   * @param {string|string[]} locales A valid BCP47 string or array of such
   *  representing the "locales" to use when formatting or parsing dates.
   * @returns {ParseDateHelperOptionResult} an object with possibly three properties;
   *  "valid", a Boolean indicating if the value(s) are correct;
   *  "value", a string or array of strings with the valid value(s);
   *  "error", a string, containing the errors that have occurred, if any;
   */
  static parseLocales(locales) {
    const widths = ["long", "short", "narrow"];
    if (typeof locales === "undefined" || locales === null) {
      return { valid: true, value: [] };
    } else if (Array.isArray(locales)) {
      const aggregateResult = locales.reduce(
        (agg, cur) => {
          const curResult = DateHelper.parseLocales(cur);
          agg.valid = agg.valid && curResult.valid;
          agg.value = [...agg.value, curResult.value];
          agg.error = `${agg.error}\n${curResult.error}`;
          return agg;
        },
        { valid: true, value: [], error: "" }
      );
      return aggregateResult;
    } else if (typeof locales === "string") {
      if (DateHelper.bcp47re.test(locales)) {
        for (let width of widths) {
          DateHelper.#setMonthNames(locales, width);
          DateHelper.#setWeekdayNames(locales, width);
        }
        return { valid: true, value: [locales] };
      } else {
        return {
          valid: false,
          error: `The locale specified, "${locales}", is not a valid BCP 47 language tag`,
          value: [],
        };
      }
    } else {
      return {
        valid: false,
        error: `The locale specified, "${locales}", is not a valid BCP 47 language tag`,
        value: [],
      };
    }
  }
  /**
   * Updates the supported values for the timeZoneName DateTimeFormatOption
   * based on the ability of the DateTimeFormat constructor to take the value
   * without throwing an error. (e.g., NodeJS doesn't support timeZoneName:
   * "longOffset", among others, as of 2022-11-14)
   */
  static #updateSupportedTimeZoneNames() {
    const unknownIfSupportedTimeZoneNames = Object.entries(
      DateHelper.stringsToFormatMap
    ).filter(
      ([key, map]) =>
        (key.includes("v") || key.includes("Z")) && !("supported" in map)
    );
    for (let tz of unknownIfSupportedTimeZoneNames) {
      let supported = false;
      const timeZoneName = tz[1].timeZoneName;
      try {
        const _ = new Intl.DateTimeFormat([], { timeZoneName });
        supported = true;
      } catch {
        Logger.warn(
          `Time zone cannot be formatted using "${tz[0]}" (${timeZoneName})`
        );
      }
      DateHelper.stringsToFormatMap[tz[0]] = {
        ...tz[1],
        supported,
      };
    }
  }
  /**
   * Parses timeZone as IANA Time Zone names.
   * @param {string|string[]|undefined|null} timeZone A valid IANA Time Zone
   * name string or array of such representing the time zone(s) to use when
   * formatting or parsing dates. undefined or null may be passed; if so, the
   * time zone will be set to "UTC".
   * @returns {ParseDateHelperOptionResult} an object with possibly three properties;
   *  "valid", a Boolean indicating if the value(s) are correct;
   *  "value", a string or array of strings with the valid value(s);
   *  "error", a string, containing the errors that have occurred, if any;
   */
  static parseTimeZone(timeZone) {
    DateHelper.#updateSupportedTimeZoneNames();
    if (
      typeof timeZone === "undefined" ||
      (typeof timeZone === "object" && timeZone === null)
    ) {
      return { valid: true, value: "UTC" };
    } else if (
      typeof timeZone === "string" &&
      tzdb.find((tz) => tz.timeZoneName.trim() === timeZone.trim())
    ) {
      return { valid: true, value: timeZone.trim() };
    } else if (
      Array.isArray(timeZone) &&
      tzdb.some((tz) =>
        timeZone.some((tZ) => tz.timeZoneName.trim() === tZ.trim())
      )
    ) {
      return { valid: true, value: timeZone };
    }
    return {
      valid: false,
      error: `The time zone specified, "${timeZone}", is not a valid time zone name`,
      value: "UTC",
    };
  }
  /**
   * Returns a list of time zones provided by the IANA tzdb.
   * @returns {TimeZoneInfo[]} an array of time zone information
   */
  static validTimeZones() {
    return tzdb;
  }
  /**
   * Returns a list of time zone names provided by the IANA tzdb.
   * @returns {string[]} an array of time zone names
   */
  static validTimeZoneNames() {
    return tzdb.map((tz) => tz.timeZoneName).sort();
  }
  /**
   * Gets the BCP 47 language tag for the locale used by the browser.
   * @returns {string|undefined|null} The locale the browser reports would be used if none was
   * provided.
   */
  static getProbableClientLocale() {
    return new Intl.DateTimeFormat().resolvedOptions().locale;
  }
  /**
   * Gets data about the likely time zone from the IANA Time Zone database
   * @param {string|string[]|undefined|null} locales The locale "A string with a BCP 47 language tag,
   * or an array of such strings. To use the browser's default locale, pass
   * an empty array."
   * @returns {TimeZoneInfo|undefined} The time zone object, if found in the IANA Time Zone database.
   */
  static getProbableClientTimeZone(locales) {
    const probableClientTimeZoneName = getProbableClientTimeZoneName(locales);
    return tzdb.find((tz) => tz.timeZoneName === probableClientTimeZoneName);
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
  static getProbableClientTimeZoneName(locales) {
    const localesResult = DateHelper.parseLocales(locales);
    if (!localesResult.valid) {
      throw new Error(localesResult.error);
    }
    const defaultFormat = new Intl.DateTimeFormat(localesResult.value);
    const options = defaultFormat.resolvedOptions();
    return options?.timeZone;
  }
  /**
   * Gets an array of IANA time zones that match the offset from UTC returned by getTimezoneOffset.
   * @returns {TimeZoneInfo[]} The array of IANA time zones.
   */
  static getPossibleClientTimeZones() {
    let rawOffset = new Date().getTimezoneOffset();
    const rawOffsetIsNegative = rawOffset < 0;
    rawOffset = Math.abs(rawOffset);
    // raw offset is the number of minutes less than UTC the current time zone is, so, say, EST is -05:00,
    // so raw offset will be 300 (not -300). The following creates a Date that number of hours past midnight
    // on the epoch, such that toISOString returns the formatted hours:minutes (new Date(0).toISOString()
    // would return 1970-01-01T00:00:00.000Z)
    const rawOffsetAsDate = new Date(rawOffset * 60000);
    const rawOffsetFormatted = rawOffsetAsDate.toISOString().substring(11, 16);
    // Note: the negative symbol below does not map to the standard US keyboard layout; it is
    // Unicode 2212(hex) MINUS SIGN.
    const offset = `${rawOffsetIsNegative ? "+" : "−"}${rawOffsetFormatted}`;
    return tzdb.filter(
      (tz) => tz.utcOffsetStandard === offset || tz.utcOffsetDST === offset
    );
  }
  /**
   * Same as getPossibleClientTimeZones, only just the names
   */
  static getPossibleClientTimeZoneNames() {
    return DateHelper.getPossibleClientTimeZones()
      .map((tz) => tz.timeZoneName)
      .sort();
  }
  /**
   * Gets the default format for dates and times.
   * @param {DateHelperOptions} options An object with locale, format, and timeZone properties
   * @param {string|string[]} options.locale (only the first element of an array will be used).
   * @param {undefined} options.format Will be ignored if present.
   * @param {string|string[]} options.timeZone (only the first element of an array will be used).
   * @returns {DatePartCollection} The default format for dates and times for the given locale and time zone,
   * expressed as a set of date and time parts.
   */
  static getDefaultFormatForDateAndTime(options) {
    let { locale, timeZone } = DateHelper.validateOptions(options);
    locale = DateHelper.flatToFirst(locale);
    timeZone = DateHelper.flatToFirst(timeZone);
    const defaultFormat = new Intl.DateTimeFormat(locale, { timeZone });
    const parts = defaultFormat.formatToParts(Date.now());
    const formatParts = new DatePartCollection(
      parts.map((part) => this.#guessDatePartFromFormatPart(part))
    );
    return formatParts;
  }
  /**
   * Uses basic heuristics to get better formatting information, based on the results
   * of formatting the date using some defaults.
   * @param {DatePart} part The part of the date to guess more infomration about
   * @returns {DatePart} A more fleshed out object with more formatting information
   */
  static #guessDatePartFromFormatPart(part) {
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
  /**
   * Gets the default format string for the specified locale
   * @param {string} locales The locale "A string with a BCP 47 language tag,
   * or an array of such strings. To use the browser's default locale, pass
   * an empty array."
   * @param {string} style The style of date and time to get the format of.
   * Can be "full", "long", "medium", or "short" (default).
   * @returns {string} The date format for the locale.
   */
  static getDefaultFormatForLocale(locales, style = "short") {
    if (![undefined, null, "full", "long", "medium", "short"].includes(style)) {
      throw new Error(
        `style must be undefined, null, "full", "long", "medium", or "short"`
      );
    }
    style ??= "short";
    const localesResult = DateHelper.parseLocales(locales);
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
          : this.#guessDatePartFromFormatPart(formatted[i])),
      };
      // part.type is going to be 'year', 'month', 'day', 'literal', ...
      let type = part[part.type];
      // type will have the formatting options for the given type (likely undefined for literal)
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
   * Gets the first date of the month.
   * @param {Date} value The date whose year and month information will be used to retried the first day
   * @param {boolean} useUTC true (default) to use UTC values from value; otherwise, false
   * @returns {Date} The Date at the first day of the month, with the same UTC (if useUTC is true) or local time as value.
   */
  static getFirstDateOfMonth(value, useUTC = true) {
    if (useUTC) {
      return new Date(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        1,
        value.getUTCHours(),
        value.getUTCMinutes(),
        value.getUTCSeconds(),
        value.getUTCMilliseconds()
      );
    }
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      1,
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds()
    );
  }
  /**
   * Gets the last date of the month.
   * @param {Date} value The date whose year and month information will be used to retried the last day
   * @param {boolean} useUTC true (default) to use UTC values from value; otherwise, false
   * @returns {Date} The Date at the last day of the month, with the same UTC (if useUTC is true) or local time as value.
   */
  static getLastDateOfMonth(value, useUTC = true) {
    if (useUTC) {
      return new Date(
        value.getUTCFullYear(),
        value.getUTCMonth() + 1,
        0,
        value.getUTCHours(),
        value.getUTCMinutes(),
        value.getUTCSeconds(),
        value.getUTCMilliseconds()
      );
    }
    return new Date(
      value.getFullYear(),
      value.getMonth() + 1,
      0,
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds()
    );
  }
  /**
   * Gets the last day of the month (also the number of days in the month)
   * @param {Date} value The date from which to get the month and year
   * @param {boolean} useUTC true (default) to use UTC functions; otherwise, false
   * @returns {number} The number indicating the last day of the month.
   */
  static getLastDayOfMonth(value, useUTC = true) {
    return DateHelper.getLastDateOfMonth(value, useUTC).getDate();
  }
  /**
   * Gets the first Sunday of the month.
   * @param {Date} value The date whose year and month information will be used to retrieve the first Sunday
   * @param {boolean} useUTC true (default) to use UTC values from value; otherwise, false
   * @returns {Date} The Date at the first Sunday of the month, with the same UTC (if useUTC is true) or local time as value.
   */
  static getFirstSunday(value, useUTC = true) {
    const firstOfMonth = DateHelper.getFirstDateOfMonth(value, useUTC);
    if (useUTC) {
      return new Date(
        firstOfMonth.getUTCFullYear(),
        firstOfMonth.getUTCMonth(),
        firstOfMonth.getUTCDate() - firstOfMonth.getDay(),
        value.getUTCHours(),
        value.getUTCMinutes(),
        value.getUTCSeconds(),
        value.getUTCMilliseconds()
      );
    }
    return new Date(
      firstOfMonth.getFullYear(),
      firstOfMonth.getMonth(),
      firstOfMonth.getDate() - firstOfMonth.getDay(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds()
    );
  }
  /**
   * Gets the last Saturday of the month.
   * @param {Date} value The date whose year and month information will be used to retried the last Saturday
   * @param {boolean} useUTC true (default) to use UTC values from value; otherwise, false
   * @returns {Date} The Date at the last Saturday of the month, with the same UTC (if useUTC is true) or local time as value.
   */
  static getLastSaturday(value) {
    const lastOfMonth = DateHelper.getLastDateOfMonth(value, useUTC);
    if (useUTC) {
      return new Date(
        lastOfMonth.getUTCFullYear(),
        lastOfMonth.getUTCMonth() + 1,
        6 + lastOfMonth.getDay(),
        value.getUTCHours(),
        value.getUTCMinutes(),
        value.getUTCSeconds(),
        value.getUTCMilliseconds()
      );
    }
    return new Date(
      lastOfMonth.getFullYear(),
      lastOfMonth.getMonth() + 1,
      6 + lastOfMonth.getDay(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds()
    );
  }
  /**
   * Determines if the given year is a leap year or not.
   * @param {string | number} year The year to determine whether it is a leap year or not.
   * @returns true if the year is a leap year; otherwise, false.
   */
  static isLeapYear(year) {
    let numericYear = year;
    if (typeof year === "string") {
      numericYear = parseInt(year, 10);
      if (isNaN(numericYear)) {
        throw new Error(
          `"${year}" cannot be parsed as a number, which is required for the year argument.`
        );
      }
    }
    const mod4 = (y) => y % 4 === 0;
    const mod100 = (y) => y % 100 === 0;
    const mod400 = (y) => y % 400 === 0;
    const isLeap = (year) => (mod4(year) && !mod100(year)) || mod400(year);
    return isLeap(numericYear);
  }
  /**
   * Gets the differences between two date objects.
   * @param {Date} a The first date to compare
   * @param {Date} b The second date to compare
   * @param {DateComparisonGranularity} dateGranularity The granularity at which to compare the dates
   * @param {(Date a, Date b) => {amount: number, unit: string})} dateGranularityCustom A custom function by which to compare the dates
   * @returns {amount: number, unit: string} An object containing the amount and unit by which the two values differ
   */
  static diffDates(
    a,
    b,
    dateGranularity = DateComparisonGranularity.Default,
    dateGranularityCustom = (a, b) => ({
      amount: a.valueOf() - b.valueOf(),
      unit: "ms",
    })
  ) {
    const diff = Math.abs(b.valueOf() - a.valueOf());
    switch (dateGranularity) {
      case DateComparisonGranularity.Custom:
        return dateGranularityCustom(a, b);
      case DateComparisonGranularity.Millisecond:
        return { amount: diff, unit: DateComparisonGranularity.Millisecond };
      case DateComparisonGranularity.Second:
        return {
          amount: diff / DateHelper.msPerSecond,
          unit: DateComparisonGranularity.Second,
        };
      case DateComparisonGranularity.Minute:
        return {
          amount: diff / DateHelper.msPerMinute,
          unit: DateComparisonGranularity.Minute,
        };
      case DateComparisonGranularity.Hour:
        return {
          amount: diff / DateHelper.msPerHour,
          unit: DateComparisonGranularity.Hour,
        };
      case DateComparisonGranularity.Day:
        return {
          amount: diff / DateHelper.msPerDay,
          unit: DateComparisonGranularity.Day,
        };
      case DateComparisonGranularity.Week:
        return {
          amount: diff / DateHelper.msPerWeek,
          unit: DateComparisonGranularity.Week,
        };
      case DateComparisonGranularity.Month: {
        // Counting months is a PITA
        let monthDays = [];
        const aDate = a.getDate();
        const aMonth = a.getMonth();
        const aYear = a.getFullYear();
        let aDayCount = new Date(aYear, aMonth + 1, 0).getDate();
        const bDate = b.getDate();
        const bMonth = b.getMonth();
        const bYear = b.getFullYear();
        let bDayCount = new Date(bYear, bMonth + 1, 0).getDate();
        if (aYear === bYear && aMonth === bMonth) {
          // e.g. a like 2021-01-01; b like 2021-01-23
          // -1 to take into account partial days (added back afterwards)
          monthDays = [
            { month: aMonth, dayCount: Math.abs(bDate - aDate) - 1 },
          ];
        } else if (aYear === bYear && bMonth - aMonth === 1) {
          // e.g. a like 2021-01-01; b like 2021-02-23
          // -1 to take into account partial days (added back afterwards)
          aDayCount = aDayCount - aDate - 1;
          bDayCount = bDate - 1;
          monthDays = [
            { month: aMonth, dayCount: aDayCount },
            { month: bMonth, dayCount: bDayCount },
          ];
        } else if (aYear === bYear && aMonth - bMonth === 1) {
          // e.g. a like 2021-02-01; b like 2021-01-23
          // -1 to take into account partial days (added back afterwards)
          aDayCount = aDate - 1;
          bDayCount = bDayCount - bDate - 1;
          monthDays = [
            { month: aMonth, dayCount: aDayCount },
            { month: bMonth, dayCount: bDayCount },
          ];
        } else if (aYear === bYear && bMonth > aMonth) {
          // e.g. a like 2021-01-01; b like 2021-04-23
          // -1 to take into account partial days (added back afterwards)
          // Make an array of months with the number of days in that month that were used
          monthDays = Array.from(
            { length: bMonth - aMonth },
            (_, i) => aMonth + i
          ).map((m) =>
            m === aMonth
              ? // For the month of the earlier date passed in, that's the number of days from that date to
                // the end of that month.
                {
                  month: m,
                  dayCount: new Date(aYear, m + 1, 0).getDate() - aDate,
                }
              : m === bMonth
              ? // For the month of the later date passed in, that's the date of that month
                { month: m, dayCount: bDate - 1 }
              : // For every other year and month, it's the total number of days in the month for that year
                { month: m, dayCount: new Date(aYear, m + 1, 0).getDate() }
          );
        } else if (aYear === bYear && aMonth > bMonth) {
          // e.g. a like 2021-04-01; b like 2021-01-23
          monthDays = Array.from(
            { length: aMonth - bMonth },
            (_, i) => bMonth + i
          ).map((m) =>
            m === bMonth
              ? {
                  month: m,
                  dayCount: new Date(bYear, m + 1, 0).getDate() - bDate,
                }
              : m === aMonth
              ? { month: m, dayCount: aDate - 1 }
              : { month: m, dayCount: new Date(bYear, m + 1, 0).getDate() }
          );
        } else if (bYear > aYear) {
          // e.g. a like 2021-04-01; b like 2023-01-23
          monthDays = Array.from(
            { length: bYear - aYear + 1 },
            (_, i) => aYear + i
          )
            .map((y) => {
              if (y === aYear) {
                // If it's the year of the earlier date passed in, get the year, plus an array of months
                // from the month passed in to the end of that year
                return [
                  y,
                  Array.from({ length: 12 - aMonth }, (_, i) => aMonth + i),
                ];
              } else if (y !== aYear && y !== bYear) {
                // If it's one of the years between the earlier and later dates, get the year, plus an
                // array of 12 months.
                return [y, Array.from({ length: 12 }, (_, i) => i)];
              }

              // Otherwise, it's the year of the later date passed in, so get the yet, plus an array of
              // months from the month of the later date to the beginning of the year.
              return [
                y,
                Array.from({ length: bMonth + 1 }, (_, i) => bMonth - i),
              ];
            })
            // Reorganize data from a 2d array to a flat array of objects with year and month properties
            .map(([year, months]) => [
              ...months.map((month) => ({ year, month })),
            ])
            .flat()
            // Sort the array of object by year then month
            .sort((x, y) =>
              x.year - y.year === 0 ? x.month - y.month : x.year - y.year
            )
            // Then add a dayCount property counting the number of days used in that year and month
            .map(({ y, m }) =>
              y === aYear && m === aMonth
                ? // For the month of the first date passed in, that's the number of days from that date to
                  // the end of that month.
                  {
                    year: y,
                    month: m,
                    dayCount: new Date(aYear, m + 1, 0).getDate() - aDate,
                  }
                : y === bYear && m === bMonth
                ? // For the month of the second date passed in, that's the date of that month
                  { year: y, month: m, dayCount: bDate - 1 }
                : // For every other year and month, it's the total number of days in the month for that year
                  {
                    year: y,
                    month: m,
                    dayCount: new Date(y, m + 1, 0).getDate(),
                  }
            );
        } else if (aYear > bYear) {
          // e.g. a like 2023-04-01; b like 2021-01-23
          monthDays = Array.from(
            { length: aYear - bYear + 1 },
            (_, i) => bYear + i
          )
            .map((y) => {
              if (y === bYear) {
                return [
                  y,
                  Array.from({ length: 12 - bMonth }, (_, i) => bMonth + i),
                ];
              } else if (y !== aYear && y !== bYear) {
                return [y, Array.from({ length: 12 }, (_, i) => i)];
              }

              return [
                y,
                Array.from({ length: aMonth + 1 }, (_, i) => aMonth - i),
              ];
            })
            .map(([year, months]) => [
              ...months.map((month) => ({ year, month })),
            ])
            .flat()
            .sort((x, y) =>
              x.year - y.year === 0 ? x.month - y.month : x.year - y.year
            )
            .map(({ y, m }) =>
              y === bYear && m === bMonth
                ? {
                    year: y,
                    month: m,
                    dayCount: new Date(bYear, m + 1, 0).getDate() - bDate,
                  }
                : y === aYear && m === aMonth
                ? { year: y, month: m, dayCount: aDate - 1 }
                : {
                    year: y,
                    month: m,
                    dayCount: new Date(y, m + 1, 0).getDate(),
                  }
            );
        }
        // Got total number of days, need to add on number of ms difference
        let addOnTime = 0;
        // Creates four variables with the number of milliseconds from one of the Dates specified to midnight of the same day,
        // and to midnight of the next day. BOD = Beginning of Day = midnight on the date given. EOD = End of Day = midnight on the next day.
        const aTimeFromBOD =
          a.valueOf() -
          new Date(
            a.getFullYear(),
            a.getMonth(),
            a.getDate(),
            0,
            0,
            0,
            0
          ).valueOf();
        const aTimeToEOD =
          new Date(
            a.getFullYear(),
            a.getMonth(),
            a.getDate() + 1,
            0,
            0,
            0,
            0
          ).valueOf() - a.valueOf();
        const bTimeFromBOD =
          b.valueOf() -
          new Date(
            b.getFullYear(),
            b.getMonth(),
            b.getDate(),
            0,
            0,
            0,
            0
          ).valueOf();
        const bTimeToEOD =
          new Date(
            b.getFullYear(),
            b.getMonth(),
            b.getDate() + 1,
            0,
            0,
            0,
            0
          ).valueOf() - b.valueOf();
        if (a.valueOf() > b.valueOf()) {
          addOnTime = aTimeFromBOD + bTimeToEOD;
        } else if (a.valueOf() < b.valueOf()) {
          addOnTime = aTimeToEOD + bTimeFromBOD;
        }
        monthDays = monthDays.map(({ dayCount, month, year }) => ({
          totalMs:
            new Date(year ?? aYear, month + 1, 0).getDate() *
            DateHelper.msPerDay,
          year: year ?? aYear,
          ms: dayCount * DateHelper.msPerDay,
          month,
        }));
        // The additional time is added to the first month's number of milliseconds because
        // a) there could be only one month and
        // b) it seemed like a good idea at the time.
        return {
          amount: monthDays.reduce(
            (agg, cur, idx) =>
              agg + (cur.ms + (idx === 0 ? addOnTime : 0)) / cur.totalMs,
            0
          ),
          unit: DateComparisonGranularity.Month,
        };
      }
      case DateComparisonGranularity.Quarter:
        return {
          amount:
            DateHelper.diffDates(a, b, DateComparisonGranularity.Month).amount /
            3,
          unit: DateComparisonGranularity.Quarter,
        };
      case DateComparisonGranularity.Year: {
        const aYear = a.getFullYear();
        const bYear = b.getFullYear();
        const mod4 = (y) => y % 4 === 0;
        const mod100 = (y) => y % 100 === 0;
        const mod400 = (y) => y % 400 === 0;
        const isLeap = (year) => (mod4(year) && !mod100(year)) || mod400(year);
        // years will be an array of all of the years between a and b (might be one year)
        const years =
          bYear > aYear
            ? Array.from({ length: bYear - aYear + 1 }, (_, i) => aYear + i)
            : bYear === aYear
            ? [bYear]
            : Array.from({ length: aYear - bYear + 1 }, (_, i) => bYear + i);
        const hasLeap = years.some((y) => isLeap(y));
        if (!hasLeap) {
          return {
            amount: diff / DateHelper.msPerYear,
            unit: DateComparisonGranularity.Year,
          };
        } else {
          const yearCounts = years
            .map((y) => ({
              year: y,
              ms: isLeap(y) ? DateHelper.msPerLeapYear : DateHelper.msPerYear,
            }))
            .map(({ year, ms }) =>
              year === aYear
                ? {
                    year,
                    ms,
                    message: `diff "${a.toISOString()}" and "${new Date(
                      aYear + 1,
                      0,
                      1,
                      0,
                      0,
                      0,
                      0
                    ).toISOString()}"`,
                    amt: DateHelper.diffDates(
                      a,
                      new Date(aYear + 1, 0, 1, 0, 0, 0, 0)
                    ).amount,
                    count:
                      DateHelper.diffDates(
                        a,
                        new Date(aYear + 1, 0, 1, 0, 0, 0, 0)
                      ).amount / ms,
                  }
                : year === bYear
                ? {
                    year,
                    ms,
                    message: `diff "${new Date(
                      bYear - 1,
                      11,
                      32,
                      0,
                      0,
                      0,
                      0
                    ).toISOString()}" and "${b.toISOString()}"`,
                    amt: DateHelper.diffDates(
                      new Date(bYear - 1, 11, 32, 0, 0, 0, 0),
                      b
                    ).amount,
                    count:
                      DateHelper.diffDates(
                        new Date(bYear - 1, 11, 32, 0, 0, 0, 0),
                        b
                      ).amount / ms,
                  }
                : {
                    year,
                    ms,
                    message: "whole year",
                    amt: ms,
                    count: ms / ms,
                  }
            );
          return {
            amount: yearCounts.reduce((agg, cur) => agg + cur.count, 0),
            unit: DateComparisonGranularity.Year,
          };
        }
      }
      case DateComparisonGranularity.Era:
        // Era in this case is defined the same as in Intl.DateTimeFormat, i.e., are both dates in AD or BC?
        const eraFormatter = new Intl.DateTimeFormat([], { era: "short" });
        const eraIsTheSame =
          eraFormatter.formatToParts(a).find((p) => p.type === "era").value ===
          eraFormatter.formatToParts(b).find((p) => p.type === "era").value;
        return {
          amount: eraIsTheSame ? 0 : Number.POSITIVE_INFINITY,
          unit: DateComparisonGranularity.Era,
        };
    }
    return diff;
  }
  /**
   * Indicates whether a is the same date as b at the specified granularity.
   * @param {Date} a The Date that may be the same as a
   * @param {Date} b The Date that is the subject of comparison
   * @param {DateComparisonGranularity} granularity The granularity at which the specified values can be considered the same.
   * @returns {boolean} true of a and b have the same date at the specified granularity. Uses local time.
   */
  static isSame(a, b, granularity) {
    var similarity = DateHelper.diffDates(a, b, granularity);
    return similarity.amount <= 1 && similarity.unit === granularity;
  }
  /**
   * Indicates whether a is the same date as b.
   * @param {Date} a The Date that may be the same as a
   * @param {Date} b The Date that is the subject of comparison
   * @returns {boolean} true of a and b have the same date, irrespective of the time. Uses local time.
   */
  static isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  /**
   * Indicates whether a is before b.
   * @param {Date} a The Date that may be before b
   * @param {Date} b The Date that is the subject of comparison
   * @param {DateComparisonGranularity} granularity The granularity at which the specified values are to be compared.
   * @returns {boolean} true if a is before b at the specified granularity. Uses local time.
   */
  static isBefore(a, b, granularity) {
    var similarity = DateHelper.diffDates(a, b, granularity);
    return similarity.amount <= 1 && similarity.unit === granularity;
  }
  /**
   * Indicates whether a is before b.
   * @param {Date} a The Date that may be before b
   * @param {Date} b The Date that is the subject of comparison
   * @returns {boolean} true if a is before b, irrespective of time. Uses local time.
   */
  static isBeforeDay(a, b) {
    return (
      a.getFullYear() < b.getFullYear() ||
      (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth()) ||
      (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() < b.getDate())
    );
  }
  /**
   * Indicates whether a is after b.
   * @param {Date} a The Date that may be after b
   * @param {Date} b The Date that is the subject of comparison
   * @param {DateComparisonGranularity} granularity The granularity at which the specified values are to be compared.
   * @returns {boolean} true if a is after b at the specified granularity. Uses local time.
   */
  static isAfter(a, b, granularity) {
    var similarity = DateHelper.diffDates(a, b, granularity);
    return similarity.amount > 1 && similarity.unit === granularity;
  }
  /**
   * Indicates whether a is after b.
   * @param {Date} a The Date that may be after b
   * @param {Date} b The Date that is the subject of comparison
   * @returns {boolean} true if a is after b, irrespective of time. Uses local time.
   */
  static isAfterDay(a, b) {
    return (
      a.getFullYear() > b.getFullYear() ||
      (a.getFullYear() === b.getFullYear() && a.getMonth() > b.getMonth()) ||
      (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() > b.getDate())
    );
  }
  /**
   * Returns the first element of the given array, when sufficiently flattened, or the item itself
   * if not an array.
   * @param {any[] | any} arr Array of values or arrays or single value
   * @returns {any} If given a single value, returns the single value; if given a single dimension array,
   * returns the first item; if given a multiple-dimension array, flattens the array until the
   * first element is not an array and returns that first element.
   */
  static flatToFirst(arr) {
    let value = Array.isArray(arr) && arr.length ? arr[0] : arr;
    while (Array.isArray(value)) {
      value = value[0];
    }

    return value;
  }
  /**
   * Flattens mutliple dimension arrays or injects elements into arrays until a single, single-dimension
   * array is returned.
   * @param {any[] | any} arr Array of values or arrays, or a single value
   * @returns {any[]} If given a single value, returns an array with that value as its only eleement;
   * if given a single dimension array, returns that array; if given a multiple dimension array, flattens
   * the array until a single dimension remains, and returns that array.
   */
  static makeSingleDimArray(arr) {
    let value = Array.isArray(arr) ? arr : [arr];
    while (
      Array.isArray(value) &&
      value.length &&
      value.some((item) => Array.isArray(item))
    ) {
      value = value.flat();
    }

    return value;
  }
  /**
   * Parses a format into a collection of DateParts, similar to DateTimeFormat's formatToParts.
   * @param {string} format The format to parse
   * @param {object} options General options for all functions.
   * @returns {DatePartCollection} A collection of DateParts detailing the format in terms
   * of how to format each part and any literal strings to add between parts.
   */
  static parseFormatToParts(format, options) {
    let { locale, timeZone } = DateHelper.validateOptions(options);
    locale = DateHelper.flatToFirst(locale);
    timeZone = DateHelper.flatToFirst(timeZone);
    const styles = ["full", "long", "medium", "short", "iso"];
    const stringsToFind = Object.keys(DateHelper.stringsToFormatMap);
    let formatted = format;
    let result = new DatePartCollection();
    for (let f of stringsToFind) {
      if (formatted.includes(f)) {
        const isStyle = styles.some((style) => f.includes(style));
        const part = new DatePart({
          ...DateHelper.stringsToFormatMap[f],
          locale,
          timeZone,
        });
        if (!isStyle) {
          part.name = DateHelper.stringsToFormatMap[f].name;
          part.type = DateHelper.stringsToFormatMap[f].type;
          part.field = f;
          part.index = formatted.indexOf(f);
          part.length = Math.max(
            f.length,
            part[part.type]?.toString().includes("2") ? 2 : 0
          );
          result.add(part, false);
          formatted = formatted.replace(f, "_".repeat(f.length));
        } else if (f === "iso") {
          // Always the same array of objects
          return new DatePartCollection([
            {
              ...DateHelper.stringsToFormatMap.yyyy,
              index: 0,
              length: 4,
              field: "yyyy",
              locale,
              timeZone,
            },
            { type: "literal", index: 5, length: 1, value: "-" },
            {
              ...DateHelper.stringsToFormatMap.MM,
              index: 6,
              length: 2,
              field: "MM",
              locale,
              timeZone,
            },
            { type: "literal", index: 8, length: 1, value: "-" },
            {
              ...DateHelper.stringsToFormatMap.dd,
              index: 9,
              length: 2,
              field: "dd",
              locale,
              timeZone,
            },
            { type: "literal", index: 11, length: 1, value: "T" },
            {
              ...DateHelper.stringsToFormatMap.HH,
              index: 12,
              length: 2,
              field: "HH",
              locale,
              timeZone,
            },
            { type: "literal", index: 14, length: 1, value: ":" },
            {
              ...DateHelper.stringsToFormatMap.mm,
              index: 15,
              length: 2,
              field: "mm",
              locale,
              timeZone,
            },
            { type: "literal", index: 17, length: 1, value: ":" },
            {
              ...DateHelper.stringsToFormatMap.ss,
              index: 18,
              length: 2,
              field: "ss",
              locale,
              timeZone,
            },
            { type: "literal", index: 20, length: 1, value: "." },
            {
              ...DateHelper.stringsToFormatMap.fff,
              index: 21,
              length: 3,
              field: "fff",
              locale,
              timeZone,
            },
            { type: "literal", index: 24, length: 1, value: "Z" },
          ]);
        } else {
          // TODO: Figure out what to do with format styles (e.g., dateStyle: "long")
        }
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
      length: value?.toString()?.length
    }));

    const literals = literalsPass5.map((literal) => new DatePart(literal));

    for (let l = 0, z = literals.length; l < z; l++) {
      const literal = literals[l];
      const lastOne = l === z - 1;
      result.add(literal, lastOne);
    }

    return result;
  }
  /**
   * Formats the part of the date specified
   * @param {Date} date The Date object to format
   * @param {DatePart} part The part of the date to format
   * @param {DateHelperOptions} options Optional hash of overrides for the properties set on the object.
   * @returns {string} The specified part of the date, formatted per the instructions in part.
   */
  static formatDatePart(date, part, options) {
    if (part.type === "literal") {
      return part.value;
    }
    let { locale, format, timeZone } = DateHelper.validateOptions(options);
    if (isNaN(date.valueOf())) {
      throw new Error(`The date given, "${date}", is not a valid Date.`);
    }

    locale = DateHelper.flatToFirst(locale);
    format = DateHelper.flatToFirst(format);

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
      partOptions.type === "millisecond"
        ? "fractionalSecond"
        : partOptions.type;
    let optionName =
      partType === "fractionalSecond" ? "fractionalSecondDigits" : partType;
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
        value = value.padStart(2, "0");
      } else if (resolvedOption === "2-digit" && option === "numeric") {
        value = parseInt(value).toString();
      } else if (
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
   * Formats a given date according to a specified locale and format string, in an optional time zone
   * @param {Date} date The Date object to format
   * @param {DateHelperOptions?} options Optional hash of overrides for the properties set on the object.
   * @returns {string} The formatted date.
   */
  static formatDate(date, options) {
    let { locale, format, timeZone } = DateHelper.validateOptions(options);
    if (isNaN(date.valueOf())) {
      throw new Error(`The date given, "${date}", is not a valid Date.`);
    }

    options.locale = DateHelper.flatToFirst(locale);
    options.format = DateHelper.flatToFirst(format);
    options.timeZone = DateHelper.flatToFirst(timeZone);
    if (options.format == null) {
      // When format is not specified, format to the locale's default "short" style for date and time
      return new Intl.DateTimeFormat(options.locale, {
        dateStyle: "short",
        timeStyle: "short",
        timeZone,
      }).format(date);
    }
    const formatParts = DateHelper.parseFormatToParts(options.format, options);
    const result = [];

    for (const part of formatParts) {
      let value = DateHelper.formatDatePart(date, part, options);
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
  /**
   * Sets the part of the date specified with the value given.
   * @param {string} value The value getting parsed
   * @param {DatePart} part The part of the date to set
   * @param {Date} date The Date whose part will get set
   * @param {DateHelperOptions} options Options for the process
   * @returns {trySetDatePartFromPartReturnValue} The result of attempting to set the date part as instructed.
   */
  static #trySetDatePartFromPart(value, part, date, options) {
    let partValue;
    try {
      partValue = this.#getPartFromValue(value, part, options);
    } catch (e) {
      Logger.warn(e.message);
      return { success: false };
    }

    if (!Number.isNaN(+partValue) && +partValue !== 0) {
      if (part.type === "month") {
        partValue = +partValue - 1;
      }
      if (part.type === "year" && +partValue < 2000) {
        debugger;
      }
      if (!part.setter) {
        Logger.error(
          `Could not find a setter for the part ${JSON.stringify(
            part,
            null,
            2
          )}`
        );
        return { success: false };
      }
      part.setter(date, +partValue, options.timeZone === "UTC");
      return { success: true, value: partValue };
    } else {
      const partType = part.type;
      if (partType) {
        const form = part[partType];
        const locale = DateHelper.flatToFirst(options.locale);
        let names = [];
        switch (partType) {
          case "month":
            names = DateHelper.#monthNames?.[locale]?.[form] ?? [];
            break;
          case "weekday":
            names = DateHelper.#weekdayNames?.[locale]?.[form] ?? [];
            break;
        }
        const namedPartValue = names.indexOf(
          partValue ?? value.slice(part.index, part.end)
        );
        if (namedPartValue > -1) {
          part.setter(date, namedPartValue, options.timeZone === "UTC");
          return { success: true, value: namedPartValue };
        } else {
          Logger.warn(
            `The ${part.name} portion, "${value.slice(
              part.index,
              part.end
            )}" was not able to be parsed as a ${partType} name`
          );
        }
      } else {
        Logger.warn(
          `The ${part.name} portion, "${value.slice(
            part.index,
            part.end
          )}" was not able to be parsed as a number; #trySetDatePartFromPart`
        );
      }
    }

    return { success: false };
  }
  /**
   * Gets the part of the string value getting parsed that corresponds to the part of the date specified
   * @param {string} value The value getting parsed
   * @param {DatePart} part The part of the date to get from the value
   * @param {DateHelperOptions} options Options for the process
   * @returns {string} The part of the value representing the part of the date requested
   */
  static #getPartFromValue(value, part, options) {
    if (!part || part.index == null || isNaN(part.index)) {
      const error = `The part specified, ${
        part ? JSON.stringify(part) : part
      }, is not valid`;
      Logger.error(error);
      throw new Error(error);
    }
    let makesSense = !/[^\p{L}\p{N}]/gu.test(value.slice(part.index, part.end));
    let partValue = value
      .slice(part.index, part.end)
      .replace(/[^\p{L}\p{N}]/gu, "");
    if (makesSense && part.type === "year") {
      if (
        Array.isArray(options.locale) &&
        options.locale.every((locale) => !locale.includes("calendar"))
      ) {
        makesSense = makesSense && +partValue > 1800;
      }
      if (
        typeof options.locale === "string" &&
        !options.locale.includes("calendar")
      ) {
        makesSense = makesSense && +partValue > 1800;
      }
      while (!makesSense) {
        part.length += 1;
        makesSense =
          !/[^\p{L}\p{N}]/gu.test(value.slice(part.index, part.end)) &&
          +value.slice(part.index, part.end) > 1800;
      }
      partValue = value
        .slice(part.index, part.end)
        .replace(/[^\p{L}\p{N}]/gu, "");
    }

    if (!makesSense) {
      Logger.warn(
        `The part requested, ${part.name}, does not seem to fit at the` +
          ` index and length provided. What was pulled: "${value.slice(
            part.index,
            part.end
          )}"`
      );
    }
    return partValue;
  }
  /**
   * Gets the Gregorian year that corresponds to the given era and year in the Japanese calendar.
   * @param {string} era The era, formatted to its "narrow" format (if formatted otherwise,
   * will be automatically converted)
   * @param {Date} date The date, with the year value set to the Japanese year within the
   * era (e.g., 3 with an era of R means the 3rd year of the Reiwa era, equivalient to 2022)
   * @returns {string|number|undefined} The Gregorian year equivalent to the specified era and year.
   * @todo Currently the only valid eras this works for are from the Meiji (~1869) through
   * the current (2022) Reiwa. Historical eras would require more detailed references than I
   * could find in my initial search of the internet. This will also need to be updated should
   * Japan get a new emperor or otherwise change their calendar implementation.
   */
  static #getGregorianYearFromJapaneseEraAndDate(era, date) {
    if (!era || era.length === 0) {
      const error = `An attempt was made to get era information, but the era was null, undefined, or blank.`;
      Logger.error(error);
      throw new Error(error);
    }
    const yearValue = date.getFullYear();
    const monthValue = date.getMonth() + 1;
    const dayValue = date.getDate();
    if (era.length === 1) {
      if (era === "R") {
        // Reiwa
        if (yearValue > 1 || monthValue > 4) {
          return 2018 + yearValue;
        }
      } else if (era === "H") {
        // Heisei
        if (
          (yearValue === 1 && monthValue === 1 && dayValue > 7) ||
          yearValue > 1 ||
          (yearValue == 31 && monthValue < 7)
        ) {
          return 1988 + yearValue;
        }
      } else if (era === "S") {
        // Showa
        if (
          (yearValue === 1 && monthValue === 12 && dayValue > 24) ||
          yearValue > 1 ||
          (yearValue === 64 && monthValue === 1 && dayValue < 8)
        ) {
          return 1925 + yearValue;
        }
      } else if (era === "T") {
        // Taisho
        if (
          (yearValue === 1 && monthValue === 7 && dayValue > 30) ||
          yearValue > 1 ||
          (yearValue === 15 && monthValue === 12 && dayValue < 25)
        ) {
          return 1911 + yearValue;
        }
      } else if (era === "M") {
        // Meiji
        if (
          (yearValue === 1 && monthValue === 9 && dayValue > 8) ||
          yearValue > 1 ||
          (yearValue === 45 && monthValue === 7 && dayValue < 31)
        ) {
          return 1867 + yearValue;
        }
      }
    } else {
      return this.#getGregorianYearFromJapaneseEraAndDate(
        this.#japaneseShortEraToNarrowEra.get(era),
        date
      );
    }
  }
  /**
   * A map between the short format of a Japanese era and its narrow equivalent.
   */
  static #japaneseShortEraToNarrowEra = new Map([
    ["令和", "R"],
    ["平成", "H"],
    ["昭和", "S"],
    ["大正", "M"],
  ]);
  /**
   * A map between the format symbol used and the expected number of characters used when
   * the value is formatted.
   */
  static #japaneseEraInfo = {
    GGGGG: {
      length: 1,
    },
    GGGG: {
      length: 2,
    },
    GGG: {
      length: 2,
    },
  };
  /**
   * Gets the Gregorian year equivalent of the given era and year in the Japanese calendar.
   * @param {string|undefined} value The value from which to get the year.
   * @param {DatePartCollection} parts The parts of the date currently getting parsed.
   * @param {DateHelperOptions} options Hash of options used when parsing the date.
   * @returns {string|number|undefined} The Gregorian year
   */
  static #getGregorianYearFromJapaneseEraAndYear(value, parts, options) {
    this.#validatePartsAndSetEnds(parts);
    const eraPart = parts.getByType("era");
    const eraLength = eraPart.length;
    eraPart.length = DateHelper.#japaneseEraInfo[eraPart.field]?.length ?? 0;
    const yearPart = parts.getByType("year");
    const eraLengthDiff = eraLength - eraPart.length;
    if (eraLengthDiff !== 0) {
      for (const partAfterEra of parts.filter(
        (part) => part.index > eraPart.index
      )) {
        partAfterEra.index -= eraLengthDiff;
      }
    }
    const monthPart = parts.getByType("month");
    const dayPart = parts.getByType("day");
    const era = this.#getPartFromValue(value, eraPart, options);
    const yearLength = yearPart.length;
    const year = this.#getPartFromValue(value, yearPart, options);
    const yearLengthDiff = yearLength - yearPart.length;
    if (yearLengthDiff !== 0) {
      for (const partAfterYear of parts.filter(
        (part) => part.index > yearPart.index
      )) {
        partAfterYear.index -= yearLengthDiff;
      }
    }
    const monthLength = monthPart.length;
    const month = this.#getPartFromValue(value, monthPart, options);
    const monthLengthDiff = monthLength - monthPart.length;
    if (monthLengthDiff !== 0) {
      for (const partAfterMonth of parts.filter(
        (part) => part.index > monthPart.index
      )) {
        partAfterMonth.index -= monthLengthDiff;
      }
      dayPart.end = value.length;
      dayPart.length = dayPart.end - dayPart.index;
    }
    const day = this.#getPartFromValue(value, dayPart, options);
    const yearValue = year ? parseInt(year, 10) : undefined;
    if (yearValue === undefined) {
      throw new Error(`Could not get year from value "${value}"`);
    }
    const monthValue = month ? parseInt(month, 10) : undefined;
    if (monthValue === undefined) {
      throw new Error(`Could not get month from value "${value}"`);
    }
    const dayValue = day ? parseInt(day, 10) : undefined;
    if (dayValue === undefined) {
      throw new Error(`Could not get day from value "${value}"`);
    }
    const date = new Date(yearValue, monthValue - 1, dayValue);
    date.setFullYear(yearValue); // only way to get years prior to 1900
    return this.#getGregorianYearFromJapaneseEraAndDate(era, date);
  }
  /**
   * Validates that the collection of parts are in order and are valid (i.e., each index
   * starts where the last one ended, and there are no gaps)
   * @param {DatePartCollection} parts The parts to validate
   */
  static #validatePartsAndSetEnds(parts) {
    let lastIndex = 0;
    let lastEnd = 0;
    for (let i = 0, z = parts.length; i < z; i++) {
      const part = parts[i];
      if (i === 0) {
        lastIndex = part.index;
        if (lastIndex !== 0) {
          Logger.warn(
            `The first part, ${part.name}, does not have an index of 0...`
          );
        }
        lastEnd = part.end;
      } else {
        if (part.index !== lastEnd) {
          Logger.warn(
            `The part ${part.name} has an index, ${part.index}, that is not equal to the previous part's ending index ${lastEnd}; resetting to that value`
          );
          part.index = lastEnd;
        }
        if ((part.length ?? 0) === 0) {
          Logger.warn(
            `The part ${part.name} has an invalid length of ${
              part.length
            }; resetting to ${part.value?.length ?? 1}`
          );
          part.length = part.value?.length ?? 1; // default length to 1
        }
        lastEnd = part.end;
      }
    }
  }
  /**
   * Uses parts pulled from a format to create a Date from a string value, using options.
   * @param {string} value The original string getting parsed
   * @param {DatePartCollection} parts An array of objects representing the parts of a Date
   * that have been parsed from value
   * @param {DateHelperOptions} options Optional hash of overrides for the properties set on
   * the object.
   * @returns {Date} The Date value parsed by using the parts to extract data from value.
   */
  static #getDateFromParts(value, parts, options) {
    // Currently only parsing numeric values and month names, but not weekdays; not sure
    // what to do with a weekday even if I did parse it successfully; Given a year, a month,
    // and a day, I'd already know the weekday, so what if the parsed one is different? If I
    // get a year, a month, and a weekday, I'd need a week number to know what day it is,
    // and there currently is no token for week number.
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
    this.#validatePartsAndSetEnds(parts);
    // Special handling for Japanese era/year parsing; only used when locale
    // includes "-u-ca-japanese" (i.e., the Japanese calendar)
    if (
      ((Array.isArray(options.locale) &&
        options.locale.flat(3).some((locale) => locale.includes("japanese"))) ||
        (options.locale && options.locale.includes("japanese"))) &&
      parts.hasType("era") &&
      parts.hasType("year")
    ) {
      const gregorianYear = this.#getGregorianYearFromJapaneseEraAndYear(
        value,
        parts,
        options
      );
      // This should cover several common formats for Japanese calendar:
      // Gy/M/d
      // Gy/MM/dd
      // GGy年M月d日
      // GGy年MM月dd日
      const eraPart = parts.getByType("era");
      const yearPart = parts.getByType("year");
      if (eraPart.index === 0 && yearPart.index === eraPart.end) {
        // Noted that options.indexesOfNonAlphaNumChars is unlikely to be of any help
        // because Japanese characters are non-alphanumeric
        value = `${gregorianYear}${value.substring(yearPart.end)}`;
        // all of these will cause reindexing, which should set the index of later parts automatically
        parts.remove(eraPart);
        yearPart.index = 0;
        yearPart.length = gregorianYear.toString().length;
        // TODO: Other possibilities
      }
    }

    this.#validatePartsAndSetEnds(parts);

    let month;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const yearPart = parts.getByType("year");
    if (!yearPart) {
      Logger.warn(
        `Did not set the year portion of the date in "${value}", keeping as ${date.getFullYear()}...`
      );
    } else {
      const yearPartSetResult = DateHelper.#trySetDatePartFromPart(
        value,
        yearPart,
        date,
        options
      );
      if (!yearPartSetResult.success) {
        Logger.warn(
          `Did not set the year portion of the date in "${value}", keeping as ${date.getFullYear()}...`
        );
      } else {
        Logger.log(
          `Parsed "${value}" to get the year ${yearPartSetResult.value}`
        );
      }
    }
    const monthPart = parts.getByType("month");
    if (!monthPart) {
      Logger.warn(
        `Did not set the month portion of the date in "${value}", keeping as ${date.getMonth()} (${
          date.getMonth() + 1
        })...`
      );
    } else {
      const monthPartSetResult = DateHelper.#trySetDatePartFromPart(
        value,
        monthPart,
        date,
        options
      );
      if (!monthPartSetResult.success) {
        // map month names
        const form = monthPart.month;
        const locale = DateHelper.flatToFirst(options.locale);
        const months = DateHelper.#monthNames[locale][form];
        month = months.indexOf(value.slice(monthPart.index, monthPart.end));
        if (month > -1) {
          monthPart.setter(date, month, options.timeZone === "UTC");
        } else {
          Logger.warn(
            `The month portion, "${value.slice(
              monthPart.index,
              monthPart.end
            )}" was not able to be parsed as a month name`
          );
        }
      } else {
        Logger.log(
          `Parsed "${value}" to get the month ${monthPartSetResult.value}`
        );
      }
    }
    const dayPart = parts.getByType("day");
    if (!dayPart) {
      Logger.warn(
        `Did not set the day portion of the date in "${value}", keeping as ${date.getDate()}...`
      );
    } else {
      const dayPartSetResult = DateHelper.#trySetDatePartFromPart(
        value,
        dayPart,
        date,
        options
      );
      if (!dayPartSetResult.success) {
        Logger.warn(
          `Did not set the day portion of the date in "${value}", keeping as ${date.getDate()}...`
        );
      } else {
        Logger.log(
          `Parsed "${value}" to get the day ${dayPartSetResult.value}`
        );
      }
    }
    const hourPart = parts.getByType("hour");
    if (!hourPart) {
      Logger.warn(
        `Did not set the hour portion of the date in "${value}", keeping as ${date.getHours()}...`
      );
    } else {
      const hourPartSetResult = DateHelper.#trySetDatePartFromPart(
        value,
        hourPart,
        date,
        options
      );
      if (!hourPartSetResult.success) {
        Logger.warn(
          `Did not set the hour portion of the date in "${value}", keeping as ${date.getHours()}...`
        );
      } else {
        Logger.log(
          `Parsed "${value}" to get the hour ${hourPartSetResult.value}`
        );
      }
    }
    const minutePart = parts.getByType("minute");
    if (!minutePart) {
      Logger.warn(
        `Did not set the minute portion of the date in "${value}", keeping as ${date.getMinutes()}...`
      );
    } else {
      const minutePartSetResult = DateHelper.#trySetDatePartFromPart(
        value,
        minutePart,
        date,
        options
      );
      if (!minutePartSetResult.success) {
        Logger.warn(
          `Did not set the minute portion of the date in "${value}", keeping as ${date.getMinutes()}...`
        );
      } else {
        Logger.log(
          `Parsed "${value}" to get the minute ${minutePartSetResult.value}`
        );
      }
    }
    const secondPart = parts.getByType("second");
    if (!secondPart) {
      Logger.warn(
        `Did not set the second portion of the date in "${value}", keeping as ${date.getSeconds()}...`
      );
    } else {
      const secondPartSetResult = DateHelper.#trySetDatePartFromPart(
        value,
        secondPart,
        date,
        options
      );
      if (!secondPartSetResult.success) {
        Logger.warn(
          `Did not set the second portion of the date in "${value}", keeping as ${date.getSeconds()}...`
        );
      } else {
        Logger.log(
          `Parsed "${value}" to get the second ${secondPartSetResult.value}`
        );
      }
    }
    const millisecondPart = parts.getByType("fractionalSecondDigits");
    if (!millisecondPart) {
      Logger.warn(
        `Did not set the millisecond portion of the date in "${value}", keeping as ${date.getMilliseconds()}...`
      );
    } else {
      const millisecondPartSetResult = DateHelper.#trySetDatePartFromPart(
        value,
        millisecondPart,
        date,
        options
      );
      if (!millisecondPartSetResult.success) {
        Logger.warn(
          `Did not set the millisecond portion of the date in "${value}", keeping as ${date.getMilliseconds()}...`
        );
      } else {
        Logger.log(
          `Parsed "${value}" to get the millisecond ${millisecondPartSetResult.value}`
        );
      }
    }
    return date;
  }
  /**
   * Parses a value as a Date object using the provided options.
   * @param {Date|string|number|undefined|null} value The value to parse.
   * @param {DateHelperOptions} options Optional hash of overrides for the properties set on
   * the object. Only relevant when value is a string.
   * @returns {Date|undefined|null} The parsed Date, or undefined/null if passed in.
   */
  static parseDate(value, options) {
    let { format } = DateHelper.validateOptions(options);
    let result = new Date(undefined);
    if (value == null) {
      Logger.warn("parseDate: value is undefined or null");
      return value;
    }
    if (value instanceof Date) {
      Logger.warn("parseDate: value is Date object");
      value = DateHelper.formatDate(value, options);
    }
    if (typeof value === "number" && !Number.isNaN(value)) {
      Logger.warn("parseDate: value is number");
      value = DateHelper.formatDate(new Date(value), options);
    }
    // value is string
    if (value.length === 0) {
      Logger.warn("parseDate: value is empty string");
      // Invalid Date
      return result;
    }

    format = DateHelper.makeSingleDimArray(format);
    let formatUsed;
    const formatAttempts = format.map((f) => ({ format: f, success: false }));
    for (let f of format) {
      formatUsed = f;
      let formatParts = DateHelper.parseFormatToParts(f, options);
      for (let part of formatParts) {
        if (part.type !== "literal" && part.field?.length) {
          part.setter ??= DateHelper.unitToSetter[part.field?.at(0)];
        } else if (part.type === "literal") {
          part.length ??= part.value?.length;
        }
      }
      const date = DateHelper.#getDateFromParts(value, formatParts, options);
      if (date instanceof Date && !isNaN(date.valueOf())) {
        console.log(
          `parsing "${value}" using "${formatUsed}", got "${date.toISOString()}"`
        );
        const attempt = formatAttempts.find((f) => f.format === formatUsed);
        if (attempt) {
          attempt.success = true;
          result = new Date(date.valueOf());
        } else {
          throw new Error(
            `Something went very wrong; Could not find format "${formatUsed}" in the list of possible formats.`
          );
        }
        break;
      }

      Logger.warn(
        `The value, "${value}", when reformatted using the same options, "${reformatted}", turned out different. Trying a different format...`
      );
      continue;
    }

    if (formatAttempts.every((fa) => !fa.success)) {
      const error = `Could not format the date successfully in any of the specified formats: ${format}`;
      Logger.error(error);
      throw new Error(error);
    }

    return result;
  }
  /**
   * Gets the default format string for the current locale
   */
  getDefaultFormat() {
    return DateHelper.getDefaultFormatForLocale(this.locales);
  }
  /**
   * Formats a date using the properties of the current instance.
   * @param {Date} date The Date object to format
   * @param {DateHelperOptions} options Optional hash of overrides for the properties set on
   * the object. Note that it's probably easier to just use the static function in this case.
   * @returns {string} The formatted date.
   */
  formatDate(date, options) {
    let { locale, format, timeZone } = DateHelper.validateOptions(options);
    return DateHelper.formatDate(date, {
      locale: locale ?? this.locales,
      format: format ?? this.formats,
      timeZone: timeZone ?? this.timeZone,
    });
  }
  /**
   * Parses a value as a Date object using the provided options.
   * @param {Date} value The value to parse
   * @param {DateHelperOptions} options Optional hash of overrides for the properties set on
   * the object. Note that it's probably easier to just use the static function in this case.
   * @returns {Date|undefined|null} The parsed Date, or undefined/null if passed in as value.
   */
  parseDate(value, options) {
    let { locale, format, timeZone } = DateHelper.validateOptions(options);
    return DateHelper.parseDate(value, {
      locale: locale ?? this.locales,
      format: format ?? this.formats,
      timeZone: timeZone ?? this.timeZone,
    });
  }
}
