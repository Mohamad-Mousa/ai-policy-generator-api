const config = require("../../config");

class CookieService {
    // Default maxAge: 7 Days
    static set(res, name, value, maxAge = 7 * 24 * 60 * 60 * 1000) {
        const cookieOptions = {
            httpOnly: true,
            domain: config.domain,
            secure : false,
            maxAge
        };
        if (config.env == "production") {
            cookieOptions.httpOnly = false;
            cookieOptions.secure = true;
        }
        res.cookie(name, value, cookieOptions);
    }

    static unset(res, name) {
        res.clearCookie(name);
    }
}

module.exports = CookieService;