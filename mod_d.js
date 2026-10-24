'use strict';
// ============================================================
//  Sección 3.11 y Apéndice 3A
//  Niveles de simulación · Integración numérica de la ecuación
//  de movimiento de Newton (todos los algoritmos del apéndice)
// ============================================================
const GA = 'Apéndice 3A · Integración de Newton';
const PAL = ['#ff6b8b', '#ffb347', '#5ee6a8', '#22d3ee', '#7aa8ff', '#c792ea', '#ffd166', '#06d6a0', '#f0789b', '#9b8cff', '#4cc9f0'];
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
// ajuste por mínimos cuadrados de y = Σ cᵢ·baseᵢ(x) (ecuaciones normales con eliminación de Gauss)
function lsq(pts, base) {
  const n = base.length, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  pts.forEach(([x, y]) => { const b = base.map(f => f(x)); for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += b[i] * b[j]; A[i][n] += b[i] * y; } });
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; if (!A[i][i]) continue;
    for (let r = 0; r < n; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; }
  }
  return A.map((row, i) => row[i] ? row[n] / row[i] : 0);
}
const pend = P => { const n = P.length, sx = P.reduce((s, p) => s + p[0], 0), sy = P.reduce((s, p) => s + p[1], 0), sxx = P.reduce((s, p) => s + p[0] ** 2, 0), sxy = P.reduce((s, p) => s + p[0] * p[1], 0); return (n * sxy - sx * sy) / (n * sxx - sx * sx); };

// ============================================================
//  Sección 3.11 · Niveles de simulación
// ============================================================
// Modelo microscópico: el cuerpo recibe choques elásticos de moléculas cuya
// velocidad sigue una maxwelliana. El flujo de choques es ∝ |u − v|, así que
// el arrastre lineal y el cuadrático de la sección 3.7 emergen del promedio.
function kick(M, m, sig, vb, umx) {
  const u = gauss() * sig, rel = u - vb;
  return Math.random() < Math.abs(rel) / umx ? 2 * m * rel / (M + m) : 0;
}
// Curva de fuerza media. Dos trucos de muestreo frente a simular choque por choque:
//  · en vez de aceptar o rechazar cada candidato con probabilidad |u − v|/umx se acumula
//    directamente su valor esperado (mismo resultado, mucho menos ruido);
//  · cada u se usa junto con −u (muestreo antitético), lo que cancela exactamente la parte
//    par del estimador y garantiza ⟨F⟩ = 0 cuando el cuerpo está en reposo.
function dragCurve(M, m, sig, rate, nSamp) {
  const k0 = 2 * m * M / (M + m), F = [];
  for (let k = -14; k <= 14; k++) {
    const vb = k / 14 * 2.2 * sig, umx = 4 * sig + Math.abs(vb);
    let dp = 0;
    for (let i = 0; i < nSamp; i += 2) {
      const u = gauss() * sig, a = u - vb, b = -u - vb;
      dp += a * Math.abs(a) + b * Math.abs(b);
    }
    F.push([vb, k0 * rate * dp / (umx * nSamp)]);
  }
  return F;
}
function microRun(M, m, sig, rate, gg, dt, T) {
  const P = [[0, 0, 0]]; let vb = 0, y = 0, t = 0;
  while (t < T - 1e-12) {
    vb -= gg * dt;
    const umx = 4 * sig + Math.abs(vb), lam = rate * dt;
    let nc = Math.floor(lam); if (Math.random() < lam - nc) nc++;
    for (let i = 0; i < nc; i++) vb += kick(M, m, sig, vb, umx);
    y += vb * dt; t += dt; P.push([t, vb, y]);
  }
  return P;
}
reg({
  id: 's311', group: '3.11 Niveles de simulación', sec: '3.11', tag: '§3.11', short: 'De las moléculas al término de arrastre',
  title: 'Sección 3.11 · Niveles de simulación',
  desc: 'El libro señala que hasta aquí hemos resuelto modelos: el guijarro es un punto sin estructura y el aire entero se resume en un término de fricción dependiente de la velocidad. Aquí se comparan los dos niveles de descripción: a la izquierda un modelo microscópico en el que el cuerpo recibe choques elásticos de moléculas con distribución maxwelliana, y a la derecha el modelo fenomenológico F_d = −(C₁v + C₂v|v|) de la sección 3.7, cuyos coeficientes se miden a partir de los choques.',
  controls: [
    { id: 'M', type: 'range', label: 'Masa del cuerpo M', min: 1, max: 40, step: .5, value: 10 },
    { id: 'm', type: 'range', label: 'Masa molecular m', min: .01, max: .3, step: .01, value: .05 },
    { id: 'sig', type: 'range', label: 'Rapidez térmica σ (temperatura)', min: .3, max: 3, step: .05, value: 1 },
    { id: 'rate', type: 'range', label: 'Candidatos a choque por unidad de tiempo', min: 200, max: 8000, step: 100, value: 2000 },
    { id: 'gg', type: 'range', label: 'Gravedad g', min: .5, max: 60, step: .5, value: 8 },
    { type: 'sep', label: 'Integración' },
    { id: 'dt', type: 'range', label: 'Δt', min: .0001, max: .002, step: .0001, value: .0005 },
    { id: 'T', type: 'range', label: 'Tiempo total', min: .2, max: 3, step: .1, value: 1 },
    { id: 'nr', type: 'range', label: 'Realizaciones microscópicas', min: 1, max: 5, step: 1, value: 3 },
  ],
  live: false,
  buttons: [{ label: '▶ Simular los dos niveles', primary: true, fn: 'run' },
  { label: '⚖ Ajustar g para v_t ≈ σ', fn: m => m.tune() }],
  eq: 'Microscópico: v ← v + 2m(u − v)/(M + m) por cada choque<br>u ~ maxwelliana(σ) · flujo ∝ |u − v|<br><br>Fenomenológico: M dv/dt = −Mg − (C₁v + C₂v|v|)<br>C₁ y C₂ se <b>miden</b> sobre el modelo microscópico',
  views: [
    { id: 'v1', title: 'Nivel microscópico: el cuerpo y las moléculas', h: 300 },
    { id: 'v2', title: 'v(t): realizaciones microscópicas (ruidosas) vs modelo fenomenológico', half: true, w: 440, h: 300 },
    { id: 'v3', title: 'Fuerza media medida ⟨F⟩ en función de v, y su ajuste', half: true, w: 440, h: 300 },
    { id: 'v4', title: 'Los niveles de descripción', html: true },
  ],
  coef() {
    const M = V('M'), m = V('m'), sig = V('sig'), rate = V('rate');
    const F = dragCurve(M, m, sig, rate, 9000);
    const [c1, c2] = lsq(F, [v => -v, v => -v * Math.abs(v)]);
    return { M, m, sig, rate, F, c1, c2 };
  },
  tune() {
    const { M, sig, c1, c2 } = this.coef();
    setVals({ gg: Math.max(.5, Math.min(60, (c1 * sig + c2 * sig * sig) / M)).toFixed(1) });
  },
  run(anim) {
    const { M, m, sig, rate, F, c1, c2 } = this.coef();
    const gg = V('gg'), dt = V('dt'), T = V('T'), nr = V('nr');
    const w = c2 > 1e-9 ? (-c1 + Math.sqrt(c1 * c1 + 4 * c2 * M * gg)) / (2 * c2) : M * gg / c1;
    // modelo fenomenológico con los coeficientes medidos
    const PH = integrate(new ODE([0, 0], s => [-gg - (c1 * s[0] + c2 * s[0] * Math.abs(s[0])) / M, 1]), 'RK4', dt, s => s[1] >= T);
    const R = []; for (let i = 0; i < nr; i++) R.push(microRun(M, m, sig, rate, gg, dt, T));
    const mol = []; for (let i = 0; i < 150; i++) mol.push([Math.random(), Math.random(), gauss() * .35, gauss() * .35]);
    const ymin = Math.min(-w * 1.5, ...R.map(P => P[P.length - 1][1])) * 1.1;
    const draw = fr => {
      const n = Math.max(2, Math.floor(R[0].length * fr)), tn = R[0][n - 1][0];
      plot($('v2'), [
        ...R.map((P, i) => ({ pts: thin(P.slice(0, n)).map(p => [p[0], p[1]]), color: PAL[i] + 'bb', width: 1.2, label: i ? '' : 'microscópico' })),
        { pts: thin(PH).filter(s => s[1] <= tn).map(s => [s[1], s[0]]), color: '#fff', width: 2.4, label: 'fenomenológico' },
        { pts: [[0, -w], [T, -w]], color: COL.c, dash: [4, 4], width: 1, label: `−v_t = ${(-w).toFixed(3)}` },
      ], { xmin: 0, xmax: T, ymin, ymax: .05 * w, xlabel: 't', ylabel: 'v' });
      // animación
      const cv = $('v1'), c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
      c.strokeStyle = '#ffffff18'; c.strokeRect(8, 8, W - 16, H - 16);
      c.fillStyle = '#7aa8ff55';
      mol.forEach(p => {
        const x = 12 + ((p[0] + p[2] * fr * .6) % 1 + 1) % 1 * (W - 24), y = 12 + ((p[1] + p[3] * fr * .6) % 1 + 1) % 1 * (H - 24);
        c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill();
      });
      const yb = R[0][n - 1][2], span = Math.max(1e-6, Math.abs(R[0][R[0].length - 1][2]));
      const py = 40 + (-yb / span) * (H - 90);
      dot2(c, W / 2, py, 18, COL.a);
      c.strokeStyle = COL.a + '55'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(W / 2, 40); c.lineTo(W / 2, py); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#e6e9f5'; c.font = '12px JetBrains Mono'; c.textAlign = 'left';
      c.fillText(`t = ${tn.toFixed(3)}`, 16, 26); c.fillText(`v = ${R[0][n - 1][1].toFixed(3)}`, 16, 42);
      c.textAlign = 'right'; c.fillStyle = '#8a93b8'; c.fillText(`${mol.length} moléculas dibujadas de ~${Math.round(rate)} candidatos/u.t.`, W - 16, 26);
    };
    go(anim, draw, 2600);
    const vs = []; for (let v = -2.2 * sig; v <= 2.2 * sig; v += .05) vs.push(v);
    plot($('v3'), [
      { pts: F, color: COL.c, dots: true, r: 3, label: '⟨F⟩ medida' },
      { pts: vs.map(v => [v, -(c1 * v + c2 * v * Math.abs(v))]), color: COL.a, label: 'ajuste C₁v + C₂v|v|' },
      { pts: vs.map(v => [v, -c1 * v]), color: COL.f, dash: [5, 4], width: 1.2, label: 'solo lineal C₁v' },
    ], { xlabel: 'v', ylabel: '⟨F⟩', legend: 'left' });
    $('v4').innerHTML = tbl(['Nivel', 'Qué se representa', 'Grados de libertad', 'Dónde aparece en el capítulo'], [
      ['Fenomenológico', 'Cuerpo puntual + término −C₁v − C₂v|v|', '2 (y, v)', 'P3.8, P3.9, P3.10, P3.11'],
      ['Microscópico (aquí)', 'Choques individuales con moléculas maxwellianas', '2 + el gas, estocástico', 'Sección 3.11'],
      ['Molecular completo', 'Potencial de interacción entre todas las partículas', '~6N', 'Capítulos 8 y siguientes'],
    ]) + `<p class="hint">Lo que se gana en simplicidad se pierde en rango de aplicabilidad. El modelo fenomenológico reproduce v(t) con dos números (C₁ y C₂) pero no sabe nada de la temperatura; el microscópico los <em>predice</em> a partir de σ, m y la tasa de choques, y además produce el ruido térmico que el modelo continuo no puede dar. El libro llama «simulación» al segundo nivel y «solución numérica de un modelo» al primero: esa es la frontera que se cruza a partir del capítulo 4.</p>`;
    S(tbl(['Medido sobre el modelo microscópico', 'Valor'], [
      ['C₁ (arrastre lineal)', fmt(c1, 4)], ['C₂ (arrastre cuadrático)', fmt(c2, 4)],
      ['C₂σ / C₁ (peso del término v²)', fmt(c2 * sig / c1, 3)],
      ['v terminal predicha', fmt(w, 4)], ['v final microscópica', fmt(R[0][R[0].length - 1][1], 4)],
      ['τ = M/C₁', fmt(M / c1, 4)],
    ]) + `<p class="muted">Con v ≪ σ domina el término lineal (3.10a); cuando |v| se acerca a σ el flujo de choques crece con la propia velocidad y aparece el término cuadrático (3.10b). Sube σ o baja g para ver cómo cambia el peso relativo.</p>`);
  }
});

// ============================================================
//  A3A.1 · Comparación de todos los algoritmos del apéndice
// ============================================================
// Cada entrada construye un «stepper» sobre el estado s = {x, v, t}.
// Convención: tras cada paso, s.x y s.v corresponden al mismo instante s.t.
const ALG = {
  euler: {
    n: 'Euler', ec: '3.33', ord: '1',
    mk: (a, s, h) => () => { const an = a(s.x, s.v, s.t); s.x += s.v * h; s.v += an * h; s.t += h; }
  },
  cromer: {
    n: 'Euler–Cromer', ec: '3.34', ord: '1 (simpléctico)',
    mk: (a, s, h) => () => { s.v += a(s.x, s.v, s.t) * h; s.x += s.v * h; s.t += h; }
  },
  medio: {
    n: 'Punto medio', ec: '3.35', ord: '2 en x, 1 en v',
    mk: (a, s, h) => () => { const vn = s.v + a(s.x, s.v, s.t) * h; s.x += (vn + s.v) / 2 * h; s.v = vn; s.t += h; }
  },
  mpaso: {
    n: 'Medio paso (leapfrog)', ec: '3.37', ord: '2',
    mk: (a, s, h) => { let an = a(s.x, s.v, s.t), vh = s.v - an * h / 2; return () => { vh += an * h; s.x += vh * h; s.t += h; an = a(s.x, s.v, s.t); s.v = vh + an * h / 2; }; }
  },
  er: {
    n: 'Euler–Richardson (RK2 medio)', ec: '3.55', ord: '2',
    mk: (a, s, h) => () => {
      const k1v = a(s.x, s.v, s.t) * h, k1x = s.v * h;
      const k2v = a(s.x + k1x / 2, s.v + k1v / 2, s.t + h / 2) * h, k2x = (s.v + k1v / 2) * h;
      s.x += k2x; s.v += k2v; s.t += h;
    }
  },
  rk2e: {
    n: 'RK2 extremo (endpoint)', ec: '3.57', ord: '2',
    mk: (a, s, h) => () => {
      const k1v = a(s.x, s.v, s.t) * h, k1x = s.v * h;
      const k2v = a(s.x + k1x, s.v + k1v, s.t + h) * h, k2x = (s.v + k1v) * h;
      s.x += (k1x + k2x) / 2; s.v += (k1v + k2v) / 2; s.t += h;
    }
  },
  ralston: {
    n: 'RK2 de Ralston', ec: '3.58', ord: '2',
    mk: (a, s, h) => () => {
      const k1v = a(s.x, s.v, s.t) * h, k1x = s.v * h;
      const k2v = a(s.x + .75 * k1x, s.v + .75 * k1v, s.t + .75 * h) * h, k2x = (s.v + .75 * k1v) * h;
      s.x += k1x / 3 + 2 * k2x / 3; s.v += k1v / 3 + 2 * k2v / 3; s.t += h;
    }
  },
  verlet: {
    n: 'Verlet de velocidades', ec: '3.48', ord: '2 (simpléctico)',
    mk: (a, s, h) => { let an = a(s.x, s.v, s.t); return () => { s.x += s.v * h + .5 * an * h * h; s.t += h; const a1 = a(s.x, s.v, s.t); s.v += .5 * (an + a1) * h; an = a1; }; }
  },
  beeman: {
    n: 'Beeman', ec: '3.51', ord: '2',
    mk: (a, s, h) => {
      let an = a(s.x, s.v, s.t), ap = an;
      return () => { s.x += s.v * h + (4 * an - ap) * h * h / 6; s.t += h; const a1 = a(s.x, s.v, s.t); s.v += (2 * a1 + 5 * an - ap) * h / 6; ap = an; an = a1; };
    }
  },
  rk4: {
    n: 'Runge–Kutta 4', ec: '3.61', ord: '4',
    mk: (a, s, h) => () => {
      const x = s.x, v = s.v, t = s.t;
      const k1v = a(x, v, t) * h, k1x = v * h;
      const k2v = a(x + k1x / 2, v + k1v / 2, t + h / 2) * h, k2x = (v + k1v / 2) * h;
      const k3v = a(x + k2x / 2, v + k2v / 2, t + h / 2) * h, k3x = (v + k2v / 2) * h;
      const k4v = a(x + k3x, v + k3v, t + h) * h, k4x = (v + k3v) * h;
      s.x += (k1x + 2 * k2x + 2 * k3x + k4x) / 6; s.v += (k1v + 2 * k2v + 2 * k3v + k4v) / 6; s.t = t + h;
    }
  },
  pc: {
    n: 'Predictor–corrector', ec: '3.69–3.70', ord: '2',
    mk: (a, s, h) => {
      let an = a(s.x, s.v, s.t), xp = s.x - s.v * h + .5 * an * h * h;
      return () => {
        const x0 = s.x, v0 = s.v; let xN = xp + 2 * v0 * h, vN = v0, aN = an;
        for (let i = 0; i < 12; i++) {
          aN = a(xN, vN, s.t + h);
          const vNew = v0 + (aN + an) * h / 2, xNew = x0 + (vNew + v0) * h / 2;
          const d = Math.abs(xNew - xN); xN = xNew; vN = vNew;
          if (d < 1e-14 * (1 + Math.abs(xN))) break;
        }
        xp = x0; s.x = xN; s.v = vN; s.t += h; an = aN;
      };
    }
  },
};
const ALGK = Object.keys(ALG);
const SIST = {
  sho: { n: 'Oscilador armónico  a = −x', a: x => -x, x0: 1, v0: 0, U: x => x * x / 2, T0: 2 * Math.PI, ex: t => [Math.cos(t), -Math.sin(t)] },
  fall: { n: 'Caída libre  a = −g', a: () => -g, x0: 10, v0: 0, U: x => g * x, T0: Math.sqrt(2 * 10 / g), ex: t => [10 - g * t * t / 2, -g * t] },
  anh: { n: 'Oscilador anarmónico  a = −x³', a: x => -x * x * x, x0: 1, v0: 0, U: x => x ** 4 / 4, T0: 7.41630, ex: null },
};
// trayectoria de referencia (RK4 muy fino) para los sistemas sin solución analítica
function referencia(S0, T) {
  const N = 40000, h = T / N, tab = new Float64Array(2 * (N + 1));
  const s = { x: S0.x0, v: S0.v0, t: 0 }, st = ALG.rk4.mk(S0.a, s, h);
  tab[0] = s.x; tab[1] = s.v;
  for (let i = 1; i <= N; i++) { st(); tab[2 * i] = s.x; tab[2 * i + 1] = s.v; }
  return t => { const u = Math.max(0, Math.min(N, t / h)), i = Math.min(N - 1, Math.floor(u)), f = u - i; return [tab[2 * i] * (1 - f) + tab[2 * i + 2] * f, tab[2 * i + 1] * (1 - f) + tab[2 * i + 3] * f]; };
}
// Si se pasa exf, se acumula el error global: el máximo de ‖(Δx, Δv)‖ sobre toda la
// trayectoria. Mirar solo el instante final engaña, porque en un oscilador y tras un
// número entero de periodos el estado vuelve justo al punto donde varias familias de
// error se cancelan, y entonces los métodos aparentan un orden mayor del que tienen.
function corre(key, S0, h, N, guarda, exf) {
  let ev = 0; const a = (x, v, t) => { ev++; return S0.a(x, v, t); };
  const s = { x: S0.x0, v: S0.v0, t: 0 }, st = ALG[key].mk(a, s, h), P = guarda ? [[0, s.x, s.v]] : null;
  let emax = 0;
  for (let i = 0; i < N; i++) {
    st(); if (guarda) P.push([s.t, s.x, s.v]);
    if (exf) { const e = exf(s.t); emax = Math.max(emax, Math.hypot(s.x - e[0], s.v - e[1])); }
    if (!isFinite(s.x) || Math.abs(s.x) > 1e12) { emax = 1e12; break; }
  }
  return { s, P, ev, emax: Math.min(emax, 1e12) };
}
reg({
  id: 'a3a1', group: GA, sec: '3A', tag: 'A3A.1', short: 'Los once algoritmos del apéndice',
  title: 'Apéndice 3A · Comparación de los algoritmos de integración',
  desc: 'El apéndice 3A resume los métodos de diferencias finitas para resolver las ecuaciones de Newton. Aquí están los once implementados sobre el mismo sistema, con la trayectoria, la energía, el retrato de fase y el estudio log‑log del error que mide el orden global de cada uno. «No hay un solo algoritmo superior en todas las condiciones»: cámbiale el sistema y el Δt para comprobarlo.',
  controls: [
    { id: 'sys', type: 'select', label: 'Sistema', value: 'sho', options: Object.entries(SIST).map(([k, s]) => [k, s.n]) },
    { id: 'dt', type: 'range', label: 'Paso Δt', min: .005, max: .5, step: .005, value: .1 },
    { id: 'per', type: 'range', label: 'Periodos simulados', min: 1, max: 20, step: 1, value: 5 },
    { type: 'sep', label: 'Algoritmos' },
    ...ALGK.map((k, i) => ({ id: k, type: 'check', label: `${ALG[k].n} (${ALG[k].ec})`, value: ['euler', 'cromer', 'verlet', 'rk4'].includes(k), color: PAL[i] })),
  ],
  buttons: [{ label: '▶ Comparar', primary: true, fn: 'run' },
  { label: 'Todos', fn: () => setVals(Object.fromEntries(ALGK.map(k => [k, true]))) },
  { label: 'Solo simplécticos', fn: () => setVals(Object.fromEntries(ALGK.map(k => [k, ['cromer', 'verlet'].includes(k)]))) },
  { label: 'Solo Runge–Kutta', fn: () => setVals(Object.fromEntries(ALGK.map(k => [k, ['er', 'rk2e', 'ralston', 'rk4'].includes(k)]))) }],
  eq: 'Euler (3.33) · Euler–Cromer (3.34) · punto medio (3.35)<br>medio paso (3.37) · Euler–Richardson (3.55)<br>RK2 extremo (3.57) · Ralston (3.58)<br>Verlet de velocidades (3.48) · Beeman (3.51)<br>RK4 (3.61) · predictor–corrector (3.69–3.70)',
  views: [
    { id: 'v1', title: 'x(t) frente a la solución de referencia', h: 320 },
    { id: 'v2', title: 'Energía E(t)/E₀', half: true, w: 440, h: 300 },
    { id: 'v3', title: 'Retrato de fase (x, v)', half: true, w: 440, h: 300 },
    { id: 'v4', title: 'Error global máxₖ ‖(Δx, Δv)‖ frente a Δt (log‑log): la pendiente es el orden', h: 320, hint: 'El error se mide sobre todo el recorrido y sobre el estado completo, no solo sobre x en el instante final: tras un número entero de periodos el oscilador vuelve al punto donde varias familias de error se cancelan y los métodos aparentan un orden mayor del que tienen. Dos avisos al leer la gráfica: si la curva se aplana por abajo es que se ha tocado el suelo de redondeo de la doble precisión (reducir más Δt empeora el resultado, como advierte la sección 3.1); y las pendientes de Euler y del punto medio salen mayores que su orden nominal porque ambos son inestables para el oscilador — el apéndice dice que «ambos algoritmos son igual de malos porque los errores crecen en cada paso» —, así que con estos Δt el error todavía está dominado por el crecimiento exponencial y no por el término asintótico.' },
    { id: 'v5', title: 'Resumen', html: true },
  ],
  run(anim) {
    const S0 = SIST[V('sys')], dt = V('dt'), T = V('per') * S0.T0, N = Math.max(1, Math.round(T / dt)), h = T / N;
    const ex = S0.ex || referencia(S0, T * 1.001);
    const E = (x, v) => v * v / 2 + S0.U(x), E0 = E(S0.x0, S0.v0);
    const sel = ALGK.filter(k => V(k));
    const R = sel.map(k => { const r = corre(k, S0, h, N, true, ex); return { k, ...r, col: PAL[ALGK.indexOf(k)] }; });
    // estudio del orden: se van partiendo por la mitad mientras el coste sea razonable
    const base = S0.T0 / (2 * Math.PI), DTS = [];
    for (let d = .2 * base; DTS.length < 6; d /= 2) { if (DTS.length >= 3 && T / d > 6e4) break; DTS.push(d); }
    const ORD = R.map(r => ({
      k: r.k, col: r.col, pts: DTS.map(d => {
        const n = Math.max(1, Math.round(T / d)), hh = T / n;
        return [Math.log10(hh), Math.log10(Math.max(1e-17, corre(r.k, S0, hh, n, false, ex).emax))];
      })
    }));
    const lim = Math.min(4 * Math.abs(S0.x0) + 2, Math.max(...R.map(r => r.P.reduce((mx, p) => Math.max(mx, Math.abs(p[1])), 0)), Math.abs(S0.x0)) * 1.15);
    const exc = []; for (let i = 0; i <= 700; i++) { const t = T * i / 700; exc.push([t, ex(t)[0]]); }
    const draw = fr => {
      const tn = T * fr, cut = P => thin(P.filter(p => p[0] <= tn + 1e-12));
      plot($('v1'), [{ pts: exc.filter(p => p[0] <= tn), color: '#fff', dash: [4, 4], width: 1.3, label: 'referencia' },
      ...R.map(r => ({ pts: cut(r.P).map(p => [p[0], p[1]]), color: r.col, label: ALG[r.k].n }))],
        { xmin: 0, xmax: T, ymin: -lim, ymax: lim, xlabel: 't', ylabel: 'x' });
      plot($('v2'), [{ pts: [[0, 1], [T, 1]], color: '#fff', dash: [4, 4], width: 1.2, label: 'exacta' },
      ...R.map(r => ({ pts: cut(r.P).map(p => [p[0], E(p[1], p[2]) / E0]), color: r.col, label: ALG[r.k].n }))],
        { xmin: 0, xmax: T, ymin: 0, ymax: 3, xlabel: 't', ylabel: 'E/E₀' });
      plot($('v3'), R.map(r => ({ pts: thin(r.P.filter(p => p[0] <= tn + 1e-12), 900).map(p => [p[1], p[2]]), color: r.col, label: ALG[r.k].n })),
        { xmin: -lim, xmax: lim, xlabel: 'x', ylabel: 'v' });
    };
    go(anim, draw, 2400);
    plot($('v4'), ORD.flatMap(o => [{ pts: o.pts, color: o.col, label: `${ALG[o.k].n} — pendiente ${pend(o.pts).toFixed(2)}` }, { pts: o.pts, color: o.col, dots: true, r: 3.5 }]),
      { xlabel: 'log₁₀ Δt', ylabel: 'log₁₀ |error|', legend: 'left' });
    $('v5').innerHTML = tbl(['Algoritmo', 'Ec.', 'Orden teórico', 'Pendiente medida', 'error global máx', 'Deriva de E', 'Evaluaciones de a()'],
      R.map((r, i) => {
        const dE = Math.abs(E(r.s.x, r.s.v) / E0 - 1);
        return [`<span style="color:${r.col}">${ALG[r.k].n}</span>`, ALG[r.k].ec, ALG[r.k].ord,
          pend(ORD[i].pts).toFixed(2), fmt(r.emax), isFinite(dE) ? fmt(dE) : '∞', r.ev];
      })) +
      '<p class="hint">El medio paso (3.37) y el Verlet de velocidades (3.48) dan exactamente los mismos números: el apéndice lo demuestra algebraicamente, aquí se comprueba. Euler–Cromer y Verlet son <b>simplécticos</b>: su energía oscila pero no se va, aunque su orden sea bajo. RK4 tiene el error local más pequeño, pero en tiempos muy largos su energía deriva lentamente, lo que se explora en A3A.3.</p>';
    S(`Sistema: <b>${S0.n}</b><br>T = ${fmt(T, 3)} (${V('per')} periodos)<br>Δt efectivo = <b>${fmt(h, 5)}</b> · ${N} pasos<br>E₀ = <b>${fmt(E0, 5)}</b>` +
      (S0.ex ? '' : '<br><span class="muted">Sin solución analítica: la referencia es RK4 con 40 000 pasos.</span>'));
  }
});

// ============================================================
//  A3A.2 · Paso adaptativo: RK45 de Fehlberg y ODEMultistepSolver
// ============================================================
const FB = {
  a: [[], [1 / 4], [3 / 32, 9 / 32], [1932 / 2197, -7200 / 2197, 7296 / 2197],
  [439 / 216, -8, 3680 / 513, -845 / 4104], [-8 / 27, 2, -3544 / 2565, 1859 / 4104, -11 / 40]],
  b4: [25 / 216, 0, 1408 / 2565, 2197 / 4104, -1 / 5, 0],
  b5: [16 / 135, 0, 6656 / 12825, 28561 / 56430, -9 / 50, 2 / 55],
};
// un intento de paso: devuelve la solución de 5º orden y el error estimado |y5 − y4|
function rkf45(ode, h) {
  const s = ode.getState(), n = s.length, k = [];
  for (let i = 0; i < 6; i++) {
    const y = s.slice();
    for (let j = 0; j < i; j++) { const c = FB.a[i][j]; if (c) for (let m = 0; m < n; m++) y[m] += h * c * k[j][m]; }
    k.push(ode.getRate(y));
  }
  const y5 = s.slice(); let err = 0;
  for (let m = 0; m < n; m++) {
    let d4 = 0, d5 = 0;
    for (let i = 0; i < 6; i++) { d4 += FB.b4[i] * k[i][m]; d5 += FB.b5[i] * k[i][m]; }
    y5[m] += h * d5; err = Math.max(err, Math.abs(h * (d5 - d4)));
  }
  return { y5, err };
}
const factor = (tol, err) => Math.max(.1, Math.min(4, .84 * Math.pow(tol / Math.max(err, 1e-18), .25)));
function adaptativo(ode, tEnd, tol, h0) {
  const ti = ode.state.length - 1, out = [ode.state.slice()], hs = []; let h = h0, tries = 0, rej = 0;
  while (ode.state[ti] < tEnd - 1e-12 && out.length < 2e5) {
    const hh = Math.min(h, tEnd - ode.state[ti]);
    const { y5, err } = rkf45(ode, hh); tries++;
    if (err <= tol || hh < 1e-13) { ode.state = y5; out.push(y5.slice()); hs.push([y5[ti], hh]); if (hh >= h) h *= factor(tol, err); }
    else { rej++; h = hh * factor(tol, err); }
  }
  return { out, hs, tries, rej };
}
// ODEMultistepSolver: pasos de salida fijos, pasos internos adaptativos
function multipaso(ode, dtOut, nOut, tol) {
  const ti = ode.state.length - 1, out = [ode.state.slice()], inner = []; let h = dtOut;
  for (let i = 0; i < nOut; i++) {
    const meta = ode.state[ti] + dtOut; let c = 0;
    while (ode.state[ti] < meta - 1e-12 && c < 5000) {
      const hh = Math.min(h, meta - ode.state[ti]);
      const { y5, err } = rkf45(ode, hh); c++;
      if (err <= tol || hh < 1e-13) { ode.state = y5; if (hh >= h) h = Math.min(dtOut, h * factor(tol, err)); }
      else h = hh * factor(tol, err);
    }
    out.push(ode.state.slice()); inner.push(c);
  }
  return { out, inner };
}
reg({
  id: 'a3a2', group: GA, sec: '3A', tag: 'A3A.2', short: 'Paso adaptativo RK45 y multipaso',
  title: 'Apéndice 3A · Paso adaptativo (RK45 de Fehlberg) y ODEMultistepSolver',
  desc: 'Fehlberg mostró que con cinco evaluaciones extra se obtienen a la vez una solución de cuarto y otra de quinto orden; su diferencia estima el error y permite ajustar el paso. Se usa aquí una órbita kepleriana excéntrica, donde «pasos pequeños deben andar de puntillas por el terreno traicionero» del perihelio «mientras unas pocas zancadas cruzan la campiña aburrida» del afelio. Se compara con RK4 de paso fijo usando el mismo número de evaluaciones.',
  controls: [
    { id: 'e', type: 'range', label: 'Excentricidad e', min: 0, max: .95, step: .01, value: .8 },
    { id: 'lt', type: 'range', label: 'log₁₀ de la tolerancia', min: -12, max: -3, step: .25, value: -8 },
    { id: 'orb', type: 'range', label: 'Número de órbitas', min: 1, max: 12, step: 1, value: 3 },
    { type: 'sep', label: 'ODEMultistepSolver' },
    { id: 'nout', type: 'range', label: 'Pasos de salida por órbita', min: 10, max: 120, step: 5, value: 40 },
  ],
  eq: 'y<sub>n+1</sub> = y<sub>n</sub> + Σ c<sub>i</sub>k<sub>i</sub>  (5º orden)<br>y*<sub>n+1</sub> = y<sub>n</sub> + Σ c*<sub>i</sub>k<sub>i</sub>  (4º orden)<br>error ≈ |y − y*| → h ← 0.84·h·(tol/error)<sup>1/4</sup><br><br>Kepler: a = −r̂/r² , GM = 1 , semieje = 1 , T = 2π',
  views: [
    { id: 'v1', title: 'Órbita: cada punto es un paso aceptado', h: 400 },
    { id: 'v2', title: 'Tamaño del paso h(t): se encoge en el perihelio', half: true, w: 440, h: 280 },
    { id: 'v3', title: 'log₁₀ |E − E₀|: RK45 adaptativo vs RK4 de paso fijo con las mismas evaluaciones', half: true, w: 440, h: 280 },
    { id: 'v4', title: 'Resultados', html: true },
  ],
  run(anim) {
    const e = V('e'), tol = 10 ** V('lt'), T = V('orb') * 2 * Math.PI;
    const r0 = 1 + e, vy0 = Math.sqrt((1 - e) / (1 + e));
    const kep = () => new ODE([r0, 0, 0, vy0, 0], s => { const r = Math.hypot(s[0], s[1]), r3 = r * r * r; return [s[2], s[3], -s[0] / r3, -s[1] / r3, 1]; });
    const En = s => (s[2] * s[2] + s[3] * s[3]) / 2 - 1 / Math.hypot(s[0], s[1]), E0 = -0.5;
    const A = adaptativo(kep(), T, tol, .01);
    // RK4 de paso fijo con el mismo presupuesto de evaluaciones (6 por intento vs 4 por paso)
    const nFix = Math.max(20, Math.round(6 * A.tries / 4)), hFix = T / nFix;
    const F = integrate(kep(), 'RK4', hFix, s => s[4] >= T - 1e-12, 5e5);
    const errA = A.out.slice(1).map(s => [s[4], Math.log10(Math.max(1e-17, Math.abs(En(s) - E0)))]);
    const errF = F.slice(1).map(s => [s[4], Math.log10(Math.max(1e-17, Math.abs(En(s) - E0)))]);
    const M = multipaso(kep(), 2 * Math.PI / V('nout'), V('orb') * V('nout'), tol);
    const hmin = Math.min(...A.hs.map(p => p[1])), hmax = Math.max(...A.hs.map(p => p[1]));
    const R = r0 * 1.12;
    const draw = fr => {
      const n = Math.max(2, Math.floor(A.out.length * fr)), pts = A.out.slice(0, n);
      const P = plot($('v1'), [
        { pts: thin(pts, 4000).map(s => [s[0], s[1]]), color: COL.a, width: 1.6, label: 'trayectoria' },
        { pts: thin(pts, 700).map(s => [s[0], s[1]]), color: COL.c, dots: true, r: 2.2, label: 'pasos aceptados' },
        { pts: [[0, 0]], color: '#ffd166', dots: true, r: 7, label: 'foco (masa central)' },
      ], { xmin: -R + (r0 - 1), xmax: R, ymin: -R, ymax: R, xlabel: 'x', ylabel: 'y' });
      const q = pts[n - 1]; dot2(P.c, P.X(q[0]), P.Y(q[1]), 6, '#fff');
    };
    go(anim, draw, 2600);
    plot($('v2'), [{ pts: thin(A.hs, 3000), color: COL.d, label: 'h adaptativo' },
    { pts: [[0, hFix], [T, hFix]], color: COL.b, dash: [5, 4], width: 1.3, label: `h fijo = ${fmt(hFix, 4)}` }],
      { xmin: 0, xmax: T, ymin: 0, xlabel: 't', ylabel: 'h', legend: 'left' });
    plot($('v3'), [{ pts: thin(errA, 2500), color: COL.d, label: 'RK45 adaptativo' },
    { pts: thin(errF, 2500), color: COL.b, label: 'RK4 paso fijo' }],
      { xmin: 0, xmax: T, xlabel: 't', ylabel: 'log₁₀ |E − E₀|', legend: 'left' });
    const dEA = Math.abs(En(A.out[A.out.length - 1]) - E0), dEF = Math.abs(En(F[F.length - 1]) - E0);
    const inAvg = M.inner.reduce((a, b) => a + b, 0) / M.inner.length;
    $('v4').innerHTML = tbl(['', 'RK45 adaptativo', 'RK4 paso fijo'], [
      ['Pasos aceptados', A.out.length - 1, nFix],
      ['Intentos rechazados', A.rej, '—'],
      ['Evaluaciones de la derivada', 6 * A.tries, 4 * nFix],
      ['h mínimo / máximo', `${fmt(hmin, 4)} / ${fmt(hmax, 4)}`, fmt(hFix, 4)],
      ['|E − E₀| final', fmt(dEA), fmt(dEF)],
    ]) + `<p class="hint"><b>ODEMultistepSolver.</b> El paso adaptativo no sirve para tabular ni para animar porque los puntos no quedan equiespaciados. La solución es un solucionador que entrega pasos de salida fijos (aquí Δt = ${fmt(2 * Math.PI / V('nout'), 4)}) y por dentro da tantos pasos adaptativos como haga falta sin pasarse del objetivo: ha usado <b>${Math.min(...M.inner)}–${Math.max(...M.inner)}</b> pasos internos por paso de salida (media ${inAvg.toFixed(2)}), muchos más cerca del perihelio. Por fuera se comporta como un solucionador de paso fijo, pero vigila su error.</p>`;
    S(`Tolerancia: <b>${tol.toExponential(1)}</b><br>Razón h_max/h_min: <b>${(hmax / hmin).toFixed(1)}×</b><br>Tasa de rechazo: <b>${(100 * A.rej / A.tries).toFixed(1)} %</b><br>Ganancia en |ΔE|: <b>${dEF > 0 ? (dEF / Math.max(dEA, 1e-17)).toExponential(1) + '×' : '—'}</b> a igualdad de evaluaciones<br><span class="muted">Con e = 0 ambos métodos empatan: el paso adaptativo solo gana cuando el terreno es desigual.</span>`);
  }
});

// ============================================================
//  A3A.3 · Algoritmos simplécticos y área en el espacio de fases
// ============================================================
// Esquema general (3.74): se repite M veces con paso δt = Δt/M
//   p ← p + a_k F δt ,  q ← q + b_k p δt
function simplectico(acc, s, dt, A, B) {
  const M = A.length, d = dt / M;
  for (let k = 0; k < M; k++) { s.v += A[k] * acc(s.x) * d; s.x += B[k] * s.v * d; }
  s.t += dt;
}
const ESQ = {
  cromer: { n: 'Euler–Cromer (M=1)', sym: true, A: [1], B: [1] },
  verlet: { n: 'Verlet (M=2, b=[2,0])', sym: true, A: [1, 1], B: [2, 0] },
};
const area = pts => { let s = 0; for (let i = 0, n = pts.length; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
reg({
  id: 'a3a3', group: GA, sec: '3A', tag: 'A3A.3', short: 'Algoritmos simplécticos',
  title: 'Apéndice 3A · Algoritmos simplécticos y el área del espacio de fases',
  desc: 'La teoría de Hamilton dice que un flujo exacto conserva el área de cualquier región del espacio de fases. Los algoritmos construidos con el esquema (3.74) heredan esa propiedad: simulan exactamente <em>otro</em> hamiltoniano, cercano al que queríamos, y por eso su energía oscila pero nunca se va. Aquí se transporta una mancha de condiciones iniciales y se mide su área paso a paso. El Ẽ de la parte (c) del Problema 3.1 es justamente ese hamiltoniano sombra.',
  controls: [
    { id: 'dt', type: 'range', label: 'Paso Δt', min: .02, max: .6, step: .01, value: .25 },
    { id: 'per', type: 'range', label: 'Periodos simulados', min: 2, max: 120, step: 1, value: 40 },
    { id: 'rad', type: 'range', label: 'Radio de la mancha inicial', min: .05, max: .5, step: .01, value: .25 },
    { type: 'sep', label: 'Algoritmos' },
    { id: 'euler', type: 'check', label: 'Euler (no simpléctico)', value: true, color: PAL[0] },
    { id: 'cromer', type: 'check', label: 'Euler–Cromer (simpléctico, M=1)', value: true, color: PAL[3] },
    { id: 'verlet', type: 'check', label: 'Verlet (simpléctico, M=2)', value: true, color: PAL[2] },
    { id: 'rk4', type: 'check', label: 'RK4 (no simpléctico)', value: true, color: PAL[4] },
  ],
  eq: 'p<sup>(k+1)</sup> = p<sup>(k)</sup> + a<sub>k</sub>F<sup>(k)</sup>δt   (3.74a)<br>q<sup>(k+1)</sup> = q<sup>(k)</sup> + b<sub>k</sub>p<sup>(k+1)</sup>δt   (3.74b)<br>Δt = M·δt<br><br>M=1, a₀=b₀=1 → Euler–Cromer<br>M=2, a=[1,1], b=[2,0] → Verlet<br><br>Ẽ = E − (Δt/2)·x·p  (hamiltoniano sombra de 3.74 con M=1)',
  views: [
    { id: 'v1', title: 'Espacio de fases: la mancha inicial transportada', h: 400 },
    { id: 'v2', title: 'Área de la mancha / área inicial', half: true, w: 440, h: 280 },
    { id: 'v3', title: 'Energía E(t)/E₀ de la trayectoria central, a largo plazo', half: true, w: 440, h: 280 },
    { id: 'v4', title: 'Parte (c) del Problema 3.1: E oscila, el hamiltoniano sombra Ẽ no', h: 280 },
  ],
  run(anim) {
    const dt = V('dt'), T = V('per') * 2 * Math.PI, N = Math.round(T / dt), h = T / N, rad = V('rad');
    const acc = x => -x, FR = 140, cada = Math.max(1, Math.floor(N / FR));
    const metod = [];
    if (V('euler')) metod.push({ k: 'euler', n: 'Euler', col: PAL[0], step: s => { const a = acc(s.x); s.x += s.v * h; s.v += a * h; } });
    if (V('cromer')) metod.push({ k: 'cromer', n: ESQ.cromer.n, col: PAL[3], step: s => simplectico(acc, s, h, ESQ.cromer.A, ESQ.cromer.B) });
    if (V('verlet')) metod.push({ k: 'verlet', n: ESQ.verlet.n, col: PAL[2], step: s => simplectico(acc, s, h, ESQ.verlet.A, ESQ.verlet.B) });
    if (V('rk4')) metod.push({
      k: 'rk4', n: 'RK4', col: PAL[4], step: s => {
        const x = s.x, v = s.v;
        const k1v = acc(x) * h, k1x = v * h, k2v = acc(x + k1x / 2) * h, k2x = (v + k1v / 2) * h;
        const k3v = acc(x + k2x / 2) * h, k3x = (v + k2v / 2) * h, k4v = acc(x + k3x) * h, k4x = (v + k3v) * h;
        s.x += (k1x + 2 * k2x + 2 * k3x + k4x) / 6; s.v += (k1v + 2 * k2v + 2 * k3v + k4v) / 6;
      }
    });
    if (!metod.length) {
      [['v1', -2, 2], ['v2', 0, 1], ['v3', 0, 1], ['v4', 0, 1]].forEach(([id]) => plot($(id), []));
      S('<span class="muted">Selecciona al menos un algoritmo.</span>'); return;
    }
    // el número de puntos de la mancha se adapta al coste total del recorrido
    const NP = Math.max(16, Math.min(64, Math.floor(1.5e6 / Math.max(1, N * metod.length))));
    const E = (x, v) => (x * x + v * v) / 2;
    metod.forEach(M => {
      M.blob = Array.from({ length: NP }, (_, i) => { const a = 2 * Math.PI * i / NP; return { x: 1 + rad * Math.cos(a), v: rad * Math.sin(a), t: 0 }; });
      M.cen = { x: 1, v: 0, t: 0 }; M.A0 = area(M.blob.map(p => [p.x, p.v]));
      M.snap = [M.blob.map(p => [p.x, p.v])]; M.ar = [[0, 1]]; M.en = [[0, 1]]; M.sh = [[0, 1]];
    });
    const Esh = (x, v) => E(x, v) - h / 2 * x * v;    // Ẽ del Problema 3.1(c), con el signo que corresponde al orden de (3.34)
    for (let i = 1; i <= N; i++) {
      metod.forEach(M => {
        M.blob.forEach(p => M.step(p)); M.step(M.cen);
        if (i % cada === 0 || i === N) {
          const t = i * h;
          M.snap.push(M.blob.map(p => [p.x, p.v]));
          M.ar.push([t, area(M.blob.map(p => [p.x, p.v])) / M.A0]);
          M.en.push([t, E(M.cen.x, M.cen.v) / .5]);
          M.sh.push([t, Esh(M.cen.x, M.cen.v) / Esh(1, 0)]);
        }
      });
    }
    const lim = Math.min(6, Math.max(1.6, ...metod.map(M => Math.max(...M.snap[M.snap.length - 1].flatMap(p => [Math.abs(p[0]), Math.abs(p[1])])))));
    const nSnap = metod[0].snap.length - 1;
    const draw = fr => {
      const i = Math.max(0, Math.min(nSnap, Math.floor(fr * nSnap)));
      plot($('v1'), [
        ...metod.map(M => ({ pts: [...M.snap[i], M.snap[i][0]], color: M.col, width: 2, label: `${M.n} — área ${M.ar[i][1].toFixed(3)}×` })),
        { pts: [...Array(81)].map((_, j) => { const a = 2 * Math.PI * j / 80; return [Math.cos(a), Math.sin(a)]; }), color: '#ffffff33', dash: [4, 4], width: 1, label: 'órbita exacta' },
      ], { xmin: -lim, xmax: lim, ymin: -lim, ymax: lim, xlabel: 'x (posición)', ylabel: 'v (momento, m=1)', legend: 'left' });
      plot($('v2'), metod.map(M => ({ pts: thin(M.ar.slice(0, i + 1)), color: M.col, label: M.n })).concat([{ pts: [[0, 1], [T, 1]], color: '#ffffff44', dash: [4, 4], width: 1 }]),
        { xmin: 0, xmax: T, ymin: 0, ymax: 2.2, xlabel: 't', ylabel: 'área / área₀', legend: 'left' });
      plot($('v3'), metod.map(M => ({ pts: thin(M.en.slice(0, i + 1)), color: M.col, label: M.n })).concat([{ pts: [[0, 1], [T, 1]], color: '#ffffff44', dash: [4, 4], width: 1 }]),
        { xmin: 0, xmax: T, ymin: 0, ymax: 2.2, xlabel: 't', ylabel: 'E/E₀', legend: 'left' });
    };
    go(anim, draw, 3200);
    const C = metod.find(M => M.k === 'cromer');
    plot($('v4'), C ? [{ pts: thin(C.en), color: PAL[3], label: 'E (Euler–Cromer)' }, { pts: thin(C.sh), color: COL.f, label: 'Ẽ = E − (Δt/2)xp' }, { pts: [[0, 1], [T, 1]], color: '#fff', dash: [4, 4], width: 1, label: 'valor inicial' }]
      : [], { xmin: 0, xmax: T, xlabel: 't', ylabel: 'valor / valor inicial' });
    S(tbl(['Algoritmo', '¿Simpléctico?', 'área(T)/área₀', 'E(T)/E₀'],
      metod.map(M => [`<span style="color:${M.col}">${M.n}</span>`, ESQ[M.k] ? '✔ sí' : '✘ no',
        fmt(M.ar[M.ar.length - 1][1], 4), fmt(M.en[M.en.length - 1][1], 4)])) +
      `<p class="muted">Euler infla el área (y la energía) exponencialmente; RK4 la contrae muy poco a poco, así que tras muchísimos periodos la órbita se encoge. Euler–Cromer y Verlet mantienen el área exactamente en 1 aunque su orden sea bajo: por eso son los preferidos para simulaciones largas de sistemas conservativos.${C ? ' La curva Ẽ de la última vista es casi plana: ese es el hamiltoniano que Euler–Cromer integra <em>exactamente</em>.' : ''}</p>`);
  }
});

// ============================================================
//  A3A.4 · Extrapolación de Richardson para derivadas
// ============================================================
const FUN = {
  sin: { n: 'sin u', f: Math.sin, d: Math.cos },
  exp: { n: 'e^u', f: Math.exp, d: Math.exp },
  gauss: { n: 'e^(−u²)', f: u => Math.exp(-u * u), d: u => -2 * u * Math.exp(-u * u) },
  lor: { n: '1/(1 + u²)', f: u => 1 / (1 + u * u), d: u => -2 * u / (1 + u * u) ** 2 },
  cub: { n: 'u³', f: u => u ** 3, d: u => 3 * u * u },
};
reg({
  id: 'a3a4', group: GA, sec: '3A', tag: 'A3A.4', short: 'Extrapolación de Richardson',
  title: 'Apéndice 3A · Extrapolación de Richardson para derivadas',
  desc: 'La derivada adelantada que aparece en la sección 3.2 tiene error de orden Δt; la diferencia central (3.66) lo baja a (Δt)². Combinando el mismo cálculo hecho con Δt y con 2Δt se cancela el término siguiente de la serie de Taylor y se llega a (3.68), con error de orden (Δt)⁴. Esa es la idea de la extrapolación de Richardson, y cierra lo que el libro deja apuntado en el Ejercicio 3.3 y en el Problema 3.8.',
  controls: [
    { id: 'fn', type: 'select', label: 'Función f(u)', value: 'gauss', options: Object.entries(FUN).map(([k, f]) => [k, f.n]) },
    { id: 'u', type: 'range', label: 'Punto u donde se deriva', min: -3, max: 3, step: .05, value: .4 },
    { id: 'hv', type: 'range', label: 'log₁₀ h para la vista de la derecha', min: -8, max: 0, step: .1, value: -2 },
  ],
  eq: 'Adelantada: [f(u+h) − f(u)] / h  →  error ∝ h<br>Central D₁(h): [f(u+h) − f(u−h)] / 2h  →  error ∝ h²   (3.66)<br>Richardson: [4·D₁(h) − D₁(2h)] / 3  →  error ∝ h⁴   (3.68)',
  views: [
    { id: 'v0', title: 'Al encoger h, las tres pendientes giran hasta caer sobre la tangente verdadera', h: 360 },
    { id: 'v1', title: 'log₁₀ |error| vs log₁₀ h: truncamiento a la derecha, redondeo a la izquierda', h: 330 },
    { id: 'v2', title: 'f′(u) con el h elegido: numérica (puntos) vs analítica (línea)', half: true, w: 440, h: 280 },
    { id: 'v3', title: 'h óptimo y error mínimo', half: true, html: true },
  ],
  run(anim) {
    const F = FUN[V('fn')], u = V('u'), hSel = 10 ** V('hv');
    const D0 = (f, x, h) => (f(x + h) - f(x)) / h;
    const D1 = (f, x, h) => (f(x + h) - f(x - h)) / (2 * h);
    const DR = (f, x, h) => (4 * D1(f, x, h) - D1(f, x, 2 * h)) / 3;
    const ex = F.d(u), sers = [['Adelantada  O(h)', D0, COL.b], ['Central D₁  O(h²)', D1, COL.c], ['Richardson  O(h⁴)', DR, COL.d]];
    const curvas = sers.map(([n, fn, col]) => {
      const pts = []; let best = [Infinity, 0];
      for (let L = -9; L <= 0; L += .08) {
        const h = 10 ** L, er = Math.abs(fn(F.f, u, h) - ex);
        pts.push([L, Math.log10(Math.max(er, 1e-18))]);
        if (er < best[0]) best = [er, h];
      }
      // la pendiente se mide solo donde manda el truncamiento, antes del suelo de redondeo
      return { n, col, pts, best, fn, m: pend(pts.filter(p => p[0] >= -2.5 && p[0] <= -.5)) };
    });
    // Rango fijo del eje y: si se dejara autoescalar, la gráfica daría saltos en cada
    // cuadro y el barrido no se leería como un barrido.
    const todos = curvas.flatMap(c => c.pts.map(p => p[1]));
    const [yLo, yHi] = mm(todos);
    // Ventana y escala de la vista geométrica: x fijo alrededor de u
    const H0 = 1, AN = .9, xs = []; for (let i = 0; i <= 160; i++) xs.push(u - AN + 2 * AN * i / 160);
    const fv = xs.map(x => F.f(x));
    // el eje y se fija con las pendientes más torcidas (las de h = H0) para que nada salte
    const mPeor = Math.max(Math.abs(ex), ...[D0, D1, DR].map(fn => Math.abs(fn(F.f, u, H0))));
    const [fLo, fHi] = mm(fv.concat([F.f(u) - mPeor * AN, F.f(u) + mPeor * AN]));
    const pad = (fHi - fLo) * .12 || .5;

    // El barrido de h es LINEAL, no logarítmico: la separación entre las rectas es
    // proporcional a h, así que en escala logarítmica todo el giro ocurriría en la
    // primera media década y el resto de la animación se vería congelado.
    const draw = fr => {
      const hN = H0 * (1 - .98 * fr), L = Math.log10(hN);   // de h = 1 a h = 0.02
      // ---- vista geométrica: las tres rectas contra la tangente ----
      const est = [['Adelantada', D0, COL.b], ['Central', D1, COL.c], ['Richardson', DR, COL.d]]
        .map(([n, fn, col]) => [n, fn(F.f, u, hN), col]);
      const recta = m => xs.map(x => [x, F.f(u) + m * (x - u)]);
      const g0 = plot($('v0'), [
        { pts: xs.map((x, i) => [x, fv[i]]), color: '#ffffff66', width: 2, label: `f(u) = ${F.n}` },
        { pts: recta(ex), color: '#ffffff', dash: [5, 4], width: 1.6, label: 'tangente verdadera' },
        ...est.map(([n, m, col]) => ({ pts: recta(m), color: col, width: 2, label: `${n}: ${m.toFixed(5)}` })),
      ], { xmin: u - AN, xmax: u + AN, ymin: fLo - pad, ymax: fHi + pad, xlabel: 'u', ylabel: 'f(u)', legend: 'left' });
      [[-2, '#ffffff44'], [-1, '#ffffffcc'], [0, COL.a], [1, '#ffffffcc'], [2, '#ffffff44']].forEach(([k, col]) => {
        const x = u + k * hN; if (x < u - AN || x > u + AN) return;
        dot2(g0.c, g0.X(x), g0.Y(F.f(x)), k === 0 ? 5.5 : 3.5, col);
      });
      g0.c.fillStyle = COL.a; g0.c.font = '13px JetBrains Mono'; g0.c.textAlign = 'right';
      g0.c.fillText(`h = ${hN.toExponential(2)}`, g0.X(u + AN) - 8, 22);

      const g1 = plot($('v1'), [
        ...curvas.map(c => ({ pts: c.pts, color: c.col, label: `${c.n} — pendiente ${c.m.toFixed(2)}` })),
        ...curvas.map(c => ({ pts: [[L, Math.log10(Math.max(1e-18, Math.abs(c.fn(F.f, u, hN) - ex)))]], color: c.col, dots: true, r: 6 })),
        { pts: [[L, yLo - .5], [L, yHi + .5]], color: COL.a + '88', width: 1.5 },
        { pts: [[Math.log10(hSel), -18], [Math.log10(hSel), 2]], color: '#ffffff55', dash: [3, 4], width: 1, label: 'h elegido' },
      ], { xmin: -9, xmax: 0, ymin: yLo - .5, ymax: yHi + .5, xlabel: 'log₁₀ h', ylabel: 'log₁₀ |error|', legend: 'left' });
      g1.c.fillStyle = COL.a; g1.c.font = '12px JetBrains Mono'; g1.c.textAlign = 'right';
      g1.c.fillText(`h = ${hN.toExponential(1)}`, g1.X(0) - 6, 20);
      S(tbl([`h = ${hN.toExponential(1)}`, 'f′ estimada', '|error|'], curvas.map(c =>
        [`<span style="color:${c.col}">${c.n}</span>`, fmt(c.fn(F.f, u, hN), 6), fmt(Math.abs(c.fn(F.f, u, hN) - ex))])) +
        `<p class="muted">f(u) = <b>${F.n}</b> · f′(${u}) analítica = <b>${fmt(ex, 6)}</b>. Mira cómo cada curva baja con su propia pendiente y después repunta: ahí el redondeo ya pesa más que el truncamiento.</p>`);
    };
    go(anim, draw, 3000);
    const us = []; for (let i = 0; i <= 150; i++) us.push(-3 + 6 * i / 150);
    plot($('v2'), [
      { pts: us.map(x => [x, F.d(x)]), color: '#fff', width: 1.4, label: 'f′ analítica' },
      ...curvas.map(c => ({ pts: us.filter((_, i) => i % 5 === 0).map(x => [x, c.fn(F.f, x, hSel)]), color: c.col, dots: true, r: 3, label: c.n })),
      { pts: [[u, ex]], color: COL.a, dots: true, r: 6 },
    ], { xlabel: 'u', ylabel: "f′(u)" });
    $('v3').innerHTML = tbl(['Aproximación', 'Pendiente medida', 'h óptimo', 'Error mínimo', `Error con h = ${hSel.toExponential(1)}`],
      curvas.map(c => [`<span style="color:${c.col}">${c.n}</span>`, c.m.toFixed(2),
        c.best[1].toExponential(2), c.best[0].toExponential(2), Math.abs(c.fn(F.f, u, hSel) - ex).toExponential(2)])) +
      '<p class="hint">Las tres curvas bajan con la pendiente que predice la teoría hasta que el error de redondeo (≈ ε/h, con ε ≈ 2×10⁻¹⁶) las hace subir de nuevo. Cuanto mayor es el orden, antes se toca el suelo y menor es el error que se puede alcanzar: la fórmula de Richardson llega a ~10⁻¹² mientras que la derivada adelantada se queda en ~10⁻⁸. Elegir h demasiado pequeño es contraproducente, que es el mismo aviso que abre la sección 3.1 sobre Δt.</p>';
  }
});
