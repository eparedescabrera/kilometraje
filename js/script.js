const API_URL = "https://script.google.com/macros/s/AKfycbxFdm7_6-WZ1elEcDQRdEIvAPhjqUxlMMjqIxVVmbkWB8DCHp7e3hnLaX6c3VdJonpiOA/exec";

const form = document.getElementById("formRegistro");
const fecha = document.getElementById("fecha");
const vehiculo = document.getElementById("vehiculo");
const placa = document.getElementById("placa");
const proyecto = document.getElementById("proyecto");
const conductor = document.getElementById("conductor");
const kmInicial = document.getElementById("kmInicial");
const kmFinal = document.getElementById("kmFinal");
const totalKilometraje = document.getElementById("totalKilometraje");

const tabla = document.getElementById("tabla");
const totalRegistros = document.getElementById("totalRegistros");
const totalKm = document.getElementById("totalKm");
const buscar = document.getElementById("buscar");
const btnLimpiar = document.getElementById("btnLimpiar");

let datosGlobales = [];

/* =========================
   FECHA FORMATO 13/05/2025
========================= */

function obtenerFechaActual() {
  const hoy = new Date();

  const dia = String(hoy.getDate()).padStart(2, "0");
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const anio = hoy.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

fecha.value = obtenerFechaActual();

/* =========================
   LIMITAR A 6 DIGITOS
========================= */

function limitarSeisDigitos(input) {
  input.value = input.value.replace(/\D/g, "").slice(0, 6);
}

/* =========================
   CALCULAR TOTAL KM
========================= */

function calcularTotal() {
  if (kmInicial.value === "" || kmFinal.value === "") {
    totalKilometraje.value = "";
    return;
  }

  const inicial = Number(kmInicial.value);
  const final = Number(kmFinal.value);
  const total = final - inicial;

  totalKilometraje.value = total >= 0 ? total : "";
}

kmInicial.addEventListener("input", function () {
  limitarSeisDigitos(kmInicial);
  calcularTotal();
});

kmFinal.addEventListener("input", function () {
  limitarSeisDigitos(kmFinal);
  calcularTotal();
});

/* =========================
   AUTOCOMPLETAR PLACA
========================= */

vehiculo.addEventListener("change", function () {
  const option = vehiculo.options[vehiculo.selectedIndex];
  placa.value = option.dataset.placa || "";
});

/* =========================
   CARGAR CATALOGOS
========================= */

function cargarCatalogos() {
  const callbackName = "catalogos_" + Date.now();

  window[callbackName] = function (data) {
    llenarVehiculos(data.vehiculos || []);
    llenarProyectos(data.proyectos || []);
    llenarConductores(data.conductores || []);

    delete window[callbackName];
    document.getElementById(callbackName)?.remove();
  };

  const script = document.createElement("script");

  script.id = callbackName;
  script.src = `${API_URL}?accion=catalogos&callback=${callbackName}`;

  document.body.appendChild(script);
}

function llenarVehiculos(data) {
  vehiculo.innerHTML = `<option value="">Seleccione vehículo</option>`;

  data.forEach(item => {
    vehiculo.innerHTML += `
      <option value="${item.vehiculo}" data-placa="${item.placa}">
        ${item.vehiculo} - ${item.placa}
      </option>
    `;
  });
}

function llenarProyectos(data) {
  proyecto.innerHTML = `<option value="">Seleccione proyecto</option>`;

  data.forEach(item => {
    proyecto.innerHTML += `
      <option value="${item}">
        ${item}
      </option>
    `;
  });
}

function llenarConductores(data) {
  conductor.innerHTML = `<option value="">Seleccione conductor</option>`;

  data.forEach(item => {
    conductor.innerHTML += `
      <option value="${item}">
        ${item}
      </option>
    `;
  });
}

/* =========================
   GUARDAR REGISTRO
========================= */

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (kmInicial.value.length !== 6 || kmFinal.value.length !== 6) {
    Swal.fire(
      "Error",
      "KM Inicial y KM Final deben tener exactamente 6 dígitos.",
      "error"
    );
    return;
  }

  const inicial = Number(kmInicial.value);
  const final = Number(kmFinal.value);
  const total = final - inicial;

  if (final < inicial) {
    Swal.fire(
      "Error",
      "El KM final no puede ser menor al KM inicial.",
      "error"
    );
    return;
  }

  const result = await Swal.fire({
    title: "¿Guardar registro?",
    html: `
      <b>Vehículo:</b> ${vehiculo.value}<br>
      <b>Placa:</b> ${placa.value}<br>
      <b>Proyecto:</b> ${proyecto.value}<br>
      <b>Conductor:</b> ${conductor.value}<br>
      <b>KM Inicial:</b> ${inicial}<br>
      <b>KM Final:</b> ${final}<br>
      <b>Total KM:</b> ${total}
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#dc2626"
  });

  if (!result.isConfirmed) return;

  const data = {
    fecha: fecha.value,
    vehiculo: vehiculo.value,
    placa: placa.value,
    proyecto: proyecto.value,
    kmInicial: inicial,
    kmFinal: final,
    totalKm: total,
    conductor: conductor.value
  };

  try {

    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(data)
    });

    Swal.fire({
      icon: "success",
      title: "Guardado",
      text: "Registro guardado correctamente",
      timer: 1500,
      showConfirmButton: false
    });

    form.reset();

    fecha.value = obtenerFechaActual();

    placa.value = "";
    totalKilometraje.value = "";

    setTimeout(cargarDatos, 1200);

  } catch (error) {

    Swal.fire(
      "Error",
      "No se pudo guardar el registro.",
      "error"
    );
  }
});

/* =========================
   CARGAR DATOS
========================= */

function cargarDatos() {
  const callbackName = "registros_" + Date.now();

  window[callbackName] = function (data) {

    datosGlobales = data;

    mostrarDatos(data);

    delete window[callbackName];

    document.getElementById(callbackName)?.remove();
  };

  const script = document.createElement("script");

  script.id = callbackName;
  script.src = `${API_URL}?callback=${callbackName}`;

  document.body.appendChild(script);
}

/* =========================
   FORMATEAR FECHA TABLA
========================= */

function formatearFecha(valor) {

  if (!valor) return "";

  if (valor.includes("/")) return valor;

  const nuevaFecha = new Date(valor);

  return nuevaFecha.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

/* =========================
   MOSTRAR DATOS
========================= */

function mostrarDatos(datos) {

  tabla.innerHTML = "";

  const textoBusqueda = buscar.value.toLowerCase();

  const datosFiltrados = datos.filter(item =>

    String(item.fecha).toLowerCase().includes(textoBusqueda) ||

    String(item.vehiculo).toLowerCase().includes(textoBusqueda) ||

    String(item.placa).toLowerCase().includes(textoBusqueda) ||

    String(item.proyecto).toLowerCase().includes(textoBusqueda) ||

    String(item.conductor).toLowerCase().includes(textoBusqueda)
  );

  if (datosFiltrados.length === 0) {

    tabla.innerHTML = `
      <tr>
        <td colspan="8">No hay registros</td>
      </tr>
    `;
  }

  let sumaKm = 0;

  datosFiltrados.forEach(item => {

    sumaKm += Number(item.totalKm) || 0;

    tabla.innerHTML += `
      <tr>
        <td>${formatearFecha(item.fecha)}</td>
        <td>${item.vehiculo}</td>
        <td>${item.placa}</td>
        <td>${item.proyecto}</td>
        <td>${item.kmInicial}</td>
        <td>${item.kmFinal}</td>
        <td><strong>${item.totalKm}</strong></td>
        <td>${item.conductor || "-"}</td>
      </tr>
    `;
  });

  totalRegistros.textContent = datosFiltrados.length;
  totalKm.textContent = sumaKm.toFixed(2);
}

/* =========================
   BUSCAR
========================= */

buscar.addEventListener("input", function () {
  mostrarDatos(datosGlobales);
});

/* =========================
   LIMPIAR
========================= */

if (btnLimpiar) {

  btnLimpiar.addEventListener("click", function () {

    Swal.fire(
      "Aviso",
      "Para limpiar los datos debes borrarlos directamente desde Google Sheets.",
      "info"
    );
  });
}

/* =========================
   INICIAR
========================= */

cargarCatalogos();
cargarDatos();