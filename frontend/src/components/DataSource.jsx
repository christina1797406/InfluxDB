import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function DataSource({ onBucketSelect, onMeasurementSelect, selectedBucket: propBucket, selectedMeasurement: propMeasurement }) {
    // variables for buckets, measurements, selected values, and error handling
    const [buckets, setBuckets] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [selectedBucket, setSelectedBucket] = useState("");
    const [selectedMeasurement, setSelectedMeasurement] = useState("");
    const [error, setError] = useState(null);

    // sync from props (so loading a saved query shows in the UI and triggers fetches)
    useEffect(() => {
        if (propBucket !== undefined) setSelectedBucket(propBucket || "");
    }, [propBucket]);
    useEffect(() => {
        if (propMeasurement !== undefined) setSelectedMeasurement(propMeasurement || "");
    }, [propMeasurement]);

    // Fetch buckets on component mount
    useEffect(() => {
        fetchBuckets();
    }, []);

    // Fetch measurements when selectedBucket changes
    useEffect(() => {
        if (selectedBucket) {
            fetchMeasurements(selectedBucket);
        } else {
            setMeasurements([]);
            setSelectedMeasurement("");
        }
    }, [selectedBucket]);

    // Function to fetch buckets from backend
    const fetchBuckets = async () => {
        try {
            const response = await fetchWithAuth("http://localhost:5001/api/influx/buckets");
            const data = await response.json();
            console.log("Buckets API response: ", data);
            setBuckets(data || []);

        } catch (error) {
            console.error("Error fetching buckets:", error);
            setError("Failed to fetch buckets");
        }
    };

    // fetch the measurements based on selected bucket
    const fetchMeasurements = async (bucket) => {
        try {
            const response = await fetchWithAuth(`http://localhost:5001/api/influx/measurements/${bucket}`);
            const data = await response.json();
            setMeasurements(data.measurements || []);
        } catch (error) {
            console.error("Error fetching measurements:", error);
            setError("Failed to fetch measurements");
        }
    };

    // error msg display
    if (error) {
        return <div className="error-message">{error}</div>;
    }

    // main return with dropdowns for bucket and measurement selection
    return (
        <div className="card data-source-card">
            <div className="card-title">Data Source</div>
            <div className="form-group">
                <label>Bucket</label>
                <select
                    value={selectedBucket}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBucket(val);
                        onBucketSelect && onBucketSelect(val);
                        setSelectedMeasurement(""); // Reset measurement when bucket changes
                    }}
                >
                    <option value="">Select a bucket</option>
                    {buckets.map((bucket) => (
                        <option key={bucket.id} value={bucket.name}>
                            {bucket.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Measurement</label>
                <select
                    value={selectedMeasurement}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedMeasurement(val);
                        onMeasurementSelect && onMeasurementSelect(val);
                    }}
                    disabled={!selectedBucket}
                >
                    <option value="">Select a measurement</option>
                    {measurements.map((measurement) => (
                        <option key={measurement.id} value={measurement.name}>
                            {measurement.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}