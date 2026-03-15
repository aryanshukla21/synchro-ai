import { createContext, useState, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 min-w-[300px] p-4 rounded-lg shadow-xl border backdrop-blur-md animate-in slide-in-from-right-full transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} />}
                        {toast.type === 'error' && <AlertCircle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}

                        <p className="text-sm font-medium flex-1">{toast.message}</p>

                        <button onClick={() => removeToast(toast.id)} className="hover:text-white transition">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};