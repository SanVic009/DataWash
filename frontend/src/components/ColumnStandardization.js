import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ColumnStandardization = ({ fileInfo, onDataUpdate }) => {
  const [columns, setColumns] = useState([]);
  const [standardizedColumns, setStandardizedColumns] = useState({});
  const [customRules, setCustomRules] = useState({});
  const [previewMode, setPreviewMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dataStandardization, setDataStandardization] = useState({});

  useEffect(() => {
    if (fileInfo?.columns) {
      setColumns(fileInfo.columns);
      generateStandardizedNames(fileInfo.columns);
    }
  }, [fileInfo]);

  const generateStandardizedNames = (columnList) => {
    const standardized = {};
    columnList.forEach(col => {
      // Standard transformation: lowercase, replace spaces/special chars with underscore
      let standardName = col
        .toLowerCase()                          // Convert to lowercase
        .replace(/\s+/g, '_')                  // Replace spaces with underscore
        .replace(/[^a-z0-9_]/g, '_')           // Replace special chars with underscore
        .replace(/_+/g, '_')                   // Replace multiple underscores with single
        .replace(/^_|_$/g, '');                // Remove leading/trailing underscores
      
      // Ensure it starts with a letter or underscore (valid identifier)
      if (standardName && /^[0-9]/.test(standardName)) {
        standardName = 'col_' + standardName;
      }
      
      // Handle empty names
      if (!standardName) {
        standardName = `col_${columnList.indexOf(col)}`;
      }
      
      standardized[col] = standardName;
    });
    
    setStandardizedColumns(standardized);
    setCustomRules({});
  };

  const updateCustomRule = (originalColumn, newName) => {
    setCustomRules({
      ...customRules,
      [originalColumn]: newName
    });
  };

  const resetToStandard = (originalColumn) => {
    const newCustomRules = { ...customRules };
    delete newCustomRules[originalColumn];
    setCustomRules(newCustomRules);
  };

  const resetAllToStandard = () => {
    setCustomRules({});
  };

  const getFinalColumnName = (originalColumn) => {
    return customRules[originalColumn] || standardizedColumns[originalColumn] || originalColumn;
  };

  const validateColumnName = (name) => {
    if (!name || name.trim() === '') return false;
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return false;
    return true;
  };

  const getValidationMessage = (name) => {
    if (!name || name.trim() === '') return 'Column name cannot be empty';
    if (!/^[a-zA-Z_]/.test(name)) return 'Must start with letter or underscore';
    if (!/^[a-zA-Z0-9_]*$/.test(name)) return 'Only letters, numbers, and underscores allowed';
    return '';
  };

  const updateDataStandardization = (column, standardizationType, enabled) => {
    setDataStandardization(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        [standardizationType]: enabled
      }
    }));
  };

  const getDataStandardizationOptions = () => {
    return [
      { key: 'lowercase', label: 'Convert to Lowercase', description: 'Convert all text to lowercase' },
      { key: 'uppercase', label: 'Convert to Uppercase', description: 'Convert all text to uppercase' },
      { key: 'title_case', label: 'Title Case', description: 'Convert to Title Case' },
      { key: 'trim_whitespace', label: 'Trim Whitespace', description: 'Remove leading/trailing spaces' },
      { key: 'remove_special_chars', label: 'Remove Special Characters', description: 'Remove special characters except alphanumeric' },
      { key: 'normalize_spaces', label: 'Normalize Spaces', description: 'Replace multiple spaces with single space' },
      { key: 'z_score', label: 'Z-Score Normalization', description: 'Standardize numeric data using z-score' },
      { key: 'min_max', label: 'Min-Max Scaling', description: 'Scale numeric data to 0-1 range' }
    ];
  };

  const checkDuplicates = () => {
    const finalNames = columns.map(col => getFinalColumnName(col));
    const duplicates = finalNames.filter((name, index) => finalNames.indexOf(name) !== index);
    return [...new Set(duplicates)];
  };

  const applyStandardization = async () => {
    const duplicates = checkDuplicates();
    if (duplicates.length > 0) {
      setError(`Duplicate column names detected: ${duplicates.join(', ')}`);
      return;
    }

    const invalidColumns = columns.filter(col => !validateColumnName(getFinalColumnName(col)));
    if (invalidColumns.length > 0) {
      setError(`Invalid column names: ${invalidColumns.map(col => getFinalColumnName(col)).join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const columnMapping = {};
      columns.forEach(col => {
        const finalName = getFinalColumnName(col);
        if (finalName !== col) {
          columnMapping[col] = finalName;
        }
      });

      if (Object.keys(columnMapping).length === 0) {
        setError('No column names need to be changed');
        return;
      }
      
      const response = await axios.post('http://localhost:5001/api/standardize-columns', {
        column_mapping: columnMapping,
        data_standardization: dataStandardization
      });
      
      setSuccess(true);
      setPreviewMode(true);
      
      // Update the parent component with new file info
      if (onDataUpdate) {
        onDataUpdate(response.data);
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error standardizing column names');
    } finally {
      setLoading(false);
    }
  };

  const getChangesSummary = () => {
    const changes = columns.filter(col => getFinalColumnName(col) !== col);
    return changes;
  };

  const getStandardizationRules = () => {
    return [
      { rule: 'Convert to lowercase', example: 'Customer Name → customer name' },
      { rule: 'Replace spaces with underscores', example: 'customer name → customer_name' },
      { rule: 'Replace special characters', example: 'price($) → price___' },
      { rule: 'Remove multiple underscores', example: 'price___ → price_' },
      { rule: 'Remove leading/trailing underscores', example: '_price_ → price' },
      { rule: 'Add prefix for numeric start', example: '2023_data → col_2023_data' }
    ];
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">🏷️</span>
        <h2 className="card-title">Column Name Standardization</h2>
      </div>

      <div className="info-box" style={{ marginBottom: '2rem' }}>
        <h4 style={{ color: '#2c5282', marginBottom: '0.5rem' }}>🏷️ Column Standardization</h4>
        <p style={{ color: '#2c5282', margin: 0 }}>
          Standardize column names to follow consistent naming conventions. This makes your data 
          more programmer-friendly and prevents issues with spaces and special characters.
        </p>
      </div>

      {/* Standardization Rules */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
          📋 Standardization Rules Applied
        </h3>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea, #764ba2)', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: '15px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
            {getStandardizationRules().map((rule, index) => (
              <div key={index}>
                <strong>{rule.rule}:</strong> {rule.example}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`btn ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPreviewMode(true)}
          >
            👁️ Preview Mode
          </button>
          <button
            className={`btn ${!previewMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPreviewMode(false)}
          >
            ✏️ Edit Mode
          </button>
          
          {!previewMode && (
            <button
              className="btn btn-secondary"
              onClick={resetAllToStandard}
              title="Reset all to automatic standardization"
            >
              🔄 Reset All
            </button>
          )}
        </div>
      </div>

      {/* Changes Summary */}
      {getChangesSummary().length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            background: '#e6fffa', 
            color: '#234e52', 
            padding: '1rem', 
            borderRadius: '10px',
            border: '1px solid #81e6d9'
          }}>
            <strong>📊 Summary:</strong> {getChangesSummary().length} column names will be changed
          </div>
        </div>
      )}

      {/* Column Name Table */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
          📊 Column Name Mapping ({columns.length} columns)
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th>Original Name</th>
                <th>Standardized Name</th>
                {!previewMode && <th>Custom Name</th>}
                <th>Status</th>
                {!previewMode && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {columns.map((col, index) => {
                const finalName = getFinalColumnName(col);
                const isChanged = finalName !== col;
                const isCustom = customRules.hasOwnProperty(col);
                const isValid = validateColumnName(finalName);
                const validationMsg = getValidationMessage(finalName);
                
                return (
                  <tr key={col}>
                    <td style={{ fontWeight: 'bold', color: '#667eea' }}>
                      {index + 1}
                    </td>
                    <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                      {col}
                    </td>
                    <td style={{ 
                      fontFamily: 'monospace',
                      color: isChanged ? (isValid ? '#38a169' : '#e53e3e') : '#4a5568',
                      fontWeight: isChanged ? '600' : 'normal'
                    }}>
                      {finalName}
                    </td>
                    {!previewMode && (
                      <td>
                        <input
                          type="text"
                          value={customRules[col] || ''}
                          onChange={(e) => updateCustomRule(col, e.target.value)}
                          placeholder={standardizedColumns[col]}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: `2px solid ${isValid ? '#e2e8f0' : '#fed7d7'}`,
                            borderRadius: '5px',
                            fontFamily: 'monospace'
                          }}
                        />
                        {!isValid && validationMsg && (
                          <div style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            {validationMsg}
                          </div>
                        )}
                      </td>
                    )}
                    <td>
                      {isChanged ? (
                        <span style={{ 
                          color: isValid ? '#38a169' : '#e53e3e', 
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}>
                          {isValid ? (isCustom ? '✏️ CUSTOM' : '🔄 CHANGED') : '❌ INVALID'}
                        </span>
                      ) : (
                        <span style={{ color: '#718096', fontSize: '0.8rem' }}>
                          ✅ NO CHANGE
                        </span>
                      )}
                    </td>
                    {!previewMode && (
                      <td>
                        {isCustom && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => resetToStandard(col)}
                            style={{ 
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.8rem',
                              background: '#fed7d7',
                              color: '#c53030'
                            }}
                          >
                            🔄 Reset
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Standardization Options */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
          🔧 Data Standardization Options
        </h3>
        
        <div className="info-box" style={{ marginBottom: '1rem' }}>
          <p style={{ color: '#2c5282', margin: 0 }}>
            Apply standardization operations to the actual data values in each column.
          </p>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #f093fb, #f5576c)', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: '15px',
          marginBottom: '1rem'
        }}>
          <h4 style={{ marginBottom: '1rem' }}>Select standardization options for each column:</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {columns.map((column, index) => (
              <div key={column} style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '1rem', 
                borderRadius: '10px' 
              }}>
                <h5 style={{ marginBottom: '0.5rem', fontFamily: 'monospace' }}>{column}</h5>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  {getDataStandardizationOptions().map((option) => (
                    <label key={option.key} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={dataStandardization[column]?.[option.key] || false}
                        onChange={(e) => updateDataStandardization(column, option.key, e.target.checked)}
                        style={{ transform: 'scale(1.1)' }}
                      />
                      <span style={{ fontWeight: '500' }}>{option.label}</span>
                      <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>({option.description})</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {checkDuplicates().length > 0 && (
        <div className="error" style={{ marginBottom: '1rem' }}>
          <strong>⚠️ Duplicate Names:</strong> {checkDuplicates().join(', ')}
        </div>
      )}

      {/* Apply Button */}
      {(getChangesSummary().length > 0 || Object.keys(dataStandardization).some(col => Object.keys(dataStandardization[col] || {}).length > 0)) && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <button
            className="btn btn-primary"
            onClick={applyStandardization}
            disabled={loading || checkDuplicates().length > 0}
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
                Apply Standardization 
                {getChangesSummary().length > 0 && ` (${getChangesSummary().length} name changes)`}
                {Object.keys(dataStandardization).some(col => Object.keys(dataStandardization[col] || {}).length > 0) && 
                  ` & Data Operations`}
              </>
            )}
          </button>
        </div>
      )}

      {/* No Changes Message */}
      {getChangesSummary().length === 0 && !Object.keys(dataStandardization).some(col => Object.keys(dataStandardization[col] || {}).length > 0) && (
        <div className="success" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>✅</span>
            <div>
              <strong>Ready!</strong> Column names are standardized and no data operations selected.
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
                Your column names follow good naming conventions. Select data standardization options above if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="success" style={{ marginTop: '1rem' }}>
          <strong>Success!</strong> Column names have been standardized in your dataset.
        </div>
      )}

      {/* Best Practices */}
      <div style={{ 
        background: '#f7fafc', 
        padding: '1.5rem', 
        borderRadius: '15px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>📚 Column Naming Best Practices</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', fontSize: '0.9rem', color: '#4a5568' }}>
          <div>
            <strong style={{ color: '#38a169' }}>✅ Good:</strong>
            <div>customer_name</div>
            <div>order_date</div>
            <div>total_amount</div>
          </div>
          <div>
            <strong style={{ color: '#e53e3e' }}>❌ Avoid:</strong>
            <div>Customer Name</div>
            <div>Order-Date</div>
            <div>Total Amount ($)</div>
          </div>
          <div>
            <strong style={{ color: '#667eea' }}>💡 Tips:</strong>
            <div>Use lowercase</div>
            <div>No spaces or special chars</div>
            <div>Descriptive names</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnStandardization;
