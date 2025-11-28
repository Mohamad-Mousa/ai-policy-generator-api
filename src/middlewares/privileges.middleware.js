const ResponseService = require("../services/core/response.service");
const BaseService = require("../services/core/base.service");
const MongooseLoader = require("../loaders/mongoose.loader");

class PrivilegesMiddleware extends BaseService {
    static Privilege = MongooseLoader.models.Privilege;
    static ACCESS_TYPES = {
        R: "read",
        U: "update",
        W: "write",
        D: "delete",
    };
    static isAllowed(functionKey) {
        return async (req, res, next) => {
            const adminType = req.decoded.type_id;
            const method = req.method.toLowerCase();
            let access;
            if (method == "get") access = PrivilegesMiddleware.ACCESS_TYPES.R;
            if (method == "put") access = PrivilegesMiddleware.ACCESS_TYPES.U;
            if (method == "post") access = PrivilegesMiddleware.ACCESS_TYPES.W;
            if (method == "delete") access = PrivilegesMiddleware.ACCESS_TYPES.D;
            const privilege = await this.Privilege.aggregate([
                { $lookup: {
                    from: "functions", 
                    localField: "function",
                    foreignField: "_id",
                    as: "function"
                }},
                { $unwind: { path: "$function"} },
                { $match: { adminType: new MongooseLoader.mongoose.Types.ObjectId(adminType), "function.key": functionKey }}
            ]);
            const [firstPrivilege] = privilege;
            if (!firstPrivilege || !firstPrivilege[access]) {
                return ResponseService.error(res, "Unauthorized", 401);
            }
            next();
        }
    }
}

module.exports = PrivilegesMiddleware;