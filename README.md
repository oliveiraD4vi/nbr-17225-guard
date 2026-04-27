# Guardião NBR 17225

Verificador de acessibilidade para navegadores Chromium, alinhado ao escopo v1 do catálogo documental da ABNT NBR 17225:2025.

## Visão geral

O Guardião NBR 17225 executa auditorias diretamente na página inspecionada e organiza os achados com referência normativa, severidade, contexto do elemento afetado, revisão humana e histórico por URL.

## Principais capacidades

### Auditoria e diagnóstico

- cobertura do escopo v1 com 94 regras derivadas de `docs/Analise_Documental_NBR17225.xlsx`;
- execução por aba, com suporte a páginas `http(s)` e arquivos locais com permissão;
- auditoria por escopo:
  - somente requisitos;
  - requisitos e recomendações;
- destaque visual dos itens na página, limpeza de destaques e navegação por prioridades;
- grupos de violações por regra, severidade e categoria natural do motor, como `cores`, `formulários`, `cabeçalhos` e `teclado`;
- filtro por categoria na listagem de violações;
- board auxiliar para regras de contraste, com ajuste em tempo real de cores e leitura imediata da razão de contraste.

### Revisão humana

- distinção explícita entre detecção automática e itens que exigem confirmação humana;
- estados persistidos por item:
  - pendente;
  - confirmado;
  - descartado;
- aba dedicada para revisão humana, com agrupamento visual por estado;
- itens descartados continuam disponíveis para reavaliação posterior;
- anotações por item, com persistência entre auditorias equivalentes.

### Histórico e comparação

- histórico de auditorias por URL;
- herança de revisão humana e anotações entre auditorias equivalentes;
- exclusão de entradas do histórico com confirmação explícita no popup;
- comparação entre auditorias salvas, com indicadores de evolução, regressão e estabilidade;
- exportação da auditoria em JSON e CSV;
- exportação de comparações em Markdown, JSON e CSV.

### Apoio à decisão

- nota de requisitos baseada apenas nos requisitos do escopo v1;
- feedback visual para a nota, com leitura rápida de risco;
- contadores do resumo baseados no estado atual da revisão humana, evitando inflar pendências já descartadas;
- relatório detalhado em página dedicada.

### Simulador de visão

- simulação de:
  - protanopia;
  - deuteranopia;
  - tritanopia;
  - desfoque;
- aplicação direta sobre a página auditada;
- uso complementar ao motor de regras, para inspeção visual assistida.

### Governança técnica

- verificação automática de cobertura entre catálogo documentado e regras implementadas;
- matriz normativa formal em `RULES_NORMATIVE_MATRIX.md`;
- centralização de textos visíveis em catálogo de i18n PT-BR UTF-8.

## Cobertura de regras

O escopo da versão 1 vem de `docs/Analise_Documental_NBR17225.xlsx`. O catálogo local da v1 contém 94 itens.

| Situação                      | Quantidade |
| ----------------------------- | ---------: |
| Requisitos documentados       |         94 |
| Regras implementadas no motor |         94 |
| Regras ausentes               |          0 |
| Totalmente automatizáveis     |         40 |
| Semi-automatizáveis           |         53 |
| Não automatizáveis            |          1 |

Importante:

- `pnpm verify:rules` valida o motor contra o catálogo v1 derivado desse `.xlsx`;
- o projeto não tenta, nesta versão, expandir automaticamente o escopo para além do catálogo v1 adotado.

Consulte também:

- [RULES_ANALYSIS.md](C:/Users/davic/Documents/Development/nbr-17225-guard/RULES_ANALYSIS.md)
- [RULES_CODE_MAPPING.md](C:/Users/davic/Documents/Development/nbr-17225-guard/RULES_CODE_MAPPING.md)
- [RULES_NORMATIVE_MATRIX.md](C:/Users/davic/Documents/Development/nbr-17225-guard/RULES_NORMATIVE_MATRIX.md)

## Fluxo recomendado de uso

### 1. Rodar a auditoria de requisitos

Comece com o escopo padrão `Somente requisitos`. Isso reduz ruído inicial e ajuda a priorizar não conformidades diretas.

### 2. Revisar a aba de violações

Use:

- os grupos por regra;
- o filtro por categoria;
- a navegação por itens prioritários;
- a board de contraste, quando aplicável.

### 3. Fechar a revisão humana

Na aba `Verificação humana`, confirme ou descarte os itens pendentes. Esse passo é importante para estabilizar o diagnóstico e melhorar a utilidade do histórico.

### 4. Incluir recomendações

Ative o escopo `Requisitos e recomendações` quando a base obrigatória já estiver compreendida. O Guardião amplia a auditoria atual sem criar um novo histórico só por causa dessa troca de escopo.

### 5. Usar o simulador de visão

O simulador de visão deve entrar como validação complementar, não como substituto da auditoria automática. Um fluxo profissional de uso é:

1. rodar a auditoria de requisitos;
2. revisar achados de contraste, foco, componentes e leitura;
3. ativar o simulador de visão;
4. inspecionar visualmente:
   - contraste textual;
   - contraste de componentes;
   - diferenciação visual de estados;
   - foco visível;
   - legibilidade de blocos críticos;
5. registrar observações nas anotações dos itens;
6. reexecutar a auditoria após ajustes.

Na prática, o simulador é mais útil em três momentos:

- validação complementar de regras de cor e contraste;
- revisão de áreas densas ou críticas da interface;
- checagem final antes de comparar auditorias no histórico.

## Verificação

Para validar o mapeamento de regras contra o catálogo documental:

```bash
pnpm verify:rules
```

O script verifica:

- existência de regra para cada `nbrReference` do catálogo v1;
- consistência de nível WCAG;
- consistência de categoria de automação;
- duplicidade de referências;
- presença de regras fora do catálogo adotado.

## Escopo da ABNT NBR 17225 x escopo v1

A norma possui itens adicionais fora do escopo v1 adotado aqui. Eles não serão adicionados agora, mas estão registrados como backlog para futuras contribuições.

Itens já identificados fora do escopo v1:

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

## Instalação

Pré-requisitos:

- Node.js 16+
- pnpm
- Chrome, Edge ou outro navegador Chromium compatível com Manifest V3

Instalação:

```bash
pnpm install
pnpm build
```

Depois, carregue a pasta `dist/` em `chrome://extensions/` usando `Carregar extensão não empacotada`.

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm stage-lint
pnpm type-check
pnpm verify:rules
pnpm test:audit-history
pnpm test:audit-history-utils
```

## Estrutura

```text
nbr-17225-guard/
|-- docs/                         # Documentos-fonte de requisitos e funcionalidades
|-- scripts/                      # Verificações de cobertura e utilitários
|-- src/
|   |-- components/               # Componentes React
|   |-- i18n/                     # Catálogo de textos PT-BR
|   |-- rules/                    # Regras de acessibilidade
|   |-- styles/                   # Estilos
|   |-- types/                    # Tipos TypeScript
|   |-- utils/                    # Utilitários
|   |-- background.ts             # Service worker
|   |-- content.ts                # Content script
|   |-- popup.tsx                 # Popup da extensão
|   `-- report.tsx                # Relatório detalhado
|-- public/                       # Manifest, bootstrap e ícones
|-- package.json
`-- vite.config.ts
```

## Desenvolvimento de regras

Cada regra implementa a interface `Rule` e declara:

- `id`
- `nbrReference`
- `name`
- `description`
- `severity`
- `wcagLevel`
- `category`
- `check`

Exemplo:

```ts
import type { Rule, Violation } from '@/types'

export const myRule: Rule = {
  id: 'my-rule',
  nbrReference: '5.X.X',
  name: 'Nome da regra',
  description: 'Descrição objetiva da regra',
  severity: 'error',
  wcagLevel: 'A',
  category: 'Totalmente Automatizável',
  check: async (): Promise<Violation[]> => {
    return []
  },
}
```

### Processo atual para adicionar uma nova regra

Ao adicionar uma regra ao escopo v1, trate a mudança como um fluxo completo do produto.

Passo a passo recomendado:

1. implemente ou ajuste a regra em `src/rules/`;
2. registre a regra no agregador correspondente em `src/rules/index.ts`;
3. confirme a coerência entre `ruleId`, `nbrReference`, severidade, nível WCAG e categoria de automação;
4. crie a tupla de tradução antes de ligar a regra à interface:
   - `src/i18n/pt-BR.json` para textos de popup, relatório, resumo, estados, alertas e exportações;
   - `src/i18n/rules-pt-BR.json` para `name`, `description`, mensagens, sugestões e remediações da regra;
5. use apenas chaves de catálogo no código, sem texto visível hardcoded;
6. se a regra introduzir novos campos em `Violation`, atualize também tipos, persistência, histórico, comparação e exportações;
7. revise a documentação impactada em `RULES_CODE_MAPPING.md`, `RULES_ANALYSIS.md`, `RULES_NORMATIVE_MATRIX.md` e neste `README.md`;
8. valide o resultado no motor e no catálogo documental.

Checklist mínimo ao final:

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

- versão: `0.9.1`
- última atualização: abril de 2026
- status: desenvolvimento ativo
