import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';

interface AddExcuseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (excuseText: string) => void;
  itemType: 'absence' | 'lateness';
  studentName: string;
  date: string;
  subject: string;
}

export function AddExcuseModal({
  isOpen,
  onClose,
  onSave,
  itemType,
  studentName,
  date,
  subject
}: AddExcuseModalProps) {
  const [excuseText, setExcuseText] = useState('');

  const handleSave = () => {
    if (excuseText.trim()) {
      onSave(excuseText.trim());
      setExcuseText('');
      onClose();
    }
  };

  const handleClose = () => {
    setExcuseText('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Entschuldigung hinzufügen - {studentName}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {date} - {subject} ({itemType === 'absence' ? 'Fehlzeit' : 'Verspätung'})
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="excuse-text">Entschuldigungstext</Label>
            <Textarea
              id="excuse-text"
              value={excuseText}
              onChange={(e) => setExcuseText(e.target.value)}
              placeholder="Grund der Entschuldigung eingeben..."
              className="min-h-[100px] mt-2"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Die Entschuldigung wird als vom aktuellen Lehrer (Schmidt) erstellt markiert.
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={!excuseText.trim()}>
              Entschuldigung hinzufügen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
