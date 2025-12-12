'use client'

interface ColorSelectorProps {
  selectedHat: string
  onHatChange: (hatPath: string) => void
}

const normalHats = [
  { name: '红色', path: '/hats/hat-red.png' },
  { name: '黄色', path: '/hats/hat-yellow.png' },
  { name: '绿色', path: '/hats/hat-green.png' },
  { name: '蓝色', path: '/hats/hat-blue.png' },
  { name: '紫色', path: '/hats/hat-purple.png' },
]

const tallHats = [
  { name: '红色高帽', path: '/hats/hat-tall-red.png' },
  { name: '黄色高帽', path: '/hats/hat-tall-yellow.png' },
  { name: '绿色高帽', path: '/hats/hat-tall-green.png' },
  { name: '蓝色高帽', path: '/hats/hat-tall-blue.png' },
  { name: '紫色高帽', path: '/hats/hat-tall-purple.png' },
]

export default function ColorSelector({
  selectedHat,
  onHatChange,
}: ColorSelectorProps) {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {normalHats.map((hat) => (
            <button
              key={hat.path}
              onClick={() => onHatChange(hat.path)}
              className={`flex flex-col items-center p-4 rounded-xl transition-all duration-200 ${
                selectedHat === hat.path
                  ? 'ring-4 ring-offset-2 ring-red-400 dark:ring-red-500 scale-105 bg-red-50 dark:bg-red-900/20'
                  : 'hover:scale-105 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20">
                <img
                  src={hat.path}
                  alt={hat.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                          <span class="text-xs text-gray-500">${hat.name}</span>
                        </div>
                      `
                    }
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 高帽样式 */}
      <div className="space-y-3">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {tallHats.map((hat) => (
            <button
              key={hat.path}
              onClick={() => onHatChange(hat.path)}
              className={`flex flex-col items-center p-4 rounded-xl transition-all duration-200 ${
                selectedHat === hat.path
                  ? 'ring-4 ring-offset-2 ring-red-400 dark:ring-red-500 scale-105 bg-red-50 dark:bg-red-900/20'
                  : 'hover:scale-105 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20">
                <img
                  src={hat.path}
                  alt={hat.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                          <span class="text-xs text-gray-500">${hat.name}</span>
                        </div>
                      `
                    }
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
