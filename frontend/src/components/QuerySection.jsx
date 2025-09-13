// imports
import { useState } from "react";
import DataSource from "./DataSource";
import FieldSelector from "./FieldSelector";
import QueryBuilder from "./QueryBuilder";
import SavedQueries from "./SavedQueries";

export default function QuerySection() {
    // variables for selected bucket and measurement
    const [selectedBucket, setSelectedBucket] = useState("");
    const [selectedMeasurement, setSelectedMeasurement] = useState("");

    return (
        // main return with all components
        <div className="query-section">
            <DataSource
                onBucketSelect={setSelectedBucket}
                onMeasurementSelect={setSelectedMeasurement}
            />
            <FieldSelector
                bucket={selectedBucket}
                measurement={selectedMeasurement}
            />
            <QueryBuilder />
            <SavedQueries />
        </div>
    );
}
