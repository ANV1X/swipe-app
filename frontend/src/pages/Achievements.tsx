import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProfile, Achievement } from '../api/client'

export default function Achievements() {
  const navigate = useNavigate()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
      .then(p => setAchievements(p.achievements))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const unlocked = achievements.filter(a => a.unlocked)
  const locked   = achievements.filter(a => !a.unlocked)

  return (
    <div className="ach-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/profile')}>←</button>
        <h1 className="page-title">Достижения</h1>
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : (
        <div style={{ padding: '0 16px' }}>
          {/* Разблокированные */}
          {unlocked.length > 0 && (
            <>
              <p className="ach-section-label">Получено {unlocked.length}</p>
              <div className="ach-grid">
                {unlocked.map(a => (
                  <div key={a.id} className="ach-card unlocked">
                    <div className="ach-emoji">{a.emoji}</div>
                    <p className="ach-title">{a.title}</p>
                    <p className="ach-desc">{a.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Заблокированные */}
          {locked.length > 0 && (
            <>
              <p className="ach-section-label" style={{ marginTop: 24 }}>
                Ещё можно получить
              </p>
              <div className="ach-grid">
                {locked.map(a => (
                  <div key={a.id} className="ach-card locked">
                    <div className="ach-emoji locked-emoji">{a.emoji}</div>
                    <p className="ach-title">{a.title}</p>
                    {/* Прогресс-бар */}
                    <div className="ach-progress-bar">
                      <div
                        className="ach-progress-fill"
                        style={{ width: `${Math.min((a.progress / a.target) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="ach-progress-text">{a.progress} / {a.target}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
