(function () {
  'use strict';

  var HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
  var SENSITIVE_KEYS = /password|passwd|ssn|social.?security|credit.?card|cvv|secret|api.?key|private.?key/i;
  var RATE_HINT = /x-ratelimit|ratelimit|retry-after/i;

  var lastReport = null;

  var DEMO_BASELINE = {
    openapi: '3.0.3',
    info: { title: 'Demo Shop API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email'],
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', maxLength: 254 },
            role: { type: 'string', enum: ['user', 'admin', 'viewer'] }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            total: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'paid', 'shipped'] }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/users': {
        get: {
          operationId: 'listUsers',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/User' } }
                }
              },
              headers: {
                'X-RateLimit-Limit': { schema: { type: 'integer' } },
                'X-RateLimit-Remaining': { schema: { type: 'integer' } }
              }
            }
          }
        },
        post: {
          operationId: 'createUser',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', maxLength: 254 },
                    name: { type: 'string', maxLength: 100 }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/User' } }
              }
            }
          }
        }
      },
      '/users/{userId}': {
        get: {
          operationId: 'getUser',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }
          ],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/User' } }
              }
            }
          }
        }
      },
      '/orders': {
        get: {
          operationId: 'listOrders',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } }
                }
              }
            }
          }
        }
      }
    }
  };

  var DEMO_CANDIDATE = {
    openapi: '3.0.3',
    info: { title: 'Demo Shop API', version: '2.0.0' },
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['id', 'email', 'displayName'],
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            displayName: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            password: { type: 'string' },
            ssn: { type: 'string' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            total: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'paid'] }
          }
        }
      }
    },
    paths: {
      '/users': {
        get: {
          operationId: 'listUsers',
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/User' } }
                }
              }
            }
          }
        },
        post: {
          operationId: 'createUser',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'displayName'],
                  properties: {
                    email: { type: 'string' },
                    displayName: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/User' } }
              }
            }
          }
        }
      },
      '/users/{userId}': {
        get: {
          operationId: 'getUser',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/User' } }
              }
            }
          }
        }
      },
      '/products': {
        get: {
          operationId: 'listProducts',
          responses: {
            '200': { description: 'OK' }
          }
        }
      }
    }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function parseSpec(raw, label) {
    var text = String(raw || '').trim();
    if (!text) {
      return { error: label + ' is empty.' };
    }
    try {
      return { doc: JSON.parse(text), format: 'json' };
    } catch (jsonErr) {
      if (typeof jsyaml !== 'undefined' && typeof jsyaml.load === 'function') {
        try {
          var doc = jsyaml.load(text);
          if (!doc || typeof doc !== 'object') {
            return { error: label + ': YAML parsed but did not yield an object. Paste JSON preferred.' };
          }
          return { doc: doc, format: 'yaml', note: label + ' parsed as YAML — paste JSON preferred for fidelity.' };
        } catch (yamlErr) {
          return {
            error: label + ' is not valid JSON' +
              (String(text).indexOf('openapi:') === 0 || String(text).indexOf('openapi:') > -1
                ? ' (YAML-ish detected; js-yaml parse failed). Paste JSON preferred.'
                : ': ' + (jsonErr.message || 'parse error'))
          };
        }
      }
      return { error: label + ' JSON parse failed. Paste JSON preferred. ' + (jsonErr.message || '') };
    }
  }

  function opsOf(pathItem) {
    var ops = [];
    if (!pathItem || typeof pathItem !== 'object') return ops;
    HTTP_METHODS.forEach(function (m) {
      if (pathItem[m]) ops.push(m);
    });
    return ops;
  }

  function schemaType(schema) {
    if (!schema || typeof schema !== 'object') return null;
    if (schema.$ref) return 'ref:' + schema.$ref;
    if (schema.type) return String(schema.type);
    if (schema.allOf) return 'allOf';
    if (schema.oneOf) return 'oneOf';
    if (schema.anyOf) return 'anyOf';
    return 'object';
  }

  function contentSchema(content) {
    if (!content || typeof content !== 'object') return null;
    var keys = Object.keys(content);
    if (!keys.length) return null;
    return content[keys[0]] && content[keys[0]].schema;
  }

  function resolveLocalRef(doc, ref) {
    if (!ref || ref.indexOf('#/') !== 0) return null;
    var parts = ref.slice(2).split('/');
    var cur = doc;
    for (var i = 0; i < parts.length; i++) {
      if (!cur || typeof cur !== 'object') return null;
      cur = cur[parts[i].replace(/~1/g, '/').replace(/~0/g, '~')];
    }
    return cur;
  }

  function expandSchema(doc, schema, depth) {
    depth = depth || 0;
    if (!schema || depth > 6) return schema;
    if (schema.$ref) {
      var resolved = resolveLocalRef(doc, schema.$ref);
      return expandSchema(doc, resolved || schema, depth + 1);
    }
    return schema;
  }

  function collectBreaking(base, cand) {
    var findings = [];
    var basePaths = (base && base.paths) || {};
    var candPaths = (cand && cand.paths) || {};

    Object.keys(basePaths).forEach(function (path) {
      if (!candPaths[path]) {
        findings.push({
          kind: 'breaking',
          code: 'removed-path',
          title: 'Removed path ' + path,
          body: 'Clients calling this path will break. Restore the path or publish a deprecation window.'
        });
        return;
      }
      opsOf(basePaths[path]).forEach(function (method) {
        if (!candPaths[path][method]) {
          findings.push({
            kind: 'breaking',
            code: 'removed-method',
            title: 'Removed ' + method.toUpperCase() + ' ' + path,
            body: 'HTTP method removed from an existing path.'
          });
          return;
        }
        var bOp = basePaths[path][method];
        var cOp = candPaths[path][method];

        var bParams = (bOp.parameters || []).concat(basePaths[path].parameters || []);
        var cParams = (cOp.parameters || []).concat(candPaths[path].parameters || []);
        var cParamMap = {};
        cParams.forEach(function (p) {
          if (p && p.name) cParamMap[p.in + ':' + p.name] = p;
        });
        bParams.forEach(function (p) {
          if (!p || !p.name) return;
          var key = p.in + ':' + p.name;
          var cp = cParamMap[key];
          if (!cp) {
            findings.push({
              kind: 'breaking',
              code: 'removed-param',
              title: 'Removed parameter ' + p.name + ' (' + p.in + ') on ' + method.toUpperCase() + ' ' + path,
              body: 'Existing clients may still send this parameter; removal can break typed SDKs.'
            });
            return;
          }
          var bt = schemaType(p.schema);
          var ct = schemaType(cp.schema);
          if (bt && ct && bt !== ct) {
            findings.push({
              kind: 'breaking',
              code: 'param-type-change',
              title: 'Parameter type changed for ' + p.name + ' on ' + method.toUpperCase() + ' ' + path,
              body: 'Type changed from ' + bt + ' to ' + ct + '.'
            });
          }
        });
        cParams.forEach(function (p) {
          if (!p || !p.required) return;
          var key = p.in + ':' + p.name;
          var existed = bParams.some(function (bp) {
            return bp && bp.name === p.name && bp.in === p.in;
          });
          var wasRequired = bParams.some(function (bp) {
            return bp && bp.name === p.name && bp.in === p.in && bp.required;
          });
          if (!existed || !wasRequired) {
            findings.push({
              kind: 'breaking',
              code: 'required-param-added',
              title: 'New required parameter ' + p.name + ' on ' + method.toUpperCase() + ' ' + path,
              body: 'Adding a required parameter is a breaking change for existing clients.'
            });
          }
        });

        var bBody = bOp.requestBody && contentSchema(bOp.requestBody.content);
        var cBody = cOp.requestBody && contentSchema(cOp.requestBody.content);
        if (bBody || cBody) {
          compareSchemas(base, cand, expandSchema(base, bBody), expandSchema(cand, cBody),
            method.toUpperCase() + ' ' + path + ' request body', findings, true);
        }

        var bResp = bOp.responses && (bOp.responses['200'] || bOp.responses['201'] || bOp.responses.default);
        var cResp = cOp.responses && (cOp.responses['200'] || cOp.responses['201'] || cOp.responses.default);
        var bSchema = bResp && contentSchema(bResp.content);
        var cSchema = cResp && contentSchema(cResp.content);
        if (bSchema || cSchema) {
          compareSchemas(base, cand, expandSchema(base, bSchema), expandSchema(cand, cSchema),
            method.toUpperCase() + ' ' + path + ' response', findings, false);
        }
      });
    });

    compareComponentSchemas(base, cand, findings);
    return findings;
  }

  function compareComponentSchemas(base, cand, findings) {
    var bSchemas = (base.components && base.components.schemas) || {};
    var cSchemas = (cand.components && cand.components.schemas) || {};
    Object.keys(bSchemas).forEach(function (name) {
      if (!cSchemas[name]) {
        findings.push({
          kind: 'breaking',
          code: 'removed-schema',
          title: 'Removed schema ' + name,
          body: 'Referenced component schema was removed.'
        });
        return;
      }
      compareSchemas(base, cand, bSchemas[name], cSchemas[name], 'schema ' + name, findings, false);
    });
  }

  function compareSchemas(baseDoc, candDoc, bSchema, cSchema, context, findings, isRequest) {
    if (!bSchema || !cSchema) return;
    var bt = schemaType(bSchema);
    var ct = schemaType(cSchema);
    if (bt && ct && bt !== ct && bt.indexOf('ref:') !== 0 && ct.indexOf('ref:') !== 0) {
      findings.push({
        kind: 'breaking',
        code: 'type-change',
        title: 'Type change in ' + context,
        body: 'Type changed from ' + bt + ' to ' + ct + '.'
      });
    }

    var bReq = bSchema.required || [];
    var cReq = cSchema.required || [];
    cReq.forEach(function (field) {
      if (bReq.indexOf(field) === -1) {
        findings.push({
          kind: 'breaking',
          code: 'required-field-added',
          title: 'New required field "' + field + '" in ' + context,
          body: isRequest
            ? 'Clients must now supply this field — breaking for existing producers.'
            : 'Response now requires a field that may be absent in older servers.'
        });
      }
    });

    if (Array.isArray(bSchema.enum) && Array.isArray(cSchema.enum)) {
      bSchema.enum.forEach(function (val) {
        if (cSchema.enum.indexOf(val) === -1) {
          findings.push({
            kind: 'breaking',
            code: 'enum-narrowed',
            title: 'Enum narrowed in ' + context,
            body: 'Value "' + val + '" was removed from the enum.'
          });
        }
      });
    }

    var bProps = bSchema.properties || {};
    var cProps = cSchema.properties || {};
    Object.keys(bProps).forEach(function (key) {
      if (!cProps[key]) {
        findings.push({
          kind: 'breaking',
          code: 'removed-property',
          title: 'Removed property "' + key + '" in ' + context,
          body: 'Consumers relying on this property will break.'
        });
        return;
      }
      var bpt = schemaType(bProps[key]);
      var cpt = schemaType(cProps[key]);
      if (bpt && cpt && bpt !== cpt) {
        findings.push({
          kind: 'breaking',
          code: 'property-type-change',
          title: 'Property "' + key + '" type changed in ' + context,
          body: 'Changed from ' + bpt + ' to ' + cpt + '.'
        });
      }
      if (Array.isArray(bProps[key].enum) && Array.isArray(cProps[key].enum)) {
        bProps[key].enum.forEach(function (val) {
          if (cProps[key].enum.indexOf(val) === -1) {
            findings.push({
              kind: 'breaking',
              code: 'enum-narrowed',
              title: 'Enum narrowed for "' + key + '" in ' + context,
              body: 'Value "' + val + '" removed.'
            });
          }
        });
      }
    });
  }

  function opHasSecurity(doc, pathItem, op) {
    if (op && op.security !== undefined) {
      return Array.isArray(op.security) && op.security.length > 0;
    }
    if (pathItem && pathItem.security !== undefined) {
      return Array.isArray(pathItem.security) && pathItem.security.length > 0;
    }
    if (doc && doc.security !== undefined) {
      return Array.isArray(doc.security) && doc.security.length > 0;
    }
    return false;
  }

  function walkSchemas(node, visit, path) {
    path = path || '';
    if (!node || typeof node !== 'object') return;
    if (node.properties) {
      Object.keys(node.properties).forEach(function (key) {
        visit(key, node.properties[key], path + '/' + key);
        walkSchemas(node.properties[key], visit, path + '/' + key);
      });
    }
    if (node.items) walkSchemas(node.items, visit, path + '[]');
    ['allOf', 'oneOf', 'anyOf'].forEach(function (k) {
      if (Array.isArray(node[k])) {
        node[k].forEach(function (sub, i) {
          walkSchemas(sub, visit, path + '/' + k + '[' + i + ']');
        });
      }
    });
  }

  function collectSecurity(doc) {
    var findings = [];
    var schemes = (doc.components && doc.components.securitySchemes) || {};
    var schemeKeys = Object.keys(schemes);

    if (!schemeKeys.length) {
      findings.push({
        kind: 'security',
        code: 'missing-securitySchemes',
        owasp: 'API2 / API8',
        title: 'Missing securitySchemes',
        body: 'No components.securitySchemes defined. APIs without declared auth increase broken authentication risk.'
      });
    }

    var paths = doc.paths || {};
    Object.keys(paths).forEach(function (path) {
      var pathItem = paths[path];
      opsOf(pathItem).forEach(function (method) {
        var op = pathItem[method];
        if (!opHasSecurity(doc, pathItem, op)) {
          findings.push({
            kind: 'security',
            code: 'no-auth-on-path',
            owasp: 'API2',
            title: 'No auth on ' + method.toUpperCase() + ' ' + path,
            body: 'Operation has no security requirement (operation, path, or root).'
          });
        }

        var hasIdParam = (op.parameters || []).concat(pathItem.parameters || []).some(function (p) {
          return p && p.in === 'path' && /id$/i.test(p.name || '');
        }) || /\{[^}]*id[^}]*\}/i.test(path);
        if (hasIdParam && !opHasSecurity(doc, pathItem, op)) {
          findings.push({
            kind: 'security',
            code: 'bola-risk',
            owasp: 'API1',
            title: 'BOLA risk on ' + method.toUpperCase() + ' ' + path,
            body: 'ID path parameter without security — broken object level authorization risk.'
          });
        }

        var responses = op.responses || {};
        var hasRateHint = false;
        Object.keys(responses).forEach(function (code) {
          var headers = (responses[code] && responses[code].headers) || {};
          Object.keys(headers).forEach(function (h) {
            if (RATE_HINT.test(h)) hasRateHint = true;
          });
        });
        if (!hasRateHint && (method === 'get' || method === 'post')) {
          findings.push({
            kind: 'security',
            code: 'missing-ratelimit',
            owasp: 'API4',
            title: 'No rate-limit header hints on ' + method.toUpperCase() + ' ' + path,
            body: 'Consider documenting X-RateLimit-* or Retry-After response headers (unrestricted resource consumption).'
          });
        }
      });
    });

    var schemas = (doc.components && doc.components.schemas) || {};
    Object.keys(schemas).forEach(function (name) {
      walkSchemas(schemas[name], function (key, schema, schemaPath) {
        if (SENSITIVE_KEYS.test(key)) {
          findings.push({
            kind: 'security',
            code: 'excessive-data-exposure',
            owasp: 'API3',
            title: 'Sensitive field "' + key + '" in schema ' + name,
            body: 'Property at ' + (schemaPath || key) + ' looks like sensitive data (password/ssn/etc). Avoid exposing in API responses.'
          });
        }
        if (schema && schema.type === 'string' && schema.maxLength === undefined && !schema.enum && !schema.format) {
          findings.push({
            kind: 'security',
            code: 'missing-maxLength',
            owasp: 'API4 / API8',
            title: 'String without maxLength in ' + name + (schemaPath || ''),
            body: 'Unbounded strings enable resource exhaustion and weak input validation.'
          });
        }
      });
    });

    Object.keys(paths).forEach(function (path) {
      opsOf(paths[path]).forEach(function (method) {
        var op = paths[path][method];
        var body = op.requestBody && contentSchema(op.requestBody.content);
        if (!body) return;
        var resolved = expandSchema(doc, body);
        walkSchemas(resolved, function (key, schema, schemaPath) {
          if (schema && schema.type === 'string' && schema.maxLength === undefined && !schema.enum && !schema.format) {
            findings.push({
              kind: 'security',
              code: 'missing-maxLength',
              owasp: 'API4 / API8',
              title: 'Request string without maxLength on ' + method.toUpperCase() + ' ' + path,
              body: 'Field "' + key + '" at ' + schemaPath + ' lacks maxLength.'
            });
          }
        });
      });
    });

    return dedupeFindings(findings);
  }

  function dedupeFindings(list) {
    var seen = {};
    return list.filter(function (f) {
      var key = f.code + '|' + f.title;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function buildPatches(breaking, security) {
    var patches = [];
    var hasMissingSchemes = security.some(function (f) { return f.code === 'missing-securitySchemes'; });
    var hasNoAuth = security.some(function (f) { return f.code === 'no-auth-on-path' || f.code === 'bola-risk'; });
    var hasValidation = security.some(function (f) { return f.code === 'missing-maxLength'; });
    var hasExposure = security.some(function (f) { return f.code === 'excessive-data-exposure'; });
    var hasRate = security.some(function (f) { return f.code === 'missing-ratelimit'; });
    var hasType = breaking.some(function (f) {
      return f.code === 'type-change' || f.code === 'property-type-change' || f.code === 'param-type-change';
    });
    var hasRemoved = breaking.some(function (f) {
      return f.code === 'removed-path' || f.code === 'removed-method';
    });

    if (hasMissingSchemes) {
      patches.push({
        kind: 'patch',
        title: 'Add securitySchemes + global security',
        body:
          'components:\n' +
          '  securitySchemes:\n' +
          '    bearerAuth:\n' +
          '      type: http\n' +
          '      scheme: bearer\n' +
          '      bearerFormat: JWT\n' +
          'security:\n' +
          '  - bearerAuth: []\n\n' +
          'AI note: Declare at least one auth scheme and apply it globally, then override public routes with security: [].'
      });
    }
    if (hasNoAuth) {
      patches.push({
        kind: 'patch',
        title: 'Attach auth to object-level routes',
        body:
          'paths:\n' +
          '  /users/{userId}:\n' +
          '    get:\n' +
          '      security:\n' +
          '        - bearerAuth: []\n' +
          '      # Also enforce ownership checks server-side (BOLA).\n\n' +
          'AI note: Spec security alone is not enough — verify the authenticated subject owns the {userId} resource.'
      });
    }
    if (hasValidation) {
      patches.push({
        kind: 'patch',
        title: 'Add string input validation',
        body:
          'properties:\n' +
          '  email:\n' +
          '    type: string\n' +
          '    format: email\n' +
          '    maxLength: 254\n' +
          '  displayName:\n' +
          '    type: string\n' +
          '    maxLength: 100\n' +
          '    minLength: 1\n\n' +
          'AI note: Pair maxLength with server-side validation to mitigate unrestricted resource consumption.'
      });
    }
    if (hasExposure) {
      patches.push({
        kind: 'patch',
        title: 'Remove sensitive fields from response schemas',
        body:
          '# Remove password / ssn from response DTOs.\n' +
          '# Prefer write-only for credentials:\n' +
          'password:\n' +
          '  type: string\n' +
          '  format: password\n' +
          '  writeOnly: true\n' +
          '  maxLength: 128\n\n' +
          'AI note: Split UserPublic vs UserPrivate schemas to prevent excessive data exposure.'
      });
    }
    if (hasRate) {
      patches.push({
        kind: 'patch',
        title: 'Document rate-limit response headers',
        body:
          'responses:\n' +
          "  '200':\n" +
          '    headers:\n' +
          '      X-RateLimit-Limit:\n' +
          '        schema: { type: integer }\n' +
          '      X-RateLimit-Remaining:\n' +
          '        schema: { type: integer }\n' +
          '      Retry-After:\n' +
          '        schema: { type: integer }\n\n' +
          'AI note: Mirror these headers in your gateway / API middleware.'
      });
    }
    if (hasType) {
      patches.push({
        kind: 'patch',
        title: 'Avoid silent type changes',
        body:
          'AI note: Type changes (e.g. integer→string, number→string) break generated clients.\n' +
          'Prefer additive versioning: introduce new fields or /v2 paths, keep old types until sunset.'
      });
    }
    if (hasRemoved) {
      patches.push({
        kind: 'patch',
        title: 'Deprecate before removing paths',
        body:
          'paths:\n' +
          '  /orders:\n' +
          '    get:\n' +
          '      deprecated: true\n' +
          '      description: Use /v2/orders. Removal planned after 90 days.\n\n' +
          'AI note: Communicate sunset headers and keep the old path until clients migrate.'
      });
    }
    if (!patches.length) {
      patches.push({
        kind: 'patch',
        title: 'Contract looks healthy',
        body: 'AI note: No major remediation patches generated. Keep monitoring for new required fields and auth coverage on ID routes.'
      });
    }
    return patches;
  }

  function scoreReport(breaking, security) {
    var score = 100;
    score -= Math.min(60, breaking.length * 8);
    score -= Math.min(35, security.length * 4);
    if (score < 0) score = 0;
    return score;
  }

  function setStatus(msg, kind) {
    var el = $('oapiParseStatus');
    el.textContent = msg || '';
    el.className = 'oapi-status' + (kind ? ' is-' + kind : '');
  }

  function renderFindings(list, ul, badgeClass) {
    ul.innerHTML = '';
    if (!list.length) {
      var empty = document.createElement('li');
      empty.className = 'oapi-finding';
      empty.innerHTML = '<p class="oapi-finding-body">No issues in this category.</p>';
      ul.appendChild(empty);
      return;
    }
    list.forEach(function (f) {
      var li = document.createElement('li');
      li.className = 'oapi-finding is-' + f.kind;
      var meta = '<div class="oapi-finding-meta"><span class="oapi-badge ' + badgeClass + '">' +
        (f.owasp || f.code || f.kind) + '</span></div>';
      li.innerHTML = meta +
        '<p class="oapi-finding-title"></p><p class="oapi-finding-body"></p>';
      li.querySelector('.oapi-finding-title').textContent = f.title;
      li.querySelector('.oapi-finding-body').textContent = f.body;
      ul.appendChild(li);
    });
  }

  function updateHero(breakingCount, securityCount, score) {
    $('statBreaking').textContent = String(breakingCount);
    $('statSecurity').textContent = String(securityCount);
    $('statScore').textContent = String(score);
    var ring = document.querySelector('.oapi-score-ring');
    $('oapiScoreBig').textContent = String(score);
    ring.classList.remove('is-mid', 'is-low');
    if (score < 50) ring.classList.add('is-low');
    else if (score < 75) ring.classList.add('is-mid');
    $('oapiScoreSummary').textContent =
      breakingCount + ' breaking · ' + securityCount + ' security · score ' + score + '/100';
  }

  function applyFilter(filter) {
    document.querySelectorAll('.oapi-filter').forEach(function (btn) {
      var active = btn.getAttribute('data-filter') === filter;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.querySelectorAll('.oapi-section').forEach(function (sec) {
      var section = sec.getAttribute('data-section');
      sec.hidden = !(filter === 'all' || filter === section);
    });
  }

  function runLint() {
    var baseParsed = parseSpec($('baselineSpec').value, 'Baseline');
    if (baseParsed.error) {
      setStatus(baseParsed.error, 'error');
      return;
    }
    var candParsed = parseSpec($('candidateSpec').value, 'Candidate');
    if (candParsed.error) {
      setStatus(candParsed.error, 'error');
      return;
    }

    var notes = [];
    if (baseParsed.note) notes.push(baseParsed.note);
    if (candParsed.note) notes.push(candParsed.note);

    var breaking = collectBreaking(baseParsed.doc, candParsed.doc);
    var security = collectSecurity(candParsed.doc);
    var patches = buildPatches(breaking, security);
    var score = scoreReport(breaking, security);

    lastReport = {
      generatedAt: new Date().toISOString(),
      score: score,
      breaking: breaking,
      security: security,
      patches: patches,
      baselineVersion: (baseParsed.doc.info && baseParsed.doc.info.version) || 'unknown',
      candidateVersion: (candParsed.doc.info && candParsed.doc.info.version) || 'unknown'
    };

    $('oapiEmpty').hidden = true;
    $('oapiScoreCard').hidden = false;
    $('oapiResults').hidden = false;
    renderFindings(breaking, $('breakingList'), 'oapi-badge-breaking');
    renderFindings(security, $('securityList'), 'oapi-badge-security');
    renderFindings(patches, $('patchList'), 'oapi-badge-patch');
    updateHero(breaking.length, security.length, score);
    applyFilter('all');
    $('exportMdBtn').disabled = false;
    $('exportTxtBtn').disabled = false;
    setStatus(
      'Lint complete (' + (baseParsed.format || 'json') + ' → ' + (candParsed.format || 'json') + ').' +
      (notes.length ? ' ' + notes.join(' ') : ''),
      'ok'
    );
  }

  function buildReportMarkdown() {
    if (!lastReport) return '';
    var lines = [];
    lines.push('# OpenAPI Contract Lint Report');
    lines.push('');
    lines.push('- Generated: ' + lastReport.generatedAt);
    lines.push('- Baseline version: ' + lastReport.baselineVersion);
    lines.push('- Candidate version: ' + lastReport.candidateVersion);
    lines.push('- Compatibility score: **' + lastReport.score + '/100**');
    lines.push('- Breaking: ' + lastReport.breaking.length);
    lines.push('- Security: ' + lastReport.security.length);
    lines.push('');
    lines.push('## Breaking changes');
    lastReport.breaking.forEach(function (f) {
      lines.push('- **' + f.title + '** (' + f.code + '): ' + f.body);
    });
    if (!lastReport.breaking.length) lines.push('- None');
    lines.push('');
    lines.push('## OWASP-style security checks');
    lastReport.security.forEach(function (f) {
      lines.push('- **' + f.title + '** [' + (f.owasp || f.code) + ']: ' + f.body);
    });
    if (!lastReport.security.length) lines.push('- None');
    lines.push('');
    lines.push('## AI-style patch suggestions');
    lastReport.patches.forEach(function (f) {
      lines.push('### ' + f.title);
      lines.push('```');
      lines.push(f.body);
      lines.push('```');
      lines.push('');
    });
    return lines.join('\n');
  }

  function downloadReport(ext) {
    if (!lastReport) return;
    var md = buildReportMarkdown();
    var body = ext === 'txt' ? md.replace(/^#+\s?/gm, '').replace(/\*\*/g, '') : md;
    var blob = new Blob([body], { type: ext === 'md' ? 'text/markdown' : 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'openapi-contract-lint.' + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function loadDemo() {
    $('baselineSpec').value = JSON.stringify(DEMO_BASELINE, null, 2);
    $('candidateSpec').value = JSON.stringify(DEMO_CANDIDATE, null, 2);
    setStatus('Demo OpenAPI 3.0 specs loaded (v1 baseline vs v2 with breaking + security gaps).', 'ok');
  }

  function clearAll() {
    $('baselineSpec').value = '';
    $('candidateSpec').value = '';
    lastReport = null;
    $('oapiEmpty').hidden = false;
    $('oapiScoreCard').hidden = true;
    $('oapiResults').hidden = true;
    $('exportMdBtn').disabled = true;
    $('exportTxtBtn').disabled = true;
    updateHero(0, 0, '—');
    $('oapiScoreBig').textContent = '—';
    setStatus('');
  }

  function init() {
    $('loadDemoBtn').addEventListener('click', loadDemo);
    $('runLintBtn').addEventListener('click', runLint);
    $('clearBtn').addEventListener('click', clearAll);
    $('exportMdBtn').addEventListener('click', function () { downloadReport('md'); });
    $('exportTxtBtn').addEventListener('click', function () { downloadReport('txt'); });
    document.querySelectorAll('.oapi-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-filter'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
