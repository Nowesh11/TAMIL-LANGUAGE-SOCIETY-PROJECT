import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/admin/modals.css';
import { FaTimes, FaDownload, FaSpinner, FaFileAlt, FaChartPie, FaChartBar, FaList, FaFilter } from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';

interface RecruitmentChartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const RecruitmentChartsModal: React.FC<RecruitmentChartsModalProps> = ({ isOpen, onClose, formId, formTitle }) => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'charts' | 'data'>('charts');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && formId) {
      fetchData();
    }
  }, [isOpen, formId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/recruitment-responses?formId=${formId}&limit=1000`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setResponses(data.data || []);
      }

      const formListRes = await fetch(`/api/admin/recruitment-forms?limit=100`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const formListData = await formListRes.json();
      if (formListData.success) {
        const found = formListData.data.find((f: any) => f._id === formId);
        if (found) setFormFields(found.fields || []);
      }

    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (field: any) => {
    if (field.type === 'grid_radio' || field.type === 'grid_checkbox') {
      const gridCounts: Record<string, Record<string, number>> = {};
      
      if (field.options) {
        field.options.forEach((opt: any) => {
          const rowLabel = opt.en || opt.value || 'Unknown';
          gridCounts[rowLabel] = {};
        });
      }

      responses.forEach(r => {
        const answers = r.responses || r.answers || {};
        const nestedAnswer = answers[field.id];
        
        if (nestedAnswer && typeof nestedAnswer === 'object' && !Array.isArray(nestedAnswer)) {
           Object.entries(nestedAnswer).forEach(([rowKey, colVal]) => {
             const rowOpt = field.options?.find((o: any) => o.value === rowKey);
             const rowLabel = rowOpt?.en || rowOpt?.value || rowKey;
             
             if (!gridCounts[rowLabel]) gridCounts[rowLabel] = {};
             
             const valStr = String(colVal);
             gridCounts[rowLabel][valStr] = (gridCounts[rowLabel][valStr] || 0) + 1;
           });
        } else {
           Object.entries(answers).forEach(([key, val]) => {
             if (key.startsWith(`${field.id}::`)) {
               const rowKey = key.split('::')[1];
               const rowOpt = field.options?.find((o: any) => o.value === rowKey);
               const rowLabel = rowOpt?.en || rowOpt?.value || rowKey;

               if (!gridCounts[rowLabel]) gridCounts[rowLabel] = {};
               const valStr = String(val);
               gridCounts[rowLabel][valStr] = (gridCounts[rowLabel][valStr] || 0) + 1;
             }
           });
        }
      });

      const data = Object.entries(gridCounts).map(([rowLabel, colCounts]) => {
        const entry: any = { name: rowLabel };
        Object.entries(colCounts).forEach(([colVal, count]) => {
          entry[colVal] = count;
        });
        return entry;
      });

      const allColValues = new Set<string>();
      Object.values(gridCounts).forEach(cols => {
        Object.keys(cols).forEach(c => allColValues.add(c));
      });

      return { data, values: Array.from(allColValues), type: 'grid' };
    }

    const counts: Record<string, number> = {};
    const values: any[] = [];

    responses.forEach(r => {
      const answers = r.responses || r.answers || {};
      const answer = answers[field.id];
      
      if (Array.isArray(answer)) {
        answer.forEach(a => {
          const label = typeof a === 'string' ? a : String(a);
          counts[label] = (counts[label] || 0) + 1;
          values.push(label);
        });
      } else if (answer !== undefined && answer !== null && answer !== '') {
        const label = typeof answer === 'string' ? answer : String(answer);
        counts[label] = (counts[label] || 0) + 1;
        values.push(label);
      }
    });

    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    return { data, values, total: values.length };
  };

  const renderChart = (field: any) => {
    const { data, values, total, type } = processChartData(field) as any;

    if (total === 0 && !type) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-xl border border-dashed border-[var(--border)]">
          <FaFilter className="text-2xl mb-2 opacity-50" />
          <p className="text-sm">No data collected yet</p>
        </div>
      );
    }

    if (type === 'grid') {
       return (
          <div className="w-full" style={{ height: 350, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} />
                <YAxis stroke="#6b7280" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  cursor={{ fill: 'var(--surface-hover)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {values.map((val: string, idx: number) => (
                  <Bar 
                    key={val} 
                    dataKey={val} 
                    fill={COLORS[idx % COLORS.length]} 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
       );
    }

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex justify-between items-center">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Latest Responses</h4>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{total} Total</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <tbody>
                  {values.slice(0, 15).map((val: any, idx: number) => (
                    <tr key={idx} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="px-4 py-3 text-[var(--foreground)]">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {total > 15 && (
                <div className="px-4 py-3 text-center border-t border-[var(--border)] bg-[var(--background-secondary)]">
                  <p className="text-xs text-[var(--foreground-muted)] font-medium">...and {total - 15} more responses</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'radio':
        return (
          <div className="w-full relative" style={{ height: 300, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    color: 'var(--foreground)'
                  }}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-2xl font-bold text-gray-800">{total}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Votes</p>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="w-full" style={{ height: 300, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(107, 114, 128, 0.2)" />
                <XAxis type="number" stroke="#6b7280" tick={{fontSize: 12}} />
                <YAxis dataKey="name" type="category" width={100} stroke="#6b7280" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    color: 'var(--foreground)'
                  }}
                  cursor={{ fill: 'var(--surface-hover)' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'select':
        const sortedData = [...data].sort((a: any, b: any) => b.value - a.value);
        return (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107, 114, 128, 0.2)" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} />
                <YAxis stroke="#6b7280" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    color: 'var(--foreground)'
                  }}
                  cursor={{ fill: 'var(--surface-hover)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Responses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'file':
        return (
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex justify-between items-center">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Uploaded Files</h4>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{total} Files</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {values.slice(0, 15).map((val: any, idx: number) => {
                  // Ensure URL is absolute if it's a relative path
                  let fileUrl = String(val);
                  if (fileUrl.startsWith('uploads/') || fileUrl.startsWith('/uploads/')) {
                    const cleanPath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
                    fileUrl = `/api/files/serve?path=${encodeURIComponent(cleanPath)}`;
                  } else if (!fileUrl.startsWith('http') && !fileUrl.startsWith('/')) {
                    fileUrl = `/${fileUrl}`;
                  }
                  const fileName = String(val).split('/').pop() || 'file';
                  return (
                  <a 
                    key={idx} 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download={fileName}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-indigo-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FaFileAlt className="text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-indigo-700">
                        {fileName}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">Click to download</p>
                    </div>
                  </a>
                )})}
              </div>
              {total > 15 && (
                <div className="mt-2 text-center py-2">
                  <p className="text-xs text-[var(--foreground-muted)] font-medium">...and {total - 15} more files</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'scale':
      case 'number':
        const sum = values.reduce((acc: number, val: any) => acc + Number(val), 0);
        const avg = total > 0 ? (sum / total).toFixed(1) : 0;
        
        return (
          <div className="h-full flex flex-col">
            <div className="mb-4 flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-indigo-900">Average Score</span>
              <span className="text-lg font-bold text-indigo-600">{avg}</span>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107, 114, 128, 0.2)" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} />
                  <YAxis stroke="#6b7280" tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderColor: 'rgba(229, 231, 235, 1)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: '#1f2937'
                    }}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'date':
      case 'time':
        const chronoData = [...data].sort((a: any, b: any) => a.name.localeCompare(b.name));
        return (
          <div className="w-full" style={{ height: 300, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chronoData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(107, 114, 128, 0.2)" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} />
                <YAxis stroke="#6b7280" tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderColor: 'rgba(229, 231, 235, 1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: '#1f2937'
                  }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Frequency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p>Visualization not available</p>
          </div>
        );
    }
  };

  const handleExport = () => {
    if (!responses.length) return;

    const headers = [
      'Submitted At',
      'Name',
      'Email',
      'Phone',
      'Status',
      ...formFields.map(f => f.label?.en || f.id)
    ];

    const rows = responses.map(r => {
      const answers = r.responses || r.answers || {};
      const fieldValues = formFields.map(f => {
        const val = answers[f.id];
        
        if (Array.isArray(val)) {
          return val.map(v => {
            if (typeof v === 'object' && v !== null) {
              return Object.entries(v).map(([k, subV]) => `${k}: ${subV}`).join(' | ');
            }
            return v;
          }).join('; ');
        }
        
        if (typeof val === 'object' && val !== null) {
          return Object.entries(val)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ');
        }

        return val ? String(val).replace(/"/g, '""') : '';
      });

      return [
        new Date(r.createdAt).toLocaleString(),
        r.submitterName,
        r.submitterEmail,
        r.submitterPhone || '',
        r.status,
        ...fieldValues
      ].map(v => `"${v}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${formTitle.replace(/[^a-z0-9]/gi, '_')}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div className="modern-modal-header">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
              <FaChartPie className="text-xl" />
            </div>
            <div>
              <h2 className="modern-modal-title">Analytics Dashboard</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-1 rounded-lg border border-[var(--border)]">
                  {formTitle}
                </p>
                <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]"></span>
                <p className="text-xs text-[var(--foreground-muted)]">{responses.length} responses</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="modern-close-button"
          >
            <FaTimes />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 flex items-center justify-between bg-[var(--background-secondary)]/30 border-b border-[var(--border)]">
          <div className="flex gap-1 p-1.5 bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)]">
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'charts' 
                  ? 'bg-[var(--surface)] text-indigo-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <FaChartBar /> Visuals
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'data' 
                  ? 'bg-[var(--surface)] text-indigo-600 shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <FaList /> Data Grid
            </button>
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-full transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5"
          >
            <FaDownload /> Export CSV
          </button>
        </div>

        {/* Body */}
        <div className="modern-modal-body">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FaSpinner className="animate-spin text-4xl text-indigo-500 mb-4" />
              <p className="text-sm font-medium text-[var(--foreground-muted)]">Crunching numbers...</p>
            </div>
          ) : activeTab === 'charts' ? (
            <div className="space-y-6 animate-fade-in">
              {formFields.length === 0 ? (
                <div className="text-center py-20 bg-[var(--surface)] rounded-3xl border border-dashed border-[var(--border)]">
                  <FaChartPie className="mx-auto text-4xl text-[var(--foreground-muted)] mb-4 opacity-30" />
                  <p className="text-[var(--foreground-muted)] text-sm font-medium">No analytics available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {formFields.map(field => (
                    <div 
                      key={field.id} 
                      className="bg-[var(--surface)] rounded-3xl p-6 shadow-sm border border-[var(--border)] hover:shadow-lg hover:border-indigo-500/20 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <h3 className="font-bold text-sm text-[var(--foreground)] pr-4 leading-relaxed">
                          {field.label?.en || field.label?.ta || field.type}
                        </h3>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--background-secondary)] text-[var(--foreground-muted)] uppercase tracking-wider border border-[var(--border)]">
                          {field.type}
                        </span>
                      </div>
                      {renderChart(field)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-sm animate-fade-in">
               <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[var(--foreground-muted)] uppercase bg-[var(--background-secondary)] border-b border-[var(--border)]">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Name</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        {formFields.slice(0, 5).map(f => (
                          <th key={f.id} className="px-6 py-4 font-semibold whitespace-nowrap">
                            {f.label?.en || f.label?.ta || f.id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {responses.map((r) => (
                        <tr key={r._id} className="hover:bg-[var(--background-secondary)] transition-colors">
                          <td className="px-6 py-4 text-[var(--foreground)] whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-medium text-[var(--foreground)]">
                            {r.submitterName}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              r.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          {formFields.slice(0, 5).map(f => {
                            const val = (r.responses || r.answers || {})[f.id];
                            return (
                              <td key={f.id} className="px-6 py-4 text-[var(--foreground-muted)] max-w-xs truncate">
                                {Array.isArray(val) ? val.join(', ') : String(val || '-')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecruitmentChartsModal;