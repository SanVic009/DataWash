import React, { useState, useCallback } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import DataInfo from './components/DataInfo';
import DataVisualization from './components/DataVisualization';
import DataTypeInfo from './components/DataTypeInfo';
import DatasetDescription from './components/DatasetDescription';
import ColumnDropper from './components/ColumnDropper';
import MissingValueImputation from './components/MissingValueImputation';
import OutlierRemoval from './components/OutlierRemoval';
import ColumnStandardization from './components/ColumnStandardization';
import DuplicateRowRemoval from './components/DuplicateRowRemoval';
import SkewnessTransformation from './components/SkewnessTransformation';
import DataEncoding from './components/DataEncoding';
import DataValidation from './components/DataValidation';
import Finalize from './components/Finalize';

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [activeCategory, setActiveCategory] = useState('upload');
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileUpload = useCallback((fileInfo) => {
    setUploadedFile(fileInfo);
    setActiveCategory('explore');
    setActiveTab('preview');
  }, []);

  const handleDataLoad = useCallback((data) => {
    setFileData(data);
  }, []);

  const categories = {
    upload: {
      id: 'upload',
      label: 'Upload Data',
      icon: '📁',
      color: '#4F46E5',
      tabs: [
        { id: 'upload', label: 'Upload Data', icon: '📁' }
      ]
    },
    explore: {
      id: 'explore',
      label: 'Explore',
      icon: '�',
      color: '#10B981',
      disabled: !uploadedFile,
      tabs: [
        { id: 'preview', label: 'Data Preview', icon: '�️' },
        { id: 'info', label: 'Data Info', icon: '📊' },
        { id: 'types', label: 'Data Types', icon: '🏷️' },
        { id: 'describe', label: 'Describe Dataset', icon: '📝' }
      ]
    },
    clean: {
      id: 'clean',
      label: 'Clean',
      icon: '🧹',
      color: '#F59E0B',
      disabled: !uploadedFile,
      tabs: [
        { id: 'imputation', label: 'Fill Missing Values', icon: '🔧' },
        { id: 'outliers', label: 'Remove Outliers', icon: '🎯' },
        { id: 'drop-columns', label: 'Drop Columns', icon: '�️' },
        { id: 'duplicates', label: 'Remove Duplicates', icon: '🔄' }
      ]
    },
    transform: {
      id: 'transform',
      label: 'Transform',
      icon: '⚡',
      color: '#8B5CF6',
      disabled: !uploadedFile,
      tabs: [
        { id: 'standardize', label: 'Standardize Names', icon: '📋' },
        { id: 'skewness', label: 'Skewness Transform', icon: '📊' },
        { id: 'encoding', label: 'Data Encoding', icon: '🔤' }
      ]
    },
    validate: {
      id: 'validate',
      label: 'Validate & Visualize',
      icon: '📈',
      color: '#EF4444',
      disabled: !uploadedFile,
      tabs: [
        { id: 'validation', label: 'Data Validation', icon: '🔍' },
        { id: 'visualize', label: 'Visualizations', icon: '📈' }
      ]
    },
    finalize: {
      id: 'finalize',
      label: 'Finalize',
      icon: '✅',
      color: '#059669',
      disabled: !uploadedFile,
      tabs: [
        { id: 'save-changes', label: 'Save Changes', icon: '💾' },
        { id: 'final-preview', label: 'Final Preview', icon: '👁️' },
        { id: 'report', label: 'Report', icon: '📄' },
        { id: 'download', label: 'Download CSV', icon: '⬇️' }
      ]
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>📊 Data Cleaning Pro</h1>
          <p>Professional Data Analysis & Cleaning Tool</p>
        </div>
      </header>

      <nav className="category-navigation">
        <div className="category-tabs">
          {Object.values(categories).map(category => (
            <button
              key={category.id}
              className={`category-button ${activeCategory === category.id ? 'active' : ''} ${category.disabled ? 'disabled' : ''}`}
              onClick={() => {
                if (!category.disabled) {
                  setActiveCategory(category.id);
                  setActiveTab(category.tabs[0].id);
                }
              }}
              disabled={category.disabled}
              style={{
                '--category-color': category.color,
                borderColor: activeCategory === category.id ? category.color : 'transparent'
              }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
            </button>
          ))}
        </div>

        {activeCategory !== 'upload' && (
          <div className="sub-navigation">
            <div className="sub-tabs">
              {categories[activeCategory]?.tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`sub-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    '--category-color': categories[activeCategory].color
                  }}
                >
                  <span className="sub-tab-icon">{tab.icon}</span>
                  <span className="sub-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="main-content">
        {activeTab === 'upload' && (
          <FileUpload onFileUpload={handleFileUpload} />
        )}
        
        {activeTab === 'preview' && uploadedFile && (
          <DataPreview 
            fileInfo={uploadedFile} 
            onDataLoad={handleDataLoad}
          />
        )}
        
        {activeTab === 'info' && uploadedFile && (
          <DataInfo fileInfo={uploadedFile} />
        )}
        
        {activeTab === 'types' && uploadedFile && (
          <DataTypeInfo fileInfo={uploadedFile} />
        )}
        
        {activeTab === 'describe' && uploadedFile && (
          <DatasetDescription fileInfo={uploadedFile} />
        )}
        
        {activeTab === 'drop-columns' && uploadedFile && (
          <ColumnDropper 
            fileInfo={uploadedFile} 
            onDataUpdate={handleFileUpload}
          />
        )}
        
        {activeTab === 'imputation' && uploadedFile && (
          <MissingValueImputation 
            fileInfo={uploadedFile} 
            onDataUpdate={handleFileUpload}
          />
        )}
        
        {activeTab === 'outliers' && uploadedFile && (
          <OutlierRemoval 
            fileInfo={uploadedFile} 
            onDataUpdate={handleFileUpload}
          />
        )}
        
        {activeTab === 'standardize' && uploadedFile && (
          <ColumnStandardization 
            fileInfo={uploadedFile} 
            onDataUpdate={handleFileUpload}
          />
        )}
        
        {activeTab === 'duplicates' && uploadedFile && (
          <DuplicateRowRemoval 
            filename={uploadedFile.filename} 
            onDataUpdate={handleFileUpload}
          />
        )}
        
        {activeTab === 'skewness' && uploadedFile && (
          <SkewnessTransformation 
            filename={uploadedFile.filename} 
            onDataUpdate={handleFileUpload}
          />
        )}
        
        {activeTab === 'encoding' && uploadedFile && (
          <DataEncoding 
            filename={uploadedFile.filename} 
            onDataUpdate={handleFileUpload}
          />
        )}
        
        {activeTab === 'validation' && uploadedFile && (
          <DataValidation 
            filename={uploadedFile.filename} 
            onDataUpdate={handleFileUpload}
          />
        )}
        
        {activeTab === 'visualize' && uploadedFile && (
          <DataVisualization fileInfo={uploadedFile} />
        )}
        
        {activeTab === 'save-changes' && uploadedFile && (
          <Finalize 
            fileInfo={uploadedFile} 
            onDataUpdate={handleFileUpload}
            mode="save-changes"
          />
        )}
        
        {activeTab === 'final-preview' && uploadedFile && (
          <Finalize 
            fileInfo={uploadedFile} 
            onDataUpdate={handleFileUpload}
            mode="final-preview"
          />
        )}
        
        {activeTab === 'report' && uploadedFile && (
          <Finalize 
            fileInfo={uploadedFile} 
            onDataUpdate={handleFileUpload}
            mode="report"
          />
        )}
        
        {activeTab === 'download' && uploadedFile && (
          <Finalize 
            fileInfo={uploadedFile} 
            onDataUpdate={handleFileUpload}
            mode="download"
          />
        )}
      </main>

      <footer className="app-footer">
        <p>© 2025 Data Cleaning Pro - Professional Data Analysis Tool</p>
      </footer>
    </div>
  );
}

export default App;
