/**
 * Motor de auditoria de acessibilidade
 */
import { t } from '@/i18n';
import type { AuditHistoryEntry, AuditResult, Violation } from '@/types';
import {
  dedupeAndSortAuditHistory,
  getDisplayAuditResult,
  getAuditUrlStorageKey,
  inheritViolationStateFromHistory,
} from '@/utils/audit-history';

interface RunAuditOptions {
  includeRecommendations?: boolean;
}

export async function getActiveTab(): Promise<chrome.tabs.Tab & { id: number }> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  if (!activeTab?.id) {
    throw new Error(t('engine.noActiveTab'));
  }

  return activeTab as chrome.tabs.Tab & { id: number };
}

function getTabStorageKey(tabId: number): string {
  return String(tabId);
}

function normalizeAuditResult<T extends AuditResult>(result: T | null): T | null {
  if (!result) return null;

  const violations = result.violations.map((violation) => ({
    ...violation,
    humanReviewStatus: violation.humanReviewStatus ?? (violation.requiresHumanReview ? 'pending' : 'not_applicable'),
  }));
  const humanReviewItems = violations.filter((violation) => violation.requiresHumanReview).length;
  const automatedFindings = violations.length - humanReviewItems;
  const auditId = result.id || `${getAuditUrlStorageKey(result.url)}|${result.timestamp}`;

  return {
    ...result,
    id: auditId,
    includeRecommendations: result.includeRecommendations ?? true,
    violations,
    humanReviewItems: result.humanReviewItems ?? humanReviewItems,
    automatedFindings: result.automatedFindings ?? automatedFindings,
    pageTitle: result.pageTitle ?? '',
  };
}

/**
 * Executa a auditoria de acessibilidade na aba ativa
 */
export async function runAccessibilityAudit(options: RunAuditOptions = {}): Promise<AuditResult> {
  try {
    const activeTab = await getActiveTab();

    if (!activeTab.url || !isSupportedTabUrl(activeTab.url)) {
      throw new Error(t('engine.unsupportedUrl'));
    }

    await ensureContentScriptReady(activeTab.id);

    const response = await chrome.tabs.sendMessage(activeTab.id, {
      action: 'RUN_AUDIT',
      includeRecommendations: options.includeRecommendations ?? false,
    });

    if (response?.error) {
      throw new Error(response.error);
    }

    if (!response?.result) {
      throw new Error(t('engine.contentExecutionError'));
    }

    const result: AuditResult = normalizeAuditResult(response.result)!;
    result.url = activeTab.url;
    result.timestamp = Date.now();
    result.includeRecommendations = options.includeRecommendations ?? false;

    return result;
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao executar auditoria:', error);
    throw error;
  }
}

export async function ensureContentScriptReady(tabId: number): Promise<void> {
  if (await pingContentScript(tabId)) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-bootstrap.js'],
    });
  } catch (error) {
    console.warn('[Guardião NBR 17225] Erro ao injetar content script:', error);
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (await pingContentScript(tabId)) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw new Error(t('engine.domUnavailable'));
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
export async function saveAuditResult(result: AuditResult, tabId?: number): Promise<AuditResult> {
  try {
    const resolvedTabId = tabId ?? (await getActiveTab()).id;
    const data = await chrome.storage.local.get(['auditResultsByTab', 'auditHistoryByUrl']);
    const urlKey = getAuditUrlStorageKey(result.url);
    const history = (data.auditHistoryByUrl as Record<string, AuditHistoryEntry[]> | undefined) ?? {};
    const currentHistory = history[urlKey] ?? [];
    const normalizedResult = inheritViolationStateFromHistory(normalizeAuditResult(result)!, currentHistory);
    const historyEntry: AuditHistoryEntry = normalizedResult as AuditHistoryEntry;
    const auditResultsByTab = {
      ...(data.auditResultsByTab as Record<string, AuditResult> | undefined),
      [getTabStorageKey(resolvedTabId)]: normalizedResult,
    };
    const auditHistoryByUrl = {
      ...history,
      [urlKey]: dedupeAndSortAuditHistory([historyEntry, ...currentHistory]),
    };

    await chrome.storage.local.set({
      auditResult: normalizedResult,
      auditResultsByTab,
      auditHistoryByUrl,
    });

    console.log('[Guardião NBR 17225] Resultado da auditoria salvo');
    return normalizedResult;
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao salvar resultado:', error);
    return result;
  }
}

/**
 * Recupera resultado da auditoria do storage
 */
export async function getAuditResult(tabId?: number): Promise<AuditResult | null> {
  try {
    const resolvedTabId = tabId ?? (await getActiveTab()).id;
    const data = await chrome.storage.local.get('auditResultsByTab');
    const auditResultsByTab = data.auditResultsByTab as Record<string, AuditResult> | undefined;
    return normalizeAuditResult(auditResultsByTab?.[getTabStorageKey(resolvedTabId)] || null);
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao recuperar resultado:', error);
    return null;
  }
}

export async function deleteAuditHistoryEntry(url: string, historyId: string): Promise<AuditHistoryEntry[]> {
  try {
    const data = await chrome.storage.local.get('auditHistoryByUrl');
    const auditHistoryByUrl = {
      ...((data.auditHistoryByUrl as Record<string, AuditHistoryEntry[]> | undefined) ?? {}),
    };
    const urlKey = getAuditUrlStorageKey(url);
    const currentHistory = auditHistoryByUrl[urlKey] ?? [];
    auditHistoryByUrl[urlKey] = currentHistory.filter((entry) => entry.id !== historyId);

    await chrome.storage.local.set({ auditHistoryByUrl });
    return dedupeAndSortAuditHistory(
      auditHistoryByUrl[urlKey].map((entry) => normalizeAuditResult(entry) as AuditHistoryEntry)
    );
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao remover histórico:', error);
    return [];
  }
}

export function getDisplayResultForScope(result: AuditResult | null, includeRecommendations: boolean): AuditResult | null {
  return result ? getDisplayAuditResult(result, includeRecommendations) : null;
}

export async function getAuditHistoryForUrl(url?: string): Promise<AuditHistoryEntry[]> {
  try {
    const resolvedUrl = url ?? (await getActiveTab()).url;
    if (!resolvedUrl) return [];

    const data = await chrome.storage.local.get('auditHistoryByUrl');
    const auditHistoryByUrl = data.auditHistoryByUrl as Record<string, AuditHistoryEntry[]> | undefined;
    return dedupeAndSortAuditHistory(
      (auditHistoryByUrl?.[getAuditUrlStorageKey(resolvedUrl)] || [])
        .map((entry) => normalizeAuditResult(entry) as AuditHistoryEntry)
    );
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
    const urlKey = getAuditUrlStorageKey(normalizedResult.url);
    const currentHistory = auditHistoryByUrl[urlKey] ?? [];
    auditHistoryByUrl[urlKey] = dedupeAndSortAuditHistory(
      currentHistory.map((entry) =>
        entry.id === normalizedResult.id ? normalizedResult as AuditHistoryEntry : entry
      )
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

