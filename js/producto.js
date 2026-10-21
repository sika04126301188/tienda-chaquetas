/* ==========================================================
   Chaket · ficha del producto (producto.html?p=id&c=color)
   1. Rellena la ficha con el producto pedido
   2. Visor 3D que gira solo en 360°, barra de giro y frente/espalda
   3. Colores y tallas con existencias al momento
   4. Añadir a la cesta o comprar ya
   ========================================================== */
(() => {
  const T = window.CHAKET;
  const parametros = new URLSearchParams(location.search);
  const producto = T.productos[parametros.get("p")] || T.productos["plumon-ligero"];
  let color = producto.colores.includes(parametros.get("c")) ? parametros.get("c") : producto.color;
  const nombreColor = (c) => T.colores[c].nombre;

  const [ficha, existencias, relacionadas] = document.querySelectorAll("main > section");
  const visor = ficha.querySelector(":scope > section");
  const figura = visor.querySelector("figure");
  const foto = figura.querySelector("img");
  const lienzo = figura.querySelector("canvas");
  const giro = visor.querySelector("input[type=range]");
  const grados = visor.querySelector("footer output");
  const [botonFrente, botonEspalda, botonSola] = visor.querySelectorAll("menu button");
  const formulario = ficha.querySelector("form");
  const [campoColor, campoTalla, campoCantidad] = formulario.querySelectorAll(":scope > fieldset");
  const estadoTalla = formulario.querySelector(":scope > p[role=status]");
  const cantidad = campoCantidad.querySelector("input");
  const [menos, mas] = campoCantidad.querySelectorAll("button");
  const [botonAnadir, botonComprar] = formulario.querySelectorAll(":scope > p button");
  const aviso = formulario.querySelector(":scope > output");

  function crear(etiqueta, texto) {
    const el = document.createElement(etiqueta);
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  /* ---------- 1. La ficha ---------- */
  document.title = `${producto.completo} — Chaket`;
  ficha.querySelector("nav li:last-of-type").textContent = producto.completo;
  const cabeza = formulario.querySelector("header");
  cabeza.querySelector("p:first-of-type").textContent = `${producto.marca} · ${producto.uso}`;
  cabeza.querySelector("h1").textContent = producto.nombre;
  const precio = cabeza.querySelector("p:nth-of-type(2)");
  const dato = crear("data", T.dinero(producto.precio));
  dato.value = producto.precio;
  precio.replaceChildren(dato);
  if (producto.antes) precio.append(crear("del", T.dinero(producto.antes)), crear("small", `-${Math.round((1 - producto.precio / producto.antes) * 100)} %`));
  formulario.querySelector(":scope > p:first-of-type").textContent = producto.descripcion;
  formulario.querySelector("details:first-of-type p").textContent =
    `Exterior de nailon reciclado con acabado repelente al agua. Relleno: ${producto.relleno.toLowerCase()}. Lavado a 30 °C con el cierre subido.`;

  // Colores disponibles de este modelo
  const leyendaColor = campoColor.querySelector("legend");
  campoColor.replaceChildren(leyendaColor, ...producto.colores.map((c) => {
    const label = crear("label");
    const radio = crear("input");
    Object.assign(radio, { type: "radio", name: "color", value: c, checked: c === color });
    label.append(radio, crear("span", nombreColor(c)));
    return label;
  }));
  const radiosColor = [...campoColor.querySelectorAll("input")];
  const radiosTalla = [...campoTalla.querySelectorAll("input")];

  // Ficha técnica y tabla de existencias
  const dd = existencias.querySelectorAll("dl dd");
  dd[0].textContent = producto.relleno;
  dd[1].textContent = producto.peso;
  dd[2].textContent = producto.uso;
  const tallas = T.catalogo.tallas;
  existencias.querySelector("tbody").replaceChildren(...producto.colores.map((c) => {
    const tr = crear("tr");
    tr.dataset.color = c;
    const th = crear("th", nombreColor(c));
    th.scope = "row";
    tr.append(th, ...tallas.map((t) => {
      const n = producto.stock[c][t];
      const td = crear("td", n ? n : "—");
      if (!n) td.dataset.nivel = "agotada";
      else if (n <= 3) td.dataset.nivel = "pocas";
      td.setAttribute("aria-label", n ? `${n} ${n === 1 ? "unidad" : "unidades"}` : "Agotada");
      return td;
    }));
    return tr;
  }));

  // Otras tres chaquetas
  const otras = T.catalogo.productos.filter((p) => p.id !== producto.id).slice(0, 3);
  relacionadas.querySelectorAll(":scope > ul > li").forEach((li, i) => {
    const p = otras[i];
    if (!p) { li.remove(); return; }
    const [frente, espalda] = li.querySelectorAll("img");
    frente.src = `img/chaquetas/${p.color}.webp`;
    frente.alt = `${p.completo} en ${nombreColor(p.color).toLowerCase()}, de frente`;
    espalda.src = `img/chaquetas/${p.color}-espalda.webp`;
    const figcaption = li.querySelector("figcaption");
    if (p.etiqueta) {
      if (figcaption) figcaption.textContent = p.etiqueta;
      else li.querySelector("figure").append(crear("figcaption", p.etiqueta));
    } else if (figcaption) figcaption.remove();
    li.querySelector("article > p:first-of-type").textContent = `${p.marca} · ${p.uso}`;
    const h3 = li.querySelector("h3");
    h3.id = `t-${p.id}`;
    li.querySelector("article").setAttribute("aria-labelledby", h3.id);
    const a = h3.querySelector("a");
    a.textContent = p.nombre;
    a.href = `producto.html?p=${p.id}`;
    const caja = li.querySelector("article > p:nth-of-type(2)");
    const d = crear("data", T.dinero(p.precio));
    d.value = p.precio;
    caja.replaceChildren(d);
    if (p.antes) caja.append(crear("del", T.dinero(p.antes)));
    const ul = li.querySelector("article ul");
    ul.setAttribute("aria-label", `${p.colores.length} colores`);
    ul.replaceChildren(...p.colores.map((c) => { const x = crear("li", nombreColor(c)); x.dataset.color = c; return x; }));
  });

  /* ---------- 2. Visor 360° ---------- */
  let usandoBarra = false;
  function cara(c) {
    botonFrente.setAttribute("aria-pressed", String(c === "frente"));
    botonEspalda.setAttribute("aria-pressed", String(c === "espalda"));
  }
  const visor3D = window.ChaketVisor && window.ChaketVisor(figura, {
    modo: "360",
    alGirar(g) {
      if (usandoBarra) return;
      const redondo = Math.round(g) % 360;
      if (Number(giro.value) !== redondo) {
        giro.value = redondo;
        grados.textContent = `${redondo}°`;
      }
    },
    alSoltar: cara,
  });
  if (!visor3D) {
    // sin 3D: la barra cambia entre la foto de frente y la de espalda
    botonSola.closest("li").hidden = true;
  }
  giro.setAttribute("aria-label", "Girar la chaqueta");
  giro.addEventListener("pointerdown", () => { usandoBarra = true; });
  giro.addEventListener("input", () => {
    usandoBarra = true;
    const g = Number(giro.value);
    grados.textContent = `${g}°`;
    if (visor3D) visor3D.girarA(g);
    else foto.src = `img/chaquetas/${color}${g > 90 && g < 270 ? "-espalda" : ""}.webp`;
    cara(g > 90 && g < 270 ? "espalda" : "frente");
  });
  ["change", "pointerup", "blur"].forEach((tipo) => giro.addEventListener(tipo, () => { usandoBarra = false; }));

  function vista(c) {
    cara(c);
    const g = c === "frente" ? 0 : 180;
    giro.value = g;
    grados.textContent = `${g}°`;
    if (visor3D) visor3D.mirar(c === "frente" ? 0 : Math.PI);
    else foto.src = `img/chaquetas/${color}${c === "espalda" ? "-espalda" : ""}.webp`;
  }
  botonFrente.addEventListener("click", () => vista("frente"));
  botonEspalda.addEventListener("click", () => vista("espalda"));
  botonSola.addEventListener("click", () => {
    const sola = botonSola.getAttribute("aria-pressed") !== "true";
    botonSola.setAttribute("aria-pressed", String(sola));
    if (visor3D) visor3D.pausar(!sola);
  });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    botonSola.setAttribute("aria-pressed", "false");
    if (visor3D) visor3D.pausar(true);
  }

  /* ---------- 3. Color y talla con existencias ---------- */
  function ponerColor(c, desdeUrl) {
    color = c;
    const nombre = nombreColor(c);
    foto.src = `img/chaquetas/${c}.webp`;
    foto.alt = `${producto.completo} en ${nombre.toLowerCase()}, vista de frente`;
    lienzo.setAttribute("aria-label", `${producto.completo} en ${nombre.toLowerCase()}, en 3D: arrastra para girarla`);
    figura.querySelector("figcaption strong").textContent = nombre;
    leyendaColor.querySelector("output").textContent = nombre;
    existencias.querySelectorAll("tbody tr").forEach((tr) => {
      if (tr.dataset.color === c) tr.setAttribute("aria-current", "true");
      else tr.removeAttribute("aria-current");
    });
    radiosTalla.forEach((r) => {
      const n = producto.stock[c][r.value];
      r.disabled = !n;
      r.closest("label").toggleAttribute("data-pocas", n > 0 && n <= 3);
      r.closest("label").title = !n ? "Agotada en este color" : n <= 3 ? `Solo ${n === 1 ? "queda 1" : `quedan ${n}`}` : "";
      if (!n && r.checked) {
        r.checked = false;
        decir(`La talla ${r.value} está agotada en ${nombre.toLowerCase()}. Elige otra.`);
      }
    });
    tallaElegida();
    if (!desdeUrl) {
      try { history.replaceState(null, "", `?p=${producto.id}&c=${c}`); } catch (error) { /* archivo local */ }
    }
    if (visor3D) visor3D.cargar(c);
    giro.value = 0;
    grados.textContent = "0°";
    cara("frente");
  }
  radiosColor.forEach((r) => r.addEventListener("change", () => ponerColor(r.value)));

  const unidadesPedidas = () => Math.max(1, Math.min(9, Number(cantidad.value) || 1));
  function tallaElegida() {
    const r = radiosTalla.find((x) => x.checked);
    campoTalla.querySelector("legend output").textContent = r ? r.value : "Elige una";
    if (!r) {
      estadoTalla.dataset.nivel = "ninguna";
      const libres = radiosTalla.filter((x) => !x.disabled).length;
      estadoTalla.textContent = libres ? `Elige tu talla: hay ${libres} de ${radiosTalla.length} disponibles en ${nombreColor(color).toLowerCase()}` : "Agotada en este color";
      return;
    }
    campoTalla.removeAttribute("aria-invalid");
    const n = producto.stock[color][r.value];
    estadoTalla.dataset.nivel = n <= 3 ? "pocas" : "hay";
    estadoTalla.textContent = n <= 3
      ? `¡Últimas ${n === 1 ? "unidad" : `${n} unidades`} en talla ${r.value}!`
      : `En stock: quedan ${n} en talla ${r.value} · sale hoy si pides antes de las 18:00`;
    if (unidadesPedidas() > n) { cantidad.value = n; actualizarPrecio(); }
  }
  radiosTalla.forEach((r) => r.addEventListener("change", () => { tallaElegida(); decir(""); }));

  /* ---------- 4. Cantidad, cesta y comprar ya ---------- */
  const maximo = () => {
    const r = radiosTalla.find((x) => x.checked);
    return r ? Math.min(9, producto.stock[color][r.value]) : 9;
  };
  const actualizarPrecio = () => { botonAnadir.querySelector("output").textContent = T.dinero(producto.precio * unidadesPedidas()); };
  cantidad.addEventListener("input", actualizarPrecio);
  cantidad.addEventListener("blur", () => { cantidad.value = Math.min(unidadesPedidas(), maximo()); actualizarPrecio(); });
  menos.addEventListener("click", () => { cantidad.value = Math.max(1, unidadesPedidas() - 1); actualizarPrecio(); });
  mas.addEventListener("click", () => {
    if (unidadesPedidas() >= maximo()) { decir(`No quedan más unidades en esta talla.`); return; }
    cantidad.value = unidadesPedidas() + 1;
    actualizarPrecio();
  });

  function decir(texto, tipo) {
    aviso.textContent = texto;
    if (tipo) aviso.dataset.tipo = tipo;
    else delete aviso.dataset.tipo;
  }

  function linea() {
    const talla = radiosTalla.find((r) => r.checked);
    if (!talla) {
      campoTalla.setAttribute("aria-invalid", "true");
      decir("Elige tu talla para continuar.");
      radiosTalla.find((r) => !r.disabled).focus();
      return null;
    }
    return { id: producto.id, color, talla: talla.value, cantidad: Math.min(unidadesPedidas(), maximo()) };
  }

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    const l = linea();
    if (!l) return;
    T.anadir(l);
    decir(`¡Hecho! ${l.cantidad > 1 ? `${l.cantidad} chaquetas añadidas` : "Chaqueta añadida"} a la cesta.`, "ok");
  });
  botonComprar.addEventListener("click", () => {
    const l = linea();
    if (!l) return;
    T.anadir(l, true);
    location.href = "pago.html";
  });

  ponerColor(color, true);
  actualizarPrecio();
})();
