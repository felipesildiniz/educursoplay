/* =========================================================================
   dados.js — AQUI É ONDE VOCÊ COLOCA SUAS AULAS
   -------------------------------------------------------------------------
   • Cada matéria é um objeto dentro da lista CURSOS.
   • Cada aula tem: titulo, duracao e link.
   • Basta trocar o valor de "link" pelo link do vídeo. Pronto!

   LINKS SUPORTADOS NO CAMPO "link":
     YouTube ......... https://www.youtube.com/watch?v=CODIGO
                       https://youtu.be/CODIGO
                       https://www.youtube.com/playlist?list=CODIGO
     Vimeo ........... https://vimeo.com/123456789
     Google Drive .... https://drive.google.com/file/d/CODIGO/view
     Arquivo direto .. https://seusite.com/aula01.mp4
     Qualquer outro .. será carregado dentro do player (iframe)

   DICA: use "duracao" livremente ("32 min", "1h 10min", "" para esconder).
   ========================================================================= */


/* Vídeo de demonstração (Big Buck Bunny).
   Substitua pelo link real de cada aula. */
const DEMO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";


const CURSOS = [

  /* ================================ MATEMÁTICA ============================ */
  {
    id: "matematica",
    nome: "Matemática",
    icone: "📐",
    cor: "#4f46e5",
    descricao: "Álgebra, geometria, funções, estatística e tudo que mais cai na prova.",
    aulas: [
      { titulo: "Aula 01 — Conjuntos numéricos e operações",      duracao: "32 min", link: DEMO },
      { titulo: "Aula 02 — Razão, proporção e porcentagem",        duracao: "28 min", link: DEMO },
      { titulo: "Aula 03 — Funções: domínio, imagem e gráficos",   duracao: "41 min", link: DEMO },
      { titulo: "Aula 04 — Geometria plana: áreas e perímetros",   duracao: "36 min", link: DEMO },
      { titulo: "Aula 05 — Estatística: média, mediana e moda",    duracao: "24 min", link: DEMO },
      { titulo: "Aula 06 — Probabilidade sem mistério",            duracao: "30 min", link: DEMO }
    ]
  },

  /* ================================ PORTUGUÊS ============================ */
  {
    id: "portugues",
    nome: "Português",
    icone: "📖",
    cor: "#0ea5e9",
    descricao: "Interpretação de texto, gramática, figuras de linguagem e literatura.",
    aulas: [
      { titulo: "Aula 01 — Interpretação de texto: como ler a prova", duracao: "27 min", link: DEMO },
      { titulo: "Aula 02 — Funções da linguagem",                     duracao: "22 min", link: DEMO },
      { titulo: "Aula 03 — Figuras de linguagem mais cobradas",       duracao: "31 min", link: DEMO },
      { titulo: "Aula 04 — Coesão e coerência textual",               duracao: "26 min", link: DEMO },
      { titulo: "Aula 05 — Literatura: Modernismo e Vanguardas",      duracao: "38 min", link: DEMO }
    ]
  },

  /* ================================ REDAÇÃO ============================== */
  {
    id: "redacao",
    nome: "Redação",
    icone: "✍️",
    cor: "#f59e0b",
    descricao: "Estrutura dissertativo-argumentativa, repertório e as 5 competências.",
    aulas: [
      { titulo: "Aula 01 — As 5 competências do ENEM",              duracao: "29 min", link: DEMO },
      { titulo: "Aula 02 — Introdução: como começar bem o texto",   duracao: "25 min", link: DEMO },
      { titulo: "Aula 03 — Desenvolvimento e argumentação",         duracao: "33 min", link: DEMO },
      { titulo: "Aula 04 — Proposta de intervenção nota 1000",      duracao: "35 min", link: DEMO },
      { titulo: "Aula 05 — Erros que zeram a redação",              duracao: "20 min", link: DEMO }
    ]
  },

  /* ================================ FÍSICA =============================== */
  {
    id: "fisica",
    nome: "Física",
    icone: "⚛️",
    cor: "#8b5cf6",
    descricao: "Mecânica, termologia, eletricidade e ondas para gabaritar a prova.",
    aulas: [
      { titulo: "Aula 01 — Cinemática: MU e MUV",                   duracao: "34 min", link: DEMO },
      { titulo: "Aula 02 — Leis de Newton",                          duracao: "30 min", link: DEMO },
      { titulo: "Aula 03 — Energia e trabalho",                      duracao: "27 min", link: DEMO },
      { titulo: "Aula 04 — Termologia e calorimetria",               duracao: "32 min", link: DEMO },
      { titulo: "Aula 05 — Eletrodinâmica: circuitos e potência",    duracao: "39 min", link: DEMO }
    ]
  },

  /* ================================ QUÍMICA ============================== */
  {
    id: "quimica",
    nome: "Química",
    icone: "🧪",
    cor: "#10b981",
    descricao: "Química geral, orgânica, físico-química e estequiometria.",
    aulas: [
      { titulo: "Aula 01 — Tabela periódica e propriedades",        duracao: "26 min", link: DEMO },
      { titulo: "Aula 02 — Ligações químicas",                       duracao: "23 min", link: DEMO },
      { titulo: "Aula 03 — Estequiometria passo a passo",            duracao: "37 min", link: DEMO },
      { titulo: "Aula 04 — Soluções e concentração",                 duracao: "29 min", link: DEMO },
      { titulo: "Aula 05 — Química orgânica: funções e cadeias",     duracao: "34 min", link: DEMO }
    ]
  },

  /* ================================ BIOLOGIA ============================= */
  {
    id: "biologia",
    nome: "Biologia",
    icone: "🧬",
    cor: "#22c55e",
    descricao: "Citologia, genética, ecologia e fisiologia humana.",
    aulas: [
      { titulo: "Aula 01 — Citologia: a célula e suas organelas",   duracao: "31 min", link: DEMO },
      { titulo: "Aula 02 — Genética: leis de Mendel",                duracao: "35 min", link: DEMO },
      { titulo: "Aula 03 — Ecologia e cadeias alimentares",          duracao: "28 min", link: DEMO },
      { titulo: "Aula 04 — Fisiologia humana: sistemas",             duracao: "42 min", link: DEMO },
      { titulo: "Aula 05 — Evolução e seleção natural",              duracao: "25 min", link: DEMO }
    ]
  },

  /* ================================ HISTÓRIA ============================= */
  {
    id: "historia",
    nome: "História",
    icone: "🏛️",
    cor: "#d97706",
    descricao: "Brasil colônia ao contemporâneo, mais história geral.",
    aulas: [
      { titulo: "Aula 01 — Brasil Colônia: economia e sociedade",   duracao: "33 min", link: DEMO },
      { titulo: "Aula 02 — Era Vargas",                              duracao: "29 min", link: DEMO },
      { titulo: "Aula 03 — Ditadura Militar no Brasil",              duracao: "36 min", link: DEMO },
      { titulo: "Aula 04 — Guerras Mundiais",                        duracao: "40 min", link: DEMO },
      { titulo: "Aula 05 — Guerra Fria e Nova Ordem Mundial",        duracao: "30 min", link: DEMO }
    ]
  },

  /* ================================ GEOGRAFIA ============================ */
  {
    id: "geografia",
    nome: "Geografia",
    icone: "🌎",
    cor: "#059669",
    descricao: "Geografia física, humana, geopolítica e meio ambiente.",
    aulas: [
      { titulo: "Aula 01 — Climatologia e domínios morfoclimáticos", duracao: "32 min", link: DEMO },
      { titulo: "Aula 02 — Urbanização brasileira",                  duracao: "27 min", link: DEMO },
      { titulo: "Aula 03 — Globalização e blocos econômicos",        duracao: "30 min", link: DEMO },
      { titulo: "Aula 04 — Questões ambientais e sustentabilidade",  duracao: "34 min", link: DEMO },
      { titulo: "Aula 05 — Geopolítica: conflitos atuais",           duracao: "28 min", link: DEMO }
    ]
  },

  /* ================================ FILOSOFIA ============================ */
  {
    id: "filosofia",
    nome: "Filosofia",
    icone: "💭",
    cor: "#a855f7",
    descricao: "Dos pré-socráticos à filosofia contemporânea.",
    aulas: [
      { titulo: "Aula 01 — Filosofia antiga: Sócrates, Platão e Aristóteles", duracao: "31 min", link: DEMO },
      { titulo: "Aula 02 — Filosofia medieval e o pensamento cristão",        duracao: "24 min", link: DEMO },
      { titulo: "Aula 03 — Racionalismo e Empirismo",                          duracao: "29 min", link: DEMO },
      { titulo: "Aula 04 — Ética e moral na contemporaneidade",                duracao: "26 min", link: DEMO }
    ]
  },

  /* ================================ SOCIOLOGIA =========================== */
  {
    id: "sociologia",
    nome: "Sociologia",
    icone: "👥",
    cor: "#ec4899",
    descricao: "Clássicos da sociologia, cultura, trabalho e cidadania.",
    aulas: [
      { titulo: "Aula 01 — Os clássicos: Durkheim, Weber e Marx",   duracao: "33 min", link: DEMO },
      { titulo: "Aula 02 — Cultura, identidade e diversidade",       duracao: "25 min", link: DEMO },
      { titulo: "Aula 03 — Trabalho e desigualdade social",          duracao: "28 min", link: DEMO },
      { titulo: "Aula 04 — Cidadania, direitos e movimentos sociais",duracao: "30 min", link: DEMO }
    ]
  },

  /* ================================ INGLÊS =============================== */
  {
    id: "ingles",
    nome: "Inglês",
    icone: "🇬🇧",
    cor: "#3b82f6",
    descricao: "Leitura, vocabulário e gramática aplicada às provas.",
    aulas: [
      { titulo: "Aula 01 — Reading strategies: skim and scan",      duracao: "22 min", link: DEMO },
      { titulo: "Aula 02 — Tempos verbais essenciais",               duracao: "27 min", link: DEMO },
      { titulo: "Aula 03 — Vocabulário que mais aparece na prova",   duracao: "24 min", link: DEMO },
      { titulo: "Aula 04 — Falsos cognatos (false friends)",         duracao: "18 min", link: DEMO }
    ]
  },

  /* ================================ ESPANHOL ============================= */
  {
    id: "espanhol",
    nome: "Espanhol",
    icone: "🇪🇸",
    cor: "#ef4444",
    descricao: "Compreensão textual, vocabulário e os famosos heterosemánticos.",
    aulas: [
      { titulo: "Aula 01 — Comprensión lectora",                     duracao: "23 min", link: DEMO },
      { titulo: "Aula 02 — Heterosemánticos: los falsos amigos",     duracao: "20 min", link: DEMO },
      { titulo: "Aula 03 — Verbos y tiempos principales",            duracao: "26 min", link: DEMO },
      { titulo: "Aula 04 — Vocabulario temático del ENEM",           duracao: "22 min", link: DEMO }
    ]
  }
];