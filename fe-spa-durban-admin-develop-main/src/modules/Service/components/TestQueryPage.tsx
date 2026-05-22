import React, { useMemo, useState, useCallback } from "react";
import axios from "axios";

// =========================================================
// TYPES
// =========================================================

type Condition = {
    id: string;
    type: "condition";
    field: string;
    operator: string;
    value: string;
};

type Group = {
    id: string;
    type: "group";
    combinator: "AND" | "OR";
    children: Array<Group | Condition>;
};

type TableSchema = {
    value: string;
    label: string;
    alias: string;
    fields: Array<{ label: string; value: string }>;
};

// =========================================================
// TABLE CONFIG
// =========================================================

const AVAILABLE_TABLES: TableSchema[] = [
    {
        value: `public."Bookings"`,
        label: "📅 Bookings",
        alias: "b",
        fields: [
            { label: "Booking ID", value: "id" },
            { label: "Booking Number", value: "bookingNumber" },
            { label: "Invoice Number", value: "invoiceNumber" },
            { label: "Duration", value: "duration" },
            { label: "Booking Date Time", value: "bookingDateTimeStamp" },
            { label: "Start Time", value: "startTime" },
            { label: "End Time", value: "endTime" },
            { label: "Created At", value: "createdAt" },
        ],
    },
    {
        value: `public."Customers"`,
        label: "👥 Customers",
        alias: "c",
        fields: [
            { label: "Customer ID", value: "id" },
            { label: "First Name", value: "firstName" },
            { label: "Last Name", value: "lastName" },
            { label: "Email", value: "email" },
            { label: "Mobile", value: "mobile" },
            { label: "Created At", value: "createdAt" },
        ],
    },
    {
        value: `public."Stores"`,
        label: "🏪 Stores",
        alias: "s",
        fields: [
            { label: "Store ID", value: "id" },
            { label: "Store Name", value: "name" },
            { label: "Address", value: "address" },
            { label: "Phone", value: "phone" },
            { label: "Email", value: "email" },
        ],
    },
    {
        value: `public."Treatments"`,
        label: "💆 Treatments",
        alias: "t",
        fields: [
            { label: "Treatment ID", value: "id" },
            { label: "Treatment Name", value: "name" },
            { label: "Price", value: "price" },
            { label: "Duration Mins", value: "durationMinutes" },
            { label: "Description", value: "description" },
        ],
    },
];

// =========================================================
// OPERATORS
// =========================================================

const OPERATOR_OPTIONS = [
    { label: "Equals (=)", value: "=" },
    { label: "Not Equals (!=)", value: "!=" },
    { label: "Contains (ILIKE)", value: "ILIKE" },
    { label: "Starts With", value: "STARTS_WITH" },
    { label: "Ends With", value: "ENDS_WITH" },
    { label: "Greater Than (>)", value: ">" },
    { label: "Less Than (<)", value: "<" },
    { label: "Greater or Equal (>=)", value: ">=" },
    { label: "Less or Equal (<=)", value: "<=" },
    { label: "In (comma separated)", value: "IN" },
];

// =========================================================
// HELPERS
// =========================================================

const generateId = () => Math.random().toString(36).substring(2) + Date.now();

const createCondition = (field = "id"): Condition => ({
    id: generateId(),
    type: "condition",
    field,
    operator: "=",
    value: "",
});

const createGroup = (): Group => ({
    id: generateId(),
    type: "group",
    combinator: "AND",
    children: [createCondition()],
});

// =========================================================
// SQL SAFE ESCAPE
// =========================================================

const escapeSQL = (val: string) =>
    val.replace(/'/g, "''").replace(/\\/g, "\\\\");

// =========================================================
// SQL GENERATION
// =========================================================

const generateConditionSQL = (
    condition: Condition,
    alias: string
): string => {
    const value = condition.value.trim();
    const field = `${alias}."${condition.field}"`;

    if (!value) return "1=1";

    switch (condition.operator) {
        case "ILIKE":
            return `${field} ILIKE '%${escapeSQL(value)}%'`;
        case "STARTS_WITH":
            return `${field} ILIKE '${escapeSQL(value)}%'`;
        case "ENDS_WITH":
            return `${field} ILIKE '%${escapeSQL(value)}'`;
        case "IN":
            return `${field} IN (${value
                .split(",")
                .map((v) => `'${escapeSQL(v.trim())}'`)
                .join(", ")})`;
        default:
            return `${field} ${condition.operator} '${escapeSQL(value)}'`;
    }
};

const generateGroupSQL = (group: Group, alias: string): string => {
    const parts = group.children
        .map((child) => {
            if (child.type === "condition") {
                return generateConditionSQL(child, alias);
            }
            return generateGroupSQL(child, alias);
        })
        .filter(sql => sql !== "1=1");

    if (parts.length === 0) return "1=1";
    if (parts.length === 1) return parts[0];
    return `(${parts.join(` ${group.combinator} `)})`;
};

const generateFullSQL = (
    table: TableSchema,
    group: Group,
    limit: number
): string => {
    const where = generateGroupSQL(group, table.alias);
    const hasWhere = where !== "1=1";

    return `SELECT * FROM ${table.value} ${table.alias}
${hasWhere ? `WHERE ${where}` : ""}
LIMIT ${limit};`;
};

// =========================================================
// COMPONENT
// =========================================================

const QueryBuilder: React.FC = () => {
    const [selectedTable, setSelectedTable] = useState(AVAILABLE_TABLES[0]);
    const [limit, setLimit] = useState(100);
    const [group, setGroup] = useState<Group>(createGroup());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>({ data: [] });

    const currentFields = selectedTable.fields;

    const sql = useMemo(() => {
        return generateFullSQL(selectedTable, group, limit);
    }, [selectedTable, group, limit]);

    const queryResult = useMemo(() => {
        if (Array.isArray(result?.data)) return result.data;
        if (result?.data?.data && Array.isArray(result.data.data)) return result.data.data;
        return [];
    }, [result]);

    // =========================================================
    // API CALL
    // =========================================================

    const runQuery = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const res = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/new/query-builder/run`,
                { query: sql }
            );
            setResult(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || "Query failed");
        } finally {
            setLoading(false);
        }
    }, [sql]);

    const copySQL = async () => {
        await navigator.clipboard.writeText(sql);
        alert("SQL copied to clipboard!");
    };

    const exportCSV = () => {
        if (!queryResult.length) return;
        
        const headers = Object.keys(queryResult[0]);
        const csvRows = [
            headers.join(","),
            ...queryResult.map((row: any) =>
                headers.map(header => {
                    const value = row[header] ?? "";
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(",")
            ),
        ];
        
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `query_export_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // =========================================================
    // UPDATE TREE
    // =========================================================

    const updateNode = (node: Group, id: string, cb: any): Group => {
        if (node.id === id) return cb(node);
        return {
            ...node,
            children: node.children.map((c) => {
                if (c.type === "group") return updateNode(c, id, cb);
                if (c.id === id) return cb(c);
                return c;
            }),
        };
    };

    const removeNode = (node: Group, id: string): Group => ({
        ...node,
        children: node.children
            .filter((c) => c.id !== id)
            .map((c) => (c.type === "group" ? removeNode(c, id) : c)),
    });

    const addCondition = (id: string) => {
        setGroup((prev) =>
            updateNode(prev, id, (g: Group) => ({
                ...g,
                children: [...g.children, createCondition(currentFields[0]?.value)],
            }))
        );
    };

    const addGroup = (id: string) => {
        setGroup((prev) =>
            updateNode(prev, id, (g: Group) => ({
                ...g,
                children: [...g.children, createGroup()],
            }))
        );
    };

    const updateCondition = (id: string, updates: Partial<Condition>) => {
        setGroup((prev) =>
            updateNode(prev, id, (c: Condition) => ({ ...c, ...updates }))
        );
    };

    const toggleCombinator = (id: string) => {
        setGroup((prev) =>
            updateNode(prev, id, (g: Group) => ({
                ...g,
                combinator: g.combinator === "AND" ? "OR" : "AND",
            }))
        );
    };

    const deleteNode = (id: string) => {
        setGroup((prev) => removeNode(prev, id));
    };

    // =========================================================
    // RENDER GROUP (WITH STYLES)
    // =========================================================

    const renderGroup = (g: Group, isRoot: boolean = false) => (
        <div key={g.id} className="bg-indigo-50/30 border-2 border-indigo-200 rounded-2xl p-5 mt-4">
            {/* Group Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex rounded-xl overflow-hidden border border-gray-300 shadow-sm">
                    <button
                        onClick={() => toggleCombinator(g.id)}
                        className={`px-5 py-2 font-semibold text-sm transition ${
                            g.combinator === "AND"
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        AND
                    </button>
                    <button
                        onClick={() => toggleCombinator(g.id)}
                        className={`px-5 py-2 font-semibold text-sm transition ${
                            g.combinator === "OR"
                                ? "bg-indigo-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        OR
                    </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => addCondition(g.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm shadow flex items-center gap-1"
                    >
                        <span>+</span> Condition
                    </button>
                    <button
                        onClick={() => addGroup(g.id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm shadow flex items-center gap-1"
                    >
                        <span>📁</span> Group
                    </button>
                    {!isRoot && (
                        <button
                            onClick={() => deleteNode(g.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm shadow"
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>

            {/* Children */}
            <div className="space-y-3">
                {g.children.map((child) =>
                    child.type === "condition" ? (
                        <div key={child.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white border rounded-xl p-3 shadow-sm">
                            <div className="md:col-span-4">
                                <select
                                    value={child.field}
                                    onChange={(e) => updateCondition(child.id, { field: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300"
                                >
                                    {currentFields.map((f) => (
                                        <option key={f.value} value={f.value}>
                                            {f.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-3">
                                <select
                                    value={child.operator}
                                    onChange={(e) => updateCondition(child.id, { operator: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                >
                                    {OPERATOR_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-4">
                                <input
                                    value={child.value}
                                    onChange={(e) => updateCondition(child.id, { value: e.target.value })}
                                    placeholder="Enter value..."
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <button
                                    onClick={() => deleteNode(child.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 text-sm w-full"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ) : (
                        renderGroup(child)
                    )
                )}
            </div>
        </div>
    );

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        🛠️ Dynamic SQL Query Builder
                    </h1>
                    <p className="text-gray-500 mt-2">Select table → Build conditions → Run SQL → Export results</p>
                </div>

                {/* Controls */}
                <div className="grid md:grid-cols-2 gap-5 mb-6">
                    <div className="bg-white rounded-2xl shadow p-5">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">📊 Select Table</label>
                        <select
                            value={selectedTable.value}
                            onChange={(e) => {
                                const table = AVAILABLE_TABLES.find((t) => t.value === e.target.value);
                                if (table) {
                                    setSelectedTable(table);
                                    setGroup(createGroup());
                                }
                            }}
                            className="w-full border rounded-xl px-4 py-3 bg-gray-50 focus:bg-white transition"
                        >
                            {AVAILABLE_TABLES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-white rounded-2xl shadow p-5">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">🔢 Result Limit</label>
                        <input
                            type="number"
                            min={1}
                            max={1000}
                            value={limit}
                            onChange={(e) => setLimit(Math.min(1000, Math.max(1, Number(e.target.value))))}
                            className="w-full border rounded-xl px-4 py-3"
                        />
                    </div>
                </div>

                {/* Query Builder */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">🧩 Condition Builder</h2>
                    {renderGroup(group, true)}
                </div>

                {/* SQL Preview */}
                <div className="bg-gray-900 rounded-2xl shadow-xl p-5 mb-6">
                    <div className="flex justify-between items-center mb-3 flex-wrap gap-3">
                        <h2 className="text-white font-semibold">📝 Generated SQL</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={copySQL}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm"
                            >
                                Copy SQL
                            </button>
                            <button
                                onClick={runQuery}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Running...
                                    </>
                                ) : (
                                    "▶ Run Query"
                                )}
                            </button>
                        </div>
                    </div>
                    <pre className="text-green-400 text-sm overflow-x-auto p-4 bg-gray-950 rounded-xl whitespace-pre-wrap">
                        {sql}
                    </pre>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Results */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-3">
                        <div>
                            <h3 className="font-semibold text-gray-800">📋 Query Results</h3>
                            <p className="text-sm text-gray-500">
                                {loading ? "Loading..." : `Rows: ${queryResult.length}`}
                            </p>
                        </div>
                        <button
                            onClick={exportCSV}
                            disabled={!queryResult.length || loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                        >
                            📥 Export CSV
                        </button>
                    </div>
                    <div className="overflow-auto max-h-[60vh]">
                        {loading ? (
                            <div className="p-12 text-center text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-3"></div>
                                Executing query...
                            </div>
                        ) : queryResult.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">No results. Click "Run Query" to fetch data.</div>
                        ) : (
                            <table className="min-w-full border-collapse text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        {Object.keys(queryResult[0]).map((key) => (
                                            <th key={key} className="border-b px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {queryResult.map((row: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            {Object.keys(queryResult[0]).map((key) => (
                                                <td key={key} className="border-b px-4 py-2 text-gray-600 whitespace-nowrap">
                                                    {typeof row[key] === "object" ? JSON.stringify(row[key]) : String(row[key] ?? "")}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueryBuilder;