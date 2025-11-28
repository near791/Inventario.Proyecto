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

para agregar otras casillas en productos:
ALTER TABLE productos
ADD COLUMN cantidad DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE productos
ADD COLUMN precio INT DEFAULT NULL;

ALTER TABLE productos
ADD COLUMN granel TINYINT(1) DEFAULT 0;

ALTER TABLE productos
ADD COLUMN stock_minimo INT DEFAULT 5;

ALTER TABLE productos
ADD COLUMN descuento DECIMAL(5,2) DEFAULT 0.00;

Lo que tiene que tener tabla usurarios:
id, int, no null, primary key, default null, auto incrementar.
usuario, varchar(100), yes null, unique key, default null.
contrasena, varchar(225), null yes, default null.

lo que tiene que tener la tabla productos:
id, int, no null, primary key, default null, auto incremento.
nombre, varchar(225), no null, unique key, default null.
cantidad, decimal(10,2), no null, default 0.00
precio, int, yes null, default null.
granel, tinyint(1), yes null, default 0.
stock_minimo, int, yes null, 5.
descuento, decimal(5,2), null yes, default 0.00

### 3. Instalar dependencias

Frontend:
cd client
npm install

librerias a installar en client:
react router dom (version 6)
axios

Backend:
cd server
npm install

librerias a instalar en server:
express
mysql2
bcrypt
cors

## Ejecutar proyecto

Terminal 1 - Backend:
cd server
node index.js

Terminal 2 - Frontend:
cd client
npm start

## Comandos Git

Antes de trabajar(descarga los cambios hechos por los demas):
git pull

Despues de hacer cambios(ejemplo git add server/index.js, luego el git comit -m "una descripcion"
finaliza con git push para cargar los cambios):
git add .
git commit -m "Descripcion de cambios"
git push

## Funcionalidades

- Registro e inicio de sesion
- Agregar productos
- Autocompletado
- Gestion de stock y precios
