type TextAreaProps = {
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
  rows?: number;
  ariaLabel?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  autoFocus?: boolean;
};

export function TextArea({ 
  placeholder, 
  value, 
  onChange, 
  rows = 8, 
  ariaLabel,
  disabled = false,
  maxLength,
  className = "journal-textarea",
  autoFocus = false
}: TextAreaProps) {
  return (
    <textarea
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      disabled={disabled}
      maxLength={maxLength}
      className={className}
      autoFocus={autoFocus}
    />
  );
}
