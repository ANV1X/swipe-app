import { useEffect, useState } from 'react'
import { ArrowLeft, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchProfile, getCachedProfile, Achievement } from '../api/client'

export default function AchievementsPage() {
  const navigate = useNavigate()
  const cached = getCachedProfile()
  const [achievements, setAchievements] = useState<Achievement[]>(cached?.achievements ?? [])
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    fetchProfile()
      .then(p => setAchievements(p.achievements))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="page-bg">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700 }}>Достижения</div>
        <div style={{ width: 36 }} />
      </div>

      {!loading && (
        <div style={{
          margin: '0 16px 16px',
          background: 'linear-gradient(135deg, var(--accent-light) 0%, rgba(108,78,242,0.15) 100%)',
          borderRadius: 18, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Trophy size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {unlockedCount} / {achievements.length}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>достижений открыто</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : (
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {achievements.map(a => {
            const pct = a.target > 0 ? Math.min(100, Math.round((a.progress / a.target) * 100)) : 0
            return (
              <div
                key={a.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 18,
                  padding: '14px 16px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  opacity: a.unlocked ? 1 : 0.85,
                }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                  background: a.unlocked ? 'var(--accent-light)' : 'var(--surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, filter: a.unlocked ? 'none' : 'grayscale(1)', opacity: a.unlocked ? 1 : 0.5,
                }}>
                  {a.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{a.title}</div>
                    {a.unlocked && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: 'var(--green)',
                        background: 'rgba(52,199,89,0.12)', borderRadius: 6, padding: '2px 6px',
                      }}>Открыто</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, marginBottom: 8 }}>
                    {a.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface2)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`, borderRadius: 3,
                        background: a.unlocked ? 'var(--green)' : 'var(--accent)',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, flexShrink: 0 }}>
                      {a.progress}/{a.target}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
