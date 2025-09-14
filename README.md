# Data Cleaning Pro 📊

A professional data cleaning and analysis tool with Python Flask backend and React frontend.

## Features

### 🎯 Core Functionality
- **File Upload**: Support for CSV and Excel files (up to 16MB)
- **Data Preview**: View first 5 rows or scroll through entire dataset
- **Dataset Information**: Shape, missing values analysis, and statistical summary
- **Data Types**: Comprehensive column data type analysis and categorization
- **Dataset Description**: Detailed column analysis with statistics and sample values
- **Column Management**: Interactive column dropping with multi-selection
- **Missing Value Imputation**: Fill missing values using various methods (mean, median, mode, custom values)
- **Data Visualization**: Interactive plots and charts based on data types

### 📊 Visualization Capabilities
- **Smart Plot Selection**: Plot types automatically adapt based on selected axes and data types
- **Supported Plots**:
  - Scatter plots (numeric vs numeric)
  - Line plots (numeric vs numeric)
  - Bar charts (categorical data)
  - Histograms (numeric distributions)
  - Box plots (outlier detection)
- **Correlation Analysis**: Heatmap and correlation matrix for numeric columns

### 🎨 UI/UX Features
- **Professional Design**: Modern gradient backgrounds with glassmorphism effects
- **Responsive Layout**: Works on desktop and mobile devices with horizontal scrolling for tabs
- **Interactive Navigation**: 8-tab interface with disabled states and smart navigation
- **Real-time Feedback**: Loading states, error handling, and success messages
- **Data Pagination**: Efficient handling of large datasets
- **Dynamic Forms**: Add/remove functionality for column operations
- **Smart Validation**: Prevents duplicate selections and validates inputs

## Project Structure

```
AISA/
├── backend/
│   ├── app.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   └── uploads/           # File upload directory
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.js
│   │   │   ├── DataPreview.js
│   │   │   ├── DataInfo.js
│   │   │   ├── DataTypeInfo.js
│   │   │   ├── DatasetDescription.js
│   │   │   ├── ColumnDropper.js
│   │   │   ├── MissingValueImputation.js
│   │   │   └── DataVisualization.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment** (recommended):
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask server**:
   ```bash
   python app.py
   ```
   Server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the React development server**:
   ```bash
   npm start
   ```
   Application will open on `http://localhost:3000`

## API Endpoints

### Backend API (`http://localhost:5000`)

- `POST /api/upload` - Upload CSV/Excel file
- `GET /api/preview` - Get first 5 rows of data
- `GET /api/data` - Get complete dataset
- `GET /api/info` - Get dataset information and statistics
- `POST /api/plot` - Generate custom plots
- `GET /api/correlation` - Get correlation matrix and heatmap
- `POST /api/plot-options` - Get available plot types for selected axes
- `POST /api/column-analysis` - Get detailed analysis for a specific column
- `POST /api/drop-columns` - Remove selected columns from dataset
- `POST /api/impute-missing` - Apply missing value imputation rules

## Usage Guide

### 1. Upload Data 📁
- Drag and drop or click to browse for CSV/Excel files
- Maximum file size: 16MB
- Supported formats: `.csv`, `.xlsx`, `.xls`

### 2. Preview Data 👁️
- View first 5 rows for quick preview
- Switch to full dataset view with pagination
- Scroll through large datasets efficiently

### 3. Analyze Data 📊
- **Dataset Info**: View shape, missing values, and statistical summary
- **Missing Values**: Highlighted columns with missing data and severity levels
- **Statistics**: Descriptive statistics for all numeric columns

### 4. Data Types 🏷️
- View all column data types with descriptions
- Filter by type category (numeric, text, datetime, boolean)
- Sort by column name, data type, or category
- Color-coded type indicators

### 5. Describe Dataset 📝
- Select any column for detailed analysis
- View statistics, sample values, and frequency distribution
- Numeric columns show mean, median, std deviation, etc.
- Text columns show most frequent values

### 6. Drop Columns 🗑️
- **Add Multiple Columns**: Use + button to add columns to drop list
- **Smart Selection**: Prevents selecting the same column twice
- **Visual Feedback**: See selected columns highlighted
- **Batch Operations**: Drop multiple columns at once

### 7. Fill Missing Values 🔧
- **Multiple Imputation Methods**:
  - **Mean**: For numeric columns (average value)
  - **Median**: For numeric columns (middle value)
  - **Mode**: Most frequent value (works for all types)
  - **Forward Fill**: Use previous valid value
  - **Backward Fill**: Use next valid value
  - **Custom Value**: Specify your own replacement value
- **Smart Method Selection**: Available methods adapt to data type
- **Rule-based System**: Add multiple imputation rules
- **Preview**: See which rules will be applied before execution

### 8. Visualizations 📈
- **Custom Plots**: Select X/Y axes and plot type
- **Smart Suggestions**: Plot types adapt to your data selection
- **Correlation Analysis**: View correlation matrix and heatmap
- **Interactive Controls**: Reset and regenerate plots easily

## Technical Details

### Backend Technologies
- **Flask**: Web framework for API endpoints
- **Pandas**: Data manipulation and analysis
- **Matplotlib & Seaborn**: Data visualization
- **NumPy**: Numerical computing
- **OpenPyXL**: Excel file support

### Frontend Technologies
- **React**: User interface library
- **Axios**: HTTP client for API calls
- **React Dropzone**: File upload component
- **CSS3**: Modern styling with gradients and animations

### Key Features Implementation
- **File Processing**: Secure file upload with type validation
- **Data Streaming**: Efficient handling of large datasets
- **Error Handling**: Comprehensive error management
- **Responsive Design**: Mobile-first approach
- **Performance**: Optimized rendering and API calls

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and professional use.

---

**Made with ❤️ for professional data analysis**
