const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_API_URL || 'https://api.wynnpool.com';

const api = (endpoint: string) => `${API_BASE_URL}${endpoint}`;

export class ApiError extends Error {
    readonly details?: unknown;

    constructor(message: string, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.details = details;
    }
}

/**
 * Turn a failed API response into an ApiError that keeps the server's
 * diagnostics, so the analyzer can show them and include them in reports.
 */
export async function readApiError(response: Response): Promise<ApiError> {
    try {
        const body = await response.json();
        const rawMessage = body?.message;
        const message =
            typeof rawMessage === 'string'
                ? rawMessage
                : Array.isArray(rawMessage)
                    ? rawMessage.join('; ')
                    : `Request failed (HTTP ${response.status})`;
        return new ApiError(message, body?.diagnostics);
    } catch {
        return new ApiError(`Request failed (HTTP ${response.status} ${response.statusText})`);
    }
}

export default api;
