import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataValidation = ({ filename, onDataUpdate }) => {
  const [validationData, setValidationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [replacementValues, setReplacementValues] = useState({});
  const [selectedActions, setSelectedActions] = useState({});

  useEffect(() => {
    if (filename) {
      analyzeDataIntegrity();
    }
  }, [filename]);

  const analyzeDataIntegrity = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/analyze-data-integrity');
      setValidationData(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Error analyzing data integrity');
      console.error('Error analyzing data integrity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (column, action) => {
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        column: column,
        action: action
      };

      if (action === 'replace') {
        const replacementValue = replacementValues[column];
        if (!replacementValue && replacementValue !== 0) {
          setError('Please specify a replacement value');
          setProcessing(false);
          return;
        }
        payload.replacement_value = replacementValue;
      }

      const response = await axios.post('http://localhost:5000/api/fix-data-integrity', payload);

      setSuccess(response.data.message);
      
      // Notify parent component of data update
      if (onDataUpdate) {
        onDataUpdate(response.data);
      }

      // Refresh analysis
      setTimeout(() => analyzeDataIntegrity(), 1000);
      
      // Clear replacement value
      setReplacementValues(prev => {
        const { [column]: removed, ...rest } = prev;
        return rest;
      });

    } catch (error) {
      setError(error.response?.data?.error || 'Error fixing data integrity');
      console.error('Error fixing data integrity:', error);
    } finally {
      setProcessing(false);
    }
  };

  const updateReplacementValue = (column, value) => {
    setReplacementValues(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const getPatternDescription = (pattern) => {
    const descriptions = {
      'binary': 'Expected binary values (Yes/No, True/False, 1/0)',
      'categorical_outlier': 'Values that don\'t match the common categorical pattern',
      'numeric_in_text': 'Numeric values found in text columns',
      'text_in_numeric': 'Text values found in numeric columns',
      'date_format': 'Inconsistent date formats',
      'case_inconsistency': 'Inconsistent letter casing',
      'whitespace_issues': 'Extra whitespace or formatting issues',
      'special_characters': 'Unexpected special characters',
      'encoding_issues': 'Character encoding problems'
    };
    return descriptions[pattern] || 'Data integrity issue detected';
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#2196f3';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '🔍';
      default: return 'ℹ️';
    }
  };

  if (!filename) {
    return (
      <div className="validation-container">
        <div className="no-data-message">
          <h3>🔍 Data Validation & Integrity</h3>
          <p>Please upload a dataset first to analyze data integrity issues.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="validation-container">
      <div className="section-header">
        <h3>🔍 Data Validation & Integrity Check</h3>
        <p>Detect and fix inconsistent, inappropriate, or corrupted values in your dataset</p>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing data integrity...</p>
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

      {validationData && !loading && (
        <div className="validation-analysis">
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h4>Total Columns</h4>
                <span className="stat-value">{validationData.total_columns}</span>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h4>Issues Found</h4>
                <span className="stat-value">{validationData.total_issues}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔧</div>
              <div className="stat-content">
                <h4>Affected Columns</h4>
                <span className="stat-value">{validationData.columns_with_issues}</span>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h4>Clean Columns</h4>
                <span className="stat-value">{validationData.clean_columns}</span>
              </div>
            </div>
          </div>

          {validationData.issues.length === 0 ? (
            <div className="no-issues">
              <div className="success-icon">✅</div>
              <h4>No Data Integrity Issues Found</h4>
              <p>Your dataset appears to have consistent and appropriate values across all columns!</p>
              <div className="clean-data-stats">
                <span>All {validationData.total_columns} columns passed integrity checks</span>
              </div>
            </div>
          ) : (
            <div className="issues-section">
              <h4>🔧 Data Integrity Issues Detected</h4>
              
              {validationData.issues.map((issue, index) => (
                <div key={index} className="issue-card">
                  <div className="issue-header">
                    <div className="issue-title">
                      <span 
                        className="severity-badge"
                        style={{ backgroundColor: getSeverityColor(issue.severity) }}
                      >
                        {getSeverityIcon(issue.severity)} {issue.severity.toUpperCase()}
                      </span>
                      <h5>Column: {issue.column}</h5>
                    </div>
                    <div className="issue-count">
                      {issue.problematic_values.length} issues
                    </div>
                  </div>

                  <div className="issue-details">
                    <div className="pattern-description">
                      <strong>Issue Type:</strong> {getPatternDescription(issue.pattern)}
                    </div>
                    
                    <div className="expected-pattern">
                      <strong>Expected Pattern:</strong> {issue.expected_pattern}
                    </div>

                    <div className="problematic-values">
                      <strong>Problematic Values:</strong>
                      <div className="values-list">
                        {issue.problematic_values.slice(0, 10).map((value, idx) => (
                          <span key={idx} className="problem-value">
                            "{value.value}" (appears {value.count}x)
                          </span>
                        ))}
                        {issue.problematic_values.length > 10 && (
                          <span className="more-values">
                            ... and {issue.problematic_values.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>

                    {issue.suggestions && issue.suggestions.length > 0 && (
                      <div className="suggestions">
                        <strong>Suggestions:</strong>
                        <ul>
                          {issue.suggestions.map((suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="action-section">
                    <h6>Choose Action:</h6>
                    
                    <div className="action-controls">
                      <div className="replace-option">
                        <div className="replace-input-group">
                          <input
                            type="text"
                            placeholder="Enter replacement value..."
                            value={replacementValues[issue.column] || ''}
                            onChange={(e) => updateReplacementValue(issue.column, e.target.value)}
                            disabled={processing}
                            className="replacement-input"
                          />
                          <button
                            onClick={() => handleAction(issue.column, 'replace')}
                            disabled={processing || !replacementValues[issue.column]}
                            className="btn btn-primary"
                          >
                            {processing ? (
                              <div className="btn-spinner"></div>
                            ) : (
                              '🔄'
                            )}
                            Replace Values
                          </button>
                        </div>
                        <div className="action-description">
                          Replace all problematic values with the specified value
                        </div>
                      </div>

                      <div className="remove-option">
                        <button
                          onClick={() => handleAction(issue.column, 'remove')}
                          disabled={processing}
                          className="btn btn-danger"
                        >
                          {processing ? (
                            <div className="btn-spinner"></div>
                          ) : (
                            '🗑️'
                          )}
                          Remove Rows
                        </button>
                        <div className="action-description">
                          Remove all rows containing problematic values
                        </div>
                      </div>
                    </div>

                    <div className="impact-warning">
                      ⚠️ This action will affect {issue.total_affected_rows} rows in your dataset
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="refresh-section">
        <button
          onClick={analyzeDataIntegrity}
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
        .validation-container {
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

        .stat-card.warning {
          background: rgba(255, 193, 7, 0.2);
          border-color: rgba(255, 193, 7, 0.4);
        }

        .stat-card.success {
          background: rgba(76, 175, 80, 0.2);
          border-color: rgba(76, 175, 80, 0.4);
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

        .no-issues {
          text-align: center;
          padding: 40px 20px;
          background: rgba(76, 175, 80, 0.1);
          border-radius: 12px;
          margin: 20px 0;
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .no-issues h4 {
          margin: 0 0 10px 0;
          font-size: 20px;
        }

        .clean-data-stats {
          margin-top: 15px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-weight: 600;
        }

        .issues-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }

        .issues-section h4 {
          margin: 0 0 20px 0;
          font-size: 18px;
        }

        .issue-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .issue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .issue-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .severity-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          color: white;
        }

        .issue-title h5 {
          margin: 0;
          font-size: 16px;
        }

        .issue-count {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .issue-details {
          margin-bottom: 20px;
        }

        .pattern-description, .expected-pattern {
          margin: 10px 0;
          font-size: 14px;
        }

        .problematic-values {
          margin: 15px 0;
        }

        .values-list {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .problem-value {
          background: rgba(244, 67, 54, 0.2);
          border: 1px solid rgba(244, 67, 54, 0.4);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-family: monospace;
        }

        .more-values {
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-style: italic;
        }

        .suggestions {
          margin: 15px 0;
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 8px;
        }

        .suggestions ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }

        .suggestions li {
          margin: 5px 0;
          font-size: 13px;
        }

        .action-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px;
        }

        .action-section h6 {
          margin: 0 0 15px 0;
          font-size: 16px;
        }

        .action-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 15px;
        }

        .replace-option, .remove-option {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .replace-input-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .replacement-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 14px;
        }

        .replacement-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .action-description {
          font-size: 12px;
          opacity: 0.8;
        }

        .impact-warning {
          background: rgba(255, 193, 7, 0.2);
          border: 1px solid rgba(255, 193, 7, 0.4);
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
          text-align: center;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          justify-content: center;
          white-space: nowrap;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
        }

        .btn-danger {
          background: linear-gradient(135deg, #f44336, #d32f2f);
          color: white;
        }

        .btn-outline {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          padding: 12px 24px;
          font-size: 14px;
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
          width: 14px;
          height: 14px;
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
          
          .action-controls {
            grid-template-columns: 1fr;
          }
          
          .replace-input-group {
            flex-direction: column;
          }
          
          .issue-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default DataValidation;
