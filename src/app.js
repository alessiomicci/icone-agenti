/* ---------- pagina: pacchetto favicon ---------- */
const GEN = { robot: agentAvatar, creature: creatureAvatar };
const $ = id => document.getElementById(id);
const state = { style: 'robot', variant: 0, shape: 'square' };
let pack = null, downloads = null, urls = [], buildId = 0;

const agentName = () => $('name').value.trim() || 'Agente';
const appName = () => $('appname').value.trim() || agentName();
const basePath = () => { let p = $('path').value.trim() || '/'; if (!p.endsWith('/')) p += '/'; return p; };
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agente';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const svgOf = shape => GEN[state.style](agentName(), { shape, variant: state.variant }).svg;
const bgOf = svg => (svg.match(/<rect width="120" height="120" fill="(#[0-9A-Fa-f]{6})"/) || [, '#FFFFFF'])[1];

async function rasterize(svg, size) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg width="${size}" height="${size}" `));
  await img.decode();
  const c = document.createElement('canvas');
  c.width = c.height = size;
  c.getContext('2d').drawImage(img, 0, 0, size, size);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('PNG non generato')), 'image/png'));
}

async function buildIco(svg, sizes) {
  const pngs = await Promise.all(sizes.map(s => rasterize(svg, s).then(b => b.arrayBuffer())));
  const head = 6 + 16 * sizes.length;
  const buf = new ArrayBuffer(head + pngs.reduce((a, p) => a + p.byteLength, 0));
  const dv = new DataView(buf);
  dv.setUint16(0, 0, true); dv.setUint16(2, 1, true); dv.setUint16(4, sizes.length, true);
  let off = head;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i, len = pngs[i].byteLength;
    dv.setUint8(e, s >= 256 ? 0 : s); dv.setUint8(e + 1, s >= 256 ? 0 : s);
    dv.setUint16(e + 4, 1, true); dv.setUint16(e + 6, 32, true);
    dv.setUint32(e + 8, len, true); dv.setUint32(e + 12, off, true);
    new Uint8Array(buf, off, len).set(new Uint8Array(pngs[i]));
    off += len;
  });
  return new Blob([buf], { type: 'image/x-icon' });
}

function manifest(color) {
  const p = basePath();
  return JSON.stringify({
    name: appName(),
    short_name: appName(),
    icons: [
      { src: p + 'web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: p + 'web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    theme_color: color,
    background_color: color,
    display: 'standalone',
  }, null, 2);
}

function snippet() {
  const p = basePath();
  return [
    `<link rel="icon" type="image/png" href="${p}favicon-96x96.png" sizes="96x96" />`,
    `<link rel="icon" type="image/svg+xml" href="${p}favicon.svg" />`,
    `<link rel="shortcut icon" href="${p}favicon.ico" />`,
    `<link rel="apple-touch-icon" sizes="180x180" href="${p}apple-touch-icon.png" />`,
    `<meta name="apple-mobile-web-app-title" content="${esc(appName())}" />`,
    `<link rel="manifest" href="${p}site.webmanifest" />`,
  ].join('\n');
}

async function build() {
  const id = ++buildId;
  const fav = svgOf(state.shape);
  const full = svgOf('full');
  const color = bgOf(full);
  $('preview').innerHTML = fav;
  $('variant').textContent = 'var. ' + state.variant;
  document.querySelectorAll('[data-appname]').forEach(el => el.textContent = appName());
  $('snippet').textContent = snippet();

  try {
    const [ico, png96, png32, apple, a192, a512] = await Promise.all([
      buildIco(fav, [16, 32, 48]), rasterize(fav, 96), rasterize(fav, 32),
      rasterize(full, 180), rasterize(full, 192), rasterize(full, 512),
    ]);
    if (id !== buildId) return;
    const files = [
      { name: 'favicon.ico', use: 'Browser meno recenti e Windows', dim: '16 · 32 · 48', blob: ico },
      { name: 'favicon.svg', use: 'Browser moderni, nitida a ogni dimensione', dim: 'vettoriale', blob: new Blob([fav], { type: 'image/svg+xml' }) },
      { name: 'favicon-96x96.png', use: 'Browser e risultati di Google', dim: '96 × 96', blob: png96 },
      { name: 'apple-touch-icon.png', use: 'Schermata Home di iPhone e iPad', dim: '180 × 180', blob: apple },
      { name: 'web-app-manifest-192x192.png', use: 'Android, app installata', dim: '192 × 192', blob: a192 },
      { name: 'web-app-manifest-512x512.png', use: 'Android, avvio e installazione', dim: '512 × 512', blob: a512 },
      { name: 'site.webmanifest', tag: 'JSON', use: 'Nome, colori e icone della web app', dim: 'JSON', blob: new Blob([manifest(color)], { type: 'application/manifest+json' }) },
    ];
    urls.forEach(u => URL.revokeObjectURL(u));
    urls = [];
    const url = b => { const u = URL.createObjectURL(b); urls.push(u); return u; };
    files.forEach(f => { if (/\.(png|svg)$/.test(f.name)) f.url = url(f.blob); });
    const tab = url(png32);
    $('m-tab').src = tab;
    $('m-google').src = files[2].url;
    $('m-ios').src = files[3].url;
    $('m-android').src = files[4].url;
    $('m-android2').src = files[4].url;
    pack = files;
    renderFiles();
  } catch (e) {
    $('status').textContent = 'Non sono riuscito a generare le immagini in questo browser: ' + e.message;
  }
}

function renderFiles() {
  const canSave = !!downloads;
  $('files').innerHTML = pack.map((f, i) => `<tr>
    <td class="th">${f.url ? `<img src="${f.url}" alt="">` : `<span class="ext">${f.tag || f.name.split('.').pop().toUpperCase()}</span>`}</td>
    <td class="file">${f.name}</td>
    <td class="use">${f.use}</td>
    <td class="dim">${f.dim}</td>
    <td class="act">${canSave && /\.(png|svg)$/.test(f.name) ? `<button type="button" data-file="${i}">Scarica</button>` : ''}</td>
  </tr>`).join('');
  $('zip').disabled = !canSave;
}

async function save(filename, data) {
  try {
    await downloads.save({ filename, data });
    $('status').textContent = `${filename} salvato.`;
  } catch (e) {
    const msg = { declined: 'Download annullato.', rate_limited: 'C\'è già una richiesta di download aperta: riprova tra poco.' }[e && e.code];
    $('status').textContent = msg || 'Il download non è disponibile in questa vista.';
  }
}

$('files').addEventListener('click', e => {
  const b = e.target.closest('[data-file]'); if (!b || !pack) return;
  const f = pack[+b.dataset.file];
  save(f.name, f.blob);
});
$('zip').addEventListener('click', async () => {
  if (!pack || !downloads) return;
  if (!window.JSZip) { $('status').textContent = 'La libreria per lo zip non si è caricata: ricarica la pagina.'; return; }
  const zip = new JSZip();
  pack.forEach(f => zip.file(f.name, f.blob));
  zip.file('LEGGIMI.txt', 'Carica questi file in ' + basePath() + ' del sito e incolla nel <head>:\n\n' + snippet() + '\n');
  const blob = await zip.generateAsync({ type: 'blob' });
  save(`favicon-${slug(agentName())}.zip`, blob);
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(snippet()); $('copied').textContent = 'Codice copiato'; }
  catch { $('copied').textContent = 'Il browser non ha consentito la copia'; }
  setTimeout(() => $('copied').textContent = '', 2000);
});

let t;
const later = () => { clearTimeout(t); t = setTimeout(build, 120); };
$('name').addEventListener('input', () => { state.variant = 0; later(); });
['appname', 'path'].forEach(id => $(id).addEventListener('input', later));
$('prev').addEventListener('click', () => { state.variant = Math.max(0, state.variant - 1); build(); });
$('next').addEventListener('click', () => { state.variant++; build(); });
function group(attr, key) {
  document.querySelectorAll(`[data-${attr}]`).forEach(b => b.addEventListener('click', () => {
    state[key] = b.dataset[attr];
    document.querySelectorAll(`[data-${attr}]`).forEach(x => x.setAttribute('aria-pressed', x === b));
    build();
  }));
}
group('style', 'style');
group('shape', 'shape');

build();
if (window.claude && window.claude.use) {
  window.claude.use('downloads').then(d => { downloads = d; if (pack) renderFiles(); if (!d) $('status').textContent = 'Il download non è disponibile in questa vista: apri la pagina su claude.ai.'; });
} else {
  $('status').textContent = 'Il download non è disponibile in questa vista: apri la pagina su claude.ai.';
}
</script>
</body>
</html>
