// Chapter 3: the burst. Order of events, from Virot & Ponomarenko 2015 (J R Soc Interface 12:20141247), filmed at
// 2,900 frames a second on a 350 C hot plate: the hull fractures and the starch expands within about 7 ms, a
// "leg" of starch is pressed on the plate by about 14 ms, and the piece jumps at about 21 ms. The jump comes from
// that leg, not from steam jetting out. The pop SOUND begins about 6 ms after a second fracture and before the
// jump; the authors rule out the rebound and most crackling, and favour the release of water vapour exciting the
// cavity (their word: consistent with their observations, not proven). A popped piece was about twice the radius
// (3.1 to 6.5 mm) and eight times less dense, so about 9 times the volume. The Popcorn Board says a kernel swells
// 40-50 times; the two numbers are not measured the same way, so both are stated. The animation is a drawing of
// that sequence, not a simulation.
import { THREE, M, COL, kernelGeo, profile, puffGeo, popMat, clamp, lerp, smooth, panel, FONT } from '../pop.js';
import { canvasTexture } from '../kit.js';

const STAGES = [
  { at: 0, n: 'Heating, ~10 atm', say: 'The water is superheated and the steam pressure is near what the hull can bear. Inside, the starch is turning into a hot, gel-like mass.' },
  { at: 0.15, n: 'Hull cracks (0 ms)', say: 'The hull splits and the pressure drops almost at once. The water flashes to steam, and the hot gel starts to foam out.' },
  { at: 0.35, n: 'Starch foams out (about 7 ms)', say: 'The superheated starch puffs up like a foam as the pressure falls. Vapour streams out through the opening.' },
  { at: 0.55, n: 'The leg presses down (about 14 ms)', say: 'A leg of starch is squeezed out underneath. It pushes against whatever the kernel sits on and gets compressed.' },
  { at: 0.75, n: 'Jump (about 21 ms)', say: 'The leg springs back and the kernel leaps, spinning like a gymnast. In the film, the jump comes from the leg, not from a jet of steam.' },
  { at: 0.88, n: 'In the air: the foam sets', say: 'The foam cools in a fraction of a second and sets, trapping the bubbles. Gelatinised starch plus air makes the white, crisp flake.' },
];
const stageOf = (p) => { let k = 0; STAGES.forEach((s, i) => { if (p >= s.at) k = i; }); return k; };
const msOf = (p) => (p < 0.15 ? null : (p - 0.15) / 0.6 * 21);
const pressureOf = (p) => (p < 0.15 ? lerp(8.6, 10.2, p / 0.15) : 1 + 9.2 * Math.exp(-(p - 0.15) / 0.045));
const FOAM = (p) => smooth((p - 0.15) / 0.3);
const legOf = (p) => (p < 0.3 ? 0 : p < 0.5 ? 0.55 * smooth((p - 0.3) / 0.2) : p < 0.65 ? lerp(0.55, 0.25, smooth((p - 0.5) / 0.15)) : p < 0.75 ? lerp(0.25, 0.6, smooth((p - 0.65) / 0.1)) : 0.6);

export default {
  id: 'burst',
  short: 'The burst',
  title: 'The burst',
  subtitle: 'The hull cracks, the pressure collapses and the starch foams out.',
  view: { pos: [2.6, 2.8, 10.5], target: [1.1, 1.8, 0] },
  learn: `<p>When the hull gives way, the pressure inside collapses in a few thousandths of a second. The superheated water flashes into steam and the hot, gel-like starch <b>foams</b> out, rather like a shaken fizzy drink. The foam swells and then <b>cools and sets</b>, trapping its bubbles. That is the white flake.</p>
    <p>How big? Virot and Ponomarenko measured pieces about <b>twice the radius</b> and eight times less dense, so around nine times the volume. The Popcorn Board says a kernel swells to <b>40 to 50 times</b> its size. The two numbers do not measure quite the same thing, so both are given here.</p>
    <p>The <b>jump</b> and the <b>pop</b> are different things. In high-speed film the jump comes from a <b>leg of starch</b> that squeezes out, pushes on the surface and springs. The loud pop is probably the <b>release of water vapour</b>, and it comes before the jump. The authors say that is the best fit to what they saw, not a proof.</p>
    <p class="tip"><b>Try it:</b> drag the slider to step through the pop, or press Play for slow motion. The chart shows the pressure.</p>`,
  terms: [
    { t: 'Gelatinisation', d: 'Starch grains swell and burst in hot water and turn into a soft gel. This happens inside the kernel as it heats.' },
    { t: 'Flash steam', d: 'Water that suddenly turns to steam when the pressure on it drops.' },
    { t: 'Starch leg', d: 'The first lump of starch squeezed out of the cracked hull. It pushes on the surface and launches the kernel.' },
    { t: 'Foam', d: 'A mass of gas bubbles in a liquid or soft solid. Cooling makes popcorn’s foam set hard.' },
  ],
  defaults: { p: 0.05, play: false },
  controls: [
    { key: 'p', type: 'range', label: 'Moment', min: 0, max: 1, step: 0.002, fmt: (v) => { const m = msOf(v); return `${STAGES[stageOf(v)].n.split(' (')[0].split(',')[0]}${m !== null && v < 0.75 ? ` · ${m.toFixed(0)} ms` : ''}`; } },
    { key: 'play', type: 'toggle', label: 'Play in slow motion' },
  ],
  quiz: [
    { q: 'In high-speed film, what makes a popping kernel jump?', options: ['A jet of steam like a rocket', 'A leg of starch pressing on the surface', 'The hull springing open', 'Air in the pan'], answer: 1, why: 'Virot and Ponomarenko saw a leg of starch squeezed out, compressed against the plate, and then springing back. They saw no rocket-like jet.' },
    { q: 'What do the researchers think makes the “pop” sound?', options: ['The hull snapping like a twig', 'Water vapour being released', 'The kernel hitting the pan', 'Oil boiling'], answer: 1, why: 'The sound starts before the jump, so it is not the landing. Their best fit is the release of water vapour, though they stop short of calling it proven.' },
    { q: 'What happens to the starch foam after it expands?', options: ['It stays liquid', 'It cools and sets, trapping bubbles', 'It turns back to a kernel', 'It evaporates'], answer: 1, why: 'The foam cools very fast and sets, which gives popcorn its light, crisp structure.' },
  ],
  reel: [
    { ms: 5600, caption: 'When the hull cracks, the pressure collapses and the hot starch foams out in about seven thousandths of a second.', set: { p: 0.1, play: false }, anim: { p: [0.1, 0.45] }, view: { pos: [2.4, 3.0, 13], target: [1.8, 2.4, 0] }, spin: 0 },
    { ms: 5000, caption: 'A leg of starch pushes off the pan and the kernel leaps, spinning. The foam sets as it cools.', set: { p: 0.45, play: false }, anim: { p: [0.45, 1] }, view: { pos: [2.4, 3.6, 15], target: [1.8, 3.0, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    const root = new THREE.Group(); stage.root.add(root);
    // hot plate
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.3, 64), M.metal(0x4a4d56, { roughness: 0.5 })); plate.position.y = -0.15; root.add(plate);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(3.3, 64), new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.25, toneMapped: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = 0.003; root.add(glow);
    stage.label('Hot plate (the researchers used 350 °C)', [-2.2, 0.2, 2.6], root);
    // body
    const S = 0.85;
    const body = new THREE.Group(); root.add(body);
    const whole = new THREE.Group(); body.add(whole);
    whole.add(new THREE.Mesh(kernelGeo(S, 0), M.clear(COL.hull, 0.55, { roughness: 0.3 })), new THREE.Mesh(kernelGeo(S, 0.05), M.clear(COL.hard, 0.6)));
    const halfGeo = (a0) => { const pts = profile(S, 40, 0).map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y)); const g = new THREE.LatheGeometry(pts, 20, a0, Math.PI); g.computeVertexNormals(); return g; };
    const hullM = M.clear(COL.hull, 0.8, { roughness: 0.35 });
    const hullA = new THREE.Mesh(halfGeo(0), hullM), hullB = new THREE.Mesh(halfGeo(Math.PI), hullM);
    root.add(hullA, hullB);
    const foam = new THREE.Mesh(puffGeo('foam', 4, 4), popMat({ color: 0xf6d38a })); body.add(foam);
    const legM = popMat({ color: 0xf6d38a });
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 1, 18), legM); root.add(leg);
    const steams = Array.from({ length: 9 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M.ghost(COL.steam, 0.4)); root.add(m); m.userData = { a: (i / 9) * 6.28, v: 0.7 + (i % 3) * 0.25 }; return m; });
    // pressure chart
    const W = 1200, H = 760;
    const chart = canvasTexture(W, H, (g) => {
      panel(g, W, H);
      g.font = FONT(500, 26); g.fillStyle = '#a8aebf'; g.fillText('Pressure inside the kernel (atm) through the pop', 70, 56);
      const X = (p) => 90 + p * 1060, Y = (a) => 650 - (a / 11) * 520;
      g.font = FONT(400, 20);
      for (let a = 0; a <= 10; a += 5) { g.fillStyle = '#737a8e'; g.fillText(String(a), 50, Y(a) + 7); g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2; g.beginPath(); g.moveTo(90, Y(a)); g.lineTo(1150, Y(a)); g.stroke(); }
      STAGES.forEach((st, i) => { g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(X(st.at), 130); g.lineTo(X(st.at), 650); g.stroke(); });
      [['crack', 0.15], ['foam', 0.35], ['leg', 0.55], ['jump', 0.75]].forEach(([n, at]) => { g.fillStyle = '#8f95a8'; g.fillText(n, X(at) + 6, 690); });
      g.fillStyle = '#737a8e'; g.fillText('0 ms', X(0.15) - 16, 724); g.fillText('7', X(0.35) - 4, 724); g.fillText('14', X(0.55) - 8, 724); g.fillText('21 ms', X(0.75) - 20, 724);
      g.strokeStyle = 'rgba(142,240,255,.3)'; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 300; i++) { const p = i / 300, x = X(p), y = Y(pressureOf(p)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.strokeStyle = '#8ef0ff'; g.lineWidth = 7; g.beginPath(); for (let i = 0; i <= 300; i++) { const p = i / 300; if (p > s.p) break; const x = X(p), y = Y(pressureOf(p)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      const x = X(s.p), y = Y(pressureOf(s.p)); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fill(); g.fillStyle = '#8ef0ff'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill();
      g.fillStyle = '#ff7a59'; g.font = FONT(600, 22); g.fillText('hull cracks: pressure collapses', X(0.17), Y(9.6) + 6);
      g.fillStyle = '#ffb547'; g.font = FONT(400, 20); g.fillText('The pop sound starts about here, before the jump', X(0.2), 110);
    });
    const cp = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.8 * H / W), new THREE.MeshBasicMaterial({ map: chart.tex, transparent: true, toneMapped: false }));
    cp.position.set(4.3, 3.1, 0); root.add(cp);
    let key = '';
    const gelC = new THREE.Color(0xf6d38a), whiteC = new THREE.Color(COL.pop);
    return {
      update(dt, st) {
        if (st.play) { st.p = Math.min(1, st.p + dt / 14); if (st.p >= 1) st.play = false; }
        const p = st.p, kk = p.toFixed(3);
        if (kk !== key) { key = kk; chart.redraw(); }
        const cracked = p >= 0.15, f = FOAM(p), r = lerp(0.46, 1.17, f);
        whole.visible = !cracked;
        const jig = !cracked ? Math.sin(p * 900) * 0.012 * smooth(p / 0.15) : 0;
        const lg = legOf(p);
        const u = clamp((p - 0.75) / 0.25, 0, 1), h = 4 * u * (1 - u) * 2.1 + (u > 0 ? 0.0 : 0);
        const yBase = cracked ? lerp(0.66, r * 0.88, smooth(f * 1.4)) + lg + h : S;
        body.position.set(jig, yBase, 0);
        body.rotation.z = u * 7 * (u < 1 ? 1 : 1);
        foam.visible = cracked; foam.scale.setScalar(r);
        foam.material.color.copy(gelC).lerp(whiteC, smooth((p - 0.4) / 0.45));
        const bump = 0.4 + 0.6 * f; foam.scale.set(r, r * (0.9 + 0.1 * bump), r);
        // hull halves: swing apart and fall
        const o = smooth((p - 0.15) / 0.3);
        [hullA, hullB].forEach((hm, i) => {
          hm.visible = cracked; const sgn = i ? -1 : 1;
          hm.position.set(sgn * (0.05 + 1.0 * o), lerp(S, 0.28, smooth((p - 0.2) / 0.35)), sgn * 0.0);
          hm.rotation.set(0, 0, -sgn * (0.35 + 1.7 * o));
        });
        // leg
        const legTop = yBase - h - r * 0.62;
        const L = Math.max(0.001, legTop);
        const showLeg = cracked && p > 0.3 && u < 0.05;
        leg.visible = showLeg; leg.scale.set(1, L, 1); leg.position.set(0.18, L / 2, 0); leg.material.color.copy(foam.material.color);
        // steam
        steams.forEach((m) => {
          const k = clamp((p - 0.15) / 0.35, 0, 1);
          m.visible = k > 0 && k < 1;
          m.position.set(Math.cos(m.userData.a) * (0.3 + 1.1 * k * m.userData.v), yBase + 0.3 + 0.9 * k * m.userData.v, Math.sin(m.userData.a) * 0.5 * k);
          m.scale.setScalar(0.12 + 0.3 * k); m.material.opacity = 0.45 * (1 - k);
        });
      },
      readout(st) {
        const p = st.p, i = stageOf(p), ms = msOf(p), P = pressureOf(p), f = FOAM(p);
        const rad = lerp(3.1, 6.5, f), vol = Math.pow(rad / 3.1, 3);
        return `<div class="big">${STAGES[i].n}</div><p class="r-say">${STAGES[i].say}</p>
          <div class="row"><span>Pressure inside</span><b>${P.toFixed(1)} atm</b></div>
          <div class="row"><span>Time since the crack</span><b>${ms === null ? 'not yet' : p < 0.75 ? ms.toFixed(0) + ' ms' : 'over 21 ms'}</b></div>
          <div class="row"><span>This piece: radius</span><b>${rad.toFixed(1)} mm</b></div>
          <div class="row"><span>This piece: volume</span><b>about ${vol.toFixed(0)}×</b></div>
          <div class="row"><span>Popcorn Board</span><b>swells 40 to 50×</b></div>`;
      },
    };
  },
};
