import { t } from '@/i18n'
import type { Rule, Violation } from '@/types'
import { createViolation, getAccessibleName, isElementVisible } from '@/utils'

interface MeasuredTarget {
  control: HTMLElement
  element: HTMLElement
  rect: DOMRect
}

const interactiveControlSelector =
  'a, button, input, select, textarea, [role="button"], [role="link"]'

function isInlineTextLink(control: HTMLElement): boolean {
  if (control.tagName !== 'A') return false
  if (!control.closest('p, li, dd, dt, figcaption, small')) return false

  const display = window.getComputedStyle(control).display
  return display === 'inline' || display === 'inline-block'
}

function getTargetSizeElement(control: HTMLElement): HTMLElement {
  if (
    control instanceof HTMLInputElement &&
    (control.classList.contains('ant-select-input') || control.getAttribute('role') === 'combobox')
  ) {
    return (
      control.closest<HTMLElement>(
        '.ant-select-selector, .ant-select, .ant-picker, .ant-cascader-picker, .ant-input-number, .ant-input-affix-wrapper',
      ) ?? control
    )
  }

  return control.closest<HTMLElement>('.ant-input-affix-wrapper') ?? control
}

function isDisabledControl(control: HTMLElement): boolean {
  if (
    control instanceof HTMLButtonElement ||
    control instanceof HTMLInputElement ||
    control instanceof HTMLSelectElement ||
    control instanceof HTMLTextAreaElement
  ) {
    if (control.disabled) return true
  }

  return control.getAttribute('aria-disabled') === 'true'
}

function getControlDescriptor(control: HTMLElement): string {
  const className =
    typeof control.className === 'string' ? control.className : control.getAttribute('class') || ''

  return [
    className,
    control.getAttribute('role') || '',
    control.getAttribute('aria-label') || '',
    control.getAttribute('aria-controls') || '',
    control.textContent || '',
    getAccessibleName(control),
  ]
    .join(' ')
    .toLowerCase()
}

function isCarouselPaginationControl(control: HTMLElement): boolean {
  return /pagination|bullet|dot|slick-dots|carousel-indicator|go to slide|ir para slide|slide \d/.test(
    getControlDescriptor(control),
  )
}

function findCarouselContext(control: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = control

  while (current && current !== document.body) {
    const descriptor = [
      typeof current.className === 'string' ? current.className : current.getAttribute('class') || '',
      current.getAttribute('role') || '',
      current.getAttribute('aria-roledescription') || '',
      current.getAttribute('aria-label') || '',
    ]
      .join(' ')
      .toLowerCase()

    if (/carousel|carrossel|swiper|slider|slick/.test(descriptor)) return current
    current = current.parentElement
  }

  return null
}

function shouldMeasureTarget(control: HTMLElement): boolean {
  if (!isElementVisible(control)) return false
  if (isDisabledControl(control)) return false
  if ((control as HTMLInputElement).type === 'hidden') return false
  if (isInlineTextLink(control)) return false

  return true
}

function getMeasuredTargets(controls: HTMLElement[]): MeasuredTarget[] {
  const measuredControls = new Set<HTMLElement>()
  const measuredTargets: MeasuredTarget[] = []

  controls.forEach((control) => {
    if (!shouldMeasureTarget(control)) return

    const targetElement = getTargetSizeElement(control)
    if (measuredControls.has(targetElement) || !isElementVisible(targetElement)) return
    measuredControls.add(targetElement)

    measuredTargets.push({
      control,
      element: targetElement,
      rect: targetElement.getBoundingClientRect(),
    })
  })

  return measuredTargets
}

function getAxisGap(rect: DOMRect, otherRect: DOMRect, axis: 'horizontal' | 'vertical'): number {
  if (axis === 'horizontal') {
    if (rect.right <= otherRect.left) return otherRect.left - rect.right
    if (otherRect.right <= rect.left) return rect.left - otherRect.right
    return 0
  }

  if (rect.bottom <= otherRect.top) return otherRect.top - rect.bottom
  if (otherRect.bottom <= rect.top) return rect.top - otherRect.bottom
  return 0
}

function hasAdequateTargetSpacing(
  target: MeasuredTarget,
  measuredTargets: MeasuredTarget[],
  minimumSize: number,
): boolean {
  return measuredTargets.every((otherTarget) => {
    if (otherTarget.element === target.element) return true

    const horizontalGap = getAxisGap(target.rect, otherTarget.rect, 'horizontal')
    const verticalGap = getAxisGap(target.rect, otherTarget.rect, 'vertical')
    const overlapsHorizontally = horizontalGap === 0
    const overlapsVertically = verticalGap === 0

    if (!overlapsHorizontally && !overlapsVertically) return true
    if (
      overlapsVertically &&
      target.rect.width + horizontalGap >= minimumSize &&
      otherTarget.rect.width + horizontalGap >= minimumSize
    ) {
      return true
    }

    if (
      overlapsHorizontally &&
      target.rect.height + verticalGap >= minimumSize &&
      otherTarget.rect.height + verticalGap >= minimumSize
    ) {
      return true
    }

    return false
  })
}

function hasEquivalentCarouselControl(
  target: MeasuredTarget,
  measuredTargets: MeasuredTarget[],
  minimumSize: number,
): boolean {
  if (!isCarouselPaginationControl(target.control)) return false

  const carouselContext = findCarouselContext(target.control)
  if (!carouselContext) return false

  return measuredTargets.some(
    (otherTarget) =>
      otherTarget.element !== target.element &&
      carouselContext.contains(otherTarget.control) &&
      !isCarouselPaginationControl(otherTarget.control) &&
      otherTarget.rect.width >= minimumSize &&
      otherTarget.rect.height >= minimumSize,
  )
}

function targetMeetsSize(
  target: MeasuredTarget,
  measuredTargets: MeasuredTarget[],
  minimumSize: number,
): boolean {
  if (target.rect.width >= minimumSize && target.rect.height >= minimumSize) return true
  if (hasAdequateTargetSpacing(target, measuredTargets, minimumSize)) return true
  return hasEquivalentCarouselControl(target, measuredTargets, minimumSize)
}

export const buttonSemanticRule: Rule = {
  id: 'button-semantic',
  nbrReference: '5.8.1',
  name: t('rules.controls.buttonSemantic.name'),
  description: t('rules.controls.buttonSemantic.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const controls = document.querySelectorAll<HTMLElement>(
      'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]',
    )

    controls.forEach((control) => {
      if (!isElementVisible(control)) return
      const name = getAccessibleName(control)
      if (!name.trim()) {
        violations.push(
          createViolation(buttonSemanticRule, {
            element: control,
            message: t('rules.controls.buttonSemantic.message'),
            suggestion: t('rules.controls.buttonSemantic.suggestion'),
            remediationAdvice: t('rules.controls.buttonSemantic.remediation'),
            customIdPrefix: 'button-name',
          }),
        )
      }
    })

    return violations
  },
}

export const targetSizeRule: Rule = {
  id: 'target-size',
  nbrReference: '5.8.7',
  name: t('rules.controls.targetSize.name'),
  description: t('rules.controls.targetSize.description'),
  severity: 'error',
  wcagLevel: 'AA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const measuredTargets = getMeasuredTargets(Array.from(document.querySelectorAll<HTMLElement>(interactiveControlSelector)))

    measuredTargets.forEach((target) => {
      if (!targetMeetsSize(target, measuredTargets, 24)) {
        violations.push(
          createViolation(targetSizeRule, {
            element: target.element,
            message: t('rules.controls.targetSize.message', {
              width: Math.round(target.rect.width),
              height: Math.round(target.rect.height),
            }),
            suggestion: t('rules.controls.targetSize.suggestion'),
            remediationAdvice: t('rules.controls.targetSize.remediation'),
            customIdPrefix: 'target-size',
          }),
        )
      }
    })

    return violations
  },
}

export const enhancedTargetSizeRule: Rule = {
  id: 'enhanced-target-size',
  nbrReference: '5.8.6',
  name: t('rules.controls.enhancedTargetSize.name'),
  description: t('rules.controls.enhancedTargetSize.description'),
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = []
    const measuredTargets = getMeasuredTargets(
      Array.from(
        document.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [role="button"], [role="link"], a[role="button"], a[class*="button" i], a[class*="btn" i]',
        ),
      ),
    )

    measuredTargets.forEach((target) => {
      if (targetMeetsSize(target, measuredTargets, 24) && !targetMeetsSize(target, measuredTargets, 44)) {
        violations.push(
          createViolation(enhancedTargetSizeRule, {
            element: target.element,
            message: t('rules.controls.enhancedTargetSize.message', {
              width: Math.round(target.rect.width),
              height: Math.round(target.rect.height),
            }),
            suggestion: t('rules.controls.enhancedTargetSize.suggestion'),
            remediationAdvice: t('rules.controls.enhancedTargetSize.remediation'),
            customIdPrefix: 'enhanced-target-size',
          }),
        )
      }
    })

    return violations
  },
}

export const controlRules: Rule[] = [buttonSemanticRule, enhancedTargetSizeRule, targetSizeRule]
