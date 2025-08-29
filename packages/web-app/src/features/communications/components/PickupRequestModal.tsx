import { useState } from 'react';
import { X, Calendar, Car } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';

interface Child {
  id: number;
  name: string;
  class: string;
}

interface PickupRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: Child[];
}

const dayNames = ['S', 'M', 'D', 'M', 'D', 'F', 'S'];
const dayLabels = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export function PickupRequestModal({ isOpen, onClose, children }: PickupRequestModalProps) {
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [selectedChildren, setSelectedChildren] = useState<Set<number>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [pickupType, setPickupType] = useState<string>('');
  const [pickupPerson, setPickupPerson] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');

  const pickupTypes = [
    { value: 'allein', label: 'Kind geht allein' },
    { value: 'abholung', label: 'Abholung' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle form submission
    console.log('Submitting pickup request:', {
      isRecurring,
      selectedChildren: Array.from(selectedChildren),
      selectedDate,
      selectedDays: isRecurring ? Array.from(selectedDays) : undefined,
      pickupType,
      pickupPerson: pickupType === 'abholung' ? pickupPerson : undefined,
      additionalInfo
    });
    
    // Reset form and close modal
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setIsRecurring(false);
    setSelectedChildren(new Set());
    setSelectedDate('');
    setSelectedDays(new Set());
    setPickupType('');
    setPickupPerson('');
    setAdditionalInfo('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChildToggle = (childId: number) => {
    setSelectedChildren(prev => {
      const newSet = new Set(prev);
      if (newSet.has(childId)) {
        newSet.delete(childId);
      } else {
        newSet.add(childId);
      }
      return newSet;
    });
  };

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  const isFormValid = () => {
    const hasChildren = selectedChildren.size > 0;
    const hasDate = selectedDate !== '';
    const hasPickupType = pickupType !== '';
    const hasPickupPerson = pickupType !== 'abholung' || pickupPerson !== '';
    const hasDaysIfRecurring = !isRecurring || selectedDays.size > 0;
    
    return hasChildren && hasDate && hasPickupType && hasPickupPerson && hasDaysIfRecurring;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Car className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold leading-tight">Abholung / Sonderregelung</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Recurring Toggle */}
            <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                />
                <Label htmlFor="recurring" className="text-blue-800 font-medium">
                  Neuer Abholplan (jede Woche)
                </Label>
              </div>
            </div>

            {/* 2. Student Selection (Multiple) */}
            <div className="space-y-2">
              <Label className="text-gray-700">Schüler*innen auswählen</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`child-${child.id}`}
                      checked={selectedChildren.has(child.id)}
                      onCheckedChange={() => handleChildToggle(child.id)}
                    />
                    <Label htmlFor={`child-${child.id}`} className="text-gray-700 cursor-pointer">
                      {child.name} ({child.class})
                    </Label>
                  </div>
                ))}
              </div>
              {selectedChildren.size === 0 && (
                <p className="text-sm text-red-600">Bitte mindestens ein Kind auswählen</p>
              )}
            </div>

            {/* 3. Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date-select" className="text-gray-700">
                {isRecurring ? 'Startdatum*' : 'Datum*'}
              </Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="h-12 bg-gray-50 border-gray-300"
              />
            </div>

            {/* Day Selection for Weekly Plan */}
            {isRecurring && (
              <div className="space-y-2">
                <Label className="text-gray-700">Wochentage auswählen*</Label>
                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="flex justify-center gap-4">
                    {dayNames.slice(1, 6).map((day, index) => (
                      <button
                        key={index + 1}
                        type="button"
                        onClick={() => handleDayToggle(index + 1)}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-medium transition-colors ${
                          selectedDays.has(index + 1)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                        title={dayLabels[index + 1]}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {selectedDays.size === 0 && isRecurring && (
                    <p className="text-sm text-red-600 text-center mt-2">Bitte mindestens einen Wochentag auswählen</p>
                  )}
                </div>
              </div>
            )}

            {/* 4. Pickup Type */}
            <div className="space-y-2">
              <Label htmlFor="pickup-type" className="text-gray-700">Art der Abholung*</Label>
              <Select value={pickupType} onValueChange={setPickupType} required>
                <SelectTrigger className="h-12 bg-gray-50 border-gray-300">
                  <SelectValue placeholder="Art der Abholung auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {pickupTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Pickup Person Text Field */}
              {pickupType === 'abholung' && (
                <div className="mt-3">
                  <Label htmlFor="pickup-person" className="text-gray-700">Wer soll abholen?*</Label>
                  <Input
                    id="pickup-person"
                    type="text"
                    placeholder="Name der Person eingeben"
                    value={pickupPerson}
                    onChange={(e) => setPickupPerson(e.target.value)}
                    required
                    className="h-12 bg-gray-50 border-gray-300 mt-1"
                  />
                </div>
              )}
            </div>

            {/* 5. Additional Information */}
            <div className="space-y-2">
              <Label htmlFor="additional-info" className="text-gray-700">Weitere Angaben</Label>
              <Textarea
                id="additional-info"
                placeholder="Zusätzliche Informationen zur Abholung eingeben"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
                className="bg-gray-50 border-gray-300 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!isFormValid()}
              >
                Speichern
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
