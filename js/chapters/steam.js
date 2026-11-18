// Chapter 2: heat, steam and pressure. Water in a sealed kernel can only boil if the pressure lets it, so as the
// kernel heats the water becomes superheated and the pressure climbs. We use the vapour pressure of water
// (Clausius-Clapeyron, constant latent heat 40.66 kJ/mol, within a few percent of steam tables for 100-200 C) and
// a thin-sphere hull model, stress = p R / (2 e), with Virot & Ponomarenko 2015 numbers (R 3.1 mm, e 160 um,
// ultimate strength about 10 MPa), which gives a pop near 180 C and about 10 atm. Virot measured a critical
// temperature of about 180 C and a critical pressure of about 10 bar; the Popcorn Board quotes about 135 psi and
// 347 F. All of these are approximate. In their oven tests 34% of kernels popped at 170 C and 96% at 180 C, and
// the curve drawn here is a normal curve fitted to those two points only.
import { THREE, M, COL, makeKernel, vaporAtm, pcAtm, tcOf, poppedFrac, HULL, clamp, lerp, smooth, panel, FONT } from '../pop.js';
import { canvasTexture } from '../kit.js';

const T0 = 20, T1 = 220, P1 = 16;

export default {
  id: 'steam',
  short: 'Heat and pressure',
  title: 'Heat, steam and pressure',
  subtitle: 'The water cannot boil away, so it builds pressure instead.',
  view: { pos: [0.6, 1.2, 12.8], target: [0.4, 0.9, 0] },
  learn: `<p>In an open pan, water boils at 100 °C and the steam just leaves. Inside a popcorn kernel the hull is sealed. As the kernel heats, the water has nowhere to go, so it stays liquid well above 100 °C and the <b>pressure</b> of its steam climbs, steeply. At 150 °C it is about 4.7 atmospheres. At 180 °C it is about 10.</p>
    <p>The hull is only about 0.16 mm thick, but it is strong. Treat it as a thin balloon: the stress in its wall is <b>pressure times radius, divided by twice the thickness</b>. With a hull strength near 10 MPa, that fails at about <b>10 atmospheres</b>, which is the pressure of steam at about <b>180 °C</b>. Careful measurements by Virot and Ponomarenko (2015) found the same thing: about 180 °C and about 10 bar. The Popcorn Board quotes about 135 psi, which is just over 9 atmospheres.</p>
    <p class="tip"><b>Try it:</b> raise the temperature and watch the dot climb the curve. Then thin or thicken the hull and see where the pop moves. The orange curve is the share of real kernels that popped in Virot’s oven tests.</p>
    <p class="note">The curve is a simple model through published numbers, not a measurement. Real kernels vary: in the oven, 34% had popped at 170 °C and 96% at 180 °C.</p>`,
  terms: [
    { t: 'Vapour pressure', d: 'The pressure of steam in balance with liquid water at a given temperature. It rises very steeply with temperature.' },
    { t: 'Superheated water', d: 'Liquid water held above 100 °C because pressure stops it boiling away.' },
    { t: 'Atmosphere (atm)', d: 'The pressure of the air around us, about 101 kPa. Ten atmospheres is about 147 pounds per square inch.' },
    { t: 'Hull strength', d: 'The stress the hull wall can carry before it breaks. Virot and Ponomarenko estimated about 10 MPa.' },
  ],
  defaults: { T: 60, e: 160, play: false },
  controls: [
    { key: 'T', type: 'range', label: 'Kernel temperature', min: T0, max: T1, step: 0.5, fmt: (v) => `${v.toFixed(0)} °C` },
    { key: 'e', type: 'range', label: 'Hull thickness', min: 100, max: 220, step: 1, fmt: (v) => `${v.toFixed(0)} µm`, hint: 'Virot and Ponomarenko measured 160 ± 40 µm.' },
    { key: 'play', type: 'toggle', label: 'Heat it up' },
  ],
  quiz: [
    { q: 'Why does the water inside a kernel stay liquid above 100 °C?', options: ['It is salty', 'The sealed hull keeps the pressure high', 'Starch absorbs heat', 'It is not water'], answer: 1, why: 'Pressure raises the boiling point. The sealed hull holds the steam in, so the pressure rises with the temperature.' },
    { q: 'At about what temperature do kernels typically pop?', options: ['About 100 °C', 'About 180 °C', 'About 400 °C', 'About 50 °C'], answer: 1, why: 'Virot and Ponomarenko measured about 180 °C. In their oven, 34% had popped at 170 °C and 96% at 180 °C.' },
    { q: 'About how much pressure does the hull hold before it fails?', options: ['1 atmosphere', 'About 3 atmospheres', 'About 10 atmospheres', 'About 100 atmospheres'], answer: 2, why: 'About 10 atmospheres (10 bar), matching the pressure of steam at about 180 °C.' },
  ],
  reel: [
    { ms: 5400, caption: 'Heat the sealed kernel and its water cannot boil away. The pressure climbs instead.', set: { T: 40, e: 160, play: false }, anim: { T: [40, 150] }, view: { pos: [0.8, 1.4, 17], target: [1.2, 0.8, 0] }, spin: 0 },
    { ms: 5000, caption: 'At about 180 °C the steam reaches about 10 atmospheres, and the hull gives way.', set: { T: 150, e: 160, play: false }, anim: { T: [150, 190] }, view: { pos: [0.8, 1.4, 17], target: [1.2, 0.8, 0] }, spin: 0 },
  ],
  build({ stage, s }) {
    stage.floor.visible = false;
    stage.renderer.localClippingEnabled = true;
    const root = new THREE.Group(); stage.root.add(root);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const K = makeKernel(1.9, { clip: plane });
    K.position.set(-4.3, -0.6, 0); root.add(K);
    const vap = K.parts.drops.map((d) => {
      const v = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M.ghost(COL.steam, 0.4, { clippingPlanes: [plane] }));
      v.position.copy(d.position); K.add(v); return v;
    });
    // pressure dial
    const dial = new THREE.Group(); dial.position.set(-4.3, 2.7, 0); root.add(dial);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 48), M.plastic(0x0d0f16, { roughness: 0.5 })); face.rotation.x = Math.PI / 2; dial.add(face);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.06, 10, 64), M.metal(0xb9bec8)); dial.add(rim);
    const needle = new THREE.Group(); const nb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.82, 0.04), M.glow(0xffb547)); nb.position.y = 0.41; needle.add(nb); needle.position.z = 0.1; dial.add(needle);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16), M.metal()); hub.rotation.x = Math.PI / 2; hub.position.z = 0.1; dial.add(hub);
    for (let i = 0; i <= 8; i++) {
      const a = lerp(-2.36, 2.36, i / 8);
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.03, i % 2 ? 0.08 : 0.14, 0.02), M.glow(i >= 5 ? 0xff7a59 : 0xa8aebf));
      tick.position.set(-Math.sin(a) * 0.86, Math.cos(a) * 0.86, 0.07); tick.rotation.z = a; dial.add(tick);
    }
    const dialLbl = stage.label('', [0, -1.35, 0], dial, 'lbl-big');
    stage.label('Kernel, cut open', [0, -2.35, 0], K);
    // chart
    const W = 1400, H = 900;
    const X = (T) => 110 + ((T - T0) / (T1 - T0)) * 1130, Y = (p) => 790 - (p / P1) * 660, Y2 = (f) => 790 - f * 660;
    const pcOfS = () => pcAtm(s.e, HULL.sigma, HULL.R);
    const chart = canvasTexture(W, H, (g) => {
      panel(g, W, H);
      const pc = pcOfS(), Tc = tcOf(pc);
      g.font = FONT(500, 26); g.fillStyle = '#a8aebf'; g.fillText('Steam pressure inside the kernel (atm) against temperature (°C)', 110, 62);
      g.font = FONT(400, 21);
      for (let p = 0; p <= P1; p += 4) { g.fillStyle = '#737a8e'; g.fillText(String(p), 62, Y(p) + 7); g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2; g.beginPath(); g.moveTo(110, Y(p)); g.lineTo(1240, Y(p)); g.stroke(); }
      for (let T = 40; T <= 220; T += 20) { g.fillStyle = '#737a8e'; g.fillText(String(T), X(T) - 14, 826); g.strokeStyle = 'rgba(255,255,255,.05)'; g.beginPath(); g.moveTo(X(T), 790); g.lineTo(X(T), 130); g.stroke(); }
      for (const f of [0, 0.5, 1]) { g.fillStyle = '#ffb547'; g.fillText(`${f * 100}%`, 1252, Y2(f) + 7); }
      g.save(); g.translate(1330, 460); g.rotate(-Math.PI / 2); g.font = FONT(500, 21); g.fillStyle = '#ffb547'; g.textAlign = 'center'; g.fillText('share of kernels popped (oven tests)', 0, 0); g.restore();
      // boiling point marker
      g.fillStyle = '#737a8e'; g.font = FONT(400, 20); g.fillText('open pan: boils at 100 °C (1 atm)', X(100) + 8, Y(1) - 14);
      // hull limit
      g.setLineDash([14, 10]); g.strokeStyle = '#ff7a59'; g.lineWidth = 3; g.beginPath(); g.moveTo(110, Y(pc)); g.lineTo(1240, Y(pc)); g.stroke();
      g.beginPath(); g.moveTo(X(Tc), 790); g.lineTo(X(Tc), Y(pc)); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ff7a59'; g.font = FONT(600, 22); g.fillText(`Hull fails at about ${pc.toFixed(1)} atm`, 130, Y(pc) - 14);
      g.fillText(`≈ ${Tc.toFixed(0)} °C`, X(Tc) + 10, 770);
      // oven curve (fit) and the two measurements
      g.strokeStyle = 'rgba(255,181,71,.7)'; g.lineWidth = 4; g.beginPath();
      for (let T = T0; T <= T1; T += 1) { const x = X(T), y = Y2(poppedFrac(T)); T === T0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      for (const [T, f] of [[170, 0.34], [180, 0.96]]) { g.fillStyle = '#0b0c10'; g.strokeStyle = '#ffb547'; g.lineWidth = 4; g.beginPath(); g.arc(X(T), Y2(f), 10, 0, 7); g.fill(); g.stroke(); }
      g.fillStyle = '#ffb547'; g.font = FONT(400, 19); g.fillText('measured: 34% at 170 °C', X(170) - 250, Y2(0.34) + 6); g.fillText('96% at 180 °C', X(180) - 190, Y2(0.96) + 6);
      // pressure curve
      g.strokeStyle = 'rgba(142,240,255,.35)'; g.lineWidth = 5; g.beginPath();
      for (let T = T0; T <= T1; T += 1) { const x = X(T), y = Y(Math.min(P1, vaporAtm(T))); T === T0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.strokeStyle = '#8ef0ff'; g.lineWidth = 6; g.beginPath();
      for (let T = T0; T <= s.T; T += 1) { const x = X(T), y = Y(Math.min(P1, vaporAtm(T))); T === T0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      const px = X(s.T), py = Y(Math.min(P1, vaporAtm(s.T)));
      g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 14, 0, 7); g.fill(); g.fillStyle = vaporAtm(s.T) >= pc ? '#ff7a59' : '#8ef0ff'; g.beginPath(); g.arc(px, py, 9, 0, 7); g.fill();
      g.fillStyle = '#8ef0ff'; g.font = FONT(500, 22); g.fillText('steam pressure', X(60), Y(vaporAtm(60)) - 70);
    });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 8.6 * H / W), new THREE.MeshBasicMaterial({ map: chart.tex, transparent: true, toneMapped: false }));
    plate.position.set(2.4, 0.15, 0); root.add(plate);
    let key = '', clock = 0, popped = false;
    return {
      update(dt, st) {
        clock += dt;
        if (st.play) { st.T += dt * 14; if (st.T >= T1) { st.T = T1; st.play = false; } }
        const pc = pcAtm(st.e, HULL.sigma, HULL.R), P = vaporAtm(st.T), ratio = clamp(P / pc, 0, 1.4);
        const k = `${st.T.toFixed(2)}|${st.e.toFixed(1)}`;
        if (k !== key) { key = k; chart.redraw(); }
        // kernel: warms from yellow to orange, the hull glows with stress
        const heat = clamp((st.T - 20) / 160, 0, 1);
        K.parts.hullM.color.setHex(COL.hull).lerp(new THREE.Color(COL.hot), heat * 0.45);
        K.parts.hullM.emissive.setHex(0xff3a10); K.parts.hullM.emissiveIntensity = smooth(ratio) * 1.2;
        K.parts.hullM.opacity = 0.34 + 0.2 * smooth(ratio);
        const shake = ratio > 0.85 ? (ratio - 0.85) * 0.12 : 0;
        K.position.x = -4.3 + Math.sin(clock * 90) * shake; K.position.y = -0.6 + Math.cos(clock * 77) * shake;
        const g = smooth((st.T - 100) / 90);
        K.parts.drops.forEach((d, i) => {
          const r = d.userData.r; d.visible = i < 46;
          d.scale.setScalar(r * (1 - 0.35 * g));
          vap[i].visible = d.visible && g > 0.01;
          vap[i].scale.setScalar(r * (1 + 9 * g * (0.5 + 0.5 * ratio)));
        });
        needle.rotation.z = -lerp(-2.36, 2.36, clamp(P / 16, 0, 1));
        dialLbl.element.innerHTML = `<b>${P.toFixed(1)} atm</b>`;
        popped = P >= pc;
      },
      readout(st) {
        const pc = pcAtm(st.e, HULL.sigma, HULL.R), P = vaporAtm(st.T), Tc = tcOf(pc);
        const state = P >= pc ? '<b class="no">Hull fails: the pop!</b>' : P > pc * 0.8 ? '<b class="ok">Nearly there</b>' : '<b>Hull holds</b>';
        return `<div class="big">${st.T.toFixed(0)} °C</div><p class="r-say">${st.T < 100 ? 'Below boiling. Water just warms up.' : P < pc ? 'Above 100 °C, still liquid. The pressure is rising fast.' : 'The steam pressure is now more than the hull can hold.'}</p>
          <div class="row"><span>Steam pressure</span><b>${P.toFixed(1)} atm (${(P * 14.696).toFixed(0)} psi)</b></div>
          <div class="row"><span>Hull limit</span><b>${pc.toFixed(1)} atm</b></div>
          <div class="row"><span>Predicted pop</span><b>about ${Tc.toFixed(0)} °C</b></div>
          <div class="row"><span>Oven tests: popped by now</span><b>${Math.round(poppedFrac(st.T) * 100)}%</b></div>
          <div class="row"><span>State</span>${state}</div>`;
      },
    };
  },
};
