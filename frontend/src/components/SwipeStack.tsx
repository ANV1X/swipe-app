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
    const threshold = 100 // Чуть увеличили порог для исключения случайных микродвижений
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

  const rotate = offset.x * 0.06 // Мягкий наклон карточки при переносе
  
  // Вычисляем интенсивность свайпа для индикаторов
  const showLike = offset.x > 20
  const showNope = offset.x < -20

  return (
    <div className="swipe-stack-container" style={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: '360px', 
      height: '480px', // Идеальная пропорция под экран смартфона
      margin: '0 auto' 
    }}>
      {/* Фоновые карточки (создают эффект колоды) */}
      {items.slice(-3, -1).reverse().map((item, i) => {
        // Вычисляем красивое смещение: чем глубже карта, тем она меньше
        const scale = 0.95 + (i * 0.025)
        const translateY = (1 - i) * 12
        return (
          <div
            key={item.id}
            className="swipe-stack-bg"
            style={{ 
              position: 'absolute',
              width: '100%',
              height: '100%',
              top: 0,
              left: 0,
              transform: `scale(${scale}) translateY(${translateY}px)`, 
              zIndex: i,
              opacity: 0.85 + (i * 0.1),
              transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'none'
            }}
          >
            {renderItem(item)}
          </div>
        )
      })}

      {/* Верхняя интерактивная карточка */}
      {topItem && (
        <div
          ref={cardRef}
          className="swipe-stack-top"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            transform: `translateX(${offset.x}px) translateY(${offset.y * 0.2}px) rotate(${rotate}deg)`,
            transition: dragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 10,
            touchAction: 'none',
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
          {/* Минималистичные штампы по углам во время драга */}
          {showLike && (
            <div className="swipe-indicator swipe-indicator--like" style={{ 
              opacity: Math.min(1, offset.x / 80),
              position: 'absolute',
              top: '28px',
              left: '20px',
              zIndex: 20,
              border: '3px solid #34C759',
              color: '#34C759',
              fontSize: '20px',
              fontWeight: 800,
              borderRadius: '8px',
              padding: '4px 12px',
              transform: 'rotate(-12deg)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }}>
              В ХОТЕЛКИ
            </div>
          )}
          {showNope && (
            <div className="swipe-indicator swipe-indicator--nope" style={{ 
              opacity: Math.min(1, -offset.x / 80),
              position: 'absolute',
              top: '28px',
              right: '20px',
              zIndex: 20,
              border: '3px solid #FF3B30',
              color: '#FF3B30',
              fontSize: '20px',
              fontWeight: 800,
              borderRadius: '8px',
              padding: '4px 12px',
              transform: 'rotate(12deg)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }}>
              ПРОПУСТИТЬ
            </div>
          )}
          {renderItem(topItem)}
        </div>
      )}
    </div>
  )
}