# Plano para Regras Futuras Fora do Escopo V1

Este documento lista os itens da ABNT NBR 17225:2025 que não fazem parte do escopo v1 implementado no Guardião NBR 17225.

O escopo v1 permanece com 94 regras. Este plano não implementa novas regras; ele organiza a expansão futura de forma rastreável.

Fontes usadas para esta lista:

- cópia pública da ABNT NBR 17225:2025 hospedada pela Câmara dos Deputados;
- matriz local `RULES_NORMATIVE_MATRIX.md`;
- catálogo v1 validado por `pnpm verify:rules`.

## Resumo

| Grupo                                           | Quantidade |
| ----------------------------------------------- | ---------: |
| Requisitos obrigatórios ainda não implementados |          3 |
| Recomendações ainda não implementadas           |         49 |
| Total fora do escopo v1                         |         52 |

## Requisitos obrigatórios ainda não implementados

### 5.1.16 — Instruções para componentes customizados

Plano:

- identificar componentes customizados que exigem instruções de uso;
- verificar se há instrução textual ou programática próxima;
- classificar como `Semi-Automatizável`, porque a suficiência da instrução depende de contexto humano.

Risco técnico:

- alto risco de falso positivo se a regra procurar apenas termos genéricos como "instrução" ou "ajuda".

### 5.2.6 — Texto alternativo para mapas de imagens

Plano:

- detectar `img[usemap]`, `map` e `area`;
- validar nome acessível da imagem principal;
- validar texto alternativo ou nome acessível de cada `area`;
- classificar como `Totalmente Automatizável` para ausência estrutural de texto, mantendo revisão humana para qualidade da descrição.

Risco técnico:

- a presença de texto alternativo pode ser validada automaticamente; a adequação do texto continua contextual.

### 5.7.13 — Alternativas para localização

Plano:

- detectar sinais de conjunto de páginas com navegação, busca, mapa do site, trilha de navegação ou índice;
- verificar presença de pelo menos um mecanismo alternativo de localização;
- classificar como `Semi-Automatizável`, porque depende do conjunto real de páginas e não apenas da página atual.

Risco técnico:

- a extensão analisa a aba atual; validar um conjunto inteiro de páginas exige escopo de navegação adicional.

## Recomendações ainda não implementadas

### Interação por teclado

- `5.1.5` — Uso de foco
- `5.1.7` — Conteúdo adicional
- `5.1.10` — Atalhos de teclado
- `5.1.12` — Acessibilidade por teclado total
- `5.1.14` — Mecanismos de entrada simultâneos
- `5.1.15` — Comportamento de componentes customizados

Direção técnica:

- priorizar recomendações que possam ser analisadas por DOM e ARIA;
- manter como confirmação humana quando depender de interação real, ordem dinâmica ou comportamento customizado.

### Cabeçalhos

- `5.3.3` — Cabeçalho principal
- `5.3.4` — Seções com cabeçalhos

Direção técnica:

- reaproveitar a base das regras de cabeçalho;
- diferenciar ausência estrutural objetiva de julgamento editorial.

### Regiões

- `5.4.3` — Conteúdo em regiões
- `5.4.4` — Regiões únicas

Direção técnica:

- validar landmarks duplicados e conteúdo fora de regiões principais;
- evitar exigir landmarks em páginas pequenas sem estrutura complexa.

### Tabelas

- `5.6.4` — Título de tabela
- `5.6.6` — Descrição para tabelas complexas

Direção técnica:

- detectar tabelas com sinais de complexidade;
- separar ausência estrutural de título/descrição da qualidade textual do conteúdo.

### Links e navegação

- `5.7.3` — Propósito do link sem contexto
- `5.7.5` — Links com identificação consistente
- `5.7.6` — Links que abrem em uma nova guia ou janela
- `5.7.7` — Links para arquivos não HTML
- `5.7.8` — Links para sites externos
- `5.7.9` — Texto complementar do link
- `5.7.10` — Links adjacentes
- `5.7.11` — Links para contornar blocos de conteúdo
- `5.7.14` — Localização em conjunto de páginas

Direção técnica:

- dividir as recomendações entre verificações estruturais objetivas e verificações dependentes de conjunto de páginas;
- para links externos, arquivos e nova guia, avaliar avisos visíveis ou acessíveis sem criar ruído excessivo.

### Botões e controles

- `5.8.4` — Identificação consistente na página
- `5.8.6` — Área de acionamento aprimorada
- `5.8.8` — Mudança de contexto previsível
- `5.8.15` — Controles com retorno

Direção técnica:

- reaproveitar a identidade de controles já usada na v1;
- separar alvo mínimo obrigatório de alvo aprimorado;
- exigir confirmação humana para retorno visual/sonoro/háptico de controles.

### Formulários e entrada de dados

- `5.9.11` — Prevenção de erro
- `5.9.13` — Ajuda contextual
- `5.9.14` — Botão de submissão
- `5.9.17` — Autenticação acessível aprimorada

Direção técnica:

- validar padrões estruturais de revisão, confirmação e ajuda;
- manter autenticação aprimorada como revisão humana assistida.

### Apresentação

- `5.10.5` — Área do indicador de foco visível

Direção técnica:

- usar medição geométrica do indicador quando possível;
- manter confirmação humana quando o estado de foco depender de interação real.

### Uso de cores

- `5.11.2` — Contraste para texto aprimorado

Direção técnica:

- reaproveitar o motor de contraste textual com limite AAA;
- apresentar como recomendação separada para não confundir com o requisito mínimo.

### Conteúdo textual

- `5.12.5` — Alinhamento de blocos de texto
- `5.12.10` — Definições de significado
- `5.12.11` — Siglas e abreviaturas
- `5.12.12` — Nível de linguagem
- `5.12.13` — Pronúncia identificada

Direção técnica:

- tratar alinhamento como verificação estrutural assistida;
- tratar significado, siglas, linguagem e pronúncia como revisão humana, com heurísticas conservadoras.

### Codificação e marcação semântica

- `5.13.9` — Propósito identificável
- `5.13.11` — Elementos nativos

Direção técnica:

- para propósito identificável, avaliar atributos como `autocomplete`, nomes acessíveis e padrões de campos;
- para elementos nativos, sinalizar componentes customizados que poderiam usar controles HTML nativos.

### Áudio e vídeo

- `5.14.3` — Transcrição para vídeo
- `5.14.5` — Audiodescrição estendida para vídeo
- `5.14.6` — Janela de Libras para conteúdo em áudio
- `5.14.8` — Áudio sem ruído
- `5.14.10` — Transcrição para áudio ao vivo

Direção técnica:

- detectar presença estrutural de trilhas, links e descrições;
- manter qualidade, sincronização e suficiência como confirmação humana.

### Animação

- `5.15.2` — Animações acionadas por interação
- `5.15.3` — Flash intermitente

Direção técnica:

- aproveitar inspeção de CSS animations e mídia;
- evitar prometer medição completa de luminância sem análise visual dedicada.

### Tempo

- `5.16.1` — Limite de tempo
- `5.16.4` — Interrupções
- `5.16.5` — Reautenticação
- `5.16.6` — Tempo de inatividade

Direção técnica:

- detectar timers, meta refresh, sessão expirada e padrões de interrupção;
- manter como revisão humana quando depender de fluxo autenticado ou evento em tempo real.

## Ordem sugerida de implementação

1. Implementar primeiro os três requisitos obrigatórios ausentes.
2. Em seguida, implementar recomendações com baixa ambiguidade estrutural:
   - `5.2.6`
   - `5.7.6`
   - `5.7.7`
   - `5.7.8`
   - `5.11.2`
   - `5.13.11`
3. Depois, avançar nas recomendações que dependem de contexto de página atual.
4. Por último, tratar recomendações que exigem conjunto de páginas, fluxo autenticado, mídia ou julgamento humano mais forte.

## Critérios para aceitar novas regras

- cada regra deve ter entrada no catálogo i18n;
- a implementação deve declarar claramente se o achado é automático ou exige confirmação humana;
- regras com heurística frágil devem preferir poucos achados de alta confiança;
- a matriz normativa e a página pública de rastreabilidade devem ser atualizadas no mesmo lote;
- `pnpm verify:rules`, `pnpm type-check`, `pnpm test` e `pnpm build` devem passar.
