import React, { useEffect } from 'react';
import './Toast.css';

function Toast({ mensaje, tipo, onClose, duracion = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duracion);

    return () => clearTimeout(timer);
  }, [onClose, duracion]);

  const getIcono = () => {
    switch (tipo) {
      case 'exito': return '✅';
      case 'error': return '❌';
      case 'advertencia': return '⚠️';
      case 'stock-bajo': return '🚨';
      case 'pregunta': return '❓';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`toast toast-${tipo}`} onClick={onClose}>
      <span className="toast-icono">{getIcono()}</span>
      <span className="toast-mensaje">{mensaje}</span>
      <button className="toast-cerrar" onClick={onClose}>✕</button>
    </div>
  );
}

export default Toast;