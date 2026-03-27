import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Loader2 } from 'lucide-react';
import Footer from '../components/Footer';
import axiosInstance from '../api/axios'; // Import your axios instance
// Import your toast hook (adjust import/destructure based on your specific context)
// import { useToast } from '../contexts/ToastContext'; 

const Contact = () => {
    // const { addToast } = useToast(); 

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' }); // Fallback if no toast context

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await axiosInstance.post('/api/contact', formData);

            // if you have a toast context, use it here:
            // addToast(response.data.message, 'success');

            // Fallback UI status message
            setStatusMessage({ type: 'success', text: 'Message sent successfully! We will be in touch.' });

            // Clear the form
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to send message. Please try again.';

            // addToast(errorMsg, 'error');
            setStatusMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

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

                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white mb-6">Get in touch</h1>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Have a question about your workspace, or want to report a bug in the real-time Kanban? Drop us a message and our team will get back to you.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-gray-400">
                                <div className="w-12 h-12 bg-[#1e293b] rounded-full flex items-center justify-center border border-gray-700">
                                    <Mail size={20} className="text-indigo-400" />
                                </div>
                                <span>support@synchro-ai.com</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-400">
                                <div className="w-12 h-12 bg-[#1e293b] rounded-full flex items-center justify-center border border-gray-700">
                                    <MapPin size={20} className="text-indigo-400" />
                                </div>
                                <span>Remote First Workspace</span>
                            </div>
                        </div>
                    </div>

                    <form className="bg-[#1e293b]/50 p-8 rounded-3xl border border-gray-700/50 space-y-6" onSubmit={handleSubmit}>
                        {statusMessage.text && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${statusMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {statusMessage.text}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#0f172a] border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#0f172a] border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition"
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                            <textarea
                                rows="4"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                className="w-full bg-[#0f172a] border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition"
                                placeholder="How can we help?"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Message'
                            )}
                        </button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;