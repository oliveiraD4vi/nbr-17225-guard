# Changelog

Todas as mudanças relevantes deste projeto devem ser registradas neste arquivo.

O formato segue, de forma simples, a ideia de "Keep a Changelog" e versionamento semântico quando aplicável.

## [Unreleased]

### Added

- catálogo centralizado de textos da interface e de parte relevante das regras;
- skeletons no lugar de spinners;
- histórico de auditorias por URL;
- comparação entre auditorias com exportação em Markdown, JSON e CSV;
- nota de requisitos baseada apenas nos requisitos do escopo v1;
- distinção explícita entre detecção automática e confirmação humana;
- herança de revisão humana, anotações e correções de contraste entre auditorias equivalentes;
- destaques visuais com foco em itens prioritários;
- verificador de cobertura das 94 regras do escopo v1;
- matriz normativa em `RULES_NORMATIVE_MATRIX.md`;
- escopo de auditoria com alternância entre requisitos e recomendações;
- exclusão de históricos com confirmação no popup;
- filtro visual por categoria natural das regras;
- board auxiliar de contraste com simulação em tempo real, persistência da correção do usuário e restauração para o estado original da página;
- fluxo de recuperação para `QuotaExceeded`, com ações guiadas no popup.

### Changed

- extração restante de textos visíveis para o catálogo centralizado, incluindo mensagens dinâmicas das regras documentais, nomes de exportação e metadados de highlight;
- categorias de automação consolidadas em constantes de domínio, reduzindo dependência de comparações por string literal;
- motor de histórico unificado com identidade consistente para URL e violações;
- fluxo de bootstrap do content script endurecido para evitar falhas de carregamento por chunk;
- popup dividido em chunks menores, com melhor comportamento de carregamento;
- UX do relatório e do popup refinada para revisão humana, histórico e comparação;
- README reestruturado para apresentar capacidades, fluxo de uso e papel do simulador de visão;
- tema visual consolidado em variáveis CSS, com tokens do Ant Design resolvidos corretamente a partir dessas variáveis;
- superfícies do Ant Design alinhadas ao tema do produto, incluindo CTAs, tags, modais, drawers, tooltips e popovers.

### Fixed

- variações de auditoria causadas por pontos de persistência e deduplicação inconsistentes;
- falha de acesso ao DOM causada por recursos não expostos no bundle da extensão;
- múltiplos pontos de texto degradado e inconsistências de PT-BR UTF-8, inclusive no `content.ts`;
- fundos pretos indevidos em botões, tags e overlays após a centralização do tema.
