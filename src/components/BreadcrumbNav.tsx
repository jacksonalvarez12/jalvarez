interface Props {
  path: string;
  onNavigate: (path: string) => void;
}

export default function BreadcrumbNav({ path, onNavigate }: Props) {
  const segments = path ? path.split("/").filter(Boolean) : [];

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-400 overflow-x-auto">
      <button
        onClick={() => onNavigate("")}
        className="hover:text-white transition-colors shrink-0 cursor-pointer"
      >
        Home
      </button>
      {segments.map((seg, i) => {
        const segPath = segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={segPath} className="flex items-center gap-1 shrink-0">
            <span className="text-gray-600">/</span>
            {isLast ? (
              <span className="text-white">{seg}</span>
            ) : (
              <button
                onClick={() => onNavigate(segPath)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                {seg}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
