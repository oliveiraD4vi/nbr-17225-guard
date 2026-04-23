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

O escopo da versão 1 vem de `docs/Analise_Documental_NBR17225.xlsx`. O catálogo local da v1 contém 94 itens.

O estado atual desse catálogo v1 é:

| Situação | Quantidade |
| --- | ---: |
| Requisitos documentados | 94 |
| Regras implementadas no motor | 94 |
| Regras ausentes | 0 |
| Totalmente automatizáveis | 40 |
| Semi-automatizáveis | 53 |
| Não automatizáveis | 1 |

As duas lacunas anteriormente encontradas no mapeamento foram corrigidas:

- `5.9.3 Rótulo de campo associado`
- `5.12.9 Uso de texto especial`

Importante:

- `pnpm verify:rules` valida o motor contra o catálogo v1 derivado desse `.xlsx`;
- ele não faz parsing dinâmico do `.xlsx` nem tenta cobrir automaticamente todos os itens visíveis em checklists públicos mais amplos da NBR 17225.

Consulte:

- `RULES_ANALYSIS.md` para o resumo por seção, status e critérios de automação;
- `RULES_CODE_MAPPING.md` para o mapeamento regra a regra com o arquivo e a constante correspondente;
- `RULES_NORMATIVE_MATRIX.md` para a matriz formal entre regra v1, referência normativa pública, implementação e divergência residual;
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

## Escopo Público x Escopo V1

O catálogo local de 94 itens foi confrontado com fontes públicas da NBR 17225. O resultado é:

- o repositório está consistente com o escopo v1 definido no `xlsx`;
- a cópia pública da norma e checklists públicos mostram itens adicionais fora do escopo v1 atual;
- esses itens não serão adicionados agora, mas devem ficar explícitos como backlog para contribuições futuras ao repositório público.

Itens públicos adicionais fora do escopo v1:

- `5.2.6`;
- `5.4.3`;
- `5.4.4`;
- `5.7.3`;
- `5.8.4`;
- `5.12.10`, `5.12.11`, `5.12.12`, `5.12.13`;
- `5.13.9`;
- `5.13.11`.

Esses itens devem ser tratados como contribuições futuras, não como lacunas da implementação da v1.

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
