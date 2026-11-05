import React from 'react'

/**
 * 3-Step Pill Stepper matching reference UI (Attachment #4 & #5).
 * Steps: 1 Details -> 2 Traveller Info -> 3 Pay
 * Completed steps show green tick circle; current shows dark circle; upcoming shows muted circle.
 */
export default function Stepper({ currentStep = 1, onStepClick }) {
  const steps = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Traveller Info' },
    { num: 3, label: 'Pay' },
  ]

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#ECECF0',
        padding: '4px 8px',
        borderRadius: 9999,
        gap: 4,
      }}
    >
      {steps.map((s, idx) => {
        const isCompleted = s.num < currentStep
        const isCurrent = s.num === currentStep
        const isUpcoming = s.num > currentStep

        return (
          <React.Fragment key={s.num}>
            <button
              type="button"
              disabled={isUpcoming}
              onClick={() => onStepClick && isCompleted && onStepClick(s.num)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isCurrent ? '#FFFFFF' : 'transparent',
                border: 'none',
                borderRadius: 9999,
                padding: isCurrent ? '4px 14px' : '4px 10px',
                cursor: isCompleted ? 'pointer' : 'default',
                boxShadow: isCurrent ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              {/* Badge Circle */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isCompleted ? '#059669' : isCurrent ? '#111827' : '#D1D5DB',
                  color: isCompleted || isCurrent ? '#FFFFFF' : '#4B5563',
                }}
              >
                {isCompleted ? '✓' : s.num}
              </div>

              {/* Step Label */}
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? '#111827' : isCompleted ? '#374151' : '#6B7280',
                }}
              >
                {s.label}
              </span>
            </button>

            {/* Separator chevron/arrow if not last */}
            {idx < steps.length - 1 && (
              <span style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '0 2px' }}>›</span>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

