interface StatBarProps {
  label: string;
  value: number;
}

export function StatBar({ label, value }: StatBarProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-text-muted w-6">{label}</span>
      <div className="w-12 h-1.5 bg-hover rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-text-muted">{value}</span>
    </div>
  );
}
