'use strict';
// ============================================================
//  Sección 3.10 : visualización del movimiento en 3D
// ============================================================
function floor3(c, P, x0, x1, y0, y1, z = 0, step = 1, col = '#ffffff14') {
  for (let x = x0; x <= x1 + 1e-9; x += step) line3(c, P, [[x, y0, z], [x, y1, z]], col, 1);
  for (let y = y0; y <= y1 + 1e-9; y += step) line3(c, P, [[x0, y, z], [x1, y, z]], col, 1);
}
function box3(c, P, cx, cy, cz, sx, sy, sz, col) {
  const v = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const d of [-1, 1]) v.push([cx + a * sx / 2, cy + b * sy / 2, cz + d * sz / 2]);
  [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([i, j]) => line3(c, P, [v[i], v[j]], col, 1.5));
  const top = [v[1], v[3], v[7], v[5]].map(p => P(...p)); c.fillStyle = col + '44'; c.beginPath(); top.forEach((q, i) => i ? c.lineTo(...q) : c.moveTo(...q)); c.fill();
}

// ---------------- Listado 3.11: Ball3DApp ----------------
reg({
  id: 'b3d', group: '3.10 Movimiento en tres dimensiones', sec: '3.10', tag: 'L3.11', short: 'Pelota que rebota en 3D (Ball3DApp)',
  title: 'Listado 3.11 · Pelota que rebota en 3D',
  desc: 'Versión en JavaScript de Ball3DApp: una esfera cae desde z = 9 sobre una caja roja y rebota cuando vz < 0 y z < 1. Arrastra la vista para rotarla y usa la rueda para hacer zoom. Se añadió una velocidad horizontal opcional.',
  controls: [
    { id: 'dt', type: 'range', label: 'dt', min: .01, max: .2, step: .01, value: .1 },
    { id: 'z0', type: 'range', label: 'z inicial', min: 2, max: 10, step: .5, value: 9 },
    { id: 'vx', type: 'range', label: 'vx (opcional)', min: -3, max: 3, step: .1, value: 0 },
    { id: 'vy', type: 'range', label: 'vy (opcional)', min: -3, max: 3, step: .1, value: 0 },
    { id: 'trail', type: 'check', label: 'Mostrar estela', value: true, color: COL.a },
  ],
  live: false,
  buttons: [{ label: '▶ Iniciar / Reiniciar', primary: true, fn: 'run' }, { label: '⏸ Pausa', fn: () => stopAnim() }],
  eq: 'z ← z + vz·dt − 4.9·dt²<br>vz ← vz − 9.8·dt<br>si (vz &lt; 0 y z &lt; 1) vz = −vz',
  views: [{ id: 'v1', title: 'Display3DFrame', h: 480, hint: 'Arrastra para rotar · rueda para zoom' }],
  run() {
    const cv = $('v1'), c = cv.getContext('2d'), dt = V('dt');
    let x = 0, y = 0, z = V('z0'), vx = V('vx'), vy = V('vy'), vz = 0, time = 0; const tr = [];
    const draw = () => {
      const P = projector(cv, [0, 0, 4], 34); c.clearRect(0, 0, cv.width, cv.height);
      floor3(c, P, -5, 5, -5, 5, -.5); axes3(c, P, 3, [-5, -5, -.5]);
      box3(c, P, 0, 0, 0, 4, 4, 1, '#ff4d6d');
      if (V('trail') && tr.length > 1) line3(c, P, tr, COL.a + '88', 1.5);
      const sh = P(x, y, .5); c.fillStyle = '#0008'; c.beginPath(); c.ellipse(sh[0], sh[1], 14, 6, 0, 0, 7); c.fill();
      ball3(c, P, [x, y, z], 16, COL.e);
      c.fillStyle = '#e6e9f5'; c.font = '13px JetBrains Mono'; c.textAlign = 'left'; c.fillText(`time = ${time.toFixed(2)}`, 12, 20);
    };
    cv._redraw = draw;
    runLoop(() => {
      time += dt; z = z + vz * dt - 4.9 * dt * dt; vz -= 9.8 * dt;
      if (vz < 0 && z < 1) vz = -vz;
      x += vx * dt; y += vy * dt; if (Math.abs(x) > 5) vx = -vx; if (Math.abs(y) > 5) vy = -vy;
      tr.push([x, y, z]); if (tr.length > 400) tr.shift();
      draw(); S(`z = <b>${z.toFixed(3)}</b><br>vz = <b>${vz.toFixed(3)}</b>`);
    });
  }
});

// ---------------- Problemas 3.15 y 3.16 ----------------
function pitch(o) {
  const th = o.th * deg, L = o.L;
  const ode = new ODE([0, 0, o.z0, o.v0 * Math.cos(th), 0, o.v0 * Math.sin(th), 0], s => {
    const v = Math.hypot(s[3], s[4], s[5]), cd = o.cd, cm = o.cm, [wx, wy, wz] = o.w;
    return [s[3], s[4], s[5],
      -cd * v * s[3] + cm * (wy * s[5] - wz * s[4]),
      -cd * v * s[4] + cm * (wz * s[3] - wx * s[5]),
      -cd * v * s[5] + cm * (wx * s[4] - wy * s[3]) - g, 1];
  });
  const P = integrate(ode, 'RK4', .0005, s => s[0] >= L || s[2] < 0 || s[6] > 5);
  const end = crossing(P, 0, L); if (P[P.length - 1][0] >= L) P[P.length - 1] = end;
  return P;
}
reg({
  id: 'p315', group: '3.10 Movimiento en tres dimensiones', sec: '3.10', tag: 'P3.15–16', short: 'Bolas curvas (Magnus) en 3D',
  title: 'Problemas 3.15 y 3.16 · Bolas curvas y su trayectoria en 3D',
  desc: 'Pelota de béisbol de 149 g lanzada desde z = 1.8 m a 18 m del plato. (b) Sin arrastre ni Magnus: ¿qué ángulo hace que pase a 1.5 m con v₀ = 40 m/s? (c) Con arrastre C_D = 6×10⁻³. (d) Efecto superior ωy = 200 rad/s, C_M = 4×10⁻⁴ (y efecto inferior). (e) Curva a 35 m/s. P3.16: trayectoria en 3D con estela.',
  controls: [
    { id: 'v0', type: 'range', label: 'v₀ (m/s)', min: 20, max: 50, step: .5, value: 40 },
    { id: 'th', type: 'range', label: 'Ángulo inicial (°)', min: -6, max: 10, step: .01, value: 0 },
    { id: 'drag', type: 'check', label: 'Arrastre (C_D = 6×10⁻³)', value: false, color: COL.c },
    { id: 'mag', type: 'check', label: 'Fuerza de Magnus (C_M = 4×10⁻⁴)', value: false, color: COL.f },
    { id: 'wx', type: 'range', label: 'ωx (rad/s)', min: -300, max: 300, step: 10, value: 0 },
    { id: 'wy', type: 'range', label: 'ωy (rad/s) — +: efecto superior', min: -300, max: 300, step: 10, value: 0 },
    { id: 'wz', type: 'range', label: 'ωz (rad/s) — curva lateral', min: -300, max: 300, step: 10, value: 0 },
    { id: 'tgt', type: 'range', label: 'Altura objetivo en el plato (m)', min: .5, max: 2, step: .05, value: 1.5 },
  ],
  buttons: [{ label: '⚾ Lanzar', primary: true, fn: 'run' }, { label: '🎯 Ángulo para la altura objetivo', fn: m => m.aim() },
  { label: '(b)', fn: m => { setVals({ v0: 40, drag: false, mag: false, wx: 0, wy: 0, wz: 0 }, false); m.aim(); } },
  { label: '(c)', fn: m => { setVals({ v0: 40, drag: true, mag: false, wx: 0, wy: 0, wz: 0 }, false); m.aim(); } },
  { label: '(d) superior', fn: () => setVals({ drag: true, mag: true, wy: 200, wx: 0, wz: 0 }) },
  { label: '(d) inferior', fn: () => setVals({ drag: true, mag: true, wy: -200, wx: 0, wz: 0 }) },
  { label: '(e) curva', fn: m => { setVals({ v0: 35, drag: true, mag: true, wx: 0, wy: 0, wz: 200 }, false); m.aim(); } }],
  eq: 'dvx/dt = −C_D v vx + C_M(ωy vz − ωz vy)<br>dvy/dt = −C_D v vy + C_M(ωz vx − ωx vz)<br>dvz/dt = −C_D v vz + C_M(ωx vy − ωy vx) − g',
  views: [
    { id: 'v3', title: 'P3.16 · Trayectoria en 3D (estela)', h: 420, hint: 'Arrastra para rotar · rueda para zoom' },
    { id: 'v1', title: 'Vista lateral z(x): con fuerzas (sólida) · sin fuerzas (punteada)', half: true, w: 440, h: 280 },
    { id: 'v2', title: 'Vista superior: desviación lateral y(x)', half: true, w: 440, h: 280 },
  ],
  opts() { return { v0: V('v0'), th: V('th'), z0: 1.8, L: 18, cd: V('drag') ? 6e-3 : 0, cm: V('mag') ? 4e-4 : 0, w: [V('wx'), V('wy'), V('wz')] }; },
  aim() {
    const o = this.opts(), tgt = V('tgt'); let a = -10, b = 15;
    const f = th => { const P = pitch({ ...o, th }); const e = P[P.length - 1]; return (e[0] >= o.L - 1e-6 ? e[2] : -10) - tgt; };
    for (let i = 0; i < 40; i++) { const m = (a + b) / 2; f(m) > 0 ? b = m : a = m; }
    setVals({ th: ((a + b) / 2).toFixed(2) });
  },
  run(anim) {
    const o = this.opts(), P = pitch(o), R = pitch({ ...o, cd: 0, cm: 0 }), e = P[P.length - 1], er = R[R.length - 1];
    const T = e[6], cv = $('v3'), c = cv.getContext('2d');
    let fr = 1;
    const draw3 = () => {
      const pr = projector(cv, [9, 0, 1.2], 30, { yaw: -0.5, pitch: 0.3 }); c.clearRect(0, 0, cv.width, cv.height);
      floor3(c, pr, 0, 18, -3, 3, 0, 1);
      line3(c, pr, [[18, -.22, 0], [18, .22, 0]], '#fff', 4);
      box3(c, pr, 18, 0, .8, .02, .43, .6, COL.c);
      line3(c, pr, [[0, 0, 0], [0, 0, 1.8]], '#ffffff55', 1, [3, 3]);
      const n = Math.max(2, Math.floor(P.length * fr)), pts = thin(P.slice(0, n), 600);
      line3(c, pr, thin(R, 400).map(s => [s[0], s[1], s[2]]), '#ffffff44', 1.2, [4, 4]);
      line3(c, pr, pts.map(s => [s[0], s[1], 0]), '#00000088', 3);
      line3(c, pr, pts.map(s => [s[0], s[1], s[2]]), COL.b, 2.5);
      const q = P[n - 1]; ball3(c, pr, [q[0], q[1], q[2]], 7, '#ffffff');
      axes3(c, pr, 2, [0, -3, 0]);
    };
    cv._redraw = draw3;
    const draw = f => {
      fr = f; draw3();
      const n = Math.max(2, Math.floor(P.length * f)), pp = thin(P.slice(0, n));
      plot($('v1'), [{ pts: thin(R).map(s => [s[0], s[2]]), color: '#ffffff77', dash: [5, 4], width: 1.2, label: 'sin arrastre ni Magnus' }, { pts: pp.map(s => [s[0], s[2]]), color: COL.b, label: 'trayectoria' }, { pts: [[18, .5], [18, 1.1]], color: COL.c, width: 6, label: 'zona de strike aprox.' }], { xmin: 0, xmax: 18.5, ymin: 0, ymax: 2.6, xlabel: 'x (m)', ylabel: 'z (m)', legend: 'left' });
      plot($('v2'), [{ pts: [[0, 0], [18, 0]], color: '#ffffff44', dash: [4, 4], width: 1 }, { pts: pp.map(s => [s[0], s[1]]), color: COL.f, label: 'y(x)' }, { pts: [[18, -.22], [18, .22]], color: '#fff', width: 6, label: 'plato' }], { xmin: 0, xmax: 18.5, ymin: -1, ymax: 1, xlabel: 'x (m)', ylabel: 'y (m)', legend: 'left' });
    };
    go(anim, draw, Math.max(800, T * 2500));
    const ok = e[0] >= 17.999;
    S(ok ? `Tiempo hasta el plato: <b>${T.toFixed(3)} s</b><br>Altura en el plato: <b>${e[2].toFixed(3)} m</b><br>Sin fuerzas: <b>${er[2].toFixed(3)} m</b><br>Cambio de altura: <b>${((e[2] - er[2]) * 100).toFixed(1)} cm</b><br>Desviación lateral: <b>${(e[1] * 100).toFixed(1)} cm</b><br>Rapidez en el plato: <b>${Math.hypot(e[3], e[4], e[5]).toFixed(2)} m/s</b>` : '<b>La pelota toca el suelo antes del plato.</b> Aumenta el ángulo.');
  }
});

// ---------------- Problema 3.17 ----------------
reg({
  id: 'p317', group: '3.10 Movimiento en tres dimensiones', sec: '3.10', tag: 'P3.17', short: 'Carga en campos eléctrico y magnético',
  title: 'Problema 3.17 · Movimiento en campos eléctrico y magnético',
  desc: 'Partícula cargada con m = q = 1. (a) B en ẑ y E en ŷ con velocidad inicial en el plano xy. (b) ¿Por qué permanece en el plano xy? (c) E en x̂ y B en ẑ partiendo del reposo: ¿hacia dónde deriva y qué curva sigue? (d) Simulación 3D: espiral en B constante y efecto de E paralelo o perpendicular a B.',
  controls: [
    { type: 'sep', label: 'Campo eléctrico E' },
    { id: 'Ex', type: 'range', label: 'Ex', min: -2, max: 2, step: .05, value: 0 }, { id: 'Ey', type: 'range', label: 'Ey', min: -2, max: 2, step: .05, value: .5 }, { id: 'Ez', type: 'range', label: 'Ez', min: -2, max: 2, step: .05, value: 0 },
    { type: 'sep', label: 'Campo magnético B' },
    { id: 'Bx', type: 'range', label: 'Bx', min: -2, max: 2, step: .05, value: 0 }, { id: 'By', type: 'range', label: 'By', min: -2, max: 2, step: .05, value: 0 }, { id: 'Bz', type: 'range', label: 'Bz', min: -2, max: 2, step: .05, value: 1 },
    { type: 'sep', label: 'Velocidad inicial' },
    { id: 'vx', type: 'range', label: 'vx', min: -2, max: 2, step: .05, value: 1 }, { id: 'vy', type: 'range', label: 'vy', min: -2, max: 2, step: .05, value: 0 }, { id: 'vz', type: 'range', label: 'vz', min: -2, max: 2, step: .05, value: 0 },
    { id: 'tmax', type: 'range', label: 'Tiempo total', min: 5, max: 100, step: 1, value: 40 },
  ],
  buttons: [{ label: '▶ Simular', primary: true, fn: 'run' },
  { label: '(a)', fn: () => setVals({ Ex: 0, Ey: .5, Ez: 0, Bx: 0, By: 0, Bz: 1, vx: 1, vy: 0, vz: 0 }) },
  { label: '(c) cicloide', fn: () => setVals({ Ex: .5, Ey: 0, Ez: 0, Bx: 0, By: 0, Bz: 1, vx: 0, vy: 0, vz: 0 }) },
  { label: '(d) espiral', fn: () => setVals({ Ex: 0, Ey: 0, Ez: 0, Bx: 0, By: 0, Bz: 1, vx: 1, vy: 0, vz: .2 }) },
  { label: '(d) E ∥ B', fn: () => setVals({ Ex: 0, Ey: 0, Ez: .05, Bx: 0, By: 0, Bz: 1, vx: 1, vy: 0, vz: 0 }) },
  { label: '(d) E ⊥ B', fn: () => setVals({ Ex: .3, Ey: 0, Ez: 0, Bx: 0, By: 0, Bz: 1, vx: 1, vy: 0, vz: .2 }) }],
  eq: 'dvx/dt = Ex + vy Bz − vz By<br>dvy/dt = Ey + vz Bx − vx Bz<br>dvz/dt = Ez + vx By − vy Bx<br>Deriva: v_d = E × B / B²',
  views: [
    { id: 'v1', title: 'Trayectoria 3D', h: 420, hint: 'Arrastra para rotar · rueda para zoom' },
    { id: 'v2', title: 'Proyección en el plano xy', half: true, w: 440, h: 320 },
    { id: 'v3', title: 'z(t)', half: true, w: 440, h: 320 },
  ],
  run(anim) {
    const E = [V('Ex'), V('Ey'), V('Ez')], B = [V('Bx'), V('By'), V('Bz')], T = V('tmax');
    const P = integrate(new ODE([0, 0, 0, V('vx'), V('vy'), V('vz'), 0], s => [s[3], s[4], s[5],
      E[0] + s[4] * B[2] - s[5] * B[1], E[1] + s[5] * B[0] - s[3] * B[2], E[2] + s[3] * B[1] - s[4] * B[0], 1]), 'RK4', .01, s => s[6] >= T);
    const ext = P.reduce((m, s) => Math.max(m, Math.abs(s[0]), Math.abs(s[1]), Math.abs(s[2])), 1);
    const cen = [0, 1, 2].map(k => { const [a, b] = mm(P.map(s => s[k])); return (a + b) / 2; });
    const cv = $('v1'), c = cv.getContext('2d'); let fr = 1;
    const d3 = () => {
      const pr = projector(cv, cen, 170 / ext); c.clearRect(0, 0, cv.width, cv.height);
      axes3(c, pr, ext * .6, cen.map(v => v - ext * .5));
      const Bm = Math.hypot(...B); if (Bm) line3(c, pr, [cen, cen.map((v, i) => v + B[i] / Bm * ext * .5)], COL.e + '88', 2, [6, 4]);
      const n = Math.max(2, Math.floor(P.length * fr)), pts = thin(P.slice(0, n), 1500);
      line3(c, pr, pts.map(s => [s[0], s[1], s[2]]), COL.a, 2);
      const q = P[n - 1]; ball3(c, pr, [q[0], q[1], q[2]], 7, COL.c);
    };
    cv._redraw = d3;
    go(anim, f => {
      fr = f; d3(); const pts = thin(P.slice(0, Math.max(2, Math.floor(P.length * f))));
      plot($('v2'), [{ pts: pts.map(s => [s[0], s[1]]), color: COL.a }], { xlabel: 'x', ylabel: 'y' });
      plot($('v3'), [{ pts: pts.map(s => [s[6], s[2]]), color: COL.f }], { xmin: 0, xmax: T, xlabel: 't', ylabel: 'z' });
    }, 3000);
    const B2 = B[0] ** 2 + B[1] ** 2 + B[2] ** 2, vd = B2 ? [(E[1] * B[2] - E[2] * B[1]) / B2, (E[2] * B[0] - E[0] * B[2]) / B2, (E[0] * B[1] - E[1] * B[0]) / B2] : [0, 0, 0];
    S(`|B| = <b>${Math.sqrt(B2).toFixed(3)}</b><br>Período ciclotrónico 2πm/qB = <b>${B2 ? (2 * Math.PI / Math.sqrt(B2)).toFixed(3) : '∞'}</b><br>Deriva E×B/B² = <b>(${vd.map(v => v.toFixed(3)).join(', ')})</b><br><span class="muted">(b) Si E y v están en el plano xy y B ∥ ẑ, la fuerza qv×B también queda en el plano xy, así que vz se mantiene en cero.</span>`);
  }
});

// ---------------- Problema 3.18 ----------------
reg({
  id: 'p318', group: '3.10 Movimiento en tres dimensiones', sec: '3.10', tag: 'P3.18*', short: 'Dipolo magnético: cinturón de Van Allen',
  title: 'Problema 3.18* · Movimiento en un campo de dipolo magnético',
  desc: 'Modelo del cinturón de radiación de Van Allen con B = B₀(R_E/R)³[3(p̂·r̂)r̂ − p̂]. El electrón gira alrededor de las líneas de campo, rebota entre los puntos espejo y deriva alrededor de la Tierra. Como el campo magnético no cambia la rapidez, γ es constante y basta con usar la masa relativista γm. Para que se vea mejor, la escala de girofrecuencia es ajustable (equivalente a aumentar la energía, como sugiere el libro).',
  controls: [
    { id: 'k', type: 'range', label: 'Intensidad del campo κ = qB₀R_E/(γmv)', min: 20, max: 1500, step: 10, value: 250 },
    { id: 'pa', type: 'range', label: 'Ángulo de paso en el ecuador (°)', min: 5, max: 89, step: 1, value: 35 },
    { id: 'r0', type: 'range', label: 'Distancia inicial (R_E)', min: 1.5, max: 5, step: .1, value: 2 },
    { id: 'spf', type: 'range', label: 'Pasos por cuadro', min: 1, max: 400, step: 1, value: 80 },
    { id: 'E', type: 'number', label: 'Energía real del electrón (MeV) — solo para los datos', value: 1 },
  ],
  live: false,
  buttons: [{ label: '▶ Iniciar / Reiniciar', primary: true, fn: 'run' }, { label: '⏸ Pausa', fn: () => stopAnim() }],
  eq: 'dv/dt = (q/γm) v × B   (|v| y γ constantes)<br>Integración: método de Boris (conserva |v|)<br>Unidades: longitudes en R_E, |v| = 1',
  views: [{ id: 'v1', title: 'Tierra, líneas de campo y trayectoria del electrón', h: 520, hint: 'Arrastra para rotar · rueda para zoom' }],
  run() {
    const k = V('k'), pa = V('pa') * deg, r0 = V('r0'), cv = $('v1'), c = cv.getContext('2d');
    const Bf = (x, y, z) => { const r = Math.hypot(x, y, z), r3 = r ** 3, pr = z / r; return [3 * pr * x / r / r3, 3 * pr * y / r / r3, (3 * pr * z / r - 1) / r3]; };
    let p = [r0, 0, 0], v = [0, Math.sin(pa), Math.cos(pa)];
    const dt = Math.min(.002, 0.1 / (k / r0 ** 3)), tr = [p.slice()]; let t = 0, lost = false;
    const field = [];
    for (let ang = 0; ang < Math.PI * 2; ang += Math.PI / 3) for (const L of [r0, r0 * 1.6]) {
      const line = []; for (let lam = -1.4; lam <= 1.4; lam += .02) { const r = L * Math.cos(lam) ** 2; if (r < 1) continue; line.push([r * Math.cos(lam) * Math.cos(ang), r * Math.cos(lam) * Math.sin(ang), r * Math.sin(lam)]); } field.push(line);
    }
    const draw = () => {
      const pr = projector(cv, [0, 0, 0], 210 / (r0 * 1.7), { yaw: -0.6, pitch: 0.35 }); c.clearRect(0, 0, cv.width, cv.height);
      field.forEach(l => line3(c, pr, l, '#7aa8ff30', 1));
      const o = pr(0, 0, 0), s = 210 / (r0 * 1.7) * cv._cam.zoom;
      const gr = c.createRadialGradient(o[0] - s / 3, o[1] - s / 3, 2, o[0], o[1], s); gr.addColorStop(0, '#5fa8ff'); gr.addColorStop(1, '#0b3a7a');
      c.fillStyle = gr; c.shadowColor = '#3b82f6'; c.shadowBlur = 30; c.beginPath(); c.arc(o[0], o[1], s, 0, 7); c.fill(); c.shadowBlur = 0;
      for (let lat = -60; lat <= 60; lat += 30) { const pts = []; for (let a = 0; a <= 360; a += 10) pts.push([Math.cos(lat * deg) * Math.cos(a * deg), Math.cos(lat * deg) * Math.sin(a * deg), Math.sin(lat * deg)]); line3(c, pr, pts, '#ffffff22', 1); }
      line3(c, pr, [[0, 0, -1.5], [0, 0, 1.5]], '#ffffff55', 1, [4, 4]);
      line3(c, pr, thin(tr, 6000), COL.c, 1.2);
      ball3(c, pr, p, 5, '#fff');
    };
    cv._redraw = draw;
    const gam = 1 + V('E') / .511, beta = Math.sqrt(1 - 1 / gam ** 2), B0 = 3.5e-5, me = 9.109e-31, qe = 1.602e-19;
    const Tc = 2 * Math.PI * gam * me / (qe * B0 / r0 ** 3), rL = gam * me * beta * 3e8 / (qe * B0 / r0 ** 3);
    runLoop(() => {
      for (let i = 0; i < V('spf') && !lost; i++) {
        const B = Bf(...p), tt = B.map(b => b * k * dt / 2), t2 = tt[0] ** 2 + tt[1] ** 2 + tt[2] ** 2, ss = tt.map(x => 2 * x / (1 + t2));
        const vp = [v[0] + v[1] * tt[2] - v[2] * tt[1], v[1] + v[2] * tt[0] - v[0] * tt[2], v[2] + v[0] * tt[1] - v[1] * tt[0]];
        v = [v[0] + vp[1] * ss[2] - vp[2] * ss[1], v[1] + vp[2] * ss[0] - vp[0] * ss[2], v[2] + vp[0] * ss[1] - vp[1] * ss[0]];
        p = [p[0] + v[0] * dt, p[1] + v[1] * dt, p[2] + v[2] * dt]; t += dt;
        if (i % 4 === 0) { tr.push(p.slice()); if (tr.length > 40000) tr.shift(); }
        if (Math.hypot(...p) < 1) lost = true;
      }
      draw();
      const lat = Math.asin(p[2] / Math.hypot(...p)) / deg;
      S(`t = <b>${t.toFixed(2)}</b> (R_E/v)<br>Latitud magnética: <b>${lat.toFixed(1)}°</b><br>|v| = <b>${Math.hypot(...v).toFixed(6)}</b> (se conserva)<br>${lost ? '<b style="color:#ff6b8b">El electrón chocó con la atmósfera (cono de pérdida)</b><br>' : ''}<hr><b>Valores reales (${V('E')} MeV, r = ${r0} R_E)</b><br>γ = <b>${gam.toFixed(3)}</b>, v/c = <b>${beta.toFixed(4)}</b><br>B = <b>${(B0 / r0 ** 3).toExponential(2)} T</b><br>Período ciclotrónico: <b>${Tc.toExponential(2)} s</b><br>Radio de giro: <b>${rL.toFixed(0)} m</b>`);
      if (lost) return false;
    });
  }
});
