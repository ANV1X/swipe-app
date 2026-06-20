import { useEffect, useState } from 'react'
import { Flame, Heart } from 'lucide-react'
import { fetchActiveBattle, voteBattle, BattleData } from '../api/client'
import { useToast } from '../components/Toast'

const TOP_WEEK = [
  { rank: 1, name: 'Minimal Beige', votes: 1204 },
  { rank: 2, name: 'Street Casual', votes: 1112 },
  { rank: 3, name: 'Office Core', votes: 983 },
]

export default function BattlesPage() {
  const [battle, setBattle] = useState<BattleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const { show, node } = useToast()

  useEffect(() => { loadBattle() }, [])

  async function loadBattle() {
    setLoading(true)
    try {
      const data = await fetchActiveBattle()
      setBattle(data)
    } catch (e) {
      console.error('load battle failed', e)
    } finally {
      setLoading(false)
    }
  }

  async function vote(choice: 'a' | 'b') {
    if (!battle || battle.my_vote || voting) return
    setVoting(true)
    try {
      const updated = await voteBattle(battle.id, choice)
      setBattle(updated)
      show(`Вы проголосовали за Look ${choice.toUpperCase()}!`)
    } catch {
      show('Вы уже голосовали!')
    } finally {
      setVoting(false)
    }
  }

  const pa = battle?.product_a
  const pb = battle?.product_b
  const voted = battle?.my_vote ?? null
  const totalVotes = (battle?.votes_a || 0) + (battle?.votes_b || 0)
  const pctA = totalVotes > 0 && battle ? Math.round((battle.votes_a / totalVotes) * 100) : 50
  const pctB = 100 - pctA

  return (
    <div className="page-bg">
      {node}
      <div className="page-header">
        <div className="page-title">Батлы <Flame size={22} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--orange)' }} /></div>
      </div>

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : battle && pa && pb ? (
        <>
          <div className="battles-versus-card">
            <div className="battles-vs-question">Кто сегодня победит?</div>
            <div className="battles-vs-row">
              <div
                className="battles-vs-item"
                onClick={() => vote('a')}
                style={{
                  cursor: voted ? 'default' : 'pointer',
                  border: voted === 'a' ? '2px solid var(--accent)' : '2px solid transparent',
                  borderRadius: 16,
                  transition: 'border-color 0.2s',
                }}
              >
                <img src={pa.image_url || ''} alt={pa.title} />
                <div className="battles-vs-item__info">
                  <div className="battles-vs-label">Look A</div>
                  <div className="battles-vs-likes">
                    <Heart size={11} fill="var(--red)" stroke="none" /> {battle.votes_a}
                  </div>
                </div>
              </div>
              <div className="battles-vs-vs">
                <div className="battles-vs-badge">VS</div>
              </div>
              <div
                className="battles-vs-item"
                onClick={() => vote('b')}
                style={{
                  cursor: voted ? 'default' : 'pointer',
                  border: voted === 'b' ? '2px solid var(--accent)' : '2px solid transparent',
                  borderRadius: 16,
                  transition: 'border-color 0.2s',
                }}
              >
                <img src={pb.image_url || ''} alt={pb.title} />
                <div className="battles-vs-item__info">
                  <div className="battles-vs-label">Look B</div>
                  <div className="battles-vs-likes">
                    <Heart size={11} fill="var(--red)" stroke="none" /> {battle.votes_b}
                  </div>
                </div>
              </div>
            </div>

            {voted ? (
              <div className="battles-vote-result">
                <div className="battles-vote-bar">
                  <div className="battles-vote-bar__a" style={{ width: `${pctA}%` }} />
                  <div className="battles-vote-bar__b" style={{ width: `${pctB}%`, background: 'var(--surface2)' }} />
                </div>
                <div className="battles-vote-labels">
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Look A — {pctA}%</span>
                  <span>Look B — {pctB}%</span>
                </div>
              </div>
            ) : (
              <>
                <button className="battles-vote-btn battles-vote-btn--a" onClick={() => vote('a')} disabled={voting}>
                  Голосовать за A
                </button>
                <button className="battles-vote-btn battles-vote-btn--b" onClick={() => vote('b')} disabled={voting}>
                  Голосовать за B
                </button>
              </>
            )}
          </div>

          <div className="battles-top-section">
            <div className="battles-top-title">Топ недели</div>
            <div className="battles-top-list">
              {TOP_WEEK.map(item => (
                <div key={item.rank} className="battles-top-item">
                  <div className="battles-top-rank" style={{ color: item.rank === 1 ? 'var(--orange)' : 'var(--text)' }}>
                    {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                  </div>
                  <div className="battles-top-name">{item.name}</div>
                  <div className="battles-top-count">{item.votes.toLocaleString('ru-RU')}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="page-center">
          <Flame size={48} color="var(--text3)" />
          <div style={{ fontSize: 15, color: 'var(--text2)' }}>Нет активных батлов</div>
        </div>
      )}
    </div>
  )
}
