# Grupos

Grupos representam comunidades de jogadores que se reúnem para peladas/rachas regulares.

## Dados do Grupo

| Campo           | Tipo   | Descrição                          |
| --------------- | ------ | ---------------------------------- |
| `name`          | string | Nome do grupo                      |
| `description`   | string | Descrição / local da pelada        |
| `admin`         | ref    | Jogador administrador principal    |
| `moderators`    | ref[]  | Admins adicionais                  |
| `players`       | ref[]  | Jogadores membros                  |
| `inviteCode`    | string | Código único para entrar no grupo  |
| `type`          | enum   | `quartet` (4x4) ou `doubles` (2x2) |
| `defaultScript` | string | Script Python padrão de sorteio    |
| `createdAt`     | Date   | Data de criação                    |

## Tipos de Grupo

- **Quarteto (4x4)** — pelada com times de 4 jogadores
- **Dupla (2x2)** — pelada de duplas de praia

## Gestão de Jogadores pelo Admin

1. Admin adiciona jogadores via código de convite ou busca por nome
2. Admin pode editar os stats de qualquer jogador do grupo
3. Alterações em jogadores que estão em outros grupos geram uma **proposta de alteração** pendente
4. O admin do outro grupo pode aceitar ou rejeitar a proposta
5. Admin pode remover jogadores do grupo
6. Admin pode promover jogadores a moderadores

## Fluxo de uma Pelada (Racha)

1. Admin cria uma sessão de racha (`RachaSession`) selecionando jogadores presentes
2. O sistema sugere a distribuição de times via algoritmo (ou script Python customizado)
3. Admin confirma ou ajusta os times manualmente
4. Racha começa: placar digital ativado
5. Partidas são registradas sequencialmente
6. Ao final, o racha é fechado e o histórico é salvo

## Link de Convite

Cada grupo possui uma URL de convite no formato:

```
https://rachavolei.app/grupo/{inviteCode}
```

Ao acessar o link, o jogador pode solicitar entrada. O admin aprova ou rejeita.
