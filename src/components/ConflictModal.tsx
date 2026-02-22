interface Props {
  conflicts: string[];
  onReplace: () => void;
  onKeepBoth: () => void;
  onCancel: () => void;
}

export default function ConflictModal({ conflicts, onReplace, onKeepBoth, onCancel }: Props) {
  const single = conflicts.length === 1;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl">
        <div>
          <h2 className="text-white font-semibold text-base">
            {single ? "Item already exists" : `${conflicts.length} items already exist`}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {single
              ? `"${conflicts[0]}" already exists in this location.`
              : "The following items already exist in this location:"}
          </p>
        </div>

        {!single && (
          <ul className="bg-gray-800 rounded-lg px-3 py-2 flex flex-col gap-1 max-h-36 overflow-y-auto">
            {conflicts.map((name) => (
              <li key={name} className="text-gray-300 text-sm truncate">
                {name}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={onReplace}
            className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Replace
          </button>
          <button
            onClick={onKeepBoth}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Keep both
          </button>
          <button
            onClick={onCancel}
            className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
