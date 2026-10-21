/* ==========================================================
   Chaket · página «Colección en 3D» (Plumón ligero)
   - El modelo completo (js/modelo.js) en el visor: gira sola, se arrastra, rueda o pellizco para acercar
   - Cinco colores del catálogo: funde la tela, los ribetes, el forro y la cremallera
   - Vistas guiadas: frente, espalda, perfil, cuello, bolsillo y puño
   - Talla con las existencias del color elegido y botón para añadirla a la cesta (js/tienda.js)
   ========================================================== */
(() => {
  const T = window.CHAKET;
  const C3D = window.Chaket3D;
  const ID = 'plumon-ligero';
  const producto = T.productos[ID];

  const seccion = document.querySelector('#visor');
  const figura = seccion.querySelector(':scope > figure');
  const lienzo = figura.querySelector('canvas');
  const nombreColor = figura.querySelector('figcaption strong');
  const grados = figura.querySelector('figcaption output');
  const formulario = seccion.querySelector(':scope > form');
  const leyendaColor = formulario.querySelector('fieldset:first-of-type legend output');
  const leyendaTalla = formulario.querySelector('fieldset:nth-of-type(3) legend output');
  const textoVista = formulario.querySelector(':scope > output');
  const botonGiro = formulario.querySelector(':scope > p button[type="button"]');
  const enlaceFicha = formulario.querySelector(':scope > p a');
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nombre = (id) => T.colores[id].nombre;
  const marcado = (n) => formulario.querySelector(`input[name="${n}"]:checked`);

  /* ---------- talla: existencias del color elegido ---------- */
  function existencias() {
    const color = marcado('color').value;
    formulario.querySelectorAll('input[name="talla"]').forEach((r) => {
      const n = producto.stock[color][r.value];
      r.disabled = !n;
      r.closest('label').toggleAttribute('data-pocas', n > 0 && n <= 3);
    });
    let talla = marcado('talla');
    if (!talla || talla.disabled) {
      talla = formulario.querySelector('input[name="talla"][value="M"]:not(:disabled)') || formulario.querySelector('input[name="talla"]:not(:disabled)');
      if (talla) talla.checked = true;
    }
    const n = talla ? producto.stock[color][talla.value] : 0;
    leyendaTalla.textContent = !talla ? 'Agotada en este color' : n <= 3 ? `${talla.value} · quedan ${n}` : `${talla.value} · en stock`;
  }

  /* ---------- color: nombre, enlace a la ficha y la chaqueta ---------- */
  let chaqueta = null;
  function ponerColor(id) {
    nombreColor.textContent = nombre(id);
    leyendaColor.textContent = nombre(id);
    enlaceFicha.href = `producto.html?p=${ID}&c=${id}`;
    lienzo.setAttribute('aria-label', `Chaqueta de plumón ligero en ${nombre(id).toLowerCase()}, en 3D. Arrastra para girarla.`);
    if (chaqueta) C3D.pintar(chaqueta, id, sinMovimiento ? 0 : 0.55);
    existencias();
  }

  /* ---------- añadir a la cesta ---------- */
  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const talla = marcado('talla');
    if (!talla) return;
    T.anadir({ id: ID, color: marcado('color').value, talla: talla.value, cantidad: 1 });
  });

  // la galería de colores también cambia el visor
  document.querySelectorAll('#colores a[data-color]').forEach((a) => a.addEventListener('click', () => {
    const r = formulario.querySelector(`input[name="color"][value="${a.dataset.color}"]`);
    r.checked = true;
    ponerColor(r.value);
  }));

  formulario.addEventListener('change', (e) => {
    if (e.target.name === 'color') ponerColor(e.target.value);
    if (e.target.name === 'talla') existencias();
  });
  ponerColor(marcado('color').value);

  /* ---------- 3D ---------- */
  const render = C3D && C3D.renderer(lienzo);
  if (!render) { figura.dataset.estado = 'sin-3d'; return; }

  // posiciones del modelo (en metros, de 0 en el bajo a 0,77 en el cuello) pasadas a la escena
  const E = C3D.ESCALA;
  const punto = (x, y, z) => new THREE.Vector3(x * E, (y - C3D.CENTRO_Y) * E, z * E);
  const VISTAS = {
    frente: { az: 0, el: 0.06, dist: 'auto', mira: punto(0, 0.39, 0), texto: 'Cuello alto, cremallera de espiral hasta arriba y nueve canales horizontales.' },
    espalda: { az: Math.PI, el: 0.06, dist: 'auto', mira: punto(0, 0.39, 0), texto: 'Espalda limpia: los canales dan la vuelta y las costuras raglán bajan del cuello a la axila.' },
    perfil: { az: Math.PI / 2, el: 0.04, dist: 'auto', mira: punto(0, 0.39, 0), texto: 'De perfil: manga raglán sin costura en el hombro y el cuello un poco más alto detrás.' },
    cuello: { az: 0.3, el: 0.12, dist: 0.5 * E, mira: punto(0, 0.68, 0.05), texto: 'Cuello de 7 cm con garaje en la cremallera, tirador metálico con el monograma «ch» y etiqueta interior.' },
    bolsillo: { az: 0.55, el: 0.05, dist: 0.5 * E, mira: punto(0.14, 0.19, 0.11), texto: 'Bolsillos de cremallera oculta de 17 cm, con pespunte a los dos lados y tirador pequeño.' },
    puno: { az: 1.05, el: -0.05, dist: 0.55 * E, mira: punto(0.33, 0.05, 0.06), texto: 'Puño con ribete elástico fruncido: no deja pasar el aire y el canal termina limpio.' },
  };
  const CERCA = 0.35 * E, LEJOS = 3.2 * E;

  const escena = new THREE.Scene();
  escena.environment = C3D.estudio(render);
  C3D.luces(escena);
  const camara = new THREE.PerspectiveCamera(28, 1, 0.01, 40);
  const suelo = C3D.sombra(1.45, 0.65, 0.26);
  suelo.position.y = -0.6;
  escena.add(suelo);

  C3D.chaqueta(marcado('color').value, 'completo').then((pieza) => {
    chaqueta = pieza;
    C3D.pintar(chaqueta, marcado('color').value);
    escena.add(chaqueta);
    figura.dataset.estado = '3d';
  }).catch(() => { figura.dataset.estado = 'sin-3d'; });

  /* ---------- cámara en una esfera alrededor de un punto ---------- */
  let distAuto = 2.05 * E;
  const actual = { az: 0.35, el: 0.08, dist: 2.6 * E, mira: VISTAS.frente.mira.clone() };
  const objetivo = { az: 0, el: 0.06, dist: distAuto, mira: VISTAS.frente.mira.clone() };
  let vistaActual = 'frente';
  let girando = !sinMovimiento;
  function colocar() {
    const c = Math.cos(actual.el);
    camara.position.set(
      actual.mira.x + actual.dist * c * Math.sin(actual.az),
      actual.mira.y + actual.dist * Math.sin(actual.el),
      actual.mira.z + actual.dist * c * Math.cos(actual.az));
    camara.lookAt(actual.mira);
  }

  function irA(n) {
    const v = VISTAS[n];
    const vueltas = Math.round((actual.az - v.az) / (Math.PI * 2));   // por el camino corto
    objetivo.az = v.az + vueltas * Math.PI * 2;
    objetivo.el = v.el;
    objetivo.dist = v.dist === 'auto' ? distAuto : v.dist;
    objetivo.mira.copy(v.mira);
    vistaActual = n;
    textoVista.textContent = v.texto;
    if (v.dist !== 'auto') giro(false);
  }
  function giro(si) {
    girando = si;
    botonGiro.setAttribute('aria-pressed', String(si));
  }
  botonGiro.addEventListener('click', () => {
    const si = botonGiro.getAttribute('aria-pressed') !== 'true';
    if (si) {
      formulario.querySelector('input[name="vista"][value="frente"]').checked = true;
      irA('frente');
    }
    giro(si);
  });
  if (sinMovimiento) giro(false);

  formulario.addEventListener('change', (e) => {
    if (e.target.name === 'vista') irA(e.target.value);
  });

  /* ---------- arrastrar, rueda, pellizco y teclado ---------- */
  const punteros = new Map();
  let pellizco = 0;
  const acercar = (f) => { objetivo.dist = THREE.MathUtils.clamp(objetivo.dist * f, CERCA, LEJOS); };
  lienzo.addEventListener('pointerdown', (e) => {
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lienzo.setPointerCapture(e.pointerId);
    giro(false);
  });
  lienzo.addEventListener('pointermove', (e) => {
    const p = punteros.get(e.pointerId);
    if (!p) return;
    if (punteros.size === 2) {
      const [a, b] = [...punteros.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pellizco) acercar(pellizco / Math.max(d, 1));
      pellizco = d;
    } else {
      objetivo.az -= (e.clientX - p.x) * 0.008;
      objetivo.el = THREE.MathUtils.clamp(objetivo.el + (e.clientY - p.y) * 0.005, -0.5, 0.9);
    }
    p.x = e.clientX; p.y = e.clientY;
  });
  const soltar = (e) => { punteros.delete(e.pointerId); if (punteros.size < 2) pellizco = 0; };
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', soltar);
  lienzo.addEventListener('wheel', (e) => { e.preventDefault(); acercar(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
  lienzo.addEventListener('keydown', (e) => {
    const paso = { ArrowLeft: [0.25, 0], ArrowRight: [-0.25, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key];
    if (paso) { e.preventDefault(); giro(false); objetivo.az += paso[0]; objetivo.el = THREE.MathUtils.clamp(objetivo.el + paso[1], -0.5, 0.9); }
    if (e.key === '+' || e.key === '-') acercar(e.key === '+' ? 0.85 : 1.18);
  });

  /* ---------- tamaño y bucle ---------- */
  function ajustar() {
    const { width, height } = lienzo.getBoundingClientRect();
    if (!width || !height) return;
    render.setSize(width, height, false);
    camara.aspect = width / height;
    camara.fov = width < 560 ? 34 : 28;
    camara.updateProjectionMatrix();
    const tan = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    distAuto = Math.max(0.98 * E / (2 * tan), 0.94 * E / (2 * tan * camara.aspect));
    if (VISTAS[vistaActual].dist === 'auto') objetivo.dist = distAuto;
  }
  new ResizeObserver(ajustar).observe(lienzo);
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(lienzo);

  let antes = performance.now();
  render.setAnimationLoop((ahora) => {
    const dt = Math.min((ahora - antes) / 1000, 0.05);
    antes = ahora;
    if (!visible) return;
    C3D.avanzar(dt);
    if (girando) objetivo.az += dt * 0.32;
    const k = 1 - Math.exp(-dt * 5.5);
    actual.az += (objetivo.az - actual.az) * k;
    actual.el += (objetivo.el - actual.el) * k;
    actual.dist += (objetivo.dist - actual.dist) * k;
    actual.mira.lerp(objetivo.mira, k);
    colocar();
    grados.textContent = `${Math.round(((THREE.MathUtils.radToDeg(actual.az) % 360) + 360) % 360)}°`;
    render.render(escena, camara);
  });
})();
