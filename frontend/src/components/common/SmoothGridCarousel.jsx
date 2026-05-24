import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const easeInOutCubic = [0.4, 0, 0.2, 1];

export default function SmoothGridCarousel({
  items = [],
  renderItem,
  itemsPerRow = 4,
  autoScroll = true,
  autoScrollSpeed = 6000,
  gap = 16,
  onItemClick = null,
  showControls = true,
  infinite = true,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(autoScroll);
  const [itemsPerView, setItemsPerView] = useState(itemsPerRow);
  const [isHovering, setIsHovering] = useState(false);
  const autoScrollTimer = useRef(null);
  const containerRef = useRef(null);

  const totalItems = items.length;
  const itemsPerPage = itemsPerView;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxIndex = Math.max(0, (totalPages - 1) * itemsPerPage);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(Math.min(2, itemsPerRow));
      } else if (window.innerWidth < 1280) {
        setItemsPerView(Math.min(3, itemsPerRow));
      } else {
        setItemsPerView(itemsPerRow);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerRow]);

  useEffect(() => {
    if (!isAutoScrolling || totalItems <= itemsPerView) return;

    autoScrollTimer.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + itemsPerView;
        if (infinite) {
          return nextIndex > maxIndex ? 0 : nextIndex;
        }
        return nextIndex > maxIndex ? 0 : nextIndex;
      });
    }, autoScrollSpeed);

    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, [isAutoScrolling, totalItems, itemsPerView, autoScrollSpeed, infinite, maxIndex]);

  const handlePrev = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => {
      const newIndex = prev - itemsPerView;
      if (infinite && newIndex < 0) {
        return maxIndex;
      }
      return Math.max(0, newIndex);
    });
    setTimeout(() => setIsAutoScrolling(autoScroll), 3000);
  };

  const handleNext = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => {
      const newIndex = prev + itemsPerView;
      if (infinite && newIndex > maxIndex) {
        return 0;
      }
      return Math.min(maxIndex, newIndex);
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
        minHeight: '300px',
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
  const currentPage = Math.floor(currentIndex / itemsPerView);

  return (
    <motion.div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ 
        boxShadow: isHovering ? '0 28px 56px rgba(133, 104, 74, 0.18)' : '0 22px 48px rgba(133, 104, 74, 0.12)'
      }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 24,
        padding: '16px',
        background: 'transparent',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: 24,
          background: 'transparent',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{
              duration: 1,
              ease: easeInOutCubic,
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${itemsPerView}, 1fr)`,
              gap: `${gap}px`,
              width: '100%',
            }}
          >
            {visibleItems.map((item, idx) => (
              <motion.div
                key={`${currentIndex}-${idx}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: idx * 0.08,
                  ease: easeInOutCubic,
                }}
                whileHover={{ y: -8, boxShadow: '0 24px 48px rgba(133, 104, 74, 0.15)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onItemClick?.(item, currentIndex + idx)}
                style={{
                  cursor: onItemClick ? 'pointer' : 'default',
                }}
              >
                {renderItem(item, currentIndex + idx)}
              </motion.div>
            ))}
          </motion.div>
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
              left: -60,
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
              right: -60,
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
              marginTop: 16,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {Array.from({ length: totalPages }).map((_, idx) => (
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
                  width: idx === currentPage ? 32 : 10,
                  boxShadow: idx === currentPage 
                    ? '0 4px 12px rgba(200, 155, 60, 0.3)' 
                    : '0 2px 6px rgba(0,0,0,0.08)',
                }}
                transition={{ duration: 0.3 }}
                style={{
                  height: 8,
                  borderRadius: 999,
                  border: 'none',
                  background: idx === currentPage
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
