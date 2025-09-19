const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    features: { type: mongoose.Schema.Types.Mixed },
    labels: { type: mongoose.Schema.Types.Mixed },
    meta: { type: mongoose.Schema.Types.Mixed },
    feature_schema_id: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feature', FeatureSchema);
