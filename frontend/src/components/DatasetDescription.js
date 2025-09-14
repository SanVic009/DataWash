import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DatasetDescription = ({ fileInfo }) => {
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [columnStats, setColumnStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fileInfo?.columns) {
      setColumns(fileInfo.columns);
    }
  }, [fileInfo]);

  const analyzeColumn = async (columnName) => {
    if (!columnName) {
      setColumnStats(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('http://localhost:5000/api/column-analysis', {
        column: columnName
      });
      
      setColumnStats(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error analyzing column');
      setColumnStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedColumn) {
      analyzeColumn(selectedColumn);
    }
  }, [selectedColumn]);

  const getDataTypeInfo = (column) => {
    // This would come from your existing data info
    return 'Unknown';
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-icon">📝</span>
        <h2 className="card-title">Dataset Column Description</h2>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: '600', 
          color: '#4a5568' 
        }}>
          Select Column to Analyze:
        </label>
        <select
          className="form-select"
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value)}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <option value="">Choose a column...</option>
          {columns.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Analyzing column...</p>
        </div>
      )}

      {error && (
        <div className="error">{error}</div>
      )}

      {selectedColumn && !loading && (
        <div className="grid grid-2">
          <div>
            <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
              📊 Column Information: {selectedColumn}
            </h3>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea, #764ba2)', 
              color: 'white', 
              padding: '1.5rem', 
              borderRadius: '15px',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Basic Info</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><strong>Column Name:</strong> {selectedColumn}</div>
                <div><strong>Data Type:</strong> {columnStats?.data_type || 'Loading...'}</div>
                <div><strong>Non-null Count:</strong> {columnStats?.non_null_count || 'Loading...'}</div>
                <div><strong>Null Count:</strong> {columnStats?.null_count || 'Loading...'}</div>
              </div>
            </div>

            {columnStats?.is_numeric && (
              <div style={{ 
                background: 'linear-gradient(135deg, #48bb78, #38a169)', 
                color: 'white', 
                padding: '1.5rem', 
                borderRadius: '15px',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>📈 Numeric Statistics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <div><strong>Mean:</strong> {columnStats.mean?.toFixed(2)}</div>
                  <div><strong>Median:</strong> {columnStats.median?.toFixed(2)}</div>
                  <div><strong>Min:</strong> {columnStats.min}</div>
                  <div><strong>Max:</strong> {columnStats.max}</div>
                  <div><strong>Std Dev:</strong> {columnStats.std?.toFixed(2)}</div>
                  <div><strong>Variance:</strong> {columnStats.variance?.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>
              Value Analysis
            </h3>
            
            {columnStats?.top_frequent_values && columnStats.top_frequent_values.length > 0 && (
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea, #764ba2)', 
                color: 'white', 
                padding: '1.5rem', 
                borderRadius: '15px',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: '0 0 1rem 0' }}> Top 10 Most Frequent Values</h4>
                <div style={{ 
                  maxHeight: '250px', 
                  overflowY: 'auto',
                  fontSize: '0.9rem'
                }}>
                  {columnStats.top_frequent_values.map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: index < columnStats.top_frequent_values.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                    }}>
                      <span style={{ fontWeight: '600', flex: 1 }}>{String(item.value)}</span>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ 
                          background: 'rgba(255,255,255,0.2)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          {item.count} times
                        </span>
                        <span style={{ 
                          background: 'rgba(255,255,255,0.3)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {columnStats?.sample_values && (
              <div style={{ 
                background: '#f7fafc', 
                padding: '1rem', 
                borderRadius: '10px'
              }}>
                <h4 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>Sample Values </h4>
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  fontSize: '0.9rem',
                  color: '#4a5568'
                }}>
                  {columnStats.sample_values.map((value, index) => (
                    <div key={index} style={{ 
                      padding: '0.25rem 0',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <strong>{index + 1}:</strong> {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedColumn && (
        <div className="info-box">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ color: '#2c5282', marginBottom: '1rem' }}>Select a Column to Analyze</h3>
            <p style={{ color: '#2c5282' }}>
              Choose a column from the dropdown above to see detailed statistics, 
              sample values, and frequency distribution.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetDescription;
