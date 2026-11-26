# Guardião NBR 17225

Extensão para navegadores Chromium que audita a acessibilidade de páginas web segundo a ABNT NBR 17225:2025.

O Guardião executa a auditoria na página inspecionada e organiza cada violação com referência normativa, severidade, elemento afetado e evidência. As verificações que dependem de julgamento aparecem como candidatos para revisão humana, nunca como falha confirmada. O resultado não certifica conformidade.

## O que a extensão faz

- Audita a página com somente requisitos ou com requisitos e recomendações, no contexto de página, sessão de site ou jornada.
- Separa os resultados em três modos: automático, assistido e manual. Cada candidato assistido traz evidência e uma pergunta de revisão.
- Destaca os elementos na página e navega pelos itens prioritários.
- Registra a triagem: confirmar, ignorar com motivo ou reabrir. As decisões são herdadas por auditorias equivalentes.
- Mantém histórico local por URL e compara auditorias, separando mudança técnica de decisão de triagem.
- Permite violações manuais a partir de um elemento selecionado, propostas de texto alternativo e uma prévia temporária de correções de contraste.
- Exporta em JSON e CSV e importa relatórios JSON para continuar a análise em outro navegador.
- Simula protanopia, deuteranopia, tritanopia e desfoque como apoio à inspeção visual.

A explicação de cada regra e da nota fica na Página do Projeto, em [`/rules.html`](https://guardiaonbr.com.br/rules.html) e [`/score.html`](https://guardiaonbr.com.br/score.html).

## Cobertura

O catálogo tem 146 itens revisados contra a referência pública da ABNT NBR 17225. Todos têm regra no motor.

| Situação                  | Quantidade |
| ------------------------- | ---------: |
| Requisitos normativos     |         96 |
| Recomendações normativas  |         50 |
| Totalmente automatizáveis |         46 |
| Semi-automatizáveis       |         77 |
| Não automatizáveis        |         23 |

A classificação entre requisito e recomendação vem da própria norma, não do nível WCAG nem da severidade técnica. Uma regra pode produzir uma conclusão automática, um candidato assistido ou um roteiro manual, então a quantidade de regras não indica conformidade. `pnpm verify:rules` confere o motor contra o catálogo.

## Uso

1. Abra o Chrome DevTools na página que deseja auditar e selecione o painel **Guardião NBR 17225**.
2. Comece pelo escopo **Somente requisitos** e execute a auditoria.
3. Revise as violações por regra, severidade ou categoria. O link de cada regra abre a explicação completa na Página do Projeto.
4. Ignore com motivo o que não se aplica ao contexto. Violações abertas já contam como acionáveis, sem precisar de confirmação.
5. Inclua recomendações quando a base obrigatória estiver compreendida.
6. Use **Abrir relatório** para gerar um snapshot imprimível, ou exporte o JSON para continuar em outro ambiente.

O popup apenas orienta o acesso ao painel e abre o relatório da auditoria atual. Se o painel avisar que o armazenamento local está perto do limite, compacte o histórico e exporte os relatórios que precisam ser mantidos.

## Instalação

Requisitos: Node.js `^22.22.2` ou `>=24.15.0`, pnpm e um navegador Chromium com Manifest V3.

```bash
pnpm install
pnpm build
```

Carregue a pasta `dist/` em `chrome://extensions/` com **Carregar sem compactação**.

## Desenvolvimento

```bash
pnpm dev           # servidor de desenvolvimento
pnpm build         # type-check e build da extensão
pnpm lint
pnpm format:check
pnpm type-check
pnpm verify:rules  # motor contra o catálogo normativo
pnpm test
pnpm test:a11y     # build e teste end-to-end com axe
```

```text
docs/        documentação de regras, contribuição e releases
lab/         Guardião Lab (extensão experimental separada)
public/      manifesto e bootstrap do content script
scripts/     verificação de regras, testes e utilitários
src/
  components/  painel DevTools, popup, relatório e simulador
  i18n/        catálogos PT-BR
  rules/       regras do motor de auditoria
  styles/      tema e estilos
  utils/       persistência, histórico, comparação e exportação
tests/       testes end-to-end e fixtures
```

## Documentação

- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md): fluxo de trabalho, commits e como alterar regras.
- [`docs/RULES_NORMATIVE_MATRIX.md`](docs/RULES_NORMATIVE_MATRIX.md): cada regra relacionada à referência normativa e ao limite residual da verificação.
- [`docs/HEURISTIC_EVIDENCE_REGISTER.md`](docs/HEURISTIC_EVIDENCE_REGISTER.md): evidências e limites das heurísticas fracas.
- [`docs/RELEASES.md`](docs/RELEASES.md): política de versão e publicação.
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md): histórico de mudanças.
- [`docs/ACCESSIBILITY_VALIDATION_PROTOCOL.md`](docs/ACCESSIBILITY_VALIDATION_PROTOCOL.md): protocolo de validação com pessoas com deficiência.

## Guardião Lab

O diretório [`lab/`](lab/README.md) contém uma extensão DevTools independente que usa o domínio `Accessibility` do Chrome DevTools Protocol para explorar a árvore de acessibilidade, a ordem de foco, os nós ignorados e as regiões vivas. Ela declara a permissão `debugger` somente no próprio manifesto e não faz parte do pacote principal.

## Projeto

O Guardião NBR 17225 nasceu como projeto acadêmico e a extensão é software livre.

- Página do Projeto: <https://guardiaonbr.com.br>
- Política de privacidade: <https://guardiaonbr.com.br/privacy.html>
- Issues: <https://github.com/oliveiraD4vi/nbr-17225-guard/issues>

A Página do Projeto é mantida em um repositório separado. Problemas na página, inclusive na página de regras, são abertos como issue neste repositório.

## Licença

[MIT](LICENSE)
