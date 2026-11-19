import { useId } from "react";
import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function Field({ label, error, id, name, ...rest }: FieldProps) {
  // Fall back to a generated id so the label is always linked to its input.
  const generatedId = useId();
  const inputId = id ?? name ?? generatedId;

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
