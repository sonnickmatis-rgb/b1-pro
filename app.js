/* B1 Pro — appli du programme espagnol A2 → B1 */
'use strict';

// ---------- Utils ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const dow = s => parse(s).getDay();
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = sec => `${Math.floor(sec / 60)}:${pad(Math.floor(sec % 60))}`;

// La date peut être forcée pour tester : ?date=2027-01-12
const qsDate = new URLSearchParams(location.search).get('date');
const today = () => qsDate || ymd(new Date());
const weekKey = s => { const d = dow(s); return addDays(s, d === 0 ? -6 : 1 - d); };

// ---------- State ----------
const KEY = 'b1pro.v1';
const DEFAULT = () => ({
  days: {}, cards: [], cardLog: {}, inbox: [], weekly: {}, evalg: {}, errors: [], deliv: {}, answers: {},
  agencies: AGENCIES.map(n => ({ id: uid(), name: n, status: 0, note: '' })), milestones: {}, rodage: {},
  shadow: {}, convoTheme: {}, intensive: { src: '', mine: '', ref: '' }, recovery: null,
  settings: { lang: 'auto', newPerDay: 10, name: 'Matis', theme: 'auto' }
});
let S;
try { S = Object.assign(DEFAULT(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { S = DEFAULT(); }
if (!S.cards.length && !S.seeded) {
  S.cards = SEED_CARDS.map((c, i) => ({ id: uid(), fr: c.fr, es: c.es, tag: c.tag, due: null, iv: 0, ef: 2.5, reps: 0, mine: false, added: START, ord: i }));
  S.seeded = true;
}
// Pack de cartes par mois : ajouté une seule fois, débloqué selon le mois du programme
(() => {
  const have = new Set(S.cards.map(c => c.pk).filter(Boolean));
  (window.PACK || []).forEach(([m, txt]) => txt.trim().split('\n').forEach((l, i) => {
    const pk = m + '-' + i; if (have.has(pk)) return;
    const [fr, es, tag] = l.split('|'); if (!es) return;
    S.cards.push({ id: uid(), pk, m, fr, es, tag, due: null, iv: 0, ef: 2.5, reps: 0, mine: false, added: START, ord: m * 1000 + i });
  }));
})();
S.settings = Object.assign({ cardMode: 'oral', cardDir: 'fr', drillMode: 'oral' }, S.settings);
let saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Sauvegarde impossible'); } }, 120); }

// ---------- Langue progressive ----------
function langStage() {
  const l = S.settings.lang;
  if (l === 'fr') return -1;
  if (l === 'es') return 9;
  const t = today();
  if (t < '2027-01-01') return 0;
  if (t < '2027-02-01') return 1;
  if (t < '2027-03-01') return 2;
  return 3;
}
// [palier où ça passe en espagnol, fr, es]
const STR = {
  tab_today: [1, 'Aujourd\'hui', 'Hoy'], tab_chat: [1, 'Parler', 'Hablar'], writing: [1, 'Écrit', 'Escrito'], tab_cards: [1, 'Cartes', 'Tarjetas'], tab_practice: [1, 'Pratique', 'Práctica'], tab_plan: [1, 'Programme', 'Programa'], tab_progress: [1, 'Suivi', 'Progreso'],
  morning: [1, 'Matin', 'Mañana'], evening: [1, 'Soir', 'Noche'], morning_sub: [2, 'Activer : voix, vocabulaire, grammaire', 'Activar: voz, vocabulario, gramática'], evening_sub: [2, 'Absorber et produire', 'Absorber y producir'],
  normal: [2, 'Normal', 'Normal'], minimum: [2, 'Minimum vital', 'Mínimo vital'],
  streak: [1, 'jours d\'affilée', 'días seguidos'], day: [1, 'Jour', 'Día'], due: [1, 'cartes à revoir', 'tarjetas por repasar'], vocals: [2, 'vocaux ce mois', 'audios este mes'],
  hello_m: [1, 'Bonjour', 'Buenos días'], hello_a: [1, 'Bon après-midi', 'Buenas tardes'], hello_e: [1, 'Bonsoir', 'Buenas noches'],
  this_month: [1, 'Ce mois-ci', 'Este mes'], month_tense: [2, 'Temps du mois', 'Tiempo del mes'], milestone: [2, 'Jalon', 'Meta'], deliverable: [2, 'Livrable', 'Entregable'],
  shadow_week: [2, 'Extrait de shadowing de la semaine', 'Extracto de shadowing de la semana'], shadow_ph: [3, 'Lien ou titre de l\'extrait (le même toute la semaine)', 'Enlace o título del extracto (el mismo toda la semana)'],
  start_tomorrow: [9, 'Le programme démarre demain, lundi 16 novembre. Tu peux déjà tout explorer.', ''],
  recovery: [2, 'Deux jours ratés d\'affilée : cette semaine on repasse à 15 min par jour, cartes + écoute seulement. Puis on remonte.', 'Dos días sin practicar: esta semana volvemos a 15 min al día, tarjetas + escucha. Luego subimos.'],
  ignore: [2, 'Ignorer', 'Ignorar'], rest_day: [2, 'Dimanche : repos ou cartes, la conversation compte double.', 'Domingo: descanso o tarjetas, la conversación cuenta doble.'],
  cards_title: [1, 'Cartes', 'Tarjetas'], review: [2, 'Réviser', 'Repasar'], new_cards: [2, 'nouvelles', 'nuevas'], to_review: [2, 'à revoir', 'por repasar'],
  show: [2, 'Voir la réponse', 'Ver respuesta'], again: [2, 'Encore', 'Otra vez'], hard: [2, 'Difficile', 'Difícil'], good: [2, 'Bien', 'Bien'], easy: [2, 'Facile', 'Fácil'],
  add_card: [2, 'Ajouter une carte', 'Añadir tarjeta'], fr_side: [3, 'Recto : la phrase en français', 'Anverso: la frase en francés'], es_side: [3, 'Verso : la phrase en espagnol', 'Reverso: la frase en español'], tag: [3, 'Thème', 'Tema'],
  save: [2, 'Enregistrer', 'Guardar'], cancel: [2, 'Annuler', 'Cancelar'], delete: [2, 'Supprimer', 'Borrar'], all_cards: [2, 'Toutes les cartes', 'Todas las tarjetas'], search: [3, 'Chercher…', 'Buscar…'],
  inbox: [2, 'À transformer en cartes', 'Por convertir en tarjetas'], inbox_sub: [3, 'Les mots qui t\'ont manqué dans tes vocaux. Fais-en une phrase entière.', 'Las palabras que te faltaron. Haz una frase completa.'],
  session_done: [2, 'Session terminée', 'Sesión terminada'], nothing_due: [2, 'Rien à revoir pour aujourd\'hui. ¡Bien hecho!', 'Nada que repasar hoy. ¡Bien hecho!'],
  backlog: [2, 'Plus de 100 cartes en retard : ajoute moins de nouvelles cartes quelques jours.', 'Más de 100 tarjetas atrasadas: añade menos tarjetas nuevas unos días.'],
  drill: [1, 'Verbes', 'Verbos'], vocal: [1, 'Vocal', 'Audio'], intensive: [1, 'Écoute intensive', 'Escucha intensiva'],
  drill_hint: [3, 'Dis la phrase à voix haute, puis vérifie.', 'Di la frase en voz alta y luego comprueba.'], check: [2, 'Vérifier', 'Comprobar'], next: [2, 'Suivante', 'Siguiente'], table: [2, 'Tableau', 'Tabla'],
  rec_hint: [3, '2 minutes sur ta journée ou ce que tu as écouté. Ne t\'arrête pas pour chercher un mot : note-le après.', '2 minutos sobre tu día o lo que escuchaste. No pares a buscar palabras: anótalas después.'],
  missing_words: [2, '3 mots qui t\'ont manqué', '3 palabras que te faltaron'], my_vocals: [2, 'Mes vocaux', 'Mis audios'], reference: [2, 'Référence', 'Referencia'],
  mic_err: [3, 'Micro inaccessible. Autorise le micro pour ce site dans les réglages du navigateur.', 'Micrófono no disponible. Autoriza el micrófono en los ajustes del navegador.'],
  int_src: [3, 'Épisode / extrait (2 min)', 'Episodio / extracto (2 min)'], int_mine: [3, 'Ma transcription (à la main, sans regarder)', 'Mi transcripción (a mano, sin mirar)'], int_ref: [3, 'Transcription officielle (colle-la ici)', 'Transcripción oficial (pégala aquí)'],
  compare: [2, 'Comparer', 'Comparar'], caught: [2, 'mots attrapés', 'palabras captadas'],
  program: [1, 'Programme', 'Programa'], applications: [1, 'Candidatures', 'Postulaciones'], resources: [1, 'Ressources', 'Recursos'],
  balance: [1, 'Bilan', 'Balance'], evaluation: [1, 'Auto-éval.', 'Autoevaluación'], errors: [1, 'Erreurs', 'Errores'], settings: [1, 'Réglages', 'Ajustes'],
  copy_balance: [2, 'Copier le « balance semanal »', 'Copiar el « balance semanal »'], copied: [2, 'Copié', 'Copiado'],
  add_error: [2, 'Ajouter', 'Añadir'], error_ph: [3, 'Ce que j\'ai dit (l\'erreur)', 'Lo que dije (el error)'], fix_ph: [3, 'La bonne version', 'La versión correcta'],
  convo_title: [2, 'Session conversation', 'Sesión de conversación'], copy_launch: [2, 'Copier pour lancer la session', 'Copiar para empezar la sesión'], mark_done: [2, 'Marquer comme faite', 'Marcar como hecha'],
  start: [2, 'Démarrer', 'Empezar'], stop: [2, 'Arrêter', 'Parar'], done_word: [2, 'Fait', 'Hecho']
};
const t = k => { const s = STR[k]; if (!s) return k; return langStage() >= s[0] ? s[2] : s[1]; };
const tTask = id => { const x = TASKS[id]; return langStage() >= 2 ? [x.es, x.subEs] : [x.fr, x.subFr]; };

// ---------- Icons ----------
const I = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
  logo: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="4.2" fill="#C3D4A0"/><circle cx="16" cy="8" r="4.2" fill="#fff"/><circle cx="8" cy="16" r="4.2" fill="#fff"/><circle cx="16" cy="16" r="4.2" fill="#C3D4A0"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="14" height="14" rx="3"/><path d="M7 3h11a3 3 0 0 1 3 3v11"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
};

// ---------- Plan du jour ----------
const monthOf = d => MONTHS.find(m => d >= m.from && d <= m.to) || (d < START ? MONTHS[0] : MONTHS[5]);
const dayRec = d => (S.days[d] ||= { done: {}, mode: 'normal' });
const peekDay = d => S.days[d] || { done: {}, mode: 'normal' };
function inRecovery(d) { return S.recovery && d >= S.recovery.from && d <= S.recovery.to; }
function planFor(d) {
  const r = peekDay(d);
  if (r.mode === 'min') return { ...MINIMUM, kind: 'min' };
  if (inRecovery(d)) return { ...RECOVERY, kind: 'recovery' };
  return { ...WEEK[dow(d)], kind: 'normal' };
}
const LISTEN = ['listen', 'intensive', 'podcast', 'series', 'convo', 'convo2'];
function isDone(d) {
  const r = S.days[d]; if (!r) return false;
  const p = planFor(d), all = [...p.am, ...p.pm];
  if (all.every(id => r.done[id])) return true;
  return !!r.done.cards && LISTEN.some(id => r.done[id]);
}
function streak() {
  let d = today(), n = 0;
  if (!isDone(d)) d = addDays(d, -1);
  while (d >= START) {
    if (isDone(d)) n++;
    else if (dow(d) !== 0) break;
    d = addDays(d, -1);
  }
  return n;
}
function checkRecovery() {
  const td = today();
  if (td <= addDays(START, 1)) return;
  if (S.recovery && S.recovery.dismissed === td) return;
  if (inRecovery(td)) return;
  let d = addDays(td, -1), missed = 0, checked = 0;
  while (checked < 2 && d >= START) { if (dow(d) !== 0) { checked++; if (!isDone(d)) missed++; } d = addDays(d, -1); }
  if (checked === 2 && missed === 2 && !(S.recovery && S.recovery.from > addDays(td, -3))) {
    S.recovery = { from: td, to: addDays(td, 6) }; save();
  }
}
function setDone(id, v = true, d = today()) { dayRec(d).done[id] = v; save(); }

// ---------- Cartes (répétition espacée) ----------
const log = d => (S.cardLog[d] ||= { rev: 0, new: 0 });
const dueCards = () => S.cards.filter(c => c.due && c.due <= today());
function newCards() {
  const left = Math.max(0, S.settings.newPerDay - (S.cardLog[today()]?.new || 0));
  const mNow = monthOf(today()).id;
  return S.cards.filter(c => !c.due && (!c.m || c.m <= mNow)).sort((a, b) => (b.mine - a.mine) || (a.ord ?? 1e9) - (b.ord ?? 1e9) || a.added.localeCompare(b.added)).slice(0, left);
}
function rateCard(c, q) {
  const td = today();
  if (!c.due) log(td).new++;
  log(td).rev++;
  if (q === 0) { c.reps = 0; c.iv = 0; c.ef = Math.max(1.3, c.ef - 0.2); c.due = td; }
  else if (q === 1) { c.iv = Math.max(1, Math.round(c.iv * 1.2)); c.ef = Math.max(1.3, c.ef - 0.15); c.due = addDays(td, c.iv); }
  else if (q === 2) { c.iv = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.iv * c.ef); c.reps++; c.due = addDays(td, c.iv); }
  else { c.iv = c.reps === 0 ? 3 : Math.round(Math.max(c.iv, 1) * c.ef * 1.3); c.ef += 0.15; c.reps++; c.due = addDays(td, c.iv); }
  save();
}
const ivLabel = (c, q) => {
  if (q === 0) return '<1 j';
  const iv = q === 1 ? Math.max(1, Math.round(c.iv * 1.2)) : q === 2 ? (c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.iv * c.ef)) : (c.reps === 0 ? 3 : Math.round(Math.max(c.iv, 1) * c.ef * 1.3));
  return iv < 30 ? iv + ' j' : Math.round(iv / 30) + ' mois';
};

// ---------- Synthèse vocale ----------
let esVoice = null;
function pickVoice() {
  const vs = speechSynthesis?.getVoices?.() || [];
  esVoice = vs.find(v => /es[-_](MX|US|419|CO)/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!('speechSynthesis' in window)) return toast('Synthèse vocale indisponible');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\([^)]*\)/g, ''));
  u.lang = esVoice?.lang || 'es-MX'; if (esVoice) u.voice = esVoice; u.rate = 0.92;
  speechSynthesis.speak(u);
}

// ---------- Correction souple ----------
const stripAcc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const normTxt = (s, keepAcc) => { s = String(s || '').toLowerCase().replace(/[’`']/g, ' '); if (!keepAcc) s = stripAcc(s); return s.replace(/[¿¡.,;:!?«»"()…—–\-\/]/g, ' ').replace(/\s+/g, ' ').trim(); };
// Terminaison grammaticale différente (trabajo/trabajé, hablas/hablan) : vraie faute, pas de frappe
const endingErr = (u, r) => { const a = u.slice(-1), b = r.slice(-1); return a !== b && /[aeiosnm]/.test(a) && /[aeiosnm]/.test(b); };
function lev(a, b) {
  if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
// Compare une réponse à la référence. verdict : ok | typo (compté juste) | close | wrong
function checkAnswer(user, refFull) {
  const refs = refFull.split(' / ');
  let best = null;
  for (const ref of refs) {
    const a = normTxt(user), b = normTxt(ref);
    const sim = a === b ? 1 : 1 - lev(a, b) / Math.max(a.length, b.length, 1);
    if (!best || sim > best.sim) best = { ref, a, b, sim };
  }
  const { ref, sim } = best;
  const accentsOk = normTxt(user, true) === normTxt(ref, true);
  let verdict = sim === 1 ? 'ok' : sim >= 0.9 ? 'typo' : sim >= 0.7 ? 'close' : 'wrong';
  // Diff mot à mot sur la référence
  const R = ref.replace(/(['’])/g, '$1 ').split(/\s+/).filter(Boolean), Rn = R.map(w => normTxt(w)), U = normTxt(user).split(' ').filter(Boolean);
  const n = Rn.length, m = U.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = Rn[i] && Rn[i] === U[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const hitR = new Set(), hitU = new Set(); let i = 0, j = 0;
  while (i < n && j < m) { if (Rn[i] && Rn[i] === U[j]) { hitR.add(i); hitU.add(j); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  const freeU = U.filter((_, k) => !hitU.has(k));
  let realErr = false;
  const html = R.map((w, k) => {
    if (!Rn[k] || hitR.has(k)) return !accentsOk && /[áéíóúñüàèùâêîôûçëï]/i.test(w) ? `<span class="acc">${esc(w)}</span>` : esc(w);
    const near = Rn[k].length >= 3 && freeU.find(u => lev(u, Rn[k]) <= Math.max(1, Math.floor(Rn[k].length / 4)));
    // Une terminaison différente (trabajo / trabajé) est une vraie faute de grammaire, pas de frappe
    const isTypo = near && !endingErr(near, Rn[k]);
    if (!isTypo) realErr = true;
    return `<span class="${isTypo ? 'typo' : 'miss'}">${esc(w)}</span>`;
  }).join(' ').replace(/(&#39;|’)(<\/span>)? /g, '$1$2');
  if (verdict === 'typo' && realErr) verdict = 'close';
  return { verdict, sim, accentsOk, html, ref };
}
function checkForm(user, form) {
  const a = normTxt(user), b = normTxt(form);
  if (normTxt(user, true) === normTxt(form, true)) return { verdict: 'ok', accentsOk: true };
  if (a === b) return { verdict: 'ok', accentsOk: false };
  if (b.length > 5 && lev(a, b) <= 1 && a.slice(-1) === b.slice(-1)) return { verdict: 'typo', accentsOk: true };
  return { verdict: 'wrong' };
}
const VERDICT = () => langStage() >= 2
  ? { ok: '¡Correcto!', typo: 'Casi perfecto: error de dedo, cuenta como correcto', close: 'Casi: revisa las palabras marcadas', wrong: 'Todavía no: mira la respuesta' }
  : { ok: 'Juste !', typo: 'Presque parfait : faute de frappe, ça compte juste', close: 'Pas loin : regarde les mots surlignés', wrong: 'Pas encore : regarde la réponse' };
const SUGGEST = { ok: 2, typo: 2, close: 1, wrong: 0 };

// ---------- Reconnaissance vocale ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const canListen = !!SR;
let rec1 = null;
function listenOnce(lang, onText) {
  if (!SR) return toast(langStage() >= 2 ? 'Reconocimiento de voz no disponible' : 'Reconnaissance vocale indisponible sur ce navigateur');
  try { rec1?.abort(); } catch (e) {}
  const r = new SR(); rec1 = r;
  r.lang = lang; r.interimResults = false; r.maxAlternatives = 3; r.continuous = false;
  ui.listening = true; render();
  r.onresult = e => { const alts = [...e.results[0]].map(x => x.transcript); onText(alts); };
  r.onerror = e => { if (e.error === 'not-allowed') toast(t('mic_err')); else if (e.error === 'no-speech') toast(langStage() >= 2 ? 'No te escuché' : 'Je ne t\'ai pas entendu'); };
  r.onend = () => { ui.listening = false; rec1 = null; render(); };
  try { r.start(); } catch (e) { ui.listening = false; }
}
// Transcription continue pendant le vocal de 2 min
function startTranscript(state) {
  if (!SR) return;
  state.text = []; state.live = true;
  const go = () => {
    if (!state.live) return;
    const r = new SR(); state.sr = r;
    r.lang = 'es-MX'; r.continuous = true; r.interimResults = true;
    r.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) state.text.push(e.results[i][0].transcript.trim()); else interim += e.results[i][0].transcript;
      }
      const el = document.querySelector('#liveTx'); if (el) el.textContent = (state.text.join(' ') + ' ' + interim).trim();
    };
    r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') state.live = false; };
    r.onend = () => { if (state.live) setTimeout(go, 150); };
    try { r.start(); } catch (e) { state.live = false; }
  };
  go();
}
function stopTranscript(state) { if (!state) return ''; state.live = false; try { state.sr?.stop(); } catch (e) {} return (state.text || []).join(' ').replace(/\s+/g, ' ').trim(); }

// ---------- IndexedDB (vocaux) ----------
const idb = (() => {
  let dbp;
  const open = () => dbp ||= new Promise((res, rej) => { const r = indexedDB.open('b1pro', 1); r.onupgradeneeded = () => r.result.createObjectStore('vocals', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('vocals', mode); const st = t.objectStore('vocals'); const out = fn(st); t.oncomplete = () => res(out?.result ?? out); t.onerror = () => rej(t.error); }); };
  return { all: () => tx('readonly', s => s.getAll()), put: v => tx('readwrite', s => s.put(v)), del: id => tx('readwrite', s => s.delete(id)) };
})();
let VOCALS = [];
idb.all().then(v => { VOCALS = v.sort((a, b) => a.ts - b.ts); if (ui.tab === 'practice' || ui.tab === 'today') render(); }).catch(() => {});

// ---------- UI state ----------
const ui = { tab: 'today', sub: { practice: 'drill', plan: 'program', progress: 'balance' }, review: null, drill: null, cardQ: '', openMonth: null, openQ: null, rec: null };
let timer = null;

// ---------- Render ----------
function render() {
  checkRecovery();
  const v = { today: vToday, cards: vCards, chat: vChat, practice: vPractice, plan: vPlan, progress: vProgress }[ui.tab]();
  $('#app').innerHTML = v + tabbar();
  renderTimer();
  if (ui.tab === 'cards' && ui.review && !ui.review.flip && S.settings.cardMode === 'type') $('#ansIn')?.focus();
  if (ui.tab === 'practice' && ui.sub.practice === 'drill' && ui.drill && !ui.drill.shown && S.settings.drillMode === 'type') $('#drillIn')?.focus();
  document.documentElement.dataset.theme = S.settings.theme === 'auto' ? '' : S.settings.theme;
  if (!document.documentElement.dataset.theme) delete document.documentElement.dataset.theme;
}
function tabbar() {
  const tabs = [['today', I.home, t('tab_today')], ['cards', I.cards, t('tab_cards')], ['chat', I.chat, t('tab_chat')], ['practice', I.mic, t('tab_practice')], ['plan', I.map, t('tab_plan')], ['progress', I.chart, t('tab_progress')]];
  return `<nav class="tabbar">${tabs.map(([id, ic, l]) => `<button data-a="tab" data-v="${id}" class="${ui.tab === id ? 'on' : ''}">${ic}<span>${l}</span></button>`).join('')}</nav>`;
}
const hero = (img, inner, cls = '') => `<header class="hero ${cls}" style="background-image:url('${img}')">${inner}</header>`;
const topbar = right => `<div class="topbar"><div class="brand">${I.logo}<span>B1 Pro</span></div>${right || ''}</div>`;

// ----- Aujourd'hui -----
function vToday() {
  const td = today(), m = monthOf(td), rec = peekDay(td), p = planFor(td);
  const h = new Date().getHours();
  const hello = t(h < 12 ? 'hello_m' : h < 18 ? 'hello_a' : 'hello_e');
  const dayN = Math.max(0, diffDays(START, td) + 1), total = diffDays(START, END) + 1;
  const dateStr = parse(td).toLocaleDateString(langStage() >= 1 ? 'es-MX' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const nDue = dueCards().length, nNew = newCards().length;
  const vocMonth = VOCALS.filter(v => monthOf(v.date).id === m.id).length;
  const deliv = DELIVERABLES[m.id - 1];
  const wk = weekKey(td);

  const taskRow = id => {
    const [title, sub] = tTask(id), x = TASKS[id], done = !!rec.done[id];
    let extra = '';
    if (id === 'cards') extra = ` · ${nDue + nNew}`;
    return `<li class="task ${done ? 'done' : ''}">
      <button class="check" data-a="toggle" data-v="${id}" aria-label="Fait">${I.check}</button>
      <button class="t-main" data-a="${x.go ? 'go' : x.min ? 'timer' : 'toggle'}" data-v="${id}"><div class="t-title">${esc(title)}${extra}</div><div class="t-sub">${esc(id === 'shadowing' && S.shadow[wk] ? S.shadow[wk] : sub)}</div></button>
      ${x.min ? `<button class="dur" data-a="timer" data-v="${id}">${I.play}${x.min} min</button>` : ''}
    </li>`;
  };

  return hero('img/hero.jpg', `
    ${topbar(`<span class="chip-white">${dayN ? `${t('day')} ${dayN}/${total}` : 'J-' + diffDays(td, START)}</span>`)}
    <div>
      <p class="lead cap">${esc(dateStr)}</p>
      <h1>${hello},<br>${esc(S.settings.name)}</h1>
      <span class="pill-sage">${langStage() >= 1 ? 'Mes' : 'Mois'} ${m.id} · ${esc(langStage() >= 2 ? m.es : m.fr)}</span>
    </div>`) + `
  <section class="sheet">
    <div class="stats">
      <div class="stat"><b>${streak()}</b><span>${t('streak')}</span></div>
      <div class="stat"><b>${nDue + nNew}</b><span>${t('due')}</span></div>
      <div class="stat"><b>${vocMonth}</b><span>${t('vocals')}</span></div>
    </div>
    <div class="progress gap-l"><i style="width:${Math.min(100, dayN / total * 100).toFixed(1)}%"></i></div>
    ${td < START ? `<div class="banner gap-l">${t('start_tomorrow')}</div>` : ''}
    ${p.kind === 'recovery' ? `<div class="banner warn gap-l">${t('recovery')}<div><button class="btn sm ghost" style="margin-top:10px" data-a="dismissRecovery">${t('ignore')}</button></div></div>` : ''}
    ${dueCards().length > 100 ? `<div class="banner warn gap-l">${t('backlog')}</div>` : ''}
    <div class="mode gap-l">
      <button class="${rec.mode !== 'min' ? 'on' : ''}" data-a="mode" data-v="normal">${t('normal')}</button>
      <button class="${rec.mode === 'min' ? 'on' : ''}" data-a="mode" data-v="min">${t('minimum')}</button>
    </div>
    ${dow(td) === 0 && p.kind === 'normal' ? `<p class="small muted" style="margin:12px 2px 0">${t('rest_day')}</p>` : ''}
    <div class="gap-l">
      <p class="eyebrow">${t('morning_sub')}</p>
      <h3>${t('morning')}</h3>
      <ul class="tasks">${p.am.map(taskRow).join('')}</ul>
    </div>
  </section>
  <section class="block" style="padding:0;background:none">
    <div class="dark">
      <p class="eyebrow">${t('evening_sub')}</p>
      <h3 style="font-size:24px">${t('evening')}</h3>
      <ul class="tasks">${p.pm.map(taskRow).join('')}</ul>
    </div>
  </section>
  ${hasKey() ? `<section class="block">
    <div class="row between"><h3 style="margin:0">✨ ${langStage() >= 1 ? 'Consejo del día' : 'Conseil du jour'}</h3>${aiS().tips[td] ? `<button class="btn sm ghost" data-a="aiTip">${langStage() >= 2 ? 'Otro' : 'Autre'}</button>` : ''}</div>
    ${aiS().tips[td] ? `<div class="gap-l">${aiS().tips[td].map(x => `<div class="list-item">${esc(x)}</div>`).join('')}</div>` : `<p class="small muted">${langStage() >= 2 ? 'Claude analiza tus datos y te da 3 consejos para hoy.' : 'Claude regarde tes statistiques et te donne 3 conseils pour aujourd\'hui.'}</p><button class="btn sage" data-a="aiTip">✨ ${langStage() >= 2 ? 'Ver mis consejos' : 'Voir mes conseils'}</button>`}
  </section>` : ''}
  <section class="block">
    <h2>${t('this_month')}</h2>
    <div class="hscroll">
      <div class="pcard"><div class="ph" style="background-image:url('img/verbs.jpg')"></div><p class="eyebrow">${t('month_tense')}</p><h4>${m.tenses.map(x => TENSES[x].label).join(' · ')}</h4><p class="small muted" style="margin:0">${esc(m.grammar)}</p></div>
      <div class="pcard"><div class="ph" style="background-image:url('${m.img}')"></div><p class="eyebrow">${t('milestone')}</p><h4>${esc(m.jalon)}</h4><button class="btn sm ${S.milestones[m.id] ? 'sage' : 'ghost'}" data-a="milestone" data-v="${m.id}">${S.milestones[m.id] ? '✓ ' + t('done_word') : t('mark_done')}</button></div>
      <div class="pcard"><div class="ph" style="background-image:url('img/cards.jpg')"></div><p class="eyebrow">${t('deliverable')}</p><h4>${esc(deliv.what)}</h4><p class="small muted" style="margin:0">${esc(deliv.session)}</p></div>
    </div>
    <hr class="sep">
    <label class="field"><span>${t('shadow_week')}</span><input type="text" data-in="shadow" value="${esc(S.shadow[wk] || '')}" placeholder="${esc(t('shadow_ph'))}"></label>
    ${m.rodage && td <= '2026-11-30' ? `<hr class="sep"><h3>${langStage() >= 1 ? 'Semana de arranque' : 'Semaine de rodage'}</h3><ul class="tasks">${m.rodage.map((r, i) => `<li class="task ${S.rodage[i] ? 'done' : ''}"><button class="check" data-a="rodage" data-v="${i}">${I.check}</button><button class="t-main" data-a="rodage" data-v="${i}"><div class="t-title" style="font-weight:500">${esc(r)}</div></button></li>`).join('')}</ul>` : ''}
  </section>
  <p class="foot">${langStage() >= 3 ? 'Regla de oro: aceptamos los errores.' : 'La règle d\'or : on accepte de faire des fautes.'}</p>`;
}

// ----- Cartes -----
function vCards() {
  if (ui.review) return vReview();
  const nDue = dueCards().length, nNew = newCards().length;
  const q = ui.cardQ.toLowerCase();
  const list = S.cards.filter(c => !q || (c.fr + ' ' + c.es + ' ' + c.tag).toLowerCase().includes(q));
  const learned = S.cards.filter(c => c.reps >= 2).length;
  return hero('img/cards.jpg', `${topbar(`<span class="chip-white">${S.cards.length} / 2000</span>`)}
    <div><h1>${t('cards_title')}</h1><p class="lead">${langStage() >= 3 ? 'Frases completas, nunca palabras sueltas.' : 'Des phrases entières, jamais de mots isolés.'}</p>
    <button class="pill-sage" data-a="startReview" ${nDue + nNew ? '' : 'disabled'}>${I.play} ${t('review')} · ${nDue + nNew}</button><p class="small" style="margin:8px 0 0;opacity:.85">${nDue} ${t('to_review')} · ${nNew} ${t('new_cards')}</p></div>`, 'small') + `
  <section class="sheet">
    <div class="stats">
      <div class="stat"><b>${S.cards.length}</b><span>total</span></div>
      <div class="stat"><b>${learned}</b><span>${langStage() >= 2 ? 'aprendidas' : 'apprises'}</span></div>
      <div class="stat"><b>${S.cardLog[today()]?.rev || 0}</b><span>${langStage() >= 2 ? 'repasos hoy' : 'révisions auj.'}</span></div>
    </div>
    ${nDue > 100 ? `<div class="banner warn gap-l">${t('backlog')}</div>` : ''}
    <div class="row gap-l"><button class="btn grow" data-a="cardForm">${I.plus} ${t('add_card')}</button>${hasKey() ? `<button class="btn sage" data-a="aiGenCards">✨ ${langStage() >= 2 ? 'Generar' : 'Générer'}</button>` : ''}</div>
  </section>
  ${S.inbox.length ? `<section class="block"><h3>${t('inbox')}</h3><p class="small muted" style="margin-top:-4px">${t('inbox_sub')}</p>
    ${S.inbox.map(w => `<div class="list-item row"><div class="grow"><b>${esc(w.word)}</b><div class="small muted">${esc(w.date)}</div></div>${hasKey() ? `<button class="btn sm sage" data-a="aiWordCard" data-v="${w.id}">✨</button>` : ''}<button class="btn sm" data-a="cardForm" data-v="${w.id}">${I.plus}</button><button class="icon-btn" data-a="inboxDel" data-v="${w.id}">${I.x}</button></div>`).join('')}
  </section>` : ''}
  <section class="block">
    <h3>${t('all_cards')}</h3>
    <input type="text" data-in="cardQ" value="${esc(ui.cardQ)}" placeholder="${esc(t('search'))}">
    <div style="margin-top:8px">${list.slice(0, 200).map(c => `<button class="list-item" style="display:block;width:100%;text-align:left" data-a="cardForm" data-v="card:${c.id}">
      <div class="row between"><div class="grow"><div style="font-weight:600">${esc(c.es)}</div><div class="small muted">${esc(c.fr)}</div></div><span class="tag" style="background:var(--soft)">${esc(c.tag)}</span></div>
      <div class="small" style="color:var(--ink3);margin-top:2px">${c.due ? (c.due <= today() ? (langStage() >= 2 ? 'para hoy' : 'à revoir') : (langStage() >= 2 ? 'próximo: ' : 'prochaine : ') + c.due) : (langStage() >= 2 ? 'nueva' : 'nouvelle')}</div></button>`).join('') || `<div class="empty">—</div>`}</div>
  </section>`;
}
function cardDirFor(r) {
  r.dirs ||= {};
  if (!r.dirs[r.i]) { const d = S.settings.cardDir; r.dirs[r.i] = d === 'mix' ? (Math.random() < 0.6 ? 'fr' : 'es') : d; }
  return r.dirs[r.i];
}
function gradeCard(r) {
  const c = r.queue[r.i], ref = cardDirFor(r) === 'fr' ? c.es : c.fr;
  r.res = checkAnswer(r.typed, ref); r.flip = true;
}
function vReview() {
  const r = ui.review;
  if (r.i >= r.queue.length) {
    return `<div style="padding-top:calc(16px + env(safe-area-inset-top))"></div><section class="block"><h2>${t('session_done')}</h2><p class="muted">${r.count} ${langStage() >= 2 ? 'tarjetas repasadas.' : 'cartes révisées.'} ${langStage() >= 3 ? '¡Hasta mañana!' : 'À demain !'}</p><button class="btn" data-a="endReview">OK</button></section>`;
  }
  const c = r.queue[r.i], st = S.settings, L = langStage() >= 2;
  const toEs = cardDirFor(r) === 'fr';
  const q = toEs ? c.fr : c.es, a = toEs ? c.es : c.fr;
  const mode = st.cardMode;
  const res = r.res;
  const modes = [['oral', L ? 'Oral' : 'Oral'], ['type', L ? 'Escrito' : 'Écrit'], ...(canListen ? [['voice', L ? 'Voz' : 'Voix']] : [])];
  const dirs = [['fr', 'FR → ES'], ['es', 'ES → FR'], ['mix', L ? 'Mezcla' : 'Mixte']];
  return `<div style="padding-top:calc(14px + env(safe-area-inset-top))"></div>
  <section class="block">
    <div class="row between" style="margin-bottom:12px"><button class="icon-btn" data-a="endReview">${I.x}</button><span class="small muted">${r.i + 1} / ${r.queue.length}</span><span class="tag" style="background:var(--soft)">${c.due ? esc(c.tag) : '✦ ' + t('new_cards').replace(/s$/, '')}</span></div>
    <div class="row between wrap" style="margin-bottom:12px;gap:6px">
      <div class="chips">${modes.map(([k, l]) => `<button class="chip ${mode === k ? 'on' : ''}" data-a="cardMode" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="chips">${dirs.map(([k, l]) => `<button class="chip ${st.cardDir === k ? 'on' : ''}" data-a="cardDir" data-v="${k}">${l}</button>`).join('')}</div>
    </div>
    <div class="fc">
      <div><p class="eyebrow">${toEs ? 'Français' : 'Español'}</p><div class="front">${esc(q)}</div>
      ${!toEs && !r.flip ? `<button class="btn ghost sm" style="margin-top:10px" data-a="speak" data-v="${esc(c.es)}">${I.speak} Escuchar</button>` : ''}
      ${r.flip ? (res ? `<div class="check-res v-${res.verdict}"><b>${VERDICT()[res.verdict]}</b>${res.verdict === 'ok' && !res.accentsOk ? `<div class="small">${L ? 'Ojo con los acentos.' : 'Attention aux accents.'}</div>` : ''}
          <div class="small" style="margin-top:6px;opacity:.75">${L ? 'Tu respuesta' : 'Ta réponse'} : ${esc(r.typed || '—')}</div></div>
          <div class="back">${res.html}</div>` : `<div class="back">${esc(a)}</div>`) : ''}</div>
      ${!r.flip && mode !== 'oral' ? `<div class="gap-l">
          <div class="row"><input type="text" id="ansIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${toEs ? 'Escribe en español…' : 'Écris en français…'}" value="${esc(r.typed || '')}">
          ${canListen ? `<button class="icon-btn ${ui.listening ? 'rec-live' : ''}" data-a="listenCard">${I.mic}</button>` : ''}</div>
          ${mode === 'voice' && canListen ? `<p class="small muted" style="margin:8px 2px 0">${ui.listening ? (L ? 'Te escucho…' : 'Je t\'écoute…') : (L ? 'Toca el micrófono y di la frase.' : 'Touche le micro et dis la phrase.')}</p>` : ''}
        </div>` : ''}
      <div class="row between" style="margin-top:16px">${r.flip ? `<button class="btn ghost sm" data-a="speak" data-v="${esc(c.es)}">${I.speak} Escuchar</button>` : mode === 'oral' ? `<span class="small muted">${langStage() >= 3 ? 'Dila en voz alta antes de girar.' : 'Dis-la à voix haute avant de retourner.'}</span>` : ''}</div>
    </div>
    ${r.flip ? `<div class="rate">${[0, 1, 2, 3].map(k => `<button class="r${k} ${res && SUGGEST[res.verdict] === k ? 'sugg' : ''}" data-a="rate" data-v="${k}">${t(['again', 'hard', 'good', 'easy'][k])}<small>${ivLabel(c, k)}</small></button>`).join('')}</div>`
      : mode === 'oral' ? `<button class="btn block-w" style="margin-top:12px;padding:15px" data-a="flip">${t('show')}</button>`
      : `<div class="row" style="margin-top:12px"><button class="btn ghost" data-a="flip">${L ? 'No sé' : 'Je ne sais pas'}</button><button class="btn grow" style="padding:15px" data-a="checkCard">${t('check')}</button></div>`}
    ${r.flip && hasKey() ? `<div class="row wrap gap-l" style="gap:8px">
      ${res && res.verdict !== 'ok' && res.verdict !== 'typo' && !r.ai ? `<button class="btn sm sage" data-a="aiJudge">✨ ${L ? '¿Mi respuesta vale?' : 'Ma réponse est-elle acceptable ?'}</button>` : ''}
      ${!r.ai ? `<button class="btn sm ghost" data-a="aiExplain">✨ ${L ? 'Explicar' : 'Explique-moi'}</button>` : ''}</div>` : ''}
    ${r.ai ? `<div class="banner gap-l">${r.ai.aceptable === true ? '<b>✓ Claude accepte ta réponse.</b><br>' : r.ai.aceptable === false ? '<b>✗ Claude ne l\'accepte pas.</b><br>' : ''}<span style="white-space:pre-wrap">${esc(r.ai.explicacion)}</span>${r.ai.regla ? `<div class="small muted" style="margin-top:6px">${esc(r.ai.regla)}</div>` : ''}</div>` : ''}
  </section>`;
}

// ----- Pratique -----
function vPractice() {
  const sub = ui.sub.practice;
  const seg = `<div class="seg">${[['drill', t('drill')], ['vocal', t('vocal')], ['writing', t('writing')], ['intensive', t('intensive')]].map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="sub" data-v="practice:${k}">${l}</button>`).join('')}</div>`;
  const body = { drill: vDrill, vocal: vVocal, writing: vWriting, intensive: vIntensive }[sub]();
  return hero('img/verbs.jpg', `${topbar()}<div><h1>${t('tab_practice')}</h1><p class="lead">${langStage() >= 3 ? 'Producir cada semana. Entender sin producir no te lleva al B1.' : 'Produire chaque semaine. Comprendre sans produire ne fait pas passer au B1.'}</p></div>`, 'small') + `<section class="sheet">${seg}${body}</section>`;
}
function newDrill() {
  const m = monthOf(today());
  const d = ui.drill || { tenses: m.tenses.slice(), n: 0, table: false };
  const [inf, comp] = rnd(VERBS), p = Math.floor(Math.random() * 5), tense = rnd(d.tenses);
  ui.drill = { ...d, inf, comp, p, tense, shown: false, res: null, said: '' };
}
function sentence(inf, comp, p, tense) {
  const pr = `<span class="pr">(${PERSONS[p]})</span>`;
  const v = conj(inf, tense, p);
  if (tense === 'subjuntivo') return { q: `Es importante que ${PERSONS[p]} <span class="blank">&nbsp;</span> ${esc(comp)}.`, a: `Es importante que ${PERSONS[p]} ${v} ${comp}.` };
  const fr = TENSES[tense].frame;
  return { q: `${fr} ${pr} <span class="blank">&nbsp;</span> ${esc(comp)}.`, a: `${fr} ${v} ${comp}.` };
}
function vDrill() {
  if (!ui.drill || !ui.drill.inf) newDrill();
  const d = ui.drill, v = VERBS.find(x => x[0] === d.inf);
  const src = d.tense === 'presente' ? `<b>${d.inf}</b> ${esc(d.comp)} · <span class="pr">${PERSONS[d.p]}</span>` : `Hoy <span class="pr">(${PERSONS[d.p]})</span> <b>${conj(d.inf, 'presente', d.p)}</b> ${esc(d.comp)}.`;
  const s = sentence(d.inf, d.comp, d.p, d.tense);
  const allT = ['presente', 'proximo', 'indefinido', 'imperfecto', 'futuro', 'condicional', 'subjuntivo'];
  const dm = S.settings.drillMode === 'voice' && !canListen ? 'oral' : S.settings.drillMode;
  const L2 = langStage() >= 2;
  return `
  <div class="chips" style="margin-bottom:10px">${[['oral', 'Oral'], ['type', L2 ? 'Escrito' : 'Écrit'], ...(canListen ? [['voice', L2 ? 'Voz' : 'Voix']] : [])].map(([k, l]) => `<button class="chip ${dm === k ? 'on' : ''}" style="${dm === k ? 'background:var(--sage);color:var(--sage-ink)' : ''}" data-a="drillMode" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="chips" style="margin-bottom:16px">${allT.map(x => `<button class="chip ${d.tenses.includes(x) ? 'on' : ''}" data-a="drillTense" data-v="${x}">${TENSES[x].label}</button>`).join('')}</div>
  <div class="soft" style="padding:20px">
    <div class="row between"><span class="tag">${TENSES[d.tense].label} · ${esc(v[2])}</span><div class="dots">${[0, 1, 2, 3, 4].map(i => `<i class="${i < d.n % 5 || (d.n && d.n % 5 === 0) ? 'on' : ''}"></i>`).join('')}</div></div>
    <p class="drill-src" style="margin:16px 0 0">${src}</p>
    <div class="drill-q">${d.shown ? esc(s.a) : s.q}</div>
    <p class="small muted" style="margin:0">${t('drill_hint')}</p>
  </div>
  ${d.shown && d.res ? `<div class="check-res v-${d.res.verdict} gap-l"><b>${VERDICT()[d.res.verdict]}</b>${d.res.verdict === 'ok' && d.res.accentsOk === false ? `<div class="small">${langStage() >= 2 ? 'Ojo con el acento' : 'Attention à l\'accent'} : <b>${esc(conj(d.inf, d.tense, d.p))}</b></div>` : ''}<div class="small" style="margin-top:4px;opacity:.75">${langStage() >= 2 ? 'Tu respuesta' : 'Ta réponse'} : ${esc(d.said || '—')}</div></div>` : ''}
  ${!d.shown && dm !== 'oral' ? `<div class="row gap-l">${dm === 'type' ? `<input type="text" id="drillIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${langStage() >= 2 ? 'Escribe el verbo…' : 'Écris le verbe conjugué…'}" value="${esc(d.said || '')}">` : `<span class="grow small muted">${ui.listening ? (langStage() >= 2 ? 'Te escucho…' : 'Je t\'écoute…') : (langStage() >= 2 ? 'Di la frase completa.' : 'Dis la phrase complète.')}</span>`}
      ${canListen ? `<button class="icon-btn ${ui.listening ? 'rec-live' : ''}" data-a="listenDrill">${I.mic}</button>` : ''}</div>` : ''}
  <div class="row gap-l">
    ${d.shown ? `<button class="btn ghost" data-a="speak" data-v="${esc(s.a)}">${I.speak}</button><button class="btn grow" data-a="drillNext">${t('next')} ${I.arrow}</button>`
      : dm === 'type' ? `<button class="btn ghost" data-a="drillShow">${langStage() >= 2 ? 'No sé' : 'Je ne sais pas'}</button><button class="btn grow" style="padding:14px" data-a="drillCheck">${t('check')}</button>`
      : `<button class="btn grow" style="padding:14px" data-a="drillShow">${t('check')}</button>`}
  </div>
  <details class="gap-l" ${d.table ? 'open' : ''}><summary class="row between" data-a="drillTable"><h4 style="margin:0">${t('table')} · ${d.inf} · ${TENSES[d.tense].label}</h4>${I.arrow.replace('<svg', '<svg style="width:16px;transform:rotate(90deg)"')}</summary>
    <table class="conj" style="margin-top:8px">${PERSONS.map((p, i) => `<tr><td>${p}${i === 4 ? ' / ustedes' : i === 2 ? ' / usted' : ''}</td><td><b>${conj(d.inf, d.tense, i)}</b></td></tr>`).join('')}</table>
  </details>
  <p class="small muted gap-l">${langStage() >= 3 ? 'Un tiempo por mes, no más. 5 frases bastan.' : 'Un temps par mois, pas plus. 5 phrases suffisent. La séance est cochée à la 5e.'}</p>`;
}
function vVocal() {
  const r = ui.rec, m = monthOf(today());
  const byMonth = {};
  VOCALS.forEach(v => (byMonth[monthOf(v.date).id] ||= []).push(v));
  const first = VOCALS[0];
  return `
  <p class="small muted" style="margin-top:0">${t('rec_hint')}</p>
  <div class="big-time">${r ? fmt(Math.max(0, 120 - r.elapsed)) : '2:00'}</div>
  <button class="rec-btn ${r ? 'on' : ''}" data-a="${r ? 'recStop' : 'recStart'}">${r ? I.stop : I.mic}</button>
  <p class="small muted" style="text-align:center;margin:6px 0 0">${r ? t('stop') : t('start')}</p>
  ${r && canListen && S.settings.transcribe !== false ? `<div class="soft gap-l"><p class="eyebrow">${langStage() >= 2 ? 'Transcripción en vivo' : 'Transcription en direct'}</p><div id="liveTx" style="min-height:44px">${esc((r.tx.text || []).join(' '))}</div></div>` : ''}
  ${(() => { const w = VOCALS.filter(v => v.wpm); if (w.length < 2) return ''; const f = w[0], l = w[w.length - 1]; return `<div class="stats gap-l"><div class="stat"><b>${l.nw}</b><span>${langStage() >= 2 ? 'palabras (último)' : 'mots (dernier)'}</span></div><div class="stat"><b>${l.wpm}</b><span>${langStage() >= 2 ? 'palabras/min' : 'mots/min'}</span></div><div class="stat"><b>${l.wpm - f.wpm >= 0 ? '+' : ''}${l.wpm - f.wpm}</b><span>${langStage() >= 2 ? 'vs. el primero' : 'vs. le premier'}</span></div></div>`; })()}
  ${first ? `<hr class="sep"><div class="soft"><p class="eyebrow">${langStage() >= 2 ? 'Audio 0 · para comparar en mayo' : 'Vocal 0 · à comparer en mai'}</p><div class="row"><span class="grow small">${esc(first.date)} · ${fmt(first.dur)}</span><button class="btn sm ghost" data-a="play" data-v="${first.id}">${I.play}</button></div></div>` : ''}
  <hr class="sep">
  <h3>${t('my_vocals')}</h3>
  ${Object.keys(byMonth).length ? Object.keys(byMonth).sort((a, b) => b - a).map(k => `<p class="eyebrow gap-l">${langStage() >= 1 ? 'Mes' : 'Mois'} ${k} · ${byMonth[k].length}</p>${byMonth[k].slice().reverse().map((v, i, arr) => `
      <div class="list-item row"><div class="grow"><div style="font-weight:600">${esc(parse(v.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }))} ${i === arr.length - 1 ? `<span class="tag" style="background:var(--sage);color:var(--sage-ink)">${t('reference')}</span>` : ''}</div><div class="small muted">${fmt(v.dur)}${v.nw ? ` · ${v.nw} ${langStage() >= 2 ? 'palabras' : 'mots'} · ${v.wpm}/min` : ''}${v.words?.length ? ' · ' + esc(v.words.join(', ')) : ''}</div></div>
      <button class="icon-btn" data-a="play" data-v="${v.id}">${I.play}</button><button class="icon-btn" data-a="vocalDel" data-v="${v.id}">${I.x}</button></div>
      ${v.tx ? `<details class="small" style="margin:-4px 0 6px"><summary class="muted">${langStage() >= 2 ? 'Ver transcripción' : 'Voir la transcription'}</summary><p style="margin:6px 0 0">${esc(v.tx)}</p>${hasKey() ? `<button class="btn sm sage" style="margin-top:6px" data-a="aiCorrectVocal" data-v="${v.id}">✨ ${langStage() >= 2 ? 'Corregir' : 'Corriger'}</button>` : ''}</details>` : ''}`).join('')}`).join('') : `<div class="empty">${langStage() >= 2 ? 'Aún no hay audios.' : 'Pas encore de vocal.'}</div>`}
  <div id="player"></div>`;
}
const WRITING_TOPICS = {
  1: ['Mi presentación en 10 frases (quién soy, qué hago, por qué América Latina)', 'Un día típico de mi semana', 'Mi ciudad: lo que me gusta y lo que no', 'Mensaje a un nuevo compañero de tándem'],
  2: ['Mi viaje a Vietnam', 'El último partido que fotografié', 'Mi fin de semana pasado', 'Mi experiencia profesional para el CV'],
  3: ['Un recuerdo de mi infancia', 'Correo a un hotel para reservar una habitación', 'Carta de motivación para una agencia receptiva', 'Describe un lugar que te marcó'],
  4: ['¿Por qué quiero hacer un VIA o un PVT en América Latina?', 'Mis proyectos en cinco años', 'A favor o en contra del VAR', 'Correo para aceptar una entrevista'],
  5: ['Correo de candidatura espontánea a una agencia', 'Respuesta a un cliente insatisfecho', 'Instrucciones para un grupo de turistas', 'Publicación de Instagram para una agencia'],
  6: ['Correo profesional de 150 palabras sin diccionario', 'Balance de mis seis meses de español', 'Carta de motivación final', 'Respuesta a una oferta de VIA']
};
function vWriting() {
  const w = S.writing ||= { topic: '', text: '' }, m = monthOf(today()), L = langStage() >= 2;
  const words = (w.text || '').trim().split(/\s+/).filter(Boolean).length;
  return `<p class="small muted" style="margin-top:0">${L ? 'El escrito de la semana (sábado). Elige un tema, escribe sin diccionario y luego corrige con Claude.' : 'L\'écrit de la semaine (samedi). Choisis un sujet, écris sans dictionnaire, puis fais corriger par Claude.'}</p>
  <div class="chips" style="margin-bottom:12px">${WRITING_TOPICS[m.id].map(x => `<button class="chip ${w.topic === x ? 'on' : ''}" data-a="writeTopic" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
  <label class="field"><span>${L ? 'Tema' : 'Sujet'}</span><input type="text" data-in="write:topic" value="${esc(w.topic)}"></label>
  <label class="field gap-l"><span>${L ? 'Tu texto' : 'Ton texte'} · <span id="wc">${words}</span> ${L ? 'palabras' : 'mots'}</span><textarea data-in="write:text" rows="9" placeholder="${L ? 'Escribe aquí…' : 'Écris ici, en espagnol…'}">${esc(w.text)}</textarea></label>
  <div class="row gap-l">${canListen ? `<button class="btn ghost ${ui.listening ? 'rec-live' : ''}" data-a="dictateWriting">${I.mic}</button>` : ''}
    ${hasKey() ? `<button class="btn grow" data-a="aiCorrectWriting">✨ ${L ? 'Corregir con Claude' : 'Corriger avec Claude'}</button>` : `<button class="btn grow ghost" data-a="goAISettings">✨ ${L ? 'Activar la IA' : 'Activer l\'IA pour corriger'}</button>`}</div>`;
}
function vIntensive() {
  const x = S.intensive;
  return `
  <p class="small muted" style="margin-top:0">${langStage() >= 3 ? 'Martes y jueves: 2 minutos de audio, transcritos a mano y comparados.' : 'Mardi et jeudi : 2 minutes d\'audio transcrites à la main, puis comparées. Hoy Hablamos et Españolistos ont des transcriptions.'}</p>
  <div class="stack">
    <label class="field"><span>${t('int_src')}</span><input type="text" data-in="int:src" value="${esc(x.src)}"></label>
    <label class="field"><span>${t('int_mine')}</span><textarea data-in="int:mine" rows="5">${esc(x.mine)}</textarea></label>
    <label class="field"><span>${t('int_ref')}</span><textarea data-in="int:ref" rows="5">${esc(x.ref)}</textarea></label>
  </div>
  <div class="row gap-l"><button class="btn grow" data-a="compare">${t('compare')}</button><button class="btn ghost" data-a="intClear">${langStage() >= 2 ? 'Nuevo' : 'Nouveau'}</button></div>
  <div id="diffOut" class="gap-l">${x.result || ''}</div>`;
}
function wordDiff(mine, ref) {
  const norm = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ0-9]/g, '');
  const A = mine.split(/\s+/).map(norm).filter(Boolean), Braw = ref.split(/\s+/).filter(Boolean), B = Braw.map(norm);
  const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] && A[i] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const hit = new Set(); let i = 0, j = 0;
  while (i < n && j < m) { if (A[i] === B[j] && A[i]) { hit.add(j); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  const html = Braw.map((w, k) => B[k] && !hit.has(k) ? `<span class="miss">${esc(w)}</span>` : esc(w)).join(' ');
  const total = B.filter(Boolean).length;
  return { html, pct: total ? Math.round(hit.size / total * 100) : 0 };
}

// ----- Programme -----
function vPlan() {
  const sub = ui.sub.plan;
  const seg = `<div class="seg">${[['program', t('program')], ['apply', t('applications')], ['res', t('resources')]].map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="sub" data-v="plan:${k}">${l}</button>`).join('')}</div>`;
  const m = monthOf(today());
  return hero(m.img, `${topbar(`<span class="chip-white">A2 → B1</span>`)}<div><h1>${sub === 'apply' ? 'VIA · PVT' : langStage() >= 1 ? 'Seis meses' : 'Six mois'}</h1><p class="lead">${langStage() >= 3 ? 'Una entrevista de 20 min, un correo profesional, un colega nativo a velocidad normal.' : 'Un entretien de 20 min, un mail pro correct, un collègue natif à vitesse normale.'}</p></div>`, 'small') +
    `<section class="sheet">${seg}${{ program: vProgram, apply: vApply, res: vRes }[sub]()}</section>`;
}
function vProgram() {
  const cur = monthOf(today()).id;
  const open = ui.openMonth ?? cur;
  return `<div class="stack">${MONTHS.map(m => `
    <div class="month ${m.id === cur ? 'now' : ''}">
      <button class="ph" style="background-image:url('${m.img}');width:100%;text-align:left" data-a="openMonth" data-v="${m.id}">
        <span class="tag" style="align-self:flex-start;background:${S.milestones[m.id] ? 'var(--sage)' : 'rgba(255,255,255,.9)'};color:#141414;margin-bottom:auto">${S.milestones[m.id] ? '✓ ' : ''}${langStage() >= 1 ? 'Mes' : 'Mois'} ${m.id} · ${esc(m.when)}</span>
        <h3>${esc(langStage() >= 2 ? m.es : m.fr)}</h3>
      </button>
      ${open === m.id ? `<div class="body">
        <dl class="kv"><dt>Grammaire</dt><dd>${esc(m.grammar)}</dd><dt>Vocabulaire</dt><dd>${esc(m.vocab)}</dd><dt>Oral</dt><dd>${esc(m.oral)}</dd><dt>Candidatures</dt><dd>${esc(m.cand)}</dd></dl>
        <div class="dark gap-l" style="padding:16px"><p class="eyebrow">${t('milestone')}</p><p style="margin:0 0 12px;font-weight:600">${esc(m.jalon)}</p><button class="btn sm ${S.milestones[m.id] ? 'sage' : ''}" data-a="milestone" data-v="${m.id}">${S.milestones[m.id] ? '✓ ' + t('done_word') : t('mark_done')}</button></div>
      </div>` : ''}
    </div>`).join('')}</div>
    <hr class="sep">
    <h3>${langStage() >= 1 ? 'Citas fijas' : 'Rendez-vous fixés'}</h3>
    ${MEETINGS.map(x => `<div class="list-item row"><span class="st ${x.date < today() ? 's2' : ''}">${esc(parse(x.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }))}</span><span class="grow small">${esc(x.what)}</span></div>`).join('')}
    <hr class="sep">
    <div class="soft small"><b>${langStage() >= 2 ? 'Si fallas un día' : 'Si tu rates un jour'}</b> : tu ne rattrapes pas, tu reprends le lendemain. <b>Mois difficile</b> (examens du MBA, gros événement photo) : mode minimum vital et jalons décalés d'un mois. Le programme tient en 6 comme en 7 mois.</div>`;
}
const DSTAT = () => langStage() >= 2 ? ['Por hacer', 'En curso', 'Hecho'] : ['À faire', 'En cours', 'Fait'];
const ASTAT = () => langStage() >= 2 ? ['Por contactar', 'Contactada', 'Respondió', 'Entrevista', 'Descartada'] : ['À contacter', 'Contactée', 'A répondu', 'Entretien', 'Écartée'];
function vApply() {
  const ds = DSTAT(), as = ASTAT();
  return `
  <h3>${langStage() >= 2 ? 'Entregables' : 'Livrables'}</h3>
  ${DELIVERABLES.map(d => { const s = S.deliv[d.id] || 0; return `<div class="list-item row"><div class="grow"><div class="small muted">${esc(d.month)} · ${esc(d.session)}</div><div style="font-weight:600">${esc(d.what)}</div></div><button class="st s${s}" data-a="deliv" data-v="${d.id}">${ds[s]}</button></div>`; }).join('')}
  <hr class="sep">
  <h3>${langStage() >= 2 ? 'Las 12 preguntas de entrevista' : 'Les 12 questions d\'entretien'}</h3>
  <p class="small muted" style="margin-top:-4px">${langStage() >= 3 ? 'Respuesta de 45 s a 1 min: escrita, aprendida y luego improvisada.' : 'Réponse de 45 s à 1 min : écrite, apprise, puis improvisée. Le but : avoir les briques prêtes, pas réciter.'}</p>
  ${QUESTIONS.map((q, i) => { const a = S.answers[i] || ''; const o = ui.openQ === i; return `<div class="list-item">
    <button class="row" style="width:100%;text-align:left" data-a="openQ" data-v="${i}"><span class="st ${a.trim() ? 's2' : ''}">${i + 1}</span><span class="grow" style="font-weight:600">${esc(q)}</span></button>
    ${o ? `<div class="stack" style="margin-top:10px"><textarea data-in="ans:${i}" rows="5" placeholder="${langStage() >= 3 ? 'Mi respuesta…' : 'Ma réponse en espagnol…'}">${esc(a)}</textarea>
      <div class="row"><button class="btn sm ghost" data-a="speak" data-v="${esc(q)}">${I.speak} ${langStage() >= 2 ? 'Escuchar' : 'Écouter'}</button>${canListen ? `<button class="btn sm ghost ${ui.listening ? 'rec-live' : ''}" data-a="dictate" data-v="${i}">${I.mic} ${langStage() >= 2 ? 'Dictar' : 'Dicter'}</button>` : ''}<button class="btn sm" data-a="practiceQ" data-v="${i}">${I.clock} ${langStage() >= 2 ? 'Responder 1 min' : 'Répondre en 1 min'}</button>${a.trim() ? `<button class="btn sm ghost" data-a="speak" data-v="${esc(a)}">${I.play}</button>` : ''}${a.trim() && hasKey() ? `<button class="btn sm sage" data-a="aiCorrectAnswer" data-v="${i}">✨ ${langStage() >= 2 ? 'Corregir' : 'Corriger'}</button>` : ''}</div></div>` : ''}
  </div>`; }).join('')}
  <hr class="sep">
  <h3>${langStage() >= 2 ? 'Agencias receptivas' : 'Agences réceptives'} · ${S.agencies.length}/15</h3>
  ${S.agencies.map(a => `<div class="list-item row"><span class="grow" style="font-weight:600">${esc(a.name)}</span><button class="st ${['', 's1', 's2', 's3', 's4'][a.status]}" data-a="agency" data-v="${a.id}">${as[a.status]}</button><button class="icon-btn" data-a="agencyDel" data-v="${a.id}">${I.x}</button></div>`).join('')}
  <div class="row gap-l"><input type="text" id="agIn" placeholder="${langStage() >= 3 ? 'Nombre de la agencia' : 'Nom de l\'agence'}"><button class="btn" data-a="agencyAdd">${I.plus}</button></div>
  <hr class="sep">
  <h3>${langStage() >= 2 ? 'Calendario' : 'Calendrier'}</h3>
  ${CALENDAR.map(c => `<div class="list-item"><div class="small muted">${esc(c.when)}</div><div>${esc(c.what)}</div></div>`).join('')}
  <hr class="sep">
  <h3>${langStage() >= 2 ? 'Vocabulario profesional' : 'Vocabulaire pro'}</h3>
  ${PRO_VOCAB.map(([k, v]) => `<p class="eyebrow gap-l">${esc(k)}</p><div class="chips">${v.split(', ').map(w => `<button class="chip" data-a="speak" data-v="${esc(w)}">${esc(w)}</button>`).join('')}</div>`).join('')}`;
}
function vRes() {
  return `${CONTENT.map(([k, v]) => `<div class="list-item"><h4>${esc(k)}</h4><div class="small muted">${esc(v)}</div></div>`).join('')}
  <hr class="sep">
  <h3>${langStage() >= 2 ? 'Para hablar' : 'Pour parler'}</h3>
  <div class="list-item"><h4>Sessions avec Claude</h4><div class="small muted">Mercredi et dimanche, 20 min. Lance avec « sesión de conversación » + le thème. Correction en fin de session et 5 cartes à créer.</div></div>
  <div class="list-item"><h4>Tandem / HelloTalk</h4><div class="small muted">Dès février, 1 fois par semaine. 15 min dans chaque langue. Cible : Colombiens, Mexicains, Péruviens.</div></div>
  <div class="list-item"><h4>Groupes locaux</h4><div class="small muted">Cafés des langues et Meetup à Metz ou Nancy, association des étudiants latino-américains de l'université de Lorraine.</div></div>
  <div class="list-item"><h4>Tuteur en ligne (option)</h4><div class="small muted">Avril-mai : 4 à 5 cours de 30 min sur iTalki ou Preply, environ 8 à 12 € le cours.</div></div>`;
}

// ----- Suivi -----
function vProgress() {
  const sub = ui.sub.progress;
  const seg = `<div class="seg">${[['balance', t('balance')], ['eval', t('evaluation')], ['errors', t('errors')], ['settings', t('settings')]].map(([k, l]) => `<button class="${sub === k ? 'on' : ''}" data-a="sub" data-v="progress:${k}">${l}</button>`).join('')}</div>`;
  return hero('img/m4.jpg', `${topbar()}<div><h1>${t('tab_progress')}</h1><p class="lead">${langStage() >= 3 ? 'B1 alcanzado cuando todo está en 3 o más.' : 'B1 atteint quand tout est à 3 ou plus.'}</p></div>`, 'small') +
    `<section class="sheet">${seg}${{ balance: vBalance, eval: vEval, errors: vErrors, settings: vSettings }[sub]()}</section>`;
}
function weekStats(wk) {
  let days = 0, added = 0, voc = 0;
  for (let i = 0; i < 6; i++) { const d = addDays(wk, i); if (isDone(d)) days++; }
  const end = addDays(wk, 6);
  added = S.cards.filter(c => c.mine && c.added >= wk && c.added <= end).length;
  voc = VOCALS.filter(v => v.date >= wk && v.date <= end).length;
  return { days, added, voc };
}
function vBalance() {
  const wk = weekKey(today()), w = S.weekly[wk] || { a: [] }, st = weekStats(wk);
  const past = Object.keys(S.weekly).filter(k => k < wk).sort().reverse();
  return `
  <p class="small muted" style="margin-top:0">${langStage() >= 3 ? 'Cada domingo, 10 minutos. Escríbelo en español: ya es un ejercicio.' : 'Chaque dimanche, 10 min. En espagnol : c\'est déjà un exercice. Puis colle-le dans une conversation avec Claude.'}</p>
  <div class="stats"><div class="stat"><b>${st.days}/6</b><span>${langStage() >= 2 ? 'días' : 'jours'}</span></div><div class="stat"><b>${st.added}</b><span>${langStage() >= 2 ? 'tarjetas propias' : 'cartes créées'}</span></div><div class="stat"><b>${st.voc}</b><span>${langStage() >= 2 ? 'audios' : 'vocaux'}</span></div></div>
  <p class="eyebrow gap-l">${langStage() >= 2 ? 'Semana del' : 'Semaine du'} ${esc(parse(wk).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }))}</p>
  <div class="stack">${BALANCE_Q.map(([es, fr], i) => `<label class="field"><span>${i + 1}. ${esc(es)}${langStage() < 3 ? ` <span style="color:var(--ink3)">· ${esc(fr)}</span>` : ''}</span><textarea rows="2" data-in="bal:${i}">${esc(w.a[i] || (i === 0 && !w.a[0] ? '' : ''))}</textarea></label>`).join('')}</div>
  ${hasKey() ? `<button class="btn block-w sage gap-l" style="padding:14px" data-a="aiCorrectBalance">✨ ${langStage() >= 2 ? 'Corregir y planificar con Claude' : 'Corriger et planifier avec Claude'}</button>` : ''}
  <button class="btn block-w gap-l ${hasKey() ? 'ghost' : ''}" style="padding:14px" data-a="copyBalance">${I.copy} ${t('copy_balance')}</button>
  ${past.length ? `<hr class="sep"><h3>${langStage() >= 2 ? 'Semanas anteriores' : 'Semaines passées'}</h3>${past.map(k => `<details class="list-item"><summary class="row between"><b>${esc(k)}</b><span class="small muted">${weekStats(k).days}/6</span></summary><div class="small" style="margin-top:8px;white-space:pre-wrap">${esc(S.weekly[k].a.map((x, i) => x ? `${i + 1}. ${x}` : '').filter(Boolean).join('\n'))}</div></details>`).join('')}` : ''}`;
}
function vEval() {
  const ok = mi => SKILLS.every((_, s) => (S.evalg[s + ':' + mi] || 0) >= 3);
  const last = [5, 4, 3, 2, 1, 0].find(mi => SKILLS.some((_, s) => S.evalg[s + ':' + mi]));
  return `
  <p class="small muted" style="margin-top:0">1 = ${langStage() >= 3 ? 'no lo logro' : 'je n\'y arrive pas'} · 2 = ${langStage() >= 3 ? 'con mucho esfuerzo' : 'avec beaucoup d\'efforts'} · 3 = ${langStage() >= 3 ? 'con algunas dudas' : 'avec quelques hésitations'} · 4 = ${langStage() >= 3 ? 'sin pensarlo' : 'sans y penser'}. ${langStage() >= 3 ? 'Toca para cambiar la nota.' : 'Touche une case pour noter, à la fin de chaque mois.'}</p>
  ${last !== undefined ? `<div class="banner ${ok(last) ? '' : 'warn'}" style="margin-bottom:14px">${ok(last) ? '🎯 B1 ' + (langStage() >= 2 ? 'alcanzado' : 'atteint') + ' (' + EVAL_MONTHS[last] + ')' : (langStage() >= 2 ? 'Todavía no: todo debe estar en 3 o más.' : 'Pas encore : tout doit être à 3 ou plus.')}</div>` : ''}
  ${SKILLS.map((sk, s) => `<div class="list-item"><div style="font-weight:600;margin-bottom:8px">${esc(sk)}</div><div class="grid-eval">${EVAL_MONTHS.map((m, mi) => { const v = S.evalg[s + ':' + mi] || 0; return `<div><small>${m}</small><button class="v${v}" data-a="eval" data-v="${s}:${mi}">${v || '·'}</button></div>`; }).join('')}</div></div>`).join('')}
  <hr class="sep">
  <h3>${langStage() >= 2 ? 'Señales' : 'Les signaux à surveiller'}</h3>
  <div class="list-item"><h4>✓ ${langStage() >= 2 ? 'Vas bien' : 'Tu avances bien'}</h4><div class="small muted">Les vocaux du soir s'allongent, tu hésites moins sur les 30 verbes, tu comprends les blagues dans les podcasts.</div></div>
  <div class="list-item"><h4>! ${langStage() >= 2 ? 'Hay que ajustar' : 'Il faut ajuster'}</h4><div class="small muted">Tu sautes les conversations, plus de 100 cartes en retard, contenus trop durs. On baisse le niveau des contenus d'un cran, jamais la fréquence.</div></div>`;
}
function vErrors() {
  return `
  <p class="small muted" style="margin-top:0">${langStage() >= 3 ? 'Después de cada conversación. Se relee el domingo. En mayo, cazamos los errores recurrentes.' : 'Alimenté après chaque conversation, relu le dimanche. En mai, on chasse les erreurs récurrentes.'}</p>
  <div class="stack"><input type="text" id="errA" placeholder="${esc(t('error_ph'))}"><input type="text" id="errB" placeholder="${esc(t('fix_ph'))}"></div>
  <button class="btn block-w gap-l" data-a="errAdd">${I.plus} ${t('add_error')}</button>
  <hr class="sep">
  ${S.errors.length ? S.errors.slice().reverse().map(e => `<div class="list-item row"><div class="grow"><div class="small" style="text-decoration:line-through;color:var(--bad)">${esc(e.a)}</div><div style="font-weight:600">${esc(e.b)}</div><div class="small" style="color:var(--ink3)">${esc(e.date)}${e.n > 1 ? ' · ×' + e.n : ''}</div></div><button class="btn sm ghost" data-a="errAgain" data-v="${e.id}">+1</button><button class="icon-btn" data-a="errDel" data-v="${e.id}">${I.x}</button></div>`).join('') : `<div class="empty">${langStage() >= 2 ? 'Ningún error anotado todavía.' : 'Aucune erreur notée pour l\'instant.'}</div>`}`;
}
function vSettings() {
  const s = S.settings;
  return `<div class="stack">
    <label class="field"><span>Prénom</span><input type="text" data-in="set:name" value="${esc(s.name)}"></label>
    <label class="field"><span>Langue de l'interface</span><select data-in="set:lang">
      <option value="auto" ${s.lang === 'auto' ? 'selected' : ''}>Progressive (FR en déc. → ES dès mars)</option>
      <option value="fr" ${s.lang === 'fr' ? 'selected' : ''}>Toujours en français</option>
      <option value="es" ${s.lang === 'es' ? 'selected' : ''}>Siempre en español</option></select></label>
    <label class="field"><span>Nouvelles cartes par jour</span><input type="number" min="0" max="40" data-in="set:newPerDay" value="${s.newPerDay}"></label>
    <label class="field"><span>Transcription des vocaux (reconnaissance vocale)</span><select data-in="set:transcribe"><option value="on" ${s.transcribe !== false ? 'selected' : ''}>Activée${canListen ? '' : ' (indisponible sur ce navigateur)'}</option><option value="off" ${s.transcribe === false ? 'selected' : ''}>Désactivée</option></select></label>
    <label class="field"><span>Thème</span><select data-in="set:theme"><option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>Automatique</option><option value="light" ${s.theme === 'light' ? 'selected' : ''}>Clair</option><option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Sombre</option></select></label>
  </div>
  <hr class="sep">
  ${vAISettings()}
  <hr class="sep">
  <h3>Sauvegarde</h3>
  <p class="small muted" style="margin-top:-4px">Tes données restent sur ce téléphone. Exporte-les de temps en temps (les vocaux ne sont pas inclus).</p>
  <div class="row wrap"><button class="btn" data-a="export">${I.copy} Exporter</button><label class="btn ghost">Importer<input type="file" accept="application/json" data-in="import" hidden></label></div>
  <hr class="sep">
  <button class="btn ghost sm" data-a="reset" style="color:var(--bad)">Tout réinitialiser</button>
  <p class="foot">Photos : Unsplash · B1 Pro v1</p>`;
}

// ---------- Modals ----------
function modal(html) {
  closeModal();
  const el = document.createElement('div');
  el.className = 'scrim'; el.id = 'scrim';
  el.innerHTML = `<div class="modal">${html}</div>`;
  el.addEventListener('click', e => { if (e.target === el) closeModal(); });
  document.body.appendChild(el);
}
function closeModal() { $('#scrim')?.remove(); }
function toast(msg) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 1800); }
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast(t('copied') + ' ✓'); }
  catch (e) { modal(`<h3>${t('copied')}</h3><textarea rows="8" style="width:100%">${esc(text)}</textarea>`); }
}

function cardForm(v) {
  let c = null, prefill = '';
  if (v?.startsWith('card:')) c = S.cards.find(x => x.id === v.slice(5));
  else if (v) prefill = S.inbox.find(w => w.id === v)?.word || '';
  const tags = [...new Set(S.cards.map(x => x.tag))];
  modal(`<div class="row between" style="margin-bottom:14px"><h3 style="margin:0">${c ? (langStage() >= 2 ? 'Editar' : 'Modifier') : t('add_card')}</h3><button class="icon-btn" data-a="close">${I.x}</button></div>
    <div class="stack">
      <label class="field"><span>${t('fr_side')}</span><textarea id="cfFr" rows="2">${esc(c?.fr || '')}</textarea></label>
      <label class="field"><span>${t('es_side')}</span><textarea id="cfEs" rows="2" placeholder="${esc(prefill ? '… ' + prefill + ' …' : '')}">${esc(c?.es || '')}</textarea></label>
      <label class="field"><span>${t('tag')}</span><input type="text" id="cfTag" list="tags" value="${esc(c?.tag || 'mis frases')}"><datalist id="tags">${tags.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label>
    </div>
    <div class="row gap-l"><button class="btn grow" data-a="cardSave" data-v="${c ? c.id : ''}" data-w="${v && !c ? v : ''}">${t('save')}</button>${c ? `<button class="btn ghost" style="color:var(--bad)" data-a="cardDel" data-v="${c.id}">${t('delete')}</button>` : ''}</div>`);
  setTimeout(() => $('#cfFr')?.focus(), 50);
}
function convoModal() {
  const m = monthOf(today()), wk = weekKey(today());
  const theme = S.convoTheme[wk] || m.theme;
  const day = dow(today()) === 0 ? 'convo2' : 'convo';
  modal(`<div class="row between" style="margin-bottom:6px"><h3 style="margin:0">${t('convo_title')}</h3><button class="icon-btn" data-a="close">${I.x}</button></div>
    <p class="small muted">20 min. Claude parle uniquement en espagnol, corrige en fin de session et te donne 5 cartes à créer. ${m.id >= 5 ? 'En avril et mai : simulations d\'entretien.' : ''}</p>
    <label class="field"><span>${langStage() >= 2 ? 'Tema de la semana' : 'Thème de la semaine'}</span><input type="text" data-in="convoTheme" value="${esc(theme)}"></label>
    <div class="stack gap-l">
      <button class="btn block-w" data-a="copyConvo">${I.copy} ${t('copy_launch')}</button>
      <button class="btn block-w ghost" data-a="convoDone" data-v="${day}">${I.check} ${t('mark_done')}</button>
    </div>
    <p class="small muted gap-l">${langStage() >= 2 ? 'Después: añade los errores y las 5 tarjetas.' : 'Après : note tes erreurs (Suivi → Erreurs) et crée les 5 cartes.'}</p>`);
}

// ---------- Timer ----------
let ctx;
function beep() { try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.2, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .6); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .6); } catch (e) {} }
function startTimer(id, sec, label) {
  timer = { id, end: Date.now() + sec * 1000, label, paused: null };
  beep(); renderTimer();
}
function renderTimer() {
  let el = $('#timer');
  if (!timer) { el?.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'timer'; el.className = 'timer'; document.body.appendChild(el); }
  const left = timer.paused ?? Math.max(0, Math.round((timer.end - Date.now()) / 1000));
  el.innerHTML = `<span class="small" style="font-weight:600">${esc(timer.label)}</span><span class="tt">${fmt(left)}</span><button data-a="timerPause">${timer.paused != null ? '▶' : 'II'}</button><button data-a="timerStop">✕</button>`;
}
setInterval(() => {
  if (!timer || timer.paused != null) return;
  if (Date.now() >= timer.end) {
    const id = timer.id; timer = null; beep(); navigator.vibrate?.([200, 100, 200]);
    if (id && TASKS[id]) { setDone(id); toast('✓ ' + tTask(id)[0]); }
    render(); return;
  }
  renderTimer();
}, 500);

// ---------- Enregistrement ----------
async function recStart() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast(t('mic_err'));
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return modal(`<h3>Micro</h3><p>${t('mic_err')}</p><button class="btn" data-a="close">OK</button>`); }
  const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(m => MediaRecorder.isTypeSupported?.(m)) || '';
  const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
  const chunks = [];
  mr.ondataavailable = e => e.data.size && chunks.push(e.data);
  mr.onstop = async () => {
    stream.getTracks().forEach(tr => tr.stop());
    const r = ui.rec; ui.rec = null; clearInterval(r.iv);
    const tx = stopTranscript(r.tx);
    const dur = Math.min(120, (Date.now() - r.t0) / 1000);
    if (dur < 2) { render(); return; }
    const nw = tx ? tx.split(/\s+/).filter(Boolean).length : 0;
    const v = { id: uid(), date: today(), ts: Date.now(), dur, mime: mr.mimeType, blob: new Blob(chunks, { type: mr.mimeType }), words: [], tx, nw, wpm: nw ? Math.round(nw / (dur / 60)) : 0 };
    try { await idb.put(v); VOCALS.push(v); } catch (e) { toast('Erreur de sauvegarde'); }
    setDone('vocal'); render();
    modal(`<h3>${t('missing_words')}</h3><p class="small muted">${langStage() >= 3 ? 'Irán a «Por convertir en tarjetas».' : 'Ils iront dans « À transformer en cartes » pour demain.'}</p>
      <div class="stack"><input type="text" id="w0" placeholder="1"><input type="text" id="w1" placeholder="2"><input type="text" id="w2" placeholder="3"></div>
      <div class="row gap-l"><button class="btn grow" data-a="saveWords" data-v="${v.id}">${t('save')}</button><button class="btn ghost" data-a="close">${langStage() >= 2 ? 'Omitir' : 'Passer'}</button></div>`);
  };
  mr.start(1000);
  ui.rec = { mr, t0: Date.now(), elapsed: 0, tx: {} };
  if (canListen && S.settings.transcribe !== false) { try { startTranscript(ui.rec.tx); } catch (e) {} }
  ui.rec.iv = setInterval(() => {
    if (!ui.rec) return;
    ui.rec.elapsed = (Date.now() - ui.rec.t0) / 1000;
    if (ui.rec.elapsed >= 120) { ui.rec.mr.stop(); return; }
    const bt = document.querySelector('.big-time'); if (bt) bt.textContent = fmt(Math.max(0, 120 - ui.rec.elapsed));
  }, 250);
  render();
}
let playing;
function play(id) {
  const v = VOCALS.find(x => x.id === id); if (!v) return;
  if (playing) { playing.pause(); URL.revokeObjectURL(playing.src); }
  playing = new Audio(URL.createObjectURL(v.blob)); playing.play().catch(() => toast('Lecture impossible'));
}

// ---------- Actions ----------
const A = {
  tab: v => { ui.tab = v; ui.review = null; window.scrollTo(0, 0); },
  sub: v => { const [tab, s] = v.split(':'); ui.sub[tab] = s; },
  toggle: v => { const r = dayRec(today()); r.done[v] = !r.done[v]; save(); },
  mode: v => { dayRec(today()).mode = v; save(); },
  dismissRecovery: () => { S.recovery = { dismissed: today() }; save(); },
  timer: v => { startTimer(v, TASKS[v].min * 60, tTask(v)[0]); return false; },
  timerPause: () => { if (timer.paused != null) { timer.end = Date.now() + timer.paused * 1000; timer.paused = null; } else timer.paused = Math.max(0, Math.round((timer.end - Date.now()) / 1000)); renderTimer(); return false; },
  timerStop: () => { timer = null; renderTimer(); return false; },
  go: v => {
    const g = TASKS[v].go;
    if (g === 'cards') { ui.tab = 'cards'; A.startReview(); }
    else if (g === 'drill' || g === 'vocal' || g === 'intensive' || g === 'writing') { ui.tab = 'practice'; ui.sub.practice = g; }
    else if (g === 'convo' && hasKey()) { ui.tab = 'chat'; }
    else if (g === 'apply') { ui.tab = 'plan'; ui.sub.plan = 'apply'; }
    else if (g === 'balance') { ui.tab = 'progress'; ui.sub.progress = 'balance'; }
    else if (g === 'convo') { convoModal(); return false; }
    window.scrollTo(0, 0);
  },
  milestone: v => { S.milestones[v] = !S.milestones[v]; save(); },
  rodage: v => { S.rodage[v] = !S.rodage[v]; save(); },
  startReview: () => {
    const q = [...shuffle(dueCards()), ...newCards()];
    if (!q.length) { toast(t('nothing_due')); setDone('cards'); return; }
    ui.review = { queue: q, i: 0, flip: false, count: 0 };
  },
  flip: () => { ui.review.flip = true; },
  cardMode: v => { S.settings.cardMode = v; save(); },
  cardDir: v => { S.settings.cardDir = v; if (ui.review?.dirs) delete ui.review.dirs[ui.review.i]; save(); },
  checkCard: () => { const r = ui.review; r.typed = $('#ansIn')?.value || ''; if (!r.typed.trim()) { toast(langStage() >= 2 ? 'Escribe tu respuesta' : 'Écris ta réponse'); return false; } gradeCard(r); },
  listenCard: () => {
    const r = ui.review, toEs = cardDirFor(r) === 'fr', c = r.queue[r.i], ref = toEs ? c.es : c.fr;
    listenOnce(toEs ? 'es-MX' : 'fr-FR', alts => { r.typed = alts.reduce((b, x) => checkAnswer(x, ref).sim > checkAnswer(b, ref).sim ? x : b); gradeCard(r); render(); });
    return false;
  },
  drillMode: v => { S.settings.drillMode = v; ui.drill.res = null; save(); },
  drillCheck: () => {
    const d = ui.drill; d.said = $('#drillIn')?.value || '';
    if (!d.said.trim()) return false;
    d.res = checkForm(d.said, conj(d.inf, d.tense, d.p)); d.shown = true;
  },
  listenDrill: () => {
    const d = ui.drill, form = normTxt(conj(d.inf, d.tense, d.p));
    listenOnce('es-MX', alts => {
      const hit = alts.find(x => (' ' + normTxt(x) + ' ').includes(' ' + form + ' '));
      d.said = hit || alts[0];
      d.res = hit ? { verdict: 'ok', accentsOk: true } : { verdict: 'wrong' };
      d.shown = true; render();
    });
    return false;
  },
  rate: v => {
    const r = ui.review, c = r.queue[r.i], q = +v;
    rateCard(c, q); r.count++;
    if (q === 0) r.queue.push(c);
    r.i++; r.flip = false; r.res = null; r.typed = ''; r.ai = null;
    if (r.i >= r.queue.length) setDone('cards');
  },
  endReview: () => { ui.review = null; },
  speak: v => { speak(v); return false; },
  cardForm: v => { cardForm(v); return false; },
  cardSave: (v, el) => {
    const fr = $('#cfFr').value.trim(), es = $('#cfEs').value.trim(), tag = $('#cfTag').value.trim() || 'mis frases';
    if (!fr || !es) { toast(langStage() >= 2 ? 'Faltan las dos frases' : 'Il faut les deux phrases'); return false; }
    if (v) Object.assign(S.cards.find(c => c.id === v), { fr, es, tag });
    else S.cards.push({ id: uid(), fr, es, tag, due: null, iv: 0, ef: 2.5, reps: 0, mine: true, added: today() });
    if (el.dataset.w) S.inbox = S.inbox.filter(w => w.id !== el.dataset.w);
    save(); closeModal(); toast('✓');
  },
  cardDel: v => { if (!confirm(t('delete') + ' ?')) return false; S.cards = S.cards.filter(c => c.id !== v); save(); closeModal(); },
  inboxDel: v => { S.inbox = S.inbox.filter(w => w.id !== v); save(); },
  close: () => { closeModal(); return false; },
  drillTense: v => { const d = ui.drill; d.tenses = d.tenses.includes(v) ? d.tenses.filter(x => x !== v) : [...d.tenses, v]; if (!d.tenses.length) d.tenses = [v]; newDrill(); },
  drillShow: () => { ui.drill.shown = true; },
  drillNext: () => { ui.drill.n++; if (ui.drill.n === 5) { setDone('drill'); toast('✓ 5/5'); } newDrill(); },
  drillTable: () => { ui.drill.table = !ui.drill.table; },
  recStart: () => { recStart(); return false; },
  recStop: () => { ui.rec?.mr.stop(); return false; },
  play: v => { play(v); return false; },
  vocalDel: async v => { if (!confirm(t('delete') + ' ?')) return false; await idb.del(v); VOCALS = VOCALS.filter(x => x.id !== v); render(); return false; },
  saveWords: v => {
    const ws = ['#w0', '#w1', '#w2'].map(s => $(s).value.trim()).filter(Boolean);
    ws.forEach(w => S.inbox.push({ id: uid(), word: w, date: today() }));
    const voc = VOCALS.find(x => x.id === v); if (voc) { voc.words = ws; idb.put(voc); }
    save(); closeModal();
  },
  compare: () => {
    const x = S.intensive; if (!x.ref.trim()) { toast(langStage() >= 2 ? 'Pega la transcripción oficial' : 'Colle la transcription officielle'); return false; }
    const r = wordDiff(x.mine, x.ref);
    x.result = `<div class="soft"><p class="eyebrow">${r.pct}% ${t('caught')}</p><div class="diff">${r.html}</div></div>`;
    setDone('intensive'); save();
  },
  intClear: () => { S.intensive = { src: '', mine: '', ref: '' }; save(); },
  openMonth: v => { ui.openMonth = ui.openMonth === +v ? 0 : +v; },
  deliv: v => { S.deliv[v] = ((S.deliv[v] || 0) + 1) % 3; save(); },
  openQ: v => { ui.openQ = ui.openQ === +v ? null : +v; },
  writeTopic: v => { (S.writing ||= { topic: '', text: '' }).topic = v; save(); },
  dictateWriting: () => {
    listenOnce('es-MX', alts => { const w = S.writing ||= { topic: '', text: '' }; let s = alts[0].trim(); s = s.charAt(0).toUpperCase() + s.slice(1); w.text = (w.text ? w.text.trim() + ' ' : '') + s + '.'; save(); render(); });
    return false;
  },
  dictate: v => {
    listenOnce('es-MX', alts => { const cur = (S.answers[v] || '').trim(); let s = alts[0].trim(); s = s.charAt(0).toUpperCase() + s.slice(1); S.answers[v] = cur ? cur + ' ' + s : s; save(); render(); });
    return false;
  },
  practiceQ: v => { speak(QUESTIONS[v]); startTimer(null, 60, '#' + (+v + 1)); return false; },
  agency: v => { const a = S.agencies.find(x => x.id === v); a.status = (a.status + 1) % 5; save(); },
  agencyDel: v => { S.agencies = S.agencies.filter(x => x.id !== v); save(); },
  agencyAdd: () => { const n = $('#agIn').value.trim(); if (!n) return false; S.agencies.push({ id: uid(), name: n, status: 0, note: '' }); save(); },
  copyBalance: () => {
    const wk = weekKey(today()), w = S.weekly[wk] || { a: [] }, st = weekStats(wk);
    const lines = BALANCE_Q.map(([es], i) => `${i + 1}. ${es}: ${w.a[i] || (i === 0 ? st.days + '/6' : i === 1 ? String(st.added) : '')}`);
    copy(`balance semanal\n\n${lines.join('\n')}`);
    if (dow(today()) === 0) setDone('balance');
    return false;
  },
  copyConvo: () => { const wk = weekKey(today()); copy(`sesión de conversación — tema: ${S.convoTheme[wk] || monthOf(today()).theme}`); return false; },
  convoDone: v => { setDone(v); closeModal(); },
  eval: v => { S.evalg[v] = ((S.evalg[v] || 0) + 1) % 5; save(); },
  errAdd: () => { const a = $('#errA').value.trim(), b = $('#errB').value.trim(); if (!a && !b) return false; S.errors.push({ id: uid(), a, b, date: today(), n: 1 }); save(); },
  errAgain: v => { const e = S.errors.find(x => x.id === v); e.n = (e.n || 1) + 1; save(); },
  errDel: v => { S.errors = S.errors.filter(x => x.id !== v); save(); },
  export: () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `b1pro-${today()}.json`; a.click();
    return false;
  },
  reset: () => { if (confirm('Tout effacer (cartes, suivi, réglages) ? Les vocaux restent.')) { localStorage.removeItem(KEY); location.reload(); } return false; }
};

Object.assign(A, window.AI_ACTIONS || {});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  if (el.tagName === 'SUMMARY') e.preventDefault();
  const r = fn(el.dataset.v, el);
  if (r !== false) render();
});
document.addEventListener('input', e => {
  const k = e.target.dataset.in; if (!k) return;
  const v = e.target.value;
  if (k === 'shadow') S.shadow[weekKey(today())] = v;
  else if (k === 'cardQ') { ui.cardQ = v; const pos = e.target.selectionStart; render(); const i = document.querySelector('[data-in=cardQ]'); i.focus(); i.setSelectionRange(pos, pos); return; }
  else if (k.startsWith('int:')) S.intensive[k.slice(4)] = v;
  else if (k.startsWith('ans:')) S.answers[k.slice(4)] = v;
  else if (k.startsWith('bal:')) { const wk = weekKey(today()); (S.weekly[wk] ||= { a: [] }).a[+k.slice(4)] = v; }
  else if (k === 'convoTheme') S.convoTheme[weekKey(today())] = v;
  else if (k.startsWith('ai:')) { const f = k.slice(3); aiS()[f] = f === 'limit' ? Math.max(0, +v || 0) : v; save(); return; }
  else if (k.startsWith('write:')) { (S.writing ||= { topic: '', text: '' })[k.slice(6)] = v; const wc = $('#wc'); if (wc && k === 'write:text') wc.textContent = v.trim().split(/\s+/).filter(Boolean).length; }
  else if (k.startsWith('set:')) { const f = k.slice(4); S.settings[f] = f === 'newPerDay' ? Math.max(0, +v || 0) : f === 'transcribe' ? v === 'on' : v; save(); if (e.target.tagName === 'SELECT') render(); return; }
  else return;
  save();
});
document.addEventListener('change', e => {
  if (e.target.dataset.in !== 'import') return;
  const f = e.target.files[0]; if (!f) return;
  f.text().then(txt => { const d = JSON.parse(txt); if (!d.cards) throw 0; S = Object.assign(DEFAULT(), d); save(); render(); toast('Importé ✓'); }).catch(() => toast('Fichier invalide'));
});
document.addEventListener('input', e => {
  if (e.target.id === 'ansIn' && ui.review) ui.review.typed = e.target.value;
  if (e.target.id === 'drillIn' && ui.drill) ui.drill.said = e.target.value;
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'chatIn') { e.preventDefault(); A.chatSend(); return; }
  if (e.key === 'Enter' && e.target.id === 'ansIn') { e.preventDefault(); if (A.checkCard() !== false) render(); }
  if (e.key === 'Enter' && e.target.id === 'drillIn') { e.preventDefault(); if (A.drillCheck() !== false) render(); }
  if (e.key === 'Enter' && e.target.id === 'agIn') { A.agencyAdd(); render(); }
  if (e.key === 'Enter' && (e.target.id === 'errB')) { A.errAdd(); render(); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
