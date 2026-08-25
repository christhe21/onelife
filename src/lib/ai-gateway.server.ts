import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });

  const publishRunId = (value?: string) => {
    const nextRunId = value?.trim() || undefined;
    if (!runId && nextRunId) runId = nextRunId;
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      try {
        const response = await fetch(input, { ...init, headers });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        throw error;
      }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  };
}

export function createLovableAiGatewayProvider(
  lovableApiKey: string,
  initialRunId?: string,
  options?: { structuredOutputs?: boolean },
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    supportsStructuredOutputs: options?.structuredOutputs ?? false,
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch as typeof fetch,
  });

  return Object.assign(provider, {
    getRunId: runIdFetch.getRunId,
    waitForRunId: runIdFetch.waitForRunId,
  });
}

/** Default chat model for OneLife AI planning features. */
export const PLANNING_MODEL = "google/gemini-3.7-flash";

export function requireLovableApiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this workspace (missing API key).");
  return key;
}

/** Normalize an unknown gateway/SDK error into a user-facing message. */
export function describeAiError(error: unknown): string {
  const anyErr = error as { statusCode?: number; status?: number; message?: string } | undefined;
  const status = anyErr?.statusCode ?? anyErr?.status;
  if (status === 429) return "The AI is busy right now. Please try again in a moment.";
  if (status === 402)
    return "AI credits are exhausted for this workspace. Add credits to keep using AI planning.";
  if (status === 403) return "AI access is blocked for this workspace.";
  if (status === 401) return "AI is not configured correctly for this workspace.";
  if (status && status >= 500) return "The AI service had a hiccup. Please try again.";
  return anyErr?.message || "The AI could not complete this request.";
}
