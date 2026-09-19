// src/components/common/PasswordField.tsx
import { useState, type InputHTMLAttributes } from "react";

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
}

export function PasswordField({
  label,
  id,
  error,
  helperText,
  className = "",
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-medium">
        {label}
      </label>

      <div className="input-group">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`form-control ${error ? "is-invalid" : ""} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          {...inputProps}
        />

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setVisible((v) => !v)}
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>

        {error && (
          <div id={errorId} className="invalid-feedback" role="alert">
            {error}
          </div>
        )}
      </div>

      {!error && helperText && (
        <div id={helperId} className="form-text">
          {helperText}
        </div>
      )}
    </div>
  );
}