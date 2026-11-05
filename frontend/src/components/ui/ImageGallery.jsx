import React, { useState, useEffect } from 'react'

/**
 * 5-photo mosaic layout with Lightbox modal.
 * 1 large photo left + 4 smaller 2x2 grid right.
 * Clicking opens full-screen interactive lightbox.
 */
export default function ImageGallery({ images = [], alt = 'Room photo' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  // Ensure at least 5 images by repeating or falling back
  const fallbackList = images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80']
  const displayPhotos = [...fallbackList]
  while (displayPhotos.length < 5) {
    displayPhotos.push(fallbackList[displayPhotos.length % fallbackList.length])
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (lightboxIndex === null) return
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % displayPhotos.length)
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, displayPhotos.length])

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gridTemplateRows: '180px 180px',
          gap: 8,
          borderRadius: 16,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Large Left Photo */}
        <div
          onClick={() => setLightboxIndex(0)}
          style={{
            gridColumn: '1 / 2',
            gridRow: '1 / 3',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <img
            src={displayPhotos[0]}
            alt={`${alt} 1`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 300ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>

        {/* 4 Smaller Photos */}
        {displayPhotos.slice(1, 5).map((imgUrl, idx) => (
          <div
            key={idx + 1}
            onClick={() => setLightboxIndex(idx + 1)}
            style={{
              position: 'relative',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <img
              src={imgUrl}
              alt={`${alt} ${idx + 2}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 300ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />

            {/* "View all photos" button on last photo */}
            {idx === 3 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(0)
                }}
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  background: 'rgba(17, 24, 39, 0.85)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(4px)',
                  border: 'none',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📷 View all photos
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 400,
            background: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 24,
              right: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#FFFFFF',
            }}
          >
            <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
              {alt} — Photo {lightboxIndex + 1} of {displayPhotos.length}
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#FFFFFF',
                width: 36,
                height: 36,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.25rem',
              }}
            >
              ✕
            </button>
          </div>

          {/* Photo Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '85vw', maxHeight: '75vh' }}
          >
            <img
              src={displayPhotos[lightboxIndex]}
              alt={`${alt} ${lightboxIndex + 1}`}
              style={{
                maxWidth: '85vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 8,
              }}
            />

            {/* Prev Button */}
            <button
              type="button"
              onClick={() => setLightboxIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length)}
              style={{
                position: 'absolute',
                top: '50%',
                left: -48,
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#FFFFFF',
                width: 44,
                height: 44,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.5rem',
              }}
            >
              ‹
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => setLightboxIndex((prev) => (prev + 1) % displayPhotos.length)}
              style={{
                position: 'absolute',
                top: '50%',
                right: -48,
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#FFFFFF',
                width: 44,
                height: 44,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '1.5rem',
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  )
}

