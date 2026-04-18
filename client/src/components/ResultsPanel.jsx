function ResultsPanel({ results }) {
  if (!results) return null

  const {
    adoption_rate = 0,
    positive_count = 0,
    negative_count = 0,
    neutral_count = 0,
    top_quotes = [],
    clusters = {},
  } = results

  const total = positive_count + negative_count + neutral_count
  const positivePercent = total > 0 ? (positive_count / total) * 100 : 0
  const negativePercent = total > 0 ? (negative_count / total) * 100 : 0
  const neutralPercent = total > 0 ? (neutral_count / total) * 100 : 0

  return (
    <div className="p-6 space-y-6 border-t border-slate-800">
      <div>
        <h2 className="text-xl font-semibold mb-2">Simulation Results</h2>
        <p className="text-sm text-slate-400">
          How your idea spread through the network
        </p>
      </div>

      {/* Adoption Rate */}
      <div className="glass rounded-lg p-4">
        <div className="text-sm text-slate-400 mb-1">Adoption Rate</div>
        <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          {Math.round(adoption_rate * 100)}%
        </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Sentiment Breakdown</div>

        {/* Positive */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-400">Positive</span>
            <span className="text-slate-400">{positive_count} ({Math.round(positivePercent)}%)</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${positivePercent}%` }}
            />
          </div>
        </div>

        {/* Neutral */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-yellow-400">Neutral</span>
            <span className="text-slate-400">{neutral_count} ({Math.round(neutralPercent)}%)</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${neutralPercent}%` }}
            />
          </div>
        </div>

        {/* Negative */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-400">Negative</span>
            <span className="text-slate-400">{negative_count} ({Math.round(negativePercent)}%)</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${negativePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Quotes */}
      {top_quotes && top_quotes.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium">Key Reactions</div>
          {top_quotes.slice(0, 5).map((quote, idx) => (
            <div key={idx} className="glass rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">
                {quote.persona} • {quote.archetype}
              </div>
              <div className="text-sm italic">"{quote.quote}"</div>
            </div>
          ))}
        </div>
      )}

      {/* Cluster Performance */}
      {clusters && Object.keys(clusters).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Cluster Performance</div>
          {Object.entries(clusters).map(([clusterName, data]) => (
            <div key={clusterName} className="glass rounded-lg p-3">
              <div className="text-sm font-medium capitalize">{clusterName}</div>
              <div className="text-xs text-slate-400">
                {data.adoption_rate ? `${Math.round(data.adoption_rate * 100)}% adoption` : 'No data'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ResultsPanel
