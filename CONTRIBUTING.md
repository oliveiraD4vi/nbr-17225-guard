# Contribuindo

Obrigado por considerar uma contribuição para o Guardião NBR 17225.

## Escopo atual

A versão 1 deste projeto trabalha com um catálogo fechado de 94 itens, derivado de `docs/Analise_Documental_NBR17225.xlsx`.

Neste momento:
- correções de implementação dentro desse escopo são bem-vindas;
- melhorias de UX, performance, robustez e testes são bem-vindas;
- itens da norma fora do escopo v1 devem entrar como proposta futura, não como alteração direta do catálogo atual, salvo alinhamento explícito no repositório.

## Antes de abrir uma contribuição

Leia estes arquivos:
- `README.md`
- `RULES_ANALYSIS.md`
- `RULES_CODE_MAPPING.md`
- `RULES_NORMATIVE_MATRIX.md`

Eles explicam o escopo atual, o mapeamento das regras e as divergências residuais já conhecidas.

## Ambiente local

Pré-requisitos:
- Node.js
- pnpm
- navegador Chromium compatível com Manifest V3

Instalação:

```bash
pnpm install
```

Validação local:

```bash
pnpm type-check
pnpm build
pnpm verify:rules
```

## Diretrizes de contribuição

- mantenha o texto da interface em português brasileiro UTF-8;
- concentre novos textos no catálogo de i18n, evitando strings soltas em componentes;
- preserve o escopo v1 das regras;
- prefira mudanças pequenas e bem delimitadas;
- siga os padrões já existentes de tipagem, persistência e nomes de arquivos;
- não misture refatoração ampla com correção funcional se isso puder ser separado;
- ao mexer em auditoria, valide impacto em:
  - persistência por aba;
  - histórico por URL;
  - comparação entre auditorias;
  - herança de revisão humana;
  - exportação.

## Regras fora do escopo v1

Os itens abaixo já foram identificados como candidatos a contribuições futuras, mas não fazem parte da implementação da v1:

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

## Pull requests

Ao abrir um PR, descreva:
- o problema;
- a abordagem adotada;
- os riscos conhecidos;
- como validar a mudança;
- se houve impacto em regra, UI, persistência, exportação ou comparação de histórico.

Isso reduz retrabalho de revisão e torna a mudança mais fácil de manter.
