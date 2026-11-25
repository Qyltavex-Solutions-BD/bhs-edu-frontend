'use client';

import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { cn } from '@/src/lib/utils/cn';
import { Check, ChevronDown } from 'lucide-react';

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
              'group inline-flex items-center justify-between gap-2.5 w-full h-10 px-3.5 rounded-2xl border border-border bg-surface text-foreground text-base font-medium shadow-xs hover:border-[#1C6440]/60 hover:bg-surface-muted/30 focus:outline-none focus:ring-2 focus:ring-[#1C6440]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
            aria-label={props['aria-label']}
          >
            <span className="truncate flex-1 text-left">
              {displayLabel ? (
                currentOption?.disabled ? (
                  <span className="text-muted-foreground/50 font-normal">{displayLabel}</span>
                ) : (
                  displayLabel
                )
              ) : (
                <span className="text-muted-foreground/50 font-normal">{placeholder || '—'}</span>
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
                        'relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-base font-medium outline-none transition-colors data-[highlighted]:bg-[#1C6440]/10 data-[highlighted]:text-[#1C6440] data-[state=checked]:bg-[#1C6440]/10 data-[state=checked]:text-[#1C6440] data-[state=checked]:font-bold data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
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
