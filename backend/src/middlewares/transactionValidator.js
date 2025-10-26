const { PublicKey } = require('@solana/web3.js');
const ErrorResponse = require('../utils/errorResponse');

const validateTransaction = async (req, res, next) => {
    try {
        const { baseToken, quoteToken, walletPublicKey } = req.body;

        // Validate public keys
        if (baseToken) {
            try {
                new PublicKey(baseToken);
            } catch (error) {
                throw new ErrorResponse('Invalid base token address', 400);
            }
        }

        if (quoteToken) {
            try {
                new PublicKey(quoteToken);
            } catch (error) {
                throw new ErrorResponse('Invalid quote token address', 400);
            }
        }

        if (walletPublicKey) {
            try {
                new PublicKey(walletPublicKey);
            } catch (error) {
                throw new ErrorResponse('Invalid wallet address', 400);
            }
        }

        // Validate amounts
        if (req.body.baseAmount && isNaN(req.body.baseAmount)) {
            throw new ErrorResponse('Invalid base amount', 400);
        }

        if (req.body.quoteAmount && isNaN(req.body.quoteAmount)) {
            throw new ErrorResponse('Invalid quote amount', 400);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = validateTransaction; 