from fastapi import FastAPI
import uvicorn
from pydantic import BaseModel
import random
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Definimos nuestra api

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

lista_tokens = [{
    "usuario": "admin",
    "contraseña": "password",
    "token": "abc123"
}]

lista_tareas = [{
    "id": 1,
    "titulo": "Tarea de ejemplo",
    "descripcion": "Esta es una tarea de ejemplo",
    "completada": False
}]

class Tarea(BaseModel):
    id: int
    titulo: str
    descripcion: str
    completada: bool

class Usuario(BaseModel):
    usuario: str
    contraseña: str

def generarTocken(longitud: int):
    letra = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    token = ""
    for _ in range(longitud):
        token += random.choice(letra)
    return token



@app.post("/register")
def register(usuario: Usuario):
    lista_tokens.append({"usuario": usuario.usuario, "contraseña": usuario.contraseña, "token": generarTocken(16)})
    return JSONResponse(content={"mensaje": "Usuario registrado exitosamente"}, status_code=201)

@app.post("/login")
def login(usuario: Usuario):
    for user in lista_tokens:
        if user["usuario"] == usuario.usuario and user["contraseña"] == usuario.contraseña:
            return JSONResponse(content={"token": user["token"], "status_code": 200}, status_code=200)
    return JSONResponse(content={"mensaje": "Credenciales inválidas", "status_code": 401}, status_code=401)

@app.post("/test")
def test(token: str):
    for user in lista_tokens:
        if user["token"] == token:
            return JSONResponse(content={"mensaje": "Token válido", "status_code": 200}, status_code=200)
    return JSONResponse(content={"mensaje": "Token inválido", "status_code": 401}, status_code=401)

@app.get("/tareas")
def obtener_tareas(token: str):
    for user in lista_tokens:
        if user["token"] == token:
            return JSONResponse(content={"tareas": lista_tareas, "status_code": 200}, status_code=200)
    return JSONResponse(content={"mensaje": "Token inválido", "status_code": 401}, status_code=401)

@app.post("/tareas/crear")
def crear_tarea(tarea: Tarea, token: str):
    for user in lista_tokens:
        if user["token"] == token:
            lista_tareas.append(tarea.dict())
            return JSONResponse(content={"mensaje": "Tarea creada exitosamente", "status_code": 201}, status_code=201)
    return JSONResponse(content={"mensaje": "Token inválido", "status_code": 401}, status_code=401)

@app.delete("/tareas/eliminar/{tarea_id}")
def eliminar_tarea(tarea_id: int, token: str):
    for user in lista_tokens:
        if user["token"] == token:
            for tarea in lista_tareas:
                if tarea["id"] == tarea_id:
                    lista_tareas.remove(tarea)
                    return JSONResponse(content={"mensaje": "Tarea eliminada exitosamente", "status_code": 200}, status_code=200)
            return JSONResponse(content={"mensaje": "Tarea no encontrada", "status_code": 404}, status_code=404)
    return JSONResponse(content={"mensaje": "Token inválido", "status_code": 401}, status_code=401)

@app.put("/tareas/actualizar/{tarea_id}")
def actualizar_tarea(tarea_id: int, tarea: Tarea, token: str):
    for user in lista_tokens:
        if user["token"] == token:
            for i, t in enumerate(lista_tareas):
                if t["id"] == tarea_id:
                    lista_tareas[i] = tarea.dict()
                    return JSONResponse(content={"mensaje": "Tarea actualizada exitosamente", "status_code": 200}, status_code=200)
            return JSONResponse(content={"mensaje": "Tarea no encontrada", "status_code": 404}, status_code=404)
    return JSONResponse(content={"mensaje": "Token inválido", "status_code": 401}, status_code=401)

@app.get("/tareas/{tarea_id}")
def obtener_tarea(tarea_id: int, token: str):
    for user in lista_tokens:
        if user["token"] == token:
            for tarea in lista_tareas:
                if tarea["id"] == tarea_id:
                    return JSONResponse(content={"tarea": tarea, "status_code": 200}, status_code=200)
            return JSONResponse(content={"mensaje": "Tarea no encontrada", "status_code": 404}, status_code=404)
    return JSONResponse(content={"mensaje": "Token inválido", "status_code": 401}, status_code=401)