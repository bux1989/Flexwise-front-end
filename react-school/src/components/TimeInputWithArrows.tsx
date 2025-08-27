import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface TimeInputWithArrowsProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
  id?: string;
  title?: string;
}

export function TimeInputWithArrows({ 
  value, 
  onChange, 
  min, 
  max, 
  className = '', 
  id,
  title 
}: TimeInputWithArrowsProps) {
  
  // Helper function to convert time string (HH:MM) to minutes since midnight
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to convert minutes since midnight back to time string (HH:MM)
  const minutesToTime = (totalMinutes: number): string => {
    // Ensure we stay within 24-hour bounds
    totalMinutes = Math.max(0, Math.min(1439, totalMinutes)); // 0 to 23:59
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Handle increment (add 5 minutes)
  const handleIncrement = () => {
    if (!value) return;
    
    const currentMinutes = timeToMinutes(value);
    const newMinutes = currentMinutes + 5;
    const newTimeStr = minutesToTime(newMinutes);
    
    // Check if within bounds
    if (max && timeToMinutes(newTimeStr) >= timeToMinutes(max)) {
      return; // Don't exceed maximum
    }
    
    onChange(newTimeStr);
  };

  // Handle decrement (subtract 5 minutes)
  const handleDecrement = () => {
    if (!value) return;
    
    const currentMinutes = timeToMinutes(value);
    const newMinutes = currentMinutes - 5;
    const newTimeStr = minutesToTime(newMinutes);
    
    // Check if within bounds
    if (min && timeToMinutes(newTimeStr) <= timeToMinutes(min)) {
      return; // Don't go below minimum
    }
    
    onChange(newTimeStr);
  };

  // Check if increment is disabled
  const isIncrementDisabled = () => {
    if (!value || !max) return false;
    const currentMinutes = timeToMinutes(value);
    const maxMinutes = timeToMinutes(max);
    return (currentMinutes + 5) >= maxMinutes;
  };

  // Check if decrement is disabled
  const isDecrementDisabled = () => {
    if (!value || !min) return false;
    const currentMinutes = timeToMinutes(value);
    const minMinutes = timeToMinutes(min);
    return (currentMinutes - 5) <= minMinutes;
  };

  return (
    <div className="relative flex items-center">
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step="60"
        className={`pr-8 ${className}`}
        title={title}
      />
      <div className="absolute right-1 top-0 bottom-0 flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleIncrement}
          disabled={isIncrementDisabled()}
          className="h-4 w-6 p-0 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
          title="Zeit um 5 Minuten erhöhen"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDecrement}
          disabled={isDecrementDisabled()}
          className="h-4 w-6 p-0 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
          title="Zeit um 5 Minuten verringern"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
