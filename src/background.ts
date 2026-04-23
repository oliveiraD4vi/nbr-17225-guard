/**
 * Background Service Worker
 */

// Listener para instalação da extensão
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Guardião NBR 17225] Extensão instalada com sucesso');
  } else if (details.reason === 'update') {
    console.log('[Guardião NBR 17225] Extensão atualizada');
  }
});

// Listener para mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Guardião NBR 17225] Mensagem no background:', request.action);

  switch (request.action) {
    case 'OPEN_REPORT':
      openDetailedReport();
      sendResponse({ status: 'OK' });
      break;

    default:
      sendResponse({ status: 'UNKNOWN_ACTION' });
  }

  return true;
});

/**
 * Abre a janela de relatório detalhado
 */
function openDetailedReport() {
  chrome.windows.create({
    url: chrome.runtime.getURL('src/report.html'),
    type: 'popup',
    width: 900,
    height: 800,
  });
}

console.log('[Guardião NBR 17225] Background service worker carregado');
