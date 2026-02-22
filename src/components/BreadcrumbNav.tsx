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
        className="shrink-0 cursor-pointer hover:text-white transition-colors"
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
                className="cursor-pointer hover:text-white transition-colors"
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
