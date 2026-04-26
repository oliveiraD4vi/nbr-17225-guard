/**
 * Agregador de todas as regras de acessibilidade
 * ABNT NBR 17225:2025
 */

import { AUTOMATION_CATEGORIES, type Rule } from '@/types';
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

export const RULE_TOPIC_GROUPS = {
  keyboard: keyboardRules,
  images: imageRules,
  headings: headingRules,
  regions: regionRules,
  lists: listRules,
  tables: tableRules,
  navigation: navigationRules,
  controls: controlRules,
  forms: formRules,
  documentalA: documentalCompletenessRulesA,
  documentalB: documentalCompletenessRulesB,
  presentation: presentationRules,
  colors: colorRules,
  textContent: textContentRules,
  semantics: semanticRules,
  media: mediaRules,
  time: timeRules,
} as const;

export type RuleTopicCategory = keyof typeof RULE_TOPIC_GROUPS;

/**
 * Todas as regras de acessibilidade disponiveis
 */
export const allRules: Rule[] = [
  ...RULE_TOPIC_GROUPS.keyboard,
  ...RULE_TOPIC_GROUPS.images,
  ...RULE_TOPIC_GROUPS.headings,
  ...RULE_TOPIC_GROUPS.regions,
  ...RULE_TOPIC_GROUPS.lists,
  ...RULE_TOPIC_GROUPS.tables,
  ...RULE_TOPIC_GROUPS.navigation,
  ...RULE_TOPIC_GROUPS.controls,
  ...RULE_TOPIC_GROUPS.forms,
  ...RULE_TOPIC_GROUPS.documentalA,
  ...RULE_TOPIC_GROUPS.documentalB,
  ...RULE_TOPIC_GROUPS.presentation,
  ...RULE_TOPIC_GROUPS.colors,
  ...RULE_TOPIC_GROUPS.textContent,
  ...RULE_TOPIC_GROUPS.semantics,
  ...RULE_TOPIC_GROUPS.media,
  ...RULE_TOPIC_GROUPS.time,
];

const ruleTopicEntries = Object.entries(RULE_TOPIC_GROUPS).flatMap(([topic, rules]) =>
  rules.map((rule) => [rule.id, topic as RuleTopicCategory] as const)
);

const ruleTopicById = new Map<string, RuleTopicCategory>(ruleTopicEntries);

/**
 * Regras por nivel WCAG
 */
export const rulesByWCAGLevel = {
  A: allRules.filter((rule) => rule.wcagLevel === 'A'),
  AA: allRules.filter((rule) => rule.wcagLevel === 'AA'),
  AAA: allRules.filter((rule) => rule.wcagLevel === 'AAA'),
};

/**
 * Regras por categoria de automacao
 */
export const rulesByAutomation = {
  [AUTOMATION_CATEGORIES.fully]: allRules.filter((rule) => rule.category === AUTOMATION_CATEGORIES.fully),
  [AUTOMATION_CATEGORIES.semi]: allRules.filter((rule) => rule.category === AUTOMATION_CATEGORIES.semi),
  [AUTOMATION_CATEGORIES.none]: allRules.filter((rule) => rule.category === AUTOMATION_CATEGORIES.none),
};

export function getRuleTopicCategory(ruleId: string): RuleTopicCategory {
  return ruleTopicById.get(ruleId) ?? 'semantics';
}

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
