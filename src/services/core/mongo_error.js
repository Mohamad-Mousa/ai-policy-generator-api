const CustomError = require("./custom_error.service");

class MongoError extends CustomError {
    constructor(error) {
        super(error.message)
        this.mapCode(error);
    }

    mapCode(error) {
        switch (error.name) {
            case 'CastError':
                this.code = 400;
                break;
            case 'ValidationError':
                this.code = 422;
                break;
            case 'MongoError':
                this.code = 500
                break;
        }
    }
}
module.exports = MongoError; 