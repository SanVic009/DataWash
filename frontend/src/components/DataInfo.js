import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataInfo = ({ fileInfo }) => {
  const [dataInfo, setDataInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDataInfo();
  }, [fileInfo]);

  const loadDataInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/info');
      setDataInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading data info');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data information...</p>
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
    <div>
      {/* Basic Info Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">📊</span>
          <h2 className="card-title">Dataset Information</h2>
        </div>

        <div className="grid grid-3">
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea, #764ba2)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📏</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Dataset Shape</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {dataInfo?.shape[0]} × {dataInfo?.shape[1]}
            </p>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
              Rows × Columns
            </p>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #48bb78, #38a169)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📈</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Numeric Columns</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {dataInfo?.numeric_columns?.length || 0}
            </p>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
              Available for analysis
            </p>
          </div>

          <div style={{ 
            background: Object.keys(dataInfo?.missing_values || {}).length > 0 
              ? 'linear-gradient(135deg, #f56565, #e53e3e)' 
              : 'linear-gradient(135deg, #48bb78, #38a169)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {Object.keys(dataInfo?.missing_values || {}).length > 0 ? '⚠️' : '✅'}
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Missing Values</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {Object.keys(dataInfo?.missing_values || {}).length}
            </p>
            <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
              Columns affected
            </p>
          </div>
        </div>
      </div>

      {/* Missing Values Card */}
      {dataInfo?.missing_values && Object.keys(dataInfo.missing_values).length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-icon">⚠️</span>
            <h2 className="card-title">Missing Values Analysis</h2>
          </div>

          <div className="info-box">
            <p style={{ marginBottom: '1rem', color: '#2c5282' }}>
              The following columns have missing values that may need attention:
            </p>
          </div>

          <div className="table-container" style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '10px'
          }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>Missing Values</th>
                  <th>Percentage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(dataInfo.missing_values).map(([column, count]) => {
                  const percentage = ((count / dataInfo.shape[0]) * 100).toFixed(2);
                  const severity = percentage > 50 ? 'high' : percentage > 20 ? 'medium' : 'low';
                  const colors = {
                    high: '#e53e3e',
                    medium: '#d69e2e',
                    low: '#38a169'
                  };
                  
                  return (
                    <tr key={column}>
                      <td style={{ fontWeight: '600' }}>{column}</td>
                      <td>{count.toLocaleString()}</td>
                      <td>{percentage}%</td>
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
      )}

      {/* Statistics Card */}
      {dataInfo?.numeric_columns?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-icon">📈</span>
            <h2 className="card-title">Statistical Summary</h2>
          </div>

          <div className="info-box">
            <p style={{ color: '#2c5282' }}>
              Statistical summary for numeric columns in your dataset:
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Statistic</th>
                  {dataInfo.numeric_columns.map((col) => (
                    <th key={col} style={{ minWidth: '120px' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map((stat) => (
                  <tr key={stat}>
                    <td style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                      {stat === '25%' ? '1st Quartile' :
                       stat === '50%' ? 'Median' :
                       stat === '75%' ? '3rd Quartile' :
                       stat === 'std' ? 'Std Dev' :
                       stat}
                    </td>
                    {dataInfo.numeric_columns.map((col) => (
                      <td key={col}>
                        {dataInfo.statistics[col] && dataInfo.statistics[col][stat] !== undefined
                          ? typeof dataInfo.statistics[col][stat] === 'number'
                            ? dataInfo.statistics[col][stat].toFixed(2)
                            : dataInfo.statistics[col][stat]
                          : 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Missing Values Message */}
      {(!dataInfo?.missing_values || Object.keys(dataInfo.missing_values).length === 0) && (
        <div className="card">
          <div className="success">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>✅</span>
              <div>
                <strong>Excellent!</strong> Your dataset has no missing values.
                <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8 }}>
                  This is ideal for data analysis and modeling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataInfo;
