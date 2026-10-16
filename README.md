# Racha Vôlei 🏐

Gerenciador de peladas/rachas de vôlei de areia (dupla e quarteto).

## Stack

| Camada            | Tech                                        |
| ----------------- | ------------------------------------------- |
| Frontend          | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend           | Express + TypeScript + Mongoose             |
| Banco de dados    | MongoDB (Atlas)                             |
| Upload de imagens | Cloudinary                                  |
| IA                | Groq (llama-3)                              |
| Tempo real        | Socket.io                                   |
| Deploy frontend   | Vercel                                      |
| Deploy backend    | Render                                      |

## Estrutura

```
team-manager-pwa/
├── client/      # React PWA
├── server/      # API Express + Mongoose
├── render.yaml  # Config Render (backend)
├── vercel.json  # Config Vercel (frontend)
└── ROADMAP.md   # Plano de desenvolvimento
```

## Setup Local

### Pré-requisitos

- Node.js 20+
- Python 3 (para execução de scripts de sorteio)
- MongoDB Atlas (ou local)

### 1. Clone e instale

```bash
# Backend
cd server
npm install
cp .env.example .env
# Edite .env com sua MONGODB_URI

# Frontend
cd ../client
npm install
cp .env.example .env
```

### 2. Inicie os servidores

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

O frontend estará em `http://localhost:5173`  
O backend estará em `http://localhost:3333`

## Deploy

### Backend (Render)

1. Conecte o repositório no Render
2. Configure as variáveis de ambiente (veja `render.yaml`)
3. Render detecta automaticamente a configuração

### Frontend (Vercel)

1. Importe o repositório no Vercel
2. Configure `VITE_API_URL` e `VITE_SOCKET_URL` para a URL do Render
3. Vercel usa automaticamente o `vercel.json`

## Variáveis de Ambiente

### Server (`server/.env`)

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=dks9iax3n
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GROQ_API_KEY=...
CORS_ORIGIN=http://localhost:5173
```

### Client (`client/.env`)

```
VITE_API_URL=http://localhost:3333
VITE_SOCKET_URL=http://localhost:3333
```

## Funcionalidades

- ✅ Cadastro de jogadores com foto e stats detalhados
- ✅ Grupos com código de convite
- ✅ Sorteio de times (algoritmo serpentina + scripts Python customizados)
- ✅ Placar digital em tempo real (Socket.io) com modo TV
- ✅ Histórico de partidas e rachas
- ✅ Rankings — top vencedores, melhores jogadores, melhores duplas
- ✅ Editor de scripts Python (Monaco Editor) com templates prontos
- ✅ PWA instalável

## Roadmap

Veja [ROADMAP.md](ROADMAP.md) para o plano completo de desenvolvimento.
