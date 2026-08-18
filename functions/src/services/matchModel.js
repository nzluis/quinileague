const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    matchId: { type: String, required: true, unique: true },
    matchday: { type: Number, required: true, index: true },
    date: { type: Date, required: true },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    status: { type: String, enum: ['scheduled', 'finished'], default: 'scheduled' },
}, { timestamps: true });

module.exports = mongoose.models.Match || mongoose.model('Match', matchSchema);
