'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { 
  FiUsers, FiBook, FiTrendingUp, FiDownload, FiBriefcase, FiImage, FiFolder,
  FiMessageCircle, FiAlertCircle, FiBookOpen, FiServer, FiActivity, FiEye,
  FiBarChart2, FiPieChart, FiDollarSign, FiTrendingDown
} from 'react-icons/fi';
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function DashboardClient({ initialData }: { initialData: any }) {
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const accessToken = localStorage.getItem('accessToken') || '';
        const res = await fetch(`/api/admin/dashboard?timeRange=${timeRange}`, {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
          cache: 'no-store',
          signal: controller.signal
        });
        if (!res.ok) {
          if (res.status >= 500) throw new Error('Server error. Please try again later.');
          throw new Error(`API error: ${res.status}`);
        }
        const json = await res.json();
        setData(json);
        setRetryCount(0);
      } catch (e: any) {
        const msg = String(e?.message || '');
        const name = String(e?.name || '');
        if (name === 'AbortError' || msg.toLowerCase().includes('aborted')) return;
        setError(e?.message || 'Failed to load dashboard data');
        if (retryCount < 2 && msg.includes('Server error')) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchData();
          }, 1500 * (retryCount + 1));
        }
      } finally {
        setLoading(false);
      }
    }
    if (timeRange !== '30d') fetchData();
    return () => controller.abort();
  }, [timeRange]);

  const statsList = [
    { title: 'Total Users', key: 'totalUsers', icon: FiUsers, color: 'primary' },
    { title: 'Team Members', key: 'totalTeamMembers', icon: FiUsers, color: 'warning' },
    { title: 'Books', key: 'totalBooks', icon: FiBook, color: 'info' },
    { title: 'EBooks', key: 'totalEBooks', icon: FiBookOpen, color: 'success' },
    { title: 'Book Ratings', key: 'totalBookRatings', icon: FiTrendingUp, color: 'primary' },
    { title: 'EBook Ratings', key: 'totalEBookRatings', icon: FiTrendingUp, color: 'success' },
    { title: 'Purchases', key: 'totalPurchases', icon: FiDownload, color: 'primary' },
    { title: 'Project Items', key: 'totalProjectItems', icon: FiBriefcase, color: 'primary' },
    { title: 'Posters', key: 'totalPosters', icon: FiImage, color: 'info' },
    { title: 'Components', key: 'totalComponents', icon: FiFolder, color: 'success' },
    { title: 'Chat Messages', key: 'totalChatMessages', icon: FiMessageCircle, color: 'info' },
    { title: 'Notifications', key: 'totalNotifications', icon: FiAlertCircle, color: 'warning' },
    { title: 'Recruitment Forms', key: 'totalRecruitmentForms', icon: FiBriefcase, color: 'warning' },
    { title: 'Recruitment Responses', key: 'totalRecruitmentResponses', icon: FiUsers, color: 'success' },
    { title: 'Activity Logs', key: 'totalActivityLogs', icon: FiActivity, color: 'info' },
    { title: 'Payment Settings', key: 'totalPaymentSettings', icon: FiServer, color: 'primary' },
  ];

  return (
    <AdminLayout>
      <div className="admin-modern-container admin-modern-fade-in">
        <div className="admin-modern-header">
          <h1>Dashboard Overview</h1>
          <p>Welcome back! Here's what's happening with your Tamil Language Society platform.</p>
        </div>

        <div className="admin-modern-card">
          <div className="admin-modern-controls">
            <div className="admin-modern-controls-row">
              <div className="admin-modern-filter-group">
                <label className="admin-modern-filter-label">
                  <FiBarChart2 />
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="admin-modern-filter-select"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>
              {error && (
                <div className="modal-error" style={{ marginLeft: 'auto' }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="admin-modern-stats-grid">
          {statsList.map((s, idx) => {
            const Icon = s.icon;
            const value = data?.stats?.[s.key] ?? 0;
            return (
              <div key={idx} className={`admin-modern-card ${s.color} admin-modern-slide-up`}>
                <div className="admin-modern-card-header">
                  <div className={`admin-modern-card-icon ${s.color}`}>
                    <Icon />
                  </div>
                  <div className="admin-modern-card-change positive">
                    <FiTrendingUp />
                    +0%
                  </div>
                </div>
                <div className="admin-modern-card-content">
                  <p className="admin-modern-card-title">{s.title}</p>
                  <h3 className="admin-modern-card-value">{Number(value).toLocaleString()}</h3>
                </div>
              </div>
            );
          })}
        </div>

        <div className="admin-modern-grid admin-modern-grid-2">
          <div className="admin-modern-card">
            <div className="admin-modern-card-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--modern-text-primary)' }}>
                <FiBarChart2 />
                Activity Trends
              </h2>
            </div>
            <div style={{ height: '300px', marginTop: 'var(--modern-space-4)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--modern-border)" />
                  <XAxis dataKey="name" stroke="var(--modern-text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--modern-text-secondary)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--modern-bg-primary)', border: '1px solid var(--modern-border)', borderRadius: 'var(--modern-radius-lg)', boxShadow: 'var(--modern-shadow-lg)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="users" stackId="1" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} name="Users" />
                  <Area type="monotone" dataKey="books" stackId="1" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.3} name="Books" />
                  <Area type="monotone" dataKey="ebooks" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="E-Books" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-modern-card">
            <div className="admin-modern-card-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--modern-text-primary)' }}>
                <FiDollarSign />
                Revenue Trends
              </h2>
            </div>
            <div style={{ height: '300px', marginTop: 'var(--modern-space-4)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--modern-border)" />
                  <XAxis dataKey="name" stroke="var(--modern-text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--modern-text-secondary)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--modern-bg-primary)', border: '1px solid var(--modern-border)', borderRadius: 'var(--modern-radius-lg)', boxShadow: 'var(--modern-shadow-lg)' }} formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }} name="Revenue" />
                  <Line type="monotone" dataKey="purchases" stroke="#EC4899" strokeWidth={2} dot={{ fill: '#EC4899', strokeWidth: 2, r: 3 }} name="Purchases" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="admin-modern-grid admin-modern-grid-2">
          <div className="admin-modern-card">
            <div className="admin-modern-card-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--modern-text-primary)' }}>
                <FiPieChart />
                Content Distribution
              </h2>
            </div>
            <div style={{ height: '300px', marginTop: 'var(--modern-space-4)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.categoryDistribution || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {(data?.categoryDistribution || []).map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-modern-card">
            <div className="admin-modern-card-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--modern-text-primary)' }}>
                <FiActivity />
                Recent Activity
              </h2>
              <button className="admin-modern-btn admin-modern-btn-secondary">
                <FiEye />
                View All
              </button>
            </div>
            <div style={{ marginTop: 'var(--modern-space-4)' }}>
              {!data?.recentActivity || data.recentActivity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--modern-space-8)' }}>
                  <FiActivity style={{ fontSize: '3rem', color: 'var(--modern-text-tertiary)', marginBottom: 'var(--modern-space-4)' }} />
                  <h3 style={{ margin: '0 0 var(--modern-space-2)', color: 'var(--modern-text-primary)' }}>No Recent Activity</h3>
                  <p style={{ margin: 0, color: 'var(--modern-text-secondary)' }}>Activity will appear here as users interact with your platform.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--modern-space-3)' }}>
                  {data.recentActivity.slice(0, 5).map((a: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--modern-space-3)', padding: 'var(--modern-space-3)', borderRadius: 'var(--modern-radius-lg)', background: 'var(--modern-gray-50)', border: '1px solid var(--modern-border-light)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--modern-radius-lg)', background: 'var(--modern-gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--modern-text-white)' }}>
                        <FiActivity />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 var(--modern-space-1)', fontWeight: '500', color: 'var(--modern-text-primary)' }}>
                          {a.description}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--modern-text-secondary)' }}>
                          {a.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="admin-modern-table-container">
          <div style={{ padding: 'var(--modern-space-6)', borderBottom: '1px solid var(--modern-border)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', fontWeight: '600', color: 'var(--modern-text-primary)' }}>
              <FiServer />
              System Overview
            </h2>
          </div>
          <table className="admin-modern-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {[
                { service: 'Database', status: data?.systemHealth?.database || 'offline', performance: '98%', lastUpdated: '2 min ago' },
                { service: 'API Server', status: data?.systemHealth?.api || 'operational', performance: '95%', lastUpdated: '1 min ago' },
                { service: 'File Storage', status: data?.systemHealth?.storage || 'available', performance: '78%', lastUpdated: '5 min ago' },
                { service: 'Authentication', status: 'operational', performance: '99%', lastUpdated: '3 min ago' },
              ].map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '500' }}>{s.service}</td>
                  <td>
                    <span className={`admin-modern-badge admin-modern-badge-${
                      s.status === 'operational' || s.status === 'online' || s.status === 'available' ? 'success' :
                      s.status === 'warning' || s.status === 'degraded' || s.status === 'limited' ? 'warning' : 'error'
                    }`}>{s.status}</span>
                  </td>
                  <td style={{ color: 'var(--modern-text-secondary)' }}>{s.lastUpdated}</td>
                  <td>{s.performance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
