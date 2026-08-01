<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Learn PHP – Server-Side Scripting | Algo Infinity Verse</title>
    <meta name="description" content="Free interactive PHP tutorial covering syntax, variables, operators, conditionals, loops, functions, arrays, forms, superglobals, sessions, and cookies." />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="php-learning.css" />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <script>
      (function() {
        try {
          var t = localStorage.getItem('theme');
          var p = window.matchMedia('(prefers-color-scheme: light)').matches;
          var theme = t || (p ? 'light' : 'dark');
          if (theme === 'light') document.documentElement.classList.add('light-mode');
        } catch (e) {}
      })();
    </script>
  </head>
  <body data-page="php-learning" data-no-loading>
    <div id="loading-screen" class="hidden">
      <div class="loader">
        <div class="infinity-loader">&#x221E;</div>
        <h2>Loading PHP Learning...</h2>
      </div>
    </div>

    <main>
      <!-- HERO -->
      <section class="pp-hero">
        <div class="pp-hero-bg"><div class="pp-hero-glow"></div></div>
        <a href="/pages/learning/languages.html" class="pp-back-btn" aria-label="Go back to languages">
          <i class="fas fa-arrow-left"></i><span>Languages</span>
        </a>
        <div class="pp-hero-content">
          <div class="pp-tag" aria-hidden="true">
            <span class="pp-tag-open">&lt;?<span class="pp-tag-php">php</span></span>
          </div>
          <h1 class="pp-hero-title">
            <span class="pp-title-line">Learn PHP</span>
            <span class="pp-title-line">Server-Side Scripting</span>
          </h1>
          <p class="pp-hero-subtitle">
            Master the language that powers over 75% of the web. From variables to sessions &mdash; <strong>13 interactive lessons</strong> to build dynamic web apps.
          </p>
          <div class="pp-hero-stats">
            <div class="pp-stat"><span class="pp-stat-value">13</span><span class="pp-stat-label">Topics</span></div>
            <div class="pp-stat"><span class="pp-stat-value">45+</span><span class="pp-stat-label">Examples</span></div>
            <div class="pp-stat"><span class="pp-stat-value">13</span><span class="pp-stat-label">Exercises</span></div>
          </div>
          <div class="pp-hero-actions">
            <a href="#topic-introduction" class="pp-btn pp-btn-primary"><i class="fas fa-play"></i> Start Learning</a>
            <a href="/pages/editors/php-editor/php-editor.html" class="pp-btn pp-btn-secondary"><i class="fas fa-code"></i> Open Editor</a>
          </div>
        </div>
      </section>

      <!-- TOPIC NAV -->
      <section class="pp-section">
        <nav class="pp-topic-nav" aria-label="Lesson topics">
          <a href="#topic-introduction" class="pp-topic-pill active">Introduction</a>
          <a href="#topic-setup" class="pp-topic-pill">Setup &amp; Server</a>
          <a href="#topic-syntax" class="pp-topic-pill">Syntax Basics</a>
          <a href="#topic-variables" class="pp-topic-pill">Variables &amp; Types</a>
          <a href="#topic-operators" class="pp-topic-pill">Operators</a>
          <a href="#topic-io" class="pp-topic-pill">Input &amp; Output</a>
          <a href="#topic-conditionals" class="pp-topic-pill">Conditionals</a>
          <a href="#topic-loops" class="pp-topic-pill">Loops</a>
          <a href="#topic-functions" class="pp-topic-pill">Functions</a>
          <a href="#topic-arrays" class="pp-topic-pill">Arrays</a>
          <a href="#topic-forms" class="pp-topic-pill">Forms Handling</a>
          <a href="#topic-superglobals" class="pp-topic-pill">Superglobals</a>
          <a href="#topic-sessions" class="pp-topic-pill">Sessions &amp; Cookies</a>
        </nav>

        <div class="pp-progress" aria-hidden="true">
          <span class="pp-progress-dot active" data-topic="0"></span><span class="pp-progress-line" data-topic="0"></span>
          <span class="pp-progress-dot" data-topic="1"></span><span class="pp-progress-line" data-topic="1"></span>
          <span class="pp-progress-dot" data-topic="2"></span><span class="pp-progress-line" data-topic="2"></span>
          <span class="pp-progress-dot" data-topic="3"></span><span class="pp-progress-line" data-topic="3"></span>
          <span class="pp-progress-dot" data-topic="4"></span><span class="pp-progress-line" data-topic="4"></span>
          <span class="pp-progress-dot" data-topic="5"></span><span class="pp-progress-line" data-topic="5"></span>
          <span class="pp-progress-dot" data-topic="6"></span><span class="pp-progress-line" data-topic="6"></span>
          <span class="pp-progress-dot" data-topic="7"></span><span class="pp-progress-line" data-topic="7"></span>
          <span class="pp-progress-dot" data-topic="8"></span><span class="pp-progress-line" data-topic="8"></span>
          <span class="pp-progress-dot" data-topic="9"></span><span class="pp-progress-line" data-topic="9"></span>
          <span class="pp-progress-dot" data-topic="10"></span><span class="pp-progress-line" data-topic="10"></span>
          <span class="pp-progress-dot" data-topic="11"></span><span class="pp-progress-line" data-topic="11"></span>
          <span class="pp-progress-dot" data-topic="12"></span>
        </div>

        <!-- ========== LESSON 1 ========== -->
        <article class="pp-lesson" id="topic-introduction" data-topic="0">
          <div class="pp-lesson-header"><span class="pp-lesson-number">01</span><h3>Introduction to PHP</h3></div>
          <p><strong>PHP (Hypertext Preprocessor)</strong> is an open-source, widely-used server-side scripting language. Unlike frontend languages that run in the browser, PHP executes on the web server.</p>
          <p>When a user requests a page containing PHP, the server processes the code, generates HTML dynamically, and sends only the HTML back to the browser.</p>
          <div class="pp-concept">
            <h4>Why Learn PHP?</h4>
            <ul>
              <li><strong>Easy to Adopt:</strong> Logical syntax, friendly for beginners</li>
              <li><strong>Powers Most of the Web:</strong> Over 75% of websites with known backends use PHP</li>
              <li><strong>Database Integration:</strong> Native support for MySQL, PostgreSQL, SQLite</li>
              <li><strong>Strong Framework Ecosystem:</strong> Laravel, Symfony, WordPress</li>
            </ul>
          </div>
          <div class="pp-exercise" id="exercise-intro">
            <div class="pp-exercise-title">Practice: Introduction</div>
            <p>Which statement correctly describes how PHP processes a page request?</p>
            <ol>
              <li>The server sends PHP source code to the browser, which compiles and runs it</li>
              <li>The web server runs the PHP script, generates output, and returns that to the client</li>
              <li>PHP compiles CSS and JavaScript into binary objects on the client machine</li>
              <li>PHP is a database server that replaces SQL engines</li>
            </ol>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-intro">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-intro">
              <p><strong>Correct Answer: B</strong> — PHP is a server-side language. The server runs the script, builds the final HTML, and returns only that HTML to the client browser.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 2 ========== -->
        <article class="pp-lesson" id="topic-setup" data-topic="1">
          <div class="pp-lesson-header"><span class="pp-lesson-number">02</span><h3>PHP Setup &amp; Local Server</h3></div>
          <p>To run PHP locally, you need a server environment. One-click packages include Apache, PHP, and MySQL.</p>
          <div class="pp-concept">
            <h4>Popular Local Server Packages</h4>
            <ul>
              <li><strong>XAMPP</strong> &mdash; Cross-platform (Windows, macOS, Linux)</li>
              <li><strong>WAMP</strong> &mdash; Lightweight option for Windows</li>
              <li><strong>Laravel Valet</strong> &mdash; Optimized for macOS</li>
            </ul>
          </div>
          <h4>PHP Built-in Server</h4>
          <p>Start a dev server instantly from the terminal:</p>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">CLI</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code="php -S localhost:8000"><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">php</span> -S localhost:<span class="num">8000</span></code></pre>
          </div>
          <div class="pp-callout"><p>With XAMPP, place files in <code>htdocs</code>. On WAMP, use <code>www</code>. Visit <code>http://localhost/your-file.php</code> in your browser.</p></div>
          <div class="pp-exercise" id="exercise-setup">
            <div class="pp-exercise-title">Practice: Setup</div>
            <p>What folder must PHP project files be saved in when using XAMPP?</p>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-setup">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-setup">
              <p><strong>Answer: htdocs</strong> &mdash; Apache in XAMPP defaults its document root to the <code>htdocs</code> directory.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 3 ========== -->
        <article class="pp-lesson" id="topic-syntax" data-topic="2">
          <div class="pp-lesson-header"><span class="pp-lesson-number">03</span><h3>PHP Syntax Basics</h3></div>
          <p>PHP scripts are embedded in HTML using <code>&lt;?php</code> and <code>?&gt;</code> delimiters.</p>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
// Single-line comment
# Another single-line comment
/*
  Multi-line comment block
*/
echo "Hello from PHP!";
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="cmt">// Single-line comment</span>
<span class="cmt"># Another single-line comment</span>
<span class="cmt">/* Multi-line comment block */</span>
<span class="kw">echo</span> <span class="str">"Hello from PHP!"</span>;
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-concept">
            <h4>Core Syntax Rules</h4>
            <ul>
              <li>Every statement ends with a semicolon (<code>;</code>)</li>
              <li>Variable names are case-sensitive; keywords and functions are not</li>
            </ul>
          </div>
          <div class="pp-exercise" id="exercise-syntax">
            <div class="pp-exercise-title">Practice: Syntax</div>
            <p>Which of the following will result in a syntax error?</p>
            <ol>
              <li><code>echo "Hello";</code></li>
              <li><code>ECHO "Hello";</code></li>
              <li><code>$val = "A" $val2 = "B";</code></li>
              <li><code>// print "Hello";</code></li>
            </ol>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-syntax">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-syntax">
              <p><strong>Correct Answer: C</strong> &mdash; Missing semicolon between statements causes a parse error.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 4 ========== -->
        <article class="pp-lesson" id="topic-variables" data-topic="3">
          <div class="pp-lesson-header"><span class="pp-lesson-number">04</span><h3>Variables and Data Types</h3></div>
          <p>Variables start with <code>$</code>. PHP is loosely typed &mdash; you don't need to declare a type.</p>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
$name = "John Doe";     // String
$age = 30;              // Integer
$price = 19.99;         // Float
$isActive = true;       // Boolean
$fruits = ["Apple", "Banana"]; // Array
$empty = null;          // NULL
var_dump($name);
var_dump($price);
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="var">$name</span> = <span class="str">"John Doe"</span>;     <span class="cmt">// String</span>
<span class="var">$age</span> = <span class="num">30</span>;              <span class="cmt">// Integer</span>
<span class="var">$price</span> = <span class="num">19.99</span>;         <span class="cmt">// Float</span>
<span class="var">$isActive</span> = <span class="kw">true</span>;       <span class="cmt">// Boolean</span>
<span class="var">$fruits</span> = [<span class="str">"Apple"</span>, <span class="str">"Banana"</span>]; <span class="cmt">// Array</span>
<span class="var">$empty</span> = <span class="kw">null</span>;          <span class="cmt">// NULL</span>
<span class="fn">var_dump</span>(<span class="var">$name</span>);
<span class="fn">var_dump</span>(<span class="var">$price</span>);
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-concept">
            <h4>Naming Rules</h4>
            <ul>
              <li>Must start with a letter or underscore (<code>_</code>)</li>
              <li>Only alphanumeric characters and underscores allowed</li>
              <li>Case-sensitive: <code>$myVar</code> &ne; <code>$myvar</code></li>
            </ul>
          </div>
          <div class="pp-exercise" id="exercise-variables">
            <div class="pp-exercise-title">Practice: Variables</div>
            <p>Which is an invalid variable name?</p>
            <ol>
              <li><code>$_totalAmount</code></li>
              <li><code>$user_1</code></li>
              <li><code>$1stUser</code></li>
              <li><code>$userAge</code></li>
            </ol>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-variables">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-variables">
              <p><strong>Correct Answer: C</strong> &mdash; Variable names cannot start with numbers.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 5 ========== -->
        <article class="pp-lesson" id="topic-operators" data-topic="4">
          <div class="pp-lesson-header"><span class="pp-lesson-number">05</span><h3>Operators</h3></div>
          <p>Operators perform mathematical, logical, or string actions.</p>
          <div class="pp-table-wrap">
            <table class="pp-table" aria-label="PHP operators">
              <thead><tr><th scope="col">Category</th><th scope="col">Operators</th><th scope="col">Example</th></tr></thead>
              <tbody>
                <tr><td><strong>Arithmetic</strong></td><td><code>+ - * / % **</code></td><td><code>$a ** $b</code> (exponentiation)</td></tr>
                <tr><td><strong>Comparison</strong></td><td><code>== === != !== &gt; &lt;</code></td><td><code>===</code> strict equality</td></tr>
                <tr><td><strong>Logical</strong></td><td><code>&& || ! xor</code></td><td>Combine conditions</td></tr>
                <tr><td><strong>String</strong></td><td><code>. .=</code></td><td><code>.</code> concatenation</td></tr>
              </tbody>
            </table>
          </div>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
$greeting = "Hello ";
$name = "Alice";
echo $greeting . $name; // Concatenation
$x = 5;
$y = "5";
var_dump($x == $y);  // true
var_dump($x === $y); // false
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="var">$greeting</span> = <span class="str">"Hello "</span>;
<span class="var">$name</span> = <span class="str">"Alice"</span>;
<span class="kw">echo</span> <span class="var">$greeting</span> . <span class="var">$name</span>;
<span class="var">$x</span> = <span class="num">5</span>; <span class="var">$y</span> = <span class="str">"5"</span>;
<span class="fn">var_dump</span>(<span class="var">$x</span> == <span class="var">$y</span>);  <span class="cmt">// true</span>
<span class="fn">var_dump</span>(<span class="var">$x</span> === <span class="var">$y</span>); <span class="cmt">// false</span>
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-exercise" id="exercise-operators">
            <div class="pp-exercise-title">Practice: Operators</div>
            <p>If <code>$a = 10; $b = "10";</code>, what does <code>var_dump($a === $b);</code> output?</p>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-operators">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-operators">
              <p><strong>Answer: bool(false)</strong> &mdash; Strict comparison checks both value and type.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 6 ========== -->
        <article class="pp-lesson" id="topic-io" data-topic="5">
          <div class="pp-lesson-header"><span class="pp-lesson-number">06</span><h3>Input &amp; Output</h3></div>
          <p>PHP offers <code>echo</code>, <code>print</code>, and <code>var_dump()</code> for output.</p>
          <div class="pp-concept">
            <h4>Key Differences</h4>
            <ul>
              <li><strong>echo</strong> &mdash; Language construct, can take multiple arguments</li>
              <li><strong>print</strong> &mdash; Returns <code>1</code>, takes one argument</li>
              <li><strong>var_dump()</strong> &mdash; Debugging function showing types and lengths</li>
            </ul>
          </div>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
echo "Hello", " ", "World!";
$result = print("Welcome! ");
echo $result; // 1
$arr = [1, "PHP", false];
var_dump($arr);
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="kw">echo</span> <span class="str">"Hello"</span>, <span class="str">" "</span>, <span class="str">"World!"</span>;
<span class="var">$result</span> = <span class="fn">print</span>(<span class="str">"Welcome!"</span>);
<span class="kw">echo</span> <span class="var">$result</span>;
<span class="var">$arr</span> = [<span class="num">1</span>, <span class="str">"PHP"</span>, <span class="kw">false</span>];
<span class="fn">var_dump</span>(<span class="var">$arr</span>);
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-exercise" id="exercise-io">
            <div class="pp-exercise-title">Practice: I/O</div>
            <p>Which command is best to inspect an array's structure and data types?</p>
            <ol>
              <li>echo</li>
              <li>print</li>
              <li>var_dump()</li>
              <li>print_r() without types</li>
            </ol>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-io">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-io">
              <p><strong>Correct Answer: C</strong> &mdash; <code>var_dump()</code> shows types, lengths, and values.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 7 ========== -->
        <div class="pp-divider"><span class="pp-divider-inner">Next Topic</span></div>
        <article class="pp-lesson" id="topic-conditionals" data-topic="6">
          <div class="pp-lesson-header"><span class="pp-lesson-number">07</span><h3>Conditional Statements</h3></div>
          <p>PHP supports <code>if</code>, <code>else</code>, <code>elseif</code>, and <code>switch</code>.</p>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
$score = 82;
if ($score >= 90) { echo "Grade A"; }
elseif ($score >= 80) { echo "Grade B"; }
else { echo "Grade C"; }

$favColor = "red";
switch ($favColor) {
    case "blue": echo "Blue"; break;
    case "red": echo "Red"; break;
    default: echo "Unknown";
}
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="var">$score</span> = <span class="num">82</span>;
<span class="kw">if</span> (<span class="var">$score</span> >= <span class="num">90</span>) { <span class="kw">echo</span> <span class="str">"Grade A"</span>; }
<span class="kw">elseif</span> (<span class="var">$score</span> >= <span class="num">80</span>) { <span class="kw">echo</span> <span class="str">"Grade B"</span>; }
<span class="kw">else</span> { <span class="kw">echo</span> <span class="str">"Grade C"</span>; }
<span class="var">$favColor</span> = <span class="str">"red"</span>;
<span class="kw">switch</span> (<span class="var">$favColor</span>) {
    <span class="kw">case</span> <span class="str">"blue"</span>: <span class="kw">echo</span> <span class="str">"Blue"</span>; <span class="kw">break</span>;
    <span class="kw">case</span> <span class="str">"red"</span>: <span class="kw">echo</span> <span class="str">"Red"</span>; <span class="kw">break</span>;
    <span class="kw">default</span>: <span class="kw">echo</span> <span class="str">"Unknown"</span>;
}
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-concept">
            <h4>Null Coalescing Operator (??)</h4>
            <p>Returns the left operand if it exists and is not null, otherwise the right operand.</p>
            <code>$username = $_GET['user'] ?? 'Guest';</code>
          </div>
        </article>

        <!-- ========== LESSON 8 ========== -->
        <article class="pp-lesson" id="topic-loops" data-topic="7">
          <div class="pp-lesson-header"><span class="pp-lesson-number">08</span><h3>Loops</h3></div>
          <p>PHP supports <code>for</code>, <code>while</code>, <code>do-while</code>, and <code>foreach</code>.</p>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
for ($i = 1; $i <= 3; $i++) { echo "Count: $i "; }
$w = 1;
while ($w <= 3) { echo "While: $w "; $w++; }
$colors = ["red", "green", "blue"];
foreach ($colors as $color) { echo "Color: $color "; }
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="kw">for</span> (<span class="var">$i</span> = <span class="num">1</span>; <span class="var">$i</span> &lt;= <span class="num">3</span>; <span class="var">$i</span>++) { ... }
<span class="var">$w</span> = <span class="num">1</span>;
<span class="kw">while</span> (<span class="var">$w</span> &lt;= <span class="num">3</span>) { ... <span class="var">$w</span>++; }
<span class="var">$colors</span> = [<span class="str">"red"</span>, <span class="str">"green"</span>, <span class="str">"blue"</span>];
<span class="kw">foreach</span> (<span class="var">$colors</span> <span class="kw">as</span> <span class="var">$color</span>) { ... }
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-exercise" id="exercise-loops">
            <div class="pp-exercise-title">Practice: Loops</div>
            <p>Which loop is designed to iterate through array elements without counter variables?</p>
            <ol>
              <li>for</li>
              <li>while</li>
              <li>do-while</li>
              <li>foreach</li>
            </ol>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-loops">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-loops">
              <p><strong>Correct Answer: D</strong> &mdash; <code>foreach</code> automatically iterates over arrays.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 9 ========== -->
        <article class="pp-lesson" id="topic-functions" data-topic="8">
          <div class="pp-lesson-header"><span class="pp-lesson-number">09</span><h3>Functions</h3></div>
          <p>Functions are reusable blocks of code. They run only when called.</p>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
function greet($name = "Guest") {
    return "Hello, $name!";
}
echo greet("Bob");
echo greet(); // Uses default

function addNumbers(int $a, int $b): int {
    return $a + $b;
}
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="kw">function</span> <span class="fn">greet</span>(<span class="var">$name</span> = <span class="str">"Guest"</span>) {
    <span class="kw">return</span> <span class="str">"Hello, </span><span class="var">$name</span><span class="str">!"</span>;
}
<span class="kw">echo</span> <span class="fn">greet</span>(<span class="str">"Bob"</span>);
<span class="kw">echo</span> <span class="fn">greet</span>();
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-exercise" id="exercise-functions">
            <div class="pp-exercise-title">Practice: Functions</div>
            <p>Given <code>function calc($val = 5) { return $val * 2; }</code>, what is <code>echo calc();</code>?</p>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-functions">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-functions">
              <p><strong>Answer: 10</strong> &mdash; Default parameter <code>$val = 5</code>, returns <code>5 * 2 = 10</code>.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 10 ========== -->
        <div class="pp-divider"><span class="pp-divider-inner">Next Topic</span></div>
        <article class="pp-lesson" id="topic-arrays" data-topic="9">
          <div class="pp-lesson-header"><span class="pp-lesson-number">10</span><h3>Arrays</h3></div>
          <p>PHP supports indexed, associative, and multidimensional arrays.</p>
          <div class="pp-concept">
            <h4>Types of Arrays</h4>
            <ul>
              <li><strong>Indexed:</strong> Numeric keys (0, 1, 2...)</li>
              <li><strong>Associative:</strong> Named string keys</li>
              <li><strong>Multidimensional:</strong> Nested arrays</li>
            </ul>
          </div>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
$person = [
    "name" => "Alice",
    "age" => 25,
    "skills" => ["PHP", "MySQL"]
];
echo $person["name"];       // Alice
echo $person["skills"][0];  // PHP
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="var">$person</span> = [
    <span class="str">"name"</span> => <span class="str">"Alice"</span>,
    <span class="str">"age"</span> => <span class="num">25</span>,
    <span class="str">"skills"</span> => [<span class="str">"PHP"</span>, <span class="str">"MySQL"</span>]
];
<span class="kw">echo</span> <span class="var">$person</span>[<span class="str">"name"</span>];
<span class="kw">echo</span> <span class="var">$person</span>[<span class="str">"skills"</span>][<span class="num">0</span>];
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-exercise" id="exercise-arrays">
            <div class="pp-exercise-title">Practice: Arrays</div>
            <p>Fetch <code>"Green"</code> from <code>$palette = ["primary" => "Red", "secondary" => "Green"];</code></p>
            <ol>
              <li><code>$palette[1]</code></li>
              <li><code>$palette["secondary"]</code></li>
              <li><code>$palette->secondary</code></li>
              <li><code>$palette.secondary</code></li>
            </ol>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-arrays">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-arrays">
              <p><strong>Correct Answer: B</strong> &mdash; Associative arrays use <code>$array["key"]</code> syntax.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 11 ========== -->
        <article class="pp-lesson" id="topic-forms" data-topic="10">
          <div class="pp-lesson-header"><span class="pp-lesson-number">11</span><h3>Forms Handling</h3></div>
          <p><code>$_GET</code> and <code>$_POST</code> collect form data after submission.</p>
          <div class="pp-table-wrap">
            <table class="pp-table" aria-label="GET vs POST">
              <thead><tr><th scope="col">Feature</th><th scope="col">GET</th><th scope="col">POST</th></tr></thead>
              <tbody>
                <tr><td>Visibility</td><td>Data in URL</td><td>Data in request body</td></tr>
                <tr><td>Size Limit</td><td>~2000 chars</td><td>Unlimited</td></tr>
                <tr><td>Security</td><td>Poor</td><td>Better</td></tr>
              </tbody>
            </table>
          </div>
          <div class="pp-concept">
            <h4>Preventing XSS</h4>
            <p>Always use <code>htmlspecialchars()</code> when outputting user input.</p>
            <code>echo htmlspecialchars($_POST["username"], ENT_QUOTES, 'UTF-8');</code>
          </div>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST["fname"], ENT_QUOTES, "UTF-8");
    echo "Welcome, " . $name;
}
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="kw">if</span> (<span class="var">$_SERVER</span>[<span class="str">"REQUEST_METHOD"</span>] == <span class="str">"POST"</span>) {
    <span class="var">$name</span> = <span class="fn">htmlspecialchars</span>(<span class="var">$_POST</span>[<span class="str">"fname"</span>], ENT_QUOTES, <span class="str">"UTF-8"</span>);
    <span class="kw">echo</span> <span class="str">"Welcome, "</span> . <span class="var">$name</span>;
}
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-exercise" id="exercise-forms">
            <div class="pp-exercise-title">Practice: Forms</div>
            <p>Which function prevents XSS when outputting user input?</p>
            <ol>
              <li><code>var_dump()</code></li>
              <li><code>htmlspecialchars()</code></li>
              <li><code>session_start()</code></li>
              <li><code>urlencode()</code></li>
            </ol>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-forms">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-forms">
              <p><strong>Correct Answer: B</strong> &mdash; <code>htmlspecialchars()</code> converts HTML special characters to entities.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 12 ========== -->
        <article class="pp-lesson" id="topic-superglobals" data-topic="11">
          <div class="pp-lesson-header"><span class="pp-lesson-number">12</span><h3>Basic Superglobals</h3></div>
          <p>Superglobals are accessible from any scope without <code>global</code> keyword.</p>
          <div class="pp-concept">
            <h4>Core Superglobals</h4>
            <ul>
              <li><strong>$_SERVER</strong> &mdash; Server and header info</li>
              <li><strong>$_GET</strong> &mdash; URL query parameters</li>
              <li><strong>$_POST</strong> &mdash; HTTP POST data</li>
              <li><strong>$_COOKIE</strong> &mdash; Client cookies</li>
              <li><strong>$_SESSION</strong> &mdash; Session variables</li>
            </ul>
          </div>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
echo $_SERVER["SERVER_NAME"];
echo "\n";
echo $_SERVER["HTTP_USER_AGENT"];
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="kw">echo</span> <span class="var">$_SERVER</span>[<span class="str">"SERVER_NAME"</span>];
<span class="kw">echo</span> <span class="var">$_SERVER</span>[<span class="str">"HTTP_USER_AGENT"</span>];
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-exercise" id="exercise-superglobals">
            <div class="pp-exercise-title">Practice: Superglobals</div>
            <p>Which superglobal contains the request method (GET/POST)?</p>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-superglobals">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-superglobals">
              <p><strong>Answer: $_SERVER</strong> &mdash; <code>$_SERVER["REQUEST_METHOD"]</code> contains the method.</p>
            </div>
          </div>
        </article>

        <!-- ========== LESSON 13 ========== -->
        <div class="pp-divider"><span class="pp-divider-inner">Final Topic</span></div>
        <article class="pp-lesson" id="topic-sessions" data-topic="12">
          <div class="pp-lesson-header"><span class="pp-lesson-number">13</span><h3>Sessions &amp; Cookies</h3></div>
          <p>HTTP is stateless. Cookies and Sessions preserve state across pages.</p>
          <div class="pp-concept">
            <h4>Cookies vs Sessions</h4>
            <ul>
              <li><strong>Cookies:</strong> Stored on the client. Persistent but insecure.</li>
              <li><strong>Sessions:</strong> Stored on the server. Only a session ID is stored client-side.</li>
            </ul>
          </div>
          <h4>Starting a Session</h4>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP &mdash; Sessions</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
session_start();
$_SESSION["userid"] = 101;
$_SESSION["role"] = "admin";
echo "User: " . $_SESSION["userid"];
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="fn">session_start</span>();
<span class="var">$_SESSION</span>[<span class="str">"userid"</span>] = <span class="num">101</span>;
<span class="kw">echo</span> <span class="str">"User: "</span> . <span class="var">$_SESSION</span>[<span class="str">"userid"</span>];
<span class="kw">?&gt;</span></code></pre>
          </div>
          <h4>Setting a Cookie</h4>
          <div class="pp-code-block">
            <div class="pp-code-header"><span class="pp-code-lang">PHP &mdash; Cookies</span><button type="button" class="pp-code-copy" aria-label="Copy code" data-code='<?php
setcookie("user", "Alex", time() + 3600, "/");
echo $_COOKIE["user"] ?? "Not logged in";
?>'><i class="fas fa-copy"></i> Copy</button></div>
            <pre><code><span class="kw">&lt;?php</span>
<span class="fn">setcookie</span>(<span class="str">"user"</span>, <span class="str">"Alex"</span>, <span class="fn">time</span>() + <span class="num">3600</span>, <span class="str">"/"</span>);
<span class="kw">echo</span> <span class="var">$_COOKIE</span>[<span class="str">"user"</span>] ?? <span class="str">"Not logged in"</span>;
<span class="kw">?&gt;</span></code></pre>
          </div>
          <div class="pp-exercise" id="exercise-sessions">
            <div class="pp-exercise-title">Practice: Sessions</div>
            <p>Which function must be called before any output to use <code>$_SESSION</code>?</p>
            <ol>
              <li><code>session_open()</code></li>
              <li><code>session_start()</code></li>
              <li><code>session_init()</code></li>
              <li><code>session_begin()</code></li>
            </ol>
            <button type="button" class="pp-exercise-toggle" aria-expanded="false" aria-controls="solution-sessions">Show Solution</button>
            <div class="pp-exercise-solution" id="solution-sessions">
              <p><strong>Correct Answer: B</strong> &mdash; <code>session_start()</code> must be called before any HTML output.</p>
            </div>
          </div>
        </article>
      </section>

      <footer class="pp-footer">
        <p>Practice your skills in the <a href="/pages/editors/php-editor/php-editor.html">PHP Editor →</a></p>
        <p>Back to <a href="/pages/learning/languages.html">Programming Languages</a></p>
      </footer>
    </main>

    <script src="/auth.js"></script>
    <script src="/theme.js"></script>
    <script src="/script.js"></script>
    <script src="php-learning.js"></script>
  </body>
</html>
