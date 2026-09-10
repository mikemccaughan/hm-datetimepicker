import BasicUtilities from "./BasicUtilities.mjs";
import DateHelper from "./DateHelper.mjs";

export class HMDateTimePicker {
  /**
   * The array of button elements for each date in the calendar,
   * which have data attributes for the date they represent and
   * whether they are in the current month, are today, or are selected.
   * @type {Array<HTMLButtonElement>}
   */
  #dateButtons = [];
  /**
   * A cache for the results of calculating all dates in a month, 
   * keyed by year and month in the format "year-month", 
   * to avoid recalculating them multiple times when populating 
   * the month entries and disabling months.  
   * @type {Map<string, Array<Date>>}
   */
  #allDatesInMonthCache = new Map();
  /**
   * A cache for the results of calculating all dates in a year,
   * keyed by year as a string, to avoid recalculating them multiple times
   * when populating the year entries and disabling years.
   * @type {Map<string, Array<Date>>}
   */
  #allDatesInYearCache = new Map();
  /**
   * A cache for the results of calculating whether all dates in a month are disabled,
   * keyed by year as a string or year andmonth in the format "year-month", 
   * to avoid recalculating them multiple times when populating 
   * the month entries and disabling months.  
   * @type {Map<string, boolean>}
   */
  #allDatesAreDisabledCache = new Map();
  /**
   * 
   * @param {string} inputSelector The CSS selector for the input element that the date time picker is for
   * @param {string} pickerSelector The CSS selector for the element that contains the date time picker
   * @param {string} pickerTabsSelector The CSS selector for the element that contains the date time picker tabs
   * @param {boolean} useUTC Whether to use UTC time zone or the client's local time zone
   * @param {Date | string | number} defaultDate The default date to use if the input value is not a valid date
   * @param {string | Array<string>} format The format(s) to use for parsing and formatting dates
   * @param {Date | string | number} minDate The minimum date that can be selected in the date time picker
   * @param {Date | string | number} maxDate The maximum date that can be selected in the date time picker
   * @param {function(Date): boolean} disableDate A function that takes a date and returns true if the date should be disabled in the date time picker, or false if it should be enabled
   * @param {boolean} useYearAndMonthTabs Whether to use tabs for year and month selection instead of selects
   * @param {boolean} useYearAndMonthSelects Whether to use selects for year and month selection instead of tabs
   */
  constructor({
    inputSelector,
    pickerSelector,
    pickerTabsSelector,
    useUTC,
    defaultDate,
    format,
    minDate,
    maxDate,
    disableDate,
    useYearAndMonthTabs,
    useYearAndMonthSelects,
  }) {
    console.time('constructor');
    this.inputSelector = inputSelector;
    this.pickerTabsSelector = pickerTabsSelector;
    this.pickerSelector = pickerSelector;
    this.useUTC = useUTC;
    this.useYearAndMonthTabs = 
      useYearAndMonthTabs || !useYearAndMonthSelects;
    this.useYearAndMonthSelects =
      useYearAndMonthSelects || !useYearAndMonthTabs;
    if (this.useYearAndMonthSelects && this.useYearAndMonthTabs) {
      this.useYearAndMonthTabs = false;
    }
    if (!this.useYearAndMonthSelects && !this.useYearAndMonthTabs) {
      this.useYearAndMonthSelects = true;
    }
    /**
     * Options for formatting dates
     * @type {Intl.DateTimeFormatOptions} 
     */
    const dateFormatterOptions = {
      dateStyle: 'long'
    };
    if (useUTC) {
      dateFormatterOptions.timeZone = 'UTC';
    }
    /**
     * The date formatter for formatting dates in the calendar and input
     * @type {Intl.DateTimeFormat}
     */
    this.dateFormatter = new Intl.DateTimeFormat(
      undefined,
      dateFormatterOptions
    );
    /**
     * Options for formatting dates
     * @type {Intl.DateTimeFormatOptions} 
     */
    const isoFormatterOptions = {};
    /**
     * The date formatter for formatting dates as ISO strings for data attributes
     * @type {Intl.DateTimeFormat}
     */
    this.isoFormatter = new Intl.DateTimeFormat(undefined, isoFormatterOptions);
    // Note: we override the format function of the isoFormatter to produce ISO 
    // strings in the format of yyyy-MM-dd, which is what we use for data attributes.
    Object.defineProperty(this.isoFormatter, 'format', {
      value: function (date) {
        return date.toISOString().slice(0, 10);
      },
    });
    /**
     * Options for formatting dates
     * @type {Intl.DateTimeFormatOptions} 
     */
    const monthYearFormatterOptions = {
      month: 'long',
      year: 'numeric',
    };
    /**
     * The date formatter for formatting the month and year in the month-year selector
     * @type {Intl.DateTimeFormat}
     */
    this.monthYearFormatter = new Intl.DateTimeFormat(
      undefined,
      monthYearFormatterOptions
    );
    /**
     * Options for formatting dates
     * @type {Intl.DateTimeFormatOptions} 
     */
    const monthLongFormatterOptions = { month: 'long' };
    /**
     * The date formatter for formatting the month in the month select and month entries
     * @type {Intl.DateTimeFormat}
     */
    this.monthLongFormatter = new Intl.DateTimeFormat(
      undefined,
      monthLongFormatterOptions
    );
    /**
     * Options for formatting dates
     * @type {Intl.DateTimeFormatOptions} 
     */
    const monthShortFormatterOptions = { month: 'short' };
    /**
     * The date formatter for formatting the month in the month select and month entries (short version)
     * @type {Intl.DateTimeFormat}
     */
    this.monthShortFormatter = new Intl.DateTimeFormat(
      undefined,
      monthShortFormatterOptions
    );
    /**
     * Options for formatting dates
     * @type {Intl.DateTimeFormatOptions} 
     */
    const yearFormatterOptions = { year: 'numeric' };
    /**
     * The date formatter for formatting the year in the year select and year entries
     * @type {Intl.DateTimeFormat}
     */
    this.yearFormatter = new Intl.DateTimeFormat(
      undefined,
      yearFormatterOptions
    );
    /**
     * Options for formatting dates
     * @type {Intl.DateTimeFormatOptions} 
     */
    const timeFormatterOptions = {
      timeStyle: 'long',
    };
    if (useUTC) {
      timeFormatterOptions.timeZone = 'UTC';
    } else {
      timeFormatterOptions.timeZoneName = 'long';
    }
    /**
     * The date formatter for formatting times in the time input and input
     * @type {Intl.DateTimeFormat}
     */
    this.timeFormatter = new Intl.DateTimeFormat(
      undefined,
      timeFormatterOptions
    );
    if (Array.isArray(format)) {
      /**
       * The formats for parsing and formatting dates, in order of preference for parsing
       * @type {Intl.DateTimeFormat}
       */
      this.formats = Array.from(format);
    }
    if (typeof format === 'string') {
      /**
       * The formats for parsing and formatting dates, in order of preference for parsing
       * @type {Intl.DateTimeFormat}
       */
      this.formats = [format];
    }
    /**
     * The minimum date that can be selected in the date time picker
     * @type {Date}
     */
    this.minDate = this.parseDate(minDate, new Date(-8640000000000000));
    /**
     * The maximum date that can be selected in the date time picker
     * @type {Date}
     */
    this.maxDate = this.parseDate(maxDate, new Date(8640000000000000));
    /**
     * A function that takes a date and returns true if the date should be disabled in the date time picker, or false if it should be enabled
     * @type {function(Date): boolean}
     */
    this.disableDate =
      typeof disableDate === 'function' ? disableDate : (date) => false;

    /**
     * The input element for the date time picker
     * @type {HTMLInputElement}
     */
    this.inputElement = document.querySelector(this.inputSelector);
    /**
     * The element that contains the date time picker
     * @type {HTMLElement}
     */
    this.pickerElement = document.querySelector(this.pickerSelector);
    /**
     * The element that contains the date time picker tabs
     * @type {HTMLElement}
     */
    this.pickerTabsElement = document.querySelector(this.pickerTabsSelector);
    if (
      this.inputElement.id &&
      this.inputElement.id.length &&
      (!this.pickerElement.id || this.pickerElement.id.length === 0)
    ) {
      // Generate a unique id for the picker element based on the input element's id
      const newId = this.inputElement.id + '-picker';
      let lastId = 0;
      while (document.querySelector(`#${newId}`) !== null) {
        newId = `${this.inputElement.id}-picker-${lastId}`;
        lastId++;
      }
      this.pickerElement.id = newId;
      this.pickerTabsElement.id = `${newId}-tabs`;
    }
    // Add classes to the picker element if using tabs for year and month selection
    this.pickerElement.classList.toggle('use-tabs', this.useYearAndMonthTabs);
    // Add classes to the picker element if using selects for year and month selection
    this.pickerElement.classList.toggle(
      'use-selects',
      this.useYearAndMonthSelects
    );
    /**
     * The array of time zones to populate the time zone select with, sorted with UTC first, 
     * then the probable client time zone, then possible client time zones, 
     * then the rest in alphabetical order
     */
    const timeZones = Intl.supportedValuesOf('timeZone');
    const probableTimeZone = DateHelper.getProbableClientTimeZoneName([]);
    const possibleTimeZones = DateHelper.getPossibleClientTimeZoneNames();
    /**
     * The select element for selecting the time zone in the time picker
      * @type {HTMLSelectElement}
     */
    this.timeZoneElement = this.pickerElement.querySelector('.date-time-picker-time-zone');
    const sortTimeZones = (a, b) => {
      if (a === 'UTC' && b !== 'UTC') {
        return Number.MIN_SAFE_INTEGER;
      } else if (a === probableTimeZone && b !== probableTimeZone) {
        return Number.MIN_SAFE_INTEGER + 1;
      } else if (a !== probableTimeZone && b === probableTimeZone) {
        return Number.MAX_SAFE_INTEGER - 1;
      } else if (a === probableTimeZone && b === probableTimeZone) {
        return 0;
      } else if (possibleTimeZones.includes(a) && possibleTimeZones.includes(b)) {
        return 0;
      } else if (possibleTimeZones.includes(a) && !possibleTimeZones.includes(b)) {
        return Number.MIN_SAFE_INTEGER + 2;
      } else if (!possibleTimeZones.includes(a) && possibleTimeZones.includes(b)) {
        return Number.MAX_SAFE_INTEGER - 2;
      } else {
        return a.localeCompare(b);
      }
    }
    timeZones.sort(sortTimeZones);
    for (const timeZone of timeZones) {
      // Add an option for each time zone, with data attributes for whether it is the probable 
      // time zone and whether it is a possible time zone
      /**
       * The option element for a time zone in the time zone select
       * @type {HTMLOptionElement}
       */
      const tzOption = document.createElement('option');
      tzOption.value = timeZone;
      tzOption.text = timeZone;
      if (timeZone === probableTimeZone) {
        tzOption.dataset.probable = true;
      }
      if (possibleTimeZones.includes(timeZone)) {
        tzOption.dataset.possible = true;
      }
      this.timeZoneElement.appendChild(tzOption);
    }
    /**
     * The element for the "now" time button in the time picker
     * @type {HTMLButtonElement}
     */
    this.timeNowElement = this.pickerElement.querySelector('.date-time-picker-time-input-now');
    /**
     * The element for the month and year selector in the date picker, which shows the currently 
     * selected month and year and allows clicking to select a different month or year
     * @type {HTMLDivElement}
     */
    this.monthYearSelector = this.pickerElement.querySelector(
      '.month-year-selector'
    );
    /**
     * The element for the date picker part of the picker, which contains the calendar and month/year selection
      * @type {HTMLDivElement}
     */
    this.datePickerElement = this.pickerElement.querySelector('.date-picker');
    /**
     * The input element for the date in the date picker (for UTC time zone)
     * @type {HTMLInputElement}
     */
    this.pickerInputElement = this.pickerElement.querySelector('.date-utc');
    /**
     * The input element for the time in the time picker (for UTC time zone)
     * @type {HTMLInputElement} 
     */
    this.pickerTimeElement = this.pickerElement.querySelector('.time-utc');
    /**
     * The select element for selecting the month in the month-year selector (for UTC time zone)
     * @type {HTMLSelectElement}  
     */
    this.monthSelect = this.pickerElement.querySelector('.month-utc');
    /**
     * The select element for selecting the year in the month-year selector (for UTC time zone)
     * @type {HTMLSelectElement}
     */
    this.yearSelect = this.pickerElement.querySelector('.year-utc');
    /**
     * The button element for going to the previous month in the calendar
     * @type {HTMLButtonElement}
     */
    this.prevMonth = this.pickerElement.querySelector('.month-prev-utc');
    /**
     * The button element for going to the next month in the calendar
     * @type {HTMLButtonElement}
     */
    this.nextMonth = this.pickerElement.querySelector('.month-next-utc');
    /** 
     * The button element for submitting the selected date and time in the picker
     * @type {HTMLButtonElement}
     */
    this.okayButton = this.pickerElement
      .closest('aside')
      .querySelector('button.picker-footer-submit');
    /** 
     * The button element for canceling the selection of date and time in the picker
     * @type {HTMLButtonElement}
     */
    this.cancelButton = this.pickerElement
      .closest('aside')
      .querySelector('button.picker-footer-cancel');
    /**
     * The element that is the tab panel which contains the element(s) for selecting a yearin the month-year selector
     * @type {HTMLDivElement}
     */
    this.yearEntry = this.pickerElement.querySelector('.year-entry');
    /**
     * The element that is the tab panel which contains the element(s) for selecting a month in the month-year selector
     * @type {HTMLDivElement}
     */
    this.monthEntry = this.pickerElement.querySelector('.month-entry');
    this.pickerElement.classList.remove('show');
    this.defaultDate = this.parseDate(defaultDate);
    this.value = this.parseDate(this.inputElement.value, this.defaultDate);
    console.timeEnd('constructor');
  }
  /**
   * The NodeList of button elements for each date in the calendar, 
   * which have data attributes for the date they represent and 
   * whether they are in the current month, are today, or are selected
   */
  get dateButtons() {
    if (!this.#dateButtons || this.#dateButtons.length === 0) {
      this.#dateButtons = Array.from(this.pickerElement.querySelectorAll(
        'button.calendar-entry-body-date'
      ));
    }
    return this.#dateButtons;
  }
  set dateButtons(value) {
    if (this.#dateButtons !== value) {
      this.#dateButtons = value;
    }
  }
  /**
   * Parses the given value as a date, returning a Date object if it is a valid date, 
   * or the value itself if it is not a valid date.
   * @param {Date | string | number} value 
   * @returns {Date} the currently selected date, parsed from the given value, 
   * or the value itself if it is not a valid date, with a wasParsed property 
   * indicating whether it was successfully parsed as a date
   */
  getDate(value) {
    if (typeof value !== 'object' || Number.isNaN(value.valueOf())) {
      return value;
    }
    const returnValue = new Date(value.valueOf());
    returnValue.wasParsed = true;
    return returnValue;
  }
  /**
   * Gets the current date, parsed from the given value, 
   * or the value itself if it is not a valid date, with a wasParsed property 
   * indicating whether it was successfully parsed as a date
   */
  getNow() {
    const today = new Date();
    return this.getDate(today);
  }
  /**
   * Parses the given `value` as a date, returning a Date object if it is a valid date, 
   * or the `value` itself if it is not a valid date. If the `value` is undefined, 
   * it returns the `defaultValue` if it is provided, or the current date if `defaultValue` 
   * is not provided. If the `value` is a string that cannot be parsed as a date, it 
   * returns the `defaultValue` if it is provided, or an invalid date if `defaultValue` 
   * is not provided.
   * @param {Date | string | number} value The value to parse as a date, which can be a 
   *  Date object, a string, or a number (timestamp) 
   * @param {Date | string | number | null} defaultValue The default value to return if the 
   *  input value is not a valid date, which can be a Date object, a string, a number 
   *  (timestamp), or null. If null, the default value will be the current date.  
   * @returns {Date} the parsed date, or the default value if the input is not a valid date
   */
  parseDate(value, defaultValue) {
    let returnValue = new Date('Invalid');
    if (typeof value === 'object' && value instanceof Date) {
      if (Number.isNaN(value.valueOf())) {
        returnValue = this.parseDate(defaultValue);
      } else {
        returnValue = this.getDate(value);
      }
    }
    if (typeof value === 'undefined') {
      returnValue = defaultValue ? this.parseDate(defaultValue) : this.getNow();
    }
    if (typeof value === 'number') {
      returnValue = new Date(value);
    }
    if (typeof value === 'string') {
      // TODO: Parse Date
      // assume it parses as local
      if (value.trim().length === 0) {
        returnValue = this.parseDate(defaultValue);
      } else {
        const parsed = DateHelper.parseDate(
          value.trim(), 
          { 
            locale: [], 
            format: ['yyyy-MM-dd'], 
            timeZone: this.useUTC ? 'UTC' : this.timeZoneElement.value 
          }
        );
        returnValue = this.getDate(parsed);
      }
    }
    returnValue.wasParsed = true;
    return returnValue;
  }
  /**
   * Formats the current value to the current format.
   * @returns {string} The current value, formatted to the current format.
   *  Sets the input element's value to the formatted date and time, 
   *  and sets the month-year selector's text to the formatted month and year.
   */
  formatDate() {
    const val = this.value;
    const formatted = this.dateFormatter.format(val);
    this.pickerInputElement.value = formatted;
    const myFormatted = this.monthYearFormatter.format(val);
    this.monthYearSelector.querySelector('.selected').textContent = myFormatted;
    return formatted;
  }
  /**
   * Formats the current value's time portion to the current format.
   * @returns {string} The time portion of the current value, formatted to the current format.
   *  Sets the picker's time input value to the formatted value, and sets the picker's time zone
   *  name to the used value.
   */
  formatTime() {
    const val = this.value;
    const formattedTime = this.timeFormatter.format(val);
    const tz = formattedTime.slice(formattedTime.lastIndexOf(' '));
    this.pickerElement.querySelector('.date-time-picker-time-zone').value = this.timeFormatter.resolvedOptions().timeZone;
    this.pickerElement.querySelector('.date-time-picker-time-zone-name').textContent = tz.trim();
    this.pickerTimeElement.value = formattedTime.replace(tz, '');
    return formattedTime;
  }
  /**
   * Sets the time zone for the date time picker.
   */
  setTimeZone() {
    const timeZone = this.pickerElement.querySelector('.date-time-picker-time-zone').value;
    const timeFormatterOptions = this.timeFormatter.resolvedOptions();
    timeFormatterOptions.timeZone = timeZone;
    this.timeFormatter = new Intl.DateTimeFormat(undefined, timeFormatterOptions);
    const dateFormatterOptions = this.dateFormatter.resolvedOptions();
    dateFormatterOptions.timeZone = timeZone;
    this.dateFormatter = new Intl.DateTimeFormat(undefined, dateFormatterOptions);
    this.useUTC = timeZone === 'UTC';
    this.formatTime();
  }
  /**
   * Sets the input element's value to the current value, formatted to the current format,
   * as well as time portion if applicable.
   */
  setSelectedValue() {
    const val = this.value;
    const formatted = this.dateFormatter.format(val);
    const formattedTime = this.formatTime();
    this.inputElement.value = `${formatted} ${formattedTime}`;
  }
  /**
   * Populates the month select and month entries in the month-year selector 
   * with the months of the current year,
   */
  populateMonths() {
    console.time('populateMonths');
    console.time('populateMonths-part1');
    const dateDate = this.getDate(this.value);
    const monthDate = this.getDate(this.value);
    const monthCurrent = monthDate.getMonth();
    for (let i = this.monthSelect.length - 1; i >= 0; i--) {
      this.monthSelect.remove(i);
    }
    for (let i = 0; i < 12; i++) {
      monthDate.setMonth(i);
      let monthOption = document.createElement('option');
      monthOption.value = i;
      monthOption.text = this.monthLongFormatter.format(monthDate);
      monthOption.selected = i === monthCurrent;
      this.monthSelect.add(monthOption);
    }
    console.timeEnd('populateMonths-part1');
    console.time('populateMonths-part2');
    for (let i = 0; i < 12; i++) {
      monthDate.setMonth(i);
      const buttonLabel = this.monthLongFormatter.format(monthDate);
      const buttonText = this.monthShortFormatter.format(monthDate);
      let monthButton = this.monthEntry.querySelector(
        `button[aria-label="${buttonLabel}"]`
      );
      if (monthButton == null) {
        monthButton = document.createElement('button');
        monthButton.setAttribute('type', 'button');
        monthButton.classList.add('month-entry-month');
        this.monthEntry.appendChild(monthButton);
      }
      monthButton.setAttribute('aria-label', buttonLabel);
      this.clearDataset(monthButton);
      monthButton.dataset.date = this.isoFormatter.format(monthDate);
      const today = this.getNow();
      monthButton.dataset.isToday =
        monthDate.getFullYear() === today.getFullYear() &&
        monthDate.getMonth() === today.getMonth();
      monthButton.dataset.isSelected =
        monthDate.getFullYear() === dateDate.getFullYear() &&
        monthDate.getMonth() === dateDate.getMonth();
      monthButton.textContent = buttonText;
      const cacheKey = monthDate.toISOString().slice(0, 7);
      monthButton.disabled = this.allDatesAreDisabled(cacheKey, () => this.calculateAllDatesInMonth(monthDate));
    }
    console.timeEnd('populateMonths-part2');
    console.timeEnd('populateMonths');
  }
  /**
   * Populates the year select and year entries in the month-year selector 
   * with the years around the current year, starting from the current year 
   * and going back 12 years and forward 12 years, for a total of 25 years, 
   * and disables the years that have all dates disabled.
   */
  populateYears() {
    console.time('populateYears');
    console.time('populateYears-part1');
    const dateDate = this.getDate(this.value);
    const yearDate = this.getDate(this.value);
    const yearSelected = yearDate.getFullYear();
    const yearCurrent = this.getNow().getFullYear();
    // removes all options from the year select,
    this.yearSelect.length = 0;
    for (let i = yearCurrent; i < yearCurrent + 12; i++) {
      yearDate.setFullYear(i);
      let yearOption = document.createElement('option');
      yearOption.value = i;
      yearOption.text = this.yearFormatter.format(yearDate);
      yearOption.selected = i === yearSelected;
      this.yearSelect.add(yearOption);
    }
    console.timeEnd('populateYears-part1');
    console.time('populateYears-part2');
    for (let i = yearCurrent; i < yearCurrent + 24; i++) {
      yearDate.setFullYear(i);
      const buttonLabel = this.yearFormatter.format(yearDate);
      let yearButton = this.yearEntry.querySelector(
        `button[aria-label="${buttonLabel}"]`
      );
      if (yearButton == null) {
        yearButton = document.createElement('button');
        yearButton.setAttribute('type', 'button');
        yearButton.classList.add('year-entry-year');
        this.yearEntry.appendChild(yearButton);
      }
      yearButton.setAttribute('aria-label', buttonLabel);
      this.clearDataset(yearButton);
      yearButton.dataset.date = this.isoFormatter.format(yearDate);
      yearButton.dataset.isToday =
        yearDate.getFullYear() === this.getNow().getFullYear();
      yearButton.dataset.isSelected =
        yearDate.getFullYear() === dateDate.getFullYear();
      yearButton.textContent = yearDate.getFullYear();
      const allDatesInYear = () => this.calculateAllDatesInYear(yearDate);
      const cacheKey = yearDate.getFullYear().toString();
      yearButton.disabled = this.allDatesAreDisabled(cacheKey, allDatesInYear);
    }
    console.timeEnd('populateYears-part2');
    console.timeEnd('populateYears');
  }
  /**
   * Gets the first day of the month for a given date.
   * @param {Date} value The date to get the first day of the month for
   * @returns {Date} The first day of the month for the given date, 
   *  with the same time portion as the given date
   */
  getFirstOfMonth(value) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      1,
      value.getUTCHours(),
      value.getUTCMinutes(),
      value.getUTCSeconds(),
      value.getUTCMilliseconds()
    );
  }
  /**
   * Gets the last day of the month for a given date.
   * @param {Date} value The date to get the last day of the month for
   * @returns {Date} The last day of the month for the given date, 
   *  with the same time portion as the given date/
   */
  getLastOfMonth(value) {
    return new Date(
      value.getFullYear(),
      value.getMonth() + 1,
      0,
      value.getUTCHours(),
      value.getUTCMinutes(),
      value.getUTCSeconds(),
      value.getUTCMilliseconds()
    );
  }
  /**
   * Gets the first Sunday of the month for a given date.
   * @param {Date} value The date to get the first Sunday of the month for
   * @returns {Date} The first Sunday of the month for the given date, 
   *  with the same time portion as the given date
   */
  getFirstSunday(value) {
    const firstOfMonth = this.getFirstOfMonth(value);
    return new Date(
      firstOfMonth.getFullYear(),
      firstOfMonth.getMonth(),
      firstOfMonth.getDate() - firstOfMonth.getDay(),
      value.getUTCHours(),
      value.getUTCMinutes(),
      value.getUTCSeconds(),
      value.getUTCMilliseconds()
    );
  }
  /**
   * Gets the last Saturday of the month for a given date.
   * @param {Date} value The date to get the last Saturday of the month for
   * @returns {Date} The last Saturday of the monthh for thee given date,
   *  with the same time portion as the given date 
   */
  getLastSaturday(value) {
    const lastOfMonth = this.getLastOfMonth(value);
    return new Date(
      lastOfMonth.getFullYear(),
      lastOfMonth.getMonth() + 1,
      6 + lastOfMonth.getDay(),
      value.getUTCHours(),
      value.getUTCMinutes(),
      value.getUTCSeconds(),
      value.getUTCMilliseconds()
    );
  }
  /**
   * Determines if two dates occur on the same day.
   * @param {Date} a The first date to examine
   * @param {Date} b The second date to examine
   * @returns {boolean} true if `a` and `b` occur on the same day; otherwise, false.
   */
  isSameDay(a, b) {
    return DateHelper.isSameDay(a, b);
  }
  /**
   * Determines if first date occurs before the second date.
   * @param {Date} a The first date to examine
   * @param {Date} b The second date to examine
   * @returns {boolean} true if `a` occurs before `b`; otherwise, false.
   */
  isBeforeDay(a, b) {
    return DateHelper.isBeforeDay(a, b);
  }
  /**
   * Determines if first date occurs after the second date.
   * @param {Date} a The first date to examine
   * @param {Date} b The second date to examine
   * @returns {boolean} true if `a` occurs after `b`; otherwise, false.
   */
  isAfterDay(a, b) {
    return DateHelper.isAfterDay(a, b);
  }
  /**
   * Determines if a date is disabled.
   * @param {Date} date The date to examine
   * @returns {boolean} true if the date is disabled; otherwise, false. 
   * @description A date is disabled if it is before the minimum date, 
   * after or on the maximum date, or if the disableDate function returns 
   * true for that date
   */
  dateIsDisabled(date) {
    return ( 
      this.disableDate(date) ||
      this.isBeforeDay(date, this.minDate) ||
      this.isSameDay(date, this.maxDate) ||
      this.isAfterDay(date, this.maxDate)
    );
  }
  /**
   * Clears the dataset of a given element.
   * @param {HTMLOrForeignElement} el The element whose dataset will be cleared.
   */
  clearDataset(el) {
    if (!el || !el.dataset || !(el instanceof HTMLElement || el instanceof SVGElement)) {
      throw new Error(
        `Argument must be an HTMLOrForeignElement that has a dataset property, got ${typeof el}`
      );
    }
    for (let key in el.dataset) {
      delete el.dataset[key];
    }
  }
  /**
   * Populates the calendar with the dates for the current month, 
   * starting from the first Sunday before or on the first day of the month, 
   * and ending with the last Saturday after or on the last day of the month, 
   * and disables the dates that are disabled.
   */
  populateDates() {
    const dateDate = new Date(this.value);
    const startDate = this.getFirstSunday(dateDate);
    let endDate = this.getLastOfMonth(dateDate);
    if (this.isAfterDay(this.getLastSaturday(endDate), endDate)) {
      endDate = this.getLastSaturday(endDate);
    }
    const dateCount = Math.ceil((endDate.valueOf() - startDate.valueOf()) / (1000 * 60 * 60 * 24) + 1);
    const calendarElement = this.pickerElement.querySelector(
      '.calendar-entry-body'
    );
    for (let i = 0; i < dateCount; i++) {
      if (!this.dateButtons || this.dateButtons.length <= i) {
        let newDateButton = document.createElement('button');
        newDateButton.setAttribute('type', 'button');
        newDateButton.classList.add('calendar-entry-body-date');
        calendarElement.appendChild(newDateButton);
        this.dateButtons = [...this.dateButtons, newDateButton];
      }
      const buttonDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + i,
        dateDate.getHours(),
        dateDate.getMinutes(),
        dateDate.getSeconds(),
        dateDate.getMilliseconds()
      );
      const button = this.dateButtons[i];
      button.setAttribute('aria-label', this.dateFormatter.format(buttonDate));
      button.setAttribute('title', this.dateFormatter.format(buttonDate));
      this.clearDataset(button);
      button.dataset.date = this.isoFormatter.format(buttonDate);
      button.dataset.dateOther = buttonDate.getMonth() !== dateDate.getMonth();
      button.dataset.isToday = this.isSameDay(buttonDate, this.getNow());
      button.dataset.isSelected = this.isSameDay(buttonDate, dateDate);
      button.textContent = buttonDate.getDate().toString();
      button.disabled = this.dateIsDisabled(buttonDate);
    }
  }
  /**
   * Calculates all dates in the month of a given date.
   * @param {Date} monthDate A date which occurs in the year and month of the given date
   * @returns {Array<Date>} An array of all dates which occur in the year and month of the given date
   */
  calculateAllDatesInMonth(monthDate) {
    const cacheKey = `${monthDate.toISOString().slice(0, 7)}`;
    console.time(`calculateAllDatesInMonth(${cacheKey})`);
    if (this.#allDatesInMonthCache.has(cacheKey)) {
      console.time(`calculateAllDatesInMonth(${cacheKey})::cached`);
      const allDates = this.#allDatesInMonthCache.get(cacheKey);
      console.timeEnd(`calculateAllDatesInMonth(${cacheKey})::cached`);
      console.timeEnd(`calculateAllDatesInMonth(${cacheKey})`);
      return allDates;
    }
    const getAllDates = () => {
      console.time(`calculateAllDatesInMonth(${cacheKey})::calculation`);
      const allDates = [];
      const first = this.getFirstOfMonth(monthDate);
      const last = this.getLastOfMonth(monthDate);
      const temp = new Date(first.valueOf());
      while (temp.valueOf() <= last.valueOf()) {
        allDates.push(new Date(temp.valueOf()));
        temp.setDate(temp.getDate() + 1);
      }
      console.timeEnd(`calculateAllDatesInMonth(${cacheKey})::calculation`);
      return allDates;
    }
    const allDates = getAllDates();
    this.#allDatesInMonthCache.set(cacheKey, allDates);
    console.timeEnd(`calculateAllDatesInMonth(${cacheKey})`);
    return allDates;
  }
  /**
   * Calculates all dates in the year of a given date.
   * @param {Date} yearDate A date which occurs in the year of the date provided
   * @returns {Array<Date>} An array of all dates which occur in the year of the date provided
   */
  calculateAllDatesInYear(yearDate) {
    const cacheKey = yearDate.toISOString().slice(0, 4);
    const timer = `calculateAllDatesInYear(${cacheKey})`;
    const timerCached = `${cacheKey}::cached`;
    const timerCalculation = `${cacheKey}::calculation`;
    const getAllDates =() => {
      console.time(timerCalculation);
      const allDates = [];
      let temp = new Date(yearDate.valueOf());
      temp.setMonth(0);
      const first = this.getFirstOfMonth(temp);
      temp.setMonth(11);
      const last = this.getLastOfMonth(temp);
      temp = new Date(first.valueOf());
      while (this.isBeforeDay(temp, last) || this.isSameDay(temp, last)) {
        allDates.push(new Date(temp.valueOf()));
        temp.setDate(temp.getDate() + 1);
      }
      console.timeEnd(timerCalculation);
      return allDates;
    };

    console.time(timer);
    if (this.#allDatesInYearCache.has(cacheKey)) {
      console.time(timerCached);
      const cachedResult = this.#allDatesInYearCache.get(cacheKey);
      console.timeEnd(timerCached);
      console.timeEnd(timer);
      return cachedResult;
    } else {
      const allDates = getAllDates();
      this.#allDatesInYearCache.set(cacheKey, allDates);
      console.timeEnd(timer);
      return allDates;
    }
  }
  /**
   * Determines if all of the given dates are disabled.
   * @param {string} cacheKey The key for the cache to store the result of whether 
   *  all of the given dates are disabled, to avoid having to recalculate it again 
   *  in the future.
   * @param {() => Array<Date>} dates A function that returns an array of dates which should be disabled
   * @returns {boolean} true if all of the given dates are disabled; otherwise, false
   */
  allDatesAreDisabled(cacheKey, dates) {
    if (BasicUtilities.isStringWithContent(cacheKey)) {
      const timerCached = `allDatesAreDisabled::cached(${cacheKey})`;
      const timerCalculation = `allDatesAreDisabled::calculation`;
      if (this.#allDatesAreDisabledCache.has(cacheKey)) {
        console.time(timerCached);
        const cachedResult = this.#allDatesAreDisabledCache.get(cacheKey);
        console.timeEnd(timerCached);
        return cachedResult;
      } else if (typeof dates === 'function') {
        console.time(timerCalculation);
        const calculatedDates = dates();
        if (BasicUtilities.isArrayWithContent(calculatedDates)) {
          cacheKey = calculatedDates?.at(0)?.toISOString()?.slice(0, 7);
          const allDisabled = calculatedDates.every((dt) => this.dateIsDisabled(dt));
          this.#allDatesAreDisabledCache.set(cacheKey, allDisabled);
          console.timeEnd(timerCalculation);
          return allDisabled;
        } else {
          console.timeEnd(timerCalculation);
          throw new Error(`Invalid arguments for allDatesAreDisabled: cacheKey must be a non-empty string and dates must be a function that returns a non-empty array of Date objects. Got cacheKey: ${cacheKey}, dates: ${dates}`);
        }
      }
    } else {
      throw new Error(`Invalid arguments for allDatesAreDisabled: cacheKey must be a non-empty string and dates must be a function that returns a non-empty array of Date objects. Got cacheKey: ${cacheKey}, dates: ${dates}`);
    }
  }
  /**
   * Repopulates the date picker with the current values.
   */
  repopulate() {
    console.time('repopulate');
    this.populateMonths();
    this.populateYears();
    this.populateDates();
    const lastMonth = new Date(this.value.valueOf());
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    let cacheKey = lastMonth.toISOString().slice(0, 7)
    const lastMonthDates = () => this.calculateAllDatesInMonth(lastMonth);
    this.prevMonth.disabled = this.allDatesAreDisabled(cacheKey, lastMonthDates);
    const nextMonth = new Date(this.value.valueOf());
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    cacheKey = nextMonth.toISOString().slice(0, 7)
    const nextMonthDates = () => this.calculateAllDatesInMonth(nextMonth);
    this.nextMonth.disabled = this.allDatesAreDisabled(cacheKey, nextMonthDates);
    console.timeEnd('repopulate');
  }
  /**
   * Handles the "focus" event for the date picker.
   * @param {Event} e The "focus" event which triggers this event handler.
   */
  gotFocus(e) {
    this.value = this.parseDate(this.inputElement.value, this.defaultDate);
    this.repopulate();
    this.formatDate();
    this.pickerElement.classList.toggle('show');
    e.stopPropagation();
  }
  /**
   * Handles the "blur" event for the date picker.
   * @param {Event} e The "blur" event which triggers this event handler.
   */
  lostFocus(e) {
    this.setSelectedValue();
  }
  /**
   * Occurs when something other than the input element or 
   * the picker element gets focus, and hides the picker if it is shown.
   * @param {Event} e The event which triggered this eveny handler.
   */
  somethingElseGotFocus(e) {
    if (
      e &&
      e.target &&
      e.target !== this.inputElement &&
      !e.target.contains(this.inputElement) &&
      e.target !== this.pickerElement &&
      !this.pickerElement.contains(e.target)
    ) {
      this.pickerElement.classList.remove('show');
      e.stopPropagation();
    }
  }
  /**
   * Handles the selection of a date.
   * @param {Event} e The "click" event on the year or month selector or 
   *  on a date in the calendar which triggers this event handler.
   */
  dateSelected(e) {
    this.value = this.parseDate(e.target.dataset.date);
    this.formatDate();
    this.repopulate();
    if (e.target.matches('.year-entry-year')) {
      this.datePickerElement.classList.add('month-entry');
      this.datePickerElement.classList.remove('year-entry');
    }
    if (e.target.matches('.month-entry-month')) {
      this.datePickerElement.classList.add('calendar-entry');
      this.datePickerElement.classList.remove('month-entry');
    }
  }
  /**
   * Handles the selection of a time.
   * @param {Event} e The "click" event on a time entry which triggers this event handler.
   */
  timeSelected(e) {
    this.value = this.parseTime(e.target.dataset.time);
    this.formatTime();
    this.repopulate();
  }
  /**
   * Handles the click event for the "Prev" button.
   * @param {Event} e The "click" event thrown when the "Prev" button is clicked.
   */
  prevClicked(e) {
    // Make sure that keeping the same selected day (e.g., 31st),
    // keeps the desired selected month (e.g., Feb)
    // If not, subtract days until it is in the desired month
    let desiredMonth = this.value.getMonth() - 1;
    const prevDate = new Date(this.value.valueOf());
    if (desiredMonth === -1) {
      prevDate.setFullYear(prevDate.getFullYear() - 1);
      desiredMonth = 11;
    }
    prevDate.setMonth(desiredMonth);
    while (prevDate.getMonth() > desiredMonth) {
      prevDate.setDate(prevDate.getDate() - 1);
    }

    // Make sure that the same selected day in the new month is
    // not disabled. If so, add days until it is on an
    // enabled date.
    while (this.dateIsDisabled(prevDate)) {
      prevDate.setDate(prevDate.getDate() + 1);
    }

    this.value = prevDate;

    this.formatDate();
    this.repopulate();
  }
  /**
   * Handles the click event for the "Next" button.
   * @param {Event} e The "click" event thrown when the "Next" button is clicked.
   */
  nextClicked(e) {
    // Make sure that keeping the same selected day (e.g., 31st),
    // keeps the desired selected month (e.g., Feb)
    // If not, subtract days until it is in the desired month
    let desiredMonth = this.value.getMonth() + 1;
    const nextDate = new Date(this.value.valueOf());
    if (desiredMonth === 12) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      desiredMonth = 0;
    }
    nextDate.setMonth(desiredMonth);
    while (nextDate.getMonth() > desiredMonth) {
      nextDate.setDate(nextDate.getDate() - 1);
    }

    // Make sure that the same selected day in the new month is
    // not disabled. If so, subtract days until it is on an
    // enabled date.
    while (this.dateIsDisabled(nextDate)) {
      nextDate.setDate(nextDate.getDate() - 1);
    }

    this.value = nextDate;
    this.formatDate();
    this.repopulate();
  }
  /**
   * Handles the click event for the month button or the month select.
   * @param {Event} e The "click" event thrown when the month button is clicked 
   *  or when a month is selected in the month select, which triggers this event handler.
   */
  monthSelected(e) {
    this.value.setMonth(+e.target.value);
    this.formatDate();
    this.repopulate();
  }
  /**
   * Handles the click event for the year button or the year select.
   * @param {Event} e = The "click" event thrown when the year button is clicked
   *  or when a year is selected in the year select, which triggers this event handler.
   */
  yearSelected(e) {
    this.value.setFullYear(+e.target.value);
    this.formatDate();
    this.repopulate();
  }
  /**
   * Handles the click event for the month-year selector.
   * @param {Event} e The "click" event thrown when the month-year selector is clicked,
   *  which triggers this event handler.
   */
  monthYearClicked(e) {
    e.preventDefault();
    this.datePickerElement.classList.remove('calendar-entry');
    this.datePickerElement.classList.add('year-entry');
  }
  /**
   * Handles the click event for the cancel button.
   * @param {Event} e The "click" event thrown when the cancel button is clicked, which triggers this event handler.
   */
  cancelClicked(e) {
    this.pickerElement.classList.remove('show');
  }
  /**
   * Handles the click event for the submit button.
   * @param {Event} e The "click" event thrown when the submit button is clicked, which triggers this event handler.
   */
  submitClicked(e) {
    this.setSelectedValue();
    this.pickerElement.classList.remove('show');
  }
  /**
   * Initializes the date time picker by populating the months, years, and dates,
   * and adding event listeners for focus, blur, click, and change events.
   */
  init() {
    console.time('init');
    this.repopulate();
    document.documentElement.addEventListener(
      'click',
      this.somethingElseGotFocus.bind(this)
    );
    this.inputElement.addEventListener('focusin', this.gotFocus.bind(this));
    this.inputElement.addEventListener('focusout', this.lostFocus.bind(this));
    this.pickerElement.addEventListener('click', (e) => {
      if (
        e.target.matches('.calendar-entry-body-date') ||
        e.target.matches('.year-entry-year') ||
        e.target.matches('.month-entry-month')
      ) {
        this.dateSelected(e);
      }
    });
    this.pickerTabsElement.addEventListener('click', (e) => {
      if (e.target.matches('button')) {
        if (e.target.classList.contains('date-picker-tab')) {
          this.pickerElement.classList.remove('time-picker');
          this.pickerElement.classList.add('date-picker');
        }
        if (e.target.classList.contains('time-picker-tab')) {
          this.pickerElement.classList.remove('date-picker');
          this.pickerElement.classList.add('time-picker');
        }
      }
    })
    this.timeZoneElement.addEventListener('change', () => {
      this.setTimeZone(this.timeZoneElement.value);
    });
    this.timeNowElement.addEventListener('click', (e) => {
      this.value = this.getNow();
      this.setSelectedValue();
    })
    this.prevMonth.addEventListener('click', this.prevClicked.bind(this));
    this.nextMonth.addEventListener('click', this.nextClicked.bind(this));
    this.monthSelect.addEventListener('change', this.monthSelected.bind(this));
    this.yearSelect.addEventListener('change', this.yearSelected.bind(this));
    this.monthYearSelector.addEventListener(
      'click',
      this.monthYearClicked.bind(this)
    );
    this.cancelButton.addEventListener('click', this.cancelClicked.bind(this));
    this.okayButton.addEventListener('click', this.submitClicked.bind(this));
    console.timeEnd('init');
  }
}
