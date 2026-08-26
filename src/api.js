const hostOf = (url) => {
    try { return new URL(url, window.location.origin).host } catch { return url }
};

/**
 * fetch + JSON parse with errors you can actually act on.
 *
 * Calling res.json() directly is what hid the backend outage: a host that
 * answers with an HTML error page threw "Unexpected token '<'" from deep
 * inside the profile load, which nothing caught and nobody saw. Anything that
 * goes wrong here comes back as an Error carrying the HTTP status.
 *
 * A 404 resolves to null rather than throwing — the backend uses it to mean
 * "no such user yet", which is a normal branch, not a failure.
 */
export async function getJson(url, options) {
    let res;
    try {
        res = await fetch(url, options);
    } catch (err) {
        const error = new Error(`Could not reach ${hostOf(url)}. It may be offline.`);
        error.status = 0;
        throw error;
    }

    const body = await res.text();
    let data = null;
    if (body) {
        try {
            data = JSON.parse(body);
        } catch {
            const error = new Error(
                `${hostOf(url)} returned ${res.status}${res.statusText ? ' ' + res.statusText : ''} instead of JSON.`
            );
            error.status = res.status;
            throw error;
        }
    }

    if (res.status === 404) {
        return null;
    }
    if (!res.ok) {
        const detail = data?.error?.message || data?.error || data?.message;
        const extra = Array.isArray(data?.details) ? ` (${data.details.join('; ')})` : '';
        const error = new Error(`${hostOf(url)} returned ${res.status}${detail ? ': ' + detail : ''}${extra}`);
        error.status = res.status;
        throw error;
    }

    // The modernised backend wraps every response as {success, data, message}.
    // Unwrap centrally so call sites keep reading the payload directly, the way
    // they did against the old API.
    if (data && typeof data === 'object' && data.success === true && 'data' in data) {
        return data.data;
    }
    return data;
}
