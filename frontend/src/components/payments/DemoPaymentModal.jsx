import { useState, useId } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { reservationsApi } from '../../api/reservations.api'
import { useToast } from '../../context/ToastContext'
import { useRefresh } from '../../context/RefreshContext'
import { formatINR } from '../../utils/helpers'

export function DemoPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  reservationId,
  reservationCode,
  totalAmount,
  balance,
  allowDeposit = true,
  defaultType = 'deposit',
}) {
  const depositAmount = Math.round(totalAmount * 0.25 * 100) / 100
  const initialType = allowDeposit ? defaultType : 'balance'
  const [amountType, setAmountType] = useState(initialType)
  const [method, setMethod] = useState('demo_online')
  const [paymentInstrument, setPaymentInstrument] = useState('upi')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const { success, error } = useToast()
  const { triggerRefresh } = useRefresh()

  const payableAmount = amountType === 'deposit' ? depositAmount : (balance > 0 ? balance : totalAmount)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    // Generate unique idempotency key for this payment attempt
    const idempotencyKey = `pay-${reservationId}-${amountType}-${Date.now()}`

    try {
      const res = await reservationsApi.pay(reservationId, {
        amountType,
        method: 'demo_online',
        idempotencyKey,
      })

      const ref = res.data?.data?.reference
      success(`Payment received! Reference: ${ref}`)
      triggerRefresh()
      if (onSuccess) onSuccess(res.data)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment processing failed. Please try again.'
      setErrorMsg(msg)
      error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Folio Payment — ${reservationCode || 'Stay'}`} maxWidth="520px">
      <form onSubmit={handleSubmit}>
        {/* Demo Notice Banner */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#fff',
            border: '1px solid var(--color-ink)',
            marginBottom: '20px',
            fontSize: '0.8125rem',
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', color: 'var(--color-laterite)' }}>
            Demo Payment Gateway
          </div>
          <div>
            This is a simulated transaction. No actual currency is transferred or card numbers stored. All financials are computed and verified server-side.
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-stone)', marginTop: '6px' }}>
            Hint: Amounts ending in .13 simulate a test card decline.
          </div>
        </div>

        {/* Amount Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: 'var(--color-stone)' }}>
            Select Payment Option
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: allowDeposit ? '1fr 1fr' : '1fr', gap: '8px' }}>
            {allowDeposit && (
              <label
                style={{
                  border: amountType === 'deposit' ? '2px solid var(--color-ink)' : '1px solid var(--color-rule)',
                  padding: '12px',
                  cursor: 'pointer',
                  backgroundColor: amountType === 'deposit' ? '#fff' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="amountType"
                  value="deposit"
                  checked={amountType === 'deposit'}
                  onChange={() => setAmountType('deposit')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontWeight: 600, display: 'block' }}>25% Deposit</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-laterite)' }}>
                  {formatINR(depositAmount)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)', display: 'block' }}>
                  Balance of {formatINR(totalAmount - depositAmount)} due at check-in
                </span>
              </label>
            )}

            <label
              style={{
                border: amountType === 'full' || amountType === 'balance' ? '2px solid var(--color-ink)' : '1px solid var(--color-rule)',
                padding: '12px',
                cursor: 'pointer',
                backgroundColor: amountType === 'full' || amountType === 'balance' ? '#fff' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="amountType"
                value={allowDeposit ? 'full' : 'balance'}
                checked={amountType === 'full' || amountType === 'balance'}
                onChange={() => setAmountType(allowDeposit ? 'full' : 'balance')}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontWeight: 600, display: 'block' }}>{allowDeposit ? 'Pay in Full' : 'Pay Balance'}</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-moss)' }}>
                {formatINR(balance > 0 ? balance : totalAmount)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)', display: 'block' }}>
                Total stay completely cleared
              </span>
            </label>
          </div>
        </div>

        {/* Simulated Method Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: 'var(--color-stone)' }}>
            Simulated Instrument
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'upi', label: 'UPI / QR Code' },
              { id: 'card', label: 'Credit / Debit Card' },
              { id: 'netbanking', label: 'Net Banking' },
            ].map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setPaymentInstrument(opt.id)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '0.8125rem',
                  border: paymentInstrument === opt.id ? '1px solid var(--color-ink)' : '1px solid var(--color-rule)',
                  backgroundColor: paymentInstrument === opt.id ? 'var(--color-ink)' : '#fff',
                  color: paymentInstrument === opt.id ? 'var(--color-paper)' : 'var(--color-ink)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#fff0ee',
              border: '1px solid var(--color-laterite)',
              color: 'var(--color-laterite)',
              fontSize: '0.8125rem',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Processing Transaction…' : `Pay ${formatINR(payableAmount)} Now`}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
