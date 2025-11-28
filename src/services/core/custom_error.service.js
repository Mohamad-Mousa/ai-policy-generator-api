class CustomError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }

    toJSON() {
        if (process.env.NODE_ENV === 'production') {
            return {
                message: 'Something went wrong. Please try again later.',
            };
        } else {
            return {
                message: this.message,
                code: this.code,
                stack: this.stack,
            };
        }
    }
}

module.exports = CustomError; 