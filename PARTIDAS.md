# Partidas

## Regras de Pontuação

- Cada partida é um set de **12 pontos**
- A equipe que marcar 12 pontos primeiro vence
- No placar **11–11**, entra em modo **deuce**: precisa vencer por **2 pontos de diferença**
- Não há limite máximo de pontos no deuce

## Modalidades

| Modalidade   | Jogadores por Time | Total em Quadra |
| ------------ | ------------------ | --------------- |
| **Quarteto** | 4                  | 8               |
| **Dupla**    | 2                  | 4               |

## Sessão de Racha (RachaSession)

Um racha é uma sessão composta por várias partidas consecutivas:

- **Data** do racha
- **Jogadores presentes** (selecionados pelo admin)
- **Tipo**: quarteto ou dupla
- **Times** sorteados (pelo algoritmo ou script Python)
- **Partidas** realizadas durante o racha
- **Script de sorteio** utilizado (salvo para histórico)
- **Status**: `active` ou `finished`

## Placar Digital

O placar digital é exibido em tempo real via WebSocket (Socket.io):

- Exibe os dois times com nomes/apelidos dos jogadores
- Botões `+1` para cada time (apenas admin)
- Indicador visual de deuce
- Histograma de pontos da partida atual
- Ao atingir 12 pontos (ou vencer o deuce): confirmação automática e inicia nova partida
- Modo **TV** (tela cheia) para projetar em telinha/celular dos jogadores

## Registro de Partida

Cada partida registra:

| Campo               | Descrição                             |
| ------------------- | ------------------------------------- |
| `rachaSession`      | Referência ao racha                   |
| `teamA` / `teamB`   | Lista de jogadores de cada time       |
| `scoreA` / `scoreB` | Placar final                          |
| `winner`            | `A` ou `B`                            |
| `date`              | Data/hora da partida                  |
| `duration`          | Duração em minutos (opcional)         |
| `events`            | Array de eventos (cada ponto marcado) |

## Histórico e Rankings

Com base nas partidas registradas:

- **Ranking de Vencedores** — quem mais ganhou partidas (total e por período)
- **Ranking de Jogadores** — baseado em overall + win rate
- **Ranking de Duplas** — pares com maior % de vitórias juntos
- **Streak** — maior sequência de vitórias
- **Histórico por Data** — listagem de rachas passados com todos os resultados
