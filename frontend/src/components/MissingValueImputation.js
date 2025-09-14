import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MissingValueImputation = ({ fileInfo, onDataUpdate }) => {
  const [columns, setColumns] = useState([]);
  const [missingValueColumns, setMissingValueColumns] = useState([]);
  const [imputationRules, setImputationRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dataInfo, setDataInfo] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'original', direction: 'asc' });

  useEffect(() => {
    if (fileInfo?.columns) {
      setColumns(fileInfo.columns);
      loadMissingValueInfo();
    }
  }, [fileInfo]);

  const loadMissingValueInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/info');
      setDataInfo(response.data);
      
      // Extract columns with missing values
      const missingCols = Object.keys(response.data.missing_values || {});
      setMissingValueColumns(missingCols);
    } catch (err) {
      console.error('Error loading missing value info:', err);
    }
  };

  const addImputationRule = () => {
    setImputationRules([...imputationRules, { 
      id: Date.now(), 
      column: '', 
      method: '', 
      customValue: '' 
    }]);
  };

  const removeImputationRule = (id) => {
    setImputationRules(imputationRules.filter(rule => rule.id !== id));
  };

  const updateImputationRule = (id, field, value) => {
    setImputationRules(imputationRules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const getAvailableColumns = (currentId) => {
    const selectedColumns = imputationRules
      .filter(rule => rule.id !== currentId)
      .map(rule => rule.column)
      .filter(col => col !== '');
    
    return missingValueColumns.filter(col => !selectedColumns.includes(col));
  };

  const getImputationMethods = (column) => {
    if (!column || !dataInfo) return [];
    
    const isNumeric = dataInfo.numeric_columns?.includes(column);
    
    if (isNumeric) {
      return [
        { value: 'mean', label: '📊 Mean (Average)' },
        { value: 'median', label: '📈 Median (Middle value)' },
        { value: 'mode', label: '📋 Mode (Most frequent)' },
        { value: 'forward_fill', label: '⬆️ Forward Fill' },
        { value: 'backward_fill', label: '⬇️ Backward Fill' },
        { value: 'custom', label: '✏️ Custom Value' }
      ];
    } else {
      return [
        { value: 'mode', label: '📋 Mode (Most frequent)' },
        { value: 'forward_fill', label: '⬆️ Forward Fill' },
        { value: 'backward_fill', label: '⬇️ Backward Fill' },
        { value: 'custom', label: '✏️ Custom Value' }
      ];
    }
  };

  const applyImputation = async () => {
    const validRules = imputationRules.filter(rule => 
      rule.column && rule.method && 
      (rule.method !== 'custom' || rule.customValue !== '')
    );

    if (validRules.length === 0) {
      setError('Please add at least one complete imputation rule');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const response = await axios.post('http://localhost:5000/api/impute-missing', {
        rules: validRules
      });
      
      setSuccess(true);
      setImputationRules([]);
      
      // Update the parent component with new file info
      if (onDataUpdate) {
        onDataUpdate(response.data);
      }
      
      // Reload missing value info
      await loadMissingValueInfo();
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error applying imputation');
    } finally {
      setLoading(false);
    }
  };

  const resetRules = () => {
    setImputationRules([]);
    setError(null);
    setSuccess(false);
  };

  const getMissingValueSummary = () => {
    if (!dataInfo?.missing_values) return null;
    
    const summary = Object.entries(dataInfo.missing_values).map(([column, count], index) => ({
      column,
      count,
      percentage: ((count / dataInfo.shape[0]) * 100).toFixed(1),
      originalIndex: index // Keep track of original CSV order
    }));

    // Sort based on current sort configuration
    const sortedSummary = [...summary].sort((a, b) => {
      if (sortConfig.key === 'original') {
        return sortConfig.direction === 'asc' ? a.originalIndex - b.originalIndex : b.originalIndex - a.originalIndex;
      } else if (sortConfig.key === 'column') {
        const comparison = a.column.localeCompare(b.column);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      } else if (sortConfig.key === 'count') {
        const comparison = a.count - b.count;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      } else if (sortConfig.key === 'percentage') {
        const comparison = parseFloat(a.percentage) - parseFloat(b.percentage);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    return sortedSummary;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return ' ↕️'; // Unsorted
    }
    return sortConfig.direction === 'asc' ? ' ⬆️' : ' ⬇️';
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">🔧</span>
        <h2 className="card-title">Missing Value Imputation</h2>
      </div>

      <div className="info-box" style={{ marginBottom: '2rem' }}>
        <h4 style={{ color: '#2c5282', marginBottom: '0.5rem' }}>🔧 Data Imputation</h4>
        <p style={{ color: '#2c5282', margin: 0 }}>
          Fill missing values in your dataset using various imputation methods. 
          Choose appropriate methods based on your data type and analysis requirements.
        </p>
      </div>

      {/* Missing Values Summary */}
      {getMissingValueSummary() && getMissingValueSummary().length > 0 ? (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem' 
          }}>
            <h3 style={{ color: '#2d3748', margin: 0 }}>
              ⚠️ Columns with Missing Values
            </h3>
            <button
              onClick={() => handleSort('original')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: sortConfig.key === 'original' ? '#4299e1' : '#e2e8f0',
                color: sortConfig.key === 'original' ? 'white' : '#2d3748',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}
              title="Restore original CSV column order"
            >
              📋 Original Order
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('column')}
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      backgroundColor: sortConfig.key === 'column' ? '#e2e8f0' : 'transparent'
                    }}
                    title="Click to sort by column name"
                  >
                    Column Name{getSortIcon('column')}
                  </th>
                  <th 
                    onClick={() => handleSort('count')}
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      backgroundColor: sortConfig.key === 'count' ? '#e2e8f0' : 'transparent'
                    }}
                    title="Click to sort by missing count"
                  >
                    Missing Count{getSortIcon('count')}
                  </th>
                  <th 
                    onClick={() => handleSort('percentage')}
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      backgroundColor: sortConfig.key === 'percentage' ? '#e2e8f0' : 'transparent'
                    }}
                    title="Click to sort by percentage"
                  >
                    Percentage{getSortIcon('percentage')}
                  </th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {getMissingValueSummary().map((item) => {
                  const severity = parseFloat(item.percentage) > 50 ? 'high' : 
                                  parseFloat(item.percentage) > 20 ? 'medium' : 'low';
                  const colors = {
                    high: '#e53e3e',
                    medium: '#d69e2e',
                    low: '#38a169'
                  };
                  
                  return (
                    <tr key={item.column}>
                      <td style={{ fontWeight: '600' }}>{item.column}</td>
                      <td>{item.count.toLocaleString()}</td>
                      <td>{item.percentage}%</td>
                      <td>
                        <span style={{ 
                          color: colors[severity], 
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          fontSize: '0.8rem'
                        }}>
                          {severity === 'high' ? '🔴 Critical' : 
                           severity === 'medium' ? '🟡 Moderate' : '🟢 Minor'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="success" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>✅</span>
            <div>
              <strong>Great!</strong> No missing values found in your dataset.
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
                Your data is ready for analysis without imputation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Imputation Rule Button */}
      {missingValueColumns.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <button
            className="btn btn-primary"
            onClick={addImputationRule}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span style={{ fontSize: '1.2rem' }}>➕</span>
            Add Imputation Rule
          </button>
        </div>
      )}

      {/* Imputation Rules */}
      {imputationRules.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
            📋 Imputation Rules ({imputationRules.filter(rule => rule.column && rule.method).length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {imputationRules.map((rule, index) => (
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
                    Imputation Rule
                  </h4>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => removeImputationRule(rule.id)}
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
                      onChange={(e) => updateImputationRule(rule.id, 'column', e.target.value)}
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
                      Imputation Method:
                    </label>
                    <select
                      className="form-select"
                      value={rule.method}
                      onChange={(e) => updateImputationRule(rule.id, 'method', e.target.value)}
                      disabled={!rule.column}
                      style={{ width: '100%' }}
                    >
                      <option value="">Select method...</option>
                      {getImputationMethods(rule.column).map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Value Input */}
                  {rule.method === 'custom' && (
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontWeight: '600', 
                        color: '#4a5568' 
                      }}>
                        Custom Value:
                      </label>
                      <input
                        type="text"
                        className="form-select"
                        value={rule.customValue}
                        onChange={(e) => updateImputationRule(rule.id, 'customValue', e.target.value)}
                        placeholder="Enter custom value..."
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </div>

                {/* Rule Summary */}
                {rule.column && rule.method && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#e6fffa',
                    borderRadius: '8px',
                    border: '1px solid #81e6d9'
                  }}>
                    <strong style={{ color: '#234e52' }}>Rule Summary:</strong>
                    <span style={{ color: '#234e52' }}>
                      {' '}Fill missing values in <strong>{rule.column}</strong> using{' '}
                      <strong>
                        {rule.method === 'custom' ? `custom value: "${rule.customValue}"` : 
                         getImputationMethods(rule.column).find(m => m.value === rule.method)?.label.replace(/^[^\s]+ /, '')}
                      </strong>
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
              onClick={applyImputation}
              disabled={loading || imputationRules.filter(rule => rule.column && rule.method).length === 0}
              style={{ 
                background: 'linear-gradient(135deg, #48bb78, #38a169)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                  Applying...
                </>
              ) : (
                <>
                  <span>🔧</span>
                  Apply Imputation ({imputationRules.filter(rule => rule.column && rule.method).length} rules)
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

      {/* Method Guide */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea, #764ba2)', 
        color: 'white', 
        padding: '1.5rem', 
        borderRadius: '15px',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>📚 Imputation Methods Guide</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <strong>📊 Mean:</strong> Replace with average value (numeric only)
          </div>
          <div>
            <strong>📈 Median:</strong> Replace with middle value (numeric only)
          </div>
          <div>
            <strong>📋 Mode:</strong> Replace with most frequent value
          </div>
          <div>
            <strong>⬆️ Forward Fill:</strong> Use previous non-null value
          </div>
          <div>
            <strong>⬇️ Backward Fill:</strong> Use next non-null value
          </div>
          <div>
            <strong>✏️ Custom:</strong> Replace with your specified value
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
          <strong>Success!</strong> Missing value imputation has been applied to your dataset.
        </div>
      )}

      {imputationRules.length === 0 && missingValueColumns.length > 0 && (
        <div className="info-box" style={{ marginTop: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
            <h3 style={{ color: '#2c5282', marginBottom: '1rem' }}>No Imputation Rules Defined</h3>
            <p style={{ color: '#2c5282' }}>
              Click "Add Imputation Rule" to start defining how to handle missing values in your dataset.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissingValueImputation;
