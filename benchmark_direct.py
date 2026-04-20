"""
Direct Benchmark Script for Data Wash
Tests data processing operations directly without requiring Flask server
"""

import pandas as pd
import numpy as np
import time
import json
import os
from datetime import datetime
import warnings

warnings.filterwarnings("ignore")

# Try to import optional libraries
try:
    from sklearn.ensemble import IsolationForest

    HAS_SKLEARN = True
except:
    HAS_SKLEARN = False
    print("⚠️  scikit-learn not available - ML-based outlier detection will be skipped")

try:
    from scipy import stats
    from scipy.stats import skew, kurtosis

    HAS_SCIPY = True
except:
    HAS_SCIPY = False
    print("⚠️  scipy not available - some statistical tests will be skipped")

try:
    import matplotlib
    import seaborn as sns

    HAS_PLOTTING = True
except:
    HAS_PLOTTING = False
    print("⚠️  matplotlib/seaborn not available - plotting tests will be skipped")

BASE_PATH = "/home/sanvict/Documents/Code/DataCleaning/uploads"

DATASETS = [
    {"name": "diabetes.csv", "size": "23KB", "rows": 767},
    {"name": "Titanic-Dataset.csv", "size": "59KB", "rows": 891},
    {"name": "users.csv", "size": "604KB", "rows": 10000},
    {"name": "emails.csv", "size": "8.6MB", "rows": 5728},
    {"name": "ncr_ride_bookings.csv", "size": "25MB", "rows": 150000},
]


def load_csv(filepath):
    """Load CSV file"""
    return pd.read_csv(filepath)


def benchmark_function(func, *args, **kwargs):
    """Run a function and return its execution time"""
    start = time.time()
    try:
        result = func(*args, **kwargs)
        elapsed = (time.time() - start) * 1000  # ms
        return elapsed, result, None
    except Exception as e:
        return None, None, str(e)


def detect_datetime_columns_mock(df):
    """Simplified datetime detection"""
    datetime_patterns = [
        r"^\d{4}-\d{1,2}-\d{1,2}$",
        r"^\d{1,2}/\d{1,2}/\d{4}$",
        r"^\d{1,2}-\d{1,2}-\d{4}$",
    ]
    converted = []
    for col in df.columns:
        if df[col].dtype == "object":
            sample = df[col].dropna().astype(str).head(10)
            if len(sample) > 0:
                match_count = sum(
                    1 for s in sample if any(p.match(s) for p in datetime_patterns)
                )
                if match_count / len(sample) > 0.75:
                    converted.append(col)
    return converted


def calculate_statistics(df):
    """Calculate descriptive statistics"""
    return df.describe()


def calculate_correlation(df):
    """Calculate correlation matrix"""
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return None
    return numeric_df.corr()


def detect_outliers_zscore(df, column, threshold=3):
    """Z-score based outlier detection"""
    col_data = df[column].dropna()
    if len(col_data) == 0:
        return 0
    mean = col_data.mean()
    std = col_data.std()
    z_scores = np.abs((col_data - mean) / std)
    return int((z_scores > threshold).sum())


def detect_outliers_iqr(df, column):
    """IQR based outlier detection"""
    col_data = df[column].dropna()
    if len(col_data) == 0:
        return 0
    Q1 = col_data.quantile(0.25)
    Q3 = col_data.quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    return int(((col_data < lower) | (col_data > upper)).sum())


def detect_outliers_isolation_forest(df, column):
    """ML-based outlier detection using Isolation Forest"""
    if not HAS_SKLEARN:
        return None
    col_data = df[column].dropna().values.reshape(-1, 1)
    if len(col_data) < 10:
        return None
    clf = IsolationForest(contamination=0.1, random_state=42)
    preds = clf.fit_predict(col_data)
    return int((preds == -1).sum())


def impute_missing_mean(df, column):
    """Mean imputation"""
    col_data = df[column].copy()
    mean_val = col_data.mean()
    col_data.fillna(mean_val, inplace=True)
    return df


def impute_missing_median(df, column):
    """Median imputation"""
    col_data = df[column].copy()
    median_val = col_data.median()
    col_data.fillna(median_val, inplace=True)
    return df


def impute_missing_mode(df, column):
    """Mode imputation"""
    col_data = df[column].copy()
    mode_val = col_data.mode()[0] if not col_data.mode().empty else col_data.iloc[0]
    col_data.fillna(mode_val, inplace=True)
    return df


def drop_duplicates(df):
    """Remove duplicate rows"""
    return df.drop_duplicates()


def drop_columns(df, columns):
    """Drop specified columns"""
    return df.drop(columns=columns)


def label_encode(df, column):
    """Label encoding for categorical column"""
    df_copy = df.copy()
    df_copy[column] = pd.factorize(df_copy[column])[0]
    return df_copy


def one_hot_encode(df, column):
    """One-hot encoding"""
    return pd.get_dummies(df, columns=[column])


def calculate_skewness(df, column):
    """Calculate skewness"""
    col_data = df[column].dropna()
    if HAS_SCIPY:
        return skew(col_data)
    return col_data.skew()


def calculate_kurtosis(df, column):
    """Calculate kurtosis"""
    col_data = df[column].dropna()
    if HAS_SCIPY:
        return kurtosis(col_data)
    return col_data.kurtosis()


def generate_plot_data(df, x_col, y_col, plot_type):
    """Generate plot data (simulate plot generation)"""
    if plot_type == "scatter":
        clean = df[[x_col, y_col]].dropna()
        return len(clean)
    elif plot_type == "histogram":
        return len(df[x_col].dropna())
    elif plot_type == "box":
        return len(df[[x_col, y_col]].dropna())
    return 0


def run_benchmarks():
    """Run all benchmarks"""
    results = {"timestamp": datetime.now().isoformat(), "tests": []}

    print("=" * 70)
    print("🚀 DATA WASH BENCHMARK TEST")
    print("=" * 70)

    for dataset in DATASETS:
        filepath = os.path.join(BASE_PATH, dataset["name"])

        if not os.path.exists(filepath):
            filepath = os.path.join(
                BASE_PATH, "..", "backend", "uploads", dataset["name"]
            )

        if not os.path.exists(filepath):
            print(f"\n⚠️  Skipping {dataset['name']} - file not found")
            continue

        print(
            f"\n📊 Testing: {dataset['name']} ({dataset['size']}, {dataset['rows']} rows)"
        )
        print("-" * 50)

        result = {
            "dataset": dataset["name"],
            "size": dataset["size"],
            "rows": dataset["rows"],
            "operations": {},
        }

        # Load data
        print("  📂 Loading CSV...", end=" ", flush=True)
        load_time, df, err = benchmark_function(load_csv, filepath)
        if load_time is not None:
            print(f"✅ {load_time:.1f}ms")
            result["operations"]["load_csv"] = {"time_ms": round(load_time, 1)}

            cols = df.columns.tolist()
            num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            cat_cols = df.select_dtypes(include=["object"]).columns.tolist()

            print(
                f"  📊 Columns: {len(cols)} total, {len(num_cols)} numeric, {len(cat_cols)} categorical"
            )

            # Datetime detection
            print("  🕐 Datetime Detection...", end=" ", flush=True)
            dt_time, dt_result, _ = benchmark_function(detect_datetime_columns_mock, df)
            if dt_time:
                print(f"✅ {dt_time:.1f}ms ({len(dt_result)} datetime columns)")
                result["operations"]["datetime_detection"] = {
                    "time_ms": round(dt_time, 1)
                }

            # Statistics
            print("  📈 Statistics...", end=" ", flush=True)
            stats_time, stats_result, _ = benchmark_function(calculate_statistics, df)
            if stats_time:
                print(f"✅ {stats_time:.1f}ms")
                result["operations"]["statistics"] = {"time_ms": round(stats_time, 1)}

            # Correlation (only if numeric columns exist)
            if len(num_cols) >= 2:
                print("  🔗 Correlation Matrix...", end=" ", flush=True)
                corr_time, corr_result, _ = benchmark_function(
                    calculate_correlation, df
                )
                if corr_time:
                    print(f"✅ {corr_time:.1f}ms")
                    result["operations"]["correlation"] = {
                        "time_ms": round(corr_time, 1)
                    }

            # Outlier Detection
            if len(num_cols) >= 1:
                # Z-Score
                print("  🎯 Outlier (Z-Score)...", end=" ", flush=True)
                zscore_time, zscore_count, _ = benchmark_function(
                    detect_outliers_zscore, df, num_cols[0]
                )
                if zscore_time:
                    print(f"✅ {zscore_time:.1f}ms ({zscore_count} outliers)")
                    result["operations"]["outlier_zscore"] = {
                        "time_ms": round(zscore_time, 1),
                        "outliers": zscore_count,
                    }

                # IQR
                print("  🎯 Outlier (IQR)...", end=" ", flush=True)
                iqr_time, iqr_count, _ = benchmark_function(
                    detect_outliers_iqr, df, num_cols[0]
                )
                if iqr_time:
                    print(f"✅ {iqr_time:.1f}ms ({iqr_count} outliers)")
                    result["operations"]["outlier_iqr"] = {
                        "time_ms": round(iqr_time, 1),
                        "outliers": iqr_count,
                    }

                # Isolation Forest (ML-based)
                if HAS_SKLEARN:
                    print("  🌲 Outlier (Isolation Forest)...", end=" ", flush=True)
                    if_time, if_count, if_err = benchmark_function(
                        detect_outliers_isolation_forest, df, num_cols[0]
                    )
                    if if_time:
                        print(f"✅ {if_time:.1f}ms ({if_count} outliers)")
                        result["operations"]["outlier_isolation_forest"] = {
                            "time_ms": round(if_time, 1),
                            "outliers": if_count,
                        }
                    else:
                        print(f"⚠️  Skipped ({if_err})")

            # Missing Value Imputation
            missing_counts = df.isnull().sum()
            if missing_counts.sum() > 0 and len(num_cols) >= 1:
                col_with_missing = missing_counts[missing_counts > 0].index[0]

                print(f"  🔧 Missing Value Imputation (Mean)...", end=" ", flush=True)
                impute_time, _, _ = benchmark_function(
                    impute_missing_mean, df.copy(), col_with_missing
                )
                if impute_time:
                    print(f"✅ {impute_time:.1f}ms")
                    result["operations"]["impute_mean"] = {
                        "time_ms": round(impute_time, 1)
                    }

                print(f"  🔧 Missing Value Imputation (Median)...", end=" ", flush=True)
                impute_time, _, _ = benchmark_function(
                    impute_missing_median, df.copy(), col_with_missing
                )
                if impute_time:
                    print(f"✅ {impute_time:.1f}ms")
                    result["operations"]["impute_median"] = {
                        "time_ms": round(impute_time, 1)
                    }

                print(f"  🔧 Missing Value Imputation (Mode)...", end=" ", flush=True)
                impute_time, _, _ = benchmark_function(
                    impute_missing_mode, df.copy(), col_with_missing
                )
                if impute_time:
                    print(f"✅ {impute_time:.1f}ms")
                    result["operations"]["impute_mode"] = {
                        "time_ms": round(impute_time, 1)
                    }

            # Duplicate Removal
            print("  🔄 Duplicate Removal...", end=" ", flush=True)
            dup_time, dup_result, _ = benchmark_function(drop_duplicates, df)
            if dup_time:
                dup_count = len(df) - len(dup_result)
                print(f"✅ {dup_time:.1f}ms ({dup_count} duplicates removed)")
                result["operations"]["remove_duplicates"] = {
                    "time_ms": round(dup_time, 1),
                    "removed": dup_count,
                }

            # Column Drop
            if len(cols) >= 2:
                print("  🗑️  Column Drop...", end=" ", flush=True)
                drop_time, _, _ = benchmark_function(drop_columns, df.copy(), [cols[0]])
                if drop_time:
                    print(f"✅ {drop_time:.1f}ms")
                    result["operations"]["drop_column"] = {
                        "time_ms": round(drop_time, 1)
                    }

            # Encoding
            if len(cat_cols) >= 1:
                print("  🔤 Label Encoding...", end=" ", flush=True)
                encode_time, _, _ = benchmark_function(
                    label_encode, df.copy(), cat_cols[0]
                )
                if encode_time:
                    print(f"✅ {encode_time:.1f}ms")
                    result["operations"]["label_encode"] = {
                        "time_ms": round(encode_time, 1)
                    }

                print("  🔤 One-Hot Encoding...", end=" ", flush=True)
                ohe_time, _, _ = benchmark_function(
                    one_hot_encode, df.copy(), cat_cols[0]
                )
                if ohe_time:
                    print(f"✅ {ohe_time:.1f}ms")
                    result["operations"]["one_hot_encode"] = {
                        "time_ms": round(ohe_time, 1)
                    }

            # Skewness & Kurtosis
            if len(num_cols) >= 1:
                print("  📐 Skewness...", end=" ", flush=True)
                skew_time, skew_val, _ = benchmark_function(
                    calculate_skewness, df, num_cols[0]
                )
                if skew_time:
                    print(f"✅ {skew_time:.1f}ms (skew={skew_val:.3f})")
                    result["operations"]["skewness"] = {"time_ms": round(skew_time, 1)}

                print("  📐 Kurtosis...", end=" ", flush=True)
                kurt_time, kurt_val, _ = benchmark_function(
                    calculate_kurtosis, df, num_cols[0]
                )
                if kurt_time:
                    print(f"✅ {kurt_time:.1f}ms (kurtosis={kurt_val:.3f})")
                    result["operations"]["kurtosis"] = {"time_ms": round(kurt_time, 1)}

            # Plot generation (simulate)
            if len(num_cols) >= 2:
                print("  📊 Scatter Plot Data...", end=" ", flush=True)
                plot_time, plot_data, _ = benchmark_function(
                    generate_plot_data, df, num_cols[0], num_cols[1], "scatter"
                )
                if plot_time:
                    print(f"✅ {plot_time:.1f}ms ({plot_data} points)")
                    result["operations"]["plot_scatter"] = {
                        "time_ms": round(plot_time, 1),
                        "points": plot_data,
                    }

                print("  📊 Histogram Data...", end=" ", flush=True)
                plot_time, plot_data, _ = benchmark_function(
                    generate_plot_data, df, num_cols[0], None, "histogram"
                )
                if plot_time:
                    print(f"✅ {plot_time:.1f}ms ({plot_data} points)")
                    result["operations"]["plot_histogram"] = {
                        "time_ms": round(plot_time, 1),
                        "points": plot_data,
                    }

                if len(cat_cols) >= 1:
                    print("  📊 Box Plot Data...", end=" ", flush=True)
                    plot_time, plot_data, _ = benchmark_function(
                        generate_plot_data, df, cat_cols[0], num_cols[0], "box"
                    )
                    if plot_time:
                        print(f"✅ {plot_time:.1f}ms ({plot_data} points)")
                        result["operations"]["plot_box"] = {
                            "time_ms": round(plot_time, 1),
                            "points": plot_data,
                        }

        results["tests"].append(result)

    return results


def print_summary(results):
    """Print benchmark summary"""
    print("\n" + "=" * 70)
    print("📊 BENCHMARK SUMMARY")
    print("=" * 70)

    # Collect all operation times
    all_ops = {}
    for test in results["tests"]:
        for op, data in test["operations"].items():
            if op not in all_ops:
                all_ops[op] = []
            all_ops[op].append(
                {
                    "dataset": test["dataset"],
                    "rows": test["rows"],
                    "time": data["time_ms"],
                }
            )

    print("\n📈 Operation Times by Dataset Size:")
    print("-" * 70)
    print(f"{'Operation':<35} {'<1K rows':<12} {'1K-10K':<12} {'>10K':<12}")
    print("-" * 70)

    for op, data in sorted(all_ops.items()):
        small = next((d["time"] for d in data if d["rows"] < 1000), None)
        medium = next((d["time"] for d in data if 1000 <= d["rows"] < 10000), None)
        large = next((d["time"] for d in data if d["rows"] >= 10000), None)

        small_str = f"{small:.1f}ms" if small else "N/A"
        medium_str = f"{medium:.1f}ms" if medium else "N/A"
        large_str = f"{large:.1f}ms" if large else "N/A"

        print(f"{op:<35} {small_str:<12} {medium_str:<12} {large_str:<12}")

    print("\n" + "=" * 70)
    print("🎯 KEY METRICS FOR RESUME")
    print("=" * 70)

    # Find best metrics
    if "load_csv" in all_ops:
        loads = all_ops["load_csv"]
        total_rows = sum(d["rows"] for d in loads)
        total_time = sum(d["time"] for d in loads)
        throughput = total_rows / (total_time / 1000) if total_time > 0 else 0
        print(f"\n• CSV Loading Throughput: {throughput:,.0f} rows/second")

        largest = max(loads, key=lambda x: x["rows"])
        print(
            f"• Large file ({largest['rows']:,} rows) load time: {largest['time']:.1f}ms"
        )

    if "statistics" in all_ops:
        stats = all_ops["statistics"]
        avg_stats = sum(d["time"] for d in stats) / len(stats)
        print(f"• Average statistics calculation: {avg_stats:.1f}ms")

    if "correlation" in all_ops:
        corrs = all_ops["correlation"]
        avg_corr = sum(d["time"] for d in corrs) / len(corrs)
        print(f"• Average correlation matrix: {avg_corr:.1f}ms")

    if "outlier_zscore" in all_ops:
        outliers = all_ops["outlier_zscore"]
        for o in outliers:
            print(
                f"• Z-Score outlier detection ({o['dataset']}, {o['rows']:,} rows): {o['time']:.1f}ms"
            )

    if "outlier_isolation_forest" in all_ops:
        outliers = all_ops["outlier_isolation_forest"]
        for o in outliers:
            print(
                f"• ML-based outlier detection (Isolation Forest, {o['rows']:,} rows): {o['time']:.1f}ms"
            )

    if "impute_mean" in all_ops:
        imputes = all_ops["impute_mean"]
        avg_impute = sum(d["time"] for d in imputes) / len(imputes)
        print(f"• Average missing value imputation: {avg_impute:.1f}ms")

    if "remove_duplicates" in all_ops:
        dups = all_ops["remove_duplicates"]
        for d in dups:
            if d["time"]:
                print(
                    f"• Duplicate removal ({d['dataset']}, {d['rows']:,} rows): {d['time']:.1f}ms"
                )

    if "label_encode" in all_ops:
        encodes = all_ops["label_encode"]
        avg_encode = sum(d["time"] for d in encodes) / len(encodes)
        print(f"• Average label encoding: {avg_encode:.1f}ms")

    if "plot_scatter" in all_ops:
        plots = all_ops["plot_scatter"]
        avg_plot = sum(d["time"] for d in plots) / len(plots)
        max_points = max(d.get("points", 0) for d in plots)
        print(
            f"• Average plot data preparation: {avg_plot:.1f}ms (up to {max_points:,} points)"
        )

    print("\n" + "=" * 70)


if __name__ == "__main__":
    results = run_benchmarks()
    print_summary(results)

    # Save results
    with open("benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\n✅ Results saved to benchmark_results.json")
