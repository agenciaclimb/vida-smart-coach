import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();
    const navigate = useNavigate();

    // Simplified scroll handler to avoid potential issues
    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > 150) {
                setHidden(true);
            } else {
                setHidden(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    const handleScrollLink = (e, targetId) => {
        e.preventDefault();
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
        setIsOpen(false);
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <motion.header
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" }
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200"
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <RouterLink to="/" className="text-2xl font-bold text-blue-600">
                            Vida Smart Coach
                        </RouterLink>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <a 
                            href="#beneficios" 
                            onClick={(e) => handleScrollLink(e, 'beneficios')}
                            className="text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Benefícios
                        </a>
                        <a 
                            href="#como-funciona" 
                            onClick={(e) => handleScrollLink(e, 'como-funciona')}
                            className="text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Como Funciona
                        </a>
                        <a 
                            href="#planos" 
                            onClick={(e) => handleScrollLink(e, 'planos')}
                            className="text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Planos
                        </a>
                        <a 
                            href="#depoimentos" 
                            onClick={(e) => handleScrollLink(e, 'depoimentos')}
                            className="text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            Depoimentos
                        </a>
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Button 
                            variant="ghost" 
                            onClick={handleLoginClick}
                            className="text-gray-700 hover:text-blue-600"
                        >
                            Entrar
                        </Button>
                        <Button 
                            onClick={handleLoginClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Começar Agora
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-gray-200 py-4"
                    >
                        <nav className="flex flex-col space-y-4">
                            <a 
                                href="#beneficios" 
                                onClick={(e) => handleScrollLink(e, 'beneficios')}
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                Benefícios
                            </a>
                            <a 
                                href="#como-funciona" 
                                onClick={(e) => handleScrollLink(e, 'como-funciona')}
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                Como Funciona
                            </a>
                            <a 
                                href="#planos" 
                                onClick={(e) => handleScrollLink(e, 'planos')}
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                Planos
                            </a>
                            <a 
                                href="#depoimentos" 
                                onClick={(e) => handleScrollLink(e, 'depoimentos')}
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                            >
                                Depoimentos
                            </a>
                            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                                <Button 
                                    variant="ghost" 
                                    onClick={handleLoginClick}
                                    className="justify-start"
                                >
                                    Entrar
                                </Button>
                                <Button 
                                    onClick={handleLoginClick}
                                    className="bg-blue-600 hover:bg-blue-700 text-white justify-start"
                                >
                                    Começar Agora
                                </Button>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </div>
        </motion.header>
    );
};

export default Header;

