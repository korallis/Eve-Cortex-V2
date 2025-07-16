import type { Metadata } from 'next'
import { BrandShowcase } from '@/components/brand-showcase'

export const metadata: Metadata = {
  title: 'Brand System | Eve-Cortex',
  description: 'Visual identity and design system for Eve-Cortex',
}

export default function BrandPage() {
  return <BrandShowcase />
}
