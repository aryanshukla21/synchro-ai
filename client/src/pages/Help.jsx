import { Link } from 'react-router-dom';
import { ArrowLeft, Book, MessageCircle, Search } from 'lucide-react';
import Footer from '../components/Footer';

const Help = () => {
    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans flex flex-col">
            <main className="flex-1 p-6 md:p-12">
                <header className="mb-12 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white font-bold text-xl hover:opacity-90 transition">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">S</div>
                        <span className="tracking-tight">Synchro-AI</span>
                    </Link>
                    <Link to="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </header>

                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">How can we help you?</h1>
                    <div className="relative mb-12">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={24} />
                        <input
                            type="text"
                            placeholder="Search for guides, API docs, or troubleshooting..."
                            className="w-full bg-[#1e293b] border border-gray-700 text-white rounded-xl py-4 pl-14 pr-6 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-[#1e293b]/50 p-8 rounded-2xl border border-gray-700/50 hover:border-indigo-500/50 transition flex flex-col items-start">
                            <Book className="text-indigo-400 mb-4" size={32} />
                            <h3 className="text-xl font-bold text-white mb-2">Documentation</h3>
                            <p className="text-gray-400 mb-6 flex-1">Read our comprehensive guides on setting up your workspace and integrating Gemini AI.</p>
                            <Link to="/docs" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 font-medium rounded-lg hover:bg-indigo-500/20 transition">
                                Read Docs →
                            </Link>
                        </div>
                        <div className="bg-[#1e293b]/50 p-8 rounded-2xl border border-gray-700/50 hover:border-indigo-500/50 transition flex flex-col items-start">
                            <MessageCircle className="text-emerald-400 mb-4" size={32} />
                            <h3 className="text-xl font-bold text-white mb-2">Community Support</h3>
                            <p className="text-gray-400 mb-6 flex-1">Join our community of developers to ask questions and share your setups.</p>
                            <Link to="/contact" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 font-medium rounded-lg hover:bg-emerald-500/20 transition">
                                Contact Us →
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Help;