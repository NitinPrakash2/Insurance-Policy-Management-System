import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | DropdownOption)[];
  placeholder?: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  label,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected option when opened
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedEl = listRef.current.querySelector('[aria-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  // Normalize options to DropdownOption format
  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string, isOptDisabled?: boolean) => {
    if (isOptDisabled) return;
    onChange(optValue);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative ${isOpen ? 'z-[120]' : 'z-10'} ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border rounded-lg text-left transition flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] touch-manipulation ${
          isSmall
            ? 'min-h-[28px] px-2 py-1 text-xs font-serif font-bold text-[#0F2947]'
            : 'min-h-[32px] sm:min-h-[34px] px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs'
        } ${
          isOpen
            ? 'border-[#C05D34] ring-1 ring-[#C05D34]/30'
            : 'border-[#D5CEBF] hover:border-[#C05D34]'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-[#FAF8F5]' : 'cursor-pointer'} ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOption?.icon}
          <span className={selectedOption ? (isSmall ? 'text-[#0F2947]' : 'text-[#1A2533] font-medium') : 'text-[#8E9AAB]'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-[10px] text-[#8E9AAB]">({selectedOption.sublabel})</span>
          )}
        </span>

        <ChevronDown
          className={`${isSmall ? 'w-3 h-3 ml-1' : 'w-3.5 h-3.5'} text-[#8E9AAB] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#C05D34]' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className={`absolute z-[130] left-0 right-0 mt-1 bg-white border border-[#D5CEBF] rounded-lg shadow-[0_12px_32px_rgba(26,37,51,0.18)] overflow-hidden py-1 ${
            isSmall ? 'max-h-48' : 'max-h-52 sm:max-h-56'
          } overflow-y-auto font-sans animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-[11px] sm:text-xs text-[#8E9AAB] text-center">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  className={`flex items-center justify-between transition cursor-pointer touch-manipulation ${
                    isSmall
                      ? 'px-2.5 py-1 text-xs min-h-[26px]'
                      : 'px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs min-h-[30px] sm:min-h-[32px]'
                  } ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#FBF3EE] text-[#C05D34] font-semibold'
                      : 'text-[#1A2533] hover:bg-[#FAF8F5] hover:text-[#C05D34] active:bg-[#F2ECE1]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-[#8E9AAB] font-normal truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#C05D34] shrink-0 ml-1.5`} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
