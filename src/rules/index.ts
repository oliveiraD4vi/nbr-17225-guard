/**
 * Agregador de todas as regras de acessibilidade
 * ABNT NBR 17225:2025
 */

import type { Rule } from '@/types';
import { colorRules } from './colors';
import { controlRules } from './controls';
import { documentalCompletenessRulesA } from './documental-completeness-a';
import { documentalCompletenessRulesB } from './documental-completeness-b';
import { formRules } from './forms';
import { headingRules } from './headings';
import { imageRules } from './images';
import { keyboardRules } from './keyboard-interaction';
import { listRules } from './lists';
import { mediaRules } from './media';
import { navigationRules } from './navigation';
import { presentationRules } from './presentation';
import { regionRules } from './regions';
import { semanticRules } from './semantics';
import { tableRules } from './tables';
import { textContentRules } from './text-content';
import { timeRules } from './time';

/**
 * Todas as regras de acessibilidade disponiveis
 */
export const allRules: Rule[] = [
  ...keyboardRules,
  ...imageRules,
  ...headingRules,
  ...regionRules,
  ...listRules,
  ...tableRules,
  ...navigationRules,
  ...controlRules,
  ...formRules,
  ...documentalCompletenessRulesA,
  ...documentalCompletenessRulesB,
  ...presentationRules,
  ...colorRules,
  ...textContentRules,
  ...semanticRules,
  ...mediaRules,
  ...timeRules,
];

/**
 * Regras por nivel WCAG
 */
export const rulesByWCAGLevel = {
  A: allRules.filter(r => r.wcagLevel === 'A'),
  AA: allRules.filter(r => r.wcagLevel === 'AA'),
  AAA: allRules.filter(r => r.wcagLevel === 'AAA'),
};

/**
 * Regras por categoria de automacao
 */
export const rulesByAutomation = {
  'Totalmente Automatizável': allRules.filter(r => r.category === 'Totalmente Automatizável'),
  'Semi-Automatizável': allRules.filter(r => r.category === 'Semi-Automatizável'),
};

export {
  keyboardRules,
  imageRules,
  headingRules,
  regionRules,
  listRules,
  tableRules,
  navigationRules,
  controlRules,
  documentalCompletenessRulesA,
  documentalCompletenessRulesB,
  formRules,
  presentationRules,
  colorRules,
  textContentRules,
  semanticRules,
  mediaRules,
  timeRules,
};
