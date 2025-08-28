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
    <Popover open={false} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200",
            !isValidDate && "text-gray-500",
            "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={true}
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
        className="w-auto p-0 border shadow-lg rounded-lg z-[9999]"
        align="start"
        sideOffset={8}
      >
        <div className="bg-white rounded-lg border border-gray-200 shadow-xl min-w-[300px]">
          <DayPicker
            mode="single"
            selected={isValidDate ? date : undefined}
            onSelect={(selectedDate) => {
              onDateChange?.(selectedDate)
              setOpen(false)
            }}
            locale={de}
            weekStartsOn={1}
            showOutsideDays={true}
            className="p-4"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-lg font-semibold text-gray-900",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-8 w-8 bg-transparent p-0 hover:bg-gray-100 border-0 text-gray-600 hover:text-gray-800 transition-colors duration-200 rounded-md"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-500 rounded-md w-8 font-medium text-sm text-center",
              row: "flex w-full mt-2",
              cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-blue-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-gray-100 transition-colors"
              ),
              day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white",
              day_today: "bg-blue-100 text-blue-900 font-semibold",
              day_outside: "text-gray-400 opacity-50 aria-selected:bg-blue-50 aria-selected:text-blue-400 aria-selected:opacity-30",
              day_disabled: "text-gray-400 opacity-50",
              day_range_middle: "aria-selected:bg-blue-50 aria-selected:text-blue-900",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
              IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
            }}
          />
          {isValidDate && (
            <div className="px-4 pb-4 pt-0 border-t bg-gray-50 rounded-b-lg">
              <p className="text-sm font-medium text-gray-700 text-center">
                {format(date, "EEEE, d. MMMM yyyy", { locale: de })}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
