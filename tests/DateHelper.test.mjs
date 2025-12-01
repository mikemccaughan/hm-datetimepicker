import DateHelper, { DateComparisonGranularity } from "../DateHelper.mjs";
import { Logger, LogLevel } from "../Logger.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";

await test("DateHelper", async (t) => {
  let dh = new DateHelper("en-US");
  Logger.LogLevel = LogLevel.Trace;
  let date = new Date(Date.UTC(2021, 0, 15, 0, 0, 0, 0));
  let datePlus101y = new Date(Date.UTC(2122, 0, 15, 0, 0, 0, 0));
  let dateWithNegYear = new Date(Date.UTC(-2021, 0, 15, 0, 0, 0, 0));
  let datePlus1y = new Date(Date.UTC(2022, 0, 15, 0, 0, 0, 0));
  let datePlus1y1M = new Date(Date.UTC(2022, 1, 15, 0, 0, 0, 0));
  let datePlus0y0M29d = new Date(Date.UTC(2021, 1, 14, 0, 0, 0, 0));
  let datePlus0y1M1d = new Date(Date.UTC(2021, 1, 16, 0, 0, 0, 0));
  await test("getProbableClientTimeZoneName", async (t) => {
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
  await test("isSame", async (t) => {
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
  await test("formatDate", async (t) => {
    await t.test("formatDate no extras (same as format string 'r')", (t) => {
      assert.strictEqual(dh.formatDate(date), "1/15/21, 12:00 AM");
    });
    await t.test("formatDate iso format", (t) => {
      assert.strictEqual(
        dh.formatDate(date, { format: "iso" }),
        "2021-01-15T00:00:00.000Z"
      );
    });
    await t.test("formatDate en-US, no format, Australia/Sydney", (t) => {
      assert.strictEqual(
        DateHelper.formatDate(date, {
          locale: "en-US",
          format: undefined,
          timeZone: "Australia/Sydney",
        }),
        "1/15/21, 11:00 AM"
      );
    });
    await t.test("formatDate en-US, EEE, MMM d, y, America/New_York", (t) => {
      assert.strictEqual(
        DateHelper.formatDate(date, {
          locale: "en-US",
          format: "EEE, MMM d, y",
          timeZone: "America/New_York",
        }),
        "Fri, Jan 15, 2021"
      );
    });
    await t.test("formatDate ja-JP, y年MM月dd日 (EEE), Asia/Tokyo", (t) => {
      assert.strictEqual(
        DateHelper.formatDate(date, {
          locale: "ja-JP",
          format: "y年MM月dd日 (EEE)",
          timeZone: "Asia/Tokyo",
        }),
        "2021年01月15日  (金)"
      );
    });
    await t.test("formatDate ja-JP-u-ca-japanese, GGGy年MM月dd日, Asia/Tokyo", (t) => {
      assert.strictEqual(
        DateHelper.formatDate(date, {
          locale: "ja-JP-u-ca-japanese",
          format: "GGGy年MM月dd日",
          timeZone: "Asia/Tokyo",
        }),
        "令和3年01月15日"
      );
    });
  });
  await test("parseDate", async (t) => {
    await t.test(
      "令和3年01月15日, ja-JP-u-ca-japanese, GGGy年MM月dd日, Asia/Tokyo",
      (t) => {
        assert.strictEqual(
          DateHelper.parseDate("令和3年01月15日", {
            locale: "ja-JP-u-ca-japanese",
            format: "GGGy年MM月dd日",
            timeZone: "Asia/Tokyo",
          }).toISOString(),
          "2021-01-15T05:00:00.000Z"
        );
      }
    );
  });
});
