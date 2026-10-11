/* =========================================================================
   ENEM Play — app.js
   (login + sessão única + temporadas + materiais + player + thumbnails)
   ========================================================================= */

const $app = document.getElementById('app');

const ICONE_PLAY  = `<svg viewBox="0 0 24 24" fill="none"><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></svg>`;
const ICONE_INFO  = `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8h.01M11 12h1v5h1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const ICONE_DL    = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const CATEGORIAS = {
  exatas:    { nome: "Exatas e Ciências da Natureza" },
  humanas:   { nome: "Ciências Humanas" },
  linguagens:{ nome: "Linguagens e Códigos" }
};
const ICONES_MATERIAL = { pdf:"📄", doc:"📝", docx:"📝", xls:"📊", xlsx:"📊", zip:"🗜️", link:"🔗" };
const KEY_SESSION = 'enemplay:session-id';

/* =========================================================================
   FIREBASE
   ========================================================================= */
let auth, db, currentUser = null;
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  auth = firebase.auth();
  db   = firebase.firestore();
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
} catch (e) {
  console.error('Firebase não configurado.', e);
}

/* =========================================================================
   ESTADO
   ========================================================================= */
let progresso = {};
let ultimo    = {};              // { cursoId: "t_a" }
let videoPos  = {};              // { cursoId: { "t_a": { t, d, thumb } } }
let ultimoCursoId = null;        // curso mais recentemente assistido
let atual     = { cursoId: null, tIdx: 0, aIdx: 0 };

let sessionId = null, sessionUnsub = null, isBlocked = false;

let hlsInstance = null;
let currentVideo = null;
let hideControlsTimer = null;
let ultimoSalvamentoVideo = 0;
let ultimaCapturaThumb = 0;

/* =========================================================================
   UTILS
   ========================================================================= */
function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function normaliza(s){
  return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function cursoPorId(id){ return CURSOS.find(c => c.id === id); }
function totalAulasCurso(c){ return c.temporadas.reduce((n,t)=>n+t.aulas.length, 0); }
function totalAulasSite(){ return CURSOS.reduce((n,c)=>n+totalAulasCurso(c), 0); }
function chaveAula(t, a){ return `${t}_${a}`; }

function isFeita(cursoId, tIdx, aIdx){
  return !!(progresso[cursoId] && progresso[cursoId][chaveAula(tIdx, aIdx)]);
}
function feitasNoCurso(c){
  const p = progresso[c.id] || {};
  let n = 0;
  c.temporadas.forEach((t, ti) =>
    t.aulas.forEach((_, ai) => { if (p[chaveAula(ti, ai)]) n++; })
  );
  return n;
}
function pctCurso(c){ const t = totalAulasCurso(c); return t ? Math.round((feitasNoCurso(c)/t)*100) : 0; }

function construirLink(aula){
  if (!aula) return "";
  if (aula.link) return aula.link;
  if (aula.videoId && typeof linkDoVideo === 'function') return linkDoVideo(aula.videoId);
  return "";
}

function formatarTempo(s){
  s = Math.max(0, Math.floor(s || 0));
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const ss = s%60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  return `${m}:${String(ss).padStart(2,'0')}`;
}

/* =========================================================================
   SESSÃO ÚNICA
   ========================================================================= */
function gerarIdSessao(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
function obterSessionIdLocal(){
  let id = null;
  try { id = localStorage.getItem(KEY_SESSION); } catch {}
  if (!id){ id = gerarIdSessao(); try{ localStorage.setItem(KEY_SESSION, id); }catch{} }
  return id;
}
async function registrarSessao(){
  if (!currentUser) return;
  if (sessionUnsub){ try{ sessionUnsub(); }catch{} sessionUnsub = null; }
  sessionId = obterSessionIdLocal();
  isBlocked = false;
  fecharBloqueio();

  const ref = db.collection('sessions').doc(currentUser.uid);
  try {
    await ref.set({
      id: sessionId,
      userAgent: navigator.userAgent.slice(0, 200),
      plataforma: navigator.platform || '',
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e){ console.warn('Erro ao registrar sessão:', e); return; }

  sessionUnsub = ref.onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data() || {};
    if (data.id && data.id !== sessionId) bloquearSessao();
  }, err => console.warn('Erro listener sessão:', err));
}
function encerrarSessaoListener(){
  if (sessionUnsub){ try{ sessionUnsub(); }catch{} sessionUnsub = null; }
}
function bloquearSessao(){
  if (isBlocked) return;
  isBlocked = true;
  salvarPosicaoVideo(); salvarProgresso(true);
  destruirPlayer();
  const overlay = document.getElementById('blocked-overlay');
  if (overlay) overlay.classList.add('aberto');
  encerrarSessaoListener();
}
function fecharBloqueio(){
  const overlay = document.getElementById('blocked-overlay');
  if (overlay) overlay.classList.remove('aberto');
}
document.addEventListener('click', async (e) => {
  if (!e.target.closest('#btn-reentrar')) return;
  const btn = e.target.closest('#btn-reentrar');
  btn.disabled = true; btn.textContent = 'Saindo…';
  try { localStorage.removeItem(KEY_SESSION); } catch {}
  sessionId = null;
  fecharBloqueio(); isBlocked = false;
  try { await auth.signOut(); } catch {}
});

/* =========================================================================
   PERSISTÊNCIA
   ========================================================================= */
async function carregarProgressoUsuario(){
  if (!currentUser) return;
  try {
    const snap = await db.collection('progresso').doc(currentUser.uid).get();
    if (snap.exists){
      const d = snap.data() || {};
      progresso     = d.cursos        || {};
      ultimo        = d.ultimo        || {};
      videoPos      = d.posicoes      || {};
      ultimoCursoId = d.ultimoCursoId || null;
    } else {
      progresso = {}; ultimo = {}; videoPos = {}; ultimoCursoId = null;
    }
  } catch (e){
    console.warn('Erro ao carregar progresso:', e);
    progresso = {}; ultimo = {}; videoPos = {}; ultimoCursoId = null;
  }
}

let saveTimer = null;
function salvarProgresso(imediato = false){
  if (!currentUser) return;
  clearTimeout(saveTimer);
  const doSave = async () => {
    try {
      await db.collection('progresso').doc(currentUser.uid).set({
        cursos: progresso,
        ultimo: ultimo,
        posicoes: videoPos,
        ultimoCursoId: ultimoCursoId,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e){ console.warn('Erro salvar:', e); }
  };
  if (imediato) doSave();
  else saveTimer = setTimeout(doSave, 800);
}

/* Posição do vídeo */
function posicaoSalva(cursoId, tIdx, aIdx){
  const ch = chaveAula(tIdx, aIdx);
  return (videoPos[cursoId] && videoPos[cursoId][ch]) || null;
}
function limparPosicaoVideo(cursoId, tIdx, aIdx){
  if (videoPos[cursoId]) delete videoPos[cursoId][chaveAula(tIdx, aIdx)];
}

/* Thumbnail da aula */
function thumbDaAula(cursoId, tIdx, aIdx){
  // 1) Thumbnail capturada automaticamente (frame real do vídeo)
  const pos = posicaoSalva(cursoId, tIdx, aIdx);
  if (pos && pos.thumb) return pos.thumb;

  // 2) Thumbnail manual definida na aula
  const curso = cursoPorId(cursoId);
  if (!curso) return null;
  const aula = curso.temporadas[tIdx]?.aulas[aIdx];
  if (aula && aula.thumb) return aula.thumb;

  // 3) Thumbnail manual do curso (fallback)
  if (curso.thumb) return curso.thumb;

  return null;
}

/* Captura um frame do vídeo como JPEG (retorna null se falhar) */
function capturarThumbnail(video){
  try {
    if (!video || !video.videoWidth || !video.videoHeight) return null;
    if (video.readyState < 2) return null;

    const w = 400;
    const h = Math.round((video.videoHeight / video.videoWidth) * 400) || 225;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.65);
  } catch (e){
    // Canvas "tainted" (Safari com HLS nativo, MP4 cross-origin sem CORS…)
    return null;
  }
}

function salvarPosicaoVideo(){
  if (!currentUser || !currentVideo) return;
  const { cursoId, tIdx, aIdx } = atual;
  const t = currentVideo.currentTime;
  const d = currentVideo.duration;
  if (!isFinite(t) || !isFinite(d) || d <= 0) return;

  const tSalvar = (t >= d - 10) ? 0 : t;
  const ch = chaveAula(tIdx, aIdx);

  if (!videoPos[cursoId]) videoPos[cursoId] = {};
  const entrada = videoPos[cursoId][ch] || {};
  entrada.t = tSalvar;
  entrada.d = d;

  // Captura thumbnail (no máx. uma vez a cada 25s), só em frames "bons"
  const agora = Date.now();
  if (t > 5 && t < d - 5 && agora - ultimaCapturaThumb > 25000){
    const thumb = capturarThumbnail(currentVideo);
    if (thumb){
      entrada.thumb = thumb;
      ultimaCapturaThumb = agora;
    }
  }

  videoPos[cursoId][ch] = entrada;

  // Mantém apenas 1 thumbnail por curso (a do último assistido)
  for (const k in videoPos[cursoId]){
    if (k !== ch && videoPos[cursoId][k] && videoPos[cursoId][k].thumb){
      delete videoPos[cursoId][k].thumb;
    }
  }

  salvarProgresso();
}

/* =========================================================================
   AUTH UI
   ========================================================================= */
function mostrarLogin(){
  document.body.classList.remove('logado', 'carregando');
  setTimeout(() => document.getElementById('login-email')?.focus(), 100);
}
function esconderLogin(){
  document.body.classList.add('logado');
  document.body.classList.remove('carregando');
}
function atualizarUIUsuario(user){
  const avatar = document.getElementById('perfil-avatar');
  const email  = document.getElementById('perfil-email');
  if (avatar) avatar.textContent = ((user.email || '?').charAt(0)).toUpperCase();
  if (email)  email.textContent  = user.email || '';
}

const loginForm = document.getElementById('login-form');
if (loginForm){
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    const btn   = document.getElementById('login-btn');
    const erro  = document.getElementById('login-erro');
    btn.disabled = true; btn.textContent = 'Entrando…'; erro.textContent = '';
    try {
      await auth.signInWithEmailAndPassword(email, senha);
      loginForm.reset();
    } catch (err){
      const map = {
        'auth/user-not-found':     'Usuário não encontrado.',
        'auth/wrong-password':     'Senha incorreta.',
        'auth/invalid-email':      'E-mail inválido.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/too-many-requests':  'Muitas tentativas. Tente novamente mais tarde.',
        'auth/user-disabled':      'Esta conta foi desativada.'
      };
      erro.textContent = map[err.code] || 'Não foi possível entrar.';
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#btn-logout')){
    salvarPosicaoVideo(); salvarProgresso(true);
    encerrarSessaoListener();
    auth.signOut();
  }
});

const perfilEl = document.getElementById('perfil');
if (perfilEl){
  perfilEl.addEventListener('click', (e) => {
    if (e.target.closest('#btn-logout')) return;
    perfilEl.classList.toggle('aberto');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#perfil')) perfilEl.classList.remove('aberto');
  });
}

if (auth){
  auth.onAuthStateChanged(async (user) => {
    if (user){
      currentUser = user;
      atualizarUIUsuario(user);
      await carregarProgressoUsuario();
      await registrarSessao();
      esconderLogin();
      if (!location.hash) location.hash = '#/';
      rotear();
    } else {
      currentUser = null;
      progresso = {}; ultimo = {}; videoPos = {}; ultimoCursoId = null;
      isBlocked = false;
      encerrarSessaoListener();
      fecharBloqueio();
      destruirPlayer();
      mostrarLogin();
      if ($app) $app.innerHTML = '';
    }
  });
} else {
  document.body.classList.remove('carregando');
  const overlay = document.getElementById('login-overlay');
  if (overlay){
    overlay.innerHTML = `<div class="login-card">
      <div class="login-logo">ENEM<em>PLAY</em></div>
      <h1 class="login-titulo">Configuração pendente</h1>
      <p style="color:#b3b3b3;font-size:.9rem;line-height:1.6">
        Preencha <code>FIREBASE_CONFIG</code> no arquivo <code>dados.js</code>.
      </p>
    </div>`;
  }
}

/* =========================================================================
   HLS.JS
   ========================================================================= */
function carregarHlsLib(){
  if (window.Hls) return Promise.resolve(window.Hls);
  if (window._hlsPromise) return window._hlsPromise;
  window._hlsPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    s.onload  = () => resolve(window.Hls);
    s.onerror = () => reject(new Error('Falha ao carregar hls.js'));
    document.head.appendChild(s);
  });
  return window._hlsPromise;
}

/* =========================================================================
   PLAYER
   ========================================================================= */
function embedDoLink(link){
  const url = String(link || '').trim();
  if (!url) return { tipo:'vazio' };

  if (/\.m3u8(\?|#|$)/i.test(url)) return { tipo:'hls', src:url };

  let m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) return { tipo:'iframe', src:`https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1&playsinline=1` };

  m = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (/youtube\.com/.test(url) && m) return { tipo:'iframe', src:`https://www.youtube-nocookie.com/embed/videoseries?list=${m[1]}&rel=0&modestbranding=1` };

  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { tipo:'iframe', src:`https://player.vimeo.com/video/${m[1]}` };

  m = url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (m) return { tipo:'iframe', src:`https://drive.google.com/file/d/${m[1]}/preview` };

  if (/\.(mp4|webm|ogv|ogg|m4v|mov)(\?.*)?$/i.test(url)) return { tipo:'video', src:url };

  return { tipo:'iframe', src:url };
}

function playerHtml(aula){
  const link = construirLink(aula);
  const emb  = embedDoLink(link);

  if (emb.tipo === 'iframe'){
    return `<iframe src="${esc(emb.src)}" title="${esc(aula.titulo)}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
  }

  if (emb.tipo === 'hls' || emb.tipo === 'video'){
    return `
      <video id="video-el" playsinline preload="metadata"></video>

      <div class="player__center">
        <button class="player__center-btn" id="pc-center-play" aria-label="Reproduzir">
          <svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
        </button>
      </div>

      <div class="player__controls" id="pc-wrap">
        <div class="pc-barra" id="pc-barra">
          <div class="pc-barra__trilho">
            <div class="pc-barra__buf" id="pc-buf" style="width:0%"></div>
            <div class="pc-barra__played" id="pc-played" style="width:0%"></div>
          </div>
          <div class="pc-barra__thumb" id="pc-thumb" style="left:0%"></div>
          <div class="pc-barra__tooltip" id="pc-tip">0:00</div>
        </div>

        <div class="pc-linha">
          <button class="pc-btn" id="pc-play" aria-label="Play/Pause">
            <svg class="pc-ico-play" viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
            <svg class="pc-ico-pause" viewBox="0 0 24 24" fill="none" style="display:none"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>
          </button>
          <span class="pc-tempo"><span id="pc-atual">0:00</span> / <span id="pc-total">0:00</span></span>
          <div class="pc-spacer"></div>

          <div class="pc-volume">
            <button class="pc-btn" id="pc-mute" aria-label="Volume">
              <svg id="pc-vol-ico" viewBox="0 0 24 24" fill="none">
                <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor"/>
                <path id="pc-vol-ondas" d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path id="pc-vol-x" d="M17 9l4 6M21 9l-4 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="display:none"/>
              </svg>
            </button>
            <input type="range" id="pc-volume" min="0" max="1" step="0.05" value="1" aria-label="Volume">
          </div>

          <div class="pc-qualidade" id="pc-qualidade" style="display:none">
            <button class="pc-btn pc-btn--txt" id="pc-qual-btn">Auto</button>
            <ul class="pc-qual-menu" id="pc-qual-menu"></ul>
          </div>

          <button class="pc-btn" id="pc-full" aria-label="Tela cheia">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>

      <div class="pc-toast" id="pc-toast"></div>
    `;
  }

  return `<div class="player__vazio"><div>
    <svg viewBox="0 0 24 24" fill="none"><path d="M8 5.5v13l11-6.5-11-6.5z" fill="currentColor" opacity=".55"/></svg>
    <strong>Nenhum vídeo adicionado ainda</strong>
    <p>Esta aula ainda não tem vídeo cadastrado.</p>
  </div></div>`;
}

function destruirPlayer(){
  clearTimeout(hideControlsTimer);
  if (hlsInstance){ try{ hlsInstance.destroy(); }catch{} hlsInstance = null; }
  currentVideo = null;
}

function mostrarToast(txt, ms = 4000){
  const el = document.getElementById('pc-toast');
  if (!el) return;
  el.textContent = txt;
  el.classList.add('visivel');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('visivel'), ms);
}

function iniciarPlayer(aula){
  const wrap = document.getElementById('player');
  if (!wrap) return;
  destruirPlayer();

  const video = wrap.querySelector('#video-el');
  if (!video) return;

  const link = construirLink(aula);
  if (!link) return;

  currentVideo = video;

  video.muted = false;
  video.defaultMuted = false;
  video.removeAttribute('muted');

  const { cursoId, tIdx, aIdx } = atual;
  const emb = embedDoLink(link);

  if (emb.tipo === 'hls'){
    if (video.canPlayType('application/vnd.apple.mpegurl')){
      video.src = link;
    } else {
      carregarHlsLib().then(Hls => {
        if (!Hls || !Hls.isSupported()){ video.src = link; return; }
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 60,
          maxBufferLength: 30
        });
        hlsInstance.loadSource(link);
        hlsInstance.attachMedia(video);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          if (hlsInstance.audioTracks && hlsInstance.audioTracks.length > 0){
            hlsInstance.audioTrack = 0;
          }
          popularMenuQualidade(hlsInstance);
        });
        hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (e, data) => {
          atualizarLabelQualidade(hlsInstance, data.level);
        });
        hlsInstance.on(Hls.Events.ERROR, (e, data) => {
          if (!data.fatal) return;
          switch (data.type){
            case Hls.ErrorTypes.NETWORK_ERROR: hlsInstance.startLoad(); break;
            case Hls.ErrorTypes.MEDIA_ERROR:   hlsInstance.recoverMediaError(); break;
            default: destruirPlayer(); video.src = link;
          }
        });
      }).catch(() => { video.src = link; });
    }
  } else {
    video.src = link;
  }

  let volSalvo = Number(localStorage.getItem('enemplay:volume'));
  if (!isFinite(volSalvo) || volSalvo <= 0) volSalvo = 1;
  video.volume = volSalvo;
  video.muted = false;

  video.addEventListener('loadedmetadata', () => {
    const pos = posicaoSalva(cursoId, tIdx, aIdx);
    if (pos && pos.t > 5 && video.duration && pos.t < video.duration - 5){
      video.currentTime = pos.t;
      mostrarToast(`▶ Retomando de ${formatarTempo(pos.t)}`);
    }
    atualizarTempo(video);
  }, { once: true });

  video.addEventListener('play', () => {
    wrap.classList.remove('pausado');
    sincronizarBotaoPlay(true);
  });
  video.addEventListener('pause', () => {
    wrap.classList.add('pausado');
    sincronizarBotaoPlay(false);
    salvarPosicaoVideo();
    salvarProgresso(true);
  });
  video.addEventListener('timeupdate', () => {
    atualizarBarra(video);
    const agora = Date.now();
    if (agora - ultimoSalvamentoVideo > 6000){
      ultimoSalvamentoVideo = agora;
      salvarPosicaoVideo();
    }
  });
  video.addEventListener('progress', () => atualizarBuffer(video));
  video.addEventListener('ended', () => {
    wrap.classList.add('pausado');
    sincronizarBotaoPlay(false);
    salvarPosicaoVideo();
  });
  video.addEventListener('volumechange', () => atualizarIconeVolume(video));

  setupControlesPlayer(wrap, video, cursoId, tIdx, aIdx);

  if (video.paused) wrap.classList.add('pausado');
}

function setupControlesPlayer(wrap, video, cursoId, tIdx, aIdx){
  const pcWrap   = document.getElementById('pc-wrap');
  const btnPlay  = document.getElementById('pc-play');
  const btnCenter= document.getElementById('pc-center-play');
  const btnMute  = document.getElementById('pc-mute');
  const btnFull  = document.getElementById('pc-full');
  const rangeVol = document.getElementById('pc-volume');
  const barra    = document.getElementById('pc-barra');
  const qualBox  = document.getElementById('pc-qualidade');
  const qualBtn  = document.getElementById('pc-qual-btn');
  const qualMenu = document.getElementById('pc-qual-menu');

  if (!pcWrap) return;

  const togglePlay = () => {
    if (video.paused || video.ended) video.play().catch(()=>{});
    else video.pause();
  };
  btnPlay?.addEventListener('click', togglePlay);
  btnCenter?.addEventListener('click', togglePlay);

  video.addEventListener('click', togglePlay);
  video.addEventListener('dblclick', alternarFullscreen);

  if (rangeVol){
    rangeVol.value = video.volume;
    rangeVol.addEventListener('input', () => {
      video.volume = Number(rangeVol.value);
      video.muted = video.volume === 0;
      try { localStorage.setItem('enemplay:volume', String(video.volume)); } catch {}
      atualizarIconeVolume(video);
    });
  }
  btnMute?.addEventListener('click', () => {
    if (video.muted || video.volume === 0){
      video.muted = false;
      if (video.volume === 0) video.volume = 0.6;
    } else {
      video.muted = true;
    }
    atualizarIconeVolume(video);
  });

  function alternarFullscreen(){
    if (!document.fullscreenElement && !document.webkitFullscreenElement){
      const el = wrap.closest('.player') || wrap;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }
  btnFull?.addEventListener('click', alternarFullscreen);

  if (barra){
    const buscarPos = (clientX) => {
      const rect = barra.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      if (isFinite(video.duration)) video.currentTime = pct * video.duration;
    };
    let arrastando = false;

    const onDown = (e) => {
      arrastando = true;
      barra.classList.add('arrastando');
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      buscarPos(clientX);
      e.preventDefault();
    };
    const onMove = (e) => {
      const clientX = e.touches ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const rect = barra.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const tip  = document.getElementById('pc-tip');
      if (tip && isFinite(video.duration)){
        tip.style.left = (pct * 100) + '%';
        tip.textContent = formatarTempo(pct * video.duration);
      }
      if (arrastando) buscarPos(clientX);
    };
    const onUp = () => {
      if (!arrastando) return;
      arrastando = false;
      barra.classList.remove('arrastando');
      salvarPosicaoVideo();
    };

    barra.addEventListener('mousedown', onDown);
    barra.addEventListener('touchstart', onDown, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  qualBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    qualBox.classList.toggle('aberto');
  });
  document.addEventListener('click', () => qualBox?.classList.remove('aberto'));
  qualMenu?.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-level]');
    if (!li) return;
    const level = Number(li.dataset.level);
    if (hlsInstance){
      hlsInstance.currentLevel = level;
    }
    qualMenu.querySelectorAll('li').forEach(x => x.classList.toggle('ativo', x === li));
    qualBox.classList.remove('aberto');
  });

  const mostrarControles = () => {
    wrap.classList.add('controles-visiveis');
    wrap.classList.remove('ocultar-cursor');
    clearTimeout(hideControlsTimer);
    hideControlsTimer = setTimeout(() => {
      if (!video.paused){
        wrap.classList.remove('controles-visiveis');
        wrap.classList.add('ocultar-cursor');
      }
    }, 2800);
  };
  wrap.addEventListener('mousemove', mostrarControles);
  wrap.addEventListener('touchstart', mostrarControles, { passive: true });
  wrap.addEventListener('mouseleave', () => {
    if (!video.paused){
      wrap.classList.remove('controles-visiveis');
      wrap.classList.add('ocultar-cursor');
    }
  });

  const onKey = (e) => {
    if (!document.body.contains(wrap)) return;
    if (e.target.matches('input, textarea')) return;
    switch (e.key){
      case ' ':
      case 'k': e.preventDefault(); togglePlay(); break;
      case 'ArrowRight': video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); break;
      case 'ArrowLeft':  video.currentTime = Math.max(0, video.currentTime - 5); break;
      case 'ArrowUp':    video.volume = Math.min(1, video.volume + 0.1); break;
      case 'ArrowDown':  video.volume = Math.max(0, video.volume - 0.1); break;
      case 'f':          alternarFullscreen(); break;
      case 'm':          video.muted = !video.muted; atualizarIconeVolume(video); break;
    }
  };
  document.addEventListener('keydown', onKey);

  const onVis = () => { if (document.hidden) salvarPosicaoVideo(); };
  document.addEventListener('visibilitychange', onVis);

  const onBeforeUnload = () => { salvarPosicaoVideo(); salvarProgresso(true); };
  window.addEventListener('beforeunload', onBeforeUnload);

  sincronizarBotaoPlay(!video.paused);
  atualizarIconeVolume(video);
}

function sincronizarBotaoPlay(tocando){
  const btn = document.getElementById('pc-play');
  if (!btn) return;
  const icoPlay  = btn.querySelector('.pc-ico-play');
  const icoPause = btn.querySelector('.pc-ico-pause');
  if (icoPlay)  icoPlay.style.display  = tocando ? 'none' : '';
  if (icoPause) icoPause.style.display = tocando ? '' : 'none';
}

function atualizarIconeVolume(video){
  const ondas = document.getElementById('pc-vol-ondas');
  const x     = document.getElementById('pc-vol-x');
  const range = document.getElementById('pc-volume');
  const mudo  = video.muted || video.volume === 0;
  if (ondas) ondas.style.display = mudo ? 'none' : '';
  if (x)     x.style.display     = mudo ? '' : 'none';
  if (range && !mudo) range.value = video.volume;
}

function atualizarTempo(video){
  const atual = document.getElementById('pc-atual');
  const total = document.getElementById('pc-total');
  if (atual) atual.textContent = formatarTempo(video.currentTime);
  if (total) total.textContent = formatarTempo(video.duration || 0);
}

function atualizarBarra(video){
  atualizarTempo(video);
  const played = document.getElementById('pc-played');
  const thumb  = document.getElementById('pc-thumb');
  if (!isFinite(video.duration) || video.duration <= 0) return;
  const pct = (video.currentTime / video.duration) * 100;
  if (played) played.style.width = pct + '%';
  if (thumb)  thumb.style.left   = pct + '%';
}

function atualizarBuffer(video){
  const buf = document.getElementById('pc-buf');
  if (!buf || !video.buffered.length || !isFinite(video.duration) || video.duration <= 0) return;
  let end = 0;
  for (let i = 0; i < video.buffered.length; i++){
    if (video.buffered.start(i) <= video.currentTime && video.buffered.end(i) >= video.currentTime){
      end = video.buffered.end(i); break;
    }
    end = Math.max(end, video.buffered.end(i));
  }
  buf.style.width = ((end / video.duration) * 100) + '%';
}

function popularMenuQualidade(hls){
  const box  = document.getElementById('pc-qualidade');
  const btn  = document.getElementById('pc-qual-btn');
  const menu = document.getElementById('pc-qual-menu');
  if (!box || !menu || !btn) return;

  if (!hls || !hls.levels || hls.levels.length < 2){
    box.style.display = 'none';
    return;
  }
  box.style.display = '';

  const niveis = hls.levels.map((l, i) => ({
    i,
    altura: l.height || 0,
    bitrate: l.bitrate || 0
  })).sort((a,b) => (b.altura - a.altura) || (b.bitrate - a.bitrate));

  menu.innerHTML = `
    <li data-level="-1" class="ativo">Auto</li>
    ${niveis.map(n => {
      const label = n.altura ? `${n.altura}p` : `${Math.round(n.bitrate/1000)} kbps`;
      return `<li data-level="${n.i}">${label}</li>`;
    }).join('')}
  `;
  btn.textContent = 'Auto';
}

function atualizarLabelQualidade(hls, levelIdx){
  const btn = document.getElementById('pc-qual-btn');
  if (!btn || !hls || !hls.autoLevelEnabled) return;
  const l = hls.levels[levelIdx];
  btn.textContent = l && l.height ? `Auto (${l.height}p)` : 'Auto';
}

/* =========================================================================
   MATERIAIS
   ========================================================================= */
function materialBtn(m){
  const ext  = (m.tipo || m.url?.split('.').pop() || '').toLowerCase();
  const ico  = ICONES_MATERIAL[ext] || "📎";
  const tipo = ext ? ext.toUpperCase() : "ARQUIVO";
  return `
    <a class="material-btn" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer" download>
      <span class="material-btn__ico">${ico}</span>
      <span class="material-btn__txt">
        <strong>${esc(m.nome)}</strong>
        <small>${tipo} · clique para baixar</small>
      </span>
      <span class="material-btn__dl">${ICONE_DL}</span>
    </a>`;
}

function materiaisHtml(aula){
  const lista = Array.isArray(aula.materiais) ? aula.materiais.filter(m => m && m.url) : [];
  if (!lista.length) return '';
  return `
    <div class="materiais">
      <h3 class="materiais__titulo">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Materiais desta aula
      </h3>
      <div class="materiais__lista">
        ${lista.map(materialBtn).join('')}
      </div>
    </div>`;
}

/* =========================================================================
   COMPONENTES
   ========================================================================= */
function cardCurso(curso){
  const pct = pctCurso(curso), feit = feitasNoCurso(curso), total = totalAulasCurso(curso);
  return `
    <a class="card-n" href="#/curso/${curso.id}" style="--cor:${curso.cor}">
      <div class="card-n__thumb">
        <span class="card-n__tag">${esc(CATEGORIAS[curso.categoria]?.nome.split(' ')[0] || 'Curso')}</span>
        ${pct > 0 ? `<span class="card-n__pct">${pct}%</span>` : ''}
        <span class="card-n__emoji">${curso.icone}</span>
        <span class="card-n__play">${ICONE_PLAY}</span>
      </div>
      <div class="card-n__info">
        <div class="card-n__titulo">${esc(curso.nome)}</div>
        <div class="card-n__sub">
          <span>${curso.temporadas.length} mód · ${total} aulas</span>
          ${feit > 0 ? `<b>${feit} feitas</b>` : ''}
        </div>
        ${pct > 0 ? `<div class="card-n__barra"><span style="width:${pct}%"></span></div>` : ''}
      </div>
    </a>`;
}

function fileira(titulo, cursos){
  if (!cursos.length) return '';
  return `
    <section class="fileira anim" data-fileira>
      <div class="fileira__cabecalho">
        <h2 class="fileira__titulo">${esc(titulo)}</h2>
        <span class="fileira__cont">${cursos.length} títulos</span>
      </div>
      <div class="fileira__wrap">
        <button class="fileira__seta fileira__seta--esq" data-seta="esq" aria-label="Anterior">
          <svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="fileira__trilho" data-trilho>
          ${cursos.map(c => cardCurso(c)).join('')}
        </div>
        <button class="fileira__seta fileira__seta--dir" data-seta="dir" aria-label="Próximo">
          <svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </section>`;
}

/* CARD "CONTINUAR ASSISTINDO" */
function renderContinuarHero(info){
  if (!info) return '';
  const { curso, tIdx, aIdx, aula, pos, tempNome } = info;
  const thumb = thumbDaAula(curso.id, tIdx, aIdx);

  const t = (pos && pos.t) || 0;
  const d = (pos && pos.d) || 0;
  const pct = d > 0 ? Math.min(100, (t / d) * 100) : 0;

  const bgStyle = thumb
    ? `background-image:url('${thumb}')`
    : `background: radial-gradient(circle at 70% 40%, ${curso.cor} 0%, transparent 65%), linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)`;

  const tempoAtual = d > 0 ? formatarTempo(t) : '0:00';
  const tempoTotal = d > 0 ? formatarTempo(d) : (aula.duracao || '');

  return `
    <div class="continuar-hero anim" style="--cor:${curso.cor}"
         data-href="#/assistir/${curso.id}/${tIdx}/${aIdx}">
      <div class="continuar-hero__bg" style="${bgStyle}"></div>
      <span class="continuar-hero__emoji">${curso.icone}</span>
      <div class="continuar-hero__conteudo">
        <span class="continuar-hero__tag">Continuar assistindo</span>
        <div class="continuar-hero__meta">
          <span>${esc(curso.nome)}</span>
          <span class="pt"></span>
          <span>${esc(tempNome)}</span>
        </div>
        <h2 class="continuar-hero__titulo">${esc(aula.titulo)}</h2>
        ${d > 0 ? `
          <div class="continuar-hero__barra"><span style="width:${pct}%"></span></div>
          <div class="continuar-hero__tempo">
            <b>${tempoAtual}</b> de ${tempoTotal}
          </div>
        ` : ''}
        <div class="continuar-hero__acoes">
          <span class="btn-n btn-n--claro">${ICONE_PLAY} Retomar</span>
          <a class="btn-n btn-n--escuro" href="#/curso/${curso.id}/${tIdx}">
            Ver todas as aulas
          </a>
        </div>
      </div>
    </div>`;
}

/* =========================================================================
   VIEWS
   ========================================================================= */
function viewHome(){
  const destaque = CURSOS[0];
  const pctDest = pctCurso(destaque);
  const [uT, uA] = (ultimo[destaque.id] || "0_0").split('_').map(Number);
  const idxInicial = `#/assistir/${destaque.id}/${uT||0}/${uA||0}`;

  /* --- Continuar assistindo --- */
  let continuar = null;
  const cid = ultimoCursoId || Object.keys(ultimo).pop();
  if (cid){
    const curso = cursoPorId(cid);
    if (curso){
      const [tIdx, aIdx] = (ultimo[cid] || "0_0").split('_').map(Number);
      const temp = curso.temporadas[tIdx] || curso.temporadas[0];
      const aula = temp?.aulas[aIdx] || temp?.aulas[0];
      if (aula){
        const pos = posicaoSalva(cid, tIdx, aIdx);
        // Só mostra o card se o aluno realmente começou a assistir
        if (pos && pos.t > 5){
          continuar = { curso, tIdx, aIdx, aula, pos, tempNome: temp.nome };
        }
      }
    }
  }

  const porCategoria = {
    exatas:     CURSOS.filter(c => c.categoria === 'exatas'),
    humanas:    CURSOS.filter(c => c.categoria === 'humanas'),
    linguagens: CURSOS.filter(c => c.categoria === 'linguagens')
  };
  const emAlta = [...CURSOS].sort((a,b) => pctCurso(b) - pctCurso(a)).slice(0, 8);

  return `
  <section class="hero" style="--cor-hero:${destaque.cor}">
    <div class="hero__fundo"></div>
    <span class="hero__emoji">${destaque.icone}</span>
    <div class="hero__conteudo">
      <span class="hero__selo">Destaque · ENEM Play</span>
      <h1 class="hero__titulo">${esc(destaque.nome)}</h1>
      <p class="hero__desc">${esc(destaque.descricao)}</p>
      <div class="hero__meta">
        <b>${pctDest}% recomendado</b>
        <span class="ponto"></span>
        <span>${destaque.temporadas.length} módulos</span>
        <span class="ponto"></span>
        <span>${totalAulasCurso(destaque)} aulas</span>
      </div>
      <div class="hero__acoes">
        <a class="btn-n btn-n--claro" href="${idxInicial}">${ICONE_PLAY} Assistir</a>
        <a class="btn-n btn-n--escuro" href="#/curso/${destaque.id}">${ICONE_INFO} Mais informações</a>
      </div>
    </div>
  </section>

  <div style="position:relative; z-index:2; margin-top:-3rem;">
    ${renderContinuarHero(continuar)}
    ${fileira("Em alta no ENEM Play", emAlta)}
    ${fileira(CATEGORIAS.exatas.nome, porCategoria.exatas)}
    ${fileira(CATEGORIAS.humanas.nome, porCategoria.humanas)}
    ${fileira(CATEGORIAS.linguagens.nome, porCategoria.linguagens)}
    ${fileira("Todas as matérias", CURSOS)}
  </div>`;
}

function viewCursos(){
  const porCategoria = {
    exatas:     CURSOS.filter(c => c.categoria === 'exatas'),
    humanas:    CURSOS.filter(c => c.categoria === 'humanas'),
    linguagens: CURSOS.filter(c => c.categoria === 'linguagens')
  };
  return `
  <div class="pagina-cabecalho anim">
    <h1>Cursos</h1>
    <p>${CURSOS.length} matérias · ${totalAulasSite()} aulas em vídeo</p>
  </div>
  ${fileira(CATEGORIAS.exatas.nome, porCategoria.exatas)}
  ${fileira(CATEGORIAS.humanas.nome, porCategoria.humanas)}
  ${fileira(CATEGORIAS.linguagens.nome, porCategoria.linguagens)}`;
}

function viewCurso(cursoId, tParam){
  const curso = cursoPorId(cursoId);
  if (!curso) return view404();

  let tIdx = Number(tParam);
  if (!Number.isInteger(tIdx) || tIdx < 0 || tIdx >= curso.temporadas.length) tIdx = 0;

  atual = { cursoId, tIdx, aIdx: 0 };

  const pct  = pctCurso(curso);
  const feit = feitasNoCurso(curso);
  const total = totalAulasCurso(curso);

  let proxT = 0, proxA = 0;
  outer: for (let ti = 0; ti < curso.temporadas.length; ti++){
    for (let ai = 0; ai < curso.temporadas[ti].aulas.length; ai++){
      if (!isFeita(curso.id, ti, ai)){ proxT = ti; proxA = ai; break outer; }
    }
  }

  return `
  <section class="curso-hero" style="--cor:${curso.cor}">
    <div class="curso-hero__fundo"></div>
    <span class="curso-hero__emoji">${curso.icone}</span>
    <div class="curso-hero__conteudo">
      <span class="curso-hero__selo">${esc(CATEGORIAS[curso.categoria]?.nome || 'Curso')}</span>
      <h1>${esc(curso.nome)}</h1>
      <p class="desc">${esc(curso.descricao)}</p>
      <div class="curso-hero__meta">
        <b>${pct}% concluído</b>
        <span class="ponto"></span>
        <span>${curso.temporadas.length} módulos</span>
        <span class="ponto"></span>
        <span>${total} aulas · ${feit} feitas</span>
      </div>
      <div class="curso-hero__acoes">
        <a class="btn-n btn-n--claro" href="#/assistir/${curso.id}/${proxT}/${proxA}">
          ${ICONE_PLAY} ${feit > 0 ? 'Continuar' : 'Começar agora'}
        </a>
        <a class="btn-n btn-n--escuro" href="#/assistir/${curso.id}/0/0">
          ${ICONE_INFO} Ver do início
        </a>
      </div>
    </div>
  </section>

  <div class="episodios anim anim-d1">
    <div class="episodios__topo">
      <h2>Módulos e aulas</h2>
      <span>${feit}/${total} concluídas</span>
    </div>
    ${abasTemporadas(curso, tIdx, `#/curso/${curso.id}`)}
    <h3 class="temp-titulo">${esc(curso.temporadas[tIdx].nome)}</h3>
    ${listaEpisodios(curso, tIdx)}
  </div>`;
}

function abasTemporadas(curso, tAtiva, baseUrl){
  return `
    <div class="temp-tabs" role="tablist">
      ${curso.temporadas.map((t, i) => `
        <a class="temp-tab ${i === tAtiva ? 'is-ativa' : ''}" href="${baseUrl}/${i}" role="tab">
          <span class="temp-tab__nome">${esc(t.nome)}</span>
          <span class="temp-tab__qtd">${t.aulas.length} aulas</span>
        </a>`).join('')}
    </div>`;
}

function listaEpisodios(curso, tIdx){
  const temp = curso.temporadas[tIdx];
  if (!temp) return '';
  return `
    <div class="lista-eps">
      ${temp.aulas.map((a, i) => {
        const done = isFeita(curso.id, tIdx, i);
        const temMat = Array.isArray(a.materiais) && a.materiais.length;
        const pos = posicaoSalva(curso.id, tIdx, i);
        const emAndamento = pos && pos.t > 5 && pos.d && pos.t < pos.d - 5;
        return `
          <a class="ep ${done?'is-feito':''}" href="#/assistir/${curso.id}/${tIdx}/${i}">
            <span class="ep__num">${i + 1}</span>
            <div class="ep__info">
              <h3>${esc(a.titulo)} ${done ? `<span class="selo">vista</span>` : ''}</h3>
              <p>
                ${esc(a.duracao || 'Aula em vídeo')}
                ${temMat ? ` · 📎 ${a.materiais.length} material(is)` : ''}
                ${emAndamento ? ` · ⏱ retomar em ${formatarTempo(pos.t)}` : ''}
              </p>
            </div>
            <span class="ep__play">${ICONE_PLAY}</span>
          </a>`;
      }).join('')}
    </div>`;
}

function viewAssistir(cursoId, tParam, aParam){
  const curso = cursoPorId(cursoId);
  if (!curso) return view404();

  let tIdx = Number(tParam);
  if (!Number.isInteger(tIdx) || tIdx < 0 || tIdx >= curso.temporadas.length) tIdx = 0;

  const temporada = curso.temporadas[tIdx];
  let aIdx = Number(aParam);
  if (!Number.isInteger(aIdx) || aIdx < 0 || aIdx >= temporada.aulas.length) aIdx = 0;

  atual = { cursoId, tIdx, aIdx };
  ultimo[cursoId] = chaveAula(tIdx, aIdx);
  ultimoCursoId = cursoId;
  salvarProgresso();

  const aula  = temporada.aulas[aIdx];
  const feita = isFeita(cursoId, tIdx, aIdx);
  const feit  = feitasNoCurso(curso);
  const total = totalAulasCurso(curso);

  const temAnterior = !(tIdx === 0 && aIdx === 0);
  const temProxima  = !(tIdx === curso.temporadas.length - 1 && aIdx === temporada.aulas.length - 1);

  return `
  <div class="assistir">
    <div class="assistir__voltar">
      <a href="#/curso/${curso.id}/${tIdx}">
        <svg viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Voltar para ${esc(curso.nome)}
      </a>
    </div>

    <div class="player" id="player">${playerHtml(aula)}</div>

    <div class="assistir__info">
      <div>
        <span class="assistir__curso" style="--cor:${curso.cor}">
          <span class="pt"></span> ${esc(curso.nome)} · ${esc(temporada.nome)}
        </span>
        <h1 class="assistir__titulo">${esc(aula.titulo)}</h1>
        <div class="assistir__meta">
          <span>Aula ${aIdx+1} de ${temporada.aulas.length}</span>
          ${aula.duracao ? `<span class="ponto"></span><span>${esc(aula.duracao)}</span>` : ''}
          <span class="ponto"></span>
          <span>${feit}/${total} aulas concluídas</span>
        </div>
        <div class="assistir__acoes">
          <button class="btn-n ${feita ? 'btn-n--claro' : 'btn-n--fantasma'} btn-n--sm"
                  data-acao="concluir" id="btn-concluir" type="button">
            ${feita ? '✓ Aula concluída' : 'Marcar como concluída'}
          </button>
          <button class="btn-n btn-n--fantasma btn-n--sm" data-acao="anterior" type="button"
                  ${!temAnterior ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>
            ← Anterior
          </button>
          <button class="btn-n btn-n--verm btn-n--sm" data-acao="proxima" type="button"
                  ${!temProxima ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>
            Próxima aula →
          </button>
        </div>
      </div>

      <div>
        <h3 class="assistir__side-title">${esc(temporada.nome)}</h3>
        <div class="mini-eps">
          ${temporada.aulas.map((a, i) => {
            const done = isFeita(curso.id, tIdx, i);
            const pos  = posicaoSalva(curso.id, tIdx, i);
            const emAnd = pos && pos.t > 5 && pos.d && pos.t < pos.d - 5;
            return `
              <a class="mini-ep ${i===aIdx?'is-ativo':''} ${done?'is-feito':''}"
                 href="#/assistir/${curso.id}/${tIdx}/${i}">
                <span class="mini-ep__num">${done ? '✓' : i+1}</span>
                <span class="mini-ep__t">${esc(a.titulo)}${emAnd ? ` <em style="opacity:.6;font-style:normal">· ${formatarTempo(pos.t)}</em>` : ''}</span>
                <span class="mini-ep__d">${esc(a.duracao || '')}</span>
              </a>`;
          }).join('')}
        </div>
      </div>
    </div>

    ${materiaisHtml(aula)}

    <div class="assistir__outros">
      <h3>Outros módulos desta matéria</h3>
      <div class="assistir__outros-lista">
        ${curso.temporadas.map((t, i) => `
          <a class="btn-n ${i===tIdx ? 'btn-n--claro' : 'btn-n--fantasma'} btn-n--sm"
             href="#/assistir/${curso.id}/${i}/0">
            ${esc(t.nome)}
          </a>`).join('')}
      </div>
    </div>

    <div class="assistir__outros" style="padding-top:24px">
      <h3>Outras matérias</h3>
      <div class="assistir__outros-lista">
        ${CURSOS.filter(c => c.id !== curso.id).slice(0,6).map(c => `
          <a class="btn-n btn-n--fantasma btn-n--sm" href="#/curso/${c.id}">
            ${c.icone} ${esc(c.nome)}
          </a>
        `).join('')}
      </div>
    </div>
  </div>`;
}

function viewBusca(termo){
  const t = normaliza(termo).trim();
  if (!t){
    return `
    <div class="busca-cabecalho">
      <h1>Buscar</h1>
      <p>Digite o nome de uma matéria ou de uma aula na barra de busca acima.</p>
    </div>
    <div class="grade-busca">${CURSOS.map(c => cardCurso(c)).join('')}</div>`;
  }

  const grupos = [];
  CURSOS.forEach(curso => {
    const nomeCursoBate = normaliza(curso.nome).includes(t);
    const enc = [];
    curso.temporadas.forEach((temp, tIdx) => {
      temp.aulas.forEach((a, aIdx) => {
        if (nomeCursoBate || normaliza(a.titulo).includes(t)) enc.push({ a, tIdx, aIdx, tempNome: temp.nome });
      });
    });
    if (enc.length) grupos.push({ curso, enc });
  });

  const total = grupos.reduce((n, g) => n + g.enc.length, 0);

  const conteudo = grupos.length
    ? grupos.map(g => `
        <div class="grupo-busca anim">
          <div class="grupo-busca__titulo" style="--cor:${g.curso.cor}">
            <span class="pt"></span>
            <span>${g.curso.icone} ${esc(g.curso.nome)}</span>
            <small>${g.enc.length} aula${g.enc.length>1?'s':''}</small>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;padding:0 4px">
            ${g.enc.map(({ a, tIdx, aIdx, tempNome }) => `
              <a class="card-n" href="#/assistir/${g.curso.id}/${tIdx}/${aIdx}" style="--cor:${g.curso.cor};width:240px;flex:0 0 240px">
                <div class="card-n__thumb">
                  <span class="card-n__tag">${esc(tempNome.split('—')[0].trim())}</span>
                  <span class="card-n__emoji">${g.curso.icone}</span>
                  <span class="card-n__play">${ICONE_PLAY}</span>
                </div>
                <div class="card-n__info">
                  <div class="card-n__titulo">${esc(a.titulo)}</div>
                  <div class="card-n__sub"><span>${esc(a.duracao || '')}</span></div>
                </div>
              </a>`).join('')}
          </div>
        </div>`).join('')
    : `<div class="vazio">
         <div class="vazio__ico">🔎</div>
         <h3>Nada encontrado para “${esc(termo)}”</h3>
         <p>Verifique a escrita ou tente buscar pelo nome da matéria.</p>
         <a class="btn-n btn-n--claro" href="#/cursos">Ver todos os cursos</a>
       </div>`;

  return `
  <div class="busca-cabecalho">
    <h1>Resultados para <mark>${esc(termo)}</mark></h1>
    <p>${total} aula${total===1?'':'s'} em ${grupos.length} matéria${grupos.length===1?'':'s'}</p>
  </div>
  <div style="padding-top:20px;padding-bottom:60px">${conteudo}</div>`;
}

function view404(){
  return `
  <div class="vazio" style="margin-top:120px">
    <div class="vazio__ico">🧭</div>
    <h3>Página não encontrada</h3>
    <p>O endereço que você tentou acessar não existe ou foi movido.</p>
    <a class="btn-n btn-n--claro" href="#/">Voltar ao início</a>
  </div>`;
}

/* =========================================================================
   PROGRESSO
   ========================================================================= */
function alternarConclusao(){
  const curso = cursoPorId(atual.cursoId);
  if (!curso) return;

  const { tIdx, aIdx } = atual;
  const chave = chaveAula(tIdx, aIdx);
  progresso[curso.id] = progresso[curso.id] || {};
  const agoraFeita = !progresso[curso.id][chave];
  if (agoraFeita){
    progresso[curso.id][chave] = true;
    limparPosicaoVideo(curso.id, tIdx, aIdx);
  } else {
    delete progresso[curso.id][chave];
  }
  salvarProgresso(true);

  const btn = document.getElementById('btn-concluir');
  if (btn){
    btn.classList.toggle('btn-n--claro', agoraFeita);
    btn.classList.toggle('btn-n--fantasma', !agoraFeita);
    btn.textContent = agoraFeita ? '✓ Aula concluída' : 'Marcar como concluída';
  }
  const mini = document.querySelector(`.mini-ep[href="#/assistir/${curso.id}/${tIdx}/${aIdx}"]`);
  if (mini){
    mini.classList.toggle('is-feito', agoraFeita);
    const num = mini.querySelector('.mini-ep__num');
    if (num) num.textContent = agoraFeita ? '✓' : (aIdx + 1);
  }
}

function irParaAula(delta){
  const curso = cursoPorId(atual.cursoId);
  if (!curso) return;
  let { tIdx, aIdx } = atual;
  let nt = tIdx, na = aIdx + delta;
  if (na < 0){
    if (tIdx === 0) return;
    nt = tIdx - 1;
    na = curso.temporadas[nt].aulas.length - 1;
  } else if (na >= curso.temporadas[tIdx].aulas.length){
    if (tIdx === curso.temporadas.length - 1) return;
    nt = tIdx + 1; na = 0;
  }
  location.hash = `#/assistir/${curso.id}/${nt}/${na}`;
}

/* =========================================================================
   ROTEADOR
   ========================================================================= */
function rotear(){
  if (!currentUser || isBlocked) return;

  salvarPosicaoVideo();
  destruirPlayer();

  const hash = location.hash.replace(/^#\/?/, '');
  const partes = hash.split('/').filter(p => p !== '');
  const rota = partes[0] || '';

  let html = '';
  switch (rota){
    case '':         html = viewHome(); break;
    case 'cursos':   html = viewCursos(); break;
    case 'curso':    html = viewCurso(partes[1], partes[2]); break;
    case 'assistir': html = viewAssistir(partes[1], partes[2], partes[3]); break;
    case 'busca':    html = viewBusca(decodeURIComponent(partes.slice(1).join('/') || '')); break;
    default:         html = view404();
  }

  $app.innerHTML = html;

  document.querySelectorAll('.menu a').forEach(a => {
    a.classList.toggle('ativo', a.dataset.rota === rota);
  });

  if (rota === 'assistir'){
    const curso = cursoPorId(partes[1]);
    const t = Number(partes[2]) || 0;
    const a = Number(partes[3]) || 0;
    if (curso && curso.temporadas[t] && curso.temporadas[t].aulas[a]){
      iniciarPlayer(curso.temporadas[t].aulas[a]);
    }
  }

  if (rota === '' || rota === 'cursos') initFileiras();
  window.scrollTo(0, 0);
  atualizarHeader();
}

function initFileiras(){
  document.querySelectorAll('[data-fileira]').forEach(f => {
    const trilho = f.querySelector('[data-trilho]');
    const esq    = f.querySelector('[data-seta="esq"]');
    const dir    = f.querySelector('[data-seta="dir"]');
    if (!trilho || !esq || !dir) return;
    const passo = () => Math.max(trilho.clientWidth * 0.85, 320);
    const atualizar = () => {
      const max = trilho.scrollWidth - trilho.clientWidth - 4;
      esq.classList.toggle('oculta', trilho.scrollLeft <= 4);
      dir.classList.toggle('oculta', trilho.scrollLeft >= max);
      esq.classList.add('visivel');
      dir.classList.add('visivel');
    };
    esq.onclick = () => trilho.scrollBy({ left: -passo(), behavior: 'smooth' });
    dir.onclick = () => trilho.scrollBy({ left:  passo(), behavior: 'smooth' });
    trilho.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  });
}

const navTopo = document.getElementById('nav-topo');
function atualizarHeader(){
  if (window.scrollY > 24) navTopo.classList.add('solido');
  else navTopo.classList.remove('solido');
}
window.addEventListener('scroll', atualizarHeader, { passive: true });

/* Ação padrão dos botões [data-acao] */
document.addEventListener('click', (e) => {
  const alvo = e.target.closest('[data-acao]');
  if (!alvo) return;
  const acao = alvo.dataset.acao;
  if (acao === 'concluir') alternarConclusao();
  if (acao === 'proxima')  irParaAula(1);
  if (acao === 'anterior') irParaAula(-1);
});

/* Card clicável (data-href) — usado no "Continuar assistindo" */
document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-href]');
  if (!card) return;
  // Se o clique foi em link ou botão interno, deixa o comportamento normal
  if (e.target.closest('a, button')) return;
  location.hash = card.dataset.href;
});

document.getElementById('form-busca').addEventListener('submit', (e) => {
  e.preventDefault();
  const termo = document.getElementById('campo-busca').value.trim();
  if (!termo) return;
  location.hash = `#/busca/${encodeURIComponent(termo)}`;
});

window.addEventListener('hashchange', rotear);

(function initRodape(){
  const listaRodape = document.getElementById('rodape-cursos');
  if (listaRodape){
    listaRodape.innerHTML = CURSOS.map(c => `<li><a href="#/curso/${c.id}">${esc(c.nome)}</a></li>`).join('');
  }
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
