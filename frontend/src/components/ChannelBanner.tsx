interface Props {
  onDismiss: () => void
}

const CHANNEL_URL = 'https://t.me/your_channel' // замени на свой канал

export default function ChannelBanner({ onDismiss }: Props) {
  return (
    <div className="channel-banner">
      <div className="channel-banner__content">
        <span className="channel-banner__icon">🔔</span>
        <div className="channel-banner__text">
          <p className="channel-banner__title">Подпишись на канал</p>
          <p className="channel-banner__sub">Скидки и новинки каждое утро</p>
        </div>
      </div>
      <div className="channel-banner__actions">
        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="channel-banner__btn"
        >
          Подписаться
        </a>
        <button className="channel-banner__close" onClick={onDismiss}>✕</button>
      </div>
    </div>
  )
}
