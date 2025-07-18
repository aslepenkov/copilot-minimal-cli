/**
 * Services Module - Core Business Services
 *
 * Exports all service implementations following clean architecture
 */

// AI/ML Services
export { MVPCopilotAPI } from "./copilot-api";

// Infrastructure Services
export { ReadOnlyFileSystem } from "./filesystem";
export type { ILogger } from "./logging";
export { FileLogger } from "./logging";

// Authentication Services
export type { IAuthService, AuthConfig } from "./auth";
export { GitHubAuthService, authService, getToken } from "./auth";
