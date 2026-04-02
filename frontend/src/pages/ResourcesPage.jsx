import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function ResourcesPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [resources,   setResources]   = useState([])
  const [categories,  setCategories]  = useState([])
  const [activecat,   setActiveCat]   = useState('all')
  const [search,      setSearch]      = useState('')
  const [selected,    setSelected]    = useState(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchResources()
  }, [])

  async function fetchCategories() {
    try {
      const res = await api.get('/resources/categories/')
      setCategories(res.data.results || res.data)
    } catch { console.error('categories failed') }
  }

  async function fetchResources(catSlug = null, q = null) {
    setLoading(true)
    try {
      let url = '/resources/?'
      if (catSlug && catSlug !== 'all') url += `category=${catSlug}&`
      if (q) url += `search=${encodeURIComponent(q)}&`
      const res = await api.get(url)
      setResources(res.data.results || res.data)
    } catch { toast.error('Could not load resources') }
    finally { setLoading(false) }
  }

  function handleCatChange(slug) {
    setActiveCat(slug)
    fetchResources(slug === 'all' ? null : slug, search || null)
  }

  function handleSearch(e) {
    setSearch(e.target.value)
    fetchResources(activecat === 'all' ? null : activecat, e.target.value || null)
  }

  async function openResource(resource) {
    setSelected(resource)
    // Track view
    try { await api.post(`/resources/${resource.id}/view/`) } catch {}
  }

  const card = `rounded-xl border overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${
    dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  }`

  const TYPE_ICONS = { article: '📄', guide: '📋', video: '🎬', pdf: '📕', audio: '🎧' }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`font-display text-2xl font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
          Wellness Resources
        </h1>
        <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
          Evidence-based mental health guides, articles and tools
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-green-400 ${
            dark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
                 : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
          }`}
          placeholder="Search resources…"
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => handleCatChange('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            activecat === 'all'
              ? 'bg-green-600 text-white'
              : dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat.slug}
            onClick={() => handleCatChange(cat.slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activecat === cat.slug
                ? 'bg-green-600 text-white'
                : dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading resources…</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <p className={`${dark ? 'text-gray-400' : 'text-gray-500'}`}>No resources found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map(r => (
            <div key={r.id} className={card} onClick={() => openResource(r)}>
              {/* Thumb */}
              <div className="h-28 flex items-center justify-center text-5xl"
                style={{ background: r.category?.color || '#EBF3EC' }}>
                {r.category?.icon || '📄'}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                    {r.category?.name || 'General'}
                  </span>
                  <span className="text-xs text-gray-400">{TYPE_ICONS[r.content_type]} {r.content_type}</span>
                  {r.is_featured && <span className="text-xs text-yellow-500">⭐ Featured</span>}
                </div>
                <h3 className={`font-display font-semibold text-base leading-snug mb-2 ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {r.title}
                </h3>
                <p className={`text-xs leading-relaxed line-clamp-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {r.description}
                </p>
              </div>
              <div className={`px-4 py-3 border-t flex justify-between text-xs ${
                dark ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'
              }`}>
                <span>👁 {r.view_count || 0} views</span>
                <span>🕐 {r.read_time_minutes} min read</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource reader modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl my-8 rounded-2xl shadow-2xl ${dark ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b"
              style={{ borderColor: dark ? '#374151' : '#E5E7EB' }}>
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                    {selected.category?.name}
                  </span>
                  <span className="text-xs text-gray-400">🕐 {selected.read_time_minutes} min read</span>
                </div>
                <h2 className={`font-display text-xl font-semibold leading-snug ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {selected.title}
                </h2>
              </div>
              <button onClick={() => setSelected(null)}
                className={`text-2xl leading-none flex-shrink-0 ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[65vh] overflow-y-auto">
              <p className={`text-sm leading-relaxed mb-6 italic ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                {selected.description}
              </p>
              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                {selected.content}
              </div>
            </div>

            {/* Footer */}
            {selected.external_url && (
              <div className={`p-4 border-t ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                <a href={selected.external_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-green-500 text-sm font-semibold hover:underline">
                  🔗 Read full resource externally →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
