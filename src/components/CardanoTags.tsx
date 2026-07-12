/** Soft chips matching EventOS-style landing (purple accents, light surface) */
export function CardanoTagRow({
  className = '',
  dense = false,
}: {
  className?: string
  dense?: boolean
}) {
  const tags = dense
    ? ['AI event drafts', 'Cardano check-in', 'QR tickets', 'Tx on certificates']
    : [
        'Event draft in seconds',
        'Approval-based applications',
        'QR tickets after approval',
        'Cardano wallet check-in',
        'Tx hash on certificates',
      ]

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((label) => (
        <span
          key={label}
          className="rounded-full bg-[#F2F2EE]/90 px-3 py-1.5 text-xs font-semibold text-[#192837]/75 shadow-sm"
        >
          {label}
        </span>
      ))}
    </div>
  )
}
