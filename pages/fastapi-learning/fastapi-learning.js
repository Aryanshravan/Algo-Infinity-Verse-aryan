/* global toggleSwaggerBlock, enableExecute, executeSwaggerRoute */

// ============================================================
// 1.  CURRICULUM DATA — 11 modules, 2-3 lessons each
// ============================================================

/**
 * Helper to build a lesson object.
 * Each lesson includes learning objectives (top) and a summary
 * takeaways section (bottom).
 */
function createLesson(id, title, objectives, takeaways, contentParts, defaultCode) {
  const objectivesHtml = objectives
    .map((o) => `<li class="flex items-start gap-2"><i class="fa-solid fa-bullseye text-[#059669] mt-1 text-xs"></i><span>${o}</span></li>`)
    .join('');

  const takeawaysHtml = takeaways
    .map((t) => `<li class="flex items-start gap-2"><i class="fa-solid fa-check-circle text-[#059669] mt-1 text-xs"></i><span>${t}</span></li>`)
    .join('');

  const content = `
    <!-- Learning Objectives -->
    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
      <h4 class="text-sm font-semibold text-blue-800 uppercase tracking-wide mb-2">
        <i class="fa-solid fa-bullseye mr-1"></i> Learning Objectives
      </h4>
      <ul class="list-none space-y-1 text-blue-900 text-sm">
        ${objectivesHtml}
      </ul>
    </div>

    ${contentParts}

    <!-- Summary Takeaways -->
    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 mt-8 rounded-r-lg">
      <h4 class="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-2">
        <i class="fa-solid fa-check-circle mr-1"></i> Summary Takeaways
      </h4>
      <ul class="list-none space-y-1 text-amber-900 text-sm">
        ${takeawaysHtml}
      </ul>
    </div>
  `;

  return { id, title, content, defaultCode };
}

const curriculum = [
  // ─── MODULE 1: FastAPI Basics & Routing ───
  {
    id: 'fastapi-basics',
    title: 'FastAPI Basics & Routing',
    lessons: [
      createLesson(
        'fa-1',
        'First Steps: Your First FastAPI App',
        [
          'Understand what FastAPI is and its key benefits',
          'Create a basic FastAPI application with GET routes',
          'Run the development server and view Swagger docs',
        ],
        [
          'FastAPI uses Python type hints for automatic validation and docs',
          'Decorators like @app.get() map URL paths to handler functions',
          'Swagger UI at /docs provides interactive API documentation',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Modern, Fast Python Web Framework</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI is a modern, fast (high-performance) web framework for building APIs with Python 3.7+ based on standard Python type hints.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">One of its best features is automatic interactive API documentation provided by <strong>Swagger UI</strong> and <strong>ReDoc</strong>. Let's create a simple GET route.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI automatically generates an OpenAPI schema from your code. Every type hint, docstring, and default value becomes part of the living documentation — no extra configuration needed!</p>
        <div class="bg-green-50 border-l-4 border-[#059669] p-4 my-6 rounded-r-lg">
          <p class="text-green-800 font-medium"><i class="fa-solid fa-rocket mr-1"></i> Go to the Simulator, click 'Refresh Docs', and test the generated Swagger UI!</p>
        </div>
        `,
        `from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef read_root():\n    return {"Hello": "World"}\n\n@app.get("/items")\ndef read_items():\n    return [\n        {"id": 1, "name": "Portal Gun"},\n        {"id": 2, "name": "Plumbus"}\n    ]`
      ),
      createLesson(
        'fa-2',
        'Path Operations & HTTP Methods',
        [
          'Identify the different HTTP methods (GET, POST, PUT, DELETE)',
          'Create routes that respond to each HTTP method',
          'Understand status codes and response patterns',
        ],
        [
          'HTTP methods map to CRUD operations: GET (read), POST (create), PUT (update), DELETE (delete)',
          'Use the same path with different methods for different operations',
          'FastAPI automatically assigns the correct OpenAPI operationId',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">HTTP Methods & Path Operations</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI supports all standard HTTP methods via decorators: <code>@app.get()</code>, <code>@app.post()</code>, <code>@app.put()</code>, <code>@app.delete()</code>, <code>@app.patch()</code>, and more.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Each decorator maps a function (called a <strong>path operation function</strong>) to a specific combination of HTTP method and URL path. The return value is automatically converted to JSON.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">You can return dictionaries, lists, Pydantic models, or even custom response objects. FastAPI handles serialization for you.</p>
        <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
          <p class="text-purple-800 font-medium"><i class="fa-solid fa-lightbulb mr-1"></i> Tip: Always use the most specific HTTP method for your operation — it makes your API more RESTful and self-documenting.</p>
        </div>
        `,
        `from fastapi import FastAPI\n\napp = FastAPI()\n\n# In-memory "database"\nitems = []\n\n@app.get("/items")\ndef list_items():\n    return {"items": items, "count": len(items)}\n\n@app.post("/items")\ndef create_item(name: str, price: float):\n    item = {"id": len(items) + 1, "name": name, "price": price}\n    items.append(item)\n    return item\n\n@app.delete("/items/{item_id}")\ndef delete_item(item_id: int):\n    for i, item in enumerate(items):\n        if item["id"] == item_id:\n            items.pop(i)\n            return {"message": "Item deleted"}\n    return {"error": "Item not found"}`
      ),
      createLesson(
        'fa-3',
        'App Configuration & Metadata',
        [
          'Customize FastAPI application metadata (title, description, version)',
          'Add tags and summaries to path operations',
          'Organize routes with the tags parameter',
        ],
        [
          'Pass metadata to the FastAPI constructor for better auto-docs',
          'Use tags to group related endpoints in Swagger UI',
          'OpenAPI metadata helps consumers understand your API',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Customizing Your API Metadata</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI allows you to pass metadata to the <code>FastAPI()</code> constructor, such as <code>title</code>, <code>description</code>, <code>version</code>, and <code>contact</code> information. This metadata appears in the auto-generated OpenAPI schema and docs.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">You can also add <strong>tags</strong> to your path operations to group them logically in the Swagger UI. Tags make your API documentation cleaner and more professional.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Additional configuration options include <code>openapi_url</code> (to customize the schema endpoint), <code>docs_url</code>, and <code>redoc_url</code>.</p>
        `,
        `from fastapi import FastAPI\n\napp = FastAPI(\n    title="My Cool API",\n    description="A sample API to demonstrate FastAPI features",\n    version="2.0.0",\n    contact={\n        "name": "Developer",\n        "email": "dev@example.com",\n    },\n)\n\n@app.get("/health", tags=["system"])\ndef health_check():\n    return {"status": "ok", "version": "2.0.0"}\n\n@app.get("/users", tags=["users"])\ndef list_users():\n    return [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]\n\n@app.get("/items", tags=["inventory"])\ndef list_inventory():\n    return [{"id": 1, "name": "Widget", "qty": 10}]`
      ),
    ],
    quiz: [
      {
        id: 'q-fa-1',
        question: 'Which Python decorator is used in FastAPI to map a function to handle HTTP GET requests for the root URL?',
        options: ["@app.route('/')", "@app.get('/')", '@app.get_route()', "@fastapi.get('/')"],
        correct: 1,
      },
      {
        id: 'q-fa-2',
        question: 'What file format does FastAPI use to generate automatic interactive API documentation?',
        options: ['JSON:API', 'GraphQL Schema', 'OpenAPI (Swagger)', 'RAML'],
        correct: 2,
      },
      {
        id: 'q-fa-3',
        question: 'What does FastAPI return by default when a path operation function returns a Python dict?',
        options: ['An XML document', 'A JSON response', 'A plain text response', 'An HTML page'],
        correct: 1,
      },
      {
        id: 'q-fa-4',
        question: 'Which path-operation decorator parameter lets you group endpoints in the Swagger UI?',
        options: ['group', 'namespace', 'tags', 'category'],
        correct: 2,
      },
    ],
  },

  // ─── MODULE 2: Path & Query Parameters ───
  {
    id: 'parameters',
    title: 'Path & Query Parameters',
    lessons: [
      createLesson(
        'param-1',
        'Passing Data in the URL',
        [
          'Understand path parameters and how to declare them',
          'Understand query parameters and their role in filtering',
          'Use Python type hints for automatic validation of parameters',
        ],
        [
          'Path parameters are declared in the URL pattern with curly braces: {item_id}',
          'Non-path function parameters are automatically interpreted as query parameters',
          'Type hints on parameters enable automatic validation and serialization',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Path Parameters</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">You can declare path "parameters" or "variables" with the same syntax used by Python format strings: <code>@app.get("/items/{item_id}")</code></p>
        <p class="mb-4 text-gray-700 leading-relaxed">If you declare other function parameters that are not part of the path parameters, they are automatically interpreted as "query" parameters.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI automatically validates path parameters against their type hints. If you declare <code>item_id: int</code> but receive a non-integer value, FastAPI returns a validation error before your function even runs.</p>
        `,
        `from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/users/{user_id}")\ndef read_user(user_id: int, q: str = None):\n    return {"user_id": user_id, "query_string": q}\n\n@app.get("/items/{item_id}")\ndef read_item(item_id: int, detail: bool = False):\n    item = {"id": item_id, "name": "Sample Item", "price": 9.99}\n    if detail:\n        item["description"] = "This is a detailed description"\n    return item`
      ),
      createLesson(
        'param-2',
        'Type Validation & Default Values',
        [
          'Use Python type hints for automatic parameter validation',
          'Set default values for optional query parameters',
          'Use Union types for parameters that can be None',
        ],
        [
          'Parameters with a default value are optional; those without are required',
          'Python typing module (List, Optional, Union) works seamlessly with FastAPI',
          'FastAPI returns clear validation errors for invalid input types',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Type Validation with Hints</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI leverages Python's type hints to automatically validate and coerce query and path parameters. If a parameter is declared as <code>int</code> but receives a string like <code>"abc"</code>, FastAPI returns a 422 validation error.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Parameters with default values (<code>q: str = None</code>) are <strong>optional</strong>. Parameters without defaults (<code>item_id: int</code>) are <strong>required</strong>. FastAPI enforces this automatically.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">You can use <code>Optional[str] = None</code> for clarity, or just <code>str = None</code> — FastAPI treats both as optional.</p>
        `,
        `from typing import List, Optional\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/items")\ndef list_items(\n    skip: int = 0,\n    limit: int = 10,\n    category: Optional[str] = None,\n    in_stock: bool = True,\n):\n    result = {"skip": skip, "limit": limit}\n    if category:\n        result["category"] = category\n    result["in_stock_only"] = in_stock\n    return result`
      ),
      createLesson(
        'param-3',
        'String Validations & Enums',
        [
          'Use Path and Query from FastAPI for advanced validation',
          'Validate string lengths, regex patterns, and numeric ranges',
          'Define and use Enum parameters for fixed sets of values',
        ],
        [
          'Import Path() and Query() from fastapi for parameter-level validators',
          'Use gt=, lt=, ge=, le= for numeric range validation',
          'Use min_length, max_length, regex for string validation',
          'Python Enum classes work natively as path/query parameter types',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Advanced Parameter Validation</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI provides <code>Path()</code> and <code>Query()</code> classes for more detailed validation beyond type hints. You can enforce string lengths, numeric ranges, regex patterns, and default values.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">For parameters with a fixed set of possible values, you can use Python's <code>Enum</code> class. FastAPI automatically validates that the input is one of the allowed enum values.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI also supports <code>Query(default=None, alias="param-name")</code> to handle query parameters that don't match Python naming conventions.</p>
        <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
          <p class="text-purple-800 font-medium"><i class="fa-solid fa-lightbulb mr-1"></i> Tip: Use <code>Query(..., min_length=1)</code> (ellipsis as first arg) to make a query parameter required.</p>
        </div>
        `,
        `from enum import Enum\nfrom fastapi import FastAPI, Path, Query\n\napp = FastAPI()\n\nclass SortBy(str, Enum):\n    name = "name"\n    price = "price"\n    date = "date"\n\n@app.get("/products")\ndef list_products(\n    sort_by: SortBy = SortBy.name,\n    min_price: float = Query(0, ge=0),\n    max_price: float = Query(1000, le=10000),\n    search: str = Query(None, min_length=2, max_length=50),\n):\n    return {\n        "sort_by": sort_by.value,\n        "price_range": [min_price, max_price],\n        "search": search,\n    }\n\n@app.get("/items/{item_id}")\ndef read_item(\n    item_id: int = Path(..., ge=1, title="The ID of the item to get")\n):\n    return {"item_id": item_id}`
      ),
    ],
    quiz: [
      {
        id: 'q-param-1',
        question: "If a parameter is defined in the path like '/items/{item_id}', what kind of parameter is it?",
        options: ['Body Parameter', 'Header Parameter', 'Query Parameter', 'Path Parameter'],
        correct: 3,
      },
      {
        id: 'q-param-2',
        question: 'In FastAPI, how do you make a query parameter optional?',
        options: ['By setting it as a required field', 'By giving it a default value like None', 'By using the @optional decorator', 'By prefixing it with opt_'],
        correct: 1,
      },
      {
        id: 'q-param-3',
        question: 'Which FastAPI function is used to add validation constraints like min_length to a query parameter?',
        options: ['Validate()', 'Param()', 'Query()', 'Check()'],
        correct: 2,
      },
      {
        id: 'q-param-4',
        question: 'What HTTP status code does FastAPI return when parameter validation fails?',
        options: ['400 Bad Request', '404 Not Found', '422 Unprocessable Entity', '500 Internal Server Error'],
        correct: 2,
      },
      {
        id: 'q-param-5',
        question: 'What Python feature can you use to restrict a path parameter to one of several predefined values?',
        options: ['A list constant', 'An Enum class', 'A regular expression', 'A if-elif chain'],
        correct: 1,
      },
    ],
  },

  // ─── MODULE 3: Pydantic Models & Validation ───
  {
    id: 'pydantic',
    title: 'Pydantic Models & Validation',
    lessons: [
      createLesson(
        'pyd-1',
        'Data Validation with Pydantic',
        [
          'Understand how to define a Pydantic BaseModel',
          'Use standard Python type annotations in model fields',
          'Receive and validate JSON request bodies automatically',
        ],
        [
          'Pydantic models are Python classes that inherit from BaseModel',
          'Type annotations on fields enforce validation at runtime',
          'FastAPI automatically parses and validates request bodies into model instances',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Request Bodies with Pydantic</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">When you need to send data from a client to your API, you send it as a request body. FastAPI uses <strong>Pydantic models</strong> to define the structure and validation rules for request bodies.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">To declare a request body, you create a Pydantic model (inheriting from <code>BaseModel</code>) with type-annotated fields. FastAPI automatically parses the incoming JSON, validates each field, and provides the model instance to your endpoint function.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Fields with default values (<code>description: str = None</code>) are optional. Fields without defaults (<code>name: str</code>) are required. FastAPI returns a 422 validation error if required fields are missing or have the wrong type.</p>
        `,
        `from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass Item(BaseModel):\n    name: str\n    description: str = None\n    price: float\n    tax: float = None\n\n@app.post("/items")\ndef create_item(item: Item):\n    item_dict = item.dict()\n    if item.tax:\n        price_with_tax = item.price + item.tax\n        item_dict.update({"price_with_tax": price_with_tax})\n    return item_dict`
      ),
      createLesson(
        'pyd-2',
        'Nested Models & Advanced Field Types',
        [
          'Create nested Pydantic models for complex data structures',
          'Use List, Optional, and other generic types in models',
          'Validate email addresses, URLs, and other string formats',
        ],
        [
          'Pydantic models can be nested arbitrarily deep for complex JSON structures',
          'Use pydantic.Field() for additional constraints like ge, le, max_length',
          'Pydantic provides built-in validators for emails, URLs, UUIDs, and more',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Complex Data Structures</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Pydantic supports nested models — a model field can be another Pydantic model, a list of models, or a dictionary of models. This mirrors the structure of complex JSON APIs.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">You can use <code>pydantic.Field()</code> to add extra validation: <code>Field(ge=0, le=100)</code> for numeric ranges, <code>Field(max_length=100)</code> for string lengths, and more.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Pydantic also provides special types like <code>EmailStr</code>, <code>UrlStr</code>, <code>UUID</code>, <code>datetime</code>, and <code>HttpUrl</code>. These require <code>pip install pydantic[email]</code> for email validation.</p>
        `,
        `from typing import List, Optional\nfrom datetime import datetime\nfrom pydantic import BaseModel, Field\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\nclass Tag(BaseModel):\n    name: str = Field(..., max_length=20)\n    color: str = Field("blue", max_length=7)\n\nclass Item(BaseModel):\n    name: str = Field(..., min_length=1, max_length=100)\n    price: float = Field(..., ge=0, le=100000)\n    tags: List[Tag] = []\n    created_at: datetime = None\n\n@app.post("/items")\ndef create_item(item: Item):\n    return {\n        "name": item.name,\n        "price": item.price,\n        "tag_count": len(item.tags),\n        "created_at": item.created_at or datetime.now(),\n    }`
      ),
      createLesson(
        'pyd-3',
        'Model Config & Custom Validators',
        [
          'Use model Config to control behavior (ORM mode, strict mode)',
          'Write custom validators with @validator decorator',
          'Configure JSON serialization behavior',
        ],
        [
          'Use model Config class for ORM mode, extra fields handling, and more',
          '@validator decorators run custom validation logic after type checking',
          'Model Config also controls JSON encoders, schema generation, and aliases',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Customizing Pydantic Behavior</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Pydantic's <code>Config</code> class lets you control how models behave. Key options include <code>orm_mode=True</code> (for SQLAlchemy integration), <code>extra = "forbid"</code> (to reject unknown fields), and <code>use_enum_values = True</code>.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Custom validators are defined with the <code>@validator</code> decorator. They run after Pydantic's built-in type validation and allow you to implement complex business logic — like checking that a start date is before an end date.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">You can also use <code>@root_validator</code> to validate an entire model at once, <code>@field_validator</code> (Pydantic v2) to validate individual fields, and custom JSON encoders via <code>Config.json_encoders</code>.</p>
        `,
        `from pydantic import BaseModel, validator, Field\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\nclass Reservation(BaseModel):\n    name: str\n    start_date: str\n    end_date: str\n    guests: int = Field(1, ge=1, le=20)\n\n    @validator("end_date")\n    def end_must_be_after_start(cls, v, values):\n        if "start_date" in values and v < values["start_date"]:\n            raise ValueError("end_date must be after start_date")\n        return v\n\n    @validator("name")\n    def name_must_be_meaningful(cls, v):\n        if v.strip() == "":\n            raise ValueError("name cannot be empty")\n        return v.strip()\n\n    class Config:\n        extra = "forbid"  # reject unknown fields\n        use_enum_values = True\n\n@app.post("/reservations")\ndef create_reservation(res: Reservation):\n    return {\n        "message": f"Reservation for {res.name} confirmed!",\n        "details": res.dict(),\n    }`
      ),
    ],
    quiz: [
      {
        id: 'q-pyd-1',
        question: 'Which library does FastAPI use under the hood for data validation and settings management using Python type hints?',
        options: ['Marshmallow', 'Cerberus', 'Pydantic', 'Django Forms'],
        correct: 2,
      },
      {
        id: 'q-pyd-2',
        question: 'In a Pydantic model, what makes a field optional?',
        options: ['Using the @optional decorator', 'Giving it a default value', 'Prefixing it with opt_', 'Setting a default factory'],
        correct: 1,
      },
      {
        id: 'q-pyd-3',
        question: 'How do you add custom validation logic to a Pydantic model?',
        options: ['By overriding __validate__', 'Using the @validator decorator', 'By writing a validate() method', 'Using a custom metaclass'],
        correct: 1,
      },
      {
        id: 'q-pyd-4',
        question: 'What model Config option enables Pydantic to work with SQLAlchemy models?',
        options: ['sqlalchemy_mode = True', 'orm_mode = True', 'db_mode = True', 'model_mode = True'],
        correct: 1,
      },
    ],
  },

  // ─── MODULE 4: Dependency Injection ───
  {
    id: 'dependency-injection',
    title: 'Dependency Injection',
    lessons: [
      createLesson(
        'di-1',
        'What is Dependency Injection?',
        [
          'Understand the concept of dependency injection in web frameworks',
          'Write simple function-based dependencies using Depends()',
          'Share common logic like DB sessions, auth checks, and config across routes',
        ],
        [
          'Dependency injection provides a clean way to share logic and state across endpoints',
          'Dependencies are declared as function parameters with Depends()',
          'FastAPI handles creating, reusing, and cleaning up dependencies automatically',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Dependency Injection in FastAPI</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Dependency Injection is a design pattern where an object receives its dependencies from an external source rather than creating them internally. In FastAPI, the <code>Depends()</code> function is used to declare dependencies for your path operations.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Common use cases include: sharing database sessions, authenticating users, enforcing permissions, pagination, rate limiting, and loading configuration. Dependencies can be functions, classes, or callables.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI's DI system automatically <strong>caches</strong> dependencies within a request scope. If two path operations depend on the same dependency, it's only called once per request.</p>
        <div class="bg-green-50 border-l-4 border-[#059669] p-4 my-6 rounded-r-lg">
          <p class="text-green-800 font-medium"><i class="fa-solid fa-rocket mr-1"></i> Pro Tip: Dependencies can return values (like a DB session) or just perform side effects (like verifying auth).</p>
        </div>
        `,
        `from fastapi import FastAPI, Depends\n\napp = FastAPI()\n\n# A simple dependency\nasync def common_parameters(\n    skip: int = 0,\n    limit: int = 100,\n):\n    return {"skip": skip, "limit": limit}\n\n@app.get("/items")\ndef list_items(params: dict = Depends(common_parameters)):\n    return {"items": [{"id": i} for i in range(params["skip"], params["skip"] + params["limit"])], **params}\n\n@app.get("/users")\ndef list_users(params: dict = Depends(common_parameters)):\n    return {"users": [f"user_{i}" for i in range(params["skip"], params["skip"] + params["limit"])], **params}`
      ),
      createLesson(
        'di-2',
        'Class-based Dependencies & Yield',
        [
          'Create class-based dependencies with __init__ and __call__',
          'Use yield in dependencies for setup/teardown patterns',
          'Understand dependency scoping and sub-dependencies',
        ],
        [
          'Class-based dependencies can hold state and accept their own parameters',
          'Dependencies using yield enable setup/teardown (like DB connection lifecycle)',
          'Dependencies can depend on other dependencies (sub-dependencies)',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Advanced Dependency Patterns</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Dependencies can be classes instead of functions. A class dependency is instantiated once and called with the request parameters. This is useful when a dependency needs its own configuration or initialization.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">When a dependency uses <code>yield</code> instead of <code>return</code>, code after the <code>yield</code> runs as <strong>cleanup</strong> after the response is sent — perfect for closing database connections or releasing resources.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Dependencies can form a <strong>dependency graph</strong> — a dependency can itself use <code>Depends()</code>. FastAPI resolves the entire graph, handles caching, and respects the execution order.</p>
        `,
        `from fastapi import FastAPI, Depends\n\napp = FastAPI()\n\nclass Pagination:\n    def __init__(self, default_limit: int = 10):\n        self.default_limit = default_limit\n\n    def __call__(self, skip: int = 0, limit: int = None):\n        if limit is None:\n            limit = self.default_limit\n        return {"skip": skip, "limit": limit}\n\nasync def get_db():\n    # Simulate DB connection setup\n    db = {"connection": "open", "session_id": 123}\n    try:\n        yield db  # Provide the dependency value\n    finally:\n        # Cleanup runs after response is sent\n        print(f"Closing DB session {db['session_id']}")\n\n@app.get("/data")\nasync def get_data(\n    pagination: dict = Depends(Pagination(default_limit=25)),\n    db: dict = Depends(get_db),\n):\n    return {"data": ["sample"], "pagination": pagination, "db_status": db["connection"]}`
      ),
      createLesson(
        'di-3',
        'Global Dependencies & Middleware Integration',
        [
          'Apply dependencies to entire routers or the whole application',
          'Use dependencies for global concerns like logging and metrics',
          'Combine dependencies with middleware for request preprocessing',
        ],
        [
          'Dependencies can be applied at the app, router, or route level',
          'Global dependencies are ideal for logging, metrics collection, and security checks',
          'Use depends with yield for proper resource lifecycle management',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Dependency Scopes & Integration</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">You can apply dependencies to an entire APIRouter or the whole FastAPI application using the <code>dependencies</code> parameter. This is useful for cross-cutting concerns that should apply to multiple endpoints.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Dependencies work alongside middleware. While middleware operates at the request/response level (modifying headers, etc.), dependencies operate at the route handler level (injecting parameters, performing logic).</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Use <code>dependencies=[Depends(verify_api_key)]</code> on an APIRouter to require an API key for every route in that router without repeating the dependency in each handler.</p>
        `,
        `from fastapi import FastAPI, Depends, APIRouter, HTTPException\nimport time\n\napp = FastAPI()\n\n# Global dependency for request timing\nasync def add_process_time_header():\n    start = time.time()\n    yield\n    process_time = time.time() - start\n    print(f"Request processed in {process_time:.3f}s")\n\napp.dependency_overrides = {}  # Useful for testing\n\nrouter = APIRouter(\n    prefix="/api/v1",\n    dependencies=[Depends(add_process_time_header)],\n)\n\nasync def verify_token(token: str = None):\n    if token != "secret-token":\n        raise HTTPException(status_code=401, detail="Invalid token")\n    return {"user": "authenticated"}\n\n@router.get("/secure-data")\ndef get_secure_data(auth: dict = Depends(verify_token)):\n    return {"message": "This is protected data", "auth": auth}\n\napp.include_router(router)\n\n@app.get("/public")\ndef public_endpoint():\n    return {"message": "This is public"}`
      ),
    ],
    quiz: [
      {
        id: 'q-di-1',
        question: 'Which FastAPI function is used to declare a dependency?',
        options: ['Inject()', 'Depends()', 'Require()', 'Use()'],
        correct: 1,
      },
      {
        id: 'q-di-2',
        question: 'What keyword in a dependency function provides cleanup logic?',
        options: ['return', 'yield', 'finally', 'async'],
        correct: 1,
      },
      {
        id: 'q-di-3',
        question: 'Can a FastAPI dependency depend on another dependency?',
        options: ['No, dependencies must be independent', 'Yes, using Depends() inside a dependency function', 'Only class-based dependencies can be nested', 'Only with yield-based dependencies'],
        correct: 1,
      },
    ],
  },

  // ─── MODULE 5: OAuth2 & JWT Authentication ───
  {
    id: 'oauth-jwt',
    title: 'OAuth2 & JWT Authentication',
    lessons: [
      createLesson(
        'auth-1',
        'Introduction to Authentication & OAuth2',
        [
          'Understand the difference between authentication and authorization',
          'Learn OAuth2 flow for API authentication',
          'Implement a simple username/password login endpoint',
        ],
        [
          'Authentication verifies who you are; authorization determines what you can do',
          'OAuth2 is a standard protocol for token-based authentication',
          'FastAPI provides OAuth2PasswordBearer for easy token extraction from headers',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Authentication with OAuth2</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Authentication answers \"Who are you?\" and Authorization answers \"What can you do?\". OAuth2 is a widely-used standard for implementing token-based authentication in APIs.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI provides <code>OAuth2PasswordBearer</code> — a dependency that extracts the token from the <code>Authorization: Bearer <token></code> header automatically. It returns the token string, which you can then validate.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">The OAuth2 standard defines several <strong>flows</strong> (password flow, client credentials, authorization code). FastAPI's password flow is ideal for first-party applications where you control both the frontend and backend.</p>
        <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
          <p class="text-purple-800 font-medium"><i class="fa-solid fa-lock mr-1"></i> Security Note: Always use HTTPS in production! Tokens sent over HTTP can be intercepted.</p>
        </div>
        `,
        `from fastapi import FastAPI, Depends, HTTPException\nfrom fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm\n\napp = FastAPI()\n\noauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")\n\n# Fake user database\nfake_users_db = {\n    "alice": {"username": "alice", "password": "secret123"},\n}\n\n@app.post("/token")\nasync def login(form_data: OAuth2PasswordRequestForm = Depends()):\n    user = fake_users_db.get(form_data.username)\n    if not user or user["password"] != form_data.password:\n        raise HTTPException(401, "Incorrect username or password")\n    return {"access_token": user["username"], "token_type": "bearer"}\n\n@app.get("/users/me")\nasync def read_users_me(token: str = Depends(oauth2_scheme)):\n    user = fake_users_db.get(token)\n    if not user:\n        raise HTTPException(401, "Invalid token")\n    return {"username": user["username"]}`
      ),
      createLesson(
        'auth-2',
        'JWT Token Creation & Verification',
        [
          'Understand the structure of JWT tokens (header, payload, signature)',
          'Create and sign JWTs using PyJWT or python-jose',
          'Verify and decode JWTs in a dependency for protected routes',
        ],
        [
          'JWTs consist of three parts: header (alg), payload (claims), and signature',
          'The signature cryptographically proves the token was issued by your server',
          'Always set an expiration time (exp claim) on your tokens',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">JSON Web Tokens (JWT)</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">A JWT (JSON Web Token) is a compact, URL-safe token format. It consists of three base64-encoded parts separated by dots: <code>header.payload.signature</code>.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">The <strong>header</strong> specifies the signing algorithm. The <strong>payload</strong> contains claims (like user ID, role, expiration). The <strong>signature</strong> is created by hashing the header and payload with a secret key — this prevents tampering.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Use <code>python-jose</code> or <code>PyJWT</code> to create and verify JWTs. Store the secret key in an environment variable, never hardcode it! Set reasonable expiration times (15-60 minutes) and implement token refresh for long sessions.</p>
        <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
          <p class="text-red-800 font-medium"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Warning: The secret key used to sign JWTs must be kept secret! If compromised, anyone can forge tokens.</p>
        </div>
        `,
        `from fastapi import FastAPI, Depends, HTTPException\nfrom fastapi.security import OAuth2PasswordBearer\nfrom jose import JWTError, jwt\nfrom datetime import datetime, timedelta\n\nSECRET_KEY = "change-this-to-a-long-random-string"\nALGORITHM = "HS256"\nACCESS_TOKEN_EXPIRE_MINUTES = 30\n\napp = FastAPI()\noauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")\n\ndef create_access_token(data: dict):\n    to_encode = data.copy()\n    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)\n    to_encode.update({"exp": expire})\n    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)\n\nasync def get_current_user(token: str = Depends(oauth2_scheme)):\n    try:\n        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])\n        username: str = payload.get("sub")\n        if username is None:\n            raise HTTPException(401, "Invalid token")\n        return {"username": username}\n    except JWTError:\n        raise HTTPException(401, "Invalid token")\n\n@app.get("/secure")\nasync def secure_endpoint(current_user: dict = Depends(get_current_user)):\n    return {"message": "Welcome!", "user": current_user}`
      ),
      createLesson(
        'auth-3',
        'Role-Based Access Control (RBAC)',
        [
          'Add role claims to JWT tokens',
          'Create role-checking dependencies for authorization',
          'Implement role hierarchies and permission checks',
        ],
        [
          'Store user roles inside the JWT payload for stateless authorization',
          'Create reusable dependencies that check specific roles or permissions',
          'Combine multiple dependencies for fine-grained access control',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Authorization with Roles</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Role-Based Access Control (RBAC) lets you restrict access to certain endpoints based on the user's role. Common roles include <code>admin</code>, <code>user</code>, and <code>viewer</code>.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">By embedding the user's role inside the JWT payload, you can create a <strong>role-checking dependency</strong> that verifies the role before allowing access to the route. This keeps authorization logic clean and reusable.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">For more complex systems, you can implement <strong>role hierarchies</strong> (an admin inherits all permissions of a user) or <strong>permission-based</strong> access control where each action requires a specific permission flag.</p>
        `,
        `from fastapi import FastAPI, Depends, HTTPException\nfrom fastapi.security import OAuth2PasswordBearer\nfrom jose import jwt\nfrom datetime import datetime, timedelta\n\nSECRET_KEY = "change-me"\nALGORITHM = "HS256"\n\napp = FastAPI()\noauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")\n\n# Role hierarchy: admin > moderator > user > viewer\nROLE_HIERARCHY = {"admin": 4, "moderator": 3, "user": 2, "viewer": 1}\n\nasync def get_current_user(token: str = Depends(oauth2_scheme)):\n    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])\n    return {"username": payload.get("sub"), "role": payload.get("role", "viewer")}\n\ndef require_role(min_role: str):\n    def role_checker(current_user: dict = Depends(get_current_user)):\n        user_level = ROLE_HIERARCHY.get(current_user["role"], 0)\n        required_level = ROLE_HIERARCHY.get(min_role, 0)\n        if user_level < required_level:\n            raise HTTPException(403, "Insufficient permissions")\n        return current_user\n    return role_checker\n\n@app.get("/admin")\nasync def admin_only(user: dict = Depends(require_role("admin"))):\n    return {"message": "Welcome admin!", "user": user}\n\n@app.get("/dashboard")\nasync def dashboard(user: dict = Depends(require_role("user"))):\n    return {"message": "Dashboard access granted", "role": user["role"]}`
      ),
    ],
    quiz: [
      {
        id: 'q-auth-1',
        question: 'What does OAuth2PasswordBearer extract from the request?',
        options: ['The username and password', 'The Bearer token from the Authorization header', 'The session cookie', 'The API key from headers'],
        correct: 1,
      },
      {
        id: 'q-auth-2',
        question: 'In a JWT, which part contains the claims like user ID and role?',
        options: ['Header', 'Payload', 'Signature', 'Footer'],
        correct: 1,
      },
      {
        id: 'q-auth-3',
        question: 'What claim in a JWT is used to set an expiration time?',
        options: ['nbf', 'iat', 'exp', 'ttl'],
        correct: 2,
      },
      {
        id: 'q-auth-4',
        question: 'What HTTP status code should be returned for unauthorized access (missing or invalid token)?',
        options: ['400', '401', '403', '404'],
        correct: 1,
      },
      {
        id: 'q-auth-5',
        question: 'What HTTP status code is appropriate for insufficient permissions?',
        options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '409 Conflict'],
        correct: 2,
      },
    ],
  },

  // ─── MODULE 6: Background Tasks & Scheduled Jobs ───
  {
    id: 'background-tasks',
    title: 'Background Tasks & Scheduled Jobs',
    lessons: [
      createLesson(
        'bt-1',
        'BackgroundTasks in FastAPI',
        [
          'Understand when to use background tasks vs synchronous processing',
          'Use FastAPI\'s built-in BackgroundTasks',
          'Run tasks after returning a response to the client',
        ],
        [
          'BackgroundTasks let you run functions after sending the HTTP response',
          'Useful for sending emails, logging, webhooks, or data processing',
          'FastAPI\'s BackgroundTasks are lightweight and run in the same process',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Lightweight Background Tasks</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Sometimes you need to do work after returning a response — like sending a confirmation email, logging analytics, or processing an uploaded file. FastAPI's <code>BackgroundTasks</code> handles this elegantly.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Add a <code>BackgroundTasks</code> parameter to your path operation, then call <code>tasks.add_task(function, *args)</code> to schedule work. The function runs after the response is sent, so the client doesn't have to wait.</p>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Limitation:</strong> BackgroundTasks run in the same process. For CPU-heavy or long-running jobs, use an external task queue like Celery or ARQ.</p>
        <div class="bg-green-50 border-l-4 border-[#059669] p-4 my-6 rounded-r-lg">
          <p class="text-green-800 font-medium"><i class="fa-solid fa-rocket mr-1"></i> Pro Tip: BackgroundTasks are perfect for fast, non-blocking operations that should not delay the response.</p>
        </div>
        `,
        `from fastapi import FastAPI, BackgroundTasks\nfrom typing import Callable\n\napp = FastAPI()\n\ndef write_log(message: str):\n    # Simulate writing to a log file\n    with open("requests.log", "a") as f:\n        f.write(f"{message}\\n")\n\ndef send_welcome_email(email: str, username: str):\n    # Simulate email sending (runs after response)\n    print(f"Sending welcome email to {email} for user {username}")\n\n@app.post("/register")\nasync def register(username: str, email: str, background_tasks: BackgroundTasks):\n    # Add background tasks\n    background_tasks.add_task(send_welcome_email, email, username)\n    background_tasks.add_task(write_log, f"New user: {username}")\n    # Client gets response immediately\n    return {"message": f"User {username} registered! Welcome email incoming."}`
      ),
      createLesson(
        'bt-2',
        'Task Queues with Celery & ARQ',
        [
          'Understand when to use an external task queue',
          'Set up a basic Celery or ARQ task worker',
          'Send tasks from FastAPI to the task queue',
        ],
        [
          'External task queues handle long-running, CPU-heavy, or scheduled tasks',
          'Celery is the most popular Python task queue with Redis/RabbitMQ as broker',
          'ARQ is a lightweight alternative using Redis as both broker and result backend',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">External Task Queues</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">For background work that takes more than a few seconds — like generating PDFs, processing images, or sending mass emails — you need an external task queue. The most popular options are <strong>Celery</strong> (mature, feature-rich) and <strong>ARQ</strong> (modern, lightweight, async-native).</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Both use a <strong>broker</strong> (like Redis or RabbitMQ) to store tasks. Your FastAPI app publishes tasks to the broker, and separate <strong>worker processes</strong> consume and execute them. This scales horizontally — you can run dozens of workers across multiple machines.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Celery also supports <strong>scheduled tasks</strong> (like cron jobs), task retries with backoff, task chaining, and result storage. ARQ offers similar features with a simpler API and native async support.</p>
        `,
        `# Requires: pip install celery[redis]\nfrom fastapi import FastAPI\nfrom celery import Celery\n\napp = FastAPI()\ncelery_app = Celery("tasks", broker="redis://localhost:6379/0", backend="redis://localhost:6379/0")\n\n@celery_app.task\ndef generate_report(user_id: int):\n    import time\n    time.sleep(10)  # Simulate long task\n    return {"user_id": user_id, "report": "Report data", "status": "completed"}\n\n@app.post("/reports/{user_id}")\nasync def request_report(user_id: int):\n    task = generate_report.delay(user_id)\n    return {"task_id": task.id, "status": "processing", "message": "Report is being generated"}\n\n@app.get("/reports/status/{task_id}")\nasync def get_report_status(task_id: str):\n    task = generate_report.AsyncResult(task_id)\n    if task.ready():\n        return {"status": "completed", "result": task.result}\n    return {"status": "processing"}`
      ),
      createLesson(
        'bt-3',
        'Scheduled Jobs & Monitoring',
        [
          'Configure periodic/scheduled tasks using Celery Beat',
          'Monitor background tasks and handle failures gracefully',
          'Implement retry logic and task chaining',
        ],
        [
          'Celery Beat provides cron-like scheduling for periodic tasks',
          'Monitor tasks with Flower (Celery) or Redis-based dashboards',
          'Always implement retry logic for transient failures',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Scheduling & Monitoring</h3>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Celery Beat</strong> is a scheduler that kicks off periodic tasks at fixed intervals — like cleaning up old data every night, sending daily digest emails, or generating weekly reports. It works alongside your regular Celery workers.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">For monitoring, <strong>Flower</strong> provides a web-based dashboard for Celery that shows active tasks, completed tasks, failed tasks, worker status, and more. For ARQ, you can use RedisInsight or build a custom monitoring endpoint.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Always implement <strong>retry logic</strong> for tasks that may fail due to transient issues (network timeouts, database locks). Celery supports exponential backoff, max retries, and custom retry delays.</p>
        `,
        `# celery_config.py (run with: celery -A tasks beat)\nfrom celery import Celery\nfrom celery.schedules import crontab\n\ncelery_app = Celery("tasks", broker="redis://localhost:6379/0")\n\ncelery_app.conf.beat_schedule = {\n    "cleanup-old-records": {\n        "task": "app.tasks.cleanup_old_records",\n        "schedule": crontab(hour=3, minute=0),  # Daily at 3 AM\n    },\n    "send-daily-digest": {\n        "task": "app.tasks.send_daily_digest",\n        "schedule": crontab(hour=8, minute=30),  # Daily at 8:30 AM\n    },\n}\n\n# app/tasks.py\nfrom celery import shared_task\n\n@shared_task(bind=True, max_retries=3, default_retry_delay=60)\ndef cleanup_old_records(self):\n    try:\n        # Delete records older than 30 days\n        print("Cleaning up old records...")\n        return {"deleted": 150}\n    except Exception as exc:\n        raise self.retry(exc=exc)`
      ),
    ],
    quiz: [
      {
        id: 'q-bt-1',
        question: 'When does a BackgroundTasks function run in FastAPI?',
        options: ['Before the request is processed', 'During request processing', 'After the response is sent', 'At server startup'],
        correct: 2,
      },
      {
        id: 'q-bt-2',
        question: 'What is the main advantage of using an external task queue like Celery over FastAPI\'s built-in BackgroundTasks?',
        options: ['Faster response times', 'Supports long-running and CPU-heavy tasks', 'No need for a broker', 'Better type safety'],
        correct: 1,
      },
      {
        id: 'q-bt-3',
        question: 'What component in Celery handles periodic/scheduled tasks?',
        options: ['Celery Worker', 'Celery Beat', 'Flower', 'Redis Broker'],
        correct: 1,
      },
    ],
  },

  // ─── MODULE 7: Middleware & CORS ───
  {
    id: 'middleware-cors',
    title: 'Middleware & CORS',
    lessons: [
      createLesson(
        'mw-1',
        'What is Middleware?',
        [
          'Understand the middleware concept in FastAPI',
          'Write custom middleware functions',
          'Modify requests and responses in the middleware layer',
        ],
        [
          'Middleware processes every request before reaching your route handlers',
          'Middleware can modify requests, responses, or short-circuit processing',
          'Use middleware for logging, timing, header manipulation, and security',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Middleware in FastAPI</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Middleware is a function that processes every request <strong>before</strong> it reaches your route handler and every response <strong>before</strong> it's sent back. Think of it as a series of layers that wrap your application.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">To create middleware, use the <code>@app.middleware("http")</code> decorator. The middleware function receives the <code>request</code> and a <code>call_next</code> function. You can modify the request, call <code>call_next(request)</code> to get the response, then modify the response before returning it.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Common middleware use cases: request logging, timing/performance monitoring, adding security headers, request ID generation, IP blocking, and rate limiting.</p>
        <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
          <p class="text-purple-800 font-medium"><i class="fa-solid fa-lightbulb mr-1"></i> Tip: Middleware runs in the order it's added. The first middleware added is the outermost layer.</p>
        </div>
        `,
        `from fastapi import FastAPI, Request\nimport time\n\napp = FastAPI()\n\n@app.middleware("http")\nasync def add_process_time_header(request: Request, call_next):\n    start_time = time.time()\n    response = await call_next(request)\n    process_time = time.time() - start_time\n    response.headers["X-Process-Time"] = str(process_time)\n    return response\n\n@app.middleware("http")\nasync def log_requests(request: Request, call_next):\n    print(f"Request: {request.method} {request.url.path}")\n    response = await call_next(request)\n    print(f"Response: {response.status_code}")\n    return response\n\n@app.get("/")\nasync def root():\n    return {"message": "Check the X-Process-Time header!"}`
      ),
      createLesson(
        'mw-2',
        'CORS Configuration',
        [
          'Understand the Same-Origin Policy and why CORS exists',
          'Configure CORS middleware in FastAPI',
          'Allow specific origins, methods, and headers',
        ],
        [
          'CORS (Cross-Origin Resource Sharing) controls which domains can access your API',
          'Use CORSMiddleware from FastAPI to configure allowed origins',
          'Be specific with allowed origins — avoid using "*" in production',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Configuring CORS</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Browsers enforce a <strong>Same-Origin Policy</strong> that blocks JavaScript from one domain from making requests to another domain. CORS (Cross-Origin Resource Sharing) is a mechanism that allows servers to opt-in to cross-origin requests.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI provides <code>CORSMiddleware</code> that makes configuration straightforward. You specify which origins, methods, headers, and credentials are allowed. For development, you might allow all origins (<code>"*"</code>), but in production, be specific.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">When a browser makes a cross-origin request, it first sends a <strong>preflight</strong> OPTIONS request to check if the server allows it. CORSMiddleware handles this automatically.</p>
        <div class="bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg">
          <p class="text-red-800 font-medium"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Warning: Avoid using allow_origins=["*"] with allow_credentials=True. This is a security risk.</p>
        </div>
        `,
        `from fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\n\napp = FastAPI()\n\norigins = [\n    "http://localhost:3000",   # React dev server\n    "http://localhost:8080",   # Vue dev server\n    "https://myapp.com",       # Production domain\n]\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=origins,\n    allow_credentials=True,\n    allow_methods=["*"],\n    allow_headers=["*"],\n)\n\n@app.get("/")\nasync def root():\n    return {"message": "CORS is configured!"}\n\n@app.post("/data")\nasync def receive_data():\n    return {"message": "POST request received with CORS"}`
      ),
      createLesson(
        'mw-3',
        'Custom Middleware & Advanced Patterns',
        [
          'Create custom middleware classes using BaseHTTPMiddleware',
          'Implement rate limiting in middleware',
          'Add request ID tracking across the application',
        ],
        [
          'Use BaseHTTPMiddleware for class-based middleware with state',
          'Rate limiting middleware protects your API from abuse',
          'Request IDs help correlate logs across services',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Advanced Middleware Patterns</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">For complex middleware that needs to maintain state (like counters or caches), you can create a class that inherits from <code>BaseHTTPMiddleware</code>. This gives you access to the app instance and allows you to store state in class variables.</p>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Rate limiting</strong> middleware tracks the number of requests from each IP and blocks excessive requests. A simple implementation uses an in-memory dictionary with timestamps. For production, use Redis-based rate limiting.</p>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Request ID</strong> middleware generates a unique ID for each request. This ID is added to the response header and can be used to correlate logs, errors, and tracing across microservices.</p>
        `,
        `from fastapi import FastAPI, Request, HTTPException\nfrom starlette.middleware.base import BaseHTTPMiddleware\nimport uuid\nimport time\n\napp = FastAPI()\n\n# Rate limiter middleware\nclass RateLimitMiddleware(BaseHTTPMiddleware):\n    def __init__(self, app, max_requests: int = 10, window_seconds: int = 60):\n        super().__init__(app)\n        self.max_requests = max_requests\n        self.window_seconds = window_seconds\n        self.requests = {}  # IP -> list of timestamps\n\n    async def dispatch(self, request: Request, call_next):\n        client_ip = request.client.host if request.client else "unknown"\n        now = time.time()\n        window_start = now - self.window_seconds\n\n        # Clean old entries and check rate\n        if client_ip in self.requests:\n            self.requests[client_ip] = [\n                t for t in self.requests[client_ip] if t > window_start\n            ]\n            if len(self.requests[client_ip]) >= self.max_requests:\n                raise HTTPException(429, "Too many requests. Please slow down.")\n        else:\n            self.requests[client_ip] = []\n\n        self.requests[client_ip].append(now)\n\n        request_id = str(uuid.uuid4())\n        response = await call_next(request)\n        response.headers["X-Request-ID"] = request_id\n        return response\n\napp.add_middleware(RateLimitMiddleware, max_requests=5, window_seconds=10)\n\n@app.get("/")\nasync def root():\n    return {"message": "Rate limited & request ID added!"}`
      ),
    ],
    quiz: [
      {
        id: 'q-mw-1',
        question: 'How do you add a custom HTTP middleware in FastAPI?',
        options: ['@app.intercept()', '@app.middleware("http")', '@app.processor()', '@app.filter("http")'],
        correct: 1,
      },
      {
        id: 'q-mw-2',
        question: 'What is CORS short for?',
        options: ['Cross-Origin Resource Sharing', 'Cross-Origin Request Security', 'Common Origin Resource Sharing', 'Cross-Origin Routing Service'],
        correct: 0,
      },
      {
        id: 'q-mw-3',
        question: 'Which HTTP method does a browser send as a CORS preflight request?',
        options: ['GET', 'HEAD', 'OPTIONS', 'PREFLIGHT'],
        correct: 2,
      },
      {
        id: 'q-mw-4',
        question: 'What HTTP status code does rate limiting middleware typically return?',
        options: ['400', '403', '429', '503'],
        correct: 2,
      },
    ],
  },

  // ─── MODULE 8: WebSocket Support ───
  {
    id: 'websockets',
    title: 'WebSocket Support',
    lessons: [
      createLesson(
        'ws-1',
        'WebSocket Basics with FastAPI',
        [
          'Understand the WebSocket protocol and when to use it',
          'Create a basic WebSocket endpoint in FastAPI',
          'Send and receive messages over a WebSocket connection',
        ],
        [
          'WebSockets provide full-duplex, real-time communication over a single TCP connection',
          'FastAPI supports WebSockets natively with minimal setup',
          'Use WebSockets for chat apps, live notifications, gaming, and streaming data',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Real-Time Communication with WebSockets</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Unlike HTTP, where the client sends a request and the server sends a response (and then the connection closes), <strong>WebSockets</strong> keep a persistent connection open. Both the client and server can send messages at any time.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI supports WebSockets natively. You define a WebSocket endpoint with <code>@app.websocket("/ws")</code> and the function receives a <code>WebSocket</code> object. Call <code>await websocket.accept()</code> to accept the connection, then use <code>send_text()</code> and <code>receive_text()</code> to communicate.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">WebSocket connections can send both text and binary data. Use <code>send_json()</code> for structured data. Handle the <code>WebSocketDisconnect</code> exception to clean up when a client disconnects.</p>
        `,
        `from fastapi import FastAPI, WebSocket, WebSocketDisconnect\n\napp = FastAPI()\n\n@app.websocket("/ws")\nasync def websocket_endpoint(websocket: WebSocket):\n    await websocket.accept()\n    try:\n        while True:\n            data = await websocket.receive_text()\n            await websocket.send_text(f"Echo: {data}")\n    except WebSocketDisconnect:\n        print("Client disconnected")`
      ),
      createLesson(
        'ws-2',
        'Real-Time Chat with WebSockets',
        [
          'Build a simple multi-client chat application',
          'Manage multiple WebSocket connections',
          'Broadcast messages to all connected clients',
        ],
        [
          'Use a connection manager class to track active WebSocket connections',
          'Broadcast messages by iterating over all active connections',
          'Handle disconnections gracefully by removing closed connections from the manager',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Building a Chat Application</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">A multi-client chat server manages multiple WebSocket connections simultaneously. When one client sends a message, the server <strong>broadcasts</strong> it to all connected clients (or to a specific room).</p>
        <p class="mb-4 text-gray-700 leading-relaxed">The <strong>ConnectionManager</strong> pattern is the standard approach: a class that holds a list of active connections, provides methods to <code>connect()</code>, <code>disconnect()</code>, and <code>broadcast()</code>. This keeps your WebSocket logic clean and organized.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">For more advanced features, you can implement <strong>rooms/channels</strong> (grouping connections by topic), private messaging (sending to specific clients), and typing indicators. Each feature just adds more methods to the ConnectionManager.</p>
        `,
        `from fastapi import FastAPI, WebSocket, WebSocketDisconnect\nfrom typing import List\n\napp = FastAPI()\n\nclass ConnectionManager:\n    def __init__(self):\n        self.active_connections: List[WebSocket] = []\n\n    async def connect(self, websocket: WebSocket):\n        await websocket.accept()\n        self.active_connections.append(websocket)\n\n    def disconnect(self, websocket: WebSocket):\n        self.active_connections.remove(websocket)\n\n    async def broadcast(self, message: str):\n        for connection in self.active_connections:\n            await connection.send_text(message)\n\nmanager = ConnectionManager()\n\n@app.websocket("/chat")\nasync def chat(websocket: WebSocket):\n    await manager.connect(websocket)\n    await manager.broadcast(f"User joined the chat")\n    try:\n        while True:\n            data = await websocket.receive_text()\n            await manager.broadcast(f"> {data}")\n    except WebSocketDisconnect:\n        manager.disconnect(websocket)\n        await manager.broadcast(f"User left the chat")`
      ),
      createLesson(
        'ws-3',
        'WebSocket Authentication & State',
        [
          'Authenticate WebSocket connections on connect',
          'Maintain per-connection state',
          'Handle connection lifecycle and reconnection logic',
        ],
        [
          'Validate authentication tokens during the WebSocket handshake',
          'Use the "per-connection" state to track user identity and room membership',
          'Implement heartbeat/ping-pong to detect stale connections',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Securing WebSocket Connections</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">WebSocket connections can be authenticated by passing a token as a query parameter during the handshake (<code>ws://example.com/ws?token=abc123</code>). Validate the token inside the WebSocket handler before accepting the connection.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Each connected client has its own state — store their username, user ID, room, and connection time. This makes broadcasting and private messaging possible. A dictionary keyed by the WebSocket object works well.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Detecting stale connections is crucial. Implement a <strong>heartbeat</strong> where the server periodically pings clients, and disconnects those that don't respond. FastAPI's <code>WebSocket</code> has a <code>receive_text()</code> timeout you can configure.</p>
        `,
        `from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException\nfrom typing import Dict\n\napp = FastAPI()\n\n# In-memory state store\nclient_state: Dict[WebSocket, dict] = {}\n\nclass ConnectionManager:\n    def __init__(self):\n        self.active: Dict[WebSocket, dict] = {}\n\n    async def connect(self, websocket: WebSocket, user_data: dict):\n        await websocket.accept()\n        self.active[websocket] = user_data\n        print(f"{user_data['username']} connected")\n\n    def disconnect(self, websocket: WebSocket):\n        user = self.active.pop(websocket, {})\n        print(f"{user.get('username', 'unknown')} disconnected")\n\n    async def send_pm(self, message: str, target_username: str):\n        for ws, data in self.active.items():\n            if data["username"] == target_username:\n                await ws.send_text(f"[PM] {message}")\n                return\n\nmanager = ConnectionManager()\n\n@app.websocket("/ws/{username}")\nasync def websocket_auth(websocket: WebSocket, username: str):\n    await manager.connect(websocket, {"username": username, "room": "general"})\n    try:\n        while True:\n            data = await websocket.receive_text()\n            # Parse commands: /pm user message\n            if data.startswith("/pm "):\n                parts = data.split(\" \", 2)\n                if len(parts) == 3:\n                    await manager.send_pm(parts[2], parts[1])\n            else:\n                for ws in manager.active:\n                    if ws != websocket:\n                        await ws.send_text(f"[{username}] {data}")\n    except WebSocketDisconnect:\n        manager.disconnect(websocket)`
      ),
    ],
    quiz: [
      {
        id: 'q-ws-1',
        question: 'What decorator is used to define a WebSocket endpoint in FastAPI?',
        options: ['@app.socket()', '@app.websocket()', '@app.ws()', '@app.stream()'],
        correct: 1,
      },
      {
        id: 'q-ws-2',
        question: 'What happens if you call websocket.receive_text() and the client disconnects?',
        options: ['It returns None', 'It raises WebSocketDisconnect', 'It returns an empty string', 'The connection hangs forever'],
        correct: 1,
      },
      {
        id: 'q-ws-3',
        question: 'Which of the following is NOT a typical use case for WebSockets?',
        options: ['Real-time chat applications', 'Live sports scores', 'Reading static documentation pages', 'Multiplayer gaming'],
        correct: 2,
      },
    ],
  },

  // ─── MODULE 9: SQLAlchemy & Database Integration ───
  {
    id: 'sqlalchemy-db',
    title: 'SQLAlchemy & Database Integration',
    lessons: [
      createLesson(
        'sqla-1',
        'Connecting FastAPI to a Database',
        [
          'Set up SQLAlchemy with FastAPI',
          'Define database models using SQLAlchemy ORM',
          'Configure database sessions as FastAPI dependencies',
        ],
        [
          'SQLAlchemy is the most popular Python ORM for relational databases',
          'Use declarative models to define your database schema in Python',
          'Database sessions should be managed as FastAPI dependencies for proper lifecycle',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Setting Up SQLAlchemy</h3>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>SQLAlchemy</strong> is the most popular Python SQL toolkit and Object-Relational Mapper (ORM). It lets you define database tables as Python classes and interact with the database using Python objects instead of raw SQL.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">The setup involves three parts: (1) the <strong>engine</strong> that connects to the database, (2) the <strong>SessionLocal</strong> factory that creates database sessions, and (3) the <strong>Base</strong> class that your models inherit from.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI integrates seamlessly with SQLAlchemy. Use a <strong>dependency</strong> (with <code>yield</code>) to create a session per request and close it after the response. This ensures connections are always properly cleaned up.</p>
        `,
        `from fastapi import FastAPI, Depends\nfrom sqlalchemy import create_engine, Column, Integer, String\nfrom sqlalchemy.orm import declarative_base, Session, sessionmaker\n\nDATABASE_URL = "sqlite:///./test.db"\nengine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})\nSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)\nBase = declarative_base()\n\n# Define a model\nclass User(Base):\n    __tablename__ = "users"\n    id = Column(Integer, primary_key=True, index=True)\n    name = Column(String, index=True)\n    email = Column(String, unique=True, index=True)\n\nBase.metadata.create_all(bind=engine)\n\napp = FastAPI()\n\n# Dependency to get DB session\ndef get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()\n\n@app.get("/users")\ndef read_users(db: Session = Depends(get_db)):\n    return db.query(User).all()\n\n@app.post("/users")\ndef create_user(name: str, email: str, db: Session = Depends(get_db)):\n    user = User(name=name, email=email)\n    db.add(user)\n    db.commit()\n    db.refresh(user)\n    return user`
      ),
      createLesson(
        'sqla-2',
        'CRUD Operations with SQLAlchemy',
        [
          'Perform full CRUD (Create, Read, Update, Delete) operations',
          'Implement filtering, sorting, and pagination',
          'Build comprehensive REST endpoints backed by a database',
        ],
        [
          'Use db.query(), db.add(), db.commit(), db.delete() for standard CRUD operations',
          'Filter queries with .filter() and combine conditions with and_ / or_',
          'Always handle the "not found" case with a 404 response',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Database CRUD Operations</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">With SQLAlchemy, CRUD operations map to intuitive method calls: <code>db.query(Model).all()</code> for reading, <code>db.add(instance)</code> for creating, and <code>db.delete(instance)</code> for deleting. Always call <code>db.commit()</code> to persist changes.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">For <strong>filtering</strong>, chain <code>.filter(Model.column == value)</code> calls. For <strong>sorting</strong>, use <code>.order_by(Model.column)</code>. For <strong>pagination</strong>, combine <code>.offset(skip)</code> and <code>.limit(limit)</code>. FastAPI validates these parameters from the query string.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">When updating, either modify the object's attributes and call <code>db.commit()</code>, or use <code>db.query(Model).filter(Model.id == id).update(values)</code> for bulk updates. Always verify the item exists before updating or deleting.</p>
        `,
        `from fastapi import FastAPI, Depends, HTTPException\nfrom pydantic import BaseModel\nfrom sqlalchemy import create_engine, Column, Integer, String, Float\nfrom sqlalchemy.orm import declarative_base, Session, sessionmaker\n\nDATABASE_URL = "sqlite:///./test.db"\nengine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})\nSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)\nBase = declarative_base()\n\nclass ProductDB(Base):\n    __tablename__ = "products"\n    id = Column(Integer, primary_key=True, index=True)\n    name = Column(String, index=True)\n    price = Column(Float)\n    in_stock = Column(Integer, default=0)\n\nBase.metadata.create_all(bind=engine)\n\nclass ProductCreate(BaseModel):\n    name: str\n    price: float\n    in_stock: int = 0\n\napp = FastAPI()\n\ndef get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()\n\n@app.post("/products")\ndef create_product(product: ProductCreate, db: Session = Depends(get_db)):\n    db_product = ProductDB(**product.dict())\n    db.add(db_product)\n    db.commit()\n    db.refresh(db_product)\n    return db_product\n\n@app.get("/products")\ndef list_products(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):\n    return db.query(ProductDB).offset(skip).limit(limit).all()\n\n@app.put("/products/{product_id}")\ndef update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):\n    db_product = db.query(ProductDB).filter(ProductDB.id == product_id).first()\n    if not db_product:\n        raise HTTPException(404, "Product not found")\n    for key, value in product.dict().items():\n        setattr(db_product, key, value)\n    db.commit()\n    db.refresh(db_product)\n    return db_product\n\n@app.delete("/products/{product_id}")\ndef delete_product(product_id: int, db: Session = Depends(get_db)):\n    db_product = db.query(ProductDB).filter(ProductDB.id == product_id).first()\n    if not db_product:\n        raise HTTPException(404, "Product not found")\n    db.delete(db_product)\n    db.commit()\n    return {"message": "Deleted successfully"}`
      ),
      createLesson(
        'sqla-3',
        'Relationships, Migrations & Alembic',
        [
          'Define one-to-many and many-to-many relationships',
          'Use SQLAlchemy relationships to navigate between models',
          'Understand Alembic for database migrations',
        ],
        [
          'Use relationship() and ForeignKey to link tables in SQLAlchemy',
          'Alembic handles database schema migrations safely and incrementally',
          'Always use migrations in production instead of recreating tables',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Relationships & Migrations</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">Real applications have related data. A User <strong>has many</strong> Posts. A Post <strong>belongs to</strong> a User. SQLAlchemy makes this natural with <code>ForeignKey</code> and <code>relationship()</code>.</p>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Alembic</strong> is a database migration tool that works with SQLAlchemy. It generates migration scripts that track changes to your models over time. Instead of dropping and recreating tables (which loses data), Alembic applies incremental changes — adding columns, creating tables, etc.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Key Alembic commands: <code>alembic init alembic</code> (initialize), <code>alembic revision --autogenerate -m "message"</code> (generate migration), <code>alembic upgrade head</code> (apply migration). Always version-control your migration scripts!</p>
        `,
        `from fastapi import FastAPI, Depends, HTTPException\nfrom sqlalchemy import create_engine, Column, Integer, String, ForeignKey\nfrom sqlalchemy.orm import declarative_base, Session, sessionmaker, relationship\n\nDATABASE_URL = "sqlite:///./blog.db"\nengine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})\nSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)\nBase = declarative_base()\n\nclass User(Base):\n    __tablename__ = "users"\n    id = Column(Integer, primary_key=True, index=True)\n    name = Column(String)\n    posts = relationship("Post", back_populates="author")\n\nclass Post(Base):\n    __tablename__ = "posts"\n    id = Column(Integer, primary_key=True, index=True)\n    title = Column(String)\n    content = Column(String)\n    author_id = Column(Integer, ForeignKey("users.id"))\n    author = relationship("User", back_populates="posts")\n\nBase.metadata.create_all(bind=engine)\n\napp = FastAPI()\n\ndef get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()\n\n@app.get("/users/{user_id}/posts")\ndef get_user_posts(user_id: int, db: Session = Depends(get_db)):\n    user = db.query(User).filter(User.id == user_id).first()\n    if not user:\n        raise HTTPException(404, "User not found")\n    return {"user": user.name, "posts": [{"title": p.title, "content": p.content} for p in user.posts]}`
      ),
    ],
    quiz: [
      {
        id: 'q-sqla-1',
        question: 'What is SQLAlchemy primarily used for in Python?',
        options: ['Web framework', 'Object-Relational Mapping (ORM)', 'Testing', 'Authentication'],
        correct: 1,
      },
      {
        id: 'q-sqla-2',
        question: 'What should you always call after db.add() to persist changes to the database?',
        options: ['db.flush()', 'db.save()', 'db.commit()', 'db.close()'],
        correct: 2,
      },
      {
        id: 'q-sqla-3',
        question: 'Which tool is used for managing database schema migrations with SQLAlchemy?',
        options: ['Django Migrations', 'Alembic', 'Flyway', 'Liquibase'],
        correct: 1,
      },
    ],
  },

  // ─── MODULE 10: Testing with Pytest ───
  {
    id: 'testing-pytest',
    title: 'Testing (Pytest)',
    lessons: [
      createLesson(
        'test-1',
        'Introduction to Pytest',
        [
          'Set up pytest for a FastAPI project',
          'Write basic test functions with assertions',
          'Organize tests into meaningful test files and classes',
        ],
        [
          'Pytest is the most popular testing framework for Python',
          'Write test functions with simple assert statements',
          'Use test file and class naming conventions for automatic discovery',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Getting Started with Pytest</h3>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Pytest</strong> is a mature, feature-rich testing framework for Python. It makes writing tests simple — just create functions starting with <code>test_</code> in files starting with <code>test_</code>, use plain <code>assert</code> statements, and run <code>pytest</code> from the command line.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Pytest automatically discovers tests by looking for files named <code>test_*.py</code> or <code>*_test.py</code> and functions/classes named <code>test*</code>. No test runner configuration needed!</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Key features include: detailed assertion introspection (shows why an assert failed), fixtures for test setup/teardown, parametrization for testing multiple inputs, and a rich plugin ecosystem.</p>
        <div class="bg-green-50 border-l-4 border-[#059669] p-4 my-6 rounded-r-lg">
          <p class="text-green-800 font-medium"><i class="fa-solid fa-rocket mr-1"></i> Pro Tip: Run pytest -v for verbose output and pytest --tb=short for shorter tracebacks.</p>
        </div>
        `,
        `# test_math.py — save this file and run: pytest test_math.py -v\n\ndef test_addition():\n    result = 2 + 2\n    assert result == 4\n\ndef test_string_upper():\n    assert "hello".upper() == "HELLO"\n\ndef test_list_contains():\n    fruits = ["apple", "banana", "cherry"]\n    assert "banana" in fruits\n    assert "grape" not in fruits\n\ndef test_dictionary():\n    user = {"name": "Alice", "age": 30}\n    assert user["name"] == "Alice"\n    assert "email" not in user`
      ),
      createLesson(
        'test-2',
        'Testing FastAPI Endpoints with TestClient',
        [
          'Use TestClient from FastAPI to test HTTP endpoints',
          'Write tests for GET, POST, PUT, DELETE endpoints',
          'Test validation errors and error handling',
        ],
        [
          'TestClient provides a convenient way to test FastAPI endpoints without running a server',
          'Use the TestClient context manager for proper startup/shutdown',
          'Test both success responses and error cases for full coverage',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Testing FastAPI with TestClient</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">FastAPI provides <code>TestClient</code> (built on top of Starlette's test client and HTTPX) that lets you make test requests directly to your application without running a server. No need for Docker, no need to manage a test database — just instantiate the client and call methods.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Write tests that cover all your endpoints: verify HTTP status codes, check response payloads, and test edge cases like missing fields, invalid data, and not-found scenarios. Aim for at least <strong>80% code coverage</strong> for critical endpoints.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Use <code>client.get()</code>, <code>client.post()</code>, <code>client.put()</code>, <code>client.delete()</code> to simulate HTTP requests. Pass JSON data with the <code>json=</code> parameter and headers with the <code>headers=</code> parameter.</p>
        `,
        `# test_api.py — requires: pip install pytest httpx\nfrom fastapi import FastAPI\nfrom fastapi.testclient import TestClient\n\napp = FastAPI()\n\nitems_db = {}\n\n@app.get("/items/{item_id}")\ndef read_item(item_id: int):\n    if item_id not in items_db:\n        from fastapi import HTTPException\n        raise HTTPException(404, "Item not found")\n    return items_db[item_id]\n\n@app.post("/items")\ndef create_item(name: str, price: float):\n    item_id = len(items_db) + 1\n    items_db[item_id] = {"id": item_id, "name": name, "price": price}\n    return items_db[item_id]\n\nclient = TestClient(app)\n\ndef test_create_and_read_item():\n    response = client.post("/items?name=Widget&price=9.99")\n    assert response.status_code == 200\n    data = response.json()\n    assert data["name"] == "Widget"\n    assert data["price"] == 9.99\n    item_id = data["id"]\n\n    response = client.get(f"/items/{item_id}")\n    assert response.status_code == 200\n    assert response.json()["name"] == "Widget"\n\ndef test_read_nonexistent_item():\n    response = client.get("/items/999")\n    assert response.status_code == 404\n    assert response.json()["detail"] == "Item not found"`
      ),
      createLesson(
        'test-3',
        'Fixtures, Mocks & Advanced Testing',
        [
          'Create and use pytest fixtures for reusable test setup',
          'Use unittest.mock to mock external dependencies',
          'Implement parametrized tests for multiple scenarios',
        ],
        [
          'Fixtures provide reusable setup/teardown logic for tests',
          'Mock external services (databases, APIs) to keep tests fast and isolated',
          'Parametrized tests run the same test logic with different inputs',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Advanced Testing Patterns</h3>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Fixtures</strong> are functions decorated with <code>@pytest.fixture</code> that provide setup/teardown for tests. They can return values (like a database session) and use <code>yield</code> for cleanup. Fixtures can request other fixtures — creating a dependency graph.</p>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Mocking</strong> replaces real objects with fake ones during testing. Use <code>unittest.mock.patch</code> to replace external services (like payment gateways, email APIs, or databases) so your tests run quickly and don't depend on external systems.</p>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Parametrized tests</strong> (<code>@pytest.mark.parametrize</code>) let you run the same test function with different inputs. This is perfect for testing edge cases, boundary values, and error conditions without writing separate test functions for each case.</p>
        `,
        `# test_advanced.py\nimport pytest\nfrom unittest.mock import patch\nfrom fastapi import FastAPI, HTTPException\nfrom fastapi.testclient import TestClient\n\napp = FastAPI()\n\n# Service that calls an external API\ndef get_weather(city: str):\n    import requests\n    response = requests.get(f"https://api.weather.com/{city}")\n    return response.json()\n\n@app.get("/weather/{city}")\ndef weather(city: str):\n    data = get_weather(city)\n    return {"city": city, "temp": data.get("temp", 0)}\n\nclient = TestClient(app)\n\n# Fixture for common test data\n@pytest.fixture\ndef sample_cities():\n    return ["London", "Tokyo", "Paris"]\n\ndef test_sample_cities(sample_cities):\n    assert len(sample_cities) == 3\n    assert "Paris" in sample_cities\n\n# Mock the external API call\n@patch("test_advanced.get_weather")\ndef test_weather_with_mock(mock_get_weather):\n    mock_get_weather.return_value = {"temp": 22, "condition": "sunny"}\n    response = client.get("/weather/London")\n    assert response.status_code == 200\n    assert response.json()["temp"] == 22\n\n# Parametrized test\n@pytest.mark.parametrize("city,expected_temp", [\n    ("London", 15),\n    ("Tokyo", 22),\n    ("Paris", 18),\n])\n@patch(\"test_advanced.get_weather\")\ndef test_multiple_cities(mock_get_weather, city, expected_temp):\n    mock_get_weather.return_value = {"temp": expected_temp}\n    response = client.get(f"/weather/{city}")\n    assert response.json()["temp"] == expected_temp`
      ),
    ],
    quiz: [
      {
        id: 'q-test-1',
        question: 'Which class from FastAPI is used for testing HTTP endpoints without running a server?',
        options: ['TestServer', 'TestClient', 'MockClient', 'APITest'],
        correct: 1,
      },
      {
        id: 'q-test-2',
        question: 'What naming convention does pytest use for automatic test discovery?',
        options: ['Functions must start with "test_"', 'Functions must be in a Test class', 'Functions must end with "_test"', 'Functions must have @test decorator'],
        correct: 0,
      },
      {
        id: 'q-test-3',
        question: 'Which pytest feature allows running the same test with multiple different inputs?',
        options: ['@pytest.mark.parametrize', '@pytest.fixture', '@pytest.skip', 'pytest.wraps'],
        correct: 0,
      },
    ],
  },

  // ─── MODULE 11: Deployment (Docker/Gunicorn) ───
  {
    id: 'deployment',
    title: 'Deployment (Docker/Gunicorn)',
    lessons: [
      createLesson(
        'deploy-1',
        'Production Setup with Gunicorn & Uvicorn',
        [
          'Understand the difference between development and production servers',
          'Configure Gunicorn with Uvicorn workers for production',
          'Set up environment variables and configuration',
        ],
        [
          'Use Gunicorn as a process manager with Uvicorn workers in production',
          'Set workers count to 2-4 * CPU cores for optimal performance',
          'Always use environment variables for configuration, never hardcode secrets',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Serving FastAPI in Production</h3>
        <p class="mb-4 text-gray-700 leading-relaxed">In development, <code>uvicorn main:app --reload</code> works fine — but it's not suitable for production. For production, use <strong>Gunicorn</strong> as a process manager with <strong>Uvicorn workers</strong>. Gunicorn handles worker management, restarting crashed workers, and signal handling.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">A good starting configuration: <code>gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app</code> (4 workers). Adjust the worker count based on your CPU cores. Each worker is an independent process that can handle multiple concurrent requests via async I/O.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Use environment variables (<code>python-dotenv</code> or <code>pydantic-settings</code>) for all configuration: database URLs, secret keys, API keys. Never hardcode these! Pydantic's <code>BaseSettings</code> is the recommended way to manage settings in FastAPI projects.</p>
        `,
        `# main.py\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\nasync def root():\n    return {"message": "Hello Production!"}\n\n# ─── Run in production ───\n# pip install gunicorn uvicorn\n# gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000\n\n# ─── Environment Configuration with Pydantic ───\n# from pydantic import BaseSettings\n#\n# class Settings(BaseSettings):\n#     database_url: str = "sqlite:///./dev.db"\n#     secret_key: str = "change-me"\n#     debug: bool = False\n#\n#     class Config:\n#         env_file = ".env"\n#\n# settings = Settings()`
      ),
      createLesson(
        'deploy-2',
        'Dockerizing Your FastAPI Application',
        [
          'Write a Dockerfile for a FastAPI application',
          'Use multi-stage builds for smaller images',
          'Configure Docker Compose for multi-service setups',
        ],
        [
          'Use a multi-stage Docker build to create small, secure production images',
          'Docker Compose simplifies running FastAPI + database + cache together',
          'Always pin base image versions for reproducible builds',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">Docker for FastAPI</h3>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Docker</strong> packages your application and all its dependencies into a single <strong>container image</strong>. This ensures your app runs the same way on your laptop, your CI server, and your production server. No more \"it works on my machine!\"</p>
        <p class="mb-4 text-gray-700 leading-relaxed">A good Dockerfile for FastAPI uses <strong>multi-stage builds</strong>: the first stage installs all dependencies (including build tools), and the second stage copies only the necessary files. This keeps the final image small and secure.</p>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>Docker Compose</strong> lets you define and run multi-container applications. Your FastAPI app + PostgreSQL database + Redis cache can all be started with a single <code>docker-compose up</code> command.</p>
        `,
        `# Dockerfile\n# Stage 1: Install dependencies\nFROM python:3.11-slim as builder\n\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir --user -r requirements.txt\n\n# Stage 2: Runtime image\nFROM python:3.11-slim\n\nWORKDIR /app\n\n# Create non-root user\nRUN addgroup --system app && adduser --system --group app\n\nCOPY --from=builder /root/.local /home/app/.local\nCOPY ./app ./app\n\nENV PATH=/home/app/.local/bin:$PATH\nUSER app\n\nEXPOSE 8000\n\nCMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]\n\n# ─── docker-compose.yml ───\n# version: "3.9"\n# services:\n#   app:\n#     build: .\n#     ports:\n#       - "8000:8000"\n#     environment:\n#       - DATABASE_URL=postgresql://user:pass@db:5432/mydb\n#     depends_on:\n#       - db\n#   db:\n#     image: postgres:15\n#     environment:\n#       POSTGRES_USER: user\n#       POSTGRES_PASSWORD: pass\n#       POSTGRES_DB: mydb`
      ),
      createLesson(
        'deploy-3',
        'CI/CD Pipelines & Deployment Platforms',
        [
          'Set up a CI/CD pipeline with GitHub Actions',
          'Deploy FastAPI to cloud platforms (Railway, Render, Fly.io)',
          'Implement health checks, monitoring, and logging',
        ],
        [
          'CI/CD pipelines automatically test and deploy your code on every push',
          'Use platform-specific configuration for easy deployment',
          'Implement health checks for container orchestration and monitoring',
        ],
        `
        <h3 class="text-2xl font-bold mb-4 text-gray-900">CI/CD & Cloud Deployment</h3>
        <p class="mb-4 text-gray-700 leading-relaxed"><strong>CI/CD (Continuous Integration / Continuous Deployment)</strong> automatically runs tests and deploys your application when you push code. A typical pipeline: push code → run tests → build Docker image → deploy to cloud.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Popular platforms for deploying FastAPI include <strong>Railway</strong> (simple, free tier), <strong>Render</strong> (supports Docker), <strong>Fly.io</strong> (global edge deployment), and <strong>AWS/GCP/Azure</strong> (enterprise). Most support deploying from a Git repository directly.</p>
        <p class="mb-4 text-gray-700 leading-relaxed">Always implement a <strong>health check</strong> endpoint (<code>GET /health</code>) that returns 200 when your app is healthy. Container orchestrators and cloud platforms use this to know if your app is running correctly. Add <strong>structured logging</strong> (JSON format) for easy log analysis.</p>
        `,
        `# main.py — Health check endpoint\nfrom fastapi import FastAPI\nfrom pydantic import BaseSettings\nimport logging\nimport json\n\nclass Settings(BaseSettings):\n    app_name: str = "FastAPI App"\n    version: str = "1.0.0"\n\n    class Config:\n        env_file = ".env"\n\nsettings = Settings()\n\napp = FastAPI(title=settings.app_name, version=settings.version)\n\n# Structured JSON logging\nlogging.basicConfig(\n    level=logging.INFO,\n    format='{"time": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',\n)\nlogger = logging.getLogger(__name__)\n\n@app.get("/health")\nasync def health_check():\n    return {\n        "status": "healthy",\n        "version": settings.version,\n        "app": settings.app_name,\n    }\n\n@app.get("/")\nasync def root():\n    logger.info("Root endpoint called")\n    return {"message": f"Welcome to {settings.app_name}!"}\n\n# ─── .github/workflows/deploy.yml ───\n# name: Deploy\n# on:\n#   push:\n#     branches: [main]\n# jobs:\n#   test:\n#     runs-on: ubuntu-latest\n#     steps:\n#       - uses: actions/checkout@v3\n#       - uses: actions/setup-python@v4\n#         with:\n#           python-version: "3.11"\n#       - run: pip install -r requirements.txt\n#       - run: pytest\n#   deploy:\n#     needs: test\n#     runs-on: ubuntu-latest\n#     steps:\n#       - uses: actions/checkout@v3\n#       - name: Deploy to Railway\n#         run: npx railway up --service my-fastapi-app`
      ),
    ],
    quiz: [
      {
        id: 'q-deploy-1',
        question: 'What is the recommended production server setup for FastAPI?',
        options: ['uvicorn --reload directly', 'Gunicorn with Uvicorn workers', 'Python manage.py runserver', 'Apache with mod_wsgi'],
        correct: 1,
      },
      {
        id: 'q-deploy-2',
        question: 'What is the primary benefit of using multi-stage Docker builds?',
        options: ['Faster builds', 'Smaller final images', 'Better security scanning', 'More features'],
        correct: 1,
      },
      {
        id: 'q-deploy-3',
        question: 'What should a health check endpoint return?',
        options: ['An HTML page', 'A 200 OK status', 'A 301 redirect', 'A 500 error for testing'],
        correct: 1,
      },
    ],
  },
];

// ─── Helper: get ELI5 explanation for a lesson ───
function getEli5Explanation(lessonId) {
  return (window.eli5FastapiData && window.eli5FastapiData[lessonId]) || '';
}

// --- State & Progress ---
let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson',
  completedItems: [],
  quizAnswers: {},
};

// Load state from local storage
function loadProgress() {
  try {
    const saved = localStorage.getItem('fastapiHubProgress');
    if (saved) {
      state.completedItems = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
}

// Save state to local storage and update UI
function saveProgress() {
  try {
    localStorage.setItem('fastapiHubProgress', JSON.stringify(state.completedItems));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
  updateProgressBar();
  renderSidebar();
}

function markItemComplete(id) {
  if (!state.completedItems.includes(id)) {
    state.completedItems.push(id);
    saveProgress();
  }
}

function updateProgressBar() {
  let totalItems = 0;
  curriculum.forEach((mod) => {
    totalItems += mod.lessons.length;
    if (mod.quiz && mod.quiz.length > 0) totalItems += 1;
  });

  if (totalItems === 0) return;
  const progressPercent = Math.round((state.completedItems.length / totalItems) * 100);

  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if (bar) bar.style.width = `${progressPercent}%`;
  if (text) text.innerText = `${progressPercent}%`;
}

// --- DOM Elements ---
const DOM = {};

function cacheDom() {
  DOM.sidebarOverlay = document.getElementById('sidebar-overlay');
  DOM.sidebar = document.getElementById('sidebar');
  DOM.openSidebarBtn = document.getElementById('open-sidebar');
  DOM.closeSidebarBtn = document.getElementById('close-sidebar');
  DOM.moduleList = document.getElementById('module-list');
  DOM.activeModuleTitle = document.getElementById('active-module-title');
  DOM.tabBtns = document.querySelectorAll('.tab-btn');
  DOM.tabContents = document.querySelectorAll('.tab-content');
  DOM.tabLesson = document.getElementById('tab-lesson');
  DOM.tabSimulator = document.getElementById('tab-simulator');
  DOM.tabQuiz = document.getElementById('tab-quiz');
  DOM.codeEditor = document.getElementById('code-editor');
  DOM.runServerBtn = document.getElementById('run-server-btn');
  DOM.swaggerEndpoints = document.getElementById('swagger-endpoints');
}

// --- Initialization ---
function init() {
  cacheDom();
  loadProgress();
  updateProgressBar();
  setupEventListeners();
  renderSidebar();
  renderActiveState();
}

function setupEventListeners() {
  if (!DOM.openSidebarBtn || !DOM.closeSidebarBtn || !DOM.sidebarOverlay) return;

  // Sidebar toggles
  DOM.openSidebarBtn.addEventListener('click', () => {
    DOM.sidebar.classList.remove('-translate-x-full');
    DOM.sidebarOverlay.classList.remove('hidden');
  });

  const closeSidebar = () => {
    DOM.sidebar.classList.add('-translate-x-full');
    DOM.sidebarOverlay.classList.add('hidden');
  };

  DOM.closeSidebarBtn.addEventListener('click', closeSidebar);
  DOM.sidebarOverlay.addEventListener('click', closeSidebar);

  // Tabs
  DOM.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Simulator Controls
  if (DOM.runServerBtn) {
    DOM.runServerBtn.addEventListener('click', runSimulation);
  }

  // Swagger UI delegation
  if (DOM.swaggerEndpoints) {
    DOM.swaggerEndpoints.addEventListener('click', (e) => {
      const toggleHeader = e.target.closest('[data-action="toggle-swagger"]');
      if (toggleHeader) {
        toggleSwaggerBlock(toggleHeader.dataset.routeId);
        return;
      }

      const enableBtn = e.target.closest('[data-action="enable-execute"]');
      if (enableBtn) {
        enableExecute(enableBtn.dataset.routeId);
        return;
      }

      const execBtn = e.target.closest('[data-action="execute-swagger"]');
      if (execBtn) {
        executeSwaggerRoute(
          execBtn.dataset.routeMethod,
          execBtn.dataset.routePath,
          execBtn.dataset.routeId
        );
      }
    });
  }

  // Editor formatting (Python uses 4 spaces)
  if (DOM.codeEditor) {
    DOM.codeEditor.addEventListener('keydown', function (e) {
      if (e.key == 'Tab') {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
      }
    });
  }
}

function switchTab(tabId) {
  state.activeTab = tabId;

  DOM.tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  DOM.tabContents.forEach((content) => {
    content.classList.remove('active', 'flex', 'lg:flex');
  });

  const activeContent = document.getElementById(`tab-${tabId}`);
  if (!activeContent) return;

  if (tabId === 'simulator') {
    activeContent.classList.add('active', 'flex', 'lg:flex-row');
    // Auto-run if swagger is empty
    if (DOM.swaggerEndpoints && DOM.swaggerEndpoints.innerHTML.includes('Click "Refresh Docs"')) {
      runSimulation();
    }
  } else {
    activeContent.classList.add('active');
  }
}

function getActiveModule() {
  return curriculum.find((m) => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
  const mod = getActiveModule();
  return mod.lessons.find((l) => l.id === state.activeLessonId) || mod.lessons[0];
}

function changeModule(moduleId) {
  const mod = curriculum.find((m) => m.id === moduleId);
  if (!mod) return;

  state.activeModuleId = moduleId;
  state.activeLessonId = mod.lessons[0].id;

  renderSidebar();
  renderActiveState();
  if (window.innerWidth < 1024) {
    if (DOM.sidebar) DOM.sidebar.classList.add('-translate-x-full');
    if (DOM.sidebarOverlay) DOM.sidebarOverlay.classList.add('hidden');
  }

  // Reset Swagger UI prompt
  if (DOM.swaggerEndpoints) {
    DOM.swaggerEndpoints.innerHTML = `
      <div class="text-center text-gray-500 mt-10">
        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
        <p>Click "Refresh Docs" to parse your Python code.</p>
      </div>
    `;
  }
}

// --- Rendering Functions ---

function renderSidebar() {
  if (!DOM.moduleList) return;
  DOM.moduleList.innerHTML = '';

  curriculum.forEach((mod) => {
    const isActive = mod.id === state.activeModuleId;

    const allLessonsDone = mod.lessons.every((l) => state.completedItems.includes(l.id));
    const quizDone =
      mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
    const isModuleComplete = allLessonsDone && quizDone;

    const li = document.createElement('li');

    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
      isActive
        ? 'bg-green-100 text-green-900 font-semibold border-l-4 border-[#059669]'
        : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'
    }`;
    btn.onclick = () => changeModule(mod.id);

    const textSpan = document.createElement('span');
    textSpan.className = 'truncate block';
    textSpan.innerText = mod.title;

    btn.appendChild(textSpan);

    if (isModuleComplete) {
      const checkIcon = document.createElement('i');
      checkIcon.className = 'fa-solid fa-check-circle text-[#059669]';
      btn.appendChild(checkIcon);
    }

    li.appendChild(btn);
    DOM.moduleList.appendChild(li);
  });
}

function renderActiveState() {
  const mod = getActiveModule();
  const lesson = getActiveLesson();

  if (DOM.activeModuleTitle) {
    DOM.activeModuleTitle.innerText = mod.title;
  }

  renderLesson(lesson);
  renderQuiz(mod);

  if (DOM.codeEditor) {
    DOM.codeEditor.value = lesson.defaultCode;
  }
}

function renderLesson(lesson) {
  if (!DOM.tabLesson) return;

  const isCompleted = state.completedItems.includes(lesson.id);

  // Look up ELI5 simple explanation for this lesson
  const simpleHtml = getEli5Explanation(lesson.id);

  DOM.tabLesson.innerHTML = `
    <div class="max-w-3xl mx-auto animate-fade-in">
      <h2 class="text-3xl font-bold text-gray-900 mb-6">${lesson.title}</h2>
      <div class="prose max-w-none text-gray-800">
        ${
          window.eli5Toggle
            ? window.eli5Toggle.wrapContent(lesson.content, simpleHtml)
            : lesson.content
        }
      </div>

      <div class="mt-12 pt-6 border-t border-gray-200 flex justify-end">
        <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
          isCompleted
            ? 'bg-green-100 text-green-800 cursor-default'
            : 'bg-[#059669] text-white hover:bg-green-700 shadow-md'
        }">
          ${
            isCompleted
              ? '<i class="fa-solid fa-check"></i> Completed'
              : 'Mark as Complete &amp; Continue'
          }
        </button>
      </div>
    </div>
  `;

  // ELI5 toggle
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('fastapi', DOM.tabLesson);
  }

  // Copy code buttons
  if (window.copyCode) {
    try {
      window.copyCode.init(DOM.tabLesson);
    } catch (e) {
      // copyCode may not have an init method
    }
  }

  const btn = document.getElementById('mark-lesson-complete');
  if (btn && !isCompleted) {
    btn.addEventListener('click', () => {
      markItemComplete(lesson.id);
      renderLesson(lesson);
      switchTab('simulator');
    });
  }
}

function renderQuiz(mod) {
  if (!DOM.tabQuiz) return;

  const quizId = `${mod.id}-quiz`;
  const isCompleted = state.completedItems.includes(quizId);

  if (!mod.quiz || mod.quiz.length === 0) {
    DOM.tabQuiz.innerHTML =
      '<div class="text-center text-gray-500 mt-10">No quiz available for this module.</div>';
    return;
  }

  let html = `
    <div class="max-w-3xl mx-auto animate-fade-in pb-12">
      <div class="mb-8 border-b pb-4">
        <h2 class="text-3xl font-bold text-gray-900">Module Quiz</h2>
        <p class="text-gray-500 mt-1">Answer all questions to pass the module.</p>
        ${isCompleted ? '<span class="inline-block mt-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
      </div>
      <div id="quiz-questions-container" class="space-y-8">
  `;

  mod.quiz.forEach((q, index) => {
    html += `
      <div class="bg-white border rounded-xl p-6 shadow-sm">
        <h4 class="font-semibold text-lg text-gray-800 mb-4">
          <span class="text-[#059669] mr-2">${index + 1}.</span>${q.question}
        </h4>
        <div class="space-y-3">
    `;

    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;
      html += `
        <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
          isSelected ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50 border-gray-200'
        }">
          <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-green-600 h-5 w-5" ${
            isSelected ? 'checked' : ''
          } onchange="handleQuizSelection('${q.id}', ${optIdx})">
          <span class="ml-3 text-gray-700">${opt}</span>
        </label>
      `;
    });

    html += `</div></div>`;
  });

  html += `
      </div>
      <div class="mt-8 flex flex-col items-center border-t pt-8">
        <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-[#059669] hover:bg-green-700 shadow-md transition-all">Submit Answers</button>
        <div id="quiz-feedback" class="mt-4 text-lg font-bold hidden"></div>
      </div>
    </div>
  `;

  DOM.tabQuiz.innerHTML = html;

  const submitBtn = document.getElementById('submit-quiz-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      let score = 0;
      let allAnswered = true;

      mod.quiz.forEach((q) => {
        if (state.quizAnswers[q.id] === undefined) {
          allAnswered = false;
        } else if (state.quizAnswers[q.id] === q.correct) {
          score++;
        }
      });

      const feedback = document.getElementById('quiz-feedback');
      if (!feedback) return;

      feedback.classList.remove('hidden', 'text-red-600', 'text-green-600');

      if (!allAnswered) {
        feedback.innerText = 'Please answer all questions.';
        feedback.classList.add('text-red-600');
        return;
      }

      if (score === mod.quiz.length) {
        feedback.innerHTML = '<i class="fa-solid fa-party-horn"></i> Perfect! You passed.';
        feedback.classList.add('text-green-600');
        markItemComplete(quizId);
        renderSidebar();
      } else {
        feedback.innerText = `You scored ${score} out of ${mod.quiz.length}. Try again!`;
        feedback.classList.add('text-red-600');
      }
    });
  }
}

window.handleQuizSelection = function (questionId, optionIndex) {
  state.quizAnswers[questionId] = optionIndex;
  renderQuiz(getActiveModule());
};

// --- FastAPI Swagger Simulator Engine ---

// Hardcoded fake responses based on typical routes in the lessons
const fakeResponses = {
  'GET_/': { Hello: 'World' },
  'GET_/items': [
    { id: 1, name: 'Portal Gun' },
    { id: 2, name: 'Plumbus' },
  ],
  'GET_/items/1': { id: 1, name: 'Sample Item', description: 'A very nice item', price: 9.99 },
  'POST_/items': {
    id: 1,
    name: 'New Item',
    description: 'A very nice item',
    price: 10.5,
    tax: 1.5,
    price_with_tax: 12.0,
  },
  'DELETE_/items/1': { message: 'Item deleted' },
  'GET_/users/{user_id}': { user_id: 42, query_string: 'test' },
  'GET_/users/1': { user_id: 1, name: 'Alice' },
  'GET_/health': { status: 'ok', version: '2.0.0' },
  'GET_/users': [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  'GET_/products': { sort_by: 'name', price_range: [0, 100], search: null },
  'POST_/register': { message: 'User test registered! Welcome email incoming.' },
  'POST_/token': { access_token: 'sample_token', token_type: 'bearer' },
  'GET_/users/me': { username: 'alice' },
  'GET_/secure': { message: 'Welcome!', user: { username: 'alice' } },
  'GET_/admin': { message: 'Welcome admin!', user: { username: 'admin', role: 'admin' } },
  'GET_/dashboard': { message: 'Dashboard access granted', role: 'user' },
  'GET_/data': { data: ['sample'], pagination: { skip: 0, limit: 25 }, db_status: 'open' },
  'POST_/data': { message: 'POST request received with CORS' },
};

function runSimulation() {
  if (!DOM.codeEditor || !DOM.swaggerEndpoints) return;

  const code = DOM.codeEditor.value;

  // Parse FastAPI route decorators
  const regex = /@app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]\)/g;

  let match;
  const routes = [];

  while ((match = regex.exec(code)) !== null) {
    routes.push({
      method: match[1].toLowerCase(),
      path: match[2],
      id: 'route-' + Math.random().toString(36).substr(2, 9),
    });
  }

  DOM.swaggerEndpoints.innerHTML = '';

  if (routes.length === 0) {
    DOM.swaggerEndpoints.innerHTML = `
      <div class="text-center text-red-500 mt-10 font-medium">
        No FastAPI routes found in the code. Ensure you have decorators like <code>@app.get("/")</code>.
      </div>
    `;
    return;
  }

  routes.forEach((route) => {
    const block = document.createElement('div');
    block.className = `swagger-block ${route.method}`;

    block.innerHTML = `
      <div class="swagger-header" data-route-id="${route.id}" data-action="toggle-swagger">
        <span class="swagger-method">${route.method.toUpperCase()}</span>
        <span class="swagger-path">${route.path}</span>
      </div>
      <div class="swagger-body" id="${route.id}-body">
        <button class="swagger-btn-try" data-route-id="${route.id}" data-action="enable-execute">Try it out</button>
        <div style="clear:both;"></div>

        <div id="${route.id}-execute-container" style="display:none;">
          <button class="swagger-btn-execute" data-route-method="${route.method}" data-route-path="${route.path}" data-route-id="${route.id}" data-action="execute-swagger">Execute</button>
        </div>

        <div class="swagger-response-area" id="${route.id}-response">
          <h4>Server response</h4>
          <div class="swagger-json-box" id="${route.id}-json"></div>
        </div>
      </div>
    `;

    DOM.swaggerEndpoints.appendChild(block);
  });
}

// Global functions for simulator event handlers
window.toggleSwaggerBlock = function (routeId) {
  const block = document.getElementById(`${routeId}-body`);
  if (block) {
    block.parentElement.classList.toggle('open');
  }
};

window.enableExecute = function (routeId) {
  const execContainer = document.getElementById(`${routeId}-execute-container`);
  if (execContainer) {
    execContainer.style.display = 'block';
  }
};

window.executeSwaggerRoute = function (method, path, routeId) {
  const responseArea = document.getElementById(`${routeId}-response`);
  const jsonBox = document.getElementById(`${routeId}-json`);

  if (!responseArea || !jsonBox) return;

  jsonBox.innerText = 'Loading...';
  responseArea.style.display = 'block';

  setTimeout(() => {
    const key = `${method.toUpperCase()}_${path}`;
    let responseData = fakeResponses[key];

    if (!responseData) {
      responseData = { message: 'Success! (Mock Response)' };
    }

    jsonBox.innerText = JSON.stringify(responseData, null, 2);
  }, 400);
};

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
