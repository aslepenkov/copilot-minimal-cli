/**
 * Authentication Service
 *
 * Handles GitHub OAuth authentication for Copilot API access
 * Following clean architecture principles with proper separation of concerns
 */

import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

// Load environment variables
dotenv.config();

export interface IAuthService {
  getToken(): Promise<string>;
  authenticate(): Promise<string>;
}

export interface AuthConfig {
  clientId: string;
  scope: string;
  maxRetries: number;
  retryInterval: number;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  interval: number;
}

export interface TokenResponse {
  access_token?: string;
  error?: string;
}

export class GitHubAuthService implements IAuthService {
  private readonly config: AuthConfig;

  constructor(config?: Partial<AuthConfig>) {
    this.config = {
      clientId: "01ab8ac9400c4e429b23",
      scope: "repo",
      maxRetries: 30,
      retryInterval: 5,
      ...config,
    };
  }

  async getToken(): Promise<string> {
    // Check if token is already in environment variable
    const envToken = process.env.GITHUB_TOKEN;
    if (envToken) {
      console.log("[INFO] Using existing GitHub token from environment");
      return envToken;
    }

    // If no token in env, authenticate and get one
    console.log("[INFO] No GitHub token found, starting authentication...");
    return await this.authenticate();
  }

  async authenticate(): Promise<string> {
    console.log("[INFO] Starting GitHub OAuth device flow...");

    const deviceCode = await this.requestDeviceCode();
    this.displayUserInstructions(deviceCode);

    const accessToken = await this.pollForAccessToken(deviceCode.device_code);
    await this.saveTokenToEnv(accessToken);

    console.log("[SUCCESS] Authentication successful!");
    return accessToken;
  }

  private async requestDeviceCode(): Promise<DeviceCodeResponse> {
    const response = await fetch("https://github.com/login/device/code", {
      method: "POST",
      body: JSON.stringify({
        client_id: this.config.clientId,
        scope: this.config.scope,
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to request device code: ${response.statusText}`);
    }

    return (await response.json()) as DeviceCodeResponse;
  }

  private displayUserInstructions(deviceCode: DeviceCodeResponse): void {
    console.log(`\n🔗 Go to: ${deviceCode.verification_uri}`);
    console.log(`📋 Enter code: ${deviceCode.user_code}`);
    console.log("⏳ Waiting for authorization...\n");
  }

  private async pollForAccessToken(deviceCode: string): Promise<string> {
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      await this.sleep(this.config.retryInterval * 1000);

      const tokenResponse = await this.requestAccessToken(deviceCode);

      if (tokenResponse.access_token) {
        return tokenResponse.access_token;
      }

      if (tokenResponse.error !== "authorization_pending") {
        throw new Error(`Auth error: ${tokenResponse.error}`);
      }

      // Show progress indicator
      process.stdout.write(".");
    }

    throw new Error(
      "Authentication timeout - user did not authorize within the time limit",
    );
  }

  private async requestAccessToken(deviceCode: string): Promise<TokenResponse> {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        body: JSON.stringify({
          client_id: this.config.clientId,
          device_code: deviceCode,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to request access token: ${response.statusText}`);
    }

    return (await response.json()) as TokenResponse;
  }

  private async saveTokenToEnv(accessToken: string): Promise<void> {
    try {
      await fs.writeFile(".env", `GITHUB_TOKEN=${accessToken}\n`);
      console.log("\n💾 Token saved to .env file");
    } catch (error) {
      console.warn("\n⚠️  Could not save token to .env file:", error);
      console.log("💡 Please manually set GITHUB_TOKEN environment variable");
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Default auth service instance
export const authService = new GitHubAuthService();

// Legacy function for backward compatibility
export const getToken = () => authService.getToken();
