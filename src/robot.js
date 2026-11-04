/* ---------- agentAvatar(name, { shape, variant }) -> { svg, traits } ---------- */
const INK = '#1B1B24';
const PALETTE = ['#3D6BF5','#F25C3B','#8B5CF6','#F5A623','#E0337A','#2BB673','#14B8A6','#1F8FBF','#4B4FCF','#D9572B','#7A9A2E','#C0399B'];
const HEADS = ['#FFFFFF','#F4F1EA','#E9EEF6','#FFF3D6'];

function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SHAPES = {
  box:     { label: 'Scatola',  top: 38, L: 28, R: 92, eye: 60, mouth: 78, d: f => `<rect x="28" y="38" width="64" height="54" rx="14" ${f}/>` },
  round:   { label: 'Tondo',    top: 34, L: 29, R: 91, eye: 61, mouth: 79, d: f => `<circle cx="60" cy="65" r="31" ${f}/>` },
  capsule: { label: 'Capsula',  top: 42, L: 22, R: 98, eye: 62, mouth: 77, d: f => `<rect x="22" y="42" width="76" height="48" rx="24" ${f}/>` },
  monitor: { label: 'Monitor',  top: 38, L: 26, R: 94, eye: 59, mouth: 74, screen: true, d: f => `<rect x="26" y="38" width="68" height="54" rx="9" ${f}/><rect x="33" y="45" width="54" height="40" rx="6" fill="${INK}"/>` },
  dome:    { label: 'Cupola',   top: 36, L: 28, R: 92, eye: 64, mouth: 80, d: f => `<path d="M28 68 A32 32 0 0 1 92 68 V84 Q92 92 84 92 H36 Q28 92 28 84 Z" ${f}/>` },
  octo:    { label: 'Ottagono', top: 38, L: 28, R: 92, eye: 61, mouth: 78, d: f => `<path d="M44 38 H76 L92 54 V76 L76 92 H44 L28 76 V54 Z" ${f}/>` },
};

const EYES = {
  dots:    { label: 'Punti',       d: (y, dx, c) => [60 - dx, 60 + dx].map(x => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c.fg}"/>`).join('') },
  ring:    { label: 'Pupille',     d: (y, dx, c) => [60 - dx, 60 + dx].map(x => `<circle cx="${x}" cy="${y}" r="7.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="${x + c.lx}" cy="${y + c.ly}" r="3.2" fill="${INK}"/>`).join('') },
  happy:   { label: 'Felici',      d: (y, dx, c) => [60 - dx, 60 + dx].map(x => `<path d="M${x - 5} ${y + 2} Q${x} ${y - 6} ${x + 5} ${y + 2}" fill="none" stroke="${c.fg}" stroke-width="3" stroke-linecap="round"/>`).join('') },
  pixel:   { label: 'Pixel',       d: (y, dx, c) => [60 - dx, 60 + dx].map(x => `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" rx="1.5" fill="${c.fg}"/>`).join('') },
  focus:   { label: 'Concentrati', d: (y, dx, c) => [60 - dx, 60 + dx].map(x => `<rect x="${x - 6}" y="${y - 1.5}" width="12" height="3.5" rx="1.75" fill="${c.fg}"/>`).join('') },
  wink:    { label: 'Occhiolino',  d: (y, dx, c) => `<circle cx="${60 - dx}" cy="${y}" r="4.5" fill="${c.fg}"/><path d="M${60 + dx - 5} ${y + 2} Q${60 + dx} ${y - 6} ${60 + dx + 5} ${y + 2}" fill="none" stroke="${c.fg}" stroke-width="3" stroke-linecap="round"/>` },
  visor:   { label: 'Visore',  noScreen: true, d: (y, dx, c) => `<rect x="34" y="${y - 7}" width="52" height="14" rx="7" fill="${INK}"/>` + [60 - dx, 60 + dx].map(x => `<rect x="${x - 5}" y="${y - 2}" width="10" height="4" rx="2" fill="${c.accent}"/>`).join('') },
  cyclops: { label: 'Ciclope', noScreen: true, d: (y, dx, c) => `<circle cx="60" cy="${y}" r="11" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="${60 + c.lx}" cy="${y + c.ly}" r="6" fill="${c.accent}"/><circle cx="${60 + c.lx}" cy="${y + c.ly}" r="2.8" fill="${INK}"/><circle cx="${58 + c.lx}" cy="${y - 2 + c.ly}" r="1.3" fill="#fff"/>` },
};

const MOUTHS = {
  smile:  { label: 'Sorriso', d: (y, c) => `<path d="M52 ${y} Q60 ${y + 7} 68 ${y}" fill="none" stroke="${c.fg}" stroke-width="3" stroke-linecap="round"/>` },
  grille: { label: 'Griglia', d: (y, c) => `<rect x="48" y="${y - 4}" width="24" height="9" rx="3" fill="${c.screen ? 'none' : '#fff'}" stroke="${c.fg}" stroke-width="2.5"/>` + [54, 60, 66].map(x => `<line x1="${x}" y1="${y - 3}" x2="${x}" y2="${y + 4}" stroke="${c.fg}" stroke-width="2"/>`).join('') },
  wave:   { label: 'Onda',    d: (y, c) => `<path d="M46 ${y} q3.5 -5 7 0 t7 0 t7 0 t7 0" fill="none" stroke="${c.fg}" stroke-width="2.5" stroke-linecap="round"/>` },
  o:      { label: 'O',       d: (y, c) => `<circle cx="60" cy="${y + 1}" r="3.5" fill="${c.fg}"/>` },
  flat:   { label: 'Piatta',  d: (y, c) => `<line x1="53" y1="${y + 1}" x2="67" y2="${y + 1}" stroke="${c.fg}" stroke-width="3" stroke-linecap="round"/>` },
  teeth:  { label: 'Denti',   d: (y, c) => `<rect x="50" y="${y - 3}" width="20" height="8" rx="2.5" fill="#fff" stroke="${INK}" stroke-width="2.5"/><line x1="51" y1="${y + 1}" x2="69" y2="${y + 1}" stroke="${INK}" stroke-width="1.8"/><line x1="60" y1="${y - 3}" x2="60" y2="${y + 5}" stroke="${INK}" stroke-width="1.8"/>` },
};

const ANTENNAS = {
  none:   { label: 'Nessuna', d: () => '' },
  ball:   { label: 'Sfera',   d: (t, c) => `<line x1="60" y1="${t + 2}" x2="60" y2="${t - 12}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="${t - 16}" r="5" fill="${c.accent}" stroke="${INK}" stroke-width="2.5"/>` },
  double: { label: 'Doppia',  d: (t, c) => `<path d="M50 ${t + 2} L44 ${t - 11} M70 ${t + 2} L76 ${t - 11}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="43" cy="${t - 13}" r="3.6" fill="${c.accent}" stroke="${INK}" stroke-width="2.2"/><circle cx="77" cy="${t - 13}" r="3.6" fill="${c.accent}" stroke="${INK}" stroke-width="2.2"/>` },
  bolt:   { label: 'Fulmine', d: (t, c) => `<path d="M64 ${t - 22} L51 ${t - 7} H59 L55 ${t + 3} L69 ${t - 12} H61 Z" fill="${c.accent}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` },
  halo:   { label: 'Aureola', d: (t, c) => `<ellipse cx="60" cy="${t - 9}" rx="17" ry="5" fill="none" stroke="${INK}" stroke-width="7"/><ellipse cx="60" cy="${t - 9}" rx="17" ry="5" fill="none" stroke="${c.accent}" stroke-width="3"/>` },
  spark:  { label: 'Scintilla', d: (t, c) => `<path d="M60 ${t - 25} Q62 ${t - 17} 70 ${t - 15} Q62 ${t - 13} 60 ${t - 5} Q58 ${t - 13} 50 ${t - 15} Q58 ${t - 17} 60 ${t - 25} Z" fill="${c.accent}" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>` },
};

const EARS = {
  none:   { label: 'Nessuna' },
  plates: { label: 'Placche',  back: (s, y, c) => `<rect x="${s.L - 7}" y="${y - 9}" width="11" height="18" rx="3" fill="${c.accent}" stroke="${INK}" stroke-width="2.5"/><rect x="${s.R - 4}" y="${y - 9}" width="11" height="18" rx="3" fill="${c.accent}" stroke="${INK}" stroke-width="2.5"/>` },
  knobs:  { label: 'Manopole', back: (s, y, c) => `<circle cx="${s.L - 1}" cy="${y}" r="6" fill="${c.accent}" stroke="${INK}" stroke-width="2.5"/><circle cx="${s.R + 1}" cy="${y}" r="6" fill="${c.accent}" stroke="${INK}" stroke-width="2.5"/>` },
  phones: { label: 'Cuffie', noAntenna: true,
    back: (s, y) => { const r = (s.R - s.L) / 2 + 3; return `<path d="M${s.L - 3} ${y} V${y - 8} A${r} ${r} 0 0 1 ${s.R + 3} ${y - 8} V${y}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`; },
    front: (s, y, c) => `<rect x="${s.L - 9}" y="${y - 10}" width="12" height="22" rx="5" fill="${c.accent}" stroke="${INK}" stroke-width="2.5"/><rect x="${s.R - 3}" y="${y - 10}" width="12" height="22" rx="5" fill="${c.accent}" stroke="${INK}" stroke-width="2.5"/>` },
};

const EXTRAS = {
  none:   { label: 'Nessuno', d: () => '' },
  cheeks: { label: 'Guance', noScreen: true, d: (s, c) => `<circle cx="40" cy="${s.mouth - 3}" r="4" fill="${c.accent}" opacity=".55"/><circle cx="80" cy="${s.mouth - 3}" r="4" fill="${c.accent}" opacity=".55"/>` },
  led:    { label: 'LED', noScreen: true, d: (s, c) => `<circle cx="60" cy="${s.top + 9}" r="3" fill="${c.accent}" stroke="${INK}" stroke-width="2"/>` },
  screws: { label: 'Viti', only: ['box', 'monitor'], d: (s) => `<circle cx="${s.L + 8}" cy="${s.top + 8}" r="1.8" fill="${INK}"/><circle cx="${s.R - 8}" cy="${s.top + 8}" r="1.8" fill="${INK}"/><circle cx="${s.L + 8}" cy="${s.top + 46}" r="1.8" fill="${INK}"/><circle cx="${s.R - 8}" cy="${s.top + 46}" r="1.8" fill="${INK}"/>` },
};

function agentAvatar(name, { shape = 'square', variant = 0 } = {}) {
  const key = String(name).trim().toLowerCase() + (variant ? '#' + variant : '');
  const seed = cyrb53(key);
  const rnd = mulberry32(seed);
  const pick = (obj, ok = () => true) => { const ks = Object.keys(obj).filter(k => ok(obj[k], k)); return ks[Math.floor(rnd() * ks.length)]; };

  const bgI = Math.floor(rnd() * PALETTE.length);
  const bg = PALETTE[bgI];
  const accent = PALETTE[(bgI + 3 + Math.floor(rnd() * (PALETTE.length - 6))) % PALETTE.length];
  const head = HEADS[Math.floor(rnd() * HEADS.length)];

  const shapeK = pick(SHAPES);
  const S = SHAPES[shapeK];
  const screen = !!S.screen;
  const eyesK = pick(EYES, e => !(screen && e.noScreen));
  const mouthK = pick(MOUTHS, (m, k) => !(screen && k === 'teeth'));
  const earsK = pick(EARS);
  const antK = EARS[earsK].noAntenna ? 'none' : pick(ANTENNAS);
  const extraK = pick(EXTRAS, e => !(screen && e.noScreen) && (!e.only || e.only.includes(shapeK)));
  const body = rnd() < 0.5;
  const dx = rnd() < 0.5 ? 12 : 14;
  const lx = [-2, 0, 2][Math.floor(rnd() * 3)], ly = [-1, 0, 1][Math.floor(rnd() * 3)];

  const c = { fg: screen ? bg : INK, accent, screen, lx, ly };
  const f = `fill="${head}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;
  const id = 'aa' + seed.toString(36) + shape[0];
  const earY = S.eye + 3;
  const tile = shape === 'circle' ? `<circle cx="60" cy="60" r="60"/>` : shape === 'full' ? `<rect width="120" height="120"/>` : `<rect width="120" height="120" rx="28"/>`;

  const parts = [
    body ? `<rect x="51" y="86" width="18" height="16" fill="${head}" stroke="${INK}" stroke-width="3"/><path d="M22 126 V113 Q22 101 36 101 H84 Q98 101 98 113 V126 Z" ${f}/><circle cx="60" cy="113" r="3.5" fill="${accent}" stroke="${INK}" stroke-width="2"/>` : '',
    ANTENNAS[antK].d(S.top, c),
    EARS[earsK].back ? EARS[earsK].back(S, earY, c) : '',
    S.d(f),
    EARS[earsK].front ? EARS[earsK].front(S, earY, c) : '',
    EXTRAS[extraK].d(S, c),
    EYES[eyesK].d(S.eye, dx, c),
    MOUTHS[mouthK].d(S.mouth, c),
  ].join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Avatar di ${String(name).replace(/[<&"]/g, '')}"><defs><clipPath id="${id}">${tile}</clipPath></defs><g clip-path="url(#${id})"><rect width="120" height="120" fill="${bg}"/>${parts}</g></svg>`;

  return {
    svg,
    traits: {
      Testa: S.label, Occhi: EYES[eyesK].label, Bocca: MOUTHS[mouthK].label,
      Antenna: ANTENNAS[antK].label, Orecchie: EARS[earsK].label, Dettaglio: EXTRAS[extraK].label,
      Corpo: body ? 'Busto' : 'Solo testa', Colore: bg,
    },
  };
}

