
import React from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, User, Zap, Edit, Send, Gift } from 'lucide-react';

const LogsTab = () => {
  const logs = [
    { icon: <User />, text: 'Admin logou no sistema.', timestamp: '2025-08-01 10:00:00', type: 'auth' },
    { icon: <Zap />, text: 'API do WhatsApp conectada com sucesso.', timestamp: '2025-08-01 10:01:15', type: 'api' },
    { icon: <Edit />, text: 'Plano "Premium" atualizado. Preço alterado para R$ 59,90.', timestamp: '2025-08-01 10:05:30', type: 'plan' },
    { icon: <Send />, text: 'Mensagem manual enviada para o cliente "João Silva".', timestamp: '2025-08-01 10:15:02', type: 'message' },
    { icon: <Gift />, text: 'Recompensa "Desconto 10%" resgatada manualmente para "Maria Oliveira".', timestamp: '2025-08-01 10:20:45', type: 'reward' },
    { icon: <User />, text: 'Admin logou no sistema.', timestamp: '2025-07-31 18:30:00', type: 'auth' },
  ];

  const getIconColor = (type) => {
    switch (type) {
      case 'auth': return 'text-blue-500';
      case 'api': return 'text-green-500';
      case 'plan': return 'text-purple-500';
      case 'message': return 'text-orange-500';
      case 'reward': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <TabsContent value="logs" className="mt-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="vida-smart-card p-6 rounded-2xl shadow-lg"
      >
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Logs Administrativos
        </h3>
        <ScrollArea className="h-[500px] w-full pr-4">
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white ${getIconColor(log.type)}`}>
                  {React.cloneElement(log.icon, { size: 18 })}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{log.text}</p>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </motion.div>
    </TabsContent>
  );
};

export default LogsTab;
