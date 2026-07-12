import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts = [], removeToast }) {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="toast-icon success" />;
      case 'warning':
        return <AlertTriangle size={18} className="toast-icon warning" />;
      case 'error':
        return <XCircle size={18} className="toast-icon error" />;
      case 'info':
      default:
        return <Info size={18} className="toast-icon info" />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type}`}>
          <div className="toast-icon">
            {getIcon(toast.type)}
          </div>
          <div className="toast-message">
            {toast.message}
          </div>
          <button 
            onClick={() => removeToast(toast.id)} 
            className="toast-close"
            aria-label="Close notification"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
