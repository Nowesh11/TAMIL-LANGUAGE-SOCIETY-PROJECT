
import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T>({
  data,
  columns,
  keyField,
  isLoading,
  onRowClick,
  emptyMessage = 'No data available'
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center text-gray-400 bg-white/5 rounded-xl border border-dashed border-white/10">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/5">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-transparent">
          {data.map((item) => (
            <tr 
              key={String(item[keyField])} 
              onClick={() => onRowClick && onRowClick(item)}
              className={onRowClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : 'hover:bg-white/5 transition-colors'}
            >
              {columns.map((col, index) => (
                <td
                  key={index}
                  className={`whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-300 sm:pl-6 ${col.className || ''}`}
                >
                  {typeof col.accessor === 'function'
                    ? col.accessor(item)
                    : (item[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
