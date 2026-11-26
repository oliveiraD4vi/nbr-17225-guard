// Assertions on source text carried over unchanged from the scripts in scripts/test-*.mjs.
// They are replaced by behaviour tests in the same phase.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, it } from 'vitest'

const read = (file: string) => readFile(file, 'utf8')

describe('source contracts', () => {
  it('extension storage', async () => {
    const workspaceSource = await read('src/components/AuditWorkspaceApp.tsx')
    const backgroundSource = await read('src/background.ts')

    assert.doesNotMatch(workspaceSource, /chrome\.storage/)
    assert.match(backgroundSource, /case 'STORAGE_LOCAL_GET'/)
    assert.match(backgroundSource, /case 'STORAGE_LOCAL_SET'/)
    assert.match(backgroundSource, /MANUAL_FINDING_DRAFT_CHANGED/)
  })

  it('accessible UI', async () => {
    const failures: string[] = []
    for (const file of [
      'src/components/AuditWorkspaceApp.tsx',
      'src/components/ViolationsList.tsx',
      'src/components/VisionSimulator.tsx',
    ]) {
      const source = await read(file)
      for (const match of source.matchAll(
        /<Button(?<props>[\s\S]*?icon=\{[\s\S]*?\})(?:\s*\/?>|[\s\S]*?<\/Button>)/g,
      )) {
        const markup = match[0]
        const isSelfClosing = markup.trimEnd().endsWith('/>')
        const hasEmptyBody = /<Button[\s\S]*?>\s*<\/Button>/.test(markup)
        if ((isSelfClosing || hasEmptyBody) && !/aria-label=/.test(markup)) {
          failures.push(`${file}:${source.slice(0, match.index).split('\n').length}`)
        }
      }
    }
    assert.deepEqual(failures, [])

    const theme = await read('src/styles/theme.css')
    assert.ok(theme.includes('@media (prefers-reduced-motion: reduce)'))
    assert.ok(theme.includes('@media (forced-colors: active)'))
    assert.ok((await read('src/components/AuditWorkspaceApp.tsx')).includes('useAccessibleMessage'))
  })

  it('DevTools refinements', async () => {
    const [workspaceSource, violationsSource, aboutSource, popupCss] = await Promise.all([
      read('src/components/AuditWorkspaceApp.tsx'),
      read('src/components/ViolationsList.tsx'),
      read('src/components/AboutPanel.tsx'),
      read('src/styles/popup.css'),
    ])

    assert.doesNotMatch(violationsSource, /reviewSections\.confirmed/)
    assert.match(violationsSource, /sortedViolations\.filter\(isPendingHumanReviewFinding\)/)
    assert.match(workspaceSource, /action\.key === 'csv' \? 'CSV'/)
    assert.match(workspaceSource, /action\.key === 'json' \? 'JSON'/)
    assert.match(popupCss, /\.footer-icon-action[\s\S]*?width: 36px/)
    assert.match(popupCss, /\.footer-icon-action[\s\S]*?height: 36px/)
    assert.match(popupCss, /\.footer-icon-action[\s\S]*?border-radius: 999px !important/)
    assert.match(popupCss, /\.footer-download-action[\s\S]*?border-radius: 999px !important/)
    assert.match(popupCss, /\.vision-floating-shell[\s\S]*?bottom: 4\.5rem/)
    assert.match(aboutSource, /about-capabilities/)
    assert.match(aboutSource, /about-privacy-note/)
  })

  it('contrast preview', async () => {
    const contentSource = await read('src/content.ts')
    const popupSource = await read('src/components/AuditWorkspaceApp.tsx')
    const violationsSource = await read('src/components/ViolationsList.tsx')

    assert.match(contentSource, /SYNC_CONTRAST_PREVIEWS/)
    assert.match(contentSource, /CLEAR_CONTRAST_PREVIEWS/)
    assert.match(contentSource, /port\.onDisconnect\.addListener\(clearContrastPreviews\)/)
    assert.match(contentSource, /window\.addEventListener\('pagehide', clearContrastPreviews\)/)
    assert.match(contentSource, /document\.querySelector<HTMLElement>\(preview\.selector\)/)
    assert.match(popupSource, /isHistoricalView \|\| !canRerunViewedAudit/)
    assert.match(popupSource, /contrast-preview-session/)
    assert.match(violationsSource, /window\.setTimeout\(\(\) => \{/)
    assert.match(violationsSource, /contrastPagePreviewNote/)
  })

  it('triage', async () => {
    const violationsListSource = await read('src/components/ViolationsList.tsx')

    assert.match(violationsListSource, /if \(!ignoreReason\)/)
    assert.match(violationsListSource, /ignoreReasonRequired/)
  })

  it('manual findings', async () => {
    const popupSource = await read('src/components/AuditWorkspaceApp.tsx')
    const contentSource = await read('src/content.ts')

    assert.match(popupSource, /popup\.manualFinding\.validation\.rule/)
    assert.match(popupSource, /popup\.manualFinding\.validation\.message/)
    assert.match(popupSource, /popup\.manualFinding\.validation\.suggestion/)
    assert.match(popupSource, /popup\.manualFinding\.validation\.remediationAdvice/)
    assert.match(contentSource, /START_MANUAL_FINDING_SELECTION/)
    assert.match(contentSource, /RESOLVE_MANUAL_FINDING_SELECTORS/)
    assert.match(contentSource, /event\.key !== 'Escape'/)
    assert.match(contentSource, /isGuardInjectedElement\(element\)/)
  })

  it('bulk actions and summary', async () => {
    const popupSource = await read('src/components/AuditWorkspaceApp.tsx')
    const violationsListSource = await read('src/components/ViolationsList.tsx')
    const summarySource = await read('src/components/ViolationsSummary.tsx')
    const scoreSource = await read('src/utils/audit-score.ts')
    const reportSource = await read('src/report.tsx')

    assert.match(popupSource, /const defaultIncludeHumanReview = true/)
    assert.match(popupSource, /const showHumanReviewScopeToggle = false/)
    assert.match(popupSource, /showHumanReviewScopeToggle &&/)

    const highlight = popupSource.indexOf("key: 'highlight'")
    const priority = popupSource.indexOf("key: 'priority'")
    const csv = popupSource.indexOf("key: 'csv'")
    const json = popupSource.indexOf("key: 'json'")
    const report = popupSource.indexOf("key: 'report'")
    const reportEnd = popupSource.indexOf(']', report)

    assert.ok(highlight > 0)
    assert.ok(priority > highlight)
    assert.ok(csv > priority)
    assert.ok(json > csv)
    assert.ok(report > json)
    assert.doesNotMatch(popupSource.slice(json, report), /type: 'primary'/)
    assert.match(popupSource.slice(report, reportEnd), /type: 'primary'/)
    assert.doesNotMatch(popupSource.slice(highlight, priority), /type: 'primary'/)
    assert.match(popupSource, /downloadLabel \? 'footer-download-action' : 'footer-icon-action'/)
    assert.match(popupSource, /aria-label=\{action\.label\}/)

    assert.doesNotMatch(violationsListSource, /findingActionConfirm|findingTriage/)
    assert.match(violationsListSource, /findingActionIgnoreSimilar/)
    assert.match(violationsListSource, /contrastApplyToSimilar/)

    assert.match(summarySource, /summary-score-metrics/)
    assert.match(summarySource, /aria-expanded=\{isScorePanelOpen\}/)
    assert.match(summarySource, /useState\(\{ key: resultKey, open: false \}\)/)
    assert.match(summarySource, /scorePanelActionableFindings/)
    assert.doesNotMatch(summarySource, /summary-score-fact-grid|summary-review-progress/)
    assert.doesNotMatch(summarySource, /pendingHumanReviewScore|provisionalScore/)
    assert.doesNotMatch(summarySource, /summary-status-pill|summary-meta-item|actionRequired/)
    assert.match(popupSource, /handleCopyAuditUrl/)
    assert.match(popupSource, /displayedAuditResult\?\.pageTitle \|\| activeTab\?\.title/)
    assert.doesNotMatch(reportSource, /getPendingHumanReviewCount|pendingReviews/)
    assert.match(scoreSource, /isProvisional: pendingHumanReviewItems > 0/)
  })

  it('DevTools as the main surface', async () => {
    const manifest = JSON.parse(await read('public/manifest.json'))
    const viteConfig = await read('vite.config.ts')
    const devtoolsSource = await read('src/devtools.ts')
    const devtoolsPanelSource = await read('src/devtools-panel.tsx')
    const devtoolsPanelAppSource = await read('src/components/DevToolsPanelApp.tsx')
    const workspaceSource = await read('src/components/AuditWorkspaceApp.tsx')
    const popupSource = await read('src/components/PopupLandingApp.tsx')
    const violationsListSource = await read('src/components/ViolationsList.tsx')
    const themeSource = await read('src/theme/antd.ts')

    assert.equal(manifest.devtools_page, 'src/devtools.html')
    assert.match(viteConfig, /devtoolsPanel/)
    assert.match(devtoolsSource, /chrome\.devtools\.panels\.create/)
    assert.match(devtoolsPanelSource, /DevToolsPanelApp/)
    assert.match(devtoolsPanelAppSource, /chrome\.devtools\?\.inspectedWindow\?\.tabId/)
    assert.match(devtoolsPanelAppSource, /AuditWorkspaceApp/)
    assert.match(devtoolsPanelAppSource, /targetTab=\{targetTab\}/)
    assert.doesNotMatch(popupSource, /AuditWorkspaceApp/)
    assert.match(popupSource, /getAuditResult\(tab\.id, tab\.url\)/)
    assert.match(popupSource, /action: 'OPEN_REPORT'/)
    assert.doesNotMatch(workspaceSource, /surface\?: 'popup' \| 'devtools'/)
    assert.match(workspaceSource, /normalizeStoredViolationsListState/)
    assert.match(violationsListSource, /<Drawer/)
    assert.match(violationsListSource, /violations\.openIgnored/)
    assert.doesNotMatch(violationsListSource, /value: 'ignored'/)
    assert.match(themeSource, /primaryColor: '#ffffff'/)
  })
})
