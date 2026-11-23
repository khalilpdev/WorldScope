# WorldScope — Prompt de implementação para IA local

## Objetivo

Crie uma aplicação full-stack chamada **WorldScope — Global Data Intelligence**, para explorar, visualizar e comparar dados públicos de países. O projeto será executado localmente no **Linux Mint**, usando Docker, PostgreSQL e Redis, e publicado como código aberto no GitHub para demonstrar domínio prático do ecossistema moderno JavaScript/TypeScript.

O autor tem mais de 18 anos de experiência em desenvolvimento de software e **3 anos de experiência profissional com JavaScript**. Tem forte experiência anterior com C#, .NET, APIs REST, bancos relacionais, SQL e Docker. O projeto deve ajudar a demonstrar atualização técnica em React, TypeScript e Node.js. Não atribua ao autor anos de experiência profissional em tecnologias que ele ainda está aprendendo.

Atue como engenheiro de software sênior. Construa software funcional, não apenas exemplos ou pseudocódigo. Trabalhe por fases, valide cada fase e não declare tarefas concluídas sem executar os testes correspondentes.

## 1. Regras obrigatórias

1. Comece inspecionando Linux Mint, arquitetura, versões de Node, pnpm, Docker, Compose e Git, além do conteúdo do diretório atual.
2. Não sobrescreva arquivos existentes sem examiná-los.
3. Antes de instalar dependências do sistema ou alterar configurações, explique o que fará e aguarde confirmação.
4. Use versões estáveis, compatíveis e fixadas no lockfile. Não use versões beta, nightly ou `latest` em imagens Docker.
5. Use TypeScript `strict` no frontend e backend.
6. Não coloque segredos no Git. Crie `.env.example` e `.gitignore`.
7. Trate timeouts, rate limits, respostas inválidas, dados ausentes e indisponibilidade das APIs externas.
8. Não invente dados, resultados de testes, URLs de demonstração ou funcionalidades.
9. Evite microsserviços, Kubernetes e abstrações desnecessárias.
10. Ao final de cada fase, informe arquivos criados, comandos executados, resultados e pendências.

## 2. Produto: WorldScope

Plataforma web para explorar e comparar países com dados de fontes públicas.

### Funcionalidades do MVP

**Dashboard**
- Indicadores globais e quantidade de países disponíveis.
- Países em destaque com bandeira, nome, região e população.
- Gráficos agregados quando houver dados suficientes.
- Estados de carregamento, erro e ausência de dados.

**Explorar países**
- Listagem paginada.
- Busca por nome.
- Filtros por região e sub-região.
- Ordenação por nome e população.
- Página de detalhes.

**Detalhes**
- Nome, bandeira, capital, região, sub-região, idiomas, moedas, população, área e coordenadas.
- Indicadores econômicos históricos quando disponíveis.
- Clima atual/previsão da capital quando houver coordenadas.
- Exibir fonte e data de atualização de cada conjunto de dados.

**Comparação**
- Selecionar de dois a quatro países.
- Comparar população, área, densidade e indicadores econômicos disponíveis.
- Gráficos comparativos.
- Não comparar indicadores com unidades ou períodos incompatíveis.

**UX**
- Interface responsiva.
- Tema claro/escuro.
- Acessibilidade por teclado.
- Formatação de números e datas.
- Interface em inglês por padrão, preparada para internacionalização.

Não implementar autenticação, pagamentos ou recursos sociais no MVP.

## 3. APIs públicas

Use fontes sem chave obrigatória para o fluxo principal:

- REST Countries: https://restcountries.com/
- World Bank API: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589
- Open-Meteo: https://open-meteo.com/en/docs

O frontend deve consumir somente a API própria. O backend integra os provedores externos, normaliza os dados e aplica cache Redis.

Regras:
- Centralize clientes HTTP, URLs, timeouts e tratamento de erros.
- TTL inicial: dados gerais 24h, indicadores históricos 24h, clima 30 min.
- Falha de um provedor não deve derrubar os demais dados disponíveis.
- Identifique origem e data/hora de atualização.
- Respeite limites e termos de uso; não faça scraping.
- Documente campos nulos e indisponíveis.

## 4. Stack proposta

Use monorepo com pnpm workspaces:

```text
worldscope/
├── apps/
│   ├── web/                 # React + TypeScript
│   └── api/                 # NestJS + TypeScript
├── packages/
│   └── shared/              # Tipos/schemas compartilhados, se útil
├── infrastructure/
│   └── docker/
├── docs/
│   ├── architecture.md
│   ├── development.md
│   └── api-examples.md
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

### Frontend
- React estável + TypeScript strict.
- Vite.
- React Router.
- Tailwind CSS.
- shadcn/ui com Radix UI.
- TanStack Query para estado remoto.
- Zustand somente se houver estado global de interface que justifique.
- React Hook Form + Zod.
- Apache ECharts para gráficos.
- React Leaflet/Leaflet se mapa agregar valor.
- Vitest + Testing Library.

### Backend
- Node.js LTS.
- NestJS + TypeScript strict.
- REST API versionada `/api/v1`.
- Prisma ORM.
- PostgreSQL.
- Redis.
- Swagger/OpenAPI.
- DTOs e validação.
- Jest para testes unitários e integração.

### Infraestrutura e qualidade
- Docker Engine e Docker Compose.
- PostgreSQL e Redis em containers.
- ESLint + Prettier.
- Playwright para E2E.
- GitHub Actions para lint, typecheck, testes e build.
- Dockerfiles multi-stage e usuário não-root para produção, quando viável.

Escolha versões estáveis compatíveis no momento da execução, fixe-as e explique no README a função de cada tecnologia. Não adicione bibliotecas redundantes.

## 5. Persistência inicial

Evite persistir cópias desnecessárias de dados públicos. Comece com:

**FavoriteCountry**
- `id` UUID
- `countryCode` ISO
- `createdAt`

**SavedComparison**
- `id` UUID
- `name` opcional
- `countryCodes` com limite de quatro e validação
- `createdAt`
- `updatedAt`

Favoritos e comparações podem ser anônimos no MVP, vinculados a identificador aleatório local ou armazenados no navegador. Não simule autenticação ou segurança inexistente. Documente limitações e deixe autenticação real para evolução futura.

## 6. API mínima

Implemente e documente:

```text
GET /api/v1/health
GET /api/v1/countries
GET /api/v1/countries/:code
GET /api/v1/countries/:code/indicators
GET /api/v1/countries/:code/weather
GET /api/v1/compare?codes=BRA,USA
```

Requisitos:
- Paginação `page` e `limit`.
- Busca `search`.
- Filtros explícitos.
- Validação de códigos ISO.
- JSON consistente e erros com status HTTP apropriado.
- Swagger em `/api/docs`.
- Health check sem expor segredos.
- Exemplos reais em `docs/api-examples.md`.

## 7. Segurança

- CORS restrito às origens necessárias.
- Validar entradas e limitar payload.
- Prisma com queries parametrizadas.
- Rate limiting.
- Não expor variáveis privadas ao frontend.
- Não registrar tokens ou segredos.
- Não retornar stack trace em produção.
- PostgreSQL e Redis não devem ficar expostos à rede externa; se publicados no host para desenvolvimento, vincular a `127.0.0.1`.
- Health checks e políticas de reinício no Compose.

## 8. Preparação do Linux Mint

Primeiro inspecione o sistema e detecte se as ferramentas já existem. Não reinstale o que estiver funcionando.

Atualização e ferramentas básicas:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git curl ca-certificates gnupg build-essential
```

Instale Node usando NVM, escolhendo a linha LTS compatível com o projeto:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

nvm install --lts
nvm use --lts
node --version
npm --version
```

Crie `.nvmrc` com a versão efetivamente validada. Fixe a versão do pnpm no `packageManager` do `package.json`; use Corepack se estiver disponível e adequado à versão escolhida.

Verifique Docker:

```bash
docker --version
docker compose version
```

Se ausente, siga a documentação oficial de instalação do Docker Engine para Ubuntu/Debian compatível com a versão-base do Linux Mint: https://docs.docker.com/engine/install/ubuntu/

Não misture instruções de distribuições diferentes. Valide:

```bash
sudo docker run --rm hello-world
```

Se configurar Docker sem `sudo`, explique que o grupo `docker` concede privilégios equivalentes a root.

## 9. Docker Compose

Crie `docker-compose.yml` com PostgreSQL e Redis:
- volumes persistentes;
- health checks;
- credenciais configuráveis;
- versões de imagens fixadas;
- portas expostas somente em `127.0.0.1` quando necessário;
- rede interna entre serviços.

Crie Dockerfiles multi-stage para web e API. Documente dois modos:
1. Desenvolvimento: web e API fora do Docker, banco e Redis dentro do Compose.
2. Execução completa: todos os serviços em containers.

O modo de desenvolvimento não pode depender de imagem de produção.

## 10. Variáveis de ambiente

Crie `.env.example`, por exemplo:

```dotenv
NODE_ENV=development
API_PORT=3000
WEB_PORT=5173
WEB_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://worldscope:worldscope_dev@localhost:5432/worldscope?schema=public
REDIS_URL=redis://localhost:6379

REST_COUNTRIES_BASE_URL=https://restcountries.com/v3.1
WORLD_BANK_BASE_URL=https://api.worldbank.org/v2
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1
```

Adapte URLs conforme o modo de execução. Entre containers, use nomes dos serviços em vez de `localhost`. O MVP não deve exigir API keys.

## 11. Comandos esperados

Crie scripts reais no `package.json` raiz e nos projetos:

```bash
# Instalação
pnpm install

# Infraestrutura
docker compose up -d postgres redis
docker compose ps

# Banco
pnpm db:generate
pnpm db:migrate
pnpm db:studio

# Desenvolvimento
pnpm dev
pnpm --filter web dev
pnpm --filter api start:dev

# Qualidade
pnpm lint
pnpm format
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build

# Containers
docker compose up -d
docker compose logs -f
docker compose down
```

Fluxo inicial documentado:

```bash
git clone <URL_DO_REPOSITORIO>
cd worldscope
cp .env.example .env
pnpm install
docker compose up -d postgres redis
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Ajuste os comandos ao que for implementado. Não documente scripts inexistentes. Avise que `docker compose down -v` remove volumes e pode apagar os dados locais do banco.

## 12. README técnico obrigatório

Crie `README.md` em inglês profissional, adequado a um portfólio internacional. O README deve ser verdadeiro e reproduzível. Inclua:

1. Nome, descrição e objetivo.
2. Badges reais (não inventar CI, cobertura ou versão).
3. Screenshot/GIF real da aplicação; enquanto não existir, marcar como pendente e explicar como adicionar.
4. Features efetivamente implementadas.
5. Stack e responsabilidade de cada tecnologia.
6. Diagrama Mermaid da arquitetura.
7. Estrutura de diretórios.
8. Requisitos e versões mínimas.
9. Instalação completa no Linux Mint.
10. Configuração de `.env`.
11. Execução via Docker Compose.
12. Execução em desenvolvimento.
13. Todos os scripts disponíveis.
14. Migrações e Prisma Studio.
15. Endpoints com exemplos.
16. APIs externas e links oficiais.
17. Estratégia de cache e tolerância a falhas.
18. Testes, lint, typecheck e build.
19. Decisões arquiteturais.
20. Segurança e limitações conhecidas.
21. Roadmap realista.
22. Como contribuir.
23. Licença e créditos/atribuição das fontes.

Diagrama Mermaid inicial, ajustado ao código real:

```mermaid
flowchart LR
    User[User Browser] --> Web[React Frontend]
    Web --> API[NestJS REST API]
    API --> Cache[(Redis Cache)]
    API --> DB[(PostgreSQL)]
    API --> RC[REST Countries API]
    API --> WB[World Bank API]
    API --> OM[Open-Meteo API]
```

Também crie:
- `docs/architecture.md`
- `docs/development.md`
- `docs/api-examples.md`

Explique por que o backend agrega as APIs externas, como o cache funciona e como o frontend consome a API interna. O README deve ser conferido comando por comando.

## 13. GitHub e código aberto

- `.gitignore` completo para Node, React, NestJS, Prisma, Docker e IDEs.
- `.env.example`, sem segredos.
- Licença MIT, salvo motivo para outra.
- GitHub Actions com instalação reproduzível, lint, typecheck, testes e build.
- Commits pequenos e descritivos.
- Não crie repositório remoto, não faça push e não publique nada sem autorização explícita.

## 14. Fases de implementação

**Fase 0 — Inspeção**
- Inspecionar sistema, versões e diretório.
- Identificar conflitos e ferramentas ausentes.
- Apresentar plano e versões propostas.
- Aguardar autorização antes de instalar ou alterar o sistema.

**Fase 1 — Fundação**
- Monorepo pnpm.
- TypeScript, lint, format e scripts.
- Docker Compose com PostgreSQL e Redis.
- NestJS, React e health check.

**Fase 2 — Backend**
- Clientes REST Countries, World Bank e Open-Meteo.
- Módulos e serviços separados.
- DTOs, validação, cache, erros e Swagger.
- Testes com mocks.

**Fase 3 — Frontend**
- Layout e design system responsivos.
- Dashboard, listagem, busca e filtros.
- Detalhes de país.
- Comparação e gráficos.
- Loading, erro e vazio.

**Fase 4 — Persistência e qualidade**
- Favoritos e comparações salvas.
- Testes unitários, integração e E2E.
- Acessibilidade e responsividade.
- Build de produção.

**Fase 5 — Portfólio**
- README inglês completo.
- Documentação complementar.
- Screenshots reais.
- GitHub Actions.
- Revisão de segurança e `.gitignore`.
- Relatório final com comandos, resultados e pendências.

## 15. Critérios de aceite

- [ ] Instalação limpa com `pnpm install`.
- [ ] PostgreSQL e Redis iniciam via Compose.
- [ ] Migrações Prisma funcionam.
- [ ] Frontend e API iniciam conforme documentação.
- [ ] Health check funciona.
- [ ] Países vêm de fonte pública real.
- [ ] Detalhes e comparação funcionam.
- [ ] Cache Redis é utilizado e verificável.
- [ ] Falhas de provedores são tratadas.
- [ ] Testes passam.
- [ ] Lint e typecheck passam.
- [ ] Build de produção passa.
- [ ] README foi validado comando por comando.
- [ ] Nenhum segredo foi commitado.

## 16. Forma de colaboração

O autor tem experiência forte com .NET e backend. Explique objetivamente diferenças importantes entre o ecossistema Node/React e .NET, sem transformar cada decisão em uma aula longa. Priorize padrões usados em equipes profissionais, legibilidade, testes e simplicidade. Faça uma pergunta objetiva somente quando uma decisão realmente depender do usuário.

**Comece agora pela Fase 0.** Inspecione o ambiente Linux Mint e o diretório atual. Apresente o diagnóstico, o plano e as versões estáveis propostas. Aguarde confirmação antes de instalar dependências do sistema ou fazer alterações destrutivas.
