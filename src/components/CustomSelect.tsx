import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface CustomSelectOption {
  value: string;
  label: string;
  count?: number;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  className?: string;
  placeholder?: string;
  id?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  className = "",
  placeholder = "Select option",
  id
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside of the element
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-full text-left" ref={dropdownRef} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl font-semibold transition-all hover:bg-slate-50/50 dark:hover:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer text-left ${className}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
          {selectedOption && selectedOption.count !== undefined && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono rounded-md">
              {selectedOption.count}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-2 text-indigo-500 transition-transform duration-250 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-full min-w-[160px] max-h-[220px] overflow-y-auto rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg shadow-slate-200/50 dark:shadow-none z-50 p-1.5 animate-scale-up custom-scrollbar-element">
          {options.length === 0 ? (
            <div className="text-center py-4 text-xs font-mono text-slate-400 dark:text-slate-500">
              No options available
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  opt.value === value
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.count !== undefined && (
                  <span
                    className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                      opt.value === value
                        ? "bg-indigo-650 text-indigo-100"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
