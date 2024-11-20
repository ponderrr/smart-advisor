// Store recommendation type in localStorage
export function storeRecommendationType(type) {
    localStorage.setItem('recommendationType', type);
}

// Get stored recommendation type
export function getStoredRecommendationType() {
    return localStorage.getItem('recommendationType');
}

// Check if user is logged in
export function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Check authentication and handle redirect
export async function handleAuthRedirect(type) {
    storeRecommendationType(type);

    if (isLoggedIn()) {
        window.location.href = 'questions.html';
    } else {
        window.location.href = `sign-in.html?redirectTo=questions.html`;
    }
}

// Handle account button click
export function handleAccountClick() {
    if (isLoggedIn()) {
        window.location.href = 'account.html';
    } else {
        window.location.href = 'sign-in.html?redirectTo=account.html';
    }
}

// Handle redirect after authentication
export function handleRedirectAfterAuth() {
    const redirectTo = new URLSearchParams(window.location.search).get('redirectTo');
    const recommendationType = getStoredRecommendationType();
    
    if (redirectTo) {
        window.location.href = redirectTo;
    } else if (recommendationType) {
        window.location.href = 'questions.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Protect route - use this in pages that require authentication
export function protectRoute(redirectTo = 'sign-in.html') {
    if (!isLoggedIn()) {
        window.location.href = `${redirectTo}?redirectTo=${window.location.pathname}`;
        return false;
    }
    return true;
}

// Clear stored recommendation type
export function clearRecommendationType() {
    localStorage.removeItem('recommendationType');
}