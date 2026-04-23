# Mapeamento de Regras ABNT NBR 17225

Este documento relaciona todas as regras listadas em [Analise_Documental_NBR17225.xlsx](/C:/Users/davic/Documents/Development/nbr-17225-guard/Analise_Documental_NBR17225.xlsx) com a rotina de verificação correspondente no código.

As funcionalidades agregadas foram conferidas contra [Funcionalidades Propostas.docx](/C:/Users/davic/Documents/Development/nbr-17225-guard/Funcionalidades%20Propostas.docx).

Legenda:

- `Implementada`: existe verificação dedicada no motor.
- Regras marcadas no documento como semi-automatizáveis foram implementadas como heurísticas assistidas. Então, do ponto de vista de cobertura de produto, todas estão implementadas; do ponto de vista normativo, algumas continuam naturalmente dependentes da qualidade da inferência sobre o DOM da página.

## 5.1 Interação por Teclado

| Regra | Status | Código |
| --- | --- | --- |
| 5.1.1 Indicador de foco visível | Implementada | [keyboard-interaction.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/keyboard-interaction.ts) `focusIndicatorRule` |
| 5.1.2 Elemento em foco totalmente visível | Implementada | [keyboard-interaction.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/keyboard-interaction.ts) `focusFullyVisibleRule` |
| 5.1.3 Elemento em foco parcialmente visível | Implementada | [keyboard-interaction.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/keyboard-interaction.ts) `focusPartiallyVisibleRule` |
| 5.1.4 Ordem de foco previsível | Implementada | [keyboard-interaction.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/keyboard-interaction.ts) `focusOrderRule` |
| 5.1.6 Armadilha de foco | Implementada | [keyboard-interaction.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/keyboard-interaction.ts) `focusTrapRule` |
| 5.1.8 Conteúdo adicional persistente | Implementada | [keyboard-interaction.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/keyboard-interaction.ts) `additionalContentPersistentRule` |
| 5.1.9 Conteúdo adicional dispensável | Implementada | [keyboard-interaction.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/keyboard-interaction.ts) `additionalContentDismissibleRule` |
| 5.1.11 Atalhos sem tecla modificadora | Implementada | [keyboard-interaction.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/keyboard-interaction.ts) `keyboardShortcutRule` |
| 5.1.13 Acessibilidade por teclado parcial | Implementada | [keyboard-interaction.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/keyboard-interaction.ts) `keyboardAccessibilityRule` |

## 5.2 Imagens

| Regra | Status | Código |
| --- | --- | --- |
| 5.2.1 Texto alternativo para imagens de conteúdo | Implementada | [images.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/images.ts) `imageAltTextRule` |
| 5.2.2 Texto alternativo para imagens funcionais | Implementada | [images.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/images.ts) `imageFunctionalAltRule` |
| 5.2.3 Texto alternativo para imagens decorativas | Implementada | [images.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/images.ts) `imageDecorativeRule` |
| 5.2.4 Descrição para imagens complexas | Implementada | [images.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/images.ts) `complexImageDescriptionRule` |
| 5.2.5 Imagens de texto | Implementada | [images.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/images.ts) `imageOfTextRule` |

## 5.3 Cabeçalhos

| Regra | Status | Código |
| --- | --- | --- |
| 5.3.1 Semântica de cabeçalho | Implementada | [headings.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/headings.ts) `headingSemanticRule` |
| 5.3.2 Uso de cabeçalhos | Implementada | [headings.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/headings.ts) `headingUsageRule` |
| 5.3.5 Estrutura de cabeçalhos | Implementada | [headings.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/headings.ts) `headingStructureRule` |

## 5.4 Regiões

| Regra | Status | Código |
| --- | --- | --- |
| 5.4.1 Semântica de região | Implementada | [regions.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/regions.ts) `regionSemanticRule` |
| 5.4.2 Uso de regiões | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `regionUsageRule` |
| 5.4.5 Regiões identificadas unicamente | Implementada | [regions.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/regions.ts) `uniqueRegionIdentificationRule` |

## 5.5 Listas

| Regra | Status | Código |
| --- | --- | --- |
| 5.5.1 Semântica de lista | Implementada | [lists.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/lists.ts) `listSemanticRule` |
| 5.5.2 Uso de listas | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `listUsageRule` |

## 5.6 Tabelas

| Regra | Status | Código |
| --- | --- | --- |
| 5.6.1 Semântica de tabela | Implementada | [tables.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/tables.ts) `tableSemanticRule` |
| 5.6.2 Uso de tabelas | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `tableUsageRule` |
| 5.6.3 Cabeçalhos de tabela | Implementada | [tables.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/tables.ts) `tableHeadersRule` |
| 5.6.5 Título de tabela associado | Implementada | [tables.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/tables.ts) `tableCaptionRule` |

## 5.7 Links e Navegação

| Regra | Status | Código |
| --- | --- | --- |
| 5.7.1 Semântica de link | Implementada | [navigation.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/navigation.ts) `linkSemanticRule` |
| 5.7.2 Uso de links | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `linkUsageRule` |
| 5.7.4 Propósito do link no contexto | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `linkPurposeRule` |
| 5.7.12 Links para contornar blocos de conteúdo | Implementada | [navigation.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/navigation.ts) `skipLinksRule` |
| 5.7.15 Navegação consistente | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `navigationConsistencyRule` |
| 5.7.16 Ajuda consistente | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `helpConsistencyRule` |

## 5.8 Botões e Controles

| Regra | Status | Código |
| --- | --- | --- |
| 5.8.1 Semântica de botão | Implementada | [controls.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/controls.ts) `buttonSemanticRule` |
| 5.8.2 Uso de botões | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `buttonUsageRule` |
| 5.8.3 Propósito do botão | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `buttonPurposeRule` |
| 5.8.5 Identificação consistente | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `buttonConsistencyRule` |
| 5.8.7 Área de acionamento mínima | Implementada | [controls.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/controls.ts) `targetSizeRule` |
| 5.8.9 Mudança de contexto previsível no foco | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `contextChangeOnFocusRule` |
| 5.8.10 Mudança de contexto previsível na entrada | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `contextChangeOnInputRule` |
| 5.8.11 Acionamento por ponteiro único | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `singlePointerRule` |
| 5.8.12 Operação por gestos de ponteiro | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `pointerGestureRule` |
| 5.8.13 Operação por movimento de arrastar | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `dragMovementRule` |
| 5.8.14 Operação por movimento | Implementada | [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) `motionOperationRule` |

## 5.9 Formulários e Entrada de Dados

| Regra | Status | Código |
| --- | --- | --- |
| 5.9.1 Rótulo de campo | Implementada | [forms.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/forms.ts) `fieldLabelRule` |
| 5.9.2 Rótulo de campo previsível | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `predictableFieldLabelRule` |
| 5.9.3 Rótulo de campo associado | Implementada | [forms.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/forms.ts) `fieldLabelRule` |
| 5.9.4 Rótulo de campo descritivo | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `descriptiveFieldLabelRule` |
| 5.9.5 Textos de ajuda previsíveis | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `predictableHelpTextRule` |
| 5.9.6 Campos relacionados | Implementada | [forms.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/forms.ts) `relatedFieldsRule` |
| 5.9.7 Campos obrigatórios | Implementada | [forms.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/forms.ts) `requiredFieldsRule` |
| 5.9.8 Tipo de dado determinado | Implementada | [forms.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/forms.ts) `dataTypeRule` |
| 5.9.9 Mensagem de erro descritiva | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `descriptiveErrorRule` |
| 5.9.10 Sugestão de correção | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `correctionSuggestionRule` |
| 5.9.12 Prevenção de erro para formulários críticos | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `criticalFormPreventionRule` |
| 5.9.15 Reentrada de dados | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `dataReentryRule` |
| 5.9.16 Validação sensorial ou por movimento | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `sensoryValidationRule` |
| 5.9.18 Autenticação acessível mínima | Implementada | [forms.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/forms.ts) `accessibleAuthenticationRule` |

## 5.10 Apresentação

| Regra | Status | Código |
| --- | --- | --- |
| 5.10.1 Características sensoriais | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `sensoryCharacteristicsRule` |
| 5.10.2 Ordem de apresentação | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `presentationOrderRule` |
| 5.10.3 Orientação de exibição | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `orientationRule` |
| 5.10.4 Design responsivo | Implementada | [presentation.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/presentation.ts) `responsiveDesignRule` |

## 5.11 Uso de Cores

| Regra | Status | Código |
| --- | --- | --- |
| 5.11.1 Uso de cores | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `colorUsageRule` |
| 5.11.3 Contraste para texto | Implementada | [colors.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/colors.ts) `textContrastRule` |
| 5.11.4 Contraste para componentes | Implementada | [colors.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/colors.ts) `componentContrastRule` |
| 5.11.5 Contraste para objetos gráficos | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `graphicContrastRule` |
| 5.11.6 Contraste para indicador de foco visual | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `focusIndicatorContrastRule` |

## 5.12 Conteúdo Textual

| Regra | Status | Código |
| --- | --- | --- |
| 5.12.1 Espaçamento entre linhas | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `lineSpacingRule` |
| 5.12.2 Espaçamento entre parágrafos | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `paragraphSpacingRule` |
| 5.12.3 Espaçamento entre letras | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `letterSpacingRule` |
| 5.12.4 Espaçamento entre palavras | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `wordSpacingRule` |
| 5.12.6 Largura de blocos de texto | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `textWidthRule` |
| 5.12.7 Texto redimensionado | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `resizedTextRule` |
| 5.12.8 Semântica de texto especial | Implementada | [text-content.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/text-content.ts) `specialTextSemanticRule` |
| 5.12.9 Uso de texto especial | Implementada | [text-content.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/text-content.ts) `specialTextSemanticRule` |

## 5.13 Codificação e Marcação Semântica

| Regra | Status | Código |
| --- | --- | --- |
| 5.13.1 Título da página | Implementada | [semantics.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/semantics.ts) `pageTitleRule` |
| 5.13.2 Idioma da página | Implementada | [semantics.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/semantics.ts) `pageLanguageRule` |
| 5.13.3 Idioma das partes da página | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `pagePartLanguageRule` |
| 5.13.4 Título de frame | Implementada | [semantics.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/semantics.ts) `frameTitleRule` |
| 5.13.5 Zoom não bloqueado | Implementada | [semantics.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/semantics.ts) `zoomAllowedRule` |
| 5.13.6 Ordem de leitura | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `readingOrderRule` |
| 5.13.7 Texto visível no nome acessível | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `visibleTextInNameRule` |
| 5.13.8 Mensagens de status | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `statusMessageRule` |
| 5.13.10 Componentes com nome acessível | Implementada | [semantics.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/semantics.ts) `accessibleNameRule` |
| 5.13.12 Semântica de componentes customizados | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `customComponentSemanticRule` |
| 5.13.13 Estados, propriedades e valores de componentes customizados | Implementada | [semantics.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/semantics.ts) `customStateRule` |

## 5.14 Áudio e Vídeo

| Regra | Status | Código |
| --- | --- | --- |
| 5.14.1 Alternativa em texto para áudio | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `audioTranscriptRule` |
| 5.14.2 Legendas descritivas para vídeo | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `videoCaptionsRule` |
| 5.14.4 Audiodescrição para vídeo | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `audioDescriptionRule` |
| 5.14.7 Controle de áudio | Implementada | [media.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/media.ts) `audioControlRule` |
| 5.14.9 Legendas para áudio e vídeo ao vivo | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `liveCaptionsRule` |

## 5.15 Animação

| Regra | Status | Código |
| --- | --- | --- |
| 5.15.1 Controle de animação | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `animationControlRule` |
| 5.15.4 Flash intermitente limitado | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `flashingContentRule` |

## 5.16 Tempo

| Regra | Status | Código |
| --- | --- | --- |
| 5.16.2 Limite de tempo ajustável | Implementada | [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts) `adjustableTimeLimitRule` |
| 5.16.3 Controle de atualização | Implementada | [time.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/time.ts) `refreshControlRule` |

## Funcionalidades Propostas

| Funcionalidade | Status | Código |
| --- | --- | --- |
| Destaque visual de problemas | Implementada | [content.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/content.ts), [PopupApp.tsx](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/components/PopupApp.tsx) |
| Painel de detalhes e sugestões contextualizadas | Implementada | [ViolationsList.tsx](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/components/ViolationsList.tsx), [ViolationsSummary.tsx](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/components/ViolationsSummary.tsx) |
| Simulação de visão | Implementada | [VisionSimulator.tsx](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/components/VisionSimulator.tsx), [content.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/content.ts) |
| Exportação simplificada de relatórios | Implementada | [PopupApp.tsx](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/components/PopupApp.tsx), [report.tsx](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/report.tsx) |

## Observações

- O agregador final das verificações está em [index.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/index.ts).
- As regras complementares para cobertura do `Análise Documental` foram centralizadas em [documental-completeness-a.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-a.ts) e [documental-completeness-b.ts](/C:/Users/davic/Documents/Development/nbr-17225-guard/src/rules/documental-completeness-b.ts).
- Regras semi-automatizáveis continuam dependentes da qualidade heurística do DOM inspecionado, mas agora todas possuem verificação dedicada no motor.
