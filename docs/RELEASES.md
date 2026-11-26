# Versões e releases

## Política de versão

O projeto segue versionamento semântico:

- `MAJOR`: mudança de escopo normativo, do contrato de auditoria, do formato do histórico ou da experiência principal;
- `MINOR`: nova regra, relatório, filtro ou funcionalidade compatível;
- `PATCH`: correção de bug, ajuste visual, refinamento de texto, redução de falso positivo ou melhoria interna sem quebra de contrato.

O estágio de maturidade (Beta ou estável) e o nome da linha ficam em `src/version.ts`, fora do número da versão. Executar uma regra na Beta significa que ela está habilitada para avaliação assistida, não que seja definitiva.

Cada versão `MAJOR` recebe um nome de navegação e orientação: V1 Farol, V2 Polaris, V3 Astrolábio, V4 Cartógrafo e V5 Horizonte. Versões `MINOR` e `PATCH` mantêm o nome da linha.

Até `2.0.0-beta.1`, o estágio fazia parte da versão. Essa forma não convivia com a Chrome Web Store, que exige um `version` numérico sempre maior que o anterior. Por isso o projeto passou a usar só o número semântico.

## Arquivos de versão

A versão é escrita apenas em `package.json`. O build a copia para o `version` do manifesto, monta o `version_name` com o estágio de `src/version.ts` (por exemplo, `2.0.1 Beta`), e a interface lê o mesmo valor.

## Preparar uma release

As versões são calculadas pelo [release-please](https://github.com/googleapis/release-please) a partir dos títulos dos PRs integrados em `main`: `feat` gera `MINOR`, `fix` e `perf` geram `PATCH`, e `!` ou `BREAKING CHANGE` geram `MAJOR`. A configuração fica em `release-please-config.json` e a última versão publicada, em `.release-please-manifest.json`.

1. A cada push em `main`, o workflow `Release` mantém aberto o PR `chore(release): prepara <versão>`, com a nova versão em `package.json` e as entradas do [`CHANGELOG.md`](CHANGELOG.md).
2. O PR de release é integrado ao fim de cada fase do roadmap, não a cada mudança.
3. Depois da integração, o workflow cria a tag `v<versão>`, publica a release no GitHub e anexa `guardiao-nbr-17225-v<versão>.zip`, com o conteúdo de `dist/` na raiz.
4. Atualize o espelho no GitLab com `main` e as tags.
5. Sincronize e publique a Página do Projeto quando a release alterar regras, textos públicos ou a versão.

## Publicar na Chrome Web Store

O ZIP anexado à release é enviado ao mesmo item da Chrome Web Store, preservando o identificador da extensão. Depois da aprovação, o Chrome distribui a atualização automaticamente quando a extensão está ociosa. Extensões carregadas em modo de desenvolvedor não recebem essas atualizações.

Uma tag ou um ZIP local não publicam nada: o pacote precisa ser enviado, revisado e publicado no painel da loja.

- [Ciclo de atualização de extensões](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle)
- [Atualização de um item na Chrome Web Store](https://developer.chrome.com/docs/webstore/update/)

## Aviso da Navegação segura melhorada

O Chrome pode avisar que a extensão ainda não é considerada confiável pela Navegação segura melhorada. Desenvolvedores novos costumam precisar de alguns meses de histórico em conformidade com as políticas da loja para remover esse aviso. Nenhuma configuração do manifesto o remove.

Para reduzir o risco, o projeto mantém finalidade única, descrição transparente, política de privacidade atualizada e apenas as permissões necessárias:

- `storage`, `activeTab` e `scripting` salvam auditorias e executam a análise pedida pelo usuário;
- o acesso por site fica em `optional_host_permissions` e só é solicitado quando o painel DevTools precisa acessar a origem auditada.

Referências:

- [Instalação de extensões com Proteção reforçada](https://support.google.com/chrome/answer/2664769)
- [Políticas do Programa para Desenvolvedores](https://developer.chrome.com/docs/webstore/program-policies)
