// src/components/common/FormField.tsx
// Reusable labeled input. Centralizing this means every form in the app
// (Login, New Appointment, Settings, etc.) gets the same label/error/focus
// behavior for free instead of re-implementing accessibility per screen.

import { forwardRef, type InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, id, error, helperText, className = "", ...inputProps }, ref) => {
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="mb-3">
        <label htmlFor={id} className="form-label fw-medium">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`form-control ${error ? "is-invalid" : ""} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...inputProps}
        />
        {error && (
          <div id={errorId} className="invalid-feedback" role="alert">
            {error}
          </div>
        )}
        {!error && helperText && (
          <div id={helperId} className="text-helper mt-1">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
