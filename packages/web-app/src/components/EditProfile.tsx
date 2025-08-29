import { X } from 'lucide-react';
import { Button } from './ui/button';
import { DebugOverlay } from '../debug';

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export function EditProfile({ isOpen, onClose, user }: EditProfileProps) {
  if (!isOpen) return null;

  return (
    <DebugOverlay name="EditProfile">
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Profil bearbeiten</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4">
            {/* Empty content - will be filled later */}
          </div>
        </div>
      </div>
    </DebugOverlay>
  );
}
