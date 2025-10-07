
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, List, Kanban, Tag, User, Loader2 } from 'lucide-react';
import { ClientHistoryModal } from '@/components/admin/ClientHistoryModal';
import { useAdmin } from '@/contexts/data/AdminContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocation, useNavigate } from 'react-router-dom';

const ConversationsTab = () => {
  const { conversations, loadingConversations } = useAdmin();
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const clientIdFromUrl = useMemo(() => searchParams.get('clientId'), [searchParams]);

  useEffect(() => {
    if (clientIdFromUrl && conversations.length > 0) {
      const clientToSelect = conversations.find(c => c.id === clientIdFromUrl);
      if (clientToSelect) {
        setSelectedClient(clientToSelect);
        navigate('/admin/conversations', { replace: true });
      }
    }
  }, [clientIdFromUrl, conversations, navigate]);

  if (loadingConversations) {
    return (
      <TabsContent value="conversations" className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </TabsContent>
    );
  }

  const filteredConversations = (conversations || []).filter(c =>
    (c.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
  
  const formatTimeAgo = (date) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  const renderListView = () => (
    <div className="space-y-3">
      {filteredConversations.map(convo => (
        <motion.div
          key={convo.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="vida-smart-card p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center space-x-4 cursor-pointer"
          onClick={() => setSelectedClient(convo)}
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-500" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <p className="font-semibold">{convo.full_name}</p>
              <p className="text-xs text-gray-500">{formatTimeAgo(convo.lastMessageTime)}</p>
            </div>
            <p className="text-sm text-gray-600 truncate">{convo.lastMessage}</p>
            <div className="mt-2 flex space-x-2">
              {convo.tags.map(tag => (
                <span key={tag} className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  tag === 'VIP' ? 'bg-purple-100 text-purple-800' :
                  tag === 'Lead' ? 'bg-blue-100 text-blue-800' :
                  tag === 'Em Teste' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>{tag}</span>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderKanbanView = () => {
    const columns = {
      'Leads': filteredConversations.filter(c => c.tags.includes('Lead')),
      'Em Teste': filteredConversations.filter(c => c.tags.includes('Em Teste')),
      'Ativos': filteredConversations.filter(c => c.tags.includes('Ativo')),
      'VIPs': filteredConversations.filter(c => c.tags.includes('VIP')),
    };

    return (
      <div className="grid md:grid-cols-4 gap-4">
        {Object.entries(columns).map(([title, items]) => (
          <div key={title} className="bg-gray-100 p-3 rounded-lg">
            <h3 className="font-semibold mb-3">{title} ({items.length})</h3>
            <div className="space-y-3">
              {items.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="vida-smart-card p-3 rounded-md shadow-sm cursor-pointer"
                  onClick={() => setSelectedClient(item)}
                >
                  <p className="font-semibold text-sm">{item.full_name}</p>
                  <p className="text-xs text-gray-600 mt-1 truncate">{item.lastMessage}</p>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <TabsContent value="conversations" className="space-y-6 mt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Conversas da IA</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conversa..."
                className="pl-10 w-48 sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline"><Tag className="w-4 h-4 mr-2" /> Gerenciar Tags</Button>
            <div className="bg-gray-200 p-1 rounded-lg flex">
              <Button size="sm" variant={view === 'list' ? 'default' : 'ghost'} onClick={() => setView('list')}><List className="w-4 h-4" /></Button>
              <Button size="sm" variant={view === 'kanban' ? 'default' : 'ghost'} onClick={() => setView('kanban')}><Kanban className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
        {view === 'list' ? renderListView() : renderKanbanView()}
      </TabsContent>
      {selectedClient && <ClientHistoryModal client={selectedClient} isOpen={!!selectedClient} onClose={() => setSelectedClient(null)} />}
    </>
  );
};

export default ConversationsTab;
