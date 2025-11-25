const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(cors());
app.use(express.json());

const mysql = require("mysql2");
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "inventario",
    port: 3306,
});

db.connect((err) => {
  if (err) {
    console.log("❌ Error de conexión a MySQL:", err);
  } else {
    console.log("✅ Conectado a MySQL correctamente");
  }
});

//Crear una cuenta
app.post("/create", async (req, res) => {
  const Usuario = req.body.Usuario;
  const Contraseña = req.body.Contraseña;

  console.log("📝 Intento de registro:", { Usuario });

  if (!Usuario || !Contraseña) {
    return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
  }

  try {
    const hash = await bcrypt.hash(Contraseña, saltRounds);

    db.query("SELECT * FROM usuarios WHERE usuario = ?", [Usuario], (err, result) => {
      if (err) {
        console.error("❌ Error SELECT:", err);
        return res.status(500).json({ message: "Error en la base de datos: " + err.message });
      }

      if (result.length > 0) {
        return res.status(409).json({ message: "Usuario no disponible" });
      }

      db.query(
        "INSERT INTO usuarios (usuario, contrasena) VALUES (?, ?)",
        [Usuario, hash],
        (err) => {
          if (err) {
            console.error("❌ Error INSERT:", err);
            return res.status(500).json({ message: "Error al crear usuario: " + err.message });
          }

          console.log("✅ Usuario registrado:", Usuario);
          res.json({ message: "Usuario registrado correctamente" });
        }
      );
    });
  } catch (error) {
    console.error("❌ Error bcrypt:", error);
    return res.status(500).json({ message: "Error al encriptar contraseña" });
  }
});

//Ingresar a la cuenta
app.post("/login", (req, res) => {
  const Usuario = req.body.Usuario;
  const Contraseña = req.body.Contraseña;
  
  console.log("🔐 Intento de login:", { Usuario });

  db.query(
    "SELECT * FROM usuarios WHERE usuario = ?",
    [Usuario],
    async (err, result) => {
      if (err) {
        console.error("❌ Error en login:", err);
        return res.status(500).json({ success: false, message: "Error en el servidor" });
      }

      if (result.length === 0) {
        return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
      }

      const hashGuardado = result[0].contrasena;
      const contraseñaCorrecta = await bcrypt.compare(Contraseña, hashGuardado);

      if (!contraseñaCorrecta) {
        return res.status(401).json({ success: false, message: "Usuario o contraseña incorrectos" });
      }

      console.log("✅ Login exitoso:", Usuario);
      return res.json({ success: true, message: "Inicio de sesión exitoso" });
    }
  );
});

// ========== RUTAS DE PRODUCTOS ==========

// Obtener todos los productos
app.get("/productos", (req, res) => {
  console.log("📋 Obteniendo lista de productos...");
  db.query("SELECT * FROM productos ORDER BY nombre", (err, result) => {
    if (err) {
      console.error("❌ Error al obtener productos:", err);
      return res.status(500).json({ message: "Error al obtener productos" });
    }
    console.log("✅ Productos obtenidos:", result.length);
    res.json(result);
  });
});

// Agregar o actualizar cantidad de producto
app.post("/productos/agregar", (req, res) => {
  const { nombre, cantidad, precio, granel } = req.body;
  
  console.log("📦 Agregando producto:", { nombre, cantidad, precio, granel });

  if (!nombre || cantidad === undefined || cantidad === null) {
    return res.status(400).json({ message: "Nombre y cantidad son obligatorios" });
  }

  const cantidadNum = parseFloat(cantidad);
  const precioNum = precio ? parseFloat(precio) : null;
  const esGranel = granel === true || granel === "true" || granel === 1;

  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    return res.status(400).json({ message: "La cantidad debe ser un número válido mayor a 0" });
  }

  // Verificar si el producto ya existe
  db.query("SELECT * FROM productos WHERE nombre = ?", [nombre], (err, result) => {
    if (err) {
      console.error("❌ Error SELECT:", err);
      return res.status(500).json({ message: "Error en la base de datos" });
    }

    if (result.length > 0) {
      // Si existe, actualizar solo cantidad
      const cantidadActual = parseFloat(result[0].cantidad);
      const nuevaCantidad = cantidadActual + cantidadNum;
      
      console.log(`📊 Sumando: ${cantidadActual} + ${cantidadNum} = ${nuevaCantidad}`);
      
      db.query(
        "UPDATE productos SET cantidad = ? WHERE nombre = ?",
        [nuevaCantidad, nombre],
        (err) => {
          if (err) {
            console.error("❌ Error UPDATE:", err);
            return res.status(500).json({ message: "Error al actualizar producto" });
          }
          console.log("✅ Producto actualizado:", nombre, "Nueva cantidad:", nuevaCantidad);
          res.json({ 
            message: "Producto actualizado correctamente", 
            nuevaCantidad, 
            productoExistente: true,
            granel: result[0].granel
          });
        }
      );
    } else {
      // Si no existe, crear nuevo
      if (!precioNum || isNaN(precioNum) || precioNum < 0) {
        return res.status(400).json({ message: "El precio es obligatorio y debe ser válido para productos nuevos" });
      }
      
      db.query(
        "INSERT INTO productos (nombre, cantidad, precio, granel) VALUES (?, ?, ?, ?)",
        [nombre, cantidadNum, precioNum, esGranel],
        (err) => {
          if (err) {
            console.error("❌ Error INSERT:", err);
            return res.status(500).json({ message: "Error al crear producto" });
          }
          console.log("✅ Producto creado:", nombre, "Cantidad:", cantidadNum, "Precio:", precioNum, "Granel:", esGranel);
          res.json({ message: "Producto creado correctamente", productoExistente: false });
        }
      );
    }
  });
});

app.listen(3001, () => {
  console.log("🚀 Servidor corriendo en el puerto 3001");
});