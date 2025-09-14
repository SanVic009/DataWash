import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OutlierRemoval = ({ fileInfo, onDataUpdate }) => {
  const [columns, setColumns] = useState([]);
  const [numericColumns, setNumericColumns] = useState([]);
  const [outlierRules, setOutlierRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [outlierInfo, setOutlierInfo] = useState(null);

  useEffect(() => {
    if (fileInfo?.columns) {
      setColumns(fileInfo.columns);
      loadDataInfo();
    }
  }, [fileInfo]);

  const loadDataInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/info');
      setNumericColumns(response.data.numeric_columns || []);
    } catch (err) {
      console.error('Error loading data info:', err);
    }
  };

  const addOutlierRule = () => {
    setOutlierRules([...outlierRules, { 
      id: Date.now(), 
      column: '', 
      method: '', 
      threshold: '',
      action: 'remove' // remove or cap
    }]);
  };

  const removeOutlierRule = (id) => {
    setOutlierRules(outlierRules.filter(rule => rule.id !== id));
  };

  const updateOutlierRule = (id, field, value) => {
    setOutlierRules(outlierRules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const getAvailableColumns = (currentId) => {
    const selectedColumns = outlierRules
      .filter(rule => rule.id !== currentId)
      .map(rule => rule.column)
      .filter(col => col !== '');
    
    return numericColumns.filter(col => !selectedColumns.includes(col));
  };

  const getOutlierMethods = () => {
    return [
      { value: 'zscore', label: '📊 Z-Score Method', description: 'Remove values beyond ±N standard deviations' },
      { value: 'iqr', label: '📈 IQR Method', description: 'Remove values beyond Q1-1.5*IQR or Q3+1.5*IQR' },
      { value: 'modified_zscore', label: '📉 Modified Z-Score', description: 'Uses median instead of mean (robust)' },
      { value: 'percentile', label: '📋 Percentile Method', description: 'Remove values beyond specified percentiles' },
      { value: 'isolation_forest', label: '🌲 Isolation Forest', description: 'Machine learning based outlier detection' }
    ];
  };

  const getActionTypes = () => {
    return [
      { value: 'remove', label: '🗑️ Remove Outliers', description: 'Delete rows containing outliers' },
      { value: 'cap', label: '📌 Cap Outliers', description: 'Replace outliers with boundary values' },
      { value: 'transform', label: '🔄 Transform', description: 'Apply log transformation' }
    ];
  };

  const detectOutliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('http://localhost:5000/api/detect-outliers', {
        columns: numericColumns
      });
      
      setOutlierInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error detecting outliers');
    } finally {
      setLoading(false);
    }
  };

  const applyOutlierRemoval = async () => {
    const validRules = outlierRules.filter(rule => 
      rule.column && rule.method && rule.action &&
      (rule.method !== 'zscore' && rule.method !== 'modified_zscore' && rule.method !== 'percentile' || rule.threshold)
    );

    if (validRules.length === 0) {
      setError('Please add at least one complete outlier removal rule');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const response = await axios.post('http://localhost:5000/api/remove-outliers', {
        rules: validRules
      });
      
      setSuccess(true);
      setOutlierRules([]);
      
      // Update the parent component with new file info
      if (onDataUpdate) {
        onDataUpdate(response.data);
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error removing outliers');
    } finally {
      setLoading(false);
    }
  };

  const resetRules = () => {
    setOutlierRules([]);
    setError(null);
    setSuccess(false);
    setOutlierInfo(null);
  };

  const getThresholdPlaceholder = (method) => {
    switch (method) {
      case 'zscore':
      case 'modified_zscore':
        return 'e.g., 3 (standard deviations)';
      case 'percentile':
        return 'e.g., 5,95 (lower,upper percentiles)';
      default:
        return '';
    }
  };

  const shouldShowThreshold = (method) => {
    return ['zscore', 'modified_zscore', 'percentile'].includes(method);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">🎯</span>
        <h2 className="card-title">Outlier Detection & Removal</h2>
      </div>

      <div className="info-box" style={{ marginBottom: '2rem' }}>
        <h4 style={{ color: '#2c5282', marginBottom: '0.5rem' }}>🎯 Outlier Management</h4>
        <p style={{ color: '#2c5282', margin: 0 }}>
          Detect and handle outliers in your numeric columns using various statistical methods. 
          Outliers can significantly impact your analysis and model performance.
        </p>
      </div>

      {/* Quick Outlier Detection */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
          🔍 Quick Outlier Detection
        </h3>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={detectOutliers}
            disabled={loading || numericColumns.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                Detecting...
              </>
            ) : (
              <>
                <span>🔍</span>
                Detect Outliers in All Numeric Columns
              </>
            )}
          </button>
          
          <span style={{ color: '#4a5568', fontWeight: '600' }}>
            {numericColumns.length} numeric columns available
          </span>
        </div>

        {outlierInfo && (
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>📊 Outlier Detection Results</h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Total Values</th>
                    <th>Z-Score Outliers</th>
                    <th>IQR Outliers</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(outlierInfo).map(([column, info]) => {
                    const zOutliers = info.zscore_outliers || 0;
                    const iqrOutliers = info.iqr_outliers || 0;
                    const total = info.total_values || 1;
                    const maxOutliers = Math.max(zOutliers, iqrOutliers);
                    const percentage = ((maxOutliers / total) * 100).toFixed(1);
                    const severity = percentage > 10 ? 'high' : percentage > 5 ? 'medium' : 'low';
                    const colors = {
                      high: '#e53e3e',
                      medium: '#d69e2e',
                      low: '#38a169'
                    };
                    
                    return (
                      <tr key={column}>
                        <td style={{ fontWeight: '600' }}>{column}</td>
                        <td>{total.toLocaleString()}</td>
                        <td>{zOutliers.toLocaleString()}</td>
                        <td>{iqrOutliers.toLocaleString()}</td>
                        <td>
                          <span style={{ 
                            color: colors[severity], 
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            fontSize: '0.8rem'
                          }}>
                            {severity === 'high' ? '🔴 High' : 
                             severity === 'medium' ? '🟡 Medium' : '🟢 Low'}
                            {' '}({percentage}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Check if numeric columns exist */}
      {numericColumns.length === 0 ? (
        <div className="info-box">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ color: '#2c5282', marginBottom: '1rem' }}>No Numeric Columns Found</h3>
            <p style={{ color: '#2c5282' }}>
              Outlier detection requires numeric columns. Please ensure your dataset contains numeric data.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Add Outlier Rule Button */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              className="btn btn-primary"
              onClick={addOutlierRule}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span style={{ fontSize: '1.2rem' }}>➕</span>
              Add Outlier Removal Rule
            </button>
          </div>

          {/* Outlier Rules */}
          {outlierRules.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
                📋 Outlier Removal Rules ({outlierRules.filter(rule => rule.column && rule.method && rule.action).length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {outlierRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    style={{
                      padding: '1.5rem',
                      background: '#f7fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      <h4 style={{ 
                        color: '#2d3748', 
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: '#667eea', fontWeight: '600' }}>#{index + 1}</span>
                        Outlier Rule
                      </h4>
                      
                      <button
                        className="btn btn-secondary"
                        onClick={() => removeOutlierRule(rule.id)}
                        style={{ 
                          background: '#fed7d7', 
                          color: '#c53030',
                          minWidth: '40px',
                          padding: '0.5rem'
                        }}
                        title="Remove rule"
                      >
                        ❌
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                      {/* Column Selection */}
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#4a5568' 
                        }}>
                          Column:
                        </label>
                        <select
                          className="form-select"
                          value={rule.column}
                          onChange={(e) => updateOutlierRule(rule.id, 'column', e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="">Select column...</option>
                          {getAvailableColumns(rule.id).map((col) => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      {/* Method Selection */}
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#4a5568' 
                        }}>
                          Detection Method:
                        </label>
                        <select
                          className="form-select"
                          value={rule.method}
                          onChange={(e) => updateOutlierRule(rule.id, 'method', e.target.value)}
                          disabled={!rule.column}
                          style={{ width: '100%' }}
                        >
                          <option value="">Select method...</option>
                          {getOutlierMethods().map((method) => (
                            <option key={method.value} value={method.value} title={method.description}>
                              {method.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Threshold Input */}
                      {shouldShowThreshold(rule.method) && (
                        <div>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#4a5568' 
                          }}>
                            Threshold:
                          </label>
                          <input
                            type="text"
                            className="form-select"
                            value={rule.threshold}
                            onChange={(e) => updateOutlierRule(rule.id, 'threshold', e.target.value)}
                            placeholder={getThresholdPlaceholder(rule.method)}
                            style={{ width: '100%' }}
                          />
                        </div>
                      )}

                      {/* Action Selection */}
                      <div>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#4a5568' 
                        }}>
                          Action:
                        </label>
                        <select
                          className="form-select"
                          value={rule.action}
                          onChange={(e) => updateOutlierRule(rule.id, 'action', e.target.value)}
                          disabled={!rule.method}
                          style={{ width: '100%' }}
                        >
                          <option value="">Select action...</option>
                          {getActionTypes().map((action) => (
                            <option key={action.value} value={action.value} title={action.description}>
                              {action.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Method Description */}
                    {rule.method && (
                      <div style={{ 
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: '#e6fffa',
                        borderRadius: '8px',
                        border: '1px solid #81e6d9'
                      }}>
                        <strong style={{ color: '#234e52' }}>Method Info:</strong>
                        <span style={{ color: '#234e52' }}>
                          {' '}{getOutlierMethods().find(m => m.value === rule.method)?.description}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <button
                  className="btn btn-primary"
                  onClick={applyOutlierRemoval}
                  disabled={loading || outlierRules.filter(rule => rule.column && rule.method && rule.action).length === 0}
                  style={{ 
                    background: 'linear-gradient(135deg, #e53e3e, #c53030)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>🎯</span>
                      Apply Outlier Rules ({outlierRules.filter(rule => rule.column && rule.method && rule.action).length})
                    </>
                  )}
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={resetRules}
                  disabled={loading}
                >
                  🔄 Reset Rules
                </button>
              </div>
            </div>
          )}

          {/* Methods Guide */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea, #764ba2)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '15px',
            marginBottom: '1rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>📚 Outlier Detection Methods</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <strong>📊 Z-Score:</strong> Values beyond ±N standard deviations from mean
              </div>
              <div>
                <strong>📈 IQR:</strong> Values beyond Q1-1.5×IQR or Q3+1.5×IQR
              </div>
              <div>
                <strong>📉 Modified Z-Score:</strong> Uses median instead of mean (robust)
              </div>
              <div>
                <strong>📋 Percentile:</strong> Values beyond specified percentile thresholds
              </div>
              <div>
                <strong>🌲 Isolation Forest:</strong> ML-based anomaly detection
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="error" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="success" style={{ marginTop: '1rem' }}>
              <strong>Success!</strong> Outlier removal rules have been applied to your dataset.
            </div>
          )}

          {outlierRules.length === 0 && (
            <div className="info-box" style={{ marginTop: '2rem' }}>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                <h3 style={{ color: '#2c5282', marginBottom: '1rem' }}>No Outlier Rules Defined</h3>
                <p style={{ color: '#2c5282' }}>
                  Click "Add Outlier Removal Rule" to start defining how to handle outliers in your dataset.
                  You can also use "Detect Outliers" to see potential outliers first.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OutlierRemoval;
