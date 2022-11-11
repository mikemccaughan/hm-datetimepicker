# hm-datetimepicker
Experiments in utilities for Dates and Web Components

ESM-based modules for the following classes:

* [Cache, CacheManager, CacheExpiration, CacheExpirationType](./Cache.mjs) - Provides a mechanism for an in-memory cache.
* [DateHelper, DateComparisonGranularity](./DateHelper.mjs) - Provides mechanisms for parsing and formatting JavaScript Date objects as well as comparison and equality.
* [HMDateTimePicker](./HMDateTimePicker.js) - A non-WebComponent implementation of a date picker.
* [HMDateTimePicker](./HMDateTimePickerComponent.mjs) - A WebComponent implementation of a date picker.
* [RelativeDateParser](./RelativeDateParser.mjs) - Provides mechanisms for parsing relative dates (e.g., tomorrow, -188y, +3w)
* [TimeSpan](./TimeSpan.mjs) - Represents a time duration (inspired by .NET's structure of the same name) ([Testing](./timespan.html))
* [TokenList](./TokenList.mjs) - An implementation of [the DOMTokenList interface](https://dom.spec.whatwg.org/#interface-domtokenlist)
* [BasicUtilities, NumberComparisonGranularity, DeepEqualityArgs](./BasicUtilities.mjs) - Provides utility functions like `areTheSame`, `deepEqualsArrays`, `deepEquals`, `firstCapital`, `titleCase`, and `parseBoolean`.
* [Logger](./Logger.mjs) - Basic interceptor for console.log/trace/info/warn/error that allows for setting a LogLevel such that logs "below" a certain threshold are not written to the console.

More ideas:
* [Unicode Date Field Symbol Table](https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table) - maybe for use in format strings?
* [ECMA402 Issue regarding formatting](https://github.com/tc39/ecma402/issues/703) - good hints for internationalization
