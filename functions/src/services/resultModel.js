const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    matchday: { type: Number, required: true, unique: true },
    points: {
        type: Map,
        of: {
            points: Number,
            correct: Number,
        },
        default: {},
    },
}, { timestamps: true });

module.exports = mongoose.models.Result || mongoose.model('Result', resultSchema);
