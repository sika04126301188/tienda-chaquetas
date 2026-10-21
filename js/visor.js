/* ==========================================================
   Chaket · visor 3D de una chaqueta (configurador, ficha del producto y resumen del pago)
   - Se gira arrastrando (ratón o dedo) con inercia
   - Modo «360»: gira sola despacio cuando nadie la toca
   - Modo «balanceo»: se mece suave delante y detrás
   - cargar(color) la pone y, si ya estaba, funde el color nuevo
   - mirar(ángulo) va por el camino corto; girarA(grados) la deja en un ángulo exacto
   ========================================================== */
window.ChaketVisor = function (figura, opciones = {}) {
  const C3D = window.Chaket3D;
  if (!C3D || !window.THREE) return null;
  const lienzo = figura.querySelector('canvas');
  const render = C3D.renderer(lienzo);
  if (!render) return null;
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modo360 = opciones.modo === '360';
  const cual = opciones.modelo || 'completo';

  const escena = new THREE.Scene();
  escena.environment = C3D.estudio(render);
  C3D.luces(escena);
  const camara = new THREE.PerspectiveCamera(26, 1, 0.05, 50);
  const soporte = new THREE.Group();
  const pieza = new THREE.Group();
  soporte.add(pieza);
  const suelo = C3D.sombra(1.3, 0.55, 0.26);
  suelo.position.y = -0.6;
  escena.add(soporte, suelo);

  let giro = 0, velocidad = 0, inclinacion = 0, arrastrando = false, ultimoX = 0, ultimoY = 0;
  let objetivo = null, reposo = 0, centro = 0, escala = 1, pausado = false, chaqueta = null;
  const avisar = () => opciones.alGirar && opciones.alGirar(((THREE.MathUtils.radToDeg(giro) % 360) + 360) % 360);

  lienzo.addEventListener('pointerdown', (e) => {
    arrastrando = true;
    objetivo = null;
    ultimoX = e.clientX; ultimoY = e.clientY;
    lienzo.setPointerCapture(e.pointerId);
  });
  lienzo.addEventListener('pointermove', (e) => {
    if (!arrastrando) return;
    const dx = e.clientX - ultimoX, dy = e.clientY - ultimoY;
    ultimoX = e.clientX; ultimoY = e.clientY;
    velocidad = dx * 0.011;
    giro += velocidad;
    inclinacion = THREE.MathUtils.clamp(inclinacion + dy * 0.004, -0.3, 0.35);
  });
  const soltar = () => {
    if (!arrastrando) return;
    arrastrando = false;
    reposo = performance.now();
    centro = giro;
    opciones.alSoltar && opciones.alSoltar(Math.cos(giro) >= 0 ? 'frente' : 'espalda');
  };
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', soltar);

  let colorPedido = null, cargando = null;
  function cargar(colorId) {
    colorPedido = colorId;
    if (chaqueta) {
      C3D.pintar(chaqueta, colorId, sinMovimiento ? 0 : 0.6);
      return Promise.resolve();
    }
    if (cargando) return cargando;          // al terminar se pinta con el último color pedido
    cargando = C3D.chaqueta(colorId, cual).then((nueva) => {
      chaqueta = nueva;
      C3D.pintar(chaqueta, colorPedido);
      pieza.add(chaqueta);
      figura.dataset.estado = '3d';
      // entrada: media vuelta que termina de frente
      escala = sinMovimiento ? 1 : 0.86;
      giro = sinMovimiento ? 0 : -Math.PI * 0.8;
      objetivo = 0;
      velocidad = 0;
    }).catch(() => { figura.dataset.estado = 'sin-3d'; });
    return cargando;
  }

  function mirar(angulo) {
    const vueltas = Math.round((giro - angulo) / (Math.PI * 2));
    objetivo = angulo + vueltas * Math.PI * 2;
    velocidad = 0;
  }
  // ángulo exacto (barra de 0 a 360°): sin animación, la chaqueta sigue a la mano
  function girarA(grados) {
    const vueltas = Math.floor(giro / (Math.PI * 2));
    giro = vueltas * Math.PI * 2 + THREE.MathUtils.degToRad(grados);
    objetivo = null;
    velocidad = 0;
    reposo = performance.now();
    centro = giro;
  }

  function ajustar() {
    const { width, height } = lienzo.getBoundingClientRect();
    if (!width || !height) return;
    render.setSize(width, height, false);
    camara.aspect = width / height;
    const tan = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    const porAlto = 1.06 / (opciones.margen || 0.8) / (2 * tan);
    const porAncho = 1.08 / (width < 560 ? 0.9 : (opciones.margen || 0.8)) / (2 * tan * camara.aspect);
    const d = Math.max(porAlto, porAncho);
    camara.position.set(0, d * 0.08, d);
    camara.lookAt(0, -0.02, 0);
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(ajustar).observe(lienzo);

  let enPantalla = false, antes = performance.now();
  new IntersectionObserver(([e]) => (enPantalla = e.isIntersecting)).observe(lienzo);
  render.setAnimationLoop((ahora) => {
    const dt = Math.min((ahora - antes) / 1000, 0.05);
    antes = ahora;
    if (!enPantalla) return;
    C3D.avanzar(dt);
    if (!arrastrando) {
      if (objetivo !== null) {
        giro += (objetivo - giro) * Math.min(dt * 4.2, 1);
        if (Math.abs(objetivo - giro) < 0.002) { giro = objetivo; objetivo = null; reposo = ahora; centro = giro; }
      } else {
        velocidad *= Math.pow(0.05, dt);
        giro += velocidad;
        if (Math.abs(velocidad) > 0.002) { centro = giro; reposo = ahora; }
        else if (!sinMovimiento && !pausado && ahora - reposo > 1200) {
          if (modo360) giro += dt * 0.42;      // una vuelta cada 15 s
          else giro += (centro + Math.sin((ahora - reposo) / 1000 * 0.6) * 0.38 - giro) * Math.min(dt * 1.4, 1);
        }
      }
      inclinacion *= Math.pow(0.15, dt);
    }
    escala += (1 - escala) * Math.min(dt * 6, 1);
    pieza.rotation.y = giro;
    soporte.rotation.x = inclinacion;
    soporte.scale.setScalar(escala);
    soporte.position.y = sinMovimiento ? 0 : Math.sin(ahora / 900) * 0.01;
    render.render(escena, camara);
    avisar();
  });

  return {
    cargar, mirar, girarA,
    pausar(si) { pausado = si; reposo = performance.now(); centro = giro; },
    angulo: () => giro,
  };
};
