# Guardião NBR 17225

Verificador de acessibilidade web para navegadores Chromium, alinhado aos requisitos documentados da ABNT NBR 17225:2025.

## Visão Geral

O Guardião NBR 17225 executa auditorias diretamente na página inspecionada e retorna violações com referência normativa, severidade, sugestão de correção, contexto do elemento afetado e histórico por URL.

Funcionalidades principais:

- análise de regras da NBR 17225 por módulos em `src/rules`;
- cobertura do catálogo v1 com 94 regras derivadas de `docs/Analise_Documental_NBR17225.xlsx`;
- destaque visual de problemas na página, com limpeza de destaques e navegação por itens prioritários;
- painel de detalhes com agrupamento por regra, severidade, sugestões contextualizadas e orientação de correção;
- separação entre detecção automática e itens que exigem confirmação humana;
- revisão humana persistida por item, com estados de confirmado, descartado e pendente;
- anotações por item com persistência entre auditorias equivalentes;
- herança de anotações e triagem humana entre auditorias equivalentes da mesma URL;
- histórico de auditorias por URL;
- comparação entre auditorias salvas, com indicadores de evolução, regressão e porcentagens;
- exportação de auditorias em JSON e CSV;
- exportação de comparações em Markdown, JSON e CSV;
- nota de requisitos baseada apenas nos requisitos do escopo v1;
- simulação de visão para protanopia, deuteranopia, tritanopia e desfoque;
- página de relatório detalhado;
- verificação automática de cobertura entre catálogo documentado e regras implementadas.

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
pnpm verify:rules
```

O script verifica:

- se cada requisito possui uma regra com o mesmo `nbrReference`;
- se o nível WCAG da regra corresponde ao documento;
- se a categoria de automação corresponde ao documento;
- se não existem referências duplicadas;
- se não existem regras extras fora do catálogo documentado.

## Escopo da ABNT NBR 17225 x Escopo V1

Importante notar:

- a norma original possui itens adicionais fora do escopo v1 atual;
- esses itens não serão adicionados agora, mas estão aqui explícitos como backlog para contribuições futuras.

Itens adicionais fora do escopo v1:

- `5.2.6`;
- `5.4.3`;
- `5.4.4`;
- `5.7.3`;
- `5.8.4`;
- `5.12.10`, `5.12.11`, `5.12.12`, `5.12.13`;
- `5.13.9`;
- `5.13.11`.

Esses itens devem ser tratados como contribuições futuras, não como lacunas da implementação da v1.

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
pnpm verify:rules
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
pnpm verify:rules
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

Versão: 0.9.1
Última atualização: abril de 2026  
Status: em desenvolvimento ativo
