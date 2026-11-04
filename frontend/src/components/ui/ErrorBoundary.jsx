import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // In production, error telemetry can be recorded here
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: 'var(--color-paper)',
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-ui)',
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            border: 'var(--border)',
            padding: '36px',
            backgroundColor: 'var(--color-paper)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
          }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-laterite)',
              fontWeight: 600,
              marginBottom: '8px',
            }}>
              System Notice &bull; Unhandled Exception
            </span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '12px', lineHeight: 1.2 }}>
              Something Went Wrong
            </h1>
            <p style={{ color: 'var(--color-stone)', fontSize: '0.9375rem', marginBottom: '24px', lineHeight: 1.5 }}>
              The application encountered an unexpected situation while rendering this page. Your saved data is intact.
            </p>

            {this.state.error?.message && (
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--color-stone-bg)',
                border: '1px solid var(--color-rule)',
                borderRadius: 'var(--radius)',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                color: 'var(--color-ink)',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '24px',
              }}>
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-laterite)',
                  color: 'var(--color-paper)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-ink)',
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
