'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminProtectedRoute from './AdminProtectedRoute';
import '../../styles/admin/layout.css';
import '../../styles/admin/modern.css';
import '../../styles/admin/modals.css';
import toast, { Toaster } from 'react-hot-toast';

import { 
  FiHome, 
  FiUsers, 
  FiImage, 
  FiFolder, 
  FiBook, 
  FiBookOpen, 
  FiCreditCard, 
  FiShoppingBag, 
  FiBriefcase, 
  FiMessageCircle, 
  FiFileText, 
  FiUpload, 
  FiBell, 
  FiSettings, 
  FiMenu, 
  FiX, 
  FiSearch, 
  FiUser,
  FiLogOut,
  FiGrid,
  FiSun,
  FiMoon,
  FiDroplet
} from 'react-icons/fi';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType;
  section: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: FiHome, section: 'Overview' },
  { name: 'Components', href: '/admin/components', icon: FiGrid, section: 'Content Management' },
  { name: 'Posters', href: '/admin/posters', icon: FiImage, section: 'Content Management' },
  { name: 'Team', href: '/admin/team', icon: FiUsers, section: 'Content Management' },
  { name: 'Project Items', href: '/admin/project-items', icon: FiFolder, section: 'Content Management' },
  { name: 'EBooks', href: '/admin/ebooks', icon: FiBookOpen, section: 'Content Management' },
  { name: 'Books', href: '/admin/books', icon: FiBook, section: 'Content Management' },
  { name: 'Payment Settings', href: '/admin/payment-settings', icon: FiCreditCard, section: 'E-commerce' },
  { name: 'Purchased Books', href: '/admin/purchased-books', icon: FiShoppingBag, section: 'E-commerce' },
  { name: 'Recruitment', href: '/admin/recruitment', icon: FiBriefcase, section: 'Recruitment' },
  { name: 'Responses', href: '/admin/recruitment-responses', icon: FiFileText, section: 'Recruitment' },
  { name: 'Chat System', href: '/admin/chat', icon: FiMessageCircle, section: 'Communication' },
  { name: 'Announcements', href: '/admin/announcements', icon: FiBell, section: 'System' },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(5);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accent, setAccent] = useState<'indigo' | 'emerald' | 'orange' | 'sky'>('indigo');
  const pathname = usePathname();
  const router = useRouter();

  // Group navigation items by section
  const groupedNavItems = navItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  // Get current page title from pathname
  const getCurrentPageTitle = () => {
    if (title) return title;
    const currentItem = navItems.find(item => item.href === pathname);
    return currentItem?.name || 'Admin Panel';
  };

  // Generate breadcrumb
  const getBreadcrumb = () => {
    if (!pathname) return [{ name: 'Admin', href: '/admin/dashboard', active: true }];
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumb = [{ name: 'Admin', href: '/admin/dashboard', active: false }];
    
    if (pathSegments.length > 1) {
      const currentItem = navItems.find(item => item.href === pathname);
      if (currentItem) {
        breadcrumb.push({ name: currentItem.name, href: pathname, active: true });
      }
    } else {
      breadcrumb[0].active = true;
    }
    
    return breadcrumb;
  };

  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/admin/login');
    }
  };

  // Get admin name from user data
  const getAdminName = () => {
    if (user?.name) {
      return user.name.en || user.name.ta || 'Admin';
    }
    return 'Admin';
  };

  // Get admin initials for avatar
  const getAdminInitials = () => {
    const name = getAdminName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const savedTheme = (typeof window !== 'undefined' ? localStorage.getItem('adminTheme') : null) as 'light' | 'dark' | null;
    const savedAccent = (typeof window !== 'undefined' ? localStorage.getItem('adminAccent') : null) as 'indigo' | 'emerald' | 'orange' | 'sky' | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedAccent) setAccent(savedAccent);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminTheme', theme);
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  }, [theme]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('adminAccent', accent);
  }, [accent]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };
  const changeAccent = (a: 'indigo' | 'emerald' | 'orange' | 'sky') => {
    setAccent(a);
  };
  const toggleNotifications = async () => {
    setShowNotifications(prev => !prev);
    if (!showNotifications) {
      try {
        setLoadingNotifications(true);
        // Admin sees all recent notifications
        const res = await fetch('/api/notifications?limit=10&sort=newest');
        const result = await res.json();
        if (result.notifications) {
          setNotifications(result.notifications);
          setNotificationCount(result.notifications.length);
        }
      } finally {
        setLoadingNotifications(false);
      }
    }
  };

  return (
    <AdminProtectedRoute>
      <div className={`admin-layout ${theme === 'dark' ? 'dark theme-dark' : 'theme-light'} accent-${accent}`}>
      <Toaster position="top-right" toastOptions={{
        className: 'modern-toast',
        style: {
          background: '#1a1a20',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }
      }} />
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link href="/admin/dashboard" className="admin-sidebar-logo">
            <div className="admin-sidebar-logo-icon">TLS</div>
            <div>
              <h2 className="admin-sidebar-title">Admin Panel</h2>
              <p className="admin-sidebar-subtitle">Management Console</p>
            </div>
          </Link>
        </div>
        
        <nav className="admin-nav">
          {Object.entries(groupedNavItems).map(([section, items]) => (
            <div key={section} className="admin-nav-section">
              <div className="admin-nav-section-title">{section}</div>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <div key={item.href} className="admin-nav-item">
                   <Link
                     href={item.href}
                     prefetch={false}
                     className={`admin-nav-link ${isActive ? 'active' : ''}`}
                     onClick={() => setSidebarOpen(false)}
                   >
                      <div className="admin-nav-icon">
                        <Icon />
                      </div>
                      <span className="admin-nav-text">{item.name}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="admin-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
            
            <nav className="admin-breadcrumb">
              {getBreadcrumb().map((item, index) => (
                <React.Fragment key={`breadcrumb-${index}-${item.href}`}>
                  {index > 0 && <span>/</span>}
                  <Link
                    href={item.href}
                    prefetch={false}
                    className={`admin-breadcrumb-item ${item.active ? 'active' : ''}`}
                  >
                    {item.name}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>
          
          <div className="admin-header-right">
            <div className="admin-search">
              <FiSearch className="admin-search-icon" />
              <input
                type="text"
                placeholder="Search..."
                className="admin-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="admin-user-menu" style={{ gap: '8px' }}>
              <button
                className="admin-logout-button relative"
                onClick={toggleNotifications}
                title="Notifications"
              >
                <FiBell />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {notificationCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={toggleTheme}
                className="admin-logout-button"
                title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
              >
                {theme === 'light' ? <FiMoon /> : <FiSun />}
              </button>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={() => changeAccent('indigo')}
                  className="admin-logout-button"
                  title="Indigo"
                  style={{ background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.35)' }}
                >
                  <FiDroplet />
                </button>
                <button
                  onClick={() => changeAccent('emerald')}
                  className="admin-logout-button"
                  title="Emerald"
                  style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)' }}
                >
                  <FiDroplet />
                </button>
                <button
                  onClick={() => changeAccent('orange')}
                  className="admin-logout-button"
                  title="Orange"
                  style={{ background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.35)' }}
                >
                  <FiDroplet />
                </button>
                <button
                  onClick={() => changeAccent('sky')}
                  className="admin-logout-button"
                  title="Sky"
                  style={{ background: 'rgba(14,165,233,0.15)', borderColor: 'rgba(14,165,233,0.35)' }}
                >
                  <FiDroplet />
                </button>
              </div>
            </div>
            
            <div className="admin-user-menu">
              <div className="admin-user-avatar">{getAdminInitials()}</div>
              <div className="admin-user-info">
                <div className="admin-user-name">{getAdminName()}</div>
                <div className="admin-user-role">Administrator</div>
              </div>
            </div>
            
            <button
              className="admin-logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              <FiLogOut />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="admin-content">
          {(title || subtitle) && (
            <div className="admin-page-header">
              <h1 className="admin-page-title">{getCurrentPageTitle()}</h1>
              {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />
      )}
    </div>
    </AdminProtectedRoute>
  );
};

export default AdminLayout;
