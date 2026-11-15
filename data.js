// Contenu tiré du « Programme espagnol A2 → B1 pro (nov. 2026 - mai 2027) »
const START = '2026-11-16';
const END = '2027-05-31';

const MONTHS = [
  { id: 1, from: '2026-11-16', to: '2026-12-31', img: 'img/m1.jpg',
    fr: 'Rodage, puis consolidation', es: 'Arranque y consolidación', when: '16 nov. → 31 déc.',
    tenses: ['presente', 'proximo'],
    grammar: 'Présent (réguliers, irréguliers, diphtongues), ser/estar, gustar et verbes du même type, ir a + infinitif.',
    vocab: 'Te présenter en détail (parcours, alternance, photo, MBA), la journée, la ville, le sport. 250 cartes.',
    oral: 'Shadowing sur un podcast lent, vocal quotidien sur ta journée. Conversations mercredi et dimanche.',
    cand: 'Rédiger ta présentation en 10 phrases (qui tu es, ce que tu fais, pourquoi l\'Amérique latine). Sue par cœur fin décembre.',
    jalon: 'Te présenter 2 minutes à l\'oral sans notes, enregistré.',
    theme: 'Presentarme: quién soy, mi día, mi ciudad',
    rodage: ['Installer l\'appli sur ton téléphone', 'Créer les 50 premières cartes', 'Choisir un podcast et une série', 'Enregistrer un premier vocal de 2 min (comparaison en mai)', 'Créer le compte Mon Volontariat International', 'Première session conversation (mercredi 25 nov.)'] },
  { id: 2, from: '2027-01-01', to: '2027-01-31', img: 'img/m2.jpg',
    fr: 'Le passé (pretérito indefinido)', es: 'El pasado (pretérito indefinido)', when: 'Janvier 2027',
    tenses: ['indefinido'],
    grammar: 'Indefinido des 30 verbes prioritaires, marqueurs temporels (ayer, la semana pasada, hace dos años). Imperfecto seulement en compréhension.',
    vocab: 'Raconter un événement sportif, un match photographié, un voyage (le Vietnam). 250 cartes.',
    oral: 'Vocal quotidien au passé (« qué hice hoy »). Passage à un podcast à vitesse normale sur le foot.',
    cand: 'Première version du CV en espagnol. Vocabulaire des métiers du marketing, de la communication et de la photo.',
    jalon: 'Raconter ton voyage au Vietnam en 3 minutes, au passé, enregistré.',
    theme: 'Mi viaje a Vietnam y un partido que fotografié' },
  { id: 3, from: '2027-02-01', to: '2027-02-28', img: 'img/m3.jpg',
    fr: 'Imperfecto et récit complet', es: 'Imperfecto y relato completo', when: 'Février 2027',
    tenses: ['imperfecto', 'indefinido'],
    grammar: 'Imperfecto, et surtout l\'alternance indefinido/imperfecto (le vrai marqueur du B1). Pronoms compléments (lo, la, le, se).',
    vocab: 'Décrire une situation, des habitudes passées, un lieu. Tourisme et hôtellerie (réservations, excursions, clients). 250 cartes.',
    oral: 'Série en VO sans sous-titres français (espagnols autorisés). Inscription tandem, première conversation avec un natif.',
    cand: 'Lettre de motivation type pour une agence réceptive, en espagnol, relue en session.',
    jalon: 'Conversation de 10 minutes avec un natif sans passer par le français.',
    theme: 'Recuerdos, costumbres y lugares; reservar una excursión' },
  { id: 4, from: '2027-03-01', to: '2027-03-31', img: 'img/m4.jpg',
    fr: 'Futur, conditionnel et opinion', es: 'Futuro, condicional y opinión', when: 'Mars 2027',
    tenses: ['futuro', 'condicional'],
    grammar: 'Futur simple, conditionnel (me gustaría, podría), exprimer une opinion (creo que, me parece que), connecteurs (sin embargo, además, por eso).',
    vocab: 'Projets, projets pro, argumenter, désaccord poli. Monde du travail (contrat, horaires, équipe, mission). 250 cartes.',
    oral: 'Débats courts en session (pour ou contre, foot ou voyage). Sous-titres espagnols retirés sur la série.',
    cand: 'Première simulation d\'entretien en espagnol (15 min) en fin de mois, enregistrée et débriefée.',
    jalon: 'Expliquer en 3 minutes pourquoi tu veux un VIA ou un PVT en Amérique latine, avec des arguments.',
    theme: 'Debate: ¿a favor o en contra? Mis proyectos' },
  { id: 5, from: '2027-04-01', to: '2027-04-30', img: 'img/m5.jpg',
    fr: 'Subjonctif d\'usage et espagnol pro', es: 'Subjuntivo de uso y español profesional', when: 'Avril 2027',
    tenses: ['subjuntivo'],
    grammar: 'Subjonctif présent dans ses usages courants (quiero que, es importante que, para que, cuando + futur). Impératif pour les consignes.',
    vocab: 'Mails pro, formules de politesse, téléphone, gestion de clients, réseaux sociaux et contenu. 250 cartes.',
    oral: 'Simulations d\'appel téléphonique et d\'accueil client. Podcasts à vitesse normale sur des sujets nouveaux.',
    cand: 'CV et lettre finalisés, 2 simulations d\'entretien (une VIA, une agence).',
    jalon: 'Écrire un mail pro de 150 mots sans dictionnaire, puis le corriger seul.',
    theme: 'Simulación: llamada telefónica y atención al cliente' },
  { id: 6, from: '2027-05-01', to: '2027-05-31', img: 'img/m6.jpg',
    fr: 'Mise en situation et validation B1', es: 'Puesta en situación y validación B1', when: 'Mai 2027',
    tenses: ['presente', 'indefinido', 'imperfecto', 'futuro', 'condicional', 'subjuntivo'],
    grammar: 'Révision générale, chasse aux erreurs récurrentes (celles du carnet d\'erreurs).',
    vocab: 'Consolidation, pas de nouveau thème. Révision des cartes uniquement.',
    oral: '3 conversations par semaine, dont 2 avec des natifs. Semaine 3 : une journée entière « en espagnol ».',
    cand: 'Candidatures réelles envoyées, entretiens préparés au cas par cas.',
    jalon: 'Simulation d\'entretien de 20 min, podcast natif de 10 min avec 5 questions, mail pro sans faute bloquante. Option : SIELE.',
    theme: 'Simulación de entrevista completa (20 min)' }
];

// Tâches de la routine. min = minutes, go = écran lié
const TASKS = {
  shadowing: { min: 5, icon: 'wave', fr: 'Shadowing', es: 'Shadowing', subFr: 'Répète par-dessus l\'extrait de la semaine', subEs: 'Repite sobre el extracto de la semana' },
  cards:     { min: 10, icon: 'cards', fr: 'Cartes', es: 'Tarjetas', subFr: 'Révisions du jour + 10 nouvelles', subEs: 'Repaso del día + 10 nuevas', go: 'cards' },
  drill:     { min: 5, icon: 'bolt', fr: 'Drill verbes', es: 'Verbos en voz alta', subFr: '5 phrases dans le temps du mois', subEs: '5 frases en el tiempo del mes', go: 'drill' },
  listen:    { min: 15, icon: 'head', fr: 'Écoute libre', es: 'Escucha libre', subFr: 'Podcast ou série en VO, sans sous-titres', subEs: 'Pódcast o serie en VO, sin subtítulos' },
  intensive: { min: 15, icon: 'pen', fr: 'Écoute intensive', es: 'Escucha intensiva', subFr: '2 min transcrites à la main, puis comparées', subEs: '2 min transcritos a mano y comparados', go: 'intensive' },
  vocal:     { min: 5, icon: 'mic', fr: 'Vocal de 2 min', es: 'Audio de 2 min', subFr: 'Ta journée ou le contenu écouté + 3 mots manquants', subEs: 'Tu día o lo que escuchaste + 3 palabras', go: 'vocal' },
  convo:     { min: 20, icon: 'chat', fr: 'Session conversation', es: 'Sesión de conversación', subFr: '« sesión de conversación » + thème de la semaine', subEs: '« sesión de conversación » + tema', go: 'convo' },
  convo2:    { min: 20, icon: 'chat', fr: 'Tandem ou session', es: 'Tándem o sesión', subFr: 'Conversation 2 de la semaine', subEs: 'Conversación 2 de la semana', go: 'convo' },
  series:    { min: 40, icon: 'film', fr: 'Série en VO', es: 'Serie en VO', subFr: 'Bloc long du samedi', subEs: 'Bloque largo del sábado' },
  writing:   { min: 20, icon: 'pen', fr: 'Écrit de la semaine', es: 'Escrito de la semana', subFr: 'Mail, paragraphe ou CV', subEs: 'Correo, párrafo o CV', go: 'writing' },
  apply:     { min: 0, icon: 'brief', fr: 'Candidatures', es: 'Postulaciones', subFr: 'Avancer le livrable du mois', subEs: 'Avanzar el entregable del mes', go: 'apply' },
  balance:   { min: 10, icon: 'check', fr: 'Bilan hebdo', es: 'Balance semanal', subFr: 'En espagnol, 5 à 10 lignes', subEs: 'En español, de 5 a 10 líneas', go: 'balance' },
  podcast:   { min: 15, icon: 'head', fr: 'Un podcast (voiture, trajet)', es: 'Un pódcast (carro, trayecto)', subFr: 'N\'importe lequel, l\'important est la chaîne', subEs: 'Cualquiera, lo importante es no romper la cadena' }
};

// 0 = dimanche … 6 = samedi
const WEEK = {
  1: { am: ['shadowing', 'cards', 'drill'], pm: ['listen', 'vocal'] },
  2: { am: ['shadowing', 'cards', 'drill'], pm: ['intensive', 'vocal'] },
  3: { am: ['shadowing', 'cards', 'drill'], pm: ['convo'] },
  4: { am: ['shadowing', 'cards', 'drill'], pm: ['intensive', 'vocal'] },
  5: { am: ['shadowing', 'cards', 'drill'], pm: ['listen', 'vocal'] },
  6: { am: ['cards'], pm: ['series', 'writing', 'apply'] },
  0: { am: ['cards'], pm: ['convo2', 'balance'], rest: true }
};
const MINIMUM = { am: ['cards'], pm: ['podcast'] };
const RECOVERY = { am: ['cards'], pm: ['listen'] };

// ---------- 30 verbes ----------
const PERSONS = ['yo', 'tú', 'él', 'nosotros', 'ellos'];
const PERSONS_FR = ['je', 'tu', 'il/elle', 'nous', 'ils/elles'];
const VERBS = [
  ['ser', 'parte del equipo', 'être'], ['estar', 'en el estadio', 'être (état, lieu)'], ['tener', 'una reunión', 'avoir'],
  ['hacer', 'fotos del partido', 'faire'], ['ir', 'a Bogotá', 'aller'], ['poder', 'salir temprano', 'pouvoir'],
  ['querer', 'viajar a Perú', 'vouloir'], ['decir', 'la verdad', 'dire'], ['saber', 'la respuesta', 'savoir'],
  ['ver', 'el partido', 'voir'], ['dar', 'una presentación', 'donner'], ['venir', 'a la oficina', 'venir'],
  ['llegar', 'tarde', 'arriver'], ['pasar', 'por el centro', 'passer'], ['deber', 'estudiar más', 'devoir'],
  ['poner', 'música', 'mettre'], ['salir', 'con amigos', 'sortir'], ['seguir', 'el plan', 'suivre / continuer'],
  ['llevar', 'la cámara', 'porter / emmener'], ['dejar', 'el carro en casa', 'laisser'], ['encontrar', 'un trabajo', 'trouver'],
  ['pensar', 'en el viaje', 'penser'], ['conocer', 'a gente nueva', 'connaître / rencontrer'], ['trabajar', 'en Metz', 'travailler'],
  ['hablar', 'con el cliente', 'parler'], ['vivir', 'en el centro', 'vivre'], ['necesitar', 'un descanso', 'avoir besoin'],
  ['buscar', 'un departamento', 'chercher'], ['empezar', 'el proyecto', 'commencer'], ['terminar', 'el informe', 'finir']
];

const ENDINGS = {
  ar: { presente: ['o', 'as', 'a', 'amos', 'an'], indefinido: ['é', 'aste', 'ó', 'amos', 'aron'], imperfecto: ['aba', 'abas', 'aba', 'ábamos', 'aban'], subjuntivo: ['e', 'es', 'e', 'emos', 'en'] },
  er: { presente: ['o', 'es', 'e', 'emos', 'en'], indefinido: ['í', 'iste', 'ió', 'imos', 'ieron'], imperfecto: ['ía', 'ías', 'ía', 'íamos', 'ían'], subjuntivo: ['a', 'as', 'a', 'amos', 'an'] },
  ir: { presente: ['o', 'es', 'e', 'imos', 'en'], indefinido: ['í', 'iste', 'ió', 'imos', 'ieron'], imperfecto: ['ía', 'ías', 'ía', 'íamos', 'ían'], subjuntivo: ['a', 'as', 'a', 'amos', 'an'] }
};
const FUT = ['é', 'ás', 'á', 'emos', 'án'];
const COND = ['ía', 'ías', 'ía', 'íamos', 'ían'];
const IRR = {
  ser: { presente: 'soy,eres,es,somos,son', indefinido: 'fui,fuiste,fue,fuimos,fueron', imperfecto: 'era,eras,era,éramos,eran', subjuntivo: 'sea,seas,sea,seamos,sean' },
  estar: { presente: 'estoy,estás,está,estamos,están', indefinido: 'estuve,estuviste,estuvo,estuvimos,estuvieron', subjuntivo: 'esté,estés,esté,estemos,estén' },
  tener: { presente: 'tengo,tienes,tiene,tenemos,tienen', indefinido: 'tuve,tuviste,tuvo,tuvimos,tuvieron', fs: 'tendr', subjuntivo: 'tenga,tengas,tenga,tengamos,tengan' },
  hacer: { presente: 'hago,haces,hace,hacemos,hacen', indefinido: 'hice,hiciste,hizo,hicimos,hicieron', fs: 'har', subjuntivo: 'haga,hagas,haga,hagamos,hagan' },
  ir: { presente: 'voy,vas,va,vamos,van', indefinido: 'fui,fuiste,fue,fuimos,fueron', imperfecto: 'iba,ibas,iba,íbamos,iban', subjuntivo: 'vaya,vayas,vaya,vayamos,vayan' },
  poder: { presente: 'puedo,puedes,puede,podemos,pueden', indefinido: 'pude,pudiste,pudo,pudimos,pudieron', fs: 'podr', subjuntivo: 'pueda,puedas,pueda,podamos,puedan' },
  querer: { presente: 'quiero,quieres,quiere,queremos,quieren', indefinido: 'quise,quisiste,quiso,quisimos,quisieron', fs: 'querr', subjuntivo: 'quiera,quieras,quiera,queramos,quieran' },
  decir: { presente: 'digo,dices,dice,decimos,dicen', indefinido: 'dije,dijiste,dijo,dijimos,dijeron', fs: 'dir', subjuntivo: 'diga,digas,diga,digamos,digan' },
  saber: { presente: 'sé,sabes,sabe,sabemos,saben', indefinido: 'supe,supiste,supo,supimos,supieron', fs: 'sabr', subjuntivo: 'sepa,sepas,sepa,sepamos,sepan' },
  ver: { presente: 'veo,ves,ve,vemos,ven', indefinido: 'vi,viste,vio,vimos,vieron', imperfecto: 'veía,veías,veía,veíamos,veían', subjuntivo: 'vea,veas,vea,veamos,vean' },
  dar: { presente: 'doy,das,da,damos,dan', indefinido: 'di,diste,dio,dimos,dieron', subjuntivo: 'dé,des,dé,demos,den' },
  venir: { presente: 'vengo,vienes,viene,venimos,vienen', indefinido: 'vine,viniste,vino,vinimos,vinieron', fs: 'vendr', subjuntivo: 'venga,vengas,venga,vengamos,vengan' },
  llegar: { indefinido: 'llegué,llegaste,llegó,llegamos,llegaron', subjuntivo: 'llegue,llegues,llegue,lleguemos,lleguen' },
  poner: { presente: 'pongo,pones,pone,ponemos,ponen', indefinido: 'puse,pusiste,puso,pusimos,pusieron', fs: 'pondr', subjuntivo: 'ponga,pongas,ponga,pongamos,pongan' },
  salir: { presente: 'salgo,sales,sale,salimos,salen', fs: 'saldr', subjuntivo: 'salga,salgas,salga,salgamos,salgan' },
  seguir: { presente: 'sigo,sigues,sigue,seguimos,siguen', indefinido: 'seguí,seguiste,siguió,seguimos,siguieron', subjuntivo: 'siga,sigas,siga,sigamos,sigan' },
  encontrar: { presente: 'encuentro,encuentras,encuentra,encontramos,encuentran', subjuntivo: 'encuentre,encuentres,encuentre,encontremos,encuentren' },
  pensar: { presente: 'pienso,piensas,piensa,pensamos,piensan', subjuntivo: 'piense,pienses,piense,pensemos,piensen' },
  conocer: { presente: 'conozco,conoces,conoce,conocemos,conocen', subjuntivo: 'conozca,conozcas,conozca,conozcamos,conozcan' },
  buscar: { indefinido: 'busqué,buscaste,buscó,buscamos,buscaron', subjuntivo: 'busque,busques,busque,busquemos,busquen' },
  empezar: { presente: 'empiezo,empiezas,empieza,empezamos,empiezan', indefinido: 'empecé,empezaste,empezó,empezamos,empezaron', subjuntivo: 'empiece,empieces,empiece,empecemos,empiecen' }
};

function conj(inf, tense, p) {
  const irr = IRR[inf] || {};
  if (tense === 'proximo') return conj('ir', 'presente', p) + ' a ' + inf;
  if (tense === 'futuro') return (irr.fs || inf) + FUT[p];
  if (tense === 'condicional') return (irr.fs || inf) + COND[p];
  if (irr[tense]) return irr[tense].split(',')[p];
  const g = inf.slice(-2), stem = inf.slice(0, -2);
  return stem + ENDINGS[g][tense][p];
}

const TENSES = {
  presente:    { label: 'Presente', fr: 'Présent', frame: 'Hoy' },
  proximo:     { label: 'Ir a + inf.', fr: 'Futur proche', frame: 'Mañana' },
  indefinido:  { label: 'Indefinido', fr: 'Passé simple', frame: 'Ayer' },
  imperfecto:  { label: 'Imperfecto', fr: 'Imparfait', frame: 'Antes, siempre' },
  futuro:      { label: 'Futuro', fr: 'Futur', frame: 'El año que viene' },
  condicional: { label: 'Condicional', fr: 'Conditionnel', frame: 'En un mundo ideal,' },
  subjuntivo:  { label: 'Subjuntivo', fr: 'Subjonctif', frame: 'Es importante que' }
};

// ---------- Cartes de départ (phrases entières, FR → ES) ----------
const SEED_CARDS = `
Je vis à Metz, dans l'est de la France.|Vivo en Metz, en el este de Francia.|presentación
Je fais un MBA en alternance.|Estudio un MBA en alternancia.|presentación
Je travaille dans le commerce du sport.|Trabajo en el comercio deportivo.|presentación
Je suis photographe de sport pendant mon temps libre.|Soy fotógrafo deportivo en mi tiempo libre.|presentación
J'aimerais travailler en Amérique latine l'année prochaine.|Me gustaría trabajar en América Latina el próximo año.|presentación
Le marketing et la communication m'intéressent.|Me interesan el marketing y la comunicación.|presentación
Ce qui me plaît le plus, c'est de créer du contenu.|Lo que más me gusta es crear contenido.|presentación
Je parle français, anglais et un peu espagnol.|Hablo francés, inglés y un poco de español.|presentación
Je me lève à sept heures en semaine.|Me levanto a las siete entre semana.|día
Le matin, je prends un café avant de travailler.|En la mañana, tomo un café antes de trabajar.|día
Je finis de travailler vers six heures du soir.|Termino de trabajar hacia las seis de la tarde.|día
Le soir, j'écoute un podcast en espagnol.|En la noche, escucho un pódcast en español.|día
Aujourd'hui, j'ai beaucoup de travail.|Hoy tengo mucho trabajo.|día
Je suis fatigué mais content.|Estoy cansado pero contento.|día
Ma ville est petite mais très tranquille.|Mi ciudad es pequeña pero muy tranquila.|ciudad
Il y a une très belle cathédrale dans le centre.|Hay una catedral muy bonita en el centro.|ciudad
Je vais au travail en voiture.|Voy al trabajo en carro.|ciudad
Le stade est près de chez moi.|El estadio está cerca de mi casa.|ciudad
J'adore le foot depuis que je suis petit.|Me encanta el fútbol desde que era niño.|deporte
Je vais au stade presque tous les week-ends.|Voy al estadio casi todos los fines de semana.|deporte
Je prends des photos depuis le bord du terrain.|Tomo fotos desde el borde de la cancha.|deporte
J'aime beaucoup voyager seul.|Me gusta mucho viajar solo.|gustar
Les longues réunions ne me plaisent pas.|No me gustan las reuniones largas.|gustar
Découvrir d'autres cultures m'intéresse.|Me interesa conocer otras culturas.|gustar
Mon chef est très sympa.|Mi jefe es muy simpático.|ser/estar
Ce week-end, je vais photographier un match.|Este fin de semana voy a fotografiar un partido.|ir a
Je vais postuler à un VIA en mars.|Voy a postular a un VIA en marzo.|ir a
L'année dernière, je suis allé au Vietnam.|El año pasado fui a Vietnam.|pasado
J'y suis resté trois semaines.|Me quedé allí tres semanas.|pasado
Hier, j'ai travaillé jusqu'à huit heures du soir.|Ayer trabajé hasta las ocho de la noche.|pasado
Mon équipe a gagné deux à zéro.|Mi equipo ganó dos a cero.|pasado
J'ai photographié un match très important.|Fotografié un partido muy importante.|pasado
Quand j'étais petit, je jouais au foot tous les jours.|Cuando era niño, jugaba al fútbol todos los días.|imperfecto
Il faisait très chaud et il y avait beaucoup de monde.|Hacía mucho calor y había mucha gente.|imperfecto
Je voudrais réserver une excursion pour demain.|Quisiera reservar una excursión para mañana.|turismo
Le guide vous attend à l'hôtel à huit heures.|El guía los espera en el hotel a las ocho.|turismo
C'est la haute saison, il faut réserver tôt.|Es temporada alta, hay que reservar con anticipación.|turismo
Je vous envoie le devis aujourd'hui.|Le envío la cotización hoy.|turismo
L'itinéraire comprend trois jours à Cusco.|El itinerario incluye tres días en Cusco.|turismo
Je gère les réseaux sociaux d'une marque.|Manejo las redes sociales de una marca.|marketing
La campagne a eu une très bonne portée.|La campaña tuvo un muy buen alcance.|marketing
Je prépare le calendrier éditorial du mois.|Preparo el calendario editorial del mes.|marketing
J'analyse les statistiques chaque semaine.|Analizo las estadísticas cada semana.|marketing
Je pense que c'est une bonne idée.|Creo que es una buena idea.|opinión
Il me semble que le projet est trop long.|Me parece que el proyecto es demasiado largo.|opinión
Cependant, je ne suis pas d'accord.|Sin embargo, no estoy de acuerdo.|opinión
Dans trois ans, j'aimerais diriger une équipe.|En tres años, me gustaría dirigir un equipo.|opinión
Je suis disponible à partir de septembre.|Estoy disponible a partir de septiembre.|entrevista
Ma principale qualité, c'est l'organisation.|Mi principal fortaleza es la organización.|entrevista
Mon point faible, c'est que je suis trop perfectionniste.|Mi punto débil es que soy demasiado perfeccionista.|entrevista
Je pourrais apporter mon expérience en communication.|Podría aportar mi experiencia en comunicación.|entrevista
Quelles seraient mes responsabilités ?|¿Cuáles serían mis responsabilidades?|entrevista
Comment est composée l'équipe ?|¿Cómo está conformado el equipo?|entrevista
Je me permets de vous écrire au sujet de l'offre.|Me permito escribirle con respecto a la oferta.|correo
Je reste à votre disposition pour un entretien.|Quedo a su disposición para una entrevista.|correo
Je vous remercie de votre attention.|Le agradezco su atención.|correo
Vous trouverez mon CV en pièce jointe.|Adjunto mi currículum.|correo
Il est important que nous parlions demain.|Es importante que hablemos mañana.|subjuntivo
Je veux que le client soit content.|Quiero que el cliente esté contento.|subjuntivo
J'aimerais travailler pour l'Alliance française.|Me gustaría trabajar para la Alianza Francesa.|cooperación
L'ambassade organise un événement culturel.|La embajada organiza un evento cultural.|cooperación
`.trim().split('\n').map(l => { const [fr, es, tag] = l.split('|'); return { fr, es, tag }; });

// ---------- Candidatures ----------
const DELIVERABLES = [
  { id: 'd1', month: 'Décembre', what: 'Pitch de présentation (10 phrases, su par cœur)', session: 'Semaine 3' },
  { id: 'd2', month: 'Janvier', what: 'CV en espagnol (1 page)', session: 'Semaine 4' },
  { id: 'd3', month: 'Février', what: 'Lettre de motivation agence réceptive, puis variante VIA coopération', session: 'Semaines 2 et 4' },
  { id: 'd4', month: 'Mars', what: 'Simulation d\'entretien 1 (15 min, questions classiques)', session: 'Semaine 4' },
  { id: 'd5', month: 'Avril', what: 'Mail de candidature spontanée + 2 simulations (VIA, agence)', session: 'Semaines 2 et 4' },
  { id: 'd6', month: 'Mai', what: 'Candidatures réelles, préparation ciblée par entretien', session: 'Chaque semaine' }
];
const QUESTIONS = [
  'Cuéntame sobre ti.',
  '¿Por qué quieres trabajar en América Latina?',
  '¿Qué sabes de nuestro país / de nuestra agencia / de la embajada?',
  '¿Cuál es tu experiencia en marketing y comunicación?',
  'Háblame de un proyecto del que estés orgulloso.',
  '¿Cómo manejas la presión o un cliente difícil?',
  '¿Cuál es tu nivel de español y cómo lo estás mejorando?',
  '¿Qué aportarías al equipo?',
  '¿Cuáles son tus puntos débiles?',
  '¿Dónde te ves en tres años?',
  '¿Estás disponible a partir de qué fecha y por cuánto tiempo?',
  '¿Tienes alguna pregunta para nosotros?'
];
const AGENCIES = ['Gaston-Sacaze', 'Altanueva', 'Amahuaca', 'Partenaires Evaneos (par pays)'];
const CALENDAR = [
  { when: 'Dès maintenant', what: 'Compte Mon Volontariat International, alertes Amérique latine. Liste de 15 agences réceptives francophones.' },
  { when: 'Mars', what: 'Premières candidatures VIA si des offres correspondent. Délais d\'instruction : 2 mois minimum.' },
  { when: 'Avril', what: 'Mails de candidature spontanée aux agences, en espagnol, avec un lien vers ton portfolio.' },
  { when: 'Mai', what: 'Demande de PVT si la piste VIA n\'a pas abouti. Quotas Colombie, Chili et Mexique : dossier prêt à l\'avance.' }
];
const PRO_VOCAB = [
  ['Ton parcours', 'prácticas en alternancia, formación dual, MBA, comercio deportivo, organismo de formación, fotografía deportiva, acreditación, cliente, marca personal'],
  ['Marketing et contenu', 'redes sociales, contenido, campaña, publicidad, posicionamiento, comunidad, alcance, estadísticas, calendario editorial'],
  ['Tourisme et agence', 'agencia receptiva, operador turístico, itinerario, cotización, reserva, excursión, guía, temporada alta, atención al cliente'],
  ['Diplomatie et coopération', 'embajada, consulado, cooperación cultural, Alianza Francesa, difusión, evento, convenio, institución'],
  ['Entretien', 'puesto, misión, responsabilidades, disponibilidad, fortalezas, debilidades, experiencia previa, a largo plazo']
];

// ---------- Suivi ----------
const SKILLS = [
  'Je me présente et parle de mon parcours 2 minutes sans notes',
  'Je raconte un événement passé en alternant indefinido et imperfecto',
  'Je parle de mes projets et je donne mon avis avec des arguments',
  'Je comprends un podcast natif de 10 min sur un sujet connu',
  'Je tiens une conversation de 15 min avec un natif sans passer par le français',
  'J\'écris un mail pro de 150 mots relu une fois',
  'Je réponds aux 12 questions d\'entretien de façon fluide'
];
const EVAL_MONTHS = ['Déc.', 'Janv.', 'Fév.', 'Mars', 'Avril', 'Mai'];
const BALANCE_Q = [
  ['Días hechos sobre 6, y qué se saltó', 'Jours faits sur 6, et ce qui a sauté'],
  ['Tarjetas añadidas esta semana', 'Cartes ajoutées cette semaine'],
  ['El contenido que me gustó, y el que fue demasiado difícil', 'Le contenu qui t\'a plu, et celui qui était trop dur'],
  ['Tres palabras o expresiones que me faltaron', 'Trois mots ou tournures qui t\'ont manqué'],
  ['Una frase que logré decir y de la que estoy contento', 'Une phrase réussie dont tu es content'],
  ['Una dificultad o una pregunta', 'Une difficulté ou une question']
];
const MEETINGS = [
  { date: '2026-12-31', what: 'Bilan du mois 1, ajustement des contenus' },
  { date: '2027-02-28', what: 'Bilan de mi-parcours, décision sur le tuteur en ligne' },
  { date: '2027-05-31', what: 'Bilan final, simulation de 20 min, décision SIELE' }
];
const CONTENT = [
  ['Foot', 'ESPN en español, TUDN, TyC Sports · Liga MX, Libertadores en fond sonore · Comptes Boca, River, América, Atlético Nacional'],
  ['Voyage', 'Luisito Comunica, Alan por el mundo (déc. → fév.) · vlogs de backpackers en Amérique du Sud'],
  ['Podcasts', 'Duolingo Spanish Podcast (déc.-janv.) · Hoy Hablamos, Españolistos (janv.-mars, transcriptions) · 100 % natifs dès avril'],
  ['Séries', 'Club de Cuervos · La Casa de las Flores · Pedro Páramo — sous-titres FR en déc., ES de janv. à mars, aucun dès avril'],
  ['Compréhension', 'Dreaming Spanish : « intermediate » dès décembre, « advanced » dès mars'],
  ['Photo', 'YouTube : « fotografía deportiva », « edición Lightroom », « cámara mirrorless »']
];
