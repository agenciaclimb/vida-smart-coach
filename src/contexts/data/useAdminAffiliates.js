
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const useAdminAffiliates = (invokeFn, setLoading) => {
  const [affiliates, setAffiliates] = useState([]);
  
  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invokeFn('admin-affiliates');
      setAffiliates(data);
    } catch (error) {
      console.error("Erro ao buscar afiliados:", error);
      toast.error(`Não foi possível carregar os afiliados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [invokeFn, setLoading]);

  const handleSaveAffiliate = useCallback(async (affiliateData, affiliateId) => {
    try {
      setLoading(true);
      await invokeFn('admin-create-affiliate', { affiliateData, affiliateId });
      toast.success(`Afiliado ${affiliateId ? 'atualizado' : 'criado'} com sucesso!`);
      await fetchAffiliates();
      return true;
    } catch (error) {
      console.error("Erro ao salvar afiliado:", error);
      toast.error(`Falha ao salvar afiliado: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [invokeFn, setLoading, fetchAffiliates]);

  const handleDeleteAffiliate = useCallback(async (affiliateId) => {
    try {
      setLoading(true);
      await invokeFn('admin-delete-affiliate', { affiliateId });
      toast.success("Afiliado excluído com sucesso!");
      await fetchAffiliates();
      return true;
    } catch (error) {
      console.error("Erro ao excluir afiliado:", error);
      toast.error(`Falha ao excluir afiliado: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [invokeFn, setLoading, fetchAffiliates]);

  return {
    affiliates,
    fetchAffiliates,
    handleSaveAffiliate,
    handleDeleteAffiliate,
  };
};

export default useAdminAffiliates;
