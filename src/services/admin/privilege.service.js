const BaseService = require("../core/base.service");

class PrivilegeService extends BaseService {

    constructor() {
        super();
        this.AdminType = this.models.AdminType;
        this.Privilege = this.models.Privilege;
    }

    async updateMany(admin_type_id, privileges) {
        const bulkOperations = Object.entries(privileges).map(([function_id, privilege]) => {
            const { read, write, update, delete: _delete } = privilege;
            return {
                updateOne: {
                    filter: { adminType: admin_type_id, function: function_id },
                    update: { read, write, update, delete: _delete },
                }
            }
        });
        return await this.Privilege.bulkWrite(bulkOperations);
    }

    async insertMany(admin_type_id, privileges) {
        const privilegeDocuments = Object.entries(privileges).map(([function_id, privilege]) => {
            const { read, write, update, delete: _delete } = privilege;
            return {
                adminType: admin_type_id,
                function: function_id,
                read,
                write,
                update,
                delete: _delete,
            };
        });
        return await this.Privilege.insertMany(privilegeDocuments);
    }

    async findMany(admin_type_id) {
        return await this.Privilege.aggregate([
            { $match: {adminType: this.ObjectId(admin_type_id)}},
            {
                $lookup: {
                    from: "functions",
                    let: { functionId: "$function" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$functionId"] } } }
                    ],
                    as: "function",
                }
            },
            { $unwind: { path: "$function", preserveNullAndEmptyArrays: true } },
        ])
    }
}

module.exports = PrivilegeService;