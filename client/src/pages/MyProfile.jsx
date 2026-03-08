import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Save, Briefcase, Upload, Menu } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axios';

const MyProfile = () => {
    const { user, updateUserProfile } = useAuth();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const [loading, setLoading] = useState(false);

    // New State for File Upload
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
            setAvatarPreview(URL.createObjectURL(file)); // Generate a local preview instantly
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Because we are sending a file, we MUST use FormData instead of JSON
            const formPayload = new FormData();
            formPayload.append('name', formData.name);
            formPayload.append('skills', formData.skills);

            if (avatarFile) {
                formPayload.append('avatar', avatarFile);
            }

            // Make the direct API call to ensure multipart/form-data headers are set
            await api.put('/auth/updatedetails', formPayload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Profile updated successfully!');

            // Reload the page to ensure the global auth context refetches the fresh user data with the new avatar
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
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-4 bg-[#0f172a] shrink-0">
                {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-[#1e293b] rounded-lg hover:bg-indigo-600 transition text-white">
                        <Menu size={20} />
                    </button>
                )}
                <h1 className="text-xl font-bold text-white">My Profile</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto bg-[#1e293b] rounded-xl border border-gray-700 p-8 shadow-2xl">
                    <div className="flex items-center gap-6 mb-8">
                        {/* Avatar Preview Sphere */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden border-4 border-[#0f172a] shrink-0">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                            <p className="text-gray-400">{user?.email}</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20">
                                {user?.isVerified ? 'Verified Account' : 'Unverified'}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <User size={16} /> Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition"
                                />
                            </div>

                            {/* --- NEW: FILE UPLOAD DROPZONE --- */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                    <Upload size={16} /> Profile Picture (JPG/PNG)
                                </label>
                                <div className={`relative w-full bg-[#0f172a] border-2 border-dashed ${avatarFile ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-600 hover:border-gray-500'} rounded-lg p-3 text-center cursor-pointer transition flex items-center justify-center h-[50px]`}>
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        onChange={handleAvatarChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <span className={`text-sm ${avatarFile ? 'text-indigo-400 font-bold' : 'text-gray-500'}`}>
                                        {avatarFile ? avatarFile.name : 'Click or Drag to Upload Avatar'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Mail size={16} /> Email Address
                            </label>
                            <input
                                type="email"
                                value={user?.email}
                                disabled
                                className="w-full bg-[#0f172a]/50 border border-gray-700 rounded-lg p-3 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-600 mt-1">Email cannot be changed.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                                <Briefcase size={16} /> Skills (comma separated)
                            </label>
                            <textarea
                                value={formData.skills}
                                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                placeholder="React, Node.js, Design..."
                                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none h-24 resize-none transition"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-700 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-2 transition disabled:opacity-50"
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