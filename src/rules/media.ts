import { t } from '@/i18n';
import type { Rule, Violation } from '@/types';
import { createViolation } from '@/utils';

export const audioControlRule: Rule = {
  id: 'audio-control',
  nbrReference: '5.14.7',
  name: t('rules.media.audioControl.name'),
  description: t('rules.media.audioControl.description'),
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLMediaElement>('audio, video').forEach((media) => {
      const autoStarts = media.hasAttribute('autoplay') || (!media.paused && media.currentTime > 0);
      const hasControls = media.hasAttribute('controls');

      if (autoStarts && !hasControls) {
        violations.push(createViolation(audioControlRule, {
          element: media as unknown as HTMLElement,
          message: t('rules.media.audioControl.message'),
          suggestion: t('rules.media.audioControl.suggestion'),
          remediationAdvice: t('rules.media.audioControl.remediation'),
          customIdPrefix: 'audio-control',
        }));
      }
    });

    return violations;
  },
};

export const mediaRules: Rule[] = [audioControlRule];
