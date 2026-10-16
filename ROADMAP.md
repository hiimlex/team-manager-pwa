# Racha Vôlei — Roadmap de Desenvolvimento

> App PWA para gerenciamento de peladas/rachas de vôlei de areia (dupla e quarteto).
> Stack: React + Vite (client) · Express + Mongoose (server)
> Deploy: Vercel (client) · Render (server)

---

## Fase 0 — Fundação ✅ (atual)

- [x] Documentação de requisitos (JOGADOR.md, GRUPOS.md, PARTIDAS.md, ADMIN.md)
- [x] Estrutura de pastas do projeto
- [x] Configuração do servidor Express + Mongoose
- [x] Modelos MongoDB (Player, Group, Match, RachaSession, DrawScript)
- [x] Rotas REST básicas (players, groups, matches, rachas, rankings, scripts)
- [x] Integração Cloudinary (upload de foto de jogador)
- [x] Algoritmo padrão de sorteio de times (TypeScript)
- [x] Executor de scripts Python (sandbox via child_process)
- [x] App React com Tailwind (tema dark red/black)
- [x] PWA manifest + service worker
- [x] Configs de deploy (render.yaml, vercel.json)

---

## Fase 1 — MVP Funcional 🔨 (próxima sprint)

### Backend

- [ ] Autenticação JWT (criar grupo = virar admin, entrar por convite = jogador)
- [ ] Middleware de autorização (admin/moderador/jogador)
- [ ] Validação de inputs com Zod
- [ ] WebSocket com Socket.io (placar em tempo real)
- [ ] Seed de dados de exemplo
- [ ] Rate limiting básico (express-rate-limit)
- [ ] Helmet.js (segurança de headers)

### Frontend

- [ ] Fluxo de onboarding (criar/entrar em grupo)
- [ ] Tela de Jogadores — listagem, criação, edição com upload de foto
- [ ] Tela de Grupo — painel com jogadores e convite
- [ ] Montador de Racha — selecionar jogadores presentes → sortear times
- [ ] Placar Digital — tempo real via Socket.io, modo TV
- [ ] Histórico de Partidas — listagem por data
- [ ] Rankings — top vencedores, melhores jogadores, melhores duplas

### Qualidade

- [ ] .env.example completo
- [ ] README.md com instruções de setup
- [ ] Variáveis de ambiente documentadas

---

## Fase 2 — Features Avançadas

### Editor de Script Python

- [ ] Monaco Editor no browser (sintaxe Python)
- [ ] Endpoint de teste de script com dados mock
- [ ] Histórico de versões do script por grupo
- [ ] Templates prontos (serpentina, balanceado por overall, balanceado por posição)
- [ ] Feedback de erro do Python exibido no editor

### Sistema de Ranking

- [ ] Ranking semanal / mensal / all-time
- [ ] Streak de vitórias (maior sequência atual e histórica)
- [ ] Ranking de duplas — pares com maior % de vitórias
- [ ] Badges e conquistas (ex: "Invicto", "Hat-trick", "Rei do Bloqueio")
- [ ] Cards de jogador compartilháveis (imagem gerada)

### Placar Avançado

- [ ] Eventos de ponto (ace, ataque, bloqueio, erro adversário)
- [ ] Timeline de pontos da partida
- [ ] Estatísticas pós-jogo por jogador
- [ ] Modo deuce com indicador visual animado

### Grupos

- [ ] Múltiplos admins por grupo
- [ ] Proposta/aprovação de alteração de stats cross-grupo
- [ ] Feed de atividades do grupo
- [ ] Agendamento de próxima pelada (data/hora/local)

---

## Fase 3 — Social & Notificações

- [ ] Notificações push (PWA) — "Nova pelada agendada!"
- [ ] Compartilhamento de resultado via link/imagem
- [ ] Perfil público do jogador (URL amigável)
- [ ] Comparação entre jogadores (radar chart de stats)
- [ ] IA (Groq) para sugerir montagem de times com justificativa textual
- [ ] IA para analisar desempenho do jogador após racha

---

## Fase 4 — Polimento & Escala

- [ ] Testes unitários (Vitest — server)
- [ ] Testes E2E (Playwright)
- [ ] CI/CD automático (GitHub Actions → Vercel/Render)
- [ ] Otimização de imagens (lazy load, WebP)
- [ ] Offline-first com Service Worker aprimorado
- [ ] Analytics de uso (Umami ou Plausible — self-hosted)
- [ ] Dark/light mode toggle
- [ ] i18n (pt-BR + en-US)

---

## Decisões Técnicas

| Decisão          | Escolha                      | Motivo                                     |
| ---------------- | ---------------------------- | ------------------------------------------ |
| Frontend         | React 18 + Vite + TypeScript | Velocidade de dev, ecossistema             |
| Estilo           | Tailwind CSS v3              | Utility-first, tema customizável           |
| Estado Global    | Zustand                      | Simples, leve                              |
| Requisições      | TanStack Query v5            | Cache, loading states automáticos          |
| Roteamento       | React Router v6              | Padrão React                               |
| Editor de código | Monaco Editor                | Mesmo do VS Code, suporte Python           |
| Realtime         | Socket.io                    | WebSocket simples + fallback               |
| Backend          | Express + TypeScript         | Direto, flexível                           |
| ODM              | Mongoose                     | Schemas com validação para MongoDB         |
| Auth             | JWT + localStorage           | Simples para o contexto de grupos pequenos |
| Upload           | Cloudinary                   | CDN gratuito, transformações de imagem     |
| AI               | Groq (llama-3)               | API gratuita, rápida                       |
| Python runner    | child_process + timeout      | Sandbox mínimo, sem deps extras            |
| Deploy frontend  | Vercel                       | CDN global, CI/CD, gratuito                |
| Deploy backend   | Render                       | Node.js + free tier                        |

---

## Variáveis de Ambiente Necessárias

### Server (`server/.env`)

```env
PORT=3333
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=seu-segredo-aqui
CORS_ORIGIN=http://localhost:5173

CLOUDINARY_CLOUD_NAME=dks9iax3n
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

GROQ_API_KEY=gsk_...
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:3333
VITE_SOCKET_URL=http://localhost:3333
```

---

## Estrutura de Pastas

```
team-manager-pwa/
├── client/                    # React PWA
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   └── src/
│       ├── components/        # Componentes reutilizáveis
│       ├── pages/             # Telas da aplicação
│       ├── hooks/             # Custom hooks
│       ├── services/          # Chamadas à API
│       ├── store/             # Zustand stores
│       └── types/             # TypeScript types
├── server/                    # API Express
│   └── src/
│       ├── models/            # Schemas Mongoose
│       ├── routes/            # Rotas Express
│       ├── middleware/        # Auth, upload, validation
│       ├── services/          # Cloudinary, teamBuilder, python
│       └── config/            # DB, env
├── render.yaml                # Config Render (backend)
├── ROADMAP.md                 # Este arquivo
├── ADMIN.md
├── GRUPOS.md
├── JOGADOR.md
└── PARTIDAS.md
```
