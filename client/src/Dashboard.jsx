import React, { useState, useEffect } from "react";
import Axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [productos, setProductos] = useState([]);
  const [nombreProducto, setNombreProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [productoExistente, setProductoExistente] = useState(false);

  // Verificar si el usuario está logueado
  useEffect(() => {
    const usuario = sessionStorage.getItem("usuarioLogueado");
    if (!usuario) {
      window.location.href = "/";
    }
  }, []);

  // Cargar productos al abrir el panel
  useEffect(() => {
    if (mostrarPanel) {
      cargarProductos();
    }
  }, [mostrarPanel]);

  const cargarProductos = () => {
    Axios.get("http://localhost:3001/productos")
      .then((response) => {
        setProductos(response.data);
        setProductosFiltrados(response.data);
      })
      .catch((error) => {
        console.error("Error al cargar productos:", error);
      });
  };

  const filtrarProductos = (texto) => {
    setNombreProducto(texto);
    setPrecio("");
    
    // Verificar si el texto coincide exactamente con un producto existente
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

  const seleccionarProducto = (nombre) => {
    setNombreProducto(nombre);
    setMostrarSugerencias(false);
    setProductoExistente(true);
    setPrecio(""); // No pedimos precio si ya existe
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
      cantidad: parseInt(cantidad),
      precio: precio ? parseFloat(precio) : null,
    })
      .then((response) => {
        setMensaje("✅ " + response.data.message);
        setNombreProducto("");
        setCantidad("");
        setPrecio("");
        setProductoExistente(false);
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
    console.log("🔵 Botón clickeado - abriendo panel");
    setMostrarPanel(true);
    setNombreProducto("");
    setCantidad("");
    setPrecio("");
    setProductoExistente(false);
    setMensaje("");
  };

  return (
    <div className="dashboard">
      <button className="btn-cerrar-sesion" onClick={cerrarSesion}>
        Cerrar Sesión 🚪
      </button>
      <h2>📦 Inventario - Panel Principal</h2>
      <div className="opciones">
        <button className="btn-opcion" onClick={abrirPanel}>
          Agregar Productos ➕
        </button>
        <button className="btn-opcion">Vender Productos 💸</button>
        <button className="btn-opcion">Datos 📊</button>
      </div>

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
                      onClick={() => seleccionarProducto(producto.nombre)}
                    >
                      {producto.nombre} (Stock: {producto.cantidad})
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {nombreProducto && (
              <p style={{ fontSize: '12px', color: productoExistente ? '#27ae60' : '#e67e22', marginTop: '5px' }}>
                {productoExistente ? '✓ Producto existente - se sumará al stock' : 'Agregando producto nuevo'}
              </p>
            )}

            <label>Cantidad a Agregar:</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ingresa la cantidad"
              min="1"
            />

            {!productoExistente && (
              <>
                <label>Precio por Unidad:</label>
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
    </div>
  );
}

export default Dashboard;