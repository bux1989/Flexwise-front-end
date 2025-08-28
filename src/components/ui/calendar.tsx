"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "./utils"
import { buttonVariants } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white rounded-lg", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center mb-3",
        caption_label: "text-base font-medium text-gray-900",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 hover:bg-gray-100 border-0 text-gray-600 hover:text-gray-800 transition-colors duration-200 rounded-md"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex mb-1",
        head_cell:
          "text-gray-500 w-9 h-8 font-medium text-xs flex items-center justify-center uppercase",
        row: "flex w-full",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal text-gray-900 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors duration-200 aria-selected:opacity-100 cursor-pointer flex items-center justify-center text-sm"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white rounded-full font-medium",
        day_today: "bg-gray-100 text-gray-900 font-medium rounded-full",
        day_outside:
          "day-outside text-gray-300 opacity-50 aria-selected:bg-blue-50 aria-selected:text-gray-400 aria-selected:opacity-30",
        day_disabled: "text-gray-200 opacity-50 cursor-not-allowed hover:bg-transparent",
        day_range_middle:
          "aria-selected:bg-blue-50 aria-selected:text-blue-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4 text-gray-600" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4 text-gray-600" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
