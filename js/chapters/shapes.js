// Chapter 5: butterfly and mushroom flakes, and the microwave. Shapes (Popcorn Board, "Corny Facts"): butterfly
// popcorn is irregular with large bumps, light and crisp but breaks easily; mushroom popcorn has a round centre
// and a rough surface and is sturdy enough to stir with coatings. Breeders have developed varieties that give mostly
// mushrooms (Wikipedia "Popcorn", citing Hallauer 2001). Microwave popcorn: Percy Spencer at Raytheon tried
// popcorn among his first experiments (Popcorn Board; the story is a well-known one and is told as legend in some
// sources); microwave ovens absorb their energy mainly in water, which heats the water inside the kernel directly.
// The heating pictures are a simple drawing of that idea: oil heats the hull and works inwards, a microwave heats
// the water throughout. They are not simulations of a real kernel.
import { THREE, M, COL, kr, kernelGeo, puffGeo, popMat, clamp, lerp, smooth } from '../pop.js';
import { canvasTexture } from '../kit.js';

const SHAPES = {
  butterfly: { n: 'Butterfly', say: 'Irregular, with big wings. Light and crisp, but it breaks easily.' },
  mushroom: { n: 'Mushroom', say: 'A round centre with a rough surface. Sturdy, so it survives stirring in a coating.' },
  both: { n: 'Both', say: 'Both shapes come from the same process; the variety and how the foam comes out decide which you get.' },
};
const HEATS = {
  oil: { n: 'Hot oil or air', say: 'Heat arrives at the hull and works inwards. The outside is far hotter than the middle for a while.' },
  mw: { n: 'Microwave', say: 'The oven’s energy is absorbed mostly by water, so the water inside the kernel heats up throughout, not just from the outside.' },
};
const TPAN = 200;
const temps = (heat, t) => {
  // returns function of depth d in 0..1 (0 = hull surface, 1 = centre) giving temperature (C)
  if (heat === 'oil') { const h = smooth(t * 1.15); return (d) => 20 + (TPAN - 20) * clamp(h * 1.6 - d * 0.6, 0, 1); }
  return (d) => 20 + 170 * smooth(t * 1.18) * (0.97 + 0.03 * Math.sin(d * 30));
};
const coreT = (heat, t) => temps(heat, t)(1);
const colour = (T) => { const k = clamp((T - 20) / 170, 0, 1); const a = new THREE.Color(0x2a3550), b = new THREE.Color(0xffd84a), c = new THREE.Color(0xff3a10); return k < 0.6 ? a.lerp(b, k / 0.6) : b.lerp(c, (k - 0.6) / 0.4); };

export default {
  id: 'shapes',
  short: 'Shapes and microwaves',
  title: 'Butterfly, mushroom, microwave',
  subtitle: 'Two shapes of flake, and what changes when the heat comes from inside.',
  view: { pos: [1.2, 1.6, 12.5], target: [1.4, 1.1, 0] },
  learn: `<p>Popped corn comes in two main shapes. <b>Butterfly</b> flakes are irregular, with big wings and bumps. They are light and crisp but break easily. <b>Mushroom</b> flakes have a round centre and a rough surface. They are sturdy, so they are used for coated popcorn that gets stirred. Breeders have developed varieties that give mostly one shape or the other.</p>
    <p>In a pan or hot-air popper, heat comes in through the hull and works inwards. The outside of the kernel is hotter than the middle for a while. A <b>microwave</b> works differently. Microwave ovens heat mostly through water, so the water inside each kernel is warmed right through. When the water in the middle reaches about 180 °C, the kernel pops, either way.</p>
    <p>The microwave story goes back to <b>Percy Spencer</b> at Raytheon, who is said to have tried popcorn among the very first foods in his 1945 experiments. Microwave bags came in the early 1980s.</p>
    <p class="tip"><b>Try it:</b> choose a heat source, then slide the heating time. Watch the colours inside the kernel: red is hot. The kernel pops when its middle reaches about 180 °C.</p>
    <p class="note">The heating pictures are simple drawings of the idea, not a simulation of real kernels.</p>`,
  terms: [
    { t: 'Butterfly', d: 'A popped shape with irregular wings and large bumps.' },
    { t: 'Mushroom', d: 'A popped shape with a round centre and a rough surface.' },
    { t: 'Magnetron', d: 'The tube in a microwave oven that makes the microwaves. Percy Spencer worked on making them at scale.' },
    { t: 'Susceptor', d: 'A thin metallised layer in some microwave bags that absorbs microwaves and gets hot.' },
  ],
  defaults: { heat: 'oil', shape: 'both', t: 0.3 },
  controls: [
    { key: 'heat', type: 'seg', label: 'Heat from', options: Object.entries(HEATS).map(([v, h]) => ({ v, label: h.n })) },
    { key: 't', type: 'range', label: 'Heating time', min: 0, max: 1, step: 0.002, fmt: (v) => (v < 0.15 ? 'Just started' : v < 0.6 ? 'Warming' : 'Hot') },
    { key: 'shape', type: 'seg', label: 'Flake shape', options: Object.entries(SHAPES).map(([v, h]) => ({ v, label: h.n })) },
  ],
  quiz: [
    { q: 'Which shape is sturdy enough to stir with a coating?', options: ['Butterfly', 'Mushroom', 'Neither', 'Both equally'], answer: 1, why: 'Mushroom popcorn has a round, compact shape and a rough surface, which stands up to stirring.' },
    { q: 'How does a microwave heat a kernel differently from a pan?', options: ['It heats the water inside throughout', 'It heats only the hull', 'It cools the kernel', 'It removes the water'], answer: 0, why: 'Microwave energy is absorbed mostly by water, so the water inside the kernel is heated directly rather than from the outside in.' },
    { q: 'Whose experiments with microwaves are said to have included popcorn?', options: ['Percy Spencer at Raytheon', 'Charles Cretors', 'Orville Redenbacher', 'Hernán Cortés'], answer: 0, why: 'Spencer worked on microwave technology at Raytheon in the 1940s, and popcorn is said to have been among his first test foods.' },
  ],
  reel: [
    { ms: 4600, caption: 'Butterfly flakes are wing-like and crisp. Mushroom flakes are round and sturdy.', set: { heat: 'mw', shape: 'both', t: 0.95 }, view: { pos: [1.4, 1.8, 12.5], target: [1.4, 1.3, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    // kernel with a heat map on a plane
    const S = 1.7, kx = -3.0;
    const k = new THREE.Group(); k.position.set(kx, S * 1.0, 0); root.add(k);
    k.add(new THREE.Mesh(kernelGeo(S, 0), M.clear(COL.hull, 0.2)));
    const CW = 256, CH = 512;
    const heat = canvasTexture(CW, CH, (g) => {
      g.clearRect(0, 0, CW, CH);
      const T = temps(s.heat, s.t);
      const P = (sc) => { g.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, r = kr(u) * sc, y = -1 + 2 * u; const px = CW / 2 + r * (CW / 2 / 0.7), py = CH / 2 - y * (CH / 2 - 6); i ? g.lineTo(px, py) : g.moveTo(px, py); } for (let i = 40; i >= 0; i--) { const u = i / 40, r = kr(u) * sc, y = -1 + 2 * u; g.lineTo(CW / 2 - r * (CW / 2 / 0.7), CH / 2 - y * (CH / 2 - 6)); } g.closePath(); };
      const steps = 34;
      for (let i = 0; i <= steps; i++) { const d = i / steps; const sc = 1 - d * 0.97; P(sc); g.fillStyle = '#' + colour(T(d)).getHexString(); g.fill(); }
      if (s.heat === 'mw') { // glints at the water droplets
        for (let i = 0; i < 40; i++) { const x = CW / 2 + Math.sin(i * 12.9) * 70, y = 80 + ((i * 97) % 340); if (Math.abs(x - CW / 2) < kr((CH / 2 - y) / (CH / 2) * 0.5 + 0.5) * (CW / 2 / 0.7) * 0.8) { g.fillStyle = 'rgba(98,214,255,' + 0.25 * smooth(s.t * 1.2) + ')'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); } }
      }
      P(1); g.lineWidth = 6; g.strokeStyle = '#d9a441'; g.stroke();
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2 * S * 0.7, 2 * S * (CH / CW) * 0.7 * (CW / CH) * (1 / 0.7) * 0.7 * 1.0), new THREE.MeshBasicMaterial({ map: heat.tex, transparent: true, toneMapped: false }));
    // size the plane so canvas pixels line up with the profile: width spans r = 0.7 * S, height spans y = +/- S
    plane.geometry.dispose(); plane.geometry = new THREE.PlaneGeometry(2 * 0.7 * S, 2 * S * (CH / (CH - 12)));
    plane.position.z = 0.05; k.add(plane);
    stage.label('Kernel, cut open: red is hot', [0, -S - 0.4, 0], k);
    const src = stage.label('', [0, S + 0.55, 0], k, 'lbl-big');
    // popped flakes
    const bg = puffGeo('butterfly', 3, 4), mg = puffGeo('mushroom', 5, 4);
    const bf = new THREE.Mesh(bg, popMat()), mu = new THREE.Mesh(mg, popMat());
    bf.scale.setScalar(1.55); mu.scale.setScalar(1.25);
    root.add(bf, mu);
    const lb = stage.label('Butterfly', [0, -1.7, 0], bf), lm = stage.label('Mushroom', [0, -1.7, 0], mu);
    let key = '', clock = 0;
    return {
      update(dt, st) {
        clock += dt;
        const kk = `${st.heat}|${st.t.toFixed(3)}`;
        if (kk !== key) { key = kk; heat.redraw(); }
        const core = coreT(st.heat, st.t), pop = smooth((core - 176) / 8);
        src.element.innerHTML = st.heat === 'oil' ? 'Heat from the hull inwards' : 'Water heats throughout';
        k.visible = pop < 0.98;
        k.scale.setScalar(1 - 0.0 * pop);
        const showB = st.shape !== 'mushroom', showM = st.shape !== 'butterfly', both = st.shape === 'both';
        bf.visible = showB && pop > 0.01; mu.visible = showM && pop > 0.01;
        lb.visible = bf.visible; lm.visible = mu.visible;
        const s0 = pop;
        bf.position.set(both ? 1.3 : 2.4, 1.6 + 0.5 * Math.sin(clock * 0.9), 0); mu.position.set(both ? 4.4 : 2.4, 1.4 + 0.5 * Math.sin(clock * 0.9 + 1), 0);
        bf.scale.setScalar(Math.max(0.001, 1.55 * s0)); mu.scale.setScalar(Math.max(0.001, 1.25 * s0));
        bf.rotation.y = clock * 0.45; mu.rotation.y = -clock * 0.4; bf.rotation.x = 0.35;
      },
      readout(st) {
        const core = coreT(st.heat, st.t), surf = temps(st.heat, st.t)(0), popped = core >= 178;
        const sh = SHAPES[st.shape];
        return `<div class="big">${popped ? 'Popped' : HEATS[st.heat].n}</div><p class="r-say">${popped ? sh.say : HEATS[st.heat].say}</p>
          <div class="row"><span>Hull temperature</span><b>${surf.toFixed(0)} °C</b></div>
          <div class="row"><span>Middle of kernel</span><b>${core.toFixed(0)} °C</b></div>
          <div class="row"><span>Pops when the middle reaches</span><b>about 180 °C</b></div>`;
      },
    };
  },
};
