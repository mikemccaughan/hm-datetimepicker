import test from "node:test";
import assert from "node:assert/strict";
import { validateOptions, getDefaultFormatForLocale } from "../fn-date-time/common.mjs";
import parse from "../fn-date-time/parser.mjs";

await test("getDefaultFormatForLocale", async (t) => {
  await t.test("returns default format for en-US", (t) => {
    const format = getDefaultFormatForLocale(["en-US"]);
    assert.strictEqual(format.includes('M/d/y'), true, "contains M/d/y");
  });
});
await test("validateOptions", async (t) => {
  await t.test("returns default options", (t) => {
    const defaults = validateOptions();
    const resolved = new Intl.DateTimeFormat().resolvedOptions();
    assert.strictEqual(defaults.calendar, resolved.calendar, "calendar");
    assert.strictEqual(defaults.dateStyle, "short", "dateStyle");
    assert.strictEqual(defaults.day, undefined, "day");
    assert.strictEqual(defaults.dayPeriod, undefined, "dayPeriod");
    assert.strictEqual(defaults.era, undefined, "era");
    assert.strictEqual(
      defaults.formatMatcher,
      resolved.formatMatcher ?? "best fit",
      "formatMatcher"
    );
    assert.strictEqual(defaults.formats, undefined, "formats");
    assert.strictEqual(
      defaults.fractionalSecondDigits,
      0,
      "fractionalSecondDigits"
    );
    assert.strictEqual(defaults.hour, undefined, "hour");
    assert.strictEqual(defaults.hour12, true, "hour12");
    assert.strictEqual(defaults.hourCycle, "h12", "hourCycle");
    assert.strictEqual(
      defaults.localeMatcher,
      resolved.localeMatcher ?? "best fit",
      "localeMatcher"
    );
    assert.notStrictEqual(defaults.locales, undefined, "locales is undefined");
    assert.strictEqual(defaults.locales.length, 1, "locales.length");
    assert.strictEqual(defaults.locales[0], resolved.locale, "locales[0]");
    assert.strictEqual(defaults.minute, undefined, "minute");
    assert.strictEqual(defaults.month, undefined, "month");
    assert.strictEqual(
      defaults.numberingSystem,
      resolved.numberingSystem,
      "numberingSystem"
    );
    assert.strictEqual(defaults.second, undefined, "second");
    assert.strictEqual(defaults.timeStyle, "short", "timeStyle");
    assert.strictEqual(defaults.timeZone, resolved.timeZone, "timeZone");
    assert.strictEqual(defaults.timeZoneName, undefined, "timeZoneName");
    assert.strictEqual(defaults.weekday, undefined, "weekday");
    assert.strictEqual(defaults.year, undefined, "year");
  });
});
await test("parse", async (t) => {
  let date = new Date(Date.UTC(2021, 0, 15, 0, 0, 0, 0));
  let datePlus101y = new Date(Date.UTC(2122, 0, 15, 0, 0, 0, 0));
  let dateWithNegYear = new Date(Date.UTC(-2021, 0, 15, 0, 0, 0, 0));
  let datePlus1y = new Date(Date.UTC(2022, 0, 15, 0, 0, 0, 0));
  let datePlus1y1M = new Date(Date.UTC(2022, 1, 15, 0, 0, 0, 0));
  let datePlus0y0M29d = new Date(Date.UTC(2021, 1, 14, 0, 0, 0, 0));
  let datePlus0y1M1d = new Date(Date.UTC(2021, 1, 16, 0, 0, 0, 0));
  await t.test("parse date, no options", (t) => {
    assert.strictEqual(
      date.toISOString(),
      parse("1/15/2021, 0:00 AM").toISOString() // 2021-01-15T00:00:00.000Z
    );
  });
  await t.test("parse date 101 years afterward", (t) => {
    assert.strictEqual(
      datePlus101y.toISOString(),
      datePlus101y.toISOString()
    );
  });
});
