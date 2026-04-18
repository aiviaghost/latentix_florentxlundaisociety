import { useEffect, useRef } from 'react'

function ActivityFeed({ activities = [] }) {
  const feedRef = useRef(null)

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [activities])

  if (activities.length === 0) return null

  return (
    <div className="glass m-4 rounded-lg max-h-48 overflow-y-auto" ref={feedRef}>
      <div className="p-4 space-y-2">
        <div className="text-xs font-semibold text-slate-400 mb-2">
          Activity Feed
        </div>
        {activities.map((activity, idx) => (
          <div
            key={idx}
            className="text-xs text-slate-300 py-1 border-l-2 border-blue-500 pl-2 animate-fade-in"
          >
            <span className="text-slate-500">{activity.timestamp}</span>
            {' • '}
            <span className="font-medium">{activity.persona}</span>
            {' '}
            <span className={getSentimentColor(activity.sentiment)}>
              {activity.action}
            </span>
            {activity.quote && (
              <>
                {': '}
                <span className="italic">"{activity.quote}"</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function getSentimentColor(sentiment) {
  if (sentiment === 'positive') return 'text-green-400'
  if (sentiment === 'negative') return 'text-red-400'
  return 'text-yellow-400'
}

export default ActivityFeed
