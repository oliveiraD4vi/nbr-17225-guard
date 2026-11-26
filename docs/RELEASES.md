# Versões e releases

## Política de versão

O projeto segue versionamento semântico:

- `MAJOR`: mudança de escopo normativo, do contrato de auditoria, do formato do histórico ou da experiência principal;
- `MINOR`: nova regra, relatório, filtro ou funcionalidade compatível;
- `PATCH`: correção de bug, ajuste visual, refinamento de texto, redução de falso positivo ou melhoria interna sem quebra de contrato.

Versões Beta usam `MAJOR.MINOR.PATCH-beta.N`, em que `N` cresce a cada pacote publicado. Executar uma regra na Beta significa que ela está habilitada para avaliação assistida, não que seja definitiva.

Cada versão `MAJOR` recebe um nome de navegação e orientação: V1 Farol, V2 Polaris, V3 Astrolábio, V4 Cartógrafo e V5 Horizonte. Versões `MINOR` e `PATCH` mantêm o nome da linha.

## Arquivos de versão

A versão aparece em três arquivos, que mudam juntos:

- `package.json`: versão do projeto;
- `public/manifest.json`: `version` numérico e `version_name` completo, com o sufixo Beta;
- `src/version.ts`: versão exibida na interface.

A Chrome Web Store exige que cada `version` do manifesto seja maior que a publicada anteriormente e aceita somente números e pontos nesse campo. Por isso o sufixo Beta fica em `version_name`.

## Preparar uma release

1. Atualize os arquivos de versão e registre as mudanças em [`CHANGELOG.md`](CHANGELOG.md).
2. Execute a validação completa descrita em [`CONTRIBUTING.md`](CONTRIBUTING.md).
3. Crie uma tag anotada no commit da release:

   ```bash
   git tag -a v2.0.0-beta.1 -m "Release v2.0.0-beta.1"
   ```

4. Gere o ZIP com o conteúdo de `dist/` na raiz do pacote. Pacotes não são versionados no repositório.

## Publicar na Chrome Web Store

O pacote é enviado ao mesmo item da Chrome Web Store, preservando o identificador da extensão. Depois da aprovação, o Chrome distribui a atualização automaticamente quando a extensão está ociosa. Extensões carregadas em modo de desenvolvedor não recebem essas atualizações.

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
