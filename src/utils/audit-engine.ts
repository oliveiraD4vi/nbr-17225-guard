/**
 * Motor de auditoria de acessibilidade
 */
import type { AuditHistoryEntry, AuditResult } from '@/types';

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

function getUrlStorageKey(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

function normalizeAuditResult<T extends AuditResult>(result: T | null): T | null {
  if (!result) return null;

  const violations = result.violations.map((violation) => ({
    ...violation,
    humanReviewStatus: violation.humanReviewStatus ?? (violation.requiresHumanReview ? 'pending' : 'not_applicable'),
  }));
  const humanReviewItems = violations.filter((violation) => violation.requiresHumanReview).length;
  const automatedFindings = result.violations.length - humanReviewItems;
  const auditId = result.id || `${getUrlStorageKey(result.url)}|${result.timestamp}`;

  return {
    ...result,
    id: auditId,
    violations,
    humanReviewItems: result.humanReviewItems ?? humanReviewItems,
    automatedFindings: result.automatedFindings ?? automatedFindings,
    pageTitle: result.pageTitle ?? '',
  };
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

    const result: AuditResult = normalizeAuditResult(response.result)!;
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
    const data = await chrome.storage.local.get(['auditResultsByTab', 'auditHistoryByUrl']);
    const urlKey = getUrlStorageKey(result.url);
    const history = (data.auditHistoryByUrl as Record<string, AuditHistoryEntry[]> | undefined) ?? {};
    const currentHistory = history[urlKey] ?? [];
    const normalizedResult = normalizeAuditResult(result)!;
    const historyEntry: AuditHistoryEntry = normalizedResult as AuditHistoryEntry;
    const auditResultsByTab = {
      ...(data.auditResultsByTab as Record<string, AuditResult> | undefined),
      [getTabStorageKey(resolvedTabId)]: normalizedResult,
    };
    const auditHistoryByUrl = {
      ...history,
      [urlKey]: [historyEntry, ...currentHistory]
        .filter((entry, index, entries) =>
          entries.findIndex((candidate) => candidate.id === entry.id) === index
        )
        .slice(0, 10),
    };

    await chrome.storage.local.set({
      auditResult: normalizedResult,
      auditResultsByTab,
      auditHistoryByUrl,
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
    const result = normalizeAuditResult(auditResultsByTab?.[getTabStorageKey(resolvedTabId)] || null);

    await chrome.storage.local.set({ auditResult: result });

    return result;
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao recuperar resultado:', error);
    return null;
  }
}

export async function getAuditHistoryForUrl(url?: string): Promise<AuditHistoryEntry[]> {
  try {
    const resolvedUrl = url ?? (await getActiveTab()).url;
    if (!resolvedUrl) return [];

    const data = await chrome.storage.local.get('auditHistoryByUrl');
    const auditHistoryByUrl = data.auditHistoryByUrl as Record<string, AuditHistoryEntry[]> | undefined;
    return (auditHistoryByUrl?.[getUrlStorageKey(resolvedUrl)] || []).map((entry) => normalizeAuditResult(entry) as AuditHistoryEntry);
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao recuperar histórico:', error);
    return [];
  }
}

export async function updateStoredAuditResult(updatedResult: AuditResult, tabId?: number): Promise<void> {
  try {
    const normalizedResult = normalizeAuditResult(updatedResult);
    if (!normalizedResult) return;

    const resolvedTabId = tabId ?? (await getActiveTab()).id;
    const data = await chrome.storage.local.get(['auditResult', 'auditResultsByTab', 'auditHistoryByUrl']);
    const storedAuditResult = normalizeAuditResult(data.auditResult as AuditResult | null);
    const auditResultsByTab = {
      ...(data.auditResultsByTab as Record<string, AuditResult> | undefined),
    };
    const currentTabResult = auditResultsByTab[getTabStorageKey(resolvedTabId)];

    if (currentTabResult?.id === normalizedResult.id) {
      auditResultsByTab[getTabStorageKey(resolvedTabId)] = normalizedResult;
    }

    const auditHistoryByUrl = {
      ...((data.auditHistoryByUrl as Record<string, AuditHistoryEntry[]> | undefined) ?? {}),
    };
    const urlKey = getUrlStorageKey(normalizedResult.url);
    const currentHistory = auditHistoryByUrl[urlKey] ?? [];
    auditHistoryByUrl[urlKey] = currentHistory.map((entry) =>
      entry.id === normalizedResult.id ? normalizedResult as AuditHistoryEntry : entry
    );

    await chrome.storage.local.set({
      auditResult: storedAuditResult?.id === normalizedResult.id ? normalizedResult : storedAuditResult,
      auditResultsByTab,
      auditHistoryByUrl,
    });
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao atualizar auditoria persistida:', error);
  }
}
