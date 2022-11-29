import bu from "./BasicUtilities.mjs";
import DateHelper from "./DateHelper.mjs";
import DatePart from "./DatePart.mjs";

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
  static #validStyles = ["", "full", "long", "medium", "short"];
  static #validAlpha = ["", "long", "short", "narrow"];
  static #validNumeric = ["", "numeric", "2-digit"];
  static #validAlphaNumeric = [
    ...new Set([...this.#validAlpha, ...this.#validNumeric]),
  ];
  static #validLocaleMatchers = ["", "lookup", "best fit"];
  static #validFormatMatchers = ["", "basic", "best fit"];
  static #validHourCycles = ["", "h11", "h12", "h23", "h24"];
  static #validFractions = ["", "0", "1", "2", "3"];
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
  static fromDatePart(datePart) {
    const newMe = new DateTimeFormattingOptions();
    if (datePart.dateStyle || datePart.timeStyle) {
      newMe.setValue('dateStyle', datePart.dateStyle);
      newMe.setValue('timeStyle', datePart.timeStyle);
    } else {
      for (const key of DateTimeFormattingOptions.#nonStyleKeys) {
        // Note, if there is a key in nonStyleKeys that is not on DatePart,
        // it will be set to undefined, and that's okay.
        newMe.setValue(key, datePart[key]);
      }
    }
    return newMe;
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
  setValue(key, value) {
    if (!key in this) {
      throw new Error(`"${key}" is not a valid Date Time Formatting Option`);
    }
    if (this[key] !== value && value !== this[`default${key}`]) {
      this[key] = value;
      this.#setDirty(key, true);
    } else {
      this.#setDirty(key, false);
    }
  }
  get atLeastOneStyleSet() {
    this.#updateAtLeastOneStyleSet();
    return this.#atLeastOneStyleSet;
  }
  get atLeastOneNonStyleSet() {
    this.#updateAtLeastOneNonStyleSet();
    return this.#atLeastOneNonStyleSet;
  }
  get isDirty() {
    if (this.#isDirty) {
      console.log(this.#instanceId, "dirty properties: ", [
        ...this.#dirtyProperties,
      ]);
    }
    return this.#isDirty;
  }
  get valid() {
    if (!this.#isValid) {
      console.log(this.#instanceId, "invalid properties: ", [
        ...this.#invalidProperties,
      ]);
    }
    return this.#isValid;
  }
  get defaultdateStyle() {
    return "";
  }
  get dateStyle() {
    return this.#dateStyle;
  }
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
  get defaulttimeStyle() {
    return "";
  }
  get timeStyle() {
    return this.#timeStyle;
  }
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
  get defaultcalendar() {
    return "gregory";
  }
  get calendar() {
    return this.#calendar;
  }
  set calendar(value) {
    if (this.#calendar !== value) {
      this.#calendar = value;
      this.#setDirty("calendar", true);
      this.#setInvalid(
        "calendar",
        DateTimeFormattingOptions.#validCalendars.includes(value)
      );
      this.#dealWithStyles("calendar");
    }
  }
  get defaultdayPeriod() {
    return "";
  }
  get dayPeriod() {
    return this.#dayPeriod;
  }
  set dayPeriod(value) {
    if (this.#dayPeriod !== value) {
      this.#dayPeriod = value;
      this.#setDirty("dayPeriod", true);
      this.#setInvalid(
        "dayPeriod",
        DateTimeFormattingOptions.#validAlpha.includes(value)
      );
      this.#dealWithStyles("dayPeriod");
    }
  }
  get defaultnumberingSystem() {
    return "latn";
  }
  get numberingSystem() {
    return this.#numberingSystem;
  }
  set numberingSystem(value) {
    if (this.#numberingSystem !== value) {
      this.#numberingSystem = value;
      this.#setDirty("numberingSystem", true);
      this.#setInvalid(
        "numberingSystem",
        DateTimeFormattingOptions.#validNumberingSystems.includes(value)
      );
      this.#dealWithStyles("numberingSystem");
    }
  }
  isValidLocale(value) {
    // Intl.DateTimeFormat(locale) will throw if locale is an invalid BCP 47 string
    // resoivedOptions().locale will return the default locale if locale is not a valid locale
    // It will also return a base locate if part (e.g., region, calendar) is expressed incorrectly
    try {
      return value === Intl.DateTimeFormat(value).resolvedOptions().locale;
    } catch {
      return false;
    }
  }
  get defaultlocale() {
    return DateHelper.getProbableClientLocale();
  }
  get locale() {
    return this.#locale;
  }
  set locale(value) {
    if (this.#locale !== value) {
      this.#locale = value;
      this.#setDirty("locale", true);
      this.#setInvalid("locale", this.isValidLocale(value));
      this.#dealWithStyles("locale");
    }
  }
  get defaultlocaleMatcher() {
    return "";
  }
  get localeMatcher() {
    return this.#localeMatcher;
  }
  set localeMatcher(value) {
    if (this.#localeMatcher !== value) {
      this.#localeMatcher = value;
      this.#setDirty("localeMatcher", true);
      this.#setInvalid(
        "localeMatcher",
        DateTimeFormattingOptions.#validLocaleMatchers.includes(value)
      );
      this.#dealWithStyles("localeMatcher");
    }
  }
  get defaulttimeZone() {
    return DateHelper.getProbableClientTimeZoneName();
  }
  get timeZone() {
    return this.#timeZone;
  }
  set timeZone(value) {
    if (this.#timeZone !== value) {
      this.#timeZone = value;
      this.#setDirty("timeZone", true);
      this.#setInvalid(
        "timeZone",
        DateTimeFormattingOptions.#validTimeZones.includes(value)
      );
      this.#dealWithStyles("timeZone");
    }
  }
  get defaulthour12() {
    return undefined;
  }
  get hour12() {
    return this.#hour12;
  }
  set hour12(value) {
    if (this.#hour12 !== value) {
      this.#hour12 = value;
      this.#setDirty("hour12", true);
      this.#setInvalid("hour12", value === bu.parseBoolean(value));
      this.#dealWithStyles("hour12");
    }
  }
  get defaulthourCycle() {
    return "";
  }
  get hourCycle() {
    return this.#hourCycle;
  }
  set hourCycle(value) {
    if (this.#hourCycle !== value) {
      this.#hourCycle = value;
      this.#setDirty("hourCycle", true);
      this.#setInvalid(
        "hourCycle",
        DateTimeFormattingOptions.#validHourCycles.includes(value)
      );
      this.#dealWithStyles("hourCycle");
    }
  }
  get defaultformatMatcher() {
    return "";
  }
  get formatMatcher() {
    return this.#formatMatcher;
  }
  set formatMatcher(value) {
    if (this.#formatMatcher !== value) {
      this.#formatMatcher = value;
      this.#setDirty("formatMatcher", true);
      this.#setInvalid(
        "formatMatcher",
        DateTimeFormattingOptions.#validFormatMatchers.includes(value)
      );
      this.#dealWithStyles("formatMatcher");
    }
  }
  get defaultweekday() {
    return "";
  }
  get weekday() {
    return this.#weekday;
  }
  set weekday(value) {
    if (this.#weekday !== value) {
      this.#weekday = value;
      this.#setDirty("weekday", true);
      this.#setInvalid(
        "weekday",
        DateTimeFormattingOptions.#validAlpha.includes(value)
      );
      this.#dealWithStyles("weekday");
    }
  }
  get defaultera() {
    return "";
  }
  get era() {
    return this.#era;
  }
  set era(value) {
    if (this.#era !== value) {
      this.#era = value;
      this.#setDirty("era", true);
      this.#setInvalid(
        "era",
        DateTimeFormattingOptions.#validAlpha.includes(value)
      );
      this.#dealWithStyles("era");
    }
  }
  get defaultyear() {
    return "";
  }
  get year() {
    return this.#year;
  }
  set year(value) {
    if (this.#year !== value) {
      this.#year = value;
      this.#setDirty("year", true);
      this.#setInvalid(
        "year",
        DateTimeFormattingOptions.#validNumeric.includes(value)
      );
      this.#dealWithStyles("year");
    }
  }
  get defaultmonth() {
    return "";
  }
  get month() {
    return this.#month;
  }
  set month(value) {
    if (this.#month !== value) {
      this.#month = value;
      this.#setDirty("month", true);
      this.#setInvalid(
        "month",
        DateTimeFormattingOptions.#validAlphaNumeric.includes(value)
      );
      this.#dealWithStyles("month");
    }
  }
  get defaultday() {
    return "";
  }
  get day() {
    return this.#day;
  }
  set day(value) {
    if (this.#day !== value) {
      this.#day = value;
      this.#setDirty("day", true);
      this.#setInvalid(
        "day",
        DateTimeFormattingOptions.#validNumeric.includes(value)
      );
      this.#dealWithStyles("day");
    }
  }
  get defaulthour() {
    return "";
  }
  get hour() {
    return this.#hour;
  }
  set hour(value) {
    if (this.#hour !== value) {
      this.#hour = value;
      this.#setDirty("hour", true);
      this.#setInvalid(
        "hour",
        DateTimeFormattingOptions.#validNumeric.includes(value)
      );
      this.#dealWithStyles("hour");
    }
  }
  get defaultminute() {
    return "";
  }
  get minute() {
    return this.#minute;
  }
  set minute(value) {
    if (this.#minute !== value) {
      this.#minute = value;
      this.#setDirty("minute", true);
      this.#setInvalid(
        "minute",
        DateTimeFormattingOptions.#validNumeric.includes(value)
      );
      this.#dealWithStyles("minute");
    }
  }
  get defaultsecond() {
    return "";
  }
  get second() {
    return this.#second;
  }
  set second(value) {
    if (this.#second !== value) {
      this.#second = value;
      this.#setDirty("second", true);
      this.#setInvalid(
        "second",
        DateTimeFormattingOptions.#validNumeric.includes(value)
      );
      this.#dealWithStyles("second");
    }
  }
  get defaultfractionalSecondDigits() {
    return "";
  }
  get fractionalSecondDigits() {
    return this.#fractionalSecondDigits;
  }
  set fractionalSecondDigits(value) {
    if (this.#fractionalSecondDigits !== value) {
      this.#fractionalSecondDigits = value;
      this.#setDirty("fractionalSecondDigits", true);
      this.#setInvalid(
        "fractionalSecondDigits",
        DateTimeFormattingOptions.#validFractions.includes(value)
      );
      this.#dealWithStyles("fractionalSecondDigits");
    }
  }
  get defaulttimeZoneName() {
    return "";
  }
  get timeZoneName() {
    return this.#timeZoneName;
  }
  set timeZoneName(value) {
    if (this.#timeZoneName !== value) {
      this.#timeZoneName = value;
      this.#setDirty("timeZoneName", true);
      this.#setInvalid(
        "timeZoneName",
        DateTimeFormattingOptions.#validTimeZoneNames.includes(value)
      );
      this.#dealWithStyles("timeZoneName");
    }
  }
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
