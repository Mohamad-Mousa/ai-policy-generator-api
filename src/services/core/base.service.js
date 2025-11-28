const MongooseLoader = require("../../loaders/mongoose.loader");
const mongoose = require("mongoose");
class BaseService {

    constructor() {
        this.mongoose = mongoose;
        this.models = MongooseLoader.models;
    }

    ObjectId(id) {
        return new MongooseLoader.mongoose.Types.ObjectId(id);
    }
}

module.exports = BaseService;