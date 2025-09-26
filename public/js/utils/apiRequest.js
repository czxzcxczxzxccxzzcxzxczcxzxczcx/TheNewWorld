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
        
        // Check if response is ok
        if (!response.ok) {
            // For 4xx errors, try to parse the JSON error response
            if (response.status >= 400 && response.status < 500) {
                try {
                    const errorText = await response.text();
                    const errorData = JSON.parse(errorText);
                    return errorData; // Return the error data instead of throwing
                } catch (parseError) {
                    // If we can't parse the error response, fall back to generic error
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response has content
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`Non-JSON response from ${url}:`, text);
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
        
        // Try to parse JSON
        const text = await response.text();
        if (!text.trim()) {
            throw new Error(`Empty response from ${url}`);
        }
        
        return JSON.parse(text);
    } catch (error) {
        console.error(`Error during API request to ${url}:`, error);
        throw error;
    }
}
