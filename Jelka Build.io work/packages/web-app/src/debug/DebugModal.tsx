import React, { useState, useEffect } from 'react';
import { useDebug } from './DebugProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Eye, EyeOff, Lock, Unlock, X } from 'lucide-react';

export function DebugModal() {
  const { 
    showPasswordModal, 
    setShowPasswordModal, 
    verifyPassword, 
    enterDebugMode,
    exitDebugMode,
    isDebugMode 
  } = useDebug();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Clear form when modal opens/closes
  useEffect(() => {
    if (!showPasswordModal) {
      setPassword('');
      setError('');
      setShowPassword(false);
    }
  }, [showPasswordModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verifyPassword(password)) {
      enterDebugMode();
      setError('');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  const handleClose = () => {
    setShowPasswordModal(false);
  };

  const handleExitDebugMode = () => {
    exitDebugMode();
    setShowPasswordModal(false);
  };

  return (
    <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDebugMode ? (
              <>
                <Unlock className="h-4 w-4 text-green-600" />
                Debug Mode Active
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Enter Debug Mode
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isDebugMode ? (
          // Debug mode active - show exit option
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                Debug Mode Active
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Debug overlays are now visible. Component IDs appear in the top-left corner of each component.
            </p>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Tip:</strong> Use Ctrl+Shift+D to quickly toggle debug mode</p>
              <p><strong>Persistence:</strong> Debug mode persists across browser sessions</p>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleClose}>
                Keep Active
              </Button>
              <Button variant="destructive" onClick={handleExitDebugMode}>
                <X className="h-4 w-4 mr-2" />
                Exit Debug Mode
              </Button>
            </div>
          </div>
        ) : (
          // Not in debug mode - show password entry
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debug-password">Debug Password</Label>
              <div className="relative">
                <Input
                  id="debug-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter debug password..."
                  autoComplete="off"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>What is debug mode?</strong></p>
              <p>• Shows tiny component IDs in corners for easy reference</p>
              <p>• Helps with development and bug reporting</p>
              <p>• Use Ctrl+Shift+D to toggle anytime</p>
            </div>

            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Unlock className="h-4 w-4 mr-2" />
                Enable Debug Mode
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
