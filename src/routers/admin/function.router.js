let express = require("express");

const FunctionController = require("../../controllers/admin/function.controller");

class FunctionRouter {

    constructor() {
        this.functionController = new FunctionController();
    }

    configureRoutes(app) {
        let router = express.Router();

        router.get("", this.functionController.findMany);
        router.post("", this.functionController.create);
        router.delete("/:function_id", this.functionController.delete);

        app.use("/function", router);
    }
}
module.exports = FunctionRouter;