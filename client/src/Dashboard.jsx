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
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [productos, setProductos] = useState([]);
  const [nombreProducto, setNombreProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [productoExistente, setProductoExistente] = useState(false);
  const [productoGranelExistente, setProductoGranelExistente] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [promociones, setPromociones] = useState([]);

  //Estados para fiados
  const [mostrarFiados, setMostrarFiados] = useState(false);
  const [ventasFiadas, setVentasFiadas] = useState([]);
  const [deudaPorCliente, setDeudaPorCliente] = useState([]);

  //funciones para abonar
  const [modalAbono, setModalAbono] = useState(null);
  const [montoAbono, setMontoAbono] = useState("");

  //Estados para caducidad
  const [alertasCaducidad, setAlertasCaducidad] = useState([]);
  const [granel, setGranel] = useState(false);
  const [tieneCaducidad, setTieneCaducidad] = useState(false); 
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  
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
    cargarAlertasCaducidad();
    const intervalo = setInterval(() => {
      cargarAlertas();
      cargarPromociones();
      cargarAlertasCaducidad();
    }, 30000); // cada 30 segundos
    return () => clearInterval(intervalo);
  }, []);

  // Recargar estadísticas cuando se realice una venta
useEffect(() => {
  const handleVentaRealizada = () => {
    if (mostrarDatos) {
      console.log("🔄 Recargando datos después de venta...");
      cargarEstadisticas();
    }
  };
  
  window.addEventListener('ventaRealizada', handleVentaRealizada);
  return () => window.removeEventListener('ventaRealizada', handleVentaRealizada);
}, [mostrarDatos]);

const cargarAlertasCaducidad = () => {
  Axios.get("http://localhost:3001/productos/alertas-caducidad")
    .then((response) => {
      console.log("⏰ Alertas de caducidad cargadas:", response.data);
      setAlertasCaducidad(response.data);
    })
    .catch((error) => {
      console.error("❌ Error al cargar alertas de caducidad:", error);
    });
};

  const actualizarCaducidad = (id, nuevosDias) => {
    console.log("📅 Actualizando caducidad del producto ID:", id, "a", nuevosDias, "días");
    
    Axios.put(`http://localhost:3001/productos/${id}/caducidad`, {
      dias_caducidad: nuevosDias
    })
      .then((response) => {
        mostrarToast("Caducidad actualizada correctamente", "exito");
        cargarProductos();
        cargarAlertasCaducidad();
      })
      .catch((error) => {
        mostrarToast(error?.response?.data?.message || "Error al actualizar caducidad", "error");
        console.error("❌ Error al actualizar caducidad:", error);
      });
  };
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
      tiene_caducidad: tieneCaducidad // 🆕 AGREGAR ESTA LÍNEA
    })
      .then((response) => {
        mostrarToast(response.data.message, "exito");
        setNombreProducto("");
        setCantidad("");
        setPrecio("");
        setGranel(false);
        setTieneCaducidad(false); // 🆕 AGREGAR ESTA LÍNEA
        setProductoExistente(false);
        setProductoGranelExistente(false);
        setMostrarPanel(false);
        cargarProductos();
      })
      .catch((error) => {
        mostrarToast(error?.response?.data?.message || "Error al agregar producto", "error");
      });
  };

  const abrirAyuda = () => {
    console.log("🆘 Abriendo ayuda general");
    setMostrarAyuda(true);
  }

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
    setTieneCaducidad(false);
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
      console.log("📊 Estadísticas recibidas:", respStats.data);
      
      const statsLimpias = {
        total_ventas: parseInt(respStats.data.total_ventas) || 0,
        ingresos_totales: parseFloat(respStats.data.ingresos_totales) || 0,
        unidades_granel: parseFloat(respStats.data.unidades_granel) || 0,
        unidades_normales: parseFloat(respStats.data.unidades_normales) || 0,
        venta_promedio: parseFloat(respStats.data.venta_promedio) || 0
      };     

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

  const abrirFiados = () => {
  console.log("💳 Abriendo panel de ventas fiadas");
  setMostrarFiados(true);
  cargarVentasFiadas();
};

const cargarVentasFiadas = async () => {
  try {
    const respDetalle = await Axios.get("http://localhost:3001/ventas/fiadas/detalle");
    const respClientes = await Axios.get("http://localhost:3001/ventas/fiadas/por-cliente");
    
    setVentasFiadas(respDetalle.data);
    setDeudaPorCliente(respClientes.data);
    
    console.log("✅ Ventas fiadas cargadas:", respDetalle.data.length);
  } catch (error) {
    console.error("❌ Error al cargar ventas fiadas:", error);
    mostrarToast("Error al cargar ventas fiadas", "error");
  }
};

  const abrirModalAbono = (cliente) => {
    setModalAbono({
      cliente: cliente.cliente,
      deudaTotal: cliente.deuda_total,
      totalOriginal: cliente.total_original || 0,
      totalAbonado: cliente.total_abonado || 0
    });
    setMontoAbono("");
  };

  const procesarAbono = async () => {
  if (!montoAbono || parseFloat(montoAbono) <= 0) {
    mostrarToast("Ingresa un monto válido", "advertencia");
    return;
  }

  const montoNum = parseFloat(montoAbono);
  const deudaTotal = parseFloat(modalAbono.deudaTotal);

  if (montoNum > deudaTotal) {
    mostrarToast(`El monto supera la deuda total ($${deudaTotal.toFixed(2)})`, "advertencia");
    return;
  }

  try {
    const response = await Axios.post("http://localhost:3001/ventas/fiadas/abonar", {
      cliente: modalAbono.cliente,
      monto: montoNum
    });

    mostrarToast(
      `✅ Abono registrado: $${response.data.monto_abonado.toFixed(2)}. Deuda restante: $${response.data.deuda_actual.toFixed(2)}`,
      "exito",
      5000
    );

    setModalAbono(null);
    setMontoAbono("");
    cargarVentasFiadas();
  } catch (error) {
    mostrarToast(error?.response?.data?.message || "Error al procesar abono", "error");
  }
};

  const pagarCompleto = async (cliente) => {
    const deudaTotal = parseFloat(cliente.deuda_total);
    const totalAbonado = parseFloat(cliente.total_abonado || 0);
    
    let mensaje = `¿Confirmar pago completo de $${deudaTotal.toFixed(2)} para ${cliente.cliente}?`;
    if (totalAbonado > 0) {
      mensaje += `\n\n(Ya se abonaron $${totalAbonado.toFixed(2)})`;
    }
    mensaje += `\n\nTodas las ventas pasarán a estado PAGADO.`;

    const confirmar = await mostrarConfirmacion(mensaje);

    if (!confirmar) return;

    try {
      const response = await Axios.post("http://localhost:3001/ventas/fiadas/pagar-completo", {
        cliente: cliente.cliente
      });

      mostrarToast(
        `✅ Deuda saldada: ${cliente.cliente} - $${response.data.monto_pagado.toFixed(2)}`,
        "exito",
        5000
      );

      cargarVentasFiadas();
    } catch (error) {
      mostrarToast(error?.response?.data?.message || "Error al saldar deuda", "error");
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
        {(alertas.length + promociones.length + alertasCaducidad.length) > 0 && (
          <span className="badge">{alertas.length + promociones.length + alertasCaducidad.length}</span>
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
            <h4>⏰ Alertas de Caducidad ({alertasCaducidad.length})</h4>
            {alertasCaducidad.length === 0 ? (
              <p style={{color: '#999', fontSize: '14px'}}>✅ No hay productos próximos a caducar</p>
            ) : (
              alertasCaducidad.map((p) => (
                <div key={p.id} className="notificacion-item caducidad">
                  <strong>{p.nombre}</strong>
                  {p.dias_caducidad === 0 ? (
                    <span style={{
                      color: '#c0392b',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      ❌ PRODUCTO VENCIDO
                    </span>
                  ) : (
                    <span style={{
                      color: p.dias_caducidad <= 2 ? '#c0392b' : '#e67e22',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      ⚠️ Quedan {p.dias_caducidad} día{p.dias_caducidad !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              ))
            )}
        </div>
      )}

    <div className="dashboard-header">
      <h2>Gestor de Inventario Minimarket "Goyito"</h2>
    </div>
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
        <button className="btn-opcion" onClick={abrirDatos}>
          Ver Datos 📊
        </button>
      </div>

      {/* AYUDA BOTOOOOOOOOON */}
      <div className="Ayuda-opciones" slot="Start">
        <button className="btn-ayuda" onClick={abrirAyuda}>
          🆘 Ayuda general 
        </button>
      </div>


      {/* Panel de Ayuda */}
      {mostrarAyuda && (
        <div className="panel-ayuda">
          <button 
            className="btn-cerrar-ayuda"
            onClick={() => setMostrarAyuda(false)}
          >
            ✕
          </button>

          <div>
          <p> Bienvenido al Gestor de Inventario Tienda Goyito!😊 </p> 
          <p> Como podrás ver, aquí se puede "Agregar producto", "Ver Inventario", "Vender productos" y "Ver Datos". </p>

          <p> Para empezar, agregaremos un nuevo producto, notarás que al hacer click en el botón de "Agregar producto" se Abre
              una nueva ventana, en está verás que existe la primera casilla con título "Nombre de Producto", aquí podras ingresar
              el nombre de tu primer producto a vender. </p>

          <p> En la casilla "Cantidad a agregar", ingresaremos en unidades la cantidad de productos que compraremos para nuestro establecimiento.
              Justo debajo de esto, vemos que existe dos cuadros para seleccionar, uno nos pregunta "¿Es producto a granel? (Se mide en Kg)". Daremos 
              click al cuadro siempre que el tipo de producto que estamos ingresando se venda según la cantidad de kilogramos que lleve el cliente. 
              El siguiente nos pregunta "¿Tiene fecha de caducidad? (30 días por defecto)" de misma manera que el anterior, haremos click en está 
              siempre y cuando el producto que estemos ingresando tenga una fecha de caducidad a seguir.
              Ahora bien, podemos observar que la última casilla a completar se titula "Precio por unidad",
              en esta casilla ingresaremos el precio exacto al que venderemos el producto, 
              incluyendo el IVA, todo esto en pesos chilenos.
              Finalmente, al haber ingresado y rellenado cada una de esas casillas, daremos click al botón verde "Agregar". ¡Y listo! Haz agregado
              productos al inventario de la tienda. Aparecerá una notificacion sobre la compra realizada. </p>

          <p> A continuación, para ver el inventario actual de la tienda, haz click sobre el botón de "Ver Inventario", abriendo una ventana
              con un listado de los productos en stock, aquellos bienes que se encuentren agotados serán resaltados en rojo, indicando una alerta
              de inventario. Además, al extremo derecho de la tabla se encuentran tres funciones, la primera siendo una casilla con numeros ajustables,
              está representa la fecha de caducidad, a la cual se puede alterar la fecha dependiendo de que producto sea, al pasar el tiempo estos 
              días se van descontando, ten en cuenta que al llegar a cierto numero bajo, se dará la alerta por estar el producto cerca de su fecha de 
              vencimiento, resaltando al producto en rojo de misma manera que si estuviera agotandose, por otro lado podemos ver que hay dos botones 
              por producto, en los cuales con el botón rojo 🗑️ podrás eliminar los productos que ya no serán vendidos en la tienda. Mientras que, con 
              el botón azul ✏️, podrás agregar promociones en tus productos.
          </p>
          <p> Para agregar una promoción, al seleccionar el botón ✏️ se abrirá una ventana con algunas casillas autocompletadas con los datos del 
              producto.
              Podemos modificar la información de nuestros bienes a gusto. En la última casilla "Descuento (%)" es importante ingresar el porcentaje a 
              descontrar a nuestro producto, siempre considerando que esta promoción se aplicará a cada unidad por separado, o bien, a cada kilogramo 
              de producto, según corresponda. 
          </p>
          <p> Al momento de atender a un cliente, tendremos que ingresar los productos que quiera comprar en su "carrito de compras". Para esto, haremos 
              click en el botón "Vender productos". A continuación se presenta una ventana con dos casillas y una casilla de selección. En la primera, 
              "Producto", ingresaremos el nombre de el tipo de producto que se está vendiendo, y en la casilla "Cantidad" completaremos con el número 
              de unidades, o bien, kilogramos.
              A continuación tenemos un cuadro de selección que nos pregunta "¿Es venta de producto fiado?", le daremos click siempre y cuando la respuesta 
              sea Si. 
              Finalmente, una vez seguro de que la información ingresada es correcta, seleccionamos el botón "+ Agregar al Carrito". En caso de que la 
              información no corresponda, podemos hacer click en el botón rojo 🗑️ para eliminar este ingreso erróneo, y reemplazarlo con uno nuevo y correcto.
              Notamos también que en el caso de haber seleccionado la casilla con la pregunta "¿Es venta de producto fiado?", se abrira una nueva casilla 
              luego de agregar el producto al carrito, está siendo para ingresar el nombre del cliente, el cuál estaría fiando los productos, de está manera
              se mantiene constancia, y como se ve a un lado del total de la compra, también se ve la deuda que acumula el cliente.
              Una vez ingresados todos los productos de la compra, podemos finalizar la venta haciendo click en "Realizar Venta". Los datos de esta acción 
              se registrarán de forma automática en la sección de "Ver Datos".
          </p>
          <p> La sección de "Ver Datos" nos ofrece información sobre la tienda Goyito, podemos filtrar esta información por año y mes. También notamos que 
              hay un botón para ver las ventas fiadas en una ventana aparte, en la cuál se nos presentan en Deuda por cliente y los detalels de cada venta
              realizada. Al salir de la ventana de Ventas Fiadas, vemos que podemos saber la cantidad de ventas totales que ha tenido la tienda, los ingresos, 
              unidades vendidas a granel y por unidades, así como el promedio de dinero obtenido en ventas. Más abajo, se puede observar una tabla que nos 
              indica los productos más vendidos y que, por tanto, son de mayor interés para nuestro inventario. A su vez, al deslizar hasta el final de la 
              ventana, se observa una tabla con el detalle del historial de ventas realizadas, según fecha, hora, vendedor, los productos vendidos, cantidad, 
              precio individual, total de cada venta, número de transacción y Estado (Fiado o Pagado). 
          </p>

          <p> Finalmente, el panel de notificaciones nos brindará alertas sobre productos agotados, promociones activas y alertas de caducidad.
          </p>
          <p> Para mayor información diríjase con un miembro certificado de Goyito S.A. Gracias por preferir trabajar con nosotros.</p>
          
          </div>
          <button 
            className="btn-cerrar-ayuda" 
            onClick={() => setMostrarAyuda(false)}
            title="Cerrar ayuda"
          >
            ✕
          </button>
        </div>
      )}

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
                      <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tieneCaducidad}
                        onChange={(e) => setTieneCaducidad(e.target.checked)}
                        style={{ marginRight: '8px', width: 'auto', cursor: 'pointer' }}
                      />
                      ¿Tiene fecha de caducidad? (30 días por defecto)
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
                    <th>Caducidad</th>
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
                        {producto.dias_caducidad !== null ? (
                          <>
                            <input
                              type="number"
                              value={producto.dias_caducidad}
                              onChange={(e) => {
                                const nuevoValor = parseInt(e.target.value);
                                if (!isNaN(nuevoValor) && nuevoValor >= 0) {
                                  actualizarCaducidad(producto.id, nuevoValor);
                                }
                              }}
                              min="0"
                              style={{
                                width: '70px',
                                padding: '5px',
                                border: producto.dias_caducidad <= 5 ? '2px solid #e74c3c' : '2px solid #ddd',
                                borderRadius: '5px',
                                backgroundColor: producto.dias_caducidad <= 5 ? '#ffebee' : 'white',
                                fontWeight: producto.dias_caducidad <= 5 ? 'bold' : 'normal',
                                color: producto.dias_caducidad <= 5 ? '#c62828' : '#333'
                              }}
                            />
                            <span style={{marginLeft: '5px', fontSize: '12px', color: '#666'}}>días</span>
                          </>
                        ) : (
                          <span style={{color: '#999', fontSize: '13px'}}>Sin caducidad</span>
                        )}
                      </td>
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
                <button className="btn-cancelar2" onClick={() => setMostrarDatos(false)}>
                Cerrar
                </button>
                
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
                  <button 
                    className="btn-ver-fiados"
                    onClick={abrirFiados}
                  >
                    💳 Ver Fiados
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
                            <p className="estadistica-valor">{estadisticas.total_ventas}</p>
                          </div>
                        </div>
                        
                        <div className="estadistica-card">
                          <div className="estadistica-icono">💰</div>
                          <div className="estadistica-info">
                            <h4>Ingresos Totales</h4>
                            <p className="estadistica-valor">${estadisticas.ingresos_totales.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="estadistica-card">
                          <div className="estadistica-card unidades-card">
                            <div className="estadistica-icono">📊</div>
                            <div className="estadistica-info">
                              <h4>Unidades Vendidas</h4>
                              <div className="unidades-desglose">
                                <div className="unidad-item">
                                  <span className="unidad-label">🔢 Granel:</span>
                                  <span className="unidad-valor">{estadisticas.unidades_granel.toFixed(2)} kg</span>
                                </div>
                                <div className="unidad-item">
                                  <span className="unidad-label">📦 Unidad:</span>
                                  <span className="unidad-valor">{estadisticas.unidades_normales.toFixed(0)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="estadistica-card">
                          <div className="estadistica-icono">💵</div>
                          <div className="estadistica-info">
                            <h4>Venta Promedio</h4>
                            <p className="estadistica-valor">${estadisticas.venta_promedio.toFixed(2)}</p>
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
                                <th>Estado </th>
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
                                  <td>
                                  {v.Fiado === 1 ? (
                                    <span className="badge-fiado">💳 FIADO TIENDA</span>
                                  ) : (
                                    <span className="badge-pagado">✅ PAGADO</span>
                                  )}
                                </td>
                                </tr>
                              ))}
                            </tbody>



                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
            </div>
          )}
          {/* Panel de Ventas Fiadas */}
          {mostrarFiados && (
            <div className="panel-overlay" onClick={() => setMostrarFiados(false)}>
              <div className="panel-fiados" onClick={(e) => e.stopPropagation()}>
                <button className="btn-cancelar2" onClick={() => setMostrarFiados(false)}>
                  Cerrar
                </button>
                
                <h3>💳 Ventas Fiadas</h3>
                
                {/* Resumen por Cliente */}
                <div className="seccion-datos">
                  <h4>👥 Deuda por Cliente</h4>
                  {deudaPorCliente.length === 0 ? (
                    <p className="sin-datos">No hay deudas registradas</p>
                  ) : (
                    <div className="tabla-container">
                      <table className="tabla-datos">
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>Total Compras</th>
                            <th>Total Original</th>
                            <th>Abonado</th>
                            <th>Deuda Actual</th>
                            <th>Primera Compra</th>
                            <th>Última Compra</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deudaPorCliente.map((cliente, index) => (
                            <tr key={index}>
                              <td><strong>{cliente.cliente}</strong></td>
                              <td>{cliente.total_compras}</td>
                              <td>${parseFloat(cliente.total_original || 0).toFixed(2)}</td>
                              <td style={{color: '#f39c12', fontWeight: 'bold'}}>
                                ${parseFloat(cliente.total_abonado || 0).toFixed(2)}
                              </td>
                              <td className="ingreso">${parseFloat(cliente.deuda_total).toFixed(2)}</td>
                              <td className="fecha">{new Date(cliente.primera_compra).toLocaleDateString('es-CL')}</td>
                              <td className="fecha">{new Date(cliente.ultima_compra).toLocaleDateString('es-CL')}</td>
                              <td>
                                <button 
                                  className="btn-abonar"
                                  onClick={() => abrirModalAbono(cliente)}
                                  title="Abonar monto parcial"
                                >
                                  💵 Abonar
                                </button>
                                <button 
                                  className="btn-pagar-completo"
                                  onClick={() => pagarCompleto(cliente)}
                                  title="Pagar deuda completa"
                                >
                                  ✅ Pagar Todo
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Detalle de Ventas */}
                <div className="seccion-datos">
                  <h4>📋 Detalle de Ventas Fiadas</h4>
                  {ventasFiadas.length === 0 ? (
                    <p className="sin-datos">No hay ventas fiadas registradas</p>
                  ) : (
                    <div className="tabla-container historial-scroll">
                      <table className="tabla-datos">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Total</th>
                            <th>N° Transacción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ventasFiadas.map((venta) => (
                            <tr key={venta.id}>
                              <td className="fecha">{venta.fecha_formateada}</td>
                              <td><strong>{venta.cliente}</strong></td>
                              <td>{venta.producto_nombre}</td>
                              <td>{parseFloat(venta.cantidad).toFixed(2)}</td>
                              <td>${parseFloat(venta.precio_unitario).toFixed(2)}</td>
                              <td className="total-venta">${parseFloat(venta.total).toFixed(2)}</td>
                              <td className="transaccion-id">{venta.transaccion_id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Modal de Abono */}
          {modalAbono && (
            <div className="modal-confirmacion-overlay" onClick={() => setModalAbono(null)}>
              <div className="modal-abono" onClick={(e) => e.stopPropagation()}>
                <div className="modal-confirmacion-icono">💵</div>
                <h3>Abonar a Deuda</h3>
                
                <div className="detalle-deuda">
                  <p><strong>Cliente:</strong> {modalAbono.cliente}</p>
                  <p><strong>Total Original:</strong> ${parseFloat(modalAbono.totalOriginal).toFixed(2)}</p>
                  {modalAbono.totalAbonado > 0 && (
                    <p style={{color: '#f39c12'}}>
                      <strong>Ya Abonado:</strong> ${parseFloat(modalAbono.totalAbonado).toFixed(2)}
                    </p>
                  )}
                  <p style={{fontSize: '18px', color: '#27ae60', marginTop: '10px'}}>
                    <strong>Deuda Actual:</strong> ${parseFloat(modalAbono.deudaTotal).toFixed(2)}
                  </p>
                </div>
                
                <label style={{marginTop: '20px', display: 'block', fontWeight: 'bold', color: '#333'}}>
                  Monto a Abonar:
                </label>
                <input
                  type="number"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  placeholder="Ingresa el monto"
                  min="0"
                  step="0.01"
                  max={modalAbono.deudaTotal}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    marginTop: '8px',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
                
                <div className="modal-confirmacion-botones" style={{marginTop: '25px'}}>
                  <button className="btn-confirmar-modal" onClick={procesarAbono}>
                    💰 Registrar Abono
                  </button>
                  <button className="btn-cancelar-modal" onClick={() => setModalAbono(null)}>
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
