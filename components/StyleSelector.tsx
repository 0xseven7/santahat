'use client'

interface StyleSelectorProps {
  selectedStyle: string
  onStyleChange: (style: string) => void
}

const styles = [
  { name: '普通', value: 'normal' },
  { name: '高帽', value: 'tall' },
]

export default function StyleSelector({
  selectedStyle,
  onStyleChange,
}: StyleSelectorProps) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
        {styles.map((style) => (
          <button
            key={style.value}
            onClick={() => onStyleChange(style.value)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              selectedStyle === style.value
                ? 'ring-4 ring-offset-2 ring-red-400 dark:ring-red-500 scale-105 bg-red-500 text-white'
                : 'hover:scale-105 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  )
}

