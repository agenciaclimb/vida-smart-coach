import React from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell } from 'lucide-react';

const NotificationsTab = () => {
  return (
    <TabsContent value="notifications" className="space-y-6">
      <h2 className="text-2xl font-bold">Enviar Notificações</h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="vida-smart-card p-6 rounded-2xl shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-6">Mensagem Motivacional</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Título da Mensagem</label>
            <Input placeholder="Ex: Parabéns pelo seu progresso!" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Conteúdo</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-32"
              placeholder="Digite sua mensagem motivacional aqui..."
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Enviar para</label>
            <select className="w-full p-3 border border-gray-300 rounded-md">
              <option>Todos os clientes</option>
              <option>Apenas clientes ativos</option>
              <option>Apenas clientes em teste</option>
              <option>Cliente específico</option>
            </select>
          </div>
          <Button className="w-full vida-smart-gradient text-white">
            <Bell className="w-4 h-4 mr-2" />
            Enviar Notificação
          </Button>
        </div>
      </motion.div>
    </TabsContent>
  );
};

export default NotificationsTab;