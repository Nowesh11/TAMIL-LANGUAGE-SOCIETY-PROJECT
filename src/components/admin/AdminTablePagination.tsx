import React from 'react';

interface Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export default function AdminTablePagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, label }: Props) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  return (
    <div className="admin-modern-pagination">
      <div className="admin-modern-pagination-info">
        {label ? label : 'Showing'} {totalItems === 0 ? 0 : start} to {end} of {totalItems}
      </div>
      <div className="admin-modern-pagination-controls">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
        >
          Previous
        </button>
        <span className="admin-modern-pagination-current">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
