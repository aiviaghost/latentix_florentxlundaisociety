function PersonaDetail({ persona, onClose }) {
  if (!persona) return null

  const {
    display_name,
    archetype,
    role,
    company_type,
    traits = {},
    behavioral_summary,
    source,
  } = persona

  return (
    <div className="p-6 border-b border-slate-800 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{display_name}</h3>
          <p className="text-sm text-purple-400">{archetype}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Role & Company */}
      {(role || company_type) && (
        <div className="glass rounded-lg p-3">
          {role && <div className="text-sm font-medium">{role}</div>}
          {company_type && <div className="text-xs text-slate-400">{company_type}</div>}
          {source === 'linkedin' && (
            <div className="text-xs text-blue-400 mt-1">
              📊 From LinkedIn
            </div>
          )}
        </div>
      )}

      {/* Behavioral Summary */}
      {behavioral_summary && (
        <div>
          <div className="text-sm font-medium mb-2">Behavioral Profile</div>
          <p className="text-sm text-slate-300">{behavioral_summary}</p>
        </div>
      )}

      {/* Traits */}
      {traits && Object.keys(traits).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Traits</div>

          {typeof traits.risk_tolerance === 'number' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Risk Tolerance</span>
                <span>{Math.round(traits.risk_tolerance * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${traits.risk_tolerance * 100}%` }}
                />
              </div>
            </div>
          )}

          {typeof traits.innovation_openness === 'number' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Innovation Openness</span>
                <span>{Math.round(traits.innovation_openness * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${traits.innovation_openness * 100}%` }}
                />
              </div>
            </div>
          )}

          {typeof traits.social_influence === 'number' && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Social Influence</span>
                <span>{Math.round(traits.social_influence * 100)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500"
                  style={{ width: `${traits.social_influence * 100}%` }}
                />
              </div>
            </div>
          )}

          {traits.domain_expertise && traits.domain_expertise.length > 0 && (
            <div>
              <div className="text-xs mb-2">Domain Expertise</div>
              <div className="flex flex-wrap gap-1">
                {traits.domain_expertise.map((domain, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-slate-800 rounded text-xs"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PersonaDetail
