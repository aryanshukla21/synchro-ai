import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Save, Briefcase, Upload } from 'lucide-react';
import api from '../api/axios';

const MyProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        skills: user?.skills?.join(', ') || ''
    });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formPayload = new FormData();
            formPayload.append('name', formData.name);
            formPayload.append('skills', formData.skills);

            if (avatarFile) {
                formPayload.append('avatar', avatarFile);
            }

            await api.put('/auth/updatedetails', formPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Profile updated successfully!');
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#0f172a] text-gray-300 font-sans">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-800 flex items-center gap-4 bg-[#0f172a] shrink-0">
                <h1 className="text-lg sm:text-xl font-bold text-white">My Profile</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-3xl mx-auto bg-[#1e293b] rounded-xl border border-gray-700 p-5 sm:p-8 shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 mb-8">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg overflow-hidden border-4 border-[#0f172a] shrink-0">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">{user?.name}</h2>
                            <p className="text-sm sm:text-base text-gray-400">{user?.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] sm:text-xs font-bold rounded-full border border-indigo-500/20">
                                {user?.isVerified ? 'Verified Account' : 'Unverified'}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <User size={16} /> Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base text-white focus:border-indigo-500 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <Upload size={16} /> Profile Picture (JPG/PNG)
                                </label>
                                <div className={`relative w-full bg-[#0f172a] border-2 border-dashed ${avatarFile ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-600 hover:border-gray-500'} rounded-lg p-3 text-center cursor-pointer transition flex items-center justify-center h-[46px] sm:h-[50px]`}>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        onChange={handleAvatarChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <span className={`text-xs sm:text-sm truncate px-2 ${avatarFile ? 'text-indigo-400 font-bold' : 'text-gray-500'}`}>
                                        {avatarFile ? avatarFile.name : 'Click or Drag to Upload Avatar'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Mail size={16} /> Email Address
                            </label>
                            <input
                                type="email"
                                value={user?.email}
                                disabled
                                className="w-full bg-[#0f172a]/50 border border-gray-700 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-[10px] sm:text-xs text-gray-600 mt-1">Email cannot be changed.</p>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Briefcase size={16} /> Skills (comma separated)
                            </label>
                            <textarea
                                value={formData.skills}
                                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                placeholder="React, Node.js, Design..."
                                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base text-white focus:border-indigo-500 outline-none h-20 sm:h-24 resize-none transition"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-700 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                                {loading ? 'Uploading & Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;