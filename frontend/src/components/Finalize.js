import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Finalize = ({ fileInfo, onDataUpdate, mode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [saveFilename, setSaveFilename] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    console.log('📍 Finalize useEffect triggered:', { mode, fileInfo });
    if (mode === 'final-preview') {
      console.log('🚀 Calling loadFinalPreview...');
      loadFinalPreview();
    } else if (mode === 'report') {
      loadReport();
    }
  }, [mode, fileInfo]);

  const loadFinalPreview = async () => {
    setLoading(true);
    setError('');
    
    console.log('🔍 Loading final preview...');
    
    try {
      const response = await axios.get('http://localhost:5001/api/final-preview');
      console.log('✅ Final preview response:', response.data);
      setPreviewData(response.data.preview_data);
      setSummary(response.data.summary);
      console.log('✅ Preview data set:', response.data.preview_data?.length, 'rows');
      console.log('✅ Summary set:', response.data.summary ? 'Yes' : 'No');
    } catch (error) {
      console.error('❌ Error loading final preview:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.status === 400 && error.response?.data?.error === 'No data to preview') {
        setError('No data available for preview. Please upload a dataset first and process it through the cleaning steps.');
      } else {
        setError(error.response?.data?.error || 'Error loading final preview. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
      console.log('🏁 Final preview loading completed');
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5001/api/save-changes', {
        filename: saveFilename || fileInfo?.filename
      });

      setSuccess('Changes saved successfully!');
      setSummary(response.data.summary);
      
      // Notify parent component with properly formatted file info
      if (onDataUpdate) {
        const updatedFileInfo = {
          filename: response.data.filename,
          shape: response.data.shape,
          columns: response.data.columns,
          message: response.data.message
        };
        onDataUpdate(updatedFileInfo);
      }

    } catch (error) {
      setError(error.response?.data?.error || 'Error saving changes');
      console.error('Error saving changes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('http://localhost:5001/api/generate-report');
      setReport(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Error loading report');
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.get('http://localhost:5001/api/download-csv', {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'cleaned_data.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('CSV file downloaded successfully!');

    } catch (error) {
      setError(error.response?.data?.error || 'Error downloading CSV');
      console.error('Error downloading CSV:', error);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'save-changes') {
    return (
      <div className="finalize-container">
        <div className="section-header">
          <h3>💾 Save Changes</h3>
          <p>Commit all your cleaning operations and save the processed dataset</p>
        </div>

        {error && (
          <div className="error-message">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <strong>✅ Success:</strong> {success}
          </div>
        )}

        <div className="save-section">
          <div className="card">
            <div className="card-header">
              <span className="card-icon">💾</span>
              <h2 className="card-title">Save Cleaned Dataset</h2>
            </div>

            <div className="save-form">
              <div className="form-group">
                <label htmlFor="filename">Filename (optional):</label>
                <input
                  type="text"
                  id="filename"
                  value={saveFilename}
                  onChange={(e) => setSaveFilename(e.target.value)}
                  placeholder={`${fileInfo?.filename || 'cleaned_data'}`}
                  className="filename-input"
                />
                <div className="input-hint">
                  Leave empty to use original filename. Extension (.csv or .xlsx) will be added automatically.
                </div>
              </div>

              <div className="current-file-info">
                <h4>📄 Current Dataset Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Original File:</span>
                    <span className="info-value">{fileInfo?.filename || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Rows:</span>
                    <span className="info-value">{fileInfo?.shape?.[0]?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Columns:</span>
                    <span className="info-value">{fileInfo?.shape?.[1] || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveChanges}
                disabled={loading}
                className="btn btn-primary save-button"
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Changes
                  </>
                )}
              </button>
            </div>

            {summary && (
              <div className="save-summary">
                <h4>📋 Save Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Saved As:</span>
                    <span className="summary-value">{summary.saved_filename}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Final Shape:</span>
                    <span className="summary-value">{summary.final_shape?.[0]} × {summary.final_shape?.[1]}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">File Size:</span>
                    <span className="summary-value">{summary.file_size_mb} MB</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Saved At:</span>
                    <span className="summary-value">{summary.timestamp}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'final-preview') {
    return (
      <div className="finalize-container">
        <div className="section-header">
          <h3>👁️ Final Preview</h3>
          <p>Review your cleaned and processed dataset before finalizing</p>
        </div>

        {error && (
          <div className="error-message">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {!loading && !error && !summary && (
          <div className="info-message" style={{ 
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', 
            border: '1px solid #38bdf8', 
            borderRadius: '12px', 
            padding: '2rem', 
            textAlign: 'center',
            color: '#0c4a6e'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ margin: '0 0 1rem 0' }}>Ready for Preview</h3>
            <p style={{ margin: '0', opacity: 0.8 }}>
              Upload and process your data to see the final preview here.
            </p>
          </div>
        )}

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading final preview...</p>
          </div>
        )}

        {summary && !loading && (
          <div className="preview-section">
            {/* Summary Stats */}
            <div className="card">
              <div className="card-header">
                <span className="card-icon">📊</span>
                <h2 className="card-title">Dataset Summary</h2>
              </div>

              <div className="summary-stats">
                <div className="stat-card">
                  <div className="stat-icon">📄</div>
                  <div className="stat-content">
                    <h4>Filename</h4>
                    <span className="stat-value">{summary.filename}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📏</div>
                  <div className="stat-content">
                    <h4>Shape</h4>
                    <span className="stat-value">{summary.shape[0]} × {summary.shape[1]}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🔢</div>
                  <div className="stat-content">
                    <h4>Numeric Columns</h4>
                    <span className="stat-value">{summary.data_types.numeric}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <h4>Text Columns</h4>
                    <span className="stat-value">{summary.data_types.categorical}</span>
                  </div>
                </div>

                {summary.data_types.date > 0 && (
                  <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                      <h4>Date Columns</h4>
                      <span className="stat-value">{summary.data_types.date}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="card">
              <div className="card-header">
                <span className="card-icon">⭐</span>
                <h2 className="card-title">Data Quality Metrics</h2>
              </div>

              <div className="quality-metrics">
                <div className="metric-item">
                  <div className="metric-circle" style={{ 
                    background: `conic-gradient(#4ade80 ${summary.quality_metrics.completeness_percentage * 3.6}deg, #e5e7eb 0deg)` 
                  }}>
                    <span className="metric-percentage">{summary.quality_metrics.completeness_percentage}%</span>
                  </div>
                  <div className="metric-info">
                    <h4>Data Completeness</h4>
                    <p>{summary.quality_metrics.total_cells - summary.quality_metrics.missing_cells} of {summary.quality_metrics.total_cells} cells filled</p>
                  </div>
                </div>

                <div className="metric-details">
                  <div className="detail-item">
                    <span className="detail-label">Memory Usage:</span>
                    <span className="detail-value">{summary.memory_usage_mb} MB</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Missing Values:</span>
                    <span className="detail-value">
                      {Object.keys(summary.missing_values).length > 0 
                        ? `${Object.keys(summary.missing_values).length} columns affected`
                        : 'No missing values'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Preview */}
            <div className="card">
              <div className="card-header">
                <span className="card-icon">👁️</span>
                <h2 className="card-title">Data Preview (First 10 Rows)</h2>
              </div>

              {previewData && previewData.length > 0 && (
                <div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '6px',
                    margin: '1rem 0',
                    fontSize: '0.875rem',
                    color: '#0c4a6e'
                  }}>
                    💡 <strong>Tip:</strong> The table is horizontally scrollable. Row numbers are sticky for easy navigation. Hover over cells to see full content.
                  </div>
                  <div className="table-container" style={{
                  overflowX: 'auto',
                  maxWidth: '100%',
                  marginTop: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <table className="data-table" style={{
                    width: '100%',
                    minWidth: 'max-content',
                    borderCollapse: 'collapse',
                    fontSize: '0.875rem'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151',
                          borderBottom: '2px solid #d1d5db',
                          position: 'sticky',
                          left: 0,
                          backgroundColor: '#f3f4f6',
                          zIndex: 10,
                          minWidth: '50px',
                          maxWidth: '50px'
                        }}>#</th>
                        {summary.columns.map((col, index) => (
                          <th key={index} style={{
                            padding: '0.75rem 0.5rem',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#374151',
                            borderBottom: '2px solid #d1d5db',
                            minWidth: '120px',
                            maxWidth: '200px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }} title={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, rowIndex) => (
                        <tr key={rowIndex} style={{
                          backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb'
                        }}>
                          <td style={{
                            padding: '0.75rem 0.5rem',
                            borderBottom: '1px solid #e5e7eb',
                            fontWeight: '500',
                            color: '#6b7280',
                            position: 'sticky',
                            left: 0,
                            backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                            zIndex: 5,
                            textAlign: 'center',
                            minWidth: '50px',
                            maxWidth: '50px'
                          }} className="row-number">{rowIndex + 1}</td>
                          {summary.columns.map((col, colIndex) => (
                            <td key={colIndex} style={{
                              padding: '0.75rem 0.5rem',
                              borderBottom: '1px solid #e5e7eb',
                              color: '#374151',
                              minWidth: '120px',
                              maxWidth: '200px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }} title={row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}>
                              {row[col] !== null && row[col] !== undefined 
                                ? String(row[col]) 
                                : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              )}
            </div>

            {/* Column Details */}
            <div className="card">
              <div className="card-header">
                <span className="card-icon">📋</span>
                <h2 className="card-title">Column Details</h2>
              </div>

              <div className="column-details">
                <div className="column-group">
                  <h4>🔢 Numeric Columns ({summary.data_types.numeric})</h4>
                  <div className="column-list">
                    {summary.column_details.numeric_columns.map((col, index) => (
                      <span key={index} className="column-tag numeric">{col}</span>
                    ))}
                    {summary.column_details.numeric_columns.length === 0 && (
                      <span className="no-columns">No numeric columns</span>
                    )}
                  </div>
                </div>

                <div className="column-group">
                  <h4>📝 Text Columns ({summary.data_types.categorical})</h4>
                  <div className="column-list">
                    {summary.column_details.categorical_columns.map((col, index) => (
                      <span key={index} className="column-tag categorical">{col}</span>
                    ))}
                    {summary.column_details.categorical_columns.length === 0 && (
                      <span className="no-columns">No text columns</span>
                    )}
                  </div>
                </div>

                {summary.data_types.date > 0 && (
                  <div className="column-group">
                    <h4>📅 Date Columns ({summary.data_types.date})</h4>
                    <div className="column-list">
                      {summary.column_details.date_columns?.map((col, index) => (
                        <span key={index} className="column-tag date">{col}</span>
                      )) || []}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'report') {
    return (
      <div className="finalize-container">
        <div className="section-header">
          <h3>📄 Cleaning Report</h3>
          <p>Comprehensive summary of all cleaning operations and data insights</p>
        </div>

        {error && (
          <div className="error-message">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Generating cleaning report...</p>
          </div>
        )}

        {report && !loading && (
          <div className="report-section">
            {/* Report Header */}
            <div className="card">
              <div className="card-header">
                <span className="card-icon">📊</span>
                <h2 className="card-title">Dataset Summary</h2>
              </div>

              <div className="report-summary">
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">File:</span>
                    <span className="summary-value">{report.dataset_info.filename}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Shape:</span>
                    <span className="summary-value">{report.dataset_info.shape[0]} × {report.dataset_info.shape[1]}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Generated:</span>
                    <span className="summary-value">{report.generated_at}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Memory:</span>
                    <span className="summary-value">{report.dataset_info.memory_usage_mb} MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cleaning Operations Summary */}
            <div className="card">
              <div className="card-header">
                <span className="card-icon">🔧</span>
                <h2 className="card-title">Cleaning Operations Performed</h2>
              </div>

              <div className="operations-summary">
                <div className="operations-stats">
                  <div className="stat-card">
                    <div className="stat-icon">🔢</div>
                    <div className="stat-content">
                      <h4>Total Operations</h4>
                      <span className="stat-value">{report.cleaning_summary.total_operations}</span>
                    </div>
                  </div>

                  {Object.entries(report.cleaning_summary.operations_by_type).map(([type, count]) => (
                    <div key={type} className="stat-card">
                      <div className="stat-icon">⚙️</div>
                      <div className="stat-content">
                        <h4>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                        <span className="stat-value">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {report.cleaning_summary.detailed_operations.length > 0 && (
                  <div className="operations-timeline">
                    <h4>📋 Operation Timeline</h4>
                    <div className="timeline-list">
                      {report.cleaning_summary.detailed_operations.map((operation, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-marker"></div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="operation-type">{operation.type.replace('_', ' ')}</span>
                              <span className="operation-time">{operation.timestamp}</span>
                            </div>
                            <div className="operation-description">{operation.description}</div>
                            {operation.details && Object.keys(operation.details).length > 0 && (
                              <div className="operation-details">
                                {Object.entries(operation.details).map(([key, value]) => {
                                  const renderValue = (val) => {
                                    if (Array.isArray(val)) {
                                      return `${val.length} items`;
                                    } else if (typeof val === 'object' && val !== null) {
                                      return JSON.stringify(val);
                                    } else {
                                      return String(val);
                                    }
                                  };
                                  
                                  return (
                                    <span key={key} className="detail-item">
                                      {key}: {renderValue(value)}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Data Quality Metrics */}
            <div className="card">
              <div className="card-header">
                <span className="card-icon">⭐</span>
                <h2 className="card-title">Data Quality Assessment</h2>
              </div>

              <div className="quality-assessment">
                <div className="quality-score">
                  <div className="score-circle" style={{ 
                    background: `conic-gradient(#4ade80 ${report.quality_metrics.completeness_percentage * 3.6}deg, #e5e7eb 0deg)` 
                  }}>
                    <span className="score-percentage">{report.quality_metrics.completeness_percentage}%</span>
                  </div>
                  <div className="score-info">
                    <h4>Overall Quality Score</h4>
                    <p>Based on data completeness</p>
                  </div>
                </div>

                <div className="quality-details">
                  <div className="quality-metric">
                    <span className="metric-label">Total Cells:</span>
                    <span className="metric-value">{report.quality_metrics.total_cells.toLocaleString()}</span>
                  </div>
                  <div className="quality-metric">
                    <span className="metric-label">Missing Cells:</span>
                    <span className="metric-value">{report.quality_metrics.missing_cells.toLocaleString()}</span>
                  </div>
                  <div className="quality-metric">
                    <span className="metric-label">Columns with Missing Data:</span>
                    <span className="metric-value">{Object.keys(report.quality_metrics.missing_values_by_column).length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights and Recommendations */}
            <div className="card">
              <div className="card-header">
                <span className="card-icon">💡</span>
                <h2 className="card-title">Insights & Recommendations</h2>
              </div>

              <div className="insights-section">
                {report.insights.map((insight, index) => (
                  <div key={index} className={`insight-card ${insight.type}`}>
                    <div className="insight-header">
                      <span className="insight-icon">
                        {insight.type === 'success' ? '✅' : 
                         insight.type === 'warning' ? '⚠️' : 
                         insight.type === 'error' ? '❌' : 'ℹ️'}
                      </span>
                      <h4>{insight.title}</h4>
                    </div>
                    <p className="insight-description">{insight.description}</p>
                    <div className="insight-recommendation">
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card">
              <div className="action-buttons">
                <button
                  onClick={loadReport}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  🔄 Refresh Report
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-primary"
                >
                  🖨️ Print Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'download') {
    return (
      <div className="finalize-container">
        <div className="section-header">
          <h3>⬇️ Download Cleaned CSV</h3>
          <p>Export your cleaned and processed dataset as a CSV file</p>
        </div>

        {error && (
          <div className="error-message">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <strong>✅ Success:</strong> {success}
          </div>
        )}

        <div className="download-section">
          <div className="card">
            <div className="card-header">
              <span className="card-icon">⬇️</span>
              <h2 className="card-title">Export Cleaned Dataset</h2>
            </div>

            <div className="download-content">
              <div className="download-info">
                <h4>📄 Ready for Download</h4>
                <p>Your cleaned dataset is ready to be exported as a CSV file. The file will contain all the cleaning operations you've performed.</p>
                
                <div className="file-info">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Original File:</span>
                      <span className="info-value">{fileInfo?.filename || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Export Format:</span>
                      <span className="info-value">CSV (Comma Separated Values)</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estimated Size:</span>
                      <span className="info-value">
                        {fileInfo?.shape ? `~${Math.ceil(fileInfo.shape[0] * fileInfo.shape[1] * 10 / 1024)} KB` : 'Calculating...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="download-actions">
                <button
                  onClick={handleDownloadCSV}
                  disabled={loading}
                  className="btn btn-primary download-button"
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Preparing Download...
                    </>
                  ) : (
                    <>
                      ⬇️ Download Cleaned CSV
                    </>
                  )}
                </button>
              </div>

              <div className="download-notes">
                <h4>📋 Download Notes</h4>
                <ul>
                  <li>The file will be saved to your default downloads folder</li>
                  <li>Filename format: [original_name]_cleaned.csv</li>
                  <li>All data cleaning operations are preserved</li>
                  <li>Ready for immediate use in Excel, Python, R, or other tools</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Finalize;
