/* ==========================================================
   Chaket · el armario del hero
   Las chaquetas cuelgan de lado en una barra, como en un armario.
   Al pasar el ratón por una:
     1. se levanta un poco de la barra,
     2. sale hacia delante y se acerca al centro,
     3. gira despacio hasta quedar de frente.
   Las vecinas se apartan un poco y se balancean en su percha (péndulos de verdad:
   si la percha se mueve, la chaqueta se queda atrás y luego oscila hasta pararse).
   Todos los movimientos son muelles amortiguados: suaves, sin tirones ni rebotes bruscos.
   Accesible: cada chaqueta tiene un enlace (oculto a la vista) que al recibir el foco la gira.
   ========================================================== */
window.ChaketArmario = function (figura, productos) {
  const C3D = window.Chaket3D;
  if (!C3D || !window.THREE) return null;
  const lienzo = figura.querySelector("canvas");
  const etiqueta = figura.querySelector(":scope > p");
  const enlaces = [...figura.querySelectorAll("a")];
  const render = C3D.renderer(lienzo);
  if (!render) return null;
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tactil = matchMedia("(hover: none)").matches;
  render.shadowMap.enabled = true;
  render.shadowMap.type = THREE.PCFSoftShadowMap;

  // Posición de la etiqueta: variables en una hoja de estilos propia (nunca atributos style)
  const hoja = new CSSStyleSheet();
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, hoja];
  const reglaEtiqueta = hoja.cssRules[hoja.insertRule("main > section:first-of-type > figure:last-of-type { --x: 0; --y: 0; }", 0)];

  /* ---------- Escena ---------- */
  const escena = new THREE.Scene();
  escena.environment = C3D.estudio(render);
  escena.add(new THREE.HemisphereLight(0xffffff, 0xe2e2e6, 0.62));
  const clave = new THREE.DirectionalLight(0xffffff, 1.15);
  clave.position.set(-2.4, 4.2, 4.5);
  clave.castShadow = true;
  clave.shadow.mapSize.set(2048, 2048);
  Object.assign(clave.shadow.camera, { left: -2.6, right: 2.6, top: 2.2, bottom: -2.2, near: 0.5, far: 14 });
  clave.shadow.bias = -0.0004;
  clave.shadow.normalBias = 0.015;
  clave.shadow.radius = 6;
  escena.add(clave);
  const relleno = new THREE.DirectionalLight(0xf3f6ff, 0.42);
  relleno.position.set(3, 1.5, 3);
  escena.add(relleno);
  const contra = new THREE.DirectionalLight(0xffffff, 0.5);
  contra.position.set(0.5, 3, -4);
  escena.add(contra);

  const camara = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  const RIEL = 1.0;                      // altura de la barra
  const SEPARACION = 0.43;
  const n = productos.length;
  const anchoBarra = (n - 1) * SEPARACION + 1.1;

  // Barra cromada con sus soportes
  const cromo = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 1, roughness: 0.22, envMapIntensity: 1.2 });
  const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, anchoBarra, 32), cromo);
  barra.rotation.z = Math.PI / 2;
  barra.position.y = RIEL;
  barra.castShadow = true;
  escena.add(barra);
  [-1, 1].forEach((lado) => {
    const soporte = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 16), cromo);
    soporte.rotation.x = Math.PI / 2;
    soporte.position.set(lado * anchoBarra / 2, RIEL, -0.3);
    escena.add(soporte);
    const tapa = new THREE.Mesh(new THREE.SphereGeometry(0.03, 24, 16), cromo);
    tapa.position.set(lado * anchoBarra / 2, RIEL, 0);
    escena.add(tapa);
  });

  // Percha: solo el gancho de metal; el cuerpo de la percha queda escondido dentro de la chaqueta
  const geoGancho = new THREE.TorusGeometry(0.04, 0.0065, 12, 48, Math.PI * 1.25);
  const geoVastago = new THREE.CylinderGeometry(0.0065, 0.0065, 0.08, 12);

  /* ---------- Chaquetas ---------- */
  const piezas = productos.map((p, i) => {
    const percha = new THREE.Group();   // pivote en el gancho: aquí se aplica el balanceo
    const giro = new THREE.Group();     // giro sobre el gancho (de lado / de frente)
    percha.add(giro);
    const gancho = new THREE.Mesh(geoGancho, cromo);
    gancho.rotation.set(0, Math.PI / 2, -Math.PI * 0.12);
    gancho.castShadow = true;
    giro.add(gancho);
    const vastago = new THREE.Mesh(geoVastago, cromo);
    vastago.position.y = -0.075;
    vastago.castShadow = true;
    giro.add(vastago);
    escena.add(percha);
    const x0 = (i - (n - 1) / 2) * SEPARACION;
    const lado = Math.PI / 2 - 0.12 + (i % 2 ? 0.05 : -0.04);   // de lado, como en una barra de tienda
    return {
      producto: p, percha, giro, malla: null,
      // estado de cada movimiento: valor y velocidad
      x: { v: x0 + 3.2 + i * 0.5, w: 0 }, y: { v: RIEL, w: 0 }, z: { v: 0, w: 0 }, th: { v: lado, w: 0 },
      fx: { v: 0, w: 0 }, fz: { v: 0, w: 0 },           // balanceo (péndulo) en los dos ejes
      x0, lado, retraso: 0.25 + i * 0.13,
    };
  });

  // Cada percha lleva una copia del modelo ligero, pintada con el color de su producto
  const listas = Promise.all(piezas.map(async (pz) => {
    const malla = await C3D.chaqueta(pz.producto.color, 'ligero');
    malla.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    malla.position.y = -0.56;            // el cuello queda justo bajo el gancho
    pz.giro.add(malla);
    pz.malla = malla;
  }));

  /* ---------- Encuadre ---------- */
  function medir() {
    const { width, height } = lienzo.getBoundingClientRect();
    if (!width || !height) return;
    render.setSize(width, height, false);
    camara.aspect = width / height;
    // que quepa la barra entera y la chaqueta que sale de frente
    const tan = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    // en pantallas estrechas se recortan un poco los extremos de la barra: las chaquetas se ven más grandes
    const anchoVista = width < 600 ? Math.min(anchoBarra + 0.5, 2.75) : anchoBarra + 0.5;
    const porAncho = anchoVista / (2 * tan * camara.aspect);
    const porAlto = 1.9 / (2 * tan);
    const d = Math.max(porAncho, porAlto, width < 600 ? 3.6 : 4.2);
    camara.position.set(0, RIEL + 0.15 + d * 0.06, d);
    camara.lookAt(0, RIEL - 0.55, 0);
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(medir).observe(lienzo);
  medir();

  /* ---------- Qué chaqueta se elige ----------
     Por columnas de la barra (no por el dibujo): así no parpadea cuando la chaqueta se mueve */
  let elegida = -1, tiempoEleccion = 0;
  const v3 = new THREE.Vector3();
  function columna(clientX, clientY) {
    const r = lienzo.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * 2 - 1;
    const py = -((clientY - r.top) / r.height) * 2 + 1;
    // zona vertical de las chaquetas (de la barra al bajo)
    v3.set(0, RIEL + 0.1, 0).project(camara);
    const arriba = v3.y;
    v3.set(0, RIEL - 1.15, 0).project(camara);
    const abajo = v3.y;
    if (py > arriba || py < abajo) return -1;
    let mejor = -1, dist = Infinity;
    piezas.forEach((pz, i) => {
      v3.set(pz.x0, RIEL - 0.5, 0).project(camara);
      const d = Math.abs(v3.x - px);
      if (d < dist) { dist = d; mejor = i; }
    });
    v3.set(SEPARACION, 0, 0).project(camara);
    const paso = Math.abs(v3.x - new THREE.Vector3(0, 0, 0).project(camara).x);
    return dist < paso * 0.9 ? mejor : -1;
  }
  function elegir(i) {
    if (i === elegida) return;
    elegida = i;
    tiempoEleccion = performance.now();
    if (i >= 0) {
      figura.dataset.elegida = "";
      const p = productos[i];
      etiqueta.querySelector("strong").textContent = p.nombre;
      etiqueta.querySelector("data").value = p.precio;
      etiqueta.querySelector("data").textContent = p.precioTexto;
      etiqueta.querySelector("small").textContent = p.marca;
    } else delete figura.dataset.elegida;
  }

  if (tactil) figura.querySelector("figcaption").textContent = "Toca una chaqueta para girarla · otro toque la abre";
  if (!tactil) {
    lienzo.addEventListener("pointermove", (e) => elegir(columna(e.clientX, e.clientY)));
    lienzo.addEventListener("pointerleave", () => elegir(-1));
  }
  lienzo.addEventListener("click", (e) => {
    const i = columna(e.clientX, e.clientY);
    if (i < 0) return;
    // En el móvil: el primer toque la gira; el segundo abre el producto
    if (tactil && i !== elegida) { elegir(i); return; }
    location.href = productos[i].url;
  });
  enlaces.forEach((a, i) => {
    a.addEventListener("focus", () => elegir(i));
    a.addEventListener("blur", () => elegir(-1));
  });

  /* ---------- Movimiento ---------- */
  function muelle(s, objetivo, k, dt) {
    const c = 2 * Math.sqrt(k);       // amortiguación crítica: llega sin pasarse
    const a = k * (objetivo - s.v) - c * s.w;
    s.w += a * dt;
    s.v += s.w * dt;
    return a;
  }
  function pendulo(s, aceleracion, dt) {
    const L = 0.55, G = 9.8;
    const a = -(G / L) * s.v - 1.5 * s.w - aceleracion / L;
    s.w += a * dt;
    s.v = Math.max(-0.35, Math.min(0.35, s.v + s.w * dt));
  }

  let enPantalla = true, tiempo = 0, antes = performance.now();
  new IntersectionObserver(([e]) => (enPantalla = e.isIntersecting)).observe(figura);

  function actualizar(dt) {
    tiempo += dt;
    piezas.forEach((pz, i) => {
      if (tiempo < pz.retraso) return;              // entrada escalonada por la barra
      const fuera = i === elegida;
      // Objetivos: la elegida sale de frente y hacia el centro; las vecinas se apartan
      let xT = pz.x0, yT = RIEL, zT = 0, thT = pz.lado;
      if (elegida >= 0) {
        if (fuera) {
          const t = (performance.now() - tiempoEleccion) / 1000;
          xT = pz.x0 * 0.32;
          yT = RIEL + 0.07;
          zT = t > 0.08 ? 1.05 : 0;                  // primero se levanta, luego sale
          thT = t > 0.16 ? 0 : pz.lado;              // y después gira de frente
        } else {
          const d = i - elegida;
          xT = pz.x0 + Math.sign(d) * 0.16 / Math.abs(d);
          thT = pz.lado + Math.sign(d) * 0.06;
        }
      }
      const ax = muelle(pz.x, xT, fuera ? 26 : 34, dt);
      muelle(pz.y, yT, 60, dt);
      const az = muelle(pz.z, zT, fuera ? 24 : 30, dt);
      muelle(pz.th, thT, fuera ? 17 : 22, dt);
      // Balanceo: la chaqueta se queda atrás cuando la percha acelera
      pendulo(pz.fx, ax, dt);
      pendulo(pz.fz, az * 0.6, dt);
      // Una brisa mínima para que el armario respire
      if (!sinMovimiento && Math.random() < dt * 0.25) pz.fx.w += (Math.random() - 0.5) * 0.06;
      pz.percha.position.set(pz.x.v, pz.y.v, pz.z.v);
      pz.percha.rotation.set(-pz.fz.v * 0.6, 0, pz.fx.v);
      pz.giro.rotation.y = pz.th.v;
    });
    // La etiqueta sigue a la chaqueta elegida (arriba a la derecha de la prenda)
    if (elegida >= 0) {
      const pz = piezas[elegida];
      v3.set(0.62, -0.08, 0).applyMatrix4(pz.giro.matrixWorld).project(camara);
      const r = lienzo.getBoundingClientRect();
      reglaEtiqueta.style.setProperty("--x", ((v3.x + 1) / 2 * r.width).toFixed(1));
      reglaEtiqueta.style.setProperty("--y", ((1 - v3.y) / 2 * r.height).toFixed(1));
    }
  }

  listas.catch(() => {}).then(() => {
    if (!piezas.every((pz) => pz.malla)) return;
    figura.dataset.estado = "3d";
    if (sinMovimiento) {
      piezas.forEach((pz) => { pz.x.v = pz.x0; pz.retraso = 0; });
      tiempo = 10;
    }
    render.setAnimationLoop((ahora) => {
      const dt = Math.min((ahora - antes) / 1000, 0.05);
      antes = ahora;
      if (!enPantalla) return;
      // varios pasos pequeños: los muelles quedan suaves aunque baje la velocidad de fotogramas
      const pasos = Math.ceil(dt / (1 / 120));
      for (let s = 0; s < pasos; s++) actualizar(dt / pasos);
      render.render(escena, camara);
    });
  });

  return { elegir };
};
