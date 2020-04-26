const { getTier, tierEnum, hasFlags, hasPatreonLinked, userNullError } = require('../src/models/patreon');

const userNotLinked = {
  patreon: null
}

const userNotLinkedExplicit = {
  patreon: {
    isLinkedPatreon: false,
  }
}

const userLinkedNoTier = {
  patreon: {
    isLinkedPatreon: true,
  }
}

const userLinkedWithTier = {
  patreon: {
    isLinkedPatreon: true,
    tier: "myAwesomeTier"
  }
}

describe('hasLinkedPatreon', () => {
  it('should throw error when user is null', () => {
    expect(hasPatreonLinked).toThrowError(userNullError);
  })

  it('should return false when user.patreon is null', () => {
    expect(hasPatreonLinked(userNotLinked)).toBe(false);
  })

  it('should return false when user has no patreon linked', () => {
    expect(hasPatreonLinked(userNotLinkedExplicit)).toBe(false);
  })

  it('should return true when user has patreon linked', () => {
    expect(hasPatreonLinked(userLinkedWithTier)).toBe(true);
  })
});

describe('getTier', () => {
  it('should throw error when user is null', () => {
    expect((getTier)).toThrowError(userNullError);
  })

  it("should return default tier when user doesn't have patreon linked", () => {
    expect(getTier(userNotLinked)).toBe(tierEnum.default);
  })

  it("should return default tier when user has no tier", () => {
    expect(getTier(userLinkedNoTier)).toBe(tierEnum.default);
  })

  it("should return tier", () => {
    expect(getTier(userLinkedWithTier)).toBe(userLinkedWithTier.patreon.tier);
  })
})

const userWithoutFlags = {}

const userWithEmptyFlags = {
  flags: []
}

const userWithFlag = {
  flags: [
    "FLAG"
  ]
}

describe('hasFlags', () => {
  it('should throw error when user is null', () => {
      expect(hasFlags).toThrowError(userNullError);
  })

  it('should return false when user.flags is null', () => {
    expect(hasFlags(userWithoutFlags)).toBe(false);
  })

  it('should return false when user.flags is an empty array', () => {
    expect(hasFlags(userWithEmptyFlags)).toBe(false)
  })

  it('should return true when user.flags contains any flag', () => {
    expect(hasFlags(userWithFlag)).toBe(true)
  })
});
