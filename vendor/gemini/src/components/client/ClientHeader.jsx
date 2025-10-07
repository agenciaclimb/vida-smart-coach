import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Star, LogOut } from 'lucide-react';

const ClientHeader = ({ user, onLogout }) => {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 vida-smart-gradient rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-primary">Vida Smart</span>
            <p className="text-sm text-gray-600">Olá, {user?.profile?.full_name || 'Cliente'}!</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">{user?.profile?.points || 0} pts</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;