'use client'

import { useRef, useState } from 'react'

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // 计算新尺寸，保持宽高比
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          // 创建canvas进行缩放
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法创建canvas上下文'))
            return
          }

          // 绘制缩放后的图片
          ctx.drawImage(img, 0, 0, width, height)
          
          // 转换为base64
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
        // 将图片缩放至最大400x400
        const resizedImageUrl = await resizeImage(file, 400, 400)
        onImageUpload(resizedImageUrl)
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-200 ${
          isDragging
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="space-y-4">
          <div className="text-6xl md:text-8xl">📷</div>
          <div>
            <p className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              点击或拖拽上传头像
            </p>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
              支持 JPG、PNG 等图片格式，自动缩放至最大 400×400 像素
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

