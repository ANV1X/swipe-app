import { useState, useRef, useCallback, ReactNode } from 'react'

interface SwipeStackProps {
  items: any[]
  onSwipe: (direction: 'left' | 'right', item: any) => void
  renderItem: (item: any) => ReactNode
}

export default function SwipeStack({ items, onSwipe, renderItem }: SwipeStackProps) {
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const topItem = items[items.length - 1]

  const handleStart = useCallback((clientX: number, clientY: number) => {
    startPos.current = { x: clientX, y: clientY }
    setDragging(true)
  }, [])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return
    setOffset({
      x: clientX - startPos.current.x,
      y: clientY - startPos.current.y,
    })
  }, [dragging])

  const handleEnd = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    const threshold = 80
    if (offset.x > threshold) {
      onSwipe('right', topItem)
    } else if (offset.x < -threshold) {
      onSwipe('left', topItem)
    }
    setOffset({ x: 0, y: 0 })
  }, [dragging, offset, topItem, onSwipe])

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY)
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY)
  const onMouseUp = () => handleEnd()

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY)
  const onTouchEnd = () => handleEnd()

  const rotate = offset.x * 0.08
  const opacity = Math.max(0, 1 - Math.abs(offset.x) / 300)

  // Показываем направление свайпа
  const showLike = offset.x > 30
  const showNope = offset.x < -30

  return (
    <div className="swipe-stack-container">
      {/* Фоновые карточки */}
      {items.slice(-3, -1).reverse().map((item, i) => (
        <div
          key={item.id}
          className="swipe-stack-bg"
          style={{ transform: `scale(${0.94 + i * 0.03}) translateY(${(1 - i) * 10}px)`, zIndex: i }}
        >
          {renderItem(item)}
        </div>
      ))}

      {/* Верхняя карточка */}
      {topItem && (
        <div
          ref={cardRef}
          className="swipe-stack-top"
          style={{
            transform: `translateX(${offset.x}px) translateY(${offset.y * 0.2}px) rotate(${rotate}deg)`,
            transition: dragging ? 'none' : 'transform 0.3s ease',
            zIndex: 10,
            cursor: dragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Like / Nope индикаторы */}
          {showLike && (
            <div className="swipe-indicator swipe-indicator--like" style={{ opacity: Math.min(1, offset.x / 100) }}>
              LIKE ❤️
            </div>
          )}
          {showNope && (
            <div className="swipe-indicator swipe-indicator--nope" style={{ opacity: Math.min(1, -offset.x / 100) }}>
              NOPE ✕
            </div>
          )}
          {renderItem(topItem)}
        </div>
      )}
    </div>
  )
}
