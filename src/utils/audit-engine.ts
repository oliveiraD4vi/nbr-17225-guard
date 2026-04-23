/**
 * Motor de auditoria de acessibilidade
 */
import type { AuditResult } from '@/types';

export async function getActiveTab(): Promise<chrome.tabs.Tab & { id: number }> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (!activeTab?.id) {
    throw new Error('Nenhuma aba ativa encontrada.');
  }

  return activeTab as chrome.tabs.Tab & { id: number };
}

function getTabStorageKey(tabId: number): string {
  return String(tabId);
}

/**
 * Executa a auditoria de acessibilidade na aba ativa
 */
export async function runAccessibilityAudit(): Promise<AuditResult> {
  try {
    const activeTab = await getActiveTab();

    if (!activeTab.url || !isSupportedTabUrl(activeTab.url)) {
      throw new Error('A auditoria só pode ser executada em páginas http(s) ou arquivos locais com permissão.');
    }

    await ensureContentScriptReady(activeTab.id);

    const response = await chrome.tabs.sendMessage(activeTab.id, {
      action: 'RUN_AUDIT',
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    if (!response?.result) {
      throw new Error('Erro ao executar a auditoria no content script.');
    }

    const result: AuditResult = response.result;
    result.url = activeTab.url;
    result.timestamp = Date.now();

    return result;
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao executar auditoria:', error);
    throw error;
  }
}

async function ensureContentScriptReady(tabId: number): Promise<void> {
  if (await pingContentScript(tabId)) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-bootstrap.js'],
    });
  } catch (error) {
    console.warn('[Guardião NBR 17225] Erro ao injetar content script:', error);
  }

  if (await pingContentScript(tabId)) return;

  throw new Error('Não foi possível acessar o DOM da página. Recarregue a aba e tente novamente.');
}

async function pingContentScript(tabId: number): Promise<boolean> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    return response?.status === 'OK';
  } catch {
    return false;
  }
}

function isSupportedTabUrl(url: string): boolean {
  return /^(https?:|file:)/.test(url);
}

/**
 * Reseta o cache de auditoria da aba ativa
 */
export async function resetAuditCache(): Promise<void> {
  try {
    const activeTab = await getActiveTab();
    const data = await chrome.storage.local.get('auditResultsByTab');
    const auditResultsByTab = { ...(data.auditResultsByTab as Record<string, AuditResult> | undefined) };

    delete auditResultsByTab[getTabStorageKey(activeTab.id)];

    await chrome.storage.local.set({
      auditResult: null,
      auditResultsByTab,
    });

    console.log('[Guardião NBR 17225] Cache de auditoria limpo para a aba ativa');
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao limpar cache:', error);
  }
}

/**
 * Salva resultado da auditoria no storage
 */
export async function saveAuditResult(result: AuditResult, tabId?: number): Promise<void> {
  try {
    const resolvedTabId = tabId ?? (await getActiveTab()).id;
    const data = await chrome.storage.local.get('auditResultsByTab');
    const auditResultsByTab = {
      ...(data.auditResultsByTab as Record<string, AuditResult> | undefined),
      [getTabStorageKey(resolvedTabId)]: result,
    };

    await chrome.storage.local.set({
      auditResult: result,
      auditResultsByTab,
    });

    console.log('[Guardião NBR 17225] Resultado da auditoria salvo');
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao salvar resultado:', error);
  }
}

/**
 * Recupera resultado da auditoria do storage
 */
export async function getAuditResult(tabId?: number): Promise<AuditResult | null> {
  try {
    const resolvedTabId = tabId ?? (await getActiveTab()).id;
    const data = await chrome.storage.local.get(['auditResult', 'auditResultsByTab']);
    const auditResultsByTab = data.auditResultsByTab as Record<string, AuditResult> | undefined;
    const result = auditResultsByTab?.[getTabStorageKey(resolvedTabId)] || null;

    await chrome.storage.local.set({ auditResult: result });

    return result;
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao recuperar resultado:', error);
    return null;
  }
}
