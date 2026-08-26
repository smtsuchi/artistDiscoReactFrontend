import Cookies from 'js-cookie';

/**
 * Spotify Authorization Code flow with PKCE.
 *
 * Replaces react-spotify-auth, which hardcodes response_type=token (Implicit
 * Grant). Spotify removed that flow, so it now fails with "response_type must
 * be code". PKCE is the correct flow for a browser SPA and needs no client
 * secret, so nothing sensitive ends up in the bundle.
 */

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI =
    import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/callback`;

const SCOPES = [
    'user-read-private',
    'ugc-image-upload',
    'user-read-email',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-follow-modify',
    'user-library-modify',
];

const TOKEN_COOKIE = 'spotifyAuthToken';
const REFRESH_KEY = 'spotifyRefreshToken';
const VERIFIER_KEY = 'spotifyCodeVerifier';
const STATE_KEY = 'spotifyAuthState';

interface TokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
}

const randomString = (length: number): string => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = window.crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values, (v) => possible[v % possible.length]).join('');
};

const base64url = (buffer: ArrayBuffer): string =>
    btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

const codeChallengeFor = async (verifier: string): Promise<string> => {
    const digest = await window.crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(verifier)
    );
    return base64url(digest);
};

const storeTokens = (data: TokenResponse): string => {
    // Give the cookie the same lifetime Spotify gives the token (1 hour).
    Cookies.set(TOKEN_COOKIE, data.access_token, {
        expires: new Date(Date.now() + data.expires_in * 1000),
        sameSite: 'lax',
        secure: window.location.protocol === 'https:',
    });
    if (data.refresh_token) {
        window.localStorage.setItem(REFRESH_KEY, data.refresh_token);
    }
    return data.access_token;
};

const requestToken = async (body: Record<string, string>): Promise<string> => {
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
    });
    const data: TokenResponse = await res.json();
    if (!res.ok) {
        throw new Error(data.error_description || data.error || 'Token request failed');
    }
    return storeTokens(data);
};

export const getToken = (): string | undefined => Cookies.get(TOKEN_COOKIE);

/** True when Spotify has redirected us back to /callback with a result. */
export const hasAuthResponse = (): boolean => {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('error');
};

/** True when we hold a refresh token and can get a token without a redirect. */
export const canRefresh = (): boolean => !!window.localStorage.getItem(REFRESH_KEY);

/** Send the user to Spotify's consent screen. */
export const login = async (): Promise<void> => {
    const verifier = randomString(64);
    const state = randomString(16);
    window.sessionStorage.setItem(VERIFIER_KEY, verifier);
    window.sessionStorage.setItem(STATE_KEY, state);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: SCOPES.join(' '),
        redirect_uri: REDIRECT_URI,
        state,
        code_challenge_method: 'S256',
        code_challenge: await codeChallengeFor(verifier),
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

const doCompleteLogin = async (): Promise<string> => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const state = params.get('state');
    const verifier = window.sessionStorage.getItem(VERIFIER_KEY);
    const expectedState = window.sessionStorage.getItem(STATE_KEY);

    // Strip the code out of the URL so a refresh can't replay it.
    window.history.replaceState({}, document.title, window.location.pathname);
    window.sessionStorage.removeItem(VERIFIER_KEY);
    window.sessionStorage.removeItem(STATE_KEY);

    if (error) { throw new Error(error) }
    if (!code || !verifier) { throw new Error('Missing authorization code') }
    if (state !== expectedState) {
        throw new Error('State mismatch — possible CSRF, please try again');
    }

    return requestToken({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier,
    });
};

/**
 * An authorization code is single use and StrictMode mounts twice in dev, so
 * the in-flight exchange is memoised rather than letting the second mount
 * replay a code that has already been spent.
 */
let loginExchange: Promise<string> | null = null;
export const completeLogin = (): Promise<string> => {
    if (!loginExchange) {
        loginExchange = doCompleteLogin();
    }
    return loginExchange;
};

/** Silently get a fresh access token, or null when there's nothing to use. */
let refreshInFlight: Promise<string | null> | null = null;
export const refreshToken = (): Promise<string | null> => {
    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            const refresh_token = window.localStorage.getItem(REFRESH_KEY);
            if (!refresh_token) { return null }
            try {
                return await requestToken({ grant_type: 'refresh_token', refresh_token });
            } catch {
                window.localStorage.removeItem(REFRESH_KEY);
                return null;
            }
        })();
    }
    return refreshInFlight;
};

export const clearTokens = (): void => {
    Cookies.remove(TOKEN_COOKIE);
    window.localStorage.removeItem(REFRESH_KEY);
    refreshInFlight = null;
};
