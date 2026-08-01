/* OpenAPI Playground - Editor, Preview, Validation, Templates, Import/Export */
/* global jsyaml */
(function () {
  'use strict';

  /* ─── State ─── */
  const state = {
    currentTemplate: 'petstore',
    isYaml: true,
    spec: '',
    parsed: null,
    errors: [],
    prevParsedJSON: null,
    resizeActive: false,
  };

  /* ─── Templates ─── */

  const TEMPLATES = {
    petstore: `openapi: 3.0.3
info:
  title: Pet Store API
  description: A sample pet store API for learning OpenAPI specification authoring.
  version: 1.0.0
  contact:
    name: API Learning Team
    email: learn@algoinfinity.dev

servers:
  - url: https://api.petstore.example.com/v1
    description: Production server

paths:
  /pets:
    get:
      summary: List all available pets
      operationId: listPets
      tags:
        - Pets
      parameters:
        - name: limit
          in: query
          description: Maximum number of pets to return
          required: false
          schema:
            type: integer
            format: int32
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
        default:
          description: Unexpected error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    post:
      summary: Create a new pet
      operationId: createPet
      tags:
        - Pets
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePet'
      responses:
        '201':
          description: Pet created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '400':
          description: Invalid input
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /pets/{petId}:
    get:
      summary: Get a pet by ID
      operationId: getPetById
      tags:
        - Pets
      parameters:
        - name: petId
          in: path
          description: The ID of the pet to retrieve
          required: true
          schema:
            type: string
      responses:
        '200':
          description: The pet with the given ID
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '404':
          description: Pet not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    delete:
      summary: Delete a pet
      operationId: deletePet
      tags:
        - Pets
      parameters:
        - name: petId
          in: path
          description: The ID of the pet to delete
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Pet deleted successfully
        '404':
          description: Pet not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: integer
          format: int64
          description: Unique identifier for the pet
        name:
          type: string
          description: Name of the pet
        tag:
          type: string
          description: Optional tag for categorization
        status:
          type: string
          enum:
            - available
            - pending
            - adopted
          description: Current status of the pet
    CreatePet:
      type: object
      required:
        - name
      properties:
        name:
          type: string
          description: Name of the pet
        tag:
          type: string
          description: Optional tag for categorization
    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: integer
          format: int32
          description: Error code
        message:
          type: string
          description: Error message`,
    blog: `openapi: 3.0.3
info:
  title: Blog API
  description: A simple blog API for managing posts and comments.
  version: 1.0.0
  contact:
    name: Blog Dev Team
    email: blog@example.com

servers:
  - url: https://api.blog.example.com/v1
    description: Production
  - url: https://staging.api.blog.example.com/v1
    description: Staging

paths:
  /posts:
    get:
      summary: List all blog posts
      operationId: listPosts
      tags:
        - Posts
      parameters:
        - name: page
          in: query
          description: Page number for pagination
          required: false
          schema:
            type: integer
            default: 1
        - name: per_page
          in: query
          description: Number of posts per page
          required: false
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: A paginated list of posts
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/PostSummary'
                  total:
                    type: integer
                  page:
                    type: integer
                  per_page:
                    type: integer
    post:
      summary: Create a new blog post
      operationId: createPost
      tags:
        - Posts
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePost'
      responses:
        '201':
          description: Post created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  /posts/{postId}:
    get:
      summary: Get a blog post by ID
      operationId: getPostById
      tags:
        - Posts
      parameters:
        - name: postId
          in: path
          required: true
          description: ID of the post
          schema:
            type: string
      responses:
        '200':
          description: The full post with content
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          description: Post not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    put:
      summary: Update a blog post
      operationId: updatePost
      tags:
        - Posts
      parameters:
        - name: postId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdatePost'
      responses:
        '200':
          description: Post updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          description: Post not found
  /posts/{postId}/comments:
    get:
      summary: List comments on a post
      operationId: listComments
      tags:
        - Comments
      parameters:
        - name: postId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: List of comments
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Comment'
    post:
      summary: Add a comment to a post
      operationId: addComment
      tags:
        - Comments
      parameters:
        - name: postId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateComment'
      responses:
        '201':
          description: Comment added
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Comment'

components:
  schemas:
    PostSummary:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        excerpt:
          type: string
        author:
          type: string
        createdAt:
          type: string
          format: date-time
    Post:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        content:
          type: string
        author:
          type: string
        tags:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    CreatePost:
      type: object
      required:
        - title
        - content
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        content:
          type: string
        tags:
          type: array
          items:
            type: string
    UpdatePost:
      type: object
      properties:
        title:
          type: string
        content:
          type: string
        tags:
          type: array
          items:
            type: string
    Comment:
      type: object
      properties:
        id:
          type: string
        author:
          type: string
        content:
          type: string
        createdAt:
          type: string
          format: date-time
    CreateComment:
      type: object
      required:
        - author
        - content
      properties:
        author:
          type: string
        content:
          type: string
    Error:
      type: object
      properties:
        code:
          type: integer
        message:
          type: string`,
    algoinfinity: `openapi: 3.0.3
info:
  title: Algo Infinity Verse API
  description: |
    The official API for the Algo Infinity Verse learning platform.
    Track progress, execute code, manage streaks, and submit quiz results.
  version: 1.0.0
  contact:
    name: Algo Infinity Team
    url: https://algoinfinity.dev

servers:
  - url: https://api.algoinfinity.dev/v1
    description: Production

paths:
  /progress:
    get:
      summary: Get user learning progress
      operationId: getUserProgress
      tags:
        - Progress
      parameters:
        - name: userId
          in: query
          description: User ID (defaults to authenticated user)
          required: false
          schema:
            type: string
      responses:
        '200':
          description: User progress data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Progress'
        '401':
          description: Unauthorized
  /execute:
    post:
      summary: Execute code in sandbox
      operationId: executeCode
      tags:
        - Execution
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExecuteRequest'
      responses:
        '200':
          description: Code execution result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExecuteResult'
        '400':
          description: Invalid request
  /streaks:
    get:
      summary: Get user learning streak
      operationId: getStreak
      tags:
        - Streaks
      parameters:
        - name: userId
          in: query
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Streak information
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Streak'
  /quiz-results:
    post:
      summary: Submit quiz results
      operationId: submitQuizResults
      tags:
        - Quiz
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/QuizSubmission'
      responses:
        '201':
          description: Results recorded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QuizResult'
  /leaderboard:
    get:
      summary: Get platform leaderboard
      operationId: getLeaderboard
      tags:
        - Leaderboard
      parameters:
        - name: period
          in: query
          description: Time period (daily, weekly, monthly, all)
          required: false
          schema:
            type: string
            enum:
              - daily
              - weekly
              - monthly
              - all
            default: weekly
        - name: limit
          in: query
          description: Number of top users
          required: false
          schema:
            type: integer
            default: 50
      responses:
        '200':
          description: Leaderboard entries
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/LeaderboardEntry'

components:
  schemas:
    Progress:
      type: object
      properties:
        userId:
          type: string
        totalProblemsSolved:
          type: integer
        totalXP:
          type: integer
        currentStreak:
          type: integer
        level:
          type: integer
        topicsCompleted:
          type: array
          items:
            type: string
        lastActive:
          type: string
          format: date-time
    ExecuteRequest:
      type: object
      required:
        - sourceCode
        - language
      properties:
        sourceCode:
          type: string
          description: Source code to execute
        language:
          type: string
          enum:
            - javascript
            - python
            - java
            - cpp
            - c
          description: Programming language
        stdin:
          type: string
          description: Standard input
    ExecuteResult:
      type: object
      properties:
        output:
          type: string
        error:
          type: string
        cpuTime:
          type: string
        memory:
          type: string
    Streak:
      type: object
      properties:
        currentStreak:
          type: integer
        longestStreak:
          type: integer
        lastActiveDate:
          type: string
          format: date
        dailyActivity:
          type: array
          items:
            type: object
            properties:
              date:
                type: string
                format: date
              count:
                type: integer
    QuizSubmission:
      type: object
      required:
        - quizId
        - answers
      properties:
        quizId:
          type: string
        answers:
          type: array
          items:
            type: object
            properties:
              questionId:
                type: string
              selectedOption:
                type: integer
        timeSpent:
          type: integer
          description: Time spent in seconds
    QuizResult:
      type: object
      properties:
        quizId:
          type: string
        score:
          type: integer
        total:
          type: integer
        percentage:
          type: number
        passed:
          type: boolean
    LeaderboardEntry:
      type: object
      properties:
        rank:
          type: integer
        username:
          type: string
        xp:
          type: integer
        problemsSolved:
          type: integer
        avatar:
          type: string`,
  };

  /* ─── DOM references ─── */
  const $ = (id) => document.getElementById(id);
  const dom = {
    editor: $('oasEditor'),
    highlight: $('oasHighlightLayer'),
    lineNumbers: $('oasLineNumbers'),
    previewBody: $('oasPreviewBody'),
    previewContent: $('oasPreviewContent'),
    previewEmpty: $('oasPreviewEmpty'),
    errorsPanel: $('oasErrorsPanel'),
    errorsList: $('oasErrorsList'),
    errorCount: $('oasErrorCount'),
    statusDot: $('oasStatusDot'),
    statusText: $('oasStatusText'),
    templateSelect: $('oasTemplateSelect'),
    formatToggle: $('oasFormatToggle'),
    exportYamlBtn: $('oasExportYamlBtn'),
    exportJsonBtn: $('oasExportJsonBtn'),
    importBtn: $('oasImportBtn'),
    fileInput: $('oasFileInput'),
    copyBtn: $('oasCopyBtn'),
    divider: $('oasDivider'),
    split: $('oasSplit'),
    editorTab: null,
    errorsTab: null,
  };

  /* ─── Debounce helper ─── */
  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /* ─── YAML Syntax Highlighting ─── */
  function highlightYAML(text) {
    const lines = text.split('\n');
    return lines.map((line) => {
      let escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Comments
      if (/^\s*#/.test(escaped)) {
        return `<span class="sh-comment">${escaped}</span>`;
      }

      // YAML directives (---, ...)
      if (/^\s*(---|\.\.\.)\s*$/.test(escaped)) {
        return `<span class="sh-directive">${escaped}</span>`;
      }

      // Highlight inline comment at end
      let commentPart = '';
      const commentMatch = escaped.match(/(\s+#.*)$/);
      if (commentMatch) {
        commentPart = commentMatch[1];
        escaped = escaped.slice(0, escaped.length - commentPart.length);
      }

      // Anchors and aliases (& *, !)
      escaped = escaped.replace(
        /(&[\w-]+|\*[\w-]+|![\w-]+)/g,
        '<span class="sh-anchor">$1</span>'
      );

      // Key-value pairs: key: value
      escaped = escaped.replace(
        /^(\s*)([\w.][\w.\- ]*?)(\s*:)/,
        (match, ws, key, colon) => {
          return ws + '<span class="sh-key">' + key + '</span>' + colon;
        }
      );

      // Strings (quoted)
      escaped = escaped.replace(
        /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
        '<span class="sh-string">$1</span>'
      );

      // Booleans
      escaped = escaped.replace(
        /\b(true|false|yes|no|on|off)\b/gi,
        '<span class="sh-boolean">$1</span>'
      );

      // Numbers (integers, floats)
      escaped = escaped.replace(
        /\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
        '<span class="sh-number">$1</span>'
      );

      // Null values
      escaped = escaped.replace(
        /\b(null|~|NULL|Null)\b/g,
        '<span class="sh-boolean">$1</span>'
      );

      // Array indicators
      escaped = escaped.replace(
        /^(\s*)(- )/gm,
        '$1<span class="sh-punctuation">$2</span>'
      );

      if (commentPart) {
        escaped += `<span class="sh-comment">${commentPart}</span>`;
      }

      return escaped;
    }).join('\n');
  }

  /* ─── JSON Syntax Highlighting ─── */
  function highlightJSON(text) {
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Strings
    escaped = escaped.replace(
      /("(?:[^"\\]|\\.)*")/g,
      '<span class="sh-string">$1</span>'
    );
    // Numbers
    escaped = escaped.replace(
      /\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
      '<span class="sh-number">$1</span>'
    );
    // Booleans & null
    escaped = escaped.replace(
      /\b(true|false|null)\b/g,
      '<span class="sh-boolean">$1</span>'
    );
    // Keys (property names)
    escaped = escaped.replace(
      /("(?:[^"\\]|\\.)*")(\s*:)/g,
      (match, key, colon) => '<span class="sh-key">' + key + '</span>' + colon
    );

    return escaped;
  }

  /* ─── Editor sync ─── */
  function updateLineNumbers() {
    const lines = dom.editor.value.split('\n').length;
    dom.lineNumbers.textContent = Array.from(
      { length: Math.max(lines, 1) },
      (_, i) => i + 1
    ).join('\n');
  }

  function syncHighlight() {
    const text = dom.editor.value;
    const codeEl = dom.highlight.querySelector('code');
    if (state.isYaml) {
      codeEl.innerHTML = highlightYAML(text) || ' ';
    } else {
      codeEl.innerHTML = highlightJSON(text) || ' ';
    }
    dom.highlight.scrollTop = dom.editor.scrollTop;
    dom.highlight.scrollLeft = dom.editor.scrollLeft;
  }

  /* ─── Parsing ─── */
  function parseSpec(text) {
    if (!text.trim()) return null;
    try {
      if (state.isYaml) {
        return jsyaml.load(text);
      } else {
        return JSON.parse(text);
      }
    } catch (e) {
      return { _parseError: e.message };
    }
  }

  function formatAsYaml(obj) {
    if (!obj || typeof obj !== 'object') return String(obj);
    return jsyaml.dump(obj, { indent: 2, lineWidth: 120, noRefs: true, sortKeys: false });
  }

  function formatAsJson(obj) {
    return JSON.stringify(obj, null, 2);
  }

  /* ─── Validation ─── */
  function validateOpenAPI(spec) {
    const errors = [];
    if (!spec || typeof spec !== 'object') {
      errors.push('Spec must be a valid YAML/JSON object');
      return errors;
    }
    if (spec._parseError) {
      errors.push('Parse error: ' + spec._parseError);
      return errors;
    }

    // Required: openapi
    if (!spec.openapi) {
      errors.push('Missing required field: "openapi" (e.g., "3.0.3")');
    } else if (typeof spec.openapi !== 'string') {
      errors.push('"openapi" must be a version string (e.g., "3.0.3")');
    }

    // Required: info
    if (!spec.info) {
      errors.push('Missing required field: "info"');
    } else {
      if (!spec.info.title) errors.push('Missing required field: "info.title"');
      if (!spec.info.version) errors.push('Missing required field: "info.version"');
    }

    // Required: paths
    if (!spec.paths) {
      errors.push('Missing required field: "paths"');
    } else if (typeof spec.paths !== 'object' || Object.keys(spec.paths).length === 0) {
      errors.push('"paths" must contain at least one path');
    } else {
      for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
        if (!pathKey.startsWith('/')) {
          errors.push(`Path "${pathKey}" must start with "/"`);
        }
        const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];
        const hasMethod = methods.some((m) => pathItem && pathItem[m]);
        if (!hasMethod) {
          errors.push(`Path "${pathKey}" has no HTTP operations`);
        }
        for (const method of methods) {
          const op = pathItem && pathItem[method];
          if (op) {
            if (!op.responses || Object.keys(op.responses).length === 0) {
              errors.push(`"${method.toUpperCase()} ${pathKey}" is missing "responses"`);
            } else {
              for (const [statusCode, response] of Object.entries(op.responses)) {
                if (!response.description) {
                  errors.push(
                    `"${method.toUpperCase()} ${pathKey}" response "${statusCode}" is missing "description"`
                  );
                }
              }
            }
          }
        }
      }
    }

    return errors;
  }

  /* ─── Preview Rendering ─── */
  function methodClass(method) {
    const m = method.toLowerCase();
    if (m === 'get') return 'get';
    if (m === 'post') return 'post';
    if (m === 'put') return 'put';
    if (m === 'delete') return 'delete';
    if (m === 'patch') return 'patch';
    if (m === 'head') return 'head';
    if (m === 'options') return 'options';
    return 'get';
  }

  function schemaToText(schema, depth) {
    if (!schema) return 'any';
    depth = depth || 0;
    if (depth > 3) return '...';
    if (schema.$ref) {
      const parts = schema.$ref.split('/');
      return parts[parts.length - 1];
    }
    if (schema.type === 'array') {
      const items = schemaToText(schema.items, depth + 1);
      return items + '[]';
    }
    if (schema.type === 'object' && schema.properties) {
      const props = Object.keys(schema.properties).slice(0, 4);
      let str = '{ ';
      str += props.map((p) => p + ': ' + schemaToText(schema.properties[p], depth + 1)).join(', ');
      if (Object.keys(schema.properties).length > 4) str += ', …';
      str += ' }';
      return str;
    }
    if (schema.enum) {
      return schema.enum.map((v) => "'" + v + "'").join(' | ');
    }
    if (schema.oneOf) {
      return schema.oneOf.map((s) => schemaToText(s, depth + 1)).join(' | ');
    }
    let t = schema.type || 'object';
    if (schema.format) t += '(' + schema.format + ')';
    return t;
  }

  function renderSchema(schema) {
    if (!schema) return '<span class="oas-schema-property">any</span>';
    if (schema.$ref) {
      const parts = schema.$ref.split('/');
      return '<span class="oas-schema-prop-name">' + escapeHtml(parts[parts.length - 1]) + '</span>';
    }
    let html = '';
    if (schema.type === 'array' && schema.items) {
      html += renderSchema(schema.items);
      html += ' <span class="oas-schema-prop-type">[]</span>';
      return html;
    }
    if (schema.type === 'object' && schema.properties) {
      html += '<div class="oas-schema-title">Properties</div>';
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const required = schema.required && schema.required.includes(propName);
        html += '<div class="oas-schema-property">';
        html +=
          '<span class="oas-schema-prop-name">' +
          escapeHtml(propName) +
          '</span>' +
          (required ? ' <span class="oas-required-badge">Req</span>' : '') +
          ' — ' +
          '<span class="oas-schema-prop-type">' +
          escapeHtml(schemaToText(propSchema)) +
          '</span>';
        if (propSchema.description) {
          html +=
            ' <span class="oas-detail-description">— ' +
            escapeHtml(propSchema.description) +
            '</span>';
        }
        html += '</div>';
      }
      return html;
    }
    if (schema.enum) {
      return (
        '<span class="oas-schema-prop-type">enum: </span>' +
        schema.enum.map((v) => "'" + escapeHtml(String(v)) + "'").join(' | ')
      );
    }
    return '<span class="oas-schema-prop-type">' + escapeHtml(schemaToText(schema)) + '</span>';
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderParameters(params) {
    if (!params || params.length === 0) return '';
    let html = '<table class="oas-param-table"><thead><tr>';
    html += '<th>Name</th><th>In</th><th>Type</th><th>Required</th><th>Description</th>';
    html += '</tr></thead><tbody>';
    for (const param of params) {
      html += '<tr>';
      html += '<td><span class="oas-param-name">' + escapeHtml(param.name) + '</span></td>';
      html += '<td>' + escapeHtml(param.in || '') + '</td>';
      html += '<td><span class="oas-param-type">' + escapeHtml(schemaToText(param.schema)) + '</span></td>';
      html += '<td>' + (param.required ? '<span class="oas-param-required">Yes</span>' : 'No') + '</td>';
      html += '<td>' + escapeHtml(param.description || '') + '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function renderResponses(responses) {
    if (!responses) return '';
    let html = '';
    for (const [code, response] of Object.entries(responses)) {
      html += '<div class="oas-response-block">';
      html +=
        '<span class="oas-response-code">' +
        escapeHtml(code) +
        '</span>' +
        '<span class="oas-response-desc">' +
        escapeHtml(response.description || '') +
        '</span>';
      if (response.content) {
        for (const [ct, mediaType] of Object.entries(response.content)) {
          if (mediaType.schema) {
            html += '<div class="oas-schema-block"><div class="oas-schema-title">' + escapeHtml(ct) + '</div>' + renderSchema(mediaType.schema) + '</div>';
          }
        }
      }
      html += '</div>';
    }
    return html;
  }

  function renderPreview(spec) {
    if (!spec || typeof spec !== 'object' || spec._parseError) {
      dom.previewContent.hidden = true;
      dom.previewEmpty.hidden = false;
      return;
    }

    dom.previewEmpty.hidden = true;
    dom.previewContent.hidden = false;

    let html = '';

    // ─── API Info ───
    html += '<div class="oas-api-info">';
    html +=
      '<h1 class="oas-api-title">' +
      escapeHtml(spec.info?.title || 'Untitled API') +
      '</h1>';
    html +=
      '<span class="oas-api-version">v' +
      escapeHtml(spec.info?.version || '0.0.0') +
      '</span>';
    if (spec.info?.description) {
      html +=
        '<p class="oas-api-description">' +
        escapeHtml(spec.info.description) +
        '</p>';
    }
    if (spec.servers && spec.servers.length > 0) {
      for (const server of spec.servers) {
        html +=
          '<div class="oas-api-server"><i class="fas fa-check-circle"></i> ' +
          escapeHtml(server.url) +
          (server.description ? ' <span>(' + escapeHtml(server.description) + ')</span>' : '') +
          '</div>';
      }
    }
    html += '</div>';

    // ─── Paths ───
    if (spec.paths) {
      // Collect all tags and their endpoints
      const tagMap = {};
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];

      for (const [path, pathItem] of Object.entries(spec.paths)) {
        for (const method of methods) {
          const op = pathItem && pathItem[method];
          if (op) {
            const tags = op.tags && op.tags.length > 0 ? op.tags : ['default'];
            for (const tag of tags) {
              if (!tagMap[tag]) tagMap[tag] = [];
              tagMap[tag].push({ path, method, operation: op });
            }
          }
        }
      }

      for (const [tag, endpoints] of Object.entries(tagMap)) {
        html += '<div class="oas-tag-group">';
        html += '<h2 class="oas-tag-name">' + escapeHtml(tag) + '</h2>';
        for (const ep of endpoints) {
          const mClass = methodClass(ep.method);
          html += '<div class="oas-endpoint-block ' + mClass + '">';
          html +=
            '<div class="oas-endpoint-header" data-action="toggle-endpoint" role="button" tabindex="0">';
          html +=
            '<span class="oas-method oas-method-' +
            mClass +
            '">' +
            ep.method.toUpperCase() +
            '</span>';
          html += '<span class="oas-path">' + escapeHtml(ep.path) + '</span>';
          if (ep.operation.summary) {
            html +=
              '<span class="oas-summary">' + escapeHtml(ep.operation.summary) + '</span>';
          }
          html += '</div>';

          html += '<div class="oas-endpoint-body">';

          // Description
          if (ep.operation.description) {
            html += '<div class="oas-detail-section">';
            html +=
              '<p class="oas-detail-description">' +
              escapeHtml(ep.operation.description) +
              '</p>';
            html += '</div>';
          }

          // Parameters
          if (ep.operation.parameters && ep.operation.parameters.length > 0) {
            html += '<div class="oas-detail-section">';
            html += '<div class="oas-detail-label">Parameters</div>';
            html += renderParameters(ep.operation.parameters);
            html += '</div>';
          }

          // Request Body
          if (ep.operation.requestBody) {
            html += '<div class="oas-detail-section">';
            html += '<div class="oas-detail-label">Request Body';
            if (ep.operation.requestBody.required) {
              html += ' <span class="oas-required-badge">Required</span>';
            }
            html += '</div>';
            if (ep.operation.requestBody.description) {
              html +=
                '<p class="oas-detail-description">' +
                escapeHtml(ep.operation.requestBody.description) +
                '</p>';
            }
            if (ep.operation.requestBody.content) {
              for (const [ct, media] of Object.entries(ep.operation.requestBody.content)) {
                if (media.schema) {
                  html +=
                    '<div class="oas-schema-block"><div class="oas-schema-title">' +
                    escapeHtml(ct) +
                    '</div>' +
                    renderSchema(media.schema) +
                    '</div>';
                }
              }
            }
            html += '</div>';
          }

          // Responses
          if (ep.operation.responses) {
            html += '<div class="oas-detail-section">';
            html += '<div class="oas-detail-label">Responses</div>';
            html += renderResponses(ep.operation.responses);
            html += '</div>';
          }

          html += '</div>'; // endpoint-body
          html += '</div>'; // endpoint-block
        }
        html += '</div>'; // tag-group
      }
    }

    // ─── Components ───
    if (spec.components?.schemas && Object.keys(spec.components.schemas).length > 0) {
      html += '<div class="oas-components-section">';
      html += '<h2 class="oas-components-title">Schemas</h2>';
      for (const [name, schema] of Object.entries(spec.components.schemas)) {
        html += '<div class="oas-component-block">';
        html += '<div class="oas-component-header">';
        html += '<span class="oas-component-name">' + escapeHtml(name) + '</span>';
        html += '</div>';
        html += '<div class="oas-component-body">';
        html += renderSchema(schema);
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';
    }

    dom.previewContent.innerHTML = html;

    // Wire endpoint toggle
    dom.previewContent.querySelectorAll('[data-action="toggle-endpoint"]').forEach((el) => {
      el.addEventListener('click', function () {
        this.parentElement.classList.toggle('open');
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.parentElement.classList.toggle('open');
        }
      });
    });
  }

  /* ─── Error Display ─── */
  function showErrors(errors) {
    state.errors = errors;
    if (errors.length === 0) {
      dom.errorsPanel.hidden = true;
      dom.errorCount.hidden = true;
      dom.statusDot.className = 'oas-status-dot';
      dom.statusText.textContent = 'Valid';
    } else {
      dom.errorsPanel.hidden = false;
      dom.errorCount.hidden = false;
      dom.errorCount.textContent = errors.length;
      dom.statusDot.className = 'oas-status-dot error';
      dom.statusText.textContent = errors.length + ' error' + (errors.length > 1 ? 's' : '');
      dom.errorsList.innerHTML = errors.map((e) => '<li>' + escapeHtml(e) + '</li>').join('');
    }
  }

  /* ─── Core update ─── */
  /* ─── Immediate editor view sync (runs on every keystroke) ─── */
  function syncEditorView() {
    syncHighlight();
    updateLineNumbers();
  }

  /* ─── Full update: parse, validate, render preview (debounced) ─── */
  function updatePlayground() {
    const text = dom.editor.value;
    state.spec = text;

    if (!text.trim()) {
      state.parsed = null;
      state.errors = [];
      showErrors([]);
      dom.previewContent.hidden = true;
      dom.previewEmpty.hidden = false;
      dom.statusDot.className = 'oas-status-dot';
      dom.statusText.textContent = 'Ready';
      return;
    }

    // Parse
    const parsed = parseSpec(text);
    state.parsed = parsed;

    // Validate
    const errors = validateOpenAPI(parsed);
    showErrors(errors);

    // Update preview
    if (errors.length === 0 && parsed && !parsed._parseError) {
      renderPreview(parsed);
    } else if (parsed && parsed._parseError) {
      dom.previewContent.hidden = true;
      dom.previewEmpty.hidden = false;
      dom.previewEmpty.querySelector('i').className = 'fas fa-triangle-exclamation';
      dom.previewEmpty.querySelector('p').textContent = 'Unable to parse spec. Fix the syntax errors above.';
    }

    // Always sync editor view after full update (catches format/import paths)
    syncEditorView();
  }

  const debouncedUpdate = debounce(updatePlayground, 250);

  /* ─── Template loading ─── */
  function loadTemplate(name) {
    state.currentTemplate = name;
    const spec = TEMPLATES[name];
    if (!spec) return;
    state.isYaml = true;
    dom.formatToggle.setAttribute('aria-checked', 'true');
    dom.editor.value = spec;
    dom.editor.scrollTop = 0;
    syncHighlight();
    updateLineNumbers();
    updatePlayground();
  }

  /* ─── Format toggle (YAML ↔ JSON) ─── */
  function toggleFormat() {
    const currentIsYaml = state.isYaml;
    const text = dom.editor.value;

    if (currentIsYaml) {
      // Convert YAML → JSON
      try {
        const parsed = jsyaml.load(text);
        if (parsed && typeof parsed === 'object') {
          dom.editor.value = formatAsJson(parsed);
          state.isYaml = false;
          dom.formatToggle.setAttribute('aria-checked', 'false');
        } else {
          showToast('Cannot convert: spec is empty or invalid');
          return;
        }
      } catch (e) {
        showToast('Cannot convert to JSON: ' + e.message);
        return;
      }
    } else {
      // Convert JSON → YAML
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          dom.editor.value = formatAsYaml(parsed);
          state.isYaml = true;
          dom.formatToggle.setAttribute('aria-checked', 'true');
        } else {
          showToast('Cannot convert: spec is empty or invalid');
          return;
        }
      } catch (e) {
        showToast('Cannot convert to YAML: ' + e.message);
        return;
      }
    }
    dom.editor.scrollTop = 0;
    updatePlayground();
  }

  /* ─── Export ─── */
  function exportSpec(format) {
    const text = dom.editor.value;
    if (!text.trim()) {
      showToast('Nothing to export. Write a spec first.');
      return;
    }

    const ext = format === 'yaml' ? '.yaml' : '.json';
    const mime = format === 'yaml' ? 'text/yaml' : 'application/json';
    let content = text;
    let filename = 'openapi-' + state.currentTemplate + ext;

    if (format === 'yaml' && !state.isYaml) {
      try {
        const parsed = JSON.parse(text);
        content = formatAsYaml(parsed);
      } catch (e) {
        showToast('Failed to convert to YAML');
        return;
      }
    } else if (format === 'json' && state.isYaml) {
      try {
        const parsed = jsyaml.load(text);
        content = formatAsJson(parsed);
        filename = 'openapi-' + state.currentTemplate + '.json';
      } catch (e) {
        showToast('Failed to convert to JSON');
        return;
      }
    }

    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported as ' + filename);
  }

  /* ─── Import ─── */
  function handleImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'yaml' || ext === 'yml') {
        state.isYaml = true;
        dom.formatToggle.setAttribute('aria-checked', 'true');
      } else if (ext === 'json') {
        state.isYaml = false;
        dom.formatToggle.setAttribute('aria-checked', 'false');
      } else {
        showToast('Unsupported file format. Use .yaml, .yml, or .json');
        return;
      }
      dom.editor.value = content;
      dom.editor.scrollTop = 0;
      updatePlayground();
      showToast('Imported ' + file.name);
    };
    reader.readAsText(file);
  }

  /* ─── Copy to clipboard ─── */
  function copySpec() {
    const text = dom.editor.value;
    if (!text.trim()) {
      showToast('Nothing to copy');
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => showToast('Copied to clipboard'),
      () => showToast('Failed to copy')
    );
  }

  /* ─── Toast notification ─── */
  function showToast(message) {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, 'info');
      return;
    }
    // Fallback toast
    let toast = document.getElementById('oasToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'oasToast';
      toast.style.cssText =
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2C2826;color:#FFF;font-family:Inter,sans-serif;font-size:13px;padding:10px 20px;border-radius:8px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;max-width:400px;text-align:center;';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  }

  /* ─── Split pane resizing ─── */
  function initResize() {
    let startX, startWidth;

    function onMouseDown(e) {
      state.resizeActive = true;
      startX = e.clientX;
      startWidth = dom.editorPanel.getBoundingClientRect().width;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(e) {
      if (!state.resizeActive) return;
      const dx = e.clientX - startX;
      const newWidth = Math.max(300, Math.min(startWidth + dx, dom.split.getBoundingClientRect().width - 300));
      dom.editorPanel.style.width = newWidth + 'px';
    }

    function onMouseUp() {
      state.resizeActive = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    dom.divider.addEventListener('mousedown', onMouseDown);
    dom.divider.addEventListener('touchstart', function (e) {
      const touch = e.touches[0];
      state.resizeActive = true;
      startX = touch.clientX;
      startWidth = dom.editorPanel.getBoundingClientRect().width;
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    }, { passive: true });

    function onTouchMove(e) {
      if (!state.resizeActive) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const newWidth = Math.max(300, Math.min(startWidth + dx, dom.split.getBoundingClientRect().width - 300));
      dom.editorPanel.style.width = newWidth + 'px';
    }

    function onTouchEnd() {
      state.resizeActive = false;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }
  }

  /* ─── Initialization ─── */
  function init() {
    // Cache DOM refs
    dom.editorPanel = dom.editor.closest('.oas-editor-panel');
    dom.editorTab = document.querySelector('.oas-editor-tab[data-tab="editor"]');
    dom.errorsTab = document.querySelector('.oas-editor-tab[data-tab="errors"]');

    // Load default template
    loadTemplate('petstore');

    // Editor events: highlight + line numbers sync immediately, preview debounced
    dom.editor.addEventListener('input', function () {
      syncEditorView();
      debouncedUpdate();
    });
    dom.editor.addEventListener('scroll', function () {
      dom.highlight.scrollTop = dom.editor.scrollTop;
      dom.highlight.scrollLeft = dom.editor.scrollLeft;
      dom.lineNumbers.scrollTop = dom.editor.scrollTop;
    });

    // Tab switching (Editor / Errors)
    dom.editorTab.addEventListener('click', function () {
      dom.editorTab.classList.add('active');
      dom.editorTab.setAttribute('aria-selected', 'true');
      dom.errorsTab.classList.remove('active');
      dom.errorsTab.setAttribute('aria-selected', 'false');
      dom.errorsPanel.hidden = true;
    });
    dom.errorsTab.addEventListener('click', function () {
      dom.errorsTab.classList.add('active');
      dom.errorsTab.setAttribute('aria-selected', 'true');
      dom.editorTab.classList.remove('active');
      dom.editorTab.setAttribute('aria-selected', 'false');
      if (state.errors.length > 0) {
        dom.errorsPanel.hidden = false;
      }
    });

    // Template selector
    dom.templateSelect.addEventListener('change', function () {
      loadTemplate(this.value);
    });

    // Format toggle
    dom.formatToggle.addEventListener('click', toggleFormat);

    // Export
    dom.exportYamlBtn.addEventListener('click', () => exportSpec('yaml'));
    dom.exportJsonBtn.addEventListener('click', () => exportSpec('json'));

    // Import
    dom.importBtn.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        handleImport(this.files[0]);
      }
      this.value = '';
    });

    // Copy
    dom.copyBtn.addEventListener('click', copySpec);

    // Keyboard shortcuts
    dom.editor.addEventListener('keydown', function (e) {
      // Tab = 2 spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const value = this.value;
        this.value = value.slice(0, start) + '  ' + value.slice(end);
        this.selectionStart = this.selectionEnd = start + 2;
        this.dispatchEvent(new Event('input'));
      }
      // Ctrl/Cmd + Enter = format/reindent
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        try {
          const parsed = parseSpec(this.value);
          if (parsed && typeof parsed === 'object' && !parsed._parseError) {
            if (state.isYaml) {
              this.value = formatAsYaml(parsed);
            } else {
              this.value = formatAsJson(parsed);
            }
            this.dispatchEvent(new Event('input'));
            showToast('Spec reformatted');
          }
        } catch (_) { /* ignore */ }
      }
    });

    // Init resize
    initResize();
  }

  /* ─── Start on DOM ready ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
