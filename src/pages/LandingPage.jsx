import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import Benefits from '@/components/landing/Benefits';
import HowItWorks from '@/components/landing/HowItWorks';
import IACoach from '@/components/landing/IACoach';
import Pricing from '@/components/landing/Pricing';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#planos' && location.state?.scrollToPlans) {
      setTimeout(() => {
        const element = document.getElementById('planos');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <>
      <Helmet>
        <title>Vida Smart Coach - Transforme Sua Saúde com Inteligência Artificial</title>
        <meta name="description" content="Sua jornada para uma vida mais saudável começa aqui. Planos de treino e alimentação personalizados, acompanhamento 24/7 com IA Coach e uma comunidade motivadora." />
      </Helmet>
      <div className="bg-white">
        <Header />
        <main>
          <Hero />
          <Benefits />
          <HowItWorks />
          <IACoach />
          <Pricing />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;