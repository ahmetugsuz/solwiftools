const mongoose = require('mongoose');

const liquidityPoolSchema = new mongoose.Schema({
    tokenMintAddress: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    poolAddress: {
        type: String,
        required: true,
        unique: true
    },
    totalSol: {
        type: Number,
        default: 0
    },
    totalTokens: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add some helpful methods
liquidityPoolSchema.methods.toJSON = function() {
    const obj = this.toObject();
    obj.exists = true;
    return obj;
};

module.exports = mongoose.model('LiquidityPool', liquidityPoolSchema); 