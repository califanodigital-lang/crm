export function MultiSelectChips({ label, value = [], onChange, options }) {
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              value.includes(opt)
                ? 'bg-yellow-400 text-gray-900 border-yellow-400'
                : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}