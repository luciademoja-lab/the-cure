type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  icon?: string;
  disabled?: boolean;
};

export function Button({ label, variant = 'primary', onClick, icon, disabled = false }: ButtonProps) {
  return (
    <button type="button" className={`cta-button ${variant}`} onClick={onClick} disabled={disabled}>
      {label}
      {icon ? <span aria-hidden="true">{icon}</span> : null}
    </button>
  );
}
