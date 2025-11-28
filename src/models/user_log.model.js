const { mongoose, ObjectId, enums } = require("./model-template");

const UserLog = mongoose.model(
	"UserLog",
	new mongoose.Schema({
		user: {
			type: ObjectId,
			ref: "User"
		},
		action: {
			type: String,
			enum: enums.logActions,
		},
		description: {
			type: String
		},
		table: {
			type: String,
			required: true
		},
		document: {
			type: ObjectId
		}
	}, { timestamps: true })
);

module.exports = UserLog;