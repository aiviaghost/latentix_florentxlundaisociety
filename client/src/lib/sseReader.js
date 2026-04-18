/**
 * Shared helpers for reading Server-Sent Event bodies from fetch().
 * Two formats are used in this project:
 * - **Framed SSE** (`simulate/*`): blocks separated by `\n\n`, optional `event:` + `data:` lines.
 * - **Society search stream**: each message is `data: {json}\n\n` (JSON includes `type`).
 */

/**
 * Parse one SSE block (lines between blank lines).
 * @param {string} block
 * @returns {{ event: string, data: object | null }}
 */
export function parseSseBlock(block) {
  let event = 'message'
  const dataLines = []
  const normalized = block.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (const line of normalized.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }
  const dataStr = dataLines.join('\n')
  if (!dataStr) return { event, data: null }
  try {
    return { event, data: JSON.parse(dataStr) }
  } catch {
    return { event, data: null }
  }
}

/**
 * Consume framed `text/event-stream` (event + data blocks).
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader
 * @param {(event: string, data: object | null) => void} onFrame
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function consumeFramedSseReader(reader, onFrame, options = {}) {
  const { signal } = options
  const decoder = new TextDecoder()
  let carry = ''

  const flushBlock = (rawBlock) => {
    const block = rawBlock.trim()
    if (!block) return
    const { event, data } = parseSseBlock(block)
    onFrame(event, data)
  }

  while (true) {
    if (signal?.aborted) break
    const { done, value } = await reader.read()
    if (done) break
    carry += decoder.decode(value, { stream: true })
    carry = carry.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const chunks = carry.split('\n\n')
    carry = chunks.pop() ?? ''
    for (const rawBlock of chunks) {
      flushBlock(rawBlock)
    }
  }

  const tail = carry.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (tail) flushBlock(tail)
}

/**
 * Society builder search stream: `data: { "type": "...", ... }\n\n` per event.
 * @param {ReadableStreamDefaultReader<Uint8Array>} reader
 * @param {(record: object) => void} onRecord — full parsed JSON object
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function consumeSocietySearchSseReader(reader, onRecord, options = {}) {
  const { signal } = options
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    if (signal?.aborted) break
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const jsonStr = line.slice(5).trimStart()
      if (!jsonStr) continue
      try {
        const record = JSON.parse(jsonStr)
        if (record && typeof record === 'object') onRecord(record)
      } catch {
        /* ignore malformed line */
      }
    }
  }

  const last = buffer.trim()
  if (last.startsWith('data:')) {
    const jsonStr = last.slice(5).trimStart()
    if (jsonStr) {
      try {
        const record = JSON.parse(jsonStr)
        if (record && typeof record === 'object') onRecord(record)
      } catch {
        /* ignore */
      }
    }
  }
}
