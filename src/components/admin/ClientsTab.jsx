
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/contexts/data/AdminContext';
import ClientEditModal from './ClientEditModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, UserPlus, Edit, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClientsTab = () => {
    const { clients, loadingClients, saveClient, deleteClient } = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    const handleAddNew = () => {
        setSelectedClient(null);
        setIsEditModalOpen(true);
    };

    const handleEdit = (client) => {
        setSelectedClient(client);
        setIsEditModalOpen(true);
    };
    
    const confirmDelete = (client) => {
        setClientToDelete(client);
        setIsDeleteAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!clientToDelete) return;
        setIsDeleting(true);
        try {
            await deleteClient(clientToDelete.id);
        } finally {
            setIsDeleting(false);
            setIsDeleteAlertOpen(false);
            setClientToDelete(null);
        }
    };
    
    const viewConversations = (client) => {
      navigate(`/admin/conversations?clientId=${client.id}`);
    };

    const filteredClients = useMemo(() => {
        return (clients || []).filter(client =>
            (client.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    if (loadingClients) {
        return (
            <TabsContent value="clients" className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </TabsContent>
        );
    }
    
    const getPlanBadge = (plan) => {
        const styles = {
            trial: 'bg-yellow-100 text-yellow-800',
            premium: 'bg-green-100 text-green-800',
            inactive: 'bg-red-100 text-red-800',
            default: 'bg-gray-100 text-gray-800'
        };
        return styles[plan] || styles.default;
    };


    return (
        <>
            <TabsContent value="clients" className="space-y-6 mt-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Gerenciar Clientes</h2>
                    <div className="flex space-x-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar clientes..."
                                className="pl-10 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAddNew} className="vida-smart-gradient text-white">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Novo Cliente
                        </Button>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="vida-smart-card rounded-2xl shadow-lg overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                                {filteredClients.length > 0 ? (
                                    filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{client.full_name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{client.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${getPlanBadge(client.plan)}`}>
                                                   {client.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                <div className="flex justify-center space-x-1">
                                                     <Button size="icon" variant="ghost" onClick={() => viewConversations(client)}>
                                                        <MessageSquare className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(client)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive/80" onClick={() => confirmDelete(client)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center p-8 text-gray-500 dark:text-gray-400">
                                            Nenhum cliente encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </TabsContent>

            <ClientEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                client={selectedClient}
                onSave={saveClient}
            />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá remover permanentemente o cliente 
                            e todos os seus dados associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Sim, excluir cliente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ClientsTab;
