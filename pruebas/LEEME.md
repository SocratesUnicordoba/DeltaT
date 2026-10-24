# Pruebas del simulador

Se ejecutan con Node, sin dependencias. Cargan `core.js` y los `mod_*.js` en un
contexto con un DOM y un canvas simulados, igual que los concatenaría el navegador.

    node pruebas/humo.js      # ejecuta los 23 módulos y todos sus botones
    node pruebas/fisica.js    # comprueba la física del Apéndice 3A y de la §3.11

`humo.js` detecta errores en tiempo de ejecución y mide cuánto tarda cada módulo.
`fisica.js` comprueba resultados que deben salir por teoría: el orden global de los
once algoritmos, que el medio paso (3.37) coincide con el Verlet de velocidades (3.48),
que Euler–Cromer y Verlet conservan exactamente el área del espacio de fases, que el
RK45 adaptativo supera al RK4 de paso fijo con las mismas evaluaciones, que la
extrapolación de Richardson es de orden 4 y que el arrastre de la §3.11 emerge del
modelo microscópico.
