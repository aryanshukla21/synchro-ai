import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="border-t border-gray-800 bg-[#0B1121] py-12 px-6 mt-auto">
            <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
                <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl hover:opacity-90 transition">
                    <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs">S</div>
                    Synchro-AI
                </Link>
                <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Synchro-AI. All rights reserved.</p>
                <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-400">
                    <Link to="/help" className="hover:text-white transition">Help</Link>
                    <Link to="/docs" className="hover:text-white transition">Docs</Link>
                    <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
                    <Link to="/terms" className="hover:text-white transition">Terms</Link>
                    <Link to="/contact" className="hover:text-white transition">Contact</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;