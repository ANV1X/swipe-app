import { useEffect, useState } from 'react'
import { Flame, Swords, X, Plus, Clock, ArrowLeft, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  fetchActiveBattle, voteBattle, submitToBattle, fetchMyCollections,
  fetchBattleHistory, fetchFriends, askFriendToVote,
  BattleData, CollectionData, FriendData,
} from '../api/client'
import { useToast } from '../components/Toast'

const PRIZE_STYLES: Record<string, { bg: string; border: string }> = {
  stars: { bg: 'linear-gradient(135deg, rgba(255,204,0,0.18), rgba(255,149,0,0.12))', border: 'rgba(255,204,0,0.35)' },
  premium: { bg: 'linear-gradient(135deg, rgba(108,78,242,0.20), rgba(59,130,246,0.14))', border: 'rgba(108,78,242,0.35)' },
  item: { bg: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(244,114,182,0.12))', border: 'rgba(236,72,153,0.30)' },
  promocode: { bg: 'linear-gradient(135deg, rgba(52,199,89,0.18), rgba(16,185,129,0.12))', border: 'rgba(52,199,89,0.30)' },
  none: { bg: 'linear-gradient(135deg, rgba(255,159,10,0.16), rgba(255,69,58,0.10))', border: 'rgba(255,159,10,0.30)' },
}

function PrizeBanner({ battle }: { battle: BattleData }) {
  const style = PRIZE_STYLES[battle.prize_type] || PRIZE_STYLES.none
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
      background: style.bg, border: `1px solid ${style.border}`,
      borderRadius: 14, padding: '10px 16px', marginBottom: 14,
    }}>
      <span style={{ fontSize: 24 }}>{battle.prize_emoji}</span>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Приз победителю</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{battle.prize_title || 'Слава и почёт'}</div>
      </div>
    </div>
  )
}

function AskVoteModal({ battleId, onClose }: { battleId: string; onClose: () => void }) {
  const [friends, setFriends] = useState<FriendData[]>([])
  const [loading, setLoading] = useState(true)
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())
  const { show } = useToast()

  useEffect(() => {
    fetchFriends().then(setFriends).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function ask(friendId: string) {
    try {
      await askFriendToVote(friendId, battleId)
      setSentTo(prev => new Set([...prev, friendId]))
      show('Отправлено!')
    } catch (e) {
      console.error('ask vote failed', e)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <h3 className="modal-title">Позвать проголосовать</h3>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body" style={{ padding: '4px 16px 20px' }}>
          {loading ? (
            <div className="page-center" style={{ minHeight: '20vh' }}><div className="spinner" /></div>
          ) : friends.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>
              Пока нет друзей — добавьте на странице «Друзья»
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {friends.map(f => (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12,
                  background: 'var(--surface2)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: f.avatar_color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>{f.initials}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{f.first_name}</div>
                  <button
                    onClick={() => ask(f.id)}
                    disabled={sentTo.has(f.id)}
                    style={{
                      background: sentTo.has(f.id) ? 'var(--surface2)' : 'var(--accent)',
                      color: sentTo.has(f.id) ? 'var(--text2)' : '#fff', border: 'none', borderRadius: 10,
                      padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: sentTo.has(f.id) ? 'default' : 'pointer',
                    }}
                  >{sentTo.has(f.id) ? 'Отправлено' : 'Позвать'}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

function BattleGridCard({ b }: { b: BattleData }) {
  const totalVotes = b.votes_a + b.votes_b
  const pctA = totalVotes > 0 ? Math.round((b.votes_a / totalVotes) * 100) : 50
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 16, padding: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 16 }}>{b.prize_emoji}</div>
        {!b.active && (
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>
            Завершён
          </div>
        )}
        {b.active && (
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase' }}>
            Идёт сейчас
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <img src={b.collection_a.cover_image || b.collection_a.preview_images[0] || ''} alt="" style={{
            width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10,
            border: b.winner === 'a' ? '2px solid var(--accent)' : '2px solid transparent',
          }} />
          {b.winner === 'a' && <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 14 }}>👑</div>}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>VS</div>
        <div style={{ flex: 1, position: 'relative' }}>
          <img src={b.collection_b.cover_image || b.collection_b.preview_images[0] || ''} alt="" style={{
            width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10,
            border: b.winner === 'b' ? '2px solid var(--accent)' : '2px solid transparent',
          }} />
          {b.winner === 'b' && <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 14 }}>👑</div>}
        </div>
      </div>
      <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--surface2)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${pctA}%`, background: 'var(--accent)' }} />
        <div style={{ width: `${100 - pctA}%`, background: 'var(--red)' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6, textAlign: 'center' }}>
        {totalVotes} голосов · {b.prize_title || 'без приза'}
      </div>
    </div>
  )
}

export default function BattlesPage() {
  const [battle, setBattle] = useState<BattleData | null>(null)
  const [history, setHistory] = useState<BattleData[]>([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [showAskVote, setShowAskVote] = useState(false)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const { show, node } = useToast()
  const navigate = useNavigate()

  useEffect(() => { loadBattle(); loadHistory() }, [])

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

  async function loadHistory() {
    try {
      const data = await fetchBattleHistory()
      setHistory(data)
    } catch (e) {
      console.error('load battle history failed', e)
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
    if (!waiting) { loadBattle(); loadHistory() }
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
      {showAskVote && battle && <AskVoteModal battleId={battle.id} onClose={() => setShowAskVote(false)} />}

      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          Батлы <Flame size={18} style={{ color: 'var(--orange)' }} />
        </div>
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
          <PrizeBanner battle={battle} />

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

          <button
            onClick={() => setShowAskVote(true)}
            style={{
              width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: '1.5px solid var(--border)',
              background: 'none', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Users size={16} /> Позвать друзей проголосовать
          </button>
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

      {/* Сетка сражений */}
      {history.length > 0 && (
        <div style={{ padding: '20px 16px 24px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Сетка сражений</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {history.map(b => <BattleGridCard key={b.id} b={b} />)}
          </div>
        </div>
      )}
    </div>
  )
}
