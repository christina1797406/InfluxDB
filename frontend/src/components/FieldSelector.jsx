import { useState, useEffect } from "react";

export default function FieldSelector({ bucket, measurement }) {
    // variables search, fields, and filtered fields
    const [search, setSearch] = useState("");
    const [fields, setFields] = useState([]);
    const filteredFields = fields.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    // Fetch fields when bucket or (doesn't work) -> measurement changes
    useEffect(() => {
        // Function to fetch fields from backend (Seems to be working)
        const fetchFields = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/influx/fields/${bucket}/${measurement}`);
                const data = await response.json();
                setFields(data);
            } catch (error) {
                console.error('Error fetching fields:', error);
            }
        };

        if (bucket && measurement) {
            fetchFields();
        }
    }, [bucket, measurement]);

    return (
        <div className="card">
            <div className="card-title">Available Fields & Tags</div>
            <div className="form-group">
                <input type="text"
                    className="search-box"
                    placeholder="Search fields and tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="available-fields">
                {filteredFields.map((field, index) => (
                    <div key={index} className="field-item" draggable="true">
                        <span className={`field-type ${field.type === "TAG" ? "tag" : ""}`}>
                            {field.type}
                        </span>
                        <span>{field.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}