import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { ExcuseInfo, ExcuseEditHistory } from '../data/klassenbuchDataAdapter';

interface ExcuseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  excuseInfo: ExcuseInfo;
  onSave: (updatedExcuse: ExcuseInfo) => void;
  onDelete: () => void;
  itemType: 'absence' | 'lateness';
  studentName: string;
  date: string;
  subject: string;
}

export function ExcuseEditModal({
  isOpen,
  onClose,
  excuseInfo,
  onSave,
  onDelete,
  itemType,
  studentName,
  date,
  subject
}: ExcuseEditModalProps) {
  const [excuseText, setExcuseText] = useState(excuseInfo.text);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleSave = () => {
    if (excuseText.trim() === excuseInfo.text.trim()) {
      onClose();
      return;
    }

    const now = new Date();
    const newEditHistory: ExcuseEditHistory = {
      editorId: 'Schmidt', // Current teacher
      editorName: 'Schmidt',
      timestamp: now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ', ' + 
                now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      previousText: excuseInfo.text
    };

    const updatedExcuse: ExcuseInfo = {
      ...excuseInfo,
      text: excuseText.trim(),
      editHistory: [...excuseInfo.editHistory, newEditHistory]
    };

    onSave(updatedExcuse);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleClose = () => {
    setExcuseText(excuseInfo.text);
    setShowDeleteConfirmation(false);
    onClose();
  };

  const formatEditHistory = () => {
    if (excuseInfo.editHistory.length === 0) {
      return `(${excuseInfo.createdBy}: ${excuseInfo.createdAt})`;
    }

    const lastEdit = excuseInfo.editHistory[excuseInfo.editHistory.length - 1];
    return `(${excuseInfo.createdBy}: ${excuseInfo.createdAt}; zuletzt: ${lastEdit.editorId} ${lastEdit.timestamp})`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Entschuldigung bearbeiten - {studentName}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {date} - {subject} ({itemType === 'absence' ? 'Fehlzeit' : 'Verspätung'})
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {showDeleteConfirmation ? (
            <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p>
                    Möchten Sie diese Entschuldigung wirklich löschen? 
                    Die {itemType === 'absence' ? 'Fehlzeit' : 'Verspätung'} wird dann als unentschuldigt markiert.
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleDelete}
                    >
                      Ja, löschen
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDeleteConfirmation(false)}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <>
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
                <strong>Bearbeitungshistorie:</strong><br />
                {formatEditHistory()}
              </div>
            </>
          )}

          <div className="flex justify-between">
            <div>
              {!showDeleteConfirmation && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Entschuldigung löschen</span>
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Abbrechen
              </Button>
              {!showDeleteConfirmation && (
                <Button onClick={handleSave}>
                  Speichern
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
