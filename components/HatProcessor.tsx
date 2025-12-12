'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface HatProcessorProps {
  imageUrl: string
  hatPath: string
  canvasRef: React.RefObject<HTMLCanvasElement>
  onProcessedImageChange?: (imageUrl: string | null) => void
}

interface HatTransform {
  x: number // 位置X（像素）
  y: number // 位置Y（像素）
  scale: number // 缩放比例
  rotation: number // 旋转角度（度）
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export default function HatProcessor({
  imageUrl,
  hatPath,
  canvasRef,
  onProcessedImageChange,
}: HatProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null
  )
  const [hatTransform, setHatTransform] = useState<HatTransform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  })
  const [avatarSize, setAvatarSize] = useState({ width: 0, height: 0 })
  const [hatImage, setHatImage] = useState<HTMLImageElement | null>(null)
  const [avatarImage, setAvatarImage] = useState<HTMLImageElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null)
  const [isRotating, setIsRotating] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [transformStart, setTransformStart] = useState<HatTransform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  })
  const [resizeStartDistance, setResizeStartDistance] = useState(0)
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 })
  const [rotateStartAngle, setRotateStartAngle] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const hatContainerRef = useRef<HTMLDivElement>(null)

  // 加载图片
  useEffect(() => {
    const loadImages = async () => {
      try {
        // 加载头像
        const avatarImg = new Image()
        avatarImg.crossOrigin = 'anonymous'
        avatarImg.src = imageUrl
        await new Promise((resolve, reject) => {
          avatarImg.onload = resolve
          avatarImg.onerror = reject
        })
        setAvatarImage(avatarImg)

        // 加载圣诞帽
        const hatImg = new Image()
        hatImg.crossOrigin = 'anonymous'
        hatImg.src = hatPath
        await new Promise((resolve, reject) => {
          hatImg.onload = resolve
          hatImg.onerror = () => {
            console.warn(`圣诞帽图片 ${hatPath} 未找到，请确保已添加该文件`)
            reject(new Error(`圣诞帽图片未找到: ${hatPath}`))
          }
        })
        setHatImage(hatImg)
      } catch (error) {
        console.error('加载图片失败:', error)
      }
    }
    loadImages()
  }, [imageUrl, hatPath])

  // 初始化圣诞帽位置
  useEffect(() => {
    if (avatarImage && hatImage && hatTransform.x === 0 && hatTransform.y === 0) {
      const displayWidth = avatarImage.width
      const displayHeight = avatarImage.height
      setHatTransform({
        x: displayWidth / 2,
        y: displayHeight * 0.15,
        scale: Math.min(displayWidth, displayHeight) / hatImage.width * 0.4,
        rotation: 0,
      })
    }
  }, [avatarImage, hatImage])

  // 合成最终图片
  useEffect(() => {
    if (!avatarImage || !hatImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsProcessing(true)

    try {
      const canvasWidth = avatarImage.width
      const canvasHeight = avatarImage.height

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      // 绘制头像
      ctx.drawImage(avatarImage, 0, 0, canvasWidth, canvasHeight)

      // 绘制圣诞帽（应用变换）
      ctx.save()
      
      // 移动到圣诞帽中心
      ctx.translate(hatTransform.x, hatTransform.y)
      // 旋转
      ctx.rotate((hatTransform.rotation * Math.PI) / 180)
      // 缩放
      const hatWidth = hatImage.width * hatTransform.scale
      const hatHeight = hatImage.height * hatTransform.scale
      // 绘制（从中心点绘制）
      ctx.drawImage(
        hatImage,
        -hatWidth / 2,
        -hatHeight / 2,
        hatWidth,
        hatHeight
      )

      ctx.restore()

      const dataUrl = canvas.toDataURL('image/png')
      setProcessedImageUrl(dataUrl)
      onProcessedImageChange?.(dataUrl)
    } catch (error) {
      console.error('合成图片失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [avatarImage, hatImage, hatTransform, canvasRef])

  // 计算鼠标在容器中的位置
  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!previewContainerRef.current) return { x: 0, y: 0 }
    const rect = previewContainerRef.current.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  // 计算触摸位置
  const getTouchPos = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!previewContainerRef.current) return { x: 0, y: 0 }
    const rect = previewContainerRef.current.getBoundingClientRect()
    const touch = e.touches[0] || e.changedTouches[0]
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }
  }, [])

  // 处理拖拽开始
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setShowControls(true)
      const pos = 'touches' in e ? getTouchPos(e) : getMousePos(e)
      setIsDragging(true)
      setDragStart(pos)
      setTransformStart({ ...hatTransform })
    },
    [hatTransform, getMousePos, getTouchPos]
  )

  // 处理容器点击（点击其他位置隐藏边框）
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // 如果点击的是圣诞帽容器内部，不隐藏边框
      if (hatContainerRef.current && hatContainerRef.current.contains(e.target as Node)) {
        return
      }
      setShowControls(false)
    },
    []
  )

  // 处理全局点击（点击组件外的任何位置隐藏边框）
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // 如果点击的是预览容器内，由 handleContainerClick 处理
      if (previewContainerRef.current && previewContainerRef.current.contains(e.target as Node)) {
        return
      }
      // 点击容器外的任何位置，隐藏边框
      setShowControls(false)
    }

    document.addEventListener('click', handleGlobalClick)
    return () => {
      document.removeEventListener('click', handleGlobalClick)
    }
  }, [])

  // 处理拖拽
  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      const pos = 'touches' in e ? getTouchPos(e) : getMousePos(e)
      const dx = pos.x - dragStart.x
      const dy = pos.y - dragStart.y
      setHatTransform({
        ...transformStart,
        x: transformStart.x + dx,
        y: transformStart.y + dy,
      })
    },
    [isDragging, dragStart, transformStart, getMousePos, getTouchPos]
  )

  // 处理缩放（通过边框控制点）
  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isResizing || !resizeHandle || !hatImage) return
      const pos = 'touches' in e ? getTouchPos(e) : getMousePos(e)
      
      // 计算当前鼠标位置相对于圣诞帽中心的位置
      const currentDx = pos.x - transformStart.x
      const currentDy = pos.y - transformStart.y
      
      // 计算初始鼠标位置相对于圣诞帽中心的位置
      const startDx = resizeStartPos.x - transformStart.x
      const startDy = resizeStartPos.y - transformStart.y
      
      // 旋转回正方向来计算距离（考虑旋转角度）
      const angle = (-transformStart.rotation * Math.PI) / 180
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      
      // 旋转后的当前位置
      const rotatedCurrentDx = currentDx * cos - currentDy * sin
      const rotatedCurrentDy = currentDx * sin + currentDy * cos
      
      // 旋转后的初始位置
      const rotatedStartDx = startDx * cos - startDy * sin
      const rotatedStartDy = startDx * sin + startDy * cos
      
      const baseWidth = hatImage.width * transformStart.scale
      const baseHeight = hatImage.height * transformStart.scale
      
      // 根据控制点位置计算缩放
      let newScale = transformStart.scale
      
      if (['nw', 'ne', 'se', 'sw'].includes(resizeHandle)) {
        // 角落控制点：保持宽高比，使用距离比例
        const currentDistance = Math.sqrt(rotatedCurrentDx * rotatedCurrentDx + rotatedCurrentDy * rotatedCurrentDy)
        const startDistance = Math.sqrt(rotatedStartDx * rotatedStartDx + rotatedStartDy * rotatedStartDy)
        
        if (startDistance > 0) {
          const scaleRatio = currentDistance / startDistance
          newScale = Math.max(0.2, Math.min(3, transformStart.scale * scaleRatio))
        }
      } else if (resizeHandle === 'n' || resizeHandle === 's') {
        // 上下边缘：垂直缩放，使用垂直距离比例
        const currentDist = Math.abs(rotatedCurrentDy)
        const startDist = Math.abs(rotatedStartDy)
        if (startDist > 0) {
          const scaleRatio = currentDist / startDist
          newScale = Math.max(0.2, Math.min(3, transformStart.scale * scaleRatio))
        }
      } else if (resizeHandle === 'e' || resizeHandle === 'w') {
        // 左右边缘：水平缩放，使用水平距离比例
        const currentDist = Math.abs(rotatedCurrentDx)
        const startDist = Math.abs(rotatedStartDx)
        if (startDist > 0) {
          const scaleRatio = currentDist / startDist
          newScale = Math.max(0.2, Math.min(3, transformStart.scale * scaleRatio))
        }
      }
      
      setHatTransform({
        ...transformStart,
        scale: newScale,
      })
    },
    [isResizing, resizeHandle, transformStart, hatImage, resizeStartPos, getMousePos, getTouchPos]
  )

  // 处理旋转
  const handleRotate = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isRotating) return
      const pos = 'touches' in e ? getTouchPos(e) : getMousePos(e)
      const dx = pos.x - transformStart.x
      const dy = pos.y - transformStart.y
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI
      // 计算相对于初始角度的旋转
      const newRotation = transformStart.rotation + (angle - rotateStartAngle)
      setHatTransform({
        ...transformStart,
        rotation: newRotation,
      })
    },
    [isRotating, transformStart, rotateStartAngle, getMousePos, getTouchPos]
  )

  // 处理结束
  const handleEnd = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setIsRotating(false)
    setResizeHandle(null)
  }, [])

  // 绑定全局事件
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleDrag)
      window.addEventListener('touchend', handleEnd)
      return () => {
        window.removeEventListener('mousemove', handleDrag)
        window.removeEventListener('mouseup', handleEnd)
        window.removeEventListener('touchmove', handleDrag)
        window.removeEventListener('touchend', handleEnd)
      }
    }
    if (isResizing) {
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleResize)
      window.addEventListener('touchend', handleEnd)
      return () => {
        window.removeEventListener('mousemove', handleResize)
        window.removeEventListener('mouseup', handleEnd)
        window.removeEventListener('touchmove', handleResize)
        window.removeEventListener('touchend', handleEnd)
      }
    }
    if (isRotating) {
      window.addEventListener('mousemove', handleRotate)
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleRotate)
      window.addEventListener('touchend', handleEnd)
      return () => {
        window.removeEventListener('mousemove', handleRotate)
        window.removeEventListener('mouseup', handleEnd)
        window.removeEventListener('touchmove', handleRotate)
        window.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging, isResizing, isRotating, handleDrag, handleResize, handleRotate, handleEnd])

  // 计算显示尺寸
  useEffect(() => {
    if (avatarImage) {
      setAvatarSize({
        width: avatarImage.width,
        height: avatarImage.height,
      })
    }
  }, [avatarImage])


  if (!avatarImage) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    )
  }

  const hatWidth = hatImage ? hatImage.width * hatTransform.scale : 0
  const hatHeight = hatImage ? hatImage.height * hatTransform.scale : 0
  const controlPointSize = 12
  const borderOffset = 4

  // 边框控制点位置
  const resizeHandles: { handle: ResizeHandle; style: React.CSSProperties }[] = [
    { handle: 'nw', style: { left: -borderOffset, top: -borderOffset, cursor: 'nwse-resize' } },
    { handle: 'n', style: { left: '50%', top: -borderOffset, transform: 'translateX(-50%)', cursor: 'ns-resize' } },
    { handle: 'ne', style: { right: -borderOffset, top: -borderOffset, cursor: 'nesw-resize' } },
    { handle: 'e', style: { right: -borderOffset, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' } },
    { handle: 'se', style: { right: -borderOffset, bottom: -borderOffset, cursor: 'nwse-resize' } },
    { handle: 's', style: { left: '50%', bottom: -borderOffset, transform: 'translateX(-50%)', cursor: 'ns-resize' } },
    { handle: 'sw', style: { left: -borderOffset, bottom: -borderOffset, cursor: 'nesw-resize' } },
    { handle: 'w', style: { left: -borderOffset, top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' } },
  ]

  return (
    <div className="w-full space-y-6">
      {/* 交互式预览区域 */}
      <div className="flex justify-center">
        <div
          ref={previewContainerRef}
          className="relative inline-block cursor-pointer"
          style={{
            width: avatarSize.width,
            height: avatarSize.height,
            maxWidth: '100%',
            maxHeight: '600px',
          }}
          onClick={handleContainerClick}
        >
          {/* 头像背景 */}
          <img
            src={imageUrl}
            alt="头像"
            className="w-full h-auto rounded-lg shadow-lg"
            style={{
              width: avatarSize.width,
              height: avatarSize.height,
              objectFit: 'contain',
            }}
          />

          {/* 圣诞帽（可交互） */}
          {hatImage && (
            <div
              ref={hatContainerRef}
              className="absolute"
              style={{
                left: hatTransform.x - hatWidth / 2,
                top: hatTransform.y - hatHeight / 2,
                width: hatWidth,
                height: hatHeight,
                transform: `rotate(${hatTransform.rotation}deg)`,
                transformOrigin: 'center center',
              }}
              onClick={(e) => {
                e.stopPropagation()
                setShowControls(true)
              }}
            >
              {/* 圣诞帽图片 */}
              <div
                className="w-full h-full cursor-move"
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                <img
                  src={hatPath}
                  alt="圣诞帽"
                  className="w-full h-full pointer-events-none"
                  style={{ userSelect: 'none' }}
                  draggable={false}
                />
              </div>

              {/* 边框 */}
              {showControls && (
                <div
                  className="absolute inset-0 border-2 border-blue-400 pointer-events-none"
                  style={{
                    borderStyle: 'dashed',
                    borderRadius: '2px',
                  }}
                />
              )}

              {/* 边框控制点（缩放） */}
              {showControls && resizeHandles.map(({ handle, style }) => (
                <div
                  key={handle}
                  className="absolute bg-blue-500 border-2 border-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10"
                  style={{
                    ...style,
                    width: controlPointSize,
                    height: controlPointSize,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setIsResizing(true)
                    setResizeHandle(handle)
                    setTransformStart({ ...hatTransform })
                    const pos = getMousePos(e.nativeEvent)
                    setResizeStartPos(pos)
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setIsResizing(true)
                    setResizeHandle(handle)
                    setTransformStart({ ...hatTransform })
                    const pos = getTouchPos(e.nativeEvent)
                    setResizeStartPos(pos)
                  }}
                />
              ))}

              {/* 旋转控制点（顶部） */}
              {showControls && (
              <div
                className="absolute cursor-grab bg-green-500 border-2 border-white rounded-full shadow-lg hover:bg-green-600 transition-colors active:cursor-grabbing z-10"
                style={{
                  left: '50%',
                  top: -controlPointSize * 3,
                  transform: 'translateX(-50%)',
                  width: controlPointSize,
                  height: controlPointSize,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setIsRotating(true)
                  setTransformStart({ ...hatTransform })
                  const pos = getMousePos(e.nativeEvent)
                  const dx = pos.x - hatTransform.x
                  const dy = pos.y - hatTransform.y
                  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
                  setRotateStartAngle(angle)
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setIsRotating(true)
                  setTransformStart({ ...hatTransform })
                  const pos = getTouchPos(e.nativeEvent)
                  const dx = pos.x - hatTransform.x
                  const dy = pos.y - hatTransform.y
                  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
                  setRotateStartAngle(angle)
                }}
              />
              )}
            </div>
          )}

          {/* 提示文字 */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-sm">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span>拖拽移动</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                边框缩放
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                旋转
              </span>
            </div>
          </div>
        </div>
      </div>


      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
