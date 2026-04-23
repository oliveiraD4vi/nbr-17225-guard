(function () {
  const globalScope = globalThis;

  if (globalScope.__nbrGuardBootPromise) {
    return;
  }

  globalScope.__nbrGuardBootPromise = import(chrome.runtime.getURL('content.js')).catch((error) => {
    console.error('[Guardião NBR 17225] Falha ao carregar content.js:', error);
    globalScope.__nbrGuardBootPromise = null;
  });
})();
