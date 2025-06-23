'use client'

import React, { useMemo } from 'react'
import MarkdownIt from 'markdown-it'

export default function MarkdownRenderer({ markdownText }: { markdownText: string }) {
  const html = useMemo(() => {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    })
    return md.render(markdownText || '')
  }, [markdownText])

  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
