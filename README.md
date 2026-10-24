# Δt · Delta t

Simulador interactivo de movimiento de partículas. Reúne 23 módulos ejecutables
—algoritmos de Euler, solucionadores de ODE, arrastre, trayectorias en dos y tres
dimensiones, procesos de decaimiento, niveles de simulación y los algoritmos de
integración del apéndice— cada uno con su animación, sus gráficas y su reporte.

**Autores:** Nicolas de la Espriella Vélez Ph. D., Daniel José Salas Álvarez M. Sc.,
Pierre Augusto Peña salgado M. Sc.

## Cómo ejecutarlo

No necesita compilación ni dependencias. Basta abrir `index.html` en el navegador.

Para servirlo por HTTP (recomendado, evita restricciones de `file://`):

```bash
python -m http.server 8000
# y abrir http://localhost:8000
```

## Qué incluye

| Grupo | Módulos |
|---|---|
| Algoritmos de Euler modificados | P3.1, E3.2 |
| Interfaces | E3.3 |
| Dibujo | E3.4 |
| Estado con arreglos | E3.5 |
| Interfaces ODE y ODESolver | E3.6 |
| Efectos del arrastre | P3.7, P3.8, P3.9 |
| Trayectorias bidimensionales | P3.10, P3.11 |
| Procesos de decaimiento | P3.12, P3.13, P3.14 |
| Movimiento en tres dimensiones | L3.11, P3.15–16, P3.17, P3.18 |
| Niveles de simulación | §3.11 |
| Algoritmos de integración | A3A.1, A3A.2, A3A.3, A3A.4 |

Funciones transversales:

- **Inicio de sesión** con nombre, materia, carrera (pregrados de la Universidad de
  Córdoba), grupo y semestre calculado a partir de la fecha. La sesión se borra al
  cerrar el navegador.
- **Velocidad de animación** regulable de 0.1× a 2×, aplicada a los 23 módulos.
- **Reporte `.txt` por ejercicio**: parámetros, ecuaciones, resultados y los datos
  de las curvas dibujadas.
- **Informe de usabilidad** con el instrumento de 24 ítems en escala Likert según
  ISO/IEC 25010:2011, con puntuación por dimensión y exportación a `.txt`.

## Estructura

```
index.html      página y formularios
styles.css      hoja de estilos
core.js         núcleo: ODE, solucionadores, gráficas, interfaz, sesión, reportes
mod_a.js        secciones 3.1 a 3.6
mod_b.js        secciones 3.7 a 3.9
mod_c.js        sección 3.10 (tres dimensiones)
mod_d.js        sección 3.11 y algoritmos de integración
pruebas/        suites de verificación (Node, sin dependencias)
legacy/         versión anterior de una sola página, ya no se carga
```

## Pruebas

Se ejecutan con Node y no requieren instalar nada:

```bash
node pruebas/humo.js      # ejecuta los 23 módulos y todos sus botones
node pruebas/fisica.js    # comprueba resultados que deben salir por teoría
```

`humo.js` carga el simulador en un DOM y un canvas simulados y detecta errores en
tiempo de ejecución. `fisica.js` verifica el orden global de los once algoritmos de
integración, la equivalencia entre el medio paso y el Verlet de velocidades, la
conservación exacta del área del espacio de fases por los métodos simplécticos, la
ventaja del paso adaptativo frente al paso fijo y el orden cuatro de la
extrapolación de Richardson.
