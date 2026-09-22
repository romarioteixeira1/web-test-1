type Props = {
  items: { label: string; className: string }[]
}

export function ChartLegend({ items }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-text">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-full ${item.className}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
