'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FieldLabel } from '@/components/atoms/field-label';

/** Shared control styling — the single source the other field atoms build on. */
export function fieldClass(error?: boolean, className?: string) {
  return cn(
    'flex w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm',
    'placeholder:text-muted-foreground dark:bg-input/30',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    error && 'border-destructive ring-destructive/20 dark:ring-destructive/40',
    className,
  );
}

type NativeProps = React.InputHTMLAttributes<HTMLInputElement> &
  Partial<Pick<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'>>;

export type TextFieldProps = NativeProps & {
  label?: string;
  error?: string;
  hint?: string;
  /** Overlaid inside the control's right edge (e.g. a visibility toggle). */
  rightElement?: React.ReactNode;
  containerClassName?: string;
  /** `'textarea'` renders a multiline control; anything else is a native input type. */
  type?: string;
};

/**
 * Base text field: label + control + error/hint, with an optional `rightElement`
 * overlaid in the box. Pass `type="textarea"` for a multiline control. Every
 * other field atom (password, currency, search-select) is built on this look.
 */
export const TextField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(
  function TextField(
    { label, error, hint, rightElement, containerClassName, className, id, type, rows, ...props },
    ref,
  ) {
    const isTextarea = type === 'textarea';

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <FieldLabel htmlFor={id} title={label}>
            {label}
          </FieldLabel>
        )}
        <div className={cn(rightElement && 'relative')}>
          {isTextarea ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={id}
              rows={rows ?? 4}
              aria-invalid={!!error || undefined}
              className={cn(
                fieldClass(!!error, className),
                'field-sizing-content min-h-16 resize-none py-2',
                rightElement && 'pr-9',
              )}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={id}
              type={type}
              aria-invalid={!!error || undefined}
              className={cn(fieldClass(!!error, className), 'h-9', rightElement && 'pr-9')}
              {...props}
            />
          )}
          {rightElement && (
            <div
              className={cn(
                'absolute right-2',
                isTextarea ? 'top-2' : 'top-1/2 -translate-y-1/2',
              )}
            >
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);
