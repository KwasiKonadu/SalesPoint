"use client";

import type { ComponentProps } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { TextField } from "@/components/atoms/text-field";
import { PasswordField } from "@/components/atoms/password-field";

interface RegisteredFieldProps {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  /** `'textarea'`, `'password'`, `'email'`, or any native input type. */
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  rows?: number;
  step?: string | number;
  rightElement?: React.ReactNode;
}

/**
 * `react-hook-form` field: wires a `register(...)` result into {@link TextField}
 * (or {@link PasswordField}), showing the field's error. `type="email"` also
 * lower-cases input as it is typed.
 */
export function RegisteredField({
  label,
  registration,
  error,
  type = "text",
  placeholder,
  readOnly,
  rows,
  step,
  rightElement,
}: RegisteredFieldProps) {
  if (type === "password") {
    return (
      <PasswordField
        label={label}
        placeholder={placeholder}
        readOnly={readOnly}
        error={error?.message}
        {...(registration as ComponentProps<typeof PasswordField>)}
      />
    );
  }

  if (type === "email") {
    const { onChange, ...rest } = registration;
    return (
      <TextField
        label={label}
        type="email"
        placeholder={placeholder}
        readOnly={readOnly}
        error={error?.message}
        onChange={(e) => {
          e.target.value = e.target.value.toLowerCase();
          void onChange(e);
        }}
        {...(rest as ComponentProps<typeof TextField>)}
      />
    );
  }

  return (
    <TextField
      label={label}
      type={type}
      placeholder={placeholder}
      readOnly={readOnly}
      error={error?.message}
      rows={rows}
      step={step}
      rightElement={rightElement}
      {...(registration as ComponentProps<typeof TextField>)}
    />
  );
}
