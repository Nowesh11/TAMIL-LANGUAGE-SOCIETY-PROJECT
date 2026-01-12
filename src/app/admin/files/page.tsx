'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiFile, FiDownload, FiRefreshCw } from 'react-icons/fi';

export default function FileRecords() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/files');
    const data = await res.json();
    if (data.success) setFiles(data.files);
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AdminLayout title="File Records">
      <div className="admin-content">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">System Files</h2>
          <button onClick={fetchFiles} className="admin-modern-btn admin-modern-btn-primary">
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
        </div>
        
        <div className="admin-modern-table-container">
          <table className="admin-modern-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Path</th>
                <th>Size</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
              ) : files.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4">No files found</td></tr>
              ) : (
                files.map((file, idx) => (
                  <tr key={idx}>
                    <td className="font-medium flex items-center">
                      <FiFile className="mr-2"/>{file.name}
                    </td>
                    <td className="text-gray-500 text-sm">{file.path}</td>
                    <td>{formatSize(file.size)}</td>
                    <td>{new Date(file.created).toLocaleDateString()}</td>
                    <td>
                      <a href={`/${file.path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        <FiDownload className="mr-1" /> View
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}