import bu from "./BasicUtilities.mjs";
import DatePart from "./DatePart.mjs";
import {
  getProbableClientLocale,
  getProbableClientTimeZoneName,
} from "./fn-date-time/common.mjs";

/**
 * Provides a class around the options to be passed to Intl.DateTimeFormat, adding a valid
 * property to check the properties are all valid.
 */
export default class DateTimeFormattingOptions {
  #instanceId =
    performance && performance.now
      ? performance.now().toString().replaceAll(/\D/g, "")
      : Date.now();
  // The "Style" properties; if one of these is set, none of the others can be
  #dateStyle = undefined;
  #timeStyle = undefined;

  // The "Non-style" properties; if one of these is set, the "Style" properties cannot be set
  #calendar = "gregory";
  #dayPeriod = undefined;
  #numberingSystem = "latn";
  #locale = undefined;
  #localeMatcher = "best fit";
  #timeZone = "UTC";
  #hour12 = undefined;
  #hourCycle = undefined;
  #formatMatcher = "best fit";
  #weekday = undefined;
  #era = undefined;
  #year = undefined;
  #month = undefined;
  #day = undefined;
  #hour = undefined;
  #minute = undefined;
  #second = undefined;
  #fractionalSecondDigits = undefined;
  #timeZoneName = undefined;

  #isValid = true;
  #isDirty = false;
  #invalidProperties = new Set();
  #dirtyProperties = new Set();
  #atLeastOneStyleSet = false;
  #atLeastOneNonStyleSet = false;
  static #defaults/*: Map<K: keyof DateTimeFormattingOptions, V: DateTimeFormattingOptions[K]>*/ = new Map([
    ["dateStyle", ""],
    ["timeStyle", ""],
    ["calendar", "gregory"],
    ["dayPeriod", ""],
    ["numberingSystem", "latn"],
    ["locale", getProbableClientLocale()],
    ["localeMatcher", "best fit"],
    ["timeZone", getProbableClientTimeZoneName()],
    ["hour12", undefined],
    ["hourCycle", ""],
    ["formatMatcher", "best fit"],
    ["weekday", ""],
    ["era", ""],
    ["year", "numeric"],
    ["month", "numeric"],
    ["day", "numeric"],
    ["hour", "numeric"],
    ["minute", "numeric"],
    ["second", "numeric"],
    ["fractionalSecondDigits", ""],
    ["timeZoneName", ""],
  ]);
  static #validStyles = ["", "full", "long", "medium", "short"];
  static #validAlpha = ["", "long", "short", "narrow"];
  static #validNumeric = ["", "numeric", "2-digit"];
  static #validAlphaNumeric = [
    ...new Set([...this.#validAlpha, ...this.#validNumeric]),
  ];
  static #validLocaleMatchers = ["", "lookup", "best fit"];
  static #validFormatMatchers = ["", "basic", "best fit"];
  static #validHourCycles = ["", "h11", "h12", "h23", "h24"];
  static #validFractions = ["", "0", "1", "2", "3", 0, 1, 2, 3];
  static #validTimeZoneNames = [
    "",
    "short",
    "long",
    "shortOffset",
    "longOffset",
    "shortGeneric",
    "longGeneric",
  ];
  static #validTimeZones = ["", ...Intl.supportedValuesOf("timeZone")];
  static #validCalendars = ["", ...Intl.supportedValuesOf("calendar")];
  static #validNumberingSystems = [
    "",
    ...Intl.supportedValuesOf("numberingSystem"),
  ];
  static #nonStyleKeys = [
    "calendar",
    "dayPeriod",
    "numberingSystem",
    "localeMatcher",
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
    "timeZoneName",
  ];
  /**
   * Converts a DatePart to a DateTimeFormattingOptions
   * @param {DatePart} datePart The DatePart object to convert to a
   * DateTimeFormattingOptions object
   * @returns {DateTimeFormattingOptions} A DateTimeFormattingOptions object with its
   * properties set to the corresponding values from the datePart.
   */
  static fromDatePart(datePart) /*: DateTimeFormattingOptions */ {
    const newMe = new DateTimeFormattingOptions();
    if (datePart.dateStyle || datePart.timeStyle) {
      newMe.setValue("dateStyle", datePart.dateStyle);
      newMe.setValue("timeStyle", datePart.timeStyle);
    } else {
      for (const key of DateTimeFormattingOptions.#nonStyleKeys) {
        // Note, if there is a key in nonStyleKeys that is not on DatePart,
        // it will be set to undefined, and that's okay.
        newMe.setValue(key, datePart[key]);
      }
    }
    return newMe;
  }
  /**
   * Converts a DatePartCollection to a DateTimeFormattingOptions.
   * @param {DatePartCollection} datePartCollection The DatePartCollection instance to convert
   * @returns {DateTimeFormattingOptions} A DateTimeFormattingOptions object with its
   * properties set to the corresponding values from the dateParts in the collection.
   */
  static fromDatePartCollection(datePartCollection) /*: DateTimeFormattingOptions */ {
    const newMe = new DateTimeFormattingOptions();
    const dateStyle = [...datePartCollection].find(
      (part) => part.isStyle && ["date", "date-time"].includes(part.type)
    );
    const timeStyle = [...datePartCollection].find(
      (part) => part.isStyle && ["time", "date-time"].includes(part.type)
    );
    if (dateStyle || timeStyle) {
      newMe.setValue("dateStyle", (dateStyle ?? timeStyle)?.dateStyle);
      newMe.setValue("timeStyle", (timeStyle ?? dateStyle)?.timeStyle);
    } else {
      for (const part of datePartCollection) {
        for (const key of DateTimeFormattingOptions.#nonStyleKeys) {
          newMe.setValue(key, part[key]);
        }
      }
    }
  }
  #setInvalid(prop, isValid) {
    if (!isValid) {
      this.#isValid = false;
      this.#invalidProperties.add(prop);
    }
  }
  #setDirty(prop, isDirty) {
    if (isDirty) {
      this.#dirtyProperties.add(prop);
      this.#isDirty = true;
    } else {
      this.#dirtyProperties.delete(prop);
      this.#isDirty = this.#dirtyProperties.size > 0;
    }
  }
  #dealWithStyles(prop) {
    this.#updateAtLeastOneStyleSet();
    this.#updateAtLeastOneNonStyleSet();
    this.#setInvalid(
      prop ? `${prop}/styles` : "styles",
      !(this.#atLeastOneStyleSet && this.#atLeastOneNonStyleSet)
    );
  }
  #updateAtLeastOneStyleSet() {
    this.#atLeastOneStyleSet =
      this.#dirtyProperties.has("dateStyle") ||
      this.#dirtyProperties.has("timeStyle");
  }
  #updateAtLeastOneNonStyleSet() {
    this.#atLeastOneNonStyleSet = DateTimeFormattingOptions.#nonStyleKeys.some(
      (key) => this.#dirtyProperties.has(key)
    );
    if (this.#atLeastOneNonStyleSet) {
      console.log(
        this.#instanceId,
        "dirty non-styles:",
        DateTimeFormattingOptions.#nonStyleKeys.filter((key) =>
          this.#dirtyProperties.has(key)
        )
      );
    }
  }
  /**
   * Sets a property value, marking the instance as dirty as needed.
   * @param {string} key The key of the property to set.
   * @param {unknown} value The value of the property to set.
   */
  setValue(key, value) {
    if (!(key in this)) {
      throw new Error(`"${key}" is not a valid Date Time Formatting Option`);
    }
    if (this[key] !== value && value !== this[`default${key}`]) {
      this[key] = value;
      this.#setDirty(key, true);
    } else {
      this.#setDirty(key, false);
    }
  }
  /**
   * Indicates whether at least one of the style properties is set.
   * @returns {boolean} True if at least one style property is set; false otherwise.
   */
  get atLeastOneStyleSet() {
    this.#updateAtLeastOneStyleSet();
    return this.#atLeastOneStyleSet;
  }
  /**
   * Indicates whether at least one of the non-style properties is set.
   * @returns {boolean} True if at least one non-style property is set; false otherwise.  
   */
  get atLeastOneNonStyleSet() {
    this.#updateAtLeastOneNonStyleSet();
    return this.#atLeastOneNonStyleSet;
  }
  /**
   * Indicates whether any properties have been modified from their default values.
   * @returns {boolean} True if any properties have been modified; false otherwise.
   */
  get isDirty() {
    if (this.#isDirty) {
      console.log(this.#instanceId, "dirty properties: ", [
        ...this.#dirtyProperties,
      ]);
    }
    return this.#isDirty;
  }
  /**
   * Indicates whether all properties are valid.
   * @returns {boolean} True if all properties are valid; false otherwise.
   */
  get valid() {
    if (!this.#isValid) {
      console.log(this.#instanceId, "invalid properties: ", [
        ...this.#invalidProperties,
      ]);
    }
    return this.#isValid;
  }
  /** Gets the default value for dateStyle property. */
  get defaultdateStyle() {
    return "";
  }
  /** Gets the current value of the dateStyle property. */
  get dateStyle() {
    return this.#dateStyle;
  }
  /** Sets the dateStyle property. */
  set dateStyle(value) {
    if (this.#dateStyle !== value) {
      this.#dateStyle = value;
      this.#setDirty("dateStyle", value !== "");
      this.#setInvalid(
        "dateStyle",
        DateTimeFormattingOptions.#validStyles.includes(value)
      );
      this.#dealWithStyles("dateStyle");
    }
  }
  /** Gets the default value for timeStyle property. */
  get defaulttimeStyle() {
    return "";
  }
  /** Gets the current value of the timeStyle property. */
  get timeStyle() {
    return this.#timeStyle;
  }
  /** Sets the timeStyle property. */
  set timeStyle(value) {
    if (this.#timeStyle !== value) {
      this.#timeStyle = value;
      this.#setDirty("timeStyle", value !== "");
      this.#setInvalid(
        "timeStyle",
        DateTimeFormattingOptions.#validStyles.includes(value)
      );
      this.#dealWithStyles("timeStyle");
    }
  }
  /** Gets the default value for calendar property. */
  get defaultcalendar() {
    return "gregory";
  }
  /** Gets the current value of the calendar property. */ 
  get calendar() {
    return this.#calendar;
  }
  /** Sets the calendar property. */
  set calendar(value) {
    if (this.#calendar !== value) {
      this.#calendar = value;
      this.#setDirty("calendar", true);
      this.#setInvalid(
        "calendar",
        DateTimeFormattingOptions.#validCalendars.includes(value) || value == null
      );
      this.#dealWithStyles("calendar");
    }
  }
  /** Gets the default value for dayPeriod property. */
  get defaultdayPeriod() {
    return "";
  }
  /** Gets the current value of the dayPeriod property. */
  get dayPeriod() {
    return this.#dayPeriod;
  }
  /** Sets the dayPeriod property. */
  set dayPeriod(value) {
    if (this.#dayPeriod !== value) {
      this.#dayPeriod = value;
      this.#setDirty("dayPeriod", true);
      this.#setInvalid(
        "dayPeriod",
        DateTimeFormattingOptions.#validAlpha.includes(value) || value == null
      );
      this.#dealWithStyles("dayPeriod");
    }
  }
  /** Gets the default value for numberingSystem property. */
  get defaultnumberingSystem() {
    return "latn";
  }
  /** Gets the current value of the numberingSystem property. */
  get numberingSystem() {
    return this.#numberingSystem;
  }
  /** Sets the numberingSystem property. */
  set numberingSystem(value) {
    if (this.#numberingSystem !== value) {
      this.#numberingSystem = value;
      this.#setDirty("numberingSystem", true);
      this.#setInvalid(
        "numberingSystem",
        DateTimeFormattingOptions.#validNumberingSystems.includes(value) || value == null
      );
      this.#dealWithStyles("numberingSystem");
    }
  }
  /** Checks if the locale is valid. */
  isValidLocale(value) {
    // Intl.DateTimeFormat(locale) will throw if locale is an invalid BCP 47 string
    // resoivedOptions().locale will return the default locale if locale is not a valid locale
    // It will also return a base locale if part (e.g., region, calendar) is expressed incorrectly
    try {
      return value === Intl.DateTimeFormat(value).resolvedOptions().locale;
    } catch {
      return false;
    }
  }
  /** Gets the default value for locale property. */
  get defaultlocale() {
    return getProbableClientLocale();
  }
  /** Gets the current value of the locale property. */
  get locale() {
    return this.#locale;
  }
  /** Sets the locale property. */
  set locale(value) {
    if (this.#locale !== value) {
      this.#locale = value;
      this.#setDirty("locale", true);
      this.#setInvalid("locale", this.isValidLocale(value));
      this.#dealWithStyles("locale");
    }
  }
  /** Gets the default value for localeMatcher property. */
  get defaultlocaleMatcher() {
    return "";
  }
  /** Gets the current value of the localeMatcher property. */
  get localeMatcher() {
    return this.#localeMatcher;
  }
  /** Sets the localeMatcher property. */
  set localeMatcher(value) {
    if (this.#localeMatcher !== value) {
      this.#localeMatcher = value;
      this.#setDirty("localeMatcher", true);
      this.#setInvalid(
        "localeMatcher",
        DateTimeFormattingOptions.#validLocaleMatchers.includes(value) || value == null
      );
      this.#dealWithStyles("localeMatcher");
    }
  }
  /** Gets the default value for timeZone property. */
  get defaulttimeZone() {
    return getProbableClientTimeZoneName();
  }
  /** Gets the current value of the timeZone property. */
  get timeZone() {
    return this.#timeZone;
  }
  /** Sets the timeZone property. */
  set timeZone(value) {
    if (this.#timeZone !== value) {
      this.#timeZone = value;
      this.#setDirty("timeZone", true);
      this.#setInvalid(
        "timeZone",
        DateTimeFormattingOptions.#validTimeZones.includes(value) || value == null
      );
      this.#dealWithStyles("timeZone");
    }
  }
  /** Gets the default value for hour12 property. */  
  get defaulthour12() {
    return undefined;
  }
  /** Gets the current value of the hour12 property. */
  get hour12() {
    return this.#hour12;
  }
  /** Sets the hour12 property. */
  set hour12(value) {
    if (this.#hour12 !== value) {
      this.#hour12 = value;
      this.#setDirty("hour12", true);
      this.#setInvalid("hour12", value === bu.parseBoolean(value));
      this.#dealWithStyles("hour12");
    }
  }
  /** Gets the default value for hourCycle property. */
  get defaulthourCycle() {
    return "";
  }
  /** Gets the current value of the hourCycle property. */
  get hourCycle() {
    return this.#hourCycle;
  }
  /** Sets the hourCycle property. */
  set hourCycle(value) {
    if (this.#hourCycle !== value) {
      this.#hourCycle = value;
      this.#setDirty("hourCycle", true);
      this.#setInvalid(
        "hourCycle",
        DateTimeFormattingOptions.#validHourCycles.includes(value) || value == null
      );
      this.#dealWithStyles("hourCycle");
    }
  }
  /** Gets the default value for formatMatcher property. */
  get defaultformatMatcher() {
    return "";
  }
  /** Gets the current value of the formatMatcher property. */
  get formatMatcher() {
    return this.#formatMatcher;
  }
  /** Sets the formatMatcher property. */
  set formatMatcher(value) {
    if (this.#formatMatcher !== value) {
      this.#formatMatcher = value;
      this.#setDirty("formatMatcher", true);
      this.#setInvalid(
        "formatMatcher",
        DateTimeFormattingOptions.#validFormatMatchers.includes(value) || value == null
      );
      this.#dealWithStyles("formatMatcher");
    }
  }
  /** Gets the default value for weekday property. */
  get defaultweekday() {
    return "";
  }
  /** Gets the current value of the weekday property. */
  get weekday() {
    return this.#weekday;
  }
  /** Sets the weekday property. */
  set weekday(value) {
    if (this.#weekday !== value) {
      this.#weekday = value;
      this.#setDirty("weekday", true);
      this.#setInvalid(
        "weekday",
        DateTimeFormattingOptions.#validAlpha.includes(value) || value == null
      );
      this.#dealWithStyles("weekday");
    }
  }
  /** Gets the default value for era property. */
  get defaultera() {
    return "";
  }
  /** Gets the current value of the era property. */
  get era() {
    return this.#era;
  }
  /** Sets the era property. */
  set era(value) {
    if (this.#era !== value) {
      this.#era = value;
      this.#setDirty("era", true);
      this.#setInvalid(
        "era",
        DateTimeFormattingOptions.#validAlpha.includes(value) || value == null
      );
      this.#dealWithStyles("era");
    }
  }
  /** Gets the default value for year property. */
  get defaultyear() {
    return "";
  }
  /** Gets the current value of the year property. */
  get year() {
    return this.#year;
  }
  /** Sets the year property. */
  set year(value) {
    if (this.#year !== value) {
      this.#year = value;
      this.#setDirty("year", true);
      this.#setInvalid(
        "year",
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null
      );
      this.#dealWithStyles("year");
    }
  }
  /** Gets the default value for month property. */
  get defaultmonth() {
    return "";
  }
  /** Gets the current value of the month property. */
  get month() {
    return this.#month;
  }
  /** Sets the month property. */
  set month(value) {
    if (this.#month !== value) {
      this.#month = value;
      this.#setDirty("month", true);
      this.#setInvalid(
        "month",
        DateTimeFormattingOptions.#validAlphaNumeric.includes(value) || value == null
      );
      this.#dealWithStyles("month");
    }
  }
  /** Gets the default value for day property. */
  get defaultday() {
    return "";
  }
  /** Gets the current value of the day property. */
  get day() {
    return this.#day;
  }
  /** Sets the day property. */
  set day(value) {
    if (this.#day !== value) {
      this.#day = value;
      this.#setDirty("day", true);
      this.#setInvalid(
        "day",
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null
      );
      this.#dealWithStyles("day");
    }
  }
  /** Gets the default value for hour property. */
  get defaulthour() {
    return "";
  }
  /** Gets the current value of the hour property. */ 
  get hour() {
    return this.#hour;
  }
  /** Sets the hour property. */
  set hour(value) {
    if (this.#hour !== value) {
      this.#hour = value;
      this.#setDirty("hour", true);
      this.#setInvalid(
        "hour",
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null
      );
      this.#dealWithStyles("hour");
    }
  }
  /** Gets the default value for minute property. */
  get defaultminute() {
    return "";
  }
  /** Gets the current value of the minute property. */
  get minute() {
    return this.#minute;
  }
  /** Sets the minute property. */
  set minute(value) {
    if (this.#minute !== value) {
      this.#minute = value;
      this.#setDirty("minute", true);
      this.#setInvalid(
        "minute",
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null
      );
      this.#dealWithStyles("minute");
    }
  }
  /** Gets the default value for second property. */
  get defaultsecond() {
    return "";
  }
  /** Gets the current value of the second property. */
  get second() {
    return this.#second;
  }
  /** Sets the second property. */
  set second(value) {
    if (this.#second !== value) {
      this.#second = value;
      this.#setDirty("second", true);
      this.#setInvalid(
        "second",
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null
      );
      this.#dealWithStyles("second");
    }
  }
  /** Gets the default value for fractionalSecondDigits property. */
  get defaultfractionalSecondDigits() {
    return "";
  }
  /** Gets the current value of the fractionalSecondDigits property. */ 
  get fractionalSecondDigits() {
    return this.#fractionalSecondDigits;
  }
  /** Sets the fractionalSecondDigits property. */  
  set fractionalSecondDigits(value) {
    if (this.#fractionalSecondDigits !== value) {
      this.#fractionalSecondDigits = value;
      this.#setDirty("fractionalSecondDigits", true);
      this.#setInvalid(
        `fractionalSecondDigits (${value})`,
        DateTimeFormattingOptions.#validFractions.includes(value) || value == null
      );
      this.#dealWithStyles("fractionalSecondDigits");
    }
  }
  /** Gets the default value for timeZoneName property. */
  get defaulttimeZoneName() {
    return "";
  }
  /** Gets the current value of the timeZoneName property. */
  get timeZoneName() {
    return this.#timeZoneName;
  }
  /** Sets the timeZoneName property. */
  set timeZoneName(value) {
    if (this.#timeZoneName !== value) {
      this.#timeZoneName = value;
      this.#setDirty("timeZoneName", true);
      this.#setInvalid(
        "timeZoneName",
        DateTimeFormattingOptions.#validTimeZoneNames.includes(value) || value == null
      );
      this.#dealWithStyles("timeZoneName");
    }
  }
  /** Converts the instance to an object suitable for passing to Intl.DateTimeFormat. */
  toDateTimeFormatOptions() {
    const dtfo = {
      dateStyle: this.dateStyle === "" ? undefined : this.dateStyle,
      timeStyle: this.timeStyle === "" ? undefined : this.timeStyle,
      calendar: this.calendar === "" ? undefined : this.calendar,
      dayPeriod: this.dayPeriod === "" ? undefined : this.dayPeriod,
      numberingSystem:
        this.numberingSystem === "" ? undefined : this.numberingSystem,
      locale: this.locale === "" ? undefined : this.locale,
      localeMatcher: this.localeMatcher === "" ? undefined : this.localeMatcher,
      timeZone: this.timeZone === "" ? undefined : this.timeZone,
      hour12: (this.hour12 ?? "") === "" ? undefined : this.hour12,
      hourCycle: this.hourCycle === "" ? undefined : this.hourCycle,
      formatMatcher: this.formatMatcher === "" ? undefined : this.formatMatcher,
      weekday: this.weekday === "" ? undefined : this.weekday,
      era: this.era === "" ? undefined : this.era,
      year: this.year === "" ? undefined : this.year,
      month: this.month === "" ? undefined : this.month,
      day: this.day === "" ? undefined : this.day,
      hour:
        (this.hour ?? "") === ""
          ? typeof this.hour12 === "boolean" ||
            (typeof this.hourCycle === "string" && this.hourCycle.length > 0)
            ? "numeric"
            : undefined
          : this.hour,
      minute: this.minute === "" ? undefined : this.minute,
      second: this.second === "" ? undefined : this.second,
      fractionalSecondDigits:
        this.fractionalSecondDigits === ""
          ? undefined
          : this.fractionalSecondDigits,
      timeZoneName: this.timeZoneName === "" ? undefined : this.timeZoneName,
    };
    console.log(JSON.stringify(dtfo, null, 2));
    return dtfo;
  }
}
