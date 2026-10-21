/* ==========================================================
   Chaket · portada
   1. El armario del hero (js/armario.js)
   2. Cuenta atrás de la oferta de la semana
   3. Configurador: visor 3D, color, talla, edición, cantidad y cesta
   La cabecera, la cesta y el Club los lleva js/tienda.js
   ========================================================== */
(() => {
  const T = window.CHAKET;

  /* ---------- 1. Armario ---------- */
  const hero = document.querySelector("main > section:first-of-type");
  const figuraArmario = hero.querySelector(":scope > figure:last-of-type");
  window.ChaketArmario && window.ChaketArmario(figuraArmario, T.catalogo.productos.map((p) => ({
    nombre: p.nombre, marca: p.marca, precio: p.precio, precioTexto: T.dinero(p.precio), color: p.color, url: `producto.html?p=${p.id}`,
  })));

  /* ---------- 2. Cuenta atrás de la oferta: termina el domingo a las 23:59 ---------- */
  const reloj = document.querySelector("#oferta time");
  if (reloj) {
    const fin = new Date();
    fin.setDate(fin.getDate() + ((7 - fin.getDay()) % 7));
    fin.setHours(23, 59, 59, 0);
    const dos = (n) => String(n).padStart(2, "0");
    const contar = () => {
      const minutos = Math.max(0, Math.floor((fin - new Date()) / 60000));
      const d = Math.floor(minutos / 1440), h = Math.floor((minutos % 1440) / 60), m = minutos % 60;
      reloj.dateTime = `P${d}DT${h}H${m}M`;
      reloj.textContent = `${d} d ${dos(h)} h ${dos(m)} min`;
    };
    contar();
    setInterval(contar, 30000);
  }

  /* ---------- 3. Configurador ---------- */
  const ID = "plumon-ligero";
  const producto = T.productos[ID];
  const EDICIONES = { original: { extra: 0, nombre: "" }, ciudad: { extra: 15, nombre: "Edición ciudad" }, montana: { extra: 30, nombre: "Edición montaña" } };
  const COLORES = T.catalogo.colores;

  const seccion = document.querySelector("main > section:nth-of-type(3)");
  const visor = seccion.querySelector(":scope > section");
  const figura = visor.querySelector("figure");
  const foto = figura.querySelector("img");
  const lienzo = figura.querySelector("canvas");
  const nombreVisor = figura.querySelector("figcaption strong");
  const contador = figura.querySelector("figcaption output");
  const [vecinoAnterior, vecinoSiguiente] = [...visor.querySelectorAll(":scope > figure")].slice(1).map((f) => f.querySelector("img"));
  const [flechaAnterior, flechaSiguiente] = visor.querySelectorAll("menu:first-of-type button");
  const [botonFrente, botonEspalda] = visor.querySelectorAll("menu:last-of-type button");
  const formulario = seccion.querySelector("form");
  const radiosColor = [...formulario.querySelectorAll("input[name=color]")];
  const radiosTalla = [...formulario.querySelectorAll("input[name=talla]")];
  const campoTalla = radiosTalla[0].closest("fieldset");
  const cantidad = formulario.querySelector("input[name=cantidad]");
  const [menos, mas] = formulario.querySelectorAll("fieldset:nth-of-type(4) button");
  const totalBoton = formulario.querySelector(":scope > button output");
  const aviso = formulario.querySelector(":scope > output");
  let actual = 0;

  function caraVisible(cara) {
    botonFrente.setAttribute("aria-pressed", String(cara === "frente"));
    botonEspalda.setAttribute("aria-pressed", String(cara === "espalda"));
  }
  const visor3D = window.ChaketVisor && window.ChaketVisor(figura, { alSoltar: caraVisible });

  function mostrar(indice, origen) {
    actual = (indice + COLORES.length) % COLORES.length;
    const c = COLORES[actual];
    const anterior = COLORES[(actual + COLORES.length - 1) % COLORES.length];
    const siguiente = COLORES[(actual + 1) % COLORES.length];
    foto.src = `img/chaquetas/${c.id}.webp`;
    foto.alt = `Chaqueta Chaket Plumón ligero en ${c.nombre.toLowerCase()}, vista de frente`;
    lienzo.setAttribute("aria-label", `Chaqueta ${c.nombre.toLowerCase()} en 3D: arrastra para girarla`);
    vecinoAnterior.src = `img/chaquetas/${anterior.id}.webp`;
    vecinoSiguiente.src = `img/chaquetas/${siguiente.id}.webp`;
    nombreVisor.textContent = c.nombre;
    contador.textContent = `0${actual + 1} / 0${COLORES.length}`;
    if (origen !== "radio") radiosColor[actual].checked = true;
    formulario.querySelector("fieldset:first-of-type legend output").textContent = c.nombre;
    flechaAnterior.setAttribute("aria-label", `Diseño anterior: ${anterior.nombre}`);
    flechaSiguiente.setAttribute("aria-label", `Diseño siguiente: ${siguiente.nombre}`);
    // Tallas agotadas de este color (según las existencias del catálogo)
    const existencias = producto.stock[c.id];
    radiosTalla.forEach((r) => {
      const agotada = !existencias[r.value];
      r.disabled = agotada;
      r.closest("label").title = agotada ? "Agotada en este color" : "";
      if (agotada && r.checked) {
        r.checked = false;
        decir(`La talla ${r.value} está agotada en ${c.nombre.toLowerCase()}. Elige otra.`);
        tallaElegida();
      }
    });
    caraVisible("frente");
    if (visor3D) visor3D.cargar(c.id);
  }

  function vista(cara) {
    caraVisible(cara);
    if (visor3D) visor3D.mirar(cara === "frente" ? 0 : Math.PI);
    else foto.src = `img/chaquetas/${COLORES[actual].id}${cara === "espalda" ? "-espalda" : ""}.webp`;
  }

  flechaAnterior.addEventListener("click", () => mostrar(actual - 1));
  flechaSiguiente.addEventListener("click", () => mostrar(actual + 1));
  botonFrente.addEventListener("click", () => vista("frente"));
  botonEspalda.addEventListener("click", () => vista("espalda"));
  radiosColor.forEach((r, i) => r.addEventListener("change", () => mostrar(i, "radio")));

  /* Talla, edición, cantidad y precio */
  function tallaElegida() {
    const r = radiosTalla.find((x) => x.checked);
    formulario.querySelector("fieldset:nth-of-type(2) legend output").textContent = r ? r.value : "Elige una";
    if (r) campoTalla.removeAttribute("aria-invalid");
  }
  radiosTalla.forEach((r) => r.addEventListener("change", () => { tallaElegida(); decir(""); }));

  const edicion = () => EDICIONES[formulario.querySelector("input[name=edicion]:checked").value];
  const unidades = () => Math.max(1, Math.min(9, Number(cantidad.value) || 1));
  const actualizarPrecio = () => { totalBoton.textContent = T.dinero((producto.precio + edicion().extra) * unidades()); };
  formulario.addEventListener("change", actualizarPrecio);
  cantidad.addEventListener("input", actualizarPrecio);
  cantidad.addEventListener("blur", () => { cantidad.value = unidades(); actualizarPrecio(); });
  menos.addEventListener("click", () => { cantidad.value = Math.max(1, unidades() - 1); actualizarPrecio(); });
  mas.addEventListener("click", () => { cantidad.value = Math.min(9, unidades() + 1); actualizarPrecio(); });

  function decir(texto, tipo) {
    aviso.textContent = texto;
    if (tipo) aviso.dataset.tipo = tipo;
    else delete aviso.dataset.tipo;
  }

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const talla = radiosTalla.find((r) => r.checked);
    if (!talla) {
      campoTalla.setAttribute("aria-invalid", "true");
      decir("Elige tu talla para añadirla a la cesta.");
      radiosTalla.find((r) => !r.disabled).focus();
      return;
    }
    const ed = edicion();
    T.anadir({ id: ID, color: COLORES[actual].id, talla: talla.value, cantidad: unidades(), edicion: ed.nombre, extra: ed.extra });
    decir(`¡Hecho! ${unidades() > 1 ? `${unidades()} chaquetas añadidas` : "Chaqueta añadida"} a la cesta.`, "ok");
  });

  mostrar(0);
  actualizarPrecio();
})();
