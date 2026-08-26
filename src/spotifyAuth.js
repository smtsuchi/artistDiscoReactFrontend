import Cookies from 'js-cookie';

// Spotify removed the Implicit Grant flow (response_type=token), so we use
// Authorization Code with PKCE. PKCE is the browser-safe variant: no client
// secret is ever needed, so nothing sensitive ends up in the bundle.

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/callback`;

const SCOPES = [
    'user-read-private',
    'ugc-image-upload',
    'user-read-email',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-follow-modify',
    'user-library-modify'
];

const TOKEN_COOKIE = 'spotifyAuthToken';
const REFRESH_KEY = 'spotifyRefreshToken';
const VERIFIER_KEY = 'spotifyCodeVerifier';
const STATE_KEY = 'spotifyAuthState';

const randomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = window.crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values, (v) => possible[v % possible.length]).join('');
};

const base64url = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const codeChallengeFor = async (verifier) => {
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return base64url(digest);
};

const storeTokens = (data) => {
    // Give the cookie the same lifetime Spotify gives the token (1 hour).
    Cookies.set(TOKEN_COOKIE, data.access_token, {
        expires: new Date(Date.now() + data.expires_in * 1000),
        sameSite: 'lax',
        secure: window.location.protocol === 'https:'
    });
    if (data.refresh_token) {
        window.localStorage.setItem(REFRESH_KEY, data.refresh_token);
    }
    return data.access_token;
};

const requestToken = async (body) => {
    let res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: CLIENT_ID, ...body })
    });
    let data = await res.json();
    if (!res.ok) {
        throw new Error(data.error_description || data.error || 'Token request failed');
    }
    return storeTokens(data);
};

export const getToken = () => Cookies.get(TOKEN_COOKIE);

/** True when Spotify has redirected us back to /callback with a result. */
export const hasAuthResponse = () => {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('error');
};

/** True when we hold a refresh token and can try for a token without a redirect. */
export const canRefresh = () => !!window.localStorage.getItem(REFRESH_KEY);

/** Send the user to Spotify's consent screen. */
export const login = async () => {
    const verifier = randomString(64);
    const state = randomString(16);
    window.sessionStorage.setItem(VERIFIER_KEY, verifier);
    window.sessionStorage.setItem(STATE_KEY, state);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: SCOPES.join(' '),
        redirect_uri: REDIRECT_URI,
        state: state,
        code_challenge_method: 'S256',
        code_challenge: await codeChallengeFor(verifier)
    });
    window.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

const doCompleteLogin = async () => {
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

    if (error) {
        throw new Error(error);
    }
    if (!code || !verifier) {
        throw new Error('Missing authorization code');
    }
    if (state !== expectedState) {
        throw new Error('State mismatch — possible CSRF, please try again');
    }

    return requestToken({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier
    });
};

/**
 * Trade the ?code= we were redirected back with for an access token.
 *
 * An authorization code is single-use, and React's StrictMode mounts twice in
 * development — so this memoises the in-flight exchange rather than letting the
 * second mount replay a code that has already been spent.
 */
let loginExchange = null;
export const completeLogin = () => {
    if (!loginExchange) {
        loginExchange = doCompleteLogin();
    }
    return loginExchange;
};

/**
 * Silently get a fresh access token. Returns null when there is nothing to
 * refresh with, so callers can fall back to the login screen. Also deduped, so
 * a double mount doesn't fire two refreshes.
 */
let refreshInFlight = null;
export const refreshToken = () => {
    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            const refresh_token = window.localStorage.getItem(REFRESH_KEY);
            if (!refresh_token) {
                return null;
            }
            try {
                return await requestToken({ grant_type: 'refresh_token', refresh_token: refresh_token });
            } catch (err) {
                window.localStorage.removeItem(REFRESH_KEY);
                return null;
            }
        })();
    }
    return refreshInFlight;
};

export const logout = () => {
    Cookies.remove(TOKEN_COOKIE);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem('spotifyUser');
    refreshInFlight = null;
};
