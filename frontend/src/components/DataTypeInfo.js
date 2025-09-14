import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataTypeInfo = ({ fileInfo }) => {
  const [dataInfo, setDataInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('column');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadDataInfo();
  }, [fileInfo]);

  const loadDataInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/info');
      setDataInfo(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading data types');
    } finally {
      setLoading(false);
    }
  };

  const getTypeCategory = (dtype) => {
    if (dtype.includes('int') || dtype.includes('float')) return 'numeric';
    if (dtype.includes('object') || dtype.includes('string')) return 'text';
    if (dtype.includes('datetime') || dtype.includes('date')) return 'datetime';
    if (dtype.includes('bool')) return 'boolean';
    return 'other';
  };

  const getTypeIcon = (dtype) => {
    const category = getTypeCategory(dtype);
    const icons = {
      'numeric': '🔢',
      'text': '📝',
      'datetime': '📅',
      'boolean': '✅',
      'other': '❓'
    };
    return icons[category] || '❓';
  };

  const getTypeColor = (dtype) => {
    const category = getTypeCategory(dtype);
    const colors = {
      'numeric': '#48bb78',
      'text': '#4299e1',
      'datetime': '#ed8936',
      'boolean': '#9f7aea',
      'other': '#718096'
    };
    return colors[category] || '#718096';
  };

  const getTypeDescription = (dtype) => {
    const descriptions = {
      'int64': 'Integer numbers (whole numbers)',
      'float64': 'Decimal numbers (floating point)',
      'object': 'Text/String data or mixed types',
      'bool': 'Boolean values (True/False)',
      'datetime64': 'Date and time information',
      'category': 'Categorical data (predefined categories)'
    };
    return descriptions[dtype] || 'Custom or complex data type';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data type information...</p>
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

  if (!dataInfo?.data_types) {
    return (
      <div className="card">
        <div className="error">No data type information available</div>
      </div>
    );
  }

  // Process and filter data
  let columns = Object.entries(dataInfo.data_types).map(([column, dtype]) => ({
    column,
    dtype: String(dtype),
    category: getTypeCategory(String(dtype)),
    icon: getTypeIcon(String(dtype)),
    color: getTypeColor(String(dtype)),
    description: getTypeDescription(String(dtype))
  }));

  // Filter by type
  if (filterType !== 'all') {
    columns = columns.filter(item => item.category === filterType);
  }

  // Sort columns
  if (sortBy === 'column') {
    columns.sort((a, b) => a.column.localeCompare(b.column));
  } else if (sortBy === 'type') {
    columns.sort((a, b) => a.dtype.localeCompare(b.dtype));
  } else if (sortBy === 'category') {
    columns.sort((a, b) => a.category.localeCompare(b.category));
  }

  // Get statistics
  const typeStats = columns.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const totalColumns = Object.keys(dataInfo.data_types).length;

  return (
    <div>
      {/* Overview Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🏷️</span>
          <h2 className="card-title">Data Types Overview</h2>
        </div>

        <div className="grid grid-3">
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea, #764ba2)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Total Columns</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {totalColumns}
            </p>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #48bb78, #38a169)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔢</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Numeric</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {typeStats.numeric || 0}
            </p>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #4299e1, #3182ce)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Text</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {typeStats.text || 0}
            </p>
          </div>
        </div>

        {/* Type Distribution */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>📊 Data Type Distribution</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(typeStats).map(([category, count]) => (
              <div
                key={category}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: getTypeColor(category),
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                <span>{getTypeIcon(category)}</span>
                <span style={{ textTransform: 'capitalize' }}>{category}</span>
                <span>({count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">🔧</span>
          <h2 className="card-title">Filter & Sort Options</h2>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
              Filter by Type:
            </label>
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="numeric">🔢 Numeric</option>
              <option value="text">📝 Text</option>
              <option value="datetime">📅 DateTime</option>
              <option value="boolean">✅ Boolean</option>
              <option value="other">❓ Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
              Sort by:
            </label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="column">Column Name</option>
              <option value="type">Data Type</option>
              <option value="category">Type Category</option>
            </select>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <span style={{ color: '#4a5568', fontWeight: '600' }}>
              Showing {columns.length} of {totalColumns} columns
            </span>
          </div>
        </div>
      </div>

      {/* Data Types Table Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">📋</span>
          <h2 className="card-title">Column Data Types</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>#</th>
                <th style={{ width: '60px' }}>Type</th>
                <th>Column Name</th>
                <th>Data Type</th>
                <th>Category</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((item, index) => (
                <tr key={item.column}>
                  <td style={{ fontWeight: 'bold', color: '#667eea' }}>
                    {index + 1}
                  </td>
                  <td style={{ fontSize: '1.5rem', textAlign: 'center' }}>
                    {item.icon}
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    {item.column}
                  </td>
                  <td>
                    <span
                      style={{
                        background: item.color,
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '15px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}
                    >
                      {item.dtype}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      color: item.color, 
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ color: '#4a5568', fontSize: '0.9rem' }}>
                    {item.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {columns.length === 0 && (
          <div className="info-box" style={{ marginTop: '1rem' }}>
            <p style={{ color: '#2c5282', textAlign: 'center' }}>
              No columns match the selected filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Data Type Guide Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">📚</span>
          <h2 className="card-title">Data Type Guide</h2>
        </div>

        <div className="grid grid-2">
          <div>
            <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>🔢 Numeric Types</h4>
            <ul style={{ color: '#4a5568', lineHeight: '1.6' }}>
              <li><strong>int64:</strong> Whole numbers (e.g., 1, 2, 100)</li>
              <li><strong>float64:</strong> Decimal numbers (e.g., 1.5, 2.7)</li>
              <li>✅ Can be used for mathematical operations</li>
              <li>✅ Suitable for statistical analysis</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>📝 Text Types</h4>
            <ul style={{ color: '#4a5568', lineHeight: '1.6' }}>
              <li><strong>object:</strong> Text strings or mixed data</li>
              <li>❌ Cannot be used for mathematical operations</li>
              <li>✅ Good for categorical analysis</li>
              <li>✅ Can be processed for text analytics</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>📅 DateTime Types</h4>
            <ul style={{ color: '#4a5568', lineHeight: '1.6' }}>
              <li><strong>datetime64:</strong> Date and time information</li>
              <li>✅ Can be used for time series analysis</li>
              <li>✅ Supports date arithmetic</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>✅ Boolean Types</h4>
            <ul style={{ color: '#4a5568', lineHeight: '1.6' }}>
              <li><strong>bool:</strong> True/False values</li>
              <li>✅ Good for binary classification</li>
              <li>✅ Can be converted to numeric (0/1)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTypeInfo;
