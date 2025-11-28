const { mongoose, enums } = require("./model-template");

const Function = mongoose.model(
	"Function",
	new mongoose.Schema({
		name: {
			type: String,
			required: true,
		},
		key: {
			type: String,
			required: true,
			unique: true
		}
	}, { timestamps: true })
);

module.exports = Function;