const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsermodelSchema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        modelData: { type: Buffer, required: true },
        meta: { type: Schema.Types.Mixed },
    },
    {
        collection: 'user_models',
        timestamps: true, // createdAt, updatedAt 자동
    }
);

module.exports = mongoose.model('UserModel', UsermodelSchema);
