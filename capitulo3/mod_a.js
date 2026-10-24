'use strict';
// ============================================================
//  Secciones 3.1 – 3.6 : algoritmos, interfaces, dibujo, arreglos, ODE
// ============================================================
function spring(c, x0, x1, y, coils = 12, amp = 8) {
  c.beginPath(); c.moveTo(x0, y); const n = coils * 2 + 1;
  for (let i = 1; i < n; i++) c.lineTo(x0 + (x1 - x0) * i / n, y + (i % 2 ? -amp : amp));
  c.lineTo(x1, y); c.stroke();
}

// ---------------- Problema 3.1 ----------------
reg({
  id: 'p31', group: '3.1 Algoritmos de Euler modificados', sec: '3.1', tag: 'P3.1', short: 'Oscilador armónico: Euler vs Euler‑Cromer',
  title: 'Problema 3.1 · Comparación de algoritmos de Euler',
  desc: 'Oscilador armónico simple F = −kx con k = m = 1 (x₀ = 1, v₀ = 0). (a) ¿Es estable el algoritmo de Euler? (b) Repite con Euler‑Cromer. (c) Calcula la energía E = v²/2 + x²/2 y la cantidad Ẽ = E + (Δt/2)·x·p.',
  controls: [
    { id: 'dt', type: 'range', label: 'Paso Δt', min: .005, max: .5, step: .005, value: .1 },
    { id: 'cyc', type: 'range', label: 'Número de ciclos', min: 1, max: 40, step: 1, value: 5 },
    { id: 'eu', type: 'check', label: 'Euler', value: true, color: COL.b },
    { id: 'ec', type: 'check', label: 'Euler‑Cromer', value: true, color: COL.c },
    { id: 'er', type: 'check', label: 'Euler‑Richardson', value: true, color: COL.d },
  ],
  eq: 'dx/dt = v ,  dv/dt = −x<br>Euler: x+=v·Δt , v+=a·Δt<br>Euler‑Cromer: v+=a·Δt , x+=v<sub>n+1</sub>·Δt<br>Exacta: x(t) = cos t',
  views: [
    { id: 'v1', title: 'Animación masa‑resorte', h: 210 },
    { id: 'v2', title: 'Posición x(t)', half: true, w: 440, h: 300 },
    { id: 'v3', title: 'Energía E(t)', half: true, w: 440, h: 300 },
    { id: 'v4', title: 'Parte (c): Euler‑Cromer — E oscila, Ẽ = E − (Δt/2)xp se conserva', h: 240, hint: 'El libro escribe Ẽ = E + (Δt/2)xp. El signo depende del orden de actualización: con el de la ecuación (3.34), que es el que se usa aquí (primero v, después x), la cantidad que se conserva a precisión de máquina es la de signo menos; el signo más corresponde al orden inverso (primero x, después v). Cambia Δt y comprueba que la curva Ẽ sigue plana.' },
  ],
  run(anim) {
    const dt = V('dt'), T = V('cyc') * 2 * Math.PI, N = Math.ceil(T / dt);
    const A = {
      eu: ['Euler', COL.b, (x, v) => [x + v * dt, v - x * dt]],
      ec: ['Euler‑Cromer', COL.c, (x, v) => { const vn = v - x * dt; return [x + vn * dt, vn]; }],
      er: ['Euler‑Richardson', COL.d, (x, v) => { const vm = v - x * dt / 2, xm = x + v * dt / 2; return [x + vm * dt, v - xm * dt]; }],
    };
    const sim = f => { let x = 1, v = 0; const P = [[0, 1, 0]]; for (let i = 1; i <= N; i++) { [x, v] = f(x, v); P.push([i * dt, x, v]); } return P; };
    const R = Object.keys(A).filter(k => V(k)).map(k => ({ name: A[k][0], color: A[k][1], P: sim(A[k][2]) }));
    const EC = sim(A.ec[2]);
    const ex = []; for (let i = 0; i <= 800; i++) { const t = T * i / 800; ex.push([t, Math.cos(t)]); }
    const xmax = Math.min(6, Math.max(1.2, ...R.map(r => r.P.reduce((m, p) => Math.max(m, Math.abs(p[1])), 0))));
    const Emax = Math.min(8, Math.max(.6, ...R.map(r => r.P.reduce((m, p) => Math.max(m, (p[1] ** 2 + p[2] ** 2) / 2), 0))));
    // Ẽ del apartado (c). Con el orden de (3.34) —primero v, después x— la cantidad
    // conservada lleva signo menos; es el hamiltoniano sombra que Euler‑Cromer integra exactamente.
    const tE = EC.map(p => [p[0], (p[1] ** 2 + p[2] ** 2) / 2]), tEt = EC.map(p => [p[0], (p[1] ** 2 + p[2] ** 2) / 2 - dt / 2 * p[1] * p[2]]);
    plot($('v4'), [{ pts: thin(tE), color: COL.c, label: 'E (Euler‑Cromer)' }, { pts: thin(tEt), color: COL.f, label: 'Ẽ = E − (Δt/2)xp' }, { pts: [[0, .5], [T, .5]], color: '#fff', dash: [4, 4], width: 1, label: 'E₀ = 0.5' }], { xmin: 0, xmax: T, xlabel: 't', ylabel: 'energía' });
    const draw = fr => {
      const tn = T * fr, cut = P => thin(P.filter(p => p[0] <= tn + 1e-9));
      plot($('v2'), [{ pts: ex.filter(p => p[0] <= tn), color: '#fff', dash: [4, 4], width: 1.2, label: 'Exacta' }, ...R.map(r => ({ pts: cut(r.P).map(p => [p[0], p[1]]), color: r.color, label: r.name }))], { xmin: 0, xmax: T, ymin: -xmax * 1.05, ymax: xmax * 1.05, xlabel: 't', ylabel: 'x' });
      plot($('v3'), [{ pts: [[0, .5], [T, .5]], color: '#fff', dash: [4, 4], width: 1.2, label: 'Exacta' }, ...R.map(r => ({ pts: cut(r.P).map(p => [p[0], (p[1] ** 2 + p[2] ** 2) / 2]), color: r.color, label: r.name }))], { xmin: 0, xmax: T, ymin: 0, ymax: Emax * 1.1, xlabel: 't', ylabel: 'E' });
      const cv = $('v1'), c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
      const rows = [{ name: 'Exacta', color: '#ffffff', x: Math.cos(tn) }, ...R.map(r => ({ name: r.name, color: r.color, x: r.P[Math.min(r.P.length - 1, Math.round(tn / dt))][1] }))];
      const rh = H / rows.length, sc = (W / 2 - 110) / xmax;
      c.fillStyle = '#1b2245'; c.fillRect(120, 0, 10, H);
      c.strokeStyle = '#ffffff22'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(W / 2 + 60, 0); c.lineTo(W / 2 + 60, H); c.stroke(); c.setLineDash([]);
      rows.forEach((r, i) => {
        const y = rh * (i + .5), xm = W / 2 + 60 + Math.max(-xmax, Math.min(xmax, r.x)) * sc;
        c.strokeStyle = r.color + 'aa'; c.lineWidth = 1.5; spring(c, 130, xm - 14, y, 10, Math.min(9, rh / 4));
        c.fillStyle = r.color; c.shadowColor = r.color; c.shadowBlur = 14; c.fillRect(xm - 14, y - 12, 28, 24); c.shadowBlur = 0;
        c.fillStyle = '#e6e9f5'; c.font = '12px Outfit'; c.textAlign = 'left'; c.fillText(r.name, 8, y + 4);
      });
      c.fillStyle = COL.a; c.font = '12px JetBrains Mono'; c.fillText(`t = ${tn.toFixed(2)}`, W - 90, 16);
    };
    go(anim, draw, 3000);
    S(tbl(['Algoritmo', '|x(T) − cos T|', 'E(T)/E₀'], R.map(r => { const p = r.P[r.P.length - 1]; return [`<span style="color:${r.color}">${r.name}</span>`, fmt(Math.abs(p[1] - Math.cos(p[0]))), fmt((p[1] ** 2 + p[2] ** 2))]; })) +
      `<p class="muted">Euler: la energía crece en cada paso (inestable). Euler‑Cromer: E oscila pero no deriva; Ẽ = E − (Δt/2)xp se conserva a precisión de máquina (aquí varía <b>${fmt(Math.max(...tEt.map(p => p[1])) - Math.min(...tEt.map(p => p[1])))}</b> frente a <b>${fmt(Math.max(...tE.map(p => p[1])) - Math.min(...tE.map(p => p[1])))}</b> de E).</p>`);
  }
});

// ---------------- Ejercicio 3.2 ----------------
reg({
  id: 'e32', group: '3.1 Algoritmos de Euler modificados', sec: '3.1', tag: 'E3.2', short: 'Euler‑Richardson: error vs Δt',
  title: 'Ejercicio 3.2 · El algoritmo de Euler‑Richardson',
  desc: '(a) Implementa Euler‑Richardson sobre FallingParticle. (b) Con Δt = 0.08, 0.04, 0.02 y 0.01, mide el error en la posición cuando la partícula llega al suelo y compáralo con Euler. ¿Cómo depende de Δt el error en la velocidad? (c) Repite con el oscilador armónico tras varios ciclos. Pulsa «Simular» para ver caer —u oscilar— a la vez la solución exacta, Euler y Euler‑Richardson con el Δt que elijas.',
  controls: [
    { id: 'sys', type: 'select', label: 'Qué se simula', value: 'fall', options: [['fall', '(b) Caída libre'], ['sho', '(c) Oscilador armónico']] },
    { id: 'dt', type: 'range', label: 'Δt de la simulación (s)', min: .005, max: .2, step: .005, value: .08 },
    { id: 'y0', type: 'number', label: 'Altura inicial y₀ (m)', value: 10 },
    { id: 'cyc', type: 'range', label: 'Ciclos del oscilador (parte c)', min: 1, max: 20, step: 1, value: 5 },
  ],
  eq: 'a<sub>n</sub>=F(y<sub>n</sub>,v<sub>n</sub>,t<sub>n</sub>)/m<br>v<sub>mid</sub>=v<sub>n</sub>+½a<sub>n</sub>Δt , y<sub>mid</sub>=y<sub>n</sub>+½v<sub>n</sub>Δt<br>a<sub>mid</sub>=F(y<sub>mid</sub>,v<sub>mid</sub>,t+½Δt)/m<br>v<sub>n+1</sub>=v<sub>n</sub>+a<sub>mid</sub>Δt<br>y<sub>n+1</sub>=y<sub>n</sub>+v<sub>mid</sub>Δt',
  views: [
    { id: 'v0', title: 'Simulación con el Δt elegido: exacta · Euler · Euler‑Richardson', h: 330 },
    { id: 'v3', title: 'Posición frente al tiempo', half: true, w: 440, h: 280 },
    { id: 'v4', title: 'Error |numérica − exacta| frente al tiempo', half: true, w: 440, h: 280 },
    { id: 'v1', title: 'Error global vs Δt (escala log‑log): la pendiente es el orden del método', h: 320, hint: 'Se mide el máximo de ‖(Δposición, Δvelocidad)‖ a lo largo de todo el recorrido, no el valor al final: tras un número entero de ciclos el oscilador vuelve al punto donde varios errores se cancelan y los métodos aparentarían un orden mayor del que tienen. Para el oscilador, la pendiente de Euler supera 1 porque es inestable y con estos Δt el error todavía está dominado por el crecimiento exponencial.' },
    { id: 'v2', title: 'Tabla de errores con los cuatro Δt del enunciado', html: true },
  ],
  run(anim) {
    const y0 = V('y0'), cyc = V('cyc'), dts = [.08, .04, .02, .01], tH = Math.sqrt(2 * y0 / g), Tsho = 2 * Math.PI * cyc;
    const fall = { Euler: (y, v, h) => [y + v * h, v - g * h], ER: (y, v, h) => { const vm = v - g * h / 2; return [y + vm * h, v - g * h]; } };
    const sho = { Euler: (x, v, h) => [x + v * h, v - x * h], ER: (x, v, h) => { const vm = v - x * h / 2, xm = x + v * h / 2; return [x + vm * h, v - xm * h]; } };
    const runTo = (f, a, b, dt, T) => { let t = 0; while (t + dt <= T + 1e-12) { [a, b] = f(a, b, dt); t += dt; } if (T - t > 1e-12) [a, b] = f(a, b, T - t); return [a, b]; };
    const exFall = t => [y0 - g * t * t / 2, -g * t], exSho = t => [Math.cos(t), -Math.sin(t)];
    // Error global: el máximo de ‖(Δposición, Δvelocidad)‖ sobre todo el recorrido. Medirlo
    // solo al final engaña, porque tras un número entero de ciclos el oscilador vuelve al
    // punto donde varios errores se cancelan y los métodos aparentan un orden de más.
    const errGlobal = (f, exf, a0, b0, h, T) => {
      let a = a0, b = b0, t = 0, e = 0;
      while (t < T - 1e-12) { const p = Math.min(h, T - t); [a, b] = f(a, b, p); t += p; const q = exf(t); e = Math.max(e, Math.hypot(a - q[0], b - q[1])); }
      return e;
    };
    const E = { fe: [], se: [], sr: [] }, rows = [];
    dts.forEach(h => {
      const [ye, ve] = runTo(fall.Euler, y0, 0, h, tH), [yr, vr] = runTo(fall.ER, y0, 0, h, tH);
      const [xe] = runTo(sho.Euler, 1, 0, h, Tsho), [xr] = runTo(sho.ER, 1, 0, h, Tsho);
      rows.push([h, ...[Math.abs(ye), Math.abs(yr), Math.abs(ve + g * tH), Math.abs(vr + g * tH), Math.abs(xe - 1), Math.abs(xr - 1)]
        .map(x => x < 1e-13 ? '≈0 (exacto)' : x.toExponential(2))]);
      E.fe.push([Math.log10(h), Math.log10(Math.max(1e-16, errGlobal(fall.Euler, exFall, y0, 0, h, tH)))]);
      E.se.push([Math.log10(h), Math.log10(Math.max(1e-16, errGlobal(sho.Euler, exSho, 1, 0, h, Tsho)))]);
      E.sr.push([Math.log10(h), Math.log10(Math.max(1e-16, errGlobal(sho.ER, exSho, 1, 0, h, Tsho)))]);
    });
    const slope = P => { const n = P.length, sx = P.reduce((s, p) => s + p[0], 0), sy = P.reduce((s, p) => s + p[1], 0), sxx = P.reduce((s, p) => s + p[0] ** 2, 0), sxy = P.reduce((s, p) => s + p[0] * p[1], 0); return (n * sxy - sx * sy) / (n * sxx - sx * sx); };
    plot($('v1'), [
      { pts: E.fe, color: COL.b, label: `Caída, Euler (pend. ${slope(E.fe).toFixed(2)})` }, { pts: E.fe, color: COL.b, dots: true, r: 4 },
      { pts: E.se, color: COL.c, label: `Oscilador, Euler (pend. ${slope(E.se).toFixed(2)})` }, { pts: E.se, color: COL.c, dots: true, r: 4 },
      { pts: E.sr, color: COL.d, label: `Oscilador, E‑R (pend. ${slope(E.sr).toFixed(2)})` }, { pts: E.sr, color: COL.d, dots: true, r: 4 },
    ], { xlabel: 'log₁₀ Δt', ylabel: 'log₁₀ error', legend: 'left' });
    $('v2').innerHTML = tbl(['Δt', 'Caída Euler |Δy|', 'Caída E‑R |Δy|', 'Caída Euler |Δv|', 'Caída E‑R |Δv|', `Osc. Euler |Δx| (${cyc} ciclos)`, `Osc. E‑R |Δx|`], rows) +
      '<p class="hint">Para aceleración constante Euler‑Richardson es exacto (error de redondeo) y la velocidad de Euler también lo es; el error en posición de Euler es ∝ Δt (orden 1). En el oscilador, E‑R tiene error ∝ Δt² (orden 2).</p>';

    // ---- simulación animada con el Δt elegido ----
    const dt = V('dt'), cae = V('sys') === 'fall', T = cae ? tH : Tsho;
    const exacta = cae ? t => [y0 - g * t * t / 2, -g * t] : t => [Math.cos(t), -Math.sin(t)];
    const paso = cae ? fall : sho, a0 = cae ? y0 : 1;
    const traza = f => {
      let a = a0, b = 0, t = 0; const P = [[0, a, b]];
      while (t < T - 1e-12 && P.length < 2e5) { const h = Math.min(dt, T - t); [a, b] = f(a, b, h); t += h; P.push([t, a, b]); }
      return P;
    };
    const PE = traza(paso.Euler), PR = traza(paso.ER);
    const en = (P, tn) => P[Math.max(0, Math.min(P.length - 1, Math.round(tn / dt)))];
    const ex = []; for (let i = 0; i <= 500; i++) { const t = T * i / 500; ex.push([t, exacta(t)[0]]); }
    const errT = P => P.map(p => [p[0], Math.abs(p[1] - exacta(p[0])[0])]);
    const EE = errT(PE), ER = errT(PR);
    const amp = Math.min(6, Math.max(1.25, ...PE.map(p => Math.abs(p[1])), ...PR.map(p => Math.abs(p[1]))));
    const lim = cae ? y0 * 1.05 : amp;

    const draw = fr => {
      const tn = T * fr, hasta = P => thin(P.filter(p => p[0] <= tn + 1e-12));
      plot($('v3'), [
        { pts: ex.filter(p => p[0] <= tn), color: '#fff', dash: [4, 4], width: 1.3, label: 'Exacta' },
        { pts: hasta(PE).map(p => [p[0], p[1]]), color: COL.b, label: 'Euler' },
        { pts: hasta(PR).map(p => [p[0], p[1]]), color: COL.d, label: 'Euler‑Richardson' },
      ], { xmin: 0, xmax: T, ymin: cae ? 0 : -lim, ymax: lim, xlabel: 't (s)', ylabel: cae ? 'y (m)' : 'x' });
      plot($('v4'), [
        { pts: hasta(EE), color: COL.b, label: 'Euler' },
        { pts: hasta(ER), color: COL.d, label: 'Euler‑Richardson' },
      ], { xmin: 0, xmax: T, ymin: 0, xlabel: 't (s)', ylabel: 'error', legend: 'left' });

      const cv = $('v0'), c = cv.getContext('2d'), W = cv.width, H = cv.height; c.clearRect(0, 0, W, H);
      const n0 = x => Math.abs(x) < 1e-9 ? 0 : x;        // evitar el «−0.000» del cero negativo
      const filas = [['Exacta', '#ffffff', n0(exacta(tn)[0])], ['Euler', COL.b, n0(en(PE, tn)[1])], ['Euler‑Richardson', COL.d, n0(en(PR, tn)[1])]];
      c.font = '12px JetBrains Mono'; c.textAlign = 'center'; c.fillStyle = COL.a;
      c.fillText(`t = ${tn.toFixed(3)} s   ·   Δt = ${dt}`, W / 2, 15);
      if (cae) {
        const arriba = 48, suelo = H - 34, Y = y => suelo - Math.max(0, Math.min(y0, y)) / y0 * (suelo - arriba);
        c.fillStyle = '#1b2245'; c.fillRect(0, suelo, W, H - suelo);
        c.strokeStyle = '#ffffff33'; c.beginPath(); c.moveTo(0, suelo); c.lineTo(W, suelo); c.stroke();
        filas.forEach(([n, col, y], i) => {
          const x = W * (i + .5) / 3;
          c.strokeStyle = '#ffffff10'; c.beginPath(); c.moveTo(x, arriba); c.lineTo(x, suelo); c.stroke();
          c.strokeStyle = col + '44'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(x - 36, Y(y)); c.lineTo(x + 36, Y(y)); c.stroke(); c.setLineDash([]);
          dot2(c, x, Y(y) - 10, 10, col);
          c.textAlign = 'center'; c.fillStyle = '#e6e9f5'; c.font = '12px Outfit'; c.fillText(n, x, 36);
          c.fillStyle = col; c.font = '12px JetBrains Mono'; c.fillText(`y = ${y.toFixed(3)} m`, x, H - 10);
        });
      } else {
        const alto = H / 3, esc = (W / 2 - 150) / amp;
        c.fillStyle = '#1b2245'; c.fillRect(120, 0, 10, H);
        c.strokeStyle = '#ffffff22'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(W / 2 + 60, 0); c.lineTo(W / 2 + 60, H); c.stroke(); c.setLineDash([]);
        filas.forEach(([n, col, x], i) => {
          const y = alto * (i + .5), xm = W / 2 + 60 + Math.max(-amp, Math.min(amp, x)) * esc;
          c.strokeStyle = col + 'aa'; c.lineWidth = 1.5; spring(c, 130, xm - 14, y, 10, Math.min(9, alto / 4));
          c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 14; c.fillRect(xm - 14, y - 12, 28, 24); c.shadowBlur = 0;
          c.textAlign = 'left'; c.fillStyle = '#e6e9f5'; c.font = '12px Outfit'; c.fillText(n, 8, y - 16);
          c.fillStyle = col; c.font = '12px JetBrains Mono'; c.fillText(`x = ${x.toFixed(3)}`, 8, y + 4);
        });
      }
    };
    go(anim, draw, 2600);

    const fE = PE[PE.length - 1], fR = PR[PR.length - 1], vx = exacta(T);
    const cero = x => Math.abs(x) < 1e-12 ? 0 : x;        // no enseñar el ruido de coma flotante
    S(tbl([`Δt = ${dt}`, cae ? 'y final' : 'x final', 'error'], [
      ['Exacta', fmt(cero(vx[0]), 4), '—'],
      [`<span style="color:${COL.b}">Euler</span>`, fmt(cero(fE[1]), 4), fmt(Math.abs(fE[1] - vx[0]), 3)],
      [`<span style="color:${COL.d}">E‑Richardson</span>`, fmt(cero(fR[1]), 4), fmt(Math.abs(fR[1] - vx[0]), 3)],
    ]) + (cae
      ? `<p class="muted">Tiempo exacto de impacto <b>${tH.toFixed(4)} s</b>, velocidad exacta <b>${(-g * tH).toFixed(4)} m/s</b>. Con aceleración constante Euler‑Richardson cae <b>pegado a la solución exacta</b>; Euler se queda arriba porque avanza la posición con la velocidad del principio del intervalo, y ese retraso es el error ∝ Δt que mide el enunciado.</p>`
      : `<p class="muted">Aquí la aceleración ya no es constante y Euler‑Richardson deja de ser exacto, pero su error es ∝ Δt² frente al ∝ Δt de Euler. Sube los ciclos y verás que la amplitud de Euler crece sin control.</p>`));
  }
});

// ---------------- Ejercicio 3.3 ----------------
reg({
  id: 'e33', group: '3.2 Interfaces', sec: '3.2', tag: 'E3.3', short: 'Interfaz Function: f(u)=a·e^(−bu²)',
  title: 'Ejercicio 3.3 · La interfaz Function',
  desc: '(a) Define una clase que encapsule f(u) = a·e^(−bu²) e implemente la interfaz Function. (b) Grafica f(u) con b = 1 y b = 4 (a = 1). (c) Grafica las derivadas sin usar la fórmula analítica (diferencias centrales).',
  controls: [
    { id: 'a', type: 'range', label: 'a', min: .1, max: 3, step: .1, value: 1 },
    { id: 'b1', type: 'range', label: 'b (curva 1)', min: .1, max: 8, step: .1, value: 1 },
    { id: 'b2', type: 'range', label: 'b (curva 2)', min: .1, max: 8, step: .1, value: 4 },
    { id: 'h', type: 'range', label: 'Paso h de la derivada numérica', min: .001, max: .5, step: .001, value: .1 },
  ],
  eq: `class Gaussian {  // implementa Function<br>&nbsp;constructor(a,b){this.a=a;this.b=b}<br>&nbsp;evaluate(u){return this.a*Math.exp(-this.b*u*u)}<br>}<br>derivada(f,u,h) = (f.evaluate(u+h) − f.evaluate(u−h)) / 2h`,
  views: [
    { id: 'v1', title: '(b) f(u) = a·e^(−bu²)', half: true, w: 440, h: 300 },
    { id: 'v2', title: '(c) f′(u): numérica (puntos) vs analítica (línea)', half: true, w: 440, h: 300 },
    { id: 'v3', title: 'Error de la derivada numérica', h: 220 },
  ],
  run(anim) {
    class Gaussian { constructor(a, b) { this.a = a; this.b = b; } evaluate(u) { return this.a * Math.exp(-this.b * u * u); } }
    const derivada = (f, u, h) => (f.evaluate(u + h) - f.evaluate(u - h)) / (2 * h);
    const a = V('a'), h = V('h'), F = [new Gaussian(a, V('b1')), new Gaussian(a, V('b2'))], cols = [COL.a, COL.f];
    const U0 = -3, U1 = 3, N = 180, us = [];
    for (let i = 0; i <= N; i++) us.push(U0 + (U1 - U0) * i / N);
    const exacta = (f, u) => -2 * f.a * f.b * u * Math.exp(-f.b * u * u);
    const curva = F.map(f => us.map(u => [u, f.evaluate(u)]));
    const dAna = F.map(f => us.map(u => [u, exacta(f, u)]));
    const dNum = F.map(f => us.map(u => [u, derivada(f, u, h)]));
    const err = F.map((_, i) => us.map((u, j) => [u, dNum[i][j][1] - dAna[i][j][1]]));
    const eMax = err.map(P => Math.max(...P.map(p => Math.abs(p[1]))));

    // La sonda recorre u de izquierda a derecha: en cada punto se evalúan f(u−h) y f(u+h)
    // y la pendiente de esa cuerda es el valor que se va añadiendo a la curva de la derivada.
    const draw = fr => {
      const un = U0 + (U1 - U0) * fr, hasta = P => P.filter(p => p[0] <= un + 1e-9);
      const g1 = plot($('v1'), curva.map((P, i) => ({ pts: P, color: cols[i], label: `b = ${F[i].b}` })),
        { xmin: U0, xmax: U1, xlabel: 'u', ylabel: 'f(u)' });
      F.forEach((f, i) => {
        const yl = f.evaluate(un - h), yr = f.evaluate(un + h), m = (yr - yl) / (2 * h), ym = (yl + yr) / 2;
        const c = g1.c, ext = .75;
        c.strokeStyle = '#ffffffcc'; c.lineWidth = 1.4; c.setLineDash([]);
        c.beginPath(); c.moveTo(g1.X(un - ext), g1.Y(ym - m * ext)); c.lineTo(g1.X(un + ext), g1.Y(ym + m * ext)); c.stroke();
        c.strokeStyle = '#ffffff44'; c.setLineDash([2, 3]);
        [un - h, un + h].forEach(u => { c.beginPath(); c.moveTo(g1.X(u), g1.Y(0)); c.lineTo(g1.X(u), g1.Y(f.evaluate(u))); c.stroke(); });
        c.setLineDash([]);
        dot2(c, g1.X(un - h), g1.Y(yl), 3.5, '#ffffff');
        dot2(c, g1.X(un + h), g1.Y(yr), 3.5, '#ffffff');
        dot2(c, g1.X(un), g1.Y(f.evaluate(un)), 5.5, cols[i]);
      });
      g1.c.fillStyle = COL.a; g1.c.font = '12px JetBrains Mono'; g1.c.textAlign = 'left';
      g1.c.fillText(`u = ${un.toFixed(2)}   h = ${h}`, 68, 20);

      plot($('v2'), [
        ...dAna.map((P, i) => ({ pts: P, color: cols[i], width: 1.3, label: `analítica b=${F[i].b}` })),
        ...dNum.map((P, i) => ({ pts: hasta(P).filter((_, j) => j % 3 === 0), color: cols[i], dots: true, r: 2.8 })),
      ], { xmin: U0, xmax: U1, xlabel: 'u', ylabel: "f′(u)" });

      plot($('v3'), err.map((P, i) => ({ pts: hasta(P), color: cols[i], label: `b = ${F[i].b}` })),
        { xmin: U0, xmax: U1, xlabel: 'u', ylabel: 'error' });

      S(tbl([`u = ${un.toFixed(2)}`, 'f′ numérica', 'f′ analítica', 'error'], F.map((f, i) => [
        `<span style="color:${cols[i]}">b = ${f.b}</span>`, fmt(derivada(f, un, h), 5), fmt(exacta(f, un), 5), fmt(derivada(f, un, h) - exacta(f, un)),
      ])) + `<p class="muted">La recta blanca es la cuerda que une f(u−h) y f(u+h): su pendiente es la derivada numérica, y se va volcando en la gráfica de la derecha. Error máximo con h = ${h}: <b>${fmt(Math.max(...eMax))}</b>. Divide h por dos y verás que el error cae a la cuarta parte, porque la diferencia central es ∝ h².</p>`);
    };
    go(anim, draw, 3200);
  }
});

// ---------------- Ejercicio 3.4 ----------------
reg({
  id: 'e34', group: '3.3 Dibujo', sec: '3.3', tag: 'E3.4', short: 'Gráficos simples y WorldRectangle',
  title: 'Ejercicio 3.4 · Gráficos simples',
  desc: '(a) Prueba cómo cambian el tamaño y la posición de un rectángulo en píxeles (DrawingApp). (b) Amplía WorldRectangle para dibujar también líneas, óvalos rellenos y cadenas de caracteres. (c) Usa la clase WorldRectangle con coordenadas del mundo. (d) Define una clase TextMessage que muestre texto en coordenadas del mundo.',
  controls: [
    { id: 'mode', type: 'select', label: 'Sistema de coordenadas', value: 'world', options: [['pixel', '(a) Píxeles — DrawingApp'], ['world', '(c) Mundo — WorldRectangle']] },
    { type: 'sep', label: 'Rectángulo en píxeles' },
    { id: 'pl', type: 'range', label: 'left (px)', min: 0, max: 800, step: 1, value: 120 },
    { id: 'pt', type: 'range', label: 'top (px)', min: 0, max: 400, step: 1, value: 80 },
    { id: 'pw', type: 'range', label: 'width (px)', min: 1, max: 800, step: 1, value: 220 },
    { id: 'ph', type: 'range', label: 'height (px)', min: 1, max: 400, step: 1, value: 120 },
    { type: 'sep', label: 'Mundo' },
    { id: 'xmin', type: 'number', label: 'xmin', value: -10 }, { id: 'xmax', type: 'number', label: 'xmax', value: 10 },
    { id: 'ymin', type: 'number', label: 'ymin', value: -5 }, { id: 'ymax', type: 'number', label: 'ymax', value: 5 },
    { id: 'wx', type: 'range', label: 'x izquierda', min: -10, max: 10, step: .1, value: -3 },
    { id: 'wy', type: 'range', label: 'y superior', min: -5, max: 5, step: .1, value: 2 },
    { id: 'ww', type: 'range', label: 'ancho', min: .1, max: 20, step: .1, value: 6 },
    { id: 'wh', type: 'range', label: 'alto', min: .1, max: 10, step: .1, value: 4 },
    { type: 'sep', label: 'Línea y óvalo (b)' },
    { id: 'ln', type: 'check', label: 'drawLine', value: true, color: COL.d },
    { id: 'lx1', type: 'range', label: 'x₁ de la línea', min: -10, max: 10, step: .1, value: -8 },
    { id: 'ly1', type: 'range', label: 'y₁ de la línea', min: -5, max: 5, step: .1, value: -2 },
    { id: 'lx2', type: 'range', label: 'x₂ de la línea', min: -10, max: 10, step: .1, value: 8 },
    { id: 'ly2', type: 'range', label: 'y₂ de la línea', min: -5, max: 5, step: .1, value: 3.5 },
    { id: 'ov', type: 'check', label: 'fillOval', value: true, color: COL.c },
    { id: 'ox', type: 'range', label: 'x del óvalo', min: -10, max: 10, step: .1, value: 5.5 },
    { id: 'oy', type: 'range', label: 'y del óvalo', min: -5, max: 5, step: .1, value: -2 },
    { id: 'orx', type: 'range', label: 'semieje x del óvalo', min: .1, max: 6, step: .1, value: 2 },
    { id: 'ory', type: 'range', label: 'semieje y del óvalo', min: .1, max: 4, step: .1, value: 1.2 },
    { type: 'sep', label: 'TextMessage (d)' },
    { id: 'msg', type: 'text', label: 'Texto', value: 'Hola, Open Source Physics' },
    { id: 'mx', type: 'range', label: 'x del texto', min: -10, max: 10, step: .1, value: -8 },
    { id: 'my', type: 'range', label: 'y del texto', min: -5, max: 5, step: .1, value: -4 },
  ],
  eq: 'píxel x = (x − xmin)·W/(xmax − xmin)<br>píxel y = (ymax − y)·H/(ymax − ymin)',
  views: [{ id: 'v1', title: 'Panel de dibujo', h: 420 }],
  run(anim) {
    const cv = $('v1'), c = cv.getContext('2d'), W = cv.width, H = cv.height;
    const x0 = V('xmin'), x1 = V('xmax'), y0 = V('ymin'), y1 = V('ymax');
    const px = x => (x - x0) * W / (x1 - x0), py = y => (y1 - y) * H / (y1 - y0);
    const pixel = V('mode') === 'pixel', msg = V('msg');
    // El método draw(panel, g) ejecuta sus primitivas en orden; la animación lo recorre
    // paso a paso para que se vea cuál dibuja cada llamada.
    const pasos = [];
    let info;
    if (pixel) {
      const l = V('pl'), t = V('pt'), w = V('pw'), hh = V('ph');
      pasos.push(['rejilla del DrawingPanel (píxeles)', () => {
        c.strokeStyle = '#ffffff10'; c.fillStyle = '#8a93b8'; c.font = '10px JetBrains Mono'; c.textAlign = 'left';
        for (let x = 0; x <= W; x += 50) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); c.fillText(x, x + 2, 10); }
        for (let y = 0; y <= H; y += 50) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); c.fillText(y, 2, y - 2); }
      }]);
      pasos.push([`g.fillRect(${l}, ${t}, ${w}, ${hh})`, p => {
        c.fillStyle = '#7c5cff99'; c.strokeStyle = COL.a; c.lineWidth = 2;
        c.fillRect(l, t, w * p, hh * p); c.strokeRect(l, t, w * p, hh * p);
        dot2(c, l, t, 5, COL.c);
        c.fillStyle = '#fff'; c.font = '13px Outfit'; c.textAlign = 'left'; c.fillText('(left, top)', l + 8, t - 8);
      }]);
      pasos.push([`g.drawString("${msg}", 20, ${H - 20})`, p => {
        c.fillStyle = '#fff'; c.font = '13px Outfit'; c.textAlign = 'left';
        c.fillText(msg.slice(0, Math.ceil(msg.length * p)), 20, H - 20);
      }]);
      info = `fillRect(${l}, ${t}, ${w}, ${hh})<br><span class="muted">En píxeles el origen está arriba a la izquierda y y crece hacia abajo. Al cambiar el tamaño de la ventana el dibujo no se reescala. Cambia a coordenadas del mundo para ver las primitivas de la parte (b).</span>`;
    } else {
      const wx = V('wx'), wy = V('wy'), ww = V('ww'), wh = V('wh');
      const L = px(wx), T = py(wy), Wd = px(wx + ww) - L, Hd = py(wy - wh) - T;
      let bInfo = '';
      pasos.push(['panel.setPreferredMinMax — rejilla y ejes del mundo', () => {
        c.strokeStyle = '#ffffff12'; c.fillStyle = '#8a93b8'; c.font = '10px JetBrains Mono'; c.textAlign = 'left';
        for (let x = Math.ceil(x0); x <= x1; x++) { c.beginPath(); c.moveTo(px(x), 0); c.lineTo(px(x), H); c.stroke(); if (x % 2 === 0) c.fillText(x, px(x) + 2, py(0) + 12); }
        for (let y = Math.ceil(y0); y <= y1; y++) { c.beginPath(); c.moveTo(0, py(y)); c.lineTo(W, py(y)); c.stroke(); if (y) c.fillText(y, px(0) + 3, py(y) - 2); }
        c.strokeStyle = '#ffffff55'; c.beginPath(); c.moveTo(px(x0), py(0)); c.lineTo(px(x1), py(0)); c.moveTo(px(0), py(y0)); c.lineTo(px(0), py(y1)); c.stroke();
      }]);
      pasos.push([`WorldRectangle.draw → g.fillRect(${L.toFixed(0)}, ${T.toFixed(0)}, ${Wd.toFixed(0)}, ${Hd.toFixed(0)})`, p => {
        const gr = c.createLinearGradient(L, T, L + Wd, T + Hd); gr.addColorStop(0, '#7c5cffaa'); gr.addColorStop(1, '#22d3ee88');
        c.fillStyle = gr; c.fillRect(L, T, Wd * p, Hd * p);
        c.strokeStyle = COL.a; c.lineWidth = 2; c.strokeRect(L, T, Wd * p, Hd * p);
        dot2(c, L, T, 5, COL.c);
      }]);
      if (V('ov')) {
        const cx = px(V('ox')), cy = py(V('oy')), rx = Math.abs(px(V('ox') + V('orx')) - cx), ry = Math.abs(py(V('oy') + V('ory')) - cy);
        bInfo += `<br>fillOval → centro (${cx.toFixed(0)}, ${cy.toFixed(0)}) px, radios ${rx.toFixed(0)}×${ry.toFixed(0)} px`;
        pasos.push([`g.fillOval(centro ${cx.toFixed(0)}, ${cy.toFixed(0)})`, p => {
          c.fillStyle = COL.c + '55'; c.strokeStyle = COL.c; c.lineWidth = 2;
          c.beginPath(); c.ellipse(cx, cy, Math.max(.1, rx * p), Math.max(.1, ry * p), 0, 0, 7); c.fill(); c.stroke();
        }]);
      }
      if (V('ln')) {
        const ax = px(V('lx1')), ay = py(V('ly1')), bx = px(V('lx2')), by = py(V('ly2'));
        bInfo += `<br>drawLine → (${ax.toFixed(0)}, ${ay.toFixed(0)}) → (${bx.toFixed(0)}, ${by.toFixed(0)}) px`;
        pasos.push([`g.drawLine(${ax.toFixed(0)}, ${ay.toFixed(0)}, ${bx.toFixed(0)}, ${by.toFixed(0)})`, p => {
          c.strokeStyle = COL.d; c.lineWidth = 3; c.lineCap = 'round';
          c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p); c.stroke(); c.lineCap = 'butt';
        }]);
      }
      pasos.push([`TextMessage.draw → g.drawString("${msg}", ${px(V('mx')).toFixed(0)}, ${py(V('my')).toFixed(0)})`, p => {
        c.fillStyle = COL.c; c.font = '18px Outfit'; c.textAlign = 'left';
        c.fillText(msg.slice(0, Math.ceil(msg.length * p)), px(V('mx')), py(V('my')));
      }]);
      info = `Mundo: x∈[${x0}, ${x1}], y∈[${y0}, ${y1}]<br>Esquina (${wx}, ${wy}) → píxel (<b>${L.toFixed(1)}</b>, <b>${T.toFixed(1)}</b>)<br>Tamaño en píxeles: <b>${Wd.toFixed(1)} × ${Hd.toFixed(1)}</b>${bInfo}<br><span class="muted">WorldRectangle convierte coordenadas del mundo a píxeles en cada dibujado, así que la figura se escala con el panel. La parte (b) es exactamente eso: cada primitiva de Graphics (drawLine, fillOval, drawString) se envuelve con la misma conversión xToPix / yToPix.</span>`;
    }
    const draw = fr => {
      c.clearRect(0, 0, W, H);
      const k = fr * pasos.length; let activo = pasos.length - 1;
      pasos.forEach(([, f], i) => { const p = Math.max(0, Math.min(1, k - i)); if (p > 0) f(p); if (p > 0 && p < 1) activo = i; });
      c.fillStyle = '#0b0f1ecc'; c.fillRect(0, H - 24, W, 24);
      c.fillStyle = COL.a; c.font = '12px JetBrains Mono'; c.textAlign = 'left';
      c.fillText(`${activo + 1}/${pasos.length}  ${pasos[activo][0]}`, 10, H - 8);
      S(info + `<p class="hint">El método <code>draw(panel, g)</code> ejecuta sus primitivas en orden; la animación las va soltando una a una. Paso <b>${activo + 1}</b> de ${pasos.length}: <code>${pasos[activo][0]}</code></p>`);
    };
    go(anim, draw, 2400);
  }
});

// ---------------- Ejercicio 3.5 ----------------
reg({
  id: 'e35', group: '3.4 Estado con arreglos', sec: '3.4', tag: 'E3.5', short: 'Paso por valor',
  title: 'Ejercicio 3.5 · Paso por valor',
  desc: 'Los tipos primitivos se pasan por valor: el método recibe una copia. Un arreglo también se pasa por valor, pero el valor es una referencia, así que el método puede modificar sus elementos. Por eso un ODESolver puede actualizar el arreglo de estado de un objeto ODE.',
  controls: [
    { id: 'val', type: 'number', label: 'Valor primitivo inicial', value: 5 },
    { id: 'arr', type: 'text', label: 'Arreglo inicial (separado por comas)', value: '1, 2, 3' },
    { id: 'nv', type: 'number', label: 'Nuevo valor dentro del método', value: 99 },
  ],
  views: [
    { id: 'v0', title: 'Qué hay en memoria en cada paso de la llamada', h: 430 },
    { id: 'v1', title: 'Experimento', html: true },
  ],
  run(anim) {
    const nv = V('nv');
    function cambiarPrimitivo(x) { x = nv; return x; }
    function cambiarElemento(a) { a[0] = nv; }
    function reasignarArreglo(a) { a = [nv, nv, nv]; return a; }
    let x = V('val'); const xIn = cambiarPrimitivo(x);
    const parse = () => V('arr').split(',').map(s => +s.trim()).filter(v => !isNaN(v));
    const a1 = parse(), a1b = a1.slice(); cambiarElemento(a1);
    const a2 = parse(), a2b = a2.slice(); const a2in = reasignarArreglo(a2);
    $('v1').innerHTML = `
<pre class="code">function cambiarPrimitivo(x) { x = ${nv}; }
function cambiarElemento(a)  { a[0] = ${nv}; }
function reasignarArreglo(a) { a = [${nv}, ${nv}, ${nv}]; }</pre>` +
      tbl(['Llamada', 'Antes', 'Dentro del método', 'Después (en quien llama)', '¿Cambió?'], [
        ['cambiarPrimitivo(x)', V('val'), xIn, x, x !== V('val') ? '✔ sí' : '✘ no'],
        ['cambiarElemento(a)', `[${a1b}]`, `[${a1}]`, `[${a1}]`, '✔ sí'],
        ['reasignarArreglo(a)', `[${a2b}]`, `[${a2in}]`, `[${a2}]`, '✘ no'],
      ]) +
      `<p class="hint">Conclusión: el solucionador hace <code>state[i] += rate[i]*dt</code> sobre el mismo arreglo que posee el objeto ODE; no necesita devolverlo.</p>`;

    // ---- diagrama de memoria, en cuatro fases ----
    const cv = $('v0'), c = cv.getContext('2d'), W = cv.width, H = cv.height;
    const FASES = ['1 · antes de llamar', '2 · la llamada copia el argumento', '3 · el método asigna', '4 · de vuelta en quien llama'];
    const caja = (x, y, w, h, etiq, val, col, on) => {
      c.fillStyle = on ? col + '2e' : '#ffffff08'; c.strokeStyle = on ? col : '#ffffff25'; c.lineWidth = on ? 2 : 1;
      c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 8) : c.rect(x, y, w, h); c.fill(); c.stroke();
      c.textAlign = 'left'; c.fillStyle = '#8a93b8'; c.font = '10px JetBrains Mono'; c.fillText(etiq, x + 9, y + 15);
      c.fillStyle = on ? '#fff' : '#e6e9f5'; c.font = '14px JetBrains Mono'; c.fillText(val, x + 9, y + 33);
    };
    const flecha = (x1, y1, x2, y2, col, p, txt) => {
      if (p <= 0) return;
      const xe = x1 + (x2 - x1) * p, ye = y1 + (y2 - y1) * p;
      c.strokeStyle = col; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x1, y1); c.lineTo(xe, ye); c.stroke();
      if (p > .98) { const an = Math.atan2(y2 - y1, x2 - x1); c.fillStyle = col; c.beginPath();
        c.moveTo(x2, y2); c.lineTo(x2 - 9 * Math.cos(an - .4), y2 - 9 * Math.sin(an - .4)); c.lineTo(x2 - 9 * Math.cos(an + .4), y2 - 9 * Math.sin(an + .4)); c.fill(); }
      if (txt && p > .5) { c.fillStyle = col; c.font = '10px JetBrains Mono'; c.textAlign = 'center'; c.fillText(txt, (x1 + x2) / 2, (y1 + y2) / 2 - 6); }
    };
    const monton = (x, y, arr, col, on, rotulo) => {       // celdas del montón (el arreglo real)
      c.textAlign = 'left'; c.fillStyle = '#8a93b8'; c.font = '10px JetBrains Mono'; c.fillText(rotulo, x, y - 7);
      arr.forEach((v, i) => {
        const cx = x + i * 46, marcado = on && i === 0;
        c.fillStyle = marcado ? col + '3a' : '#ffffff0a'; c.strokeStyle = marcado ? col : '#ffffff25'; c.lineWidth = marcado ? 2 : 1;
        c.beginPath(); c.roundRect ? c.roundRect(cx, y, 42, 34, 6) : c.rect(cx, y, 42, 34); c.fill(); c.stroke();
        c.fillStyle = marcado ? '#fff' : '#e6e9f5'; c.font = '13px JetBrains Mono'; c.textAlign = 'center'; c.fillText(String(v), cx + 21, y + 22);
      });
      return x + arr.length * 46;
    };
    const vIni = V('val'), base = parse();
    const draw = fr => {
      const k = Math.min(3.999, fr * 4), fase = Math.floor(k), p = k - fase;
      c.clearRect(0, 0, W, H);
      c.fillStyle = COL.a; c.font = '13px JetBrains Mono'; c.textAlign = 'center';
      c.fillText(`Fase ${FASES[fase]}`, W / 2, 20);
      const bandas = [
        { t: 'cambiarPrimitivo(x)', col: COL.b, prim: true },
        { t: 'cambiarElemento(a)', col: COL.d, prim: false, reasigna: false },
        { t: 'reasignarArreglo(a)', col: COL.f, prim: false, reasigna: true },
      ];
      bandas.forEach((b, i) => {
        const yt = 36 + i * 130;
        c.fillStyle = '#e6e9f5'; c.font = '12px JetBrains Mono'; c.textAlign = 'left'; c.fillText(b.t, 14, yt + 12);
        if (b.prim) {
          caja(14, yt + 22, 170, 44, 'quien llama: x', String(vIni), b.col, fase === 3);
          if (fase >= 1) caja(250, yt + 22, 170, 44, 'parámetro x (copia)', String(fase >= 2 ? nv : vIni), b.col, fase === 2);
          flecha(188, yt + 44, 246, yt + 44, b.col, fase === 1 ? p : (fase > 1 ? 1 : 0), 'copia');
          if (fase === 3) { c.fillStyle = '#ff6b8b'; c.font = '12px Outfit'; c.textAlign = 'left'; c.fillText(`x sigue valiendo ${vIni}: no cambió`, 450, yt + 50); }
        } else {
          const mod = fase >= 2;
          const arrA = (!b.reasigna && mod) ? [nv, ...base.slice(1)] : base;
          caja(14, yt + 14, 170, 40, 'quien llama: a', 'referencia →', b.col, fase === 3);
          if (fase >= 1) caja(14, yt + 62, 170, 40, 'parámetro a (copia)', 'referencia →', b.col, fase === 2);
          monton(250, yt + 18, arrA, b.col, !b.reasigna && mod, 'arreglo original en el montón');
          flecha(188, yt + 34, 246, yt + 34, b.col, 1);
          if (fase >= 1) {
            const aNuevo = b.reasigna && mod;
            if (aNuevo) monton(250, yt + 70, [nv, nv, nv], b.col, true, 'arreglo NUEVO creado por el método');
            flecha(188, yt + 82, 246, aNuevo ? yt + 87 : yt + 40, b.col, fase === 1 ? p : 1, fase === 1 ? 'copia ref.' : '');
          }
          if (fase === 3) {
            c.font = '12px Outfit'; c.textAlign = 'left';
            c.fillStyle = b.reasigna ? '#ff6b8b' : '#5ee6a8';
            c.fillText(b.reasigna ? 'quien llama sigue viendo el original: no cambió' : `quien llama ve a[0] = ${nv}: sí cambió`, 460, yt + 112);
          }
        }
      });
    };
    go(anim, draw, 3600);
    S(`<p class="muted">Las tres llamadas se pasan <b>por valor</b>. Lo que cambia es <i>qué</i> se copia: en el primitivo se copia el número, así que el método escribe sobre su propia copia; en el arreglo se copia la <i>referencia</i>, y como las dos referencias apuntan al mismo montón, escribir <code>a[0]</code> sí se ve fuera. Pero reasignar <code>a</code> solo mueve la copia de la referencia: el original no se entera. Por eso el ODESolver puede actualizar <code>state</code> sin devolverlo, pero nunca debe reemplazar el arreglo entero.</p>`);
  }
});

// ---------------- Ejercicio 3.6 ----------------
reg({
  id: 'e36', group: '3.5–3.6 Interfaces ODE y ODESolver', sec: '3.5–3.6', tag: 'E3.6', short: 'ODE solvers: Euler, E‑R, RK4',
  title: 'Ejercicio 3.6 · Solucionadores de ODE',
  desc: 'Un sistema implementa la interfaz ODE (getState, getRate) y cualquier ODESolver puede avanzarlo. Compara Euler, Euler‑Richardson y Runge‑Kutta de 4º orden en la caída libre y en el oscilador armónico.',
  controls: [
    { id: 'sys', type: 'select', label: 'Sistema', value: 'sho', options: [['fall', 'FallingParticleODE'], ['sho', 'Oscilador armónico (SHO)']] },
    { id: 'dt', type: 'range', label: 'Paso Δt', min: .001, max: .5, step: .001, value: .1 },
    { id: 'tmax', type: 'range', label: 'Tiempo total', min: 1, max: 100, step: 1, value: 30 },
    { id: 'Euler', type: 'check', label: 'Euler', value: true, color: COL.b },
    { id: 'EulerRichardson', type: 'check', label: 'Euler‑Richardson', value: true, color: COL.d },
    { id: 'RK4', type: 'check', label: 'RK4', value: true, color: COL.e },
  ],
  views: [
    { id: 'code', title: 'Código: interfaces ODE y ODESolver en JavaScript', html: true },
    { id: 'v1', title: 'Estado x(t) o y(t)', half: true, w: 440, h: 300 },
    { id: 'v2', title: 'log₁₀ |error| vs t', half: true, w: 440, h: 300 },
  ],
  run(anim) {
    $('code').innerHTML = `<pre class="code">class ODE {                         // interfaz (sección 3.5)
  getState() {}                     // arreglo de estado, p. ej. [y, v, t]
  getRate(state) {}                 // derivadas [dy/dt, dv/dt, dt/dt]
}
class FallingParticleODE extends ODE {
  constructor(y, v) { super(); this.state = [y, v, 0]; }
  getState()  { return this.state; }
  getRate(s)  { return [s[1], -9.8, 1]; }
}
const Euler = {                      // ODESolver (sección 3.6)
  step(ode, dt) {
    const s = ode.getState(), r = ode.getRate(s);
    for (let i = 0; i &lt; s.length; i++) s[i] += r[i] * dt;
  }
};
// EulerRichardson: evalúa getRate en el punto medio
// RK4: k1..k4, s += (k1 + 2k2 + 2k3 + k4)·dt/6</pre>`;
    const dt = V('dt'), T = V('tmax'), sys = V('sys'), cols = { Euler: COL.b, EulerRichardson: COL.d, RK4: COL.e }, evals = { Euler: 1, EulerRichardson: 2, RK4: 4 };
    const mk = () => sys === 'fall' ? new ODE([10, 0, 0], s => [s[1], -g, 1]) : new ODE([1, 0, 0], s => [s[1], -s[0], 1]);
    const exact = t => sys === 'fall' ? 10 - g * t * t / 2 : Math.cos(t);
    const R = Object.keys(Solvers).filter(k => V(k)).map(k => ({ k, P: integrate(mk(), k, dt, s => s[2] >= T - 1e-9) }));
    const ex = []; for (let i = 0; i <= 600; i++) ex.push([T * i / 600, exact(T * i / 600)]);
    const lim = sys === 'sho' ? 3 : undefined;
    const draw = fr => {
      const tn = T * fr, cut = P => thin(P.filter(s => s[2] <= tn + 1e-9));
      plot($('v1'), [{ pts: ex.filter(p => p[0] <= tn), color: '#fff', dash: [4, 4], width: 1.2, label: 'Exacta' }, ...R.map(r => ({ pts: cut(r.P).map(s => [s[2], s[0]]), color: cols[r.k], label: r.k }))], { xmin: 0, xmax: T, ymin: lim && -lim, ymax: lim, xlabel: 't', ylabel: sys === 'fall' ? 'y' : 'x' });
      plot($('v2'), R.map(r => ({ pts: cut(r.P).slice(1).map(s => [s[2], Math.log10(Math.max(1e-16, Math.abs(s[0] - exact(s[2]))))]), color: cols[r.k], label: r.k })), { xmin: 0, xmax: T, xlabel: 't', ylabel: 'log₁₀ |error|', legend: 'left' });
    };
    go(anim, draw, 2000);
    S(tbl(['Solver', 'Error final', 'Evaluaciones de getRate'], R.map(r => { const s = r.P[r.P.length - 1]; return [`<span style="color:${cols[r.k]}">${r.k}</span>`, fmt(Math.abs(s[0] - exact(s[2]))), (r.P.length - 1) * evals[r.k]]; })));
  }
});
