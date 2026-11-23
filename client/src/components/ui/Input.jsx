import { forwardRef, useId } from 'react';
import { clsx } from 'clsx';

/**
 * Input component tái sử dụng
 */
const Input = forwardRef(({ label, error, id, className = '', ...props }, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? inputId + "-error" : undefined;
  return (
    <div className="w-full">
      {label && <label className="label" htmlFor={inputId}>{label}</label>}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={clsx('input', error && 'border-danger-500 focus:ring-danger-500', className)}
        {...props}
      />
      {error && <p id={errorId} className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
