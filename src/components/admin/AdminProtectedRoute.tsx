'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user logged in, redirect to admin login
        const loginUrl = `/admin/login?redirect=${encodeURIComponent(pathname || '/admin/dashboard')}`;
        router.push(loginUrl);
      } else if (user.role !== 'admin') {
        // User is not admin, redirect to admin login with error
        const loginUrl = `/admin/login?message=${encodeURIComponent('Access denied. Admin privileges required.')}&redirect=${encodeURIComponent(pathname || '/admin/dashboard')}`;
        router.push(loginUrl);
      }
    }
  }, [user, loading, router, pathname]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Verifying access...</p>
        </div>
        
        <style jsx>{`
          .admin-loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
          }

          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .admin-loading p {
            margin: 0;
            color: #6b7280;
            font-size: 0.875rem;
          }

          .admin-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e5e7eb;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-unauthorized-container">
        <div className="admin-unauthorized">
          <div className="admin-unauthorized-icon">🔒</div>
          <h1>Access Denied</h1>
          <p>You need admin privileges to access this page.</p>
          <button 
            onClick={() => router.push('/admin/login')}
            className="admin-btn admin-btn-primary"
          >
            Go to Login
          </button>
        </div>
        
        <style jsx>{`
          .admin-unauthorized-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
          }

          .admin-unauthorized {
            text-align: center;
            padding: 3rem 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }

          .admin-unauthorized-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .admin-unauthorized h1 {
            margin: 0 0 1rem;
            color: #1a202c;
            font-size: 1.875rem;
            font-weight: 700;
          }

          .admin-unauthorized p {
            margin: 0 0 2rem;
            color: #718096;
            font-size: 1rem;
          }

          .admin-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
          }

          .admin-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .admin-btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
        `}</style>
      </div>
    );
  }

  // User is authenticated and is admin, render children
  return <>{children}</>;
};

export default AdminProtectedRoute;