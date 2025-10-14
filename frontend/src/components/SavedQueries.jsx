import { useEffect, useMemo, useState } from "react";
import {
    getFolders,
    addFolder, renameFolder, deleteFolder,
    addQuery, updateQuery, deleteQuery
} from "../utils/savedQueriesStore";

export default function SavedQueries({ onLoadQuery }) {
    const [folders, setFoldersState] = useState([]);
    const [openFolders, setOpenFolders] = useState({});
    const [search, setSearch] = useState("");

    useEffect(() => {
        setFoldersState(getFolders());
    }, []);

    const refresh = () => setFoldersState(getFolders());

    const handleAddFolder = () => {
        const name = window.prompt("Folder name:", "New Folder");
        if (name) {
            addFolder(name);
            refresh();
        }
    };

    const handleRenameFolder = (folderId, currentName) => {
        const name = window.prompt("Rename folder:", currentName);
        if (name && name.trim()) {
            renameFolder(folderId, name.trim());
            refresh();
        }
    };

    const handleDeleteFolder = (folderId) => {
        if (window.confirm("Delete this folder and all its queries?")) {
            deleteFolder(folderId);
            refresh();
        }
    };

    const handleRenameQuery = (folderId, q) => {
        const name = window.prompt("Rename query:", q.name);
        if (name && name.trim()) {
            updateQuery(folderId, q.id, { name: name.trim() });
            refresh();
        }
    };

    const handleDeleteQuery = (folderId, q) => {
        if (window.confirm("Delete this query?")) {
            deleteQuery(folderId, q.id);
            refresh();
        }
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return folders;
        const s = search.toLowerCase();
        return folders.map(f => ({
            ...f,
            queries: (f.queries || []).filter(q =>
                q.name.toLowerCase().includes(s) ||
                (q.flux || "").toLowerCase().includes(s)
            )
        }));
    }, [folders, search]);

    // helper for external save from QuerySection via CustomEvent (singleton guard)
    useEffect(() => {
        if (window.__savedQueriesHandlerAdded) return;
        const handler = (e) => {
            const { folderName, query } = e.detail || {};
            if (!query) return;
            let current = getFolders();
            let folder = current.find(f => f.name === folderName);
            if (!folder) {
                addFolder(folderName || "Saved");
                current = getFolders();
                folder = current.find(f => f.name === (folderName || "Saved"));
            }
            addQuery(folder.id, query);
            refresh();
        };
        window.addEventListener("savedQueries:add", handler);
        window.__savedQueriesHandlerAdded = true;
        return () => {
            window.removeEventListener("savedQueries:add", handler);
            window.__savedQueriesHandlerAdded = false;
        };
    }, []);

    return (
        <div className="card saved-queries">
            <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Saved Queries</span>
                <button className="btn btn-xs btn-secondary" onClick={handleAddFolder}>+ Folder</button>
            </div>
            <div className="form-group">
                <input
                    type="text"
                    className="search-box"
                    placeholder="Search saved queries..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <ul className="folder-list">
                {filtered.map((folder) => (
                    <li key={folder.id} className="folder-item">
                        <div
                            className="folder-name"
                            onClick={() => setOpenFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }))}
                        >
                            <span className="folder-title">{openFolders[folder.id] ? "📂" : "📁"} {folder.name}</span>
                            <div className="query-actions">
                                <button
                                    className="query-action-btn"
                                    onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder.id, folder.name); }}
                                >
                                    Rename
                                </button>
                                <button
                                    className="query-action-btn"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {openFolders[folder.id] && (
                            <ul className="sub-folder-list">
                                {(folder.queries || []).length === 0 && (
                                    <li className="sub-folder-item muted">No queries</li>
                                )}
                                {(folder.queries || []).map((q) => (
                                    <li key={q.id} className="sub-folder-item">
                                        <span className="query-name" title={q.name}>{q.name}</span>
                                        <div className="query-actions">
                                            <button
                                                className="query-action-btn"
                                                onClick={() => onLoadQuery && onLoadQuery(q)}
                                            >
                                                Load
                                            </button>
                                            <button
                                                className="query-action-btn"
                                                onClick={() => handleRenameQuery(folder.id, q)}
                                            >
                                                Rename
                                            </button>
                                            <button
                                                className="query-action-btn"
                                                onClick={() => handleDeleteQuery(folder.id, q)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
