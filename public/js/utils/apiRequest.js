export async function apiRequest(url, method = 'GET', body = null, isFormData = false) {
    const options = {
        method,
        credentials: 'include'
    };

    if (isFormData && body instanceof FormData) {
        options.body = body;
        // Do NOT set Content-Type header for FormData; browser will set it
    } else if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    } else {
        options.headers = { 'Content-Type': 'application/json' };
    }

    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error(`Error during API request to ${url}:`, error);
        throw error;
    }
}
