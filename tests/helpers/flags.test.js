const { validateFlag, validateFlags } = require("../../src/helpers/flags");

const flag = {
  name: "flag_name",
  scope: "guild"
}

const flagWithData = {
  name: "flag_name",
  scope: "guild",
  type: "amount",
  data: {
    amount: 1
  }
}

describe('validateFlag', () => {
  it('should return false when keys are not the right type', () => {
    expect(validateFlag({
      ...flag,
      name: 1
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      scope: 1
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      scope: ""
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      name: ""
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      name: {}
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      scope: {}
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      type: "a"
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      type: 1
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      type: ""
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      data: 1
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      data: []
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      data: "a"
    })).toBe(false)
  })

  it('should return false when scope is incorrect', () => {
    expect(validateFlag({
      ...flag,
      scope: "a"
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      scope: " guild"
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      scope: "guild "
    })).toBe(false)

    expect(validateFlag({
      name: "abc"
    })).toBe(false)
  });

  it('should return false when type or data is incorrect', () => {
    expect(validateFlag({
      ...flagWithData,
      type: "a",
      data: { a: 1 }
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      type: "a"
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      type: "amount"
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      data: { amount: 1}
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      data: { amount: "a" }
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      type: "time",
      data: { amount: 1 }
    })).toBe(false)
  });

  it('should return false when extra keys are present', () => {
    expect(validateFlag({
      ...flag,
      hello: "world"
    })).toBe(false)

    expect(validateFlag({
      ...flag,
      _hello: "world"
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      hello: "world"
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      data: {
        amount: 1,
        hello: "world"
      }
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      data: {
        amount: 1,
        _hello: "world"
      }
    })).toBe(false)

    expect(validateFlag({
      ...flagWithData,
      oh: 1,
      data: {
        amount: 1,
        _hello: "world"
      }
    })).toBe(false)
  });

  it('should return true when correct', () => {
    expect(validateFlag({
      ...flagWithData
    })).toBe(true)

    expect(validateFlag({
      ...flag
    })).toBe(true)

    expect(validateFlag({
      ...flag,
      name: "abc"
    })).toBe(true)

    expect(validateFlag({
      ...flag,
      scope: "user"
    })).toBe(true)

    expect(validateFlag({
      ...flagWithData,
      type: "time",
      data: { time: 5 }
    })).toBe(true)
  });
});

describe('validateFlags', () => {
  it('should return false when a single flag is invalid', () => {
    expect(validateFlags([flag, flag, flagWithData, {
      ...flagWithData,
      name: 1
    }])).toBe(false)

    expect(validateFlags([flag, {
      ...flag,
      name: 1
    }])).toBe(false)
  });

  it('should return false when all flags are invalid', () => {
    expect(validateFlags([{
      ...flagWithData,
      type: "hello"
    }, {
      ...flagWithData,
      type: "hello5"
    }, {
      ...flagWithData,
      type: "hello2"
    }])).toBe(false)
  });

  it('should return true when all flags are valid', () => {
    expect(validateFlags([flag, flag, flagWithData, flagWithData])).toBe(true);
  });

  it('should return true when array is empty', () => {
    expect(validateFlags([])).toBe(true);
  });
});
