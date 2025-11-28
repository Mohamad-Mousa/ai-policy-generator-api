const BaseService = require("../core/base.service");

class FunctionService extends BaseService {

    constructor() {
        super();
        this.Function = this.models.Function;
        this.Privilege = this.models.Privilege;
        this.AdminType = this.models.AdminType;
    }

    async findMany(body) {
        return await this.Function.find();
    }

    async create(body) {
        const func = await this.Function({ ...body }).save();
        const adminTypes = await this.AdminType.find();
        let operations = []; 
        adminTypes.forEach((adminType)=>{
            operations.push({
                insertOne: {
                    document: {
                        function: func._id,
                        adminType: adminType._id,
                    },
                },
            });
        })
        this.Privilege.bulkWrite(operations);
    }

    async delete(function_id) {
        await this.Privilege.deleteMany({function: function_id});
        await this.Function.deleteMany({_id: function_id});
    }
}

module.exports = FunctionService;