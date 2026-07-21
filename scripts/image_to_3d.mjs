// Image-to-3D harness: turn the Amber-Heart Golem CONCEPT ART into a real,
// riggable game GLB. Replaces the hand-built procedural model.
//
//   node scripts/image_to_3d.mjs --provider meshy --key <KEY> \
//        --image /tmp/sculpt-work/concepts/golem.png \
//        [--out public/models/emberwood/creatures/amber_heart_golem.glb]
//
// Supports: meshy (api.meshy.ai v2), tripo (api.tripo3d.ai v2), rodin (hyperhuman.deemos.com)
// Polling + GLB download + gltf-transform recenter/normalize so it drops into
// the game at the right scale/origin.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { Document, NodeIO } from '@gltf-transform/core';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a.startsWith('--')) { const k = a.slice(2); const v = process.argv[process.argv.indexOf(a) + 1]; return [k, v]; }
    return [];
  }).filter(Boolean)
);

const PROVIDER = (args.provider || 'meshy').toLowerCase();
// Prefer the provider's env var (a local .env is gitignored and loaded here, per the
// DATABASE_URL precedent in scripts/CLAUDE.md) over --key: a key passed on the command
// line leaks into shell history, the process list, and any agent transcript that ran it.
// --key still works for a one-off, but is no longer the documented path.
try {
  process.loadEnvFile();
} catch {
  // no local .env: fall through to a real environment variable or --key
}
const ENV_KEYS = { meshy: 'MESHY_API_KEY', tripo: 'TRIPO_API_KEY', rodin: 'RODIN_API_KEY' };
const KEY = args.key || process.env[ENV_KEYS[PROVIDER] ?? ''];
const IMAGE = args.image || '/tmp/sculpt-work/concepts/golem.png';
const OUT = args.out || 'public/models/emberwood/creatures/amber_heart_golem.glb';
if (!KEY) {
  console.error(
    `NO KEY: set ${ENV_KEYS[PROVIDER] ?? 'the provider API key'} in .env (preferred) or pass --key`,
  );
  process.exit(2);
}
if (!fs.existsSync(IMAGE)) { console.error('NO IMAGE', IMAGE); process.exit(2); }

const post = (url, opts) => fetch(url, opts).then(async (r) => {
  const txt = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}\n${txt.slice(0, 500)}`);
  try { return JSON.parse(txt); } catch { return txt; }
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const imgB64 = fs.readFileSync(IMAGE).toString('base64');
const imgType = IMAGE.endsWith('.png') ? 'image/png' : 'image/jpeg';

async function runMeshy() {
  console.log('[meshy] submitting image-to-3d...');
  const fd = new FormData();
  fd.append('image_file', fs.createReadStream(IMAGE));
  fd.append('mode', 'preview');          // fast; set 'refine' for higher quality (slower)
  fd.append('art_style', 'realistic');
  fd.append('target_polycount', '60000');
  const res = await fetch('https://api.meshy.ai/v2/image-to-3d', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, body: fd,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`meshy submit ${res.status}: ${JSON.stringify(j)}`);
  const taskId = j.result || j.task_id;
  console.log('[meshy] task', taskId);
  for (let i = 0; i < 120; i++) {
    await sleep(8000);
    const t = await fetch(`https://api.meshy.ai/v2/image-to-3d/${taskId}`, { headers: { Authorization: `Bearer ${KEY}` } }).then((r) => r.json());
    console.log(`[meshy] status=${t.status} stage=${t.task_status || ''}`);
    if (t.status === 'SUCCEEDED' || t.task_status === 'SUCCEEDED') return t.model_urls?.glb || t.model_urls?.fbx;
    if (t.status === 'FAILED') throw new Error('meshy failed: ' + JSON.stringify(t));
  }
  throw new Error('meshy timeout');
}

async function runTripo() {
  console.log('[tripo] uploading image...');
  const up = new FormData();
  up.append('file', fs.createReadStream(IMAGE));
  const uj = await fetch('https://api.tripo3d.ai/v2/openapi/upload', { method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, body: up }).then((r) => r.json());
  const token = uj.data?.image_token || uj.image_token;
  console.log('[tripo] token', token);
  const tj = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'image_to_model', file: { type: imgType === 'image/png' ? 'png' : 'jpg', file_token: token }, texture: true }),
  }).then((r) => r.json());
  const taskId = tj.data?.task_id;
  console.log('[tripo] task', taskId);
  for (let i = 0; i < 150; i++) {
    await sleep(8000);
    const t = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, { headers: { Authorization: `Bearer ${KEY}` } }).then((r) => r.json());
    const st = t.data?.status;
    console.log(`[tripo] status=${st}`);
    if (st === 'success') return t.data.output?.pbr_model || t.data.output?.base_model;
    if (st === 'failed') throw new Error('tripo failed: ' + JSON.stringify(t.data));
  }
  throw new Error('tripo timeout');
}

async function runRodin() {
  console.log('[rodin] submitting...');
  const res = await fetch('https://hyperhuman.deemos.com/api/v1/image-to-3d', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ images: [`data:${imgType};base64,${imgB64}`], format: 'glb', tess: false }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`rodin submit ${res.status}: ${JSON.stringify(j)}`);
  const uuid = j.uuid || j.task_uuid;
  console.log('[rodin] task', uuid);
  for (let i = 0; i < 150; i++) {
    await sleep(8000);
    const t = await fetch(`https://hyperhuman.deemos.com/api/v1/image-to-3d/tasks/${uuid}/status`, { headers: { Authorization: `Bearer ${KEY}` } }).then((r) => r.json());
    const st = t.status;
    console.log(`[rodin] status=${st}`);
    if (st === 'Done' || st === 'done') return t.output?.glb || (Array.isArray(t.output) ? t.output[0] : null);
    if (st === 'Failed' || st === 'failed') throw new Error('rodin failed: ' + JSON.stringify(t));
  }
  throw new Error('rodin timeout');
}

async function download(url, dest) {
  const buf = await fetch(url).then((r) => { if (!r.ok) throw new Error('dl ' + r.status); return r.arrayBuffer(); });
  fs.writeFileSync(dest, Buffer.from(buf));
  console.log('[dl]', dest, (buf.byteLength / 1024).toFixed(0) + 'KB');
}

// Recenters + scales + re-exports via gltf-transform so the model sits on the
// ground at origin and matches the game's ~3.0 unit height convention.
async function normalize(srcGlb, outGlb, targetH = 3.0) {
  const io = new NodeIO();
  const doc = await io.readBinary(fs.readFileSync(srcGlb));
  const root = doc.getRoot();
  // gather all mesh accessors to compute bbox
  let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  for (const mesh of root.listMeshes()) for (const prim of mesh.listPrimitives()) {
    const p = prim.getAttribute('POSITION');
    for (let i = 0; i < p.getCount(); i++) { const v = p.getVec3(i); for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); } }
  }
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const scale = targetH / (size[1] || 1);
  const cx = (min[0] + max[0]) / 2, cz = (min[2] + max[2]) / 2;
  // bake transform into a wrapper node
  const scene = root.listScenes()[0] || root.createScene();
  const nodes = scene.listChildren();
  if (nodes.length === 1) {
    const n = nodes[0];
    n.setScale([scale, scale, scale]);
    n.setTranslation([-cx * scale, -min[1] * scale, -cz * scale]);
  } else {
    const wrap = root.createNode('Normalized');
    wrap.setScale([scale, scale, scale]);
    wrap.setTranslation([-cx * scale, -min[1] * scale, -cz * scale]);
    for (const n of nodes) { scene.removeChild(n); wrap.addChild(n); }
    scene.addChild(wrap);
  }
  fs.writeFileSync(outGlb, await io.writeBinary(doc));
  console.log(`[norm] bbox ${size.map((s) => s.toFixed(2))} -> scaled to height ${targetH}, written ${outGlb}`);
}

(async () => {
  let url;
  if (PROVIDER === 'meshy') url = await runMeshy();
  else if (PROVIDER === 'tripo') url = await runTripo();
  else if (PROVIDER === 'rodin') url = await runRodin();
  else { console.error('unknown provider', PROVIDER); process.exit(2); }
  if (!url) throw new Error('no model URL returned');
  const tmp = OUT + '.raw.glb';
  await download(url, tmp);
  await normalize(tmp, OUT);
  fs.unlinkSync(tmp);
  console.log('DONE ->', OUT);
  // rebuild media manifest so the new hash is picked up
  try { execSync('node scripts/build_media_manifest.mjs generate', { stdio: 'inherit' }); } catch (e) { console.log('manifest rebuild skipped:', e.message); }
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
