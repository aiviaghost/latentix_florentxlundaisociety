import { useState } from 'react'

function CreatePanel({ onGenerate, loading, disabled }) {
  const [mode, setMode] = useState('describe') // 'describe' | 'linkedin'
  const [description, setDescription] = useState('')
  const [linkedinUrls, setLinkedinUrls] = useState('')
  const [personaCount, setPersonaCount] = useState(30)

  const handleSubmit = (e) => {
    e.preventDefault()

    const config = {
      mode,
      persona_count: personaCount,
    }

    if (mode === 'describe') {
      config.description = description
    } else {
      config.linkedin_urls = linkedinUrls.split('\n').filter(url => url.trim())
      config.supplement_count = personaCount - config.linkedin_urls.length
    }

    onGenerate(config)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Create Your Society</h2>
        <p className="text-sm text-slate-400">
          Generate AI personas from a description or LinkedIn profiles
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('describe')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              mode === 'describe'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Describe Audience
          </button>
          <button
            type="button"
            onClick={() => setMode('linkedin')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              mode === 'linkedin'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            LinkedIn Import
          </button>
        </div>

        {/* Input Fields */}
        {mode === 'describe' ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              Audience Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 50 European B2B SaaS founders, mixed early and growth stage, tech-heavy"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={4}
              required
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">
              LinkedIn URLs (one per line)
            </label>
            <textarea
              value={linkedinUrls}
              onChange={(e) => setLinkedinUrls(e.target.value)}
              placeholder="https://linkedin.com/in/username1&#10;https://linkedin.com/in/username2"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-xs"
              rows={6}
              required
            />
          </div>
        )}

        {/* Persona Count */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Total Personas: {personaCount}
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={personaCount}
            onChange={(e) => setPersonaCount(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>10</span>
            <span>50</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={disabled || loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating Society...' : 'Generate Society'}
        </button>
      </form>
    </div>
  )
}

export default CreatePanel
