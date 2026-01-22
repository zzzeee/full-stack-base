export const env = {
    apiUrl: `${process.env.API_BASE_URL}${process.env.API_PREFIX}` || '/api',
} as const