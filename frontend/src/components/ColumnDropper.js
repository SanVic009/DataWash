import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ColumnDropper = ({ fileInfo, onDataUpdate }) => {
  const [columns, setColumns] = useState([]);
  const [columnsToDrop, setColumnsToDrop] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (fileInfo?.columns) {
      setColumns(fileInfo.columns);
    }
  }, [fileInfo]);

  const addColumnToDropList = () => {
    setColumnsToDrop([...columnsToDrop, { id: Date.now(), column: '' }]);
  };

  const removeColumnFromDropList = (id) => {
    setColumnsToDrop(columnsToDrop.filter(item => item.id !== id));
  };

  const updateColumnSelection = (id, column) => {
    setColumnsToDrop(columnsToDrop.map(item => 
      item.id === id ? { ...item, column } : item
    ));
  };

  const getAvailableColumns = (currentId) => {
    const selectedColumns = columnsToDrop
      .filter(item => item.id !== currentId)
      .map(item => item.column)
      .filter(col => col !== '');
    
    return columns.filter(col => !selectedColumns.includes(col));
  };

  const dropColumns = async () => {
    const validColumns = columnsToDrop
      .filter(item => item.column !== '')
      .map(item => item.column);

    if (validColumns.length === 0) {
      setError('Please select at least one column to drop');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const response = await axios.post('http://localhost:5000/api/drop-columns', {
        columns: validColumns
      });
      
      setSuccess(true);
      setColumnsToDrop([]);
      
      // Update the parent component with new file info
      if (onDataUpdate) {
        onDataUpdate(response.data);
      }
      
      // Update local columns list
      setColumns(columns.filter(col => !validColumns.includes(col)));
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error dropping columns');
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setColumnsToDrop([]);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">🗑️</span>
        <h2 className="card-title">Drop Columns</h2>
      </div>

      <div className="info-box" style={{ marginBottom: '2rem' }}>
        <h4 style={{ color: '#2c5282', marginBottom: '0.5rem' }}>💡 Column Dropping</h4>
        <p style={{ color: '#2c5282', margin: 0 }}>
          Select columns you want to remove from your dataset. This action will permanently 
          delete the selected columns from your current session.
        </p>
      </div>

      {/* Add Column Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          className="btn btn-primary"
          onClick={addColumnToDropList}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span style={{ fontSize: '1.2rem' }}>➕</span>
          Add Column to Drop List
        </button>
      </div>

      {/* Columns to Drop List */}
      {columnsToDrop.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
            📋 Columns Selected for Dropping ({columnsToDrop.filter(item => item.column).length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {columnsToDrop.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f7fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <span style={{ 
                  minWidth: '30px', 
                  fontWeight: '600', 
                  color: '#667eea' 
                }}>
                  {index + 1}.
                </span>
                
                <select
                  className="form-select"
                  value={item.column}
                  onChange={(e) => updateColumnSelection(item.id, e.target.value)}
                  style={{ flex: 1, minWidth: '200px' }}
                >
                  <option value="">Select column to drop...</option>
                  {getAvailableColumns(item.id).map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>

                <button
                  className="btn btn-secondary"
                  onClick={() => removeColumnFromDropList(item.id)}
                  style={{ 
                    background: '#fed7d7', 
                    color: '#c53030',
                    minWidth: '40px',
                    padding: '0.5rem'
                  }}
                  title="Remove from list"
                >
                  ❌
                </button>
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
              onClick={dropColumns}
              disabled={loading || columnsToDrop.filter(item => item.column).length === 0}
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
                  Dropping...
                </>
              ) : (
                <>
                  <span>🗑️</span>
                  Drop Selected Columns ({columnsToDrop.filter(item => item.column).length})
                </>
              )}
            </button>
            
            <button
              className="btn btn-secondary"
              onClick={resetSelection}
              disabled={loading}
            >
              🔄 Reset Selection
            </button>
          </div>
        </div>
      )}

      {/* Current Dataset Info */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea, #764ba2)', 
        color: 'white', 
        padding: '1.5rem', 
        borderRadius: '15px',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>📊 Current Dataset</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <strong>Total Columns:</strong> {columns.length}
          </div>
          <div>
            <strong>Columns to Drop:</strong> {columnsToDrop.filter(item => item.column).length}
          </div>
          <div>
            <strong>Remaining Columns:</strong> {columns.length - columnsToDrop.filter(item => item.column).length}
          </div>
        </div>
      </div>

      {/* Available Columns */}
      <div>
        <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
          📋 Available Columns ({columns.length})
        </h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.5rem',
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '1rem',
          background: '#f7fafc',
          borderRadius: '10px'
        }}>
          {columns.map((col) => {
            const isSelected = columnsToDrop.some(item => item.column === col);
            return (
              <span
                key={col}
                style={{
                  padding: '0.5rem 1rem',
                  background: isSelected ? '#fed7d7' : '#e2e8f0',
                  color: isSelected ? '#c53030' : '#4a5568',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  border: isSelected ? '2px solid #c53030' : '1px solid #cbd5e0'
                }}
              >
                {col} {isSelected && '🗑️'}
              </span>
            );
          })}
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
          <strong>Success!</strong> Selected columns have been dropped from the dataset.
        </div>
      )}

      {columnsToDrop.length === 0 && (
        <div className="info-box" style={{ marginTop: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>➕</div>
            <h3 style={{ color: '#2c5282', marginBottom: '1rem' }}>No Columns Selected</h3>
            <p style={{ color: '#2c5282' }}>
              Click "Add Column to Drop List" to start selecting columns you want to remove from your dataset.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnDropper;
