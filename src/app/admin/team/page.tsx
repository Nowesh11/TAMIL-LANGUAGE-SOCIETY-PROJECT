'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import AdminHeader from '../../../components/admin/AdminHeader';
import AdminTablePagination from '../../../components/admin/AdminTablePagination';
import TeamModal from '../../../components/admin/TeamModal';
import { 
  FiUsers, 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit, 
  FiTrash2, 
  FiUser,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiFolder,
  FiStar,
  FiLayers,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiSettings,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiMail,
  FiPhone,
  FiTag,
  FiGrid,
  FiBarChart,
  FiAward,
  FiBriefcase,
  FiMapPin,
  FiGlobe
} from 'react-icons/fi';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import '../../../styles/admin/modals.css';

// Types
interface BilingualText {
  en: string;
  ta: string;
}

interface TeamMember {
  _id: string;
  name: BilingualText;
  role: string;
  department: string;
  bio: BilingualText;
  isActive: boolean;
  orderNum: number;
  imagePath?: string;
  email?: string;
  phone?: string;
  joinedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamStats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
}

const TeamAdmin: React.FC = () => {
  // State management
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('orderNum');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [stats, setStats] = useState<TeamStats>({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0
  });
  
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Departments
  const DEPARTMENTS = [
    'High Committee',
    'Committee Member - Cultural Affairs',
    'Committee Member - Education',
    'Committee Member - Events',
    'Committee Member - Media & Communications',
    'Committee Member - Technical',
    'Committee Member - Research',
    'Committee Member - Outreach',
    'Committee Member - Finance',
    'Committee Member - Administration',
    'Committee Member - Volunteers',
    'Auditing Department'
  ];

  // Fetch team members data
  useEffect(() => {
    fetchMembers();
  }, [currentPage, searchTerm, filterDepartment, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useAdminShortcuts({
    onAdd: () => { setSelectedMember(null); setIsModalOpen(true); },
    onSearchFocus: () => searchRef.current?.focus(),
    onClearFilters: () => {
      setSearchInput('');
      setFilterDepartment('all');
      setFilterStatus('all');
      setSortBy('orderNum');
      setSortOrder('asc');
      setCurrentPage(1);
    },
    onCloseModal: () => setIsModalOpen(false)
  });

  const fetchMembers = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterDepartment !== 'all' && { department: filterDepartment }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/team?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        signal
      });

      if (!response.ok) throw new Error(`Failed to fetch team members: ${response.status}`);
      
      const result = await response.json();
      
      if (result.success) {
        setMembers(result.data || []);
        setTotalPages(result.pagination?.pages || 1);
        setTotalMembers(result.pagination?.total || 0);
        if (result.stats) {
          setStats(result.stats);
        }
      } else {
        const errorMsg = result.error || 'Failed to fetch team members';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching team members:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch team members';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Delete team member
  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const response = await fetch(`/api/admin/team?id=${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete team member: ${response.status}`);
      }

      toast.success('Team member deleted successfully');
      await fetchMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete team member';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  const handleModalSave = async () => {
    await fetchMembers();
    setIsModalOpen(false);
    setSelectedMember(null);
    toast.success('Team member saved successfully');
  };

  if (loading && members.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-modern-container">
          <div className="admin-modern-loading">
            <div className="admin-modern-spinner"></div>
            <p>Loading team members...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-modern-container admin-modern-fade-in">
        <AdminHeader
          title="Team Management"
          subtitle="Manage society team members and committee"
          actions={
            <button 
              onClick={() => { setSelectedMember(null); setIsModalOpen(true); }}
              className="admin-modern-btn admin-modern-btn-primary"
            >
              <FiPlus /> Add Member
            </button>
          }
        />

        <div className="admin-modern-stats-grid">
          {[
            { title: 'Total Members', value: stats.total, icon: FiUsers, color: 'primary' },
            { title: 'Active Members', value: stats.active, icon: FiCheckCircle, color: 'success' },
            { title: 'Inactive', value: stats.inactive, icon: FiXCircle, color: 'danger' },
            { title: 'Featured', value: stats.featured, icon: FiStar, color: 'warning' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`admin-modern-card ${stat.color}`}>
                <div className="admin-modern-card-header">
                  <div className={`admin-modern-card-icon ${stat.color}`}>
                    <Icon />
                  </div>
                </div>
                <div className="admin-modern-card-content">
                  <p className="admin-modern-card-title">{stat.title}</p>
                  <h3 className="admin-modern-card-value">{(stat.value || 0).toLocaleString()}</h3>
                </div>
              </div>
            );
          })}
        </div>

        <div className="admin-modern-controls admin-sticky-toolbar">
          <div className="admin-modern-controls-row">
            <div className="admin-modern-search-container">
              <FiSearch className="admin-modern-search-icon" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                ref={searchRef}
                className="admin-modern-search-input"
              />
            </div>
            <div className="admin-modern-controls-actions">
              <button 
                onClick={() => {
                  setSearchInput('');
                  setFilterDepartment('all');
                  setFilterStatus('all');
                  setSortBy('orderNum');
                  setSortOrder('asc');
                  setCurrentPage(1);
                }}
                className="admin-modern-btn admin-modern-btn-secondary"
              >
                <FiRefreshCw /> Reset
              </button>
            </div>
          </div>
          <div className="admin-modern-filters-panel">
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiBriefcase /> Department</label>
              <select 
                value={filterDepartment} 
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="admin-modern-filter-select"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiActivity /> Status</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="admin-modern-filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-modern-table-container">
          <div className="admin-modern-table-header">
            <h2><FiUsers /> Team Members ({totalMembers})</h2>
            <div className="admin-modern-table-actions">
               <button onClick={() => fetchMembers()} className="admin-modern-btn admin-modern-btn-ghost">
                 <FiRefreshCw /> Refresh
               </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Image</th>
                  <th>Member</th>
                  <th>Role & Department</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="admin-modern-empty-state">
                        <FiUsers />
                        <h3>No team members found</h3>
                        <p>Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member._id} className="admin-modern-table-row">
                      <td className="w-16 text-center font-mono text-gray-500">
                        {member.orderNum}
                      </td>
                      <td>
                        <div className="w-12 h-12 relative rounded-full overflow-hidden border border-gray-200">
                          <img
                            src={
                              member.imagePath 
                                ? (member.imagePath.startsWith('/') || member.imagePath.startsWith('http') 
                                    ? member.imagePath 
                                    : `/api/files/serve?path=${encodeURIComponent(member.imagePath)}`)
                                : '/placeholder-avatar.svg'
                            }
                            alt={member.name.en}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td>
                        <div className="admin-modern-table-cell-title">{member.name.en}</div>
                        <div className="admin-modern-table-cell-subtitle">{member.name.ta}</div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-900">
                            {typeof member.role === 'object' ? (member.role as any).en || (member.role as any).ta : member.role}
                          </span>
                          <span className="admin-modern-badge admin-modern-badge-secondary">
                            {typeof member.department === 'object' ? (member.department as any).en || (member.department as any).ta : member.department}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 text-sm text-gray-600">
                          {member.email && <div className="flex items-center gap-1"><FiMail className="w-3 h-3" /> {member.email}</div>}
                          {member.phone && <div className="flex items-center gap-1"><FiPhone className="w-3 h-3" /> {member.phone}</div>}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-modern-badge ${
                          member.isActive ? 'admin-modern-badge-success' : 'admin-modern-badge-danger'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-modern-table-actions">
                          <button 
                            onClick={() => handleEditMember(member)}
                            className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button 
                            onClick={() => handleDeleteMember(member._id)}
                            className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <AdminTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalMembers}
            pageSize={10}
            onPageChange={setCurrentPage}
          />
        </div>

        <TeamModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSave}
          member={selectedMember as any}
          mode={selectedMember ? 'edit' : 'create'}
        />
      </div>
    </AdminLayout>
  );
};

export default TeamAdmin;
