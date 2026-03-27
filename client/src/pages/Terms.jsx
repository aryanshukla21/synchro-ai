import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const Terms = () => {
    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans flex flex-col">
            <main className="flex-1 p-6 md:p-12">
                <header className="mb-12 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white font-bold text-xl hover:opacity-90 transition">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">S</div>
                        <span className="tracking-tight">Synchro-AI</span>
                    </Link>
                    <Link to="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition">
                        <ArrowLeft size={16} /> Back
                    </Link>
                </header>

                <div className="max-w-3xl mx-auto bg-[#1e293b]/50 p-8 md:p-12 rounded-3xl border border-gray-700/50">
                    <h1 className="text-4xl font-extrabold text-white mb-8 border-b border-gray-800 pb-6">Terms of Service</h1>
                    <div className="space-y-6 text-gray-400 leading-relaxed">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>
                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing or using Synchro-AI, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access the platform.</p>
                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Use License</h2>
                        <p>You are granted a non-exclusive, non-transferable, revocable license to access and use Synchro-AI strictly in accordance with these terms.</p>
                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Workspace Conduct</h2>
                        <p>You are responsible for all activity that occurs under your account. Synchro-AI reserves the right to terminate access to any workspace found violating local laws or engaging in abusive behavior.</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;