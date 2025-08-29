import { useState } from 'react';
import { Menu, User, Settings } from 'lucide-react';

export function TestDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
          onClick={() => setIsOpen(false)}
        >
          <div className="py-1">
            <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              My Profile
            </div>
            <div className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </div>
            <div className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer">
              <Menu className="h-4 w-4 mr-2" />
              Logout
            </div>
          </div>
        </div>
      )}
    </div>
  );
}