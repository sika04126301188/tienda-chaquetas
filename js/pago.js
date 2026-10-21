/* ==========================================================
   Chaket · página de pago
   1. Número de pedido y fechas
   2. Resumen oscuro en vivo: chaqueta en 3D, productos, código, envío gratis y totales
   3. Tres pasos en acordeón: contacto, envío y pago (cada paso se valida antes de seguir)
   4. Tarjeta en 3D: detecta la marca, comprueba el número y se gira para el CVC
   5. Pago exprés, pagar y recibo final
   IMPORTANTE: el cobro está simulado. Para cobrar de verdad hay que conectar
   el formulario con una pasarela de pago (Stripe, Redsys, PayPal…).
   ========================================================== */
(() => {
  const T = window.CHAKET;
  const [pago, confirmacion, vacia] = document.querySelectorAll("main > section");
  const resumen = document.querySelector("main > aside");
  const formulario = pago.querySelector(":scope > form");
  const pasos = [...formulario.querySelectorAll(":scope > fieldset")];
  const marcasPaso = [...pago.querySelectorAll(":scope > header li")];
  const botonPagar = formulario.querySelector("button[type=submit]");
  const alerta = formulario.querySelector("p[role=alert]");
  const bloquesMetodo = [...formulario.querySelectorAll("fieldset[data-metodo]")];
  const bloqueEmpresa = formulario.querySelector("fieldset[data-empresa]");
  const botonesExpres = [...pago.querySelectorAll(":scope > section button")];
  const CLAVE_PEDIDO = "chaket-ultimo-pedido";
  const NOMBRES_ENVIO = { estandar: "Envío estándar", express: "Envío exprés", tienda: "Recogida en tienda" };

  function crear(etiqueta, texto) {
    const el = document.createElement(etiqueta);
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  /* ---------- 1. Número de pedido y fechas ---------- */
  const hoy = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  const numero = `CHK-${String(hoy.getFullYear()).slice(2)}${dos(hoy.getMonth() + 1)}${dos(hoy.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
  const fechaLarga = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const formatoDia = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const dia = (d) => formatoDia.format(d).replace(",", "");
  function laborables(fecha, dias) {
    const d = new Date(fecha);
    while (dias > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) dias--;
    }
    return d;
  }
  formulario.querySelector('fieldset[data-metodo="transferencia"] dd:last-of-type').textContent = numero;

  const envioElegido = () => formulario.elements.envio.value;
  let confirmado = false;

  /* ---------- 2. Resumen en vivo ---------- */
  const lista = resumen.querySelector("ul");
  const formCodigo = resumen.querySelector("form");
  const mensajeCodigo = resumen.querySelector("p[role=status]");
  const textoEnvio = resumen.querySelector(":scope > p:nth-of-type(2)");
  const barraEnvio = resumen.querySelector("progress");
  const dt = resumen.querySelectorAll("dl dt");
  const dd = resumen.querySelectorAll("dl dd");
  const figura3D = resumen.querySelector("figure");
  const visor3D = window.ChaketVisor && window.ChaketVisor(figura3D, { modo: "360", modelo: "ligero" });
  let color3D = "";
  const precioEstandar = formulario.querySelector('input[value="estandar"] ~ data');

  function lineaResumen(l) {
    const p = T.productos[l.id], k = T.clave(l);
    const li = crear("li");
    const figura = crear("figure");
    figura.dataset.cantidad = l.cantidad;
    const img = crear("img");
    img.src = `img/chaquetas/${l.color}.webp`;
    img.alt = "";
    figura.append(img);
    const texto = crear("p");
    texto.append(crear("strong", T.nombreLinea(l)), crear("small", `${T.colores[l.color].nombre} · Talla ${l.talla} · ${T.dinero(T.precioUnidad(l))}`));
    const importe = crear("b", T.dinero(T.precioLinea(l)));
    const cantidad = crear("p");
    cantidad.setAttribute("aria-label", `Cantidad de ${p.completo}`);
    const boton = (texto, etiqueta, cambio) => {
      const b = crear("button", texto);
      b.type = "button";
      b.setAttribute("aria-label", etiqueta);
      b.addEventListener("click", () => T.cambiar(k, cambio));
      return b;
    };
    cantidad.append(boton("−", `Una menos de ${p.completo}`, -1), crear("output", l.cantidad), boton("+", `Una más de ${p.completo}`, 1));
    li.append(figura, texto, importe, cantidad);
    return li;
  }

  function pintar() {
    if (confirmado) return;
    const t = T.totales({ envio: envioElegido() });
    const hay = t.unidades > 0;
    pago.hidden = !hay;
    resumen.hidden = !hay;
    vacia.hidden = hay;
    confirmacion.hidden = true;
    if (!hay) { document.title = "Tu cesta está vacía — Chaket"; return; }

    resumen.querySelector("header b").textContent = t.unidades;
    resumen.querySelector("header p").lastChild.textContent = t.unidades === 1 ? " artículo" : " artículos";
    lista.replaceChildren(...t.lineas.map(lineaResumen));
    dd[0].textContent = T.dinero(t.subtotal);
    dt[1].hidden = dd[1].hidden = !t.descuento;
    dt[1].textContent = `Descuento (${t.codigo})`;
    dd[1].textContent = `−${T.dinero(t.descuento)}`;
    dt[2].textContent = NOMBRES_ENVIO[t.tipoEnvio];
    dd[2].textContent = t.envio ? T.dinero(t.envio) : "Gratis";
    dd[3].textContent = T.dinero(t.iva);
    dd[4].textContent = T.dinero(t.total);
    barraEnvio.value = Math.min(t.subtotal - t.descuento, T.ENVIO_GRATIS);
    textoEnvio.textContent = t.gratis ? "¡Tienes el envío estándar gratis!" : `Te faltan ${T.dinero(t.falta)} para el envío gratis`;
    precioEstandar.value = t.gratis ? 0 : T.ENVIOS.estandar;
    precioEstandar.textContent = t.gratis ? "Gratis" : T.dinero(T.ENVIOS.estandar);

    if (botonPagar.getAttribute("aria-busy") !== "true") botonPagar.textContent = `Pagar ${T.dinero(t.total)}`;
    const campo = formCodigo.elements.codigo;
    if (t.codigo) campo.value = t.codigo;
    campo.readOnly = Boolean(t.codigo);
    formCodigo.querySelector("button").textContent = t.codigo ? "Quitar" : "Aplicar";

    // La chaqueta en 3D es la primera del pedido
    const primera = t.lineas[0].color;
    if (primera !== color3D) {
      color3D = primera;
      figura3D.querySelector("img").src = `img/chaquetas/${primera}.webp`;
      if (visor3D) visor3D.cargar(primera);
    }
    pintarResumenes();
  }

  formCodigo.addEventListener("submit", (e) => {
    e.preventDefault();
    const campo = formCodigo.elements.codigo;
    delete mensajeCodigo.dataset.tipo;
    if (T.codigo()) {
      T.quitarCodigo();
      campo.value = "";
      mensajeCodigo.textContent = "Has quitado el código de descuento.";
    } else if (T.aplicarCodigo(campo.value)) {
      mensajeCodigo.dataset.tipo = "ok";
      mensajeCodigo.textContent = `Código ${T.codigo()} aplicado: un 10 % menos.`;
    } else {
      mensajeCodigo.textContent = campo.value.trim() ? "Ese código no es válido. Prueba con CHAKET10." : "Escribe tu código de descuento.";
    }
  });

  /* ---------- 3. Los tres pasos ---------- */
  const MENSAJES = {
    correo: "Escribe un correo válido, por ejemplo laura@correo.es",
    telefono: "Escribe un teléfono de 9 cifras",
    cp: "El código postal tiene 5 cifras",
    provincia: "Elige tu provincia",
    titular: "Escribe el nombre como aparece en la tarjeta",
    numero: "Revisa el número de la tarjeta",
    caducidad: "Escribe la caducidad como MM/AA",
    cvc: "El CVC son los 3 números de detrás (4 en Amex)",
    bizum: "Escribe el móvil de Bizum (empieza por 6 o 7)",
    nif: "El NIF o CIF tiene 9 caracteres",
    condiciones: "Acepta las condiciones para terminar la compra",
  };
  const campos = (paso) => [...paso.querySelectorAll("input, select")].filter((c) => !c.matches(":disabled") && c.type !== "radio");

  function comprobar(campo) {
    campo.setCustomValidity("");
    if (campo.name === "numero" && campo.value) {
      const d = campo.value.replace(/\D/g, "");
      const m = marca(d);
      const largo = m === "amex" ? 15 : 16;
      if (d.length < largo || !luhn(d)) campo.setCustomValidity(MENSAJES.numero);
    }
    if (campo.name === "caducidad" && /^(0[1-9]|1[0-2])\/\d{2}$/.test(campo.value)) {
      const [mm, aa] = campo.value.split("/").map(Number);
      if (new Date(2000 + aa, mm, 0, 23, 59) < hoy) campo.setCustomValidity("Esta tarjeta ha caducado");
    }
    if (campo.name === "cvc" && campo.value) {
      const largo = marca(formulario.elements.numero.value.replace(/\D/g, "")) === "amex" ? 4 : 3;
      if (campo.value.length !== largo) campo.setCustomValidity(MENSAJES.cvc);
    }
    // mensajes en español también para los errores que detecta el navegador
    if (!campo.validity.valid && !campo.validity.customError) {
      campo.setCustomValidity(campo.validity.valueMissing && !MENSAJES[campo.name] ? "Rellena este campo" :
        campo.validity.valueMissing && campo.type === "checkbox" ? MENSAJES.condiciones : MENSAJES[campo.name] || "Revisa este campo");
    }
    const bien = campo.checkValidity();
    campo.setAttribute("aria-invalid", String(!bien));
    if (bien) campo.removeAttribute("aria-invalid");
    return bien;
  }

  function validar(paso, avisar = true) {
    const malos = campos(paso).filter((c) => !comprobar(c));
    if (malos.length && avisar) malos[0].reportValidity();
    return !malos.length;
  }

  const estado = (i) => pasos[i].dataset.estado;
  function activar(i) {
    pasos.forEach((paso, j) => {
      if (j === i) paso.dataset.estado = "activo";
      else if (paso.dataset.estado === "activo") paso.dataset.estado = validar(paso, false) && j < i ? "hecho" : paso.dataset.hecho ? "hecho" : "espera";
    });
    marcasPaso.forEach((li, j) => {
      if (j === i) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
      li.toggleAttribute("data-hecho", j !== i && estado(j) === "hecho");
    });
    pintarResumenes();
    const primero = campos(pasos[i]).find((c) => !c.value) || campos(pasos[i])[0];
    pasos[i].scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    if (primero) setTimeout(() => primero.focus({ preventScroll: true }), 350);
  }

  function continuar(i) {
    if (!validar(pasos[i])) return;
    pasos[i].dataset.hecho = "si";
    pasos[i].dataset.estado = "hecho";
    const siguiente = pasos.findIndex((p, j) => j > i && p.dataset.estado !== "hecho");
    activar(siguiente === -1 ? pasos.length - 1 : siguiente);
  }

  function pintarResumenes() {
    const f = formulario.elements;
    pasos[0].querySelector(":scope > output").textContent = [f.correo.value, f.telefono.value].filter(Boolean).join(" · ");
    const t = T.totales({ envio: envioElegido() });
    pasos[1].querySelector(":scope > output").textContent =
      `${f.nombre.value} ${f.apellidos.value}, ${f.direccion.value}, ${f.cp.value} ${f.ciudad.value} · ${NOMBRES_ENVIO[envioElegido()]} (${t.envio ? T.dinero(t.envio) : "gratis"})`;
  }

  pasos.forEach((paso, i) => {
    const botones = paso.querySelectorAll(":scope > button[type=button]");
    if (botones.length === 2) {
      botones[0].addEventListener("click", () => activar(i));
      botones[1].addEventListener("click", () => continuar(i));
    }
    // Enter en un campo de texto: pasa al siguiente paso en vez de enviar
    paso.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches("input:not([type=checkbox], [type=radio])") && i < pasos.length - 1) {
        e.preventDefault();
        continuar(i);
      }
    });
  });

  formulario.addEventListener("change", (e) => {
    const campo = e.target;
    if (campo.name === "envio") pintar();
    if (campo.name === "metodo") cambiarMetodo();
    if (campo.name === "empresa") bloqueEmpresa.hidden = bloqueEmpresa.disabled = !campo.checked;
    if (campo.getAttribute("aria-invalid") === "true") comprobar(campo);
    if (campo.name === "condiciones") alerta.textContent = "";
  });
  formulario.addEventListener("focusout", (e) => {
    const campo = e.target;
    if (campo.matches("input:not([type=radio]), select") && campo.value) comprobar(campo);
  });

  function cambiarMetodo() {
    const elegido = formulario.elements.metodo.value;
    bloquesMetodo.forEach((bloque) => {
      const activo = bloque.dataset.metodo === elegido;
      bloque.hidden = !activo;
      bloque.disabled = !activo;   // un bloque desactivado no se valida ni se envía
    });
  }

  /* ---------- 4. La tarjeta en 3D ---------- */
  const tarjeta = formulario.querySelector('fieldset[data-metodo="tarjeta"] > figure');
  const [vMarca, vNumero, vTitular, vCaduca] = [...tarjeta.querySelectorAll("section:first-of-type p")].slice(1);
  const vCvc = tarjeta.querySelector("section:last-of-type p");
  const NOMBRES_MARCA = { visa: "Visa", mastercard: "Mastercard", amex: "Amex" };
  function marca(d) {
    if (/^4/.test(d)) return "visa";
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "mastercard";
    if (/^3[47]/.test(d)) return "amex";
    return "";
  }
  function luhn(d) {
    let suma = 0;
    [...d].reverse().forEach((c, i) => {
      let n = Number(c);
      if (i % 2) { n *= 2; if (n > 9) n -= 9; }
      suma += n;
    });
    return suma % 10 === 0;
  }
  const agrupar = (d, m) => (m === "amex" ? [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)] : d.match(/.{1,4}/g) || []).filter(Boolean).join(" ");
  const ponerTexto = (p, texto) => { p.lastChild.textContent = texto; };

  formulario.addEventListener("input", (e) => {
    const campo = e.target;
    if (campo.name === "numero") {
      const m0 = marca(campo.value.replace(/\D/g, ""));
      const d = campo.value.replace(/\D/g, "").slice(0, m0 === "amex" ? 15 : 16);
      const m = marca(d);
      campo.value = agrupar(d, m);
      tarjeta.dataset.marca = m;
      if (!m) delete tarjeta.dataset.marca;
      vMarca.textContent = NOMBRES_MARCA[m] || "Tarjeta";
      vNumero.textContent = agrupar(d.padEnd(m === "amex" ? 15 : 16, "•"), m);
      formulario.elements.cvc.maxLength = m === "amex" ? 4 : 3;
    }
    if (campo.name === "caducidad") {
      let d = campo.value.replace(/\D/g, "").slice(0, 4);
      if (d.length === 1 && Number(d) > 1) d = `0${d}`;
      if (d.length > 2) d = `${d.slice(0, 2)}/${d.slice(2)}`;
      campo.value = d;
      ponerTexto(vCaduca, d || "MM/AA");
    }
    if (campo.name === "titular") ponerTexto(vTitular, campo.value.trim() || "Nombre Apellido");
    if (campo.name === "cvc") {
      campo.value = campo.value.replace(/\D/g, "");
      ponerTexto(vCvc, campo.value.padEnd(campo.maxLength, "•"));
    }
    if (["cp", "telefono", "bizum"].includes(campo.name)) campo.value = campo.value.replace(campo.name === "cp" ? /\D/g : /[^\d +]/g, "");
    if (campo.getAttribute("aria-invalid") === "true") comprobar(campo);
  });
  const cvc = formulario.elements.cvc;
  cvc.addEventListener("focus", () => { tarjeta.dataset.giro = ""; });
  cvc.addEventListener("blur", () => { delete tarjeta.dataset.giro; });

  /* ---------- 5. Pagar ---------- */
  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    if (botonPagar.getAttribute("aria-busy") === "true") return;
    // Cada paso tiene que estar bien; si no, se abre el que falla
    for (let i = 0; i < pasos.length; i++) {
      if (!validar(pasos[i], false)) {
        if (estado(i) !== "activo") activar(i);
        setTimeout(() => validar(pasos[i]), 400);
        alerta.textContent = i < pasos.length - 1 ? `Revisa el paso ${i + 1}: falta algún dato.` : "Revisa los datos marcados en rojo.";
        return;
      }
    }
    alerta.textContent = "";
    botonPagar.setAttribute("aria-busy", "true");
    botonPagar.textContent = formulario.elements.metodo.value === "paypal" ? "Conectando con PayPal…" : "Procesando el pago…";
    setTimeout(() => confirmar(), 1600);
  });

  botonesExpres.forEach((b) => b.addEventListener("click", () => {
    if (b.getAttribute("aria-busy") === "true") return;
    botonesExpres.forEach((x) => { x.disabled = x !== b; });
    b.setAttribute("aria-busy", "true");
    const nombre = b.textContent;
    b.textContent = "Conectando…";
    setTimeout(() => confirmar(nombre), 1400);
  }));

  function describirPago(metodo, datos, expres) {
    if (expres) return { detalle: expres, estado: "Pagada" };
    if (metodo === "tarjeta") {
      const d = String(datos.get("numero")).replace(/\D/g, "");
      return { detalle: `${NOMBRES_MARCA[marca(d)] || "Tarjeta"} terminada en ${d.slice(-4)}`, estado: "Pagada" };
    }
    if (metodo === "paypal") return { detalle: "PayPal", estado: "Pagada" };
    if (metodo === "bizum") return { detalle: `Bizum · móvil terminado en ${String(datos.get("bizum")).replace(/\D/g, "").slice(-3)}`, estado: "Pagada" };
    return { detalle: "Transferencia bancaria", estado: "Pendiente de pago" };
  }

  function entrega(tipo) {
    if (tipo === "express") return `el ${dia(laborables(hoy, 1))}`;
    if (tipo === "tienda") return `en Gran Vía 26 desde el ${dia(laborables(hoy, 1))}`;
    return `entre el ${dia(laborables(hoy, 2))} y el ${dia(laborables(hoy, 3))}`;
  }

  function confirmar(expres) {
    const datos = new FormData(formulario);           // los bloques desactivados no se incluyen
    const tipo = envioElegido();
    const t = T.totales({ envio: tipo });
    const metodo = expres ? "expres" : datos.get("metodo");
    const pedido = {
      numero,
      fecha: hoy.toISOString(),
      lineas: t.lineas.map((l) => ({
        nombre: T.nombreLinea(l), color: l.color, nombreColor: T.colores[l.color].nombre, talla: l.talla,
        cantidad: l.cantidad, precio: T.precioUnidad(l),
      })),
      subtotal: t.subtotal, codigo: t.codigo, descuento: t.descuento, envio: t.envio, iva: t.iva, base: t.base, total: t.total,
      tipoEnvio: NOMBRES_ENVIO[tipo], tipo, entrega: entrega(tipo), metodo,
      pago: describirPago(metodo, datos, expres),
      cliente: expres ? { nombre: `Cliente de ${expres}`, correo: `la cuenta de ${expres}`, datos: [`Datos de envío facilitados por ${expres}`] } : {
        nombre: `${datos.get("nombre")} ${datos.get("apellidos")}`.trim(),
        correo: datos.get("correo"),
        datos: [
          datos.get("razon"), datos.get("nif") && `NIF ${String(datos.get("nif")).toUpperCase()}`,
          `${datos.get("nombre")} ${datos.get("apellidos")}`.trim(), datos.get("direccion"),
          `${datos.get("cp")} ${datos.get("ciudad")}`, `${datos.get("provincia")}, España`, datos.get("correo"), datos.get("telefono"),
        ],
      },
    };
    confirmado = true;
    try { localStorage.setItem(CLAVE_PEDIDO, JSON.stringify(pedido)); } catch (error) { /* sin almacenamiento */ }
    T.vaciar();
    T.quitarCodigo();
    pintarConfirmacion(pedido);
    try { history.replaceState(null, "", "#confirmacion"); } catch (error) { /* archivo local */ }
    scrollTo({ top: 0, behavior: "instant" });
    confirmacion.querySelector("h1").focus({ preventScroll: true });
  }

  /* ---------- El recibo ---------- */
  function conSaltos(parrafo, lineas) {
    parrafo.replaceChildren(...lineas.filter(Boolean).flatMap((texto, i) => (i ? [crear("br"), texto] : [texto])));
  }
  function filaTotal(etiqueta, valor) {
    const tr = crear("tr");
    const th = crear("th", etiqueta);
    th.scope = "row";
    th.colSpan = 3;
    tr.append(th, crear("td", valor));
    return tr;
  }

  function pintarConfirmacion(p) {
    pago.hidden = true;
    resumen.hidden = true;
    vacia.hidden = true;
    confirmacion.hidden = false;
    document.title = "Pedido confirmado — Chaket";

    const cabeza = confirmacion.querySelector(":scope > header");
    const h1 = cabeza.querySelector("h1");
    h1.tabIndex = -1;
    h1.querySelector("em").textContent = p.metodo === "expres" ? "de verdad" : p.cliente.nombre.split(" ")[0];
    const texto = cabeza.querySelector("p:last-of-type");
    texto.replaceChildren("Hemos enviado el recibo a ", crear("b", p.cliente.correo),
      p.pago.estado === "Pagada" ? `. Tu pedido llega ${p.entrega}.` : ". Lo enviamos en cuanto recibamos la transferencia.");

    const recibo = confirmacion.querySelector("article");
    recibo.querySelector("h2 em").textContent = p.numero;
    const datosRecibo = recibo.querySelectorAll(":scope > header dd");
    datosRecibo[0].textContent = fechaLarga.format(new Date(p.fecha));
    datosRecibo[1].textContent = p.numero.replace("CHK", "PED");
    datosRecibo[2].textContent = p.pago.estado;
    const [cliente, envio] = recibo.querySelectorAll(":scope > section p");
    conSaltos(cliente, p.cliente.datos);
    conSaltos(envio, [
      `${p.tipoEnvio}: ${p.envio ? T.dinero(p.envio) : "gratis"}`,
      p.pago.estado === "Pagada" ? `Llega ${p.entrega}` : "Se envía al recibir el pago",
      p.pago.detalle,
    ]);
    recibo.querySelector("tbody").replaceChildren(...p.lineas.map((l) => {
      const tr = crear("tr");
      const celda = crear("td");
      const figura = crear("figure");
      const img = crear("img");
      img.src = `img/chaquetas/${l.color}.webp`;
      img.alt = "";
      figura.append(img);
      const nombre = crear("p");
      nombre.append(crear("strong", l.nombre), crear("small", `${l.nombreColor} · Talla ${l.talla}`));
      celda.append(figura, nombre);
      tr.append(celda, crear("td", l.cantidad), crear("td", T.dinero(l.precio)), crear("td", T.dinero(l.precio * l.cantidad)));
      return tr;
    }));
    const filas = [filaTotal("Subtotal", T.dinero(p.subtotal))];
    if (p.descuento) filas.push(filaTotal(`Descuento (${p.codigo})`, `−${T.dinero(p.descuento)}`));
    filas.push(
      filaTotal(p.tipoEnvio, p.envio ? T.dinero(p.envio) : "Gratis"),
      filaTotal("Base imponible", T.dinero(p.base)),
      filaTotal("IVA (21 %)", T.dinero(p.iva)),
      filaTotal("Total", T.dinero(p.total)),
    );
    recibo.querySelector("tfoot").replaceChildren(...filas);
  }
  confirmacion.querySelector(":scope > p button").addEventListener("click", () => print());

  /* ---------- Arranque ---------- */
  cambiarMetodo();
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem(CLAVE_PEDIDO)); } catch (error) { guardado = null; }
  if (location.hash === "#confirmacion" && guardado && !T.unidades()) {
    confirmado = true;
    pintarConfirmacion(guardado);
  } else {
    pintar();
  }
  document.addEventListener("cesta:cambio", pintar);
})();
