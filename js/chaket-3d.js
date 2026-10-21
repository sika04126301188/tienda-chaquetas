/* ==========================================================
   Chaket · la chaqueta de plumón ligero en 3D (compartido por todas las páginas)
   - El modelo es un GLB comprimido que va dentro de js/modelo.js (completo) y js/modelo-ligero.js
     (ligero, para el armario y el resumen del pago): así funciona abriendo el archivo sin servidor.
   - Una sola malla para los cinco colores: cada copia lleva sus propios materiales y se pinta
     con el color del catálogo (tela, ribetes, forro, cinta y espiral de la cremallera).
   ========================================================== */
window.Chaket3D = (() => {
  const colores = window.CHAKET_CATALOGO.colores;
  // cuánto del color lleva cada pieza (la textura de la tela es un gris de 0,8)
  const FACTOR = { tela: 1 / 0.8, ribete: 1, forro: 0.62, cinta: 0.42, espiral: 0.5, colgador: 0.5 };
  const ESCALA = 1.3;          // la chaqueta mide 0,77 m: en escena ocupa 1 de alto
  const CENTRO_Y = 0.385;      // mitad de su alto
  const nombreMat = (m) => m.name.split('.')[0];

  function renderer(lienzo) {
    let r;
    try {
      r = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (error) {
      return null;
    }
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.12;
    return r;
  }

  function estudio(render) {
    const pmrem = new THREE.PMREMGenerator(render);
    return pmrem.fromScene(new RoomEnvironment(render), 0.04).texture;
  }

  function luces(escena, fuerza = 1) {
    escena.add(new THREE.HemisphereLight(0xffffff, 0xd9d6d0, 0.35 * fuerza));
    const clave = new THREE.DirectionalLight(0xffffff, 1.6 * fuerza);
    clave.position.set(-1.6, 2.4, 2.4);
    const contra = new THREE.DirectionalLight(0xfff4ec, 1.1 * fuerza);
    contra.position.set(1.4, 1.8, -2.2);
    escena.add(clave, contra);
    return { clave, contra };
  }

  /* ---------- carga del GLB (una vez por página y por versión) ---------- */
  const modelos = {};
  function binario(b64) {
    const s = atob(b64);
    const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u.buffer;
  }
  function cargar(cual = 'completo') {
    if (!modelos[cual]) {
      modelos[cual] = new Promise((ok, mal) => {
        const datos = cual === 'ligero' ? (window.CHAKET_MODELO_LIGERO || window.CHAKET_MODELO) : (window.CHAKET_MODELO || window.CHAKET_MODELO_LIGERO);
        if (!datos || !window.GLTFLoader || !window.MeshoptDecoder) { mal(new Error('Sin modelo 3D')); return; }
        const cargador = new GLTFLoader();
        cargador.setMeshoptDecoder(MeshoptDecoder);
        MeshoptDecoder.ready.then(() => cargador.parse(binario(datos), '', (g) => ok(g.scene), mal));
      });
    }
    return modelos[cual];
  }

  /* ---------- una chaqueta lista para la escena: centrada, a escala y pintada ---------- */
  async function chaqueta(colorId, cual = 'completo') {
    const base = await cargar(cual);
    const copia = base.clone(true);
    copia.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      const n = nombreMat(o.material);
      o.material.envMapIntensity = n === 'metal' ? 1.4 : 0.55;
    });
    copia.position.y = -CENTRO_Y;
    const pieza = new THREE.Group();
    pieza.add(copia);
    pieza.scale.setScalar(ESCALA);
    pintar(pieza, colorId);
    return pieza;
  }

  /* ---------- color: al momento o fundido en «segundos» ---------- */
  const fundidos = new Set();
  function pintar(pieza, colorId, segundos = 0) {
    const c = colores.find((x) => x.id === colorId) || colores[0];
    const base = new THREE.Color(c.muestra);         // sRGB -> lineal
    pieza.traverse((o) => {
      if (!o.isMesh) return;
      const f = FACTOR[nombreMat(o.material)];
      if (!f) return;
      const destino = base.clone().multiplyScalar(f);
      if (segundos > 0) {
        o.userData.fundido = { desde: o.material.color.clone(), hasta: destino, t: 0, dur: segundos };
        fundidos.add(o);
      } else {
        o.material.color.copy(destino);
      }
    });
  }
  function avanzar(dt) {
    for (const o of fundidos) {
      const f = o.userData.fundido;
      f.t = Math.min(1, f.t + dt / f.dur);
      const s = f.t * f.t * (3 - 2 * f.t);
      o.material.color.copy(f.desde).lerp(f.hasta, s);
      if (f.t >= 1) fundidos.delete(o);
    }
  }

  function sombra(ancho = 1.3, fondo = 0.55, fuerza = 0.28) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, `rgba(17, 17, 20, ${fuerza})`);
    g.addColorStop(0.5, `rgba(17, 17, 20, ${fuerza * 0.32})`);
    g.addColorStop(1, 'rgba(17, 17, 20, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, fondo), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  return { colores, renderer, estudio, luces, cargar, chaqueta, pintar, avanzar, sombra, ESCALA, CENTRO_Y };
})();
