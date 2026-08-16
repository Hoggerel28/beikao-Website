import { ExternalLink } from 'lucide-react'
import type { SourceLink } from '../types/admissions'

interface SourceLinkButtonProps {
  source: SourceLink | undefined
  label?: string
}

export function SourceLinkButton({ source, label }: SourceLinkButtonProps) {
  if (!source) return null

  return (
    <a
      className={`source-link ${source.official ? 'source-link--official' : 'source-link--unofficial'}`}
      href={source.url}
      target="_blank"
      rel="noreferrer"
      title={label ?? source.label}
    >
      <ExternalLink size={14} />
      <span>{source.official ? '官方直达' : '非官方直达'}</span>
    </a>
  )
}
