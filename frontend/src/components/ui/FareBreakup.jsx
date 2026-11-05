import React from 'react'
import { formatINR } from '../../utils/helpers'

/**
 * Sticky Fare Breakup sidebar card matching reference UI (Attachment #4).
 * Displays base fare, meal plan charges, taxes & fees, green discount line, and total payable.
 */
export default function FareBreakup({
  quote,
  nights = 1,
  rooms = 1,
  selectedPaymentType = 'full', // 'full' | 'deposit' | 'hotel'
}) {
  if (!quote) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 32, width: '100%', marginTop: 16 }} />
      </div>
    )
  }

  const baseFare = quote.breakdown?.baseFare ?? quote.baseFare ?? 0
  const breakfastAmount = quote.breakdown?.breakfastAmount ?? quote.breakfastAmount ?? 0
  const taxAmount = quote.breakdown?.taxAmount ?? quote.taxAmount ?? 0
  const discountAmount = quote.breakdown?.discountAmount ?? quote.discountAmount ?? 0
  const totalAmount = quote.breakdown?.totalAmount ?? quote.totalPayable ?? quote.totalAmount ?? 0
  const depositAmount = quote.breakdown?.depositAmount ?? quote.depositAmount ?? Math.round(totalAmount * 0.25)
  const balanceDue = totalAmount - depositAmount

  const payableNow =
    selectedPaymentType === 'deposit'
      ? depositAmount
      : selectedPaymentType === 'hotel'
      ? 0
      : totalAmount

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E5E7EB',
        padding: '24px 20px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <h3
        style={{
          fontSize: '1.0625rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: 16,
        }}
      >
        Fare breakup
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.875rem' }}>
        {/* Base fare */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
          <span>
            Base Fare ({rooms} {rooms === 1 ? 'room' : 'rooms'} × {nights} {nights === 1 ? 'night' : 'nights'})
          </span>
          <span style={{ fontWeight: 600, color: '#111827' }}>{formatINR(baseFare)}</span>
        </div>

        {/* Meal plan */}
        {breakfastAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
            <span>Breakfast Plan</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{formatINR(breakfastAmount)}</span>
          </div>
        )}

        {/* Taxes & fees */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
          <span>Taxes &amp; fees (GST)</span>
          <span style={{ fontWeight: 600, color: '#111827' }}>{formatINR(taxAmount)}</span>
        </div>

        {/* Discount in Green */}
        {discountAmount > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--color-discount-green)',
              fontWeight: 600,
            }}
          >
            <span>Total Discount</span>
            <span>-{formatINR(discountAmount)}</span>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: '#E5E7EB', margin: '4px 0' }} />

        {/* Total Payable */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontWeight: 800,
            fontSize: '1.125rem',
            color: '#111827',
          }}
        >
          <span>Total Payable</span>
          <span>{formatINR(totalAmount)}</span>
        </div>

        {/* Deposit breakdown if applicable */}
        {selectedPaymentType === 'deposit' && (
          <div
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.8125rem',
              color: '#92400E',
              marginTop: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Payable Now (25% Deposit):</span>
              <span>{formatINR(depositAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>Remaining at Desk:</span>
              <span>{formatINR(balanceDue)}</span>
            </div>
          </div>
        )}

        {selectedPaymentType === 'hotel' && (
          <div
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.8125rem',
              color: '#1E40AF',
              marginTop: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Payable Now:</span>
              <span>₹0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>Payable at Desk upon Arrival:</span>
              <span>{formatINR(totalAmount)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

