type ButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  icon?: string;
};

export function Button({ label, variant = 'primary', onClick, icon }: ButtonProps) {
  return (
    <button type="button" className={`cta-button ${variant}`} onClick={onClick}>
      {label}
      {icon ? <span aria-hidden="true">{icon}</span> : null}
    </button>
  );
}
