import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/de';
import { Calendar } from 'lucide-react';
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

  // Determine if this is controlled or uncontrolled
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleDateChange = (newValue: Dayjs | null) => {
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInternalValue(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
        <MuiDatePicker
          value={currentValue}
          onChange={handleDateChange}
          disabled={disabled}
          format={format}
          slotProps={{
            textField: {
              placeholder,
              variant: 'outlined',
              size: 'small',
              fullWidth: true,
              sx: {
                '& .MuiOutlinedInput-root': {
                  height: '40px',
                  borderRadius: '6px',
                  borderColor: '#d1d5db',
                  '&:hover': {
                    borderColor: '#9ca3af',
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
                  },
                },
                '& .MuiInputBase-input': {
                  padding: '8px 12px',
                  fontSize: '14px',
                },
              },
            },
          }}
        />
      </LocalizationProvider>
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

  const handleDateChange = (newValue: Dayjs | null) => {
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInternalValue(newValue);
      onChange?.(newValue);
    }
  };

  const handleToday = () => {
    const today = dayjs();
    handleDateChange(today);
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
        
        <PopoverContent className="w-auto p-3" align="end">
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
            <MuiDatePicker
              value={currentValue}
              onChange={(newValue) => {
                handleDateChange(newValue);
                setIsOpen(false);
              }}
              disabled={disabled}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    width: '200px',
                    '& .MuiOutlinedInput-root': {
                      height: '36px',
                      borderRadius: '6px',
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
          
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleToday();
                setIsOpen(false);
              }}
              className="w-full"
            >
              Heute
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
