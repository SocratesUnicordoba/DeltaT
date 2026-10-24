// Verificación numérica de la física del Apéndice 3A y de la sección 3.11
const fs = require('fs'), path = require('path'), vm = require('vm');
const DIR = process.argv[2] || require('path').join(__dirname, '..');
const noop = () => { }, grad = { addColorStop: noop };
const ctx2d = () => new Proxy({ createRadialGradient: () => grad, createLinearGradient: () => grad, measureText: () => ({ width: 10 }) },
  { get(t, k) { return k in t ? t[k] : (typeof k === 'string' ? noop : undefined) }, set(t, k, v) { t[k] = v; return true } });
const els = new Map(), el = id => { if (!els.has(id)) els.set(id, { id, width: 820, height: 320, value: '', type: '', checked: false, innerHTML: '', style: {}, dataset: {}, classList: { toggle: noop, add: noop, remove: noop }, getContext: ctx2d, addEventListener: noop, setPointerCapture: noop }); return els.get(id) };
const sb = {
  console, Math, Date, JSON, Number, String, Array, Object, isFinite, isNaN, parseFloat, parseInt, Float64Array, Infinity, NaN, Proxy, Map, Set, Error,
  performance: { now: () => Date.now() }, setTimeout: (fn) => { try { fn(); } catch (e) {} }, clearTimeout: () => {}, history: { replaceState: noop }, location: { hash: '' }, FileReader: function () { this.readAsText = noop },
  document: { getElementById: el, createElement: () => el('__t'), querySelectorAll: () => [], addEventListener: noop },
  window: { addEventListener: noop, scrollTo: noop }, requestAnimationFrame: noop,
};
sb.globalThis = sb;
const src = ['core.js', 'mod_a.js', 'mod_b.js', 'mod_c.js', 'mod_d.js'].map(f => fs.readFileSync(path.join(DIR, f), 'utf8')).join('\n;\n');
const ctx = vm.createContext(sb);
vm.runInContext(src, ctx, { filename: 'bundle.js' });
const run = e => vm.runInContext(e, ctx);

let mal = 0;
const ok = (etiq, cond, info) => { console.log(`  ${cond ? '✓' : '✗'} ${etiq}${info ? '  —  ' + info : ''}`); if (!cond) mal++; };
console.log('');console.log('== A3A.1 - pendiente log-log del error global (oscilador armonico, T = 5 periodos) ==');console.log('   (Euler y punto medio son inestables: su pendiente aparente supera su orden nominal)');
console.log('');console.log('== A3A.1 - pendiente log-log del error global (T = 5 periodos) ==');console.log('   (Euler y punto medio son inestables: su pendiente aparente supera su orden nominal)');

const esperado = { euler: 1.6, cromer: 1, medio: 1.3, mpaso: 2, er: 2, rk2e: 2, ralston: 2, verlet: 2, beeman: 2, rk4: 4, pc: 2 };
const ordenes = run(`(() => {
  const S0 = SIST.sho, T = 5 * S0.T0, out = {};
  Object.keys(ALG).forEach(k => {
    const pts = [.2, .1, .05, .025, .0125].map(d => {
      const n = Math.round(T / d), hh = T / n;
      return [Math.log10(hh), Math.log10(Math.max(1e-17, corre(k, S0, hh, n, false, S0.ex).emax))];
    });
    out[k] = pend(pts);
  });
  return out;
})()`);
Object.entries(ordenes).forEach(([k, p]) =>
  ok(`${k.padEnd(8)} pendiente esperada ${esperado[k]}`, Math.abs(p - esperado[k]) < 0.25, `pendiente medida ${p.toFixed(3)}`));

console.log('\n== A3A.1 · equivalencias y propiedades que afirma el apéndice ==');
const eq = run(`(() => {
  const S0 = SIST.sho, h = .1, n = 500;
  const a = corre('mpaso', S0, h, n, false).s, b = corre('verlet', S0, h, n, false).s;
  const A = SIST.anh, c = corre('er', A, h, 300, false).s, d = corre('rk2e', A, h, 300, false).s;
  const cL = corre('er', S0, h, n, false).s, dL = corre('rk2e', S0, h, n, false).s;
  return { dx: Math.abs(a.x - b.x), dv: Math.abs(a.v - b.v),
           er_rk2e_lineal: Math.abs(cL.x - dL.x), er_rk2e_anarm: Math.abs(c.x - d.x) };
})()`);
ok('medio paso (3.37) ≡ Verlet de velocidades (3.48)', eq.dx < 1e-12 && eq.dv < 1e-12, `|Δx| = ${eq.dx.toExponential(2)}`);
ok('ER y RK2 extremo coinciden si la fuerza es lineal (es demostrable)', eq.er_rk2e_lineal < 1e-12, `|Δx| = ${eq.er_rk2e_lineal.toExponential(2)}`);
ok('ER y RK2 extremo difieren con fuerza no lineal', eq.er_rk2e_anarm > 1e-9, `|Δx| = ${eq.er_rk2e_anarm.toExponential(2)}`);

const ener = run(`(() => {
  const S0 = SIST.sho, h = .1, n = Math.round(400 * S0.T0 / h), E = (x,v) => (x*x+v*v)/2, o = {};
  ['euler','cromer','verlet','rk4'].forEach(k => { const s = corre(k, S0, h, n, false).s; o[k] = E(s.x, s.v) / .5; });
  return o;
})()`);
ok('Euler: la energía diverge en 400 periodos', ener.euler > 10, `E/E₀ = ${ener.euler.toExponential(2)}`);
ok('Euler–Cromer: energía acotada', Math.abs(ener.cromer - 1) < .2, `E/E₀ = ${ener.cromer.toFixed(4)}`);
ok('Verlet: energía acotada', Math.abs(ener.verlet - 1) < .2, `E/E₀ = ${ener.verlet.toFixed(4)}`);
ok('RK4: energía casi perfecta pero con deriva hacia abajo', ener.rk4 < 1 && ener.rk4 > .99, `E/E₀ = ${ener.rk4.toFixed(8)}`);

console.log('\n== A3A.2 · RK45 de Fehlberg (Kepler, e = 0.8, 3 órbitas) ==');
const ad = run(`(() => {
  const e = .8, T = 3 * 2 * Math.PI, r0 = 1 + e, vy0 = Math.sqrt((1 - e) / (1 + e));
  const kep = () => new ODE([r0, 0, 0, vy0, 0], s => { const r = Math.hypot(s[0], s[1]), r3 = r*r*r; return [s[2], s[3], -s[0]/r3, -s[1]/r3, 1]; });
  const En = s => (s[2]*s[2] + s[3]*s[3]) / 2 - 1 / Math.hypot(s[0], s[1]);
  const A = adaptativo(kep(), T, 1e-8, .01);
  const nFix = Math.round(6 * A.tries / 4), F = integrate(kep(), 'RK4', T / nFix, s => s[4] >= T - 1e-12, 5e5);
  const hs = A.hs.map(p => p[1]);
  const M = multipaso(kep(), 2*Math.PI/40, 120, 1e-8);
  return { pasos: A.out.length - 1, tries: A.tries, rej: A.rej, tFin: A.out[A.out.length-1][4],
    hmin: Math.min(...hs), hmax: Math.max(...hs),
    dEA: Math.abs(En(A.out[A.out.length-1]) + .5), dEF: Math.abs(En(F[F.length-1]) + .5), nFix,
    msTfin: Math.abs(M.out[M.out.length-1][4] - T), innerMin: Math.min(...M.inner), innerMax: Math.max(...M.inner) };
})()`);
ok('llega exactamente a t = T', ad.tFin > 3 * 2 * Math.PI - 1e-9, `t_final = ${ad.tFin.toFixed(12)}`);
ok('el paso se adapta (h_max/h_min ≫ 1)', ad.hmax / ad.hmin > 5, `h ∈ [${ad.hmin.toExponential(2)}, ${ad.hmax.toExponential(2)}], razón ${(ad.hmax / ad.hmin).toFixed(1)}×`);
ok('RK45 conserva la energía mejor que RK4 fijo con las mismas evaluaciones', ad.dEA < ad.dEF,
  `|ΔE| adaptativo ${ad.dEA.toExponential(2)} vs fijo ${ad.dEF.toExponential(2)} (${ad.pasos} vs ${ad.nFix} pasos)`);
ok('ODEMultistepSolver aterriza en los instantes de salida pedidos', ad.msTfin < 1e-9, `|Δt_final| = ${ad.msTfin.toExponential(2)}`);
ok('ODEMultistepSolver usa un número variable de pasos internos', ad.innerMax > ad.innerMin, `${ad.innerMin}–${ad.innerMax} por paso de salida`);

console.log('\n== A3A.3 · propiedad simpléctica (área del espacio de fases, 60 periodos) ==');
const sim = run(`(() => {
  const h = .25, N = Math.round(60 * 2 * Math.PI / h), acc = x => -x, NP = 64;
  const blob = () => Array.from({length: NP}, (_, i) => { const a = 2*Math.PI*i/NP; return { x: 1 + .25*Math.cos(a), v: .25*Math.sin(a), t: 0 }; });
  const pasos = {
    euler:  s => { const a = acc(s.x); s.x += s.v*h; s.v += a*h; },
    cromer: s => simplectico(acc, s, h, [1], [1]),
    verlet: s => simplectico(acc, s, h, [1,1], [2,0]),
    rk4:    s => { const x=s.x,v=s.v;
      const k1v=acc(x)*h,k1x=v*h,k2v=acc(x+k1x/2)*h,k2x=(v+k1v/2)*h;
      const k3v=acc(x+k2x/2)*h,k3x=(v+k2v/2)*h,k4v=acc(x+k3x)*h,k4x=(v+k3v)*h;
      s.x += (k1x+2*k2x+2*k3x+k4x)/6; s.v += (k1v+2*k2v+2*k3v+k4v)/6; },
  };
  const o = {};
  Object.entries(pasos).forEach(([k, st]) => {
    const B = blob(), A0 = area(B.map(p => [p.x, p.v]));
    for (let i = 0; i < N; i++) B.forEach(p => st(p));
    o[k] = area(B.map(p => [p.x, p.v])) / A0;
  });
  // el esquema (3.74) con M=2 debe reproducir el Verlet de velocidades de A3A.1
  const s1 = { x: 1, v: 0, t: 0 }; for (let i = 0; i < 300; i++) simplectico(acc, s1, h, [1,1], [2,0]);
  const s2 = corre('verlet', { a: acc, x0: 1, v0: 0 }, h, 300, false).s;
  o.verletIgual = Math.abs(s1.x - s2.x) + Math.abs(s1.v - s2.v);
  return o;
})()`);
ok('Euler–Cromer conserva el área exactamente', Math.abs(sim.cromer - 1) < 1e-9, `área/área₀ = ${sim.cromer.toFixed(12)}`);
ok('Verlet conserva el área exactamente', Math.abs(sim.verlet - 1) < 1e-9, `área/área₀ = ${sim.verlet.toFixed(12)}`);
ok('Euler infla el área', sim.euler > 1.5, `área/área₀ = ${sim.euler.toFixed(4)}`);
ok('RK4 contrae el área (no es simpléctico)', sim.rk4 < 1 && sim.rk4 > .9, `área/área₀ = ${sim.rk4.toFixed(10)}`);
ok('esquema (3.74) con a=[1,1], b=[2,0] ≡ Verlet de velocidades', sim.verletIgual < 1e-12, `diferencia ${sim.verletIgual.toExponential(2)}`);

const sombra = run(`(() => {
  const h = .25, N = Math.round(60 * 2 * Math.PI / h), acc = x => -x, s = { x: 1, v: 0, t: 0 };
  let Emin = 1e9, Emax = -1e9, Smin = 1e9, Smax = -1e9;
  for (let i = 0; i < N; i++) { simplectico(acc, s, h, [1], [1]);
    const E = (s.x*s.x + s.v*s.v)/2, Es = E - h/2*s.x*s.v;
    Emin = Math.min(Emin, E); Emax = Math.max(Emax, E); Smin = Math.min(Smin, Es); Smax = Math.max(Smax, Es); }
  return { osc: (Emax - Emin) / .5, oscS: (Smax - Smin) / .5 };
})()`);
ok('P3.1(c): Ẽ oscila mucho menos que E en Euler–Cromer', sombra.oscS < sombra.osc / 50,
  `oscilación relativa de E ${sombra.osc.toExponential(2)} vs Ẽ ${sombra.oscS.toExponential(2)}`);

console.log('\n== A3A.4 · extrapolación de Richardson ==');
const ric = run(`(() => {
  const F = FUN.gauss, u = .4, ex = F.d(u);
  const D0 = (f,x,h) => (f(x+h)-f(x))/h, D1 = (f,x,h) => (f(x+h)-f(x-h))/(2*h);
  const DR = (f,x,h) => (4*D1(f,x,h) - D1(f,x,2*h))/3;
  const sl = fn => { const p = []; for (let L = -2.5; L <= -.5; L += .08) { const h = 10**L; p.push([L, Math.log10(Math.abs(fn(F.f,u,h)-ex))]); } return pend(p); };
  const piso = fn => { let b = 1e9; for (let L = -9; L <= 0; L += .05) b = Math.min(b, Math.abs(fn(F.f,u,10**L)-ex)); return b; };
  return { s0: sl(D0), s1: sl(D1), sR: sl(DR), p0: piso(D0), p1: piso(D1), pR: piso(DR) };
})()`);
ok('derivada adelantada: orden 1', Math.abs(ric.s0 - 1) < .1, `pendiente ${ric.s0.toFixed(3)}`);
ok('diferencia central (3.66): orden 2', Math.abs(ric.s1 - 2) < .1, `pendiente ${ric.s1.toFixed(3)}`);
ok('Richardson (3.68): orden 4', Math.abs(ric.sR - 4) < .15, `pendiente ${ric.sR.toFixed(3)}`);
ok('a mayor orden, menor error alcanzable', ric.pR < ric.p1 && ric.p1 < ric.p0,
  `errores mínimos: ${ric.p0.toExponential(1)} > ${ric.p1.toExponential(1)} > ${ric.pR.toExponential(1)}`);

console.log('\n== §3.11 · el arrastre emerge del modelo microscópico ==');
const mic = run(`(() => {
  const M = 10, m = .05, sig = 1, rate = 2000, gg = 8, dt = 5e-4, T = 1.2;
  const F = dragCurve(M, m, sig, rate, 60000);
  const [c1, c2] = lsq(F, [v => -v, v => -v*Math.abs(v)]);
  const w = (-c1 + Math.sqrt(c1*c1 + 4*c2*M*gg)) / (2*c2);
  // el tiempo de correlacion es M/C1 ~ 0.15, asi que hace falta promediar
  // varias realizaciones largas para que el ruido termico no domine la media
  let suma = 0, cuenta = 0;
  for (let r = 0; r < 6; r++) {
    const P = microRun(M, m, sig, rate, gg, dt, 4);
    P.slice(Math.floor(P.length*.5)).forEach(p => { suma += p[1]; cuenta++; });
  }
  const vf = suma / cuenta;
  const F0 = F.find(p => Math.abs(p[0]) < 1e-9);
  return { c1, c2, w, vf, F0: F0 ? F0[1] : NaN, simetria: Math.abs(F[0][1] + F[F.length-1][1]) / Math.abs(F[0][1]) };
})()`);
ok('C₁ > 0 (el arrastre frena)', mic.c1 > 0, `C₁ = ${mic.c1.toFixed(3)}`);
ok('C₂ > 0 (aparece el término cuadrático)', mic.c2 > 0, `C₂ = ${mic.c2.toFixed(3)}`);
ok('⟨F⟩ = 0 cuando el cuerpo está en reposo', Math.abs(mic.F0) < 1e-12, `⟨F⟩(0) = ${mic.F0.toExponential(2)}`);
ok('⟨F⟩(v) es impar, como debe ser por simetría', mic.simetria < .05, `asimetría relativa ${(mic.simetria * 100).toFixed(2)} %`);
ok('la v terminal microscópica coincide con la predicha por el ajuste',
  Math.abs(mic.vf + mic.w) / mic.w < .08, `microscópica ${mic.vf.toFixed(4)} vs predicha ${(-mic.w).toFixed(4)}`);

console.log(mal ? `\n${mal} COMPROBACIÓN(ES) FALLIDA(S)` : '\nTODAS LAS COMPROBACIONES NUMÉRICAS PASAN');
process.exit(mal ? 1 : 0);
