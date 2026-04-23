# Guardião NBR 17225

**Verificador Profissional de Acessibilidade Web conforme ABNT NBR 17225:2025**

Uma extensão de navegador moderna e intuitiva que ajuda desenvolvedores a identificar e corrigir problemas de acessibilidade em websites, seguindo rigorosamente os requisitos da norma brasileira ABNT NBR 17225:2025.

## 🎯 Visão Geral

O **Guardião NBR 17225** transforma a verificação de acessibilidade web em um processo simples e educativo. Ao invés de apenas apontar problemas, a extensão oferece:

- **Análise Automática:** Verifica mais de 30 requisitos de acessibilidade em tempo real
- **Sugestões Práticas:** Recomendações de correção com exemplos de código
- **Simulador de Visão:** Teste como pessoas com daltonismo ou baixa visão veem seu site
- **Exportação Flexível:** Relatórios em JSON e CSV para integração em fluxos de trabalho
- **Interface Intuitiva:** Desenvolvida com React e Ant Design para máxima usabilidade

## ✨ Funcionalidades Principais

### 1. **Verificação de Acessibilidade**
Análise automática de elementos interativos, imagens, cabeçalhos, contraste de cores, formulários e muito mais.

### 2. **Destaque Visual na Página**
Ícones e bordas destacam os problemas diretamente no contexto da página, facilitando a localização e correção.

### 3. **Painel de Detalhes**
Cada violação inclui:
- Referência específica da NBR 17225
- Descrição clara do problema
- Sugestão de correção
- Exemplo de código corrigido
- Nível WCAG correspondente

### 4. **Simulador de Visão**
Simule diferentes tipos de deficiência visual:
- **Protanopia:** Dificuldade em distinguir vermelho e verde
- **Deuteranopia:** Forma mais comum de daltonismo
- **Tritanopia:** Dificuldade em distinguir azul e amarelo
- **Desfoque:** Simula baixa visão

### 5. **Exportação de Relatórios**
- **JSON:** Para integração com ferramentas e scripts
- **CSV:** Para análise em planilhas (Google Sheets, Excel)
- **Impressão:** Relatório detalhado em PDF

## 🚀 Instalação

### Pré-requisitos
- Google Chrome, Edge ou navegador baseado em Chromium (versão 88+)
- Node.js 16+ (para desenvolvimento)

### Instalação da Extensão

1. **Clone ou baixe o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/nbr-17225-guard.git
   cd nbr-17225-guard
   ```

2. **Instale as dependências:**
   ```bash
   pnpm install
   ```

3. **Compile o projeto:**
   ```bash
   pnpm build
   ```

4. **Carregue a extensão no navegador:**
   - Abra `chrome://extensions/`
   - Ative o "Modo de desenvolvedor" (canto superior direito)
   - Clique em "Carregar extensão não empacotada"
   - Selecione a pasta `dist/`

## 📋 Regras Implementadas

A extensão verifica os seguintes requisitos da ABNT NBR 17225:2025:

### Seção 5.1 - Interação por Teclado
- ✅ Acessibilidade por teclado parcial (5.1.13)
- ⚠️ Indicador de foco visível (5.1.1)

### Seção 5.2 - Imagens
- ✅ Texto alternativo para imagens de conteúdo (5.2.1)
- ✅ Texto alternativo para imagens funcionais (5.2.2)

### Seção 5.3 - Cabeçalhos
- ✅ Semântica de cabeçalho (5.3.1)
- ✅ Estrutura de cabeçalhos (5.3.5)

### Seção 5.11 - Cores e Contraste
- ✅ Contraste para texto (5.11.3)
- ✅ Contraste para componentes (5.11.4)

**Legenda:**
- ✅ Totalmente Automatizável
- ⚠️ Semi-Automatizável (requer validação manual)

## 💻 Desenvolvimento

### Estrutura do Projeto

```
nbr-17225-guard/
├── src/
│   ├── components/          # Componentes React
│   ├── rules/              # Regras de acessibilidade
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilitários
│   ├── styles/             # Estilos CSS
│   ├── popup.tsx           # Interface do popup
│   ├── popup.html          # HTML do popup
│   ├── report.tsx          # Página de relatório
│   ├── report.html         # HTML do relatório
│   ├── content.ts          # Content script
│   └── background.ts       # Service worker
├── public/
│   ├── manifest.json       # Manifest da extensão
│   └── icons/              # Ícones
├── vite.config.ts          # Configuração do Vite
└── package.json            # Dependências
```

### Scripts Disponíveis

```bash
# Desenvolvimento com hot reload
pnpm dev

# Build para produção
pnpm build

# Lint do código
pnpm lint

# Type checking
pnpm type-check
```

### Adicionando Novas Regras

1. Crie um novo arquivo em `src/rules/`:
   ```typescript
   // src/rules/my-rule.ts
   import { Rule, Violation } from '@/types';
   
   export const myRule: Rule = {
     id: 'my-rule',
     nbrReference: '5.X.X',
     name: 'Nome da Regra',
     description: 'Descrição',
     severity: 'error',
     wcagLevel: 'A',
     category: 'Totalmente Automatizável',
     check: async (): Promise<Violation[]> => {
       // Implementar lógica
       return [];
     },
   };
   ```

2. Exporte a regra em `src/rules/index.ts`:
   ```typescript
   import { myRule } from './my-rule';
   export const allRules: Rule[] = [
     // ... outras regras
     myRule,
   ];
   ```

## 📚 Referências Importantes

- **[ABNT NBR 17225:2025](https://www.abnt.org.br/)** - Norma oficial de acessibilidade web
- **[WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)** - Web Content Accessibility Guidelines
- **[React](https://react.dev/)** - Biblioteca de UI
- **[Ant Design](https://ant.design/)** - Componentes de UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática para JavaScript

## 🔧 Tecnologias Utilizadas

- **React 19** - Biblioteca de UI
- **TypeScript 5** - Linguagem tipada
- **Vite 8** - Build tool moderno
- **Ant Design 6** - Componentes de UI
- **Chrome Extensions API** - API de extensões

## 📄 Licença

Este projeto é licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para relatar bugs ou sugerir melhorias, abra uma issue no repositório.

## 👨‍💻 Autor

Desenvolvido com ❤️ para melhorar a acessibilidade web no Brasil.

---

**Versão:** 1.0.0  
**Última atualização:** Março de 2026  
**Status:** Em desenvolvimento ativo
