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

Instalar laragon:
link de descarga https://laragon.org/download

Luego crear base da datos ejecutando lo siguiente en la consola:

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
cantidad DECIMAL(10,2) NOT NULL DEFAULT 0.00,
precio INT DEFAULT NULL,
granel TINYINT(1) DEFAULT 0,
stock_minimo INT DEFAULT 5,
descuento DECIMAL(5,2) DEFAULT 0.00
);

CREATE TABLE ventas (
id INT AUTO_INCREMENT PRIMARY KEY,
transaccion_id VARCHAR(50),
usuario_id INT NOT NULL,
usuario_nombre VARCHAR(100) NOT NULL,
producto_id INT NOT NULL,
producto_nombre VARCHAR(250) NOT NULL AFTER,
cantidad DECIMAL(10,2) NOT NULL DEFAULT 0,
precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
total DECIMAL(10,2) NOT NULL DEFAULT 0,
fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Para asignar las FOREIGN KEYS de la tabla ventas:

ALTER TABLE ventas
ADD CONSTRAINT fk_venta_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE ventas
ADD CONSTRAINT fk_venta_producto
FOREIGN KEY (producto_id) REFERENCES productos(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

## Agregar la caducidad a los productos

ALTER TABLE productos
ADD COLUMN dias_caducidad INT DEFAULT 30,
ADD COLUMN fecha_ultima_actualizacion DATE;

## luego

UPDATE productos
SET dias_caducidad = 30,
fecha_ultima_actualizacion = CURDATE()
WHERE dias_caducidad IS NULL;

## agregar el fiado

ALTER TABLE ventas ADD COLUMN Fiado VARCHAR(50) NOT NULL DEFAULT 'Pagado';

### 3. Instalar dependencias

Instalar vscode

Crear carpeta proyecto y en ella dos carpetas; client y server.

Frontend:
1.- Ejecutar en una consola
cd client (dirección de la carpeta client)

2.- librerias a installar en consola de la carpeta client:
npm install react router dom (version 6) axios

Backend:
2.- ejecutar en una nueva consola
cd server (dirección carpeta server)

librerias a instalar en server:
npm install express mysql2 bcrypt cors

## Ejecutar proyecto

Terminal 1 - Backend:
cd server

Ejecutar
node index.js
(levanta la conexión con el servidor)

Terminal 2 - Frontend:
cd client

Ejecutar
npm start
(Inicia la app)

## Comandos Git

Tienes que tener la invitación al git.
Luego:

Se ejecuta en la consola de la carpeta proyecto:

Antes de trabajar(descarga los cambios hechos por los demas):
git pull

Despues de hacer cambios(ejemplo git add server/index.js, luego el git comit -m "una descripcion"
finaliza con git push para cargar los cambios):
git add .
git commit -m "Descripcion de cambios"
git push

## Funcionalidades

- Registro e inicio de sesion
- Agregar productos (productos por unidad y granel)
- Gestion de stock y precios (se puede agregar descuentos o editar)
- Vender producto (se venden productos a traves de la genstion de un carrito de compras, se puede
  vender por unidad y tambien por granel)
- Panel de datos (estadisticas generales, productos mas vendidos, historial de productos)

## Funcionalidades a agregar en nuevas versiones

- Añadir y vender a travéz de escaneo de codigos de barra vía celular o escaner USB.
- Agregar la opcion de fiado o "venta interna" a través de una casilla extra en la tabla
  de ventas.

README.md actualizado 08-12-25
