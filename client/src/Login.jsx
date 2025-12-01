import { useState } from "react";
import Axios from "axios";
import "./App.css";

function Login() {
  const [Usuario, setUsuario] = useState("");
  const [Contraseña, setContraseña] = useState("");
  const [loginUsuario, setLoginUsuario] = useState("");
  const [loginContraseña, setLoginContraseña] = useState("");
  const [mensajeLogin, setMensajeLogin] = useState("");
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const addUser = () => {
    Axios.post("http://localhost:3001/create", { Usuario, Contraseña })
      .then((response) => {
        alert(response.data.message);
        setUsuario("");
        setContraseña("");
        setMostrarRegistro(false);
      })
      .catch((error) => {
        alert(error?.response?.data?.message || "Error al registrar");
      });
  };

  const loginUser = () => {
    Axios.post("http://localhost:3001/login", {
      Usuario: loginUsuario,
      Contraseña: loginContraseña,
    })
      .then((response) => {
        if (response.data.success) {
          // Guardar sesión con usuario_id y nombre de usuario
          sessionStorage.setItem("usuarioLogueado", response.data.usuario);
          sessionStorage.setItem("usuarioId", response.data.usuario_id);
          
          console.log("✅ Sesión guardada:", {
            usuario: response.data.usuario,
            id: response.data.usuario_id
          });
          
          window.location.href = "/dashboard";
        } else {
          setMensajeLogin(response.data.message);
        }
      })
      .catch((error) => {
        setMensajeLogin(error?.response?.data?.message || "Error al ingresar");
      });
  };

return (
  <div className="App">
    <div className="contenedor-login">
      <div className="login">
        <h2>Iniciar Sesión</h2>
        <label>
          Usuario:
          <input 
            type="text" 
            value={loginUsuario}
            onChange={(e) => setLoginUsuario(e.target.value)} 
          />
        </label>
        <br />
        <label>
          Contraseña:
          <input 
            type="password" 
            value={loginContraseña}
            onChange={(e) => setLoginContraseña(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                loginUser();
              }
            }}
          />
        </label>
        <br />
        <button onClick={loginUser}>Entrar</button>
        <p className="mensaje">{mensajeLogin}</p>
        
        {/* Botón para abrir el modal */}
        <button 
          className="btn-crear-cuenta" 
          onClick={() => setMostrarRegistro(true)}
        >
          Crear Cuenta
        </button>
      </div>
    </div>

    {/* Modal de registro */}
    {mostrarRegistro && (
      <div className="modal-overlay" onClick={() => setMostrarRegistro(false)}>
        <div className="modal-registro" onClick={(e) => e.stopPropagation()}>
          <h2>Crear Cuenta</h2>
          <label>
            Usuario:
            <input 
              type="text" 
              value={Usuario}
              onChange={(e) => setUsuario(e.target.value)} 
            />
          </label>
          <br />
          <label>
            Contraseña:
            <input 
              type="password" 
              value={Contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addUser();
                }
              }}
            />
          </label>
          <br />
          <div className="botones-modal">
            <button onClick={addUser}>Crear cuenta</button>
            <button 
              className="btn-cancelar" 
              onClick={() => setMostrarRegistro(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);}

export default Login;