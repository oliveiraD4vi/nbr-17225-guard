# Contribuindo

Este guia descreve como propor mudanças na extensão Guardião NBR 17225.

## Escopo

O catálogo tem 146 itens da ABNT NBR 17225: 96 requisitos e 50 recomendações. Correções, testes e melhorias de UX dentro desse escopo são bem-vindas. Mudanças de catálogo precisam atualizar, no mesmo PR, a matriz normativa, os testes da regra e a rastreabilidade pública.

Antes de mexer em regras, leia [`RULES_NORMATIVE_MATRIX.md`](RULES_NORMATIVE_MATRIX.md) e [`HEURISTIC_EVIDENCE_REGISTER.md`](HEURISTIC_EVIDENCE_REGISTER.md). Eles registram o que cada verificação observa e o que continua dependendo de revisão humana.

## Ambiente local

Requisitos: Node.js `^20.19.0` ou `>=22.12.0`, pnpm e um navegador Chromium com Manifest V3.

```bash
pnpm install
```

O `pnpm install` executa `prepare` e ativa os hooks do Husky:

- `pre-commit`: aplica Prettier e ESLint aos arquivos staged;
- `commit-msg`: valida a mensagem do commit;
- `pre-push`: valida os commits enviados e executa `pnpm test` e `pnpm build`.

Validação completa, a mesma exigida em todo PR:

```bash
pnpm format:check
pnpm lint
pnpm type-check
pnpm verify:rules
pnpm test
pnpm build
```

## Fluxo de trabalho

Toda mudança começa por uma [issue](https://github.com/oliveiraD4vi/nbr-17225-guard/issues/new/choose). Use o modelo que melhor descreve o caso: resultado incorreto de regra, bug ou tarefa. A issue é o ticket: ela registra o problema e os critérios de conclusão antes do código.

- Branch: `<tipo>/<issue>/<descricao-curta>`, por exemplo `fix/12/escapa-tooltip`.
- Um PR por issue, com `Closes #<issue>` na descrição. A descrição também traz um resumo do que mudou e por quê, e o que foi verificado manualmente. O que o CI já cobre não precisa ser repetido.
- O PR é integrado com squash. O título do PR vira o commit em `main` e segue o padrão abaixo.
- Mantenha cada PR com um único assunto. Refatorações vão separadas de mudanças de comportamento.

### Mensagens de commit

O projeto usa Conventional Commits, validados por `commitlint.config.mjs`:

```text
tipo(escopo opcional): descrição curta
```

- Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `style` e `revert`.
- Descrição em PT-BR, no presente ou imperativo, começando em minúscula e sem ponto final.
- Cabeçalho com até 100 caracteres.
- Corpo para motivação ou impacto que não caibam na descrição.
- Rodapé para a issue (`Refs #12`) e para breaking changes.

Uma mudança que quebra compatibilidade leva `!` no cabeçalho e é detalhada no rodapé:

```text
feat(schema)!: versiona modelo de violações

BREAKING CHANGE: relatórios antigos passam pela migração ao serem importados.
```

## Diretrizes de código

- Textos visíveis ficam nos catálogos `src/i18n/pt-BR.json` e `src/i18n/rules-pt-BR.json`, nunca soltos em componentes.
- Siga os padrões existentes de tipagem, persistência e nomes de arquivos.
- Uma mudança na auditoria pode afetar a persistência por aba, o histórico por URL, a comparação entre auditorias, a herança de triagem e a exportação. Verifique cada um.

## Regras

### Adicionar ou alterar uma regra

1. Implemente ou ajuste a regra em `src/rules/` e registre-a no agregador de `src/rules/index.ts`.
2. Mantenha `nbrReference`, severidade, nível WCAG e categoria de automação alinhados ao catálogo de `scripts/verify-rules.mjs`.
3. Declare ou herde um modo de verificação (`automatic`, `assisted` ou `manual`). Regras que dependem de várias páginas ou etapas usam o escopo `site` ou `journey` e não inferem esse contexto a partir de uma única página.
4. Toda conclusão assistida preserva confiança, evidência e pergunta de revisão. Um candidato pendente nunca é apresentado como falha confirmada.
5. Escreva nome, descrição, mensagem, sugestão e remediação em `src/i18n/rules-pt-BR.json`.
6. Se a regra exigir novos campos em `Violation`, atualize tipos, persistência, histórico, comparação e exportação.
7. Cubra a regra com cenários positivo, negativo e limítrofe.
8. Atualize a matriz normativa e, para heurísticas fracas, o registro de evidências.
9. Mudanças na matriz exigem atualizar a Página do Projeto (`pnpm sync:rules` no repositório da página). Registre essa pendência na issue e no PR.

### Retirar uma regra da execução

Uma regra que gera falso positivo grave, infere intenção demais ou depende de contexto que o motor não observa deve sair da execução imediatamente:

```ts
readiness: 'not_ready',
readinessReason: 'Motivo curto e verificável.',
```

A regra continua documentada, mas fica fora da auditoria e da nota. `pnpm verify:rules` recusa `not_ready` sem `readinessReason`.

Para voltar à execução, a regra precisa ter sinal observável no DOM, CSS, ARIA ou metadados, falso positivo conhecido corrigido ou tratado como revisão humana, mensagem e remediação acionáveis, e cenários positivo e negativo cobertos. Ela também precisa ter sido auditada em `/`, `/rules.html` e `/privacy.html` da Página do Projeto.

## Página do Projeto

A [Página do Projeto](https://guardiaonbr.com.br) é mantida em um repositório separado. Problemas na página, inclusive na página de regras, devem ser abertos como issue neste repositório.
