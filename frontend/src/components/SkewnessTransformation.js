import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SkewnessTransformation = ({ filename, onDataUpdate }) => {
  const [skewnessData, setSkewnessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTransformations, setSelectedTransformations] = useState({});

  useEffect(() => {
    if (filename) {
      analyzeSkewness();
    }
  }, [filename]);

  const analyzeSkewness = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/analyze-skewness');
      setSkewnessData(response.data);
      
      // Auto-select recommended transformations
      const autoSelections = {};
      response.data.columns.forEach(col => {
        if (col.recommended_transformation && col.recommended_transformation !== 'none') {
          autoSelections[col.column] = col.recommended_transformation;
        }
      });
      setSelectedTransformations(autoSelections);
      
    } catch (error) {
      setError(error.response?.data?.error || 'Error analyzing skewness');
      console.error('Error analyzing skewness:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTransformations = async () => {
    if (Object.keys(selectedTransformations).length === 0) {
      setError('Please select at least one transformation to apply');
      return;
    }

    setTransforming(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/apply-transformations', {
        transformations: selectedTransformations
      });

      setSuccess(response.data.message);
      
      // Notify parent component of data update
      if (onDataUpdate) {
        onDataUpdate(response.data);
      }

      // Refresh skewness analysis
      setTimeout(() => analyzeSkewness(), 1000);

    } catch (error) {
      setError(error.response?.data?.error || 'Error applying transformations');
      console.error('Error applying transformations:', error);
    } finally {
      setTransforming(false);
    }
  };

  const handleTransformationChange = (column, transformation) => {
    setSelectedTransformations(prev => {
      if (transformation === 'none') {
        const { [column]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [column]: transformation
      };
    });
  };

  const getSkewnessLevel = (skewness) => {
    const absSkew = Math.abs(skewness);
    if (absSkew < 0.5) return { level: 'Low', color: '#4CAF50', icon: '✅' };
    if (absSkew < 1.0) return { level: 'Moderate', color: '#FF9800', icon: '⚠️' };
    return { level: 'High', color: '#F44336', icon: '🚨' };
  };

  const getSkewnessDirection = (skewness) => {
    if (skewness > 0.5) return { direction: 'Right-skewed', icon: '↗️' };
    if (skewness < -0.5) return { direction: 'Left-skewed', icon: '↖️' };
    return { direction: 'Symmetric', icon: '⚖️' };
  };

  const transformationDescriptions = {
    'log': 'Log transformation - reduces right skewness by compressing large values',
    'sqrt': 'Square root transformation - mild reduction of right skewness',
    'reciprocal': 'Reciprocal transformation - strong reduction of right skewness',
    'square': 'Square transformation - reduces left skewness',
    'boxcox': 'Box-Cox transformation - optimal power transformation based on data',
    'yeojohnson': 'Yeo-Johnson transformation - handles negative values and zeros'
  };

  if (!filename) {
    return (
      <div className="skewness-container">
        <div className="no-data-message">
          <h3>📊 Skewness Detection & Transformation</h3>
          <p>Please upload a dataset first to analyze feature skewness.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="skewness-container">
      <div className="section-header">
        <h3>📊 Skewness Detection & Transformation</h3>
        <p>Auto-detect skewed features and apply appropriate transformations</p>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing feature skewness...</p>
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

      {skewnessData && !loading && (
        <div className="skewness-analysis">
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h4>Numeric Columns</h4>
                <span className="stat-value">{skewnessData.total_numeric_columns}</span>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h4>Skewed Features</h4>
                <span className="stat-value">{skewnessData.skewed_columns}</span>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h4>Normal Features</h4>
                <span className="stat-value">{skewnessData.normal_columns}</span>
              </div>
            </div>
          </div>

          <div className="columns-analysis">
            <h4>🔍 Feature-wise Skewness Analysis</h4>
            
            {skewnessData.columns.length === 0 ? (
              <div className="no-numeric-data">
                <div className="info-icon">ℹ️</div>
                <h4>No Numeric Columns Found</h4>
                <p>This dataset contains no numeric columns that can be analyzed for skewness.</p>
              </div>
            ) : (
              <>
                <div className="columns-grid">
                  {skewnessData.columns.map((col, index) => {
                    const skewLevel = getSkewnessLevel(col.skewness);
                    const skewDirection = getSkewnessDirection(col.skewness);
                    
                    return (
                      <div key={index} className="column-card">
                        <div className="column-header">
                          <h5>{col.column}</h5>
                          <div className="skew-badges">
                            <span 
                              className="skew-level" 
                              style={{ backgroundColor: skewLevel.color }}
                            >
                              {skewLevel.icon} {skewLevel.level}
                            </span>
                            <span className="skew-direction">
                              {skewDirection.icon} {skewDirection.direction}
                            </span>
                          </div>
                        </div>

                        <div className="column-stats">
                          <div className="stat-row">
                            <span>Skewness:</span>
                            <strong>{col.skewness.toFixed(3)}</strong>
                          </div>
                          <div className="stat-row">
                            <span>Kurtosis:</span>
                            <strong>{col.kurtosis.toFixed(3)}</strong>
                          </div>
                        </div>

                        {/* KDE Plot with Histogram */}
                        {col.kde_plot && (
                          <div className="kde-plot-section">
                            <h6>📊 Distribution Analysis</h6>
                            <div className="plot-container">
                              <img 
                                src={col.kde_plot} 
                                alt={`Distribution of ${col.column}`}
                                className="kde-plot-image"
                              />
                            </div>
                          </div>
                        )}

                        {Math.abs(col.skewness) >= 0.5 && (
                          <div className="transformation-section">
                            <label className="transformation-label">
                              Transformation Method:
                            </label>
                            <select
                              value={selectedTransformations[col.column] || 'none'}
                              onChange={(e) => handleTransformationChange(col.column, e.target.value)}
                              className="transformation-select"
                            >
                              <option value="none">No transformation</option>
                              <option value="log">Log transformation</option>
                              <option value="sqrt">Square root</option>
                              <option value="reciprocal">Reciprocal (1/x)</option>
                              <option value="square">Square (x²)</option>
                              <option value="boxcox">Box-Cox</option>
                              <option value="yeojohnson">Yeo-Johnson</option>
                            </select>
                            
                            {col.recommended_transformation && col.recommended_transformation !== 'none' && (
                              <div className="recommendation">
                                <strong>Recommended:</strong> {col.recommended_transformation}
                                {selectedTransformations[col.column] === col.recommended_transformation && (
                                  <span className="selected-badge">✓ Selected</span>
                                )}
                              </div>
                            )}

                            {selectedTransformations[col.column] && selectedTransformations[col.column] !== 'none' && (
                              <div className="transformation-description">
                                {transformationDescriptions[selectedTransformations[col.column]]}
                              </div>
                            )}
                          </div>
                        )}

                        {Math.abs(col.skewness) < 0.5 && (
                          <div className="normal-indicator">
                            <span className="normal-badge">
                              ✅ Feature is approximately normal
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {Object.keys(selectedTransformations).length > 0 && (
                  <div className="apply-section">
                    <h4>🔧 Apply Selected Transformations</h4>
                    <div className="selected-transformations">
                      {Object.entries(selectedTransformations).map(([column, transformation]) => (
                        <div key={column} className="selected-item">
                          <strong>{column}:</strong> {transformation}
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={applyTransformations}
                      disabled={transforming}
                      className="btn btn-primary"
                    >
                      {transforming ? (
                        <>
                          <div className="btn-spinner"></div>
                          Applying Transformations...
                        </>
                      ) : (
                        <>
                          🚀 Apply Transformations ({Object.keys(selectedTransformations).length})
                        </>
                      )}
                    </button>
                    
                    <div className="transformation-warning">
                      ⚠️ <strong>Warning:</strong> Transformations will modify your data permanently. 
                      Make sure to backup your original data if needed.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="refresh-section">
        <button
          onClick={analyzeSkewness}
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
        .skewness-container {
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

        .skewness-analysis {
          margin-top: 20px;
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
          background: linear-gradient(135deg, #f0fff4, #e6fffa);
          border-color: #38a169;
          color: #1a365d;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(56, 161, 105, 0.1);
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

        .columns-analysis {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 25px;
          margin: 20px 0;
        }

        .columns-analysis h4 {
          margin: 0 0 20px 0;
          font-size: 18px;
        }

        .no-numeric-data {
          text-align: center;
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .info-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .no-numeric-data h4 {
          margin: 0 0 10px 0;
          font-size: 20px;
        }

        .columns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
        }

        .column-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .column-header {
          margin-bottom: 15px;
        }

        .column-header h5 {
          margin: 0 0 10px 0;
          font-size: 16px;
          font-weight: bold;
        }

        .skew-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .skew-level {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          color: white;
        }

        .skew-direction {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.2);
        }

        .column-stats {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }

        .transformation-section {
          margin-top: 15px;
        }

        .transformation-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .transformation-select {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .transformation-select option {
          background: #333;
          color: white;
        }

        .recommendation {
          font-size: 13px;
          margin: 8px 0;
          padding: 8px;
          background: linear-gradient(135deg, #f0fff4, #e6fffa);
          border-radius: 6px;
          border: 1px solid #38a169;
          color: #1a365d;
          font-weight: 500;
        }

        .selected-badge {
          margin-left: 8px;
          padding: 2px 6px;
          background: linear-gradient(135deg, #38a169, #2f855a);
          border-radius: 4px;
          font-size: 11px;
          color: white;
          font-weight: 500;
        }

        .transformation-description {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 8px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .normal-indicator {
          margin-top: 15px;
        }

        .normal-badge {
          display: inline-block;
          padding: 8px 12px;
          background: linear-gradient(135deg, #f0fff4, #e6fffa);
          border: 1px solid #38a169;
          border-radius: 6px;
          font-size: 14px;
          color: #1a365d;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(56, 161, 105, 0.1);
        }

        .apply-section {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 25px;
          margin-top: 30px;
        }

        .apply-section h4 {
          margin: 0 0 15px 0;
          font-size: 18px;
        }

        .selected-transformations {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .selected-item {
          margin: 8px 0;
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
          margin-bottom: 15px;
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

        .transformation-warning {
          padding: 15px;
          background: rgba(255, 193, 7, 0.2);
          border: 1px solid rgba(255, 193, 7, 0.4);
          border-radius: 8px;
          font-size: 14px;
        }

        .refresh-section {
          text-align: center;
          margin-top: 20px;
        }

        .kde-plot-section {
          margin-top: 15px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .kde-plot-section h6 {
          margin: 0 0 10px 0;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
        }

        .plot-container {
          width: 100%;
          text-align: center;
          background: #ffffff;
          border-radius: 6px;
          padding: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .kde-plot-image {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          display: block;
          margin: 0 auto;
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
          
          .kde-plot-image {
            max-width: 100%;
            height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default SkewnessTransformation;
