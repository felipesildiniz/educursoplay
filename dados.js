/* =========================================================================
   🔥 CONFIGURAÇÃO DO FIREBASE
   -------------------------------------------------------------------------
   Cole aqui o objeto firebaseConfig que o Firebase te deu
   (Console → Configurações do projeto → Seus apps → SDK setup)
   ========================================================================= */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCi9qenp3GF_9G73NpvtNHBMdOlz449kdE",
  authDomain: "enemplay-ab041.firebaseapp.com",
  projectId: "enemplay-ab041",
  storageBucket: "enemplay-ab041.firebasestorage.app",
  messagingSenderId: "378105383908",
  appId: "1:378105383908:web:a80850316757c23e2f15f1"
};
/* =========================================================================
   ⚙️  CONFIGURAÇÃO (token do servidor de vídeos)
   🔑 Troque o valor de "sjwt" a cada 30 dias.
   ========================================================================= */
const CONFIG = {
  sjwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQzYTY1MWU4LTYzNGUtNGU4ZS1hODkwLWEwNTA4MjMwOGZiMSIsImlzcyI6IlNwYWxsYSIsImlhdCI6MTc5MTU2Mjk1MCwibmJmIjoxNzkxNTYyOTUwLCJleHAiOjE3OTQxNTQ5NTAsInVyaV9zdWIiOiIvMDE5YTVmOGEtZjM3ZC03MDk0LWFhMTktZGQ0YTExYWY4NmI1LyIsInVpZCI6ImQzYTY1MWU4LTYzNGUtNGU4ZS1hODkwLWEwNTA4MjMwOGZiMSIsImJleSI6ZmFsc2UsImlpcCI6ZmFsc2UsImRwciI6ZmFsc2V9.JdB5dEzchgy_cRDIayz8rGcJeT8iBy32zdoFq2U7B7E",
  cdnBase: "https://sambodromo.singular.cdn.spalla.io/vod",
  uid: "d3a651e8-634e-4e8e-a890-a05082308fb1"
};

function linkDoVideo(videoId){
  if (!videoId || !CONFIG.sjwt) return "";
  return `${CONFIG.cdnBase}/${videoId}/playlist.m3u8?sjwt=${CONFIG.sjwt}&uid=${CONFIG.uid}`;
}


/* =========================================================================
   📚 ESTRUTURA DO CONTEÚDO
   -------------------------------------------------------------------------
   Cada matéria tem "temporadas" (módulos/assuntos).
   Cada temporada tem "aulas".
   Cada aula pode ter:
     • videoId   → ID do vídeo no Spalla
     • link      → link externo (YouTube, Vimeo, Drive, MP4)
     • materiais → lista de arquivos para baixar
        [{ nome: "PDF da aula", url: "https://...", tipo: "pdf" }, ...]

   tipo pode ser: "pdf", "doc", "xls", "zip", "link" (só muda o ícone)
   ========================================================================= */

const CURSOS = [

  /* ============================ MATEMÁTICA ============================ */
  {
    id: "matematica",
    nome: "Matemática",
    icone: "📐",
    cor: "#4f46e5",
    categoria: "exatas",
    descricao: "Álgebra, geometria, funções, estatística e tudo que mais cai na prova.",
    temporadas: [
      {
        nome: "Módulo 1 — Fundamentos",
        aulas: [
          {
            titulo: "Conjuntos numéricos e operações",
            duracao: "32 min",
            videoId: "13faf17c-5948-b598-cb3f-df05361c264f",
            materiais: [
              { nome: "Resumo em PDF",         url: "https://exemplo.com/mat-aula01-resumo.pdf", tipo: "pdf" },
              { nome: "Lista de exercícios",   url: "https://exemplo.com/mat-aula01-lista.pdf",  tipo: "pdf" }
            ]
          },
          {
            titulo: "Razão, proporção e porcentagem",
            duracao: "28 min",
            videoId: "13faf17c-5948-b598-cb3f-df05361c264f",
            materiais: [
              { nome: "Resumo em PDF", url: "https://exemplo.com/mat-aula02.pdf", tipo: "pdf" }
            ]
          },
          {
            titulo: "Potenciação e radiciação",
            duracao: "30 min",
            videoId: "13faf17c-5948-b598-cb3f-df05361c264f",
            materiais: []
          }
        ]
      },
      {
        nome: "Módulo 2 — Funções",
        aulas: [
          {
            titulo: "Funções: domínio, imagem e gráficos",
            duracao: "41 min",
            videoId: "13faf17c-5948-b598-cb3f-df05361c264f",
            materiais: [
              { nome: "Apostila de funções",  url: "https://exemplo.com/mat-aula03.pdf", tipo: "pdf" },
              { nome: "Gráficos (zip)",        url: "https://exemplo.com/mat-graficos.zip", tipo: "zip" }
            ]
          },
          {
            titulo: "Função afim e quadrática",
            duracao: "35 min",
            videoId: "13faf17c-5948-b598-cb3f-df05361c264f",
            materiais: []
          }
        ]
      },
      {
        nome: "Módulo 3 — Geometria e Estatística",
        aulas: [
          { titulo: "Geometria plana: áreas e perímetros", duracao: "36 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Estatística: média, mediana e moda",  duracao: "24 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Probabilidade sem mistério",          duracao: "30 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* ============================== FÍSICA ============================== */
  {
    id: "fisica",
    nome: "Física",
    icone: "⚛️",
    cor: "#8b5cf6",
    categoria: "exatas",
    descricao: "Mecânica, termologia, eletricidade e ondas para gabaritar a prova.",
    temporadas: [
      {
        nome: "Módulo 1 — Mecânica",
        aulas: [
          { titulo: "Cinemática: MU e MUV", duracao: "34 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Leis de Newton",       duracao: "30 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Energia e trabalho",   duracao: "27 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Termologia e Eletricidade",
        aulas: [
          { titulo: "Termologia e calorimetria",            duracao: "32 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Eletrodinâmica: circuitos e potência", duracao: "39 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* ============================= QUÍMICA ============================== */
  {
    id: "quimica",
    nome: "Química",
    icone: "🧪",
    cor: "#10b981",
    categoria: "exatas",
    descricao: "Química geral, orgânica, físico-química e estequiometria.",
    temporadas: [
      {
        nome: "Módulo 1 — Química Geral",
        aulas: [
          { titulo: "Tabela periódica e propriedades", duracao: "26 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Ligações químicas",                duracao: "23 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Físico-Química",
        aulas: [
          { titulo: "Estequiometria passo a passo", duracao: "37 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Soluções e concentração",      duracao: "29 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 3 — Química Orgânica",
        aulas: [
          { titulo: "Funções orgânicas",         duracao: "34 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Cadeias carbônicas",         duracao: "28 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* ============================= BIOLOGIA ============================= */
  {
    id: "biologia",
    nome: "Biologia",
    icone: "🧬",
    cor: "#22c55e",
    categoria: "exatas",
    descricao: "Citologia, genética, ecologia e fisiologia humana.",
    temporadas: [
      {
        nome: "Módulo 1 — Citologia e Genética",
        aulas: [
          { titulo: "Citologia: a célula e suas organelas", duracao: "31 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Genética: leis de Mendel",             duracao: "35 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Ecologia e Evolução",
        aulas: [
          { titulo: "Ecologia e cadeias alimentares", duracao: "28 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Evolução e seleção natural",      duracao: "25 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 3 — Fisiologia Humana",
        aulas: [
          { titulo: "Sistema cardiovascular", duracao: "42 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Sistema nervoso",          duracao: "30 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* ============================== HISTÓRIA =========================== */
  {
    id: "historia",
    nome: "História",
    icone: "🏛️",
    cor: "#d97706",
    categoria: "humanas",
    descricao: "Brasil colônia ao contemporâneo, mais história geral.",
    temporadas: [
      {
        nome: "Módulo 1 — Brasil Colônia e Império",
        aulas: [
          { titulo: "Brasil Colônia: economia e sociedade", duracao: "33 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Brasil Império",                        duracao: "30 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — República",
        aulas: [
          { titulo: "Era Vargas",                duracao: "29 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Ditadura Militar no Brasil", duracao: "36 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 3 — História Geral",
        aulas: [
          { titulo: "Guerras Mundiais",                duracao: "40 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Guerra Fria e Nova Ordem Mundial", duracao: "30 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* ============================= GEOGRAFIA =========================== */
  {
    id: "geografia",
    nome: "Geografia",
    icone: "🌎",
    cor: "#059669",
    categoria: "humanas",
    descricao: "Geografia física, humana, geopolítica e meio ambiente.",
    temporadas: [
      {
        nome: "Módulo 1 — Geografia Física",
        aulas: [
          { titulo: "Climatologia e domínios morfoclimáticos", duracao: "32 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Relevo e hidrografia",                     duracao: "29 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Geografia Humana e Geopolítica",
        aulas: [
          { titulo: "Urbanização brasileira",              duracao: "27 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Globalização e blocos econômicos",    duracao: "30 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Geopolítica: conflitos atuais",       duracao: "28 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* ============================= FILOSOFIA =========================== */
  {
    id: "filosofia",
    nome: "Filosofia",
    icone: "💭",
    cor: "#a855f7",
    categoria: "humanas",
    descricao: "Dos pré-socráticos à filosofia contemporânea.",
    temporadas: [
      {
        nome: "Módulo 1 — Filosofia Antiga e Medieval",
        aulas: [
          { titulo: "Pré-socráticos",                        duracao: "28 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Sócrates, Platão e Aristóteles",        duracao: "31 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Filosofia medieval e o cristianismo",   duracao: "24 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Filosofia Moderna e Contemporânea",
        aulas: [
          { titulo: "Racionalismo e Empirismo",       duracao: "29 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Ética e moral contemporânea",    duracao: "26 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* ============================= SOCIOLOGIA ========================== */
  {
    id: "sociologia",
    nome: "Sociologia",
    icone: "👥",
    cor: "#ec4899",
    categoria: "humanas",
    descricao: "Clássicos da sociologia, cultura, trabalho e cidadania.",
    temporadas: [
      {
        nome: "Módulo 1 — Clássicos",
        aulas: [
          { titulo: "Durkheim",      duracao: "29 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Max Weber",     duracao: "27 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Karl Marx",     duracao: "33 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Temas Contemporâneos",
        aulas: [
          { titulo: "Cultura, identidade e diversidade",         duracao: "25 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Trabalho e desigualdade social",            duracao: "28 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Cidadania, direitos e movimentos sociais",  duracao: "30 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* ============================== PORTUGUÊS ========================== */
  {
    id: "portugues",
    nome: "Português",
    icone: "📖",
    cor: "#0ea5e9",
    categoria: "linguagens",
    descricao: "Interpretação de texto, gramática, figuras de linguagem e literatura.",
    temporadas: [
      {
        nome: "Módulo 1 — Interpretação e Gramática",
        aulas: [
          { titulo: "Interpretação de texto: como ler a prova", duracao: "27 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Funções da linguagem",                      duracao: "22 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Coesão e coerência textual",                duracao: "26 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Literatura",
        aulas: [
          { titulo: "Barroco e Arcadismo",              duracao: "30 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Modernismo e Vanguardas",          duracao: "38 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* =============================== REDAÇÃO =========================== */
  {
    id: "redacao",
    nome: "Redação",
    icone: "✍️",
    cor: "#f59e0b",
    categoria: "linguagens",
    descricao: "Estrutura dissertativo-argumentativa, repertório e as 5 competências.",
    temporadas: [
      {
        nome: "Módulo 1 — Estrutura",
        aulas: [
          { titulo: "As 5 competências do ENEM",              duracao: "29 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Introdução: como começar bem o texto",   duracao: "25 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Desenvolvimento e argumentação",         duracao: "33 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Nota 1000",
        aulas: [
          { titulo: "Proposta de intervenção",     duracao: "35 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Erros que zeram a redação",   duracao: "20 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* =============================== INGLÊS ============================ */
  {
    id: "ingles",
    nome: "Inglês",
    icone: "🇬🇧",
    cor: "#3b82f6",
    categoria: "linguagens",
    descricao: "Leitura, vocabulário e gramática aplicada às provas.",
    temporadas: [
      {
        nome: "Módulo 1 — Reading & Vocabulary",
        aulas: [
          { titulo: "Reading strategies: skim and scan",      duracao: "22 min", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
          { titulo: "Vocabulário que mais aparece na prova",  duracao: "24 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Grammar",
        aulas: [
          { titulo: "Tempos verbais essenciais",       duracao: "27 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Falsos cognatos (false friends)", duracao: "18 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  },

  /* ============================== ESPANHOL =========================== */
  {
    id: "espanhol",
    nome: "Espanhol",
    icone: "🇪🇸",
    cor: "#ef4444",
    categoria: "linguagens",
    descricao: "Compreensão textual, vocabulário e os famosos heterosemánticos.",
    temporadas: [
      {
        nome: "Módulo 1 — Comprensión",
        aulas: [
          { titulo: "Comprensión lectora",                 duracao: "23 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Heterosemánticos: los falsos amigos", duracao: "20 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      },
      {
        nome: "Módulo 2 — Gramática y Vocabulario",
        aulas: [
          { titulo: "Verbos y tiempos principales", duracao: "26 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" },
          { titulo: "Vocabulario temático del ENEM", duracao: "22 min", videoId: "13faf17c-5948-b598-cb3f-df05361c264f" }
        ]
      }
    ]
  }
];