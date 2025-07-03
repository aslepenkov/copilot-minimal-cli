import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { fetch } from 'undici';
import { logger } from '../utils';

// Constants for GitHub OAuth
const REQUEST1_URL = 'https://github.com/login/device/code';
const REQUEST2_URL = 'https://github.com/login/oauth/access_token';
const CLIENT_ID = '01ab8ac9400c4e429b23';

/**
 * Helper for waiting for any keypress in terminal
 */
const keypress = async (): Promise<void> => {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  return new Promise<void>(resolve =>
    process.stdin.once('data', data => {
      const byteArray = [...data];
      if (byteArray.length > 0 && byteArray[0] === 3) {
        console.log('^C');
        process.exit(1);
      }
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      resolve();
    })
  );
};

/**
 * Authentication function to get GitHub OAuth token
 * Uses device flow for authentication
 */
export async function authCommand(): Promise<string> {
  logger.info('Authenticating with GitHub...');

  try {
    // Request device and user codes
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({
        client_id: CLIENT_ID,
        scope: 'repo',
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const request1 = await fetch(REQUEST1_URL, requestOptions);
    if (!request1.ok) {
      throw new Error(`Failed to start device authentication: ${request1.status} ${request1.statusText}`);
    }

    const response1: any = await request1.json();
    if (!response1.user_code || !response1.device_code || !response1.verification_uri) {
      throw new Error('Invalid response from GitHub device authorization');
    }

    logger.info(`Copy this code: ${response1.user_code}`);
    logger.info('Then press any key to launch the authorization page, paste the code in and approve the access.');
    logger.info(`It will take up to ${response1.interval} seconds after approval for the token to be retrieved.`);

    // await keypress();

    logger.info(`Attempting to open ${response1.verification_uri}, if it doesn't open please manually navigate to the link and paste the code.`);

    const timeout = new Promise((resolve) => setTimeout(resolve, 5000));
    // Use the exec function to open the URL in the default browser
    const execPromise = promisify(exec);

    const openBrowser = async (url: string) => {
      try {
        // Try to open the URL based on the platform
        const platform = process.platform;
        if (platform === 'win32') {
          await execPromise(`start ${url}`);
        } else if (platform === 'darwin') {
          await execPromise(`open ${url}`);
        } else {
          // Assume linux/unix
          await execPromise(`xdg-open ${url}`);
        }
      } catch (e) {
        logger.warn(`Failed to open browser automatically. Please open ${url} manually.`);
      }
    };

    await Promise.race([openBrowser(response1.verification_uri), timeout]);

    let expiresIn = response1.expires_in;
    let accessToken: string | undefined;

    while (expiresIn > 0) {
      const requestOptions: any = {
        method: 'POST',
        body: JSON.stringify({
          client_id: CLIENT_ID,
          device_code: response1.device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      };

      const response2 = await fetch(REQUEST2_URL, requestOptions);
      if (!response2.ok) {
        logger.warn(`Token request failed: ${response2.status} ${response2.statusText}`);
        expiresIn -= response1.interval;
        await new Promise(resolve => setTimeout(resolve, 1000 * response1.interval));
        continue;
      }

      const responseData: any = await response2.json();
      expiresIn -= response1.interval;

      if (responseData.access_token) {
        accessToken = responseData.access_token;
        break;
      } else if (responseData.error === 'authorization_pending') {
        logger.info('Waiting for authorization...');
        await new Promise(resolve => setTimeout(resolve, 1000 * response1.interval));
      } else {
        logger.warn(`Error from GitHub: ${responseData.error}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * response1.interval));
      }
    }

    if (accessToken === undefined) {
      throw new Error('Timed out waiting for authorization');
    } else {
      const envPath = path.join(process.cwd(), '.env');

      let raw = '';
      try {
        raw = await fs.readFile(envPath, 'utf8');
      } catch (error) {
        // File doesn't exist, will create a new one
      }

      const result = raw.split('\n')
        .filter(line => !line.startsWith('GITHUB_OAUTH_TOKEN='))
        .concat([`GITHUB_OAUTH_TOKEN=${accessToken}`])
        .filter(line => line.trim() !== '')
        .join('\n');

      await fs.writeFile(envPath, result);
      logger.success('Wrote token to .env');
      return accessToken;
    }
  } catch (error) {
    logger.error('Authentication failed:', error);
    throw new Error('GitHub authentication failed');
  }
}
