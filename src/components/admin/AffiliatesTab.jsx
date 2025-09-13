
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/contexts/data/AdminContext';
import AffiliateEditModal from './AffiliateEditModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';
import { Search, UserPlus, Edit, Trash2, Link as LinkIcon, Copy, Loader2 } from 'lucide-react';

const AffiliatesTab = () => {
    const { affiliates, loadingAffiliates, saveAffiliate, deleteAffiliate } = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [affiliateToDelete, setAffiliateToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAddNew = () => {
        setSelectedAffiliate(null);
        setIsEditModalOpen(true);
    };

    const handleEdit = (affiliate) => {
        setSelectedAffiliate(affiliate);
        setIsEditModalOpen(true);
    };

    const confirmDelete = (affiliate) => {
        setAffiliateToDelete(affiliate);
        setIsDeleteAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!affiliateToDelete) return;
        setIsDeleting(true);
        try {
            await deleteAffiliate(affiliateToDelete.id);
        } finally {
            setIsDeleting(false);
            setIsDeleteAlertOpen(false);
            setAffiliateToDelete(null);
        }
    };
    
    const handleCopyLink = (code) => {
        const url = `${window.location.origin}/register?ref=${code}`;
        navigator.clipboard.writeText(url);
        toast.success("Link de afiliado copiado!");
    };
    
    const filteredAffiliates = useMemo(() => {
        return (affiliates || []).filter(affiliate =>
            (affiliate.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (affiliate.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (affiliate.affiliate_code || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [affiliates, searchTerm]);

    if (loadingAffiliates) {
        return (
            <TabsContent value="affiliates" className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </TabsContent>
        );
    }

    return (
        <>
            <TabsContent value="affiliates" className="space-y-6 mt-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Gerenciar Afiliados</h2>
                    <div className="flex space-x-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar afiliados..."
                                className="pl-10 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAddNew} className="vida-smart-gradient text-white">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Novo Afiliado
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Afiliado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código de Afiliado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clientes Indicados</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                                {filteredAffiliates.length > 0 ? (
                                    filteredAffiliates.map((affiliate) => (
                                        <tr key={affiliate.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{affiliate.full_name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{affiliate.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    <LinkIcon className="w-4 h-4 mr-2" />
                                                    {affiliate.affiliate_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{affiliate.referred_clients_count || 0}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <Button size="icon" variant="ghost" onClick={() => handleCopyLink(affiliate.affiliate_code)}>
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(affiliate)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive/80" onClick={() => confirmDelete(affiliate)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center p-8 text-gray-500 dark:text-gray-400">
                                            Nenhum afiliado encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </TabsContent>

            <AffiliateEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                affiliate={selectedAffiliate}
                onSave={saveAffiliate}
            />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso irá remover permanentemente o afiliado 
                            e todos os seus dados associados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Sim, excluir afiliado
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AffiliatesTab;
