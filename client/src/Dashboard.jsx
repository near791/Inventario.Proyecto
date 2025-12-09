import React, { useState, useEffect } from "react";
import Axios from "axios";
import "./Dashboard.css";
import Vender from './Vender';
import Toast from './Toast';
import ModalConfirmacion from './ModalConfirmacion';

function Dashboard() {
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [mostrarInventario, setMostrarInventario] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarVenta, setMostrarVenta] = useState(false);
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
  
  //Estados para mostrar datos
  const [mostrarDatos, setMostrarDatos] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [filtros, setFiltros] = useState({
  mes: null,
  anio: new Date().getFullYear()
  });
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  // Estado para usuario
  const [usuarioId, setUsuarioId] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState("");

  // Estados para toasts y modales
  const [toasts, setToasts] = useState([]);
  const [modalConfirmacion, setModalConfirmacion] = useState(null);

  //array de meses para mostrar datos
  const meses = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' }
  ];

  // Verificar si el usuario está logueado
useEffect(() => {
  const usuario = sessionStorage.getItem("usuarioLogueado");
  const id = sessionStorage.getItem("usuarioId");
  
  console.log("🔍 Verificando sesión:", { usuario, id, tipo: typeof id });
  
  if (!usuario || !id) {
    console.error("❌ No hay sesión válida");
    window.location.href = "/";
  } else {
    setNombreUsuario(usuario);
    const idNum = parseInt(id);
    setUsuarioId(idNum);
    console.log("✅ Usuario cargado:", { usuario, id: idNum });
  }
}, []);

  // Cargar productos al abrir el panel o inventario
  useEffect(() => {
    if (mostrarPanel || mostrarInventario || mostrarVenta) {
      cargarProductos();
    }
  }, [mostrarPanel, mostrarInventario, mostrarVenta]);

  //cargar años para mostrar
  useEffect(() => {
    cargarAniosDisponibles();
  }, []);

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (mostrarDatos) {
      cargarEstadisticas();
    }
    }, [filtros, mostrarDatos]);

  // Cargar alertas y promociones al montar el componente
  useEffect(() => {
    cargarAlertas();
    cargarPromociones();
    const intervalo = setInterval(() => {
      cargarAlertas();
      cargarPromociones();
    }, 30000);
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

  const cargarAniosDisponibles = async () => {
    try {
      const resp = await Axios.get("http://localhost:3001/ventas/anios-disponibles");
      console.log("📅 Años disponibles:", resp.data);
      setAniosDisponibles(resp.data);
    } catch (error) {
      console.error("❌ Error al cargar años:", error);
    }};

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
      mostrarToast("Por favor completa nombre y cantidad", "advertencia");
      return;
    }

    if (!productoExistente && !precio) {
      mostrarToast("El precio es obligatorio para productos nuevos", "advertencia");
      return;
    }

    Axios.post("http://localhost:3001/productos/agregar", {
      nombre: nombreProducto,
      cantidad: parseFloat(cantidad),
      precio: precio ? parseFloat(precio) : null,
      granel: granel,
    })
      .then((response) => {
        mostrarToast(response.data.message, "exito");
        setNombreProducto("");
        setCantidad("");
        setPrecio("");
        setGranel(false);
        setProductoExistente(false);
        setProductoGranelExistente(false);
        setMostrarPanel(false);
        cargarProductos();
      })
      .catch((error) => {
        mostrarToast(error?.response?.data?.message || "Error al agregar producto", "error");
      });
  };

  const abrirVenta = () => {
    console.log("💸 Abriendo panel de venta completo");
    setMostrarVenta(true);
  };

  const cerrarVenta = () => {
    console.log("💸 Cerrando panel de venta");
    setMostrarVenta(false);
    cargarProductos();
    cargarAlertas();
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem("usuarioLogueado");
    sessionStorage.removeItem("usuarioId");
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

  const abrirDatos = () => {
    console.log("📊 Abriendo panel de datos");
    setMostrarDatos(true);
    cargarEstadisticas();
  };

  const editarProducto = (producto) => {
    console.log("✏️ Editando producto:", producto);
    setProductoEditando(producto);
  };

  const guardarEdicion = () => {
    if (!productoEditando) return;

    Axios.put(`http://localhost:3001/productos/${productoEditando.id}`, productoEditando)
      .then((response) => {
        mostrarToast("Producto actualizado correctamente", "exito");
        setProductoEditando(null);
        cargarProductos();
        cargarAlertas();
        cargarPromociones();
      })
      .catch((error) => {
        mostrarToast(error?.response?.data?.message || "Error al editar producto", "error");
      });
  };

  const eliminarProducto = async (id) => {
    const confirmar = await mostrarConfirmacion("¿Estás seguro de eliminar este producto?");
    
    if (!confirmar) return;

    Axios.delete(`http://localhost:3001/productos/${id}`)
      .then((response) => {
        mostrarToast("Producto eliminado correctamente", "exito");
        cargarProductos();
        cargarAlertas();
        cargarPromociones();
      })
      .catch((error) => {
        mostrarToast(error?.response?.data?.message || "Error al eliminar producto", "error");
      });
  };

  const terminarPromocion = async (id, nombreProducto) => {
    const confirmar = await mostrarConfirmacion(`¿Terminar la promoción de ${nombreProducto}?`);
    
    if (!confirmar) return;

    Axios.put(`http://localhost:3001/productos/${id}`, {
      descuento: 0
    })
      .then((response) => {
        mostrarToast("Promoción terminada correctamente", "exito");
        cargarProductos();
        cargarAlertas();
        cargarPromociones();
      })
      .catch((error) => {
        mostrarToast(error?.response?.data?.message || "Error al terminar promoción", "error");
      });
  };

  const toggleNotificaciones = () => {
    console.log("🔔 Toggle notificaciones. Estado actual:", mostrarNotificaciones);
    setMostrarNotificaciones(!mostrarNotificaciones);
  };

  // Función para mostrar toast
  const mostrarToast = (mensaje, tipo = 'info', duracion = 3000) => {
  const id = Date.now();
  setToasts(prev => [...prev, { id, mensaje, tipo, duracion }]);
  };

// Función para cerrar toast
  const cerrarToast = (id) => {
  setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Función para mostrar modal de confirmación
  const mostrarConfirmacion = (mensaje) => {
    return new Promise((resolve) => {
      setModalConfirmacion({
        mensaje,
        onConfirmar: () => {
          setModalConfirmacion(null);
          resolve(true);
        },
        onCancelar: () => {
          setModalConfirmacion(null);
          resolve(false);
        }
      });
    });
  };

  //Funciones para mostrar datos
  const cargarEstadisticas = async () => {
    try {
      setCargandoDatos(true);
      
      const params = new URLSearchParams();
      if (filtros.mes) params.append('mes', filtros.mes);
      if (filtros.anio) params.append('anio', filtros.anio);
      
      // Cargar estadísticas generales
      const respStats = await Axios.get(`http://localhost:3001/ventas/estadisticas?${params}`);
      console.log("📊 Estadísticas recibidas del backend:", respStats.data);
      
      const statsLimpias = {
        total_ventas: parseInt(respStats.data.total_ventas) || 0,
        ingreso_sindcto: parseFloat(respStats.data.ingreso_sindcto) || 0,
        ingresos_totales: parseFloat(respStats.data.ingresos_totales) || 0,
        unidades_granel: parseFloat(respStats.data.unidades_granel) || 0,
        unidades_normales: parseFloat(respStats.data.unidades_normales) || 0,
        venta_promedio: parseFloat(respStats.data.venta_promedio) || 0
      };
      
      console.log("📊 Estadísticas limpias para setState:", statsLimpias);
      setEstadisticas(statsLimpias);
      
      // Cargar productos más vendidos
      const respProductos = await Axios.get(`http://localhost:3001/ventas/productos-mas-vendidos?${params}&limite=10`);
      console.log("🏆 Productos más vendidos:", respProductos.data);
      setProductosMasVendidos(respProductos.data);
      
      // Cargar historial de ventas
      const respHistorial = await Axios.get(`http://localhost:3001/ventas/historial?${params}&limite=50`);
      console.log("🕐 Historial de ventas:", respHistorial.data);
      setVentasRecientes(respHistorial.data);
      
      setCargandoDatos(false);
    } catch (error) {
      console.error("❌ Error al cargar datos:", error);
      mostrarToast("Error al cargar estadísticas", "error");

      setEstadisticas({
        total_ventas: 0,
        ingreso_sindcto: 0,
        ingresos_totales: 0,
        unidades_granel: 0,
        unidades_normales: 0,
        venta_promedio: 0
      });
      setProductosMasVendidos([]);
      setVentasRecientes([]);
      
      setCargandoDatos(false);
    }
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
          <button 
            className="btn-cerrar-notificaciones" 
            onClick={() => setMostrarNotificaciones(false)}
            title="Cerrar notificaciones"
          >
            ✕
          </button>
          <h4>🚨 Alertas de Stock Bajo ({alertas.length})</h4>
          {alertas.length === 0 ? (
            <p style={{color: '#999', fontSize: '14px'}}>✅ No hay alertas de stock</p>
          ) : (
            alertas.map((p) => (
              <div key={p.id} className="notificacion-item alerta">
                <strong>{p.nombre}</strong>
                Stock actual: {p.granel ? `${p.cantidad} kg` : `${p.cantidad} unidades`}
                <br />
                Mínimo requerido: {p.granel ? `${p.stock_minimo} kg` : `${p.stock_minimo} unidades`}
              </div>
            ))
          )}
          
          <h4>🎉 Productos en Promoción ({promociones.length})</h4>
          {promociones.length === 0 ? (
            <p style={{color: '#999', fontSize: '14px'}}>No hay promociones activas</p>
          ) : (
            promociones.map((p) => (
              <div key={p.id} className="notificacion-item promocion">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div style={{flex: 1}}>
                    <strong>{p.nombre}</strong>
                    Descuento: {p.descuento}% OFF
                    <br />
                    Precio con descuento: ${(p.precio * (1 - p.descuento/100)).toFixed(2)}
                  </div>
                  <button 
                    className="btn-terminar-promo"
                    onClick={() => terminarPromocion(p.id, p.nombre)}
                    title="Terminar promoción"
                  >
                    Terminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <h2>Mi Gestor de Inventario</h2>
      {nombreUsuario && <p className="usuario-actual">👤 Usuario: {nombreUsuario}</p>}
      
      <div className="opciones">
        <button className="btn-opcion" onClick={abrirPanel}>
          Agregar Productos ➕ 
        </button>
        <button className="btn-opcion" onClick={abrirInventario}>
          Ver Inventario 📋
        </button>
        <button className="btn-opcion" onClick={abrirVenta}>
          Vender Productos 💸
        </button>
        <button className="btn-opcion" onClick={abrirDatos}>Datos 📊</button>
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

      {/* Panel de Venta */}
      {mostrarVenta && (
        <div className="panel-overlay" onClick={(e) => {
          // Solo cerrar si se hace clic en el overlay, no en el panel
          if (e.target === e.currentTarget) {
            cerrarVenta();
          }
        }}>
          <div className="panel-venta-fullscreen" onClick={(e) => e.stopPropagation()}>
            <Vender 
              onCerrar={cerrarVenta}
              usuarioId={usuarioId}
              nombreUsuario={nombreUsuario}
            />
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

        {/* Toasts */}
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              mensaje={toast.mensaje}
              tipo={toast.tipo}
              duracion={toast.duracion}
              onClose={() => cerrarToast(toast.id)}
            />
          ))}

          {/* Modal de confirmación */}
          {modalConfirmacion && (
            <ModalConfirmacion
              mensaje={modalConfirmacion.mensaje}
              onConfirmar={modalConfirmacion.onConfirmar}
              onCancelar={modalConfirmacion.onCancelar}
            />
          )}
          {/* Panel de Datos */}
          {mostrarDatos && (
            <div className="panel-overlay" onClick={() => setMostrarDatos(false)}>
              <div className="panel-datos" onClick={(e) => e.stopPropagation()}>
                <h3>📊 Panel de Datos y Estadísticas</h3>
                
                {/* Filtros */}
                <div className="filtros-contenedor">
                  <div className="filtro-grupo">
                    <label>Año:</label>
                    <select 
                      value={filtros.anio || ''} 
                      onChange={(e) => setFiltros({...filtros, anio: e.target.value})}
                    >
                      <option value="">Todos</option>
                      {aniosDisponibles.map(anio => (
                        <option key={anio} value={anio}>{anio}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="filtro-grupo">
                    <label>Mes:</label>
                    <select 
                      value={filtros.mes || ''} 
                      onChange={(e) => setFiltros({...filtros, mes: e.target.value})}
                    >
                      <option value="">Todos</option>
                      {meses.map(mes => (
                        <option key={mes.valor} value={mes.valor}>{mes.nombre}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    className="btn-limpiar-filtros"
                    onClick={() => setFiltros({ mes: null, anio: new Date().getFullYear() })}
                  >
                    Limpiar filtros
                  </button>
                </div>

                {cargandoDatos ? (
                  <div className="cargando-datos">
                    <p>⏳ Cargando datos...</p>
                  </div>
                ) : (
                  <>
                    {/* Estadísticas Generales */}
                    {estadisticas && (
                      <div className="estadisticas-grid">
                        <div className="estadistica-card">
                          <div className="estadistica-icono">📦</div>
                          <div className="estadistica-info">
                            <h4>Total Ventas</h4>
                            <p className="estadistica-valor">{estadisticas.total_ventas || 0}</p>
                          </div>
                        </div>
                        
                        <div className="estadistica-card ingresos-card">
                          <div className="estadistica-info">
                            <h4>💰Ingresos</h4>
                            <div className="ingresos-desglose">
                              <div className="ingresos-item">
                                <span className="ingresos-label">Ingreso Total - IVA</span>
                                <span className="estadistica-valor">
                                  ${(estadisticas.ingresos_totales || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="ingresos-item">
                                <span className="ingresos-label">Ingreso Total</span>
                                <span className="estadistica-valor">
                                  ${(estadisticas.ingreso_sindcto || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="estadistica-card unidades-card">
                          <div className="estadistica-icono">📊</div>
                          <div className="estadistica-info">
                            <h4>Unidades Vendidas</h4>
                            <div className="unidades-desglose">
                              <div className="unidad-item">
                                <span className="unidad-label">🔢 Granel:</span>
                                <span className="unidad-valor">
                                  {(estadisticas.unidades_granel || 0).toFixed(2)} kg
                                </span>
                              </div>
                              <div className="unidad-item">
                                <span className="unidad-label">📦 Unidad:</span>
                                <span className="unidad-valor">
                                  {(estadisticas.unidades_normales || 0).toFixed(0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="estadistica-card">
                          <div className="estadistica-icono">💵</div>
                          <div className="estadistica-info">
                            <h4>Venta Promedio</h4>
                            <p className="estadistica-valor">
                              ${(estadisticas.venta_promedio || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Productos Más Vendidos */}
                    <div className="seccion-datos">
                      <h4>🏆 Top 10 Productos Más Vendidos</h4>
                      {productosMasVendidos.length === 0 ? (
                        <p className="sin-datos">No hay datos de ventas para este período</p>
                      ) : (
                        <div className="tabla-container">
                          <table className="tabla-datos">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Ingresos</th>
                                <th>N° Ventas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {productosMasVendidos.map((p, index) => (
                                <tr key={p.producto_id}>
                                  <td className="posicion">{index + 1}</td>
                                  <td><strong>{p.producto_nombre}</strong></td>
                                  <td>{parseFloat(p.cantidad_total).toFixed(2)}</td>
                                  <td className="ingreso">${parseFloat(p.ingresos_totales).toFixed(2)}</td>
                                  <td>{p.num_ventas}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Historial de Ventas Recientes */}
                    <div className="seccion-datos">
                      <h4>🕐 Historial de Ventas Recientes</h4>
                      {ventasRecientes.length === 0 ? (
                        <p className="sin-datos">No hay ventas registradas para este período</p>
                      ) : (
                        <div className="tabla-container historial-scroll">
                          <table className="tabla-datos">
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Usuario</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio Unit.</th>
                                <th>Total</th>
                                <th>N° Transacción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ventasRecientes.map((v) => (
                                <tr key={v.id}>
                                  <td className="fecha">{v.fecha_formateada}</td>
                                  <td>{v.usuario_nombre}</td>
                                  <td>{v.producto_nombre}</td>
                                  <td>{parseFloat(v.cantidad).toFixed(2)}</td>
                                  <td>${parseFloat(v.precio_unitario).toFixed(2)}</td>
                                  <td className="total-venta">${parseFloat(v.total).toFixed(2)}</td>
                                  <td>{v.transaccion_id}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <button className="btn-cancelar" onClick={() => setMostrarDatos(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

export default Dashboard;