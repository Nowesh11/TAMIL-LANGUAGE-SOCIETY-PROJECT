'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  FiUsers, 
  FiImage, 
  FiBook, 
  FiBookOpen, 
  FiFolder, 
  FiBriefcase, 
  FiMessageCircle, 
  FiUpload,
  FiTrendingUp,
  FiTrendingDown,
  FiEye,
  FiDownload
} from 'react-icons/fi';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ComponentType;
  iconColor: 'primary' | 'success' | 'warning' | 'info';
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats([
          {
            title: 'Total Users',
            value: 1234,
            change: '+12%',
            changeType: 'positive',
            icon: FiUsers,
            iconColor: 'primary'
          },
          {
            title: 'Components',
            value: 45,
            change: '+5%',
            changeType: 'positive',
            icon: FiFolder,
            iconColor: 'success'
          },
          {
            title: 'Posters',
            value: 89,
            change: '+8%',
            changeType: 'positive',
            icon: FiImage,
            iconColor: 'info'
          },
          {
            title: 'Team Members',
            value: 12,
            change: '0%',
            changeType: 'positive',
            icon: FiUsers,
            iconColor: 'warning'
          },
          {
            title: 'Project Items',
            value: 67,
            change: '+15%',
            changeType: 'positive',
            icon: FiBriefcase,
            iconColor: 'primary'
          },
          {
            title: 'EBooks',
            value: 23,
            change: '+3%',
            changeType: 'positive',
            icon: FiBookOpen,
            iconColor: 'success'
          },
          {
            title: 'Books',
            value: 156,
            change: '+7%',
            changeType: 'positive',
            icon: FiBook,
            iconColor: 'info'
          },
          {
            title: 'File Uploads',
            value: 2341,
            change: '+25%',
            changeType: 'positive',
            icon: FiUpload,
            iconColor: 'warning'
          }
        ]);

        setRecentActivity([
          {
            id: '1',
            type: 'user_registration',
            description: 'New user registered: john.doe@email.com',
            timestamp: '2 minutes ago',
            user: 'System'
          },
          {
            id: '2',
            type: 'book_purchase',
            description: 'Book purchased: "Tamil Literature Basics"',
            timestamp: '15 minutes ago',
            user: 'jane.smith@email.com'
          },
          {
            id: '3',
            type: 'poster_upload',
            description: 'New poster uploaded: "Cultural Event 2024"',
            timestamp: '1 hour ago',
            user: 'Admin'
          },
          {
            id: '4',
            type: 'recruitment_response',
            description: 'New recruitment response received',
            timestamp: '2 hours ago',
            user: 'candidate@email.com'
          },
          {
            id: '5',
            type: 'team_update',
            description: 'Team member profile updated',
            timestamp: '3 hours ago',
            user: 'Admin'
          }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <FiUsers />;
      case 'book_purchase':
        return <FiBook />;
      case 'poster_upload':
        return <FiImage />;
      case 'recruitment_response':
        return <FiBriefcase />;
      case 'team_update':
        return <FiUsers />;
      default:
        return <FiFolder />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registration':
        return 'var(--admin-success)';
      case 'book_purchase':
        return 'var(--admin-primary)';
      case 'poster_upload':
        return 'var(--admin-info)';
      case 'recruitment_response':
        return 'var(--admin-warning)';
      case 'team_update':
        return 'var(--admin-secondary)';
      default:
        return 'var(--admin-text-light)';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Welcome to the Tamil Language Society Admin Panel">
        <div className="modern-loading">
          <div className="modern-spinner" style={{ width: '40px', height: '40px' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--modern-text-secondary)' }}>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome to the Tamil Language Society Admin Panel">
      {/* Statistics Grid */}
      <div className="modern-stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const ChangeIcon = stat.changeType === 'positive' ? FiTrendingUp : FiTrendingDown;
          
          return (
            <div key={index} className="modern-card modern-stat-card" style={{
              padding: '1.5rem',
              background: 'var(--modern-bg-primary)',
              border: '1px solid var(--modern-border)',
              borderRadius: 'var(--modern-radius-lg)',
              boxShadow: 'var(--modern-shadow)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--modern-shadow)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: 'var(--modern-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0
                }}>{stat.title}</h3>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--modern-radius)',
                  background: stat.iconColor === 'primary' ? 'rgba(99, 102, 241, 0.1)' :
                             stat.iconColor === 'success' ? 'rgba(16, 185, 129, 0.1)' :
                             stat.iconColor === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                             'rgba(59, 130, 246, 0.1)',
                  color: stat.iconColor === 'primary' ? 'var(--modern-primary)' :
                         stat.iconColor === 'success' ? '#059669' :
                         stat.iconColor === 'warning' ? '#d97706' :
                         '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}>
                  <Icon />
                </div>
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700', 
                color: 'var(--modern-text-primary)',
                marginBottom: '0.5rem'
              }}>{stat.value.toLocaleString()}</div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                fontSize: '0.875rem',
                color: stat.changeType === 'positive' ? '#059669' : '#dc2626'
              }}>
                <ChangeIcon size={16} />
                {stat.change} from last month
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Recent Activity */}
        <div className="admin-table-container">
          <div className="admin-table-header">
            <h2 className="admin-table-title">Recent Activity</h2>
            <button className="admin-btn admin-btn-outline admin-btn-sm">
              <FiEye />
              View All
            </button>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-light)' }}>
                No recent activity
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'var(--admin-bg)',
                      borderRadius: 'var(--admin-radius)',
                      border: '1px solid var(--admin-border)'
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: getActivityColor(activity.type),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.8
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: 'var(--admin-text)' }}>
                        {activity.description}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-light)' }}>
                        {activity.user && `by ${activity.user} • `}{activity.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-table-container">
          <div className="admin-table-header">
            <h2 className="admin-table-title">Quick Actions</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="admin-btn admin-btn-primary" style={{ justifyContent: 'flex-start' }}>
                <FiFolder />
                Add New Component
              </button>
              <button className="admin-btn admin-btn-success" style={{ justifyContent: 'flex-start' }}>
                <FiImage />
                Upload Poster
              </button>
              <button className="admin-btn admin-btn-info" style={{ justifyContent: 'flex-start' }}>
                <FiUsers />
                Add Team Member
              </button>
              <button className="admin-btn admin-btn-warning" style={{ justifyContent: 'flex-start' }}>
                <FiBook />
                Add New Book
              </button>
              <button className="admin-btn admin-btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <FiUpload />
                Manage Files
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="admin-table-container" style={{ marginTop: '2rem' }}>
        <div className="admin-table-header">
          <h2 className="admin-table-title">System Overview</h2>
          <button className="admin-btn admin-btn-outline admin-btn-sm">
            <FiDownload />
            Export Report
          </button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Total Records</th>
              <th>Active</th>
              <th>Last Updated</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiFolder />
                  Components
                </div>
              </td>
              <td>45</td>
              <td>42</td>
              <td>2 hours ago</td>
              <td><span className="admin-badge admin-badge-success">Active</span></td>
            </tr>
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiImage />
                  Posters
                </div>
              </td>
              <td>89</td>
              <td>85</td>
              <td>1 hour ago</td>
              <td><span className="admin-badge admin-badge-success">Active</span></td>
            </tr>
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiUsers />
                  Team
                </div>
              </td>
              <td>12</td>
              <td>12</td>
              <td>3 hours ago</td>
              <td><span className="admin-badge admin-badge-success">Active</span></td>
            </tr>
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiBook />
                  Books
                </div>
              </td>
              <td>156</td>
              <td>150</td>
              <td>30 minutes ago</td>
              <td><span className="admin-badge admin-badge-success">Active</span></td>
            </tr>
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiBookOpen />
                  EBooks
                </div>
              </td>
              <td>23</td>
              <td>20</td>
              <td>4 hours ago</td>
              <td><span className="admin-badge admin-badge-warning">Maintenance</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;