import { cn } from '@/lib/utils'
import type { Category } from '@/types'
import './category-badge.css'

interface CategoryBadgeProps {
  category: Category
  className?: string
}

const labels: Record<Category, string> = {
  push: 'Push',
  pull: 'Pull',
  squat: 'Squat',
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'category-badge',
        `category-badge--${category}`,
        className
      )}
    >
      {labels[category]}
    </span>
  )
}
