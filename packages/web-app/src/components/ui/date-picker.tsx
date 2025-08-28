import React, { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Calendar } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from './utils';

interface DatePickerProps {
  label?: string;
  value?: Dayjs | null;
  defaultValue?: Dayjs;
  onChange?: (newValue: Dayjs | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  format?: string;
}

export function DatePicker({
  label,
  value,
  defaultValue,
  onChange,
  placeholder = "Datum auswählen",
  className,
  disabled = false,
  format = "DD.MM.YYYY"
}: DatePickerProps) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = useState<Dayjs | null>(defaultValue || null);
  const [isOpen, setIsOpen] = useState(false);

  // Determine if this is controlled or uncontrolled
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dayjsDate = dayjs(date);
    
    if (isControlled) {
      onChange?.(dayjsDate);
    } else {
      setInternalValue(dayjsDate);
      onChange?.(dayjsDate);
    }
    
    setIsOpen(false);
  };

  const handleClear = () => {
    if (isControlled) {
      onChange?.(null);
    } else {
      setInternalValue(null);
      onChange?.(null);
    }
  };

  const displayValue = currentValue ? currentValue.format(format) : '';

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !currentValue && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <CalendarComponent
              mode="single"
              selected={currentValue?.toDate()}
              onSelect={handleDateSelect}
              initialFocus
            />
            
            {/* Quick action buttons */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateSelect(new Date())}
              >
                Heute
              </Button>
              
              {currentValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-red-600 hover:text-red-700"
                >
                  Löschen
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Compact version for use in headers/toolbars
interface CompactDatePickerProps {
  value?: Dayjs | null;
  defaultValue?: Dayjs;
  onChange?: (newValue: Dayjs | null) => void;
  className?: string;
  disabled?: boolean;
}

export function CompactDatePicker({
  value,
  defaultValue,
  onChange,
  className,
  disabled = false
}: CompactDatePickerProps) {
  const [internalValue, setInternalValue] = useState<Dayjs | null>(defaultValue || null);
  const [isOpen, setIsOpen] = useState(false);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dayjsDate = dayjs(date);
    
    if (isControlled) {
      onChange?.(dayjsDate);
    } else {
      setInternalValue(dayjsDate);
      onChange?.(dayjsDate);
    }
    
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = dayjs();
    
    if (isControlled) {
      onChange?.(today);
    } else {
      setInternalValue(today);
      onChange?.(today);
    }
  };

  const isToday = currentValue?.isSame(dayjs(), 'day');

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button 
        size="sm" 
        className={cn(
          "h-8 px-3 text-black",
          isToday 
            ? "bg-cyan-400 hover:bg-cyan-500" 
            : "bg-gray-200 hover:bg-gray-300"
        )}
        onClick={handleToday}
        disabled={disabled}
      >
        Heute
      </Button>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3">
            <CalendarComponent
              mode="single"
              selected={currentValue?.toDate()}
              onSelect={handleDateSelect}
              initialFocus
            />
            
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateSelect(new Date())}
              >
                Heute
              </Button>
              
              {currentValue && (
                <div className="text-xs text-gray-500">
                  {currentValue.format("DD.MM.YYYY")}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
