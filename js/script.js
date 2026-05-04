const API_URL = "https://script.google.com/macros/s/AKfycbxFdm7_6-WZ1elEcDQRdEIvAPhjqUxlMMjqIxVVmbkWB8DCHp7e3hnLaX6c3VdJonpiOA/exec";

const form = document.getElementById("formRegistro");
const fecha = document.getElementById("fecha");
const vehiculo = document.getElementById("vehiculo");
const proyecto = document.getElementById("proyecto");
const kmInicial = document.getElementById("kmInicial");
const kmFinal = document.getElementById("kmFinal");
const totalKilometraje = document.getElementById("totalKilometraje");
const observacion = document.getElementById("observacion");

const tabla = document.getElementById("tabla");
const totalRegistros = document.getElementById("totalRegistros");
const totalKm = document.getElementById("totalKm");
const buscar = document.getElementById("buscar");
const btnLimpiar = document.getElementById("btnLimpiar");

let datosGlobales = [];

fecha.value = new Date().toISOString().split("T")[0];

function calcularTotal() {
  const inicial = Number(kmInicial.value);
  const final = Number(kmFinal.value);

  if (kmInicial.value === "" || kmFinal.value === "") {
    totalKilometraje.value = "";
    return;
  }

  const total = final - inicial;

  if (total < 0) {
    totalKilometraje.value = "";
    return;
  }

  totalKilometraje.value = total;
}

kmInicial.addEventListener("input", calcularTotal);
kmFinal.addEventListener("input", calcularTotal);

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const inicial = Number(kmInicial.value);
  const final = Number(kmFinal.value);
  const total = final - inicial;

  if (final < inicial) {
    Swal.fire("Error", "El KM final no puede ser menor al KM inicial.", "error");
    return;
  }

  const data = {
    fecha: fecha.value,
    vehiculo: vehiculo.value,
    proyecto: proyecto.value,
    kmInicial: inicial,
    kmFinal: final,
    totalKm: total,
    observacion: observacion.value.trim()
  };

  try {
  await fetch(API_URL, {
  method: "POST",
  mode: "no-cors",
  body: JSON.stringify(data)
});

    Swal.fire({
      icon: "success",
      title: "Registro guardado",
      text: "El recorrido se guardó correctamente.",
      timer: 1800,
      showConfirmButton: false
    });

    form.reset();
    fecha.value = new Date().toISOString().split("T")[0];
    totalKilometraje.value = "";

    setTimeout(() => {
      cargarDatos();
    }, 1500);

  } catch (error) {
    console.error(error);
    Swal.fire("Error", "No se pudo guardar el registro.", "error");
  }
});

function cargarDatos() {
  const callbackName = "callback_" + new Date().getTime();

  window[callbackName] = function (data) {
    mostrarDatos(data);
    delete window[callbackName];
  };

  const script = document.createElement("script");
  script.src = API_URL + "?callback=" + callbackName;

  document.body.appendChild(script);
}
function formatearFecha(fecha) {
  if (!fecha) return "";

  const nuevaFecha = new Date(fecha);

  return nuevaFecha.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}
function mostrarDatos(datos) {
  tabla.innerHTML = "";

  const textoBusqueda = buscar.value.toLowerCase();

  const datosFiltrados = datos.filter((item) => {
    return (
      String(item.fecha).toLowerCase().includes(textoBusqueda) ||
      String(item.vehiculo).toLowerCase().includes(textoBusqueda) ||
      String(item.proyecto).toLowerCase().includes(textoBusqueda)
    );
  });

  if (datosFiltrados.length === 0) {
    tabla.innerHTML = `
      <tr>
        <td colspan="7">No hay registros</td>
      </tr>
    `;
  }

  let sumaKm = 0;

  datosFiltrados.forEach((item) => {
    sumaKm += Number(item.totalKm) || 0;

    tabla.innerHTML += `
      <tr>
        <td>${formatearFecha(item.fecha)}</td>
        <td>${item.vehiculo}</td>
        <td>${item.proyecto}</td>
        <td>${item.kmInicial}</td>
        <td>${item.kmFinal}</td>
        <td><strong>${item.totalKm}</strong></td>
        <td>${item.observacion || "-"}</td>
      </tr>
    `;
  });

  totalRegistros.textContent = datosFiltrados.length;
  totalKm.textContent = sumaKm.toFixed(2);
}

buscar.addEventListener("input", function () {
  mostrarDatos(datosGlobales);
});

btnLimpiar.addEventListener("click", function () {
  Swal.fire(
    "Aviso",
    "Para limpiar los datos debes borrarlos directamente desde Google Sheets.",
    "info"
  );
});

cargarDatos();