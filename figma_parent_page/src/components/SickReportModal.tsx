import { useState } from 'react';
import { X, Upload, Calendar, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';

interface Child {
  id: number;
  name: string;
  class: string;
}

interface SickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: Child[];
}

export function SickReportModal({ isOpen, onClose, children }: SickReportModalProps) {
  const [selectedChildren, setSelectedChildren] = useState<Set<number>>(new Set());
  const [reportType, setReportType] = useState<'krankmeldung' | 'beurlaubung'>('krankmeldung');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMultipleDays, setIsMultipleDays] = useState(false);
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle form submission
    console.log('Submitting report:', {
      reportType,
      selectedChildren: Array.from(selectedChildren),
      startDate,
      endDate: isMultipleDays ? endDate : startDate,
      isMultipleDays,
      reason,
      files: files.map(f => f.name)
    });
    
    // Reset form and close modal
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedChildren(new Set());
    setReportType('krankmeldung');
    setStartDate('');
    setEndDate('');
    setIsMultipleDays(false);
    setReason('');
    setFiles([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileUpload = (newFiles: FileList | null) => {
    if (!newFiles) return;
    
    const validFiles: File[] = [];
    const maxSize = 4 * 1024 * 1024; // 4MB
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
    
    Array.from(newFiles).forEach(file => {
      if (file.size <= maxSize && allowedTypes.includes(file.type)) {
        validFiles.push(file);
      } else {
        console.warn(`File ${file.name} rejected: ${file.size > maxSize ? 'too large' : 'invalid type'}`);
      }
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
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

  const handleSelectAllChildren = () => {
    if (selectedChildren.size === children.length) {
      setSelectedChildren(new Set());
    } else {
      setSelectedChildren(new Set(children.map(child => child.id)));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                reportType === 'krankmeldung' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <FileText className={`h-5 w-5 ${
                  reportType === 'krankmeldung' ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <h2 className="text-xl font-semibold leading-tight">
                {reportType === 'krankmeldung' ? 'Krankmeldung' : 'Beurlaubung'}
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Report Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="krankmeldung"
                    checked={reportType === 'krankmeldung'}
                    onCheckedChange={(checked) => checked && setReportType('krankmeldung')}
                  />
                  <Label htmlFor="krankmeldung" className="text-gray-700 font-medium">
                    Krankmeldung
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="beurlaubung"
                    checked={reportType === 'beurlaubung'}
                    onCheckedChange={(checked) => checked && setReportType('beurlaubung')}
                  />
                  <Label htmlFor="beurlaubung" className="text-gray-700 font-medium">
                    Beurlaubung
                  </Label>
                </div>
              </div>
            </div>

            {/* Help text for Beurlaubung */}
            {reportType === 'beurlaubung' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">⚠️</span>
                  <p className="text-sm text-yellow-800 leading-tight">
                    <strong>Wichtig:</strong> Das ist nur ein Antrag auf Beurlaubung. Die Schule muss diesen danach bewilligen.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Child Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700">Kinder wählen</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllChildren}
                  className="text-xs"
                >
                  {selectedChildren.size === children.length ? 'Alle abwählen' : 'Alle auswählen'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                      selectedChildren.has(child.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Checkbox
                      id={`child-${child.id}`}
                      checked={selectedChildren.has(child.id)}
                      onCheckedChange={() => handleChildToggle(child.id)}
                      className="mt-0"
                    />
                    <Label
                      htmlFor={`child-${child.id}`}
                      className={`flex-1 cursor-pointer ${
                        selectedChildren.has(child.id) ? 'text-blue-800' : 'text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{child.name}</span>
                      <span className="text-sm ml-1">({child.class})</span>
                    </Label>
                  </div>
                ))}
              </div>
              
              {selectedChildren.size > 0 && (
                <p className="text-sm text-gray-600">
                  {selectedChildren.size} {selectedChildren.size === 1 ? 'Kind' : 'Kinder'} ausgewählt
                </p>
              )}
            </div>

            {/* Multiple Days Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="multiple-days"
                checked={isMultipleDays}
                onCheckedChange={(checked) => setIsMultipleDays(checked as boolean)}
              />
              <Label htmlFor="multiple-days" className="text-gray-700">
                Mehrere Tage
              </Label>
            </div>

            {/* Date Fields */}
            {isMultipleDays ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start-date-input" className="text-gray-700">Von</Label>
                  <Input
                    id="start-date-input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="h-12 bg-gray-50 border-gray-300"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="end-date-input" className="text-gray-700">Bis</Label>
                  <Input
                    id="end-date-input"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    min={startDate} // End date cannot be before start date
                    className="h-12 bg-gray-50 border-gray-300"
                  />
                </div>
              </div>
            ) : (
              /* Single Date */
              <div className="space-y-2">
                <Label htmlFor="single-date-input" className="text-gray-700">Datum</Label>
                <Input
                  id="single-date-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="h-12 bg-gray-50 border-gray-300"
                />
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason-textarea" className="text-gray-700">
                {reportType === 'krankmeldung' ? 'Grund für die Abwesenheit' : 'Grund für die Beurlaubung'}
              </Label>
              <Textarea
                id="reason-textarea"
                placeholder={
                  reportType === 'krankmeldung' 
                    ? "Grund für die Abwesenheit eingeben (z.B. Fieber, Erkältung, Arzttermin)" 
                    : "Grund für die Beurlaubung eingeben (z.B. Familienfeier, Urlaub, wichtiger Termin)"
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
                className="bg-gray-50 border-gray-300 resize-none"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-gray-700">
                {reportType === 'krankmeldung' ? 'Anhang (optional)' : 'Anhang (z.B. Bestätigungen, optional)'}
              </Label>
              
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".svg,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Upload className="h-4 w-4 text-gray-500" />
                  </div>
                  
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-600">
                      Dateien hier ablegen oder klicken zum Hochladen
                    </p>
                    <p className="text-xs text-gray-500">
                      {reportType === 'krankmeldung' 
                        ? 'Z.B. Attest vom Arzt, Bestätigung'
                        : 'Z.B. Bestätigungen, Einladungen, Formulare'
                      } • .svg, .png, .jpg • Max. 4 MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Hochgeladene Dateien:</p>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">{file.name}</p>
                            <p className="text-xs text-green-600">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                disabled={selectedChildren.size === 0 || !startDate || (isMultipleDays && !endDate) || !reason.trim()}
              >
                Absenden
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}