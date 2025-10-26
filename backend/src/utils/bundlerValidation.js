// Validate Bundler Token
const validateBundlerToken = (tokenData) => {
  if (!tokenData.name || !tokenData.name.trim()) return 'Token name is required';
  if (!tokenData.symbol || !tokenData.symbol.trim()) return 'Token symbol is required';
  if (!tokenData.mintType) return 'Token mint type is required';
  if (tokenData.amount !== undefined && tokenData.amount < 0) return 'Amount must be >= 0';
  return null;
};

// Validate Bundler Wallet
const validateBundlerWallet = (walletData) => {
  if (!walletData.publicKey || !walletData.publicKey.trim()) return 'Wallet public key is required';
  if (walletData.balance !== undefined && walletData.balance < 0) return 'Balance must be >= 0';
  return null;
};

// Validate Bundler Bundle
const validateBundlerBundle = (bundleData) => {
  if (!bundleData.token) return 'Bundle must reference a token';
  if (!Array.isArray(bundleData.wallets) || bundleData.wallets.length === 0) return 'Bundle must include at least one wallet';
  if (bundleData.buyAmountSol !== undefined && bundleData.buyAmountSol < 0) return 'Buy amount must be >= 0';
  return null;
};

module.exports = {
  validateBundlerToken,
  validateBundlerWallet,
  validateBundlerBundle
}; 