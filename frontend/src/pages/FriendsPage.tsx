import { useState } from 'react'
import { UserPlus, Plus, ChevronRight, Users } from 'lucide-react'

const FRIENDS = [
  { id: 1, name: 'Саша', activity: 'свайпает с тобой', time: '12 мин назад', initials: 'С', color: '#FF6B6B' },
  { id: 2, name: 'Маша', activity: 'добавила 4 товара', time: '1 ч назад', initials: 'М', color: '#4ECDC4' },
  { id: 3, name: 'Илья', activity: 'лайкнул твой вишлист', time: '3 ч назад', initials: 'И', color: '#45B7D1' },
  { id: 4, name: 'Катя', activity: 'создала общий вишлист', time: '5 ч назад', initials: 'К', color: '#96CEB4' },
]

const SHARED_WISHLISTS = [
  { id: 1, name: 'Подарки на НГ', members: ['С', 'М', 'И'], items: 12, updatedAt: '2 ч назад' },
  { id: 2, name: 'Летний гардероб', members: ['К', 'М'], items: 7, updatedAt: 'вчера' },
]

const MEMBER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'activity' | 'shared'>('activity')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div className="page-header">
        <span className="page-title">Друзья</span>
        <button style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
          <UserPlus size={18} />
        </button>
      </div>

      <div className="friends-tabs">
        <button className={`friends-tab${activeTab === 'activity' ? ' active' : ''}`} onClick={() => setActiveTab('activity')}>
          Активность
        </button>
        <button className={`friends-tab${activeTab === 'shared' ? ' active' : ''}`} onClick={() => setActiveTab('shared')}>
          Общие вишлисты
        </button>
      </div>

      {activeTab === 'activity' && (
        <div className="friends-list">
          {FRIENDS.map(friend => (
            <div key={friend.id} className="friend-item">
              <div className="friend-avatar-placeholder" style={{ background: friend.color }}>
                {friend.initials}
              </div>
              <div className="friend-info">
                <div className="friend-name">{friend.name}</div>
                <div className="friend-activity">{friend.activity}</div>
              </div>
              <div className="friend-time">{friend.time}</div>
            </div>
          ))}

          <div style={{ padding: '20px 0 8px' }}>
            <button className="friends-invite-btn">
              Пойти вместе
            </button>
          </div>
        </div>
      )}

      {activeTab === 'shared' && (
        <div style={{ padding: '0 16px' }}>
          {/* Create new shared wishlist */}
          <button style={{
            width: '100%', padding: '14px 16px', borderRadius: 16,
            border: '2px dashed var(--border)', background: 'none',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', color: 'var(--text2)', fontSize: 14, fontWeight: 600,
            marginBottom: 14,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={16} color="var(--accent)" />
            </div>
            Создать общий вишлист
          </button>

          {SHARED_WISHLISTS.map(wl => (
            <div key={wl.id} style={{
              background: 'var(--surface)', borderRadius: 20,
              padding: '16px', marginBottom: 10,
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={22} color="var(--accent)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{wl.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex' }}>
                    {wl.members.map((m, i) => (
                      <div key={i} style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: MEMBER_COLORS[i % MEMBER_COLORS.length],
                        color: '#fff', fontSize: 10, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginLeft: i > 0 ? -6 : 0,
                        border: '1.5px solid var(--surface)',
                      }}>{m}</div>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{wl.items} товаров · {wl.updatedAt}</span>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text3)" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
