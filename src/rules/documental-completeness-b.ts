import type { Rule, Violation } from '@/types';
import {
  createViolation,
  getAccessibleName,
  getAssociatedDescriptionText,
  getAssociatedLabelText,
  getContrastRatio,
  getEffectiveBackgroundColor,
  getElementLanguage,
  getFocusableElements,
  getVisibleText,
  isElementVisible,
  rgbToHex,
} from '@/utils';

function createWarnings(
  rule: Rule,
  elements: HTMLElement[],
  messageFactory: (element: HTMLElement) => string,
  suggestion: string,
  remediationAdvice: string,
  customIdPrefix: string
): Violation[] {
  return elements.map((element) =>
    createViolation(rule, {
      element,
      message: messageFactory(element),
      suggestion,
      remediationAdvice,
      customIdPrefix,
    })
  );
}

const formFieldsSelector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea';
const interactiveSelector = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [tabindex]';
const vagueLabels = ['campo', 'valor', 'digite', 'info', 'informacao', 'informação', 'texto'];

export const predictableFieldLabelRule: Rule = {
  id: 'predictable-field-label',
  nbrReference: '5.9.2',
  name: 'Rótulo de campo previsível',
  description: 'Campos equivalentes devem manter identificação previsível',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const labelsByAutocomplete = new Map<string, Set<string>>();

    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(formFieldsSelector).forEach((field) => {
      const key = (field.getAttribute('autocomplete') || field.name || field.id || '').trim().toLowerCase();
      const label = getAssociatedLabelText(field).trim().toLowerCase();
      if (!key || !label) return;
      if (!labelsByAutocomplete.has(key)) labelsByAutocomplete.set(key, new Set());
      labelsByAutocomplete.get(key)?.add(label);
    });

    const inconsistent = Array.from(labelsByAutocomplete.entries()).find(([, labels]) => labels.size > 1);
    return inconsistent ? [createViolation(predictableFieldLabelRule, {
      element: document.body,
      message: `Campos equivalentes apresentam rótulos diferentes para "${inconsistent[0]}".`,
      suggestion: 'Padronize o rótulo de campos que coletam a mesma informação.',
      remediationAdvice: `Use sempre o mesmo rótulo para campos como e-mail, telefone e CPF em fluxos equivalentes.`,
      customIdPrefix: 'predictable-label',
    })] : [];
  },
};

export const descriptiveFieldLabelRule: Rule = {
  id: 'descriptive-field-label',
  nbrReference: '5.9.4',
  name: 'Rótulo de campo descritivo',
  description: 'Rótulos devem descrever claramente o dado solicitado',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    descriptiveFieldLabelRule,
    Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(formFieldsSelector))
      .filter((field) => {
        if (!isElementVisible(field as unknown as HTMLElement)) return false;
        const label = getAssociatedLabelText(field).trim().toLowerCase();
        return !!label && vagueLabels.includes(label);
      })
      .map((field) => field as unknown as HTMLElement),
    (field) => `Campo com rótulo potencialmente genérico: "${getAssociatedLabelText(field as HTMLInputElement).trim()}".`,
    'Substitua rótulos vagos por identificação específica do dado esperado.',
    `<label for="email">E-mail para contato</label>`,
    'descriptive-label'
  ),
};

export const predictableHelpTextRule: Rule = {
  id: 'predictable-help-text',
  nbrReference: '5.9.5',
  name: 'Textos de ajuda previsíveis',
  description: 'Campos complexos devem expor ajuda e instruções de forma consistente',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const fields = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(formFieldsSelector));
    return createWarnings(
      predictableHelpTextRule,
      fields
        .filter((field) => {
          if (!isElementVisible(field as unknown as HTMLElement)) return false;
          const context = `${getAssociatedLabelText(field)} ${field.placeholder || ''}`.toLowerCase();
          const isComplex = /senha|password|cpf|cnpj|telefone|phone|cep|data|email/.test(context);
          return isComplex && !getAssociatedDescriptionText(field as unknown as HTMLElement).trim() && !field.getAttribute('title')?.trim();
        })
        .map((field) => field as unknown as HTMLElement),
      (field) => `Campo "${getAssociatedLabelText(field as HTMLInputElement) || field.getAttribute('name') || field.id}" sem texto de ajuda associado.`,
      'Associe instruções com aria-describedby ou ajuda textual próxima ao campo.',
      `<small id="senha-ajuda">Use ao menos 8 caracteres.</small><input aria-describedby="senha-ajuda" />`,
      'predictable-help'
    );
  },
};

export const descriptiveErrorRule: Rule = {
  id: 'descriptive-error',
  nbrReference: '5.9.9',
  name: 'Mensagem de erro descritiva',
  description: 'Mensagens de erro devem explicar claramente o problema encontrado',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const vagueErrors = ['inválido', 'invalido', 'erro', 'campo obrigatório', 'required', 'invalid'];
    return createWarnings(
      descriptiveErrorRule,
      Array.from(document.querySelectorAll<HTMLElement>('[role="alert"], [aria-live], .error, .field-error, .invalid-feedback'))
        .filter((element) => {
          const text = getVisibleText(element).trim().toLowerCase();
          return !!text && vagueErrors.some((message) => text === message || text.endsWith(message));
        }),
      (element) => `Mensagem de erro pouco descritiva: "${getVisibleText(element)}".`,
      'Explique qual campo falhou e por qual motivo.',
      `Informe o erro de forma específica, como "O CPF deve conter 11 dígitos".`,
      'descriptive-error'
    );
  },
};

export const correctionSuggestionRule: Rule = {
  id: 'correction-suggestion',
  nbrReference: '5.9.10',
  name: 'Sugestão de correção',
  description: 'Erros de entrada devem oferecer sugestão de correção quando possível',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => {
    const guidanceTerms = ['use', 'informe', 'digite', 'formato', 'deve conter', 'exemplo'];
    return createWarnings(
      correctionSuggestionRule,
      Array.from(document.querySelectorAll<HTMLElement>('[role="alert"], [aria-live], .error, .field-error, .invalid-feedback'))
        .filter((element) => {
          const text = getVisibleText(element).trim().toLowerCase();
          return !!text && !guidanceTerms.some((term) => text.includes(term));
        }),
      () => 'Mensagem de erro sem indicação explícita de como corrigir a entrada.',
      'Inclua instruções ou exemplo do formato esperado.',
      `Exemplo: "Informe o e-mail no formato nome@dominio.com".`,
      'correction-suggestion'
    );
  },
};

export const criticalFormPreventionRule: Rule = {
  id: 'critical-form-prevention',
  nbrReference: '5.9.12',
  name: 'Prevenção de erro para formulários críticos',
  description: 'Ações críticas devem prever revisão, confirmação ou cancelamento',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => {
    const criticalControls = Array.from(document.querySelectorAll<HTMLElement>('button, input[type="submit"], a[href]')).filter((element) => {
      const text = getAccessibleName(element).toLowerCase();
      return /pagar|confirmar compra|finalizar|excluir|cancelar conta|remover definitivamente/.test(text);
    });

    return createWarnings(
      criticalFormPreventionRule,
      criticalControls.filter((element) => {
        const form = element.closest('form');
        const surroundingText = getVisibleText(form || document.body).toLowerCase();
        return !/revisar|confirmar|voltar|cancelar/.test(surroundingText);
      }),
      (element) => `Ação crítica "${getAccessibleName(element)}" sem indício de revisão ou confirmação.`,
      'Inclua revisão, confirmação reversível ou etapa de validação antes da ação final.',
      `Ofereça tela de revisão ou confirmação antes de concluir a operação crítica.`,
      'critical-form'
    );
  },
};

export const dataReentryRule: Rule = {
  id: 'data-reentry',
  nbrReference: '5.9.15',
  name: 'Reentrada de dados',
  description: 'Fluxos não devem exigir redigitação desnecessária de dados já fornecidos',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const repeatedFields = new Map<string, HTMLElement[]>();

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(formFieldsSelector).forEach((field) => {
      const key = `${field.getAttribute('autocomplete') || ''}:${getAssociatedLabelText(field).trim().toLowerCase()}`;
      if (!key || key === ':') return;
      if (!repeatedFields.has(key)) repeatedFields.set(key, []);
      repeatedFields.get(key)?.push(field as unknown as HTMLElement);
    });

    const duplicate = Array.from(repeatedFields.entries()).find(([, fields]) => fields.length > 1);
    return duplicate ? [createViolation(dataReentryRule, {
      element: duplicate[1][0],
      message: `Há múltiplos campos equivalentes para "${duplicate[0]}" na mesma página.`,
      suggestion: 'Avalie se a confirmação ou redigitação é realmente necessária.',
      remediationAdvice: `Reutilize dados já informados ou ofereça preenchimento automático quando possível.`,
      customIdPrefix: 'data-reentry',
    })] : [];
  },
};

export const sensoryValidationRule: Rule = {
  id: 'sensory-validation',
  nbrReference: '5.9.16',
  name: 'Validação sensorial ou por movimento',
  description: 'Validações não devem depender apenas de percepção sensorial ou movimento',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    sensoryValidationRule,
    Array.from(document.querySelectorAll<HTMLElement>('label, legend, p, span, small, .help, .hint'))
      .filter((element) => /vermelh|azul|direita|esquerda|acima|abaixo|agite|balance|mova o dispositivo/.test(getVisibleText(element).toLowerCase())),
    (element) => `Instrução com dependência sensorial detectada: "${getVisibleText(element)}".`,
    'Complemente instruções com texto objetivo, não dependente de cor, posição ou movimento.',
    `Exemplo: "Campos obrigatórios estão marcados com * e descritos como obrigatórios".`,
    'sensory-validation'
  ),
};

export const sensoryCharacteristicsRule: Rule = {
  id: 'sensory-characteristics',
  nbrReference: '5.10.1',
  name: 'Características sensoriais',
  description: 'Instruções não devem depender apenas de forma, cor, tamanho ou posição',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    sensoryCharacteristicsRule,
    Array.from(document.querySelectorAll<HTMLElement>('p, span, li, label, legend, small, strong, em'))
      .filter((element) => /clique no bot[aã]o vermelho|campo à direita|item acima|item abaixo|lado esquerdo|lado direito|círculo verde|retângulo azul/.test(getVisibleText(element).toLowerCase())),
    (element) => `Instrução dependente de característica sensorial: "${getVisibleText(element)}".`,
    'Use referências textuais inequívocas, como nome do campo, botão ou etapa.',
    `Prefira "Selecione o botão Confirmar" em vez de "clique no botão verde".`,
    'sensory-characteristics'
  ),
};

export const presentationOrderRule: Rule = {
  id: 'presentation-order',
  nbrReference: '5.10.2',
  name: 'Ordem de apresentação',
  description: 'A ordem de leitura e navegação deve seguir uma sequência lógica',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('[tabindex]').forEach((element) => {
      const tabIndex = Number(element.getAttribute('tabindex'));
      if (tabIndex > 0) {
        violations.push(createViolation(presentationOrderRule, {
          element,
          message: `Elemento com tabindex positivo (${tabIndex}) pode quebrar a ordem lógica de apresentação.`,
          suggestion: 'Evite tabindex positivo e preserve a sequência natural do DOM.',
          remediationAdvice: `<button>Continuar</button>`,
          customIdPrefix: 'presentation-order',
        }));
      }
    });

    document.querySelectorAll<HTMLElement>('*').forEach((element) => {
      const style = window.getComputedStyle(element);
      if ((style.display.includes('flex') || style.display.includes('grid')) && style.order !== '0') {
        violations.push(createViolation(presentationOrderRule, {
          element,
          message: 'Elemento com reordenação visual via CSS; valide a coerência com a ordem de leitura.',
          suggestion: 'Evite usar order para inverter a ordem lógica de leitura.',
          remediationAdvice: `Prefira ordenar o DOM na sequência correta e use CSS apenas para apresentação.`,
          customIdPrefix: 'presentation-order',
        }));
      }
    });

    return violations;
  },
};

export const orientationRule: Rule = {
  id: 'orientation',
  nbrReference: '5.10.3',
  name: 'Orientação de exibição',
  description: 'O conteúdo deve funcionar em retrato e paisagem, salvo exceções justificadas',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    orientationRule,
    Array.from(document.querySelectorAll<HTMLElement>('p, span, li, small, strong, em'))
      .filter((element) => /gire o dispositivo|use apenas em modo paisagem|use apenas em modo retrato/.test(getVisibleText(element).toLowerCase())),
    (element) => `Conteúdo indica restrição de orientação: "${getVisibleText(element)}".`,
    'Valide se a funcionalidade opera em ambas as orientações ou justifique a exceção.',
    `Evite bloquear a interface para uma única orientação sem necessidade essencial.`,
    'orientation'
  ),
};

export const colorUsageRule: Rule = {
  id: 'color-usage',
  nbrReference: '5.11.1',
  name: 'Uso de cores',
  description: 'Cor não deve ser o único meio de transmitir informação',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    colorUsageRule,
    Array.from(document.querySelectorAll<HTMLElement>('p, span, li, label, legend, small, strong, em'))
      .filter((element) => /em vermelho|em verde|em azul|destacado em amarelo|campos em vermelho|botão verde/.test(getVisibleText(element).toLowerCase())),
    (element) => `Indício de informação transmitida apenas por cor: "${getVisibleText(element)}".`,
    'Adicione texto, ícone, estado programático ou outro indicador além da cor.',
    `Combine cor com rótulo, ícone ou mensagem textual explícita.`,
    'color-usage'
  ),
};

export const graphicContrastRule: Rule = {
  id: 'graphic-contrast',
  nbrReference: '5.11.5',
  name: 'Contraste para objetos gráficos',
  description: 'Objetos gráficos informativos devem ter contraste suficiente',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('svg, canvas, [role="img"]').forEach((element) => {
      if (!isElementVisible(element)) return;
      const style = window.getComputedStyle(element);
      const foreground = rgbToHex(style.color || style.fill || '#000000');
      const background = rgbToHex(getEffectiveBackgroundColor(element));
      const ratio = getContrastRatio(foreground, background);

      if (ratio < 3) {
        violations.push(createViolation(graphicContrastRule, {
          element,
          message: `Objeto gráfico com contraste estimado de ${ratio.toFixed(2)}:1.`,
          suggestion: 'Aumente o contraste do gráfico em relação ao fundo.',
          remediationAdvice: `Use cores com razão mínima próxima de 3:1 para elementos gráficos informativos.`,
          customIdPrefix: 'graphic-contrast',
        }));
      }
    });

    return violations;
  },
};

export const focusIndicatorContrastRule: Rule = {
  id: 'focus-indicator-contrast',
  nbrReference: '5.11.6',
  name: 'Contraste para indicador de foco visual',
  description: 'Indicadores de foco devem ter contraste perceptível com áreas adjacentes',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => {
    const violations: Violation[] = [];

    getFocusableElements().forEach((element) => {
      const style = window.getComputedStyle(element);
      const outlineWidth = parseFloat(style.outlineWidth || '0');
      if (outlineWidth <= 0 || style.outlineStyle === 'none') return;

      const outlineColor = rgbToHex(style.outlineColor || '#000000');
      const background = rgbToHex(getEffectiveBackgroundColor(element));
      const ratio = getContrastRatio(outlineColor, background);

      if (ratio < 3) {
        violations.push(createViolation(focusIndicatorContrastRule, {
          element,
          message: `Indicador de foco com contraste estimado de ${ratio.toFixed(2)}:1.`,
          suggestion: 'Aumente o contraste do outline, box-shadow ou anel de foco.',
          remediationAdvice: `button:focus-visible { outline: 3px solid #005fcc; }`,
          customIdPrefix: 'focus-contrast',
        }));
      }
    });

    return violations;
  },
};

function getTextBlocks(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('p, li, blockquote, td, th, dd, dt, article, section'))
    .filter((element) => isElementVisible(element) && getVisibleText(element).length >= 80);
}

export const lineSpacingRule: Rule = {
  id: 'line-spacing',
  nbrReference: '5.12.1',
  name: 'Espaçamento entre linhas',
  description: 'Conteúdo textual deve suportar aumento de espaçamento entre linhas',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    lineSpacingRule,
    getTextBlocks().filter((element) => {
      const style = window.getComputedStyle(element);
      return style.overflow === 'hidden' && parseFloat(style.lineHeight || '0') > 0 && parseFloat(style.lineHeight || '0') < parseFloat(style.fontSize) * 1.5;
    }),
    () => 'Bloco de texto com line-height baixo e overflow oculto, o que pode quebrar ao aumentar espaçamento.',
    'Evite truncar texto e permita line-height mais amplo.',
    `p { line-height: 1.5; overflow: visible; }`,
    'line-spacing'
  ),
};

export const paragraphSpacingRule: Rule = {
  id: 'paragraph-spacing',
  nbrReference: '5.12.2',
  name: 'Espaçamento entre parágrafos',
  description: 'Parágrafos devem suportar aumento de espaçamento sem perda de conteúdo',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    paragraphSpacingRule,
    Array.from(document.querySelectorAll<HTMLElement>('article, section, main, div'))
      .filter((element) => {
        const paragraphs = element.querySelectorAll('p');
        const style = window.getComputedStyle(element);
        return paragraphs.length >= 2 && style.overflow === 'hidden' && element.getBoundingClientRect().height > 0;
      }),
    () => 'Agrupamento com múltiplos parágrafos e overflow oculto pode falhar com espaçamento ampliado.',
    'Permita expansão vertical do conteúdo textual.',
    `Evite altura fixa e overflow oculto em contêineres de texto.`,
    'paragraph-spacing'
  ),
};

export const letterSpacingRule: Rule = {
  id: 'letter-spacing',
  nbrReference: '5.12.3',
  name: 'Espaçamento entre letras',
  description: 'Texto deve suportar aumento de espaçamento entre letras',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    letterSpacingRule,
    getTextBlocks().filter((element) => {
      const style = window.getComputedStyle(element);
      return style.whiteSpace === 'nowrap' || style.textOverflow === 'ellipsis';
    }),
    () => 'Bloco textual com nowrap ou ellipsis pode falhar ao aumentar o espaçamento entre letras.',
    'Permita quebra de linha e evite truncar texto essencial.',
    `white-space: normal; text-overflow: clip;`,
    'letter-spacing'
  ),
};

export const wordSpacingRule: Rule = {
  id: 'word-spacing',
  nbrReference: '5.12.4',
  name: 'Espaçamento entre palavras',
  description: 'Texto deve suportar aumento de espaçamento entre palavras',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    wordSpacingRule,
    getTextBlocks().filter((element) => {
      const style = window.getComputedStyle(element);
      return style.overflowX === 'hidden' || style.whiteSpace === 'nowrap';
    }),
    () => 'Bloco textual pode não acomodar aumento de espaçamento entre palavras.',
    'Evite restringir horizontalmente blocos de texto longos.',
    `Remova white-space: nowrap e overflow-x: hidden de conteúdos textuais extensos.`,
    'word-spacing'
  ),
};

export const textWidthRule: Rule = {
  id: 'text-width',
  nbrReference: '5.12.6',
  name: 'Largura de blocos de texto',
  description: 'Linhas longas demais dificultam leitura confortável',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    textWidthRule,
    getTextBlocks().filter((element) => parseFloat(window.getComputedStyle(element).width || '0') > 1000),
    () => 'Bloco textual muito largo para leitura confortável em linhas curtas.',
    'Limite a largura de leitura de blocos textuais extensos.',
    `main { max-width: 80ch; }`,
    'text-width'
  ),
};

export const resizedTextRule: Rule = {
  id: 'resized-text',
  nbrReference: '5.12.7',
  name: 'Texto redimensionado',
  description: 'Conteúdo deve suportar aumento de zoom e texto sem perda funcional',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    resizedTextRule,
    Array.from(document.querySelectorAll<HTMLElement>('*'))
      .filter((element) => {
        if (!isElementVisible(element) || getVisibleText(element).length < 40) return false;
        const style = window.getComputedStyle(element);
        return style.overflow === 'hidden' && parseFloat(style.height || '0') > 0;
      }),
    () => 'Conteúdo textual com altura fixa e overflow oculto pode falhar ao ampliar o texto.',
    'Permita crescimento vertical do conteúdo ao ampliar o texto.',
    `Evite altura fixa em contêineres com texto.`,
    'resized-text'
  ),
};

export const pagePartLanguageRule: Rule = {
  id: 'page-part-language',
  nbrReference: '5.13.3',
  name: 'Idioma das partes da página',
  description: 'Trechos em idioma diferente devem ser marcados com lang apropriado',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => {
    const pageLang = document.documentElement.getAttribute('lang') || '';
    return createWarnings(
      pagePartLanguageRule,
      Array.from(document.querySelectorAll<HTMLElement>('blockquote, q, span, em, strong, p, li'))
        .filter((element) => {
          const text = getVisibleText(element).trim();
          if (text.length < 15) return false;
          const hasForeignHint = /\b(login|download|home|privacy policy|terms|checkout|leaderboard|start|finish)\b/i.test(text);
          return hasForeignHint && getElementLanguage(element) === pageLang;
        }),
      (element) => `Trecho com possível conteúdo em idioma diferente sem marcação de lang: "${getVisibleText(element).slice(0, 80)}".`,
      'Marque trechos em outro idioma com o atributo lang correspondente.',
      `<span lang="en">Download</span>`,
      'page-part-language'
    );
  },
};

export const readingOrderRule: Rule = {
  id: 'reading-order',
  nbrReference: '5.13.6',
  name: 'Ordem de leitura',
  description: 'A ordem de leitura assistiva deve acompanhar a sequência lógica do conteúdo',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('[aria-flowto]').forEach((element) => {
      violations.push(createViolation(readingOrderRule, {
        element,
        message: 'Uso de aria-flowto exige validação manual da ordem de leitura resultante.',
        suggestion: 'Prefira ordem natural do DOM e use aria-flowto apenas quando estritamente necessário.',
        remediationAdvice: `Reordene o DOM na sequência correta de leitura.`,
        customIdPrefix: 'reading-order',
      }));
    });

    document.querySelectorAll<HTMLElement>('*').forEach((element) => {
      const style = window.getComputedStyle(element);
      if ((style.display.includes('flex') || style.display.includes('grid')) && style.order !== '0') {
        violations.push(createViolation(readingOrderRule, {
          element,
          message: 'Reordenação visual via CSS pode divergir da ordem de leitura assistiva.',
          suggestion: 'Mantenha a ordem lógica no DOM.',
          remediationAdvice: `Evite depender de CSS order para a sequência principal do conteúdo.`,
          customIdPrefix: 'reading-order',
        }));
      }
    });

    return violations;
  },
};

export const visibleTextInNameRule: Rule = {
  id: 'visible-text-in-name',
  nbrReference: '5.13.7',
  name: 'Texto visível no nome acessível',
  description: 'O nome acessível deve conter o texto visível do controle',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    visibleTextInNameRule,
    Array.from(document.querySelectorAll<HTMLElement>(interactiveSelector))
      .filter((element) => {
        if (!isElementVisible(element)) return false;
        const visible = getVisibleText(element).trim().toLowerCase();
        const accessible = getAccessibleName(element).trim().toLowerCase();
        return !!visible && !!accessible && !accessible.includes(visible);
      }),
    (element) => `Nome acessível não contém o texto visível do controle "${getVisibleText(element)}".`,
    'Alinhe o texto visível com o nome acessível exposto ao leitor de tela.',
    `<button aria-label="Baixar regulamento">Baixar regulamento</button>`,
    'visible-text-name'
  ),
};

export const statusMessageRule: Rule = {
  id: 'status-message',
  nbrReference: '5.13.8',
  name: 'Mensagens de status',
  description: 'Mensagens dinâmicas de status devem ser anunciáveis programaticamente',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    statusMessageRule,
    Array.from(document.querySelectorAll<HTMLElement>('.status, .toast, .snackbar, .alert, .success, .error-message, [data-status], [data-toast]'))
      .filter((element) => !element.hasAttribute('role') && !element.hasAttribute('aria-live')),
    () => 'Possível mensagem de status sem role ou aria-live.',
    'Adicione role="status", role="alert" ou aria-live adequado ao conteúdo dinâmico.',
    `<div role="status" aria-live="polite">Salvo com sucesso</div>`,
    'status-message'
  ),
};

export const customComponentSemanticRule: Rule = {
  id: 'custom-component-semantics',
  nbrReference: '5.13.12',
  name: 'Semântica de componentes customizados',
  description: 'Componentes customizados interativos devem expor função semântica apropriada',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    customComponentSemanticRule,
    Array.from(document.querySelectorAll<HTMLElement>('[onclick], [onkeydown], [tabindex]'))
      .filter((element) => {
        if (!isElementVisible(element)) return false;
        if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(element.tagName)) return false;
        return !element.getAttribute('role');
      }),
    (element) => `Componente customizado interativo sem role semântica: <${element.tagName.toLowerCase()}>.`,
    'Aplique role coerente e comportamento compatível, ou substitua por elemento nativo.',
    `<div role="button" tabindex="0">Abrir</div>`,
    'custom-component-semantics'
  ),
};

export const audioTranscriptRule: Rule = {
  id: 'audio-transcript',
  nbrReference: '5.14.1',
  name: 'Alternativa em texto para áudio',
  description: 'Áudios gravados devem disponibilizar alternativa textual equivalente',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    audioTranscriptRule,
    Array.from(document.querySelectorAll<HTMLElement>('audio, a[href$=".mp3"], a[href$=".wav"], a[href$=".ogg"]'))
      .filter((element) => {
        const container = (element.closest('figure, section, article, div') as HTMLElement | null) || document.body;
        return !/transcri|transcript|roteiro|texto alternativo/.test(getVisibleText(container).toLowerCase());
      }),
    () => 'Áudio sem indício de transcrição ou alternativa textual associada.',
    'Disponibilize transcrição próxima ao áudio ou vinculada a ele.',
    `Inclua link ou bloco com a transcrição completa do conteúdo em áudio.`,
    'audio-transcript'
  ),
};

export const videoCaptionsRule: Rule = {
  id: 'video-captions',
  nbrReference: '5.14.2',
  name: 'Legendas descritivas para vídeo',
  description: 'Vídeos gravados devem oferecer legendas sincronizadas',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    videoCaptionsRule,
    Array.from(document.querySelectorAll<HTMLVideoElement>('video'))
      .filter((video) => !video.querySelector('track[kind="captions"], track[kind="subtitles"]'))
      .map((video) => video as unknown as HTMLElement),
    () => 'Vídeo sem faixa de legenda detectável.',
    'Adicione track de legendas ou equivalente sincronizado.',
    `<video controls><track kind="captions" srclang="pt-BR" src="legendas.vtt" /></video>`,
    'video-captions'
  ),
};

export const audioDescriptionRule: Rule = {
  id: 'audio-description',
  nbrReference: '5.14.4',
  name: 'Audiodescrição para vídeo',
  description: 'Vídeos com informação visual relevante devem oferecer audiodescrição ou alternativa equivalente',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    audioDescriptionRule,
    Array.from(document.querySelectorAll<HTMLVideoElement>('video'))
      .filter((video) => !video.querySelector('track[kind="descriptions"]'))
      .map((video) => video as unknown as HTMLElement),
    () => 'Vídeo sem faixa de audiodescrição detectável; valide a necessidade de alternativa equivalente.',
    'Inclua audiodescrição ou transcrição expandida quando houver informação visual relevante.',
    `<track kind="descriptions" srclang="pt-BR" src="descricao.vtt" />`,
    'audio-description'
  ),
};

export const liveCaptionsRule: Rule = {
  id: 'live-captions',
  nbrReference: '5.14.9',
  name: 'Legendas para áudio e vídeo ao vivo',
  description: 'Transmissões ao vivo devem prever legenda sincronizada quando aplicável',
  severity: 'warning',
  wcagLevel: 'AA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    liveCaptionsRule,
    Array.from(document.querySelectorAll<HTMLElement>('video, iframe, section, article, div'))
      .filter((element) => /ao vivo|live|transmiss[aã]o/.test(getVisibleText(element).toLowerCase()) && !/legenda|caption/.test(getVisibleText(element).toLowerCase())),
    () => 'Indício de mídia ao vivo sem referência a legendas.',
    'Valide e documente a oferta de legendas ao vivo quando houver transmissão síncrona.',
    `Inclua mecanismo de legendagem ao vivo ou indicação clara da alternativa disponível.`,
    'live-captions'
  ),
};

export const animationControlRule: Rule = {
  id: 'animation-control',
  nbrReference: '5.15.1',
  name: 'Controle de animação',
  description: 'Movimento automático prolongado deve poder ser pausado, interrompido ou ocultado',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const violations: Violation[] = [];

    document.querySelectorAll<HTMLElement>('marquee, [data-carousel], [data-slider], [class*="carousel" i], [class*="slider" i]').forEach((element) => {
      const containerText = getVisibleText(element.parentElement || element).toLowerCase();
      if (!/pausar|pause|parar|stop/.test(containerText)) {
        violations.push(createViolation(animationControlRule, {
          element,
          message: 'Elemento com animação/rotação automática sem controle visível de pausa.',
          suggestion: 'Adicione mecanismo para pausar, parar ou ocultar a animação.',
          remediationAdvice: `<button aria-label="Pausar animação">Pausar</button>`,
          customIdPrefix: 'animation-control',
        }));
      }
    });

    document.querySelectorAll<HTMLMediaElement>('video[autoplay], audio[autoplay]').forEach((media) => {
      if (!media.hasAttribute('controls')) {
        violations.push(createViolation(animationControlRule, {
          element: media as unknown as HTMLElement,
          message: 'Mídia em reprodução automática sem controle de pausa visível.',
          suggestion: 'Disponibilize controles ou desative a reprodução automática.',
          remediationAdvice: `<video controls autoplay></video>`,
          customIdPrefix: 'animation-control',
        }));
      }
    });

    return violations;
  },
};

export const flashingContentRule: Rule = {
  id: 'flashing-content',
  nbrReference: '5.15.4',
  name: 'Flash intermitente limitado',
  description: 'Conteúdo não deve piscar de forma potencialmente perigosa',
  severity: 'warning',
  wcagLevel: 'AAA',
  category: 'Semi-Automatizável',
  check: async () => createWarnings(
    flashingContentRule,
    Array.from(document.querySelectorAll<HTMLElement>('*'))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const duration = parseFloat(style.animationDuration || '0');
        const infinite = style.animationIterationCount === 'infinite';
        return duration > 0 && duration < 0.34 && infinite;
      }),
    () => 'Animação rápida e infinita detectada; valide risco de flashes intermitentes.',
    'Evite cintilação rápida ou reduza frequência/intensidade do efeito.',
    `Prefira animações suaves, sem repetição rápida contínua.`,
    'flashing-content'
  ),
};

export const adjustableTimeLimitRule: Rule = {
  id: 'adjustable-time-limit',
  nbrReference: '5.16.2',
  name: 'Limite de tempo ajustável',
  description: 'Limites de tempo devem poder ser estendidos, ajustados ou desativados quando aplicável',
  severity: 'warning',
  wcagLevel: 'A',
  category: 'Semi-Automatizável',
  check: async () => {
    const violations: Violation[] = [];
    const refreshMeta = document.querySelector<HTMLMetaElement>('meta[http-equiv="refresh"]');

    if (refreshMeta) {
      violations.push(createViolation(adjustableTimeLimitRule, {
        element: refreshMeta as unknown as HTMLElement,
        message: 'Atualização temporizada detectada sem mecanismo visível de ajuste ou extensão.',
        suggestion: 'Ofereça extensão, pausa ou desativação do limite de tempo.',
        remediationAdvice: `Evite meta refresh ou forneça controle equivalente ao usuário.`,
        customIdPrefix: 'adjustable-time',
      }));
    }

    document.querySelectorAll<HTMLElement>('p, span, strong, small, div, section').forEach((element) => {
      const text = getVisibleText(element).toLowerCase();
      if (/segundos restantes|tempo restante|sess[aã]o expira|expira em/.test(text) && !/estender|renovar|continuar sessão/.test(text)) {
        violations.push(createViolation(adjustableTimeLimitRule, {
          element,
          message: 'Contagem de tempo detectada sem mecanismo visível de extensão ou ajuste.',
          suggestion: 'Inclua opção para estender, pausar ou remover o limite quando aplicável.',
          remediationAdvice: `<button>Estender sessão</button>`,
          customIdPrefix: 'adjustable-time',
        }));
      }
    });

    return violations;
  },
};

export const documentalCompletenessRulesB: Rule[] = [
  predictableFieldLabelRule,
  descriptiveFieldLabelRule,
  predictableHelpTextRule,
  descriptiveErrorRule,
  correctionSuggestionRule,
  criticalFormPreventionRule,
  dataReentryRule,
  sensoryValidationRule,
  sensoryCharacteristicsRule,
  presentationOrderRule,
  orientationRule,
  colorUsageRule,
  graphicContrastRule,
  focusIndicatorContrastRule,
  lineSpacingRule,
  paragraphSpacingRule,
  letterSpacingRule,
  wordSpacingRule,
  textWidthRule,
  resizedTextRule,
  pagePartLanguageRule,
  readingOrderRule,
  visibleTextInNameRule,
  statusMessageRule,
  customComponentSemanticRule,
  audioTranscriptRule,
  videoCaptionsRule,
  audioDescriptionRule,
  liveCaptionsRule,
  animationControlRule,
  flashingContentRule,
  adjustableTimeLimitRule,
];
