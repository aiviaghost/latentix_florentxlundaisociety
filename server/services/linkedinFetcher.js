import axios from 'axios'

/**
 * Fetch LinkedIn profiles using Proxycurl API
 * Person D should implement this
 */
export async function fetchLinkedInProfiles(urls) {
  const apiKey = process.env.PROXYCURL_API_KEY

  if (!apiKey) {
    console.warn('PROXYCURL_API_KEY not set, using fallback cached profiles')
    return loadCachedProfiles(urls.length)
  }

  const profiles = []

  for (const url of urls) {
    try {
      const response = await axios.get('https://nubela.co/proxycurl/api/v2/linkedin', {
        params: { url },
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })

      // Transform Proxycurl response to our persona format
      const persona = transformProxycurlProfile(response.data)
      profiles.push(persona)
    } catch (error) {
      console.error(`Error fetching LinkedIn profile ${url}:`, error.message)
      // Continue with other profiles
    }
  }

  // If no profiles fetched, use cached fallback
  if (profiles.length === 0) {
    return loadCachedProfiles(urls.length)
  }

  return profiles
}

/**
 * Transform Proxycurl profile to our persona format
 */
function transformProxycurlProfile(data) {
  return {
    id: `p_linkedin_${data.public_identifier || Math.random().toString(36).substr(2, 9)}`,
    display_name: data.first_name ? `${data.first_name} ${data.last_name?.[0] || ''}.` : 'Unknown',
    archetype: inferArchetype(data),
    role: data.headline || data.occupation || 'Professional',
    company_type: inferCompanyType(data),
    source: 'linkedin',
    color: getRandomColor(),
    traits: {
      risk_tolerance: inferRiskTolerance(data),
      price_sensitivity: 0.5,
      innovation_openness: inferInnovationOpenness(data),
      social_influence: inferSocialInfluence(data),
      tech_savviness: inferTechSavviness(data),
      domain_expertise: extractDomains(data),
    },
    behavioral_summary: data.summary?.substring(0, 200) || 'LinkedIn professional.',
    connection_tags: extractTags(data),
  }
}

function inferArchetype(data) {
  const headline = (data.headline || '').toLowerCase()
  if (headline.includes('founder') || headline.includes('ceo')) return 'Tech Founder'
  if (headline.includes('product')) return 'Product Leader'
  if (headline.includes('investor') || headline.includes('vc')) return 'Investor'
  if (headline.includes('engineer') || headline.includes('developer')) return 'Developer'
  if (headline.includes('design')) return 'Designer'
  return 'Professional'
}

function inferCompanyType(data) {
  // TODO: Better inference
  return 'startup'
}

function inferRiskTolerance(data) {
  const headline = (data.headline || '').toLowerCase()
  if (headline.includes('founder') || headline.includes('startup')) return 0.8
  if (headline.includes('enterprise') || headline.includes('corporation')) return 0.3
  return 0.5
}

function inferInnovationOpenness(data) {
  const headline = (data.headline || '').toLowerCase()
  if (headline.includes('innovation') || headline.includes('ai') || headline.includes('tech')) return 0.8
  return 0.6
}

function inferSocialInfluence(data) {
  // Based on connections (if available)
  const connections = data.connections || 500
  return Math.min(1, connections / 2000)
}

function inferTechSavviness(data) {
  const skills = (data.skills || []).map(s => s.toLowerCase())
  const techSkills = skills.filter(s =>
    s.includes('programming') || s.includes('software') || s.includes('ai') || s.includes('data')
  )
  return techSkills.length > 0 ? 0.8 : 0.5
}

function extractDomains(data) {
  // TODO: Better domain extraction
  return ['tech', 'saas']
}

function extractTags(data) {
  const headline = (data.headline || '').toLowerCase()
  const tags = []
  if (headline.includes('founder')) tags.push('founder')
  if (headline.includes('product')) tags.push('product')
  if (headline.includes('engineer')) tags.push('engineer')
  return tags
}

function getRandomColor() {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6']
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Load cached profiles as fallback
 */
function loadCachedProfiles(count) {
  // TODO: Person D should create cachedProfiles.json
  console.log('Loading cached profiles (fallback)')

  const mockProfiles = []
  for (let i = 0; i < Math.min(count, 5); i++) {
    mockProfiles.push({
      id: `p_cached_${i}`,
      display_name: `LinkedIn User ${i + 1}`,
      archetype: 'Professional',
      role: 'Professional',
      company_type: 'startup',
      source: 'linkedin_cached',
      color: getRandomColor(),
      traits: {
        risk_tolerance: 0.5,
        price_sensitivity: 0.5,
        innovation_openness: 0.6,
        social_influence: 0.5,
        tech_savviness: 0.6,
        domain_expertise: ['tech'],
      },
      behavioral_summary: 'Cached LinkedIn professional profile.',
      connection_tags: ['professional'],
    })
  }

  return mockProfiles
}
