import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataPreview = ({ fileInfo, onDataLoad }) => {
  const [previewData, setPreviewData] = useState(null);
  const [fullData, setFullData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullData, setShowFullData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);

  // Safety check for fileInfo
  const safeFileInfo = fileInfo || {};
  const hasValidFileInfo = safeFileInfo.filename && safeFileInfo.shape && safeFileInfo.columns;

  useEffect(() => {
    if (hasValidFileInfo) {
      loadPreviewData();
    } else {
      setPreviewData(null);
      setFullData(null);
      setShowFullData(false);
      setLoading(false);
      setError(null);
    }
  }, [fileInfo, hasValidFileInfo]);

  const loadPreviewData = async () => {
    if (!hasValidFileInfo) {
      setError('No valid file information available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/preview');
      
      if (response.data && response.data.data && response.data.columns) {
        setPreviewData(response.data);
        if (onDataLoad) {
          onDataLoad(response.data);
        }
      } else {
        setError('Invalid data format received from server');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading preview data');
      console.error('Preview data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFullData = async () => {
    if (fullData) {
      setShowFullData(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/data');
      
      if (response.data && response.data.data && response.data.columns) {
        setFullData(response.data);
        setShowFullData(true);
      } else {
        setError('Invalid full data format received from server');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading full data');
      console.error('Full data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data, columns, isPreview = false) => {
    if (!data || !columns || !Array.isArray(data) || !Array.isArray(columns)) return null;

    // Pagination for full data
    let displayData = data;
    let totalPages = 1;
    
    if (!isPreview && showFullData && data.length > 0) {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      displayData = data.slice(startIndex, endIndex);
      totalPages = Math.ceil(data.length / rowsPerPage);
    }

    return (
      <>
        <div className="table-container" style={{ 
          maxHeight: isPreview ? '400px' : '600px', 
          overflowY: 'auto',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          marginTop: '1rem'
        }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {!isPreview && <th style={{ width: '60px' }}>#</th>}
                {columns.map((col, index) => (
                  <th key={index} style={{ minWidth: '120px', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData && displayData.length > 0 ? (
                displayData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {!isPreview && (
                      <td style={{ fontWeight: 'bold', color: '#667eea' }}>
                        {(currentPage - 1) * rowsPerPage + rowIndex + 1}
                      </td>
                    )}
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {row && row[col] !== null && row[col] !== undefined ? String(row[col]) : 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (!isPreview ? 1 : 0)} style={{ 
                    textAlign: 'center', 
                    padding: '2rem',
                    color: '#718096'
                  }}>
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isPreview && showFullData && displayData && displayData.length > 0 && totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '1rem', 
            marginTop: '1rem',
            padding: '1rem'
          }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ color: '#4a5568', fontWeight: '600' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">👁️</span>
        <h2 className="card-title">Data Preview</h2>
      </div>

      {hasValidFileInfo && (
        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <strong>📁 File:</strong> {safeFileInfo.filename || 'Unknown'}
            </div>
            <div>
              <strong>📏 Shape:</strong> {
                safeFileInfo.shape && Array.isArray(safeFileInfo.shape) && safeFileInfo.shape.length >= 2
                  ? `${safeFileInfo.shape[0]} rows × ${safeFileInfo.shape[1]} columns`
                  : 'Shape information unavailable'
              }
            </div>
            <div>
              <strong>📊 Columns:</strong> {
                safeFileInfo.columns && Array.isArray(safeFileInfo.columns) 
                  ? safeFileInfo.columns.length 
                  : 'Column count unavailable'
              }
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${!showFullData ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowFullData(false)}
        >
          📋 Preview (First 5 rows)
        </button>
        <button 
          className={`btn ${showFullData ? 'btn-primary' : 'btn-secondary'}`}
          onClick={loadFullData}
        >
          📊 Full Dataset ({previewData?.total_rows || 0} rows)
        </button>
      </div>

      {!showFullData && previewData && previewData.data && previewData.columns && (
        <>
          <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
            📋 Preview - First 5 Rows
          </h3>
          {renderTable(previewData.data, previewData.columns, true)}
        </>
      )}

      {showFullData && fullData && fullData.data && fullData.columns && (
        <>
          <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
            📊 Complete Dataset - {fullData.total_rows || fullData.data.length} Rows
          </h3>
          {renderTable(fullData.data, fullData.columns, false)}
          <div style={{ marginTop: '1rem', color: '#4a5568', textAlign: 'center' }}>
            Showing {Math.min(rowsPerPage, (fullData.data?.length || 0) - (currentPage - 1) * rowsPerPage)} 
            of {fullData.total_rows || fullData.data?.length || 0} rows
          </div>
        </>
      )}

      {!showFullData && (!previewData || !previewData.data || !previewData.columns) && !loading && (
        <div className="info-box" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ color: '#718096' }}>📋 No Preview Data Available</h3>
          <p style={{ color: '#a0aec0' }}>Please upload a file to see the data preview.</p>
        </div>
      )}

      {showFullData && (!fullData || !fullData.data || !fullData.columns) && !loading && (
        <div className="info-box" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ color: '#718096' }}>📊 No Full Data Available</h3>
          <p style={{ color: '#a0aec0' }}>Unable to load the complete dataset.</p>
        </div>
      )}
    </div>
  );
};

export default DataPreview;
