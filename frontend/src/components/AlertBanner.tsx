import React from 'react';

export type AlertType = 'danger' | 'warning' | 'success' | 'info';

interface AlertBannerProps {
  type: AlertType;
  title: string;
  message?: string;
  onDismiss?: () => void;
}

const ICONS: Record<AlertType, string> = {
  danger: '!',
  warning: '!',
  success: 'OK',
  info: 'i'
};

const AlertBanner: React.FC<AlertBannerProps> = ({ type, title, message, onDismiss }) => {
  return (
    <div className={`alert alert-${type}`} role="alert">
      <div className="alert-icon">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: type === 'danger' ? 'var(--color-danger)' :
                        type === 'warning' ? 'var(--color-warning)' :
                        type === 'success' ? 'var(--color-success)' :
                        'var(--color-info)',
            color: 'white',
            fontWeight: 800,
            fontSize: 13,
            flexShrink: 0
          }}
        >
          {ICONS[type]}
        </span>
      </div>
      <div className="alert-content" style={{ flex: 1 }}>
        <div className="alert-title">{title}</div>
        {message && <div className="alert-message">{message}</div>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: 'inherit',
            opacity: 0.6,
            lineHeight: 1,
            flexShrink: 0,
            padding: '0 4px'
          }}
          aria-label="Zamknij"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
