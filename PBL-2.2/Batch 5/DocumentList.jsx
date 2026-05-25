import { Download, Eye, FileText, Search } from "lucide-react";
import { fileUrl } from "../services/api";

export default function DocumentList({ documents, search, setSearch }) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search materials" className="w-full bg-transparent text-sm outline-none" />
      </label>
      <div className="grid gap-3">
        {documents.length === 0 && <div className="rounded-lg border border-blue-100 bg-white p-6 text-sm text-gray-500 shadow-sm">No Notes</div>}
        {documents.map((doc) => (
          <div key={doc.id || doc._id} className="flex flex-col justify-between gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-sweety-blush p-2 text-sweety-red"><FileText size={18} /></div>
              <div>
                <h4 className="font-semibold">{doc.title}</h4>
                <p className="text-sm text-gray-500">{doc.type || doc.category} - {doc.branch} Year {doc.year} Section {doc.section}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={fileUrl(doc.file_path || doc.fileUrl)} target="_blank" className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-sweety-red" title="Preview"><Eye size={17} /></a>
              <a href={fileUrl(doc.file_path || doc.fileUrl)} download className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-sweety-red" title="Download"><Download size={17} /></a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
