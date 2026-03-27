import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Terminal, Zap, Shield, Bot } from 'lucide-react';
import Footer from '../components/Footer';

const Docs = () => {
    const [activeTab, setActiveTab] = useState('intro');

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans flex flex-col">
            {/* Header */}
            <header className="border-b border-gray-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 text-white font-bold text-xl hover:opacity-90 transition">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">S</div>
                    <span className="tracking-tight">Synchro-AI Docs</span>
                </Link>
                <Link to="/help" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition text-sm font-medium">
                    <ArrowLeft size={16} /> Back to Help
                </Link>
            </header>

            {/* Layout */}
            <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full mb-12">

                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 border-r border-gray-800 p-6 space-y-8 hidden md:block">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Getting Started</h4>
                        <ul className="space-y-2">
                            <li><button onClick={() => setActiveTab('intro')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeTab === 'intro' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}>Introduction</button></li>
                            <li><button onClick={() => setActiveTab('quickstart')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeTab === 'quickstart' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}>Quick Start</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Core Features</h4>
                        <ul className="space-y-2">
                            <li><button onClick={() => setActiveTab('kanban')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeTab === 'kanban' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}>Real-time Kanban</button></li>
                            <li><button onClick={() => setActiveTab('ai')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeTab === 'ai' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}>Gemini AI Integration</button></li>
                            <li><button onClick={() => setActiveTab('roles')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeTab === 'roles' ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}>Role-Based Access</button></li>
                        </ul>
                    </div>
                </aside>

                {/* Mobile Tab Selector */}
                <div className="md:hidden p-4 border-b border-gray-800 overflow-x-auto whitespace-nowrap flex gap-2">
                    {['intro', 'quickstart', 'kanban', 'ai', 'roles'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-sm capitalize transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-[#1e293b] text-gray-400'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <main className="flex-1 p-6 md:p-12">
                    <div className="max-w-3xl">
                        {activeTab === 'intro' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl mb-4">
                                    <BookOpen size={24} />
                                </div>
                                <h1 className="text-4xl font-extrabold text-white">Introduction to Synchro-AI</h1>
                                <p className="text-lg text-gray-400 leading-relaxed">
                                    Synchro-AI is a next-generation collaborative workspace designed for high-velocity teams. By combining real-time state management with Google's Gemini AI, we eliminate the friction between planning and execution.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 mt-8">
                                    <div className="bg-[#1e293b]/50 border border-gray-700 p-5 rounded-xl">
                                        <Zap className="text-amber-400 mb-2" size={20} />
                                        <h3 className="text-white font-bold mb-1">Real-time Everything</h3>
                                        <p className="text-sm text-gray-400">Powered by WebSockets, changes reflect instantly across all clients.</p>
                                    </div>
                                    <div className="bg-[#1e293b]/50 border border-gray-700 p-5 rounded-xl">
                                        <Bot className="text-purple-400 mb-2" size={20} />
                                        <h3 className="text-white font-bold mb-1">AI-Powered</h3>
                                        <p className="text-sm text-gray-400">Automated summaries, task generation, and bottleneck detection.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'quickstart' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl mb-4">
                                    <Terminal size={24} />
                                </div>
                                <h1 className="text-4xl font-extrabold text-white">Quick Start Guide</h1>
                                <p className="text-lg text-gray-400 leading-relaxed mb-6">
                                    Get your first workspace up and running in minutes.
                                </p>
                                <div className="space-y-4">
                                    <div className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden">
                                        <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="ml-2 text-xs text-gray-400 font-mono">1. Create an Account</span>
                                        </div>
                                        <div className="p-4 text-sm text-gray-300 font-mono">
                                            Navigate to the registration page and create your admin account. You will automatically be assigned a default workspace.
                                        </div>
                                    </div>
                                    <div className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden">
                                        <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="ml-2 text-xs text-gray-400 font-mono">2. Invite Team Members</span>
                                        </div>
                                        <div className="p-4 text-sm text-gray-300 font-mono">
                                            Go to Workspace Settings - Members Tab. Generate an invitation link or send an email invite directly.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="space-y-6 animate-fadeIn">
                                <h1 className="text-4xl font-extrabold text-white">Gemini AI Integration</h1>
                                <p className="text-gray-400 leading-relaxed">
                                    Synchro-AI utilizes Google's Gemini models to provide intelligent insights into your workflow. Ensure your workspace admin has enabled AI features in the project settings.
                                </p>
                                <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4 ml-2">
                                    <li><strong>Pulse Summaries:</strong> Generates end-of-week summaries of completed vs. pending tasks.</li>
                                    <li><strong>Issue Triage:</strong> Automatically categorizes bug reports based on description context.</li>
                                </ul>
                            </div>
                        )}

                        {(activeTab === 'kanban' || activeTab === 'roles') && (
                            <div className="space-y-6 animate-fadeIn">
                                <h1 className="text-4xl font-extrabold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
                                <p className="text-gray-400 leading-relaxed">
                                    Documentation for this section is currently being updated. Check back soon for detailed API references and usage guides.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Docs;