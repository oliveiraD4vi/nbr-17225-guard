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
- links para Página do Projeto, página de regras, política de privacidade e GitHub público na tela Sobre;
- exportação de resumo simples da auditoria direto pela aba de resumo;
- classificação normativa canônica em `src/normative.ts`, baseada na própria ABNT NBR 17225;
- importação de relatórios JSON exportados pela própria extensão para retomar contexto e comparação em outro navegador ou computador;
- classificação documental da força heurística em `docs/RULES_HEURISTIC_CLASSIFICATION.md`, com priorização explícita das heurísticas mais fracas;
- links de regra por achado, abrindo a explicação completa e a rastreabilidade na Página do Projeto.
- alerta preventivo de pressão no armazenamento local, com leitura de uso e ação de compactação no próprio popup.

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
- filtros, score e resumo passam a usar classificação normativa real, sem inferir requisito ou recomendação por severidade ou nível WCAG;
- nota do resumo passa a considerar requisitos, recomendações do escopo atual e conclusão da revisão humana;
- resumo da auditoria passa a mostrar um único próximo passo, reduzindo redundância visual;
- histórico passa a ser persistido em formato compacto, sem duplicar agrupamentos derivados nem referências de DOM no armazenamento local;
- fluxo de revisão humana passa a exigir confirmação antes da mudança de estado e a reorganizar visualmente o item entre pendentes, confirmados e descartados;
- cards de violação passam a truncar conteúdos longos com tooltip, reduzindo ruído sem ocultar contexto;
- V1 Farol passa a ser comunicada como Beta funcional, com textos alinhados ao estágio real do produto;
- interface passa a deixar explícito que “Requisitos” e “Recomendações” seguem a nomenclatura da própria ABNT NBR 17225;
- toggle de recomendações passa a comunicar estado atual e ação esperada com mais clareza.
- cards de violação passam a abrir com leitura curta mais clara e link para a explicação pública completa da regra;
- fluxo do popup passa a tornar visível que a retenção do histórico é local ao navegador e que exportação JSON é a continuidade recomendada para retenção longa.

### Fixed

- variações de auditoria causadas por pontos de persistência e deduplicação inconsistentes;
- falha de acesso ao DOM causada por recursos não expostos no bundle da extensão;
- múltiplos pontos de texto degradado e inconsistências de PT-BR UTF-8, inclusive no `content.ts`;
- fundos pretos indevidos em botões, tags e overlays após a centralização do tema;
- contraste das tooltips do Ant Design corrigido no tema para evitar fundo e texto brancos;
- renderização quebrada da board de contraste dentro do popup, preservando bloqueio de propagação sem quebrar layout e hover.
- falsos positivos em imagens funcionais, links inline pequenos, botões usados como ação e idioma da página;
- ruído em heurísticas de links externos, links em nova janela, abreviações e ajuda contextual em formulários;
- título da aba ativa no cabeçalho agora é truncado em 300 caracteres sem reduzir o texto completo da seção de contexto;
- sobreposição de ruído entre `5.9.1` e `5.9.3`, separando rótulo visível de associação programática;
- duplicidade de sinal entre `5.10.2` e `5.13.6`, removendo repetição do mesmo indício de `order` em CSS.
- clique e foco inesperados em elementos atrás da board de contraste.
