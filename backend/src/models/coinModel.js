const mongoose = require('mongoose');

// Define the schema for the Coin model with all necessary token fields
const coinSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true
    },
    symbol: { 
        type: String, 
        required: [true, 'Symbol is required'],
        trim: true,
        uppercase: true
    },
    imageUrl: {
        type: String,
        trim: true,
        default: ''  // Empty string if no image is provided
    },
    tokenMintAddress: { 
        type: String, 
        required: [true, 'Token mint address is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
                console.log('Validating tokenMintAddress:', v, 'isValid:', isValid);
                return isValid;
            },
            message: props => `${props.value} is not a valid Solana address!`
        }
    },
    creator: { 
        type: String, 
        required: [true, 'Creator address is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
            },
            message: props => `${props.value} is not a valid Solana address!`
        }
    },
    decimals: { 
        type: Number, 
        default: 9,
        min: [0, 'Decimals cannot be negative'],
        max: [9, 'Decimals cannot exceed 9']
    },
    initialSupply: { 
        type: Number, 
        default: 0,
        min: [0, 'Initial supply cannot be negative']
    },
    fixedSupply: { 
        type: Boolean, 
        default: false 
    },
    revokeAuthorities: {
        freeze: { type: Boolean, default: false },
        mint: { type: Boolean, default: false },
        update: { type: Boolean, default: false }
    },
    associatedTokenAccount: { 
        type: String, 
        required: [true, 'Associated token account is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
            },
            message: props => `${props.value} is not a valid Solana address!`
        }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    creatorName: { type: String, trim: true, default: '' },
    creatorWebsite: { type: String, trim: true, default: '' },
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Add logging middleware
coinSchema.pre('save', function(next) {
    console.log('Pre-save hook triggered for coin:', {
        name: this.name,
        symbol: this.symbol,
        tokenMintAddress: this.tokenMintAddress,
        creator: this.creator,
        isValid: this.validateSync() ? 'no' : 'yes'
    });
    next();
});

// Add error handling middleware
coinSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        console.error('MongoDB Error:', error);
        if (error.code === 11000) {
            next(new Error('Token with this mint address already exists'));
        } else {
            next(error);
        }
    } else {
        console.log('Post-save hook triggered. Saved coin:', {
            name: doc.name,
            symbol: doc.symbol,
            tokenMintAddress: doc.tokenMintAddress,
            creator: doc.creator,
            id: doc._id
        });
        next(error);
    }
});

// Remove duplicate indexes and keep only necessary ones
coinSchema.index({ tokenMintAddress: 1 }, { unique: true });
coinSchema.index({ creator: 1 });

// Transform for JSON responses
coinSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Coin = mongoose.model('Coin', coinSchema);

// Add error handling for index building
Coin.on('index', function(err) {
    if (err) {
        console.error('Error building indexes:', err);
    } else {
        console.log('Indexes built successfully');
    }
});

module.exports = Coin;
