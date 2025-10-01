const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsermodelSchema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        modelData: { type: Schema.Types.Mixed, required: true },
        meta: { type: Schema.Types.Mixed },
    },
    {
        collection: 'user_models',
        timestamps: true,
    }
);

module.exports = mongoose.model('UserModel', UsermodelSchema);
