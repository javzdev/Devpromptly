import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { AdminStats } from '../types';
import toast from 'react-hot-toast';
import ToolLogoImg from '../components/ToolLogoImg';

const TOOL_CATEGORIES = [
  { id: 'chatbot', label: 'Chatbot' },
  { id: 'writing', label: 'Escritura' },
  { id: 'image', label: 'Imágenes' },
  { id: 'code', label: 'Código' },
  { id: 'audio', label: 'Audio' },
  { id: 'video', label: 'Video' },
  { id: 'productivity', label: 'Productividad' },
  { id: 'research', label: 'Investigación' },
  { id: 'data', label: 'Datos' },
  { id: 'other', label: 'Otra' },
];

// Types
interface ModerationAction {
  id: string;
  type: 'approve' | 'reject' | 'delete' | 'toggle_status';
  targetType: 'prompt' | 'user';
  targetId: string;
  reason?: string;
  timestamp: string;
  adminId: string;
  adminName: string;
}

// Admin Guard Component
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Initializing Security...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card-modern max-w-md w-full p-10 text-center bg-white border border-slate-100">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-slate-900 mb-2 tracking-tight">Login Required</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Please log in to your administrative account to access the control panel.
          </p>
          <Link to="/login" className="btn-primary-modern w-full py-4 shadow-xl shadow-primary-500/20">
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (!['admin', 'moderator'].includes(user?.role || '')) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card-modern max-w-md w-full p-10 text-center bg-white border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-slate-900 mb-2 tracking-tight">Access Denied</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            You do not have the required permissions to view this section. Please contact a super admin if you believe this is an error.
          </p>
          <Link to="/" className="btn-outline-modern w-full py-4">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AdminPanelEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingPrompts, setPendingPrompts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [moderators, setModerators] = useState<any[]>([]);
  const [moderationLog, setModerationLog] = useState<ModerationAction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prompts' | 'users' | 'moderators' | 'forums' | 'tools' | 'logs' | 'reports' | 'settings'>('dashboard');
  const [loadingStates, setLoadingStates] = useState({
    dashboard: false,
    prompts: false,
    users: false,
    moderators: false,
    logs: false,
    approving: new Set<string>(),
    rejecting: new Set<string>(),
    deleting: new Set<string>(),
    toggling: new Set<string>(),
    addingModerator: false
  });
  const [promptPage] = useState(1);
  const [userPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [userStatus, setUserStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModeratorModal, setShowAddModeratorModal] = useState(false);
  const [newModeratorEmail, setNewModeratorEmail] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['stats', 'recentActivity']));

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState<'pending' | 'resolved' | 'dismissed' | 'all'>('pending');
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [reportActionModal, setReportActionModal] = useState<{ open: boolean; report: any | null; action: string; note: string; loading: boolean }>({ open: false, report: null, action: '', note: '', loading: false });

  // Forums state
  const [forums, setForums] = useState<any[]>([]);
  const [forumsLoading, setForumsLoading] = useState(false);
  const [showForumModal, setShowForumModal] = useState(false);
  const [editingForum, setEditingForum] = useState<any | null>(null);
  const [forumForm, setForumForm] = useState({ name: '', description: '', url: '', image: '', favicon: '', language: 'es' });
  const [forumSaving, setForumSaving] = useState(false);
  const [forumPreview, setForumPreview] = useState<{ title?: string; description?: string; image?: string; favicon?: string; loading: boolean } | null>(null);

  // AI Tools state
  const [tools, setTools] = useState<any[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);
  const [editingTool, setEditingTool] = useState<any | null>(null);
  const [toolForm, setToolForm] = useState({ name: '', url: '', description: '', category: 'other', featured: false });
  const [toolSaving, setToolSaving] = useState(false);
  
  // Custom delete confirmation state
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: 'forum' | 'prompt' | 'moderator' | 'tool' | null;
    id: string;
    title: string;
    loading: boolean;
  }>({
    open: false,
    type: null,
    id: '',
    title: '',
    loading: false
  });

  const isSuperAdmin = user?.role === 'admin';

  // Fetch URL metadata for forum preview using Microlink
  const fetchForumPreview = async (url: string) => {
    if (!url) { setForumPreview(null); return; }
    try { new URL(url); } catch { return; }
    setForumPreview({ loading: true });
    try {
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false`);
      const data = await res.json();
      if (data.status === 'success') {
        const preview = {
          title: data.data?.title || '',
          description: data.data?.description || '',
          image: data.data?.image?.url || data.data?.logo?.url || '',
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
          loading: false,
        };
        setForumPreview(preview);
        // Auto-fill image/favicon in form
        setForumForm(prev => ({
          ...prev,
          image: preview.image || prev.image,
          favicon: preview.favicon || prev.favicon,
          // Only auto-fill name/description if empty
          name: prev.name || preview.title || prev.name,
          description: prev.description || preview.description || prev.description,
        }));
      } else {
        setForumPreview({
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
          loading: false
        });
        setForumForm(prev => ({
          ...prev,
          favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
        }));
      }
    } catch {
      setForumPreview({ loading: false });
    }
  };

  // Debounce URL input for forum preview
  const forumUrlDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleForumUrlChange = (url: string) => {
    setForumForm(prev => ({ ...prev, url }));
    if (forumUrlDebounceRef.current) clearTimeout(forumUrlDebounceRef.current);
    forumUrlDebounceRef.current = setTimeout(() => fetchForumPreview(url), 700);
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const data = await adminAPI.getReports(reportStatusFilter);
      setReports(data.reports || []);
      setPendingReportsCount(data.pendingCount || 0);
    } catch {
      toast.error('Error al cargar reportes');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleResolveReport = async () => {
    if (!reportActionModal.report || !reportActionModal.action) return;
    setReportActionModal(prev => ({ ...prev, loading: true }));
    try {
      await adminAPI.resolveReport(reportActionModal.report._id, reportActionModal.action, reportActionModal.note);
      toast.success('Reporte resuelto');
      setReportActionModal({ open: false, report: null, action: '', note: '', loading: false });
      fetchReports();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al resolver el reporte');
      setReportActionModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await adminAPI.dismissReport(reportId, '');
      toast.success('Reporte descartado');
      fetchReports();
    } catch {
      toast.error('Error al descartar el reporte');
    }
  };

  const fetchForums = async () => {
    setForumsLoading(true);
    try {
      const data = await adminAPI.getAdminForums();
      setForums(data.forums || []);
    } catch {
      toast.error('Failed to fetch forums');
    } finally {
      setForumsLoading(false);
    }
  };

  const fetchTools = async () => {
    setToolsLoading(true);
    try {
      const data = await adminAPI.getAdminTools();
      setTools(data.tools || []);
    } catch {
      toast.error('Error al cargar herramientas');
    } finally {
      setToolsLoading(false);
    }
  };

  const handleSaveTool = async () => {
    if (!toolForm.name.trim() || !toolForm.url.trim() || !toolForm.description.trim()) {
      toast.error('Nombre, URL y descripción son requeridos');
      return;
    }
    // Validate URL format
    try { new URL(toolForm.url); } catch {
      toast.error('La URL no es válida (debe comenzar con https://)');
      return;
    }
    setToolSaving(true);
    try {
      if (editingTool) {
        await adminAPI.updateTool(editingTool._id, toolForm);
        toast.success('Herramienta actualizada');
      } else {
        await adminAPI.createTool(toolForm);
        toast.success('Herramienta creada');
      }
      setShowToolModal(false);
      setEditingTool(null);
      setToolForm({ name: '', url: '', description: '', category: 'other', featured: false });
      fetchTools();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al guardar la herramienta';
      toast.error(msg);
    } finally {
      setToolSaving(false);
    }
  };

  const handleToggleToolActive = async (tool: any) => {
    try {
      await adminAPI.updateTool(tool._id, { isActive: !tool.isActive });
      toast.success(tool.isActive ? 'Herramienta desactivada' : 'Herramienta activada');
      fetchTools();
    } catch {
      toast.error('Error al actualizar la herramienta');
    }
  };

  const handleDeleteTool = (tool: any) => {
    setDeleteModal({ open: true, type: 'tool', id: tool._id, title: tool.name, loading: false });
  };

  const execDeleteTool = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await adminAPI.deleteTool(deleteModal.id);
      toast.success('Herramienta eliminada');
      setDeleteModal(prev => ({ ...prev, open: false }));
      fetchTools();
    } catch {
      toast.error('Error al eliminar la herramienta');
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const openCreateTool = () => {
    setEditingTool(null);
    setToolForm({ name: '', url: '', description: '', category: 'other', featured: false });
    setShowToolModal(true);
  };

  const openEditTool = (tool: any) => {
    setEditingTool(tool);
    setToolForm({ name: tool.name, url: tool.url, description: tool.description, category: tool.category, featured: !!tool.featured });
    setShowToolModal(true);
  };

  const handleSaveForum = async () => {
    if (!forumForm.name.trim() || !forumForm.description.trim() || !forumForm.url.trim()) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    setForumSaving(true);
    try {
      const payload = { ...forumForm, image: forumForm.image || forumPreview?.image || '', favicon: forumForm.favicon || forumPreview?.favicon || '' };
      if (editingForum) {
        await adminAPI.updateForum(editingForum._id, payload);
        toast.success('Foro actualizado');
      } else {
        await adminAPI.createForum(payload);
        toast.success('Foro creado');
      }
      setShowForumModal(false);
      setEditingForum(null);
      setForumForm({ name: '', description: '', url: '', image: '', favicon: '', language: 'es' });
      setForumPreview(null);
      fetchForums();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al guardar el foro';
      toast.error(msg);
    } finally {
      setForumSaving(false);
    }
  };

  const handleToggleForumActive = async (forum: any) => {
    try {
      await adminAPI.updateForum(forum._id, { isActive: !forum.isActive });
      toast.success(forum.isActive ? 'Foro desactivado' : 'Foro activado');
      fetchForums();
    } catch {
      toast.error('Error al actualizar el foro');
    }
  };

  const handleDeleteForum = (forum: any) => {
    setDeleteModal({
      open: true,
      type: 'forum',
      id: forum._id,
      title: forum.name,
      loading: false
    });
  };

  const execDeleteForum = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await adminAPI.deleteForum(deleteModal.id);
      toast.success('Foro eliminado');
      setDeleteModal(prev => ({ ...prev, open: false }));
      fetchForums();
    } catch {
      toast.error('Error al eliminar el foro');
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const openCreateForum = () => {
    setEditingForum(null);
    setForumForm({ name: '', description: '', url: '', image: '', favicon: '', language: 'es' });
    setForumPreview(null);
    setShowForumModal(true);
  };

  const openEditForum = (forum: any) => {
    setEditingForum(forum);
    setForumForm({ name: forum.name, description: forum.description, url: forum.url, image: forum.image || '', favicon: forum.favicon || '', language: forum.language || 'es' });
    setForumPreview(forum.image || forum.favicon ? { image: forum.image, favicon: forum.favicon, loading: false } : null);
    setShowForumModal(true);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchModerators();
    fetchModerationLog();
    fetchForums();
    fetchTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'prompts') {
      fetchPendingPrompts();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'forums') {
      fetchForums();
    } else if (activeTab === 'tools') {
      fetchTools();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, promptPage, userPage, searchTerm, userStatus]);

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportStatusFilter]);

  const fetchDashboardData = async () => {
    setLoadingStates(prev => ({ ...prev, dashboard: true }));
    try {
      const data = await adminAPI.getDashboard();
      setStats(data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoadingStates(prev => ({ ...prev, dashboard: false }));
    }
  };

  const fetchPendingPrompts = async () => {
    setLoadingStates(prev => ({ ...prev, prompts: true }));
    try {
      const data = await adminAPI.getPendingPrompts(promptPage, 20);
      setPendingPrompts(data.prompts || []);
    } catch (error) {
      toast.error('Failed to fetch pending prompts');
    } finally {
      setLoadingStates(prev => ({ ...prev, prompts: false }));
    }
  };

  const fetchUsers = async () => {
    setLoadingStates(prev => ({ ...prev, users: true }));
    try {
      const data = await adminAPI.getUsers(userPage, 20);
      setUsers(data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoadingStates(prev => ({ ...prev, users: false }));
    }
  };

  const fetchModerators = async () => {
    try {
      const data = await adminAPI.getModerators();
      setModerators(data.moderators);
    } catch (error) {
      console.error('Failed to fetch moderators:', error);
    }
  };

  const fetchModerationLog = async () => {
    setLoadingStates(prev => ({ ...prev, logs: true }));
    try {
      const data = await adminAPI.getModerationLog();
      setModerationLog(data.actions);
    } catch (error) {
      toast.error('Failed to fetch moderation log');
    } finally {
      setLoadingStates(prev => ({ ...prev, logs: false }));
    }
  };

  const handleApprovePrompt = async (promptId: string) => {
    setLoadingStates(prev => ({
      ...prev,
      approving: new Set(prev.approving).add(promptId)
    }));

    try {
      await adminAPI.approvePrompt(promptId);
      toast.success('Prompt approved successfully');
      fetchPendingPrompts();
      fetchDashboardData();
      fetchModerationLog();
    } catch (error) {
      toast.error('Failed to approve prompt');
    } finally {
      setLoadingStates(prev => {
        const newApproving = new Set(prev.approving);
        newApproving.delete(promptId);
        return { ...prev, approving: newApproving };
      });
    }
  };

  const handleRejectPrompt = async (promptId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setLoadingStates(prev => ({
      ...prev,
      rejecting: new Set(prev.rejecting).add(promptId)
    }));

    try {
      await adminAPI.rejectPrompt(promptId, rejectionReason);
      toast.success('Prompt rejected successfully');
      setShowRejectionModal(null);
      setRejectionReason('');
      fetchPendingPrompts();
      fetchDashboardData();
      fetchModerationLog();
    } catch (error) {
      toast.error('Failed to reject prompt');
    } finally {
      setLoadingStates(prev => {
        const newRejecting = new Set(prev.rejecting);
        newRejecting.delete(promptId);
        return { ...prev, rejecting: newRejecting };
      });
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    setLoadingStates(prev => ({
      ...prev,
      toggling: new Set(prev.toggling).add(userId)
    }));

    try {
      await adminAPI.toggleUserStatus(userId);
      toast.success('User status updated successfully');
      fetchUsers();
      fetchDashboardData();
      fetchModerationLog();
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setLoadingStates(prev => {
        const newToggling = new Set(prev.toggling);
        newToggling.delete(userId);
        return { ...prev, toggling: newToggling };
      });
    }
  };

  const handleDeletePrompt = (prompt: any) => {
    setDeleteModal({
      open: true,
      type: 'prompt',
      id: prompt._id,
      title: prompt.title,
      loading: false
    });
  };

  const execDeletePrompt = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await adminAPI.deletePrompt(deleteModal.id);
      toast.success('Prompt eliminado');
      setDeleteModal(prev => ({ ...prev, open: false }));
      fetchPendingPrompts();
      fetchDashboardData();
      fetchModerationLog();
    } catch {
      toast.error('Error al eliminar el prompt');
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleAddModerator = async () => {
    if (!newModeratorEmail.trim()) {
      toast.error('Please enter a valid email');
      return;
    }

    setLoadingStates(prev => ({ ...prev, addingModerator: true }));

    try {
      await adminAPI.addModerator(newModeratorEmail);
      toast.success('Moderator added successfully');
      setShowAddModeratorModal(false);
      setNewModeratorEmail('');
      fetchModerators();
      fetchModerationLog();
    } catch (error) {
      toast.error('Failed to add moderator');
    } finally {
      setLoadingStates(prev => ({ ...prev, addingModerator: false }));
    }
  };

  const handleRemoveModerator = (moderator: any) => {
    setDeleteModal({
      open: true,
      type: 'moderator',
      id: moderator._id,
      title: moderator.username,
      loading: false
    });
  };

  const execRemoveModerator = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await adminAPI.removeModerator(deleteModal.id);
      toast.success('Moderador removido');
      setDeleteModal(prev => ({ ...prev, open: false }));
      fetchModerators();
      fetchModerationLog();
    } catch {
      toast.error('Error al remover moderador');
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleConfirmDelete = () => {
    if (deleteModal.type === 'forum') execDeleteForum();
    else if (deleteModal.type === 'prompt') execDeletePrompt();
    else if (deleteModal.type === 'moderator') execRemoveModerator();
    else if (deleteModal.type === 'tool') execDeleteTool();
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
    color?: 'primary' | 'success' | 'warning' | 'error'
  }> = ({ title, value, icon, trend, color = 'primary' }) => {
    const colorClasses = {
      primary: 'bg-primary-50 text-primary-600 border-primary-100',
      success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      warning: 'bg-amber-50 text-amber-600 border-amber-100',
      error: 'bg-rose-50 text-rose-600 border-rose-100'
    };

    return (
      <div className="card-modern bg-white p-6 border border-slate-100 group hover:shadow-xl hover:shadow-primary-500/5 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl border ${colorClasses[color]} transition-colors group-hover:bg-white group-hover:shadow-sm`}>
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center ${
              trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <ArrowTrendingUpIcon className={`h-3 w-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-[40]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 mr-4">
                  <ShieldCheckIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">Control <span className="text-primary-600">Panel</span></h1>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      {user?.role === 'admin' ? 'Super Administrator' : 'Moderator'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                
                
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
            <nav className="flex space-x-2 py-4">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
                { id: 'prompts', label: 'Prompts', icon: DocumentTextIcon },
                { id: 'users', label: 'Users', icon: UserGroupIcon },
                ...(isSuperAdmin ? [{ id: 'moderators', label: 'Moderators', icon: ShieldCheckIcon }] : []),
                { id: 'forums', label: 'Foros', icon: ChatBubbleLeftRightIcon },
                { id: 'tools', label: 'AI Tools', icon: WrenchScrewdriverIcon },
                { id: 'logs', label: 'Activity', icon: ClockIcon },
                { id: 'reports', label: `Reportes${pendingReportsCount > 0 ? ` (${pendingReportsCount})` : ''}`, icon: ExclamationTriangleIcon }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                    activeTab === id
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Prompts Pendientes"
                  value={loadingStates.dashboard ? '—' : (stats?.pendingPrompts ?? 0)}
                  icon={<ClockIcon className="h-6 w-6" />}
                  color="warning"
                />
                <StatCard
                  title="Prompts Aprobados"
                  value={loadingStates.dashboard ? '—' : (stats?.approvedPrompts ?? 0)}
                  icon={<CheckCircleIcon className="h-6 w-6" />}
                  color="success"
                />
                <StatCard
                  title="Usuarios Activos"
                  value={loadingStates.dashboard ? '—' : (stats?.activeUsers ?? 0)}
                  icon={<UserGroupIcon className="h-6 w-6" />}
                  color="primary"
                />
                <StatCard
                  title="Rating Promedio"
                  value={loadingStates.dashboard ? '—' : (stats?.avgRating?.toFixed(1) ?? '0.0')}
                  icon={<StarIcon className="h-6 w-6" />}
                  color="warning"
                />
              </div>

              {/* Expandable Sections */}
              <div className="space-y-6">
                {/* Recent Activity */}
                <div className="card-modern bg-white border border-slate-100 overflow-hidden">
                  <button
                    onClick={() => toggleSection('recentActivity')}
                    className="w-full px-8 py-6 flex items-center justify-between hover:bg-slate-50 transition-all border-b border-slate-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                        <ClockIcon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-heading font-extrabold text-slate-900 tracking-tight">Recent Activity</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time system pulse</p>
                      </div>
                    </div>
                    <div className={`p-2 rounded-xl bg-slate-50 text-slate-400 transition-transform ${expandedSections.has('recentActivity') ? 'rotate-180' : ''}`}>
                      <ChevronDownIcon className="h-5 w-5" />
                    </div>
                  </button>
                  
                  {expandedSections.has('recentActivity') && (
                    <div className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest Prompt Submissions</h4>
                             <Link to="/admin?tab=prompts" onClick={() => setActiveTab('prompts')} className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:text-primary-700">View All</Link>
                          </div>
                          <div className="space-y-3">
                            {(stats?.recentActivity?.prompts || []).slice(0, 5).map((prompt: any) => (
                              <div key={prompt._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 group">
                                <div className="flex items-center min-w-0 pr-4">
                                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-3 shrink-0"></div>
                                  <span className="text-sm font-bold text-slate-700 truncate group-hover:text-primary-600">{prompt.title}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest shrink-0">
                                  {new Date(prompt.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                           <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Community Members</h4>
                             <Link to="/admin?tab=users" onClick={() => setActiveTab('users')} className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:text-primary-700">View All</Link>
                          </div>
                          <div className="space-y-3">
                            {(stats?.recentActivity?.users || []).slice(0, 5).map((user: any) => (
                              <div key={user._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 group">
                                <div className="flex items-center">
                                  <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=6366F1&color=FFFFFF`} className="w-6 h-6 rounded-lg mr-3 shadow-sm" alt="" />
                                  <span className="text-sm font-bold text-slate-700 group-hover:text-primary-600">{user.username}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest shrink-0">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prompts Tab */}
          {activeTab === 'prompts' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-10">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <div className="relative group">
                      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                      <input
                        type="text"
                        placeholder="Buscar prompts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
                      />
                    </div>
                  </div>
                  <button className="flex items-center justify-center space-x-2 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-primary-600 hover:text-primary-600 transition-all shadow-sm">
                    <FunnelIcon className="h-4 w-4" />
                    <span>Advanced Filter</span>
                  </button>
                </div>
              </div>

              {/* Pending Prompts List */}
              <div className="space-y-8">
                <div className="flex items-center space-x-4 mb-4">
                  <h3 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">Pending <span className="text-primary-600">Review</span></h3>
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">{pendingPrompts.length}</span>
                </div>
                
                {loadingStates.prompts ? (
                  <div className="card-modern py-20 flex flex-col items-center justify-center text-center bg-white border border-slate-100 italic">
                    <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Scanning archives...</p>
                  </div>
                ) : pendingPrompts.length === 0 ? (
                  <div className="card-modern py-20 flex flex-col items-center justify-center text-center bg-white border border-slate-100 italic">
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
                      <CheckCircleIcon className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-heading font-extrabold text-slate-900 mb-2 tracking-tight">Queue All Clear</h3>
                    <p className="text-slate-500 max-w-sm mb-0">
                      Great job! All submitted prompts have been processed. The community is running smoothly.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8">
                    {pendingPrompts.map((prompt: any) => (
                      <div key={prompt._id} className="card-modern bg-white border border-slate-100 overflow-hidden group hover:shadow-xl hover:shadow-primary-500/5 transition-all">
                        <div className="flex flex-col lg:flex-row">
                           <div className="flex-1 p-8">
                             <div className="flex items-start justify-between mb-6">
                               <div className="space-y-2">
                                 <h4 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors uppercase leading-[0.9]">{prompt.title}</h4>
                                 <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                   <div className="flex items-center">
                                      <img src={prompt.author?.avatar || `https://ui-avatars.com/api/?name=${prompt.author?.username}&background=6366F1&color=FFFFFF`} className="w-5 h-5 rounded-lg mr-2 shadow-sm" alt="" />
                                      {prompt.author?.username}
                                   </div>
                                   <span>•</span>
                                   <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
                                 </div>
                               </div>
                               <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                                 <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary-50 text-primary-600 border border-primary-100">
                                   {prompt.category}
                                 </span>
                                 <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                   {prompt.aiTool}
                                 </span>
                               </div>
                             </div>

                             <div className="mb-8">
                               <p className="text-slate-500 text-sm leading-relaxed italic border-l-4 border-slate-100 pl-6 py-2">"{prompt.description}"</p>
                             </div>
                             
                             <div className="relative group/prompt">
                               <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] z-10">Primary Sequence</div>
                               <div className="bg-slate-50 rounded-2xl p-6 font-mono text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto border border-slate-100 group-hover/prompt:bg-white transition-colors">
                                  {prompt.prompt}
                               </div>
                             </div>
                           </div>

                           <div className="w-full lg:w-72 bg-slate-50 border-l border-slate-100 p-8 flex flex-col justify-center space-y-4">
                              <button
                                onClick={() => handleApprovePrompt(prompt._id)}
                                disabled={loadingStates.approving.has(prompt._id)}
                                className="w-full btn-primary-modern py-4 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center space-x-2"
                              >
                                {loadingStates.approving.has(prompt._id) ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircleIcon className="h-4 w-4" />
                                    <span>Approve Hub</span>
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => setShowRejectionModal(prompt._id)}
                                className="w-full py-4 bg-white border border-slate-200 text-rose-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center space-x-2"
                              >
                                <XCircleIcon className="h-4 w-4" />
                                <span>Reject Node</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeletePrompt(prompt)}
                                className="w-full py-4 bg-transparent text-slate-300 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:text-slate-900 transition-all flex items-center justify-center space-x-2"
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span>Purge</span>
                              </button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-8">
              {/* Search and Filter */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-10">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <div className="relative group">
                      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                      <input
                        type="text"
                        placeholder="Buscar usuarios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      value={userStatus}
                      onChange={(e) => setUserStatus(e.target.value as any)}
                      className="appearance-none w-full sm:w-48 px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/20 transition-all font-bold text-slate-600 shadow-sm"
                    >
                      <option value="all">All Users</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <ChevronDownIcon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Users List */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-4">
                  <h3 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">Community <span className="text-primary-600">Members</span></h3>
                  <span className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full">{users.length}</span>
                </div>
                
                {loadingStates.users ? (
                  <div className="card-modern py-20 flex flex-col items-center justify-center text-center bg-white border border-slate-100 italic">
                    <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Loading directory...</p>
                  </div>
                ) : (
                  <div className="card-modern bg-white border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {users.map((user: any) => (
                            <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center">
                                  <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=6366F1&color=FFFFFF`}
                                    alt={user.username}
                                    className="h-10 w-10 rounded-xl mr-4 shadow-sm"
                                  />
                                  <div>
                                    <span className="block text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{user.username}</span>
                                    <span className="block text-xs text-slate-500 mt-0.5">{user.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                  user.role === 'admin' 
                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                    : user.role === 'moderator'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full flex w-max items-center space-x-1.5 ${
                                  user.isActive
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                  <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <button
                                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    user.isActive 
                                    ? 'text-rose-500 bg-rose-50 hover:bg-rose-100 border border-transparent' 
                                    : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-transparent'
                                  } ${user.role === 'admin' && user.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  disabled={user.role === 'admin' && user.isActive}
                                  onClick={() => handleToggleUserStatus(user._id)}
                                >
                                  {loadingStates.toggling.has(user._id) ? 'Processing...' : user.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Moderators Tab (Super Admin Only) */}
          {activeTab === 'moderators' && isSuperAdmin && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                    Team <span className="text-primary-600">Moderators</span>
                  </h3>
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full">{moderators.length}</span>
                </div>
                <button
                  onClick={() => setShowAddModeratorModal(true)}
                  className="flex items-center px-5 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Add Moderator
                </button>
              </div>

              {moderators.length === 0 ? (
                <div className="card-modern bg-white border border-slate-100 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheckIcon className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No moderators yet</p>
                  <p className="text-slate-400 text-xs mt-1">Add moderators to help manage the community</p>
                </div>
              ) : (
                <div className="card-modern bg-white border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {moderators.map((moderator: any) => (
                      <div key={moderator._id} className="flex items-center justify-between px-8 py-5 hover:bg-slate-50/50 transition-colors group">
                        <div className="flex items-center">
                          <img
                            src={moderator.avatar || `https://ui-avatars.com/api/?name=${moderator.username}&background=6366F1&color=FFFFFF`}
                            alt={moderator.username}
                            className="h-10 w-10 rounded-xl mr-4 shadow-sm"
                          />
                          <div>
                            <span className="block text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{moderator.username}</span>
                            <span className="block text-xs text-slate-500 mt-0.5">{moderator.email}</span>
                            {moderator.moderatorSince && (
                              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                Since {new Date(moderator.moderatorSince).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                            Moderator
                          </span>
                          <button
                            onClick={() => handleRemoveModerator(moderator)}
                            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-transparent"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <h3 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                  Activity <span className="text-primary-600">Log</span>
                </h3>
                <span className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full">{moderationLog.length}</span>
              </div>

              {loadingStates.logs ? (
                <div className="card-modern bg-white border border-slate-100 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Loading logs...</p>
                </div>
              ) : moderationLog.length === 0 ? (
                <div className="card-modern bg-white border border-slate-100 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <ClockIcon className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No activity yet</p>
                </div>
              ) : (
                <div className="card-modern bg-white border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {moderationLog.map((action: any) => {
                      const actionColors: Record<string, string> = {
                        approve: 'bg-emerald-50 text-emerald-600',
                        reject: 'bg-rose-50 text-rose-600',
                        delete: 'bg-amber-50 text-amber-600',
                      };
                      const color = actionColors[action.action] || 'bg-primary-50 text-primary-600';
                      const Icon = action.action === 'approve' ? CheckCircleIcon
                        : action.action === 'reject' ? XCircleIcon
                        : action.action === 'delete' ? TrashIcon
                        : AdjustmentsHorizontalIcon;
                      return (
                        <div key={action._id} className="flex items-start gap-4 px-8 py-5 hover:bg-slate-50/50 transition-colors">
                          <div className={`p-2 rounded-xl shrink-0 ${color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700">
                              {action.performedByUsername}
                              <span className="font-normal text-slate-500"> {action.action}d {action.targetType}</span>
                              {action.reason && <span className="text-slate-400"> — {action.reason}</span>}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {new Date(action.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                    Herramientas <span className="text-primary-600">IA</span>
                  </h3>
                  <span className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full">{tools.length}</span>
                </div>
                <button
                  onClick={openCreateTool}
                  className="flex items-center px-5 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Nueva Herramienta
                </button>
              </div>

              {toolsLoading ? (
                <div className="card-modern bg-white border border-slate-100 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Cargando herramientas...</p>
                </div>
              ) : tools.length === 0 ? (
                <div className="card-modern bg-white border border-slate-100 py-16 flex flex-col items-center justify-center text-center">
                 
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No hay herramientas aún</p>
                  <p className="text-slate-400 text-xs mt-1">Agrega la primera herramienta IA</p>
                </div>
              ) : (
                <div className="card-modern bg-white border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {tools.map((tool: any) => {
                      const domain = (() => { try { return new URL(tool.url).hostname.replace('www.', ''); } catch { return tool.url; } })();
                      return (
                        <div key={tool._id} className="flex items-center gap-4 px-8 py-4 hover:bg-slate-50/50 transition-colors group">
                          {/* Logo */}
                          <ToolLogoImg url={tool.url} name={tool.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">{tool.name}</span>
                              {tool.featured && (
                                <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-amber-50 text-amber-600 border border-amber-100">Destacada</span>
                              )}
                              <span className={`shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                                tool.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                {tool.isActive ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1 mb-0.5">{tool.description}</p>
                            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary-500 hover:underline font-mono truncate block max-w-xs">{domain}</a>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => openEditTool(tool)}
                              className="p-2.5 bg-slate-50 hover:bg-primary-50 hover:text-primary-600 text-slate-400 rounded-xl transition-colors border border-slate-100"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleToolActive(tool)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                tool.isActive
                                  ? 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                              }`}
                            >
                              {tool.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => handleDeleteTool(tool)}
                              className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-400 rounded-xl transition-colors border border-rose-100"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Forums Tab */}
          {activeTab === 'forums' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                    Community <span className="text-primary-600">Forums</span>
                  </h3>
                  <span className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full">{forums.length}</span>
                </div>
                <button
                  onClick={openCreateForum}
                  className="flex items-center px-5 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  New Forum
                </button>
              </div>

              {forumsLoading ? (
                <div className="card-modern bg-white border border-slate-100 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Loading forums...</p>
                </div>
              ) : forums.length === 0 ? (
                <div className="card-modern bg-white border border-slate-100 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <ChatBubbleLeftRightIcon className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No forums yet</p>
                  <p className="text-slate-400 text-xs mt-1">Create your first community forum</p>
                </div>
              ) : (
                <div className="card-modern bg-white border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {forums.map((forum: any) => (
                      <div key={forum._id} className="flex items-center gap-6 px-8 py-5 hover:bg-slate-50/50 transition-colors group">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                          {forum.favicon ? (
                            <img src={forum.favicon} alt={forum.name} className="w-6 h-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                          ) : (
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">{forum.name}</span>
                            {forum.language === 'en'
                              ? <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-100">🇬🇧 English</span>
                              : <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold rounded-full bg-red-50 text-red-600 border border-red-100">🇪🇸 Español</span>
                            }
                            <span className={`shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                              forum.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}>
                              {forum.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mb-0.5">{forum.description}</p>
                          <a href={forum.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary-500 hover:underline font-mono truncate block max-w-xs">
                            {forum.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openEditForum(forum)}
                            className="p-2.5 bg-slate-50 hover:bg-primary-50 hover:text-primary-600 text-slate-400 rounded-xl transition-colors border border-slate-100"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleForumActive(forum)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                              forum.isActive
                                ? 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                            }`}
                          >
                            {forum.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleDeleteForum(forum)}
                            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-400 rounded-xl transition-colors border border-rose-100"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">Reportes de contenido</h2>
                <div className="flex gap-2">
                  {(['pending', 'resolved', 'dismissed', 'all'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setReportStatusFilter(s); }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${reportStatusFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      {s === 'pending' ? `Pendientes${pendingReportsCount > 0 ? ` (${pendingReportsCount})` : ''}` : s === 'resolved' ? 'Resueltos' : s === 'dismissed' ? 'Descartados' : 'Todos'}
                    </button>
                  ))}
                </div>
              </div>

              {reportsLoading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" /></div>
              ) : reports.length === 0 ? (
                <div className="card-modern p-16 text-center bg-white border border-slate-100">
                  <ExclamationTriangleIcon className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No hay reportes {reportStatusFilter !== 'all' ? `con estado "${reportStatusFilter}"` : ''}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report: any) => (
                    <div key={report._id} className="card-modern bg-white border border-slate-100 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${report.status === 'pending' ? 'bg-amber-50 text-amber-600' : report.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                              {report.status}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">{report.reason}</span>
                            <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>

                          {/* Prompt info */}
                          <div className="mb-3">
                            <p className="text-xs text-slate-500 mb-1">Prompt reportado:</p>
                            <p className="font-semibold text-slate-900 truncate">
                              {report.targetId?.title || <span className="text-rose-400 italic">Prompt eliminado</span>}
                            </p>
                            {report.targetId?.author && (
                              <p className="text-xs text-slate-400 mt-0.5">por @{report.targetId.author.username}</p>
                            )}
                          </div>

                          {/* Reporter */}
                          <div className="flex items-center gap-2 mb-2">
                            <img src={report.reporter?.avatar || `https://ui-avatars.com/api/?name=${report.reporter?.username}&size=32`} alt="" className="w-5 h-5 rounded-full" />
                            <span className="text-xs text-slate-500">Reportado por <span className="font-medium text-slate-700">@{report.reporter?.username}</span></span>
                          </div>

                          {report.details && (
                            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 mt-2">{report.details}</p>
                          )}

                          {report.status !== 'pending' && report.resolvedBy && (
                            <p className="text-xs text-slate-400 mt-2">
                              {report.status === 'resolved' ? 'Resuelto' : 'Descartado'} por @{report.resolvedBy?.username}
                              {report.resolutionNote && ` — "${report.resolutionNote}"`}
                            </p>
                          )}
                        </div>

                        {report.status === 'pending' && (
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => setReportActionModal({ open: true, report, action: 'no_action', note: '', loading: false })}
                              className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                              Resolver
                            </button>
                            <button
                              onClick={() => handleDismissReport(report._id)}
                              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                              Descartar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>{/* end max-w-7xl content */}

        {/* Report Action Modal */}
        {reportActionModal.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h3 className="text-xl font-heading font-extrabold text-slate-900 mb-2 tracking-tight">Resolver reporte</h3>
              <p className="text-sm text-slate-500 mb-6">
                Prompt: <span className="font-medium text-slate-700">{reportActionModal.report?.targetId?.title || 'eliminado'}</span>
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { value: 'no_action', label: 'Sin acción — el contenido es válido', activeStyle: { borderColor: '#6ee7b7', background: '#f0fdf4' } },
                  { value: 'warn_author', label: 'Advertir al autor', activeStyle: { borderColor: '#fcd34d', background: '#fffbeb' } },
                  { value: 'delete_prompt', label: '⚠ Eliminar el prompt permanentemente', activeStyle: { borderColor: '#fca5a5', background: '#fff1f2' } },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all"
                    style={reportActionModal.action === opt.value ? opt.activeStyle : { borderColor: '#e2e8f0' }}
                  >
                    <input type="radio" name="action" value={opt.value} checked={reportActionModal.action === opt.value} onChange={() => setReportActionModal(prev => ({ ...prev, action: opt.value }))} />
                    <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nota interna (opcional)</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={reportActionModal.note}
                  onChange={(e) => setReportActionModal(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Razón de la decisión..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setReportActionModal({ open: false, report: null, action: '', note: '', loading: false })} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleResolveReport}
                  disabled={!reportActionModal.action || reportActionModal.loading}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {reportActionModal.loading ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Tool Create/Edit Modal */}
        {showToolModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
                  {editingTool ? 'Editar Herramienta' : 'Nueva Herramienta'}
                </h3>
                <button
                  onClick={() => { setShowToolModal(false); setEditingTool(null); setToolForm({ name: '', url: '', description: '', category: 'other', featured: false }); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre de la herramienta"
                    value={toolForm.name}
                    onChange={e => setToolForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={toolForm.url}
                    onChange={e => setToolForm(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                  />
                  {toolForm.url && (() => { try { const d = new URL(toolForm.url).hostname.replace('www.',''); return (
                    <div className="flex items-center gap-3 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <img src={`https://logo.clearbit.com/${d}`} alt="" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100" onError={e => { (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${d}&sz=64`; }} />
                      <span className="text-xs text-slate-500 font-mono">{d}</span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest ml-auto">Logo auto-detectado</span>
                    </div>
                  ); } catch { return null; } })()}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
                  <textarea
                    placeholder="Descripción breve de la herramienta..."
                    value={toolForm.description}
                    onChange={e => setToolForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all font-medium text-slate-900 placeholder:text-slate-300 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Categoría</label>
                  <select
                    value={toolForm.category}
                    onChange={e => setToolForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all font-medium text-slate-900 outline-none"
                  >
                    {TOOL_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toolForm.featured}
                    onChange={e => setToolForm(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary-600"
                  />
                  <span className="text-sm font-bold text-slate-600">Marcar como destacada</span>
                </label>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => { setShowToolModal(false); setEditingTool(null); setToolForm({ name: '', url: '', description: '', category: 'other', featured: false }); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTool}
                  disabled={toolSaving}
                  className="flex-[2] py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {toolSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : (editingTool ? 'Guardar Cambios' : 'Crear Herramienta')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forum Create/Edit Modal */}
        {showForumModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
                  {editingForum ? 'Editar Foro' : 'Nuevo Foro'}
                </h3>
                <button
                  onClick={() => { setShowForumModal(false); setEditingForum(null); setForumForm({ name: '', description: '', url: '', image: '', favicon: '', language: 'es' }); setForumPreview(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-5">
                {/* URL first — triggers preview */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">URL del Foro</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={forumForm.url}
                    onChange={(e) => handleForumUrlChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                  />
                </div>

                {/* Preview card */}
                {forumPreview && (
                  <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50">
                    {forumPreview.loading ? (
                      <div className="flex items-center gap-3 p-4">
                        <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin shrink-0" />
                        <span className="text-xs text-slate-400 font-medium">Obteniendo previsualización...</span>
                      </div>
                    ) : (
                      <>
                        {forumPreview.image && (
                          <img
                            src={forumPreview.image}
                            alt="preview"
                            className="w-full h-32 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <div className="flex items-center gap-3 p-4">
                          {forumPreview.favicon && (
                            <img src={forumPreview.favicon} alt="" className="w-6 h-6 rounded object-contain shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{forumPreview.title || forumForm.url}</p>
                            {forumPreview.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{forumPreview.description}</p>
                            )}
                          </div>
                          <span className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                            Auto-detectado
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre del foro"
                    value={forumForm.name}
                    onChange={(e) => setForumForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
                  <textarea
                    placeholder="Descripción breve..."
                    value={forumForm.description}
                    onChange={(e) => setForumForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all font-medium text-slate-900 placeholder:text-slate-300 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Idioma de la comunidad</label>
                  <div className="flex gap-3">
                    {[{ value: 'es', flag: '🇪🇸', label: 'Español' }, { value: 'en', flag: '🇬🇧', label: 'English' }].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForumForm(prev => ({ ...prev, language: opt.value }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-bold transition-all ${
                          forumForm.language === opt.value
                            ? 'bg-primary-50 border-primary-300 text-primary-700'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-lg">{opt.flag}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => { setShowForumModal(false); setEditingForum(null); setForumForm({ name: '', description: '', url: '', image: '', favicon: '', language: 'es' }); setForumPreview(null); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveForum}
                  disabled={forumSaving}
                  className="flex-[2] py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {forumSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</> : (editingForum ? 'Guardar Cambios' : 'Crear Foro')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h3 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight mb-5">Rechazar Prompt</h3>
              <textarea
                placeholder="Motivo del rechazo..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all font-medium text-slate-900 placeholder:text-slate-300 outline-none resize-none"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowRejectionModal(null); setRejectionReason(''); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => showRejectionModal && handleRejectPrompt(showRejectionModal)}
                  disabled={showRejectionModal ? loadingStates.rejecting.has(showRejectionModal) : false}
                  className="flex-[2] py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                >
                  {showRejectionModal && loadingStates.rejecting.has(showRejectionModal)
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Rechazando...</>
                    : 'Rechazar Prompt'
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-large p-8 max-w-md w-full mx-4 transform transition-all animate-scaling">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mb-4">
                  <TrashIcon className="h-8 w-8 text-error-600 dark:text-error-400" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
                  Confirmar Eliminación
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  ¿Estás seguro de que deseas eliminar <strong>"{deleteModal.title}"</strong>? 
                  Esta acción no se puede deshacer.
                </p>
                
                <div className="flex w-full space-x-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setDeleteModal(prev => ({ ...prev, open: false }))}
                    disabled={deleteModal.loading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="error"
                    fullWidth
                    loading={deleteModal.loading}
                    onClick={handleConfirmDelete}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Moderator Modal */}
        {showAddModeratorModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">Add Moderator</h3>
                <button
                  onClick={() => { setShowAddModeratorModal(false); setNewModeratorEmail(''); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">User Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={newModeratorEmail}
                onChange={(e) => setNewModeratorEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddModerator()}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all font-medium text-slate-900 placeholder:text-slate-300 outline-none"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowAddModeratorModal(false); setNewModeratorEmail(''); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddModerator}
                  disabled={loadingStates.addingModerator}
                  className="flex-[2] py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loadingStates.addingModerator
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding...</>
                    : 'Add Moderator'
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
};

export default AdminPanelEnhanced;
