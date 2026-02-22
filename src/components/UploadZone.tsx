import { useRef, useState } from "react";
import type { UploadTask } from "../hooks/useStorage";

interface Props {
  uploads: UploadTask[];
  onUpload: (files: File[]) => void;
  onClear: () => void;
}

export default function UploadZone({ uploads, onUpload, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onUpload(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onUpload(files);
    e.target.value = "";
  };

  const activeUploads = uploads.filter((u) => !u.done);
  const doneUploads = uploads.filter((u) => u.done);

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-500/10 text-blue-400"
            : "border-gray-700 hover:border-gray-500 text-gray-500 hover:text-gray-400"
        }`}
      >
        <div className="text-2xl mb-1">⬆️</div>
        <p className="text-sm">Drop files here or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {uploads.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-gray-300 truncate flex-1">{u.name}</span>
              {u.error ? (
                <span className="text-red-400 text-xs">{u.error}</span>
              ) : u.done ? (
                <span className="text-green-400">✓</span>
              ) : (
                <div className="w-24 bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
          {activeUploads.length === 0 && doneUploads.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-gray-500 hover:text-gray-300 text-left mt-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
