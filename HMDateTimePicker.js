import DateHelper from "./DateHelper.mjs";

export class HMDateTimePicker {
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
    this.useYearAndMonthTabs = useYearAndMonthTabs || !useYearAndMonthSelects;
    this.useYearAndMonthSelects =
      useYearAndMonthSelects || !useYearAndMonthTabs;
    if (this.useYearAndMonthSelects && this.useYearAndMonthTabs) {
      this.useYearAndMonthTabs = false;
    }
    if (!this.useYearAndMonthSelects && !this.useYearAndMonthTabs) {
      this.useYearAndMonthSelects = true;
    }
    const dateFormatterOptions = {
      dateStyle: 'long',
    };
    if (useUTC) {
      dateFormatterOptions.timeZone = 'UTC';
    }
    this.dateFormatter = new Intl.DateTimeFormat(
      undefined,
      dateFormatterOptions
    );
    const isoFormatterOptions = {};
    this.isoFormatter = new Intl.DateTimeFormat(undefined, isoFormatterOptions);
    Object.defineProperty(this.isoFormatter, 'format', {
      value: function (date) {
        return date.toISOString().slice(0, 10);
      },
    });
    const monthYearFormatterOptions = {
      month: 'long',
      year: 'numeric',
    };
    this.monthYearFormatter = new Intl.DateTimeFormat(
      undefined,
      monthYearFormatterOptions
    );
    const monthLongFormatterOptions = { month: 'long' };
    this.monthLongFormatter = new Intl.DateTimeFormat(
      undefined,
      monthLongFormatterOptions
    );
    const monthShortFormatterOptions = { month: 'short' };
    this.monthShortFormatter = new Intl.DateTimeFormat(
      undefined,
      monthShortFormatterOptions
    );
    const yearFormatterOptions = { year: 'numeric' };
    this.yearFormatter = new Intl.DateTimeFormat(
      undefined,
      yearFormatterOptions
    );
    const timeFormatterOptions = {
      timeStyle: 'long',
    };
    if (useUTC) {
      timeFormatterOptions.timeZone = 'UTC';
    } else {
      timeFormatterOptions.timeZoneName = 'long';
    }
    this.timeFormatter = new Intl.DateTimeFormat(
      undefined,
      timeFormatterOptions
    );
    if (Array.isArray(format)) {
      this.formats = Array.from(format);
    }
    if (typeof format === 'string') {
      this.formats = [format];
    }
    this.minDate = this.parseDate(minDate, new Date(-8640000000000000));
    this.maxDate = this.parseDate(maxDate, new Date(8640000000000000));
    this.disableDate =
      typeof disableDate === 'function' ? disableDate : (date) => false;

    this.inputElement = document.querySelector(this.inputSelector);
    this.pickerElement = document.querySelector(this.pickerSelector);
    this.pickerTabsElement = document.querySelector(this.pickerTabsSelector);
    if (
      this.inputElement.id &&
      this.inputElement.id.length &&
      (!this.pickerElement.id || this.pickerElement.id.length === 0)
    ) {
      const newId = this.inputElement.id + '-picker';
      let lastId = 0;
      while (document.querySelector(`#${newId}`) !== null) {
        newId = `${this.inputElement.id}-picker-${lastId}`;
        lastId++;
      }
      this.pickerElement.id = newId;
      this.pickerTabsElement.id = `${newId}-tabs`;
    }
    this.pickerElement.classList.toggle('use-tabs', this.useYearAndMonthTabs);
    this.pickerElement.classList.toggle(
      'use-selects',
      this.useYearAndMonthSelects
    );
    const timeZones = Intl.supportedValuesOf('timeZone');
    const probableTimeZone = DateHelper.getProbableClientTimeZoneName([]);
    const possibleTimeZones = DateHelper.getPossibleClientTimeZoneNames();
    this.timeZoneElement = this.pickerElement.querySelector('.date-time-picker-time-zone');
    timeZones.sort((a,b) => a === 'UTC' && b !== 'UTC' 
      ? Number.MIN_SAFE_INTEGER 
      : a === probableTimeZone && b !== probableTimeZone
      ? Number.MIN_SAFE_INTEGER + 1 
      : a !== probableTimeZone && b === probableTimeZone
      ? Number.MAX_SAFE_INTEGER - 1
      : a === probableTimeZone && b === probableTimeZone
      ? 0
      : possibleTimeZones.includes(a) && possibleTimeZones.includes(b)
      ? 0
      : possibleTimeZones.includes(a) && !possibleTimeZones.includes(b)
      ? Number.MIN_SAFE_INTEGER + 2 
      : !possibleTimeZones.includes(a) && possibleTimeZones.includes(b)
      ? Number.MAX_SAFE_INTEGER - 2
      : a.localeCompare(b));
    for (const timeZone of timeZones) {
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
    this.timeNowElement = this.pickerElement.querySelector('.date-time-picker-time-input-now');
    this.monthYearSelector = this.pickerElement.querySelector(
      '.month-year-selector'
    );
    this.datePickerElement = this.pickerElement.querySelector('.date-picker');
    this.pickerInputElement = this.pickerElement.querySelector('.date-utc');
    this.pickerTimeElement = this.pickerElement.querySelector('.time-utc');
    this.monthSelect = this.pickerElement.querySelector('.month-utc');
    this.yearSelect = this.pickerElement.querySelector('.year-utc');
    this.prevMonth = this.pickerElement.querySelector('.month-prev-utc');
    this.nextMonth = this.pickerElement.querySelector('.month-next-utc');
    this.okayButton = this.pickerElement
      .closest('aside')
      .querySelector('button.picker-footer-submit');
    this.cancelButton = this.pickerElement
      .closest('aside')
      .querySelector('button.picker-footer-cancel');
    this.yearEntry = this.pickerElement.querySelector('.year-entry');
    this.monthEntry = this.pickerElement.querySelector('.month-entry');
    this.pickerElement.classList.remove('show');
    this.defaultDate = this.parseDate(defaultDate);
    this.value = this.parseDate(this.inputElement.value, this.defaultDate);
    console.timeEnd('constructor');
  }
  get dateButtons() {
    return this.pickerElement.querySelectorAll(
      'button.calendar-entry-body-date'
    );
  }
  getDate(value) {
    if (typeof value !== 'object' || Number.isNaN(value.valueOf())) {
      return value;
    }
    const returnValue = new Date(value.valueOf());
    returnValue.wasParsed = true;
    return returnValue;
  }
  getNow() {
    const today = new Date();
    return this.getDate(today);
  }
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
        const parsed = DateHelper.parseDate(value.trim(), { locale: [], format: ['yyyy-MM-dd'], timeZone: this.useUTC ? 'UTC' : this.timeZoneElement.value })
        returnValue = this.getDate(parsed);
      }
    }
    returnValue.wasParsed = true;
    return returnValue;
  }
  formatDate() {
    const val = this.value;
    const formatted = this.dateFormatter.format(val);
    this.pickerInputElement.value = formatted;
    const myFormatted = this.monthYearFormatter.format(val);
    this.monthYearSelector.querySelector('.selected').textContent = myFormatted;
    return formatted;
  }
  formatTime() {
    const val = this.value;
    const formattedTime = this.timeFormatter.format(val);
    const tz = formattedTime.slice(formattedTime.lastIndexOf(' '));
    this.pickerElement.querySelector('.date-time-picker-time-zone').value = this.timeFormatter.resolvedOptions().timeZone;
    this.pickerElement.querySelector('.date-time-picker-time-zone-name').textContent = tz.trim();
    this.pickerTimeElement.value = formattedTime.replace(tz, '');
    return formattedTime;
  }
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
  setSelectedValue() {
    const val = this.value;
    const formatted = this.dateFormatter.format(val);
    const formattedTime = this.formatTime();
    this.inputElement.value = `${formatted} ${formattedTime}`;
  }
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
      monthButton.dataset.isToday =
        monthDate.getFullYear() === this.getNow().getFullYear() &&
        monthDate.getMonth() === this.getNow().getMonth();
      monthButton.dataset.isSelected =
        monthDate.getFullYear() === dateDate.getFullYear() &&
        monthDate.getMonth() === dateDate.getMonth();
      monthButton.textContent = buttonText;
      const allDatesInMonth = this.calculateAllDatesInMonth(monthDate);
      monthButton.disabled = this.allDatesAreDisabled(allDatesInMonth);
    }
    console.timeEnd('populateMonths-part2');
    console.timeEnd('populateMonths');
  }
  populateYears() {
    console.time('populateYears');
    console.time('populateYears-part1');
    const dateDate = this.getDate(this.value);
    const yearDate = this.getDate(this.value);
    const yearSelected = yearDate.getFullYear();
    const yearCurrent = this.getNow().getFullYear();
    for (let i = this.yearSelect.length - 1; i >= 0; i--) {
      this.yearSelect.remove(i);
    }
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
      const allDatesInYear = this.calculateAllDatesInYear(yearDate);
      yearButton.disabled = this.allDatesAreDisabled(allDatesInYear);
    }
    console.timeEnd('populateYears-part2');
    console.timeEnd('populateYears');
  }
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
  isSameDay(a, b) {
    return DateHelper.isSameDay(a, b);
  }
  isBeforeDay(a, b) {
    return DateHelper.isBeforeDay(a, b);
  }
  isAfterDay(a, b) {
    return DateHelper.isAfterDay(a, b);
  }
  dateIsDisabled(date) {
    return (
      this.disableDate(date) ||
      this.isBeforeDay(date, this.minDate) ||
      this.isSameDay(date, this.maxDate) ||
      this.isAfterDay(date, this.maxDate)
    );
  }
  clearDataset(el) {
    if (!el || !el.dataset) {
      throw new Error(
        `Argument must be an HTMLOrForeignElement that has a dataset property, got ${typeof el}`
      );
    }
    for (let key in el.dataset) {
      delete el.dataset[key];
    }
  }
  populateDates() {
    const dateDate = new Date(this.value);
    const startDate = this.getFirstSunday(dateDate);
    const calendarElement = this.pickerElement.querySelector(
      '.calendar-entry-body'
    );
    for (let i = 0; i < 42; i++) {
      if (!this.dateButtons || this.dateButtons.length <= i) {
        let newDateButton = document.createElement('button');
        newDateButton.setAttribute('type', 'button');
        newDateButton.classList.add('calendar-entry-body-date');
        calendarElement.appendChild(newDateButton);
        newDateButton = null;
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
      button.textContent = buttonDate.getDate();
      button.disabled = this.dateIsDisabled(buttonDate);
    }
  }
  calculateAllDatesInMonth(monthDate) {
    console.time(`calculateAllDatesInMonth(${monthDate.toISOString()})`);
    const allDates = [];
    const first = this.getFirstOfMonth(monthDate);
    const last = this.getLastOfMonth(monthDate);
    const temp = new Date(first.valueOf());
    while (temp.valueOf() <= last.valueOf()) {
      allDates.push(new Date(temp.valueOf()));
      temp.setDate(temp.getDate() + 1);
    }
    console.timeEnd(`calculateAllDatesInMonth(${monthDate.toISOString()})`);
    return allDates;
  }
  calculateAllDatesInYear(yearDate) {
    console.time(`calculateAllDatesInYear(${yearDate.toISOString()})`);
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
    console.timeEnd(`calculateAllDatesInYear(${yearDate.toISOString()})`);
    return allDates;
  }
  allDatesAreDisabled(dates) {
    console.time(`allDatesAreDisabled (${dates.length} dates)`);
    const allDatesDisabled = dates.every((dt) => this.dateIsDisabled(dt));
    console.timeEnd(`allDatesAreDisabled (${dates.length} dates)`);
    return allDatesDisabled;
  }
  repopulate() {
    console.time('repopulate');
    this.populateMonths();
    this.populateYears();
    this.populateDates();
    const lastMonth = new Date(this.value.valueOf());
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthDates = this.calculateAllDatesInMonth(lastMonth);
    this.prevMonth.disabled = this.allDatesAreDisabled(lastMonthDates);
    const nextMonth = new Date(this.value.valueOf());
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthDates = this.calculateAllDatesInMonth(nextMonth);
    this.nextMonth.disabled = this.allDatesAreDisabled(nextMonthDates);
    console.timeEnd('repopulate');
  }
  gotFocus(e) {
    this.value = this.parseDate(this.inputElement.value, this.defaultDate);
    this.repopulate();
    this.formatDate();
    this.pickerElement.classList.toggle('show');
    e.stopPropagation();
    e.cancelBubble = true;
  }
  lostFocus(e) {
    this.setSelectedValue();
  }
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
  timeSelected(e) {
    this.value = this.parseTime(e.target.dataset.time);
    this.formatTime();
    this.repopulate();
  }
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
  monthSelected(e) {
    this.value.setMonth(+e.target.value);
    this.formatDate();
    this.repopulate();
  }
  yearSelected(e) {
    this.value.setFullYear(+e.target.value);
    this.formatDate();
    this.repopulate();
  }
  monthYearClicked(e) {
    e.preventDefault();
    this.datePickerElement.classList.remove('calendar-entry');
    this.datePickerElement.classList.add('year-entry');
  }
  cancelClicked(e) {
    this.pickerElement.classList.remove('show');
  }
  submitClicked(e) {
    this.setSelectedValue();
    this.pickerElement.classList.remove('show');
  }
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
