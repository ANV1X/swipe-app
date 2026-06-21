import { useEffect, useState } from 'react'
import { Flame, Swords, X, Plus, Clock } from 'lucide-react'
import {
  fetchActiveBattle, voteBattle, submitToBattle, fetchMyCollections,
  BattleData, CollectionData,
} from '../api/client'
import { useToast } from '../components/Toast'

function SubmitModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: (waiting: boolean) => void }) {
  const [collections, setCollections] = useState<CollectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const { show } = useToast()

  useEffect(() => {
    fetchMyCollections().then(setCollections).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function submit(collectionId: string) {
    setBusyId(collectionId)
    try {
      const result = await submitToBattle(collectionId)
      if (result.status === 'matched') {
        show('Соперник найден — батл начался! 🔥')
        onSubmitted(false)
      } else {
        show('Коллекция в очереди — ждём соперника')
        onSubmitted(true)
      }
      onClose()
    } catch (e) {
      console.error('submit to battle failed', e)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">Заявить коллекцию на батл</h3>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '4px 16px 20px' }}>
          {loading ? (
            <div className="page-center" style={{ minHeight: '20vh' }}><div className="spinner" /></div>
          ) : collections.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text2)', fontSize: 14, lineHeight: 1.5 }}>
              У вас пока нет своих коллекций.<br />Создайте коллекцию на вкладке «Коллекции», добавьте в неё образ — и сможете выставить её на батл.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {collections.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12,
                  background: 'var(--surface2)', opacity: busyId ? 0.6 : 1,
                }}>
                  {c.cover_image && <img src={c.cover_image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{c.items_count} товаров</div>
                  </div>
                  <button
                    onClick={() => submit(c.id)}
                    disabled={!!busyId || c.items_count === 0}
                    style={{
                      background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
                      padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      opacity: c.items_count === 0 ? 0.4 : 1,
                    }}
                  >{busyId === c.id ? '...' : 'Заявить'}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BattlesPage() {
  const [battle, setBattle] = useState<BattleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
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
      show(`Вы проголосовали за «${choice === 'a' ? updated.collection_a.name : updated.collection_b.name}»!`)
    } catch {
      show('Вы уже голосовали!')
    } finally {
      setVoting(false)
    }
  }

  function onSubmitted(waiting: boolean) {
    setWaitingForOpponent(waiting)
    if (!waiting) loadBattle()
  }

  const ca = battle?.collection_a
  const cb = battle?.collection_b
  const voted = battle?.my_vote ?? null
  const totalVotes = (battle?.votes_a || 0) + (battle?.votes_b || 0)
  const pctA = totalVotes > 0 && battle ? Math.round((battle.votes_a / totalVotes) * 100) : 50
  const pctB = 100 - pctA

  return (
    <div className="page-bg">
      {node}
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} onSubmitted={onSubmitted} />}

      <div className="page-header">
        <div className="page-title">Батлы <Flame size={22} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--orange)' }} /></div>
        <button className="header-action-btn" onClick={() => setShowSubmit(true)} title="Заявить свою коллекцию">
          <Plus size={22} />
        </button>
      </div>

      {waitingForOpponent && (
        <div style={{
          margin: '0 16px 12px', background: 'var(--accent-light)', borderRadius: 14,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Clock size={18} color="var(--accent)" />
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
            Ваша коллекция в очереди — как только найдётся соперник, начнётся батл
          </div>
        </div>
      )}

      {loading ? (
        <div className="page-center"><div className="spinner" /></div>
      ) : battle && ca && cb ? (
        <div className="battles-versus-card">
          {/* Приз */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(255,159,10,0.14), rgba(255,69,58,0.10))',
            borderRadius: 14, padding: '10px 16px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 22 }}>{battle.prize_emoji}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Приз победителю</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{battle.prize_title || 'Слава и почёт'}</div>
            </div>
          </div>

          <div className="battles-vs-question">Чья коллекция круче?</div>
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
              <img src={ca.cover_image || ca.preview_images[0] || ''} alt={ca.name} />
              <div className="battles-vs-item__info">
                <div className="battles-vs-label">{ca.name}</div>
                <div className="battles-vs-likes">{ca.author_name} · {battle.votes_a}</div>
              </div>
            </div>
            <div className="battles-vs-vs">
              <div className="battles-vs-badge"><Swords size={14} /></div>
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
              <img src={cb.cover_image || cb.preview_images[0] || ''} alt={cb.name} />
              <div className="battles-vs-item__info">
                <div className="battles-vs-label">{cb.name}</div>
                <div className="battles-vs-likes">{cb.author_name} · {battle.votes_b}</div>
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
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{ca.name} — {pctA}%</span>
                <span>{cb.name} — {pctB}%</span>
              </div>
            </div>
          ) : (
            <>
              <button className="battles-vote-btn battles-vote-btn--a" onClick={() => vote('a')} disabled={voting}>
                Голосовать за «{ca.name}»
              </button>
              <button className="battles-vote-btn battles-vote-btn--b" onClick={() => vote('b')} disabled={voting}>
                Голосовать за «{cb.name}»
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="page-center">
          <Flame size={48} color="var(--text3)" />
          <div style={{ fontSize: 15, color: 'var(--text2)' }}>Нет активных батлов</div>
          <button
            onClick={() => setShowSubmit(true)}
            style={{
              marginTop: 16, background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >Заявить свою коллекцию</button>
        </div>
      )}
    </div>
  )
}
