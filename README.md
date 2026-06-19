# Guardião NBR 17225

Verificador de acessibilidade para navegadores Chromium, alinhado à V1 Farol Beta do catálogo documental da ABNT NBR 17225:2025.

## Visão geral

O Guardião NBR 17225 executa auditorias diretamente na página inspecionada e organiza os achados com referência normativa, severidade, contexto do elemento afetado, revisão humana e histórico local por URL.

## Principais capacidades

### Auditoria e diagnóstico

- cobertura de 112 regras revisadas contra a referência pública da ABNT NBR 17225: 96 requisitos normativos e 16 recomendações normativas;
- execução por aba, com suporte a páginas `http(s)` e arquivos locais com permissão;
- auditoria por escopo:
  - somente requisitos;
  - requisitos e recomendações;
- destaque visual dos itens na página, limpeza de destaques e navegação por prioridades;
- grupos de violações por regra, severidade e categoria natural do motor, como `cores`, `formulários`, `cabeçalhos` e `teclado`;
- filtro por categoria na listagem de violações;
- leitura curta mais clara nos cards de violação, com resumo orientado por família de regra antes do detalhe técnico;
- link de regra por achado, abrindo a explicação completa e a rastreabilidade na Página do Projeto;
- explicação pública por regra, ajudando a entender expectativa normativa, sinal verificado, limite residual e foco de revisão;
- board auxiliar para regras de contraste, com ajuste em tempo real de cores, persistência da correção do usuário e restauração para os valores originais da página.

### Revisão humana

- distinção explícita entre detecção automática e itens que exigem confirmação humana;
- confirmação explícita antes da mudança de estado, com reorganização visual do item entre pendentes, confirmados e descartados;
- estados persistidos por item:
  - pendente;
  - confirmado;
  - descartado;
- aba dedicada para revisão humana, com agrupamento visual por estado;
- itens descartados continuam disponíveis para reavaliação posterior;
- anotações por item, com persistência entre auditorias equivalentes.

### Histórico e comparação

- histórico compacto de auditorias por URL;
- herança de revisão humana, anotações e correções de contraste entre auditorias equivalentes;
- exclusão de entradas do histórico com confirmação explícita no popup;
- comparação entre auditorias salvas, com indicadores de evolução, regressão e estabilidade;
- importação de relatórios JSON exportados pela própria extensão para retomar a análise em outro navegador ou computador;
- exportação da auditoria em JSON e CSV;
- exportação de comparações em Markdown, JSON e CSV.

### Apoio à decisão

- nota geral baseada em requisitos, recomendações do escopo atual e conclusão da revisão humana;
- controles de escopo com linguagem orientada à ação, deixando explícito o que será incluído ou removido da leitura atual;
- feedback visual para a nota, com leitura rápida de risco;
- contadores do resumo baseados no estado atual da revisão humana, evitando inflar pendências já descartadas;
- relatório detalhado em página dedicada.
- exportação de resumo simples da auditoria diretamente pela aba de resumo.

### Simulador de visão

- simulação de:
  - protanopia;
  - deuteranopia;
  - tritanopia;
  - desfoque;
- aplicação direta sobre a página auditada;
- uso complementar ao motor de regras, para inspeção visual assistida.

### Governança técnica

- verificação automática de cobertura entre catálogo documentado, requisitos incorporados e regras implementadas;
- matriz normativa formal em `docs/RULES_NORMATIVE_MATRIX.md`;
- plano de expansão futura em `docs/FUTURE_RULES_PLAN.md`, com as 34 recomendações ainda não implementadas listadas individualmente;
- centralização de textos visíveis em catálogo de i18n PT-BR UTF-8;
- tema centralizado em variáveis CSS, compartilhado entre popup, relatório e superfícies do Ant Design;
- resolução correta dos tokens do Ant Design a partir das variáveis CSS, preservando consistência visual em CTAs, tags, modais, drawers, tooltips e popovers.

### Resiliência de armazenamento

- tratamento orientado para `QuotaExceeded` no `chrome.storage.local`;
- persistência enxuta do histórico, removendo dados derivados e reconstruindo agrupamentos na leitura sem descartar revisão humana, anotações ou correções de contraste;
- aviso preventivo quando o armazenamento local se aproxima do limite, com leitura de uso atual, ação de compactação e orientação sobre retenção local;
- importação de relatórios como caminho de continuidade quando o armazenamento local não for suficiente para reter todo o histórico indefinidamente;
- opções de recuperação no popup:
  - limpar o histórico da URL atual;
  - excluir a auditoria mais antiga;
  - compactar o armazenamento;
  - manter a auditoria somente em memória até a próxima recarga.

## Definição da Beta

Produto: `1.0.2-beta.2`
Manifest Chrome: `1.0.2`
Nome: **V1 Farol Beta**

Escopo da Beta:

- 112 regras documentadas;
- 104 regras executadas na auditoria Beta;
- 8 regras documentadas, fora da execução e fora da nota;
- escopo padrão com requisitos; recomendações entram por opção do usuário;
- histórico local por página normalizada, preservando o caminho da URL e ignorando query string e hash;
- explicações completas na Página do Projeto, principalmente em `/rules.html` e `/score.html`.

## Cobertura de regras

O escopo documentado atual contém a V1 Farol, com 112 regras revisadas contra a referência pública da ABNT NBR 17225. Na Beta, uma regra executada significa regra habilitada para avaliação assistida; não significa regra final.

| Situação                               | Quantidade |
| -------------------------------------- | ---------: |
| Itens documentados                     |        112 |
| Regras implementadas no motor          |        112 |
| Regras executadas na Beta              |        104 |
| Regras fora da execução da Beta        |          8 |
| Regras ausentes                        |          0 |
| Requisitos normativos implementados    |         96 |
| Recomendações normativas implementadas |         16 |
| Totalmente automatizáveis              |         46 |
| Semi-automatizáveis                    |         65 |
| Não automatizáveis                     |          1 |

Importante:

- `pnpm verify:rules` valida o motor contra o catálogo implementado atual;
- regras fora da execução da Beta continuam documentadas, mas não entram na execução nem na nota;
- a classificação `Requisito` ou `Recomendação` segue a própria ABNT NBR 17225, não o nível WCAG nem a severidade técnica do achado;
- recomendações fora do catálogo implementado seguem registradas como backlog público, sem aumentar o ruído da auditoria padrão.

Consulte também:

- [docs/README.md](docs/README.md)
- [RULES_ANALYSIS.md](docs/RULES_ANALYSIS.md)
- [RULES_HEURISTIC_CLASSIFICATION.md](docs/RULES_HEURISTIC_CLASSIFICATION.md)
- [RULES_CODE_MAPPING.md](docs/RULES_CODE_MAPPING.md)
- [RULES_NORMATIVE_MATRIX.md](docs/RULES_NORMATIVE_MATRIX.md)
- [FUTURE_RULES_PLAN.md](docs/FUTURE_RULES_PLAN.md)
- [VERSIONING.md](docs/VERSIONING.md)

## Rastreabilidade pública

A Página do Projeto possui uma página dedicada de rastreabilidade em `/rules.html`. Ela apresenta, para cada uma das 112 regras implementadas:

- referência da ABNT NBR 17225;
- recorte normativo interpretativo com referência à fonte pública;
- função implementada na extensão;
- trecho de código da regra;
- link para o arquivo no repositório público;
- classificação de automação;
- limite residual da verificação.

Essa página usa a matriz `docs/RULES_NORMATIVE_MATRIX.md` como fonte e não substitui a leitura da norma.

## Fluxo recomendado de uso

### 1. Rodar a auditoria de requisitos

Comece com o escopo padrão `Somente requisitos`. Isso reduz ruído inicial e ajuda a priorizar não conformidades diretas.

### 2. Revisar a aba de violações

Use:

- os grupos por regra;
- o filtro por categoria;
- a navegação por itens prioritários;
- os resumos curtos dos cards para leitura rápida do achado;
- o link da regra para abrir a explicação completa, os limites e a rastreabilidade em `https://guardiaonbr.com.br/rules.html`;
- a board de contraste, quando aplicável.

### 3. Fechar a revisão humana

Na aba `Verificação humana`, confirme ou descarte os itens pendentes. O fluxo agora pede confirmação antes da mudança de estado e reorganiza visualmente o card para reduzir perda de contexto. Esse passo é importante para estabilizar o diagnóstico e melhorar a utilidade do histórico.

### 4. Incluir recomendações

Ative o escopo `Requisitos e recomendações` quando a base obrigatória já estiver compreendida. O Guardião amplia a auditoria atual sem criar um novo histórico só por causa dessa troca de escopo.

### 5. Exportar ou importar contexto quando necessário

Quando a auditoria precisar continuar em outro ambiente, exporte o relatório em JSON e depois use a importação pela aba de histórico ou pela tela inicial. Se a URL importada for a mesma da aba atual, o relatório volta pronto para comparação.

Se o popup avisar que o armazenamento local está em atenção, compacte o histórico e exporte os relatórios que precisarem de retenção de longo prazo.

### 6. Usar o simulador de visão

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

## Escopo da ABNT NBR 17225 x escopo implementado

A norma possui recomendações adicionais fora do escopo implementado aqui. Elas não serão adicionadas à V1 Farol, mas estão registradas como backlog para futuras contribuições em `docs/FUTURE_RULES_PLAN.md`.

## Origem, abertura e governança pública

O Guardião NBR 17225 nasceu como projeto acadêmico e mantém a extensão como software open-source hoje e sempre.

- Espelho público da extensão: <https://github.com/oliveiraD4vi/nbr-17225-guard-mirror>
- Issues públicas: <https://github.com/oliveiraD4vi/nbr-17225-guard-mirror/issues>
- Domínio: `guardiaonbr.com.br`
- Página do Projeto: `https://guardiaonbr.com.br`
- Página pública de regras: `https://guardiaonbr.com.br/rules.html`
- Explicação da nota: `https://guardiaonbr.com.br/score.html`
- Política de privacidade: `https://guardiaonbr.com.br/privacy.html`

A Página do Projeto é a vitrine oficial do projeto e não faz parte do código open-source da extensão. Bugs, pedidos de ajuste visual, problemas de conteúdo e solicitações de atualização da página de regras devem ser abertos como issue no GitHub público da extensão.

Quando um PR alterar, remover ou criar uma função de verificação de regra, o PR deve referenciar a issue que solicita a atualização correspondente na Página do Projeto. A alteração da Página do Projeto é mantida separadamente.

## Versionamento

Produto: `1.0.2-beta.2`
Manifest Chrome: `1.0.2`
Nome: **V1 Farol Beta**

A política de nomes e evolução está documentada em `docs/VERSIONING.md`.

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
pnpm test
```

## Automação local de Git

Após `pnpm install`, o Husky passa a controlar os hooks locais do repositório.

- `pre-commit`:
  - roda `pnpm stage-lint` para aplicar `prettier` e `eslint --fix` apenas nos arquivos staged.
- `pre-push`:
  - roda `pnpm test`;
  - roda `pnpm build`.

## Estrutura

```text
nbr-17225-guard/
|-- docs/                         # Documentação de regras, governança, versão e requisitos-fonte
|-- scripts/                      # Verificações de cobertura e utilitários
|-- src/
|   |-- components/               # Popup, relatório, histórico e simulador
|   |-- i18n/                     # Catálogos PT-BR UTF-8
|   |-- rules/                    # Regras do motor de auditoria
|   |-- styles/                   # Tema centralizado e estilos da interface
|   |-- utils/                    # Persistência, histórico, comparação e exportação
|-- public/                       # Manifesto e bootstrap do content script
```
