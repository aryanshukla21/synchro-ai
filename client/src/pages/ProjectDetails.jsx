import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { generatePDF, generateCSV } from '../utils/reportGenerator';

// Components
import ProjectHeader from '../components/project/ProjectHeader';
import OverallProgress from '../components/project/OverallProgress';
import WorkloadStatus from '../components/project/WorkloadStatus';
import ActivityLog from '../components/project/ActivityLog';
import AIPulseCard from '../components/project/AIPulseCard';
import TeamMembersCard from '../components/project/TeamMembersCard';
import AllProjectTasks from '../components/project/AllProjectTasks';

// Modals
import CreateTaskModal from '../components/project/CreateTaskModal';
import ManageTeamModal from '../components/project/ManageTeamModal';
import DeleteConfirmationModal from '../components/project/DeleteConfirmationModal';

const ProjectDetails = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- NEW: Context for Mobile Menu ---
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showCreateTask, setShowCreateTask] = useState(false);
    const [showManageTeam, setShowManageTeam] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [newTask, setNewTask] = useState({
        title: '', description: '', assignedTo: '', priority: 'Medium', deadline: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const projectRes = await api.get(`/projects/${id}`);
                setProject(projectRes.data.data);
                setTasks(projectRes.data.data.tasks || []);

                try {
                    const activityRes = await api.get(`/activities/project/${id}`);
                    setActivities(activityRes.data.data || []);
                } catch (actErr) {
                    console.warn("Could not fetch activities", actErr);
                    setActivities([]);
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || "Failed to load project data");
                showToast("Failed to load project data", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleTaskUpdate = async (updatedTask) => {
        setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        try {
            const activityRes = await api.get(`/activities/project/${id}`);
            setActivities(activityRes.data.data || []);
        } catch (err) {
            console.warn("Could not refresh activity log", err);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newTask, projectId: id };
            if (payload.assignedTo === '') payload.assignedTo = null;

            const { data } = await api.post('/task', payload);

            setTasks([data.data, ...tasks]);
            setShowCreateTask(false);
            setNewTask({ title: '', description: '', assignedTo: '', priority: 'Medium', deadline: '' });
            showToast("Task created successfully!", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to create task", "error");
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm("Are you sure? This user will be removed from the project immediately.")) return;
        try {
            await api.delete(`/projects/${id}/members/${memberId}`);
            setProject(prev => ({
                ...prev,
                members: prev.members.filter(m => m.user._id !== memberId)
            }));
            showToast("Member removed successfully", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to remove member", "error");
        }
    };

    const confirmDeleteProject = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/projects/${id}`);
            showToast("Project deleted successfully", "success");
            navigate('/');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete project', "error");
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const refreshActivityLog = async () => {
        try {
            const activityRes = await api.get(`/activities/project/${id}`);
            setActivities(activityRes.data.data || []);
        } catch (err) {
            console.warn("Activity refresh failed", err);
        }
    };

    const handleInviteMember = async (email, role) => {
        try {
            const res = await api.post(`/projects/${id}/invite`, { email, role });
            setProject(res.data.data);
            showToast(`Invitation sent to ${email}`, "success");
            refreshActivityLog();
        } catch (err) {
            const errorMessage = err.response?.data?.message || "User does not exist";
            showToast(errorMessage, "error");
            throw err;
        }
    };

    const handleUpdateProject = (updatedProject) => {
        setProject(updatedProject);
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-[#0f172a] text-white animate-pulse">Loading Workspace...</div>;
    if (error || !project) return <div className="flex items-center justify-center h-screen bg-[#0f172a] text-red-400">Error: {error || "Project not found"}</div>;

    const isOwner = String(currentUser?._id) === String(project.owner?._id || project.owner);
    const activeMembers = project.members.filter(m => m.status === 'Active');

    const visibleTasks = isOwner
        ? tasks
        : tasks.filter(task => {
            if (!task.assignedTo) return false;
            const assigneeId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
            return assigneeId === currentUser?._id;
        });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Merged').length;
    const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const tasksByStatus = {
        todo: tasks.filter(t => t.status === 'To-Do').length,
        inprogress: tasks.filter(t => t.status === 'In-Progress').length,
        submitted: tasks.filter(t => t.status === 'Submitted').length,
    };

    const handleExportPDF = () => {
        const stats = { progressPercentage, totalTasks, completedTasks, tasksByStatus };
        generatePDF(project, tasks, stats);
        showToast("PDF Report generated!", "success");
    };

    const handleExportCSV = () => {
        generateCSV(project, tasks);
        showToast("CSV Export generated!", "success");
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] overflow-hidden font-sans">
            <ProjectHeader
                project={project}
                onTaskCreate={() => setShowCreateTask(true)}
                onUpdateProject={handleUpdateProject}
                isOwner={isOwner}
                onExportPDF={handleExportPDF}
                onExportCSV={handleExportCSV}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
                    <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <OverallProgress progressPercentage={progressPercentage} completedTasks={completedTasks} totalTasks={totalTasks} />
                            <WorkloadStatus tasksByStatus={tasksByStatus} totalTasks={totalTasks} />
                        </div>
                        <AllProjectTasks tasks={visibleTasks} isOwner={isOwner} onTaskUpdate={handleTaskUpdate} />
                        <ActivityLog activities={activities} />
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                        <AIPulseCard aiSummary={project.aiSummary} />
                        <TeamMembersCard activeMembers={activeMembers} onManageTeamClick={() => setShowManageTeam(true)} />
                    </div>
                </div>
            </div>

            <CreateTaskModal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} onSubmit={handleCreateTask} newTask={newTask} setNewTask={setNewTask} activeMembers={activeMembers} />
            <ManageTeamModal isOpen={showManageTeam} onClose={() => setShowManageTeam(false)} members={project.members} currentUser={currentUser} isOwner={isOwner} onRemoveMember={handleRemoveMember} onInvite={handleInviteMember} onDeleteProjectClick={() => setShowDeleteModal(true)} />
            <DeleteConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDeleteProject} isDeleting={isDeleting} projectTitle={project.name || project.title} />
        </div>
    );
};

export default ProjectDetails;