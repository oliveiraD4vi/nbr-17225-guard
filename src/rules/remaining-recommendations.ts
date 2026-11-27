import { t } from '@/i18n'
import type { Rule, Violation } from '@/types'
import { getAccessibleName } from '@/utils/accessible-name'
import { createViolation } from '@/utils/violation-factory'
import { getVisibleText, isElementVisible } from '@/utils/visibility'

function visibleElements(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(isElementVisible)
}

function firstVisible(selector: string): HTMLElement | undefined {
  return visibleElements(selector)[0]
}

function assistedCandidate(
  rule: Rule,
  element: HTMLElement | undefined,
  evidence: string,
  reviewQuestion: string,
): Violation[] {
  if (!element) return []

  return [
    createViolation(rule, {
      element,
      message: t('rules.recommendations.candidate.message', {
        rule: rule.name.toLocaleLowerCase('pt-BR'),
      }),
      suggestion: reviewQuestion,
      remediationAdvice: t('rules.recommendations.candidate.remediation'),
      evidence: [
        {
          kind:
            rule.auditScope === 'site' || rule.auditScope === 'journey'
              ? 'session'
              : 'author_review',
          summary: evidence,
        },
      ],
      reviewQuestion,
    }),
  ]
}

function getDuplicateLandmark(): HTMLElement | undefined {
  const landmarks = visibleElements(
    'header, nav, main, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]',
  )
  const keys = new Map<string, HTMLElement>()

  for (const landmark of landmarks) {
    const key = `${landmark.getAttribute('role') || landmark.tagName}:${getAccessibleName(landmark)}`
    if (keys.has(key)) return landmark
    keys.set(key, landmark)
  }
  return undefined
}

function getComplexTableWithoutDescription(): HTMLElement | undefined {
  return visibleElements('table').find((table) => {
    const rows = table.querySelectorAll('tr').length
    const columns = Math.max(
      0,
      ...Array.from(table.querySelectorAll('tr')).map((row) => row.children.length),
    )
    return rows >= 5 && columns >= 4 && !table.hasAttribute('aria-describedby')
  })
}

function getVagueLink(): HTMLElement | undefined {
  return visibleElements('a[href]').find((link) =>
    /^(aqui|clique aqui|saiba mais|mais|ver mais|link)$/i.test(getAccessibleName(link).trim()),
  )
}

function getAdjacentEquivalentLink(): HTMLElement | undefined {
  const links = visibleElements('a[href]') as HTMLAnchorElement[]
  return links.find((link, index) => {
    const next = links[index + 1]
    return Boolean(next && link.href === next.href && link.parentElement === next.parentElement)
  })
}

function getInconsistentControl(): HTMLElement | undefined {
  const controls = visibleElements(
    'button, [role="button"], input[type="button"], input[type="submit"]',
  )
  const names = new Map<string, string>()

  for (const control of controls) {
    const name = getAccessibleName(control).trim().toLocaleLowerCase('pt-BR')
    if (!name) continue
    const action =
      control.getAttribute('data-action') ||
      control.getAttribute('formaction') ||
      control.getAttribute('aria-controls') ||
      control.getAttribute('type') ||
      control.tagName
    const knownAction = names.get(name)
    if (knownAction && knownAction !== action) return control
    names.set(name, action)
  }
  return undefined
}

function getLongSectionWithoutHeading(): HTMLElement | undefined {
  return visibleElements('section, article').find((section) => {
    const text = getVisibleText(section).trim()
    return text.length >= 300 && !section.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]')
  })
}

function getFocusableCandidate(): HTMLElement | undefined {
  return firstVisible(
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable="true"]',
  )
}

export const focusUsageRecommendationRule: Rule = {
  id: 'focus-usage-recommendation',
  nbrReference: '5.1.5',
  name: t('rules.recommendations.focusUsage.name'),
  description: t('rules.recommendations.focusUsage.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      focusUsageRecommendationRule,
      firstVisible('[autofocus], [tabindex="-1"]'),
      t('rules.recommendations.focusUsage.evidence'),
      t('rules.recommendations.focusUsage.reviewQuestion'),
    ),
}

export const additionalContentRecommendationRule: Rule = {
  id: 'additional-content-recommendation',
  nbrReference: '5.1.7',
  name: t('rules.recommendations.additionalContent.name'),
  description: t('rules.recommendations.additionalContent.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      additionalContentRecommendationRule,
      firstVisible('[aria-describedby], [aria-haspopup], [popover], [title]'),
      t('rules.recommendations.additionalContent.evidence'),
      t('rules.recommendations.additionalContent.reviewQuestion'),
    ),
}

export const keyboardShortcutsRecommendationRule: Rule = {
  id: 'keyboard-shortcuts-recommendation',
  nbrReference: '5.1.10',
  name: t('rules.recommendations.keyboardShortcuts.name'),
  description: t('rules.recommendations.keyboardShortcuts.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      keyboardShortcutsRecommendationRule,
      firstVisible('[accesskey], [data-shortcut], [aria-keyshortcuts]'),
      t('rules.recommendations.keyboardShortcuts.evidence'),
      t('rules.recommendations.keyboardShortcuts.reviewQuestion'),
    ),
}

export const fullKeyboardAccessibilityRecommendationRule: Rule = {
  id: 'full-keyboard-accessibility-recommendation',
  nbrReference: '5.1.12',
  name: t('rules.recommendations.fullKeyboardAccessibility.name'),
  description: t('rules.recommendations.fullKeyboardAccessibility.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      fullKeyboardAccessibilityRecommendationRule,
      getFocusableCandidate(),
      t('rules.recommendations.fullKeyboardAccessibility.evidence'),
      t('rules.recommendations.fullKeyboardAccessibility.reviewQuestion'),
    ),
}

export const simultaneousInputRecommendationRule: Rule = {
  id: 'simultaneous-input-recommendation',
  nbrReference: '5.1.14',
  name: t('rules.recommendations.simultaneousInput.name'),
  description: t('rules.recommendations.simultaneousInput.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      simultaneousInputRecommendationRule,
      firstVisible('canvas, [draggable="true"], [data-gesture], [onpointerdown], [ontouchstart]'),
      t('rules.recommendations.simultaneousInput.evidence'),
      t('rules.recommendations.simultaneousInput.reviewQuestion'),
    ),
}

export const customComponentBehaviorRecommendationRule: Rule = {
  id: 'custom-component-behavior-recommendation',
  nbrReference: '5.1.15',
  name: t('rules.recommendations.customComponentBehavior.name'),
  description: t('rules.recommendations.customComponentBehavior.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      customComponentBehaviorRecommendationRule,
      firstVisible(
        '[role="combobox"], [role="menu"], [role="tablist"], [role="tree"], [role="grid"]',
      ),
      t('rules.recommendations.customComponentBehavior.evidence'),
      t('rules.recommendations.customComponentBehavior.reviewQuestion'),
    ),
}

export const sectionHeadingsRecommendationRule: Rule = {
  id: 'section-headings-recommendation',
  nbrReference: '5.3.4',
  name: t('rules.recommendations.sectionHeadings.name'),
  description: t('rules.recommendations.sectionHeadings.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      sectionHeadingsRecommendationRule,
      getLongSectionWithoutHeading(),
      t('rules.recommendations.sectionHeadings.evidence'),
      t('rules.recommendations.sectionHeadings.reviewQuestion'),
    ),
}

export const uniqueRegionsRecommendationRule: Rule = {
  id: 'unique-regions-recommendation',
  nbrReference: '5.4.4',
  name: t('rules.recommendations.uniqueRegions.name'),
  description: t('rules.recommendations.uniqueRegions.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      uniqueRegionsRecommendationRule,
      getDuplicateLandmark(),
      t('rules.recommendations.uniqueRegions.evidence'),
      t('rules.recommendations.uniqueRegions.reviewQuestion'),
    ),
}

export const tableTitleRecommendationRule: Rule = {
  id: 'table-title-recommendation',
  nbrReference: '5.6.4',
  name: t('rules.recommendations.tableTitle.name'),
  description: t('rules.recommendations.tableTitle.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      tableTitleRecommendationRule,
      visibleElements('table').find((table) => !table.querySelector('caption')),
      t('rules.recommendations.tableTitle.evidence'),
      t('rules.recommendations.tableTitle.reviewQuestion'),
    ),
}

export const complexTableDescriptionRecommendationRule: Rule = {
  id: 'complex-table-description-recommendation',
  nbrReference: '5.6.6',
  name: t('rules.recommendations.complexTableDescription.name'),
  description: t('rules.recommendations.complexTableDescription.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      complexTableDescriptionRecommendationRule,
      getComplexTableWithoutDescription(),
      t('rules.recommendations.complexTableDescription.evidence'),
      t('rules.recommendations.complexTableDescription.reviewQuestion'),
    ),
}

export const standaloneLinkPurposeRecommendationRule: Rule = {
  id: 'standalone-link-purpose-recommendation',
  nbrReference: '5.7.3',
  name: t('rules.recommendations.standaloneLinkPurpose.name'),
  description: t('rules.recommendations.standaloneLinkPurpose.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      standaloneLinkPurposeRecommendationRule,
      getVagueLink(),
      t('rules.recommendations.standaloneLinkPurpose.evidence'),
      t('rules.recommendations.standaloneLinkPurpose.reviewQuestion'),
    ),
}

export const consistentLinkIdentificationRecommendationRule: Rule = {
  id: 'consistent-link-identification-recommendation',
  nbrReference: '5.7.5',
  name: t('rules.recommendations.consistentLinkIdentification.name'),
  description: t('rules.recommendations.consistentLinkIdentification.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'site',
  check: async () =>
    assistedCandidate(
      consistentLinkIdentificationRecommendationRule,
      firstVisible('a[href]'),
      t('rules.recommendations.consistentLinkIdentification.evidence'),
      t('rules.recommendations.consistentLinkIdentification.reviewQuestion'),
    ),
}

export const complementaryLinkTextRecommendationRule: Rule = {
  id: 'complementary-link-text-recommendation',
  nbrReference: '5.7.9',
  name: t('rules.recommendations.complementaryLinkText.name'),
  description: t('rules.recommendations.complementaryLinkText.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      complementaryLinkTextRecommendationRule,
      visibleElements('a[href]').find(
        (link) => !getAccessibleName(link).trim() || Boolean(link.querySelector('svg, img')),
      ),
      t('rules.recommendations.complementaryLinkText.evidence'),
      t('rules.recommendations.complementaryLinkText.reviewQuestion'),
    ),
}

export const adjacentLinksRecommendationRule: Rule = {
  id: 'adjacent-links-recommendation',
  nbrReference: '5.7.10',
  name: t('rules.recommendations.adjacentLinks.name'),
  description: t('rules.recommendations.adjacentLinks.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      adjacentLinksRecommendationRule,
      getAdjacentEquivalentLink(),
      t('rules.recommendations.adjacentLinks.evidence'),
      t('rules.recommendations.adjacentLinks.reviewQuestion'),
    ),
}

export const skipBlockLinksRecommendationRule: Rule = {
  id: 'skip-block-links-recommendation',
  nbrReference: '5.7.11',
  name: t('rules.recommendations.skipBlockLinks.name'),
  description: t('rules.recommendations.skipBlockLinks.description'),
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () => {
    const links = visibleElements('a[href]')
    const hasMain = Boolean(document.querySelector('main, [role="main"]'))
    const hasSkip = links.some((link) => link.getAttribute('href')?.startsWith('#'))
    return assistedCandidate(
      skipBlockLinksRecommendationRule,
      links.length >= 8 && hasMain && !hasSkip ? links[0] : undefined,
      t('rules.recommendations.skipBlockLinks.evidence'),
      t('rules.recommendations.skipBlockLinks.reviewQuestion'),
    )
  },
}

export const siteLocationRecommendationRule: Rule = {
  id: 'site-location-recommendation',
  nbrReference: '5.7.14',
  name: t('rules.recommendations.siteLocation.name'),
  description: t('rules.recommendations.siteLocation.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'site',
  check: async () =>
    assistedCandidate(
      siteLocationRecommendationRule,
      firstVisible('nav, [role="navigation"]'),
      t('rules.recommendations.siteLocation.evidence'),
      t('rules.recommendations.siteLocation.reviewQuestion'),
    ),
}

export const pageControlConsistencyRecommendationRule: Rule = {
  id: 'page-control-consistency-recommendation',
  nbrReference: '5.8.4',
  name: t('rules.recommendations.pageControlConsistency.name'),
  description: t('rules.recommendations.pageControlConsistency.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      pageControlConsistencyRecommendationRule,
      getInconsistentControl(),
      t('rules.recommendations.pageControlConsistency.evidence'),
      t('rules.recommendations.pageControlConsistency.reviewQuestion'),
    ),
}

export const predictableContextChangeRecommendationRule: Rule = {
  id: 'predictable-context-change-recommendation',
  nbrReference: '5.8.8',
  name: t('rules.recommendations.predictableContextChange.name'),
  description: t('rules.recommendations.predictableContextChange.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      predictableContextChangeRecommendationRule,
      firstVisible('[onfocus], select[onchange], input[onchange], [data-redirect]'),
      t('rules.recommendations.predictableContextChange.evidence'),
      t('rules.recommendations.predictableContextChange.reviewQuestion'),
    ),
}

export const controlFeedbackRecommendationRule: Rule = {
  id: 'control-feedback-recommendation',
  nbrReference: '5.8.15',
  name: t('rules.recommendations.controlFeedback.name'),
  description: t('rules.recommendations.controlFeedback.description'),
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      controlFeedbackRecommendationRule,
      firstVisible('button, [role="button"], input[type="submit"]'),
      t('rules.recommendations.controlFeedback.evidence'),
      t('rules.recommendations.controlFeedback.reviewQuestion'),
    ),
}

export const errorPreventionRecommendationRule: Rule = {
  id: 'error-prevention-recommendation',
  nbrReference: '5.9.11',
  name: t('rules.recommendations.errorPrevention.name'),
  description: t('rules.recommendations.errorPrevention.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'journey',
  check: async () =>
    assistedCandidate(
      errorPreventionRecommendationRule,
      firstVisible('form input, form select, form textarea'),
      t('rules.recommendations.errorPrevention.evidence'),
      t('rules.recommendations.errorPrevention.reviewQuestion'),
    ),
}

export const enhancedAuthenticationRecommendationRule: Rule = {
  id: 'enhanced-authentication-recommendation',
  nbrReference: '5.9.17',
  name: t('rules.recommendations.enhancedAuthentication.name'),
  description: t('rules.recommendations.enhancedAuthentication.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'journey',
  check: async () =>
    assistedCandidate(
      enhancedAuthenticationRecommendationRule,
      firstVisible('input[type="password"], input[autocomplete="one-time-code"]'),
      t('rules.recommendations.enhancedAuthentication.evidence'),
      t('rules.recommendations.enhancedAuthentication.reviewQuestion'),
    ),
}

export const focusIndicatorAreaRecommendationRule: Rule = {
  id: 'focus-indicator-area-recommendation',
  nbrReference: '5.10.5',
  name: t('rules.recommendations.focusIndicatorArea.name'),
  description: t('rules.recommendations.focusIndicatorArea.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      focusIndicatorAreaRecommendationRule,
      getFocusableCandidate(),
      t('rules.recommendations.focusIndicatorArea.evidence'),
      t('rules.recommendations.focusIndicatorArea.reviewQuestion'),
    ),
}

export const definitionsRecommendationRule: Rule = {
  id: 'definitions-recommendation',
  nbrReference: '5.12.10',
  name: t('rules.recommendations.definitions.name'),
  description: t('rules.recommendations.definitions.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      definitionsRecommendationRule,
      firstVisible('dfn, abbr, code, var'),
      t('rules.recommendations.definitions.evidence'),
      t('rules.recommendations.definitions.reviewQuestion'),
    ),
}

export const readingLevelRecommendationRule: Rule = {
  id: 'reading-level-recommendation',
  nbrReference: '5.12.12',
  name: t('rules.recommendations.readingLevel.name'),
  description: t('rules.recommendations.readingLevel.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () => {
    const main = firstVisible('main, [role="main"], article')
    return assistedCandidate(
      readingLevelRecommendationRule,
      main && getVisibleText(main).length >= 1200 ? main : undefined,
      t('rules.recommendations.readingLevel.evidence'),
      t('rules.recommendations.readingLevel.reviewQuestion'),
    )
  },
}

export const pronunciationRecommendationRule: Rule = {
  id: 'pronunciation-recommendation',
  nbrReference: '5.12.13',
  name: t('rules.recommendations.pronunciation.name'),
  description: t('rules.recommendations.pronunciation.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      pronunciationRecommendationRule,
      visibleElements('abbr, span, p').find((element) =>
        /\b[A-ZÁÉÍÓÚÇ]{3,}\b/.test(getVisibleText(element)),
      ),
      t('rules.recommendations.pronunciation.evidence'),
      t('rules.recommendations.pronunciation.reviewQuestion'),
    ),
}

export const extendedAudioDescriptionRecommendationRule: Rule = {
  id: 'extended-audio-description-recommendation',
  nbrReference: '5.14.5',
  name: t('rules.recommendations.extendedAudioDescription.name'),
  description: t('rules.recommendations.extendedAudioDescription.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      extendedAudioDescriptionRecommendationRule,
      firstVisible('video'),
      t('rules.recommendations.extendedAudioDescription.evidence'),
      t('rules.recommendations.extendedAudioDescription.reviewQuestion'),
    ),
}

export const signLanguageRecommendationRule: Rule = {
  id: 'sign-language-recommendation',
  nbrReference: '5.14.6',
  name: t('rules.recommendations.signLanguage.name'),
  description: t('rules.recommendations.signLanguage.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      signLanguageRecommendationRule,
      firstVisible('audio, video'),
      t('rules.recommendations.signLanguage.evidence'),
      t('rules.recommendations.signLanguage.reviewQuestion'),
    ),
}

export const cleanAudioRecommendationRule: Rule = {
  id: 'clean-audio-recommendation',
  nbrReference: '5.14.8',
  name: t('rules.recommendations.cleanAudio.name'),
  description: t('rules.recommendations.cleanAudio.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      cleanAudioRecommendationRule,
      firstVisible('audio, video'),
      t('rules.recommendations.cleanAudio.evidence'),
      t('rules.recommendations.cleanAudio.reviewQuestion'),
    ),
}

export const liveAudioTranscriptRecommendationRule: Rule = {
  id: 'live-audio-transcript-recommendation',
  nbrReference: '5.14.10',
  name: t('rules.recommendations.liveAudioTranscript.name'),
  description: t('rules.recommendations.liveAudioTranscript.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      liveAudioTranscriptRecommendationRule,
      firstVisible('[data-live], [aria-label*="ao vivo" i], audio, video'),
      t('rules.recommendations.liveAudioTranscript.evidence'),
      t('rules.recommendations.liveAudioTranscript.reviewQuestion'),
    ),
}

export const interactionAnimationRecommendationRule: Rule = {
  id: 'interaction-animation-recommendation',
  nbrReference: '5.15.2',
  name: t('rules.recommendations.interactionAnimation.name'),
  description: t('rules.recommendations.interactionAnimation.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  verificationMode: 'assisted',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      interactionAnimationRecommendationRule,
      firstVisible('[class*="animat" i], [data-animation], [style*="animation" i]'),
      t('rules.recommendations.interactionAnimation.evidence'),
      t('rules.recommendations.interactionAnimation.reviewQuestion'),
    ),
}

export const intermittentFlashRecommendationRule: Rule = {
  id: 'intermittent-flash-recommendation',
  nbrReference: '5.15.3',
  name: t('rules.recommendations.intermittentFlash.name'),
  description: t('rules.recommendations.intermittentFlash.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'page',
  check: async () =>
    assistedCandidate(
      intermittentFlashRecommendationRule,
      firstVisible('[class*="flash" i], [class*="blink" i], [style*="animation" i], video'),
      t('rules.recommendations.intermittentFlash.evidence'),
      t('rules.recommendations.intermittentFlash.reviewQuestion'),
    ),
}

export const interruptionsRecommendationRule: Rule = {
  id: 'interruptions-recommendation',
  nbrReference: '5.16.4',
  name: t('rules.recommendations.interruptions.name'),
  description: t('rules.recommendations.interruptions.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'journey',
  check: async () =>
    assistedCandidate(
      interruptionsRecommendationRule,
      firstVisible('[role="alertdialog"], [role="dialog"], [aria-live="assertive"]'),
      t('rules.recommendations.interruptions.evidence'),
      t('rules.recommendations.interruptions.reviewQuestion'),
    ),
}

export const reauthenticationRecommendationRule: Rule = {
  id: 'reauthentication-recommendation',
  nbrReference: '5.16.5',
  name: t('rules.recommendations.reauthentication.name'),
  description: t('rules.recommendations.reauthentication.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'journey',
  check: async () =>
    assistedCandidate(
      reauthenticationRecommendationRule,
      firstVisible('input[type="password"], [data-session-expired], [role="alert"]'),
      t('rules.recommendations.reauthentication.evidence'),
      t('rules.recommendations.reauthentication.reviewQuestion'),
    ),
}

export const inactivityRecommendationRule: Rule = {
  id: 'inactivity-recommendation',
  nbrReference: '5.16.6',
  name: t('rules.recommendations.inactivity.name'),
  description: t('rules.recommendations.inactivity.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Não Automatizável',
  verificationMode: 'manual',
  auditScope: 'journey',
  check: async () =>
    assistedCandidate(
      inactivityRecommendationRule,
      firstVisible(
        'meta[http-equiv="refresh" i], [data-timeout], [data-session-timeout], [role="timer"]',
      ),
      t('rules.recommendations.inactivity.evidence'),
      t('rules.recommendations.inactivity.reviewQuestion'),
    ),
}

export const remainingRecommendationRules: Rule[] = [
  focusUsageRecommendationRule,
  additionalContentRecommendationRule,
  keyboardShortcutsRecommendationRule,
  fullKeyboardAccessibilityRecommendationRule,
  simultaneousInputRecommendationRule,
  customComponentBehaviorRecommendationRule,
  sectionHeadingsRecommendationRule,
  uniqueRegionsRecommendationRule,
  tableTitleRecommendationRule,
  complexTableDescriptionRecommendationRule,
  standaloneLinkPurposeRecommendationRule,
  consistentLinkIdentificationRecommendationRule,
  complementaryLinkTextRecommendationRule,
  adjacentLinksRecommendationRule,
  skipBlockLinksRecommendationRule,
  siteLocationRecommendationRule,
  pageControlConsistencyRecommendationRule,
  predictableContextChangeRecommendationRule,
  controlFeedbackRecommendationRule,
  errorPreventionRecommendationRule,
  enhancedAuthenticationRecommendationRule,
  focusIndicatorAreaRecommendationRule,
  definitionsRecommendationRule,
  readingLevelRecommendationRule,
  pronunciationRecommendationRule,
  extendedAudioDescriptionRecommendationRule,
  signLanguageRecommendationRule,
  cleanAudioRecommendationRule,
  liveAudioTranscriptRecommendationRule,
  interactionAnimationRecommendationRule,
  intermittentFlashRecommendationRule,
  interruptionsRecommendationRule,
  reauthenticationRecommendationRule,
  inactivityRecommendationRule,
]
