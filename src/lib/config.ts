const getRequiredEnvVar = (name: string): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Environment variable ${name} is required but was not provided.`);
    }

    return value;
};

export const DATABASE_URL = getRequiredEnvVar('DATABASE_URL');
export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
export const NEXTAUTH_SECRET = getRequiredEnvVar('NEXTAUTH_SECRET');
