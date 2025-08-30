export interface DebugContextType {
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  enterDebugMode: () => void;
  exitDebugMode: () => void;
  showPasswordModal: boolean;
  setShowPasswordModal: (show: boolean) => void;
  verifyPassword: (password: string) => boolean;
}

export interface DebugOverlayProps {
  id: string;
  name: string;
  children: React.ReactNode;
  className?: string;
}

export interface ComponentDebugInfo {
  id: string;
  name: string;
  filePath?: string;
}
