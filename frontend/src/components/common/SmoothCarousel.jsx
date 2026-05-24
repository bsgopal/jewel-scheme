import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const easeInOutCubic = [0.4, 0, 0.2, 1];

export default function SmoothCarousel({ 
  items = [], 
  renderItem, 
  itemsPerView = 1, 
  autoScroll = true, 
  autoScrollSpeed = 5000,
  gap = 16,
  height = 'auto',
  onItemClick = null,
  showControls = true,
  infinite = true
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(autoScroll);
  const [isHovering, setIsHovering] = useState(false);
  const autoScrollTimer = useRef(null);
  const containerRef = useRef(null);

  const totalItems = items.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);

  useEffect(() => {
    if (!isAutoScrolling || totalItems <= itemsPerView) return;

    autoScrollTimer.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (infinite) {
          return (prev + 1) % totalItems;
        }
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, autoScrollSpeed);

    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, [isAutoScrolling, totalItems, itemsPerView, autoScrollSpeed, infinite, maxIndex]);

  const handlePrev = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => {
      if (infinite) {
        return prev === 0 ? totalItems - 1 : prev - 1;
      }
      return Math.max(0, prev - 1);
    });
    setTimeout(() => setIsAutoScrolling(autoScroll), 3000);
  };

  const handleNext = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => {
      if (infinite) {
        return (prev + 1) % totalItems;
      }
      return Math.min(maxIndex, prev + 1);
    });
    setTimeout(() => setIsAutoScrolling(autoScroll), 3000);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    setIsAutoScrolling(false);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTimeout(() => setIsAutoScrolling(autoScroll), 500);
  };

  if (totalItems === 0) {
    return (
      <div style={{
        height,
        borderRadius: 24,
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(169,126,39,0.12)',
        display: 'grid',
        placeItems: 'center',
        color: '#85684a',
      }}>
        No items to display
      </div>
    );
  }

  const visibleItems = items.slice(currentIndex, currentIndex + itemsPerView);
  const canGoPrev = infinite || currentIndex > 0;
  const canGoNext = infinite || currentIndex < maxIndex;

  return (
    <motion.div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ boxShadow: isHovering ? '0 28px 56px rgba(133, 104, 74, 0.18)' : '0 22px 48px rgba(133, 104, 74, 0.12)' }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'relative',
        height,
        borderRadius: 26,
        overflow: 'hidden',
        border: '1px solid rgba(169, 126, 39, 0.12)',
        background: '#fff',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch',
          gap: `${gap}px`,
          padding: itemsPerView > 1 ? `${gap}px` : 0,
        }}
      >
        <AnimatePresence mode="wait">
          {visibleItems.map((item, idx) => (
            <motion.div
              key={`${currentIndex}-${idx}`}
              initial={{ opacity: 0, x: 100, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.98 }}
              transition={{
                duration: 1,
                ease: easeInOutCubic,
              }}
              style={{
                flex: itemsPerView === 1 ? 1 : `0 0 calc((100% - ${(itemsPerView - 1) * gap}px) / ${itemsPerView})`,
                height: '100%',
                cursor: onItemClick ? 'pointer' : 'default',
              }}
              onClick={() => onItemClick?.(item, currentIndex + idx)}
            >
              {renderItem(item, currentIndex + idx)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {showControls && totalItems > itemsPerView && (
        <>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrev}
            disabled={!canGoPrev}
            animate={{ 
              boxShadow: isHovering ? '0 12px 32px rgba(200, 155, 60, 0.25)' : '0 8px 24px rgba(0,0,0,0.12)'
            }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.95)',
              cursor: canGoPrev ? 'pointer' : 'not-allowed',
              display: 'grid',
              placeItems: 'center',
              opacity: canGoPrev ? 1 : 0.4,
              transition: 'opacity 0.3s ease',
            }}
          >
            <ChevronLeft sx={{ color: '#6b4d26', fontSize: 24 }} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            disabled={!canGoNext}
            animate={{ 
              boxShadow: isHovering ? '0 12px 32px rgba(200, 155, 60, 0.25)' : '0 8px 24px rgba(0,0,0,0.12)'
            }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.95)',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              display: 'grid',
              placeItems: 'center',
              opacity: canGoNext ? 1 : 0.4,
              transition: 'opacity 0.3s ease',
            }}
          >
            <ChevronRight sx={{ color: '#6b4d26', fontSize: 24 }} />
          </motion.button>

          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            {Array.from({ length: Math.ceil(totalItems / itemsPerView) }).map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => {
                  setIsAutoScrolling(false);
                  setCurrentIndex(idx * itemsPerView);
                  setTimeout(() => setIsAutoScrolling(autoScroll), 3000);
                }}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  width: idx === Math.floor(currentIndex / itemsPerView) ? 32 : 10,
                  boxShadow: idx === Math.floor(currentIndex / itemsPerView) 
                    ? '0 4px 12px rgba(200, 155, 60, 0.3)' 
                    : '0 2px 6px rgba(0,0,0,0.08)',
                }}
                transition={{ duration: 0.3 }}
                style={{
                  height: 8,
                  borderRadius: 999,
                  border: 'none',
                  background: idx === Math.floor(currentIndex / itemsPerView)
                    ? 'linear-gradient(135deg, #c89b3c, #e0b254)'
                    : 'rgba(169, 126, 39, 0.25)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
