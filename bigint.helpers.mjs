export default class BigIntHelpers {
  /**
   * Returns the absolute value of the `value`, as a bigint.
   * @param {bigint} value The bigint value to get the absolute value of
   * @returns {bigint} The absolute value of the `value`, as a bigint.
   */
  static abs(value) {
    return value < 0n ? value * -1n : value;
  }
}
