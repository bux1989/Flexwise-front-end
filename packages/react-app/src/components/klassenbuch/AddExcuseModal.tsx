import React, { useState } from 'react';

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

  if (!isOpen) return null;

  const handleSave = () => {
    if (excuseText.trim()) {
      onSave(excuseText.trim());
      setExcuseText('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4">
          Entschuldigung hinzufügen
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {studentName} - {subject} - {date}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Typ: {itemType === 'absence' ? 'Fehlzeit' : 'Verspätung'}
        </p>
        <textarea
          value={excuseText}
          onChange={(e) => setExcuseText(e.target.value)}
          placeholder="Entschuldigungsgrund eingeben..."
          className="w-full p-3 border border-gray-300 rounded-md resize-none h-24 mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={!excuseText.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
