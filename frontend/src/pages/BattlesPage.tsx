import { useState } from 'react'
import { Heart } from 'lucide-react'

const LOOK_A_IMG = 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400'
const LOOK_B_IMG = 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400'

const TOP_BATTLES = [
  { rank: 1, name: 'Minimal Beige', count: 1204 },
  { rank: 2, name: 'Street Casual', count: 1112 },
  { rank: 3, name: 'Office Core', count: 983 },
]

export default function BattlesPage() {
  const [voted, setVoted] = useState<'a' | 'b' | null>(null)
  const [likesA] = useState(234)
  const [likesB] = useState(188)

  return (
    <div className="battles-page">
      <div className="page-header">
        <span className="page-title">Батлы 🔥</span>
      </div>

      <div className="battles-versus-card">
        <div className="battles-vs-question">Кто сегодня победит?</div>

        <div className="battles-vs-row">
          <div className="battles-vs-item" style={{ outline: voted === 'a' ? '2px solid var(--accent)' : 'none' }}>
            <img src={LOOK_A_IMG} alt="Look A" />
            <div className="battles-vs-item__info">
              <div className="battles-vs-label">Look A</div>
              <div className="battles-vs-likes">
                <Heart size={12} fill="var(--red)" color="var(--red)" />
                {voted === 'a' ? likesA + 1 : likesA}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontWeight: 800, fontSize: 14, color: 'var(--text3)',
            paddingTop: 40
          }}>VS</div>

          <div className="battles-vs-item" style={{ outline: voted === 'b' ? '2px solid var(--accent)' : 'none' }}>
            <img src={LOOK_B_IMG} alt="Look B" />
            <div className="battles-vs-item__info">
              <div className="battles-vs-label">Look B</div>
              <div className="battles-vs-likes">
                <Heart size={12} fill="var(--red)" color="var(--red)" />
                {voted === 'b' ? likesB + 1 : likesB}
              </div>
            </div>
          </div>
        </div>

        <button
          className="battles-vote-btn battles-vote-btn--a"
          onClick={() => setVoted('a')}
          style={{ opacity: voted && voted !== 'a' ? 0.5 : 1 }}
        >
          {voted === 'a' ? '✓ Проголосовано за A' : 'Голосовать за A'}
        </button>
        <button
          className="battles-vote-btn battles-vote-btn--b"
          onClick={() => setVoted('b')}
          style={{ opacity: voted && voted !== 'b' ? 0.5 : 1 }}
        >
          {voted === 'b' ? '✓ Проголосовано за B' : 'Голосовать за B'}
        </button>
      </div>

      <div className="battles-top-section">
        <div className="battles-top-title">Топ недели</div>
        {TOP_BATTLES.map(item => (
          <div key={item.rank} className="battles-top-item">
            <span className="battles-top-rank">{item.rank}</span>
            <span className="battles-top-name">{item.name}</span>
            <span className="battles-top-count">{item.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
