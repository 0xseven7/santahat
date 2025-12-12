'use client'

import { useState, useRef } from 'react'
import ColorSelector from '@/components/ColorSelector'
import HatProcessor from '@/components/HatProcessor'

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>('/hats/default.png')
  const [selectedHat, setSelectedHat] = useState<string>('/hats/hat-red.png')
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法创建canvas上下文'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const resizedDataUrl = canvas.toDataURL('image/png')
          resolve(resizedDataUrl)
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        const resizedImageUrl = await resizeImage(file, 400, 400)
        setUploadedImage(resizedImageUrl)
      } catch (error) {
        console.error('处理图片失败:', error)
        alert('处理图片时出错，请重试')
      }
    } else {
      alert('请上传图片文件（JPG、PNG等）')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleHatChange = (hatPath: string) => {
    setSelectedHat(hatPath)
  }

  const handleDownload = () => {
    if (processedImageUrl) {
      const link = document.createElement('a')
      link.download = `christmas-hat-avatar-${Date.now()}.png`
      link.href = processedImageUrl
      link.click()
    }
  }

  const handlePreview = () => {
    setShowPreview(true)
  }

  const handleClosePreview = () => {
    setShowPreview(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-green-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* 标题 */}
          {/* 主要内容区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="space-y-6">
              {/* 圣诞帽选择器 */}
              <ColorSelector
                selectedHat={selectedHat}
                onHatChange={handleHatChange}
              />

              {/* 图片处理组件 */}
              {uploadedImage && (
                <HatProcessor
                  imageUrl={uploadedImage}
                  hatPath={selectedHat}
                  canvasRef={canvasRef}
                  onProcessedImageChange={setProcessedImageUrl}
                />
              )}
              {/* 按钮组 */}
              {processedImageUrl && (
                <div className="flex justify-center gap-3 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                  >
                    <span>📷</span>
                    <span>{uploadedImage === '/hats/default.png' ? '上传头像' : '更换头像'}</span>
                  </button>
                  <button
                    onClick={handlePreview}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                  >
                    <span>👁️</span>
                    <span>预览</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2"
                  >
                    <span>⬇️</span>
                    <span>下载图片</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 预览模态窗口 */}
      {showPreview && processedImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleClosePreview}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={processedImageUrl}
              alt="预览"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={handleClosePreview}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

