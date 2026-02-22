import { useRef, useState, useEffect, useCallback } from "react";
import type { UploadTask } from "../hooks/useStorage";

interface Props {
  uploads: UploadTask[];
  onUpload: (files: File[]) => void;
  onClear: () => void;
}

export default function UploadZone({ uploads, onUpload, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fadingIndices, setFadingIndices] = useState<Set<number>>(new Set());
  const [hiddenIndices, setHiddenIndices] = useState<Set<number>>(new Set());
  const scheduledRef = useRef<Set<number>>(new Set());

  // Resets all local fade state and calls the parent clear
  const handleClear = useCallback(() => {
    setFadingIndices(new Set());
    setHiddenIndices(new Set());
    scheduledRef.current.clear();
    onClear();
  }, [onClear]);

  // Schedule fade-out for each successfully completed upload
  useEffect(() => {
    uploads.forEach((u, i) => {
      if (u.done && !u.error && !scheduledRef.current.has(i)) {
        scheduledRef.current.add(i);

        const fadeTimer = setTimeout(() => {
          setFadingIndices((prev) => new Set(prev).add(i));

          setTimeout(() => {
            setHiddenIndices((prev) => {
              const next = new Set(prev).add(i);
              const allDoneHidden = uploads
                .map((u2, j) => ({ u2, j }))
                .filter(({ u2 }) => u2.done && !u2.error)
                .every(({ j }) => next.has(j));
              if (allDoneHidden) {
                setTimeout(handleClear, 0);
              }
              return next;
            });
          }, 500);
        }, 2000);

        return () => clearTimeout(fadeTimer);
      }
    });
  }, [uploads, handleClear]);

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

  const visibleUploads = uploads
    .map((u, i) => ({ u, i }))
    .filter(({ i }) => !hiddenIndices.has(i));

  const hasActiveUploads = visibleUploads.some(({ u }) => !u.done);
  const hasErrors = visibleUploads.some(({ u }) => u.done && u.error);

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

      {visibleUploads.length > 0 && (
        <div className="flex flex-col gap-2">
          {visibleUploads.map(({ u, i }) => (
            <div
              key={i}
              className="flex items-center gap-3 text-sm transition-opacity duration-500"
              style={{ opacity: fadingIndices.has(i) ? 0 : 1 }}
            >
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
          {/* Only show Clear for errored uploads that won't auto-dismiss */}
          {!hasActiveUploads && hasErrors && (
            <button
              onClick={handleClear}
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
