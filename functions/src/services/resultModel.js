const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    matchday: { type: Number, required: true, unique: true },
    games: {
        type: Map,
        of: {
            score: String,
            result: String,
        },
        default: {},
    },
}, { timestamps: true });

module.exports = mongoose.models.Result || mongoose.model('Result', resultSchema);
