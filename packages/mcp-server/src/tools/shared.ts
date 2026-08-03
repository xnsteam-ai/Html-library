import type { ZodTypeAny } from 'zod'

/**
 * A tool as this server defines it, kept deliberately close to the SDK's
 * registerTool signature so server.ts is a thin loop rather than a wrapper.
 */
export interface ToolDef {
  name: string
  config: {
    title: string
    description: string
    inputSchema: Record<string, ZodTypeAny>
  }
  handler: (args: any) => Promise<CallToolResult>
}

export interface CallToolResult {
  content: { type: 'text'; text: string }[]
  isError?: boolean
}

/** Structured data as pretty JSON — readable by a model without a parser. */
export function json(value: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }
}

/**
 * A failure the model can act on. Never throws: a thrown error inside a stdio
 * server can take down the session, and "component not found" is an ordinary
 * result, not a crash.
 */
export function fail(message: string, extra?: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message, ...extra }, null, 2) }],
    isError: true,
  }
}
