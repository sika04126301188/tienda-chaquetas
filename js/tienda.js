/* ==========================================================
   Chaket · tienda (compartido por las tres páginas)
   - Cabecera y menú del móvil
   - Cesta guardada en el navegador (localStorage): se conserva entre páginas y al volver
   - Panel lateral de la cesta: cambiar cantidades, quitar, envío gratis y total
   - Aviso al añadir un producto
   - Totales del pedido (descuento, envío, IVA) para la página de pago
   ========================================================== */
window.CHAKET = (() => {
  const catalogo = window.CHAKET_CATALOGO;
  const productos = Object.fromEntries(catalogo.productos.map((p) => [p.id, p]));
  const colores = Object.fromEntries(catalogo.colores.map((c) => [c.id, c]));
  const ENVIO_GRATIS = 100;
  const ENVIOS = { estandar: 4.95, express: 9.95, tienda: 0 };
  const CODIGOS = { CHAKET10: 0.1 };
  const CLAVE = "chaket-cesta";
  const CLAVE_CODIGO = "chaket-codigo";
  const formato = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  const dinero = (n) => formato.format(n).replace(",00", "");

  /* ---------- 1. Guardado (con respaldo en memoria si el navegador no deja guardar) ---------- */
  const memoria = { [CLAVE]: "[]", [CLAVE_CODIGO]: "" };
  function leerClave(k) {
    try { const v = localStorage.getItem(k); return v === null ? memoria[k] : v; } catch (error) { return memoria[k]; }
  }
  function guardarClave(k, v) {
    memoria[k] = v;
    try { localStorage.setItem(k, v); } catch (error) { /* sin almacenamiento: queda en memoria */ }
  }
  function leer() {
    let lineas;
    try { lineas = JSON.parse(leerClave(CLAVE)) || []; } catch (error) { lineas = []; }
    return lineas.filter((l) => productos[l.id] && colores[l.color] && l.cantidad > 0);
  }
  function guardar(lineas) {
    guardarClave(CLAVE, JSON.stringify(lineas));
    pintar();
    document.dispatchEvent(new CustomEvent("cesta:cambio"));
  }
  const clave = (l) => [l.id, l.color, l.talla, l.edicion || ""].join("|");

  /* ---------- 2. La cesta ---------- */
  const precioUnidad = (l) => productos[l.id].precio + (l.extra || 0);
  const precioLinea = (l) => precioUnidad(l) * l.cantidad;
  function anadir(linea, sinAviso) {
    const lineas = leer();
    const igual = lineas.find((l) => clave(l) === clave(linea));
    if (igual) igual.cantidad = Math.min(igual.cantidad + linea.cantidad, 9);
    else lineas.push({ ...linea, cantidad: Math.min(linea.cantidad, 9) });
    guardar(lineas);
    if (!sinAviso) avisar(linea);
  }
  function cambiar(k, cambio) {
    guardar(leer().map((l) => (clave(l) === k ? { ...l, cantidad: Math.min(l.cantidad + cambio, 9) } : l)).filter((l) => l.cantidad > 0));
  }
  const quitar = (k) => guardar(leer().filter((l) => clave(l) !== k));
  const vaciar = () => guardar([]);
  const unidades = () => leer().reduce((s, l) => s + l.cantidad, 0);
  const subtotal = () => leer().reduce((s, l) => s + precioLinea(l), 0);
  const nombreLinea = (l) => productos[l.id].completo + (l.edicion ? ` · ${l.edicion}` : "");

  /* Código de descuento */
  const codigo = () => (CODIGOS[leerClave(CLAVE_CODIGO)] ? leerClave(CLAVE_CODIGO) : "");
  function aplicarCodigo(texto) {
    const c = String(texto).trim().toUpperCase();
    if (!CODIGOS[c]) return false;
    guardarClave(CLAVE_CODIGO, c);
    document.dispatchEvent(new CustomEvent("cesta:cambio"));
    return true;
  }
  function quitarCodigo() {
    guardarClave(CLAVE_CODIGO, "");
    document.dispatchEvent(new CustomEvent("cesta:cambio"));
  }

  /* Totales: subtotal, descuento, envío, base, IVA (21 %, incluido) y total */
  function totales({ envio = "estandar" } = {}) {
    const lineas = leer();
    const sub = lineas.reduce((s, l) => s + precioLinea(l), 0);
    const c = codigo();
    const descuento = c ? Math.round(sub * CODIGOS[c] * 100) / 100 : 0;
    const neto = sub - descuento;
    const gratis = neto >= ENVIO_GRATIS;
    const costeEnvio = !lineas.length ? 0 : envio === "estandar" ? (gratis ? 0 : ENVIOS.estandar) : ENVIOS[envio] || 0;
    const total = Math.round((neto + costeEnvio) * 100) / 100;
    const base = Math.round((total / 1.21) * 100) / 100;
    return {
      lineas, unidades: lineas.reduce((s, l) => s + l.cantidad, 0), subtotal: sub, codigo: c, descuento,
      tipoEnvio: envio, envio: costeEnvio, gratis, falta: Math.max(0, ENVIO_GRATIS - neto), base, iva: Math.round((total - base) * 100) / 100, total,
    };
  }

  /* ---------- 3. Cabecera y menú ---------- */
  const cabecera = document.querySelector("body > header");
  const botonCesta = cabecera.querySelector(':scope > button[aria-haspopup="dialog"]');
  const botonMenu = cabecera.querySelector(":scope > button[aria-controls]");
  const menu = cabecera.querySelector("nav");
  const estado = () => cabecera.toggleAttribute("data-scroll", scrollY > 20);
  addEventListener("scroll", estado, { passive: true });
  estado();
  function menuAbierto(abrir) {
    cabecera.toggleAttribute("data-menu", abrir);
    botonMenu.setAttribute("aria-expanded", String(abrir));
    botonMenu.setAttribute("aria-label", abrir ? "Cerrar el menú" : "Abrir el menú");
  }
  if (botonMenu && menu) {
    botonMenu.addEventListener("click", () => menuAbierto(!cabecera.hasAttribute("data-menu")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) menuAbierto(false); });
    document.addEventListener("click", (e) => { if (cabecera.hasAttribute("data-menu") && !cabecera.contains(e.target)) menuAbierto(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && cabecera.hasAttribute("data-menu")) { menuAbierto(false); botonMenu.focus(); } });
  }

  /* ---------- 4. Panel de la cesta ---------- */
  const panel = document.querySelector("body > dialog");
  const lista = panel && panel.querySelector("ul");
  const barraEnvio = panel && panel.querySelector("progress");
  const textoEnvio = panel && panel.querySelector(":scope > p");
  const ddSubtotal = panel && panel.querySelector("dl dd:first-of-type");
  const ddEnvio = panel && panel.querySelector("dl dd:last-of-type");
  const irAPagar = panel && panel.querySelector("footer a");

  function elemento(etiqueta, texto) {
    const el = document.createElement(etiqueta);
    if (texto !== undefined) el.textContent = texto;
    return el;
  }
  function boton(texto, etiquetaAria, accion) {
    const b = elemento("button", texto);
    b.type = "button";
    b.setAttribute("aria-label", etiquetaAria);
    b.addEventListener("click", accion);
    return b;
  }

  function pintar() {
    const n = unidades();
    if (botonCesta) {
      botonCesta.querySelector("b").textContent = n;
      botonCesta.setAttribute("aria-label", `Cesta: ${n} ${n === 1 ? "producto" : "productos"}`);
    }
    if (!panel) return;
    const t = totales();
    barraEnvio.value = Math.min(t.subtotal - t.descuento, ENVIO_GRATIS);
    textoEnvio.textContent = !t.lineas.length ? `Envío gratis a partir de ${dinero(ENVIO_GRATIS)}`
      : t.falta > 0 ? `Te faltan ${dinero(t.falta)} para el envío gratis` : "¡Tienes el envío gratis!";
    ddSubtotal.textContent = dinero(t.subtotal);
    ddEnvio.textContent = !t.lineas.length ? "—" : t.falta > 0 ? `Desde ${dinero(ENVIOS.estandar)}` : "Gratis";
    panel.toggleAttribute("data-vacia", !t.lineas.length);
    irAPagar.toggleAttribute("aria-disabled", !t.lineas.length);
    lista.replaceChildren(...(t.lineas.length ? t.lineas.map((l) => {
      const p = productos[l.id], k = clave(l);
      const li = elemento("li");
      const figura = elemento("figure");
      const img = elemento("img");
      img.src = `img/chaquetas/${l.color}.webp`;
      img.alt = "";
      figura.append(img);
      const texto = elemento("p");
      const enlace = elemento("a", nombreLinea(l));
      enlace.href = `producto.html?p=${p.id}&c=${l.color}`;
      texto.append(enlace, elemento("small", `${colores[l.color].nombre} · Talla ${l.talla}`));
      const cantidad = elemento("p");
      cantidad.setAttribute("aria-label", `Cantidad de ${p.completo}`);
      cantidad.append(
        boton("−", `Una menos de ${p.completo}`, () => cambiar(k, -1)),
        elemento("output", l.cantidad),
        boton("+", `Una más de ${p.completo}`, () => cambiar(k, 1)),
      );
      const importe = elemento("b", dinero(precioLinea(l)));
      const fuera = boton("Quitar", `Quitar ${p.completo} de la cesta`, () => quitar(k));
      li.append(figura, texto, cantidad, importe, fuera);
      return li;
    }) : [elemento("li", "Tu cesta está vacía. Pasa por el armario y elige tu chaqueta.")]));
  }

  function abrir() {
    if (!panel) { location.href = "pago.html"; return; }
    pintar();
    panel.showModal();
  }
  if (panel) {
    if (botonCesta) botonCesta.addEventListener("click", abrir);
    panel.querySelector("header button").addEventListener("click", () => panel.close());
    panel.querySelector("footer button").addEventListener("click", () => panel.close());
    panel.addEventListener("click", (e) => { if (e.target === panel) panel.close(); });
    irAPagar.addEventListener("click", (e) => { if (!leer().length) e.preventDefault(); });
  }
  // Otra pestaña cambió la cesta
  addEventListener("storage", (e) => {
    if (e.key === CLAVE || e.key === CLAVE_CODIGO) { pintar(); document.dispatchEvent(new CustomEvent("cesta:cambio")); }
  });

  /* ---------- 5. Aviso al añadir ---------- */
  const aviso = document.querySelector("body > aside");
  let temporizador = 0;
  function avisar(linea) {
    if (!aviso) return;
    aviso.querySelector("img").src = `img/chaquetas/${linea.color}.webp`;
    aviso.querySelector("strong").textContent = "Añadida a la cesta";
    aviso.querySelector("small").textContent = `${nombreLinea(linea)} · ${colores[linea.color].nombre} · ${linea.talla}`;
    aviso.dataset.visible = "";
    if (botonCesta) {
      botonCesta.removeAttribute("data-salto");
      void botonCesta.offsetWidth;
      botonCesta.setAttribute("data-salto", "");
    }
    clearTimeout(temporizador);
    temporizador = setTimeout(() => delete aviso.dataset.visible, 4200);
  }
  if (aviso) aviso.querySelector("button").addEventListener("click", () => { delete aviso.dataset.visible; abrir(); });

  /* ---------- 6. Club ---------- */
  const club = document.querySelector("body > footer form");
  if (club) club.addEventListener("submit", (e) => {
    e.preventDefault();
    const correo = club.querySelector("input");
    const salida = club.parentElement.querySelector("output");
    if (!correo.checkValidity()) { salida.textContent = "Escribe un correo válido."; correo.focus(); return; }
    salida.textContent = "¡Ya eres del Club! Usa el código CHAKET10 para tu 10 % de descuento.";
    club.reset();
  });

  pintar();
  return {
    productos, colores, catalogo, leer, anadir, cambiar, quitar, vaciar, unidades, subtotal, precioUnidad, precioLinea, nombreLinea,
    dinero, abrir, clave, codigo, aplicarCodigo, quitarCodigo, totales, ENVIO_GRATIS, ENVIOS,
  };
})();
