module.exports = {
  endpoints: [
    // Admin APIs
    {
      folder: "Admin",
      auth: { type: "bearer", token: "{{adminToken}}" },
      items: [
        {
          folder: "Auth",
          auth: null,
          items: [
            {
              name: "Login",
              method: "POST",
              url: "{{local}}/admin/auth/authenticate",
              bodyType: "raw",
              body: { email: "superadmin@gmail.com", password: "P@ssw0rd" },
              script: {
                type: "test",
                exec: [
                  "const response = pm.response.json();",
                  "if (response.results && response.results.accessToken) {",
                  '    pm.collectionVariables.set("adminToken", response.results.accessToken);',
                  "}",
                ],
              },
              successExample: {
                code: 200,
                body: {
                  message: "Success!",
                  error: true,
                  code: 200,
                  results: {
                    admin: {
                      _id: "68ffb6f06a28a56eb5a740cc",
                      email: "superadmin@gmail.com",
                      firstName: "Super",
                      lastName: "Admin",
                      type: {
                        _id: "68ffb6ec6a28a56eb5a740b8",
                        name: "superadmin",
                        isActive: true,
                        isDeleted: false,
                        createdAt: "2025-10-27T18:16:12.352Z",
                        updatedAt: "2025-10-27T18:16:12.352Z",
                      },
                    },
                    accessToken:
                      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGZmYjZmMDZhMjhhNTZlYjVhNzQwY2MiLCJ0eXBlX2lkIjoiNjhmZmI2ZWM2YTI4YTU2ZWI1YTc0MGI4IiwidHlwZSI6InN1cGVyYWRtaW4iLCJpcCI6Ijo6MSIsImlhdCI6MTc2MTU4OTQ0OSwiZXhwIjoxNzYxNjc1ODQ5fQ.XBnOTWv_6UezXpemi5nMqTdc8wJivNP67NPxJPT5BFg",
                    refreshToken:
                      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGZmYjZmMDZhMjhhNTZlYjVhNzQwY2MiLCJ0eXBlX2lkIjoiNjhmZmI2ZWM2YTI4YTU2ZWI1YTc0MGI4IiwidHlwZSI6InN1cGVyYWRtaW4iLCJpcCI6Ijo6MSIsImlhdCI6MTc2MTU4OTQ0OSwiZXhwIjoxNzYyMTk0MjQ5fQ.lgxT-v4yLPvhFAPI7LQAkrpMkus9JjkeyHojXupSUXE",
                    privileges: [
                      {
                        _id: "68ffb6ec6a28a56eb5a740bc",
                        function: {
                          _id: "68ffb6e96a28a56eb5a740a9",
                          name: "admins",
                          key: "admins",
                          createdAt: "2025-10-27T18:16:09.094Z",
                          updatedAt: "2025-10-27T18:16:09.094Z",
                          __v: 0,
                        },
                        adminType: "68ffb6ec6a28a56eb5a740b8",
                        read: true,
                        write: true,
                        update: true,
                        delete: true,
                        createdAt: "2025-10-27T18:16:12.976Z",
                        updatedAt: "2025-10-27T18:16:12.976Z",
                        __v: 0,
                      },
                    ],
                  },
                },
              },
              errorExample: {
                code: 400,
                status: "Bad Request",
                body: {
                  message: "Error message",
                  code: 400,
                  error: true,
                },
              },
              params: [],
            },
            {
              name: "Refresh Token",
              method: "POST",
              url: "{{local}}/admin/auth/refresh-token",
              params: [],
              successExample: {
                code: 200,
                body: {
                  message: "Success!",
                  error: true,
                  code: 200,
                  results: {
                    refreshToken:
                      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGZmYjZmMDZhMjhhNTZlYjVhNzQwY2MiLCJ0eXBlX2lkIjoiNjhmZmI2ZWM2YTI4YTU2ZWI1YTc0MGI4IiwidHlwZSI6InN1cGVyYWRtaW4iLCJpcCI6Ijo6MSIsImlhdCI6MTc2MTU5MTAwNiwiZXhwIjoxNzYyMTk1ODA2fQ.HOJl7-k9uRwOC96Vzi4t6wKI1ZHz9iYA0Y4f3OabgSc",
                    accessToken:
                      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGZmYjZmMDZhMjhhNTZlYjVhNzQwY2MiLCJ0eXBlX2lkIjoiNjhmZmI2ZWM2YTI4YTU2ZWI1YTc0MGI4IiwidHlwZSI6InN1cGVyYWRtaW4iLCJpcCI6Ijo6MSIsImlhdCI6MTc2MTU5MTAwNiwiZXhwIjoxNzYxNjc3NDA2fQ.Cr5UVC4jipSp_G2w-3Lc8n1Y0KY_J-BkKMQWhl1PXuk",
                  },
                },
              },
              errorExample: {
                code: 400,
                status: "Bad Request",
                body: {
                  message: "Error message",
                  code: 400,
                  error: true,
                },
              },
            },
            {
              name: "Logout",
              method: "POST",
              url: "{{local}}/admin/auth/logout",
              params: [],
            },
          ],
        },
        {
          folder: "Admins",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/admins",
              params: [
                {
                  key: "limit",
                  value: "10",
                  type: "query",
                },
                { key: "page", value: "1", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "sortBy", value: "createdAt", type: "query" },
                { key: "sortDirection", value: "desc", type: "query" },
              ],
            },
            {
              name: "Find One",
              method: "GET",
              url: "{{local}}/admin/admins/:id",
              params: [],
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/admins",
              bodyType: "form-data",
              fields: [
                {
                  key: "email",
                  value: "admin@gmail.com",
                  type: "text",
                },
                {
                  key: "firstName",
                  value: "admin",
                  type: "text",
                },
                { key: "lastName", value: "account", type: "text" },
                { key: "password", value: "P@ssw0rd", type: "text" },
                { key: "type", value: "<objectId>", type: "text" },
                { key: "image", value: "path/to/file.jpg", type: "file" },
              ],
              params: [],
            },
            {
              name: "Update",
              method: "PUT",
              url: "{{local}}/admin/admins/update",
              bodyType: "form-data",
              fields: [
                { key: "_id", value: "{{id}}", type: "text" },
                { key: "email", value: "admin@gmail.com", type: "text" },
                { key: "firstName", value: "admin", type: "text" },
                { key: "lastName", value: "account", type: "text" },
                { key: "password", value: "P@ssw0rd", type: "text" },
                { key: "type", value: "<objectId>", type: "text" },
                { key: "image", value: "path/to/file.jpg", type: "file" },
              ],
              params: [],
            },
            {
              name: "Delete",
              method: "DELETE",
              url: "{{local}}/admin/admins/delete/:ids",
              params: [],
            },
          ],
        },
        {
          folder: "Users",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/users",
              params: [
                { key: "limit", value: "10", type: "query" },
                { key: "page", value: "1", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "sortBy", value: "createdAt", type: "query" },
                { key: "sortDirection", value: "desc", type: "query" },
              ],
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/users",
              bodyType: "form-data",
              fields: [
                { key: "email", value: "user@gmail.com", type: "text" },
                { key: "firstName", value: "John", type: "text" },
                { key: "lastName", value: "Doe", type: "text" },
                { key: "password", value: "P@ssw0rd", type: "text" },
                { key: "gender", value: "male", type: "text" },
                { key: "image", value: "path/to/file.jpg", type: "file" },
              ],
              params: [],
            },
            {
              name: "Update",
              method: "PUT",
              url: "{{local}}/admin/users/update",
              bodyType: "form-data",
              fields: [
                { key: "_id", value: "{{id}}", type: "text" },
                { key: "email", value: "user@gmail.com", type: "text" },
                { key: "firstName", value: "John", type: "text" },
                { key: "lastName", value: "Doe", type: "text" },
                { key: "password", value: "P@ssw0rd", type: "text" },
                { key: "gender", value: "male", type: "text" },
                { key: "image", value: "path/to/file.jpg", type: "file" },
              ],
              params: [],
            },
            {
              name: "Delete",
              method: "DELETE",
              url: "{{local}}/admin/users/delete/:ids",
              params: [],
            },
          ],
        },
        {
          folder: "Admin Types",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/admin-type",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "10", type: "query" },
              ],
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/admin-type",
              bodyType: "raw",
              body: {
                name: "<string>",
                privileges: {
                  function_id: {
                    read: true,
                    write: true,
                    update: true,
                    delete: true,
                  },
                },
              },
              params: [],
            },
            {
              name: "Update",
              method: "PUT",
              url: "{{local}}/admin/admin-type/update",
              bodyType: "raw",
              body: {
                _id: "<objectId>",
                name: "<string>",
                privileges: {
                  function_id: {
                    read: true,
                    write: true,
                    update: true,
                    delete: true,
                  },
                },
              },
              params: [],
            },
            {
              name: "Delete",
              method: "DELETE",
              url: "{{local}}/admin/admin-type/delete/:ids",
              params: [],
            },
          ],
        },
        {
          folder: "Domains",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/domain",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "10", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "isActive", value: "", type: "query" },
                { key: "sortBy", value: "createdAt", type: "query" },
                { key: "sortDirection", value: "desc", type: "query" },
              ],
            },
            {
              name: "Find One",
              method: "GET",
              url: "{{local}}/admin/domain/:id",
              params: [],
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/domain",
              bodyType: "raw",
              body: {
                title: "<string>",
                description: "<string>",
                icon: "<string>",
                isActive: true,
                subDomains: ["<string>", "<string>"],
              },
              params: [],
            },
            {
              name: "Update",
              method: "PUT",
              url: "{{local}}/admin/domain/update",
              bodyType: "raw",
              body: {
                _id: "<objectId>",
                title: "<string>",
                description: "<string>",
                icon: "<string>",
                isActive: true,
                subDomains: ["<string>", "<string>"],
              },
              params: [],
            },
            {
              name: "Delete",
              method: "DELETE",
              url: "{{local}}/admin/domain/delete/:ids",
              params: [],
            },
          ],
        },
        {
          folder: "Questions",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/question",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "10", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "isActive", value: "", type: "query" },
                { key: "domain", value: "", type: "query" },
                { key: "sortBy", value: "createdAt", type: "query" },
                { key: "sortDirection", value: "desc", type: "query" },
              ],
            },
            {
              name: "Find One",
              method: "GET",
              url: "{{local}}/admin/question/:id",
              params: [],
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/question",
              bodyType: "raw",
              body: {
                question: "<string>",
                domain: "<objectId>",
                isActive: true,
              },
              params: [],
            },
            {
              name: "Update",
              method: "PUT",
              url: "{{local}}/admin/question/update",
              bodyType: "raw",
              body: {
                _id: "<objectId>",
                question: "<string>",
                domain: "<objectId>",
                isActive: true,
              },
              params: [],
            },
            {
              name: "Delete",
              method: "DELETE",
              url: "{{local}}/admin/question/delete/:ids",
              params: [],
            },
          ],
        },
        {
          folder: "Settings",
          auth: null,
          items: [
            {
              name: "Find One",
              method: "GET",
              url: "{{local}}/admin/setting",
              params: [],
            },
            {
              name: "Update",
              method: "PUT",
              url: "{{local}}/admin/setting/update",
              bodyType: "raw",
              body: {
                contact: {
                  email: "<string>",
                  phone: {
                    code: "<string>",
                    number: "<string>",
                  },
                },
                subscriptions: {
                  notifications: true,
                  emails: true,
                },
                privacyPolicy: "<string>",
                termsAndConditions: "<string>",
              },
              params: [],
            },
          ],
        },
        {
          folder: "Functions",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/function",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "10", type: "query" },
              ],
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/function",
              bodyType: "raw",
              body: {
                name: "<string>",
                key: "<string>",
              },
              params: [],
            },
            {
              name: "Delete",
              method: "DELETE",
              url: "{{local}}/admin/function/delete/:ids",
              params: [],
            },
          ],
        },
        {
          folder: "User Logs",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/user-log",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "10", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "sortBy", value: "createdAt", type: "query" },
                { key: "sortDirection", value: "desc", type: "query" },
              ],
            },
          ],
        },
      ],
    },
  ],
};
