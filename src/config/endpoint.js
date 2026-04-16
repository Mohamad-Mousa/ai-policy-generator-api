module.exports = {
  endpoints: [
    {
      folder: "Public",
      auth: null,
      items: [
        {
          folder: "Question",
          auth: null,
          items: [
            {
              name: "List questions by domain",
              method: "GET",
              url: "{{local}}/public/question",
              params: [
                {
                  key: "domains",
                  value: "{{domainId}},{{domainId2}}",
                  description:
                    "Comma-separated domain ObjectIds (one or more)",
                },
              ],
              successExample: {
                code: 200,
                body: {
                  message: "Success!",
                  error: false,
                  code: 200,
                  results: {
                    items: [
                      {
                        domain: {
                          _id: "68ffb6f06a28a56eb5a740cc",
                          title: "Example domain",
                          description: "Description",
                        },
                        questions: [],
                        totalCount: 0,
                      },
                    ],
                    totalCount: 0,
                  },
                },
              },
              errorExample: {
                code: 400,
                status: "Bad Request",
                body: {
                  message: "Query parameter domains is required",
                  code: 400,
                  error: true,
                },
              },
            },
          ],
        },
        {
          folder: "Assessment",
          auth: null,
          items: [
            {
              name: "Get assessment by id",
              method: "GET",
              url: "{{local}}/public/assessment/{{assessmentId}}",
              params: [],
              successExample: {
                code: 200,
                body: {
                  message: "Success!",
                  error: false,
                  code: 200,
                  results: { assessment: {} },
                },
              },
              errorExample: {
                code: 404,
                status: "Not Found",
                body: {
                  message: "Assessment not found",
                  code: 404,
                  error: true,
                },
              },
            },
            {
              name: "Submit assessment",
              method: "POST",
              url: "{{local}}/public/assessment",
              bodyType: "raw",
              body: {
                status: "completed",
                domain: "{{domainId}}",
                title: "Assessment title",
                description: "Description",
                fullName: "Jane Doe",
                questions: [{ question: "{{questionId}}", answer: "Option A" }],
              },
              params: [],
              successExample: {
                code: 201,
                body: {
                  message: "Success!",
                  error: false,
                  code: 201,
                  results: {},
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
              name: "Submit multiple assessments (by domain)",
              method: "POST",
              url: "{{local}}/public/assessment/bulk",
              bodyType: "raw",
              description:
                "Each entry matches a single POST /public/assessment body (e.g. its own domain and questions). On error, earlier saves are kept.",
              body: {
                assessments: [
                  {
                    status: "completed",
                    domain: "{{domainId}}",
                    title: "Domain A assessment",
                    description: "Description",
                    fullName: "Jane Doe",
                    questions: [
                      { question: "{{questionId}}", answer: "Option A" },
                    ],
                  },
                  {
                    status: "completed",
                    domain: "{{domainId2}}",
                    title: "Domain B assessment",
                    description: "Description",
                    fullName: "Jane Doe",
                    questions: [
                      { question: "{{questionId2}}", answer: 4 },
                    ],
                  },
                ],
              },
              params: [],
              successExample: {
                code: 201,
                body: {
                  message: "Success!",
                  error: false,
                  code: 201,
                  results: { assessments: [], count: 2 },
                },
              },
              errorExample: {
                code: 400,
                status: "Bad Request",
                body: {
                  message: "assessments must be a non-empty array",
                  code: 400,
                  error: true,
                },
              },
            },
          ],
        },
      ],
    },
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
          description:
            "predefinedAssessmentTitle is an optional string reserved for future use (default assessment title). scoreAvg and scorePercentage are derived from linked assessments (non-deleted only), updated when assessments are created, updated, deleted, or imported—not set via domain create/update. Find Many adds overallScoreAvg and overallScorePercentage: the mean of each domain's stored scores over all domains matching the same filters (entire result set, not just the current page).",
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
                predefinedAssessmentTitle: "<string>",
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
                predefinedAssessmentTitle: "<string>",
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
          folder: "Subdomains",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/subdomain",
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
              url: "{{local}}/admin/subdomain/:id",
              params: [],
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/subdomain",
              bodyType: "raw",
              body: {
                title: "<string>",
                domain: "<objectId>",
                isActive: true,
              },
              params: [],
            },
            {
              name: "Update",
              method: "PUT",
              url: "{{local}}/admin/subdomain/update",
              bodyType: "raw",
              body: {
                _id: "<objectId>",
                title: "<string>",
                domain: "<objectId>",
                isActive: true,
              },
              params: [],
            },
            {
              name: "Delete",
              method: "DELETE",
              url: "{{local}}/admin/subdomain/delete/:ids",
              params: [],
            },
          ],
        },
        {
          folder: "Questions",
          auth: null,
          description:
            "Radio answers are stored as [{ text, score }], scores 1–5 unique; checkbox as [{ text }]. List/detail return populated subdomain with nested domain.",
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
                { key: "subdomain", value: "", type: "query" },
                { key: "domain", value: "", type: "query" },
                { key: "type", value: "", type: "query" },
                { key: "sortBy", value: "createdAt", type: "query" },
                { key: "sortDirection", value: "desc", type: "query" },
              ],
            },
            {
              name: "Find One",
              method: "GET",
              url: "{{local}}/admin/question/:id",
              params: [],
              description:
                "Returns question with subdomain (nested domain). Radio options include text + score (1–5).",
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/question",
              bodyType: "raw",
              body: {
                question: "<string>",
                subdomain: "<objectId>",
                type: "text",
                isActive: true,
              },
              params: [],
            },
            {
              name: "Create (Radio, scored 1–5)",
              method: "POST",
              url: "{{local}}/admin/question",
              bodyType: "raw",
              body: {
                question: "<string>",
                subdomain: "<objectId>",
                type: "radio",
                answers: [
                  { text: "<option 1>", score: 1 },
                  { text: "<option 2>", score: 2 },
                  { text: "<option 3>", score: 3 },
                  { text: "<option 4>", score: 4 },
                  { text: "<option 5>", score: 5 },
                ],
                isActive: true,
              },
              params: [],
              description:
                "Radio: at most 5 options; each { text, score } with unique integer score 1–5. Plain strings are accepted and get scores by order (1..n).",
            },
            {
              name: "Create (Checkbox)",
              method: "POST",
              url: "{{local}}/admin/question",
              bodyType: "raw",
              body: {
                question: "<string>",
                subdomain: "<objectId>",
                type: "checkbox",
                answers: ["<string>", "<string>"],
                isActive: true,
              },
              params: [],
              description:
                "Stored as [{ text }]; strings or { text } objects accepted.",
            },
            {
              name: "Create (Number)",
              method: "POST",
              url: "{{local}}/admin/question",
              bodyType: "raw",
              body: {
                question: "<string>",
                subdomain: "<objectId>",
                type: "number",
                min: 0,
                max: 100,
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
                subdomain: "<objectId>",
                type: "text",
                isActive: true,
              },
              params: [],
            },
            {
              name: "Update (Radio)",
              method: "PUT",
              url: "{{local}}/admin/question/update",
              bodyType: "raw",
              body: {
                _id: "<objectId>",
                question: "<string>",
                subdomain: "<objectId>",
                type: "radio",
                answers: [
                  { text: "<option 1>", score: 1 },
                  { text: "<option 2>", score: 2 },
                ],
                isActive: true,
              },
              params: [],
            },
            {
              name: "Update (Checkbox)",
              method: "PUT",
              url: "{{local}}/admin/question/update",
              bodyType: "raw",
              body: {
                _id: "<objectId>",
                question: "<string>",
                subdomain: "<objectId>",
                type: "checkbox",
                answers: ["<string>", "<string>"],
                isActive: true,
              },
              params: [],
            },
            {
              name: "Update (Number)",
              method: "PUT",
              url: "{{local}}/admin/question/update",
              bodyType: "raw",
              body: {
                _id: "<objectId>",
                question: "<string>",
                subdomain: "<objectId>",
                type: "number",
                min: 0,
                max: 100,
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
          folder: "Assessments",
          auth: null,
          description:
            "On create/update/import, scoreAvg (mean of radio scores 1–5) and scorePercentage ((scoreAvg/5)×100) are computed and saved; both null if there are no radio answers. Each question in the body uses question (ObjectId or question text) and answer—not questionRef. For status completed, domain and title are required; description and fullName are optional.",
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/assessment",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "10", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "isActive", value: "", type: "query" },
                { key: "domain", value: "", type: "query" },
                { key: "status", value: "", type: "query" },
                { key: "sortBy", value: "createdAt", type: "query" },
                { key: "sortDirection", value: "desc", type: "query" },
              ],
            },
            {
              name: "Download Template",
              method: "GET",
              url: "{{local}}/admin/assessment/template",
              params: [{ key: "domain", value: "<objectId>", type: "query" }],
              description:
                "Excel hints list radio options as [score] text; answers may be full text or score 1–5.",
            },
            {
              name: "Find One",
              method: "GET",
              url: "{{local}}/admin/assessment/:id",
              params: [],
              description:
                "Includes scoreAvg, scorePercentage, questions (question text, questionRef, answer).",
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/assessment",
              bodyType: "raw",
              body: {
                domain: "<objectId>",
                title: "<string>",
                description: "<string>",
                fullName: "<string>",
                status: "completed",
                isActive: true,
                questions: [
                  {
                    question: "<objectId or question text>",
                    answer: "<string | number for radio score 1–5>",
                  },
                ],
              },
              params: [],
              description:
                "Response includes computed scoreAvg and scorePercentage (from radio answers only).",
            },
            {
              name: "Create (Mixed Question Types)",
              method: "POST",
              url: "{{local}}/admin/assessment",
              bodyType: "raw",
              body: {
                domain: "<objectId>",
                title: "<string>",
                description: "<string>",
                fullName: "<string>",
                status: "completed",
                isActive: true,
                questions: [
                  {
                    question: "<objectId>",
                    answer: "Free text for text-type question",
                  },
                  {
                    question: "<objectId>",
                    answer: "Exact radio option label text",
                  },
                  {
                    question: "<objectId>",
                    answer: 4,
                  },
                  {
                    question: "<objectId>",
                    answer: ["Option1", "Option2"],
                  },
                  {
                    question: "<objectId>",
                    answer: 42,
                  },
                ],
              },
              params: [],
              description:
                "Radio: answer may be option text or integer score 1–5. Checkbox: string array. Number: numeric.",
            },
            {
              name: "Import",
              method: "POST",
              url: "{{local}}/admin/assessment/import",
              bodyType: "form-data",
              fields: [
                { key: "file", value: "path/to/file.xlsx", type: "file" },
              ],
              params: [],
            },
            {
              name: "Update",
              method: "PUT",
              url: "{{local}}/admin/assessment/update",
              bodyType: "raw",
              body: {
                _id: "<objectId>",
                domain: "<objectId>",
                title: "<string>",
                description: "<string>",
                fullName: "<string>",
                status: "draft",
                isActive: true,
                questions: [
                  {
                    question: "<objectId or question text>",
                    answer: "<string | number for radio>",
                  },
                ],
              },
              params: [],
              description:
                "Sending questions recalculates scoreAvg and scorePercentage. Completed assessments cannot be updated.",
            },
            {
              name: "Update (Mixed Question Types)",
              method: "PUT",
              url: "{{local}}/admin/assessment/update",
              bodyType: "raw",
              body: {
                _id: "<objectId>",
                domain: "<objectId>",
                title: "<string>",
                description: "<string>",
                fullName: "<string>",
                status: "completed",
                isActive: true,
                questions: [
                  {
                    question: "<objectId>",
                    answer: "Text answer",
                  },
                  {
                    question: "<objectId>",
                    answer: "Radio option text",
                  },
                  {
                    question: "<objectId>",
                    answer: 3,
                  },
                  {
                    question: "<objectId>",
                    answer: ["Option1", "Option2"],
                  },
                  {
                    question: "<objectId>",
                    answer: 42,
                  },
                ],
              },
              params: [],
            },
            {
              name: "Delete",
              method: "DELETE",
              url: "{{local}}/admin/assessment/delete/:ids",
              params: [],
            },
          ],
        },
        {
          folder: "Policies",
          auth: null,
          description:
            "Every policy must have a country (required in schema and enforced on list/detail). Policies link domains and assessments; optional initiatives[] (Initiative ObjectIds) adds governance context for Claude. Create accepts optional initiatives; IDs are validated against the Initiative collection.",
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/policy",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "10", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "sector", value: "", type: "query" },
                { key: "organizationSize", value: "", type: "query" },
                { key: "riskAppetite", value: "", type: "query" },
                { key: "implementationTimeline", value: "", type: "query" },
                { key: "country", value: "", type: "query" },
                { key: "domain", value: "", type: "query" },
                { key: "assessment", value: "", type: "query" },
                {
                  key: "initiative",
                  value: "",
                  type: "query",
                  description:
                    "Filter policies that include this initiative id (comma-separated)",
                },
                { key: "sortBy", value: "createdAt", type: "query" },
                { key: "sortDirection", value: "desc", type: "query" },
              ],
            },
            {
              name: "Find One",
              method: "GET",
              url: "{{local}}/admin/policy/:id",
              params: [
                { key: "assessmentLimit", value: "10", type: "query" },
                { key: "assessmentPage", value: "1", type: "query" },
              ],
              description:
                "Resolves country, domains, initiatives, and paginated assessments (scoreAvg, scorePercentage, domain, questions). Policies without a country are excluded.",
            },
            {
              name: "Create",
              method: "POST",
              url: "{{local}}/admin/policy",
              bodyType: "raw",
              body: {
                country: "<objectId>",
                domains: ["<objectId>", "<objectId>"],
                assessments: ["<objectId>", "<objectId>"],
                initiatives: ["<objectId>"],
                sector: "Government",
                organizationSize: "Small (< 50 employees)",
                riskAppetite: "Conservative",
                implementationTimeline: "Immediate (0-3 months)",
                analysisType: "detailed",
              },
              params: [],
            },
            {
              name: "Delete",
              method: "DELETE",
              url: "{{local}}/admin/policy/delete/:ids",
              params: [],
            },
          ],
        },
        {
          folder: "Initiatives",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/initiative",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "20", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "status", value: "", type: "query" },
                { key: "category", value: "", type: "query" },
                { key: "startYear", value: "", type: "query" },
                { key: "gaiinCountryId", value: "", type: "query" },
                {
                  key: "intergovernmentalOrganisationId",
                  value: "",
                  type: "query",
                },
                { key: "initiativeTypeId", value: "", type: "query" },
                { key: "aiPrincipleId", value: "", type: "query" },
                { key: "aiTagId", value: "", type: "query" },
                { key: "sortBy", value: "createdAt", type: "query" },
                { key: "sortDirection", value: "desc", type: "query" },
              ],
            },
            {
              name: "Find One",
              method: "GET",
              url: "{{local}}/admin/initiative/:id",
              params: [],
            },
          ],
        },
        {
          folder: "Countries",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/country",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "50", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "value", value: "", type: "query" },
                { key: "sortBy", value: "label", type: "query" },
                { key: "sortDirection", value: "asc", type: "query" },
              ],
            },
          ],
        },
        {
          folder: "Intergovernmental Organisations",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/intergovernmental-organisation",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "50", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "value", value: "", type: "query" },
                { key: "sortBy", value: "label", type: "query" },
                { key: "sortDirection", value: "asc", type: "query" },
              ],
            },
          ],
        },
        {
          folder: "Initiative Types",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/initiative-type",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "50", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "value", value: "", type: "query" },
                { key: "sortBy", value: "label", type: "query" },
                { key: "sortDirection", value: "asc", type: "query" },
              ],
            },
          ],
        },
        {
          folder: "AI Principles",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/ai-principle",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "50", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "value", value: "", type: "query" },
                { key: "subLabel", value: "", type: "query" },
                { key: "sortBy", value: "value", type: "query" },
                { key: "sortDirection", value: "asc", type: "query" },
              ],
            },
          ],
        },
        {
          folder: "AI Tags",
          auth: null,
          items: [
            {
              name: "Find Many",
              method: "GET",
              url: "{{local}}/admin/ai-tag",
              params: [
                { key: "page", value: "1", type: "query" },
                { key: "limit", value: "50", type: "query" },
                { key: "term", value: "", type: "query" },
                { key: "value", value: "", type: "query" },
                { key: "sortBy", value: "label", type: "query" },
                { key: "sortDirection", value: "asc", type: "query" },
              ],
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
