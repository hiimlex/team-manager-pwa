# Prompt — Interface do "Racha Vôlei" (PWA)

Projete a interface completa de um **PWA mobile-first** chamado **Racha Vôlei**: um app para organizar peladas ("rachas") de **vôlei de areia** entre amigos, nas modalidades **Quarteto (4x4)** e **Dupla (2x2)**. O idioma da interface é **português do Brasil**.

O app é usado principalmente **no celular, na beira da quadra, sob sol forte**, por um admin que monta os times e marca os pontos, e por jogadores que querem ver placar, ranking e o próprio perfil. Também precisa funcionar bem no **desktop** (sidebar) e num **modo TV** (placar em tela cheia projetado ou num celular apoiado na rede).

---

## 1. Identidade visual (design system existente — respeitar)

Tema **dark**, base inspirada no GitHub Dark com acento vermelho forte (tipo iFood). Esporte, energia, competição.

**Cores**
| Token | Hex | Uso |
|---|---|---|
| bg | `#0D1117` | Fundo da página |
| surface | `#161B22` | Cards, sidebar, modais |
| hover | `#21262D` | Hover, fundo de inputs |
| border | `#30363D` | Bordas |
| primary | `#E30613` | Ações principais, destaque, Time A |
| primary-hover | `#C0050F` | Hover do primário |
| primary-muted | `#7D0308` | Fundos sutis de destaque |
| text | `#F0F6FC` | Texto principal |
| text-muted | `#8B949E` | Texto secundário |
| text-dim | `#484F58` | Placeholders, desabilitado |
| success | `#238636` | Vitória, confirmação |
| warning | `#9E6A03` | Deuce, pendências |
| info | `#1F6FEB` | Informativo, Time B (sugestão) |

**Tipografia:** Inter (UI) e JetBrains Mono (placar, números, editor de código). Números de placar devem ser enormes, tabulares e legíveis a distância.

**Componentes base:** cards `rounded-xl` com borda de 1px; botões `rounded-lg` (primário vermelho sólido, ghost com borda, danger com contorno vermelho); inputs escuros com foco em borda vermelha; badges em pílula; ícones estilo **Lucide**. Animação "bump" (escala 1 → 1.3 → 1) quando um ponto é marcado.

**Acessibilidade:** alvos de toque ≥ 48px (botões de +1 do placar bem maiores), contraste AA, não depender só de cor para indicar Time A/B, vencedor ou deuce.

---

## 2. Papéis e permissões

Não existe login com senha para jogadores. O admin cria o grupo; jogadores entram por **link/código de convite** e escolhem nome/apelido.

| Ação | Jogador | Moderador | Admin |
|---|---|---|---|
| Ver rankings e histórico | ✓ | ✓ | ✓ |
| Editar próprio perfil (nome, apelido, foto, idade, altura, posição) | ✓ | ✓ | ✓ |
| Criar racha / controlar placar | ✗ | ✓ | ✓ |
| Editar stats de jogadores | ✗ | propõe | ✓ |
| Aprovar alterações de stats | ✗ | ✗ | ✓ |
| Adicionar/remover jogadores | ✗ | ✗ | ✓ |
| Editar script de sorteio | ✗ | ✗ | ✓ |
| Gerenciar grupo / promover moderadores | ✗ | ✗ | ✓ |

Mostre as telas na visão do **admin** e indique as variações para **jogador** (ações ocultas ou em modo leitura). O jogador **não** edita os próprios stats: no perfil dele a seção de stats é somente leitura.

Cada sessão pertence a **um único grupo**: o usuário só vê jogadores, rachas, scripts e rankings do grupo em que entrou. Não projete navegação entre grupos.

---

## 3. Modelo de dados (para conteúdo realista)

**Jogador:** nome, apelido (é o que aparece no placar), foto, idade, altura (cm), gênero (M/F), posição (Levantador, Ponteiro, Central, Oposto, Líbero, Universal).
**Stats de 1 a 10:** Levantamento, Passe, Ataque, Bloqueio, Físico/Reflexo, Técnica, Visão de jogo.
**Overall:** média ponderada, exibida com 1 casa decimal (ex.: **7.4**) — deve ser o número de destaque do jogador, estilo carta de FIFA.
**Carreira:** vitórias, derrotas, partidas jogadas, % de vitória, rachas jogados, afinidades (parceiros com quem mais vence).

**Grupo:** nome, descrição/local, emblema (imagem), modalidades suportadas (quarteto e/ou dupla), código de convite (8 caracteres), admin, moderadores, jogadores.

**Racha (sessão):** data, modalidade, jogadores presentes, times sorteados, partidas, script de sorteio usado, status `ativo` ou `finalizado`.

**Partida:** Time A × Time B, placar, vencedor, duração, eventos de ponto.
**Regras:** set de **12 pontos**; em **11–11** entra em **deuce** e precisa vencer por **2 de diferença**, sem limite.

**Dupla fixa:** dois jogadores, nome da dupla, V/D, ativa/inativa.

Use dados fictícios brasileiros plausíveis (ex.: grupo "Vôlei da Orla — Boa Viagem", apelidos como "Pezão", "Tati", "Biel", "Má").

---

## 4. O que já existe e o que é novo

O app já tem uma versão funcional (MVP). Redesenhe as telas existentes mantendo os fluxos, e projete as novas seguindo o mesmo sistema.

**Já existem (redesenhar):** Onboarding, Início, Jogadores, Perfil do jogador (stats, foto, afinidades), Grupo (convite, membros, promover/remover, emblema, duplas fixas), Rachas, Detalhe do racha, Montador de racha (presença + modalidade), Placar (ao vivo, desfazer −1, selo de deuce, modo TV), Ranking (3 abas, sem filtro de período) e Editor de scripts (Monaco, templates, botão Testar).

**Novas (roadmap Fases 2 e 3):** filtro semana/mês/sempre e streaks no ranking, conquistas, carta compartilhável, radar e comparação de jogadores, eventos de ponto e linha do tempo do placar, estatísticas pós-jogo, histórico de versões de scripts, sorteio e análise por IA, aprovações de stats entre grupos, feed de atividades, agendamento de pelada, notificações push, compartilhar resultado, perfil público.

Marque as telas e os componentes novos com uma etiqueta discreta "Novo" na entrega, para facilitar a priorização.

## 5. Navegação

- **Mobile:** bottom tab bar com Início, Jogadores, Rachas, Ranking e um item "Mais"/Grupo (Scripts e Grupo só para admin).
- **Desktop:** sidebar fixa à esquerda com logo, emblema/nome do grupo, mesmos itens e o usuário logado com seu papel (badge Admin/Moderador/Jogador) no rodapé.
- O **Placar** é uma rota standalone, fora do layout, compartilhável por link.

---

## 6. Telas a projetar

### 6.1 Onboarding (pública)
- Hero com logo da bola de vôlei e tagline.
- Três caminhos:
  - **Criar grupo**: assistente de 4 etapas (seus dados → nome, local e modalidades → emblema → senha de admin).
  - **Entrar com convite**: código de 8 caracteres ou link → prévia do grupo (emblema, nome, nº de jogadores, admin) → nome, apelido, gênero e altura.
  - **Sou admin**: código + apelido + senha de admin.
- Erros previstos: código inválido, apelido já usado no grupo, senha incorreta, "muitas tentativas, tente mais tarde".
- Estado futuro: "solicitação enviada, aguardando aprovação do admin".

### 6.2 Início / Dashboard
- Cabeçalho do grupo (emblema, nome, local).
- Card de destaque do **racha ativo** (se houver) com placar ao vivo e botão "Abrir placar".
- CTA **"Novo racha"** (admin/mod).
- **Próxima pelada agendada** (data, hora, local) com contagem regressiva.
- Mini-ranking (top 3), últimos rachas, atalhos.
- Admin: card de **aprovações pendentes** (entradas no grupo e propostas de alteração de stats).
- **Feed de atividades** do grupo ("Biel entrou no grupo", "Pezão & Tati venceram 12–9", "Nova conquista: Invicto").

### 6.3 Jogadores (lista)
- Busca, filtros por posição/gênero, ordenação (overall, vitórias, nome).
- Cards/linhas com foto, apelido, posição, overall em destaque e V/D.
- Botão "Adicionar jogador" (admin).

### 6.4 Formulário de jogador (modal / bottom sheet)
- Upload de foto com preview circular e recorte.
- Campos de perfil + **7 sliders de stats (1–10)** com o **overall recalculado ao vivo**.
- Os sliders de stats aparecem só para admin e moderador. Para moderador, ou jogador que também está em outro grupo, mostrar aviso de que a alteração vira **proposta** pendente de aprovação.
- Criar jogador: o admin cadastra pelo app (o jogador entra no grupo sem precisar do link). Incluir upload de foto já na criação.

### 6.5 Perfil do jogador
- Topo estilo **carta de jogador** (foto, apelido, posição, overall grande) — com botão **"Compartilhar carta"** (gera imagem).
- **Radar chart** das 7 stats + barras de stat.
- Carreira: V/D, % vitória, partidas, rachas, **streak atual e maior streak**.
- **Badges/conquistas** (Invicto, Hat-trick, Rei do Bloqueio…), com estados bloqueado/desbloqueado.
- Melhores parceiros (afinidades) com % de vitória juntos.
- Histórico de partidas recentes.
- **Comparar com outro jogador** (radar sobreposto).
- **Análise de desempenho por IA** pós-racha (card com texto gerado e um selo "IA").

### 6.6 Rachas (histórico)
- Lista agrupada por data, com modalidade, nº de jogadores, nº de partidas e status (ativo pulsando / finalizado).
- Botão "Novo racha".

### 6.7 Montador de racha (fluxo em etapas — tela crítica)
1. **Modalidade** (Quarteto/Dupla, se o grupo suportar as duas) e data.
2. **Presença:** grade de jogadores com toque para marcar presentes, contador ("10 presentes → 2 times de 4 + 2 de fora") e "selecionar todos".
3. **Método de sorteio:** algoritmo padrão (serpentina por overall), um script Python salvo do grupo, ou **"Sugestão da IA"** (com justificativa textual de por que os times estão equilibrados). Erros de script aparecem aqui com mensagem clara (ex.: "Script excedeu o tempo limite", "Importação não permitida: os").
4. **Resultado do sorteio:** times lado a lado com overall médio de cada um e indicador de equilíbrio; jogadores podem ser **arrastados entre times** para ajuste manual; botão "Sortear de novo".
5. **Confirmar e iniciar** → abre o placar.

### 6.8 Detalhe do racha
- Resumo (data, modalidade, presentes, script usado).
- Times e lista de partidas com placar, vencedor destacado e duração.
- Classificação do dia (quem mais venceu no racha).
- Ações de admin: nova partida, finalizar racha. Botão **compartilhar resultado** (imagem/link).

### 6.9 Placar digital (tela mais importante)
- Dois lados grandes, **Time A (vermelho) × Time B**, apelidos dos jogadores de cada time, placar gigante em fonte mono.
- Botões **+1** enormes por time (admin/mod), **desfazer** último ponto e, opcionalmente, tipo do ponto (**ace, ataque, bloqueio, erro adversário**) via seleção rápida após o +1.
- Indicador de **"set point"** em 11 e estado **DEUCE** animado e inconfundível em 11–11 (mostrar "vantagem Time A" etc.).
- **Timeline/histograma** de pontos da partida.
- Indicador de conexão em tempo real (ao vivo / reconectando / sessão expirada).
- Botões +1 desabilitados por um instante após o toque para evitar ponto duplo.
- **Fim de partida:** modal de vencedor com placar final, confirmação e "Próxima partida" (com sugestão de quem entra).
- **Estatísticas pós-jogo** por jogador.
- **Modo TV:** tela cheia, sem controles, só placar, nomes e deuce, legível a 5 m; versões retrato e paisagem.
- **Visão do jogador (somente leitura):** mesma tela sem os botões.

### 6.10 Ranking
- Abas: **Vencedores**, **Melhores jogadores** (overall + % vitória), **Duplas**, **Streaks**.
- Filtro de período: **Semana / Mês / Sempre**.
- Pódio visual para o top 3 e lista para o restante, com variação de posição (↑↓).

### 6.11 Editor de scripts Python (admin)
- Layout tipo IDE: lista de scripts à esquerda (com o padrão marcado), editor Monaco no centro, painel de **teste com dados mock** à direita/embaixo mostrando os times de saída.
- **Templates prontos:** Serpentina, Balanceado por overall, Balanceado por posição.
- Erros do Python exibidos inline (linha sublinhada no editor) e no console.
- Resultado do teste mostra os **nomes** dos jogadores em cada time, não só o tamanho.
- Aviso fixo e discreto: scripts rodam isolados, sem acesso a arquivos, rede ou bibliotecas externas. Só são permitidos módulos de cálculo (`random`, `math`, `itertools`, `collections`, `statistics` e afins).
- **Histórico de versões** do script.
- No mobile: abas Editor / Testar / Versões.

### 6.12 Grupo (admin)
- Dados e emblema do grupo, modalidades.
- **Convite:** código grande copiável, link, QR code e botão compartilhar (WhatsApp).
- Membros com papel; promover a moderador, remover.
- Solicitações de entrada e **propostas de alteração de stats** (diff antes → depois, aprovar/rejeitar).
- Duplas fixas do grupo.
- **Agendar próxima pelada** (data, hora, local) — dispara notificação push.

### 6.13 Perfil público do jogador
- Versão pública e compartilhável do perfil (URL amigável), sem ações de edição.

---

## 7. Estados e detalhes de PWA

Para as telas principais, inclua: **carregando** (skeletons), **vazio** (ex.: "Nenhum racha ainda — monte o primeiro!"), **erro** e **offline** (banner indicando dados em cache). Mostre também o **prompt de instalação do PWA**, o pedido de permissão de **notificações push** e um exemplo de notificação ("Nova pelada agendada: sábado 8h, Posto 7").

---

## 8. Entregáveis

1. Mini **style guide** (cores, tipografia, botões, inputs, badges, cards, carta de jogador, chip de posição, indicador de overall).
2. Telas **mobile (390×844)** de todas as seções acima.
3. Versões **desktop (1440×900)** de Dashboard, Ranking, Montador de racha e Editor de scripts.
4. **Placar** em mobile, desktop e Modo TV (retrato e paisagem), incluindo os estados normal, set point, deuce e fim de partida.
5. Protótipo navegável do fluxo principal: **Início → Novo racha → Presença → Sorteio → Placar → Fim de partida → Ranking**.

Priorize clareza e velocidade de uso na quadra: poucas etapas, informação essencial grande, e o placar sempre a um toque de distância quando houver um racha ativo.
