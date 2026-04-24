import { Calendar } from 'lucide-react'
import { getDefaultMonthlyRange, isDateRangeDisabled } from '../utils/dateRange'

export default function DateRangeFilter({ value, onChange, label = 'Periodo', hint = '' }) {
  const defaultRange = getDefaultMonthlyRange()
  const isDefaultRange = value.start === defaultRange.start && value.end === defaultRange.end
  const isDisabled = isDateRangeDisabled(value)

  const handleFieldChange = (field, fieldValue) => {
    onChange({
      ...value,
      [field]: fieldValue,
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
      <div className="flex flex-col xl:flex-row xl:items-end gap-3">
        <div className="xl:min-w-[220px]">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Calendar className="w-4 h-4 text-gray-500" />
            {label}
          </div>
          {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          <div>
            <label className="label">Dal</label>
            <input
              type="date"
              className="input"
              value={value.start}
              onChange={(e) => handleFieldChange('start', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Al</label>
            <input
              type="date"
              className="input"
              value={value.end}
              onChange={(e) => handleFieldChange('end', e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChange(defaultRange)}
          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
            isDefaultRange
              ? 'bg-white text-gray-400 border-gray-200'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          Range default
        </button>
        <button
          type="button"
          onClick={() => onChange({ start: '', end: '' })}
          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
            isDisabled
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          Vedi tutto
        </button>
      </div>
    </div>
  )
}
