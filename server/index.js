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
      return res.json({ 
        success: true, 
        message: "Inicio de sesión exitoso",
        usuario_id: result[0].id,
        usuario: result[0].usuario
      });
    }
  );
});

// Obtener lista de los productos
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

// VENDER PRODUCTOS CON CARRITO
app.post("/productos/vender", (req, res) => {
  const { usuario_id, productos } = req.body;
  
  console.log("💰 Vendiendo productos del carrito:", { usuario_id, cantidad_productos: productos.length });

  if (!usuario_id) {
    return res.status(400).json({ message: "Usuario no identificado. Por favor inicia sesión nuevamente." });
  }

  if (!productos || productos.length === 0) {
    return res.status(400).json({ message: "El carrito está vacío" });
  }

  const usuarioIdNum = parseInt(usuario_id);
  if (isNaN(usuarioIdNum)) {
    return res.status(400).json({ message: "ID de usuario inválido" });
  }

  // Obtener el nombre del usuario
  db.query("SELECT usuario FROM usuarios WHERE id = ?", [usuarioIdNum], (err, usuarioResult) => {
    if (err) {
      console.error("❌ Error SELECT usuario:", err);
      return res.status(500).json({ message: "Error al verificar usuario" });
    }

    if (usuarioResult.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const nombreUsuario = usuarioResult[0].usuario;

    // Iniciar transacción
    db.beginTransaction((err) => {
      if (err) {
        console.error("❌ Error al iniciar transacción:", err);
        return res.status(500).json({ message: "Error al procesar la venta" });
      }

      let totalVentaGeneral = 0;
      let ventasRealizadas = 0;
      let productosConStockBajo = [];

      // Función recursiva para procesar cada producto del carrito
      const procesarProducto = (index) => {
        if (index >= productos.length) {
          // Todos los productos procesados, confirmar transacción
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error("❌ Error al confirmar transacción:", err);
                res.status(500).json({ message: "Error al confirmar la venta" });
              });
            }

            console.log("✅ Venta múltiple registrada exitosamente:", {
              usuario: nombreUsuario,
              productos_vendidos: ventasRealizadas,
              total_general: totalVentaGeneral
            });

            res.json({ 
              message: "Venta realizada correctamente", 
              productos_vendidos: ventasRealizadas,
              total_general: totalVentaGeneral,
              productos_stock_bajo: productosConStockBajo
            });
          });
          return;
        }

        const item = productos[index];
        const { producto_id, cantidad, precio_unitario, subtotal } = item;

        // Verificar producto y stock
        db.query("SELECT * FROM productos WHERE id = ?", [producto_id], (err, result) => {
          if (err) {
            return db.rollback(() => {
              console.error("❌ Error SELECT producto:", err);
              res.status(500).json({ message: "Error al verificar producto" });
            });
          }

          if (result.length === 0) {
            return db.rollback(() => {
              res.status(404).json({ message: `Producto ID ${producto_id} no encontrado` });
            });
          }

          const producto = result[0];
          const cantidadActual = parseFloat(producto.cantidad);
          
          if (cantidadActual < cantidad) {
            return db.rollback(() => {
              res.status(400).json({ 
                message: `Stock insuficiente para ${producto.nombre}. Solo hay ${cantidadActual} disponibles.` 
              });
            });
          }

          const nuevaCantidad = cantidadActual - cantidad;

          // Actualizar stock del producto
          db.query(
            "UPDATE productos SET cantidad = ? WHERE id = ?",
            [nuevaCantidad, producto_id],
            (err) => {
              if (err) {
                return db.rollback(() => {
                  console.error("❌ Error UPDATE productos:", err);
                  res.status(500).json({ message: "Error al actualizar el stock" });
                });
              }

              // Registrar la venta
              db.query(
                `INSERT INTO ventas (usuario_id, usuario_nombre, producto_id, producto_nombre, cantidad, precio_unitario, total) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [usuarioIdNum, nombreUsuario, producto_id, producto.nombre, cantidad, precio_unitario, subtotal],
                (err) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error("❌ Error INSERT ventas:", err);
                      res.status(500).json({ message: "Error al registrar la venta" });
                    });
                  }

                  totalVentaGeneral += subtotal;
                  ventasRealizadas++;

                  // Verificar si quedó stock bajo
                  if (nuevaCantidad <= producto.stock_minimo) {
                    productosConStockBajo.push({
                      nombre: producto.nombre,
                      cantidad_actual: nuevaCantidad,
                      stock_minimo: producto.stock_minimo
                    });
                  }

                  // Procesar siguiente producto
                  procesarProducto(index + 1);
                }
              );
            }
          );
        });
      };

      // Iniciar procesamiento del primer producto
      procesarProducto(0);
    });
  });
});

// Obtener historial de ventas
app.get("/ventas", (req, res) => {
  console.log("📊 Obteniendo historial de ventas...");
  db.query(
    "SELECT * FROM ventas ORDER BY fecha DESC",
    (err, result) => {
      if (err) {
        console.error("❌ Error al obtener ventas:", err);
        return res.status(500).json({ message: "Error al obtener el historial de ventas" });
      }
      console.log("✅ Ventas obtenidas:", result.length);
      res.json(result);
    }
  );
});

// Obtener ventas por usuario
app.get("/ventas/usuario/:usuario_id", (req, res) => {
  const { usuario_id } = req.params;
  console.log("📊 Obteniendo ventas del usuario:", usuario_id);
  
  db.query(
    "SELECT * FROM ventas WHERE usuario_id = ? ORDER BY fecha DESC",
    [usuario_id],
    (err, result) => {
      if (err) {
        console.error("❌ Error al obtener ventas:", err);
        return res.status(500).json({ message: "Error al obtener las ventas" });
      }
      console.log("✅ Ventas del usuario obtenidas:", result.length);
      res.json(result);
    }
  );
});

// Obtener estadísticas de ventas
app.get("/ventas/estadisticas", (req, res) => {
  console.log("📈 Obteniendo estadísticas de ventas...");
  
  db.query(
    `SELECT 
      COUNT(*) as total_ventas,
      SUM(total) as ingresos_totales,
      SUM(cantidad) as unidades_vendidas,
      AVG(total) as venta_promedio
    FROM ventas`,
    (err, result) => {
      if (err) {
        console.error("❌ Error al obtener estadísticas:", err);
        return res.status(500).json({ message: "Error al obtener estadísticas" });
      }
      console.log("✅ Estadísticas obtenidas");
      res.json(result[0]);
    }
  );
});

// Obtener productos más vendidos
app.get("/ventas/productos-mas-vendidos", (req, res) => {
  console.log("🏆 Obteniendo productos más vendidos...");
  
  db.query(
    `SELECT 
      producto_nombre,
      SUM(cantidad) as cantidad_total,
      SUM(total) as ingresos_totales,
      COUNT(*) as num_ventas
    FROM ventas 
    GROUP BY producto_id, producto_nombre
    ORDER BY cantidad_total DESC
    LIMIT 10`,
    (err, result) => {
      if (err) {
        console.error("❌ Error al obtener productos más vendidos:", err);
        return res.status(500).json({ message: "Error al obtener productos más vendidos" });
      }
      console.log("✅ Productos más vendidos obtenidos:", result.length);
      res.json(result);
    }
  );
});

// Obtener productos con stock bajo (alertas)
app.get("/productos/alertas", (req, res) => {
  console.log("🚨 [RUTA ALERTAS] Obteniendo alertas de stock...");
  db.query(
    "SELECT * FROM productos WHERE cantidad <= stock_minimo ORDER BY cantidad ASC",
    (err, result) => {
      if (err) {
        console.error("❌ Error al obtener alertas:", err);
        return res.status(500).json({ message: "Error al obtener alertas" });
      }
      console.log("✅ Alertas obtenidas:", result.length);
      res.json(result);
    }
  );
});

// Obtener productos en promoción
app.get("/productos/promociones", (req, res) => {
  console.log("🎉 [RUTA PROMOCIONES] Obteniendo productos en promoción...");
  db.query(
    "SELECT * FROM productos WHERE descuento > 0 ORDER BY descuento DESC",
    (err, result) => {
      if (err) {
        console.error("❌ Error al obtener promociones:", err);
        return res.status(500).json({ message: "Error al obtener promociones" });
      }
      console.log("✅ Promociones obtenidas:", result.length);
      res.json(result);
    }
  );
});

// Editar un producto
app.put("/productos/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, cantidad, precio, stock_minimo, descuento, granel } = req.body;

  console.log("✏️ [RUTA PUT] Editando producto ID:", id, req.body);

  // Si solo se envía descuento (para terminar promoción)
  if (descuento !== undefined && Object.keys(req.body).length === 1) {
    db.query(
      "UPDATE productos SET descuento = ? WHERE id = ?",
      [parseFloat(descuento), id],
      (err) => {
        if (err) {
          console.error("❌ Error UPDATE descuento:", err);
          return res.status(500).json({ message: "Error al actualizar descuento" });
        }
        console.log("✅ Descuento actualizado:", id);
        res.json({ message: "Descuento actualizado correctamente" });
      }
    );
    return;
  }

  // Edición completa del producto
  if (!nombre || cantidad === undefined || !precio) {
    return res.status(400).json({ message: "Nombre, cantidad y precio son obligatorios" });
  }

  const cantidadNum = parseFloat(cantidad);
  const precioNum = parseFloat(precio);
  const stockMin = parseInt(stock_minimo) || 5;
  const descuentoNum = parseFloat(descuento) || 0;
  const esGranel = granel === true || granel === 1;

  db.query(
    "UPDATE productos SET nombre = ?, cantidad = ?, precio = ?, stock_minimo = ?, descuento = ?, granel = ? WHERE id = ?",
    [nombre, cantidadNum, precioNum, stockMin, descuentoNum, esGranel, id],
    (err) => {
      if (err) {
        console.error("❌ Error UPDATE:", err);
        return res.status(500).json({ message: "Error al actualizar producto" });
      }
      console.log("✅ Producto actualizado correctamente:", id);
      res.json({ message: "Producto actualizado correctamente" });
    }
  );
});

// Eliminar un producto
app.delete("/productos/:id", (req, res) => {
  const { id } = req.params;

  console.log("🗑️ [RUTA DELETE] Eliminando producto ID:", id);

  db.query("DELETE FROM productos WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("❌ Error DELETE:", err);
      return res.status(500).json({ message: "Error al eliminar producto" });
    }
    console.log("✅ Producto eliminado correctamente:", id);
    res.json({ message: "Producto eliminado correctamente" });
  });
});

app.listen(3001, () => {
  console.log("🚀 Servidor corriendo en el puerto 3001");
  console.log("📌 Rutas disponibles:");
  console.log("   POST /create");
  console.log("   POST /login");
  console.log("   GET  /productos");
  console.log("   POST /productos/agregar");
  console.log("   POST /productos/vender");
  console.log("   GET  /productos/alertas");
  console.log("   GET  /productos/promociones");
  console.log("   PUT  /productos/:id");
  console.log("   DELETE /productos/:id");
  console.log("   GET  /ventas");
  console.log("   GET  /ventas/usuario/:usuario_id");
  console.log("   GET  /ventas/estadisticas");
  console.log("   GET  /ventas/productos-mas-vendidos");
});