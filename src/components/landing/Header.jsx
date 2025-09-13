import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();
    const navigate = useNavigate();
    const { user } = useAuth();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });
    
    const handleScrollLink = (e, targetId) => {
        e.preventDefault();
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
        setIsOpen(false);
    };

    const handleDashboardAccess = () => {
        if (user) {
            const userRole = user.profile?.role;
            if (userRole === 'admin') navigate('/admin');
            else if (userRole === 'partner') navigate('/painel-parceiro');
            else navigate('/dashboard');
        } else {
            navigate('/login');
        }
        setIsOpen(false);
    };

    const handleSignUp = () => {
        navigate('/login?tab=register');
        setIsOpen(false);
    };

    const navLinks = [
        { name: 'Como Funciona', href: '#comofunciona', targetId: 'comofunciona' },
        { name: 'Benefícios', href: '#beneficios', targetId: 'beneficios' },
        { name: 'Planos', href: '#planos', targetId: 'planos' },
        { name: 'Parceiros', href: '/parceiros' },
        { name: 'Contato', href: '/contato' },
    ];

    return (
        <>
            <motion.header
                variants={{
                    visible: { y: 0 },
                    hidden: { y: "-100%" },
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md"
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <RouterLink to="/" className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">Vida Smart</span>
                        </RouterLink>
                        <nav className="hidden lg:flex items-center space-x-8">
                            {navLinks.map((link) => (
                                link.targetId ? (
                                     <a key={link.name} href={link.href} onClick={(e) => handleScrollLink(e, link.targetId)} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                                        {link.name}
                                    </a>
                                ) : (
                                    <RouterLink
                                        key={link.name}
                                        to={link.href}
                                        className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
                                    >
                                        {link.name}
                                    </RouterLink>
                                )
                            ))}
                        </nav>
                        <div className="hidden lg:flex items-center gap-2">
                            <Button onClick={handleDashboardAccess} variant="ghost" className="text-sm font-medium">
                                {user ? 'Meu Painel' : 'Entrar'}
                            </Button>
                            <Button onClick={handleSignUp} className="vida-smart-gradient text-white rounded-full px-6">
                                Teste Grátis
                            </Button>
                        </div>
                        <div className="lg:hidden flex items-center gap-2">
                            <Button onClick={() => setIsOpen(!isOpen)} variant="ghost" size="icon">
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden bg-white/95 backdrop-blur-md"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col items-center">
                            {navLinks.map((link) => (
                                link.targetId ? (
                                    <a key={link.name} href={link.href} onClick={(e) => handleScrollLink(e, link.targetId)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 w-full text-center">
                                        {link.name}
                                    </a>
                                ) : (
                                    <RouterLink
                                        key={link.name}
                                        to={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 w-full text-center"
                                    >
                                        {link.name}
                                    </RouterLink>
                                )
                            ))}
                            <Button onClick={handleDashboardAccess} variant="ghost" className="w-full text-base font-medium">
                                {user ? 'Meu Painel' : 'Entrar'}
                            </Button>
                            <Button onClick={handleSignUp} className="w-full mt-2 vida-smart-gradient text-white rounded-full px-6">
                                Teste Grátis
                            </Button>
                        </div>
                    </motion.div>
                )}
            </motion.header>
        </>
    );
};

export default Header;