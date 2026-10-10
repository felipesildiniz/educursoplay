/* =========================================================================
   ENEM Play — app.js
   Roteamento, player, playlist e progresso.
   ========================================================================= */

/* --------------------------- Constantes --------------------------- */
const $app   = document.getElementById('app');
const KEY_PROG  = 'enemplay:progresso';
const KEY_ULT   = 'enemplay:ultimo';
const KEY_TEMA  = 'enemplay:tema';

const ICONE_CHECK = `<svg class="pl-check" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICONE_PLAY  = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor"/></svg>`;

/* --------------------------- Utilidades --------------------------- */
function lerStorage(chave, padrao){
  try { const v = JSON.parse(localStorage.getItem(chave)); return v ?? padrao; }
  catch { return padrao; }
}
function gravarStorage(chave, valor){
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch {}
}
function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}
function normaliza(s){
  return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

/* --------------------------- Estado ------------------------------- */
let progresso = lerStorage(KEY_PROG, {});   // { cursoId: { "0": true } }
let ultimo    = lerStorage(KEY_ULT, {});    // { cursoId: 3 }
let atual     = { cursoId: null, idx: 0 };

/* --------------------------- Dados -------------------------------- */
function cursoPorId(id){ return CURSOS.find(c => c.id === id); }
function feitasNoCurso(curso){
  const p = progresso[curso.id] || {};
  return curso.aulas.reduce((n, _, i) => n + (p[i] ? 1 : 0), 0);
}
function pctCurso(curso){
  const t = curso.aulas.length;
  return t ? Math.round((feitasNoCurso(curso) / t) * 100) : 0;
}
function isFeita(cursoId, i){ return !!(progresso[cursoId] && progresso[cursoId][i]); }

/* --------------------------- Player: link -> embed ---------------- */
function embedDoLink(link){
  const url = String(link || '').trim();
  if (!url) return { tipo: 'vazio' };

  // YouTube — vídeo único
  let m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) return {
    tipo: 'iframe',
    src: `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1`
  };

  // YouTube — playlist
  m = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (/youtube\.com/.test(url) && m) return {
    tipo: 'iframe',
    src: `https://www.youtube-nocookie.com/embed/videoseries?list=${m[1]}&rel=0&modestbranding=1`
  };

  // Vimeo
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { tipo: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };

  // Google Drive
  m = url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (m) return { tipo: 'iframe', src: `https://drive.google.com/file/d/${m[1]}/preview` };

  // Arquivo de vídeo direto
  if (/\.(mp4|webm|ogv|ogg|m4v|mov)(\?.*)?$/i.test(url)) return { tipo: 'video', src: url };

  // Qualquer outro link entra como iframe
  return { tipo: 'iframe', src: url };
}

function playerHtml(aula){
  const emb = embedDoLink(aula.link);

  if (emb.tipo === 'iframe') {
    return `<iframe src="${esc(emb.src)}"
              title="${esc(aula.titulo)}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen></iframe>`;
  }
  if (emb.tipo === 'video') {
    return `<video src="${esc(emb.src)}" controls playsinline preload="metadata"></video>`;
  }
  return `<div class="player__vazio">
            <div>
              <svg viewBox="0 0 24 24" fill="none"><path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" opacity=".55"/></svg>
              <strong>Nenhum vídeo adicionado ainda</strong>
              <p>Abra o arquivo <code>dados.js</code> e cole o link desta aula no campo <code>link</code>.</p>
            </div>
          </div>`;
}

/* =========================================================================
   VIEWS
   ========================================================================= */

/* --------------------------- HOME --------------------------------- */
function viewHome(){
  const totalAulas = CURSOS.reduce((n, c) => n + c.aulas.length, 0);

  // Cartão "continuar assistindo"
  let continuar = '';
  const idsComProgresso = Object.keys(ultimo).filter(id => cursoPorId(id));
  if (idsComProgresso.length){
    const id = idsComProgresso[idsComProgresso.length - 1];
    const curso = cursoPorId(id);
    const i = Math.min(ultimo[id] || 0, curso.aulas.length - 1);
    const aula = curso.aulas[i];
    continuar = `
      <div class="continuar anim" style="margin-bottom:34px">
        <div class="continuar__ico">${ICONE_PLAY}</div>
        <div class="continuar__txt">
          <small>Continuar assistindo</small>
          <h3>${esc(aula.titulo)}</h3>
          <p>${esc(curso.nome)} · Aula ${i + 1} de ${curso.aulas.length}</p>
        </div>
        <a class="btn btn--primaria" href="#/curso/${curso.id}/${i}">Retomar aula</a>
      </div>`;
  }

  return `
  <section class="hero">
    <div class="container">
      <div class="hero__inner">
        <span class="hero__tag anim">Curso completo e gratuito</span>
        <h1 class="anim anim-d1">Todas as matérias do <span class="grad">ENEM</span> em um só lugar</h1>
        <p class="anim anim-d2">Assista às aulas em sequência, acompanhe seu progresso aula por aula e estude no seu ritmo — no computador, no tablet ou no celular.</p>
        <div class="hero__acoes anim anim-d2">
          <a class="btn btn--primaria" href="#/cursos">
            ${ICONE_PLAY} Ver todas as matérias
          </a>
          <a class="btn btn--fantasma" href="#/ajuda">Como adicionar aulas</a>
        </div>
        <div class="hero__stats anim anim-d3">
          <div class="stat"><div class="stat__n">${CURSOS.length}</div><div class="stat__l">Matérias</div></div>
          <div class="stat"><div class="stat__n">${totalAulas}</div><div class="stat__l">Aulas em vídeo</div></div>
          <div class="stat"><div class="stat__n">100%</div><div class="stat__l">Gratuito</div></div>
        </div>
      </div>
    </div>
  </section>

  <section class="secao">
    <div class="container">
      ${continuar}
      <div class="secao__cabecalho">
        <div>
          <h2>Escolha uma matéria</h2>
          <p>Clique para abrir a playlist e começar a assistir.</p>
        </div>
        <a class="link-ver" href="#/cursos">Ver todas →</a>
      </div>
      <div class="grade-cursos">${gradeCursos(CURSOS)}</div>
    </div>
  </section>`;
}

/* --------------------------- GRADE DE CARDS ----------------------- */
function gradeCursos(lista){
  if (!lista.length){
    return `<div class="vazio" style="grid-column:1/-1">
      <div class="vazio__ico">🔎</div>
      <h3>Nenhuma matéria encontrada</h3>
      <p>Tente outro termo de busca.</p>
    </div>`;
  }
  return lista.map(curso => {
    const pct  = pctCurso(curso);
    const feit = feitasNoCurso(curso);
    return `
    <a class="card-curso anim" href="#/curso/${curso.id}" style="--cor:${curso.cor}">
      <div class="card-curso__topo">
        <div class="card-curso__ico">${curso.icone}</div>
        <div>
          <h3>${esc(curso.nome)}</h3>
          <div class="card-curso__meta">${curso.aulas.length} aulas</div>
        </div>
      </div>
      <p style="font-size:.84rem;color:var(--texto-2);line-height:1.5">${esc(curso.descricao)}</p>
      <div class="card-curso__prog">
        <div class="barra"><span style="width:${pct}%"></span></div>
        <div class="card-curso__pct">
          <span>${feit} de ${curso.aulas.length} concluídas</span>
          <b>${pct}%</b>
        </div>
      </div>
    </a>`;
  }).join('');
}

/* --------------------------- PÁGINA DE CURSOS --------------------- */
function viewCursos(){
  return `
  <section class="secao">
    <div class="container">
      <div class="secao__cabecalho" style="padding-top:34px">
        <div>
          <h2>Todos os cursos</h2>
          <p>${CURSOS.length} matérias · ${CURSOS.reduce((n,c)=>n+c.aulas.length,0)} aulas</p>
        </div>
      </div>
      <div class="grade-cursos">${gradeCursos(CURSOS)}</div>
    </div>
  </section>`;
}

/* --------------------------- PÁGINA DO CURSO ---------------------- */
function viewCurso(cursoId, aulaParam){
  const curso = cursoPorId(cursoId);
  if (!curso) return view404();

  let idx = (aulaParam === undefined || aulaParam === '')
    ? (ultimo[cursoId] ?? 0)
    : Number(aulaParam);

  if (!Number.isInteger(idx) || idx < 0 || idx >= curso.aulas.length) idx = 0;

  atual = { cursoId, idx };
  ultimo[cursoId] = idx;
  gravarStorage(KEY_ULT, ultimo);

  const aula   = curso.aulas[idx];
  const feita  = isFeita(cursoId, idx);
  const feitas = feitasNoCurso(curso);
  const pct    = pctCurso(curso);

  return `
  <div class="container">
    <a class="voltar" href="#/cursos">
      <svg viewBox="0 0 24 24" fill="none" width="15" height="15"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Todos os cursos
    </a>

    <div class="curso-head anim" style="--cor:${curso.cor}">
      <div class="curso-head__ico">${curso.icone}</div>
      <div class="curso-head__info">
        <h1>${esc(curso.nome)}</h1>
        <p>${esc(curso.descricao)}</p>
      </div>
      <div class="curso-head__prog">
        <div class="barra"><span id="prog-barra" style="width:${pct}%;background:linear-gradient(90deg,${curso.cor},${curso.cor}aa)"></span></div>
        <small id="prog-texto">${feitas} de ${curso.aulas.length} aulas concluídas</small>
      </div>
    </div>

    <div class="player-grid">
      <div class="player-col anim anim-d1">
        <div class="player" id="player">${playerHtml(aula)}</div>

        <div class="aula-info">
          <span class="chip">Aula ${idx + 1} de ${curso.aulas.length}</span>
          <h2>${esc(aula.titulo)}</h2>
          ${aula.duracao ? `<p>Duração: ${esc(aula.duracao)}</p>` : ''}

          <div class="aula-acoes">
            <button class="btn ${feita ? 'btn--ok ativo' : 'btn--fantasma'}"
                    data-acao="concluir" id="btn-concluir" type="button">
              ${feita ? '✓ Aula concluída' : 'Marcar como concluída'}
            </button>

            <button class="btn btn--fantasma" data-acao="anterior" type="button"
                    ${idx === 0 ? 'disabled' : ''}>
              ← Anterior
            </button>

            <button class="btn btn--primaria" data-acao="proxima" type="button"
                    ${idx === curso.aulas.length - 1 ? 'disabled' : ''}>
              Próxima aula →
            </button>
          </div>
        </div>
      </div>

      <aside class="playlist-col anim anim-d2">
        <div class="playlist-topo">
          <h3>Playlist do curso</h3>
          <span id="pl-contador">${feitas}/${curso.aulas.length}</span>
        </div>
        <ol class="playlist" id="playlist">
          ${curso.aulas.map((a, i) => {
            const done = isFeita(curso.id, i);
            return `
            <li>
              <a class="pl-item ${i === idx ? 'is-ativo' : ''} ${done ? 'is-feito' : ''}"
                 href="#/curso/${curso.id}/${i}" data-i="${i}">
                <span class="pl-num">
                  <span class="pl-n">${i + 1}</span>
                  ${ICONE_CHECK}
                </span>
                <span class="pl-txt">
                  <span class="pl-titulo">${esc(a.titulo)}</span>
                  ${a.duracao ? `<span class="pl-dur">${esc(a.duracao)}</span>` : ''}
                </span>
              </a>
            </li>`;
          }).join('')}
        </ol>
      </aside>
    </div>
  </div>`;
}

/* --------------------------- BUSCA -------------------------------- */
function viewBusca(termo){
  const t = normaliza(termo).trim();

  if (!t) {
    return `
    <div class="container">
      <div class="busca-cabecalho">
        <h1>Buscar aulas</h1>
        <p>Digite o nome de uma matéria ou de uma aula na barra de busca acima.</p>
      </div>
      <div style="padding:34px 0 70px">
        <div class="grade-cursos">${gradeCursos(CURSOS)}</div>
      </div>
    </div>`;
  }

  const grupos = [];

  CURSOS.forEach(curso => {
    const nomeCursoBate = normaliza(curso.nome).includes(t);
    const aulas = curso.aulas
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => nomeCursoBate || normaliza(a.titulo).includes(t));

    if (aulas.length) grupos.push({ curso, aulas });
  });

  const total = grupos.reduce((n, g) => n + g.aulas.length, 0);

  const conteudo = grupos.length
    ? grupos.map(g => `
        <div class="grupo-resultado anim">
          <div class="grupo-resultado__titulo" style="--cor:${g.curso.cor}">
            <span class="pt"></span>
            <span>${g.curso.icone} ${esc(g.curso.nome)}</span>
            <small>${g.aulas.length} aula${g.aulas.length > 1 ? 's' : ''}</small>
          </div>
          <div class="lista-resultados">
            ${g.aulas.map(({ a, i }) => `
              <a class="res-item" href="#/curso/${g.curso.id}/${i}">
                <span class="res-item__n">${i + 1}</span>
                <span class="res-item__t">${esc(a.titulo)}</span>
                <span class="res-item__d">${esc(a.duracao || '')} →</span>
              </a>`).join('')}
          </div>
        </div>`).join('')
    : `<div class="vazio">
         <div class="vazio__ico">🔎</div>
         <h3>Nada encontrado para “${esc(termo)}”</h3>
         <p>Verifique a escrita ou tente buscar pelo nome da matéria (ex.: “matemática”, “redação”).</p>
         <a class="btn btn--primaria" href="#/cursos">Ver todos os cursos</a>
       </div>`;

  return `
  <div class="container">
    <div class="busca-cabecalho">
      <h1>Resultados para <mark>${esc(termo)}</mark></h1>
      <p>${total} aula${total === 1 ? '' : 's'} encontrada${total === 1 ? '' : 's'} em ${grupos.length} matéria${grupos.length === 1 ? '' : 's'}.</p>
    </div>
    <div style="padding:26px 0 70px">${conteudo}</div>
  </div>`;
}

/* --------------------------- AJUDA -------------------------------- */
function viewAjuda(){
  return `
  <div class="container">
    <article class="doc">
      <h1>Como adicionar suas aulas</h1>
      <p class="lead">Todo o conteúdo do site vem de um único arquivo: <code>dados.js</code>. Você não precisa mexer em mais nada — basta colar o link do vídeo.</p>

      <div class="cartao-aviso">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8h.01M11 12h1v4h1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p><strong>Resumo:</strong> abra <code>dados.js</code>, encontre a aula desejada e troque o valor de <code>link</code> pelo link do seu vídeo. Salve e atualize a página.</p>
      </div>

      <h2>1. Adicionar ou editar uma aula</h2>
      <p>Cada aula é um bloco com três campos: <code>titulo</code>, <code>duracao</code> e <code>link</code>.</p>

      <pre><code>{
  titulo: <span class="s">"Aula 01 — Conjuntos numéricos"</span>,
  duracao: <span class="s">"32 min"</span>,
  link:    <span class="s">"https://www.youtube.com/watch?v=CODIGO_DO_VIDEO"</span>
}</code></pre>

      <p>Para adicionar uma nova aula, copie um bloco inteiro, cole abaixo do último e <strong>não esqueça da vírgula</strong> entre eles.</p>

      <h2>2. Adicionar uma nova matéria</h2>
      <p>Copie o modelo abaixo e cole dentro da lista <code>CURSOS</code>:</p>

      <pre><code>{
  id: <span class="s">"matematica"</span>,          <span class="c">// sem espaços e sem acentos</span>
  nome: <span class="s">"Matemática"</span>,
  icone: <span class="s">"📐"</span>,                <span class="c">// qualquer emoji</span>
  cor: <span class="s">"#4f46e5"</span>,            <span class="c">// cor do card</span>
  descricao: <span class="s">"Álgebra, geometria e estatística."</span>,
  aulas: [
    { titulo: <span class="s">"Aula 01 — ..."</span>, duracao: <span class="s">"30 min"</span>, link: <span class="s">"https://..."</span> },
    { titulo: <span class="s">"Aula 02 — ..."</span>, duracao: <span class="s">"25 min"</span>, link: <span class="s">"https://..."</span> }
  ]
}</code></pre>

      <h2>3. Links aceitos no player</h2>
      <p>O player detecta o tipo de link automaticamente. Você só cola:</p>

      <table class="tabela-links">
        <thead>
          <tr><th>Plataforma</th><th>Formato do link</th></tr>
        </thead>
        <tbody>
          <tr><td>YouTube</td><td><code>https://www.youtube.com/watch?v=CODIGO</code></td></tr>
          <tr><td>YouTube (curto)</td><td><code>https://youtu.be/CODIGO</code></td></tr>
          <tr><td>YouTube (Shorts)</td><td><code>https://www.youtube.com/shorts/CODIGO</code></td></tr>
          <tr><td>YouTube (playlist)</td><td><code>https://www.youtube.com/playlist?list=CODIGO</code></td></tr>
          <tr><td>Vimeo</td><td><code>https://vimeo.com/123456789</code></td></tr>
          <tr><td>Google Drive</td><td><code>https://drive.google.com/file/d/CODIGO/view</code></td></tr>
          <tr><td>Arquivo .mp4</td><td><code>https://seusite.com/aula01.mp4</code></td></tr>
        </tbody>
      </table>

      <div class="cartao-aviso">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8h.01M11 12h1v4h1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p><strong>Atenção:</strong> no YouTube, o vídeo precisa estar <strong>público</strong> ou <strong>não listado</strong>. Vídeos privados não aparecem no player. Se o vídeo for seu, desative também a opção “Permitir incorporação” bloqueada.</p>
      </div>

      <h2>4. O progresso do aluno</h2>
      <p>Quando o aluno clica em <em>“Marcar como concluída”</em>, a informação é guardada no <code>localStorage</code> do navegador. Isso significa que:</p>
      <ul class="lista">
        <li>o progresso continua salvo ao fechar e reabrir o site;</li>
        <li>cada navegador/dispositivo tem o seu próprio progresso;</li>
        <li>não é necessário servidor, banco de dados nem login.</li>
      </ul>

      <h2>5. Publicar o site</h2>
      <p>Como é um site 100% estático (HTML + CSS + JS), você pode publicá-lo gratuitamente em serviços como <strong>GitHub Pages</strong>, <strong>Netlify</strong> ou <strong>Vercel</strong>. Basta enviar os quatro arquivos:</p>
      <ul class="lista">
        <li><code>index.html</code></li>
        <li><code>styles.css</code></li>
        <li><code>app.js</code></li>
        <li><code>dados.js</code></li>
      </ul>

      <div style="margin-top:36px">
        <a class="btn btn--primaria" href="#/cursos">Ver os cursos →</a>
      </div>
    </article>
  </div>`;
}

/* --------------------------- 404 ---------------------------------- */
function view404(){
  return `
  <div class="container">
    <div style="padding:70px 0">
      <div class="vazio">
        <div class="vazio__ico">🧭</div>
        <h3>Página não encontrada</h3>
        <p>O endereço que você tentou acessar não existe ou foi movido.</p>
        <a class="btn btn--primaria" href="#/">Voltar para o início</a>
      </div>
    </div>
  </div>`;
}

/* =========================================================================
   PROGRESSO — atualização em tempo real (sem recarregar o player)
   ========================================================================= */
function alternarConclusao(){
  const curso = cursoPorId(atual.cursoId);
  if (!curso) return;

  const i = atual.idx;
  progresso[curso.id] = progresso[curso.id] || {};

  const agoraFeita = !progresso[curso.id][i];
  if (agoraFeita) progresso[curso.id][i] = true;
  else delete progresso[curso.id][i];

  gravarStorage(KEY_PROG, progresso);

  /* Botão */
  const btn = document.getElementById('btn-concluir');
  if (btn){
    btn.classList.toggle('btn--ok', agoraFeita);
    btn.classList.toggle('btn--fantasma', !agoraFeita);
    btn.classList.toggle('ativo', agoraFeita);
    btn.textContent = agoraFeita ? '✓ Aula concluída' : 'Marcar como concluída';
  }

  /* Item da playlist */
  const item = document.querySelector(`.pl-item[data-i="${i}"]`);
  if (item) item.classList.toggle('is-feito', agoraFeita);

  /* Contadores */
  const feitas = feitasNoCurso(curso);
  const total  = curso.aulas.length;

  const txt = document.getElementById('prog-texto');
  if (txt) txt.textContent = `${feitas} de ${total} aulas concluídas`;

  const barra = document.getElementById('prog-barra');
  if (barra) barra.style.width = (total ? Math.round((feitas / total) * 100) : 0) + '%';

  const cont = document.getElementById('pl-contador');
  if (cont) cont.textContent = `${feitas}/${total}`;
}

function irParaAula(delta){
  const curso = cursoPorId(atual.cursoId);
  if (!curso) return;
  const novo = atual.idx + delta;
  if (novo < 0 || novo >= curso.aulas.length) return;
  location.hash = `#/curso/${curso.id}/${novo}`;
}

/* =========================================================================
   ROTEADOR
   ========================================================================= */
function rotear(){
  const hash = location.hash.replace(/^#\/?/, '');
  const partes = hash.split('/').filter(p => p !== '');
  const rota = partes[0] || '';

  let html = '';

  switch (rota){
    case '':
      html = viewHome();
      break;
    case 'cursos':
      html = viewCursos();
      break;
    case 'curso':
      html = viewCurso(partes[1], partes[2]);
      break;
    case 'busca':
      html = viewBusca(decodeURIComponent(partes.slice(1).join('/') || ''));
      break;
    case 'ajuda':
      html = viewAjuda();
      break;
    default:
      html = view404();
  }

  $app.innerHTML = html;

  // Marca o link ativo do menu
  document.querySelectorAll('.nav a').forEach(a => {
    a.classList.toggle('ativo', a.dataset.rota === rota);
  });

  window.scrollTo(0, 0);
}

/* =========================================================================
   EVENTOS GLOBAIS
   ========================================================================= */
document.addEventListener('click', (e) => {
  const alvo = e.target.closest('[data-acao]');
  if (!alvo) return;

  const acao = alvo.dataset.acao;
  if (acao === 'concluir') alternarConclusao();
  if (acao === 'proxima')  irParaAula(1);
  if (acao === 'anterior') irParaAula(-1);
});

/* Busca */
document.getElementById('form-busca').addEventListener('submit', (e) => {
  e.preventDefault();
  const termo = document.getElementById('campo-busca').value.trim();
  if (!termo) return;
  location.hash = `#/busca/${encodeURIComponent(termo)}`;
});

/* Tema */
const btnTema = document.getElementById('btn-tema');
function aplicarTema(tema){
  document.documentElement.dataset.tema = tema;
  gravarStorage(KEY_TEMA, tema);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', tema === 'escuro' ? '#0a0c11' : '#4f46e5');
}
btnTema.addEventListener('click', () => {
  const atualTema = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
  aplicarTema(atualTema);
});

/* =========================================================================
   INICIALIZAÇÃO
   ========================================================================= */
(function init(){
  // Tema salvo (ou preferência do sistema)
  const temaSalvo = lerStorage(KEY_TEMA, null);
  if (temaSalvo){
    aplicarTema(temaSalvo);
  } else {
    const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    aplicarTema(prefereEscuro ? 'escuro' : 'claro');
  }

  // Links de matérias no rodapé
  const listaRodape = document.getElementById('rodape-cursos');
  if (listaRodape){
    listaRodape.innerHTML = CURSOS
      .map(c => `<li><a href="#/curso/${c.id}">${esc(c.nome)}</a></li>`)
      .join('');
  }

  // Ano no rodapé
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  // Rota inicial
  if (!location.hash) location.hash = '#/';

  window.addEventListener('hashchange', rotear);
  rotear();
})();