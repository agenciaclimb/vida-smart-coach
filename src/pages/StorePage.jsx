import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import ProductsList from '@/components/ProductsList';

const StorePage = () => {
  return (
    <>
      <Helmet>
        <title>Loja - Vida Smart</title>
        <meta name="description" content="Explore nossos produtos exclusivos na loja Vida Smart." />
      </Helmet>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Nossa Loja
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-300">
                Produtos selecionados para potencializar sua jornada de saúde e bem-estar.
              </p>
            </motion.div>
            <ProductsList />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default StorePage;