# Jogadores

## Dados do Perfil

| Campo      | Tipo   | Descrição                       |
| ---------- | ------ | ------------------------------- |
| `name`     | string | Nome completo do jogador        |
| `nickname` | string | Apelido (exibido no placar)     |
| `photo`    | string | URL da foto (Cloudinary)        |
| `age`      | number | Idade                           |
| `height`   | number | Altura em cm                    |
| `gender`   | enum   | `M` ou `F`                      |
| `position` | enum   | Posição principal em quadra     |
| `groups`   | ref[]  | Grupos de peladas que participa |

## Posições em Quadra (Vôlei de Praia)

- **Levantador (Setter)** — especialista em levantamento e distribuição
- **Ponteiro (Outside Hitter)** — atacante principal, recepção e ataque
- **Central (Middle)** — bloqueio e ataques rápidos
- **Oposto (Opposite)** — atacante poderoso, oposto ao levantador
- **Líbero** — especialista em defesa e recepção
- **Universal** — jogador versátil sem posição fixa

## Pontuações de Stats (1–10)

| Stat       | Descrição                                           |
| ---------- | --------------------------------------------------- |
| `setting`  | Levantamento — qualidade e precisão dos sets        |
| `passing`  | Passe — recepção e manchete                         |
| `attack`   | Ataque — potência e eficiência nos ataques          |
| `blocking` | Bloqueio — timing e alcance no bloqueio             |
| `physical` | Físico/Reflexo — resistência, velocidade e reflexos |
| `overall`  | Calculado automaticamente (média ponderada)         |

### Fórmula do Overall

```
overall = (
  setting   × 0.15 +
  passing   × 0.20 +
  attack    × 0.25 +
  blocking  × 0.15 +
  physical  × 0.25
) × 10
```

## Estatísticas de Carreira

- `wins` — vitórias totais
- `losses` — derrotas totais
- `matchesPlayed` — partidas jogadas
- `winRate` — percentual de vitórias (calculado)
- `rachasPlayed` — rachas/peladas participadas

## Afinidades

Jogadores podem ter afinidade com parceiros fixos em duplas, influenciando o algoritmo de sorteio. A afinidade é registrada automaticamente com base no histórico de vitórias em dupla.

## Gestão Multi-Grupo

Se um jogador pertencer a mais de um grupo, cada admin pode propor alterações nos stats. As alterações ficam pendentes até aprovação. Em caso de conflito entre grupos, prevalece o histórico de partidas do grupo com mais dados.
