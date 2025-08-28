"use client"

import * as React from "react"
import { format, isValid } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "./utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
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

  const formatCalendarFooter = (selectedDate: Date | undefined) => {
    if (!selectedDate || !isValid(selectedDate)) {
      return '';
    }

    try {
      // Show full date in German format
      return format(selectedDate, "EEEE, d. MMMM yyyy", { locale: de });
    } catch (error) {
      console.warn('Calendar footer formatting error:', error);
      return '';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200",
            !isValidDate && "text-gray-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
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
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border shadow-lg rounded-lg z-[1000]"
        align="start"
        sideOffset={4}
        style={{ zIndex: 1000 }}
      >
        <div className="bg-white rounded-lg border border-gray-200 shadow-xl">
          <Calendar
            mode="single"
            selected={isValidDate ? date : undefined}
            onSelect={(selectedDate) => {
              onDateChange?.(selectedDate)
              setOpen(false)
            }}
            initialFocus
            className="border-0 p-3"
            locale={de}
            weekStartsOn={1}
            showOutsideDays={true}
          />
          {isValidDate && (
            <div className="px-4 pb-3 pt-2 border-t bg-gray-50 rounded-b-lg">
              <p className="text-sm font-medium text-gray-900">
                {formatCalendarFooter(date)}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
