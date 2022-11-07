import { test } from "node:test";
import assert from "node:assert/strict";
import BasicUtilities, {
  DeepEqualityArgs,
  NumberComparisonGranularity,
} from "../BasicUtilities.mjs";
import { DateComparisonGranularity } from "../DateHelper.mjs";

test("BasicUtilities", async (t) => {
  const fn = () => {};
  test("areTheSame", async (t) => {
    await t.test("1 and 1 are the same", (t) => {
      assert.strictEqual(true, BasicUtilities.areTheSame(1, 1));
    });
    await t.test("1 and 2 are not the same", (t) => {
      assert.strictEqual(false, BasicUtilities.areTheSame(1, 2));
    });
    await t.test("a and a are the same", (t) => {
      assert.strictEqual(true, BasicUtilities.areTheSame("a", "a"));
    });
    await t.test("a and b are not the same", (t) => {
      assert.strictEqual(false, BasicUtilities.areTheSame("a", "b"));
    });
    await t.test("1n and 1n (bigints) are the same", (t) => {
      assert.strictEqual(true, BasicUtilities.areTheSame(1n, 1n));
    });
    await t.test("1n and 2n (bigints) are not the same", (t) => {
      assert.strictEqual(false, BasicUtilities.areTheSame(1n, 2n));
    });
    await t.test("true and true are the same", (t) => {
      assert.strictEqual(true, BasicUtilities.areTheSame(true, true));
    });
    await t.test("true and false are not the same", (t) => {
      assert.strictEqual(false, BasicUtilities.areTheSame(true, false));
    });
    await t.test(
      "fn and fn (references to the same function) are the same",
      (t) => {
        assert.strictEqual(true, BasicUtilities.areTheSame(fn, fn));
      }
    );
    await t.test(
      "fn and an anonymous function that does the smae thing are not the same",
      (t) => {
        assert.strictEqual(
          false,
          BasicUtilities.areTheSame(fn, () => {})
        );
      }
    );
    await t.test("different objects are not the same", (t) => {
      assert.strictEqual(
        false,
        BasicUtilities.areTheSame(
          { a: "a", one: 1, c: new Date(1234, 1, 2, 0, 0, 0, 0) },
          { b: "b", two: 2, d: new Date(4321, 3, 4, 0, 0, 0, 0) }
        )
      );
    });
    await t.test(
      "different objects with the same properties are the same if deep is true",
      (t) => {
        assert.strictEqual(
          true,
          BasicUtilities.areTheSame(
            { a: "a", one: 1, c: new Date(1234, 1, 2, 0, 0, 0, 0) },
            { a: "a", one: 1, c: new Date(1234, 1, 2, 0, 0, 0, 0) },
            true
          )
        );
      }
    );
    await t.test(
      "different objects with the same nested object properties are not the same if deep is false",
      (t) => {
        assert.strictEqual(
          false,
          BasicUtilities.areTheSame(
            {
              a: "a",
              one: 1,
              c: { a: "a", one: 1, c: new Date(1234, 1, 2, 0, 0, 0, 0) },
            },
            {
              a: "a",
              one: 1,
              c: { a: "a", one: 1, c: new Date(1234, 1, 2, 0, 0, 0, 0) },
            }
          )
        );
      }
    );
    await t.test("Two date objects with the same value are the same", (t) => {
      assert.strictEqual(
        true,
        BasicUtilities.areTheSame(
          new Date(2021, 8, 21, 0, 0, 0, 0),
          new Date(2021, 8, 21, 0, 0, 0, 0)
        )
      );
    });
    await t.test(
      "Two date objects with different values are not the same",
      (t) => {
        assert.strictEqual(
          false,
          BasicUtilities.areTheSame(
            new Date(2021, 8, 21, 0, 0, 0, 0),
            new Date(2021, 9, 21, 0, 0, 0, 0)
          )
        );
      }
    );
    await t.test("arrays with different values are not the same", (t) => {
      assert.strictEqual(
        false,
        BasicUtilities.areTheSame(
          ["a", 1, new Date(1234, 1, 2, 0, 0, 0, 0)],
          ["b", 2, new Date(4321, 3, 4, 0, 0, 0, 0)]
        )
      );
    });
    await t.test("arrays with same values are the same", (t) => {
      assert.strictEqual(
        true,
        BasicUtilities.areTheSame(
          ["a", 1, new Date(1234, 1, 2, 0, 0, 0, 0)],
          ["a", 1, new Date(1234, 1, 2, 0, 0, 0, 0)]
        )
      );
    });
    await t.test(
      "arrays with nested objects with the same values are NOT the same, when deep is false",
      (t) => {
        assert.strictEqual(
          false,
          BasicUtilities.areTheSame(
            [
              "a",
              1,
              {
                a: "a",
                one: 1,
                c: { a: "a", one: 1, d: new Date(1234, 1, 2, 0, 0, 0, 0) },
              },
            ],
            [
              "a",
              1,
              {
                a: "a",
                one: 1,
                c: { a: "a", one: 1, d: new Date(1234, 1, 2, 0, 0, 0, 0) },
              },
            ]
          )
        );
      }
    );
    await t.test(
      "arrays with nested objects with the same values are the same, when deep is true",
      (t) => {
        assert.strictEqual(
          true,
          BasicUtilities.areTheSame(
            [
              "a",
              1,
              {
                a: "a",
                one: 1,
                c: { a: "a", one: 1, d: new Date(1234, 1, 2, 0, 0, 0, 0) },
              },
            ],
            [
              "a",
              1,
              {
                a: "a",
                one: 1,
                c: { a: "a", one: 1, d: new Date(1234, 1, 2, 0, 0, 0, 0) },
              },
            ],
            true
          )
        );
      }
    );
  });
  test("deepEquals", async (t) => {
    await t.test(
      "validatePropertyOrder causes deepEquals to return false when two objects share the same values but in different order",
      (t) => {
        assert.strictEqual(
          false,
          BasicUtilities.deepEquals(
            {
              a: "a",
              one: 1,
              c: new Date(1234, 1, 2, 0, 0, 0, 0),
            },
            {
              c: new Date(1234, 1, 2, 0, 0, 0, 0),
              one: 1,
              a: "a",
            },
            {
              validatePropertyOrder: true,
            }
          )
        );
      }
    );
    await t.test(
      "validateElementOrder causes deepEquals to return false when two arrays share the same elements but in different order, in nested properties",
      (t) => {
        assert.strictEqual(
          false,
          BasicUtilities.deepEquals(
            {
              a: ["a", 1, new Date(1234, 1, 2, 0, 0, 0, 0)],
              b: 3,
            },
            {
              a: [new Date(1234, 1, 2, 0, 0, 0, 0), 1, "a"],
              b: 3,
            },
            {
              validateElementOrder: true,
            }
          )
        );
      }
    );
    test("NumberComparisonGranularity", async (t) => {
        async function testDeepEquals(t, a, b, deepArgs, expected, text) {
            await t.test(text, (t) => {
              assert.strictEqual(expected, BasicUtilities.deepEquals(a, b, deepArgs));
            });
          }
          let a = 1;
          let b = 1.01;
          let args = {
            numberGranularity: NumberComparisonGranularity.Hundredths,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            true,
            "NumberComparisonGranularity.Hundredths allows a difference of 0.01 between the two values"
          );
          a = 1;
          b = 1.011;
          args = {
            numberGranularity: NumberComparisonGranularity.Hundredths,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            false,
            "NumberComparisonGranularity.Hundredths does not allow a difference of > 0.01 between the two values"
          );
          a = 1;
          b = 1 + Number.EPSILON;
          args = {
            numberGranularity: NumberComparisonGranularity.Default,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            true,
            "NumberComparisonGranularity.Default allows a difference of Number.EPSILON between the two values"
          );
          a = 1;
          b = 1 + 2 * Number.EPSILON;
          args = {
            numberGranularity: NumberComparisonGranularity.Default,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            false,
            "NumberComparisonGranularity.Default does not allow a difference of > Number.EPSILON between the two values"
          );
          a = 1;
          b = 101;
          args = {
            numberGranularity: NumberComparisonGranularity.Hundreds,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            true,
            "NumberComparisonGranularity.Hundreds allows a difference of 100 between the two values"
          );
          a = 1;
          b = 101.1;
          args = {
            numberGranularity: NumberComparisonGranularity.Hundreds,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            false,
            "NumberComparisonGranularity.Hundreds does not allow a difference of > 100 between the two values"
          );
          a = 1;
          b = 2;
          args = {
            numberGranularity: NumberComparisonGranularity.Integer,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            true,
            "NumberComparisonGranularity.Integer allows a difference of 1 between the two values"
          );
          a = 1;
          b = 2.1;
          args = {
            numberGranularity: NumberComparisonGranularity.Integer,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            false,
            "NumberComparisonGranularity.Integer does not allow a difference of > 1 between the two values"
          );
          a = 1;
          b = 11;
          args = {
            numberGranularity: NumberComparisonGranularity.Tens,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            true,
            "NumberComparisonGranularity.Tens allows a difference of 10 between the two values"
          );
          a = 1;
          b = 11.1;
          args = {
            numberGranularity: NumberComparisonGranularity.Tens,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            false,
            "NumberComparisonGranularity.Tens does not allow a difference of > 10 between the two values"
          );
          a = 1;
          b = 1.1;
          args = {
            numberGranularity: NumberComparisonGranularity.Tenths,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            true,
            "NumberComparisonGranularity.Tenths allows a difference of 0.1 between the two values"
          );
          a = 1;
          b = 1.11;
          args = {
            numberGranularity: NumberComparisonGranularity.Tenths,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            false,
            "NumberComparisonGranularity.Tenths does not allow a difference of > 0.1 between the two values"
          );
          a = 1;
          b = 1001;
          args = {
            numberGranularity: NumberComparisonGranularity.Thousands,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            true,
            "NumberComparisonGranularity.Thousands allows a difference of 1000 between the two values"
          );
          a = 1;
          b = 1001.1;
          args = {
            numberGranularity: NumberComparisonGranularity.Thousands,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            false,
            "NumberComparisonGranularity.Thousands does not allow a difference of > 1000 between the two values"
          );
          a = 1;
          b = 1.001;
          args = {
            numberGranularity: NumberComparisonGranularity.Thousandths,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            true,
            "NumberComparisonGranularity.Thousanths allows a difference of 0.001 between the two values"
          );
          a = 1;
          b = 1.0011;
          args = {
            numberGranularity: NumberComparisonGranularity.Thousandths,
          };
          await testDeepEquals(
            t,
            a,
            b,
            args,
            false,
            "NumberComparisonGranularity.Thousanths does not allow a difference of > 0.001 between the two values"
          );      
    });
  });
  test("diffDates", (t) => {
    async function testDiffDates(
      t,
      a,
      b,
      granularity,
      custom,
      amount,
      unit,
      text
    ) {
      await t.test(
        `${text}: ("${a.toISOString()}", "${b.toISOString()}")`,
        (t) => {
          assert.deepEqual(
            { amount, unit },
            BasicUtilities.diffDates(a, b, granularity, custom)
          );
        }
      );
    }
    let a = new Date(2021, 6, 15, 0, 0, 0, 0);
    let b = new Date(2022, 6, 15, 0, 0, 0, 0);
    testDiffDates(
      a,
      b,
      undefined,
      undefined,
      BasicUtilities.msPerYear,
      DateComparisonGranularity.Millisecond,
      "default is the same as DateComparisonGranularity.Millisecond returns the number of milliseconds between two dates"
    );
    a = new Date(2021, 6, 15, 0, 0, 0, 0);
    b = new Date(2022, 6, 15, 0, 0, 0, 0);
    testDiffDates(
      a,
      b,
      DateComparisonGranularity.Second,
      undefined,
      BasicUtilities.msPerYear / BasicUtilities.msPerSecond,
      DateComparisonGranularity.Second,
      "DateComparisonGranularity.Second returns the number of seconds between two dates"
    );
    testDiffDates(
      a,
      b,
      DateComparisonGranularity.Year,
      undefined,
      1,
      DateComparisonGranularity.Year,
      "DateComparisonGranularity.Year returns the number of years between two dates"
    );
    a = new Date(2020, 0, 1, 0, 0, 0, 0);
    b = new Date(2022, 0, 1, 0, 0, 0, 0);
    testDiffDates(
      a,
      b,
      DateComparisonGranularity.Year,
      undefined,
      2,
      DateComparisonGranularity.Year,
      `DateComparisonGranularity.Year returns the number of years between two dates, for leap years`
    );
    a = new Date(2021, 6, 1, 12, 30, 30, 50);
    b = new Date(2022, 0, 1, 0, 0, 0, 0);
    testDiffDates(
      a,
      b,
      DateComparisonGranularity.Year,
      undefined,
      0.5027958507737189,
      DateComparisonGranularity.Year,
      "DateComparisonGranularity.Year returns the number of partial years between two dates"
    );
    a = new Date(2021, 0, 1, 0, 0, 0, 0);
    b = new Date(2021, 6, 1, 0, 0, 0, 0);
    testDiffDates(
      a,
      b,
      DateComparisonGranularity.Month,
      undefined,
      6,
      DateComparisonGranularity.Month,
      "DateComparisonGranularity.Month returns the number of months between two dates"
    );
    a = new Date(2021, 1, 1, 0, 0, 0, 0);
    b = new Date(2021, 1, 15, 0, 0, 0, 0);
    testDiffDates(
      a,
      b,
      DateComparisonGranularity.Month,
      undefined,
      0.5,
      DateComparisonGranularity.Month,
      "DateComparisonGranularity.Month returns the partial number of months between two dates"
    );
    a = new Date(2021, 0, 1, 0, 0, 0, 0);
    b = new Date(2021, 6, 1, 0, 0, 0, 0);
    testDiffDates(
      a,
      b,
      DateComparisonGranularity.Quarter,
      undefined,
      2,
      DateComparisonGranularity.Quarter,
      "DateComparisonGranularity.Quarter returns the number of months between two dates divided by three"
    );
    a = new Date(2021, 6, 1, 0, 0, 0, 0);
    b = new Date(2021, 0, 1, 0, 0, 0, 0);
    testDiffDates(
      a,
      b,
      DateComparisonGranularity.Custom,
      (a, b) => ({
        amount:
          Math.abs(a.valueOf() - b.valueOf()) /
          (BasicUtilities.msPerDay * 30),
        unit: "thrity-month",
      }),
      6.031944444444444,
      "thrity-month",
      "DateComparisonGranularity.Custom returns the number of periods of thrity days between two dates"
    );
  });
  test("parseBoolean", async (t) => {
    await t.test('"True" is true', (t) => {
        assert.strictEqual(true, BasicUtilities.parseBoolean('True'));
    });
    await t.test('"No" is false', (t) => {
        assert.strictEqual(false, BasicUtilities.parseBoolean('No'));
    });
    await t.test('"Sure" is false', (t) => {
        assert.strictEqual(false, BasicUtilities.parseBoolean('Sure'));
    });
    await t.test('"y" is true', (t) => {
        assert.strictEqual(true, BasicUtilities.parseBoolean('y'));
    });
    await t.test('"YES" is true', (t) => {
        assert.strictEqual(true, BasicUtilities.parseBoolean('YES'));
    });
    await t.test('"1" is true', (t) => {
        assert.strictEqual(true, BasicUtilities.parseBoolean('1'));
    });
    await t.test('1 is true', (t) => {
        assert.strictEqual(true, BasicUtilities.parseBoolean(1));
    });
    await t.test('0 is false', (t) => {
        assert.strictEqual(false, BasicUtilities.parseBoolean(0));
    });
    await t.test('{a: false} is true', (t) => {
        assert.strictEqual(true, BasicUtilities.parseBoolean({a: false}));
    });
    await t.test('undefined is false', (t) => {
        assert.strictEqual(false, BasicUtilities.parseBoolean(undefined));
    });
    await t.test('null is false', (t) => {
        assert.strictEqual(false, BasicUtilities.parseBoolean(null));
    });
  });
});
