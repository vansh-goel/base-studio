// Global avatar cache to share avatars across components
let cachedAvatars: string[] = [];
let isFetching = false;

export async function getCachedAvatars(): Promise<string[]> {
    // Return cached avatars if available
    if (cachedAvatars.length > 0) {
        return cachedAvatars;
    }

    // If already fetching, wait for it
    if (isFetching) {
        return new Promise((resolve) => {
            const checkCache = () => {
                if (cachedAvatars.length > 0) {
                    resolve(cachedAvatars);
                } else {
                    setTimeout(checkCache, 100);
                }
            };
            checkCache();
        });
    }

    // Fetch new avatars with unique timestamps to ensure different images
    isFetching = true;
    try {
        const avatarPromises = Array.from({ length: 5 }, (_, index) =>
            fetch(`https://avatar.iran.liara.run/public?t=${Date.now()}&i=${index}`)
                .then(response => response.url)
        );

        cachedAvatars = await Promise.all(avatarPromises);
        return cachedAvatars;
    } catch (error) {
        console.error('Error fetching cached avatars:', error);
        return [];
    } finally {
        isFetching = false;
    }
}

export async function refreshCachedAvatars(): Promise<string[]> {
    isFetching = true;
    try {
        const avatarPromises = Array.from({ length: 5 }, (_, index) =>
            fetch(`https://avatar.iran.liara.run/public?t=${Date.now()}&i=${index}`)
                .then(response => response.url)
        );

        cachedAvatars = await Promise.all(avatarPromises);
        return cachedAvatars;
    } catch (error) {
        console.error('Error refreshing cached avatars:', error);
        return cachedAvatars; // Return old cache on error
    } finally {
        isFetching = false;
    }
}
