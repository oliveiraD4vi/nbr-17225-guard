# Processo de prontidao das regras

Este documento define como uma regra do catalogo v1 entra ou sai da execucao da Beta.
O catalogo completo continua documentado; a auditoria executa apenas regras marcadas como prontas.

## Estados

- `ready`: regra executada pela auditoria e considerada no score.
- `not_ready`: regra documentada, mas fora da execucao e fora do score da Beta.

Quando o campo `readiness` nao aparece na definicao da regra, o estado operacional e `ready`.
Toda regra `not_ready` deve ter `readinessReason`.

## Criterio para `ready`

Uma regra so deve ser `ready` quando atender a todos os pontos abaixo:

- possui sinal tecnico observavel no DOM, CSS, ARIA, metadados ou contexto visivel;
- tem falso positivo conhecido corrigido ou tratado como revisao humana;
- apresenta mensagem, sugestao e remediacao acionaveis;
- foi validada em pelo menos um cenario positivo e um negativo;
- foi testada em `/`, `/rules.html` e `/privacy.html` da Page;
- nao depende de consistencia entre paginas, a menos que o motor compare paginas de fato.

## Promover de `not_ready` para `ready`

1. Ajustar a heuristica ou a implementacao da regra.
2. Rodar auditorias nas tres paginas da Page: `/`, `/rules.html` e `/privacy.html`.
3. Registrar neste documento:
   - regra e referencia NBR;
   - data;
   - paginas testadas;
   - falso positivo corrigido;
   - limite residual;
   - decisao.
4. Remover `readiness: 'not_ready'` e `readinessReason` da regra.
5. Rodar `verify-rules`, `type-check`, `lint`, testes e `build`.

## Rebaixar para `not_ready`

Uma regra deve ser rebaixada quando gerar falso positivo grave, inferir intencao demais ou depender de contexto que o motor ainda nao observa.
Nesse caso, marque `readiness: 'not_ready'` imediatamente e registre uma razao curta em `readinessReason`.

## Regras fora da Beta atual

| Regra | Referencia | Motivo resumido |
| --- | --- | --- |
| `special-text-usage` | 5.12.9 | Regra manual; sem evidencias tecnicas suficientes para candidatos confiaveis. |
| `custom-component-semantics` | 5.13.12 | Inferiu intencao interativa demais em cards narrativos. |
| `navigation-consistency` | 5.7.15 | Exige comparar navegacao entre paginas. |
| `help-consistency` | 5.7.16 | Exige recorrencia entre telas equivalentes. |
| `button-consistency` | 5.8.5 | Depende de equivalencia entre paginas e decisoes de produto. |
| `location-alternatives` | 5.7.13 | Ausencia de busca, breadcrumb ou mapa do site nao e confiavel em paginas pequenas. |
| `critical-form-prevention` | 5.9.12 | Exige jornada critica completa e interacao com formulario. |
| `data-reentry` | 5.9.15 | Campo repetido nao prova reentrada indevida entre etapas. |
