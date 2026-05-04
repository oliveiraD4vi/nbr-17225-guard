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
- board auxiliar para regras de contraste, com ajuste em tempo real de cores, persistência da correção do usuário e restauração para os valores originais da página.

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
- herança de revisão humana, anotações e correções de contraste entre auditorias equivalentes;
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
- plano de expansão futura em `FUTURE_RULES_PLAN.md`, com os 52 itens fora do escopo v1 listados individualmente;
- centralização de textos visíveis em catálogo de i18n PT-BR UTF-8;
- tema centralizado em variáveis CSS, compartilhado entre popup, relatório e superfícies do Ant Design;
- resolução correta dos tokens do Ant Design a partir das variáveis CSS, preservando consistência visual em CTAs, tags, modais, drawers, tooltips e popovers.

### Resiliência de armazenamento

- tratamento orientado para `QuotaExceeded` no `chrome.storage.local`;
- opções de recuperação no popup:
  - limpar o histórico da URL atual;
  - excluir a auditoria mais antiga;
  - compactar o armazenamento;
  - manter a auditoria somente em memória até a próxima recarga.

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
- [FUTURE_RULES_PLAN.md](C:/Users/davic/Documents/Development/nbr-17225-guard/FUTURE_RULES_PLAN.md)

## Rastreabilidade pública

A landing page do projeto possui uma página dedicada de rastreabilidade em `/rules.html`. Ela apresenta, para cada uma das 94 regras do escopo v1:

- referência da ABNT NBR 17225;
- resumo normativo interpretativo;
- função implementada na extensão;
- classificação de automação;
- limite residual da verificação.

Essa página usa a matriz `RULES_NORMATIVE_MATRIX.md` como fonte e não substitui a leitura da norma.

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
pnpm check:staged-text
pnpm type-check
pnpm verify:rules
pnpm test:audit-history
pnpm test:audit-history-utils
pnpm test
```

## Automação local de Git

Após `pnpm install`, o Husky passa a controlar os hooks locais do repositório.

- `pre-commit`:
  - roda `pnpm stage-lint` para aplicar `prettier` e `eslint --fix` apenas nos arquivos staged;
  - roda `pnpm check:staged-text` para bloquear mojibake em arquivos alterados.
- `pre-push`:
  - roda `pnpm test`;
  - roda `pnpm build`.

## Estrutura

```text
nbr-17225-guard/
|-- docs/                         # Documentos-fonte de requisitos e funcionalidades
|-- scripts/                      # Verificações de cobertura e utilitários
|-- src/
|   |-- components/               # Popup, relatório, histórico e simulador
|   |-- i18n/                     # Catálogos PT-BR UTF-8
|   |-- rules/                    # Regras do motor de auditoria
|   |-- styles/                   # Tema centralizado e estilos da interface
|   |-- utils/                    # Persistência, histórico, comparação e exportação
|-- public/                       # Manifesto e bootstrap do content script
```
