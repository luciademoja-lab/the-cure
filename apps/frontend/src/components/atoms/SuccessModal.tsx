import React, { useEffect } from 'react';
import '../../styles/SuccessModal.css';

interface SuccessModalProps {
  message: string;
  onClose: () => void;
  autoCloseDelay?: number;
}

export function SuccessModal({ message, onClose, autoCloseDelay = 3000 }: SuccessModalProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [onClose, autoCloseDelay]);

  return (
    <div className="success-modal-overlay">
      <div className="success-modal">
        <div className="success-icon">✅</div>
        <p className="success-message">{message}</p>
      </div>
    </div>
  );
}