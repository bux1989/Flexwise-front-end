import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { FileText, Plus, Clock } from 'lucide-react';

interface StudentNote {
  id: string;
  content: string;
  timestamp: string;
  staffInitials: string;
  staffName: string;
}

interface StudentNotesDialogProps {
  studentName: string;
  notes: StudentNote[];
  onAddNote: (content: string) => void;
  trigger?: React.ReactNode;
}

export function StudentNotesDialog({ 
  studentName, 
  notes, 
  onAddNote, 
  trigger 
}: StudentNotesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim()) return;
    
    setIsSubmitting(true);
    try {
      onAddNote(newNote.trim());
      setNewNote('');
      // Keep dialog open to see the new note
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Heute, ${date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const DefaultTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => (
      <button
        ref={ref}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7 p-0 cursor-pointer"
        title="Notiz hinzufügen"
        {...props}
      >
        <FileText className="h-3 w-3" />
      </button>
    )
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <DefaultTrigger />}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notizen - {studentName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Existing Notes */}
          <div className="flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Bisherige Notizen</h4>
              <Badge variant="secondary">{notes.length} Einträge</Badge>
            </div>
            
            {notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Noch keine Notizen vorhanden</p>
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0 max-h-60 pr-4">
                <div className="space-y-3">
                  {notes
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((note, index) => (
                      <div key={note.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {note.staffInitials}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {note.staffName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(note.timestamp)}
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed">{note.content}</p>
                        {index < notes.length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Add New Note */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Neue Notiz hinzufügen</h4>
            <div className="space-y-3">
              <Textarea
                placeholder="z.B. 'Anruf bei Eltern - niemand erreichbar' oder 'Kind von Oma abgeholt'..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-20 resize-none"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Strg+Enter zum schnellen Speichern
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                  >
                    Schließen
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!newNote.trim() || isSubmitting}
                    className="gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {isSubmitting ? 'Speichern...' : 'Hinzufügen'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}