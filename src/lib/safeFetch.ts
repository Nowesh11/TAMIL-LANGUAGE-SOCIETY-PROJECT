/**
 * Resilient fetch helpers with retry, timeout, and safe JSON parsing.
 */

export type RetryOptions = {
  retries?: number;
  timeoutMs?: number;
  backoffMs?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit, options?: RetryOptions) {
  const { retries = 2, timeoutMs = 0, backoffMs = 300 } = options || {};
  let attempt = 0;
  let lastErr: any;

  while (attempt <= retries) {
    // Avoid default aborts to prevent net::ERR_ABORTED in the browser
    const controller = typeof AbortController !== 'undefined' && timeoutMs && timeoutMs > 0 ? new AbortController() : undefined;
    const id = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
    try {
      const res = await fetch(input, { ...(init || {}), signal: controller?.signal });
      if (id) clearTimeout(id as any);
      return res;
    } catch (err: any) {
      if (id) clearTimeout(id as any);
      lastErr = err;
      const msg = String(err?.message || '');
      const isAbort = msg.toLowerCase().includes('abort');
      const isNetwork = msg.toLowerCase().includes('network') || msg.includes('ECONN') || msg.includes('ENOTFOUND');
      const shouldRetry = !isAbort && attempt < retries && isNetwork;
      if (!shouldRetry) {
        break;
      }
      attempt += 1;
      await sleep(backoffMs * attempt);
    }
  }
  throw lastErr;
}

export async function safeFetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit, options?: RetryOptions): Promise<T> {
  const res = await safeFetch(input, init, options);
  // Accept non-2xx to still try parse error payloads safely
  let text: string = '';
  try {
    text = await res.text();
  } catch {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    // When HTML or invalid JSON is returned, just give an empty object
    return {} as T;
  }
}