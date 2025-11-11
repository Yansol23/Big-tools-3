# Big Tools - Sistema Experto de Diagnóstico

Sistema experto para diagnóstico de fallas en máquinas industriales con dashboard administrativo.

## Requisitos Previos

Antes de ejecutar el sistema, asegúrate de tener instalado:

1. **Python 3.8 o superior**
   - Descarga desde: https://www.python.org/downloads/
   - Durante la instalación, marca la opción "Add Python to PATH"

2. **Git** (opcional, solo si clonas desde GitHub)
   - Descarga desde: https://git-scm.com/downloads

## Instalación

### Opción 1: Descargar desde GitHub

```bash
git clone https://github.com/Yansol23/Big-Tools-Sistema-Experto.git
cd Big-Tools-Sistema-Experto
```

### Opción 2: Descargar desde Drive o ZIP

1. Descarga la carpeta del proyecto
2. Descomprime el archivo ZIP (si aplica)
3. Abre PowerShell o Terminal
4. Navega a la carpeta del proyecto:
   ```bash
   cd "ruta/donde/descargaste/Big-Tools-Sistema-Experto"
   ```

## Inicio Rapido

### 🚀 Iniciar el Sistema (Muy Fácil)

**Para usar el sistema, solo necesitas:**

1. **Haz doble clic en `INICIAR_BIG_TOOLS.bat`**
2. Espera a que se abra el navegador automáticamente
3. ¡Listo para usar!

El script automáticamente:
- Verifica que Python esté instalado
- Instala las dependencias si es necesario
- Inicia el servidor
- Abre el navegador con la aplicación

---

### 🔧 Método Avanzado: Inicio Manual (Para Desarrolladores)

Si prefieres iniciar el servidor manualmente:

#### 1. Instalar Dependencias (solo la primera vez)
```bash
pip install -r requirements.txt
```

**Nota:** Si `pip` no funciona, intenta con `pip3` o `python -m pip install -r requirements.txt`

#### 2. Navegar a la Carpeta Backend
```bash
cd Backend
```

#### 3. Iniciar el Servidor

**Opción A: Solo para uso local (127.0.0.1)**
```bash
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

**Opción B: Para acceso desde otros dispositivos en la red**
```bash
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
> **Nota:** Con `--host 0.0.0.0` el servidor será accesible desde otros dispositivos en tu red local usando tu IP (ej: `http://192.168.1.100:8000`)

#### 4. Abrir el Navegador
Abre tu navegador y ve a:
```
http://127.0.0.1:8000
```
(O si el servidor está en otro equipo: `http://IP_DEL_SERVIDOR:8000`)

> **Nota:** El sistema detecta automáticamente la URL del servidor. No necesitas configurar nada manualmente.

#### 5. Iniciar Sesion
Ingresa las credenciales (ver seccion Credenciales abajo)

### URLs del Sistema

Una vez que el servidor este corriendo:

- **Chatbot Principal:** `http://127.0.0.1:8000/`
- **Dashboard Admin:** `http://127.0.0.1:8000/admin`
- **Documentacion API:** `http://127.0.0.1:8000/docs`

### Notas Importantes

- NO cierres la ventana que se abre mientras uses el sistema
- Para detener el servidor: cierra la ventana o presiona cualquier tecla cuando te lo pida
- El sistema se iniciará automáticamente cada vez que ejecutes `INICIAR_BIG_TOOLS.bat`

### Configuración para Múltiples Usuarios

Si quieres que varios técnicos usen el sistema sin ejecutar el backend en cada computadora:

1. **Ejecuta el servidor en un equipo central** (servidor/computadora principal):
   ```bash
   python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Obtén la IP del servidor** (ej: `192.168.1.100`)
   - En Windows: `ipconfig` (busca "Dirección IPv4")
   - En Linux/Mac: `ifconfig` o `ip addr`

3. **Los técnicos solo necesitan abrir su navegador** y acceder a:
   ```
   http://192.168.1.100:8000
   ```
   (Reemplaza `192.168.1.100` con la IP real del servidor)

> **¡Importante!** Los técnicos NO deben abrir el archivo `index.html` directamente desde el explorador de archivos. Deben acceder a través de la URL del servidor (`http://IP:8000`).

> **Ventaja:** 
> - Solo una computadora necesita ejecutar el servidor
> - Los técnicos no necesitan instalar Python ni dependencias
> - El sistema detecta automáticamente la URL del servidor
> - Todo funciona desde el navegador web

## Credenciales

El sistema cuenta con **dos tipos de usuarios** con diferentes niveles de acceso:

### Administrador (Acceso Completo)
- **Usuario:** `admin`
- **Contraseña:** `1234`
- **Permisos:** 
  - ✅ Acceso al chatbot de diagnóstico
  - ✅ Acceso al dashboard administrativo
  - ✅ Visualización de estadísticas
  - ✅ Gestión de manuales

### Tecnico (Solo Chatbot)
- **Usuario:** `tecnico`
- **Contraseña:** `1234`
- **Permisos:**
  - ✅ Acceso al chatbot de diagnóstico
  - ❌ Sin acceso al dashboard (botón oculto)

**Nota:** El sistema recordará tu sesión. El botón "Modo Administración" solo es visible para usuarios admin.

## Caracteristicas

### Para Técnicos
- Chatbot inteligente para diagnóstico
- Interfaz intuitiva con opciones múltiples
- Soluciones detalladas paso a paso
- Acceso directo a manuales PDF
- Sistema de login seguro con persistencia de sesión

### Para Administradores
- **Todo lo anterior, más:**
- Dashboard con estadísticas en tiempo real
- Gestión de manuales PDF
- Historial de consultas
- Top máquinas y categorías consultadas
- Control total del sistema

## 🔧 Máquinas Disponibles

1. **Hidrolavadora Kärcher** - 5 categorías de diagnóstico
2. **Generador Generac Guardian** - 3 categorías
3. **Motor Cummins** - 5 categorías
4. **Soldadora Miller Ranger 305D** - 6 categorías

## 📁 Estructura

```
Big-tools-3/
├── Backend/
│   ├── app.py                 # Aplicación FastAPI
│   ├── api/
│   │   ├── auth.py           # Autenticación
│   │   ├── routes.py         # Endpoints
│   │   ├── stats.py          # Estadísticas
│   │   ├── engine.py         # Motor de inferencia
│   │   └── base_conocimiento.py
│   └── data/
│       ├── base_conocimiento.json
│       ├── stats.json
│       ├── users.json
│       └── manuales_pdf/
│
├── Frontend/
│   ├── index.html            # Chatbot
│   ├── admin.html            # Dashboard
│   ├── css/
│   └── js/
│
├── INICIAR_BIG_TOOLS.bat     # Script principal (ejecutar este)
└── requirements.txt          # Dependencias
```

## 🛠️ Instalación

El script `INICIAR_BIG_TOOLS.bat` instala automáticamente las dependencias si es necesario. Solo necesitas ejecutarlo.

## 📊 Endpoints API

### Públicos
- `GET /api/maquinas` - Lista de máquinas
- `GET /api/categorias/{maquina}` - Categorías por máquina
- `POST /api/diagnosticar/iniciar/{maquina}/{categoria}` - Iniciar diagnóstico
- `POST /api/diagnosticar/avanzar/{maquina}/{categoria}` - Avanzar diagnóstico

### Administrativos (requieren token)
- `POST /api/admin/login` - Login
- `POST /api/admin/logout` - Logout
- `GET /api/admin/stats` - Estadísticas

## 🎯 Uso

### Iniciar el Sistema
1. Ejecuta `INICIAR_BIG_TOOLS.bat`
2. Espera a que se abra el navegador
3. Inicia sesión con tus credenciales

### Usar el Chatbot
1. Selecciona una máquina
2. Elige una categoría
3. Responde las preguntas
4. Obtén diagnóstico y soluciones
5. Accede al manual PDF si está disponible

### Usar el Dashboard (Solo Admin)
1. Haz clic en "Modo Administración" (visible solo para admin)
2. Ver estadísticas o gestionar manuales
3. Actualizar datos en tiempo real

## 📚 Gestión de Manuales

Los manuales PDF se encuentran en:
```
Backend/data/manuales_pdf/
```

Para agregar un manual:
1. Copia el PDF a la carpeta `manuales_pdf/`
2. El sistema lo detectará automáticamente
3. Aparecerá en los diagnósticos correspondientes

## 🔒 Seguridad

- Contraseñas hasheadas con SHA256
- Tokens de sesión únicos
- CORS configurado
- Validación de entrada

## 🛠️ Tecnologías

- **Backend:** Python 3, FastAPI, Uvicorn
- **Frontend:** HTML5, CSS3, JavaScript
- **Autenticación:** SHA256, Tokens
- **Almacenamiento:** JSON

## 🆘 Solución de Problemas

### Error: "Python no reconocido como comando"
**Solución:** Python no está en el PATH del sistema
1. Reinstala Python desde https://www.python.org/downloads/
2. Marca la opción "Add Python to PATH" durante la instalación
3. Reinicia PowerShell/Terminal

### Error: "pip no reconocido como comando"
**Solución:** Usa una de estas alternativas:
```bash
python -m pip install -r requirements.txt
# o
pip3 install -r requirements.txt
```

### Error: "No module named 'fastapi'"
**Solución:** Las dependencias no están instaladas
```bash
pip install -r requirements.txt
```

### El script no inicia el servidor
**Solución:**
- Verifica que Python esté instalado correctamente
- Ejecuta `python --version` en una terminal para verificar
- Revisa la ventana del servidor que se abre para ver errores

### Frontend no conecta
**Solución:**
- Verifica que el backend esté corriendo en `http://127.0.0.1:8000`
- Abre la consola del navegador (F12) para ver errores
- Haz un hard refresh: `CTRL + SHIFT + R` o `CTRL + F5`

### Login no funciona
**Solución:**
- Verifica las credenciales:
  - Usuario: `admin` o `tecnico`
  - Contraseña: `1234`
- Haz un hard refresh del navegador
- Revisa la consola del navegador (F12)

### Puerto 8000 ya está en uso
**Solución:**
```bash
# Usa otro puerto
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8001
```
Luego abre: `http://127.0.0.1:8001`

### Los gráficos no se ven
**Solución:**
- Haz un hard refresh: `CTRL + SHIFT + R`
- Verifica tu conexión a internet (Chart.js se carga desde CDN)
- Revisa la consola del navegador (F12)

## 📝 Notas

- Los manuales se abren en nueva pestaña
- Las estadísticas se actualizan en tiempo real
- El sistema soporta múltiples sesiones simultáneas
- Compatible con Chrome, Firefox, Edge

---

**Desarrollado para Big Tools** - Sistema de Diagnóstico Industrial
