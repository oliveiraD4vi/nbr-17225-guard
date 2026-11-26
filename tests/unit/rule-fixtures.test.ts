import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import fixtures from '../fixtures/rule-fixtures.json'

describe('rule fixture catalog', () => {
  it('has a positive, a negative and a boundary scenario for each of the 146 rules', () => {
    const references = new Set(fixtures.map((fixture) => fixture.reference))

    assert.equal(references.size, 146)
    assert.equal(fixtures.length, 438)

    for (const reference of references) {
      const scenarios = fixtures
        .filter((fixture) => fixture.reference === reference)
        .map((fixture) => fixture.scenario)
        .sort()
      assert.deepEqual(scenarios, ['boundary', 'negative', 'positive'])
    }

    for (const expectation of ['pass', 'finding', 'review']) {
      assert.equal(fixtures.filter((fixture) => fixture.expectation === expectation).length, 146)
    }
  })
})
