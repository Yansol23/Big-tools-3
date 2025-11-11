// ------------------------------------
// Big Tools - Panel de Administración
// ------------------------------------

// API_URL se carga desde config.js - si no está definida, usar valor por defecto
if (typeof window.API_URL === 'undefined') {
    window.API_URL = "http://127.0.0.1:8000/api";
}
// Usar la variable global
const API_URL = window.API_URL;

// Elementos del DOM
const dashboard = document.getElementById("dashboard");
const usernameDisplay = document.getElementById("username-display");
const logoutButton = document.getElementById("logout-button");
const refreshButton = document.getElementById("refresh-button");
const exportPdfButton = document.getElementById("export-pdf-button");

// Variable global para almacenar las estadísticas actuales
let estadisticasActuales = null;

// -----------------------------------------
// GESTIÓN DE AUTENTICACIÓN
// -----------------------------------------

// Verificar si hay sesión activa al cargar la página
function verificarSesion() {
  const token = localStorage.getItem("chatbot_token");
  const username = localStorage.getItem("chatbot_username");
  const role = localStorage.getItem("chatbot_role");

  if (!token || !username) {
    // No hay sesión, redirigir al login principal
    alert("ADVERTENCIA: Debes iniciar sesión primero");
    window.location.href = "/";
    return;
  }

  // Verificar que sea admin
  if (role !== "admin") {
    alert("ACCESO DENEGADO: Solo administradores pueden acceder al dashboard.");
    window.location.href = "/";
    return;
  }

  // Usuario admin autenticado, mostrar dashboard
  mostrarDashboard(username);
  cargarEstadisticas();
}

function mostrarDashboard(username) {
  dashboard.style.display = "block";
  usernameDisplay.textContent = `Usuario: ${username}`;
}

// -----------------------------------------
// MANEJO DE LOGOUT
// -----------------------------------------

logoutButton.addEventListener("click", async () => {
  if (confirm("¿Deseas cerrar sesión y volver al chatbot?")) {
    const token = localStorage.getItem("chatbot_token");

    if (token) {
      try {
        await fetch(`${API_URL}/admin/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    }

    // Limpiar localStorage
    localStorage.removeItem("chatbot_token");
    localStorage.removeItem("chatbot_username");
    localStorage.removeItem("chatbot_role");

    // Redirigir al login principal
    window.location.href = "/";
  }
});

// -----------------------------------------
// CARGAR ESTADÍSTICAS
// -----------------------------------------

async function cargarEstadisticas() {
  const token = localStorage.getItem("chatbot_token");

  if (!token) {
    alert("ADVERTENCIA: Sesión expirada");
    window.location.href = "/";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error al cargar estadísticas");
    }

    const stats = await response.json();

    // Actualizar las estadísticas en el DOM
    actualizarEstadisticas(stats);
    
  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
    alert("ERROR: No se pudieron cargar las estadísticas");
  }
}

// -----------------------------------------
// ACTUALIZAR ESTADÍSTICAS EN EL DOM
// -----------------------------------------

function actualizarEstadisticas(stats) {
  // Guardar estadísticas globalmente para exportar a PDF
  estadisticasActuales = stats;
  
  // Total de diagnósticos
  document.getElementById("total-diagnosticos").textContent =
    stats.total_diagnosticos || 0;

  // Top máquinas
  const topMaquinasDiv = document.getElementById("top-maquinas");
  if (stats.top_maquinas && stats.top_maquinas.length > 0) {
    topMaquinasDiv.innerHTML = stats.top_maquinas
      .map(
        (item, index) => `
        <div class="stat-item">
          <span class="stat-rank">${index + 1}.</span>
          <span class="stat-name">${item.maquina}</span>
          <span class="stat-value">${item.cantidad} consultas</span>
        </div>
      `
      )
      .join("");
  } else {
    topMaquinasDiv.innerHTML = "<p class='no-data'>No hay datos disponibles</p>";
  }

  // Top categorías
  const topCategoriasDiv = document.getElementById("top-categorias");
  if (stats.top_categorias && stats.top_categorias.length > 0) {
    topCategoriasDiv.innerHTML = stats.top_categorias
      .map(
        (item, index) => `
        <div class="stat-item">
          <span class="stat-rank">${index + 1}.</span>
          <span class="stat-name">${item.categoria}</span>
          <span class="stat-detail">(${item.maquina})</span>
          <span class="stat-value">${item.cantidad} consultas</span>
        </div>
      `
      )
      .join("");
  } else {
    topCategoriasDiv.innerHTML = "<p class='no-data'>No hay datos disponibles</p>";
  }

  // Historial reciente
  const historialDiv = document.getElementById("historial-reciente");
  if (stats.historial_reciente && stats.historial_reciente.length > 0) {
    historialDiv.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Fecha/Hora</th>
            <th>Máquina</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Falla Detectada</th>
          </tr>
        </thead>
        <tbody>
          ${stats.historial_reciente
            .map(
              (item) => `
            <tr>
              <td>${formatearFecha(item.timestamp)}</td>
              <td>${item.maquina}</td>
              <td>${item.categoria}</td>
              <td>
                <span class="badge ${item.completado ? "completed" : "pending"}">
                  ${item.completado ? "Completado" : "En proceso"}
                </span>
              </td>
              <td>${item.falla || "-"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } else {
    historialDiv.innerHTML = "<p class='no-data'>No hay historial disponible</p>";
  }
  
  // Crear gráficos con un pequeño delay para asegurar que el DOM esté listo
  setTimeout(() => {
    crearGraficos(stats);
  }, 100);
}

// -----------------------------------------
// GRAFICOS CON CHART.JS
// -----------------------------------------

let chartMaquinas, chartCategorias, chartTendencia;

function crearGraficos(stats) {
  // Verificar que Chart.js esté cargado
  if (typeof Chart === 'undefined') {
    return;
  }

  // Destruir gráficos anteriores si existen
  if (chartMaquinas) chartMaquinas.destroy();
  if (chartCategorias) chartCategorias.destroy();
  if (chartTendencia) chartTendencia.destroy();

  // Verificar que los canvas existan
  const canvasMaquinas = document.getElementById('chartMaquinas');
  const canvasCategorias = document.getElementById('chartCategorias');
  const canvasTendencia = document.getElementById('chartTendencia');
  
  if (!canvasMaquinas || !canvasCategorias || !canvasTendencia) {
    return;
  }

  // Gráfico de Máquinas (Barras)
  const ctxMaquinas = canvasMaquinas.getContext('2d');
  const maquinasData = stats.top_maquinas || [];
  
  chartMaquinas = new Chart(ctxMaquinas, {
    type: 'bar',
    data: {
      labels: maquinasData.map(item => item.maquina),
      datasets: [{
        label: 'Diagnosticos',
        data: maquinasData.map(item => item.cantidad),
        backgroundColor: [
          'rgba(211, 47, 47, 0.7)',
          'rgba(33, 33, 33, 0.7)',
          'rgba(245, 124, 0, 0.7)',
          'rgba(56, 142, 60, 0.7)'
        ],
        borderColor: [
          'rgba(211, 47, 47, 1)',
          'rgba(33, 33, 33, 1)',
          'rgba(245, 124, 0, 1)',
          'rgba(56, 142, 60, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });

  // Gráfico de Categorías (Dona)
  const ctxCategorias = canvasCategorias.getContext('2d');
  const categoriasData = stats.top_categorias || [];
  
  chartCategorias = new Chart(ctxCategorias, {
    type: 'doughnut',
    data: {
      labels: categoriasData.map(item => item.categoria),
      datasets: [{
        data: categoriasData.map(item => item.cantidad),
        backgroundColor: [
          'rgba(211, 47, 47, 0.7)',
          'rgba(33, 33, 33, 0.7)',
          'rgba(245, 124, 0, 0.7)',
          'rgba(56, 142, 60, 0.7)',
          'rgba(25, 118, 210, 0.7)'
        ],
        borderColor: [
          'rgba(211, 47, 47, 1)',
          'rgba(33, 33, 33, 1)',
          'rgba(245, 124, 0, 1)',
          'rgba(56, 142, 60, 1)',
          'rgba(25, 118, 210, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });

  // Gráfico de Tendencia (Línea)
  const ctxTendencia = canvasTendencia.getContext('2d');
  const historialData = stats.historial_reciente || [];
  
  // Agrupar por fecha
  const diagnosticosPorFecha = {};
  historialData.forEach(item => {
    const fecha = new Date(item.timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    diagnosticosPorFecha[fecha] = (diagnosticosPorFecha[fecha] || 0) + 1;
  });
  
  // Ordenar fechas cronológicamente
  const fechasOrdenadas = Object.keys(diagnosticosPorFecha).sort((a, b) => {
    const [diaA, mesA, anioA] = a.split('/');
    const [diaB, mesB, anioB] = b.split('/');
    return new Date(anioA, mesA - 1, diaA) - new Date(anioB, mesB - 1, diaB);
  });
  
  // Tomar las últimas 10 fechas
  const fechas = fechasOrdenadas.slice(-10);
  const cantidades = fechas.map(fecha => diagnosticosPorFecha[fecha]);
  
  // Si no hay datos, mostrar un punto de ejemplo
  if (fechas.length === 0) {
    fechas.push('Sin datos');
    cantidades.push(0);
  }
  
  // Determinar el tipo de gráfico según la cantidad de datos
  const tipoGrafico = fechas.length === 1 ? 'bar' : 'line';
  
  chartTendencia = new Chart(ctxTendencia, {
    type: tipoGrafico,
    data: {
      labels: fechas,
      datasets: [{
        label: 'Diagnosticos',
        data: cantidades,
        borderColor: 'rgba(211, 47, 47, 1)',
        backgroundColor: tipoGrafico === 'bar' ? 'rgba(211, 47, 47, 0.8)' : 'rgba(211, 47, 47, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: 'rgba(211, 47, 47, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 10,
        borderWidth: 3,
        barThickness: 80
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

// -----------------------------------------
// UTILIDADES
// -----------------------------------------

function formatearFecha(isoString) {
  const fecha = new Date(isoString);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
}

// -----------------------------------------
// BOTÓN DE ACTUALIZACIÓN
// -----------------------------------------

refreshButton.addEventListener("click", async () => {
  const token = localStorage.getItem("chatbot_token");
  if (token) {
    // Deshabilitar botón y mostrar feedback
    refreshButton.disabled = true;
    refreshButton.textContent = "Actualizando...";
    
    try {
      await cargarEstadisticas();
      
      // Mostrar mensaje de éxito
      refreshButton.textContent = "Actualizado";
      refreshButton.style.backgroundColor = "#4caf50";
      
      // Restaurar botón después de 1 segundo
      setTimeout(() => {
        refreshButton.textContent = "Actualizar Estadísticas";
        refreshButton.style.backgroundColor = "";
        refreshButton.disabled = false;
      }, 1000);
      
    } catch (error) {
      // Mostrar error
      refreshButton.textContent = "Error al actualizar";
      refreshButton.style.backgroundColor = "#f44336";
      
      setTimeout(() => {
        refreshButton.textContent = "Actualizar Estadísticas";
        refreshButton.style.backgroundColor = "";
        refreshButton.disabled = false;
      }, 2000);
    }
  } else {
    alert("No hay sesión activa. Por favor, inicie sesión.");
  }
});

// -----------------------------------------
// GESTIÓN DE PESTAÑAS
// -----------------------------------------

function inicializarPestanas() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remover clase active de todos los botones y contenidos
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Agregar clase active al botón clickeado
      btn.classList.add("active");

      // Mostrar el contenido correspondiente
      const tabName = btn.getAttribute("data-tab");
      const tabContent = document.getElementById(`tab-${tabName}`);
      if (tabContent) {
        tabContent.classList.add("active");
      }

      // Si se abre la pestaña de manuales, cargar la lista
      if (tabName === "manuales") {
        cargarListaManuales();
      }
    });
  });
}

// -----------------------------------------
// GESTIÓN DE MANUALES
// -----------------------------------------

async function cargarListaManuales() {
  const manualesLista = document.getElementById("manuales-lista");
  
  console.log("Cargando lista de manuales...");
  
  try {
    const token = localStorage.getItem("chatbot_token");
    console.log("Token:", token ? "Presente" : "No encontrado");
    
    const response = await fetch("http://127.0.0.1:8000/api/admin/manuales", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    console.log("Respuesta del servidor:", response.status);

    if (!response.ok) {
      throw new Error("Error al cargar manuales");
    }

    const data = await response.json();
    const manuales = data.manuales || [];

    if (manuales.length === 0) {
      manualesLista.innerHTML = "<p class='no-data'>No hay manuales disponibles. Sube tu primer manual usando el formulario de arriba.</p>";
      return;
    }

    manualesLista.innerHTML = manuales
      .map(
        (manual) => {
          const fecha = manual.fecha_subida ? new Date(parseFloat(manual.fecha_subida) * 1000).toLocaleDateString('es-ES') : 'N/A';
          return `
      <div class="manual-item">
        <div class="manual-info">
          <h4>${manual.nombre}</h4>
          <p>Archivo: ${manual.archivo} | Fecha: ${fecha}</p>
        </div>
        <div class="manual-actions">
          <button class="manual-btn view" onclick="abrirManual('${manual.archivo}')">
            Ver
          </button>
          <button class="manual-btn delete" onclick="confirmarEliminarManual('${manual.archivo}')">
            Eliminar
          </button>
        </div>
      </div>
    `;
        }
      )
      .join("");
  } catch (error) {
    manualesLista.innerHTML = `<p class='no-data'>Error al cargar manuales: ${error.message}</p>`;
  }
}

function abrirManual(nombreArchivo) {
  const rutaPDF = `/manuales/${nombreArchivo}`;
  window.open(rutaPDF, "_blank");
}

function confirmarEliminarManual(nombreArchivo) {
  if (confirm(`¿Estás seguro de que deseas eliminar el manual "${nombreArchivo}"?\n\nEsta acción no se puede deshacer.`)) {
    eliminarManual(nombreArchivo);
  }
}

async function eliminarManual(nombreArchivo) {
  try {
    const token = localStorage.getItem("chatbot_token");
    
    const response = await fetch(`http://127.0.0.1:8000/api/admin/manuales/${nombreArchivo}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert(`Manual "${nombreArchivo}" eliminado correctamente`);
      // Recargar la lista
      cargarListaManuales();
    } else {
      alert(`Error al eliminar el manual: ${data.detail || 'Error desconocido'}`);
    }
  } catch (error) {
    alert(`Error al eliminar el manual: ${error.message}`);
  }
}

// -----------------------------------------
// SUBIDA DE MANUALES
// -----------------------------------------

function inicializarFormularioSubida() {
  const form = document.getElementById("upload-manual-form");
  const statusDiv = document.getElementById("upload-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombreManual = document.getElementById("manual-nombre").value.trim();
    const fileInput = document.getElementById("manual-file");
    const descripcion = document.getElementById("manual-descripcion").value.trim();
    const file = fileInput.files[0];

    if (!nombreManual) {
      mostrarEstadoSubida("error", "Por favor ingresa el nombre del manual");
      return;
    }

    if (!file) {
      mostrarEstadoSubida("error", "Por favor selecciona un archivo PDF");
      return;
    }

    if (file.type !== "application/pdf") {
      mostrarEstadoSubida("error", "Solo se permiten archivos PDF");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB
      mostrarEstadoSubida("error", "El archivo es demasiado grande (máximo 50MB)");
      return;
    }

    // Mostrar progreso
    mostrarEstadoSubida("info", "Subiendo archivo...");
    const uploadBtn = form.querySelector(".upload-btn");
    uploadBtn.disabled = true;

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append("archivo", file);
      formData.append("nombreManual", nombreManual);

      const token = localStorage.getItem("chatbot_token");
      
      const response = await fetch("http://127.0.0.1:8000/api/admin/manuales/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        mostrarEstadoSubida("success", `Manual "${nombreManual}" subido correctamente`);
        
        // Limpiar formulario
        form.reset();
        
        // Recargar lista de manuales
        setTimeout(() => {
          cargarListaManuales();
        }, 1500);
      } else {
        mostrarEstadoSubida("error", data.detail || "Error al subir el manual");
      }
    } catch (error) {
      mostrarEstadoSubida("error", `Error al subir el archivo: ${error.message}`);
    } finally {
      uploadBtn.disabled = false;
    }
  });
}

function mostrarEstadoSubida(tipo, mensaje) {
  const statusDiv = document.getElementById("upload-status");
  statusDiv.className = `upload-status ${tipo}`;
  statusDiv.textContent = mensaje;
  statusDiv.style.display = "block";
}

function getNombreAmigable(nombreTecnico) {
  const nombres = {
    hidrolavadora_karcher: "Hidrolavadora Kärcher",
    generador_generac: "Generador Generac Guardian",
    motor_cummins: "Motor Cummins",
    soldadora_miller_ranger: "Soldadora Miller Ranger 305D"
  };
  return nombres[nombreTecnico] || nombreTecnico;
}

// -----------------------------------------
// EXPORTAR ESTADÍSTICAS A PDF
// -----------------------------------------

async function exportarEstadisticasAPDF() {
  if (!estadisticasActuales) {
    alert("No hay estadisticas disponibles. Por favor, actualiza primero.");
    return;
  }

  if (typeof jspdf === 'undefined') {
    alert("Cargando libreria PDF...");
    return;
  }

  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Función auxiliar para agregar pie de página
  function agregarPieDePagina(pageNum, totalPages) {
    const footerY = pageHeight - 15;
    doc.setDrawColor(211, 47, 47);
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text("Big Tools - Sistema Experto de Diagnóstico", 25, footerY);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 25, footerY, { align: 'right' });
  }
  
  // Obtener usuario actual
  const usuarioActual = localStorage.getItem('chatbot_username') || 'admin';
  
  // ========== ENCABEZADO MODERNO ==========
  doc.setFillColor(52, 73, 94);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("BIG TOOLS", pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Reporte de Estadísticas del Sistema", pageWidth / 2, 25, { align: 'center' });
  
  doc.setDrawColor(211, 47, 47);
  doc.setLineWidth(1);
  doc.line(33, 30, pageWidth - 33, 30);
  
  let y = 40;

  // Fecha y usuario en el encabezado
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  const fecha = `${now.getDate()} de ${now.toLocaleString('es-ES', { month: 'long' })} de ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  doc.text(`Fecha de generación: ${fecha}`, 25, y);
  doc.text(`Usuario: ${usuarioActual}`, pageWidth - 25, y, { align: 'right' });
  
  y = 55;

  // ========== RESUMEN GENERAL ==========
  doc.setFillColor(211, 47, 47);
  doc.rect(20, y, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN GENERAL", 25, y + 5.5);
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total de Diagnósticos: ${estadisticasActuales.total_diagnosticos || 0}`, 25, y);
  y += 12;

  // ========== MÁQUINAS MÁS CONSULTADAS ==========
  doc.setFillColor(211, 47, 47);
  doc.rect(20, y, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("MÁQUINAS MÁS CONSULTADAS", 25, y + 5.5);
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (estadisticasActuales.top_maquinas && estadisticasActuales.top_maquinas.length > 0) {
    estadisticasActuales.top_maquinas.forEach((item, index) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 45;
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}.`, 25, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${item.maquina}:`, 32, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(211, 47, 47);
      doc.text(`${item.cantidad} consultas`, 140, y);
      doc.setTextColor(0, 0, 0);
      y += 6;
    });
  } else {
    doc.text("No hay datos disponibles", 25, y);
    y += 6;
  }
  y += 8;

  // ========== CATEGORÍAS MÁS CONSULTADAS ==========
  doc.setFillColor(211, 47, 47);
  doc.rect(20, y, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CATEGORÍAS MÁS CONSULTADAS", 25, y + 5.5);
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (estadisticasActuales.top_categorias && estadisticasActuales.top_categorias.length > 0) {
    estadisticasActuales.top_categorias.forEach((item, index) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 45;
      }
      const categoriaTexto = `${index + 1}. ${item.categoria}:`;
      const lineas = doc.splitTextToSize(categoriaTexto, pageWidth - 100);
      doc.setFont("helvetica", "normal");
      doc.text(lineas[0], 25, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(211, 47, 47);
      doc.text(`${item.cantidad} consultas`, 140, y);
      doc.setTextColor(0, 0, 0);
      y += 6;
    });
  } else {
    doc.text("No hay datos disponibles", 25, y);
    y += 6;
  }
  y += 8;

  // Verificar si necesitamos nueva página para el historial
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 45;
  }

  // ========== HISTORIAL RECIENTE ==========
  doc.setFillColor(211, 47, 47);
  doc.rect(20, y, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("HISTORIAL RECIENTE (ÚLTIMOS 20 REGISTROS)", 25, y + 5.5);
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  
  if (estadisticasActuales.historial_reciente && estadisticasActuales.historial_reciente.length > 0) {
    // Encabezados de tabla con fondo gris
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 4, pageWidth - 40, 7, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Fecha", 25, y);
    doc.text("Máquina", 65, y);
    doc.text("Categoría", 130, y);
    y += 8;
    doc.setFont("helvetica", "normal");

    // Línea debajo de encabezados
    doc.setDrawColor(211, 47, 47);
    doc.setLineWidth(0.5);
    doc.line(20, y - 3, pageWidth - 20, y - 3);

    // Filas de datos con líneas alternas
    let isAlternate = false;
    estadisticasActuales.historial_reciente.slice(0, 20).forEach((item) => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 45;
      }

      // Fondo alternado
      if (isAlternate) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, y - 4, pageWidth - 40, 6, 'F');
      }
      isAlternate = !isAlternate;

      const fechaObj = new Date(item.timestamp);
      const fechaFormato = fechaObj.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.setTextColor(0, 0, 0);
      doc.text(fechaFormato, 25, y);
      
      const maquinaTexto = doc.splitTextToSize(item.maquina || "N/A", 60);
      doc.text(maquinaTexto[0], 65, y);
      
      const categoriaTexto = doc.splitTextToSize(item.categoria || "N/A", 55);
      doc.text(categoriaTexto[0], 130, y);
      
      y += 6;
    });
  } else {
    doc.text("No hay historial disponible", 25, y);
  }

  // Agregar pie de página a todas las páginas
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    agregarPieDePagina(i, totalPages);
  }

  // Guardar el PDF
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nombreArchivo = `BigTools_Estadisticas_${timestamp}.pdf`;
  doc.save(nombreArchivo);
}

// -----------------------------------------
// EXPORTAR ESTADÍSTICAS A CSV
// -----------------------------------------

function exportarEstadisticasACSV() {
  if (!estadisticasActuales) {
    alert("No hay estadisticas disponibles. Por favor, actualiza primero.");
    return;
  }

  try {
    let csvContent = "";

    // Encabezado del CSV
    csvContent += "REPORTE DE ESTADISTICAS - BIG TOOLS\n";
    csvContent += `Fecha de Generacion: ${new Date().toLocaleString('es-ES')}\n\n`;

    // Total de diagnósticos
    csvContent += "RESUMEN GENERAL\n";
    csvContent += `Total de Diagnosticos,${estadisticasActuales.total_diagnosticos || 0}\n\n`;

    // Top Máquinas
    csvContent += "MAQUINAS MAS CONSULTADAS\n";
    csvContent += "Posicion,Maquina,Cantidad de Consultas\n";
    if (estadisticasActuales.top_maquinas && estadisticasActuales.top_maquinas.length > 0) {
      estadisticasActuales.top_maquinas.forEach((item, index) => {
        csvContent += `${index + 1},"${item.maquina}",${item.cantidad}\n`;
      });
    } else {
      csvContent += "No hay datos disponibles\n";
    }
    csvContent += "\n";

    // Top Categorías
    csvContent += "CATEGORIAS MAS CONSULTADAS\n";
    csvContent += "Posicion,Categoria,Cantidad de Consultas\n";
    if (estadisticasActuales.top_categorias && estadisticasActuales.top_categorias.length > 0) {
      estadisticasActuales.top_categorias.forEach((item, index) => {
        csvContent += `${index + 1},"${item.categoria}",${item.cantidad}\n`;
      });
    } else {
      csvContent += "No hay datos disponibles\n";
    }
    csvContent += "\n";

    // Historial Reciente
    csvContent += "HISTORIAL RECIENTE\n";
    csvContent += "Fecha y Hora,Maquina,Categoria\n";
    if (estadisticasActuales.historial_reciente && estadisticasActuales.historial_reciente.length > 0) {
      estadisticasActuales.historial_reciente.forEach((item) => {
        const fechaObj = new Date(item.timestamp);
        const fechaFormato = fechaObj.toLocaleString('es-ES');
        csvContent += `"${fechaFormato}","${item.maquina || 'N/A'}","${item.categoria || 'N/A'}"\n`;
      });
    } else {
      csvContent += "No hay historial disponible\n";
    }

    // Crear archivo CSV y descargar
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const nombreArchivo = `estadisticas_bigtools_${Date.now()}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    alert("Error al exportar a CSV. Intenta de nuevo.");
  }
}

// -----------------------------------------
// TOOLTIP DE EXPORTACIÓN (PDF/CSV)
// -----------------------------------------

const exportButton = document.getElementById("export-button");
const exportTooltip = document.getElementById("export-tooltip");
const tooltipOptions = document.querySelectorAll(".tooltip-option");

// Mostrar/ocultar tooltip al hacer clic en el botón
if (exportButton && exportTooltip) {
  exportButton.addEventListener("click", (e) => {
    e.stopPropagation();
    
    if (!estadisticasActuales) {
      alert("No hay estadisticas disponibles. Por favor, actualiza primero.");
      return;
    }
    
    exportTooltip.classList.toggle("show");
  });

  // Cerrar tooltip al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".export-wrapper")) {
      exportTooltip.classList.remove("show");
    }
  });
}

// Manejar las opciones del tooltip
tooltipOptions.forEach(option => {
  option.addEventListener("click", (e) => {
    e.stopPropagation();
    const formato = option.getAttribute("data-format");
    exportTooltip.classList.remove("show");

    if (formato === "pdf") {
      exportarEstadisticasAPDF();
    } else if (formato === "csv") {
      exportarEstadisticasACSV();
    }
  });
});

// -----------------------------------------
// INICIALIZACIÓN
// -----------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
  inicializarPestanas();
  inicializarFormularioSubida();
});

