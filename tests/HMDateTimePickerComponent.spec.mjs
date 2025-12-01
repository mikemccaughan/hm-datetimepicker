import { LogLevel, DateCache, HMDateTimePicker } from '../HMDateTimePickerComponent.mjs';
import { Assert } from './DescribeAssert.mjs';

function runTests() {
    try {
        const dtp = new HMDateTimePicker(LogLevel.Error);
        dtp.init();
        Assert.isEqual(DateCache.allDatesInYear.length, 365);
        console.log('All tests passed. Exiting.');
    } catch (e) {
      console.error(e);
      console.error(`At least one test failed. Exiting.`);
    }
  }
  runTests();
  