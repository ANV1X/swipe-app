import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProfile, ProfileData, marketplaceLabel } from '../api/client'

const CAT_LABELS: Record<string, string> = {
  clothes: 'Одежда', shoes: 'Обувь', accessories: 'Аксессуары',
}

interface Props { onSettingsOpen: () => void }

export default function Profile({ onSettingsOpen }: Props) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile().then(setProfile).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-center"><div className="spinner" /></div>
  if (!profile) return <div className="page-center"><p>Ошибка загрузки</p></div>

  const likeRate = profile.total_swipes > 0
    ? Math.round((profile.likes / profile.total_swipes) * 100) : 0

  const unlockedCount = profile.achievements.filter(a => a.unlocked).length

  return (
    <div className="profile-page">
      <div className="page-header">
        <span className="page-title">Профиль</span>
        <button className="btn-settings" onClick={onSettingsOpen}>⚙️</button>
      </div>

      {/* Аватар */}
      <div className="profile-hero">
        <div className="profile-avatar">{profile.first_name[0]?.toUpperCase() ?? '?'}</div>
        <h2 className="profile-name">{profile.first_name}</h2>
        {profile.username && <p className="profile-username">@{profile.username}</p>}
      </div>

      {/* Статы */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-value">{profile.total_swipes.toLocaleString()}</div>
          <div className="stat-label">Свайпов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.likes}</div>
          <div className="stat-label">Лайков</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{profile.wishlist_count}</div>
          <div className="stat-label">Вишлист</div>
        </div>
      </div>

      {/* Вкус */}
      {profile.total_swipes > 0 && (
        <div className="profile-section">
          <p className="profile-section-title">Твой вкус</p>
          <div className="like-rate-bar">
            <div className="like-rate-fill" style={{ width: `${likeRate}%` }} />
          </div>
          <div className="like-rate-labels">
            <span>❤️ {likeRate}% лайков</span>
            <span>{profile.dislikes} пропущено</span>
          </div>
        </div>
      )}

      {/* Предпочтения */}
      {(profile.fav_category || profile.fav_marketplace) && (
        <div className="profile-section">
          <p className="profile-section-title">Предпочтения</p>
          <div className="profile-prefs">
            {profile.fav_category && (
              <div className="pref-chip">
                <span className="pref-chip-label">Любимая категория</span>
                <span className="pref-chip-value">{CAT_LABELS[profile.fav_category] ?? profile.fav_category}</span>
              </div>
            )}
            {profile.fav_marketplace && (
              <div className="pref-chip">
                <span className="pref-chip-label">Любимый магазин</span>
                <span className="pref-chip-value">{marketplaceLabel(profile.fav_marketplace)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Меню */}
      <div className="profile-section">
        <div className="profile-menu">
          <div className="profile-menu-item" onClick={() => navigate('/history')}>
            <span className="profile-menu-icon">🕐</span>
            <span className="profile-menu-label">История свайпов</span>
            <span className="profile-menu-arrow">›</span>
          </div>
          <div className="profile-menu-item" onClick={() => navigate('/achievements')}>
            <span className="profile-menu-icon">🏆</span>
            <span className="profile-menu-label">Достижения</span>
            <span className="profile-menu-badge">{unlockedCount}/{profile.achievements.length}</span>
            <span className="profile-menu-arrow">›</span>
          </div>
          <div className="profile-menu-item" onClick={() => navigate('/shared')}>
            <span className="profile-menu-icon">👥</span>
            <span className="profile-menu-label">Совместные вишлисты</span>
            <span className="profile-menu-arrow">›</span>
          </div>
          <div className="profile-menu-item" onClick={onSettingsOpen}>
            <span className="profile-menu-icon">⚙️</span>
            <span className="profile-menu-label">Настройки</span>
            <span className="profile-menu-arrow">›</span>
          </div>
        </div>
      </div>

      <p className="profile-member-since">
        В Swipe с {new Date(profile.member_since).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}
