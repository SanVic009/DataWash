import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataVisualization = ({ fileInfo }) => {
  const [columns, setColumns] = useState([]);
  const [validYColumns, setValidYColumns] = useState([]);
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [plotType, setPlotType] = useState('');
  const [plotOptions, setPlotOptions] = useState([]);
  const [plotImage, setPlotImage] = useState('');
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCorrelation, setShowCorrelation] = useState(false);

  useEffect(() => {
    if (fileInfo?.columns) {
      setColumns(fileInfo.columns);
      setValidYColumns(fileInfo.columns); // Initially all columns are valid
    }
  }, [fileInfo]);

  useEffect(() => {
    if (xAxis || yAxis) {
      getPlotOptions();
    }
  }, [xAxis, yAxis]);

  useEffect(() => {
    if (xAxis) {
      getValidYColumns();
    } else {
      // Reset to all columns if no X-axis selected
      setValidYColumns(columns);
      setYAxis(''); // Clear Y-axis selection when X-axis is cleared
    }
  }, [xAxis, columns]);

  const getValidYColumns = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/valid-y-columns', {
        x_axis: xAxis
      });
      setValidYColumns(response.data.valid_columns);
      
      // Clear Y-axis if it's no longer valid
      if (yAxis && !response.data.valid_columns.includes(yAxis)) {
        setYAxis('');
      }
    } catch (err) {
      console.error('Error getting valid Y columns:', err);
      setValidYColumns(columns); // Fallback to all columns
    }
  };

  const getPlotOptions = async () => {
    if (!xAxis && !yAxis) return;

    try {
      const response = await axios.post('http://localhost:5001/api/plot-options', {
        x_axis: xAxis,
        y_axis: yAxis
      });
      setPlotOptions(response.data.options);
      setPlotType(''); // Reset plot type when axes change
    } catch (err) {
      console.error('Error getting plot options:', err);
      setPlotOptions([]);
    }
  };

  const generatePlot = async () => {
    if (!xAxis || !plotType) {
      setError('Please select at least X-axis and plot type');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPlotImage(''); // Clear previous plot immediately
      
      // Add timeout for user feedback on large datasets
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Plot generation is taking longer than expected. Please wait...')), 15000)
      );
      
      const plotPromise = axios.post('http://localhost:5001/api/plot', {
        x_axis: xAxis,
        y_axis: yAxis,
        plot_type: plotType
      });

      try {
        const response = await Promise.race([plotPromise, timeoutPromise]);
        setPlotImage(response.data.plot);
      } catch (timeoutError) {
        // If timeout, still wait for the actual response but show warning
        setError('Plot generation is taking longer than expected. Large datasets may take time to process...');
        const response = await plotPromise;
        setPlotImage(response.data.plot);
        setError(null); // Clear timeout error if successful
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error generating plot';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadCorrelation = async () => {
    try {
      setLoading(true);
      setError(null);
      setCorrelation(null); // Clear previous correlation immediately
      
      // Add timeout for user feedback on large datasets
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Correlation calculation is taking longer than expected...')), 20000)
      );
      
      const correlationPromise = axios.get('http://localhost:5001/api/correlation');

      try {
        const response = await Promise.race([correlationPromise, timeoutPromise]);
        if (response.data && response.data.heatmap) {
          setCorrelation(response.data);
          setShowCorrelation(true);
        } else {
          setError('Invalid correlation data received from server');
        }
      } catch (timeoutError) {
        // If timeout, still wait for the actual response but show warning
        setError('Correlation calculation is taking longer than expected. Large datasets may take time to process...');
        try {
          const response = await correlationPromise;
          if (response.data && response.data.heatmap) {
            setCorrelation(response.data);
            setShowCorrelation(true);
            setError(null); // Clear timeout error if successful
          } else {
            setError('Invalid correlation data received from server');
          }
        } catch (finalError) {
          const errorMessage = finalError.response?.data?.error || finalError.message || 'Error loading correlation data';
          setError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error loading correlation data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetSelections = () => {
    setXAxis('');
    setYAxis('');
    setPlotType('');
    setPlotOptions([]);
    setPlotImage('');
    setError(null);
    setValidYColumns(columns); // Reset to all columns
  };

  const getPlotTypeLabel = (type) => {
    const labels = {
      'scatter': '🔴 Scatter Plot',
      'line': '📈 Line Plot',
      'bar': '📊 Bar Chart',
      'histogram': '📉 Histogram',
      'box': '📦 Box Plot'
    };
    return labels[type] || type;
  };

  return (
    <div>
      {/* Controls Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-icon">📈</span>
          <h2 className="card-title">Data Visualization</h2>
        </div>

        <div className="grid grid-2">
          <div>
            <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>📊 Plot Configuration</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                X-Axis Column:
              </label>
              <select
                className="form-select"
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Select X-axis column...</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                Y-Axis Column (Optional):
              </label>
              <select
                className="form-select"
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                style={{ width: '100%' }}
                disabled={!xAxis}
              >
                <option value="">
                  {!xAxis ? 'Select X-axis first...' : 'Select Y-axis column (optional)...'}
                </option>
                {validYColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568' }}>
                Plot Type:
              </label>
              <select
                className="form-select"
                value={plotType}
                onChange={(e) => setPlotType(e.target.value)}
                disabled={plotOptions.length === 0}
                style={{ width: '100%' }}
              >
                <option value="">
                  {plotOptions.length === 0 ? 'Select axes first...' : 'Select plot type...'}
                </option>
                {plotOptions.map((option) => (
                  <option key={option} value={option}>
                    {getPlotTypeLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={generatePlot}
                disabled={!xAxis || !plotType || loading}
              >
                {loading ? 'Generating...' : '📊 Generate Plot'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={resetSelections}
              >
                🔄 Reset
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>🔥 Quick Actions</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                className="btn btn-primary"
                onClick={loadCorrelation}
                disabled={loading}
                style={{ width: '100%', padding: '1rem' }}
              >
                📊 Show Correlation Matrix & Heatmap
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => setShowCorrelation(false)}
                style={{ width: '100%' }}
              >
                📈 Back to Custom Plots
              </button>
            </div>

            <div className="info-box" style={{ marginTop: '1rem' }}>
              <h4 style={{ color: '#2c5282', marginBottom: '0.5rem' }}>💡 Tips:</h4>
              <ul style={{ color: '#2c5282', fontSize: '0.9rem', lineHeight: '1.5' }}>
                <li>Select X-axis first to see compatible Y-axis options</li>
                <li>Y-axis options are filtered based on data type compatibility</li>
                <li>Y-axis is optional for histograms and bar charts</li>
                <li>Large datasets are automatically sampled for faster visualization</li>
                <li>Plot types adapt based on selected data types</li>
                <li>Correlation matrix shows relationships between numeric columns</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="error" style={{ marginTop: '1rem' }}>
            {error}
          </div>
        )}
      </div>

      {/* Plot Display Card */}
      {!showCorrelation && plotImage && (
        <div className="card">
          <div className="card-header">
            <span className="card-icon">📊</span>
            <h2 className="card-title">
              {getPlotTypeLabel(plotType)} - {xAxis}
              {yAxis && ` vs ${yAxis}`}
            </h2>
          </div>

          <div style={{ textAlign: 'center' }}>
            <img
              src={plotImage}
              alt="Generated Plot"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>

          <div className="info-box" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div><strong>📊 Plot Type:</strong> {getPlotTypeLabel(plotType)}</div>
              <div><strong>📈 X-Axis:</strong> {xAxis}</div>
              {yAxis && <div><strong>📉 Y-Axis:</strong> {yAxis}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Correlation Display Card */}
      {showCorrelation && correlation && (
        <div className="card">
          <div className="card-header">
            <span className="card-icon">🔥</span>
            <h2 className="card-title">Correlation Matrix & Heatmap</h2>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src={correlation.heatmap}
              alt="Correlation Heatmap"
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>

          <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>📊 Correlation Heatmap</h3>
          
          {correlation.sampling_info && (
            <div className="info-box" style={{ marginBottom: '1rem', backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }}>
              <h4 style={{ color: '#856404', marginBottom: '0.5rem' }}>📊 Sampling Information:</h4>
              <p style={{ color: '#856404', fontSize: '0.9rem', margin: 0 }}>
                {correlation.sampling_info.message}
              </p>
            </div>
          )}
          
          <div className="info-box">
            <h4 style={{ color: '#2c5282', marginBottom: '0.5rem' }}>💡 Understanding Correlation:</h4>
            <p style={{ color: '#2c5282', marginBottom: '1rem' }}>
              Correlation values range from -1 to 1:
            </p>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
              <span><strong>🔴 Near 1:</strong> Strong positive correlation</span>
              <span><strong>🔵 Near -1:</strong> Strong negative correlation</span>
              <span><strong>⚪ Near 0:</strong> Weak/no correlation</span>
            </div>
            <p style={{ color: '#2c5282', marginTop: '1rem', fontSize: '0.9rem' }}>
              📈 Use the visual heatmap above to identify relationships between your numeric variables.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            <p>
              {showCorrelation ? 
                'Generating correlation analysis... This may take a moment for large datasets.' : 
                'Generating visualization... Large datasets are automatically optimized for faster rendering.'}
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              💡 For datasets over 10,000 rows, we sample the data to ensure fast visualization while preserving patterns.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataVisualization;
