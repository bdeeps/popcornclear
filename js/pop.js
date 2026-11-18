// Shared parts for PopcornClear: the physics numbers, a kernel cutaway, and popped-flake shapes.
//
// Numbers and where they come from (all approximate, and the model is simplified):
// - Virot & Ponomarenko 2015, J R Soc Interface 12(104):20141247, doi 10.1098/rsif.2014.1247: kernel radius
//   3.1 +/- 0.2 mm, mass 172 +/- 30 mg, hull thickness 160 +/- 40 micrometres, hull ultimate strength about
//   10 MPa, about 20 mg of water per kernel, critical temperature about 180 C and critical pressure about
//   10 bar. In 50-kernel oven tests (5 min per step) 34% popped at 170 C and 96% at 180 C. A popped piece had
//   radius 6.5 +/- 0.8 mm and density 160 +/- 60 kg/m3 (about 2x larger, 8x less dense).
// - Popcorn Board: 13.5-14% moisture to pop; the hull bursts at about 135 psi and about 347 F (175 C); a kernel
//   swells to 40-50 times its size; butterfly and mushroom shapes.
// - Vapour pressure: Clausius-Clapeyron with a constant latent heat of 40.66 kJ/mol (NIST gives the boiling
//   point 373.15 K), which is within a few percent of steam tables between 100 and 200 C.
import { THREE, M, clamp, lerp, smooth } from './kit.js';

export { THREE, M, clamp, lerp, smooth };
export const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const COL = { hull: 0xd9a441, hullDeep: 0xb9791f, hard: 0xf2c36b, soft: 0xfff0c9, germ: 0xff9e5e, water: 0x62d6ff, steam: 0xdcf3ff, pop: 0xfff8ea, hot: 0xff5a3c, pink: 0xf59ee6, lime: 0xa3e635, amber: 0xffb547, coral: 0xff7a59, cyan: 0x8ef0ff, violet: 0xc49bff };

// ------------------------------------------------------------------ physics
const LR = 40660 / 8.314; // latent heat over gas constant, in kelvin
export const vaporAtm = (T) => Math.exp(-LR * (1 / (T + 273.15) - 1 / 373.15)); // saturated steam pressure, atm
export const HULL = { R: 3.1, e: 160, sigma: 10 }; // mm, micrometres, MPa
export const pcAtm = (e = HULL.e, sigma = HULL.sigma, R = HULL.R) => ((2 * (e * 1e-3) * sigma) / R) * 9.869; // thin sphere: sigma = p R / 2e, in atm
export const tcOf = (pc) => { let lo = 20, hi = 300; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; vaporAtm(m) < pc ? (lo = m) : (hi = m); } return (lo + hi) / 2; };
// A normal curve through the two oven measurements (34% at 170 C, 96% at 180 C): mean 172 C, spread 4.6 C.
const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
export const TC_MEAN = 172, TC_SD = 4.6;
export const poppedFrac = (T) => 0.5 * (1 + erf((T - TC_MEAN) / (TC_SD * Math.SQRT2)));
// How much of the saturated-steam pressure a kernel reaches, for a given moisture (percent). Illustrative: below
// the ideal, the water is held more tightly by the starch and little is left to make steam.
export const wetFactor = (m) => (m >= 14 ? 1 : m >= 9 ? 0.55 + 0.45 * ((m - 9) / 5) : Math.max(0, 0.55 * ((m - 4) / 5)));

// ------------------------------------------------------------------ kernel shape
// Profile of the kernel (axis y): crown at the top, tip at the bottom.
export const kr = (u) => 0.66 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(clamp(u, 0, 1), 1.6))), 0.7);
export function profile(scale = 1, n = 48, thickness = 0) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([Math.max(0, kr(u) - thickness) * scale, (-1 + 2 * u) * scale]); }
  return pts;
}
export function kernelGeo(scale = 1, thickness = 0, seg = 48) {
  const pts = profile(scale, 48, thickness).map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y));
  const g = new THREE.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  return g;
}
function shapeOf(pts, mirror = true) {
  const sh = new THREE.Shape();
  const right = pts.map(([r, y]) => [r, y]);
  sh.moveTo(right[0][0], right[0][1]);
  for (let i = 1; i < right.length; i++) sh.lineTo(right[i][0], right[i][1]);
  if (mirror) for (let i = right.length - 1; i >= 0; i--) sh.lineTo(-right[i][0], right[i][1]);
  return sh;
}

// A cutaway kernel: hull, hard and soft starch, germ, water droplets. Plane z=0 is the cut.
export function makeKernel(S = 2.2, { clip = null } = {}) {
  const g = new THREE.Group(), parts = {};
  const clipped = (m) => { if (clip) m.clippingPlanes = [clip]; return m; };
  const hullM = clipped(M.clear(COL.hull, 0.34, { roughness: 0.35, emissive: 0x000000 }));
  const hull = new THREE.Mesh(kernelGeo(S, 0), hullM); hull.userData.part = 'hull';
  const hullIn = new THREE.Mesh(kernelGeo(S, 0.03), clipped(M.clear(COL.hullDeep, 0.2, { side: THREE.BackSide })));
  const hardM = clipped(M.clear(COL.hard, 0.3, { roughness: 0.6 }));
  const hard = new THREE.Mesh(kernelGeo(S, 0.035), hardM); hard.userData.part = 'starch';
  g.add(hull, hullIn, hard);
  parts.hull = hull; parts.hullM = hullM; parts.hard = hard; parts.hardM = hardM;
  // cut faces (in the plane z = 0)
  const cut = new THREE.Group(); cut.position.z = 0.002;
  const faceMat = (c, o, order, geo = new THREE.BufferGeometry()) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: o, roughness: 0.7, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = order; return m; };
  const f1 = faceMat(COL.hull, 0.95, 1); f1.geometry = new THREE.ShapeGeometry(shapeOf(profile(S, 40, 0)), 24); f1.userData.part = 'hull';
  const f2 = faceMat(COL.hard, 0.85, 2); f2.geometry = new THREE.ShapeGeometry(shapeOf(profile(S, 40, 0.032)), 24); f2.userData.part = 'starch'; f2.position.z = 0.001;
  const f3 = faceMat(COL.soft, 0.92, 3); f3.geometry = new THREE.ShapeGeometry(shapeOf(profile(S, 40, 0.19)), 24); f3.userData.part = 'starch'; f3.position.z = 0.002;
  const germ = faceMat(COL.germ, 1, 4); germ.geometry = new THREE.CircleGeometry(1, 28); germ.scale.set(0.2 * S, 0.34 * S, 1); germ.position.set(-0.3 * S, -0.3 * S, 0.003); germ.rotation.z = 0.35; germ.userData.part = 'germ';
  cut.add(f1, f2, f3, germ);
  g.add(cut);
  Object.assign(parts, { cut, f1, f2, f3, germ });
  // water droplets
  const R = rng(5), drops = [];
  const dm = M.glow(COL.water, { transparent: true, opacity: 0.95 });
  const geo = new THREE.SphereGeometry(1, 14, 10);
  let tries = 0;
  while (drops.length < 70 && tries++ < 4000) {
    const u = R(), y = -1 + 2 * u, rmax = kr(u) - 0.2;
    if (rmax < 0.04) continue;
    const x = (R() * 2 - 1) * rmax, z = (R() * 2 - 1) * 0.12;
    if (Math.hypot((x + 0.3) * 1.0 / 0.2, (y + 0.3) / 0.34) < 1.25) continue; // keep clear of the germ
    const d = new THREE.Mesh(geo, clipped(dm.clone())); d.position.set(x * S, y * S, z * S);
    d.userData = { part: 'water', r: (0.018 + R() * 0.02) * S, k: R() };
    d.renderOrder = 6; drops.push(d); g.add(d);
  }
  parts.drops = drops;
  g.parts = parts; g.S = S;
  return g;
}

// ------------------------------------------------------------------ popped flakes
const hash3 = (x, y, z, seed) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x, y, z, seed) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf), sz = zf * zf * (3 - 2 * zf);
  let r = 0;
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) r += (a ? sx : 1 - sx) * (b ? sy : 1 - sy) * (c ? sz : 1 - sz) * hash3(xi + a, yi + b, zi + c, seed);
  return r;
};
// kind: 'butterfly' (irregular, winged), 'mushroom' (round ball with a knobbly surface), 'foam' (in-between blob)
export function puffGeo(kind = 'mushroom', seed = 1, detail = 4) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let r = 1;
    if (kind === 'mushroom') {
      r = 1 + 0.2 * (vnoise(v.x * 3.4, v.y * 3.4, v.z * 3.4, seed) - 0.5) + 0.1 * (vnoise(v.x * 8, v.y * 8, v.z * 8, seed + 3) - 0.5);
      v.multiplyScalar(r);
    } else if (kind === 'butterfly') {
      // wings: stretch along x, flatten along y, lobes around
      const lobes = 0.55 * Math.pow(Math.abs(Math.sin(2.2 * Math.atan2(v.z, v.x) + seed)), 1.4) + 0.35 * (vnoise(v.x * 2.3, v.y * 2.3, v.z * 2.3, seed) - 0.5);
      r = 0.75 + lobes + 0.12 * (vnoise(v.x * 7, v.y * 7, v.z * 7, seed + 7) - 0.5);
      v.set(v.x * r * 1.5, v.y * r * 0.62, v.z * r * 1.05);
    } else {
      r = 1 + 0.32 * (vnoise(v.x * 2.4, v.y * 2.4, v.z * 2.4, seed) - 0.5) + 0.12 * (vnoise(v.x * 6, v.y * 6, v.z * 6, seed + 5) - 0.5);
      v.multiplyScalar(r);
    }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  // the icosahedron is not indexed, so smooth the normals by position
  const n = g.attributes.normal, acc = new Map(), key = (i) => `${Math.round(p.getX(i) * 1e4)},${Math.round(p.getY(i) * 1e4)},${Math.round(p.getZ(i) * 1e4)}`;
  for (let i = 0; i < p.count; i++) { const k = key(i); const a = acc.get(k) || [0, 0, 0]; a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); acc.set(k, a); }
  for (let i = 0; i < p.count; i++) { const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); }
  return g;
}
export const popMat = (o = {}) => new THREE.MeshStandardMaterial({ color: COL.pop, roughness: 0.92, metalness: 0, ...o });

// A canvas chart helper: clear, panel, frame.
export function panel(g, W, H) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = 'rgba(13,15,22,.9)'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; g.strokeRect(1, 1, W - 2, H - 2);
}
export const FONT = (w, px) => `${w} ${px}px Geist, system-ui, sans-serif`;
