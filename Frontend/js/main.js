/* Big Tools - Chatbot */

const chatWindow = document.getElementById("chat-window");
const resetBtn = document.getElementById("reset-button");
const API_URL = "http://127.0.0.1:8000/api";

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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: sessionState.token })
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
  btn.innerHTML = `📖 Ver Manual (${referencia})`;
  btn.onclick = () => {
    // Construir ruta relativa al PDF
    const rutaPDF = `../Backend/data/manuales_pdf/${archivoPDF}`;
    window.open(rutaPDF, '_blank');
  };

  btnContainer.appendChild(btn);
  return btnContainer;
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
    
    // Ofrecer reinicio
    addOptions(["🔁 Consultar otra máquina"], startChat);
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
    sessionState = { maquina: null, categoria: null }; // Reiniciar sesión
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
    const response = await fetch(
      `${API_URL}/diagnosticar/iniciar/${sessionState.maquina}/${sessionState.categoria}`,
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
    const response = await fetch(
      `${API_URL}/diagnosticar/avanzar/${sessionState.maquina}/${sessionState.categoria}`,
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