import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Bell, LogOut, UserCircle as CircleUser } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "react-hot-toast";
import { useAuth } from '@/contexts/SupabaseAuthContext_FINAL';
import { useNavigate } from 'react-router-dom';


const AdminHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const notifications = [
    { id: 1, text: "Nova venda do Plano Premium!", time: "2 min atrás" },
    { id: 2, text: "Recompensa 'Consulta Grátis' resgatada por Maria.", time: "15 min atrás" },
    { id: 3, text: "Falha na conexão com a API do WhatsApp.", time: "1 hora atrás" },
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 vida-smart-gradient rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-primary">Vida Smart</span>
            <p className="text-xs text-gray-500 -mt-1">Painel Administrativo</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Notificações</h4>
                  <p className="text-sm text-muted-foreground">
                    Você tem {notifications.length} novas notificações.
                  </p>
                </div>
                <div className="grid gap-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0"
                    >
                      <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                      <div className="grid gap-1">
                        <p className="text-sm font-medium">{notification.text}</p>
                        <p className="text-sm text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                 <Button size="sm" onClick={() => toast.success("Notificações marcadas como lidas!")}>
                    Marcar todas como lidas
                 </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <CircleUser className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="flex flex-col space-y-1">
                <p className="font-medium text-sm p-2">Olá, {user?.profile?.full_name || 'Admin'}!</p>
                <Button variant="ghost" className="justify-start" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;