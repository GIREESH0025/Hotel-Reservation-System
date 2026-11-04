import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', color: 'var(--color-stone)', margin: 0 }}>
        404
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', margin: '8px 0 16px' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--color-stone)', lineHeight: 1.6, marginBottom: '24px' }}>
        The folio or page you are searching for does not exist in the hotel registry.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Front Desk</Button>
      </Link>
    </div>
  )
}

