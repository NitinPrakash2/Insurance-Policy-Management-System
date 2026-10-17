import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dropdown } from './Dropdown';

interface DatePickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  direction?: 'auto' | 'up' | 'down';
  align?: 'auto' | 'left' | 'right';
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  className = '',
  disabled = false,
  direction = 'auto',
  align = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic placement (up/down and left/right) to prevent clipping in modals
  const [placement, setPlacement] = useState<{ vertical: 'up' | 'down'; horizontal: 'left' | 'right' }>({
    vertical: 'down',
    horizontal: 'right',
  });

  // Initialize calendar view to value or current date
  const parsedDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(parsedDate.getTime()) ? new Date().getMonth() : parsedDate.getMonth()
  );

  // Sync view when value changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  const calculatePlacement = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let v: 'up' | 'down' = 'down';
    if (direction === 'up') {
      v = 'up';
    } else if (direction === 'down') {
      v = 'down';
    } else {
      // Auto: if less than 270px below and more room above, pop UP
      v = spaceBelow < 270 && spaceAbove > spaceBelow ? 'up' : 'down';
    }

    let h: 'left' | 'right' = 'right';
    if (align === 'left') {
      h = 'left';
    } else if (align === 'right') {
      h = 'right';
    } else {
      // Auto: if element is in the right half of the screen or close to right edge, anchor right
      h = rect.left > window.innerWidth / 2 || rect.right > window.innerWidth - 120 ? 'right' : 'left';
    }

    setPlacement({ vertical: v, horizontal: h });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      calculatePlacement();
    }
    setIsOpen(!isOpen);
  };

  // Click outside to close
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

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Date selection helper
  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const isoString = `${viewYear}-${m}-${d}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const isoString = `${y}-${m}-${d}`;
    onChange(isoString);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  // Generate Year options (from 1950 to currentYear + 30) for direct selection
  const currentActualYear = new Date().getFullYear();
  const startYear = 1950;
  const endYear = currentActualYear + 30;
  const yearOptions = Array.from(
    { length: endYear - startYear + 1 },
    (_, idx) => startYear + idx
  );
  if (!yearOptions.includes(viewYear)) {
    yearOptions.push(viewYear);
    yearOptions.sort((a, b) => a - b);
  }

  const monthDropdownOptions = MONTH_NAMES.map((name, i) => ({
    value: String(i),
    label: name,
  }));

  const yearDropdownOptions = yearOptions.map((y) => ({
    value: String(y),
    label: String(y),
  }));

  // Format display text
  const formatDisplay = (val: string) => {
    if (!val) return '';
    try {
      const [y, m, d] = val.split('-');
      if (!y || !m || !d) return val;
      const monthShort = MONTH_NAMES[parseInt(m, 10) - 1]?.slice(0, 3) || m;
      return `${parseInt(d, 10)} ${monthShort} ${y}`;
    } catch {
      return val;
    }
  };

  // Today check
  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  // Selected check
  const isSelected = (day: number) => {
    if (!value) return false;
    const [y, m, d] = value.split('-');
    return (
      parseInt(y, 10) === viewYear &&
      parseInt(m, 10) === viewMonth + 1 &&
      parseInt(d, 10) === day
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] sm:text-xs font-semibold text-[#1A2533] mb-0.5 sm:mb-1">
          {label}
        </label>
      )}

      {/* Date Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border rounded-lg text-[11px] sm:text-xs text-left transition flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] min-h-[32px] sm:min-h-[34px] touch-manipulation ${
          isOpen
            ? 'border-[#C05D34] ring-1 ring-[#C05D34]/30'
            : 'border-[#D5CEBF] hover:border-[#C05D34]'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-[#FAF8F5]' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${value ? 'text-[#1A2533] font-medium font-mono' : 'text-[#8E9AAB]'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>

        <CalendarIcon
          className={`w-3.5 h-3.5 text-[#8E9AAB] shrink-0 transition-colors ${
            isOpen ? 'text-[#C05D34]' : ''
          }`}
        />
      </button>

      {/* Custom ProSurance Calendar Popover */}
      {isOpen && (
        <div
          className={`absolute z-[100] ${
            placement.vertical === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            placement.horizontal === 'right' ? 'right-0' : 'left-0'
          } bg-white border border-[#D5CEBF] rounded-xl shadow-[0_12px_32px_rgba(26,37,51,0.18)] p-2.5 sm:p-3 w-[260px] sm:w-[270px] font-sans animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Calendar Header with System Dropdowns */}
          <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-[#F0EBE1]">
            <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
              {/* Month Dropdown */}
              <div className="w-[105px] shrink-0">
                <Dropdown
                  value={String(viewMonth)}
                  onChange={(val) => setViewMonth(Number(val))}
                  options={monthDropdownOptions}
                  size="sm"
                  buttonClassName="!bg-[#FAF8F5] hover:!bg-[#F2ECE1] !border-[#E5DECF] hover:!border-[#C05D34]"
                  menuClassName="!min-w-[120px]"
                />
              </div>

              {/* Year Dropdown */}
              <div className="w-[82px] shrink-0">
                <Dropdown
                  value={String(viewYear)}
                  onChange={(val) => setViewYear(Number(val))}
                  options={yearDropdownOptions}
                  size="sm"
                  buttonClassName="!bg-[#FAF8F5] hover:!bg-[#F2ECE1] !border-[#E5DECF] hover:!border-[#C05D34] font-mono"
                  menuClassName="!min-w-[88px]"
                />
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-[#FAF8F5] text-[#5E6877] hover:text-[#0F2947] transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-[#FAF8F5] text-[#5E6877] hover:text-[#0F2947] transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {DAYS_OF_WEEK.map((dw) => (
              <span key={dw} className="text-[10px] font-semibold text-[#8E9AAB] uppercase">
                {dw}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-6.5 w-6.5 sm:h-7 sm:w-7" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const selected = isSelected(day);
              const current = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-6.5 w-6.5 sm:h-7 sm:w-7 rounded-md text-[11px] sm:text-xs font-medium flex items-center justify-center transition cursor-pointer ${
                    selected
                      ? 'bg-[#C05D34] text-white font-bold shadow-xs'
                      : current
                      ? 'bg-[#FAF3EC] text-[#C05D34] font-semibold border border-[#EAC8B9]'
                      : 'text-[#1A2533] hover:bg-[#FAF8F5] hover:text-[#C05D34]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer Actions */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#F0EBE1] text-[11px]">
            <button
              type="button"
              onClick={handleClear}
              className="text-[#8E9AAB] hover:text-rose-600 font-medium transition cursor-pointer text-[10px] sm:text-[11px]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[#C05D34] hover:text-[#A94F2B] font-semibold transition cursor-pointer text-[10px] sm:text-[11px]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
