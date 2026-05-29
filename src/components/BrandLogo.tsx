interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
}

const SIZES = {
  sm: { title: 'text-lg', sub: 'text-[10px]' },
  md: { title: 'text-xl', sub: 'text-xs' },
  lg: { title: 'text-2xl', sub: 'text-sm' },
}

export function BrandLogo({ size = 'md', subtitle = 'Notes reimagined' }: BrandLogoProps) {
  const s = SIZES[size]
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className={`${s.title} font-bold tracking-tight text-forma-accent`} style={{ fontFamily: 'Georgia, serif' }}>
        Forma
      </span>
      {subtitle && (
        <span className={`${s.sub} text-forma-muted truncate hidden sm:inline`}>{subtitle}</span>
      )}
    </div>
  )
}
