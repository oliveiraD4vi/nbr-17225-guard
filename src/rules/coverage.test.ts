import { describe, expect, it } from 'vitest'
import type { Rule } from '@/types'
import type { RuleScenario } from '../../tests/rules/audit-markup'
import { scenarios as colors } from './colors.scenarios'
import { scenarios as contentFormsMedia } from './content-forms-media.scenarios'
import { scenarios as controls } from './controls.scenarios'
import { scenarios as forms } from './forms.scenarios'
import { scenarios as headings } from './headings.scenarios'
import { scenarios as images } from './images.scenarios'
import { allRules } from './index'
import { scenarios as keyboard } from './keyboard-interaction.scenarios'
import { scenarios as lists } from './lists.scenarios'
import { scenarios as media } from './media.scenarios'
import { scenarios as navigation } from './navigation.scenarios'
import { scenarios as presentation } from './presentation.scenarios'
import { scenarios as regions } from './regions.scenarios'
import { scenarios as recommendations } from './remaining-recommendations.scenarios'
import { scenarios as semantics } from './semantics.scenarios'
import { scenarios as structural } from './structural-navigation-controls.scenarios'
import { scenarios as tables } from './tables.scenarios'
import { scenarios as textContent } from './text-content.scenarios'
import { scenarios as time } from './time.scenarios'

const scenariosByRule = new Map<Rule, RuleScenario[]>(
  [
    colors,
    contentFormsMedia,
    controls,
    forms,
    headings,
    images,
    keyboard,
    lists,
    media,
    navigation,
    presentation,
    regions,
    recommendations,
    semantics,
    structural,
    tables,
    textContent,
    time,
  ].flat(),
)

describe('rule scenario coverage', () => {
  it.each(allRules.map((rule) => [`${rule.nbrReference} ${rule.id}`, rule] as const))(
    '%s has a passing case and a case it reports',
    (_, rule) => {
      const outcomes = (scenariosByRule.get(rule) ?? []).map((scenario) => scenario.expected)

      expect(outcomes).toContain('pass')
      expect(outcomes.some((outcome) => outcome !== 'pass')).toBe(true)
    },
  )

  it('only has scenarios for rules in the catalog', () => {
    const catalog = new Set(allRules)
    expect([...scenariosByRule.keys()].filter((rule) => !catalog.has(rule))).toEqual([])
  })
})
