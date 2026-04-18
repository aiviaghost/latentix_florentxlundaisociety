import { useState } from 'react'
import api from '../api/client'

function useSimulation(society) {
  const [simulationState, setSimulationState] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)

  const runSimulation = async (config) => {
    if (!society || !society.society_id) {
      setError('No society loaded')
      return
    }

    setIsRunning(true)
    setError(null)

    // Initialize simulation state
    setSimulationState({
      isRunning: true,
      activities: [],
      activeNodes: [],
      activeLinks: [],
      summary: null,
    })

    try {
      const response = await api.runSimulation({
        society_id: society.society_id,
        ...config,
      })

      const steps = Array.isArray(response.steps) ? response.steps : []
      if (steps.length > 0) {
        await animateSteps(steps, response.summary)
      } else {
        const sim = response.simulation
        const summary = sim
          ? {
              adoption_rate: sim.metrics?.adoption_rate,
              positive_count: sim.metrics?.positive_count,
              negative_count: sim.metrics?.negative_count,
              neutral_count: sim.metrics?.neutral_count,
              top_quotes: (sim.quotes || []).map((q) => ({
                persona: q.name,
                archetype: q.archetype,
                quote: q.quote,
              })),
            }
          : response.summary
        setSimulationState((prev) => ({
          ...prev,
          isRunning: false,
          summary,
        }))
      }

      return response
    } catch (err) {
      setError(err.message || 'Simulation failed')
      console.error('Error running simulation:', err)
      throw err
    } finally {
      setIsRunning(false)
    }
  }

  // Animate step-by-step results for visual effect
  const animateSteps = async (steps, summary) => {
    for (const step of steps) {
      // Wait a bit between steps for animation
      await new Promise((resolve) => setTimeout(resolve, 800))

      const activities = []
      const activeNodes = []
      const activeLinks = []

      // Process reactions in this step
      for (const reaction of step.reactions) {
        activities.push({
          timestamp: new Date().toLocaleTimeString(),
          persona: reaction.agent_id,
          action: reaction.action,
          sentiment: reaction.reaction,
          quote: reaction.quote,
        })

        activeNodes.push(reaction.agent_id)

        // If influenced by someone, show the connection
        if (reaction.influenced_by) {
          activeLinks.push(`${reaction.influenced_by}-${reaction.agent_id}`)
        }
      }

      setSimulationState((prev) => ({
        ...prev,
        activities: [...(prev?.activities || []), ...activities],
        activeNodes: [...new Set([...(prev?.activeNodes || []), ...activeNodes])],
        activeLinks: [...new Set([...(prev?.activeLinks || []), ...activeLinks])],
      }))
    }

    // Final state with summary
    setSimulationState((prev) => ({
      ...prev,
      isRunning: false,
      summary,
    }))
  }

  const resetSimulation = () => {
    setSimulationState(null)
    setError(null)
  }

  return {
    simulationState,
    isRunning,
    error,
    runSimulation,
    resetSimulation,
  }
}

export default useSimulation
