/* ---------- creatureAvatar(name, { shape, variant }) -> { svg, traits } ---------- */
function mix(a, b, t) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const f1 = n => +n.toFixed(1);

function blobPath(cx, cy, rx, ry, jitter, egg, rnd) {
  const N = 8, pts = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2 - Math.PI / 2;
    const j = 1 + (rnd() * 2 - 1) * jitter;
    const ex = egg ? 0.8 + 0.2 * (Math.sin(a) + 1) / 2 : 1;
    pts.push([cx + Math.cos(a) * rx * j * ex, cy + Math.sin(a) * ry * j]);
  }
  const P = i => pts[(i + N) % N];
  let d = `M${f1(P(0)[0])} ${f1(P(0)[1])}`;
  for (let i = 0; i < N; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + ' Z';
}

const C_BODIES = {
  blob:  { label: 'Blob',     rx: 31, ry: 30, j: 0.09 },
  bean:  { label: 'Fagiolo',  rx: 36, ry: 26, j: 0.06 },
  tall:  { label: 'Allungato', rx: 26, ry: 33, j: 0.06 },
  egg:   { label: 'Uovo',     rx: 31, ry: 32, j: 0.05, egg: true },
  ghost: { label: 'Fantasmino', ghost: true },
};

const C_EARS = {
  none:   { label: 'Nessuna', d: () => '' },
  cat:    { label: 'Gatto', d: (b, c) => { const t = b.top; const one = `<path d="M43 ${t + 14} L38 ${t - 12} L58 ${t + 4} Z" fill="${c.body}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M44 ${t + 6} L41 ${t - 5} L51 ${t + 2} Z" fill="${c.light}"/>`; return one + `<g transform="translate(120 0) scale(-1 1)">${one}</g>`; } },
  bunny:  { label: 'Coniglio', d: (b, c) => { const t = b.top; const one = `<g transform="rotate(-14 49 ${t - 8})"><ellipse cx="49" cy="${t - 8}" rx="7" ry="17" fill="${c.body}" stroke="${INK}" stroke-width="3"/><ellipse cx="49" cy="${t - 7}" rx="3.2" ry="11" fill="${c.light}"/></g>`; return one + `<g transform="translate(120 0) scale(-1 1)">${one}</g>`; } },
  bear:   { label: 'Orso', d: (b, c) => { const t = b.top; return [41, 79].map(x => `<circle cx="${x}" cy="${t + 7}" r="9" fill="${c.body}" stroke="${INK}" stroke-width="3"/><circle cx="${x}" cy="${t + 7}" r="4.2" fill="${c.light}"/>`).join(''); } },
  horns:  { label: 'Corna', d: (b, c) => { const t = b.top; const one = `<path d="M43 ${t + 10} Q33 ${t - 2} 38 ${t - 17} Q45 ${t - 4} 54 ${t + 4} Z" fill="#F4EBD0" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`; return one + `<g transform="translate(120 0) scale(-1 1)">${one}</g>`; } },
  bug:    { label: 'Antenne', d: (b, c) => { const t = b.top; return `<path d="M52 ${t + 4} Q48 ${t - 8} 42 ${t - 14} M68 ${t + 4} Q72 ${t - 8} 78 ${t - 14}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="41" cy="${t - 15}" r="4" fill="${c.accent}" stroke="${INK}" stroke-width="2.3"/><circle cx="79" cy="${t - 15}" r="4" fill="${c.accent}" stroke="${INK}" stroke-width="2.3"/>`; } },
  sprout: { label: 'Germoglio', d: (b) => { const t = b.top; return `<path d="M60 ${t + 3} V${t - 10}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M60 ${t - 9} Q50 ${t - 22} 45 ${t - 12} Q52 ${t - 6} 60 ${t - 9} Z M60 ${t - 9} Q70 ${t - 22} 75 ${t - 12} Q68 ${t - 6} 60 ${t - 9} Z" fill="#45B36B" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`; } },
  tuft:   { label: 'Ciuffo', front: true, d: (b) => { const t = b.top; return `<path d="M54 ${t + 3} Q52 ${t - 8} 57 ${t - 10} M60 ${t + 2} Q60 ${t - 10} 66 ${t - 12} M66 ${t + 3} Q70 ${t - 5} 74 ${t - 5}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`; } },
};

const C_EYES = {
  googly: { label: 'Tondi', d: (x, y, s, c) => `<circle cx="${x}" cy="${y}" r="${7 * s}" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="${x + c.lx * s}" cy="${y + c.ly * s}" r="${3.4 * s}" fill="${INK}"/>` },
  dot:    { label: 'Puntini', d: (x, y, s) => `<circle cx="${x}" cy="${y}" r="${4 * s}" fill="${INK}"/>` },
  anime:  { label: 'Lucidi', d: (x, y, s) => `<ellipse cx="${x}" cy="${y}" rx="${4.8 * s}" ry="${6.2 * s}" fill="${INK}"/><circle cx="${x - 1.5 * s}" cy="${y - 2.5 * s}" r="${1.9 * s}" fill="#fff"/>` },
  sleepy: { label: 'Assonnati', d: (x, y, s) => `<path d="M${x - 5 * s} ${y} Q${x} ${y + 5 * s} ${x + 5 * s} ${y}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` },
};

const C_MOUTHS = {
  smile:  { label: 'Sorriso', d: (y) => `<path d="M52 ${y} Q60 ${y + 7} 68 ${y}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` },
  open:   { label: 'Aperta', d: (y) => `<path d="M50 ${y - 1} Q60 ${y + 13} 70 ${y - 1} Z" fill="${INK}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="60" cy="${y + 5}" rx="4.5" ry="2.6" fill="#FF7A9A"/>` },
  fang:   { label: 'Dentino', d: (y) => `<path d="M52 ${y} Q60 ${y + 7} 68 ${y}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M55 ${y + 3} L57.5 ${y + 8.5} L60 ${y + 4.4} Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` },
  grin:   { label: 'Ghigno', d: (y) => `<path d="M48 ${y - 1} Q60 ${y + 12} 72 ${y - 1} Z" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M54 ${y} V${y + 5} M60 ${y} V${y + 6} M66 ${y} V${y + 5}" stroke="${INK}" stroke-width="1.8"/>` },
  cat:    { label: 'Gattina', d: (y) => `<path d="M51 ${y} q4.5 5 9 0 q4.5 5 9 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` },
  o:      { label: 'O', d: (y) => `<ellipse cx="60" cy="${y + 2}" rx="3.5" ry="4.5" fill="${INK}"/>` },
};

const C_PATTERNS = {
  none:     { label: 'Nessuno', d: () => '' },
  belly:    { label: 'Pancia', d: (b, c) => `<ellipse cx="60" cy="${b.bottom - 4}" rx="${b.rx * 0.62}" ry="${b.ry * 0.5}" fill="${c.light}"/>` },
  spots:    { label: 'Macchie', d: (b, c, r) => Array.from({ length: 4 }, (_, i) => { const a = i * 1.7 + r() * 0.8; return `<circle cx="${f1(60 + Math.cos(a) * b.rx * 0.78)}" cy="${f1(b.cy + Math.sin(a) * b.ry * 0.78)}" r="${f1(3 + r() * 3.5)}" fill="${c.dark}"/>`; }).join('') },
  stripes:  { label: 'Strisce', d: (b, c) => [48, 60, 72].map(x => `<rect x="${x - 3}" y="${b.top - 4}" width="6" height="${x === 60 ? 15 : 11}" rx="3" fill="${c.dark}"/>`).join('') },
  freckles: { label: 'Lentiggini', d: (b) => [[38, 0], [42, 3], [35, 4], [82, 0], [78, 3], [85, 4]].map(([x, d]) => `<circle cx="${x}" cy="${b.mouthY - 4 + d}" r="1.3" fill="${INK}" opacity=".55"/>`).join('') },
};

const C_LIMBS = {
  none:  { label: 'Nessuno' },
  feet:  { label: 'Piedini', front: (b, c) => [48, 72].map(x => `<ellipse cx="${x}" cy="${b.bottom - 1}" rx="7.5" ry="4.5" fill="${c.dark}" stroke="${INK}" stroke-width="2.5"/>`).join('') },
  arms:  { label: 'Braccini', back: (b, c) => `<ellipse cx="${b.L + 1}" cy="${b.cy + 8}" rx="5" ry="10" transform="rotate(28 ${b.L + 1} ${b.cy + 8})" fill="${c.body}" stroke="${INK}" stroke-width="2.6"/><ellipse cx="${b.R - 1}" cy="${b.cy + 8}" rx="5" ry="10" transform="rotate(-28 ${b.R - 1} ${b.cy + 8})" fill="${c.body}" stroke="${INK}" stroke-width="2.6"/>` },
  wave:  { label: 'Saluta', back: (b, c) => `<ellipse cx="${b.L + 1}" cy="${b.cy + 8}" rx="5" ry="10" transform="rotate(28 ${b.L + 1} ${b.cy + 8})" fill="${c.body}" stroke="${INK}" stroke-width="2.6"/><ellipse cx="${b.R + 2}" cy="${b.cy - 8}" rx="5" ry="10" transform="rotate(35 ${b.R + 2} ${b.cy - 8})" fill="${c.body}" stroke="${INK}" stroke-width="2.6"/>` },
};

function creatureAvatar(name, { shape = 'square', variant = 0 } = {}) {
  const key = String(name).trim().toLowerCase() + (variant ? '#' + variant : '');
  const seed = cyrb53(key, 7);
  const rnd = mulberry32(seed);
  const pick = (obj, ok = () => true) => { const ks = Object.keys(obj).filter(k => ok(obj[k], k)); return ks[Math.floor(rnd() * ks.length)]; };

  const bodyI = Math.floor(rnd() * PALETTE.length);
  const body = PALETTE[bodyI];
  const bgBase = PALETTE[(bodyI + 4 + Math.floor(rnd() * 4)) % PALETTE.length];
  const accent = PALETTE[(bodyI + 2 + Math.floor(rnd() * 3)) % PALETTE.length];
  const c = { body, accent, light: mix(body, '#FFFFFF', 0.55), dark: mix(body, INK, 0.28), lx: [-2, 0, 2][Math.floor(rnd() * 3)], ly: [-1, 0, 1][Math.floor(rnd() * 3)] };
  const bg = mix(bgBase, '#FFFFFF', 0.7);

  const bodyK = pick(C_BODIES);
  const B = C_BODIES[bodyK];
  let b, d;
  if (B.ghost) {
    d = 'M28 70 A32 32 0 0 1 92 70 V100 q-5.33 -7 -10.67 0 t-10.67 0 t-10.67 0 t-10.67 0 t-10.67 0 t-10.67 0 Z';
    b = { cy: 70, rx: 32, ry: 30, top: 38, bottom: 100, L: 28, R: 92, eyeY: 64, mouthY: 79 };
  } else {
    const cy = 68;
    d = blobPath(60, cy, B.rx, B.ry, B.j, B.egg, rnd);
    b = { cy, rx: B.rx, ry: B.ry, top: cy - B.ry, bottom: cy + B.ry, L: 60 - B.rx, R: 60 + B.rx, eyeY: Math.round(cy - B.ry * 0.18), mouthY: Math.round(cy + B.ry * 0.36) };
  }

  const earsK = pick(C_EARS);
  const r = rnd();
  const eyeCount = r < 0.6 ? 2 : r < 0.85 ? 1 : 3;
  const eyesK = pick(C_EYES, (e, k) => !(eyeCount === 1 && (k === 'dot' || k === 'sleepy')));
  const mouthK = pick(C_MOUTHS);
  const patK = pick(C_PATTERNS);
  const limbK = pick(C_LIMBS, (l, k) => !(B.ghost && k === 'feet'));
  const blush = rnd() < 0.5 && patK !== 'freckles';
  const dx = rnd() < 0.5 ? 11 : 13;

  const id = 'cr' + seed.toString(36) + shape[0];
  const tile = shape === 'circle' ? `<circle cx="60" cy="60" r="60"/>` : shape === 'full' ? `<rect width="120" height="120"/>` : `<rect width="120" height="120" rx="28"/>`;
  const eyePos = eyeCount === 1 ? [[60, b.eyeY, 1.6]] : eyeCount === 3 ? [[60 - 13, b.eyeY + 2, 0.8], [60 + 13, b.eyeY + 2, 0.8], [60, b.eyeY - 9, 0.8]] : [[60 - dx, b.eyeY, 1], [60 + dx, b.eyeY, 1]];
  const E = C_EARS[earsK], L = C_LIMBS[limbK];

  const parts = [
    E.front ? '' : E.d(b, c),
    L.back ? L.back(b, c) : '',
    `<path d="${d}" fill="${body}"/>`,
    `<g clip-path="url(#${id}b)">${C_PATTERNS[patK].d(b, c, rnd)}</g>`,
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
    E.front ? E.d(b, c) : '',
    blush ? `<ellipse cx="40" cy="${b.mouthY - 3}" rx="4.5" ry="3" fill="#FF7A9A" opacity=".6"/><ellipse cx="80" cy="${b.mouthY - 3}" rx="4.5" ry="3" fill="#FF7A9A" opacity=".6"/>` : '',
    eyePos.map(([x, y, s]) => C_EYES[eyesK].d(x, y, s, c)).join(''),
    C_MOUTHS[mouthK].d(b.mouthY),
    L.front ? L.front(b, c) : '',
  ].join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Avatar di ${String(name).replace(/[<&"]/g, '')}"><defs><clipPath id="${id}">${tile}</clipPath><clipPath id="${id}b"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})"><rect width="120" height="120" fill="${bg}"/>${parts}</g></svg>`;

  return {
    svg,
    traits: {
      Corpo: B.label, Occhi: `${eyeCount} × ${C_EYES[eyesK].label}`, Bocca: C_MOUTHS[mouthK].label,
      Testa: C_EARS[earsK].label, Motivo: C_PATTERNS[patK].label, Arti: C_LIMBS[limbK].label,
      Guance: blush ? 'Sì' : 'No', Colore: body,
    },
  };
}
