"use client"

import * as React from "react"
import { format } from "date-fns"
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
  placeholder = "MM/DD/YYYY",
  className,
  disabled = false,
}: DatePickerProps) {
  console.log('🔍 REAL DatePicker rendered with props:', { date, disabled, placeholder, className });
  const [open, setOpen] = React.useState(false)

  // FORCE DISABLE THE POPUP
  const forceDisabled = true;
  console.log('🚫 DatePicker popup DISABLED');

  return (
    <Popover open={false} onOpenChange={() => console.log('🚫 Popover prevented from opening')}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200",
            !date && "text-gray-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 w-full">
            <span className="flex-1 text-left text-sm">
              {date ? (
                format(date, "MM/dd/yyyy")
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </span>
            <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border shadow-lg rounded-lg"
        align="start"
        sideOffset={4}
      >
        <div className="bg-white rounded-lg">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              onDateChange?.(selectedDate)
              setOpen(false)
            }}
            initialFocus
            className="border-0"
          />
          {date && (
            <div className="px-4 pb-3 pt-0 border-t bg-gray-50 rounded-b-lg">
              <p className="text-sm font-medium text-gray-900">
                {format(date, "EEE, MMM d", { locale: de })}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
