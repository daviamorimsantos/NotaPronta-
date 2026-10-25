# NotaPronta Interativo — versão 1

Uma primeira versão de uma plataforma escolar que transforma um tema em uma experiência de apresentação navegável no navegador.

## O que já funciona
- Página inicial responsiva em português.
- Formulário para tema, matéria, nível, duração, estilo e orientações do professor.
- Modo demonstração automático, mesmo sem chave de IA, para experimentar a navegação.
- Apresentação com capítulos, pontos visuais, quiz clicável e encerramento.
- Editor simples para alterar título, subtítulo, pontos e nota da seção.
- Navegação por botões e setas do teclado, barra de progresso e modo tela cheia.
- Endpoint `/api/generate` para gerar conteúdo real usando a API da OpenAI sem expor a chave no navegador.

## Arquitetura simples
- Frontend: HTML, CSS e JavaScript sem framework.
- Backend: função serverless Vercel em `api/generate.js`.
- IA: API da OpenAI chamada exclusivamente pelo backend.
- Hospedagem recomendada: Vercel para o frontend e backend no mesmo projeto.

## Como publicar com IA
1. Crie ou entre em sua conta no Vercel.
2. Envie este projeto para um repositório GitHub e importe o repositório no Vercel, ou use a CLI do Vercel na pasta do projeto.
3. Nas configurações do projeto no Vercel, abra **Settings → Environment Variables**.
4. Adicione `OPENAI_API_KEY` com sua chave secreta da API. Opcionalmente adicione `OPENAI_MODEL` com `gpt-4o-mini`.
5. Faça o deploy novamente.
6. Abra o endereço de produção do Vercel e teste um tema real.

**Segurança:** nunca coloque sua chave da OpenAI no `app.js`, `index.html` ou em um repositório público. A chave deve existir apenas nas variáveis de ambiente do backend. O uso da API pode gerar cobranças na conta do provedor.

## Testar localmente
Requer Node.js 20+ e Vercel CLI. Na pasta do projeto:

```bash
npm install -g vercel
vercel dev
```

Para testar a geração real localmente, crie um `.env.local` (não publique esse arquivo) com `OPENAI_API_KEY=...` e, opcionalmente, `OPENAI_MODEL=gpt-4o-mini`.

Se não houver backend acessível, o frontend abre uma apresentação demonstrativa. Esse modo serve para experimentar a interface e não representa conteúdo pesquisado ou gerado pela IA.

## Limitação desta versão
A edição é feita durante a sessão e não há banco de dados/contas. A primeira versão não salva projetos na nuvem e não exporta para PPTX; a experiência é apresentada diretamente no navegador. Um PDF pode ser criado usando a função de impressão do navegador como etapa futura, se necessário.
