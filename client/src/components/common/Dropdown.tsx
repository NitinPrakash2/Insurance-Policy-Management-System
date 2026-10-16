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
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  label,
  className = '',
  buttonClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-[#1A2533] mb-1">
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-white border rounded text-xs text-left transition flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
          isOpen
            ? 'border-[#C05D34] ring-1 ring-[#C05D34]/30'
            : 'border-[#D5CEBF] hover:border-[#C05D34]'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-[#FAF8F5]' : 'cursor-pointer'} ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption?.icon}
          <span className={selectedOption ? 'text-[#1A2533] font-medium' : 'text-[#8E9AAB]'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-[11px] text-[#8E9AAB]">({selectedOption.sublabel})</span>
          )}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8E9AAB] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#C05D34]' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#D5CEBF] rounded-lg shadow-[0_10px_28px_rgba(26,37,51,0.12)] overflow-hidden py-1 max-h-56 overflow-y-auto font-sans animate-in fade-in zoom-in-95 duration-100"
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#8E9AAB] text-center">
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
                  className={`px-3 py-2 text-xs flex items-center justify-between transition cursor-pointer ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#FBF3EE] text-[#C05D34] font-semibold'
                      : 'text-[#1A2533] hover:bg-[#FAF8F5] hover:text-[#C05D34]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-[#8E9AAB] font-normal truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#C05D34] shrink-0 ml-2" />
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
