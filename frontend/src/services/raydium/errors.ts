// Add a comprehensive error system
export enum RaydiumErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  
  // Pool errors
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  INVALID_POOL_DATA = 'INVALID_POOL_DATA',
  UNSUPPORTED_POOL_VERSION = 'UNSUPPORTED_POOL_VERSION',
  
  // Transaction errors
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  
  // Token errors
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  INVALID_TOKEN_ACCOUNT = 'INVALID_TOKEN_ACCOUNT',
  
  // User errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

export class RaydiumError extends Error {
  code: RaydiumErrorCode;
  details?: any;
  
  constructor(code: RaydiumErrorCode, message: string, details?: any) {
    super(message);
    this.name = 'RaydiumError';
    this.code = code;
    this.details = details;
  }
  
  static connectionError(message: string, details?: any): RaydiumError {
    return new RaydiumError(
      RaydiumErrorCode.CONNECTION_ERROR,
      message || 'Failed to connect to Solana network',
      details
    );
  }
  
  static poolNotFound(poolId: string): RaydiumError {
    return new RaydiumError(
      RaydiumErrorCode.POOL_NOT_FOUND,
      `Pool not found: ${poolId}`,
      { poolId }
    );
  }
  
  // Add more factory methods for common errors
} 