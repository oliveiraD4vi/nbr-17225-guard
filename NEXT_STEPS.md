# Próximos passos

Este arquivo organiza melhorias recomendadas para aumentar robustez, previsibilidade e qualidade de manutenção do Guardião NBR 17225.

## Prioridade alta

### 1. Fechar a centralização completa de textos

Objetivo:
- remover strings restantes ainda espalhadas em módulos documentais, exportações e mensagens auxiliares.

Sugestões:
- migrar `documental-completeness-a.ts` e `documental-completeness-b.ts` para o catálogo de i18n;
- centralizar cabeçalhos e colunas das exportações CSV/Markdown/JSON onde ainda houver texto fixo;
- manter todo texto novo em PT-BR UTF-8 com chave semântica estável.

Benefício:
- reduz inconsistência de linguagem;
- simplifica revisão de texto;
- evita regressões de encoding.

### 2. Adicionar testes automatizados para histórico e revisão humana

Objetivo:
- garantir que persistência e comparação de auditorias não se deteriorem com refactors futuros.

Sugestões:
- testar herança de `humanReviewStatus` e `userNote` entre auditorias equivalentes;
- testar deduplicação e ordenação do histórico por URL;
- testar comparação entre auditorias com itens novos, resolvidos e persistentes;
- testar exclusão visual de itens descartados na revisão humana.

Benefício:
- reduz risco de inconsistência silenciosa;
- protege o fluxo mais sensível do produto hoje.

### 3. Tornar mais explícita a diferença entre fonte da verdade por aba e por URL

Objetivo:
- manter a estrutura de storage simples e previsível.

Sugestões:
- revisar o uso residual de `auditResult` global no storage e, se possível, descontinuá-lo de vez;
- documentar claramente:
  - `auditResultsByTab` como estado corrente da aba;
  - `auditHistoryByUrl` como histórico consolidado da URL.

Benefício:
- reduz ambiguidade na manutenção;
- evita bugs de sincronização entre abas.

## Prioridade média

### 4. Reduzir heurísticas frágeis nas regras mais sensíveis

Objetivo:
- diminuir ruído, especialmente falsos positivos em verificações sem contexto suficiente.

Sugestões:
- revisar continuamente regras como:
  - `5.13.3`
  - `5.13.8`
  - `5.15.4`
  - `5.16.2`
- quando a automação não puder provar a falha, preferir classificação explícita de confirmação humana;
- documentar em comentários curtos o limite observável de cada heurística mais frágil.

Benefício:
- aproxima o motor do comportamento esperado em ferramentas maduras;
- melhora confiança no resultado.

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

### 6. Refinar performance de renderização do popup

Objetivo:
- reduzir recomputação e rerender em listas, histórico e exportações.

Sugestões:
- estabilizar callbacks e estruturas de dados mais pesadas em `PopupApp.tsx`;
- revisar componentes com listas longas para uso criterioso de `memo`, `useMemo` e `useCallback`;
- evitar recriar arrays de ações e abas quando não houver mudança de dependência real.

Benefício:
- melhora responsividade;
- reduz custo de manutenção da UI.

## Prioridade baixa

### 7. Ampliar documentação pública do projeto

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

### 8. Revisar logs e telemetria de depuração local

Objetivo:
- facilitar diagnóstico quando algum fluxo falhar em ambiente real.

Sugestões:
- padronizar logs do bootstrap, content script e auditoria;
- diferenciar claramente:
  - falha de injeção;
  - falha de carregamento de chunk;
  - falha de mensagem;
  - falha de regra.

## Backlog futuro fora do escopo v1

Itens da norma já identificados, mas não incluídos na v1:

- `5.2.6`
- `5.4.3`
- `5.4.4`
- `5.7.3`
- `5.8.4`
- `5.12.10`
- `5.12.11`
- `5.12.12`
- `5.12.13`
- `5.13.9`
- `5.13.11`

Esses itens devem ser tratados como evolução futura do catálogo, não como falha da implementação atual da v1.
