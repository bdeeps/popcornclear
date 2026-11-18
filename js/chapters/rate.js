// Chapter 6: the pop rate rises, peaks and fades. Each kernel pops at its own critical temperature (Virot &
// Ponomarenko 2015: 34% popped at 170 C and 96% at 180 C in an oven, so a normal spread of about 4.6 C around
// 172 C), and the kernels reach that temperature at different times, because the pan warms up and the kernels sit
// at different places and get stirred. Pops then come in a burst as kernels cross their thresholds, and fade when
// few are left. The timing here is simulated, not measured: the pan temperature curve, the delays and the number of
// kernels are illustrative. A batch of 150 kernels is used for the drawing.
import { THREE, M, COL, puffGeo, popMat, rng, TC_MEAN, TC_SD, clamp, lerp, smooth, panel, FONT } from '../pop.js';
import { canvasTexture } from '../kit.js';

const N = 150, TPAN = 215, TAU = 38;
export default {
  id: 'rate',
  short: 'Pops over time',
  title: 'Pops over time',
  subtitle: 'A few pops, then a storm, then the last stragglers.',
  view: { pos: [1.4, 6.4, 10.4], target: [1.8, 0.6, 0] },
  learn: `<p>Listen to a pan of popcorn. First nothing, then one pop, then a few, then a rattling storm, then the pops thin out to the odd straggler. That rise and fall comes straight from the physics.</p>
    <p>Every kernel pops at <b>its own critical temperature</b>, a little higher or lower than the next one. In Virot and Ponomarenko’s oven tests, 34 percent had popped at 170 °C and 96 percent at 180 °C, so they ranged over about ten degrees. The kernels also warm up at different speeds, depending on where they sit in the pan and how they are stirred. A few reach the threshold early. As the pan warms, most cross it within a short window, and the rate peaks. Then few are left to pop, and the rate falls.</p>
    <p class="tip"><b>Try it:</b> drag the time slider, or press Play. The tall bars on the chart are pops per second, and the line is the running count.</p>
    <p class="note">The timing is a simulation with made-up pan numbers. The spread of critical temperatures is fitted to the two oven results.</p>`,
  terms: [
    { t: 'Critical temperature', d: 'The temperature at which a kernel’s hull can no longer hold its steam. It differs a little from kernel to kernel.' },
    { t: 'Pop rate', d: 'How many kernels pop each second. It rises to a peak, then falls.' },
    { t: 'Cumulative count', d: 'The total number of pops so far.' },
  ],
  defaults: { t: 78, play: false },
  controls: [
    { key: 't', type: 'range', label: 'Time in the pan', min: 0, max: 150, step: 0.5, fmt: (v) => `${v.toFixed(0)} s` },
    { key: 'play', type: 'toggle', label: 'Play (fast forward)' },
  ],
  quiz: [
    { q: 'Why does the pop rate peak and then fade?', options: ['Kernels have different thresholds and run out', 'The pan cools down', 'The oil runs out', 'Kernels get tired'], answer: 0, why: 'Each kernel pops at its own critical temperature, so pops are spread over time. They come most often when most kernels cross, then thin out.' },
    { q: 'In the oven tests, what share had popped at 180 °C?', options: ['4%', '34%', '96%', '100%'], answer: 2, why: 'Virot and Ponomarenko found 34% at 170 °C and 96% at 180 °C.' },
    { q: 'What does the running count show?', options: ['The pan temperature', 'The total pops so far', 'The pops per second', 'The moisture'], answer: 1, why: 'It adds up the pops over time, so it climbs steeply during the burst and levels off.' },
  ],
  reel: [
    { ms: 5600, caption: 'Each kernel has its own pop temperature, so the pops come in a burst: a few, a storm, then stragglers.', set: { t: 0, play: false }, anim: { t: [0, 140] }, view: { pos: [1.8, 7.4, 12], target: [2.4, 0.4, 0] }, spin: 0.2 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.2, 0.5, 64), M.metal(0x4a4d56, { roughness: 0.45 })); pan.position.y = -0.25; root.add(pan);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(3.3, 64), M.matte(0x1d1f26)); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.002; root.add(inner);
    const R = rng(23);
    const norm = () => (R() + R() + R() + R() - 2) * 1.732;
    const k = Array.from({ length: N }, (_, i) => {
      const a = i * 2.39996, rr = 3.0 * Math.sqrt((i + 0.5) / N), Tc = TC_MEAN + TC_SD * norm(), delay = 8 + R() * 28;
      // kernel temperature: 20 + (TPAN - 20) (1 - exp(-(t - delay)/TAU)); invert for the pop time
      const x = 1 - (Tc - 20) / (TPAN - 20), tp = delay - TAU * Math.log(x);
      const tx = (R() * 2 - 1) * 3.0, tz = (R() * 2 - 1) * 3.0;
      const land = Math.hypot(tx, tz) > 3.1 ? [tx * 0.8, tz * 0.8] : [tx, tz];
      return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, tp, rot: R() * 6.28, sz: 0.27 + R() * 0.1, land, hgt: 1.8 + R() * 1.6, spin: (R() - 0.5) * 14 };
    }).sort((a, b) => a.tp - b.tp);
    const kg = new THREE.SphereGeometry(1, 12, 8); kg.scale(0.17, 0.25, 0.17);
    const km = new THREE.InstancedMesh(kg, M.plastic(0xe0a63a, { roughness: 0.4 }), N); km.castShadow = true; root.add(km);
    const pm = new THREE.InstancedMesh(puffGeo('foam', 3, 3), popMat(), N); pm.castShadow = true; root.add(pm);
    const o = new THREE.Object3D();
    const times = k.map((q) => q.tp);
    const maxT = 150;
    const rateAt = (t) => { let c = 0; for (const x of times) if (x >= t - 1 && x < t + 1) c++; return c / 2; };
    const countAt = (t) => times.filter((x) => x <= t).length;
    const peak = Math.max(...Array.from({ length: 151 }, (_, i) => rateAt(i)));
    const W = 1100, H = 760, X = (t) => 90 + (t / maxT) * 950, Yr = (v) => 640 - (v / Math.max(8, peak + 1)) * 500, Yc = (c) => 640 - (c / N) * 500;
    const chart = canvasTexture(W, H, (g) => {
      panel(g, W, H);
      g.font = FONT(500, 26); g.fillStyle = '#a8aebf'; g.fillText('Pops per second (bars) and total pops so far (line)', 70, 56);
      g.font = FONT(400, 20);
      for (let t = 0; t <= maxT; t += 30) { g.fillStyle = '#737a8e'; g.fillText(`${t}`, X(t) - 8, 676); }
      g.fillText('seconds in the pan', 450, 716);
      for (let c = 0; c <= N; c += 50) { g.fillStyle = '#ffb547'; g.fillText(String(c), 1052, Yc(c) + 7); g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 2; g.beginPath(); g.moveTo(90, Yc(c)); g.lineTo(1040, Yc(c)); g.stroke(); }
      for (let t = 0; t < maxT; t++) { const v = rateAt(t + 0.5); if (t > s.t) break; g.fillStyle = '#8ef0ff'; g.fillRect(X(t), Yr(v), X(1) - X(0) - 1, 640 - Yr(v)); }
      g.strokeStyle = '#ffb547'; g.lineWidth = 5; g.beginPath(); for (let t = 0; t <= s.t; t += 1) { const x = X(t), y = Yc(countAt(t)); t === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(X(s.t), Yc(countAt(s.t)), 11, 0, 7); g.fill();
      g.fillStyle = '#8ef0ff'; g.fillText('pops per second', 120, 120); g.fillStyle = '#ffb547'; g.fillText('running count', 120, 150);
    });
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6 * H / W), new THREE.MeshBasicMaterial({ map: chart.tex, transparent: true, toneMapped: false }));
    cp.position.set(5.6, 2.2, -0.6); cp.rotation.y = -0.3; root.add(cp);
    let key = '';
    return {
      update(dt, st) {
        if (st.play) { st.t = Math.min(maxT, st.t + dt * 12); if (st.t >= maxT) st.play = false; }
        const kk = st.t.toFixed(1); if (kk !== key) { key = kk; chart.redraw(); }
        for (let i = 0; i < N; i++) {
          const q = k[i], u = st.t - q.tp, near = clamp(1 + u / 3, 0, 1); // 3 s of warming up before the pop
          const jig = u < 0 && u > -1.5 ? Math.sin(st.t * 60 + i) * 0.03 * (1 + u / 1.5) : 0;
          o.position.set(q.x + jig, 0.2, q.z); o.rotation.set(0.3, q.rot, 0.1); o.scale.setScalar(u >= 0 ? 0.0001 : 1); o.updateMatrix(); km.setMatrixAt(i, o.matrix);
          let px = q.x, pz = q.z, py = 0.1;
          if (u >= 0) {
            const f = clamp(u / 1.1, 0, 1), air = 4 * f * (1 - f);
            px = lerp(q.x, q.land[0], smooth(f)); pz = lerp(q.z, q.land[1], smooth(f)); py = 0.1 + q.hgt * air + (1 - f) * 0.0;
          }
          const sc = u >= 0 ? q.sz * (0.3 + 0.7 * smooth(u / 0.25)) : 0.0001;
          o.position.set(px, py + sc * 0.6, pz); o.rotation.set(q.rot + (u > 0 ? q.spin * clamp(u, 0, 1.1) : 0), q.rot * 2, 0); o.scale.setScalar(Math.max(0.0001, sc)); o.updateMatrix(); pm.setMatrixAt(i, o.matrix);
        }
        km.instanceMatrix.needsUpdate = true; pm.instanceMatrix.needsUpdate = true;
      },
      readout(st) {
        const c = countAt(st.t), r = rateAt(st.t), Tp = 20 + (TPAN - 20) * (1 - Math.exp(-Math.max(0, st.t - 8) / TAU));
        const phase = st.t < times[0] ? 'Warming up: no pops yet' : c >= N ? 'All popped' : r >= peak * 0.7 ? 'The storm' : c < N * 0.2 ? 'The first pops' : c < N * 0.8 ? 'Pops thinning' : 'Last stragglers';
        return `<div class="big">${phase}</div><p class="r-say">Every kernel pops when it passes its own threshold, so pops are spread out in time.</p>
          <div class="row"><span>Popped so far</span><b>${c} of ${N}</b></div>
          <div class="row"><span>Pops per second now</span><b>${r.toFixed(1)}</b></div>
          <div class="row"><span>Typical kernel temperature</span><b>${Math.min(TPAN, Tp).toFixed(0)} °C</b></div>`;
      },
    };
  },
};
