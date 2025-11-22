# Sistema de Inventario

Sistema de gestion de inventario con autenticacion de usuarios.

## Tecnologias

- Frontend: React.js
- Backend: Node.js + Express
- Base de datos: MySQL

## Instalacion

### 1. Clonar el repositorio

git clone https://github.com/near791/Inventario.Proyecto.git
cd Inventario.Proyecto

### 2. Configurar base de datos MySQL

CREATE DATABASE inventario;
USE inventario;
CREATE TABLE usuarios (
id INT AUTO_INCREMENT PRIMARY KEY,
usuario VARCHAR(50) NOT NULL UNIQUE,
contrasena VARCHAR(255) NOT NULL
);
CREATE TABLE productos (
id INT AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(100) NOT NULL,
cantidad INT NOT NULL DEFAULT 0,
precio DECIMAL(10,2) NOT NULL DEFAULT 0
);

### 3. Instalar dependencias

Frontend:
cd client
npm install

Backend:
cd server
npm install

## Ejecutar proyecto

Terminal 1 - Backend:
cd server
node index.js

Terminal 2 - Frontend:
cd client
npm start

## Comandos Git

Antes de trabajar:
git pull

Despues de hacer cambios:
git add .
git commit -m "Descripcion de cambios"
git push

## Funcionalidades

- Registro e inicio de sesion
- Agregar productos
- Autocompletado
- Gestion de stock y precios
