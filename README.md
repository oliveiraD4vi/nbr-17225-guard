# Guardião NBR 17225

Verificador de acessibilidade web para navegadores Chromium, alinhado aos requisitos documentados da ABNT NBR 17225:2025.

## Visão Geral

O Guardião NBR 17225 executa auditorias diretamente na página inspecionada e retorna violações com referência normativa, severidade, sugestão de correção e trecho do elemento afetado.

Funcionalidades principais:

- análise de regras da NBR 17225 por módulos em `src/rules`;
- destaque visual de problemas na página;
- painel de detalhes com sugestões contextualizadas;
- simulação de visão para protanopia, deuteranopia, tritanopia e desfoque;
- exportação de resultados em JSON e CSV;
- página de relatório detalhado.

## Cobertura de Regras

A lista de requisitos vem de `docs/Analise_Documental_NBR17225.xlsx`. O estado atual é:

| Situação | Quantidade |
| --- | ---: |
| Requisitos documentados | 94 |
| Regras implementadas no motor | 94 |
| Regras ausentes | 0 |
| Totalmente automatizáveis | 40 |
| Semi-automatizáveis | 53 |
| Não automatizáveis | 1 |

As duas lacunas encontradas nesta revisão foram corrigidas:

- `5.9.3 Rótulo de campo associado`
- `5.12.9 Uso de texto especial`

Consulte:

- `RULES_ANALYSIS.md` para o resumo por seção, status e critérios de automação;
- `RULES_CODE_MAPPING.md` para o mapeamento regra a regra com o arquivo e a constante correspondente;
- `scripts/verify-rules.mjs` para a verificação automática de cobertura.

## Verificação

Para validar cada regra individualmente contra os requisitos documentados:

```bash
npm run verify:rules
```

O script verifica:

- se cada requisito possui uma regra com o mesmo `nbrReference`;
- se o nível WCAG da regra corresponde ao documento;
- se a categoria de automação corresponde ao documento;
- se não existem referências duplicadas;
- se não existem regras extras fora do catálogo documentado.

Resultado esperado:

```text
Rule verification passed: 94 documented requirements mapped to 94 rule implementation(s).
```

## Instalação

Pré-requisitos:

- Node.js 16+;
- pnpm;
- Chrome, Edge ou navegador Chromium compatível com Manifest V3.

Instale as dependências:

```bash
pnpm install
```

Compile a extensão:

```bash
pnpm build
```

Carregue a pasta `dist/` em `chrome://extensions/` usando a opção "Carregar extensão não empacotada".

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm type-check
npm run verify:rules
```

## Estrutura

```text
nbr-17225-guard/
├── docs/                         # Documentos-fonte de requisitos e funcionalidades
├── scripts/                      # Verificações de cobertura do projeto
├── src/
│   ├── components/               # Componentes React
│   ├── rules/                    # Regras de acessibilidade
│   ├── styles/                   # Estilos
│   ├── types/                    # Tipos TypeScript
│   ├── utils/                    # Utilitários
│   ├── background.ts             # Service worker
│   ├── content.ts                # Content script
│   ├── popup.tsx                 # Popup da extensão
│   └── report.tsx                # Relatório detalhado
├── public/                       # Manifest, bootstrap e ícones
├── package.json
└── vite.config.ts
```

## Desenvolvimento de Regras

Cada regra implementa a interface `Rule` e deve declarar:

- `id`;
- `nbrReference`;
- `name`;
- `description`;
- `severity`;
- `wcagLevel`;
- `category`;
- `check`.

Exemplo:

```typescript
import type { Rule, Violation } from '@/types';

export const myRule: Rule = {
  id: 'my-rule',
  nbrReference: '5.X.X',
  name: 'Nome da regra',
  description: 'Descrição objetiva da regra',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    return [];
  },
};
```

Após adicionar uma regra, exporte-a em `src/rules/index.ts` e execute:

```bash
npm run verify:rules
pnpm type-check
pnpm build
```

## Referências

- ABNT NBR 17225:2025
- WCAG
- React
- Ant Design
- TypeScript
- Chrome Extensions API

## Status

Versão: 1.0.0  
Última atualização: abril de 2026  
Status: em desenvolvimento ativo
