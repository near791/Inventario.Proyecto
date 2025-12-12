import React, { useState, useEffect } from "react";
import Axios from "axios";
import "./Vender.css";
import Toast from './Toast';
import ModalConfirmacion from './ModalConfirmacion';

//funciones
function Vender({ onCerrar, usuarioId, nombreUsuario }) {
  const [productos, setProductos] = useState([]);//lista completa de los productos desde el backend
  const [nombreProducto, setNombreProducto] = useState("");//nombre del producto a vender - sirve para input
  const [cantidad, setCantidad] = useState("");//cantidad a vender
  const [productosFiltrados, setProductosFiltrados] = useState([]);//productos coincidentes
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);//controla si se muestra la sugerencia de productos coincidentes
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);///producto elegido para vender
  const [carrito, setCarrito] = useState([]);//lista de productos añadidos antes de confirmar la venta
  const [toasts, setToasts] = useState([]);//mensajes de notificación
  const [modalConfirmacion, setModalConfirmacion] = useState(null);//mensaje de confirmación
  const [Fiado, setFiado] = useState(false);
  const [nombreCliente, setNombreCliente] = useState("");

// Se ejecuta al iniciar el componente.
// Carga todos los productos desde el servidor
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = () => {
    Axios.get("http://localhost:3001/productos")
      .then((response) => {
        setProductos(response.data);
        setProductosFiltrados(response.data);
      })
      .catch((error) => {
        console.error("❌ Error al cargar productos:", error);
        mostrarToast("Error al cargar productos", "error");
      });
  };

// Filtra los productos según lo que el usuario escribe, si el input esta vacio muestra todos los productos
  const filtrarProductos = (texto) => {
    setNombreProducto(texto);
    setProductoSeleccionado(null);
    
    if (texto === "") {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter((p) =>
        p.nombre.toLowerCase().includes(texto.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    }
  };

//selecciona el producto, agrega al carrito y realiza la venta
  const seleccionarProducto = (producto) => {
    setNombreProducto(producto.nombre);
    setMostrarSugerencias(false);
    setProductoSeleccionado(producto);
  };

  const agregarAlCarrito = () => {
    if (!productoSeleccionado) {
      mostrarToast("Selecciona un producto de la lista", "advertencia");
      return;
    }

    if (!cantidad || parseFloat(cantidad) <= 0) {
      mostrarToast("Ingresa una cantidad válida", "advertencia");
      return;
    }

    const cantidadNum = parseFloat(cantidad);

    // Verificar stock disponible considerando lo que ya está en el carrito
    const cantidadEnCarrito = carrito
      .filter(item => item.producto_id === productoSeleccionado.id)
      .reduce((sum, item) => sum + item.cantidad, 0);

    const stockDisponible = productoSeleccionado.cantidad - cantidadEnCarrito;

    if (cantidadNum > stockDisponible) {
      mostrarToast(
        `Stock insuficiente. Disponible: ${stockDisponible} ${productoSeleccionado.granel ? 'kg' : 'unidades'}`,
        "error"
      );
      return;
    }

    const precioConDescuento = productoSeleccionado.descuento > 0
      ? productoSeleccionado.precio * (1 - productoSeleccionado.descuento / 100)
      : productoSeleccionado.precio;

    const nuevoItem = {
      producto_id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      cantidad: cantidadNum,
      precio_unitario: precioConDescuento,
      subtotal: precioConDescuento * cantidadNum,
      granel: productoSeleccionado.granel,
      descuento: productoSeleccionado.descuento,
      fiado: Fiado,
      cliente: Fiado ? nombreCliente : null
    };

    setCarrito([...carrito, nuevoItem]);
    setNombreProducto("");
    setCantidad("");
    setProductoSeleccionado(null);
    setFiado(false);
    mostrarToast("Producto agregado al carrito", "exito");
  };

  
  const eliminarDelCarrito = (index) => {
    const nuevoCarrito = carrito.filter((_, i) => i !== index);
    setCarrito(nuevoCarrito);
    mostrarToast("Producto eliminado del carrito", "exito");
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calcularTotalFiado = () => {
    return carrito.filter(item => item.fiado).reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calcularTotalPagado = () => {
    return carrito.filter(item => !item.fiado).reduce((sum, item) => sum + item.subtotal, 0);
  };

  const hayProductosFiados = () => {
    return carrito.some(item => item.fiado);
  };

  const realizarVenta = async () => {
    if (carrito.length === 0) {
      mostrarToast("El carrito está vacío", "advertencia");
      return;
    }

    // Validar que si hay productos fiados, se haya ingresado el nombre del cliente
    if (hayProductosFiados() && (!nombreCliente || nombreCliente.trim() === '')) {
      mostrarToast("Debe ingresar el nombre del cliente para ventas fiadas", "advertencia");
      return;
    }

    const totalFiado = calcularTotalFiado();
    const totalPagado = calcularTotalPagado();
    
    let mensajeConfirmacion = `¿Confirmar venta de ${carrito.length} producto(s)?\n\n`;
    if (totalPagado > 0) mensajeConfirmacion += `💵 A pagar ahora: $${totalPagado.toFixed(2)}\n`;
    if (totalFiado > 0) mensajeConfirmacion += `💳 Total fiado: $${totalFiado.toFixed(2)}`;

    const confirmar = await mostrarConfirmacion(mensajeConfirmacion);

    if (!confirmar) return;

    try {
      const response = await Axios.post("http://localhost:3001/productos/vender", {
        usuario_id: usuarioId,
        productos: carrito,
        cliente: hayProductosFiados() ? nombreCliente : null
      });

      // Mostrar mensaje con ID de transacción
      const transaccionId = response.data.transaccion_id || "N/A";
      
      if (response.data.productos_stock_bajo && response.data.productos_stock_bajo.length > 0) {
        const alertas = response.data.productos_stock_bajo
          .map(p => `${p.nombre}: ${p.cantidad_actual}/${p.stock_minimo}`)
          .join(", ");
        mostrarToast(`⚠️ Stock bajo en: ${alertas}`, "stock-bajo", 5000);
      }
      
      // Mensaje de éxito con número de transacción
      let mensajeExito = `✅ Venta realizada! ID: ${transaccionId}\n`;
      if (response.data.total_pagado > 0) {
        mensajeExito += `💵 Pagado: $${response.data.total_pagado.toFixed(2)}`;
      }
      if (response.data.total_fiado > 0) {
        mensajeExito += `\n💳 Fiado: $${response.data.total_fiado.toFixed(2)}`;
      }

      mostrarToast(mensajeExito, "exito", 5000);

      console.log("✅ Venta completada:", {
        transaccion_id: transaccionId,
        total: response.data.total_general,
        productos: response.data.productos_vendidos,
        fiado: response.data.total_ventas_fiadas
      });

      setCarrito([]);
      setNombreCliente("");
      setTimeout(() => {
        if (onCerrar) onCerrar();
      }, 3000);
    } catch (error) {
      console.error("❌ Error en venta:", error);
      mostrarToast(
        error?.response?.data?.message || "Error al realizar la venta",
        "error"
      );
    }
  };

  const cancelarVenta = async () => {
    if (carrito.length === 0) {
      if (onCerrar) onCerrar();
      return;
    }

    const confirmar = await mostrarConfirmacion(
      "¿Estás seguro de cancelar la venta? Se perderá todo el carrito."
    );

    if (confirmar) {
      setCarrito([]);
      mostrarToast("Venta cancelada", "exito");
      setTimeout(() => {
        if (onCerrar) onCerrar();
      }, 1000);
    }
  };

  const mostrarToast = (mensaje, tipo = "info", duracion = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, mensaje, tipo, duracion }]);
  };

  const cerrarToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
        },
      });
    });
  };

  return (
    <div className="vender-container">
      <div className="vender-panel-izquierdo">
        <h3>💵 Vender Productos</h3>
        
        <label>Producto:</label>
        <div className="input-con-sugerencias">
          <input
            type="text"
            value={nombreProducto}
            onChange={(e) => filtrarProductos(e.target.value)}
            onFocus={() => setMostrarSugerencias(true)}
            placeholder="Busca un producto..."
          />
          {mostrarSugerencias && productosFiltrados.length > 0 && (
            <div className="sugerencias">
              {productosFiltrados.map((producto) => (
                <div
                  key={producto.id}
                  className="sugerencia-item-venta"
                  onClick={() => seleccionarProducto(producto)}
                >
                  <div className="sugerencia-nombre">{producto.nombre}</div>
                  <div className="sugerencia-detalles">
                    Stock: {producto.granel ? `${producto.cantidad} kg` : `${producto.cantidad} unidades`}
                    {producto.descuento > 0 && (
                      <span className="sugerencia-descuento"> | {producto.descuento}% OFF</span>
                    )}
                  </div>
                  <div className="sugerencia-precio">
                    {producto.descuento > 0 ? (
                      <>
                        <span className="precio-original">${producto.precio}</span>
                        <span className="precio-descuento">
                          {" "}
                          ${(producto.precio * (1 - producto.descuento / 100)).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span>${producto.precio}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {productoSeleccionado && (
          <div className="info-producto-venta">
            <p>
              <strong>Producto:</strong> {productoSeleccionado.nombre}
            </p>
            <p>
              <strong>Stock disponible:</strong>{" "}
              {productoSeleccionado.granel
                ? `${productoSeleccionado.cantidad} kg`
                : `${productoSeleccionado.cantidad} unidades`}
            </p>
            <p>
              <strong>Precio:</strong>{" "}
              {productoSeleccionado.descuento > 0 ? (
                <>
                  <span style={{ textDecoration: "line-through", color: "#999", marginLeft: "5px" }}>
                    ${productoSeleccionado.precio}
                  </span>
                  <span style={{ color: "#27ae60", fontWeight: "bold", marginLeft: "5px" }}>
                    ${(productoSeleccionado.precio * (1 - productoSeleccionado.descuento / 100)).toFixed(2)}
                  </span>
                  <span style={{ color: "#e67e22", marginLeft: "5px" }}>
                    ({productoSeleccionado.descuento}% OFF)
                  </span>
                </>
              ) : (
                <span style={{ marginLeft: "5px" }}>${productoSeleccionado.precio}</span>
              )}
            </p>
          </div>
        )}

        <label>Cantidad{productoSeleccionado?.granel ? " (kg)" : ""}:</label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder={productoSeleccionado?.granel ? "Ej: 0.5" : "Ingresa la cantidad"}
          min="0"
          step={productoSeleccionado?.granel ? "0.01" : "1"}
          disabled={!productoSeleccionado}
        />

        <label style={{ display: 'flex', alignItems: 'center', marginTop: '15px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Fiado}
            onChange={(e) => setFiado(e.target.checked)}
            style={{ marginRight: '8px', width: 'auto', cursor: 'pointer' }}
          />
          ¿Es venta de producto fiado?
        </label>

        {hayProductosFiados() && (
        <div style={{ marginTop: '15px' }}>
          <label>Nombre del Cliente (requerido para fiados):</label>
          <input
            type="text"
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            placeholder="Ingrese nombre del cliente"
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #f39c12',
              borderRadius: '8px',
              marginTop: '5px',
              backgroundColor: '#fff8e1'
            }}
          />
        </div>
      )}

        <button
          className="btn-agregar-carrito"
          onClick={agregarAlCarrito}
          disabled={!productoSeleccionado || !cantidad}
        >
          ➕ Agregar al Carrito
        </button>

        <button
          className="btn-cancelar-venta-panel"
          onClick={cancelarVenta}
        >
          ❌ Cancelar
        </button>
      </div>

      <div className="vender-panel-derecho">
        <h3>🛒 Carrito de Compra</h3>
        
        {carrito.length === 0 ? (
          <div className="carrito-vacio">
            <p>🛒 El carrito está vacío</p>
            <p style={{ fontSize: "14px", color: "#999" }}>
              Agrega productos para realizar una venta
            </p>
          </div>
        ) : (
          <>
            <div className="carrito-items">
              {carrito.map((item, index) => (
                <div key={index} className="carrito-item">
                  <div className="carrito-item-info">
                    <div className="carrito-item-nombre">{item.nombre}</div>
                     {item.fiado && (
                        <span className="badge-fiado" style={{
                          marginLeft: '8px',
                          background: '#f39c12',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          FIADO
                        </span>
                      )}
                    <div className="carrito-item-detalles">
                      {item.cantidad} {item.granel ? "kg" : "unid"} × ${item.precio_unitario.toFixed(2)}
                      {item.descuento > 0 && (
                        <span className="carrito-item-descuento"> ({item.descuento}% OFF)</span>
                      )}
                    </div>
                    <div className="carrito-item-subtotal">${item.subtotal.toFixed(2)}</div>
                  </div>
                  <button
                    className="btn-eliminar-carrito"
                    onClick={() => eliminarDelCarrito(index)}
                    title="Eliminar del carrito"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <div className="carrito-totales">
              {calcularTotalPagado() > 0 && (
                <div className="carrito-total carrito-total-pagado">
                  <strong>💵 A PAGAR:</strong>
                  <span className="carrito-total-monto">${calcularTotalPagado().toFixed(2)}</span>
                </div>
              )}
              
              {calcularTotalFiado() > 0 && (
                <div className="carrito-total carrito-total-fiado">
                  <strong>💳 DEUDA:</strong>
                  <span className="carrito-total-monto">${calcularTotalFiado().toFixed(2)}</span>
                </div>
              )}
              
              <div className="carrito-total carrito-total-general">
                <strong>TOTAL:</strong>
                <span className="carrito-total-monto">${calcularTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="carrito-botones">
              <button className="btn-realizar-venta" onClick={realizarVenta}>
                ✅ Realizar Venta
              </button>
              <button className="btn-cancelar-venta" onClick={cancelarVenta}>
                ❌ Cancelar
              </button>
            </div>
          </>
        )}
      </div>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          duracion={toast.duracion}
          onClose={() => cerrarToast(toast.id)}
        />
      ))}

      {modalConfirmacion && (
        <ModalConfirmacion
          mensaje={modalConfirmacion.mensaje}
          onConfirmar={modalConfirmacion.onConfirmar}
          onCancelar={modalConfirmacion.onCancelar}
        />
      )}
    </div>
  );
}

export default Vender;