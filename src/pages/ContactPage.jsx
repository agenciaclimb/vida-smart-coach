import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, Send } from 'lucide-react';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const webhookUrl = 'https://hooks.zapier.com/hooks/catch/24098053/u4c8f2s/';

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar os dados. Tente novamente.');
      }

      toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      setFormData({ nome: '', email: '', telefone: '', mensagem: '' });
    } catch (error) {
      toast.error(error.message || 'Ocorreu um erro. Por favor, tente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contato - Vida Smart | Fale Conosco</title>
        <meta name="description" content="Entre em contato com a equipe Vida Smart. Estamos prontos para ajudar você a alcançar seus objetivos de saúde e bem-estar." />
      </Helmet>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-16 sm:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-12">
                <Mail className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                  Entre em Contato
                </h1>
                <p className="mt-4 text-lg leading-6 text-gray-600">
                  Tem alguma dúvida ou quer saber mais sobre nossos planos? Preencha o formulário abaixo e nossa equipe responderá o mais rápido possível.
                </p>
              </div>

              <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-lg border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="nome" className="text-sm font-medium text-gray-700">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Seu nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone" className="text-sm font-medium text-gray-700">Telefone (com DDD)</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(99) 99999-9999"
                      value={formData.telefone}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mensagem" className="text-sm font-medium text-gray-700">Sua Mensagem</Label>
                    <Textarea
                      id="mensagem"
                      placeholder="Como podemos te ajudar?"
                      value={formData.mensagem}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Button type="submit" className="w-full vida-smart-gradient text-lg py-6" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-5 w-5" />
                      )}
                      {isLoading ? 'Enviando...' : 'Enviar Mensagem'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ContactPage;