import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

const CLIENT_ID = '01ab8ac9400c4e429b23';

async function getToken(): Promise<string> {
    // Check if token is already in environment variable
    const envToken = process.env.GITHUB_TOKEN;
    if (envToken) {
        return envToken;
    }
    // If no token in env, try to authenticate and get one
    return await auth();
}

export { getToken };
async function auth(): Promise<string> {
    console.log('[INFO] Starting authentication...');

    const authResp = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        body: JSON.stringify({ client_id: CLIENT_ID, scope: 'repo' }),
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    });

    const { device_code, user_code, verification_uri, interval } = await authResp.json() as any;

    console.log(`\nGo to: ${verification_uri}`);
    console.log(`Enter code: ${user_code}`);

    for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, interval * 1000));

        const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            body: JSON.stringify({
                client_id: CLIENT_ID,
                device_code,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });

        const data = await tokenResp.json() as any;

        if (data.access_token) {
            await fs.writeFile(".env", `GITHUB_TOKEN=${data.access_token}\n`);
            console.log('[SUCCESS] Authentication successful!');
            return data.access_token;
        }

        if (data.error !== 'authorization_pending') {
            throw new Error(`Auth error: ${data.error}`);
        }
    }

    throw new Error('Authentication timeout');
}