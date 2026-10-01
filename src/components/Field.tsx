import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function Field({ label, error, id, name, ...rest }: FieldProps) {
  const inputId = id ?? name;

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        name={name}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export default Field;
