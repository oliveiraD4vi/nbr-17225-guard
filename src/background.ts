/**
 * Background Service Worker
 */
import { t } from '@/i18n'

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log(`[${t('shared.brand.name')}] ${t('background.installed')}`)
  } else if (details.reason === 'update') {
    console.log(`[${t('shared.brand.name')}] ${t('background.updated')}`)
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(`[${t('shared.brand.name')}] ${t('background.message')}`, request.action)

  switch (request.action) {
    case 'OPEN_REPORT':
      openDetailedReport()
      sendResponse({ status: 'OK' })
      break
    default:
      sendResponse({ status: 'UNKNOWN_ACTION' })
  }

  return true
})

function openDetailedReport() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/report.html'),
  })
}

console.log(`[${t('shared.brand.name')}] ${t('background.loaded')}`)
