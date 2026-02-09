// src/components/CreatorMultiSelect.jsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { getAllCreators } from '../services/creatorService'

export default function CreatorMultiSelect({ selectedIds = [], onChange }) {
  const [creators, setCreators] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    loadCreators()
  }, [])

  const loadCreators = async () => {
    const { data } = await getAllCreators()
    setCreators(data || [])
  }

  const handleAdd = (creatorId) => {
    if (!selectedIds.includes(creatorId)) {
      onChange([...selectedIds, creatorId])
    }
    setSearchTerm('')
    setShowDropdown(false)
  }

  const handleRemove = (creatorId) => {
    onChange(selectedIds.filter(id => id !== creatorId))
  }

  const selectedCreators = creators.filter(c => selectedIds.includes(c.id))
  const availableCreators = creators.filter(c => 
    !selectedIds.includes(c.id) &&
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <label className="label">Creator Suggeriti</label>
      
      {/* Chips selezionati */}
      {selectedCreators.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCreators.map(creator => (
            <div key={creator.id} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span>{creator.nome}</span>
              <button
                type="button"
                onClick={() => handleRemove(creator.id)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input ricerca */}
      <div className="relative">
        <input
          type="text"
          placeholder="Cerca creator da aggiungere..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          className="input"
        />

        {/* Dropdown risultati */}
        {showDropdown && searchTerm && availableCreators.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {availableCreators.slice(0, 10).map(creator => (
              <button
                type="button"
                key={creator.id}
                onClick={() => handleAdd(creator.id)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
              >
                {creator.nome}
              </button>
            ))}
          </div>
        )}

        {/* Click outside per chiudere dropdown */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    </div>
  )
}
