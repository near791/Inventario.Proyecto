const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(cors());
app.use(express.json());

//crea la conexion del backend con la base de datos desde Node.js a traves de la libreria Mysql2
const mysql = require("mysql2");
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "inventario",
    port: 3306,
});

//Al momento de levantar el server muestra si se logra o falla
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

// Vender productos a través de la gestion de un carrito de ventas
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

  // Genera una id unica para cada transaccion
  const transaccionId = `TXN-${Date.now()}-${usuarioIdNum}`;
  console.log("🔖 ID de transacción generado:", transaccionId);

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
              transaccion_id: transaccionId,
              usuario: nombreUsuario,
              productos_vendidos: ventasRealizadas,
              total_general: totalVentaGeneral,
            });

            res.json({ 
              message: "Venta realizada correctamente", 
              transaccion_id: transaccionId,
              productos_vendidos: ventasRealizadas,
              total_general: totalVentaGeneral,
              productos_stock_bajo: productosConStockBajo,
            });
          });
          return;
        }

        const item = productos[index];
        const { producto_id, cantidad, precio_unitario, subtotal, fiado } = item;

         console.log(`📦 Procesando producto ${index + 1}:`, {
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
          Fiado: Fiado ? 1 : 0
        });

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

              const esFiado = Fiado ? 1 : 0;

              // Registrar la venta CON transaccion_id
              db.query(
                `INSERT INTO ventas (
                transaccion_id, 
                usuario_id,
                usuario_nombre, 
                producto_id, 
                producto_nombre, 
                cantidad, 
                precio_unitario, 
                total, 
                Fiado
                ) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [transaccionId, usuarioIdNum, nombreUsuario, producto_id, producto.nombre, cantidad, precio_unitario, subtotal, esFiado ? 1 : 0],
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
                      stock_minimo: producto.stock_minimo,
                    });
                  }

                  console.log(`✅ Producto ${index + 1}/${productos.length} procesado:`, producto.nombre);

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

// Obtener estadísticas de ventas con filtro por mes/año
app.get("/ventas/estadisticas", (req, res) => {
  const { mes, anio } = req.query;
  console.log("📈 Obteniendo estadísticas con filtros:", { mes, anio });
  
  let filtroFecha = "";
  let filtroSubconsulta = "";
  const params = [];
  const paramsSubconsulta = [];
  
  if (mes && anio) {
    filtroFecha = "WHERE MONTH(v.fecha) = ? AND YEAR(v.fecha) = ?";
    filtroSubconsulta = "WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?";
    params.push(parseInt(mes), parseInt(anio));
    paramsSubconsulta.push(parseInt(mes), parseInt(anio));
  } else if (anio) {
    filtroFecha = "WHERE YEAR(v.fecha) = ?";
    filtroSubconsulta = "WHERE YEAR(fecha) = ?";
    params.push(parseInt(anio));
    paramsSubconsulta.push(parseInt(anio));
  }
  
  const query = `
    SELECT 
      COUNT(DISTINCT v.transaccion_id) as total_ventas,
      COALESCE(SUM(v.total), 0) as ingresos_totales,
      COALESCE(SUM(CASE 
        WHEN p.granel = 1 THEN v.cantidad 
        ELSE 0 
      END), 0) as unidades_granel,
      COALESCE(SUM(CASE 
        WHEN p.granel = 0 OR p.granel IS NULL THEN v.cantidad 
        ELSE 0 
      END), 0) as unidades_normales,
      COALESCE(AVG(venta_total.total_por_transaccion), 0) as venta_promedio
    FROM ventas v
    INNER JOIN productos p ON v.producto_id = p.id
    LEFT JOIN (
      SELECT transaccion_id, SUM(total) as total_por_transaccion
      FROM ventas
      ${filtroSubconsulta}
      GROUP BY transaccion_id
    ) venta_total ON v.transaccion_id = venta_total.transaccion_id
    ${filtroFecha}
  `;
  
  const todosLosParams = [...paramsSubconsulta, ...params];
  
  console.log("📊 Query SQL:", query);
  console.log("📊 Params:", todosLosParams);
  
  db.query(query, todosLosParams, (err, result) => {
    if (err) {
      console.error("❌ Error al obtener estadísticas:", err);
      return res.status(500).json({ message: "Error al obtener estadísticas" });
    }
    
    const estadisticas = {
      total_ventas: parseInt(result[0].total_ventas) || 0,
      ingreso_sindcto: parseFloat(result[0].ingresos_totales) || 0,
      ingresos_totales: (parseFloat(result[0].ingresos_totales)- (parseFloat(result[0].ingresos_totales) * 0.19)) || 0,
      unidades_granel: parseFloat(result[0].unidades_granel) || 0,
      unidades_normales: parseFloat(result[0].unidades_normales) || 0,
      venta_promedio: parseFloat(result[0].venta_promedio) || 0
    };
    
    console.log("✅ Estadísticas calculadas:", estadisticas);
    res.json(estadisticas);
  });
});

// Obtener productos más vendidos CON FILTRO
app.get("/ventas/productos-mas-vendidos", (req, res) => {
  const { mes, anio, limite = 10 } = req.query;
  console.log("🏆 Obteniendo productos más vendidos con filtros:", { mes, anio, limite });
  
  let filtroFecha = "";
  const params = [];
  
  if (mes && anio) {
    filtroFecha = "WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?";
    params.push(parseInt(mes), parseInt(anio));
  } else if (anio) {
    filtroFecha = "WHERE YEAR(fecha) = ?";
    params.push(parseInt(anio));
  }
  
  params.push(parseInt(limite));
  
  const query = `
    SELECT 
      producto_id,
      producto_nombre,
      SUM(cantidad) as cantidad_total,
      SUM(total) as ingresos_totales,
      COUNT(*) as num_ventas,
      AVG(precio_unitario) as precio_promedio
    FROM ventas 
    ${filtroFecha}
    GROUP BY producto_id, producto_nombre
    ORDER BY cantidad_total DESC
    LIMIT ?
  `;
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("❌ Error al obtener productos más vendidos:", err);
      return res.status(500).json({ message: "Error al obtener productos más vendidos" });
    }
    console.log("✅ Productos más vendidos obtenidos:", result.length);
    res.json(result);
  });
});

// Obtener historial de ventas con limite de 50
app.get("/ventas/historial", (req, res) => {
  const { mes, anio, limite = 50 } = req.query;
  console.log("📋 Obteniendo historial con filtros:", { mes, anio, limite });
  
  let filtroFecha = "";
  const params = [];
  
  if (mes && anio) {
    filtroFecha = "WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?";
    params.push(parseInt(mes), parseInt(anio));
  } else if (anio) {
    filtroFecha = "WHERE YEAR(fecha) = ?";
    params.push(parseInt(anio));
  }
  
  params.push(parseInt(limite));
  
  const query = `
    SELECT 
      id,
      transaccion_id,
      usuario_id,
      usuario_nombre,
      producto_id,
      producto_nombre,
      cantidad,
      precio_unitario,
      Fiado,
      total,
      DATE_FORMAT(fecha, '%d/%m/%Y %H:%i:%s') as fecha_formateada,
      fecha
    FROM ventas
    ${filtroFecha}
    ORDER BY fecha DESC
    LIMIT ?
  `;
  
  console.log("📊 Query historial:", query);
  console.log("📊 Params:", params);
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("❌ Error al obtener historial:", err);
      return res.status(500).json({ message: "Error al obtener historial" });
    }
    console.log("✅ Historial obtenido:", result.length, "registros");
    res.json(result);
  });
});

// Obtener años disponibles para el filtro
app.get("/ventas/anios-disponibles", (req, res) => {
  console.log("📅 Obteniendo años disponibles...");
  
  const query = `
    SELECT DISTINCT YEAR(fecha) as anio 
    FROM ventas 
    WHERE fecha IS NOT NULL
    ORDER BY anio DESC
  `;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error("❌ Error al obtener años:", err);
      return res.status(500).json({ message: "Error al obtener años disponibles" });
    }
    const anios = result.map(r => r.anio);
    console.log("✅ Años disponibles:", anios);
    res.json(anios);
  });
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
  const { nombre, cantidad, precio, stock_minimo, descuento, granel} = req.body;

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




//verifica que este funcionando el backend y las url de express
app.listen(3001, () => {
  console.log("🚀 Servidor corriendo en el puerto 3001");
  console.log("📌 Rutas disponibles:");
  console.log("   POST   /create");
  console.log("   POST   /login");
  console.log("   GET    /productos");
  console.log("   POST   /productos/agregar");
  console.log("   POST   /productos/vender");
  console.log("   GET    /productos/alertas");
  console.log("   GET    /productos/promociones");
  console.log("   PUT    /productos/:id");
  console.log("   DELETE /productos/:id");
  console.log("   GET    /ventas");
  console.log("   GET    /ventas/usuario/:usuario_id");
  console.log("   GET    /ventas/estadisticas (filtros: ?mes=1&anio=2024)");
  console.log("   GET    /ventas/productos-mas-vendidos (filtros: ?mes=1&anio=2024&limite=10)");
  console.log("   GET    /ventas/historial (filtros: ?mes=1&anio=2024&limite=50)");
  console.log("   GET    /ventas/anios-disponibles");
  console.log("   GET    /ventas/por-usuario (filtros: ?mes=1&anio=2024)");
  console.log("   GET    /ventas/hoy");
  console.log("   GET    /ventas/fiadas");
  console.log("   GET    /ventas/fiadas/por-usuario");
  console.log("   GET    /ventas/fiadas/estadisticas");
});