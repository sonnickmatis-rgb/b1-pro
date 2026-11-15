/* B1 Pro — module IA (Claude). Chargé avant app.js ; tout est appelé à l'exécution. */
'use strict';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm';
// Prix en $ par million de tokens (entrée, sortie, lecture de cache). fb = repli serveur en cas de refus.
const AI_MODELS = {
  'claude-opus-5-5': { label: 'Opus 5.5 · le plus fin', in: 4, out: 20, cr: 0.2, fb: true },
  'claude-sonnet-5-5': { label: 'Sonnet 5.5 · 2× moins cher', in: 2, out: 10, cr: 0.1, fb: true },
  'claude-haiku-5-5': { label: 'Haiku 5.5 · très économique', in: 0.1, out: 0.5, cr: 0.01, fb: false }
};
const aiS = () => (S.ai ||= { key: '', model: 'claude-opus-5-5', limit: 5, spend: {}, tips: {} });
const monthKey = () => today().slice(0, 7);
const aiSpent = () => aiS().spend[monthKey()] || 0;
const hasKey = () => !!aiS().key;

let _client = null, _clientKey = '';
async function aiClient() {
  const key = aiS().key;
  if (!key) throw Object.assign(new Error('NOKEY'), { code: 'NOKEY' });
  if (aiSpent() >= aiS().limit) throw Object.assign(new Error('LIMIT'), { code: 'LIMIT' });
  if (_client && _clientKey === key) return _client;
  const mod = await import(SDK_URL);
  const Anthropic = mod.default || mod.Anthropic;
  // La clé est saisie par l'utilisateur et reste sur son appareil
  _client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  _clientKey = key;
  return _client;
}
function aiParams(extra) {
  const model = aiS().model, p = { model, ...extra };
  if (AI_MODELS[model]?.fb) { p.betas = ['server-side-fallback-2026-07-01']; p.fallbacks = 'default'; }
  return p;
}
function trackUsage(u, model) {
  if (!u) return;
  const m = AI_MODELS[model] || AI_MODELS['claude-opus-5-5'];
  const cost = ((u.input_tokens || 0) * m.in + (u.output_tokens || 0) * m.out + (u.cache_read_input_tokens || 0) * m.cr + (u.cache_creation_input_tokens || 0) * m.in * 1.25) / 1e6;
  const s = aiS(); s.spend[monthKey()] = (s.spend[monthKey()] || 0) + cost; save();
}
function aiErrMsg(e) {
  if (e.code === 'NOKEY') return 'Ajoute ta clé API dans Suivi → Réglages → IA.';
  if (e.code === 'LIMIT') return `Limite mensuelle atteinte (${aiS().limit} $). Tu peux la relever dans Suivi → Réglages → IA.`;
  if (e.code === 'REFUSAL') return 'Claude a refusé cette demande.';
  if (!navigator.onLine) return 'Pas de connexion internet : l\'IA a besoin du réseau.';
  const st = e.status;
  if (st === 401) return 'Clé API invalide. Vérifie-la dans les réglages.';
  if (st === 403) return 'Cette clé n\'a pas accès à ce modèle.';
  if (st === 429) return 'Trop de demandes, réessaie dans un instant.';
  if (st === 400 && /credit|balance/i.test(e.message)) return 'Crédit API épuisé : recharge ton compte sur console.anthropic.com.';
  if (st >= 500) return 'Le service Claude est momentanément indisponible, réessaie.';
  return 'Erreur : ' + (e.message || e);
}
const textOf = msg => (msg.content || []).filter(b => b.type === 'text').map(b => b.text).join('');

async function aiJSON(system, user, schema, effort = 'medium') {
  const c = await aiClient();
  const params = aiParams({ max_tokens: 16000, system, messages: [{ role: 'user', content: user }], output_config: { effort, format: { type: 'json_schema', schema } } });
  const r = await c.beta.messages.create(params);
  trackUsage(r.usage, params.model);
  if (r.stop_reason === 'refusal') throw Object.assign(new Error('refusal'), { code: 'REFUSAL' });
  return JSON.parse(textOf(r));
}
async function aiStream(system, messages, onText, effort = 'low') {
  const c = await aiClient();
  const params = aiParams({ max_tokens: 16000, system, messages, output_config: { effort } });
  const stream = c.beta.messages.stream(params);
  for await (const ev of stream) {
    if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') onText(ev.delta.text);
  }
  const final = await stream.finalMessage();
  trackUsage(final.usage, params.model);
  if (final.stop_reason === 'refusal') throw Object.assign(new Error('refusal'), { code: 'REFUSAL' });
  return textOf(final);
}

// ---------- Contexte pédagogique ----------
const PROFILE = `Alumno: Matis, francés, vive en Metz (Francia). Estudia un MBA en alternancia (marketing deportivo), trabaja en un organismo de formación, es fotógrafo deportivo (fútbol), viajó a Vietnam. Objetivo: pasar de A2 a B1 antes de mayo de 2027 para un VIA (voluntariado internacional en una embajada, Alianza Francesa o servicio de cooperación) o un PVT en América Latina, idealmente en una agencia receptiva de turismo. Variante: español neutro latinoamericano (tú, vocabulario de México, Colombia y Perú). Sin voseo.`;
function monthCtx() {
  const m = monthOf(today()), wk = weekKey(today());
  return { m, theme: S.convoTheme[wk] || m.theme, tenses: m.tenses.map(x => TENSES[x].label).join(', ') };
}
const strArr = items => ({ type: 'array', items });
const obj = (props, req = Object.keys(props)) => ({ type: 'object', additionalProperties: false, required: req, properties: props });
const STR_T = { type: 'string' };
const CARD_T = obj({ fr: STR_T, es: STR_T });
const CORRECTION_SCHEMA = obj({
  corregido: STR_T, nivel: STR_T,
  errores: strArr(obj({ original: STR_T, correccion: STR_T, explicacion: STR_T })),
  tarjetas: strArr(CARD_T), consejo: STR_T
});
function correctionSystem(kind) {
  const { m } = monthCtx();
  return `Eres profesor de español (variante latinoamericana neutra) de un francófono que pasa de A2 a B1.
${PROFILE}
Mes actual del programa: ${m.es}. Gramática del mes: ${m.grammar}
Tarea: corregir un texto del alumno (${kind}).
- "corregido": el texto corregido con cambios mínimos, conservando su estilo y sus ideas. Si un registro profesional es necesario (correo, entrevista), ajústalo con naturalidad.
- "errores": como máximo 8, los más importantes para su progreso (conjugación, ser/estar, concordancia, preposiciones, vocabulario, calcos del francés). "original" = el fragmento exacto que escribió, "correccion" = la versión correcta, "explicacion" = una frase corta EN FRANCÉS que explica la regla.
- "tarjetas": de 3 a 5 frases completas útiles sacadas de sus errores o de mejores formulaciones, con "fr" (frase en francés) y "es" (traducción en español latinoamericano). Nunca palabras sueltas.
- "nivel": estimación MCER del texto (A2, A2+, B1-, B1 o B1+).
- "consejo": un consejo concreto en francés, una frase.
Un B1 hace errores: no corrijas detalles de estilo ni la puntuación menor. Si el texto viene de un reconocimiento de voz, ignora la puntuación, las mayúsculas y los errores probables de transcripción (homófonos) y céntrate en la gramática y el vocabulario.`;
}

// ---------- Modes de conversation ----------
const CHAT_MODES = {
  libre: { fr: 'Libre', es: 'Libre', p: () => 'Conversación libre y natural sobre su día, el fútbol, la fotografía, los viajes o sus planes.' },
  mes: { fr: 'Thème du mois', es: 'Tema del mes', p: () => { const c = monthCtx(); return `Tema de la semana: «${c.theme}». Haz preguntas que le obliguen a usar: ${c.tenses}. Gramática del mes: ${c.m.grammar}`; } },
  entrevista: { fr: 'Entretien', es: 'Entrevista', p: () => `Eres reclutador/a de una agencia receptiva de turismo o de un servicio de cooperación francés (VIA) en América Latina. Haces una entrevista de trabajo realista de unos 15 minutos, una pregunta a la vez, con repreguntas naturales. Usa estas preguntas clásicas en un orden lógico: ${QUESTIONS.join(' | ')}. Trátalo de usted si es una embajada, de tú si es una agencia: elige al principio y mantente.` },
  cliente: { fr: 'Client d\'agence', es: 'Cliente', p: () => 'Juego de rol: tú eres un cliente o turista que contacta una agencia receptiva en Cusco (Perú); Matis es el agente que te atiende. Plantea una situación realista (reserva de excursión, cambio de fecha, problema con el hotel, pregunta sobre la altura) y reacciona a sus respuestas. Trátalo de usted.' },
  debate: { fr: 'Débat', es: 'Debate', p: () => 'Propón un tema de debate sencillo (fútbol moderno, VAR, turismo masivo, redes sociales, viajar solo) y defiende con amabilidad la postura contraria a la suya para que argumente con creo que, me parece que, sin embargo, además, por eso.' }
};
function chatSystem(mode) {
  return `Eres su compañero de conversación en español. ${PROFILE}
${CHAT_MODES[mode].p()}
Reglas:
- Habla SOLO en español latinoamericano neutro.
- Respuestas cortas: de 1 a 3 frases, máximo 40 palabras, porque se leen en voz alta. Sin emojis, sin listas, sin markdown.
- Una sola pregunta por turno y deja que él hable más que tú.
- Nivel A2-B1: vocabulario frecuente, frases claras. Si no entiende o escribe en francés, reformula más simple en español.
- No corrijas durante la conversación (la corrección se hace al final). Si un error impide entender, reformula de forma natural lo que quiso decir y sigue.
- Si el mensaje es «[Inicio]», empieza tú la conversación con un saludo breve y una primera pregunta.`;
}

// ---------- Vue conversation ----------
const chatS = () => (S.chat ||= { mode: 'mes', msgs: [] });
let chatBusy = false, chatLive = '', handsFree = false;
function vChat() {
  const L = langStage() >= 2, ch = chatS();
  const head = hero('img/m3.jpg', `${topbar(`<span class="chip-white">${hasKey() ? (AI_MODELS[aiS().model]?.label.split(' ·')[0] || '') : 'IA'}</span>`)}<div><h1>${L ? 'Hablar' : 'Parler'}</h1><p class="lead">${L ? 'Conversación con Claude, por voz o por escrito. La corrección llega al final.' : 'Conversation avec Claude, à la voix ou par écrit. La correction arrive à la fin.'}</p></div>`, 'small');
  if (!hasKey()) return head + `<section class="sheet">${noKeyCard()}</section>`;
  const msgs = ch.msgs.filter(x => !x.hidden);
  return head + `<section class="sheet">
    <div class="chips" style="margin-bottom:14px">${Object.entries(CHAT_MODES).map(([k, v]) => `<button class="chip ${ch.mode === k ? 'on' : ''}" data-a="chatMode" data-v="${k}">${L ? v.es : v.fr}</button>`).join('')}</div>
    <div id="chatList" class="chat">
      ${msgs.length ? msgs.map((x, i) => `<div class="bubble ${x.role === 'user' ? 'me' : 'ai'}">${esc(x.content)}${x.role === 'assistant' ? `<button class="bub-speak" data-a="speak" data-v="${esc(x.content)}" aria-label="Écouter">${I.speak}</button>` : ''}</div>`).join('')
        : `<div class="empty">${L ? 'Pulsa «Empezar»: Claude abre la conversación.' : 'Touche « Commencer » : Claude lance la conversation.'}</div>`}
      ${chatBusy ? `<div class="bubble ai" id="liveBubble">${esc(chatLive) || '<span class="dots-typing"><i></i><i></i><i></i></span>'}</div>` : ''}
    </div>
    ${msgs.length ? `<div class="chat-input">
        <textarea id="chatIn" rows="1" placeholder="${L ? 'Escribe en español…' : 'Écris en espagnol…'}"></textarea>
        ${canListen ? `<button class="icon-btn ${ui.listening ? 'rec-live' : ''}" data-a="chatMic" aria-label="Parler">${I.mic}</button>` : ''}
        <button class="icon-btn send" data-a="chatSend" aria-label="Envoyer">${I.arrow}</button>
      </div>
      <div class="row wrap gap-l" style="gap:8px">
        ${canListen ? `<button class="btn sm ${handsFree ? 'sage' : 'ghost'}" data-a="handsFree">${handsFree ? '● ' : ''}${L ? 'Manos libres' : 'Mains libres'}</button>` : ''}
        <button class="btn sm" data-a="chatEnd" ${ch.msgs.filter(x => x.role === 'user' && !x.hidden).length ? '' : 'disabled'}>✨ ${L ? 'Terminar y corregir' : 'Terminer et corriger'}</button>
        <button class="btn sm ghost" data-a="chatNew">${L ? 'Nueva' : 'Nouvelle'}</button>
      </div>
      <p class="small muted" style="margin:10px 2px 0">${L ? 'Manos libres: Claude lee su respuesta y luego te escucha automáticamente.' : 'Mains libres : Claude lit sa réponse à voix haute, puis t\'écoute automatiquement. Comme une vraie conversation.'}</p>`
      : `<button class="btn block-w" style="padding:15px" data-a="chatStart">${I.play} ${L ? 'Empezar' : 'Commencer'}</button>`}
    <p class="small muted gap-l">${spendLine()}</p>
  </section>`;
}
function noKeyCard() {
  return `<div class="soft"><h3>Active l'IA</h3>
    <p class="small" style="margin-top:0">Il faut une clé API Claude (payante à l'usage, quelques dollars par mois) :</p>
    <ol class="small" style="padding-left:18px;margin:0 0 12px">
      <li>Crée un compte sur <b>console.anthropic.com</b></li>
      <li>Ajoute un peu de crédit et fixe une limite de dépenses</li>
      <li>Crée une clé (« API Keys » → « Create Key »)</li>
      <li>Colle-la dans Suivi → Réglages → IA</li></ol>
    <button class="btn" data-a="goAISettings">Ouvrir les réglages IA</button></div>`;
}
const spendLine = () => `Ce mois-ci : ${aiSpent() < 0.01 ? '< 0,01' : aiSpent().toFixed(2).replace('.', ',')} $ / ${aiS().limit} $ de limite`;
function scrollChat() { const l = $('#chatList'); if (l) l.lastElementChild?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }

async function chatSendText(text) {
  const ch = chatS();
  if (chatBusy) return;
  if (text) ch.msgs.push({ role: 'user', content: text });
  chatBusy = true; chatLive = ''; save(); render(); scrollChat();
  try {
    const history = ch.msgs.slice(-40).map(x => ({ role: x.role, content: x.content }));
    while (history.length && history[0].role !== 'user') history.shift();
    const reply = await aiStream(chatSystem(ch.mode), history, d => {
      chatLive += d; const b = $('#liveBubble'); if (b) { b.textContent = chatLive; }
      scrollChat();
    });
    ch.msgs.push({ role: 'assistant', content: reply.trim() });
    chatBusy = false; save(); render(); scrollChat();
    if (handsFree) speakThen(reply, () => { if (handsFree && ui.tab === 'chat') A.chatMic(); });
  } catch (e) {
    chatBusy = false;
    if (text) { ch.msgs.pop(); }
    save(); render(); aiError(e);
    if (text) { const i = $('#chatIn'); if (i) i.value = text; }
  }
}
function speakThen(text, then) {
  let done = false;
  speakRaw(text, { onend: () => { if (!done) { done = true; then?.(); } } });
}
function aiError(e) { modal(`<h3>IA</h3><p>${esc(aiErrMsg(e))}</p><div class="row"><button class="btn" data-a="close">OK</button>${e.code === 'NOKEY' || e.code === 'LIMIT' || e.status === 401 ? '<button class="btn ghost" data-a="goAISettings">Réglages IA</button>' : ''}</div>`); }
function busyModal(msg) { modal(`<div class="row"><span class="spinner"></span><b>${esc(msg || 'Claude réfléchit…')}</b></div><p class="small muted">Quelques secondes.</p>`); }

// ---------- Fenêtre de correction ----------
let lastCorr = null;
function showCorrection(res, opts = {}) {
  lastCorr = { res, opts };
  const errs = res.errores || [], cards = res.tarjetas || [];
  modal(`<div class="row between" style="margin-bottom:6px"><h3 style="margin:0">✨ Correction</h3><button class="icon-btn" data-a="close">${I.x}</button></div>
    <div class="row wrap" style="gap:6px;margin-bottom:12px"><span class="st s2">Niveau estimé : ${esc(res.nivel)}</span>${errs.length ? `<span class="st s1">${errs.length} erreur${errs.length > 1 ? 's' : ''}</span>` : '<span class="st s2">Aucune erreur importante</span>'}</div>
    ${res.corregido ? `<p class="eyebrow">Version corrigée</p><div class="soft" style="white-space:pre-wrap">${esc(res.corregido)}</div>
      <div class="row gap-l" style="gap:8px"><button class="btn sm ghost" data-a="speak" data-v="${esc(res.corregido)}">${I.speak} Écouter</button>${opts.replace ? '<button class="btn sm ghost" data-a="aiReplace">Remplacer mon texte</button>' : ''}</div>` : ''}
    ${errs.length ? `<hr class="sep"><p class="eyebrow">Erreurs</p>${errs.map(e => `<div class="list-item"><div class="small" style="text-decoration:line-through;color:var(--bad)">${esc(e.original)}</div><div style="font-weight:600">${esc(e.correccion)}</div><div class="small muted">${esc(e.explicacion)}</div></div>`).join('')}
      <button class="btn sm gap-l" data-a="aiAddErrors">+ Ajouter au carnet d'erreurs</button>` : ''}
    ${cards.length ? `<hr class="sep"><p class="eyebrow">Cartes proposées</p>${cards.map(c => `<div class="list-item"><div style="font-weight:600">${esc(c.es)}</div><div class="small muted">${esc(c.fr)}</div></div>`).join('')}
      <button class="btn sm gap-l" data-a="aiAddCards">+ Ajouter ${cards.length} cartes</button>` : ''}
    ${res.consejo ? `<hr class="sep"><div class="banner">💡 ${esc(res.consejo)}</div>` : ''}
    ${res.extra || ''}`);
}
async function correctText(text, kind, opts = {}) {
  if (!text || text.trim().length < 3) return toast('Rien à corriger');
  busyModal('Claude corrige ton texte…');
  try {
    const res = await aiJSON(correctionSystem(kind), text, CORRECTION_SCHEMA, 'medium');
    showCorrection(res, opts);
    return res;
  } catch (e) { closeModal(); aiError(e); }
}
function addAICards(cards, tag = 'IA') {
  let n = 0;
  cards.forEach(c => { if (c.fr && c.es && !S.cards.some(x => x.es.toLowerCase() === c.es.toLowerCase())) { S.cards.push({ id: uid(), fr: c.fr, es: c.es, tag: c.tema || tag, due: null, iv: 0, ef: 2.5, reps: 0, mine: true, added: today() }); n++; } });
  save(); return n;
}

// ---------- Réglages IA ----------
function vAISettings() {
  const a = aiS();
  return `<h3 id="aiSettings">IA (Claude)</h3>
  <div class="stack">
    <label class="field"><span>Clé API (reste sur ce téléphone)</span><div class="row"><input type="password" id="aiKey" autocomplete="off" placeholder="sk-ant-…" value="${esc(a.key)}"><button class="btn" data-a="aiSaveKey">OK</button></div></label>
    <label class="field"><span>Modèle</span><select data-in="ai:model">${Object.entries(AI_MODELS).map(([k, v]) => `<option value="${k}" ${a.model === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
    <label class="field"><span>Limite de dépenses mensuelle ($)</span><input type="number" min="0" step="1" data-in="ai:limit" value="${a.limit}"></label>
  </div>
  <p class="small muted">${spendLine()}. Le compteur est une estimation : la facture exacte est sur console.anthropic.com, où tu peux aussi fixer une limite stricte.</p>
  <div class="row wrap" style="gap:8px">${a.key ? `<button class="btn ghost sm" data-a="aiTest">Tester la clé</button><button class="btn ghost sm" style="color:var(--bad)" data-a="aiDelKey">Effacer la clé</button>` : ''}</div>`;
}

// ---------- Actions IA ----------
window.AI_ACTIONS = {
  goAISettings: () => { closeModal(); ui.tab = 'progress'; ui.sub.progress = 'settings'; render(); setTimeout(() => $('#aiSettings')?.scrollIntoView({ block: 'start' }), 50); return false; },
  aiSaveKey: () => { const k = $('#aiKey').value.trim(); aiS().key = k; _client = null; save(); toast(k ? 'Clé enregistrée ✓' : 'Clé effacée'); },
  aiDelKey: () => { aiS().key = ''; _client = null; save(); },
  aiTest: async () => {
    busyModal('Test de la clé…');
    try { const r = await aiJSON('Responde en JSON.', 'Di «hola» en el campo saludo.', obj({ saludo: STR_T }), 'low'); closeModal(); toast('Clé valide ✓ ' + (r.saludo || '')); render(); }
    catch (e) { closeModal(); aiError(e); }
    return false;
  },
  chatMode: v => { const ch = chatS(); if (ch.mode !== v && ch.msgs.length && !confirm('Changer de mode recommence la conversation. Continuer ?')) return false; if (ch.mode !== v) ch.msgs = []; ch.mode = v; save(); },
  chatStart: () => { const ch = chatS(); ch.msgs = [{ role: 'user', content: '[Inicio]', hidden: true }]; chatSendText(''); return false; },
  chatNew: () => { if (chatS().msgs.length > 2 && !confirm('Effacer cette conversation ?')) return false; chatS().msgs = []; handsFree = false; speechSynthesis?.cancel(); save(); },
  chatSend: () => { const i = $('#chatIn'); const t = i?.value.trim(); if (!t) return false; i.value = ''; chatSendText(t); return false; },
  chatMic: () => {
    if (chatBusy) return false;
    speechSynthesis?.cancel();
    listenOnce('es-MX', alts => { const t = alts[0].trim(); if (!t) return; if (handsFree) chatSendText(t); else { const i = $('#chatIn'); if (i) { i.value = (i.value ? i.value + ' ' : '') + t; i.focus(); } } });
    return false;
  },
  handsFree: () => { handsFree = !handsFree; if (handsFree && !chatBusy) { const last = chatS().msgs.filter(x => !x.hidden).slice(-1)[0]; if (last?.role === 'assistant') speakThen(last.content, () => handsFree && A.chatMic()); } else speechSynthesis?.cancel(); },
  chatEnd: async () => {
    const ch = chatS(); handsFree = false; speechSynthesis?.cancel();
    const lines = ch.msgs.filter(x => !x.hidden).map(x => (x.role === 'user' ? 'ALUMNO: ' : 'COMPAÑERO: ') + x.content).join('\n');
    const res = await correctText(lines, `conversación oral transcrita (modo ${CHAT_MODES[ch.mode].es}). Corrige SOLO las frases del ALUMNO; en "corregido" pon sus frases corregidas, una por línea`);
    if (res) { setDone(dow(today()) === 0 ? 'convo2' : 'convo'); render(); }
    return false;
  },
  aiAddErrors: () => { const errs = lastCorr?.res.errores || []; errs.forEach(e => S.errors.push({ id: uid(), a: e.original, b: e.correccion + (e.explicacion ? ' — ' + e.explicacion : ''), date: today(), n: 1 })); save(); toast(`${errs.length} erreur(s) ajoutée(s) ✓`); return false; },
  aiAddCards: () => { const n = addAICards(lastCorr?.res.tarjetas || []); toast(`${n} carte(s) ajoutée(s) ✓`); return false; },
  aiReplace: () => { const o = lastCorr?.opts; if (o?.replace) { o.replace(lastCorr.res.corregido); save(); closeModal(); render(); } return false; },
  aiCorrectAnswer: v => { correctText(S.answers[v] || '', `respuesta oral preparada para la pregunta de entrevista «${QUESTIONS[v]}» (45 segundos a 1 minuto)`, { replace: t => { S.answers[v] = t; } }); return false; },
  aiCorrectBalance: async () => {
    const wk = weekKey(today()), w = S.weekly[wk] || { a: [] };
    const txt = BALANCE_Q.map(([es], i) => `${i + 1}. ${es}: ${w.a[i] || ''}`).join('\n');
    const res = await correctText(txt, 'balance semanal (6 respuestas cortas)');
    if (!res) return false;
    try {
      const st = weekStats(wk);
      const plan = await aiJSON(`Eres su profesor. ${PROFILE}\nPrograma: 6 días de 30-45 min, cartas, verbos, escucha, audios, 2 conversaciones por semana. Mes: ${monthOf(today()).fr}. Responde en francés.`,
        `Balance de la semana (días hechos ${st.days}/6, tarjetas creadas ${st.added}, audios ${st.voc}):\n${txt}\nPropón los ajustes de la semana siguiente y el tema de la próxima conversación (en español, corto).`,
        obj({ ajustes: strArr(STR_T), tema: STR_T }), 'low');
      S.convoTheme[addDays(wk, 7)] = plan.tema; save();
      res.extra = `<hr class="sep"><p class="eyebrow">Semaine prochaine</p>${plan.ajustes.map(x => `<div class="list-item small">${esc(x)}</div>`).join('')}<div class="banner gap-l">Thème de conversation : <b>${esc(plan.tema)}</b></div>`;
      showCorrection(res);
    } catch (e) { /* la correction est déjà affichée */ }
    if (dow(today()) === 0) setDone('balance');
    return false;
  },
  aiCorrectWriting: () => { correctText(S.writing?.text || '', 'escrito semanal: ' + (S.writing?.topic || 'texto libre'), { replace: t => { S.writing.text = t; } }); setDone('writing'); return false; },
  aiCorrectVocal: v => { const voc = VOCALS.find(x => x.id === v); if (voc?.tx) correctText(voc.tx, 'audio de 2 minutos transcrito por reconocimiento de voz'); return false; },
  aiJudge: async () => {
    const r = ui.review, c = r.queue[r.i], toEs = cardDirFor(r) === 'fr';
    busyModal('Claude vérifie ta réponse…');
    try {
      const j = await aiJSON(`Eres profesor de español latinoamericano para un francófono A2-B1. Juzga si la respuesta del alumno es una traducción aceptable (aunque sea distinta de la referencia): acepta sinónimos y variantes correctas, rechaza errores de gramática o de sentido. Explica en francés en 1-2 frases.`,
        `Frase a traducir (${toEs ? 'francés → español' : 'español → francés'}): ${toEs ? c.fr : c.es}\nReferencia: ${toEs ? c.es : c.fr}\nRespuesta del alumno: ${r.typed}`,
        obj({ aceptable: { type: 'boolean' }, explicacion: STR_T, regla: STR_T }), 'low');
      if (j.aceptable && r.res) r.res.verdict = 'ok';
      r.ai = j; closeModal(); render();
    } catch (e) { closeModal(); aiError(e); }
    return false;
  },
  aiExplain: async () => {
    const r = ui.review, c = r.queue[r.i];
    busyModal('Claude prépare l\'explication…');
    try {
      const j = await aiJSON(`Eres profesor de español latinoamericano para un francófono A2-B1. Explica en francés, de forma breve y concreta, la gramática y el vocabulario clave de la frase (máximo 3 puntos), y da un ejemplo extra en español con su traducción.`,
        `FR: ${c.fr}\nES: ${c.es}`, obj({ puntos: strArr(STR_T), ejemplo_es: STR_T, ejemplo_fr: STR_T }), 'low');
      r.ai = { aceptable: null, explicacion: j.puntos.join('\n'), regla: `${j.ejemplo_es} — ${j.ejemplo_fr}` }; closeModal(); render();
    } catch (e) { closeModal(); aiError(e); }
    return false;
  },
  aiGenCards: () => {
    modal(`<div class="row between" style="margin-bottom:10px"><h3 style="margin:0">✨ Générer des cartes</h3><button class="icon-btn" data-a="close">${I.x}</button></div>
      <label class="field"><span>Thème</span><input type="text" id="genTheme" placeholder="ex. la photo de sport, réserver un hôtel, le VAR…"></label>
      <div class="chips gap-l">${[5, 10, 20].map(n => `<button class="chip ${n === 10 ? 'on' : ''}" data-a="genN" data-v="${n}">${n} cartes</button>`).join('')}</div>
      <button class="btn block-w gap-l" data-a="aiGenGo">Générer</button>`);
    ui.genN = 10; return false;
  },
  genN: (v, el) => { ui.genN = +v; el.parentNode.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === el)); return false; },
  aiGenGo: async () => {
    const theme = $('#genTheme').value.trim(); if (!theme) return false;
    const { m } = monthCtx();
    busyModal('Claude écrit tes cartes…');
    try {
      const j = await aiJSON(`Eres profesor de español latinoamericano. ${PROFILE}\nCrea tarjetas de memoria: frases completas y naturales (nunca palabras sueltas), útiles en la vida real o profesional, de nivel A2-B1, de 5 a 14 palabras. "fr" en francés natural, "es" en español latinoamericano neutro. Usa preferentemente la gramática del mes (${m.grammar}). "tema" = una palabra en español.`,
        `Tema: ${theme}. Número de tarjetas: ${ui.genN}. Evita estas frases que ya tiene: ${S.cards.slice(-40).map(c => c.es).join(' | ')}`,
        obj({ tarjetas: strArr(obj({ fr: STR_T, es: STR_T, tema: STR_T })) }), 'medium');
      ui.genCards = j.tarjetas;
      modal(`<div class="row between" style="margin-bottom:10px"><h3 style="margin:0">${j.tarjetas.length} cartes</h3><button class="icon-btn" data-a="close">${I.x}</button></div>
        ${j.tarjetas.map((c, i) => `<label class="list-item row" style="align-items:flex-start"><input type="checkbox" checked data-gen="${i}" style="margin-top:4px"><div class="grow"><div style="font-weight:600">${esc(c.es)}</div><div class="small muted">${esc(c.fr)}</div></div></label>`).join('')}
        <button class="btn block-w gap-l" data-a="aiGenAdd">Ajouter la sélection</button>`);
    } catch (e) { closeModal(); aiError(e); }
    return false;
  },
  aiGenAdd: () => { const pick = [...document.querySelectorAll('[data-gen]')].filter(x => x.checked).map(x => ui.genCards[+x.dataset.gen]); const n = addAICards(pick); closeModal(); toast(`${n} carte(s) ajoutée(s) ✓`); },
  aiWordCard: async v => {
    const w = S.inbox.find(x => x.id === v); if (!w) return false;
    busyModal('Claude propose une phrase…');
    try {
      const j = await aiJSON(`Eres profesor de español latinoamericano. ${PROFILE}\nCon la palabra o expresión que le faltó al alumno al hablar, crea UNA frase completa y natural (A2-B1, 5 a 12 palabras) relacionada con su vida, con su traducción al francés.`,
        `Palabra: ${w.word}`, CARD_T, 'low');
      closeModal(); cardForm(v);
      $('#cfFr').value = j.fr; $('#cfEs').value = j.es;
    } catch (e) { closeModal(); aiError(e); }
    return false;
  },
  aiTip: async () => {
    const td = today(), last7 = Array.from({ length: 7 }, (_, i) => addDays(td, -i - 1)).filter(d => d >= START);
    const done = last7.filter(isDone).length, wpm = VOCALS.filter(v => v.wpm).map(v => v.wpm);
    const ctx = `Fecha: ${td}. Mes ${monthOf(td).id}: ${monthOf(td).fr}. Jalon: ${monthOf(td).jalon}. Racha: ${streak()} días. Días hechos en los 7 últimos: ${done}/${last7.length}. Tarjetas por repasar: ${dueCards().length}, tarjetas totales: ${S.cards.length}, aprendidas: ${S.cards.filter(c => c.reps >= 2).length}. Audios: ${VOCALS.length}, palabras/min: ${wpm.slice(-5).join(', ') || 'sin datos'}. Errores recientes: ${S.errors.slice(-8).map(e => e.a + ' → ' + e.b).join(' | ') || 'ninguno'}. Hoy: ${Object.keys(peekDay(td).done).filter(k => peekDay(td).done[k]).join(', ') || 'nada hecho aún'}.`;
    busyModal('Claude prépare ton conseil…');
    try {
      const j = await aiJSON(`Eres su coach de español. ${PROFILE}\nSu programa: 30-45 min al día, 6 días de 7; si falla 2 días seguidos, bajar a 15 min (tarjetas + escucha); nunca bajar la frecuencia, sino el nivel de los contenidos. Da 3 consejos concretos para HOY, en francés, de una frase cada uno, motivadores pero sin exagerar, basados en sus datos.`,
        ctx, obj({ consejos: strArr(STR_T) }), 'low');
      aiS().tips[td] = j.consejos; save(); closeModal(); render();
    } catch (e) { closeModal(); aiError(e); }
    return false;
  }
};
