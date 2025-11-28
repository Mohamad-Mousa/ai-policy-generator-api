const fs = require("fs");
const {
  Collection,
  Item,
  Request,
  Header,
  Variable,
  ItemGroup,
  RequestAuth,
  Script,
  FormParam,
  Response,
} = require("postman-collection");
const { endpoints } = require("../../config/endpoint");

class PostmanService {
  static generatePostmanCollection() {
    const collection = new Collection({
      info: {
        name: "Phd APIs",
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: this.createItems(endpoints),
      variable: [
        new Variable({ key: "local", value: "http://localhost:3000/api/v1" }),
        new Variable({
          key: "dev",
          value: "https://api-dev.domain.com/api/v1",
        }),
        new Variable({
          key: "prod",
          value: "https://api.domain.com/api/v1",
        }),
        new Variable({ key: "adminToken", value: "" }),
        new Variable({ key: "storeToken", value: "" }),
        new Variable({ key: "userToken", value: "" }),
      ],
    });

    fs.writeFileSync(
      "postman_collection.json",
      JSON.stringify(collection.toJSON(), null, 2)
    );

    console.log("Postman collection updated successfully!");
  }

  static createItems(items, parentAuth = null) {
    return items.map((item) => {
      let itemAuth;
      if (item.auth === null) {
        itemAuth = null;
      } else {
        itemAuth = item.auth;
      }

      if (item.folder) {
        const itemGroup = new ItemGroup({
          name: item.folder,
          item: this.createItems(item.items, itemAuth),
        });

        if (itemAuth) {
          itemGroup.auth = new RequestAuth({
            type: itemAuth.type,
            bearer: [
              {
                key: "token",
                value: itemAuth.token,
                type: "string",
              },
            ],
          });
        }

        if (item.script) {
          itemGroup.events = [
            {
              listen: "test",
              script: new Script({
                type: "text/javascript",
                exec: item.script.exec,
              }),
            },
          ];
        }

        return itemGroup;
      } else {
        const request = new Request({
          url: this.buildUrl(item.url, item.params),
          method: item.method,
          header: [
            new Header({
              key: "Content-Type",
              value: "application/json",
            }),
          ],
          body: this.buildBody(item),
        });

        if (item.bodyType === "form-data") {
          if (
            request.body.formdata &&
            request.body.formdata.members &&
            request.body.formdata.members.length > 0
          ) {
            const fields = request.body.formdata.members.map((field) => {
              return {
                key: field.key,
                value: field.value,
                type: field.type,
                ...(field.description !== undefined && {
                  description: field.description,
                }),
              };
            });
            request.body.formdata = fields;
          }
        }

        if (item.params) {
          request.url.query = this.buildQueryParams(item.params);
        }

        const newItem = new Item({
          name: item.name,
          request: request,
        });

        if (itemAuth) {
          newItem.request.auth = new RequestAuth({
            type: itemAuth.type,
            bearer: [
              {
                key: "token",
                value: itemAuth.token,
                type: "string",
              },
            ],
          });
        }

        if (item.script) {
          newItem.events = [
            {
              listen: "test",
              script: new Script({
                type: "text/javascript",
                exec: item.script.exec,
              }),
            },
          ];
        }

        // Add success and error examples
        newItem.response = this.buildExamples(item);

        return newItem;
      }
    });
  }

  static buildUrl(baseUrl, params) {
    if (!params) return baseUrl;

    let url = baseUrl;

    params
      .filter((param) => param.type === "path")
      .forEach((param) => {
        url = url.replace(`:${param.key}`, `{{${param.key}}}`);
      });

    return url;
  }

  static buildQueryParams(params) {
    return params
      .filter((param) => param.type === "query")
      .map((param) => ({
        key: param.key,
        value: param.value,
        ...(param.description !== undefined && {
          description: param.description,
        }),
      }));
  }

  static buildBody(item) {
    if (item.bodyType === "form-data" && item.fields) {
      const formdata = item.fields.map((field) => {
        return {
          key: field.key,
          value: field.value,
          type: field.type || "text",
          ...(field.description !== undefined && {
            description: field.description,
          }),
        };
      });

      return {
        mode: "formdata",
        formdata: formdata,
      };
    } else if (item.body) {
      return {
        mode: item.bodyType || "raw",
        raw: JSON.stringify(item.body, null, 2),
        options: {
          raw: {
            language: "json",
          },
        },
      };
    }
    return undefined;
  }

  static buildExamples(item) {
    const examples = [];

    // Success example
    const successExample = {
      name: "Success Response",
      originalRequest: {
        method: item.method,
        header: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
        url: {
          raw: item.url,
          host: item.url.split("/")[0],
          path: item.url.split("/").slice(1),
        },
      },
      status: "OK",
      code: item.successExample?.code || 200,
      _postman_previewlanguage: "json",
      header: [
        {
          key: "Content-Type",
          value: "application/json",
        },
      ],
      body: JSON.stringify(
        item.successExample?.body || {
          message: "Success!",
          error: false,
          code: 200,
          results: {},
        },
        null,
        2
      ),
    };

    examples.push(successExample);

    // Error example
    const errorExample = {
      name: "Error Response",
      originalRequest: {
        method: item.method,
        header: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
        url: {
          raw: item.url,
          host: item.url.split("/")[0],
          path: item.url.split("/").slice(1),
        },
      },
      status: item.errorExample?.status || "Bad Request",
      code: item.errorExample?.code || 400,
      _postman_previewlanguage: "json",
      header: [
        {
          key: "Content-Type",
          value: "application/json",
        },
      ],
      body: JSON.stringify(
        item.errorExample?.body || {
          message: "Error message",
          code: 400,
          error: true,
        },
        null,
        2
      ),
    };

    examples.push(errorExample);

    return examples;
  }

  static sanitizePostmanCollection(obj) {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizePostmanCollection(item));
    }
    return obj;
  }
}

module.exports = PostmanService;
