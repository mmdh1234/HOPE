const mongoose = require('mongoose');

const blackTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    blacklistedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }, // JWT 만료시간 보관용(정리용)
});

module.exports = mongoose.model('BlacklistedToken', blackTokenSchema);
