'use client';

import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { cn } from '@/src/lib/utils/cn';
import { Check, ChevronDown, X } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-[#1C6440] text-white hover:bg-[#165033] shadow-xs active:scale-[0.99] border border-transparent',
      secondary:
        'bg-[#124B96] text-white hover:bg-[#0E3B77] shadow-xs active:scale-[0.99] border border-transparent',
      outline:
        'bg-surface text-foreground border border-border hover:bg-surface-muted/60 shadow-xs active:scale-[0.99]',
      ghost:
        'bg-transparent text-foreground hover:bg-surface-muted border border-transparent',
      destructive:
        'bg-[#DF6153] text-white hover:bg-[#C94F42] shadow-xs active:scale-[0.99] border border-transparent',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-9 px-3.5 text-sm gap-1.5 font-medium',
      md: 'h-10 px-4 text-sm sm:text-base gap-2 font-semibold',
      lg: 'h-11 px-5 text-base gap-2 font-semibold',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center rounded-2xl transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full h-10 px-3.5 rounded-2xl border border-border bg-surface text-foreground text-sm sm:text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1C6440]/25 focus:border-[#1C6440] shadow-xs transition-all disabled:opacity-60',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options?: SelectOption[];
  placeholder?: string;
  triggerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      value,
      defaultValue,
      onChange,
      disabled,
      placeholder,
      name,
      id,
      options: directOptions,
      ...props
    },
    ref
  ) => {
    const parsedOptions = React.useMemo(() => {
      if (directOptions && directOptions.length > 0) return directOptions;
      const items: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) return;
        const childProps = child.props as {
          value?: unknown;
          children?: React.ReactNode;
          disabled?: boolean;
        };
        const val = childProps.value !== undefined ? String(childProps.value) : '';
        const lbl = childProps.children ?? val;
        items.push({ value: val, label: lbl, disabled: childProps.disabled });
      });
      return items;
    }, [directOptions, children]);

    const EMPTY_TOKEN = '__EMPTY__';

    const encodeValue = (v: unknown): string => {
      if (v === undefined || v === null) return '';
      const s = String(v);
      return s === '' ? EMPTY_TOKEN : s;
    };

    const decodeValue = (s: string): string => {
      return s === EMPTY_TOKEN ? '' : s;
    };

    const controlled = value !== undefined;
    const initialInternal = encodeValue(
      controlled ? value : defaultValue ?? parsedOptions[0]?.value ?? ''
    );
    const [internalValue, setInternalValue] = React.useState(initialInternal);

    React.useEffect(() => {
      if (controlled) {
        setInternalValue(encodeValue(value));
      }
    }, [controlled, value]);

    const handleValueChange = (nextEncoded: string) => {
      const decoded = decodeValue(nextEncoded);
      if (!controlled) {
        setInternalValue(nextEncoded);
      }
      if (onChange) {
        const syntheticEvent = {
          target: { value: decoded, name },
          currentTarget: { value: decoded, name },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    const currentOption = parsedOptions.find((opt) => encodeValue(opt.value) === internalValue);
    const displayLabel = currentOption ? currentOption.label : placeholder ?? '';

    return (
      <div className={cn('relative inline-block w-full min-w-0', className)}>
        {/* Hidden native select for form accessibility and DOM inspection */}
        <select
          ref={ref}
          value={decodeValue(internalValue)}
          onChange={onChange}
          name={name}
          id={id}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none absolute"
          {...props}
        >
          {parsedOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {typeof opt.label === 'string' ? opt.label : opt.value}
            </option>
          ))}
        </select>

        <RadixSelect.Root
          value={internalValue || undefined}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <RadixSelect.Trigger
            type="button"
            className={cn(
              'group inline-flex items-center justify-between gap-2.5 w-full h-10 px-3.5 rounded-2xl border border-border bg-surface text-foreground text-sm sm:text-base font-semibold shadow-xs hover:border-[#1C6440]/60 hover:bg-surface-muted/30 focus:outline-none focus:ring-2 focus:ring-[#1C6440]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
            aria-label={props['aria-label']}
          >
            <span className="truncate flex-1 text-left">
              {displayLabel || (
                <span className="text-muted-foreground font-normal">{placeholder || '—'}</span>
              )}
            </span>
            <RadixSelect.Icon asChild>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 group-data-[state=open]:rotate-180 group-data-[state=open]:text-[#1C6440]" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>

          <RadixSelect.Portal>
            <RadixSelect.Content
              position="popper"
              sideOffset={6}
              className="z-[9999] min-w-[var(--radix-select-trigger-width)] max-h-72 overflow-hidden rounded-2xl border border-border/80 bg-surface/98 backdrop-blur-md p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            >
              <RadixSelect.Viewport className="p-1 space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
                {parsedOptions.map((opt) => {
                  const encoded = encodeValue(opt.value);
                  const isChecked = encoded === internalValue;
                  return (
                    <RadixSelect.Item
                      key={encoded}
                      value={encoded}
                      disabled={opt.disabled}
                      className={cn(
                        'relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-sm sm:text-base font-medium outline-none transition-colors data-[highlighted]:bg-[#1C6440]/10 data-[highlighted]:text-[#1C6440] data-[state=checked]:bg-[#1C6440]/10 data-[state=checked]:text-[#1C6440] data-[state=checked]:font-bold data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                        isChecked && 'bg-[#1C6440]/10 text-[#1C6440] font-bold'
                      )}
                    >
                      <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                      <RadixSelect.ItemIndicator>
                        <Check className="w-4 h-4 text-[#1C6440] shrink-0 ml-2" />
                      </RadixSelect.ItemIndicator>
                    </RadixSelect.Item>
                  );
                })}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
      </div>
    );
  }
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full min-h-[96px] p-3.5 rounded-2xl border border-border bg-surface text-foreground text-sm sm:text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1C6440]/25 focus:border-[#1C6440] shadow-xs transition-all disabled:opacity-60',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-3xl shadow-[0_2px_12px_-4px_rgba(28,100,64,0.06)] text-foreground transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex items-center gap-2.5 cursor-pointer disabled:opacity-50',
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors border',
          checked ? 'bg-primary border-primary' : 'bg-surface-muted border-border'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white transition-transform mt-px',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </span>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  maxWidth = 'max-w-2xl',
  size,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  children: React.ReactNode;
}) {
  if (!open) return null;
  const sizeMap: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full', string> = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-7xl',
  };
  const resolvedMaxWidth = size ? sizeMap[size] : maxWidth;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full bg-surface border border-border rounded-[var(--radius)] shadow-lg max-h-[90vh] flex flex-col',
          resolvedMaxWidth
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-muted cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: string; label: string; count?: number }[];
  value: T;
  onChange: (val: NoInfer<T>) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1 p-1 bg-surface-muted rounded-[var(--radius)] border border-border',
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value as T)}
            className={cn(
              'px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer',
              active
                ? 'bg-surface text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground border border-transparent'
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 tabular-nums text-xs opacity-75">
                ({item.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-surface-muted', className)} />
  );
}
