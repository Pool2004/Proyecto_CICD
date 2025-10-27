from fastapi.testclient import TestClient


import sys
import os
# Agregar el directorio padre al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

client = TestClient(app)


def test_register():
    response = client.post("/register", json={"usuario": "testuser", "contraseña": "testpass", "token": "testtoken"})
    assert response.status_code == 201
    assert response.json() == {"mensaje": "Usuario registrado exitosamente"}