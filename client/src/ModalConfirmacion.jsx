import React from 'react';
import './ModalConfirmacion.css';

function ModalConfirmacion({ mensaje, onConfirmar, onCancelar }) {
  return (
    <div className="modal-confirmacion-overlay" onClick={onCancelar}>
      <div className="modal-confirmacion" onClick={(e) => e.stopPropagation()}>
        <div className="modal-confirmacion-icono">❓</div>
        <h3>Confirmación</h3>
        <p>{mensaje}</p>
        <div className="modal-confirmacion-botones">
          <button className="btn-confirmar-modal" onClick={onConfirmar}>
            Sí, continuar
          </button>
          <button className="btn-cancelar-modal" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmacion;