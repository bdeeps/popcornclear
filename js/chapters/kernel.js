// Chapter 1: inside a kernel. Popcorn (Zea mays everta) has three parts like any grain: the hull (pericarp),
// the endosperm (hard and soft starch) and the germ. Sources: Popcorn Board, "From Seed to Snack" and "Corny
// Facts" (three parts, hull is cellulose, popcorn has a thicker hull, 13.5-14% moisture, popcorn is a flint corn);
// Virot & Ponomarenko 2015 (radius 3.1 mm, mass 172 mg, hull 160 um thick, about 20 mg of water per kernel);
// Hamaker et al. 2005 as reported by Live Science (the hull's cellulose structure locks moisture in). The droplets
// are drawn for effect: the real water sits in tiny pockets and bound to the starch, not as visible beads.
import { THREE, M, COL, makeKernel } from '../pop.js';

const LAYERS = {
  all: { n: 'Whole kernel', say: 'Three parts, like any grain: the hull on the outside, a big store of starch, and a small germ. Add about 13.5 to 14 percent water and you have popcorn.', rows: [['Radius', 'about 3.1 mm'], ['Mass', 'about 170 mg'], ['Water', 'about 20 mg']] },
  hull: { n: 'Hull (pericarp)', say: 'A thin skin made largely of cellulose. In popcorn it is tough and tightly sealed, so water stays in and steam cannot leak out as the kernel heats.', rows: [['Thickness', 'about 160 µm'], ['Strength', 'about 10 MPa'], ['Made of', 'mostly cellulose']] },
  starch: { n: 'Starch (endosperm)', say: 'The kernel’s food store: hard starch round the outside and soft starch in the middle, with the water held in it. This is the stuff that turns into fluff.', rows: [['Hard starch', 'outer layer'], ['Soft starch', 'centre'], ['Goes on to become', 'the white flake']] },
  germ: { n: 'Germ (embryo)', say: 'The living part, which would grow into a new plant. The starch is its packed lunch. It does not do the popping.', rows: [['Job', 'grows a new plant'], ['Size', 'small, near the base'], ['Role in popping', 'none']] },
  water: { n: 'Water', say: 'Popcorn needs about 13.5 to 14 percent moisture. Too dry and there is too little steam. The water is held inside the starch, sealed in by the hull.', rows: [['Ideal moisture', '13.5 to 14%'], ['Per kernel', 'about 20 mg'], ['Where', 'inside the starch']] },
};

export default {
  id: 'kernel',
  short: 'Inside a kernel',
  title: 'Inside a popcorn kernel',
  subtitle: 'A tough hull, a store of starch and a few drops of water.',
  view: { pos: [1.2, 1.2, 8.2], target: [-1.6, 0, 0] },
  learn: `<p>Every kernel is a tiny sealed pressure vessel. Cut one open and you find the same three parts as any grain. The <b>hull</b> (the pericarp) is the skin. The <b>endosperm</b> is the starch inside, hard on the outside and soft in the middle. The <b>germ</b> is the little living embryo.</p>
    <p>Popcorn is a special kind of corn, <b>Zea mays everta</b>. Plenty of corn has these same parts, but only popcorn pops. Its hull is thicker and tightly packed, so it holds water in and pressure builds before it gives way. The kernel needs about <b>13.5 to 14 percent water</b> to do this well. That is only about 20 milligrams in a kernel.</p>
    <p class="tip"><b>Try it:</b> pick a layer to highlight it, then slide the moisture. Switch the cutaway off to see the kernel from outside.</p>
    <p class="note">The blue beads are drawn so you can see where the water is. In a real kernel it is spread through the starch in tiny pockets.</p>`,
  terms: [
    { t: 'Hull (pericarp)', d: 'The kernel’s outer skin, made largely of cellulose.' },
    { t: 'Endosperm', d: 'The starchy store of food inside the hull. It makes up most of the kernel.' },
    { t: 'Germ', d: 'The embryo of the new plant, tucked into the base of the kernel.' },
    { t: 'Zea mays everta', d: 'The type of maize (corn) that pops. Other types, like sweet corn, will not.' },
  ],
  defaults: { layer: 'all', moisture: 14, cut: true },
  controls: [
    { key: 'layer', type: 'seg', label: 'Highlight', options: Object.entries(LAYERS).map(([v, l]) => ({ v, label: l.n.split(' (')[0].replace('Whole kernel', 'All') })) },
    { key: 'moisture', type: 'range', label: 'Moisture', min: 4, max: 20, step: 0.1, fmt: (v) => `${v.toFixed(1)}%`, hint: 'Popcorn Board: 13.5 to 14% for the best popping.' },
    { key: 'cut', type: 'toggle', label: 'Cutaway' },
  ],
  quiz: [
    { q: 'Which part of the kernel is the starchy food store?', options: ['The hull', 'The endosperm', 'The germ', 'The tip'], answer: 1, why: 'The endosperm is the starch. It is also the part that puffs up into the white flake.' },
    { q: 'About how much water does a kernel need to pop well?', options: ['2%', '13.5 to 14%', '30%', '50%'], answer: 1, why: 'The Popcorn Board gives 13.5 to 14 percent. That is only about 20 mg of water in each kernel.' },
    { q: 'What sets popcorn apart from other types of corn?', options: ['A thicker, tightly packed hull', 'More sugar', 'A bigger germ', 'No hull at all'], answer: 0, why: 'The hull holds water in and lets pressure build before it ruptures. There is no hull-less popcorn.' },
  ],
  reel: [
    { ms: 4800, caption: 'A kernel is a sealed capsule: tough hull, starch inside, and a few drops of water.', set: { layer: 'all', cut: true }, anim: { moisture: [8, 14] }, view: { pos: [2.0, 1.1, 7.6], target: [-1.4, 0, 0] }, spin: 0.6 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    stage.renderer.localClippingEnabled = true;
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const K = makeKernel(2.2, { clip: plane });
    K.position.y = 0.1;
    stage.root.add(K);
    const P = K.parts;
    stage.label('Hull: thin, tough, sealed', [0.85 * 2.2, 0.35 * 2.2, 0], K);
    stage.label('Soft starch', [0.12 * 2.2, 0.25 * 2.2, 0], K);
    stage.label('Hard starch', [-0.52 * 2.2, 0.55 * 2.2, 0], K);
    stage.label('Germ', [-0.62 * 2.2, -0.52 * 2.2, 0], K);
    stage.label('Water', [0.3 * 2.2, -0.55 * 2.2, 0], K);
    let clock = 0;
    return {
      update(dt, st) {
        clock += dt;
        plane.constant = st.cut ? 0 : 100;
        P.cut.visible = st.cut;
        const L = st.layer;
        const on = (x) => L === 'all' || L === x;
        const set = (m, a) => { m.material.opacity = a; };
        set(P.f1, on('hull') ? 0.95 : 0.25);
        set(P.f2, on('starch') ? 0.9 : 0.22);
        set(P.f3, on('starch') ? 0.95 : 0.22);
        set(P.germ, on('germ') ? 1 : 0.28);
        P.hullM.opacity = on('hull') ? 0.4 : 0.1;
        P.hardM.opacity = on('starch') ? 0.3 : 0.08;
        P.hullM.emissive.setHex(L === 'hull' ? 0x4a3000 : 0x000000);
        const n = Math.round(70 * Math.min(1, Math.max(0, (st.moisture - 4) / 16)));
        P.drops.forEach((d, i) => {
          d.visible = i < n;
          const w = on('water') ? 1 : 0.35;
          d.material.opacity = w;
          const r = d.userData.r * (1 + 0.08 * Math.sin(clock * 2 + d.userData.k * 6));
          d.scale.setScalar(L === 'water' ? r * 1.4 : r);
        });
      },
      readout(st) {
        const l = LAYERS[st.layer];
        const mo = st.moisture, tag = mo < 12 ? 'no' : mo <= 15 ? 'ok' : 'no';
        const note = mo < 12 ? 'Too dry: not enough steam' : mo <= 15 ? 'In the sweet spot' : 'Too wet: pops small and chewy';
        return `<div class="big">${l.n}</div><p class="r-say">${l.say}</p>
          ${l.rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
          <div class="row"><span>Moisture</span><b class="${tag}">${mo.toFixed(1)}% · ${note}</b></div>`;
      },
    };
  },
};
