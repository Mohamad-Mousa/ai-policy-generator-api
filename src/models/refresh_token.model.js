const { mongoose, ObjectId, Image, enums } = require("./model-template");

const RefreshTokenSchema = new mongoose.Schema({
	referenceId: {
		type: ObjectId,
		required: true, 
	},
	referenceType: {
		type: String,
		enum: enums.referenceTypes,
		required: true
	},
    token: String,
    revoked: Date,
	uid: String,
}, { timestamps: true, id: false });

RefreshTokenSchema.virtual("isExpired").get(() => {
    return Date.now() >= this.expires;
});

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);

module.exports = RefreshToken;