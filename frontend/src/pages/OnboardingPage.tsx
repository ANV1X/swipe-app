import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { updateMe } from '../api/client'

type StepId = 'welcome' | 'gender' | 'styles' | 'colors' | 'brands' | 'budget' | 'done'

const STEPS: StepId[] = ['welcome', 'gender', 'styles', 'colors', 'brands', 'budget', 'done']

const STYLES = [
  { id: 'minimal', label: 'Minimal', desc: 'Чистые линии, нейтральные цвета', emoji: '🤍' },
  { id: 'casual', label: 'Casual', desc: 'Комфорт и повседневность', emoji: '👕' },
  { id: 'street', label: 'Street', desc: 'Уличный стиль, оверсайз', emoji: '🧢' },
  { id: 'smart', label: 'Smart', desc: 'Офис и деловые встречи', emoji: '👔' },
  { id: 'sport', label: 'Sport', desc: 'Активный образ жизни', emoji: '🏃' },
  { id: 'romantic', label: 'Romantic', desc: 'Женственность, цветочные принты', emoji: '🌸' },
  { id: 'dark', label: 'Dark', desc: 'Тёмные оттенки, акценты', emoji: '🖤' },
  { id: 'boho', label: 'Boho', desc: 'Свободный, этнический стиль', emoji: '🌿' },
]

const COLORS = [
  { id: 'black', label: 'Чёрный', hex: '#1C1C1E' },
  { id: 'white', label: 'Белый', hex: '#F5F5F0', border: true },
  { id: 'beige', label: 'Бежевый', hex: '#D4C4A8' },
  { id: 'khaki', label: 'Хаки', hex: '#8B8560' },
  { id: 'navy', label: 'Синий', hex: '#1A3A6E' },
  { id: 'gray', label: 'Серый', hex: '#8E8E8E' },
  { id: 'brown', label: 'Коричневый', hex: '#7B5B3A' },
  { id: 'green', label: 'Зелёный', hex: '#3A7D44' },
  { id: 'pink', label: 'Розовый', hex: '#E8849A' },
  { id: 'red', label: 'Красный', hex: '#C0392B' },
]

const BRANDS = [
  { id: 'zara', label: 'Zara', logo: '🟧' },
  { id: 'hm', label: 'H&M', logo: '🟥' },
  { id: 'uniqlo', label: 'Uniqlo', logo: '🟫' },
  { id: 'cos', label: 'COS', logo: '⬜' },
  { id: 'mango', label: 'Mango', logo: '🟨' },
  { id: 'nb', label: 'New Balance', logo: '🟦' },
  { id: 'nike', label: 'Nike', logo: '⬛' },
  { id: 'adidas', label: 'Adidas', logo: '🟩' },
  { id: 'reserved', label: 'Reserved', logo: '🔲' },
  { id: 'pull', label: 'Pull&Bear', logo: '🔳' },
  { id: 'wb', label: 'Wildberries', logo: '🟣' },
  { id: 'lamoda', label: 'Lamoda', logo: '🔶' },
]

const BUDGETS = [
  { id: 'budget', label: 'До 3 000 ₽', sub: 'Доступные вещи' },
  { id: 'mid', label: '3 000 – 8 000 ₽', sub: 'Оптимальное' },
  { id: 'high', label: '8 000 – 20 000 ₽', sub: 'Премиум сегмент' },
  { id: 'luxury', label: 'Без ограничений', sub: 'Всё подряд' },
]

function ProgressBar({ step }: { step: number }) {
  const total = STEPS.length - 2
  const cur = Math.min(step - 1, total)
  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 24px 20px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i < cur ? 'var(--accent)' : 'var(--border)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}

export default function OnboardingPage({ onDone }: { onDone: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [gender, setGender] = useState<string | null>(null)
  const [styles, setStyles] = useState<Set<string>>(new Set())
  const [colors, setColors] = useState<Set<string>>(new Set())
  const [brands, setBrands] = useState<Set<string>>(new Set())
  const [budget, setBudget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const step = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = step === 'done'

  function toggle<T>(set: Set<T>, val: T, setter: (s: Set<T>) => void) {
    const n = new Set(set)
    if (n.has(val)) n.delete(val); else n.add(val)
    setter(n)
  }

  async function finish() {
    setSaving(true)
    try {
      await updateMe({
        onboarding_done: true,
        pref_gender: gender || 'all',
        pref_styles: [...styles],
        pref_colors: [...colors],
        pref_brands: [...brands],
        pref_budget: budget || 'mid',
      })
    } catch (e) {
      console.error('failed to save onboarding prefs', e)
    }
    localStorage.setItem('onboarding_done', '1')
    localStorage.setItem('pref_gender', gender || 'all')
    localStorage.setItem('pref_styles', JSON.stringify([...styles]))
    localStorage.setItem('pref_colors', JSON.stringify([...colors]))
    localStorage.setItem('pref_brands', JSON.stringify([...brands]))
    localStorage.setItem('pref_budget', budget || 'mid')
    setSaving(false)
    onDone()
  }

  function next() {
    if (step === 'done') { finish(); return }
    setStepIndex(i => i + 1)
  }

  function back() {
    setStepIndex(i => Math.max(0, i - 1))
  }

  const canNext =
    step === 'welcome' ||
    step === 'done' ||
    (step === 'gender' && gender !== null) ||
    (step === 'styles' && styles.size > 0) ||
    (step === 'colors' && colors.size > 0) ||
    (step === 'brands' && brands.size > 0) ||
    (step === 'budget' && budget !== null)

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: -80, left: -60,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,78,242,0.14) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 80, right: -80,
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155,125,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '56px 20px 0' }}>
        {!isFirst && !isLast && (
          <button className="back-btn" onClick={back} style={{ flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div style={{ flex: 1 }} />
        {!isFirst && !isLast && (
          <button
            onClick={next}
            style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Пропустить
          </button>
        )}
      </div>

      {/* Progress */}
      {!isFirst && !isLast && (
        <div style={{ padding: '16px 24px 0' }}>
          <ProgressBar step={stepIndex} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 100px' }}>
        {step === 'welcome' && <WelcomeStep />}
        {step === 'gender' && <GenderStep selected={gender} onSelect={setGender} />}
        {step === 'styles' && <StylesStep selected={styles} onToggle={v => toggle(styles, v, setStyles)} />}
        {step === 'colors' && <ColorsStep selected={colors} onToggle={v => toggle(colors, v, setColors)} />}
        {step === 'brands' && <BrandsStep selected={brands} onToggle={v => toggle(brands, v, setBrands)} />}
        {step === 'budget' && <BudgetStep selected={budget} onSelect={setBudget} />}
        {step === 'done' && <DoneStep styles={styles} colors={colors} />}
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        padding: '16px 24px 36px',
        background: 'linear-gradient(to top, var(--bg) 80%, transparent)',
      }}>
        <button
          onClick={next}
          disabled={!canNext || saving}
          style={{
            width: '100%',
            background: canNext ? 'var(--header-accent)' : 'var(--border)',
            color: canNext ? '#fff' : 'var(--text3)',
            border: 'none',
            borderRadius: 18,
            padding: '18px',
            fontSize: 16,
            fontWeight: 700,
            cursor: canNext ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: canNext ? '0 8px 24px rgba(108,78,242,0.35)' : 'none',
          }}
        >
          {step === 'welcome' && <><Sparkles size={18} /> Начать</>}
          {step === 'done' && <><Check size={18} /> В приложение</>}
          {step !== 'welcome' && step !== 'done' && <>Далее <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  )
}

/* ── Individual steps ─────────────────────────────────── */

function WelcomeStep() {
  return (
    <div style={{ padding: '32px 28px 0', textAlign: 'center' }}>
      <div style={{
        width: 100, height: 100,
        borderRadius: 30,
        background: 'linear-gradient(135deg, #6C4EF2, #9B7DFF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 28px',
        boxShadow: '0 12px 36px rgba(108,78,242,0.35)',
        fontSize: 46,
      }}>
        ✨
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 16 }}>
        Твой стиль,<br />твои правила
      </div>
      <div style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.6 }}>
        За 1 минуту расскажи нам о своих предпочтениях — и мы покажем только то, что тебе понравится
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 36 }}>
        {[
          { emoji: '🎯', text: 'Персональная лента товаров' },
          { emoji: '💰', text: 'Уведомления о скидках в вишлисте' },
          { emoji: '👥', text: 'Общие вишлисты с друзьями' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--surface)', borderRadius: 16,
            padding: '14px 18px',
            boxShadow: '0 2px 12px rgba(108,78,242,0.07)',
            border: '1px solid var(--border)',
            textAlign: 'left',
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GenderStep({ selected, onSelect }: { selected: string | null; onSelect: (g: string) => void }) {
  const opts = [
    { id: 'female', emoji: '👩', label: 'Женщинам', desc: 'Платья, блузки, сумки...' },
    { id: 'male', emoji: '👨', label: 'Мужчинам', desc: 'Рубашки, брюки, кроссы...' },
    { id: 'unisex', emoji: '🧑', label: 'Всё подряд', desc: 'Без фильтра по полу' },
  ]
  return (
    <div style={{ padding: '8px 24px 0' }}>
      <StepHeader emoji="👆" title="Для кого смотрим?" sub="Это поможет нам показывать подходящие вещи" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {opts.map(o => (
          <button
            key={o.id}
            onClick={() => onSelect(o.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: selected === o.id ? 'var(--accent-light)' : 'var(--surface)',
              border: `2px solid ${selected === o.id ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 20,
              padding: '18px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 36 }}>{o.emoji}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{o.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{o.desc}</div>
            </div>
            {selected === o.id && (
              <div style={{
                marginLeft: 'auto', width: 26, height: 26, borderRadius: '50%',
                background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Check size={14} color="#fff" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function StylesStep({ selected, onToggle }: { selected: Set<string>; onToggle: (id: string) => void }) {
  return (
    <div style={{ padding: '8px 24px 0' }}>
      <StepHeader emoji="🎨" title="Выбери свой стиль" sub="Можно выбрать несколько — выберем лучшее сочетание" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {STYLES.map(s => {
          const active = selected.has(s.id)
          return (
            <button
              key={s.id}
              onClick={() => onToggle(s.id)}
              style={{
                background: active ? 'var(--accent-light)' : 'var(--surface)',
                border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 18,
                padding: '16px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.emoji}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, lineHeight: 1.4 }}>{s.desc}</div>
              {active && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={12} color="#fff" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ColorsStep({ selected, onToggle }: { selected: Set<string>; onToggle: (id: string) => void }) {
  return (
    <div style={{ padding: '8px 24px 0' }}>
      <StepHeader emoji="🎨" title="Любимые цвета" sub="Что чаще носишь в гардеробе?" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
        {COLORS.map(c => {
          const active = selected.has(c.id)
          return (
            <button
              key={c.id}
              onClick={() => onToggle(c.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'transform 0.15s',
                transform: active ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: c.hex,
                border: active ? '3px solid var(--accent)' : `2px solid ${c.id === 'white' ? 'var(--border)' : 'transparent'}`,
                boxShadow: active ? '0 4px 16px rgba(108,78,242,0.3)' : '0 2px 8px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {active && <Check size={18} color={['white', 'beige'].includes(c.id) ? '#6C4EF2' : '#fff'} />}
              </div>
              <span style={{ fontSize: 11, color: active ? 'var(--accent)' : 'var(--text2)', fontWeight: active ? 700 : 500 }}>
                {c.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BrandsStep({ selected, onToggle }: { selected: Set<string>; onToggle: (id: string) => void }) {
  return (
    <div style={{ padding: '8px 24px 0' }}>
      <StepHeader emoji="🏷️" title="Любимые бренды" sub="Выбери хотя бы один — покажем похожее" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {BRANDS.map(b => {
          const active = selected.has(b.id)
          return (
            <button
              key={b.id}
              onClick={() => onToggle(b.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: active ? 'var(--accent)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--text)',
                border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 40,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {b.logo} {b.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BudgetStep({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div style={{ padding: '8px 24px 0' }}>
      <StepHeader emoji="💳" title="Твой бюджет на вещь" sub="Будем показывать товары в нужном ценовом диапазоне" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {BUDGETS.map(b => {
          const active = selected === b.id
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: active ? 'var(--accent-light)' : 'var(--surface)',
                border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 18,
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{b.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{b.sub}</div>
              </div>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}>
                {active && <Check size={14} color="#fff" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DoneStep({ styles, colors }: { styles: Set<string>; colors: Set<string> }) {
  return (
    <div style={{ padding: '40px 28px 0', textAlign: 'center' }}>
      <div style={{
        width: 110, height: 110,
        borderRadius: 34,
        background: 'linear-gradient(135deg, #6C4EF2, #9B7DFF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 28px',
        boxShadow: '0 16px 40px rgba(108,78,242,0.40)',
        fontSize: 52,
        animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        🎉
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
        Готово!
      </div>
      <div style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 28 }}>
        Мы настроили ленту под тебя.<br />Осталось только свайпать!
      </div>

      <div style={{
        background: 'var(--surface)',
        borderRadius: 20,
        padding: '18px',
        border: '1px solid var(--border)',
        textAlign: 'left',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
          Твои предпочтения
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[...styles].map(s => {
            const found = STYLES.find(x => x.id === s)
            return found ? (
              <span key={s} style={{
                background: 'var(--accent-light)', color: 'var(--accent)',
                borderRadius: 20, padding: '5px 12px', fontSize: 13, fontWeight: 600,
              }}>{found.emoji} {found.label}</span>
            ) : null
          })}
          {[...colors].slice(0, 4).map(c => {
            const found = COLORS.find(x => x.id === c)
            return found ? (
              <span key={c} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--surface2)', color: 'var(--text)',
                borderRadius: 20, padding: '5px 12px', fontSize: 13, fontWeight: 500,
              }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: found.hex, display: 'inline-block', border: c === 'white' ? '1px solid var(--border)' : 'none' }} />
                {found.label}
              </span>
            ) : null
          })}
        </div>
      </div>
    </div>
  )
}

function StepHeader({ title, sub, emoji }: { title: string; sub: string; emoji?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {emoji && <div style={{ fontSize: 32, marginBottom: 10 }}>{emoji}</div>}
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.4, lineHeight: 1.2, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>{sub}</div>
    </div>
  )
}
