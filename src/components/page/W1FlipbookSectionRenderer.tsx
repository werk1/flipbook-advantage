'use client'

import { useMemo } from 'react'
import { createFlipbookLabels } from '@/lib/blocks/flipbook/labels'
import { useBoundStore } from '@/stores/boundStore'
import { W1FlipbookBlock, type W1FlipbookInput } from '@werk1/w1-system-flipbook'

type W1FlipbookSectionRendererProps = {
  input: W1FlipbookInput
  locale: string
}

export function W1FlipbookSectionRenderer({ input, locale }: W1FlipbookSectionRendererProps) {
  const deviceInfo = useBoundStore((state) => state.device)
  const labels = useMemo(() => createFlipbookLabels(locale), [locale])

  return <W1FlipbookBlock input={input} labels={labels} deviceInfo={deviceInfo} />
}
