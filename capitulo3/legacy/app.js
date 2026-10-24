// ============================================================
//  Capítulo 3 — Simulating Particle Motion (Gould/Tobochnik/Christian)
// ============================================================
const g = 9.8;
const $ = id => document.getElementById(id);

// ---------- Pestañas ----------
document.querySelectorAll('.tab').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tab,.panel').forEach(e => e.classList.remove('active'));
  b.classList.add('active'); $(b.dataset.tab).classList.add('active');
});
// Salidas de sliders
[['ff-dt',3],['dr-vt',1],['pr-v0',0],['pr-th',0],['pr-k',4],['dc-l',2],['dc-dt',2]].forEach(([id,d]) => {
  const i = $(id), o = $(id + '-out'); const f = () => o.textContent = (+i.value).toFixed(d);
  i.addEventListener('input', f); f();
});

// ---------- Utilidad de gráficas ----------
function plot(canvas, series, opt = {}) {
  const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  const m = { l: 52, r: 14, t: 14, b: 36 };
  c.clearRect(0, 0, W, H);
  let xs = [], ys = [];
  series.forEach(s => s.pts.forEach(p => { xs.push(p[0]); ys.push(p[1]); }));
  if (!xs.length) return;
  let x0 = opt.xmin ?? Math.min(...xs), x1 = opt.xmax ?? Math.max(...xs);
  let y0 = opt.ymin ?? Math.min(...ys), y1 = opt.ymax ?? Math.max(...ys);
  if (x1 === x0) x1 = x0 + 1; if (y1 === y0) y1 = y0 + 1;
  const pad = (y1 - y0) * 0.06; if (opt.ymin === undefined) y0 -= pad; if (opt.ymax === undefined) y1 += pad;
  const X = x => m.l + (x - x0) / (x1 - x0) * (W - m.l - m.r);
  const Y = y => H - m.b - (y - y0) / (y1 - y0) * (H - m.t - m.b);
  // rejilla
  c.strokeStyle = '#ffffff12'; c.fillStyle = '#8a93b8'; c.font = '11px JetBrains Mono'; c.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const xv = x0 + i * (x1 - x0) / 5, yv = y0 + i * (y1 - y0) / 5;
    c.beginPath(); c.moveTo(X(xv), m.t); c.lineTo(X(xv), H - m.b); c.stroke();
    c.beginPath(); c.moveTo(m.l, Y(yv)); c.lineTo(W - m.r, Y(yv)); c.stroke();
    c.textAlign = 'center'; c.fillText(+xv.toFixed(2), X(xv), H - m.b + 15);
    c.textAlign = 'right'; c.fillText(+yv.toFixed(1), m.l - 6, Y(yv) + 4);
  }
  c.textAlign = 'center'; if (opt.xlabel) c.fillText(opt.xlabel, (W + m.l) / 2, H - 4);
  if (opt.ylabel) { c.save(); c.translate(12, H / 2); c.rotate(-Math.PI / 2); c.fillText(opt.ylabel, 0, 0); c.restore(); }
  // series
  series.forEach(s => {
    c.strokeStyle = c.fillStyle = s.color; c.lineWidth = s.width || 2; c.setLineDash(s.dash || []);
    if (s.dots) s.pts.forEach(p => { c.beginPath(); c.arc(X(p[0]), Y(p[1]), 2.5, 0, 7); c.fill(); });
    else { c.beginPath(); s.pts.forEach((p, i) => i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1]))); c.stroke(); }
    c.setLineDash([]);
  });
  // leyenda
  let ly = m.t + 6;
  series.filter(s => s.label).forEach(s => {
    c.fillStyle = s.color; c.fillRect(W - m.r - 150, ly, 14, 3);
    c.fillStyle = '#e6e9f5'; c.textAlign = 'left'; c.fillText(s.label, W - m.r - 130, ly + 5); ly += 15;
  });
  return { X, Y };
}

// ============================================================
// 1. CAÍDA LIBRE — comparación de algoritmos
// ============================================================
const ALGOS = {
  euler:  { name: 'Euler', color: '#ff6b8b', step: (y, v, a, dt) => [y + v * dt, v + a(y, v) * dt] },
  ec:     { name: 'Euler‑Cromer', color: '#ffb347', step: (y, v, a, dt) => { const vn = v + a(y, v) * dt; return [y + vn * dt, vn]; } },
  er:     { name: 'Euler‑Richardson', color: '#5ee6a8', step: (y, v, a, dt) => {
            const am = a(y, v), vm = v + am * dt / 2, ym = y + v * dt / 2, amid = a(ym, vm);
            return [y + vm * dt, v + amid * dt]; } },
  verlet: { name: 'Verlet', color: '#7aa8ff', step: (y, v, a, dt) => {
            const a0 = a(y, v), yn = y + v * dt + 0.5 * a0 * dt * dt, a1 = a(yn, v);
            return [yn, v + 0.5 * (a0 + a1) * dt]; } },
};
const ffKey = { euler: 'ff-euler', ec: 'ff-ec', er: 'ff-er', verlet: 'ff-verlet' };
let ffAnimId;

function integrate(algo, y0, v0, dt, accel, stop) {
  let y = y0, v = v0, t = 0; const pts = [[0, y0, v0]];
  while (!stop(y, t) && t < 1000) { [y, v] = algo.step(y, v, accel, dt); t += dt; pts.push([t, y, v]); }
  return pts;
}

function runFreefall(animate = true) {
  const y0 = +$('ff-y0').value, v0 = +$('ff-v0').value, dt = +$('ff-dt').value;
  const acc = () => -g;
  const tHit = (v0 + Math.sqrt(v0 * v0 + 2 * g * y0)) / g;
  const exact = []; for (let i = 0; i <= 200; i++) { const t = tHit * i / 200; exact.push([t, y0 + v0 * t - 0.5 * g * t * t]); }
  const sel = Object.keys(ALGOS).filter(k => $(ffKey[k]).checked);
  const res = sel.map(k => ({ k, pts: integrate(ALGOS[k], y0, v0, dt, acc, y => y < 0) }));

  const draw = (frac) => {
    const tNow = tHit * frac * 1.05;
    const series = [{ pts: exact.filter(p => p[0] <= tNow), color: '#ffffff', width: 1.5, dash: [5, 4], label: 'Exacta' }];
    res.forEach(r => series.push({ pts: r.pts.filter(p => p[0] <= tNow).map(p => [p[0], p[1]]), color: ALGOS[r.k].color, dots: dt > 0.04, label: ALGOS[r.k].name }));
    if (dt <= 0.04) series.forEach((s, i) => { if (i) s.dots = false; });
    plot($('ff-plot'), series, { xmin: 0, xmax: tHit * 1.05, ymin: Math.min(0, ...res.flatMap(r => r.pts.map(p => p[1]))), ymax: Math.max(y0, y0 + v0 * v0 / (2 * g)), xlabel: 't (s)', ylabel: 'y (m)' });
    drawFFAnim(res, tNow, y0, v0, tHit);
  };
  cancelAnimationFrame(ffAnimId);
  if (animate) { let f = 0; const loop = () => { f += 0.008; draw(Math.min(f, 1)); if (f < 1) ffAnimId = requestAnimationFrame(loop); }; loop(); }
  else draw(1);

  // tabla de errores
  let html = '<tr><th>Algoritmo</th><th>t impacto (s)</th><th>v impacto (m/s)</th><th>Error |Δv|</th></tr>';
  const vExact = -(Math.sqrt(v0 * v0 + 2 * g * y0));
  html += `<tr><td>Exacta</td><td>${tHit.toFixed(4)}</td><td>${vExact.toFixed(4)}</td><td>—</td></tr>`;
  res.forEach(r => {
    const a = r.pts[r.pts.length - 2], b = r.pts[r.pts.length - 1]; const s = a[1] / (a[1] - b[1]);
    const t = a[0] + s * (b[0] - a[0]), v = a[2] + s * (b[2] - a[2]);
    html += `<tr><td style="color:${ALGOS[r.k].color}">${ALGOS[r.k].name}</td><td>${t.toFixed(4)}</td><td>${v.toFixed(4)}</td><td>${Math.abs(v - vExact).toExponential(2)}</td></tr>`;
  });
  $('ff-table').innerHTML = html;
}

function drawFFAnim(res, tNow, y0, v0, tHit) {
  const cv = $('ff-anim'), c = cv.getContext('2d'), W = cv.width, H = cv.height;
  c.clearRect(0, 0, W, H);
  const ymax = Math.max(y0, y0 + v0 * v0 / (2 * g)) * 1.05, Y = y => H - 25 - (y / ymax) * (H - 45);
  c.fillStyle = '#1b2245'; c.fillRect(0, H - 25, W, 25);
  const cols = [{ name: 'Exacta', color: '#ffffff', y: Math.max(0, y0 + v0 * Math.min(tNow, tHit) - 0.5 * g * Math.min(tNow, tHit) ** 2) }];
  res.forEach(r => { const p = r.pts.filter(p => p[0] <= tNow).pop(); cols.push({ name: ALGOS[r.k].name, color: ALGOS[r.k].color, y: Math.max(0, p[1]) }); });
  const w = W / cols.length;
  cols.forEach((o, i) => {
    const x = w * (i + .5);
    c.strokeStyle = '#ffffff10'; c.beginPath(); c.moveTo(x, 10); c.lineTo(x, H - 25); c.stroke();
    const gr = c.createRadialGradient(x - 4, Y(o.y) - 4, 2, x, Y(o.y), 14); gr.addColorStop(0, '#fff'); gr.addColorStop(1, o.color);
    c.fillStyle = gr; c.shadowColor = o.color; c.shadowBlur = 18; c.beginPath(); c.arc(x, Y(o.y) - 10, 10, 0, 7); c.fill(); c.shadowBlur = 0;
    c.fillStyle = '#8a93b8'; c.font = '12px Outfit'; c.textAlign = 'center'; c.fillText(o.name, x, H - 8);
  });
  c.fillStyle = '#22d3ee'; c.font = '12px JetBrains Mono'; c.textAlign = 'left'; c.fillText(`t = ${tNow.toFixed(2)} s`, 10, 18);
}
$('ff-run').onclick = () => runFreefall(true);
$('ff-reset').onclick = () => { $('ff-y0').value = 10; $('ff-v0').value = 0; $('ff-dt').value = 0.1; $('ff-dt').dispatchEvent(new Event('input')); runFreefall(false); };
['ff-euler', 'ff-ec', 'ff-er', 'ff-verlet', 'ff-dt'].forEach(id => $(id).addEventListener('input', () => runFreefall(false)));

// ============================================================
// 2. RESISTENCIA DEL AIRE
// ============================================================
let drAnimId;
function runDrag(animate = true) {
  const vt = +$('dr-vt').value, y0 = +$('dr-y0').value, dt = Math.max(0.001, +$('dr-dt').value), model = $('dr-model').value;
  const acc = (y, v) => model === 'lin' ? -g * (1 + v / vt) : -g * (1 + v * Math.abs(v) / (vt * vt));
  // nota: v < 0 al caer → cuadrático -g(1 + v|v|/vt²) = -g + g v²/vt² (el arrastre se opone a v)
  const air = integrate(ALGOS.er, y0, 0, dt, acc, y => y < 0);
  const vac = integrate(ALGOS.er, y0, 0, dt, () => -g, y => y < 0);
  const T = air[air.length - 1][0];
  const draw = frac => {
    const tNow = T * frac;
    const a = air.filter(p => p[0] <= tNow), b = vac.filter(p => p[0] <= tNow);
    plot($('dr-v'), [
      { pts: a.map(p => [p[0], -p[2]]), color: '#22d3ee', label: 'Con aire' },
      { pts: b.map(p => [p[0], -p[2]]), color: '#ff6b8b', dash: [5, 4], label: 'Vacío' },
      { pts: [[0, vt], [T, vt]], color: '#ffb347', width: 1, dash: [2, 4], label: 'v terminal' },
    ], { xmin: 0, xmax: T, ymin: 0, ymax: Math.max(vt * 1.2, -vac[vac.length - 1][2]), xlabel: 't (s)', ylabel: '|v| (m/s)' });
    plot($('dr-y'), [
      { pts: a.map(p => [p[0], p[1]]), color: '#22d3ee', label: 'Con aire' },
      { pts: b.map(p => [p[0], p[1]]), color: '#ff6b8b', dash: [5, 4], label: 'Vacío' },
    ], { xmin: 0, xmax: T, ymin: 0, ymax: y0, xlabel: 't (s)', ylabel: 'y (m)' });
    // animación
    const cv = $('dr-anim'), c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
    const X = y => 30 + (1 - y / y0) * (W - 70);
    c.fillStyle = '#1b2245'; c.fillRect(W - 30, 0, 30, H);
    [[a, '#22d3ee', H * .33, 'Con aire'], [b, '#ff6b8b', H * .7, 'Vacío']].forEach(([arr, col, yy, lbl]) => {
      const p = arr[arr.length - 1]; const x = X(Math.max(0, p[1]));
      c.strokeStyle = col + '44'; c.lineWidth = 2; c.beginPath(); c.moveTo(30, yy); c.lineTo(x, yy); c.stroke();
      c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 20; c.beginPath(); c.arc(x, yy, 11, 0, 7); c.fill(); c.shadowBlur = 0;
      c.fillStyle = '#e6e9f5'; c.font = '12px JetBrains Mono'; c.fillText(`${lbl}: y=${Math.max(0, p[1]).toFixed(1)} m  |v|=${(-p[2]).toFixed(2)} m/s`, 30, yy - 18);
    });
    c.fillStyle = '#8a93b8'; c.fillText('suelo →', W - 95, 15);
  };
  cancelAnimationFrame(drAnimId);
  if (animate) { let f = 0; const loop = () => { f += 0.006; draw(Math.min(f, 1)); if (f < 1) drAnimId = requestAnimationFrame(loop); }; loop(); } else draw(1);
  const vf = -air[air.length - 1][2];
  $('dr-stats').innerHTML = `Tiempo de caída (aire): <b>${T.toFixed(2)} s</b><br>Tiempo (vacío): <b>${vac[vac.length - 1][0].toFixed(2)} s</b><br>|v| final (aire): <b>${vf.toFixed(2)} m/s</b><br>|v|/v_t: <b>${(vf / vt * 100).toFixed(1)} %</b>`;
}
$('dr-run').onclick = () => runDrag(true);
$('dr-reset').onclick = () => { $('dr-vt').value = 10; $('dr-y0').value = 100; $('dr-dt').value = 0.01; $('dr-vt').dispatchEvent(new Event('input')); runDrag(false); };
['dr-model', 'dr-vt'].forEach(id => $(id).addEventListener('input', () => runDrag(false)));

// ============================================================
// 3. PROYECTIL 2D
// ============================================================
let prHistory = [], prAnimId;
const prColors = ['#22d3ee', '#c792ea', '#5ee6a8', '#ffb347', '#ff6b8b', '#7aa8ff'];

function projectile(v0, th, k, h, dt = 0.005) {
  let x = 0, y = h, vx = v0 * Math.cos(th), vy = v0 * Math.sin(th), t = 0; const pts = [[x, y]]; let ymax = y;
  const a = (vx, vy) => { const v = Math.hypot(vx, vy); return [-k * v * vx, -g - k * v * vy]; };
  while (y >= 0 && t < 200) {
    const [ax, ay] = a(vx, vy);
    const vxm = vx + ax * dt / 2, vym = vy + ay * dt / 2;
    const [axm, aym] = a(vxm, vym);
    x += vxm * dt; y += vym * dt; vx += axm * dt; vy += aym * dt; t += dt;
    pts.push([x, y]); ymax = Math.max(ymax, y);
  }
  const p = pts[pts.length - 2], q = pts[pts.length - 1], s = p[1] / (p[1] - q[1] || 1);
  const R = p[0] + s * (q[0] - p[0]); pts[pts.length - 1] = [R, 0];
  return { pts, R, ymax, T: t };
}

function drawProjectile(cur, frac) {
  const all = [...prHistory, cur].filter(Boolean);
  let xm = 10, ym = 5; all.forEach(o => { xm = Math.max(xm, o.vac.R, o.air.R); ym = Math.max(ym, o.vac.ymax, o.air.ymax); });
  const series = [];
  all.forEach((o, i) => {
    const isCur = o === cur; const n = isCur ? Math.max(2, Math.floor(o.air.pts.length * frac)) : o.air.pts.length;
    const nv = isCur ? Math.max(2, Math.floor(o.vac.pts.length * frac)) : o.vac.pts.length;
    series.push({ pts: o.vac.pts.slice(0, nv), color: o.color + '88', dash: [4, 4], width: 1.2 });
    series.push({ pts: o.air.pts.slice(0, n), color: o.color, width: 2.5, label: `θ=${o.th}° v₀=${o.v0}` });
  });
  const tr = plot($('pr-canvas'), series, { xmin: 0, xmax: xm * 1.05, ymin: 0, ymax: ym * 1.15, xlabel: 'x (m)', ylabel: 'y (m)' });
  if (cur && tr) {
    const n = Math.max(1, Math.floor(cur.air.pts.length * frac)) - 1, p = cur.air.pts[n], c = $('pr-canvas').getContext('2d');
    c.fillStyle = '#fff'; c.shadowColor = cur.color; c.shadowBlur = 20; c.beginPath(); c.arc(tr.X(p[0]), tr.Y(p[1]), 6, 0, 7); c.fill(); c.shadowBlur = 0;
  }
}

function launch(animate = true) {
  const v0 = +$('pr-v0').value, th = +$('pr-th').value, k = +$('pr-k').value, h = +$('pr-h').value;
  if (!$('pr-keep').checked) prHistory = [];
  const cur = { v0, th, color: prColors[prHistory.length % prColors.length],
    air: projectile(v0, th * Math.PI / 180, k, h), vac: projectile(v0, th * Math.PI / 180, 0, h) };
  $('pr-stats').innerHTML = `Alcance (aire): <b>${cur.air.R.toFixed(2)} m</b><br>Alcance (vacío): <b>${cur.vac.R.toFixed(2)} m</b><br>Altura máx (aire): <b>${cur.air.ymax.toFixed(2)} m</b><br>Tiempo de vuelo: <b>${cur.air.T.toFixed(2)} s</b><br>Reducción por arrastre: <b>${((1 - cur.air.R / cur.vac.R) * 100).toFixed(1)} %</b>`;
  cancelAnimationFrame(prAnimId);
  const finish = () => { prHistory.push(cur); if (prHistory.length > 6) prHistory.shift(); drawProjectile(null, 1); };
  if (animate) { let f = 0; const loop = () => { f += 0.012; drawProjectile(cur, Math.min(f, 1)); if (f < 1) prAnimId = requestAnimationFrame(loop); else finish(); }; loop(); }
  else finish();
  rangeVsAngle();
}

function rangeVsAngle(best) {
  const v0 = +$('pr-v0').value, k = +$('pr-k').value, h = +$('pr-h').value;
  const air = [], vac = [];
  for (let a = 1; a <= 89; a++) { air.push([a, projectile(v0, a * Math.PI / 180, k, h, 0.01).R]); vac.push([a, projectile(v0, a * Math.PI / 180, 0, h, 0.01).R]); }
  const s = [{ pts: vac, color: '#ff6b8b', dash: [5, 4], label: 'Vacío' }, { pts: air, color: '#22d3ee', label: 'Con aire' }];
  const bestA = air.reduce((m, p) => p[1] > m[1] ? p : m);
  s.push({ pts: [[bestA[0], 0], [bestA[0], bestA[1]]], color: '#ffb347', width: 1, dash: [2, 3], label: `θ óptimo ≈ ${bestA[0]}°` });
  plot($('pr-range'), s, { xmin: 0, xmax: 90, ymin: 0, xlabel: 'θ (°)', ylabel: 'R (m)' });
  return bestA[0];
}
$('pr-run').onclick = () => launch(true);
$('pr-opt').onclick = () => { const a = rangeVsAngle(); $('pr-th').value = a; $('pr-th').dispatchEvent(new Event('input')); launch(true); };
$('pr-clear').onclick = () => { prHistory = []; $('pr-canvas').getContext('2d').clearRect(0, 0, 9999, 9999); $('pr-stats').innerHTML = ''; };
['pr-v0', 'pr-k', 'pr-h'].forEach(id => $(id).addEventListener('change', () => rangeVsAngle()));

// ============================================================
// 4. DECAIMIENTO RADIACTIVO
// ============================================================
let dcTimer, nuclei = [];
function drawNuclei() {
  const cv = $('dc-grid'), c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
  const n = nuclei.length, cols = Math.ceil(Math.sqrt(n * W / H)), rows = Math.ceil(n / cols), s = Math.min(W / cols, H / rows);
  nuclei.forEach((alive, i) => {
    const x = (i % cols + .5) * s, y = (Math.floor(i / cols) + .5) * s;
    c.fillStyle = alive ? '#5ee6a8' : '#2a3158';
    if (alive) { c.shadowColor = '#5ee6a8'; c.shadowBlur = 6; }
    c.beginPath(); c.arc(x, y, s * .35, 0, 7); c.fill(); c.shadowBlur = 0;
  });
}
function runDecay() {
  clearInterval(dcTimer);
  const N0 = Math.min(2500, Math.max(10, +$('dc-n0').value)), lam = +$('dc-l').value, dt = +$('dc-dt').value;
  nuclei = Array(N0).fill(true);
  const tEnd = 5 / lam; let t = 0, Ne = N0, Nmc = N0;
  const exact = [], eul = [[0, N0]], mc = [[0, N0]];
  for (let i = 0; i <= 200; i++) { const tt = tEnd * i / 200; exact.push([tt, N0 * Math.exp(-lam * tt)]); }
  const p = lam * dt;
  dcTimer = setInterval(() => {
    t += dt; Ne = Ne - lam * Ne * dt;
    for (let i = 0; i < nuclei.length; i++) if (nuclei[i] && Math.random() < p) { nuclei[i] = false; Nmc--; }
    eul.push([t, Ne]); mc.push([t, Nmc]);
    drawNuclei();
    plot($('dc-plot'), [
      { pts: exact, color: '#ffffff', dash: [5, 4], width: 1.5, label: 'Exacta' },
      { pts: eul, color: '#ffb347', label: 'Euler' },
      { pts: mc, color: '#5ee6a8', dots: true, label: 'Monte Carlo' },
    ], { xmin: 0, xmax: tEnd, ymin: 0, ymax: N0, xlabel: 't (s)', ylabel: 'N' });
    const ex = N0 * Math.exp(-lam * t);
    $('dc-stats').innerHTML = `t = <b>${t.toFixed(2)} s</b><br>Exacta: <b>${ex.toFixed(1)}</b><br>Euler: <b>${Ne.toFixed(1)}</b><br>Monte Carlo: <b>${Nmc}</b><br>Vida media T½: <b>${(Math.LN2 / lam).toFixed(2)} s</b>`;
    if (t >= tEnd || Nmc === 0) clearInterval(dcTimer);
  }, 60);
}
$('dc-run').onclick = runDecay;
$('dc-reset').onclick = () => { clearInterval(dcTimer); nuclei = Array(Math.min(2500, +$('dc-n0').value)).fill(true); drawNuclei(); $('dc-plot').getContext('2d').clearRect(0, 0, 9999, 9999); $('dc-stats').innerHTML = ''; };

// ---------- Estado inicial ----------
runFreefall(false); runDrag(false); launch(false); $('dc-reset').click();
