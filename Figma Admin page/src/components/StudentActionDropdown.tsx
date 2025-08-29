import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronDown, UserCheck, AlertTriangle, CheckCircle } from 'lucide-react';

interface StudentActionDropdownProps {
  studentId: string;
  studentName: string;
  onAction: (studentId: string, action: string, details?: { status?: string; reason?: string }) => void;
}

export function StudentActionDropdown({ studentId, studentName, onAction }: StudentActionDropdownProps) {
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEinchecken = () => {
    onAction(studentId, 'einchecken');
  };

  const handleStatusChange = () => {
    setIsStatusDialogOpen(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedStatus) return;
    
    setIsSubmitting(true);
    try {
      onAction(studentId, 'status_change', {
        status: selectedStatus,
        reason: reason.trim() || undefined
      });
      
      // Reset form
      setSelectedStatus('');
      setReason('');
      setIsStatusDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    if (isSubmitting) return;
    setIsStatusDialogOpen(false);
    setSelectedStatus('');
    setReason('');
  };

  const statusOptions = [
    { value: 'entschuldigt', label: 'Entschuldigt', icon: UserCheck, description: 'Berechtigt abwesend' },
    { value: 'beurlaubt', label: 'Beurlaubt', icon: CheckCircle, description: 'Offiziell freigestellt' },
    { value: 'unentschuldigt', label: 'Unentschuldigt', icon: AlertTriangle, description: 'Unberechtigt abwesend' }
  ];

  const getStatusIcon = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.icon || AlertTriangle;
  };

  const TriggerButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => (
      <button
        ref={ref}
        className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1"
        {...props}
      >
        Aktion
        <ChevronDown className="h-3 w-3" />
      </button>
    )
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TriggerButton />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={handleEinchecken}
            className="gap-2 cursor-pointer"
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium">Einchecken</div>
              <div className="text-xs text-muted-foreground">Als anwesend markieren</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={handleStatusChange}
            className="gap-2 cursor-pointer"
          >
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <div>
              <div className="font-medium">Status ändern</div>
              <div className="text-xs text-muted-foreground">Entschuldigt/Beurlaubt/Unentschuldigt</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Status ändern - {studentName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="status-select">Neuer Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status-select">
                  <SelectValue placeholder="Status auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason-input">
                Grund/Bemerkung
                <span className="text-xs text-muted-foreground ml-2">(optional)</span>
              </Label>
              <Input
                id="reason-input"
                placeholder="z.B. 'Arzttermin', 'Familiärer Notfall', 'Unentschuldigt ferngeblieben'..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={handleDialogClose}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleStatusSubmit}
                disabled={!selectedStatus || isSubmitting}
                className="gap-1"
              >
                {isSubmitting ? (
                  'Speichern...'
                ) : (
                  <>
                    {selectedStatus && React.createElement(getStatusIcon(selectedStatus), { className: "h-3 w-3" })}
                    Status setzen
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}