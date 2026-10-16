# Admin

## Papéis e Permissões

| Ação                        | Jogador | Moderador | Admin |
| --------------------------- | ------- | --------- | ----- |
| Ver rankings e histórico    | ✓       | ✓         | ✓     |
| Editar próprio perfil       | ✓       | ✓         | ✓     |
| Criar racha                 | ✗       | ✓         | ✓     |
| Iniciar/parar placar        | ✗       | ✓         | ✓     |
| Editar stats de jogadores   | ✗       | proposta  | ✓     |
| Aprovar alterações de stats | ✗       | ✗         | ✓     |
| Adicionar/remover jogadores | ✗       | ✗         | ✓     |
| Editar script de sorteio    | ✗       | ✗         | ✓     |
| Gerenciar grupo             | ✗       | ✗         | ✓     |
| Promover moderadores        | ✗       | ✗         | ✓     |

## Fluxo de Autenticação

O app usa **JWT** sem usuário/senha formal:

1. O admin cria o grupo e recebe um **token de admin**
2. Jogadores entram pelo link de convite e escolhem um nome/apelido
3. O admin pode promover qualquer jogador a moderador
4. Sessions armazenadas com `localStorage` no client

## Painel do Admin

- Visão geral do grupo (jogadores, últimos rachas)
- Aprovações pendentes de alterações de stats
- Editor de script Python de sorteio de times
- Gestão de jogadores (adicionar, remover, editar)
- Histórico completo de rachas

## Editor de Script Python (Sorteio de Times)

O admin pode escrever um script Python que recebe os jogadores presentes e retorna os times:

```python
# Variáveis disponíveis:
# players: list[dict] - Lista de jogadores com seus stats
# match_type: str - 'quartet' ou 'doubles'
# Retornar:
# teams: list[list[str]] - Lista de times (cada time é lista de player IDs)

players.sort(key=lambda p: p['overall'], reverse=True)

teams = [[], []]
for i, player in enumerate(players):
    teams[i % 2].append(player['_id'])

# 'teams' é a variável de saída
```

O servidor executa o script em um sandbox Python seguro via `child_process`.
