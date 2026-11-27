import { describe, expect, it } from 'vitest'
import type { Rule } from '@/types'

/** What a rule concluded about a piece of markup. */
export type RuleOutcome = 'pass' | 'finding' | 'review'

export interface RuleScenario {
  name: string
  html: string
  expected: RuleOutcome
  /**
   * Changes outside <body>, such as the document language or a <meta> in <head>. Returns a
   * function that undoes them, because <head> also belongs to the test runner.
   */
  setup?: (document: Document) => () => void
}

/**
 * Renders the markup as the page body, runs the rule and reduces its violations to one outcome:
 * no violation passes, any automatic violation is a finding, and only candidates for human review
 * are a review.
 */
export async function auditMarkup(rule: Rule, scenario: RuleScenario): Promise<RuleOutcome> {
  document.documentElement.setAttribute('lang', 'pt-BR')
  document.title = 'Cenário de teste'
  document.body.innerHTML = scenario.html
  const undo = scenario.setup?.(document)

  try {
    const violations = await rule.check()
    if (violations.length === 0) return 'pass'
    return violations.every((violation) => violation.requiresHumanReview) ? 'review' : 'finding'
  } finally {
    undo?.()
  }
}

export function describeRuleScenarios(scenarios: Array<[Rule, RuleScenario[]]>): void {
  for (const [rule, cases] of scenarios) {
    describe(`${rule.nbrReference} ${rule.id}`, () => {
      it.each(cases)('$name: $expected', async (scenario) => {
        expect(await auditMarkup(rule, scenario)).toBe(scenario.expected)
      })
    })
  }
}

/** Replaces the <head> elements matching `selector` with `markup` until the returned undo runs. */
export function replaceInHead(selector: string, markup: string) {
  return (document: Document) => {
    const originals = Array.from(document.head.querySelectorAll(selector))
    originals.forEach((element) => element.remove())
    const template = document.createElement('template')
    template.innerHTML = markup
    const added = Array.from(template.content.children)
    document.head.append(...added)

    return () => {
      added.forEach((element) => element.remove())
      document.head.append(...originals)
    }
  }
}
