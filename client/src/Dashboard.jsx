import React, { useState, useEffect } from "react";
import Axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [mostrarInventario, setMostrarInventario] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [productos, setProductos] = useState([]);
  const [nombreProducto, setNombreProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [granel, setGranel] = useState(false);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [productoExistente, setProductoExistente] = useState(false);
  const [productoGranelExistente, setProductoGranelExistente] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [promociones, setPromociones] = useState([]);

  // Verificar si el usuario está logueado
  useEffect(() => {
    const usuario = sessionStorage.getItem("usuarioLogueado");
    if (!usuario) {
      window.location.href = "/";
    }
  }, []);

  // Cargar productos al abrir el panel o inventario
  useEffect(() => {
    if (mostrarPanel || mostrarInventario) {
      cargarProductos();
    }
  }, [mostrarPanel, mostrarInventario]);

  // Cargar alertas y promociones al montar el componente
  useEffect(() => {
    cargarAlertas();
    cargarPromociones();
    const intervalo = setInterval(() => {
      cargarAlertas();
      cargarPromociones();
    }, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(intervalo);
  }, []);

  const cargarProductos = () => {
    Axios.get("http://localhost:3001/productos")
      .then((response) => {
        console.log("✅ Productos cargados:", response.data);
        setProductos(response.data);
        setProductosFiltrados(response.data);
      })
      .catch((error) => {
        console.error("❌ Error al cargar productos:", error);
        alert("Error al cargar productos. Verifica que el servidor esté corriendo.");
      });
  };

  const cargarAlertas = () => {
    Axios.get("http://localhost:3001/productos/alertas")
      .then((response) => {
        console.log("🚨 Alertas cargadas:", response.data);
        setAlertas(response.data);
      })
      .catch((error) => {
        console.error("❌ Error al cargar alertas:", error);
      });
  };

  const cargarPromociones = () => {
    Axios.get("http://localhost:3001/productos/promociones")
      .then((response) => {
        console.log("🎉 Promociones cargadas:", response.data);
        setPromociones(response.data);
      })
      .catch((error) => {
        console.error("❌ Error al cargar promociones:", error);
      });
  };

  const filtrarProductos = (texto) => {
    setNombreProducto(texto);
    setPrecio("");
    
    const productoCoincide = productos.some(
      (p) => p.nombre.toLowerCase() === texto.toLowerCase()
    );
    setProductoExistente(productoCoincide);
    
    if (texto === "") {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter((p) =>
        p.nombre.toLowerCase().includes(texto.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    }
  };

  const seleccionarProducto = (producto) => {
    setNombreProducto(producto.nombre);
    setMostrarSugerencias(false);
    setProductoExistente(true);
    setPrecio("");
    setProductoGranelExistente(producto.granel);
    setGranel(producto.granel);
  };

  const agregarProducto = () => {
    if (!nombreProducto || !cantidad) {
      setMensaje("⚠️ Por favor completa nombre y cantidad");
      return;
    }

    if (!productoExistente && !precio) {
      setMensaje("⚠️ El precio es obligatorio para productos nuevos");
      return;
    }

    Axios.post("http://localhost:3001/productos/agregar", {
      nombre: nombreProducto,
      cantidad: parseFloat(cantidad),
      precio: precio ? parseFloat(precio) : null,
      granel: granel,
    })
      .then((response) => {
        setMensaje("✅ " + response.data.message);
        setNombreProducto("");
        setCantidad("");
        setPrecio("");
        setGranel(false);
        setProductoExistente(false);
        setProductoGranelExistente(false);
        cargarProductos();
      })
      .catch((error) => {
        setMensaje("❌ " + (error?.response?.data?.message || "Error al agregar producto"));
      });
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem("usuarioLogueado");
    window.location.href = "/";
  };

  const abrirPanel = () => {
    console.log("🔵 Abriendo panel agregar productos");
    setMostrarPanel(true);
    setNombreProducto("");
    setCantidad("");
    setPrecio("");
    setGranel(false);
    setProductoExistente(false);
    setProductoGranelExistente(false);
    setMensaje("");
  };

  const abrirInventario = () => {
    console.log("📋 Abriendo inventario completo");
    setMostrarInventario(true);
  };

  const editarProducto = (producto) => {
    console.log("✏️ Editando producto:", producto);
    setProductoEditando(producto);
  };

  const guardarEdicion = () => {
    if (!productoEditando) return;

    console.log("💾 Guardando edición:", productoEditando);

    Axios.put(`http://localhost:3001/productos/${productoEditando.id}`, productoEditando)
      .then((response) => {
        alert("✅ " + response.data.message);
        setProductoEditando(null);
        cargarProductos();
        cargarAlertas();
        cargarPromociones();
      })
      .catch((error) => {
        alert("❌ " + (error?.response?.data?.message || "Error al editar producto"));
      });
  };

  const eliminarProducto = (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;

    console.log("🗑️ Eliminando producto ID:", id);

    Axios.delete(`http://localhost:3001/productos/${id}`)
      .then((response) => {
        alert("✅ " + response.data.message);
        cargarProductos();
        cargarAlertas();
        cargarPromociones();
      })
      .catch((error) => {
        alert("❌ " + (error?.response?.data?.message || "Error al eliminar producto"));
      });
  };

  const toggleNotificaciones = () => {
    console.log("🔔 Toggle notificaciones. Estado actual:", mostrarNotificaciones);
    setMostrarNotificaciones(!mostrarNotificaciones);
  };

  return (
    <div className="dashboard">
      {/* Botón de Notificaciones */}
      <button 
        className="btn-notificaciones" 
        onClick={toggleNotificaciones}
      >
        🔔 Notificaciones
        {(alertas.length + promociones.length) > 0 && (
          <span className="badge">{alertas.length + promociones.length}</span>
        )}
      </button>

      {/* Botón Cerrar Sesión */}
      <button className="btn-cerrar-sesion" onClick={cerrarSesion}>
        Cerrar Sesión 🚪
      </button>

      {/* Panel de Notificaciones */}
      {mostrarNotificaciones && (
        <div className="panel-notificaciones">
          <h4>🚨 Alertas de Stock Bajo ({alertas.length})</h4>
          {alertas.length === 0 ? (
            <p style={{color: '#999', fontSize: '14px'}}>✅ No hay alertas de stock</p>
          ) : (
            alertas.map((p) => (
              <div key={p.id} className="notificacion-item alerta">
                <strong>{p.nombre}</strong>
                Stock actual: {p.granel ? `${p.cantidad} kg` : `${p.cantidad} unidades`}
                <br />
                Mínimo requerido: {p.stock_minimo}
              </div>
            ))
          )}
          
          <h4>🎉 Productos en Promoción ({promociones.length})</h4>
          {promociones.length === 0 ? (
            <p style={{color: '#999', fontSize: '14px'}}>No hay promociones activas</p>
          ) : (
            promociones.map((p) => (
              <div key={p.id} className="notificacion-item promocion">
                <strong>{p.nombre}</strong>
                Descuento: {p.descuento}% OFF
                <br />
                Precio con descuento: ${(p.precio * (1 - p.descuento/100)).toFixed(2)}
              </div>
            ))
          )}
        </div>
      )}

      <h2>📦 Inventario - Panel Principal</h2>
      
      <div className="opciones">
        <button className="btn-opcion" onClick={abrirPanel}>
          Agregar Productos ➕
        </button>
        <button className="btn-opcion" onClick={abrirInventario}>
          Ver Inventario 📋
        </button>
        <button className="btn-opcion">Vender Productos 💸</button>
        <button className="btn-opcion">Datos 📊</button>
      </div>

      {/* Panel Agregar Productos */}
      {mostrarPanel && (
        <div className="panel-overlay" onClick={() => setMostrarPanel(false)}>
          <div className="panel-agregar" onClick={(e) => e.stopPropagation()}>
            <h3>Agregar Producto</h3>
            
            <label>Nombre del Producto:</label>
            <div className="input-con-sugerencias">
              <input
                type="text"
                value={nombreProducto}
                onChange={(e) => filtrarProductos(e.target.value)}
                onFocus={() => setMostrarSugerencias(true)}
                placeholder="Busca o escribe un producto..."
              />
              {mostrarSugerencias && productosFiltrados.length > 0 && (
                <div className="sugerencias">
                  {productosFiltrados.map((producto) => (
                    <div
                      key={producto.id}
                      className="sugerencia-item"
                      onClick={() => seleccionarProducto(producto)}
                    >
                      {producto.nombre} (Stock: {producto.granel ? `${producto.cantidad} kg` : producto.cantidad})
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {nombreProducto && (
              <p style={{ fontSize: '12px', color: productoExistente ? '#27ae60' : '#e67e22', marginTop: '5px' }}>
                {productoExistente ? '✓ Producto existente - se sumará al stock' : '✨ Producto nuevo - se creará'}
              </p>
            )}

            <label>Cantidad a Agregar{productoGranelExistente ? ' (kg)' : ''}:</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder={productoGranelExistente ? "Ej: 0.5" : "Ingresa la cantidad"}
              min="0"
              step={productoGranelExistente ? "0.01" : "1"}
            />

            {!productoExistente && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', marginTop: '15px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={granel}
                    onChange={(e) => setGranel(e.target.checked)}
                    style={{ marginRight: '8px', width: 'auto', cursor: 'pointer' }}
                  />
                  ¿Es producto a granel? (se mide en kg)
                </label>

                <label>Precio por {granel ? 'kg' : 'unidad'}:</label>
                <input
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="Ingresa el precio"
                  min="0"
                  step="0.01"
                />
              </>
            )}

            <div className="botones-panel">
              <button className="btn-confirmar" onClick={agregarProducto}>
                Agregar
              </button>
              <button className="btn-cancelar" onClick={() => setMostrarPanel(false)}>
                Cancelar
              </button>
            </div>

            {mensaje && <p className="mensaje-panel">{mensaje}</p>}
          </div>
        </div>
      )}

      {/* Panel de Inventario */}
      {mostrarInventario && (
        <div className="panel-overlay" onClick={() => setMostrarInventario(false)}>
          <div className="panel-inventario" onClick={(e) => e.stopPropagation()}>
            <h3>📋 Inventario Completo</h3>
            <p style={{color: '#666', marginBottom: '15px'}}>
              Total de productos: <strong>{productos.length}</strong>
            </p>
            <div className="tabla-container">
              <table className="tabla-inventario">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cantidad</th>
                    <th>Stock Mín</th>
                    <th>Precio</th>
                    <th>Descuento</th>
                    <th>Tipo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                        No hay productos en el inventario
                      </td>
                    </tr>
                  ) : (
                    productos.map((producto) => (
                      <tr 
                        key={producto.id}
                        className={producto.cantidad <= producto.stock_minimo ? 'stock-bajo' : ''}
                      >
                        <td>{producto.nombre}</td>
                        <td>{producto.granel ? `${producto.cantidad} kg` : producto.cantidad}</td>
                        <td>{producto.stock_minimo}</td>
                        <td>${producto.precio}</td>
                        <td>{producto.descuento}%</td>
                        <td>{producto.granel ? '🔢 Granel' : '📦 Unidad'}</td>
                        <td>
                          <button 
                            className="btn-editar" 
                            onClick={() => editarProducto(producto)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-eliminar" 
                            onClick={() => eliminarProducto(producto.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button className="btn-cancelar" onClick={() => setMostrarInventario(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Panel de Edición */}
      {productoEditando && (
        <div className="panel-overlay">
          <div className="panel-agregar">
            <h3>✏️ Editar Producto</h3>
            
            <label>Nombre:</label>
            <input
              type="text"
              value={productoEditando.nombre}
              onChange={(e) => setProductoEditando({...productoEditando, nombre: e.target.value})}
            />
            
            <label>Cantidad:</label>
            <input
              type="number"
              value={productoEditando.cantidad}
              onChange={(e) => setProductoEditando({...productoEditando, cantidad: e.target.value})}
              step={productoEditando.granel ? "0.01" : "1"}
            />
            
            <label>Stock Mínimo:</label>
            <input
              type="number"
              value={productoEditando.stock_minimo}
              onChange={(e) => setProductoEditando({...productoEditando, stock_minimo: e.target.value})}
            />
            
            <label>Precio:</label>
            <input
              type="number"
              value={productoEditando.precio}
              onChange={(e) => setProductoEditando({...productoEditando, precio: e.target.value})}
              step="0.01"
            />
            
            <label>Descuento (%):</label>
            <input
              type="number"
              value={productoEditando.descuento}
              onChange={(e) => setProductoEditando({...productoEditando, descuento: e.target.value})}
              min="0"
              max="100"
              step="0.01"
            />

            <div className="botones-panel">
              <button className="btn-confirmar" onClick={guardarEdicion}>
                Guardar
              </button>
              <button className="btn-cancelar" onClick={() => setProductoEditando(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;