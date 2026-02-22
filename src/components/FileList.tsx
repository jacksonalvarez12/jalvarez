import type { StorageItem } from "../hooks/useStorage";
import FileItem from "./FileItem";

interface Props {
  items: StorageItem[];
  loading: boolean;
  onNavigate: (path: string) => void;
  onDelete: (fullPath: string) => void;
}

export default function FileList({
  items,
  loading,
  onNavigate,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-2">
        <span className="text-4xl">📭</span>
        <p className="text-sm">This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Modified
            </th>
            <th className="py-2 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <FileItem
              key={item.fullPath}
              item={item}
              onNavigate={onNavigate}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
