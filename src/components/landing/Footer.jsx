import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  const footerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const socialLinks = [
    { icon: <Facebook className="h-6 w-6" />, href: "#" },
    { icon: <Instagram className="h-6 w-6" />, href: "#" },
    { icon: <Twitter className="h-6 w-6" />, href: "#" },
    { icon: <Youtube className="h-6 w-6" />, href: "#" },
  ];

  const footerLinks = [
    { title: 'Soluções', links: [{ name: 'Planos', href: '/#pricing' }, { name: 'Como Funciona', href: '/#how-it-works' }, { name: 'Benefícios', href: '/#benefits' }] },
    { title: 'Empresa', links: [{ name: 'Sobre Nós', href: '#' }, { name: 'Parceiros', href: '/parceiros' }, { name: 'Contato', href: '/contato' }] },
    { title: 'Legal', links: [{ name: 'Privacidade', href: '#' }, { name: 'Termos', href: '#' }] },
  ];

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="bg-gray-900 text-white"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <h2 className="text-3xl font-bold text-white">Vida Smart</h2>
            <p className="text-gray-400 text-base">
              Sua jornada para uma vida mais saudável e inteligente começa aqui.
            </p>
            <div className="flex space-x-6">
              {socialLinks.map((social, index) => (
                <a key={index} href={social.href} className="text-gray-400 hover:text-primary transition-colors duration-300">
                  <span className="sr-only">{social.href}</span>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{footerLinks[0].title}</h3>
                <ul className="mt-4 space-y-4">
                  {footerLinks[0].links.map((link) => (
                    <li key={link.name}>
                      <Link to={link.href} className="text-base text-gray-300 hover:text-white transition-colors duration-300">{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{footerLinks[1].title}</h3>
                <ul className="mt-4 space-y-4">
                  {footerLinks[1].links.map((link) => (
                    <li key={link.name}>
                      <Link to={link.href} className="text-base text-gray-300 hover:text-white transition-colors duration-300">{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-1 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">{footerLinks[2].title}</h3>
                <ul className="mt-4 space-y-4">
                  {footerLinks[2].links.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="text-base text-gray-300 hover:text-white transition-colors duration-300">{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 xl:text-center">&copy; {new Date().getFullYear()} Vida Smart. Todos os direitos reservados.</p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;