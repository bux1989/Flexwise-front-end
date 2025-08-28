"use client"

import * as React from "react"
import { format, isValid } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "./utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Datum auswählen",
  className,
  disabled = false,
}: DatePickerProps) {
  console.log('🔍 DatePicker rendered with props:', { date, disabled, placeholder, className });
  const [open, setOpen] = React.useState(false)

  // Validate date to prevent errors
  const isValidDate = date && isValid(date)

  const formatDisplayDate = (selectedDate: Date | undefined) => {
    if (!selectedDate || !isValid(selectedDate)) {
      return placeholder;
    }

    try {
      // Use German date format (DD.MM.YYYY)
      return format(selectedDate, "dd.MM.yyyy");
    } catch (error) {
      console.warn('Date formatting error:', error);
      return placeholder;
    }
  };

  return (
    <div
      className={cn(
        "w-full justify-start text-left font-normal h-10 px-3 py-2 bg-white border border-gray-300 opacity-50 cursor-not-allowed rounded-md",
        !isValidDate && "text-gray-500",
        className
      )}
      onClick={() => console.log('🚫 DatePicker clicked - should be disabled!')}
    >
      <div className="flex items-center gap-2 w-full">
        <span className="flex-1 text-left text-sm">
          {isValidDate ? (
            formatDisplayDate(date)
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  )
}
