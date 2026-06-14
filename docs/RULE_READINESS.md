# Processo de prontidão das regras

Este documento define como uma regra do catálogo v1 entra ou sai da execução da Beta.
O catálogo completo continua documentado; a auditoria executa apenas regras marcadas como prontas.

## Estado definido para a Beta atual

A Beta atual mantém as 112 regras documentadas para rastreabilidade acadêmica e pública. A auditoria executa 104 regras `ready`; as 8 regras `not_ready` permanecem visíveis na Página do Projeto com a tag `Not ready Beta`, mas não entram na execução nem no cálculo da nota.

## Estados

- `ready`: regra executada pela auditoria e considerada na nota.
- `not_ready`: regra documentada, mas fora da execução e fora da nota da Beta.

Quando o campo `readiness` não aparece na definição da regra, o estado operacional é `ready`.
Toda regra `not_ready` deve ter `readinessReason`.

## Critério para `ready`

Uma regra só deve ser `ready` quando atender a todos os pontos abaixo:

- possui sinal técnico observável no DOM, CSS, ARIA, metadados ou contexto visível;
- tem falso positivo conhecido corrigido ou tratado como revisão humana;
- apresenta mensagem, sugestão e remediação acionáveis;
- foi validada em pelo menos um cenário positivo e um negativo;
- foi testada em `/`, `/rules.html` e `/privacy.html` da Page;
- não depende de consistência entre páginas, a menos que o motor compare páginas de fato.

## Promover de `not_ready` para `ready`

1. Ajustar a heurística ou a implementação da regra.
2. Rodar auditorias nas três páginas da Page: `/`, `/rules.html` e `/privacy.html`.
3. Registrar neste documento:
   - regra e referência NBR;
   - data;
   - páginas testadas;
   - falso positivo corrigido;
   - limite residual;
   - decisão.
4. Remover `readiness: 'not_ready'` e `readinessReason` da regra.
5. Rodar `verify-rules`, `type-check`, `lint`, testes e `build`.

## Rebaixar para `not_ready`

Uma regra deve ser rebaixada quando gerar falso positivo grave, inferir intenção demais ou depender de contexto que o motor ainda não observa.
Nesse caso, marque `readiness: 'not_ready'` imediatamente e registre uma razão curta em `readinessReason`.

## Regras fora da Beta atual

| Regra | Referência | Motivo resumido |
| --- | --- | --- |
| `special-text-usage` | 5.12.9 | Regra manual; sem evidências técnicas suficientes para candidatos confiáveis. |
| `custom-component-semantics` | 5.13.12 | Inferiu intenção interativa demais em cards narrativos. |
| `navigation-consistency` | 5.7.15 | Exige comparar navegação entre páginas. |
| `help-consistency` | 5.7.16 | Exige recorrência entre telas equivalentes. |
| `button-consistency` | 5.8.5 | Depende de equivalência entre páginas e decisões de produto. |
| `location-alternatives` | 5.7.13 | Ausência de busca, breadcrumb ou mapa do site não é confiável em páginas pequenas. |
| `critical-form-prevention` | 5.9.12 | Exige jornada crítica completa e interação com formulário. |
| `data-reentry` | 5.9.15 | Campo repetido não prova reentrada indevida entre etapas. |
