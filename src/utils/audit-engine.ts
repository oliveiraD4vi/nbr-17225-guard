/**
 * Motor de auditoria de acessibilidade
 */
import type { AuditResult } from '@/types';

/**
 * Executa a auditoria de acessibilidade na aba ativa
 */
export async function runAccessibilityAudit(): Promise<AuditResult> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (!activeTab?.id) {
      throw new Error('Nenhuma aba ativa encontrada.');
    }

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
      throw new Error('Erro ao executar auditoria no content script.');
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
 * Reseta o cache de auditoria
 */
export async function resetAuditCache(): Promise<void> {
  try {
    await chrome.storage.local.remove('auditResult');
    console.log('[Guardião NBR 17225] Cache de auditoria limpo');
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao limpar cache:', error);
  }
}

/**
 * Salva resultado da auditoria no storage
 */
export async function saveAuditResult(result: AuditResult): Promise<void> {
  try {
    await chrome.storage.local.set({ auditResult: result });
    console.log('[Guardião NBR 17225] Resultado da auditoria salvo');
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao salvar resultado:', error);
  }
}

/**
 * Recupera resultado da auditoria do storage
 */
export async function getAuditResult(): Promise<AuditResult | null> {
  try {
    const data = await chrome.storage.local.get('auditResult');
    return (data.auditResult as AuditResult) || null;
  } catch (error) {
    console.error('[Guardião NBR 17225] Erro ao recuperar resultado:', error);
    return null;
  }
}
