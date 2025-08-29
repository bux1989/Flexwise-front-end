import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { DebugOverlay } from '../debug';

interface EditProfileProps {
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export function EditProfile({ onClose, user }: EditProfileProps) {
  return (
    <DebugOverlay name="EditProfile">
      <div className="p-1 lg:p-6">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">Profil bearbeiten</h2>
            </div>
          </div>

          <div className="p-4">
            {/* Empty content - will be filled later */}
          </div>
        </div>
      </div>
    </DebugOverlay>
  );
}
