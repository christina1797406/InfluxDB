export async function fetchWithAuth(url, options = {}) {
    let accessToken = sessionStorage.getItem("accessToken");

    let response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include", // ensure cookies (refresh token) are sent
    });

    if (response.status === 401) {
        // attempt to refresh
        const refreshRes = await fetch("http://localhost:5001/api/auth/refresh", {
            method: "POST",
            credentials: "include", // refresh cookie auto-sent
        });

        if (refreshRes.ok) {
            const data = await refreshRes.json();
            accessToken = data.accessToken;

            // save new access token
            sessionStorage.setItem("accessToken", accessToken);

            // retry original request with new token
            response = await fetch(url, {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    Authorization: `Bearer ${accessToken}`,
                },
                credentials: "include",
            });
        } else {
            // refresh failed, force logout
            sessionStorage.removeItem("accessToken");
            throw new Error("Session expired, please log in again");
        }
    }

    return response;
}
