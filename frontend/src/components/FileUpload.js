import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const FileUpload = ({ onFileUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for large files
        maxContentLength: 100 * 1024 * 1024, // 100MB max
        maxBodyLength: 100 * 1024 * 1024, // 100MB max
      });

      setSuccess(true);
      onFileUpload(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024 // 16MB
  });

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">📁</span>
        <h2 className="card-title">Upload Your Dataset</h2>
      </div>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
        style={{
          border: '3px dashed #667eea',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.05)',
          transition: 'all 0.3s ease',
          minHeight: '300px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: '#4a5568' }}>Uploading and processing...</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {isDragActive ? '📤' : '📊'}
            </div>
            <h3 style={{ color: '#2d3748', marginBottom: '1rem', fontSize: '1.5rem' }}>
              {isDragActive ? 'Drop your file here' : 'Upload CSV or Excel File'}
            </h3>
            <p style={{ color: '#4a5568', fontSize: '1.1rem', marginBottom: '1rem' }}>
              Drag and drop your dataset here, or click to browse
            </p>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>📋</div>
                <p style={{ color: '#718096', fontSize: '0.9rem' }}>CSV Files</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>📑</div>
                <p style={{ color: '#718096', fontSize: '0.9rem' }}>Excel Files</p>
              </div>
            </div>
            <p style={{ color: '#718096', fontSize: '0.85rem', marginTop: '1rem' }}>
              Maximum file size: 100MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="success">
          <strong>Success!</strong> File uploaded successfully. You can now preview your data.
        </div>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#2c5282' }}>📋 Supported Features:</h4>
        <ul style={{ color: '#2c5282', lineHeight: '1.6' }}>
          <li>✅ CSV and Excel file upload</li>
          <li>✅ Data preview and full dataset view</li>
          <li>✅ Dataset statistics and missing value analysis</li>
          <li>✅ Interactive data visualizations</li>
          <li>✅ Correlation matrix and heatmaps</li>
          <li>✅ Data type information</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
