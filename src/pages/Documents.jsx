import { useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDocuments } from "../hooks/useDocuments";

const Documents = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const { docs, loading, toggleCheck, uploadDoc } = useDocuments(user?.uid, tripId);
  const fileRefs = useRef({});

  const handleUpload = async (docId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadDoc(docId, file);
  };

  const checked = docs.filter((d) => d.isChecked).length;

  if (loading) return <p className="text-sm text-gray-400">Loading documents...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {checked} of {docs.length} documents ready
        </p>
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-indigo-500 rounded-full transition-all"
            style={{ width: `${docs.length ? (checked / docs.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {docs.map((doc) => (
        <div
          key={doc.id}
          className={`bg-white border rounded-xl px-5 py-4 flex items-center justify-between transition ${
            doc.isChecked ? "border-green-200 bg-green-50" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={doc.isChecked}
              onChange={() => toggleCheck(doc.id, doc.isChecked)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
            <div>
              <p className={`text-sm font-medium ${doc.isChecked ? "line-through text-gray-400" : "text-gray-800"}`}>
                {doc.name}
              </p>
              {doc.fileUrl && (
                <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">
                  View uploaded file
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRefs.current[doc.id]?.click()}
              className="text-xs text-gray-500 border border-gray-300 rounded-lg px-3 py-1 hover:bg-gray-50"
            >
              {doc.fileUrl ? "Replace" : "Upload"}
            </button>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              ref={(el) => (fileRefs.current[doc.id] = el)}
              onChange={(e) => handleUpload(doc.id, e)}
              className="hidden"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Documents;
