import bu from "./BasicUtilities.mjs";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import DatePart, { DatePartCollection } from "./DatePart.mjs";
import { getProbableClientLocale, getProbableClientTimeZoneName } from "./fn-date-time/common.mjs";

/**
 * Provides a class around the options to be passed to Intl.DateTimeFormat, adding a valid
 * property to check the properties are all valid.
 * @extends {Record<string, unknown>}
 */
export default class DateTimeFormattingOptions {
  #instanceId =
    performance?.now
      ? performance.now().toString().replaceAll(/\D/g, "")
      : Date.now();
  // The "Style" properties; if one of these is set, none of the others can be
  /** @type {undefined|"full"|"long"|"medium"|"short"} */
  #dateStyle = undefined;
  /** @type {undefined|"full"|"long"|"medium"|"short"} */
  #timeStyle = undefined;

  // The "Non-style" properties; if one of these is set, the "Style" properties cannot be set
  /** @type {"buddhist"|"chinese"|"coptic"|"dangi"|"ethioaa"|"ethiopic"|"gregory"|"hebrew"|"indian"|"islamic"|"islamic-civil"|"islamic-rgsa"|"islamic-tbla"|"islamic-umalqura"|"iso8601"|"japanese"|"persian"|"roc"} */
  #calendar = "gregory";
  /** @type {undefined|"long"|"short"|"narrow"} */
  #dayPeriod = undefined;
  /** @type {"adlm"|"ahom"|"arab"|"arabext"|"bali"|"beng"|"bhks"|"brah"|"cakm"|"cham"|"deva"|"diak"|"fullwide"|"gara"|"gong"|"gonm"|"gujr"|"gukh"|"guru"|"hanidec"|"hmng"|"hmnp"|"java"|"kali"|"kawi"|"khmr"|"knda"|"krai"|"lana"|"lanatham"|"laoo"|"latn"|"lepc"|"limb"|"mathbold"|"mathdbl"|"mathmono"|"mathsanb"|"mathsans"|"mlym"|"modi"|"mong"|"mroo"|"mtei"|"mymr"|"mymrepka"|"mymrpao"|"mymrshan"|"mymrtlng"|"nagm"|"newa"|"nkoo"|"olck"|"onao"|"orya"|"osma"|"outlined"|"rohg"|"saur"|"segment"|"shrd"|"sind"|"sinh"|"sora"|"sund"|"sunu"|"takr"|"talu"|"tamldec"|"telu"|"thai"|"tibt"|"tirh"|"tnsa"|"tols"|"vaii"|"wara"|"wcho"} */
  #numberingSystem = "latn";
  /** @type {string|undefined} */
  #locale = undefined;
  /** @type {"lookup"|"best fit"|undefined} */
  #localeMatcher = "best fit";
  /** @type {"UTC"|"Africa/Abidjan"|"Africa/Accra"|"Africa/Addis_Ababa"|"Africa/Algiers"|"Africa/Asmera"|"Africa/Bamako"|"Africa/Bangui"|"Africa/Banjul"|"Africa/Bissau"|"Africa/Blantyre"|"Africa/Brazzaville"|"Africa/Bujumbura"|"Africa/Cairo"|"Africa/Casablanca"|"Africa/Ceuta"|"Africa/Conakry"|"Africa/Dakar"|"Africa/Dar_es_Salaam"|"Africa/Djibouti"|"Africa/Douala"|"Africa/El_Aaiun"|"Africa/Freetown"|"Africa/Gaborone"|"Africa/Harare"|"Africa/Johannesburg"|"Africa/Juba"|"Africa/Kampala"|"Africa/Khartoum"|"Africa/Kigali"|"Africa/Kinshasa"|"Africa/Lagos"|"Africa/Libreville"|"Africa/Lome"|"Africa/Luanda"|"Africa/Lubumbashi"|"Africa/Lusaka"|"Africa/Malabo"|"Africa/Maputo"|"Africa/Maseru"|"Africa/Mbabane"|"Africa/Mogadishu"|"Africa/Monrovia"|"Africa/Nairobi"|"Africa/Ndjamena"|"Africa/Niamey"|"Africa/Nouakchott"|"Africa/Ouagadougou"|"Africa/Porto-Novo"|"Africa/Sao_Tome"|"Africa/Tripoli"|"Africa/Tunis"|"Africa/Windhoek"|"America/Adak"|"America/Anchorage"|"America/Anguilla"|"America/Antigua"|"America/Araguaina"|"America/Argentina/La_Rioja"|"America/Argentina/Rio_Gallegos"|"America/Argentina/Salta"|"America/Argentina/San_Juan"|"America/Argentina/San_Luis"|"America/Argentina/Tucuman"|"America/Argentina/Ushuaia"|"America/Aruba"|"America/Asuncion"|"America/Bahia"|"America/Bahia_Banderas"|"America/Barbados"|"America/Belem"|"America/Belize"|"America/Blanc-Sablon"|"America/Boa_Vista"|"America/Bogota"|"America/Boise"|"America/Buenos_Aires"|"America/Cambridge_Bay"|"America/Campo_Grande"|"America/Cancun"|"America/Caracas"|"America/Catamarca"|"America/Cayenne"|"America/Cayman"|"America/Chicago"|"America/Chihuahua"|"America/Ciudad_Juarez"|"America/Coral_Harbour"|"America/Cordoba"|"America/Costa_Rica"|"America/Coyhaique"|"America/Creston"|"America/Cuiaba"|"America/Curacao"|"America/Danmarkshavn"|"America/Dawson"|"America/Dawson_Creek"|"America/Denver"|"America/Detroit"|"America/Dominica"|"America/Edmonton"|"America/Eirunepe"|"America/El_Salvador"|"America/Fort_Nelson"|"America/Fortaleza"|"America/Glace_Bay"|"America/Godthab"|"America/Goose_Bay"|"America/Grand_Turk"|"America/Grenada"|"America/Guadeloupe"|"America/Guatemala"|"America/Guayaquil"|"America/Guyana"|"America/Halifax"|"America/Havana"|"America/Hermosillo"|"America/Indiana/Knox"|"America/Indiana/Marengo"|"America/Indiana/Petersburg"|"America/Indiana/Tell_City"|"America/Indiana/Vevay"|"America/Indiana/Vincennes"|"America/Indiana/Winamac"|"America/Indianapolis"|"America/Inuvik"|"America/Iqaluit"|"America/Jamaica"|"America/Jujuy"|"America/Juneau"|"America/Kentucky/Monticello"|"America/Kralendijk"|"America/La_Paz"|"America/Lima"|"America/Los_Angeles"|"America/Louisville"|"America/Lower_Princes"|"America/Maceio"|"America/Managua"|"America/Manaus"|"America/Marigot"|"America/Martinique"|"America/Matamoros"|"America/Mazatlan"|"America/Mendoza"|"America/Menominee"|"America/Merida"|"America/Metlakatla"|"America/Mexico_City"|"America/Miquelon"|"America/Moncton"|"America/Monterrey"|"America/Montevideo"|"America/Montserrat"|"America/Nassau"|"America/New_York"|"America/Nome"|"America/Noronha"|"America/North_Dakota/Beulah"|"America/North_Dakota/Center"|"America/North_Dakota/New_Salem"|"America/Ojinaga"|"America/Panama"|"America/Paramaribo"|"America/Phoenix"|"America/Port-au-Prince"|"America/Port_of_Spain"|"America/Porto_Velho"|"America/Puerto_Rico"|"America/Punta_Arenas"|"America/Rankin_Inlet"|"America/Recife"|"America/Regina"|"America/Resolute"|"America/Rio_Branco"|"America/Santarem"|"America/Santiago"|"America/Santo_Domingo"|"America/Sao_Paulo"|"America/Scoresbysund"|"America/Sitka"|"America/St_Barthelemy"|"America/St_Johns"|"America/St_Kitts"|"America/St_Lucia"|"America/St_Thomas"|"America/St_Vincent"|"America/Swift_Current"|"America/Tegucigalpa"|"America/Thule"|"America/Tijuana"|"America/Toronto"|"America/Tortola"|"America/Vancouver"|"America/Whitehorse"|"America/Winnipeg"|"America/Yakutat"|"Antarctica/Casey"|"Antarctica/Davis"|"Antarctica/DumontDUrville"|"Antarctica/Macquarie"|"Antarctica/Mawson"|"Antarctica/McMurdo"|"Antarctica/Palmer"|"Antarctica/Rothera"|"Antarctica/Syowa"|"Antarctica/Troll"|"Antarctica/Vostok"|"Arctic/Longyearbyen"|"Asia/Aden"|"Asia/Almaty"|"Asia/Amman"|"Asia/Anadyr"|"Asia/Aqtau"|"Asia/Aqtobe"|"Asia/Ashgabat"|"Asia/Atyrau"|"Asia/Baghdad"|"Asia/Bahrain"|"Asia/Baku"|"Asia/Bangkok"|"Asia/Barnaul"|"Asia/Beirut"|"Asia/Bishkek"|"Asia/Brunei"|"Asia/Calcutta"|"Asia/Chita"|"Asia/Colombo"|"Asia/Damascus"|"Asia/Dhaka"|"Asia/Dili"|"Asia/Dubai"|"Asia/Dushanbe"|"Asia/Famagusta"|"Asia/Gaza"|"Asia/Hebron"|"Asia/Hong_Kong"|"Asia/Hovd"|"Asia/Irkutsk"|"Asia/Jakarta"|"Asia/Jayapura"|"Asia/Jerusalem"|"Asia/Kabul"|"Asia/Kamchatka"|"Asia/Karachi"|"Asia/Katmandu"|"Asia/Khandyga"|"Asia/Krasnoyarsk"|"Asia/Kuala_Lumpur"|"Asia/Kuching"|"Asia/Kuwait"|"Asia/Macau"|"Asia/Magadan"|"Asia/Makassar"|"Asia/Manila"|"Asia/Muscat"|"Asia/Nicosia"|"Asia/Novokuznetsk"|"Asia/Novosibirsk"|"Asia/Omsk"|"Asia/Oral"|"Asia/Phnom_Penh"|"Asia/Pontianak"|"Asia/Pyongyang"|"Asia/Qatar"|"Asia/Qostanay"|"Asia/Qyzylorda"|"Asia/Rangoon"|"Asia/Riyadh"|"Asia/Saigon"|"Asia/Sakhalin"|"Asia/Samarkand"|"Asia/Seoul"|"Asia/Shanghai"|"Asia/Singapore"|"Asia/Srednekolymsk"|"Asia/Taipei"|"Asia/Tashkent"|"Asia/Tbilisi"|"Asia/Tehran"|"Asia/Thimphu"|"Asia/Tokyo"|"Asia/Tomsk"|"Asia/Ulaanbaatar"|"Asia/Urumqi"|"Asia/Ust-Nera"|"Asia/Vientiane"|"Asia/Vladivostok"|"Asia/Yakutsk"|"Asia/Yekaterinburg"|"Asia/Yerevan"|"Atlantic/Azores"|"Atlantic/Bermuda"|"Atlantic/Canary"|"Atlantic/Cape_Verde"|"Atlantic/Faeroe"|"Atlantic/Madeira"|"Atlantic/Reykjavik"|"Atlantic/South_Georgia"|"Atlantic/St_Helena"|"Atlantic/Stanley"|"Australia/Adelaide"|"Australia/Brisbane"|"Australia/Broken_Hill"|"Australia/Darwin"|"Australia/Eucla"|"Australia/Hobart"|"Australia/Lindeman"|"Australia/Lord_Howe"|"Australia/Melbourne"|"Australia/Perth"|"Australia/Sydney"|"Europe/Amsterdam"|"Europe/Andorra"|"Europe/Astrakhan"|"Europe/Athens"|"Europe/Belgrade"|"Europe/Berlin"|"Europe/Bratislava"|"Europe/Brussels"|"Europe/Bucharest"|"Europe/Budapest"|"Europe/Busingen"|"Europe/Chisinau"|"Europe/Copenhagen"|"Europe/Dublin"|"Europe/Gibraltar"|"Europe/Guernsey"|"Europe/Helsinki"|"Europe/Isle_of_Man"|"Europe/Istanbul"|"Europe/Jersey"|"Europe/Kaliningrad"|"Europe/Kiev"|"Europe/Kirov"|"Europe/Lisbon"|"Europe/Ljubljana"|"Europe/London"|"Europe/Luxembourg"|"Europe/Madrid"|"Europe/Malta"|"Europe/Mariehamn"|"Europe/Minsk"|"Europe/Monaco"|"Europe/Moscow"|"Europe/Oslo"|"Europe/Paris"|"Europe/Podgorica"|"Europe/Prague"|"Europe/Riga"|"Europe/Rome"|"Europe/Samara"|"Europe/San_Marino"|"Europe/Sarajevo"|"Europe/Saratov"|"Europe/Simferopol"|"Europe/Skopje"|"Europe/Sofia"|"Europe/Stockholm"|"Europe/Tallinn"|"Europe/Tirane"|"Europe/Ulyanovsk"|"Europe/Vaduz"|"Europe/Vatican"|"Europe/Vienna"|"Europe/Vilnius"|"Europe/Volgograd"|"Europe/Warsaw"|"Europe/Zagreb"|"Europe/Zurich"|"Indian/Antananarivo"|"Indian/Chagos"|"Indian/Christmas"|"Indian/Cocos"|"Indian/Comoro"|"Indian/Kerguelen"|"Indian/Mahe"|"Indian/Maldives"|"Indian/Mauritius"|"Indian/Mayotte"|"Indian/Reunion"|"Pacific/Apia"|"Pacific/Auckland"|"Pacific/Bougainville"|"Pacific/Chatham"|"Pacific/Easter"|"Pacific/Efate"|"Pacific/Enderbury"|"Pacific/Fakaofo"|"Pacific/Fiji"|"Pacific/Funafuti"|"Pacific/Galapagos"|"Pacific/Gambier"|"Pacific/Guadalcanal"|"Pacific/Guam"|"Pacific/Honolulu"|"Pacific/Kiritimati"|"Pacific/Kosrae"|"Pacific/Kwajalein"|"Pacific/Majuro"|"Pacific/Marquesas"|"Pacific/Midway"|"Pacific/Nauru"|"Pacific/Niue"|"Pacific/Norfolk"|"Pacific/Noumea"|"Pacific/Pago_Pago"|"Pacific/Palau"|"Pacific/Pitcairn"|"Pacific/Ponape"|"Pacific/Port_Moresby"|"Pacific/Rarotonga"|"Pacific/Saipan"|"Pacific/Tahiti"|"Pacific/Tarawa"|"Pacific/Tongatapu"|"Pacific/Truk"|"Pacific/Wake"|"Pacific/Wallis"} */
  #timeZone = "UTC";
  /** @type {boolean|undefined} */
  #hour12 = undefined;
  /** @type {"h11"|"h12"|"h23"|"h24"|undefined} */
  #hourCycle = undefined;
  /** @type {"basic"|"best fit"|undefined} */
  #formatMatcher = "best fit";
  /** @type {string|undefined} */
  #weekday = undefined;
  /** @type {string|undefined} */
  #era = undefined;
  /** @type {"numeric"|"2-digit"|undefined} */
  #year = undefined;
  /** @type {"numeric"|"2-digit"|undefined} */
  #month = undefined;
  /** @type {"numeric"|"2-digit"|undefined} */
  #day = undefined;
  /** @type {"numeric"|"2-digit"|undefined} */
  #hour = undefined;
  /** @type {"numeric"|"2-digit"|undefined} */
  #minute = undefined;
  /** @type {"numeric"|"2-digit"|undefined} */
  #second = undefined;
  /** @type {"0"|"1"|"2"|"3"|0|1|2|3|undefined} */
  #fractionalSecondDigits = undefined;
  /** @type {"short"|"long"|"shortOffset"|"longOffset"|"shortGeneric"|"longGeneric"|undefined} */
  #timeZoneName = undefined;

  /** @type {boolean} */
  #isValid = true;
  /** @type {boolean} */
  #isDirty = false;
  /** @type {Set<keyof DatePart>} */
  #invalidProperties = new Set();
  /** @type {Set<keyof DatePart>} */
  #dirtyProperties = new Set();
  /** @type {boolean} */
  #atLeastOneStyleSet = false;
  /** @type {boolean} */
  #atLeastOneNonStyleSet = false;
  /** @type {Map<string, string|undefined>} */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @eslint/no-unused-private-class-members
  static #defaults =
    new Map([
      ["dateStyle", ""],
      ["timeStyle", ""],
      ["calendar", "gregory"],
      ["dayPeriod", ""],
      ["numberingSystem", "latn"],
      ["locale", getProbableClientLocale()],
      ["localeMatcher", "best fit"],
      ["timeZone", getProbableClientTimeZoneName([])],
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
  static #validAlphaNumeric = [...new Set([...this.#validAlpha, ...this.#validNumeric])];
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
  static #validNumberingSystems = ["", ...Intl.supportedValuesOf("numberingSystem")];
  /** @type {(keyof DatePart)[]} */ 
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
      for (const key of DateTimeFormattingOptions.#nonStyleKeys.filter((k) => k in DateTimeFormattingOptions)) {
        // Note, if there is a key in nonStyleKeys that is not on DatePart,
        // it will be set to undefined, and that's okay.
        /** @type {keyof DateTimeFormattingOptions | undefined} */
        const k = key in DateTimeFormattingOptions ? key/** as unknown as keyof DateTimeFormattingOptions */ : undefined;
        if (k) {
          newMe.setValue(k, datePart[key]);
        }
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
      (part) => part.isStyle && ["date", "date-time"].includes(part.type ?? ""),
    );
    const timeStyle = [...datePartCollection].find(
      (part) => part.isStyle && ["time", "date-time"].includes(part.type ?? ""),
    );
    if (dateStyle || timeStyle) {
      newMe.setValue("dateStyle", (dateStyle ?? timeStyle)?.dateStyle);
      newMe.setValue("timeStyle", (timeStyle ?? dateStyle)?.timeStyle);
    } else {
      for (const part of datePartCollection) {
        // Note, if there is a key in nonStyleKeys that is not on DatePart,
        // it will be set to undefined, and that's okay.
        /** @type {keyof DateTimeFormattingOptions | undefined} */
        // eslint-ignore-next-line @typescript-eslint/*
        const k = DateTimeFormattingOptions.#nonStyleKeys.find((key) => key in DateTimeFormattingOptions);
        if (k) {
          /** @type {keyof DatePart} */
          const key = k/** as unknown as keyof DatePart */;
          newMe.setValue(k, part[key]);
        }
      }
    }
    return newMe;
  }
  /**
   * Sets the validity of a property, marking the instance as invalid if the property is invalid.
   * @param {keyof DatePart} prop The key to mark invalid
   * @param {boolean} isValid true to mark valid; otherwise, false
   */
  #setInvalid(prop, isValid) {
    if (!isValid) {
      this.#isValid = false;
      this.#invalidProperties.add(prop);
    }
  }
  /**
   * Sets the dirty status of a property, marking the instance as dirty if the property is dirty.
   * @param {keyof DatePart} prop The key to mark dirty
   * @param {boolean} isDirty true to mark dirty; otherwise, false
   */
  #setDirty(prop, isDirty) {
    if (isDirty) {
      this.#dirtyProperties.add(prop);
      this.#isDirty = true;
    } else {
      this.#dirtyProperties.delete(prop);
      this.#isDirty = this.#dirtyProperties.size > 0;
    }
  }
  /**
   * Deals with style properties, marking the instance as invalid if necessary.
   * @param {keyof DatePart} prop The category key to mark invalid, or undefined
   */
  #dealWithStyles(prop) {
    this.#updateAtLeastOneStyleSet();
    this.#updateAtLeastOneNonStyleSet();
    this.#setInvalid(
      prop,
      !(this.#atLeastOneStyleSet && this.#atLeastOneNonStyleSet),
    );
  }
  #updateAtLeastOneStyleSet() {
    this.#atLeastOneStyleSet =
      this.#dirtyProperties.has("dateStyle") || this.#dirtyProperties.has("timeStyle");
  }
  #updateAtLeastOneNonStyleSet() {
    this.#atLeastOneNonStyleSet = DateTimeFormattingOptions.#nonStyleKeys.some((key) =>
      this.#dirtyProperties.has(key),
    );
    if (this.#atLeastOneNonStyleSet) {
      console.log(
        this.#instanceId,
        "dirty non-styles:",
        DateTimeFormattingOptions.#nonStyleKeys.filter((key) => this.#dirtyProperties.has(key)),
      );
    }
  }
  /** @type {(keyof DateTimeFormattingOptions)[]} */
  static #unsettableKeys = [
    'atLeastOneNonStyleSet',
    'atLeastOneStyleSet',
    'defaultcalendar',
    'defaultdateStyle',
    'defaultday',
    'defaultera',
    'defaultformatMatcher',
    'defaultfractionalSecondDigits',
    'defaulthour',
    'defaulthour12',
    'defaulthourCycle',
    'defaultlocale',
    'defaultlocaleMatcher',
    'defaultminute',
    'defaultmonth',
    'defaultnumberingSystem',
    'defaultsecond',
    'defaulttimeStyle',
    'defaulttimeZone',
    'defaulttimeZoneName',
    'defaultweekday',
    'defaultyear',
    'isDirty',
    'valid',
    'setValue'
  ];
  /**
   * Sets a property value, marking the instance as dirty as needed.
   * @param {keyof DateTimeFormattingOptions} key The key of the property to set.
   * @param {unknown} value The value of the property to set.
   */
  setValue(key, value) {
    if (!(key in this)) {
      throw new Error(`"${key}" is not a valid Date Time Formatting Option`);
    }
    // Cannot assign to 'defaultfractionalSecondDigits' because it is a read-only property.
    if (DateTimeFormattingOptions.#unsettableKeys.includes(key)) {
      throw new Error(`"${key}" is a read-only property and cannot be set.`);
    }
    if (this[key] !== value) {
      // eslint-disable-next-line @typescript-eslint/no-readonly-property-assignment
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
      console.log(this.#instanceId, "dirty properties: ", [...this.#dirtyProperties]);
    }
    return this.#isDirty;
  }
  /**
   * Indicates whether all properties are valid.
   * @returns {boolean} True if all properties are valid; false otherwise.
   */
  get valid() {
    if (!this.#isValid) {
      console.log(this.#instanceId, "invalid properties: ", [...this.#invalidProperties]);
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
      this.#setInvalid("dateStyle", DateTimeFormattingOptions.#validStyles.includes(value));
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
      this.#setInvalid("timeStyle", DateTimeFormattingOptions.#validStyles.includes(value));
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
        DateTimeFormattingOptions.#validCalendars.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validAlpha.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validNumberingSystems.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validLocaleMatchers.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validTimeZones.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validHourCycles.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validFormatMatchers.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validAlpha.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validAlpha.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validAlphaNumeric.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validNumeric.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validFractions.includes(value) || value == null,
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
        DateTimeFormattingOptions.#validTimeZoneNames.includes(value) || value == null,
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
      numberingSystem: this.numberingSystem === "" ? undefined : this.numberingSystem,
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
        this.fractionalSecondDigits === "" ? undefined : this.fractionalSecondDigits,
      timeZoneName: this.timeZoneName === "" ? undefined : this.timeZoneName,
    };
    console.log(JSON.stringify(dtfo, null, 2));
    return dtfo;
  }
}
