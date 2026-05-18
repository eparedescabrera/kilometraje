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
const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");
const infoPagina = document.getElementById("infoPagina");
const btnExportarExcel = document.getElementById("btnExportarExcel");
const PASSWORD_REPORTE = "1989";

let datosGlobales = [];
let paginaActual = 1;
const registrosPorPagina = 5;

/* FECHA CON SELECTOR DD/MM/YYYY */
flatpickr("#fecha", {
  locale: "es",
  dateFormat: "d/m/Y",
  defaultDate: "today"
});

/* LIMITAR KM A 6 DÍGITOS */
function limitarSeisDigitos(input) {
  input.value = input.value.replace(/\D/g, "").slice(0, 6);
}

/* CALCULAR TOTAL KM */
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

/* AUTOCOMPLETAR PLACA */
vehiculo.addEventListener("change", function () {
  const option = vehiculo.options[vehiculo.selectedIndex];
  placa.value = option.dataset.placa || "";
});

/* CARGAR CATÁLOGOS */
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

/* GUARDAR REGISTRO */
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
      <b>Fecha:</b> ${fecha.value}<br>
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

    flatpickr("#fecha", {
      locale: "es",
      dateFormat: "d/m/Y",
      defaultDate: "today"
    });

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

/* CARGAR DATOS */
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

/* FORMATEAR FECHA DD/MM/YYYY */
function formatearFecha(valor) {
  if (!valor) return "";

  const texto = String(valor);

  if (texto.includes("/")) {
    return texto;
  }

  const fechaObj = new Date(texto);

  const dia = String(fechaObj.getUTCDate()).padStart(2, "0");
  const mes = String(fechaObj.getUTCMonth() + 1).padStart(2, "0");
  const anio = fechaObj.getUTCFullYear();

  return `${dia}/${mes}/${anio}`;
}

function mostrarDatos(datos) {
  tabla.innerHTML = "";

  const textoBusqueda = buscar.value.toLowerCase();

  const datosFiltrados = datos.filter(item =>
    String(item.fecha).toLowerCase().includes(textoBusqueda) ||
    formatearFecha(item.fecha).toLowerCase().includes(textoBusqueda) ||
    String(item.vehiculo).toLowerCase().includes(textoBusqueda) ||
    String(item.placa).toLowerCase().includes(textoBusqueda) ||
    String(item.proyecto).toLowerCase().includes(textoBusqueda) ||
    String(item.conductor).toLowerCase().includes(textoBusqueda)
  );

  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina) || 1;

  if (paginaActual > totalPaginas) {
    paginaActual = totalPaginas;
  }

  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;

  const datosPagina = datosFiltrados.slice(inicio, fin);

  if (datosPagina.length === 0) {
    tabla.innerHTML = `
      <tr>
        <td colspan="8">No hay registros</td>
      </tr>
    `;
  }

  let sumaKm = 0;

  datosFiltrados.forEach(item => {
    sumaKm += Number(item.totalKm) || 0;
  });

  datosPagina.forEach(item => {
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

  infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;

  btnAnterior.disabled = paginaActual === 1;
  btnSiguiente.disabled = paginaActual === totalPaginas;
}
buscar.addEventListener("input", function () {
  paginaActual = 1;
  mostrarDatos(datosGlobales);
});

/* BOTÓN LIMPIAR SI EXISTE */
if (btnLimpiar) {
  btnLimpiar.addEventListener("click", function () {
    Swal.fire(
      "Aviso",
      "Para limpiar los datos debes borrarlos directamente desde Google Sheets.",
      "info"
    );
  });
}
btnAnterior.addEventListener("click", function () {
  if (paginaActual > 1) {
    paginaActual--;
    mostrarDatos(datosGlobales);
  }
});

btnSiguiente.addEventListener("click", function () {
  paginaActual++;
  mostrarDatos(datosGlobales);
});
/* INICIAR */
cargarCatalogos();
cargarDatos();
if (btnExportarExcel) {
  btnExportarExcel.addEventListener("click", async function () {
    const result = await Swal.fire({
      title: "Acceso restringido",
      input: "password",
      inputLabel: "Ingrese la contraseña para generar el reporte",
      inputPlaceholder: "Contraseña",
      showCancelButton: true,
      confirmButtonText: "Generar reporte",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#dc2626"
    });

    if (!result.isConfirmed) return;

    if (result.value !== PASSWORD_REPORTE) {
      Swal.fire("Acceso denegado", "Contraseña incorrecta.", "error");
      return;
    }

   exportarExcel();
  });
}

function exportarExcel() {

  if (!datosGlobales || datosGlobales.length === 0) {
    Swal.fire("Aviso", "No hay datos para exportar.", "info");
    return;
  }

  const datosExcel = datosGlobales.map(item => ({
    Fecha: formatearFecha(item.fecha),
    Vehículo: item.vehiculo,
    Placa: item.placa,
    Proyecto: item.proyecto,
    "KM Inicial": item.kmInicial,
    "KM Final": item.kmFinal,
    "Total KM": item.totalKm,
    Conductor: item.conductor
  }));

  const worksheet = XLSX.utils.json_to_sheet(datosExcel);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Reporte KM"
  );

  XLSX.writeFile(
    workbook,
    "Reporte_Kilometraje.xlsx"
  );

  Swal.fire(
    "Reporte generado",
    "El archivo Excel se descargó correctamente.",
    "success"
  );
}