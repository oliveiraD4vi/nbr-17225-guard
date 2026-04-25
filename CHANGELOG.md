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
- herança de revisão humana e anotações entre auditorias equivalentes;
- destaques visuais com foco em itens prioritários;
- verificador de cobertura das 94 regras do escopo v1;
- matriz normativa em `RULES_NORMATIVE_MATRIX.md`.

### Changed
- motor de histórico unificado com identidade consistente para URL e violações;
- fluxo de bootstrap do content script endurecido para evitar falhas de carregamento por chunk;
- popup dividido em chunks menores, com melhor comportamento de carregamento;
- UX do relatório e do popup refinada para revisão humana, histórico e comparação.

### Fixed
- variações de auditoria causadas por pontos de persistência e deduplicação inconsistentes;
- falha de acesso ao DOM causada por recursos não expostos no bundle da extensão;
- múltiplos pontos de texto degradado e inconsistências de PT-BR UTF-8.
