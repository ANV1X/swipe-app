import { useState } from 'react'

interface Props {
  onDone: (prefs: OnboardingPrefs) => void
}

export interface OnboardingPrefs {
  gender: string
  categories: string[]
  priceMax: number
}

const STEPS = [
  {
    key: 'gender',
    emoji: '👋',
    title: 'Привет! Для кого ищем?',
    subtitle: 'Подберём ленту под твой стиль',
    options: [
      { value: 'female', label: 'Для неё', emoji: '👗' },
      { value: 'male',   label: 'Для него', emoji: '👔' },
      { value: 'unisex', label: 'Для всех', emoji: '✨' },
    ],
  },
  {
    key: 'categories',
    emoji: '🛍️',
    title: 'Что будем свайпать?',
    subtitle: 'Можно выбрать несколько',
    options: [
      { value: 'clothes',     label: 'Одежда',     emoji: '👕' },
      { value: 'shoes',       label: 'Обувь',       emoji: '👟' },
      { value: 'accessories', label: 'Аксессуары',  emoji: '👜' },
    ],
    multi: true,
  },
  {
    key: 'price',
    emoji: '💸',
    title: 'Максимальный бюджет?',
    subtitle: 'Покажем вещи дешевле этой суммы',
    options: [
      { value: '2000',  label: 'до 2 000 ₽',  emoji: '🟢' },
      { value: '5000',  label: 'до 5 000 ₽',  emoji: '🟡' },
      { value: '15000', label: 'до 15 000 ₽', emoji: '🟠' },
      { value: '99999', label: 'Без лимита',   emoji: '💎' },
    ],
  },
]

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const [gender, setGender] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [priceMax, setPriceMax] = useState(0)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const toggleCategory = (val: string) => {
    setCategories(prev =>
      prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
    )
  }

  const canNext = () => {
    if (current.key === 'gender') return !!gender
    if (current.key === 'categories') return categories.length > 0
    if (current.key === 'price') return !!priceMax
    return false
  }

  const handleNext = () => {
    if (!isLast) {
      setStep(s => s + 1)
    } else {
      onDone({ gender, categories, priceMax })
    }
  }

  const isSelected = (val: string) => {
    if (current.key === 'gender') return gender === val
    if (current.key === 'categories') return categories.includes(val)
    if (current.key === 'price') return priceMax === Number(val)
    return false
  }

  const handleSelect = (val: string) => {
    if (current.key === 'gender') setGender(val)
    else if (current.key === 'categories') toggleCategory(val)
    else if (current.key === 'price') setPriceMax(Number(val))
  }

  return (
    <div className="onboarding">
      {/* Прогресс */}
      <div className="onboarding-progress">
        {STEPS.map((_, i) => (
          <div key={i} className={`progress-dot ${i <= step ? 'active' : ''}`} />
        ))}
      </div>

      {/* Контент */}
      <div className="onboarding-content">
        <div className="onboarding-emoji">{current.emoji}</div>
        <h1 className="onboarding-title">{current.title}</h1>
        <p className="onboarding-subtitle">{current.subtitle}</p>

        <div className="onboarding-options">
          {current.options.map(opt => (
            <button
              key={opt.value}
              className={`onboarding-option ${isSelected(opt.value) ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              <span className="option-emoji">{opt.emoji}</span>
              <span className="option-label">{opt.label}</span>
              {isSelected(opt.value) && <span className="option-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Кнопка */}
      <div className="onboarding-footer">
        <button
          className="btn-primary onboarding-btn"
          onClick={handleNext}
          disabled={!canNext()}
        >
          {isLast ? 'Начать свайпать 🔥' : 'Далее →'}
        </button>
        {step === 0 && (
          <button
            className="onboarding-skip"
            onClick={() => onDone({ gender: 'unisex', categories: ['clothes', 'shoes', 'accessories'], priceMax: 99999 })}
          >
            Пропустить
          </button>
        )}
      </div>
    </div>
  )
}
