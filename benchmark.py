"""
Benchmark Script for Data Wash Application
Tests various API endpoints with different dataset sizes
"""

import requests
import time
import json
import os
from datetime import datetime

BASE_URL = "http://localhost:5001/api"

DATASETS = [
    {"name": "diabetes.csv", "size": "23KB", "rows": 767},
    {"name": "Titanic-Dataset.csv", "size": "59KB", "rows": 891},
    {"name": "users.csv", "size": "604KB", "rows": 10000},
    {"name": "emails.csv", "size": "8.6MB", "rows": 5728},
    {"name": "ncr_ride_bookings.csv", "size": "25MB", "rows": 150000},
]


def upload_file(filename):
    """Upload a file and return upload time"""
    filepath = f"uploads/{filename}"
    if not os.path.exists(filepath):
        filepath = f"backend/uploads/{filename}"

    with open(filepath, "rb") as f:
        files = {"file": (filename, f)}
        start = time.time()
        response = requests.post(f"{BASE_URL}/upload", files=files)
        upload_time = time.time() - start

        if response.status_code == 200:
            return upload_time, response.json()
        else:
            print(f"  ❌ Upload failed: {response.text}")
            return None, None


def test_preview():
    """Test preview endpoint"""
    start = time.time()
    response = requests.get(f"{BASE_URL}/preview")
    preview_time = time.time() - start

    if response.status_code == 200:
        return preview_time, response.json()
    return None, None


def test_data():
    """Test full data retrieval"""
    start = time.time()
    response = requests.get(f"{BASE_URL}/data")
    data_time = time.time() - start

    if response.status_code == 200:
        return data_time, response.json()
    return None, None


def test_info():
    """Test data info/statistics"""
    start = time.time()
    response = requests.get(f"{BASE_URL}/info")
    info_time = time.time() - start

    if response.status_code == 200:
        return info_time, response.json()
    return None, None


def test_correlation():
    """Test correlation matrix"""
    start = time.time()
    response = requests.get(f"{BASE_URL}/correlation")
    corr_time = time.time() - start

    if response.status_code == 200:
        return corr_time, response.json()
    return None, None


def test_plot(x_col, y_col, plot_type):
    """Test plot generation"""
    start = time.time()
    response = requests.post(
        f"{BASE_URL}/plot",
        json={"x_axis": x_col, "y_axis": y_col, "plot_type": plot_type},
    )
    plot_time = time.time() - start

    if response.status_code == 200:
        return plot_time, response.json()
    return None, None


def test_drop_columns(columns):
    """Test column dropping"""
    start = time.time()
    response = requests.post(f"{BASE_URL}/drop-columns", json={"columns": columns})
    drop_time = time.time() - start

    if response.status_code == 200:
        return drop_time, response.json()
    return None, None


def test_impute_missing(column, method, value=None):
    """Test missing value imputation"""
    payload = {"rules": [{"column": column, "method": method}]}
    if value:
        payload["rules"][0]["value"] = value

    start = time.time()
    response = requests.post(f"{BASE_URL}/impute-missing", json=payload)
    impute_time = time.time() - start

    if response.status_code == 200:
        return impute_time, response.json()
    return None, None


def test_remove_duplicates():
    """Test duplicate removal"""
    start = time.time()
    response = requests.post(f"{BASE_URL}/remove-duplicates")
    dup_time = time.time() - start

    if response.status_code == 200:
        return dup_time, response.json()
    return None, None


def test_detect_outliers():
    """Test outlier detection"""
    start = time.time()
    response = requests.post(f"{BASE_URL}/detect-outliers", json={"columns": []})
    outlier_time = time.time() - start

    if response.status_code == 200:
        return outlier_time, response.json()
    return None, None


def test_encoding(column, method):
    """Test data encoding"""
    start = time.time()
    response = requests.post(
        f"{BASE_URL}/encode-column", json={"column": column, "method": method}
    )
    encode_time = time.time() - start

    if response.status_code == 200:
        return encode_time, response.json()
    return None, None


def run_benchmarks():
    """Run all benchmarks"""
    results = {"timestamp": datetime.now().isoformat(), "tests": []}

    print("=" * 70)
    print("🚀 DATA WASH BENCHMARK TEST")
    print("=" * 70)

    for dataset in DATASETS:
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

        # Upload
        print("  📤 Upload...", end=" ", flush=True)
        upload_time, data = upload_file(dataset["name"])
        if upload_time:
            print(f"✅ {upload_time * 1000:.1f}ms")
            result["operations"]["upload"] = {
                "time_ms": round(upload_time * 1000, 1),
                "rows": data.get("shape", [0, 0])[0] if data else 0,
                "columns": data.get("shape", [0, 0])[1] if data else 0,
            }

            # Preview
            print("  👁️  Preview (first 5 rows)...", end=" ", flush=True)
            preview_time, _ = test_preview()
            if preview_time:
                print(f"✅ {preview_time * 1000:.1f}ms")
                result["operations"]["preview"] = {
                    "time_ms": round(preview_time * 1000, 1)
                }

            # Data Info
            print("  📈 Data Info/Statistics...", end=" ", flush=True)
            info_time, info_data = test_info()
            if info_time:
                print(f"✅ {info_time * 1000:.1f}ms")
                result["operations"]["data_info"] = {
                    "time_ms": round(info_time * 1000, 1),
                    "numeric_cols": len(info_data.get("numeric_columns", []))
                    if info_data
                    else 0,
                    "categorical_cols": len(info_data.get("categorical_columns", []))
                    if info_data
                    else 0,
                }

            # Only test full data for smaller datasets (too slow for large)
            if dataset["rows"] <= 10000:
                print("  📋 Full Data Retrieval...", end=" ", flush=True)
                data_time, _ = test_data()
                if data_time:
                    print(f"✅ {data_time * 1000:.1f}ms")
                    result["operations"]["full_data"] = {
                        "time_ms": round(data_time * 1000, 1)
                    }

            # Correlation (only for datasets with numeric columns)
            if info_data and len(info_data.get("numeric_columns", [])) >= 2:
                print("  🔗 Correlation Matrix...", end=" ", flush=True)
                corr_time, _ = test_correlation()
                if corr_time:
                    print(f"✅ {corr_time * 1000:.1f}ms")
                    result["operations"]["correlation"] = {
                        "time_ms": round(corr_time * 1000, 1)
                    }

            # Plot generation (test different types)
            if info_data and len(info_data.get("numeric_columns", [])) >= 2:
                num_cols = info_data.get("numeric_columns", [])
                cat_cols = info_data.get("categorical_columns", [])

                # Scatter plot
                print("  📊 Scatter Plot...", end=" ", flush=True)
                plot_time, _ = test_plot(num_cols[0], num_cols[1], "scatter")
                if plot_time:
                    print(f"✅ {plot_time * 1000:.1f}ms")
                    result["operations"]["plot_scatter"] = {
                        "time_ms": round(plot_time * 1000, 1)
                    }

                # Histogram
                print("  📊 Histogram...", end=" ", flush=True)
                plot_time, _ = test_plot(num_cols[0], None, "histogram")
                if plot_time:
                    print(f"✅ {plot_time * 1000:.1f}ms")
                    result["operations"]["plot_histogram"] = {
                        "time_ms": round(plot_time * 1000, 1)
                    }

                # Box plot
                if cat_cols and len(num_cols) >= 1:
                    print("  📊 Box Plot...", end=" ", flush=True)
                    plot_time, _ = test_plot(cat_cols[0], num_cols[0], "box")
                    if plot_time:
                        print(f"✅ {plot_time * 1000:.1f}ms")
                        result["operations"]["plot_box"] = {
                            "time_ms": round(plot_time * 1000, 1)
                        }

            # Duplicate removal
            print("  🔄 Duplicate Removal...", end=" ", flush=True)
            dup_time, _ = test_remove_duplicates()
            if dup_time:
                print(f"✅ {dup_time * 1000:.1f}ms")
                result["operations"]["remove_duplicates"] = {
                    "time_ms": round(dup_time * 1000, 1)
                }

            # Outlier detection
            if info_data and len(info_data.get("numeric_columns", [])) >= 1:
                print("  🎯 Outlier Detection...", end=" ", flush=True)
                outlier_time, outlier_data = test_detect_outliers()
                if outlier_time:
                    print(f"✅ {outlier_time * 1000:.1f}ms")
                    result["operations"]["outlier_detection"] = {
                        "time_ms": round(outlier_time * 1000, 1),
                        "columns_tested": len(outlier_data) if outlier_data else 0,
                    }

            # Column drop (for medium+ datasets)
            if info_data and len(info_data.get("columns", [])) >= 2:
                print("  🗑️  Column Drop...", end=" ", flush=True)
                col_to_drop = info_data["columns"][0]
                drop_time, _ = test_drop_columns([col_to_drop])
                if drop_time:
                    print(f"✅ {drop_time * 1000:.1f}ms")
                    result["operations"]["drop_column"] = {
                        "time_ms": round(drop_time * 1000, 1)
                    }

            # Missing value imputation
            if info_data and len(info_data.get("numeric_columns", [])) >= 1:
                print("  🔧 Missing Value Imputation (mean)...", end=" ", flush=True)
                impute_time, _ = test_impute_missing(
                    info_data["numeric_columns"][0], "mean"
                )
                if impute_time:
                    print(f"✅ {impute_time * 1000:.1f}ms")
                    result["operations"]["impute_missing"] = {
                        "time_ms": round(impute_time * 1000, 1)
                    }

            # Encoding (if categorical columns exist)
            if info_data and len(info_data.get("categorical_columns", [])) >= 1:
                print("  🔤 Label Encoding...", end=" ", flush=True)
                encode_time, _ = test_encoding(
                    info_data["categorical_columns"][0], "label"
                )
                if encode_time:
                    print(f"✅ {encode_time * 1000:.1f}ms")
                    result["operations"]["encoding"] = {
                        "time_ms": round(encode_time * 1000, 1)
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
    print(
        f"{'Operation':<30} {'Small (<1K)':<15} {'Medium (1K-10K)':<18} {'Large (10K+)':<15}"
    )
    print("-" * 70)

    for op, data in all_ops.items():
        small = next((d["time"] for d in data if d["rows"] < 1000), "N/A")
        medium = next((d["time"] for d in data if 1000 <= d["rows"] < 10000), "N/A")
        large = next((d["time"] for d in data if d["rows"] >= 10000), "N/A")

        small_str = f"{small}ms" if isinstance(small, (int, float)) else small
        medium_str = f"{medium}ms" if isinstance(medium, (int, float)) else medium
        large_str = f"{large}ms" if isinstance(large, (int, float)) else large

        print(f"{op:<30} {small_str:<15} {medium_str:<18} {large_str:<15}")

    print("\n" + "=" * 70)
    print("🎯 KEY METRICS FOR RESUME")
    print("=" * 70)

    # Find best metrics
    if "upload" in all_ops:
        uploads = all_ops["upload"]
        fastest_upload = min(uploads, key=lambda x: x["time"])
        print(
            f"\n• Fastest file upload: {fastest_upload['time']}ms ({fastest_upload['dataset']}, {fastest_upload['rows']} rows)"
        )

    if "preview" in all_ops:
        previews = all_ops["preview"]
        avg_preview = sum(d["time"] for d in previews) / len(previews)
        print(f"• Average preview generation: {avg_preview:.1f}ms")

    if "correlation" in all_ops:
        corrs = all_ops["correlation"]
        avg_corr = sum(d["time"] for d in corrs) / len(corrs)
        print(f"• Average correlation matrix: {avg_corr:.1f}ms")

    if "plot_scatter" in all_ops:
        plots = all_ops["plot_scatter"]
        avg_plot = sum(d["time"] for d in plots) / len(plots)
        print(f"• Average plot generation: {avg_plot:.1f}ms")

    if "outlier_detection" in all_ops:
        outliers = all_ops["outlier_detection"]
        for o in outliers:
            print(
                f"• Outlier detection ({o['dataset']}, {o['rows']} rows): {o['time']}ms ({o.get('columns_tested', 0)} columns)"
            )

    if "impute_missing" in all_ops:
        imputes = all_ops["impute_missing"]
        avg_impute = sum(d["time"] for d in imputes) / len(imputes)
        print(f"• Average missing value imputation: {avg_impute:.1f}ms")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    print("Waiting for server to be ready...")

    # Wait for server
    max_attempts = 10
    for i in range(max_attempts):
        try:
            response = requests.get(f"{BASE_URL}/preview", timeout=2)
            if response.status_code == 400:  # No data uploaded yet - expected
                print("✅ Server is ready!")
                break
        except:
            pass
        time.sleep(1)
    else:
        print("❌ Server not responding. Make sure Flask is running on port 5001")
        exit(1)

    results = run_benchmarks()
    print_summary(results)

    # Save results
    with open("benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\n✅ Results saved to benchmark_results.json")
