import DateHelper, { DateComparisonGranularity } from "../DateHelper.mjs";
import { Logger, LogLevel } from "../Logger.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";

test("DateHelper", async (t) => {
  let dh = new DateHelper("en-US");
  Logger.LogLevel = LogLevel.Trace;
  let date = new Date(Date.UTC(2021, 0, 15, 0, 0, 0, 0));
  let datePlus101y = new Date(Date.UTC(2122, 0, 15, 0, 0, 0, 0));
  let dateWithNegYear = new Date(Date.UTC(-2021, 0, 15, 0, 0, 0, 0));
  let datePlus1y = new Date(Date.UTC(2022, 0, 15, 0, 0, 0, 0));
  let datePlus1y1M = new Date(Date.UTC(2022, 1, 15, 0, 0, 0, 0));
  let datePlus0y0M29d = new Date(Date.UTC(2021, 1, 14, 0, 0, 0, 0));
  let datePlus0y1M1d = new Date(Date.UTC(2021, 1, 16, 0, 0, 0, 0));
  test("getProbableClientTimeZoneName", async (t) => {
    await t.test(
      `Couldn't get the time zone name from resolvedOptions() or something`,
      (t) => {
        assert.strictEqual(
          new Intl.DateTimeFormat([]).resolvedOptions().timeZone,
          DateHelper.getProbableClientTimeZoneName()
        );
      }
    );
  });
  test("isSame", async (t) => {
    await t.test(
      `"${date.toLocaleString([], {
        era: "short",
      })}" should be the same as "${datePlus101y.toLocaleString([], {
        era: "short",
      })}" at era granularity`,
      (t) => {
        assert.strictEqual(
          true,
          DateHelper.isSame(date, datePlus101y, DateComparisonGranularity.Era)
        );
      }
    );
    await t.test(
      `"${date.toLocaleString([], {
        era: "short",
      })}" should not be the same as "${dateWithNegYear.toLocaleString([], {
        era: "short",
      })}" at era granularity`,
      (t) => {
        assert.strictEqual(
          false,
          DateHelper.isSame(
            date,
            dateWithNegYear,
            DateComparisonGranularity.Era
          )
        );
      }
    );
    await t.test(
      `"${date.toISOString()}" should be the same as "${datePlus1y.toISOString()}" at Year granularity`,
      (t) => {
        assert.strictEqual(
          true,
          DateHelper.isSame(date, datePlus1y, DateComparisonGranularity.Year)
        );
      }
    );
    await t.test(
      `"${date.toISOString()}" should not be the same as "${datePlus1y1M.toISOString()}" at Year granularity`,
      (t) => {
        assert.strictEqual(
          false,
          DateHelper.isSame(date, datePlus1y1M, DateComparisonGranularity.Year)
        );
      }
    );
    await t.test(
      `"${date.toISOString()}" should be the same as "${datePlus0y0M29d.toISOString()}" at Month granularity`,
      (t) => {
        assert.strictEqual(
          true,
          DateHelper.isSame(
            date,
            datePlus0y0M29d,
            DateComparisonGranularity.Month
          )
        );
      }
    );
    await t.test(
      `"${date.toISOString()}" should not be the same as "${datePlus0y1M1d.toISOString()}" at Month granularity`,
      (t) => {
        assert.strictEqual(
          false,
          DateHelper.isSame(
            date,
            datePlus0y1M1d,
            DateComparisonGranularity.Month
          )
        );
      }
    );
  });
  test("formatDate", async (t) => {
    await t.test("formatDate no extras (same as format string 'r')", (t) => {
      assert.strictEqual("1/15/21, 12:00 AM", dh.formatDate(date));
    });
    await t.test("formatDate iso format", (t) => {
      assert.strictEqual(
        "2021-01-15T00:00:00.000Z",
        dh.formatDate(date, { format: "iso" })
      );
    });
    await t.test("formatDate en-US, no format, Australia/Sydney", (t) => {
      assert.strictEqual(
        "1/15/21, 11:00 AM",
        DateHelper.formatDate(date, {
          locale: "en-US",
          format: undefined,
          timeZone: "Australia/Sydney",
        })
      );
    });
    await t.test("formatDate en-US, EEE, MMM d, y, America/New_York", (t) => {
      assert.strictEqual(
        "Thu, Jan 14, 2021",
        DateHelper.formatDate(date, {
          locale: "en-US",
          format: "EEE, MMM d, y",
          timeZone: "America/New_York",
        })
      );
    });
    await t.test("formatDate ja-JP, y???MM???dd??? (EEE), Asia/Tokyo", (t) => {
      assert.strictEqual(
        "2021???01???15???  (???)",
        DateHelper.formatDate(date, {
          locale: "ja-JP",
          format: "y???MM???dd??? (EEE)",
          timeZone: "Asia/Tokyo",
        })
      );
    });
    await t.test("formatDate ja-JP-u-ca-japanese, GGGy???MM???dd???, Asia/Tokyo", (t) => {
      assert.strictEqual(
        "??????3???01???15???",
        DateHelper.formatDate(date, {
          locale: "ja-JP-u-ca-japanese",
          format: "GGGy???MM???dd???",
          timeZone: "Asia/Tokyo",
        })
      );
    });
  });
  test("parseDate", async (t) => {
    await t.test(
      "??????3???01???15???, ja-JP-u-ca-japanese, GGGy???MM???dd???, Asia/Tokyo",
      (t) => {
        assert.strictEqual(
          "2021-01-15T05:00:00.000Z",
          DateHelper.parseDate("??????3???01???15???", {
            locale: "ja-JP-u-ca-japanese",
            format: "GGGy???MM???dd???",
            timeZone: "Asia/Tokyo",
          }).toISOString()
        );
      }
    );
  });
});
