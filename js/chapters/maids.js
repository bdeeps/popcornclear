// Chapter 4: why some kernels do not pop ("old maids"). Sources: Popcorn Board (13.5-14% moisture needed; popcorn
// must have a hull); Iowa State University Extension (best 13 to 14.5% moisture; too wet pops small, rough and
// chewy); Hamaker et al., Purdue, 2005, as reported by Live Science and FoodNavigator (14 yellow popcorn varieties
// left from 4% to 47% unpopped; the hull's cellulose structure acts like a pressure cooker and unpopped kernels
// have leakier hulls). Virot & Ponomarenko 2015 (34% popped at 170 C and 96% at 180 C: each kernel has its own
// critical temperature, modelled as a normal curve with mean 172 C, sd 4.6 C).
// The model: a kernel pops if the steam pressure it can reach, wetFactor(moisture) x the saturated vapour pressure,
// reaches the pressure at its own critical temperature, and its hull does not leak. wetFactor is illustrative
// (drier starch holds its water harder, so less steam), and so are the crack shares: 3% of kernels always leak a
// little, and 20% of the batch is cracked when you switch cracks on. It shows the shape of the effect, not data.
import { THREE, M, COL, puffGeo, popMat, rng, vaporAtm, tcOf, poppedFrac, wetFactor, TC_MEAN, TC_SD, clamp, lerp, smooth, panel, FONT } from '../pop.js';
import { canvasTexture } from '../kit.js';

const N = 100, LEAK = 0.03, CRACK = 0.2;
const poppable = (m, Tpan) => poppedFrac(tcOf(wetFactor(m) * vaporAtm(Tpan)));
const rateOf = (m, Tpan, cracks) => poppable(m, Tpan) * (1 - LEAK) * (cracks ? 1 - CRACK : 1);

export default {
  id: 'maids',
  short: 'Old maids',
  title: 'Why some kernels never pop',
  subtitle: 'Too dry, or a leaky hull, and the pressure never builds.',
  view: { pos: [1.0, 8.2, 9.0], target: [1.8, 0.2, 0.3] },
  learn: `<p>The unpopped kernels at the bottom of the bowl are called <b>old maids</b>. A kernel only pops if its hull can hold the steam until the pressure is high enough. Two things stop that.</p>
    <p><b>Too little water.</b> A kernel needs about 13.5 to 14 percent moisture. Drier than that and there is less steam to build pressure. Popcorn that sits open for months dries out, which is why old popcorn pops badly. Too <i>wet</i> is no good either: the kernels pop, but small, rough and chewy.</p>
    <p><b>A leaky hull.</b> Purdue food chemists compared 14 varieties and found from 4 to 47 percent of kernels left unpopped. Their explanation: the hull of a good popper acts like a pressure cooker and keeps the moisture in, while the hull of an old maid leaks. A crack lets the steam out as fast as it forms.</p>
    <p class="tip"><b>Try it:</b> drag the heat slider to warm the pan and watch the kernels pop one by one. Lower the moisture, then switch on cracked hulls, and watch the pop rate on the chart.</p>
    <p class="note">This is a simple model. The shape of the effect is real, but the exact numbers are illustrative: the crack shares and the way dryness cuts pressure are not measured data.</p>`,
  terms: [
    { t: 'Old maid', d: 'A kernel that does not pop. Also called a spinster or an unpopped kernel.' },
    { t: 'Popability', d: 'The share of kernels in a batch that pop. Good popcorn reaches the high nineties percent.' },
    { t: 'Moisture content', d: 'The share of a kernel’s weight that is water. Popcorn pops best at about 13.5 to 14 percent.' },
    { t: 'Leaky hull', d: 'A hull with cracks or a structure that lets steam escape, so pressure cannot reach the pop point.' },
  ],
  defaults: { m: 14, cracks: false, T: 190, heat: 1, play: false },
  controls: [
    { key: 'heat', type: 'range', label: 'Heating the pan', min: 0, max: 1, step: 0.002, fmt: (v, s) => `${Math.round(20 + (s.T - 20) * v)} °C` },
    { key: 'play', type: 'toggle', label: 'Heat it from cold' },
    { key: 'm', type: 'range', label: 'Moisture', min: 4, max: 20, step: 0.1, fmt: (v) => `${v.toFixed(1)}%`, hint: 'The Popcorn Board gives 13.5 to 14% as the best.' },
    { key: 'cracks', type: 'toggle', label: 'Cracked hulls (20% of the batch)' },
    { key: 'T', type: 'range', label: 'Pan temperature', min: 150, max: 230, step: 1, fmt: (v) => `${v.toFixed(0)} °C` },
  ],
  quiz: [
    { q: 'Why does a cracked hull stop a kernel popping?', options: ['It lets the steam escape, so pressure never builds', 'It makes the starch too hard', 'It adds water', 'It blocks the heat'], answer: 0, why: 'The hull has to hold the steam in until the pressure is high enough to burst it. A crack lets the steam out as fast as it forms.' },
    { q: 'What moisture does popcorn pop best at?', options: ['About 5%', 'About 13.5 to 14%', 'About 25%', 'About 40%'], answer: 1, why: 'The Popcorn Board gives 13.5 to 14 percent. Iowa State Extension says 13 to 14.5 percent.' },
    { q: 'What happens if kernels are too wet?', options: ['They will not pop at all', 'They pop small and chewy', 'They explode harder', 'They turn blue'], answer: 1, why: 'Too much moisture gives popcorn that is small, rough and chewy, according to Iowa State Extension.' },
  ],
  reel: [
    { ms: 5200, caption: 'Too dry, or with a cracked hull, a kernel cannot build pressure. It stays an old maid.', set: { m: 14, cracks: false, T: 190, heat: 1, play: false }, anim: { m: [14, 10.5] }, view: { pos: [1.6, 7.6, 12], target: [2.4, 0.4, 0] }, spin: 0.3 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.2, 0.5, 64), M.metal(0x4a4d56, { roughness: 0.45 })); pan.position.y = -0.25; root.add(pan);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(3.3, 64), M.matte(0x1d1f26)); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.002; root.add(inner);
    const R = rng(11);
    const k = Array.from({ length: N }, (_, i) => {
      const z = (R() + R() + R() + R() - 2) * 1.732; // roughly normal
      const a = i * 2.39996, rr = 3.0 * Math.sqrt((i + 0.5) / N);
      return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, Tc: TC_MEAN + TC_SD * z, leak: (i * 53) % 100 < LEAK * 100, crack: (i * 37) % 100 < CRACK * 100, rot: R() * 6.28, sz: 0.85 + R() * 0.3, pv: R() };
    });
    const kg = new THREE.SphereGeometry(1, 14, 10); kg.scale(0.17, 0.25, 0.17);
    const km = new THREE.InstancedMesh(kg, M.plastic(0xffffff, { roughness: 0.4 }), N); km.castShadow = true; root.add(km);
    const pg = puffGeo('foam', 3, 3);
    const pm = new THREE.InstancedMesh(pg, popMat(), N); pm.castShadow = true; root.add(pm);
    const o = new THREE.Object3D(), col = new THREE.Color();
    // chart
    const W = 1100, H = 760;
    const X = (m) => 100 + ((m - 4) / 16) * 940, Y = (r) => 650 - r * 520;
    const chart = canvasTexture(W, H, (g) => {
      panel(g, W, H);
      g.font = FONT(500, 26); g.fillStyle = '#a8aebf'; g.fillText('Share of kernels that pop, against moisture', 70, 56);
      g.fillStyle = 'rgba(163,230,53,.12)'; g.fillRect(X(13.5), Y(1), X(14) - X(13.5) + 6, 520);
      g.font = FONT(400, 20);
      for (let r = 0; r <= 1; r += 0.25) { g.fillStyle = '#737a8e'; g.fillText(`${r * 100}%`, 22, Y(r) + 7); g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2; g.beginPath(); g.moveTo(100, Y(r)); g.lineTo(1040, Y(r)); g.stroke(); }
      for (let m = 4; m <= 20; m += 2) { g.fillStyle = '#737a8e'; g.fillText(`${m}`, X(m) - 8, 686); }
      g.fillStyle = '#737a8e'; g.fillText('moisture (% of kernel weight)', 450, 724);
      g.fillStyle = '#a3e635'; g.fillText('13.5 to 14%', X(13.5) - 70, 118);
      const line = (cr, c, w, a) => { g.strokeStyle = c; g.lineWidth = w; g.globalAlpha = a; g.beginPath(); for (let m = 4; m <= 20; m += 0.1) { const x = X(m), y = Y(rateOf(m, s.T, cr)); m === 4 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.globalAlpha = 1; };
      line(false, '#8ef0ff', 5, s.cracks ? 0.3 : 1); line(true, '#ff7a59', 5, s.cracks ? 1 : 0.3);
      g.fillStyle = '#8ef0ff'; g.fillText('sound hulls', X(5.2), Y(rateOf(5.2, s.T, false)) - 18);
      g.fillStyle = '#ff7a59'; g.fillText('20% cracked', X(15.4), Y(rateOf(16, s.T, true)) - 14);
      g.fillStyle = '#ffb547'; g.font = FONT(400, 19); g.fillText('too wet: pops small and chewy', X(14.6), 590);
      const x = X(s.m), y = Y(rateOf(s.m, s.T, s.cracks)); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); g.fillStyle = s.cracks ? '#ff7a59' : '#8ef0ff'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
    });
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6 * H / W), new THREE.MeshBasicMaterial({ map: chart.tex, transparent: true, toneMapped: false }));
    cp.position.set(5.4, 1.9, -0.5); cp.rotation.y = -0.35; root.add(cp);
    let key = '';
    const stat = (st) => {
      const wf = wetFactor(st.m);
      let popped = 0, dry = 0, leaky = 0;
      const res = k.map((q) => {
        const cr = q.leak || (st.cracks && q.crack);
        // temperature needed so that wf * vapour(T) reaches vapour(Tc)
        const need = wf <= 0.001 ? Infinity : tcOf(vaporAtm(q.Tc) / wf);
        const ok = !cr && need <= st.T;
        if (ok) popped++; else if (cr) leaky++; else dry++;
        return { ok, need, cr };
      });
      return { res, popped, dry, leaky, wf };
    };
    let cache = { key: '', v: null };
    const get = (st) => { const kk = `${st.m.toFixed(2)}|${st.T}|${st.cracks}`; if (cache.key !== kk) { cache = { key: kk, v: stat(st) }; } return cache.v; };
    return {
      update(dt, st) {
        if (st.play) { st.heat = Math.min(1, st.heat + dt / 9); if (st.heat >= 1) st.play = false; }
        const kk = `${st.m.toFixed(2)}|${st.cracks}|${st.T}`;
        if (kk !== key) { key = kk; chart.redraw(); }
        const S = get(st), Th = 20 + (st.T - 20) * st.heat;
        for (let i = 0; i < N; i++) {
          const q = k[i], r = S.res[i];
          const popAt = r.ok ? r.need : Infinity;
          const grow = r.ok ? smooth((Th - popAt) / 6) : 0;
          // unpopped kernel
          o.position.set(q.x, 0.2, q.z); o.rotation.set(0.3, q.rot, 0.1); o.scale.setScalar(q.sz * (grow > 0.02 ? 0 : 1));
          o.updateMatrix(); km.setMatrixAt(i, o.matrix);
          col.setHex(r.cr && st.cracks && q.crack ? 0x8a5a24 : 0xe0a63a).lerp(new THREE.Color(0xff7a3c), clamp((Th - 100) / 400, 0, 0.35)); km.setColorAt(i, col);
          // popped flake
          const sc = grow * (0.27 + q.pv * 0.1);
          o.position.set(q.x, 0.06 + sc * 0.8, q.z); o.rotation.set(q.rot, q.rot * 2, 0); o.scale.setScalar(Math.max(0.0001, sc)); o.updateMatrix(); pm.setMatrixAt(i, o.matrix);
        }
        km.instanceMatrix.needsUpdate = true; pm.instanceMatrix.needsUpdate = true; if (km.instanceColor) km.instanceColor.needsUpdate = true;
      },
      readout(st) {
        const S = get(st), Th = 20 + (st.T - 20) * st.heat;
        let now = 0; S.res.forEach((r) => { if (r.ok && r.need <= Th) now++; });
        const rate = S.popped, why = st.m > 15 ? 'Wet kernels pop, but small and chewy.' : st.m >= 12.5 ? 'About right: the hull holds the steam.' : st.m >= 9 ? 'Too dry: less steam, so some never reach the pop point.' : 'Far too dry: almost no steam at all.';
        return `<div class="big">${rate} of 100 pop</div><p class="r-say">${why}${st.cracks ? ' Cracked hulls leak, so those kernels cannot build any pressure.' : ''}</p>
          <div class="row"><span>Popped so far</span><b>${now} of ${rate}</b></div>
          <div class="row"><span>Old maids: too dry</span><b>${S.dry}</b></div>
          <div class="row"><span>Old maids: leaky hull</span><b>${S.leaky}</b></div>
          <div class="row"><span>Moisture</span><b>${st.m.toFixed(1)}%</b></div>`;
      },
    };
  },
};
