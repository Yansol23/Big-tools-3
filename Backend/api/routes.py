"""Rutas de la API del sistema experto"""

from fastapi import APIRouter, HTTPException, Body, Header
from typing import Optional
from api.auth import validar_usuario, crear_token, validar_token, eliminar_token
from api.base_conocimiento import BaseConocimiento
from api.engine import MotorInferencia
from api.stats import stats_manager

router = APIRouter(prefix="/api", tags=["Sistema Experto"])

base = BaseConocimiento()
motor_global = MotorInferencia(base)
sesiones = {}

NOMBRES_MAQUINAS = {
    "Hidrolavadora Kärcher": "hidrolavadora_karcher",
    "Generador Generac Guardian": "generador_generac",
    "Motor Cummins": "motor_cummins",
    "Soldadora Miller Ranger 305D": "soldadora_miller_ranger"
}

NOMBRES_AMIGABLES = {v: k for k, v in NOMBRES_MAQUINAS.items()}

def normalizar_nombre_maquina(nombre: str) -> str:
    return NOMBRES_MAQUINAS.get(nombre, nombre)

@router.get("/")
def home():
    """Ruta base de la API."""
    return {"mensaje": "API del Sistema Experto activa"}


@router.post("/login")
def login(username: str = Body(...), password: str = Body(...)):
    if validar_usuario(username, password):
        return {"success": True, "message": "Login correcto"}
    raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")


@router.post("/admin/login")
def admin_login(username: str = Body(...), password: str = Body(...)):
    """Login que retorna un token de sesión y el rol del usuario."""
    usuario = validar_usuario(username, password)
    if usuario:
        token = crear_token(usuario["username"], usuario["role"])
        return {
            "success": True, 
            "token": token, 
            "username": usuario["username"],
            "role": usuario["role"]
        }
    raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")


@router.post("/admin/logout")
def admin_logout(authorization: Optional[str] = Header(None)):
    """Cierra sesión del administrador."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    
    token = authorization.replace("Bearer ", "")
    eliminar_token(token)
    return {"success": True, "message": "Sesión cerrada correctamente"}


@router.get("/admin/stats")
def obtener_estadisticas(authorization: Optional[str] = Header(None)):
    """Retorna las estadísticas del sistema (requiere autenticación de admin)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    
    token = authorization.replace("Bearer ", "")
    user_data = validar_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    # Verificar que sea admin
    if user_data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores.")
    
    estadisticas = stats_manager.obtener_estadisticas()
    return estadisticas


@router.get("/maquinas")
def listar_maquinas():
    """Lista todas las máquinas disponibles en la base de conocimiento."""
    # Diccionario para convertir nombres técnicos a nombres amigables
    nombres_amigables = {
        "hidrolavadora_karcher": "Hidrolavadora Kärcher",
        "generador_generac": "Generador Generac Guardian",
        "motor_cummins": "Motor Cummins",
        "soldadora_miller_ranger": "Soldadora Miller Ranger 305D"
    }
    
    maquinas = base.listar_maquinas()
    # Convertir a nombres amigables
    maquinas_amigables = [nombres_amigables.get(m, m) for m in maquinas]
    return {"maquinas": maquinas_amigables}


@router.get("/categorias/{nombre_maquina}")
def listar_categorias(nombre_maquina: str):
    """Devuelve las categorías disponibles para una máquina específica."""
    nombre_tecnico = normalizar_nombre_maquina(nombre_maquina)
    categorias = base.listar_categorias(nombre_tecnico)
    return {"categorias": categorias}


@router.post("/diagnosticar/iniciar/{nombre_maquina}/{categoria}")
def iniciar_diagnostico(nombre_maquina: str, categoria: str):
    """
    Inicia el diagnóstico de una máquina específica para la categoría seleccionada.
    Devuelve la primera pregunta u opciones para el frontend.
    """
    try:
        # Normalizar nombre de máquina
        nombre_tecnico = normalizar_nombre_maquina(nombre_maquina)
        
        motor = MotorInferencia(base)
        
        # Paso 1: Iniciar el motor (carga categorías de la máquina)
        motor.iniciar_diagnostico(nombre_tecnico) 
        
        # Paso 2: Seleccionar la categoría (obtiene la 1ra pregunta o resultado)
        # !! ESTE ES EL PASO CRÍTICO QUE FALTABA !!
        resultado = motor.seleccionar_categoria(categoria) 

        # Guardamos la sesión por máquina + categoría (usar nombre técnico)
        key = f"{nombre_tecnico}|{categoria}"
        sesiones[key] = motor

        # Registrar estadística (usar nombre técnico)
        stats_manager.registrar_diagnostico_iniciado(nombre_tecnico, categoria)

        # Retornamos el resultado del Paso 2
        return resultado

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/diagnosticar/avanzar/{nombre_maquina}/{categoria}")
def avanzar_diagnostico(nombre_maquina: str, categoria: str, respuesta: str = Body(..., embed=True)):
    """
    Avanza un paso en el árbol de diagnóstico según la respuesta del usuario.
    Devuelve la siguiente pregunta u opciones, o la falla y soluciones si se llegó a un nodo hoja.
    """
    # Normalizar nombre de máquina
    nombre_tecnico = normalizar_nombre_maquina(nombre_maquina)
    
    key = f"{nombre_tecnico}|{categoria}"
    motor = sesiones.get(key)

    if motor is None:
        raise HTTPException(status_code=404, detail="No se encontró una sesión activa para esta máquina y categoría.")

    resultado = motor.avanzar(respuesta)
    
    # Si el diagnóstico llegó a una falla (resultado final), registrar como completado
    if "falla" in resultado and "soluciones" in resultado:
        stats_manager.registrar_diagnostico_completado(nombre_tecnico, categoria, resultado["falla"])
    
    return resultado
