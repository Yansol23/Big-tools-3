/* Big Tools - Chatbot */

// ========== PARTÍCULAS ANIMADAS EN EL FONDO ==========
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 80;
  
  // Colores industriales de Big Tools
  const colors = ['#d32f2f', '#ff5252', '#666666', '#999999'];

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 1 - 0.5;
      this.speedY = Math.random() * 1 - 0.5;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function createParticles() {
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          ctx.strokeStyle = '#d32f2f';
          ctx.globalAlpha = (1 - distance / 120) * 0.2;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    connectParticles();
    requestAnimationFrame(animate);
  }

  createParticles();
  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// Iniciar partículas cuando cargue la página
window.addEventListener('load', initParticles);

// ========== VARIABLES PRINCIPALES ==========
const chatWindow = document.getElementById("chat-window");
const resetBtn = document.getElementById("reset-button");
// API_URL se carga desde config.js - si no está definida, usar valor por defecto
if (typeof window.API_URL === 'undefined') {
    window.API_URL = "http://127.0.0.1:8000/api";
}
// Usar la variable global
const API_URL = window.API_URL;

let sessionState = {
  maquina: null,
  categoria: null,
  token: null,
  username: null,
  role: null
};

// ========== GESTIÓN DE AUTENTICACIÓN ==========

// Verificar si hay sesión activa al cargar
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('chatbot_token');
  const username = localStorage.getItem('chatbot_username');
  const role = localStorage.getItem('chatbot_role');
  
  if (token && username) {
    // Usuario ya autenticado
    sessionState.token = token;
    sessionState.username = username;
    sessionState.role = role || 'tecnico';
    mostrarChatbot();
  } else {
    // Mostrar login
    mostrarLogin();
  }
});

function mostrarLogin() {
  document.getElementById('login-modal').style.display = 'flex';
  document.getElementById('main-container').style.display = 'none';
}

function mostrarChatbot() {
  document.getElementById('login-modal').style.display = 'none';
  document.getElementById('main-container').style.display = 'block';
  document.getElementById('user-display').textContent = `Usuario: ${sessionState.username}`;
  
  // Mostrar u ocultar botón de administración según el rol
  const adminButton = document.getElementById('admin-button');
  if (sessionState.role === 'admin') {
    adminButton.style.display = 'inline-block';
  } else {
    adminButton.style.display = 'none';
  }
  
  // Iniciar el chatbot si no hay mensajes
  if (chatWindow.children.length === 0) {
    iniciarChatbot();
  }
}

// Manejar el formulario de login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('login-error');
  
  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      // Login exitoso
      sessionState.token = data.token;
      sessionState.username = username;
      sessionState.role = data.role || 'tecnico';
      
      // Guardar en localStorage
      localStorage.setItem('chatbot_token', data.token);
      localStorage.setItem('chatbot_username', username);
      localStorage.setItem('chatbot_role', data.role || 'tecnico');
      
      // Limpiar formulario
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      errorMsg.textContent = '';
      
      // Mostrar chatbot
      mostrarChatbot();
    } else {
      errorMsg.textContent = 'Error: Usuario o contraseña incorrectos';
    }
  } catch (error) {
    errorMsg.textContent = 'Error: No se pudo conectar con el servidor';
    console.error('Error en login:', error);
  }
});

// Manejar logout
document.getElementById('logout-button').addEventListener('click', async () => {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    try {
      // Llamar al endpoint de logout
      await fetch(`${API_URL}/admin/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionState.token}`
        }
      });
    } catch (error) {
      console.error('Error en logout:', error);
    }
    
    // Limpiar sesión local
    localStorage.removeItem('chatbot_token');
    localStorage.removeItem('chatbot_username');
    localStorage.removeItem('chatbot_role');
    sessionState.token = null;
    sessionState.username = null;
    sessionState.role = null;
    
    // Limpiar chat
    chatWindow.innerHTML = '';
    sessionState.maquina = null;
    sessionState.categoria = null;
    
    // Mostrar login
    mostrarLogin();
  }
});
function addMessage(text, sender = "bot") {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);
  messageDiv.innerHTML = text; // Usamos innerHTML para renderizar <strong>, <ul>, etc.
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return messageDiv;
}

function addOptions(options, callback) {
  const optionsWrapper = document.createElement("div");
  optionsWrapper.classList.add("bot-options");

  if (options.length === 0) {
    addMessage("ADVERTENCIA: No hay más opciones. Contacte a soporte.");
    return;
  }

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.classList.add("option-btn");
    btn.textContent = opt;
    btn.onclick = () => {
      // Añadir mensaje del usuario
      addMessage(opt, "user");
      // Eliminar los botones actuales
      optionsWrapper.remove();
      // Ejecutar callback
      callback(opt);
    };
    optionsWrapper.appendChild(btn);
  });

  chatWindow.appendChild(optionsWrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function crearBotonManual(maquina, referencia) {
  // Mapeo de máquinas a archivos PDF
  const manualesPDF = {
    "hidrolavadora_karcher": "HIDROLAVADORA.pdf",
    "Hidrolavadora Kärcher": "HIDROLAVADORA.pdf",
    "generador_generac": "Generac_Manual_Usuario_Guardian_Series (1).pdf",
    "Generador Generac Guardian": "Generac_Manual_Usuario_Guardian_Series (1).pdf",
    "motor_cummins": "MANUAL CUMMINS 2.pdf",
    "Motor Cummins": "MANUAL CUMMINS 2.pdf",
    "soldadora_miller_ranger": "ranger_305d.pdf",
    "Soldadora Miller Ranger 305D": "ranger_305d.pdf"
  };

  const archivoPDF = manualesPDF[maquina];
  
  if (!archivoPDF) {
    return null; // No hay manual disponible
  }

  // Crear contenedor del botón
  const btnContainer = document.createElement("div");
  btnContainer.classList.add("manual-button-container");
  btnContainer.style.alignSelf = "flex-start";
  btnContainer.style.marginTop = "10px";
  btnContainer.style.marginBottom = "10px";

  // Crear botón
  const btn = document.createElement("button");
  btn.classList.add("manual-btn");
  btn.innerHTML = `📖 Ver Manual (Pág. ${referencia})`;
  btn.onclick = () => {
    // Extraer número de página de la referencia
    let numeroPagina = extraerNumeroPagina(referencia);
    
    // Construir ruta del PDF con el fragmento de página
    let rutaPDF = `/manuales/${archivoPDF}`;
    if (numeroPagina) {
      rutaPDF += `#page=${numeroPagina}`;
    }
    
    window.open(rutaPDF, '_blank');
  };

  btnContainer.appendChild(btn);
  return btnContainer;
}

function extraerNumeroPagina(referencia) {
  // Intenta extraer un número de la referencia
  // Ejemplos: "ES-8" -> 8, "27" -> 27, "Manual Cummins Sec. 3" -> 3
  
  if (!referencia) return null;
  
  // Buscar patrones comunes
  // Patrón 1: "ES-8" o similar -> tomar el número después del guion
  const patronGuion = /[-]\s*(\d+)/;
  const matchGuion = referencia.match(patronGuion);
  if (matchGuion) {
    return parseInt(matchGuion[1]);
  }
  
  // Patrón 2: Número al final "Sec. 3" -> tomar el último número
  const patronNumero = /(\d+)/g;
  const todosNumeros = referencia.match(patronNumero);
  if (todosNumeros && todosNumeros.length > 0) {
    return parseInt(todosNumeros[todosNumeros.length - 1]);
  }
  
  return null;
}

function crearBotonExportarPDF(diagnosticoData) {
  const btnContainer = document.createElement("div");
  btnContainer.classList.add("manual-button-container");
  btnContainer.style.marginTop = "15px";

  const btn = document.createElement("button");
  btn.classList.add("manual-btn");
  btn.style.backgroundColor = "#e53935";
  btn.innerHTML = `Descargar Diagnostico PDF`;
  btn.onclick = () => exportarDiagnosticoAPDF(diagnosticoData);

  btnContainer.appendChild(btn);
  return btnContainer;
}

function exportarDiagnosticoAPDF(data) {
  // Usar jsPDF (lo cargaremos desde CDN)
  if (typeof jspdf === 'undefined') {
    alert('Cargando libreria PDF...');
    return;
  }

  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // ========== ENCABEZADO MODERNO ==========
  // Fondo del encabezado (azul oscuro)
  doc.setFillColor(52, 73, 94);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Título en blanco
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("BIG TOOLS", pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Informe de Diagnóstico Técnico", pageWidth / 2, 25, { align: 'center' });
  
  // Línea decorativa roja
  doc.setDrawColor(211, 47, 47);
  doc.setLineWidth(1);
  doc.line(33, 30, pageWidth - 33, 30);
  
  let y = 40;
  
  // Fecha de generación
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  const fechaHeader = new Date();
  const fechaTexto = `${fechaHeader.getDate()} de ${fechaHeader.toLocaleString('es-ES', { month: 'long' })} de ${fechaHeader.getFullYear()}, ${fechaHeader.getHours().toString().padStart(2, '0')}:${fechaHeader.getMinutes().toString().padStart(2, '0')}`;
  doc.text(`Fecha de generación: ${fechaTexto}`, 25, y);
  
  // Usuario
  if (sessionState.username) {
    doc.text(`Usuario: ${sessionState.username}`, pageWidth - 25, y, { align: 'right' });
  }
  
  y = 50;
  
  // ========== INFORMACIÓN DEL EQUIPO ==========
  doc.setFillColor(211, 47, 47);
  doc.rect(20, y, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMACIÓN DEL EQUIPO", 25, y + 5.5);
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  if (data.maquina) {
    doc.setFont("helvetica", "bold");
    doc.text("Máquina:", 25, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.maquina, 70, y);
    y += 7;
  }
  
  if (data.categoria) {
    doc.setFont("helvetica", "bold");
    doc.text("Categoría:", 25, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    const categoriaLines = doc.splitTextToSize(data.categoria, pageWidth - 55);
    doc.text(categoriaLines, 25, y);
    y += (categoriaLines.length * 6) + 5;
  }
  
  // ========== DIAGNÓSTICO ==========
  y += 5;
  doc.setFillColor(211, 47, 47);
  doc.rect(20, y, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DIAGNÓSTICO", 25, y + 5.5);
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  if (data.falla) {
    // Caja con borde rojo para la falla
    const fallaLines = doc.splitTextToSize(data.falla, pageWidth - 60);
    const boxHeight = (fallaLines.length * 6) + 10;
    
    doc.setDrawColor(211, 47, 47);
    doc.setLineWidth(0.5);
    doc.setFillColor(255, 240, 240);
    doc.rect(25, y - 3, pageWidth - 50, boxHeight, 'FD');
    
    doc.setFont("helvetica", "normal");
    doc.text(fallaLines, 30, y + 3);
    y += boxHeight + 10;
  }
  
  // ========== SOLUCIÓN RECOMENDADA ==========
  doc.setFillColor(46, 125, 50);
  doc.rect(20, y, pageWidth - 40, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SOLUCIÓN RECOMENDADA", 25, y + 5.5);
  
  y += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  if (data.solucion) {
    // Caja con borde verde para la solución
    const solucionLines = doc.splitTextToSize(data.solucion, pageWidth - 60);
    const boxHeight = (solucionLines.length * 6) + 10;
    
    doc.setDrawColor(46, 125, 50);
    doc.setLineWidth(0.5);
    doc.setFillColor(240, 255, 240);
    doc.rect(25, y - 3, pageWidth - 50, boxHeight, 'FD');
    
    doc.setFont("helvetica", "normal");
    doc.text(solucionLines, 30, y + 3);
    y += boxHeight + 10;
  }
  
  // ========== PIE DE PÁGINA ==========
  const footerY = pageHeight - 15;
  
  // Línea superior del pie
  doc.setDrawColor(211, 47, 47);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  // Información del pie
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "italic");
  doc.text("Big Tools - Sistema Experto de Diagnóstico", 25, footerY);
  doc.text("Página 1 de 1", pageWidth - 25, footerY, { align: 'right' });
  
  // Guardar el PDF
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nombreArchivo = `BigTools_Diagnostico_${timestamp}.pdf`;
  doc.save(nombreArchivo);
}

function handleApiResponse(response) {
  // Caso 1: Es una pregunta con opciones
  if (response.pregunta && response.opciones) {
    addMessage(response.pregunta);
    addOptions(response.opciones, handleOptionSelection);
  }
  // Caso 2: Es un resultado final (falla)
  else if (response.falla && response.soluciones) {
    let solHTML = `<strong>Falla detectada:</strong> ${response.falla}<br>`;
    solHTML += "<strong>Soluciones sugeridas:</strong><ul>";
    response.soluciones.forEach((sol) => {
      solHTML += `<li>${sol}</li>`;
    });
    solHTML += "</ul>";
    
    if (response.referencia) {
        solHTML += `<br><em>(Ref: ${response.referencia})</em>`;
    }
    
    addMessage(solHTML);
    
    // Agregar botón para ver manual si hay referencia
    if (response.referencia && response.maquina) {
      const manualBtn = crearBotonManual(response.maquina, response.referencia);
      if (manualBtn) {
        chatWindow.appendChild(manualBtn);
      }
    }
    
    // Agregar botón para exportar a PDF
    const diagnosticoData = {
      maquina: response.maquina || sessionState.maquina,
      categoria: sessionState.categoria,
      falla: response.falla,
      solucion: response.soluciones.join('. ')
    };
    const pdfBtn = crearBotonExportarPDF(diagnosticoData);
    chatWindow.appendChild(pdfBtn);
    
    // Ofrecer reinicio
    addOptions(["Consultar otra maquina"], startChat);
  }
  // Caso 3: Es un mensaje simple o error
  else {
    addMessage(response.mensaje || "Error inesperado en la respuesta.");
    addOptions(["🔁 Consultar otra máquina"], startChat);
  }
}

async function startChat() {
  chatWindow.innerHTML = "";

  addMessage("Bienvenido a Big Tools! Elige la máquina sobre la que quieres consultar:");
  
  try {
    const response = await fetch(`${API_URL}/maquinas`);
    if (!response.ok) throw new Error("No se pudo obtener la lista de máquinas.");
    
    const data = await response.json();
    // Reiniciar solo las propiedades de diagnóstico, preservando la autenticación
    sessionState.maquina = null;
    sessionState.categoria = null;
    addOptions(data.maquinas, handleMachineSelection);

  } catch (error) {
    addMessage(`ERROR: No se pudo conectar con el servidor para obtener máquinas. ${error.message}`);
  }
}

async function handleMachineSelection(machine) {
  sessionState.maquina = machine;
  addMessage(`Elegiste <strong>${machine}</strong>. Ahora selecciona una categoría:`);

  try {
    const response = await fetch(`${API_URL}/categorias/${machine}`);
    if (!response.ok) throw new Error("No se pudo obtener la lista de categorías.");

    const data = await response.json();
    addOptions(data.categorias, handleCategorySelection);

  } catch (error) {
    addMessage(`ERROR: No se pudieron obtener las categorías: ${error.message}`);
  }
}

async function handleCategorySelection(category) {
  sessionState.categoria = category;
  addMessage(`Iniciando diagnóstico para: <strong>${category}</strong>`);

  try {
    const maquinaEncoded = encodeURIComponent(sessionState.maquina);
    const categoriaEncoded = encodeURIComponent(sessionState.categoria);
    const response = await fetch(
      `${API_URL}/diagnosticar/iniciar/${maquinaEncoded}/${categoriaEncoded}`,
      {
        method: "POST",
      }
    );
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Error al iniciar diagnóstico.");

    handleApiResponse(data);

  } catch (error) {
    addMessage(`ERROR: ${error.message}`);
    addOptions(["Consultar otra máquina"], startChat);
  }
}

async function handleOptionSelection(respuesta) {
  if (!sessionState.maquina || !sessionState.categoria) {
    addMessage("ERROR: Sesión inválida. Por favor, reinicia.");
    startChat();
    return;
  }

  try {
    const maquinaEncoded = encodeURIComponent(sessionState.maquina);
    const categoriaEncoded = encodeURIComponent(sessionState.categoria);
    const response = await fetch(
      `${API_URL}/diagnosticar/avanzar/${maquinaEncoded}/${categoriaEncoded}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuesta: respuesta }), // Enviar respuesta como JSON
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Error al avanzar.");

    handleApiResponse(data);

  } catch (error) {
    addMessage(`ERROR: ${error.message}`);
    addOptions(["Consultar otra máquina"], startChat);
  }
}

// Renombrar startChat a iniciarChatbot para consistencia
function iniciarChatbot() {
  startChat();
}

// Evento del botón reset
resetBtn.addEventListener("click", startChat);