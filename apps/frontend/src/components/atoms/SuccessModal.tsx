import { useEffect } from 'react';
import '../../styles/SuccessModal.css';

interface SuccessModalProps {
  message: string;
  onClose: () => void;
  autoCloseDelay?: number;
}

/**
 * Un avviso che affiora e si dissolve: niente sfondo, niente riquadro, solo luce e parole.
 * L'animazione CSS dura quanto autoCloseDelay, poi il componente viene tolto.
 */
export function SuccessModal({ message, onClose, autoCloseDelay = 3200 }: SuccessModalProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, autoCloseDelay);
    return () => clearTimeout(timer);
  }, [onClose, autoCloseDelay]);

  return (
    <div
      className="whisper-toast"
      role="status"
      aria-live="polite"
      style={{ animationDuration: `${autoCloseDelay}ms` }}
    >
      <span className="whisper-glow" aria-hidden="true" />
      <p className="whisper-message">{message}</p>
    </div>
  );
}
