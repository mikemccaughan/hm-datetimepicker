import test from 'node:test';
import assert from 'node:assert/strict';
import {validateOptions} from '../fn-date-time/parser.mjs';

test('validateOptions', async (t) => {
    await t.test('returns default options', (t) => {
        const defaults = validateOptions();
        assert.strictEqual(defaults.calendar, "gregory");
        assert.strictEqual(defaults.dateStyle, undefined);
        assert.strictEqual(defaults.day, "numeric");
        assert.strictEqual(defaults.dayPeriod, undefined);
        assert.strictEqual(defaults.era, undefined);
        assert.strictEqual(defaults.formatMatcher, "best fit");
        assert.strictEqual(defaults.formats, undefined);
        assert.strictEqual(defaults.fractionalSecondDigits, 0);
        assert.strictEqual(defaults.hour, undefined);
        assert.strictEqual(defaults.hour12, false);
        assert.strictEqual(defaults.hourCycle, "h23");
        assert.strictEqual(defaults.localeMatcher, "best fit");
        assert.strictEqual(defaults.locales.length, 1);
        assert.strictEqual(defaults.locales[0], "en-US");
        assert.strictEqual(defaults.minute, undefined);
        assert.strictEqual(defaults.month, "numeric");
        assert.strictEqual(defaults.numberingSystem, "latn");
        assert.strictEqual(defaults.second, undefined);
        assert.strictEqual(defaults.timeStyle, undefined);
        assert.strictEqual(defaults.timeZone, "America/New_York");
        assert.strictEqual(defaults.timeZoneName, undefined);
        assert.strictEqual(defaults.weekday, undefined);
        assert.strictEqual(defaults.year, "numeric");
    });
});