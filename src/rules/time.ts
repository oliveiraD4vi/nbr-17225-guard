import type { Rule, Violation } from '@/types';
import { createViolation } from '@/utils';

export const refreshControlRule: Rule = {
  id: 'refresh-control',
  nbrReference: '5.16.3',
  name: 'Controle de atualização',
  description: 'Atualizações automáticas da página devem ser controláveis',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];
    const metaRefresh = document.querySelector<HTMLMetaElement>('meta[http-equiv="refresh" i]');

    if (metaRefresh) {
      violations.push(createViolation(refreshControlRule, {
        element: metaRefresh as unknown as HTMLElement,
        message: 'Atualização automática detectada via meta refresh.',
        suggestion: 'Evite atualização automática ou ofereça mecanismo de controle ao usuário.',
        remediationAdvice: `<meta http-equiv="refresh" content="30"> requer alternativa controlável.`,
        customIdPrefix: 'meta-refresh',
      }));
    }

    return violations;
  },
};

export const timeRules: Rule[] = [refreshControlRule];
