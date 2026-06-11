interface Props {
  theme: 'light' | 'dark'
  onThemeChange: (t: 'light' | 'dark') => void
  onClose: () => void
}

export default function Settings({ theme, onThemeChange, onClose }: Props) {
  return (
    <div className="settings-page">
      <div className="settings-topbar">
        <h2 className="settings-title">Настройки</h2>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="settings-section">
        <p className="settings-section-title">Внешний вид</p>

        {/* Светлая / тёмная — два варианта чтобы сразу видеть */}
        <div className="theme-picker">
          <button
            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
            onClick={() => onThemeChange('light')}
          >
            <span className="theme-option__icon">☀️</span>
            <span className="theme-option__label">Светлая</span>
            {theme === 'light' && <span className="theme-option__check">✓</span>}
          </button>
          <button
            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => onThemeChange('dark')}
          >
            <span className="theme-option__icon">🌙</span>
            <span className="theme-option__label">Тёмная</span>
            {theme === 'dark' && <span className="theme-option__check">✓</span>}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <p className="settings-section-title">О приложении</p>
        <div className="settings-row" style={{ cursor: 'default' }}>
          <div className="settings-row__left">
            <span className="settings-row__icon">📱</span>
            <div>
              <p className="settings-row__label">Версия</p>
              <p className="settings-row__sub">1.0.0 MVP</p>
            </div>
          </div>
        </div>
        <div className="settings-row" style={{ cursor: 'default' }}>
          <div className="settings-row__left">
            <span className="settings-row__icon">🛍️</span>
            <div>
              <p className="settings-row__label">Маркетплейсы</p>
              <p className="settings-row__sub">Wildberries, Ozon, Lamoda</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
