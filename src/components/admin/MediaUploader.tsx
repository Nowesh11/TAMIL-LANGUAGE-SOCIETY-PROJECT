'use client';
import React, { useState } from 'react';
import { FaUpload, FaSpinner, FaTimes, FaFileAlt, FaVideo } from 'react-icons/fa';

interface Props {
  category: string;
  subCategory?: string;
  accept?: string;
  label?: string;
  onUploaded: (result: { url?: string; filePath?: string; fileName?: string }) => void;
  previewType?: 'image' | 'file' | 'auto';
  initialUrl?: string;
}

export default function MediaUploader({ category, subCategory, accept = '*/*', label, onUploaded, previewType = 'auto', initialUrl }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string>(initialUrl || '');
  const [fileName, setFileName] = useState<string>('');

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setFileName(file.name);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      if (subCategory) fd.append('subCategory', subCategory);
      const res = await fetch('/api/upload/media', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload failed');
      }
      setPreviewSrc(json.url || '');
      onUploaded({ url: json.url, filePath: json.filePath, fileName: json.fileName });
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const isImage = (src: string) => src.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
  const isVideo = (src: string) => src.match(/\.(mp4|webm|ogg|avi|mov|wmv|qt)$/i);

  return (
    <div className="modern-image-upload-section">
      {label && <label className="modern-label">{label}</label>}
      <div className="modern-image-upload-area">
        {previewSrc ? (
          <div className="image-preview">
            {((previewType === 'image') || (previewType === 'auto' && isImage(previewSrc || ''))) && (
              <img className="preview-image" src={previewSrc} alt={fileName || 'Preview'} />
            )}
            {((previewType === 'file') || (previewType === 'auto' && !isImage(previewSrc || '') && !isVideo(previewSrc || ''))) && (
              <div style={{ textAlign: 'center', color: 'var(--admin-text-primary)' }}>
                <FaFileAlt style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.875rem' }}>{fileName}</div>
              </div>
            )}
            {(previewType === 'auto' && isVideo(previewSrc || '')) && (
              <div style={{ textAlign: 'center', color: 'var(--admin-text-primary)' }}>
                <FaVideo style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.875rem' }}>{fileName}</div>
              </div>
            )}
            <div className="image-overlay">
              <button type="button" className="remove-image-btn" onClick={() => setPreviewSrc('')}>
                <FaTimes />
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <FaUpload />
            <p>Click to upload</p>
            <p className="upload-hint">Images, videos, PDFs supported</p>
          </div>
        )}
        <input type="file" accept={accept} onChange={handleChange} className="file-input" />
        {uploading && (
          <div className="upload-progress">
            <FaSpinner className="spinner" />
            <span>Uploading...</span>
          </div>
        )}
      </div>
      {error && <div className="error-message"><FaTimes /> {error}</div>}
    </div>
  );
}
