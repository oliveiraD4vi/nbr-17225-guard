# Matriz Normativa da V1

Esta matriz formal relaciona o catálogo v1 do repositório com a referência normativa pública disponível.

Importante:

- a coluna "Texto normativo público" usa descritores públicos verificáveis da regra, sem reproduzir integralmente o texto da norma;
- a fonte pública de referência usada nesta revisão foi a cópia pública hospedada pela Câmara dos Deputados e checklists públicos de apoio;
- a matriz cobre apenas o escopo v1 de 94 itens do repositório.

| Regra v1 | Texto normativo público | Implementação atual | Divergência residual |
| --- | --- | --- | --- |
| 5.1.1 | Indicador de foco visível | `keyboard-interaction.ts` `focusIndicatorRule` | Ainda depende do elemento efetivamente focado e de estilo computado; não prova percepção visual completa. |
| 5.1.2 | Elemento em foco totalmente visível | `keyboard-interaction.ts` `focusFullyVisibleRule` | Verifica viewport, não garante ausência de sobreposição por cabeçalhos fixos. |
| 5.1.3 | Elemento em foco parcialmente visível | `keyboard-interaction.ts` `focusPartiallyVisibleRule` | Continua dependente da viewport e do foco real no momento da auditoria. |
| 5.1.4 | Ordem de foco previsível | `keyboard-interaction.ts` `focusOrderRule` | Foco em `tabindex` positivo; não simula navegação completa por teclado. |
| 5.1.6 | Armadilha de foco | `keyboard-interaction.ts` `focusTrapRule` | Usa proxy estrutural de saída; não testa fluxo de foco real nem ESC. |
| 5.1.8 | Conteúdo adicional persistente | `keyboard-interaction.ts` `additionalContentPersistentRule` | Heurística estrutural; não valida persistência real no hover/focus. |
| 5.1.9 | Conteúdo adicional dispensável | `keyboard-interaction.ts` `additionalContentDismissibleRule` | Procura mecanismo de dispensa, mas não testa comportamento efetivo. |
| 5.1.11 | Atalhos de teclado sem tecla modificadora | `keyboard-interaction.ts` `keyboardShortcutRule` | Cobre `accesskey`; não cobre toda lógica JavaScript de atalhos. |
| 5.1.13 | Acessibilidade por teclado parcial | `keyboard-interaction.ts` `keyboardAccessibilityRule` | Melhorado para reduzir ruído em `[onclick]`, mas ainda não executa interação real. |
| 5.2.1 | Texto alternativo para imagens de conteúdo | `images.ts` `imageAltTextRule` | Compatível com escopo v1. |
| 5.2.2 | Texto alternativo para imagens funcionais | `images.ts` `imageFunctionalAltRule` | Compatível com escopo v1. |
| 5.2.3 | Texto alternativo para imagens decorativas | `images.ts` `imageDecorativeRule` | Heurística mais conservadora; ainda depende de inferir uso decorativo. |
| 5.2.4 | Descrição para imagens complexas | `images.ts` `complexImageDescriptionRule` | Continua baseada em indícios; não avalia adequação da descrição. |
| 5.2.5 | Imagens de texto | `images.ts` `imageOfTextRule` | Heurística conservadora; não faz OCR nem decide essencialidade. |
| 5.3.1 | Semântica de cabeçalho | `headings.ts` `headingSemanticRule` | Compatível com escopo v1. |
| 5.3.2 | Uso de cabeçalhos | `headings.ts` `headingUsageRule` | Requer julgamento humano de organização do conteúdo. |
| 5.3.5 | Estrutura de cabeçalhos | `headings.ts` `headingStructureRule` | Compatível com escopo v1. |
| 5.4.1 | Semântica de região | `regions.ts` `regionSemanticRule` | Compatível com escopo v1. |
| 5.4.2 | Uso de regiões | `documental-completeness-a.ts` `regionUsageRule` | Proxy estrutural; não garante organização lógica real. |
| 5.4.5 | Regiões identificadas unicamente | `regions.ts` `uniqueRegionIdentificationRule` | Compatível com escopo v1. |
| 5.5.1 | Semântica de lista | `lists.ts` `listSemanticRule` | Compatível com escopo v1. |
| 5.5.2 | Uso de listas | `documental-completeness-a.ts` `listUsageRule` | Heurística de itens correlatos; depende de revisão humana. |
| 5.6.1 | Semântica de tabela | `tables.ts` `tableSemanticRule` | Compatível com escopo v1. |
| 5.6.2 | Uso de tabelas | `documental-completeness-a.ts` `tableUsageRule` | Heurística de tabela de layout; não decide semanticamente todos os casos. |
| 5.6.3 | Cabeçalhos de tabela | `tables.ts` `tableHeadersRule` | Compatível com escopo v1. |
| 5.6.5 | Título de tabela associado | `tables.ts` `tableCaptionRule` | Compatível com escopo v1. |
| 5.7.1 | Semântica de link | `navigation.ts` `linkSemanticRule` | Compatível com escopo v1. |
| 5.7.2 | Uso de links | `documental-completeness-a.ts` `linkUsageRule` | Heurística restrita a `href` não navegável; não cobre toda intenção do controle. |
| 5.7.4 | Propósito do link no contexto | `documental-completeness-a.ts` `linkPurposeRule` | Lista de textos vagos; não avalia contexto completo. |
| 5.7.12 | Links para contornar blocos de conteúdo | `navigation.ts` `skipLinksRule` | Busca padrão comum de skip link; pode subcobrir implementações alternativas. |
| 5.7.15 | Navegação consistente | `documental-completeness-a.ts` `navigationConsistencyRule` | Só compara blocos repetidos na página atual; não cobre conjunto real de páginas. |
| 5.7.16 | Ajuda consistente | `documental-completeness-a.ts` `helpConsistencyRule` | Mesmo limite de consistência local à página atual. |
| 5.8.1 | Semântica de botão | `controls.ts` `buttonSemanticRule` | Compatível com escopo v1. |
| 5.8.2 | Uso de botões | `documental-completeness-a.ts` `buttonUsageRule` | Heurística de semântica vs ação; não cobre toda intenção. |
| 5.8.3 | Propósito do botão | `documental-completeness-a.ts` `buttonPurposeRule` | Lista de rótulos vagos; depende de contexto. |
| 5.8.5 | Identificação consistente em conjunto de páginas | `documental-completeness-a.ts` `buttonConsistencyRule` | Compara alvos e rótulos locais; não valida conjunto real de páginas. |
| 5.8.7 | Área de acionamento mínima | `controls.ts` `targetSizeRule` | Compatível com escopo v1. |
| 5.8.9 | Mudança de contexto previsível no foco | `documental-completeness-a.ts` `contextChangeOnFocusRule` | Sinaliza risco; não executa a mudança de contexto. |
| 5.8.10 | Mudança de contexto previsível na entrada | `documental-completeness-a.ts` `contextChangeOnInputRule` | Sinaliza risco; não executa submissão/redirect. |
| 5.8.11 | Acionamento por ponteiro único | `documental-completeness-a.ts` `singlePointerRule` | Baseado em eventos de ponteiro; não testa undo/interrupção. |
| 5.8.12 | Operação por gestos de ponteiro | `documental-completeness-a.ts` `pointerGestureRule` | Proxy estrutural; exige validação humana de equivalência. |
| 5.8.13 | Operação por movimento de arrastar | `documental-completeness-a.ts` `dragMovementRule` | Mesmo limite de equivalência funcional. |
| 5.8.14 | Operação por movimento | `documental-completeness-a.ts` `motionOperationRule` | Heurística de evento/indício; não prova alternativa equivalente. |
| 5.9.1 | Rótulo de campo | `forms.ts` `fieldLabelRule` | Compatível com escopo v1. |
| 5.9.2 | Rótulo de campo previsível | `documental-completeness-b.ts` `predictableFieldLabelRule` | Compara chaves locais como `autocomplete`, `name`, `id`; não cobre fluxos entre páginas. |
| 5.9.3 | Rótulo de campo associado | `forms.ts` `associatedFieldLabelRule` | Compatível com escopo v1. |
| 5.9.4 | Rótulo de campo descritivo | `documental-completeness-b.ts` `descriptiveFieldLabelRule` | Lista de rótulos vagos; não avalia semântica completa. |
| 5.9.5 | Textos de ajuda previsíveis | `documental-completeness-b.ts` `predictableHelpTextRule` | Detecta campos complexos sem ajuda associada; previsibilidade visual ainda é humana. |
| 5.9.6 | Campos relacionados | `forms.ts` `relatedFieldsRule` | Compatível com escopo v1. |
| 5.9.7 | Campos obrigatórios | `forms.ts` `requiredFieldsRule` | Compatível com escopo v1. |
| 5.9.8 | Tipo de dado determinado | `forms.ts` `dataTypeRule` | Refinada para reduzir falso positivo; ainda infere tipo por rótulo/atributos. |
| 5.9.9 | Mensagem de erro descritiva | `documental-completeness-b.ts` `descriptiveErrorRule` | Continua heurística textual. |
| 5.9.10 | Sugestão de correção | `documental-completeness-b.ts` `correctionSuggestionRule` | Procura indícios de sugestão; utilidade real continua humana. |
| 5.9.12 | Prevenção de erro para formulários críticos | `documental-completeness-b.ts` `criticalFormPreventionRule` | Heurística de confirmação/revisão; não executa fluxo crítico completo. |
| 5.9.15 | Reentrada de dados | `documental-completeness-b.ts` `dataReentryRule` | Usa indício de campos repetidos; não avalia política real de reuso de dados. |
| 5.9.16 | Validação sensorial ou por movimento | `documental-completeness-b.ts` `sensoryValidationRule` | Mantém caráter de suspeita assistida; depende de confirmação humana. |
| 5.9.18 | Autenticação acessível mínima | `forms.ts` `accessibleAuthenticationRule` | Refinada para indícios mais fortes de CAPTCHA; não avalia alternativa efetiva. |
| 5.10.1 | Características sensoriais | `documental-completeness-b.ts` `sensoryCharacteristicsRule` | Heurística textual; depende de revisão humana. |
| 5.10.2 | Ordem de apresentação | `documental-completeness-b.ts` `presentationOrderRule` | Refinada para reduzir varredura global; ainda não simula leitura assistiva real. |
| 5.10.3 | Orientação de exibição | `documental-completeness-b.ts` `orientationRule` | Agora procura bloqueio/restrição por CSS; ainda não prova operabilidade completa em ambas orientações. |
| 5.10.4 | Design responsivo | `presentation.ts` `responsiveDesignRule` | Continua limitada a sinais básicos de viewport. |
| 5.11.1 | Uso de cores | `documental-completeness-b.ts` `colorUsageRule` | Heurística assistida; julgamento final é humano. |
| 5.11.3 | Contraste para texto (mínimo) | `colors.ts` `textContrastRule` | Melhor deduplicação; ainda usa cor computada e fundo efetivo simplificado. |
| 5.11.4 | Contraste para componentes | `colors.ts` `componentContrastRule` | Melhorado para contraste interno/adjacente; ainda não é análise renderizada completa. |
| 5.11.5 | Contraste para objetos gráficos | `documental-completeness-b.ts` `graphicContrastRule` | Agora restrito a `svg`; ainda não cobre canvas/imagem renderizada complexa. |
| 5.11.6 | Contraste para indicador de foco visível | `documental-completeness-b.ts` `focusIndicatorContrastRule` | Foca no elemento ativo; ainda depende de outline computado. |
| 5.12.1 | Espaçamento entre as linhas | `documental-completeness-b.ts` `lineSpacingRule` | Proxy de overflow/truncamento; não simula ajuste real de espaçamento. |
| 5.12.2 | Espaçamento entre os parágrafos | `documental-completeness-b.ts` `paragraphSpacingRule` | Mesmo limite de proxy estrutural. |
| 5.12.3 | Espaçamento entre as letras | `documental-completeness-b.ts` `letterSpacingRule` | Mesmo limite de proxy estrutural. |
| 5.12.4 | Espaçamento entre as palavras | `documental-completeness-b.ts` `wordSpacingRule` | Mesmo limite de proxy estrutural. |
| 5.12.6 | Largura de blocos de texto | `documental-completeness-b.ts` `textWidthRule` | Verificação estática; não mede conforto real de leitura em todos os contextos. |
| 5.12.7 | Texto redimensionado | `documental-completeness-b.ts` `resizedTextRule` | Refinada para reduzir ruído; ainda é indício estrutural. |
| 5.12.8 | Semântica de texto especial | `text-content.ts` `specialTextSemanticRule` | Compatível com escopo v1. |
| 5.12.9 | Uso de texto especial | `text-content.ts` `specialTextUsageRule` | Mantida como revisão manual, alinhada ao catálogo v1. |
| 5.13.1 | Título da página | `semantics.ts` `pageTitleRule` | Compatível com escopo v1. |
| 5.13.2 | Idioma da página | `semantics.ts` `pageLanguageRule` | Compatível com escopo v1. |
| 5.13.3 | Idioma das partes da página | `documental-completeness-b.ts` `pagePartLanguageRule` | Heurística ficou mais conservadora; ainda não identifica idioma de forma linguística robusta. |
| 5.13.4 | Título do frame | `semantics.ts` `frameTitleRule` | Compatível com escopo v1. |
| 5.13.5 | Zoom não bloqueado | `semantics.ts` `zoomAllowedRule` | Compatível com escopo v1. |
| 5.13.6 | Ordem de leitura | `documental-completeness-b.ts` `readingOrderRule` | Reduzida a sinais relevantes; ainda não simula leitura assistiva completa. |
| 5.13.7 | Texto visível no nome acessível | `documental-completeness-b.ts` `visibleTextInNameRule` | Boa cobertura para mismatch textual; equivalência exata ainda pode exigir revisão humana. |
| 5.13.8 | Mensagens de status | `documental-completeness-b.ts` `statusMessageRule` | Refinada para mensagens visíveis e curtas; ainda não observa injeção dinâmica no momento da mudança. |
| 5.13.10 | Componentes com nome acessível | `semantics.ts` `accessibleNameRule` | Compatível com escopo v1. |
| 5.13.12 | Semântica de componentes customizados | `documental-completeness-b.ts` `customComponentSemanticRule` | Heurística estrutural; semântica correta final continua humana. |
| 5.13.13 | Estados, propriedades e valores de componentes customizados | `semantics.ts` `customStateRule` | Cobre papéis comuns; não cobre todos os widgets possíveis. |
| 5.14.1 | Alternativa em texto para áudio | `documental-completeness-b.ts` `audioTranscriptRule` | Procura indícios de transcrição; equivalência do conteúdo é humana. |
| 5.14.2 | Legendas descritivas para vídeo | `documental-completeness-b.ts` `videoCaptionsRule` | Estrutural; não valida precisão/completude. |
| 5.14.4 | Audiodescrição para vídeo | `documental-completeness-b.ts` `videoAudioDescriptionRule` | Estrutural; não valida adequação. |
| 5.14.7 | Controle de áudio | `media.ts` `audioControlRule` | Compatível com escopo v1. |
| 5.14.9 | Legendas para áudio e vídeo ao vivo | `documental-completeness-b.ts` `liveCaptionsRule` | Indício contextual; sincronização/precisão seguem humanas. |
| 5.15.1 | Controle de animação | `documental-completeness-b.ts` `animationControlRule` | Heurística de presença de controle; eficácia do controle segue humana. |
| 5.15.4 | Flash intermitente limitado | `documental-completeness-b.ts` `flashingContentRule` | Heurística mais conservadora; ainda não mede luminância/frequência como analisador visual dedicado. |
| 5.16.2 | Limite de tempo ajustável | `documental-completeness-b.ts` `adjustableTimeLimitRule` | Refinada com contexto local; ainda não executa o fluxo temporal real. |
| 5.16.3 | Controle de atualização | `time.ts` `refreshControlRule` | Detecta `meta refresh`; não observa todas as atualizações automáticas em JavaScript. |

## Fontes públicas

- Câmara dos Deputados: `ABNTNBR17225AcessibilidadeDigitalparaWeb.pdf`
- AMAWeb / Unifesp: checklist pública de apoio da NBR 17225
