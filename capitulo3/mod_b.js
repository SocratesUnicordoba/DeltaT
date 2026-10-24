'use strict';
// ============================================================
//  Secciones 3.7 – 3.9 : arrastre, trayectorias 2D, decaimiento
// ============================================================

// ---------------- Problema 3.7 ----------------
const RE = 6.37e6;
function impactSpeed(h, steps = 20000) {
  const dt = Math.sqrt(2 * h / g) * 1.3 / steps;
  const P = integrate(new ODE([h, 0, 0], s => [s[1], -g / (1 + s[0] / RE) ** 2, 1]), 'RK4', dt, s => s[0] <= 0);
  return { v: Math.abs(crossing(P, 0)[1]), P };
}
reg({
  id: 'p37', group: '3.7 Efectos del arrastre', sec: '3.7', tag: 'P3.7', short: 'Fuerza dependiente de la posición',
  title: 'Problema 3.7 · Fuerza dependiente de la posición',
  desc: 'Una partícula cae desde una altura h con F = GMm/(R+y)². Calcula la rapidez de impacto y determina la h para la cual difiere un 1 % del valor con g constante (R = 6.37×10⁶ m). Se usa RK4 con muchos pasos para que la diferencia se deba a la física y no al algoritmo.',
  controls: [
    { id: 'lh', type: 'range', label: 'log₁₀ h (m)', min: 2, max: 7, step: .01, value: 5 },
    { id: 'steps', type: 'number', label: 'Pasos de integración', value: 20000 },
  ],
  buttons: [{ label: '▶ Simular', primary: true, fn: 'run' }, { label: '🎯 Buscar h para 1 %', fn: m => m.find() }],
  eq: 'F/m = −g / (1 + y/R)²<br>g constante: v = √(2gh)<br>Analítica: v² = 2ghR/(R+h)',
  views: [
    { id: 'v1', title: 'Diferencia porcentual de la rapidez de impacto vs h', h: 300 },
    { id: 'v2', title: 'Rapidez |v|(t) para la h elegida', h: 260 },
  ],
  find() {
    let a = 3, b = 7; const f = lh => { const h = 10 ** lh, v0 = Math.sqrt(2 * g * h); return (v0 - impactSpeed(h, V('steps')).v) / v0 * 100 - 1; };
    for (let i = 0; i < 40; i++) { const m = (a + b) / 2; f(m) > 0 ? b = m : a = m; }
    const h = 10 ** ((a + b) / 2);
    setVals({ lh: Math.log10(h).toFixed(2) }, false);
    S($('stats').innerHTML + `<hr>h numérica (1 %): <b>${(h / 1000).toFixed(2)} km</b><br>h analítica: <b>${(RE * (1 / 0.99 ** 2 - 1) / 1000).toFixed(2)} km</b>`);
  },
  run(anim) {
    const h = 10 ** V('lh'), st = Math.max(100, V('steps'));
    const curve = [], an = [];
    for (let lh = 2; lh <= 7.001; lh += .1) { const hh = 10 ** lh, v0 = Math.sqrt(2 * g * hh); curve.push([lh, (v0 - impactSpeed(hh, 3000).v) / v0 * 100]); an.push([lh, (1 - Math.sqrt(RE / (RE + hh))) * 100]); }
    const { v, P } = impactSpeed(h, st), vc = Math.sqrt(2 * g * h), d = (vc - v) / vc * 100;
    plot($('v1'), [{ pts: an, color: '#fff', dash: [4, 4], width: 1.2, label: 'Analítica' }, { pts: curve, color: COL.a, label: 'Numérica (RK4)' }, { pts: [[2, 1], [7, 1]], color: COL.c, dash: [2, 4], width: 1, label: '1 %' }, { pts: [[V('lh'), d]], color: COL.b, dots: true, r: 6 }], { xlabel: 'log₁₀ h (m)', ylabel: 'diferencia (%)', legend: 'left' });
    const T = P[P.length - 1][2];
    go(anim, fr => plot($('v2'), [{ pts: thin(P).filter(s => s[2] <= T * fr).map(s => [s[2], -s[1]]), color: COL.a, label: 'g(y) variable' }, { pts: [[0, 0], [T * fr, g * T * fr]], color: COL.b, dash: [5, 4], label: 'g constante' }], { xmin: 0, xmax: T, ymin: 0, ymax: g * T * 1.02, xlabel: 't (s)', ylabel: '|v| (m/s)', legend: 'left' }), 1500);
    S(`h = <b>${fmt(h, 4)} m</b><br>v (g variable) = <b>${fmt(v, 5)} m/s</b><br>v (g constante) = <b>${fmt(vc, 5)} m/s</b><br>Diferencia = <b>${d.toFixed(4)} %</b>`);
  }
});

// ---------------- Problema 3.8 y Listado 3.10 ----------------
const TABLA31 = (() => {
  const t = [.2055, .2302, .2550, .2797, .3045, .3292, .3539, .3786, .4033, .4280, .4526, .4773, .5020, .5266, .5513, .5759, .6005, .6252, .6498, .6744, .6990, .7236, .7482, .7728, .7974, .8220, .8466];
  const y = [.4188, .4164, .4128, .4082, .4026, .3958, .3878, .3802, .3708, .3609, .3505, .3400, .3297, .3181, .3051, .2913, .2788, .2667, .2497, .2337, .2175, .2008, .1846, .1696, .1566, .1393, .1263];
  return t.map((x, i) => [x, y[i]]);
})();
let FILTER = TABLA31, ORIGEN = 'Tabla 3.1 — falling.txt del paquete ch03';
// Equivalente del Listado 3.10 (ResourceLoader): dos columnas por línea,
// se ignoran las vacías y las que empiezan por //
function parseDatos(txt) {
  const out = [];
  String(txt).split(/\r?\n/).forEach(linea => {
    const s = linea.trim(); if (!s || s.startsWith('//') || s.startsWith('#')) return;
    const n = s.split(/[\s,;]+/).map(Number);
    if (n.length >= 2 && isFinite(n[0]) && isFinite(n[1])) out.push([n[0], n[1]]);
  });
  return out.sort((a, b) => a[0] - b[0]);
}
function cargarDatos(mod) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.txt,.csv,.dat,text/plain';
  inp.onchange = () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const lector = new FileReader();
    lector.onload = () => {
      const d = parseDatos(lector.result);
      if (d.length < 5) { S('<b style="color:#ff6b8b">No se encontraron al menos 5 pares (t, y) en el archivo.</b>'); return; }
      FILTER = d; ORIGEN = f.name; mod.run(true);
    };
    lector.readAsText(f);
  };
  inp.click();
}
// paso de integración: 0.001 s con los datos del libro (≈640 pasos) y más grande
// si se carga una serie más larga, para no pasar de ~20 000 pasos por integración
const dt38 = () => Math.max(.001, (FILTER[FILTER.length - 1][0] - FILTER[0][0]) / 2e4);
function filterModel(vt, v0, quad, dt) {
  dt = dt || dt38();
  const t0 = FILTER[0][0], tf = FILTER[FILTER.length - 1][0];
  const acc = v => quad ? -g * (1 + v * Math.abs(v) / (vt * vt)) : -g * (1 + v / vt);
  return integrate(new ODE([FILTER[0][1], v0, t0], s => [s[1], acc(s[1]), 1]), 'RK4', dt, s => s[2] >= tf);
}
const rms = P => { const h = dt38(); let e = 0; FILTER.forEach(([t, y]) => { const k = Math.min(P.length - 1, Math.round((t - FILTER[0][0]) / h)); e += (P[k][0] - y) ** 2; }); return Math.sqrt(e / FILTER.length); };
reg({
  id: 'p38', group: '3.7 Efectos del arrastre', sec: '3.7', tag: 'P3.8', short: 'Caída de un filtro de café',
  title: 'Problema 3.8 · La caída de un filtro de café',
  desc: 'Datos experimentales de la Tabla 3.1 (falling.txt), que se pueden sustituir por un archivo propio con el botón «Cargar datos», igual que hace DataLoaderApp con ResourceLoader en el Listado 3.10. (a) Calcula v(t) con diferencias centrales y a(t) con la ecuación (3.16). (b) Estima la velocidad terminal y la dependencia de a con v. (c–e) Compara el modelo de arrastre cuadrático y el lineal. (f) ¿Cuál ajusta mejor?',
  controls: [
    { id: 'vt', type: 'range', label: 'Velocidad terminal v_t (m/s)', min: .3, max: 4, step: .01, value: 1.0 },
    { id: 'v0', type: 'range', label: 'Velocidad inicial en t₀ (m/s)', min: -.6, max: 0, step: .005, value: -.1 },
    { id: 'quad', type: 'check', label: 'Arrastre cuadrático', value: true, color: COL.a },
    { id: 'lin', type: 'check', label: 'Arrastre lineal', value: true, color: COL.f },
  ],
  buttons: [{ label: '▶ Simular', primary: true, fn: 'run' }, { label: '⚙ Ajuste automático', fn: m => m.fit() },
  { label: '📂 Cargar datos', fn: m => cargarDatos(m) },
  { label: '↺ Tabla 3.1', fn: m => { FILTER = TABLA31; ORIGEN = 'Tabla 3.1 — falling.txt del paquete ch03'; m.run(true); } }],
  eq: 'v(t) ≈ [y(t+Δt) − y(t−Δt)] / 2Δt   (3.14)<br>a(t) ≈ [y(t+Δt) − 2y(t) + y(t−Δt)] / Δt²   (3.16)<br>Cuadrático: a = −g(1 − v²/v_t²)<br>Lineal: a = −g(1 − |v|/v_t)',
  views: [
    { id: 'v1', title: 'y(t): datos (puntos) y modelos', h: 300 },
    { id: 'v2', title: '(a) v(t) por diferencias centrales', half: true, w: 440, h: 260 },
    { id: 'v3', title: '(a) a(t) por la ecuación (3.16)', half: true, w: 440, h: 260 },
    { id: 'v4', title: '(b) a en función de v: datos y modelos', h: 280 },
    { id: 'v5', title: 'Listado 3.10 · Lectura de los datos (ResourceLoader)', html: true },
  ],
  fit() {
    const best = q => { let b = [1e9, 0, 0]; for (let vt = .3; vt <= 4; vt += .05) for (let v0 = -.4; v0 <= 0; v0 += .02) { const e = rms(filterModel(vt, v0, q)); if (e < b[0]) b = [e, vt, v0]; } return b; };
    const bq = best(true), bl = best(false);
    const use = bq[0] <= bl[0] ? bq : bl;
    setVals({ vt: use[1].toFixed(2), v0: use[2].toFixed(3) }, false);
    S($('stats').innerHTML + `<hr><b>Mejor ajuste</b><br>Cuadrático: v_t=${bq[1].toFixed(2)}, v₀=${bq[2].toFixed(2)}, RMS=${(bq[0] * 1000).toFixed(2)} mm<br>Lineal: v_t=${bl[1].toFixed(2)}, v₀=${bl[2].toFixed(2)}, RMS=${(bl[0] * 1000).toFixed(2)} mm`);
  },
  run(anim) {
    const vt = V('vt'), v0 = V('v0'), D = FILTER, dtd = D[1][0] - D[0][0];
    const vel = [], acc = [];
    for (let i = 1; i < D.length - 1; i++) {
      const h1 = D[i + 1][0] - D[i][0], h0 = D[i][0] - D[i - 1][0], hm = (h1 + h0) / 2;
      const v = (D[i + 1][1] - D[i - 1][1]) / (h1 + h0), a = (D[i + 1][1] - 2 * D[i][1] + D[i - 1][1]) / (hm * hm);
      vel.push([D[i][0], v]); acc.push([D[i][0], a, v]);
    }
    const M = [];
    if (V('quad')) M.push({ name: 'Cuadrático', color: COL.a, P: filterModel(vt, v0, true) });
    if (V('lin')) M.push({ name: 'Lineal', color: COL.f, P: filterModel(vt, v0, false) });
    const t0 = D[0][0], tf = D[D.length - 1][0], [yl, yh] = mm(D.map(p => p[1])), yp = (yh - yl) * .12 || .05;
    const draw = fr => {
      const tn = t0 + (tf - t0) * fr;
      plot($('v1'), [{ pts: D, color: COL.c, dots: true, r: 3.5, label: `Datos (${ORIGEN.slice(0, 28)})` }, ...M.map(m => ({ pts: thin(m.P).filter(s => s[2] <= tn).map(s => [s[2], s[0]]), color: m.color, label: m.name }))], { xmin: t0 - (tf - t0) * .03, xmax: tf + (tf - t0) * .03, ymin: yl - yp, ymax: yh + yp, xlabel: 't (s)', ylabel: 'y (m)' });
    };
    go(anim, draw, 1500);
    plot($('v2'), [{ pts: vel, color: COL.c, dots: true, r: 3.5, label: 'datos' }, ...M.map(m => ({ pts: thin(m.P).map(s => [s[2], s[1]]), color: m.color, label: m.name }))], { xlabel: 't (s)', ylabel: 'v (m/s)' });
    plot($('v3'), [{ pts: acc.map(p => [p[0], p[1]]), color: COL.c, dots: true, r: 3.5, label: 'datos' }, ...M.map(m => ({ pts: thin(m.P).map(s => [s[2], m.name === 'Lineal' ? -g * (1 + s[1] / vt) : -g * (1 - s[1] * s[1] / (vt * vt))]), color: m.color, label: m.name }))], { xlabel: 't (s)', ylabel: 'a (m/s²)' });
    const vs = []; for (let v = -Math.min(vt, 1.2); v <= 0; v += .01) vs.push(v);
    plot($('v4'), [{ pts: acc.map(p => [p[2], p[1]]), color: COL.c, dots: true, r: 3.5, label: 'datos' }, { pts: vs.map(v => [v, -g * (1 - v * v / (vt * vt))]), color: COL.a, label: 'cuadrático' }, { pts: vs.map(v => [v, -g * (1 + v / vt)]), color: COL.f, label: 'lineal' }], { xlabel: 'v (m/s)', ylabel: 'a (m/s²)', ymin: -12, ymax: 12 });
    $('v5').innerHTML = `<pre class="code">// Listado 3.10 — DataLoaderApp (versión JavaScript)
// En Java: ResourceLoader.getResource("falling.txt", ...).getString()
function parseDatos(txt) {
  const out = [];
  txt.split(/\\r?\\n/).forEach(linea =&gt; {
    const s = linea.trim();
    if (!s || s.startsWith("//")) return;   // comentarios
    const n = s.split(/[\\s,;]+/).map(Number);
    if (isFinite(n[0]) &amp;&amp; isFinite(n[1])) out.push([n[0], n[1]]);
  });
  return out;
}</pre>` + tbl(['Origen de los datos', 'Puntos', 'Rango de t (s)', 'Rango de y (m)', 'Δt medio (s)'],
      [[ORIGEN, D.length, `${t0.toFixed(4)} – ${tf.toFixed(4)}`, `${yl.toFixed(4)} – ${yh.toFixed(4)}`, ((tf - t0) / (D.length - 1)).toFixed(4)]]) +
      '<p class="hint">El botón «📂 Cargar datos» lee un archivo de texto de dos columnas (t y) con el mismo criterio que ResourceLoader: líneas vacías y líneas que empiezan por <code>//</code> se ignoran, y los separadores pueden ser espacios, comas o punto y coma. Sirve para probar el ajuste con tus propias medidas; «↺ Tabla 3.1» devuelve los datos del libro.</p>';
    S(`Origen: <b>${ORIGEN}</b> (${D.length} puntos)<br>Δt de los datos ≈ <b>${dtd.toFixed(4)} s</b><br>v al final (datos) ≈ <b>${vel[vel.length - 1][1].toFixed(3)} m/s</b><br>` + M.map(m => `RMS ${m.name}: <b>${(rms(m.P) * 1000).toFixed(2)} mm</b>`).join('<br>') +
      '<br><span class="muted">La aceleración calculada con (3.16) es muy ruidosa: la segunda derivada amplifica los errores de medición.</span>');
  }
});

// ---------------- Problema 3.9 ----------------
reg({
  id: 'p39', group: '3.7 Efectos del arrastre', sec: '3.7', tag: 'P3.9', short: 'Subida y bajada de una piedra',
  title: 'Problema 3.9 · Efecto del aire en el ascenso y descenso de una piedra',
  desc: '(a) Rapidez de impacto de una piedra soltada desde 50 m con arrastre cuadrático (v_t = 30 m/s) comparada con la caída libre. (b–c) Piedra lanzada hacia arriba con v₀ = 50 m/s: ¿cómo cambian la altura máxima, la rapidez de regreso y los tiempos de subida y bajada? La altura máxima se detecta con v·v_old < 0.',
  controls: [
    { id: 'vt', type: 'range', label: 'Velocidad terminal v_t (m/s)', min: 5, max: 100, step: 1, value: 30 },
    { id: 'h', type: 'range', label: '(a) Altura de caída (m)', min: 5, max: 300, step: 1, value: 50 },
    { id: 'v0', type: 'range', label: '(c) Velocidad de lanzamiento v₀ (m/s)', min: 5, max: 100, step: 1, value: 50 },
    { id: 'dt', type: 'range', label: 'Δt (s)', min: .001, max: .1, step: .001, value: .01 },
  ],
  eq: 'F/m = −g − g·v|v|/v_t²<br>(v &gt; 0: el arrastre apunta hacia abajo; v &lt; 0: hacia arriba)<br>C₂ ≈ 0.01089 kg/m para v_t = 30 m/s',
  views: [
    { id: 'v0c', title: 'Animación (c): con aire vs sin aire', h: 260 },
    { id: 'v1', title: 'y(t)', half: true, w: 440, h: 280 },
    { id: 'v2', title: 'v(t)', half: true, w: 440, h: 280 },
  ],
  run(anim) {
    const vt = V('vt'), h = V('h'), v0 = V('v0'), dt = V('dt');
    const acc = v => -g - g * v * Math.abs(v) / (vt * vt);
    const drop = integrate(new ODE([h, 0, 0], s => [s[1], acc(s[1]), 1]), 'RK4', dt, s => s[0] < 0);
    const vdrop = Math.abs(crossing(drop, 0)[1]), vfree = Math.sqrt(2 * g * h);
    const ode = new ODE([0, v0, 0], s => [s[1], acc(s[1]), 1]); const P = [ode.state.slice()]; let ymax = 0, tup = 0, vold = v0;
    while (true) { Solvers.RK4(ode, dt); const s = ode.state.slice(); P.push(s); if (s[1] * vold < 0 && !tup) { const c = crossing(P, 1); ymax = c[0]; tup = c[2]; } vold = s[1]; if (s[0] < 0 && s[2] > dt) break; if (s[2] > 100) break; }
    const land = crossing(P, 0), T = land[2], tdown = T - tup, vret = Math.abs(land[1]);
    const Tv = 2 * v0 / g, vac = []; for (let i = 0; i <= 300; i++) { const t = Tv * i / 300; vac.push([t, v0 * t - g * t * t / 2, v0 - g * t]); }
    const Hmax = Math.max(v0 * v0 / (2 * g), 1);
    const draw = fr => {
      const tn = Math.max(T, Tv) * fr;
      plot($('v1'), [{ pts: thin(P).filter(s => s[2] <= tn).map(s => [s[2], s[0]]), color: COL.a, label: 'Con aire' }, { pts: vac.filter(p => p[0] <= tn).map(p => [p[0], p[1]]), color: COL.b, dash: [5, 4], label: 'Sin aire' }], { xmin: 0, xmax: Math.max(T, Tv), ymin: 0, ymax: Hmax * 1.08, xlabel: 't (s)', ylabel: 'y (m)' });
      plot($('v2'), [{ pts: thin(P).filter(s => s[2] <= tn).map(s => [s[2], s[1]]), color: COL.a, label: 'Con aire' }, { pts: vac.filter(p => p[0] <= tn).map(p => [p[0], p[2]]), color: COL.b, dash: [5, 4], label: 'Sin aire' }], { xmin: 0, xmax: Math.max(T, Tv), ymin: -v0 * 1.05, ymax: v0 * 1.05, xlabel: 't (s)', ylabel: 'v (m/s)' });
      const cv = $('v0c'), c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
      const Y = y => H - 25 - y / (Hmax * 1.08) * (H - 45);
      c.fillStyle = '#1b2245'; c.fillRect(0, H - 25, W, 25);
      const pa = P[Math.min(P.length - 1, Math.round(tn / dt))], ya = tn <= T ? Math.max(0, pa[0]) : 0;
      const yv = tn <= Tv ? Math.max(0, v0 * tn - g * tn * tn / 2) : 0;
      [[W * .3, ya, COL.a, 'Con aire'], [W * .7, yv, COL.b, 'Sin aire']].forEach(([x, y, col, lb]) => {
        c.strokeStyle = '#ffffff10'; c.beginPath(); c.moveTo(x, 10); c.lineTo(x, H - 25); c.stroke();
        c.strokeStyle = col + '66'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(x - 30, Y(col === COL.a ? ymax : Hmax)); c.lineTo(x + 30, Y(col === COL.a ? ymax : Hmax)); c.stroke(); c.setLineDash([]);
        dot2(c, x, Y(y) - 9, 9, col); c.fillStyle = '#8a93b8'; c.font = '12px Outfit'; c.textAlign = 'center'; c.fillText(`${lb}: y = ${y.toFixed(1)} m`, x, H - 8);
      });
      c.fillStyle = COL.a; c.textAlign = 'left'; c.font = '12px JetBrains Mono'; c.fillText(`t = ${tn.toFixed(2)} s`, 10, 18);
    };
    go(anim, draw, 3500);
    S(`<b>(a) Caída desde ${h} m</b><br>Con aire: <b>${vdrop.toFixed(2)} m/s</b> · Libre: <b>${vfree.toFixed(2)} m/s</b><br>Reducción: <b>${((1 - vdrop / vfree) * 100).toFixed(1)} %</b><hr>` +
      tbl(['(c)', 'Con aire', 'Sin aire'], [['Altura máx (m)', ymax.toFixed(2), (v0 * v0 / 2 / g).toFixed(2)], ['t subida (s)', tup.toFixed(3), (v0 / g).toFixed(3)], ['t bajada (s)', tdown.toFixed(3), (v0 / g).toFixed(3)], ['t total (s)', T.toFixed(3), Tv.toFixed(3)], ['|v| regreso', vret.toFixed(2), v0.toFixed(2)]]) +
      '<span class="muted">Con aire la bajada tarda más que la subida: ambas fuerzas se suman al subir y se oponen al bajar.</span>');
  }
});

// ---------------- Problema 3.10 ----------------
function shoot(v0, th, h, k, dt = .002, lin = false) {
  const ode = new ODE([0, h, v0 * Math.cos(th), v0 * Math.sin(th), 0], s => { const v = Math.hypot(s[2], s[3]), f = lin ? k : k * v; return [s[2], s[3], -f * s[2], -g - f * s[3], 1]; });
  const P = integrate(ode, 'RK4', dt, s => s[1] < 0 && s[4] > 0, 2e5);
  const L = crossing(P, 1); P[P.length - 1] = L;
  return { P, R: L[0], T: L[4], ymax: P.reduce((m, s) => Math.max(m, s[1]), h) };
}
function bestAngle(v0, h, k) {
  let best = [0, -1]; for (let a = .5; a < 90; a += .5) { const R = shoot(v0, a * deg, h, k, .005).R; if (R > best[1]) best = [a, R]; }
  let lo = best[0] - .5, hi = best[0] + .5; const f = a => shoot(v0, a * deg, h, k, .002).R;
  for (let i = 0; i < 25; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; f(m1) < f(m2) ? lo = m1 : hi = m2; }
  return (lo + hi) / 2;
}
reg({
  id: 'p310', group: '3.8 Trayectorias bidimensionales', sec: '3.8', tag: 'P3.10', short: 'Trayectoria de una bola de acero',
  title: 'Problema 3.10 · Trayectoria de una bola de acero',
  desc: '(a) Sin aire, compara con la solución exacta y verifica que θmax = 45° y Rmax = v₀²/g. (b) Lanzada desde h = 2 m: ¿θmax es mayor o menor que 45°? ¿Cuánto cambia R si θ varía un 2 %? (c) Con arrastre C₂/m = 0.1, h = 2 m, v₀ = 30 m/s.',
  controls: [
    { id: 'v0', type: 'range', label: 'v₀ (m/s)', min: 5, max: 60, step: .5, value: 15 },
    { id: 'th', type: 'range', label: 'θ₀ (°)', min: 1, max: 89, step: .1, value: 45 },
    { id: 'h', type: 'range', label: 'Altura h (m)', min: 0, max: 20, step: .5, value: 0 },
    { id: 'k', type: 'range', label: 'C₂/m (1/m)', min: 0, max: .2, step: .001, value: 0 },
  ],
  buttons: [{ label: '🚀 Lanzar', primary: true, fn: 'run' }, { label: '🎯 θ óptimo', fn: m => setVals({ th: bestAngle(V('v0'), V('h'), V('k')).toFixed(1) }) },
  { label: '(a)', fn: () => setVals({ v0: 15, th: 45, h: 0, k: 0 }) }, { label: '(b)', fn: () => setVals({ v0: 15, h: 2, k: 0, th: bestAngle(15, 2, 0).toFixed(1) }) }, { label: '(c)', fn: () => setVals({ v0: 30, h: 2, k: .1, th: bestAngle(30, 2, .1).toFixed(1) }) }],
  eq: 'dv<sub>x</sub>/dt = −(C₂/m)·v·v<sub>x</sub><br>dv<sub>y</sub>/dt = −g − (C₂/m)·v·v<sub>y</sub><br>v = √(v<sub>x</sub>² + v<sub>y</sub>²)',
  views: [
    { id: 'v1', title: 'Trayectoria y(x): numérica (sólida) · exacta sin aire (punteada)', h: 380 },
    { id: 'v2', title: 'Alcance R vs θ₀', h: 240 },
  ],
  run(anim) {
    const v0 = V('v0'), th = V('th') * deg, h = V('h'), k = V('k');
    const r = shoot(v0, th, h, k, .001), vac = shoot(v0, th, h, 0, .001);
    const Rex = v0 * Math.cos(th) / g * (v0 * Math.sin(th) + Math.sqrt((v0 * Math.sin(th)) ** 2 + 2 * g * h));
    const ex = []; for (let i = 0; i <= 200; i++) { const x = Rex * i / 200; ex.push([x, h + x * Math.tan(th) - g * x * x / (2 * v0 * v0 * Math.cos(th) ** 2)]); }
    const xm = Math.max(Rex, r.R) * 1.05, ym = Math.max(vac.ymax, r.ymax) * 1.15;
    const RA = [], RV = []; for (let a = 1; a <= 89; a += 2) { RA.push([a, shoot(v0, a * deg, h, k, .005).R]); RV.push([a, shoot(v0, a * deg, h, 0, .005).R]); }
    const draw = fr => {
      const n = Math.max(2, Math.floor(r.P.length * fr)), q = r.P[n - 1];
      const T = plot($('v1'), [{ pts: ex, color: '#ffffff88', dash: [5, 4], width: 1.3, label: 'Exacta sin aire' }, { pts: thin(r.P.slice(0, n)).map(s => [s[0], s[1]]), color: COL.a, width: 2.5, label: k ? 'Numérica con arrastre' : 'Numérica' }], { xmin: 0, xmax: xm, ymin: 0, ymax: ym, xlabel: 'x (m)', ylabel: 'y (m)' });
      dot2(T.c, T.X(q[0]), T.Y(q[1]), 7, COL.a);
    };
    go(anim, draw, 1800);
    plot($('v2'), [{ pts: RV, color: COL.b, dash: [5, 4], label: 'Sin aire' }, { pts: RA, color: COL.a, label: 'Con C₂/m actual' }, { pts: [[V('th'), 0], [V('th'), r.R]], color: COL.c, width: 1, dash: [2, 3], label: 'θ actual' }], { xmin: 0, xmax: 90, ymin: 0, xlabel: 'θ₀ (°)', ylabel: 'R (m)' });
    const Rp = shoot(v0, th * 1.02, h, k, .001).R, Rm = shoot(v0, th * .98, h, k, .001).R;
    S(`R numérico: <b>${r.R.toFixed(3)} m</b><br>R exacto (sin aire): <b>${Rex.toFixed(3)} m</b><br>v₀²/g = <b>${(v0 * v0 / g).toFixed(3)} m</b><br>Altura máx: <b>${r.ymax.toFixed(2)} m</b><br>Tiempo de vuelo: <b>${r.T.toFixed(3)} s</b><br>ΔR con θ +2 %: <b>${((Rp / r.R - 1) * 100).toFixed(3)} %</b><br>ΔR con θ −2 %: <b>${((Rm / r.R - 1) * 100).toFixed(3)} %</b>`);
  }
});

// ---------------- Problema 3.11 ----------------
reg({
  id: 'p311', group: '3.8 Trayectorias bidimensionales', sec: '3.8', tag: 'P3.11', short: 'Comparar el movimiento de dos objetos',
  title: 'Problema 3.11 · Comparación del movimiento de dos objetos',
  desc: 'Dos objetos idénticos parten de la altura h: uno se suelta y el otro se lanza horizontalmente con v₀. ¿Cuál llega primero? (a) Sin aire. (b) Arrastre ∝ v² (C₂/m = 0.1, h = 10 m, v₀ = 30 m/s). (c) Arrastre ∝ v.',
  controls: [
    { id: 'h', type: 'range', label: 'h (m)', min: 1, max: 50, step: .5, value: 10 },
    { id: 'v0', type: 'range', label: 'v₀ horizontal (m/s)', min: 0, max: 60, step: .5, value: 30 },
    { id: 'k', type: 'range', label: 'C/m', min: 0, max: .5, step: .005, value: .1 },
    { id: 'mod', type: 'select', label: 'Modelo de arrastre', value: 'quad', options: [['none', '(a) Sin aire'], ['quad', '(b) Cuadrático ∝ v²'], ['lin', '(c) Lineal ∝ v']] },
  ],
  eq: 'Cuadrático: a = −g ŷ − (C₂/m)|v| v<br>Lineal: a = −g ŷ − (C₁/m) v<br>En el caso cuadrático el movimiento vertical depende de vₓ (acoplamiento).',
  views: [
    { id: 'v1', title: 'Animación', h: 330 },
    { id: 'v2', title: 'Altura y(t) de ambos objetos', h: 260 },
  ],
  run(anim) {
    const h = V('h'), v0 = V('v0'), mod = V('mod'), k = mod === 'none' ? 0 : V('k'), lin = mod === 'lin';
    const A = shoot(0, 0, h, k, .001, lin), B = shoot(v0, 0, h, k, .001, lin), T = Math.max(A.T, B.T);
    const at = (r, t) => r.P[Math.min(r.P.length - 1, Math.round(t / .001))];
    const draw = fr => {
      const tn = T * fr, xm = Math.max(B.R, 1) * 1.1;
      const tr = plot($('v1'), [{ pts: thin(A.P).filter(s => s[4] <= tn).map(s => [s[0], s[1]]), color: COL.c, label: 'Soltado' }, { pts: thin(B.P).filter(s => s[4] <= tn).map(s => [s[0], s[1]]), color: COL.a, label: 'Lanzado' }], { xmin: -xm * .05, xmax: xm, ymin: 0, ymax: h * 1.1, xlabel: 'x (m)', ylabel: 'y (m)' });
      const a = at(A, tn), b = at(B, tn); dot2(tr.c, tr.X(a[0]), tr.Y(a[1]), 8, COL.c); dot2(tr.c, tr.X(b[0]), tr.Y(b[1]), 8, COL.a);
      plot($('v2'), [{ pts: thin(A.P).filter(s => s[4] <= tn).map(s => [s[4], s[1]]), color: COL.c, label: 'Soltado' }, { pts: thin(B.P).filter(s => s[4] <= tn).map(s => [s[4], s[1]]), color: COL.a, dash: [6, 3], label: 'Lanzado' }], { xmin: 0, xmax: T, ymin: 0, ymax: h * 1.05, xlabel: 't (s)', ylabel: 'y (m)' });
    };
    go(anim, draw, 2500);
    const d = B.T - A.T;
    S(`t soltado: <b>${A.T.toFixed(4)} s</b><br>t lanzado: <b>${B.T.toFixed(4)} s</b><br>Diferencia: <b>${d.toExponential(2)} s</b><br>${Math.abs(d) < 1e-3 ? 'Llegan <b>al mismo tiempo</b>.' : d > 0 ? 'El objeto <b>soltado</b> llega primero.' : 'El objeto <b>lanzado</b> llega primero.'}<br><span class="muted">${mod === 'quad' ? 'Con arrastre ∝ v² la rapidez total aumenta la fuerza vertical de frenado del objeto lanzado.' : 'Sin aire o con arrastre lineal, x e y son independientes.'}</span>`);
  }
});

// ---------------- Problema 3.12 ----------------
reg({
  id: 'p312', group: '3.9 Procesos de decaimiento', sec: '3.9', tag: 'P3.12', short: 'Decaimiento de una especie nuclear',
  title: 'Problema 3.12 · Decaimiento de una sola especie nuclear',
  desc: '(a) Con λ = 1 y Δt = 0.01 compara Euler con la solución exacta en t = 1 y t = 2. (b) Verifica T½ = ln2/λ y el tiempo τ para decaer a 1/e. (c) Unidades adecuadas para ²³⁸U y el muón. (d) Tiempo expresado en vidas medias: ¿cuánto tarda en quedar el 20 %?',
  controls: [
    { id: 'lam', type: 'range', label: 'λ (1/s)', min: .05, max: 3, step: .05, value: 1 },
    { id: 'dt', type: 'range', label: 'Δt (s)', min: .001, max: .5, step: .001, value: .01 },
    { id: 'N0', type: 'number', label: 'N₀ (núcleos)', value: 1000 },
    { id: 'units', type: 'select', label: 'Unidades de tiempo', value: 's', options: [['s', 'segundos'], ['half', '(d) vidas medias T½']] },
    { id: 'mc', type: 'check', label: 'Simulación Monte Carlo (núcleos discretos)', value: true, color: COL.d },
  ],
  eq: 'dN/dt = −λN<br>Euler: N<sub>n+1</sub> = N<sub>n</sub>(1 − λΔt)<br>Exacta: N(t) = N₀e^(−λt)<br>T½ = ln2/λ ,  τ = 1/λ',
  views: [
    { id: 'v1', title: 'N(t)/N₀', h: 300 },
    { id: 'v2', title: 'Error de Euler: N_Euler − N_exacta (relativo)', half: true, w: 440, h: 240 },
    { id: 'v3', title: '(c) Escalas de tiempo', half: true, html: true },
  ],
  run(anim) {
    const lam = V('lam'), dt = V('dt'), N0 = Math.max(1, Math.round(V('N0'))), half = V('units') === 'half', T12 = Math.LN2 / lam, tmax = 5 / lam;
    const sc = half ? 1 / T12 : 1, ex = [], eu = [[0, 1]], err = [], mc = [[0, 1]];
    for (let i = 0; i <= 300; i++) { const t = tmax * i / 300; ex.push([t * sc, Math.exp(-lam * t)]); }
    let N = 1, t = 0, Nm = N0, tHalf = null, tTau = null, t20 = null;
    const doMC = V('mc') && N0 * tmax / dt < 3e7;
    while (t < tmax - 1e-12) {
      const Np = N; N *= 1 - lam * dt; t += dt;
      if (tHalf === null && N <= .5) tHalf = t - dt + dt * (Np - .5) / (Np - N);
      if (tTau === null && N <= 1 / Math.E) tTau = t - dt + dt * (Np - 1 / Math.E) / (Np - N);
      if (t20 === null && N <= .2) t20 = t - dt + dt * (Np - .2) / (Np - N);
      eu.push([t * sc, N]); err.push([t * sc, N / Math.exp(-lam * t) - 1]);
      if (doMC) { let d = 0; const p = lam * dt; for (let j = 0; j < Nm; j++) if (Math.random() < p) d++; Nm -= d; mc.push([t * sc, Nm / N0]); }
    }
    const at = T => { let n = 1, s = 0; while (s + dt <= T + 1e-12) { n *= 1 - lam * dt; s += dt; } if (T - s > 1e-12) n *= 1 - lam * (T - s); return n; };
    const draw = fr => {
      const tn = tmax * sc * fr, f = a => a.filter(p => p[0] <= tn);
      const s = [{ pts: f(ex), color: '#fff', dash: [5, 4], width: 1.3, label: 'Exacta' }, { pts: thin(f(eu)), color: COL.c, label: 'Euler' }];
      if (doMC) s.push({ pts: thin(f(mc), 400), color: COL.d, dots: true, r: 2, label: `Monte Carlo (N₀=${N0})` });
      s.push({ pts: [[0, .5], [tmax * sc, .5]], color: '#ffffff33', width: 1, dash: [2, 4] }, { pts: [[0, .2], [tmax * sc, .2]], color: '#ffffff22', width: 1, dash: [2, 4] });
      plot($('v1'), s, { xmin: 0, xmax: tmax * sc, ymin: 0, ymax: 1.02, xlabel: half ? 't / T½' : 't (s)', ylabel: 'N/N₀' });
    };
    go(anim, draw, 2500);
    plot($('v2'), [{ pts: thin(err), color: COL.b }], { xlabel: half ? 't / T½' : 't (s)', ylabel: 'error relativo' });
    const yr = 3.156e7, TU = 4.5e9 * yr, Tmu = 2.2e-6;
    $('v3').innerHTML = tbl(['', '²³⁸U', 'Muón'], [['T½', '4.5×10⁹ años', '2.2×10⁻⁶ s'], ['λ (s⁻¹)', (Math.LN2 / TU).toExponential(3), (Math.LN2 / Tmu).toExponential(3)], ['Unidad conveniente', '10⁹ años', 'μs'], ['t hasta 20 %', `${(Math.log2(5) * 4.5).toFixed(2)}×10⁹ años`, `${(Math.log2(5) * 2.2).toFixed(2)} μs`]]) + '<p class="hint">Con t medido en T½, la ecuación es la misma para cualquier núcleo: el 20 % se alcanza en t = log₂5 ≈ 2.32 T½.</p>';
    const e1 = at(1), e2 = at(2);
    S(tbl(['', 'Euler', 'Exacta', 'Diferencia'], [['N/N₀ (t=1 s)', e1.toFixed(6), Math.exp(-lam).toFixed(6), (e1 - Math.exp(-lam)).toExponential(2)], ['N/N₀ (t=2 s)', e2.toFixed(6), Math.exp(-2 * lam).toFixed(6), (e2 - Math.exp(-2 * lam)).toExponential(2)]]) +
      `T½ numérico: <b>${fmt(tHalf, 4)} s</b> (ln2/λ = ${T12.toFixed(4)})<br>τ numérico: <b>${fmt(tTau, 4)} s</b> (1/λ = ${(1 / lam).toFixed(4)})<br>T½/τ = <b>${(tHalf / tTau).toFixed(4)}</b> (ln 2 = 0.6931)<br>t para 20 %: <b>${fmt(t20, 4)} s = ${(t20 / T12).toFixed(3)} T½</b>`);
  }
});

// ---------------- Problema 3.13 ----------------
function chain(species, branches, N0, dt, tmax) {
  const n = species.length, lam = species.map(s => s.T ? Math.LN2 / s.T : 0);
  const ode = new ODE([...N0, 0], s => { const r = new Array(n + 1).fill(0); for (let i = 0; i < n; i++) r[i] -= lam[i] * s[i]; branches.forEach(([a, b, f]) => r[b] += f * lam[a] * s[a]); r[n] = 1; return r; });
  return integrate(ode, 'RK4', dt, s => s[n] >= tmax - 1e-9);
}
reg({
  id: 'p313', group: '3.9 Procesos de decaimiento', sec: '3.9', tag: 'P3.13', short: 'Decaimientos nucleares múltiples',
  title: 'Problema 3.13 · Decaimientos nucleares múltiples',
  desc: '(a) ⁷⁶Kr → ⁷⁶Br (14.8 h) → ⁷⁶Se (16.1 h) durante una semana, 1 g inicial. (b) ²⁸Mn → ²⁸Al (21 h) → ²⁸Si (2.31 min): ¿qué aproximación acelera el cálculo? (c) ²¹¹Rn con dos ramas (Figura 3.4), 1 μg inicial.',
  controls: [
    { id: 'case', type: 'select', label: 'Caso', value: 'kr', options: [['kr', '(a) ⁷⁶Kr → ⁷⁶Br → ⁷⁶Se'], ['mn', '(b) ²⁸Mn → ²⁸Al → ²⁸Si'], ['rn', '(c) ²¹¹Rn (dos ramas)']] },
    { id: 'dt', type: 'range', label: 'Δt (horas)', min: .001, max: 1, step: .001, value: .01 },
    { id: 'tu', type: 'check', label: '(a) Tiempo en unidades de la menor vida media', value: false, color: COL.c },
    { id: 'approx', type: 'check', label: '(b) Mostrar aproximación de equilibrio secular', value: true, color: COL.f },
    { id: 'log', type: 'check', label: 'Escala logarítmica', value: false, color: COL.e },
  ],
  eq: 'dN<sub>i</sub>/dt = −λ<sub>i</sub>N<sub>i</sub> + Σ<sub>j</sub> f<sub>ji</sub> λ<sub>j</sub> N<sub>j</sub><br>Equilibrio secular (b): N<sub>Al</sub> ≈ λ<sub>Mn</sub>N<sub>Mn</sub>/λ<sub>Al</sub>',
  views: [{ id: 'v1', title: 'Cantidad de cada isótopo vs tiempo', h: 380 }, { id: 'v2', title: 'Esquema de decaimiento', html: true }],
  run(anim) {
    const cs = V('case'), dt = V('dt'), cols = [COL.a, COL.c, COL.d, COL.f, COL.b, COL.e];
    let sp, br, N0, tmax, unit = 'g', scale = 1, txt, extra = [], steps;
    if (cs === 'kr') {
      sp = [{ n: '⁷⁶Kr', T: 14.8 }, { n: '⁷⁶Br', T: 16.1 }, { n: '⁷⁶Se', T: 0 }]; br = [[0, 1, 1], [1, 2, 1]]; N0 = [1, 0, 0]; tmax = 168;
      txt = '⁷⁶Kr —(CE, 14.8 h)→ ⁷⁶Br —(CE/β⁺, 16.1 h)→ ⁷⁶Se (estable)';
    } else if (cs === 'mn') {
      sp = [{ n: '²⁸Mn', T: 21 }, { n: '²⁸Al', T: 2.31 / 60 }, { n: '²⁸Si', T: 0 }]; br = [[0, 1, 1], [1, 2, 1]]; N0 = [1, 0, 0]; tmax = 100;
      txt = '²⁸Mn —(β⁻, 21 h)→ ²⁸Al —(β⁺, 2.31 min)→ ²⁸Si (estable)<br>Como T½(Al) ≪ T½(Mn), el Al alcanza enseguida el equilibrio secular: se puede eliminar de las ecuaciones y usar un Δt mucho mayor.';
    } else {
      sp = [{ n: '²¹¹Rn', T: 14.6 }, { n: '²¹¹At', T: 7.2 }, { n: '²⁰⁷Po', T: 5.7 }, { n: '²⁰⁷Bi', T: 30 * 8766 }, { n: '²⁰⁷Pb', T: 0 }];
      br = [[0, 1, .74], [0, 2, .26], [1, 4, .582], [1, 3, .418], [2, 3, 1], [3, 4, 1]]; N0 = [1, 0, 0, 0, 0]; tmax = 120; unit = 'μg';
      txt = '²¹¹Rn —(CE 74 %)→ ²¹¹At —(CE 58 %)→ ²¹¹Po —(α, 0.52 s)→ ²⁰⁷Pb<br>²¹¹Rn —(α 26 %)→ ²⁰⁷Po —(CE, 5.7 h)→ ²⁰⁷Bi —(CE, 30 años)→ ²⁰⁷Pb<br>²¹¹At —(α 42 %)→ ²⁰⁷Bi<br>Aproximaciones: ²¹¹Po (0.52 s) decae instantáneamente; las masas se tratan como proporcionales al número de núcleos. Las fracciones de ramificación del ²¹¹At (58/42 %) son valores tabulados.';
    }
    const P = chain(sp, br, N0, dt, tmax); steps = P.length - 1;
    if (cs === 'kr' && V('tu')) scale = 1 / 14.8;
    if (cs === 'mn' && V('approx')) {
      const dtA = Math.max(dt, .5), lM = Math.LN2 / 21, lA = Math.LN2 / (2.31 / 60);
      const Q = chain([{ n: 'Mn', T: 21 }, { n: 'Si', T: 0 }], [[0, 1, 1]], [1, 0], dtA, tmax);
      extra = [{ pts: Q.map(s => [s[2], s[0] * lM / lA]), color: COL.c, dash: [5, 4], label: 'Al (secular)' }, { pts: Q.map(s => [s[2], s[1]]), color: COL.d, dash: [5, 4], label: 'Si (aprox.)' }];
      txt += `<br>Pasos completos: <b>${steps}</b> (Δt=${dt} h) · Pasos aproximados: <b>${Q.length - 1}</b> (Δt=${dtA} h)`;
    }
    const lg = V('log'), tr = v => lg ? Math.log10(Math.max(v, 1e-8)) : v;
    const draw = fr => plot($('v1'), [...sp.map((s, i) => ({ pts: thin(P).filter(q => q[sp.length] <= tmax * fr).map(q => [q[sp.length] * scale, tr(q[i])]), color: cols[i], label: s.n })), ...extra.map(e => ({ ...e, pts: thin(e.pts).filter(p => p[0] <= tmax * fr).map(p => [p[0] * scale, tr(p[1])]) }))],
      { xmin: 0, xmax: tmax * scale, ymin: lg ? -6 : 0, ymax: lg ? .1 : 1.02, xlabel: scale !== 1 ? 't / 14.8 h' : 't (horas)', ylabel: (lg ? 'log₁₀ ' : '') + `cantidad (${unit})` });
    go(anim, draw, 2000);
    $('v2').innerHTML = `<p>${txt}</p>`;
    const last = P[P.length - 1];
    S(tbl(['Isótopo', `t = ${tmax} h (${unit})`], sp.map((s, i) => [`<span style="color:${cols[i]}">${s.n}</span>`, fmt(last[i], 4)])));
  }
});

// ---------------- Problema 3.14 ----------------
function cool(T0, Ts, r, dt, stopT, tmax = 1e4) {
  const P = [[0, T0]]; let T = T0, t = 0;
  while (t < tmax) { const Tn = T - r * (T - Ts) * dt; t += dt; if (stopT !== undefined && Tn <= stopT) { P.push([t - dt + dt * (T - stopT) / (T - Tn), stopT]); break; } T = Tn; P.push([t, T]); }
  return P;
}
reg({
  id: 'p314', group: '3.9 Procesos de decaimiento', sec: '3.9', tag: 'P3.14', short: 'Enfriamiento de una taza de café',
  title: 'Problema 3.14 · Enfriamiento de una taza de café',
  desc: 'Ley de enfriamiento de Newton dT/dt = −r(T − Ts). (a) Prueba con T₀ = 100 °C, Ts = 0 °C, r = 1, Δt = 0.1. (b) Café: r = 0.03 /min, T₀ = 87 °C, Ts = 17 °C. (c) ¿Conviene echar la crema (−5 °C) primero o esperar a que llegue a 80 °C para tomarlo a 75 °C?',
  controls: [
    { id: 'T0', type: 'range', label: 'T₀ (°C)', min: 20, max: 100, step: 1, value: 87 },
    { id: 'Ts', type: 'range', label: 'Ts (°C)', min: -10, max: 40, step: 1, value: 17 },
    { id: 'r', type: 'range', label: 'r (1/min)', min: .005, max: 1, step: .005, value: .03 },
    { id: 'dt', type: 'range', label: 'Δt (min)', min: .01, max: 5, step: .01, value: .1 },
    { id: 'tmax', type: 'range', label: 'Tiempo total (min)', min: 5, max: 200, step: 1, value: 60 },
    { type: 'sep', label: 'Parte (c)' },
    { id: 'cream', type: 'range', label: 'Enfriamiento por la crema (°C)', min: 1, max: 15, step: .5, value: 5 },
    { id: 'sip', type: 'range', label: 'Temperatura para tomar (°C)', min: 40, max: 85, step: .5, value: 75 },
    { id: 'wait', type: 'range', label: 'Esperar hasta (°C) y luego crema', min: 40, max: 90, step: .5, value: 80 },
  ],
  buttons: [{ label: '▶ Simular', primary: true, fn: 'run' }, { label: '(a) Prueba', fn: () => setVals({ T0: 100, Ts: 0, r: 1, dt: .1, tmax: 6 }) }, { label: '(b) Café', fn: () => setVals({ T0: 87, Ts: 17, r: .03, dt: .1, tmax: 60 }) }],
  eq: 'dT/dt = −r (T − Ts)<br>Euler: T<sub>n+1</sub> = T<sub>n</sub> − r(T<sub>n</sub> − Ts)Δt<br>Exacta: T = Ts + (T₀ − Ts)e^(−rt)',
  views: [
    { id: 'v1', title: '(a–b) T(t): Euler vs exacta', h: 300 },
    { id: 'v2', title: '(c) Estrategias con crema', h: 300 },
  ],
  run(anim) {
    const T0 = V('T0'), Ts = V('Ts'), r = V('r'), dt = V('dt'), tm = V('tmax'), cr = V('cream'), sip = V('sip'), wait = V('wait');
    const P = cool(T0, Ts, r, dt, undefined, tm), ex = []; for (let i = 0; i <= 300; i++) { const t = tm * i / 300; ex.push([t, Ts + (T0 - Ts) * Math.exp(-r * t)]); }
    const A = cool(T0 - cr, Ts, r, .01, sip), B1 = cool(T0, Ts, r, .01, wait), tB1 = B1[B1.length - 1][0];
    let B = B1.slice(); B.push([tB1, wait - cr]); if (wait - cr > sip) cool(wait - cr, Ts, r, .01, sip).slice(1).forEach(p => B.push([p[0] + tB1, p[1]]));
    const tA = A[A.length - 1][0], tB = B[B.length - 1][0], tmC = Math.max(tA, tB) * 1.15;
    const draw = fr => {
      plot($('v1'), [{ pts: ex.filter(p => p[0] <= tm * fr), color: '#fff', dash: [5, 4], width: 1.3, label: 'Exacta' }, { pts: thin(P).filter(p => p[0] <= tm * fr), color: COL.c, label: 'Euler' }], { xmin: 0, xmax: tm, xlabel: 't (min)', ylabel: 'T (°C)' });
      plot($('v2'), [{ pts: thin(A).filter(p => p[0] <= tmC * fr), color: COL.a, label: 'Crema primero' }, { pts: thin(B).filter(p => p[0] <= tmC * fr), color: COL.f, label: `Crema a ${wait} °C` }, { pts: [[0, sip], [tmC, sip]], color: COL.c, dash: [3, 4], width: 1, label: `${sip} °C` }], { xmin: 0, xmax: tmC, xlabel: 't (min)', ylabel: 'T (°C)' });
    };
    go(anim, draw, 2000);
    const tExSip = A.length ? tA : 0, err = Math.abs(P[P.length - 1][1] - (Ts + (T0 - Ts) * Math.exp(-r * P[P.length - 1][0])));
    S(`Error final de Euler: <b>${fmt(err)} °C</b><br>Unidades de r: <b>1/min</b><hr><b>(c)</b><br>Crema primero: <b>${tExSip.toFixed(2)} min</b><br>Esperar a ${wait} °C: <b>${tB.toFixed(2)} min</b><br>➜ ${tA < tB ? '<b>Echar la crema primero</b>' : tA > tB ? '<b>Esperar y luego echar la crema</b>' : 'Da igual'} es más rápido.<br><span class="muted">El café más caliente pierde calor más rápido, así que conviene enfriarlo con la crema al final.</span>`);
  }
});
