import type { Rule, Violation } from '@/types';
import { createViolation } from '@/utils';

export const audioControlRule: Rule = {
  id: 'audio-control',
  nbrReference: '5.14.7',
  name: 'Controle de áudio',
  description: 'Áudios reproduzidos automaticamente devem oferecer mecanismo de controle',
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
          message: 'Mídia com reprodução automática sem controles visíveis.',
          suggestion: 'Disponibilize controles ou evite reprodução automática.',
          remediationAdvice: `<audio controls autoplay src="audio.mp3"></audio>`,
          customIdPrefix: 'audio-control',
        }));
      }
    });

    return violations;
  },
};

export const mediaRules: Rule[] = [audioControlRule];
