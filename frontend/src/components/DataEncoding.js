import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataEncoding = ({ filename, onDataUpdate }) => {
  const [encodingData, setEncodingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOperations, setSelectedOperations] = useState([]);

  useEffect(() => {
    if (filename) {
      analyzeEncodingOptions();
    }
  }, [filename]);

  const analyzeEncodingOptions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5001/api/analyze-encoding');
      setEncodingData(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Error analyzing encoding options');
      console.error('Error analyzing encoding:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOperation = () => {
    setSelectedOperations([...selectedOperations, {
      id: Date.now(),
      column: '',
      method: '',
      direction: 'encode'
    }]);
  };

  const updateOperation = (id, field, value) => {
    setSelectedOperations(prev => 
      prev.map(op => op.id === id ? { ...op, [field]: value } : op)
    );
  };

  const removeOperation = (id) => {
    setSelectedOperations(prev => prev.filter(op => op.id !== id));
  };

  const applyEncoding = async () => {
    if (selectedOperations.length === 0) {
      setError('Please add at least one encoding operation');
      return;
    }

    const validOperations = selectedOperations.filter(op => op.column && op.method);
    if (validOperations.length === 0) {
      setError('Please complete all operation fields');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5001/api/apply-encoding', {
        operations: validOperations
      });

      setSuccess(response.data.message);
      
      // Notify parent component of data update
      if (onDataUpdate) {
        onDataUpdate(response.data);
      }

      // Refresh analysis
      setTimeout(() => analyzeEncodingOptions(), 1000);
      setSelectedOperations([]);

    } catch (error) {
      setError(error.response?.data?.error || 'Error applying encoding');
      console.error('Error applying encoding:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getEncodingMethods = (columnType) => {
    const methods = {
      categorical: [
        { value: 'label', label: 'Label Encoding (0, 1, 2...)' },
        { value: 'onehot', label: 'One-Hot Encoding (Binary columns)' },
        { value: 'ordinal', label: 'Ordinal Encoding (Custom order)' },
        { value: 'binary', label: 'Binary Encoding (Binary representation)' },
        { value: 'target', label: 'Target Encoding (Mean target value)' }
      ],
      text: [
        { value: 'tfidf', label: 'TF-IDF Vectorization' },
        { value: 'countvec', label: 'Count Vectorization' },
        { value: 'hash', label: 'Hash Encoding' }
      ],
      datetime: [
        { value: 'datetime_features', label: 'Extract Date Features' },
        { value: 'timestamp', label: 'Unix Timestamp' },
        { value: 'ordinal_date', label: 'Ordinal Date' }
      ]
    };
    return methods[columnType] || [];
  };

  const getMethodDescription = (method) => {
    const descriptions = {
      'label': 'Assigns integer labels to categories (0, 1, 2...)',
      'onehot': 'Creates binary columns for each category',
      'ordinal': 'Maps categories to ordered integers based on ranking',
      'binary': 'Converts categories to binary representation',
      'target': 'Replaces categories with target variable mean',
      'tfidf': 'Term Frequency-Inverse Document Frequency vectorization',
      'countvec': 'Counts occurrences of words/terms',
      'hash': 'Uses hash function to encode text features',
      'datetime_features': 'Extracts year, month, day, weekday features',
      'timestamp': 'Converts to Unix timestamp',
      'ordinal_date': 'Converts to ordinal date representation'
    };
    return descriptions[method] || '';
  };

  if (!filename) {
    return (
      <div className="encoding-container">
        <div className="no-data-message">
          <h3>🔤 Data Encoding & Decoding</h3>
          <p>Please upload a dataset first to analyze encoding options.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="encoding-container">
      <div className="section-header">
        <h3>🔤 Data Encoding & Decoding</h3>
        <p>Transform categorical, text, and datetime features into machine learning ready formats</p>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing encoding options...</p>
        </div>
      )}

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

      {encodingData && !loading && (
        <div className="encoding-analysis">
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h4>Categorical Columns</h4>
                <span className="stat-value">{encodingData.categorical_columns.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h4>Text Columns</h4>
                <span className="stat-value">{encodingData.text_columns.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h4>DateTime Columns</h4>
                <span className="stat-value">{encodingData.datetime_columns.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔢</div>
              <div className="stat-content">
                <h4>Numeric Columns</h4>
                <span className="stat-value">{encodingData.numeric_columns.length}</span>
              </div>
            </div>
          </div>

          <div className="column-details">
            <h4>📋 Available Columns for Encoding</h4>
            
            {encodingData.categorical_columns.length > 0 && (
              <div className="column-group">
                <h5>🏷️ Categorical Columns</h5>
                <div className="columns-grid">
                  {encodingData.categorical_columns.map((col, index) => (
                    <div key={index} className="column-card categorical">
                      <h6>{col.column}</h6>
                      <div className="column-info">
                        <span>Unique values: {col.unique_count}</span>
                        <span>Most frequent: "{col.most_frequent}" ({col.frequency}x)</span>
                      </div>
                      <div className="sample-values">
                        Sample: {col.sample_values.slice(0, 3).join(', ')}
                        {col.sample_values.length > 3 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {encodingData.text_columns.length > 0 && (
              <div className="column-group">
                <h5>📝 Text Columns</h5>
                <div className="columns-grid">
                  {encodingData.text_columns.map((col, index) => (
                    <div key={index} className="column-card text">
                      <h6>{col.column}</h6>
                      <div className="column-info">
                        <span>Avg length: {col.avg_length.toFixed(1)} chars</span>
                        <span>Max length: {col.max_length} chars</span>
                      </div>
                      <div className="sample-values">
                        Sample: "{col.sample_values[0]?.substring(0, 30)}..."
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {encodingData.datetime_columns.length > 0 && (
              <div className="column-group">
                <h5>📅 DateTime Columns</h5>
                <div className="columns-grid">
                  {encodingData.datetime_columns.map((col, index) => (
                    <div key={index} className="column-card datetime">
                      <h6>{col.column}</h6>
                      <div className="column-info">
                        <span>Format detected: {col.format}</span>
                        <span>Range: {col.date_range}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {encodingData.categorical_columns.length === 0 && 
             encodingData.text_columns.length === 0 && 
             encodingData.datetime_columns.length === 0 && (
              <div className="no-encodable-columns">
                <div className="info-icon">ℹ️</div>
                <h4>No Encodable Columns Found</h4>
                <p>This dataset contains only numeric columns that don't require encoding.</p>
              </div>
            )}
          </div>

          {(encodingData.categorical_columns.length > 0 || 
            encodingData.text_columns.length > 0 || 
            encodingData.datetime_columns.length > 0) && (
            <div className="encoding-operations">
              <div className="operations-header">
                <h4>🔧 Configure Encoding Operations</h4>
                <button
                  onClick={addOperation}
                  className="btn btn-secondary"
                  disabled={processing}
                >
                  ➕ Add Operation
                </button>
              </div>

              {selectedOperations.map((operation) => (
                <div key={operation.id} className="operation-card">
                  <div className="operation-header">
                    <h5>Encoding Operation #{selectedOperations.indexOf(operation) + 1}</h5>
                    <button
                      onClick={() => removeOperation(operation.id)}
                      className="btn btn-remove"
                      disabled={processing}
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="operation-controls">
                    <div className="control-group">
                      <label>Column to Encode:</label>
                      <select
                        value={operation.column}
                        onChange={(e) => updateOperation(operation.id, 'column', e.target.value)}
                        disabled={processing}
                      >
                        <option value="">Select column...</option>
                        {encodingData.categorical_columns.map(col => (
                          <option key={col.column} value={col.column}>
                            📊 {col.column} (Categorical - {col.unique_count} unique)
                          </option>
                        ))}
                        {encodingData.text_columns.map(col => (
                          <option key={col.column} value={col.column}>
                            📝 {col.column} (Text - Avg {col.avg_length.toFixed(0)} chars)
                          </option>
                        ))}
                        {encodingData.datetime_columns.map(col => (
                          <option key={col.column} value={col.column}>
                            📅 {col.column} (DateTime)
                          </option>
                        ))}
                      </select>
                    </div>

                    {operation.column && (
                      <div className="control-group">
                        <label>Encoding Method:</label>
                        <select
                          value={operation.method}
                          onChange={(e) => updateOperation(operation.id, 'method', e.target.value)}
                          disabled={processing}
                        >
                          <option value="">Select method...</option>
                          {(() => {
                            const selectedCol = [...encodingData.categorical_columns, 
                                                ...encodingData.text_columns, 
                                                ...encodingData.datetime_columns]
                                               .find(col => col.column === operation.column);
                            
                            let columnType = 'categorical';
                            if (encodingData.text_columns.find(col => col.column === operation.column)) {
                              columnType = 'text';
                            } else if (encodingData.datetime_columns.find(col => col.column === operation.column)) {
                              columnType = 'datetime';
                            }
                            
                            return getEncodingMethods(columnType).map(method => (
                              <option key={method.value} value={method.value}>
                                {method.label}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    )}
                  </div>

                  {operation.method && (
                    <div className="method-description">
                      <strong>Description:</strong> {getMethodDescription(operation.method)}
                    </div>
                  )}
                </div>
              ))}

              {selectedOperations.length > 0 && (
                <div className="apply-section">
                  <button
                    onClick={applyEncoding}
                    disabled={processing || selectedOperations.filter(op => op.column && op.method).length === 0}
                    className="btn btn-primary"
                  >
                    {processing ? (
                      <>
                        <div className="btn-spinner"></div>
                        Processing Encoding...
                      </>
                    ) : (
                      <>
                        🚀 Apply Encoding Operations ({selectedOperations.filter(op => op.column && op.method).length})
                      </>
                    )}
                  </button>
                  
                  <div className="encoding-warning">
                    ⚠️ <strong>Warning:</strong> Encoding operations will modify your dataset structure. 
                    Some operations may create multiple new columns.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="refresh-section">
        <button
          onClick={analyzeEncodingOptions}
          disabled={loading}
          className="btn btn-outline"
        >
          {loading ? (
            <>
              <div className="btn-spinner"></div>
              Analyzing...
            </>
          ) : (
            <>
              🔄 Refresh Analysis
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .encoding-container {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          color: white;
          margin: 20px 0;
        }

        .section-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .section-header h3 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: bold;
        }

        .section-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 16px;
        }

        .no-data-message {
          text-align: center;
          padding: 40px 20px;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message, .success-message {
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          text-align: center;
        }

        .error-message {
          background: rgba(244, 67, 54, 0.2);
          border: 1px solid rgba(244, 67, 54, 0.5);
        }

        .success-message {
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid rgba(76, 175, 80, 0.5);
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          min-height: 120px;
          display: flex;
          align-items: center;
          gap: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .stat-content h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
        }

        .column-details {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }

        .column-details h4 {
          margin: 0 0 20px 0;
          font-size: 18px;
        }

        .column-group {
          margin-bottom: 25px;
        }

        .column-group h5 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
        }

        .columns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 15px;
        }

        .column-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .column-card.categorical {
          border-left: 4px solid #4CAF50;
        }

        .column-card.text {
          border-left: 4px solid #2196F3;
        }

        .column-card.datetime {
          border-left: 4px solid #FF9800;
        }

        .column-card h6 {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: bold;
        }

        .column-info {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 8px;
        }

        .column-info span {
          display: block;
          margin: 2px 0;
        }

        .sample-values {
          font-size: 11px;
          opacity: 0.7;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 8px;
          border-radius: 4px;
        }

        .no-encodable-columns {
          text-align: center;
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .info-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .encoding-operations {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }

        .operations-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .operations-header h4 {
          margin: 0;
          font-size: 18px;
        }

        .operation-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 15px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .operation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .operation-header h5 {
          margin: 0;
          font-size: 16px;
        }

        .operation-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .control-group label {
          font-size: 14px;
          font-weight: 600;
        }

        .control-group select {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 14px;
        }

        .control-group select option {
          background: #333;
          color: white;
        }

        .method-description {
          margin-top: 15px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 13px;
          opacity: 0.9;
        }

        .apply-section {
          margin-top: 20px;
          text-align: center;
        }

        .encoding-warning {
          margin-top: 15px;
          padding: 15px;
          background: rgba(255, 193, 7, 0.2);
          border: 1px solid rgba(255, 193, 7, 0.4);
          border-radius: 8px;
          font-size: 14px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          justify-content: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
          min-width: 200px;
        }

        .btn-secondary {
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
        }

        .btn-remove {
          background: linear-gradient(135deg, #f44336, #d32f2f);
          color: white;
          padding: 8px 12px;
          min-width: auto;
        }

        .btn-outline {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .btn-outline:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .refresh-section {
          text-align: center;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .summary-stats {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          
          .stat-card {
            min-height: 100px;
            padding: 20px;
          }
          
          .columns-grid {
            grid-template-columns: 1fr;
          }
          
          .operation-controls {
            grid-template-columns: 1fr;
          }
          
          .operations-header {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default DataEncoding;
