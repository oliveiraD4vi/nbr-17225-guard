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
- verificador de cobertura das 112 regras do escopo implementado;
- matriz normativa em `RULES_NORMATIVE_MATRIX.md`;
- escopo de auditoria com alternância entre requisitos e recomendações;
- exclusão de históricos com confirmação no popup;
- filtro visual por categoria natural das regras;
- board auxiliar de contraste com simulação em tempo real, persistência da correção do usuário e restauração para o estado original da página;
- fluxo de recuperação para `QuotaExceeded`, com ações guiadas no popup;
- plano documentado para as 34 recomendações da ABNT NBR 17225 fora da V1 Farol;
- regras `5.1.16`, `5.2.6` e `5.7.13`, incorporando os requisitos obrigatórios que estavam fora do recorte inicial;
- 15 recomendações priorizadas para fechar a V1 com 96 requisitos e 16 recomendações;
- versionamento `1.0.0` como V1 Farol;
- estratégia de nomes de versão com tema de navegação, orientação e sinalização;
- links para landing page, página de regras, política de privacidade e GitHub público na tela Sobre;
- exportação de resumo simples da auditoria direto pela aba de resumo;
- classificação normativa canônica em `src/normative.ts`, baseada na própria ABNT NBR 17225.

### Changed

- extração restante de textos visíveis para o catálogo centralizado, incluindo mensagens dinâmicas das regras documentais, nomes de exportação e metadados de highlight;
- categorias de automação consolidadas em constantes de domínio, reduzindo dependência de comparações por string literal;
- motor de histórico unificado com identidade consistente para URL e violações;
- fluxo de bootstrap do content script endurecido para evitar falhas de carregamento por chunk;
- popup dividido em chunks menores, com melhor comportamento de carregamento;
- UX do relatório e do popup refinada para revisão humana, histórico e comparação;
- README reestruturado para apresentar capacidades, fluxo de uso e papel do simulador de visão;
- tema visual consolidado em variáveis CSS, com tokens do Ant Design resolvidos corretamente a partir dessas variáveis;
- superfícies do Ant Design alinhadas ao tema do produto, incluindo CTAs, tags, modais, drawers, tooltips e popovers;
- matriz normativa atualizada após nova revisão técnica das heurísticas mais sensíveis;
- documentação de cobertura atualizada para refletir 112 regras implementadas e nenhum requisito obrigatório pendente;
- filtros, score e resumo passam a usar classificação normativa real, sem inferir requisito ou recomendação por severidade ou nível WCAG.
- nota do resumo passa a considerar requisitos, recomendações do escopo atual e conclusão da revisão humana.

### Fixed

- variações de auditoria causadas por pontos de persistência e deduplicação inconsistentes;
- falha de acesso ao DOM causada por recursos não expostos no bundle da extensão;
- múltiplos pontos de texto degradado e inconsistências de PT-BR UTF-8, inclusive no `content.ts`;
- fundos pretos indevidos em botões, tags e overlays após a centralização do tema;
- contraste das tooltips do Ant Design corrigido no tema para evitar fundo e texto brancos;
- falsos positivos em imagens funcionais, links inline pequenos, botões usados como ação e idioma da página.
