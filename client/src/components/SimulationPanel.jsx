import { useState } from 'react'

function SimulationPanel({ onSimulate, loading, disabled }) {
  const [content, setContent] = useState('')
  const [seedStrategy, setSeedStrategy] = useState('auto') // 'auto' | 'influencers' | 'random'

  const handleSubmit = (e) => {
    e.preventDefault()
    onSimulate({ content, seed_strategy: seedStrategy })
    // Clear content after simulation for "try another" flow
    // setContent('')
  }

  return (
    <div className="p-6 border-t border-slate-800 space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Test Your Idea</h2>
        <p className="text-sm text-slate-400">
          Simulate how your startup idea spreads through the society
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Idea/Pitch Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Your Startup Idea
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g., An AI tool that generates financial reports from raw data. $49/month for startups, $299/month for enterprises."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={5}
            required
          />
        </div>

        {/* Seed Strategy */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Seed Strategy
          </label>
          <select
            value={seedStrategy}
            onChange={(e) => setSeedStrategy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="auto">Auto (Smart Selection)</option>
            <option value="influencers">Target Influencers</option>
            <option value="random">Random Sample</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={disabled || loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Running Simulation...' : 'Run Simulation'}
        </button>
      </form>
    </div>
  )
}

export default SimulationPanel
