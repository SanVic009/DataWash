import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DuplicateRowRemoval = ({ filename, onDataUpdate }) => {
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (filename) {
      checkDuplicates();
    }
  }, [filename]);

  const checkDuplicates = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/check-duplicates');
      setDuplicateInfo(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Error checking duplicates');
      console.error('Error checking duplicates:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeDuplicates = async (keepFirst = true) => {
    if (!duplicateInfo || duplicateInfo.duplicate_count === 0) return;
    
    setRemoving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/remove-duplicates', {
        keep: keepFirst ? 'first' : 'last'
      });

      setSuccess(response.data.message);
      setDuplicateInfo({
        ...duplicateInfo,
        duplicate_count: 0,
        unique_count: response.data.new_shape[0]
      });

      // Notify parent component of data update
      if (onDataUpdate) {
        onDataUpdate(response.data);
      }

      // Refresh duplicate check
      setTimeout(() => checkDuplicates(), 1000);

    } catch (error) {
      setError(error.response?.data?.error || 'Error removing duplicates');
      console.error('Error removing duplicates:', error);
    } finally {
      setRemoving(false);
    }
  };

  if (!filename) {
    return (
      <div className="duplicate-removal-container">
        <div className="no-data-message">
          <h3>📋 Duplicate Row Management</h3>
          <p>Please upload a dataset first to check for duplicate rows.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="duplicate-removal-container">
      <div className="section-header">
        <h3>📋 Duplicate Row Detection & Removal</h3>
        <p>Identify and remove duplicate rows to ensure data quality</p>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Checking for duplicate rows...</p>
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

      {duplicateInfo && !loading && (
        <div className="duplicate-info-section">
          <div className="info-cards">
            <div className="info-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h4>Total Rows</h4>
                <span className="card-value">{duplicateInfo.total_rows.toLocaleString()}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon">✨</div>
              <div className="card-content">
                <h4>Unique Rows</h4>
                <span className="card-value">{duplicateInfo.unique_count.toLocaleString()}</span>
              </div>
            </div>

            <div className={`info-card ${duplicateInfo.duplicate_count > 0 ? 'warning' : 'success'}`}>
              <div className="card-icon">{duplicateInfo.duplicate_count > 0 ? '⚠️' : '✅'}</div>
              <div className="card-content">
                <h4>Duplicate Rows</h4>
                <span className="card-value">{duplicateInfo.duplicate_count.toLocaleString()}</span>
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <h4>Duplicate %</h4>
                <span className="card-value">{duplicateInfo.duplicate_percentage.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {duplicateInfo.duplicate_count > 0 ? (
            <div className="duplicate-actions">
              <div className="action-section">
                <h4>🔧 Duplicate Removal Options</h4>
                <p>Choose which duplicate rows to keep when removing duplicates:</p>
                
                <div className="action-buttons">
                  <button
                    onClick={() => removeDuplicates(true)}
                    disabled={removing}
                    className="btn btn-primary"
                  >
                    {removing ? (
                      <>
                        <div className="btn-spinner"></div>
                        Removing...
                      </>
                    ) : (
                      <>
                        🥇 Keep First Occurrence
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => removeDuplicates(false)}
                    disabled={removing}
                    className="btn btn-secondary"
                  >
                    {removing ? (
                      <>
                        <div className="btn-spinner"></div>
                        Removing...
                      </>
                    ) : (
                      <>
                        🥈 Keep Last Occurrence
                      </>
                    )}
                  </button>
                </div>

                <div className="action-info">
                  <div className="info-item">
                    <strong>Keep First:</strong> Retains the first occurrence of each duplicate row
                  </div>
                  <div className="info-item">
                    <strong>Keep Last:</strong> Retains the last occurrence of each duplicate row
                  </div>
                  <div className="info-item">
                    <strong>Rows to be removed:</strong> {duplicateInfo.duplicate_count.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-duplicates">
              <div className="success-icon">✅</div>
              <h4>No Duplicate Values Present</h4>
              <p>Your dataset is clean - no duplicate rows were found!</p>
              <div className="clean-data-stats">
                <span>All {duplicateInfo.total_rows.toLocaleString()} rows are unique</span>
              </div>
            </div>
          )}

          {duplicateInfo.duplicate_examples && duplicateInfo.duplicate_examples.length > 0 && (
            <div className="duplicate-examples">
              <h4>🔍 Sample Duplicate Rows</h4>
              <div className="examples-container">
                {duplicateInfo.duplicate_examples.slice(0, 3).map((example, index) => (
                  <div key={index} className="example-item">
                    <strong>Duplicate Group {index + 1}:</strong>
                    <span>Found at rows: {example.indices.join(', ')}</span>
                  </div>
                ))}
                {duplicateInfo.duplicate_examples.length > 3 && (
                  <div className="more-examples">
                    ... and {duplicateInfo.duplicate_examples.length - 3} more duplicate groups
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="refresh-section">
        <button
          onClick={checkDuplicates}
          disabled={loading}
          className="btn btn-outline"
        >
          {loading ? (
            <>
              <div className="btn-spinner"></div>
              Checking...
            </>
          ) : (
            <>
              🔄 Refresh Check
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .duplicate-removal-container {
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

        .no-data-message h3 {
          margin: 0 0 15px 0;
          font-size: 24px;
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
          background: linear-gradient(135deg, #f0fff4, #e6fffa);
          border: 1px solid #38a169;
          color: #1a365d;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(56, 161, 105, 0.1);
        }

        .duplicate-info-section {
          margin-top: 20px;
        }

        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          min-height: 120px;
          display: flex;
          align-items: center;
          gap: 15px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.2s ease;
        }

        .info-card:hover {
          transform: translateY(-2px);
        }

        .info-card.warning {
          background: rgba(255, 193, 7, 0.2);
          border-color: rgba(255, 193, 7, 0.4);
        }

        .info-card.success {
          background: linear-gradient(135deg, #f0fff4, #e6fffa);
          border-color: #38a169;
          color: #1a365d;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(56, 161, 105, 0.1);
        }

        .card-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .card-content h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .card-value {
          font-size: 20px;
          font-weight: bold;
        }

        .duplicate-actions {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }

        .action-section h4 {
          margin: 0 0 10px 0;
          font-size: 18px;
        }

        .action-section p {
          margin: 0 0 20px 0;
          opacity: 0.9;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
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
          min-width: 180px;
          justify-content: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .btn-secondary {
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .btn-outline {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
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

        .action-info {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 15px;
        }

        .info-item {
          margin: 8px 0;
          font-size: 14px;
        }

        .no-duplicates {
          text-align: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, #f0fff4, #e6fffa);
          border: 1px solid #38a169;
          border-radius: 12px;
          margin: 20px 0;
          color: #1a365d;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(56, 161, 105, 0.1);
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .no-duplicates h4 {
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

        .duplicate-examples {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }

        .duplicate-examples h4 {
          margin: 0 0 15px 0;
          font-size: 16px;
        }

        .examples-container {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 15px;
        }

        .example-item {
          margin: 10px 0;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          font-size: 14px;
        }

        .example-item strong {
          display: block;
          margin-bottom: 4px;
        }

        .more-examples {
          margin-top: 10px;
          font-style: italic;
          opacity: 0.8;
          text-align: center;
        }

        .refresh-section {
          text-align: center;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .info-cards {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          
          .info-card {
            min-height: 100px;
            padding: 20px;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .btn {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default DuplicateRowRemoval;
