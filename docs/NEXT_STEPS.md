# Próximos passos

Este arquivo organiza melhorias recomendadas para aumentar robustez, previsibilidade e qualidade de manutenção do Guardião NBR 17225.

## Prioridade alta

### 1. Ampliar testes automatizados para histórico e revisão humana

Objetivo:

- garantir que persistência e comparação de auditorias não se deteriorem com refactors futuros.

Sugestões:

- testar herança de `humanReviewStatus`, `userNote` e correções de contraste entre auditorias equivalentes;
- testar deduplicação e ordenação do histórico por URL;
- integrar ao fluxo automatizado os testes já criados para compactação e reidratação do histórico persistido;
- testar comparação entre auditorias com itens novos, resolvidos e persistentes;
- testar exclusão visual de itens descartados na revisão humana;
- testar confirmação inline e reorganização visual dos cards na revisão humana;
- ampliar a cobertura automatizada e a execução recorrente dos testes de importação de relatórios JSON válidos e rejeição de arquivos inválidos;
- testar os fluxos de recuperação após `QuotaExceeded`.

Benefício:

- reduz risco de inconsistência silenciosa;
- protege o fluxo mais sensível do produto hoje.

### 2. Tornar o limite de armazenamento previsível antes do erro

Objetivo:

- reduzir surpresa operacional quando o histórico local começar a ficar grande.

Sugestões:

- indicar visualmente quando o volume salvo estiver se aproximando do limite local;
- considerar compactação preventiva antes do primeiro `QuotaExceeded`;
- tornar explícita a política de retenção por URL e a retenção global;
- orientar o usuário sobre quando exportar e reimportar relatórios para continuidade entre ambientes.

Benefício:

- reduz perda de contexto por surpresa de storage;
- melhora a sensação de controle sobre o histórico salvo.

## Prioridade média

### 3. Reduzir heurísticas frágeis nas regras mais sensíveis

Objetivo:

- diminuir ruído, especialmente falsos positivos em verificações sem contexto suficiente.

Sugestões:

- revisar continuamente regras como:
  - `5.7.15`
  - `5.8.10`
  - `5.13.12`
  - `5.16.2`
- quando a automação não puder provar a falha, preferir classificação explícita de confirmação humana;
- documentar em comentários curtos o limite observável de cada heurística mais frágil.
- usar `RULES_HEURISTIC_CLASSIFICATION.md` como base para priorização de endurecimento por regra.

Benefício:

- aproxima o motor do comportamento esperado em ferramentas maduras;
- melhora a confiança no resultado.

### 4. Planejar expansão além do escopo v1

Objetivo:

- preparar a implementação futura das 34 recomendações da ABNT NBR 17225 que ainda não fazem parte do escopo implementado.

Sugestões:

- seguir a ordem proposta em `FUTURE_RULES_PLAN.md`;
- priorizar recomendações com baixa ambiguidade estrutural;
- separar claramente regras realmente automatizáveis de achados que dependem de confirmação humana;
- atualizar a página pública de rastreabilidade da landing no mesmo lote de cada nova regra.

Benefício:

- permite ampliar cobertura sem perder previsibilidade;
- mantém a comunicação pública alinhada ao motor real.

### 5. Melhorar a exportação comparativa

Objetivo:

- tornar os relatórios de evolução mais úteis para acompanhamento real de melhoria ou regressão.

Sugestões:

- incluir resumo executivo padronizado nas exportações;
- indicar com mais clareza itens herdados, confirmados, descartados e pendentes;
- permitir exportação comparativa já consolidada por requisito e recomendação;
- revisar a formatação dos percentuais para leitura mais consistente.

Benefício:

- melhora a utilidade prática do histórico para equipes de produto e acessibilidade.

### 6. Expandir o apoio visual para regras sensíveis

Objetivo:

- aumentar a capacidade de análise assistida sem inflar o número de heurísticas frágeis no motor.

Sugestões:

- ampliar a board de contraste para outros cenários visuais quando houver metadados estruturados suficientes;
- avaliar inclusão de explicações curtas por contexto visual, como texto, componente, gráfico e foco;
- permitir reaproveitar parâmetros ajustados pelo usuário como referência local de correção.

Benefício:

- aproxima a experiência de ferramentas maduras;
- ajuda o usuário a sair do diagnóstico e ir para a correção com menos fricção.

### 7. Refinar performance de renderização do popup

Objetivo:

- reduzir recomputação e rerender em listas, histórico e exportações.

Sugestões:

- estabilizar callbacks e estruturas de dados mais pesadas em `PopupApp.tsx`;
- revisar componentes com listas longas para uso criterioso de `memo`, `useMemo` e `useCallback`;
- evitar recriar arrays de ações e abas quando não houver mudança de dependência real.

Benefício:

- melhora a responsividade;
- reduz custo de manutenção da UI.

### 8. Consolidar a política de tema compartilhado

Objetivo:

- evitar regressões visuais ao evoluir popup, relatório e superfícies do Ant Design.

Sugestões:

- manter variáveis CSS como fonte da verdade do tema;
- continuar resolvendo tokens do Ant Design a partir dessas variáveis, evitando `var(...)` cru dentro do `ConfigProvider`;
- testar explicitamente CTAs principais, tags, modais, drawers, tooltips e popovers em revisões visuais.

Benefício:

- preserva consistência entre superfícies;
- reduz risco de regressão visual em componentes interativos.

## Prioridade baixa

### 9. Ampliar documentação pública do projeto

Objetivo:

- facilitar contribuição externa sem exigir leitura completa do código.

Sugestões:

- adicionar convenções de arquitetura do motor de regras;
- documentar o ciclo completo da auditoria:
  - execução;
  - persistência;
  - histórico;
  - comparação;
  - exportação;
- incluir exemplos de contribuição para novas regras dentro do escopo v1.

### 10. Substituir placeholders da landing por capturas reais do produto

Objetivo:

- alinhar a página pública à experiência real da extensão sem inflar a narrativa institucional.

Sugestões:

- capturar fluxos reais de resumo, revisão humana, histórico, comparação e simulador;
- manter o recorte enxuto, com uma captura por momento essencial da jornada;
- revisar legibilidade das capturas em desktop e mobile.

Benefício:

- reduz abstração na apresentação pública;
- aumenta coerência entre produto e landing.

### 11. Revisar logs e telemetria de depuração local

Objetivo:

- facilitar diagnóstico quando algum fluxo falhar em ambiente real.

Sugestões:

- padronizar logs do bootstrap, content script e auditoria;
- diferenciar claramente:
  - falha de injeção;
  - falha de carregamento de chunk;
  - falha de mensagem;
  - falha de regra.

### 12. Formalizar a política de catálogo de textos

Objetivo:

- evitar regressões em que texto de usuário volte a aparecer fora do catálogo.

Sugestões:

- definir em `CONTRIBUTING.md` que texto de interface, exportação e mensagens visíveis deve usar o catálogo;
- deixar explícito que apenas logs técnicos e heurísticas internas podem permanecer fora do i18n;
- adicionar uma checagem simples em revisão ou script para localizar texto novo fora do catálogo.

Benefício:

- preserva consistência de linguagem;
- reduz retrabalho de revisão textual;
- dificulta reintrodução de mojibake e strings dispersas.

### 13. Formalizar a estratégia de limites de storage

Objetivo:

- tornar previsível o comportamento da extensão quando o `chrome.storage.local` atingir o limite.

Sugestões:

- registrar política de retenção para histórico por URL e retenção global;
- indicar ao usuário, com antecedência, quando o volume salvo estiver alto;
- avaliar compactação preventiva antes de chegar ao erro;
- documentar o critério de exclusão da auditoria mais antiga;
- orientar o uso de exportação e importação como extensão natural da retenção local.

Benefício:

- reduz surpresa operacional;
- torna a recuperação de `QuotaExceeded` mais transparente.

## Backlog futuro fora do escopo implementado

A lista completa das 34 recomendações fora do escopo implementado está em `FUTURE_RULES_PLAN.md`.

Esses itens devem ser tratados como evolução futura do catálogo, não como falha da implementação atual da v1.
