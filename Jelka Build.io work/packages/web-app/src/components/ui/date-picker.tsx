import React, { useState, useRef, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/de';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from './utils';

// Set dayjs locale to German
dayjs.locale('de');

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

// Enhanced calendar component with proper navigation
function EnhancedCalendar({ 
  selectedDate, 
  onDateSelect, 
  onClose 
}: { 
  selectedDate: Dayjs | null; 
  onDateSelect: (date: Dayjs) => void;
  onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(selectedDate || dayjs());
  
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];
  
  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  
  const startOfMonth = viewDate.startOf('month');
  const endOfMonth = viewDate.endOf('month');

  // Correctly calculate Monday as the start of the week
  const getMonday = (date: Dayjs) => {
    const day = date.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days; otherwise go back to Monday
    return date.add(diff, 'day');
  };

  const startOfCalendar = getMonday(startOfMonth);
  const endOfCalendar = getMonday(endOfMonth.add(7, 'days'));
  
  const calendarDays = [];
  let current = startOfCalendar;
  
  while (current.isBefore(endOfCalendar)) {
    calendarDays.push(current);
    current = current.add(1, 'day');
  }
  
  const handlePrevMonth = () => {
    setViewDate(viewDate.subtract(1, 'month'));
  };
  
  const handleNextMonth = () => {
    setViewDate(viewDate.add(1, 'month'));
  };
  
  const handleDateClick = (date: Dayjs) => {
    onDateSelect(date);
    onClose();
  };
  
  return (
    <div className="p-3 w-72">
      {/* Header with month/year navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="font-medium text-sm">
          {monthNames[viewDate.month()]} {viewDate.year()}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-xs font-medium text-gray-500 text-center p-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const isCurrentMonth = date.month() === viewDate.month();
          const isSelected = selectedDate?.isSame(date, 'day');
          const isToday = date.isSame(dayjs(), 'day');
          
          return (
            <Button
              key={date.format('YYYY-MM-DD')}
              variant="ghost"
              size="sm"
              onClick={() => handleDateClick(date)}
              className={cn(
                "h-8 w-8 p-0 text-xs font-normal",
                !isCurrentMonth && "text-gray-400",
                isSelected && "bg-blue-500 text-white hover:bg-blue-600",
                isToday && !isSelected && "bg-blue-100 text-blue-600",
                isCurrentMonth && !isSelected && !isToday && "hover:bg-gray-100"
              )}
            >
              {date.date()}
            </Button>
          );
        })}
      </div>
      
      {/* Quick actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDateClick(dayjs())}
          className="flex-1"
        >
          Heute
        </Button>
        
        {selectedDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onDateSelect(null as any);
              onClose();
            }}
            className="text-red-600 hover:text-red-700 flex-1"
          >
            Löschen
          </Button>
        )}
      </div>
    </div>
  );
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

  const handleDateSelect = (date: Dayjs | null) => {
    if (isControlled) {
      onChange?.(date);
    } else {
      setInternalValue(date);
      onChange?.(date);
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
              "w-full justify-start text-left font-normal h-10",
              !currentValue && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <EnhancedCalendar
            selectedDate={currentValue}
            onDateSelect={handleDateSelect}
            onClose={() => setIsOpen(false)}
          />
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

  const handleDateSelect = (date: Dayjs | null) => {
    if (isControlled) {
      onChange?.(date);
    } else {
      setInternalValue(date);
      onChange?.(date);
    }
  };

  const handleToday = () => {
    const today = dayjs();
    handleDateSelect(today);
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
          <EnhancedCalendar
            selectedDate={currentValue}
            onDateSelect={handleDateSelect}
            onClose={() => setIsOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
