const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    matchday: { type: Number, required: true, index: true },
    matchId: { type: String, required: true },
    prediction: { type: String, enum: ['1', 'X', '2'], required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

betSchema.index({ userId: 1, matchday: 1 });

module.exports = mongoose.models.Bet || mongoose.model('Bet', betSchema);
