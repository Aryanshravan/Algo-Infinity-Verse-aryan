/**
 * modules/lazyVisualizer.js
 * Shared Intersection Observer utility for deferring heavy library loads
 * (Three.js ~600KB, Chart.js ~200KB) until the visualizer container
 * enters the viewport.
 *
 * Usage (non‑module pages):
 *   <script src="/modules/lazyVisualizer.js"></script>
 *   <script>
 *     lazyVisualizer.lazyLoadThree('#threejs-container', initMyApp);
 *     lazyVisualizer.lazyLoadChartJS('#chartCanvas', initMyChart);
 *   </script>
 *
 * For ES‑module pages (marching‑cubes style) use:
 *   lazyVisualizer.lazyLoadModule('#viewport', 'marching-cubes.js');
 */

(function () {
  'use strict';

  var VERSION = '1.0.0';

  // ──────────────────────────────────────────────
  // Internal helpers
  // ──────────────────────────────────────────────

  /**
   * Resolve an element from a CSS selector, an element id string, or a DOM node.
   */
  function resolveElement(el) {
    if (typeof el === 'string') {
      // Try as querySelector first, then as plain id
      var found = document.querySelector(el);
      if (!found) found = document.getElementById(el.replace(/^#/, ''));
      return found;
    }
    return el; // assume DOM node
  }

  /**
   * Inject a <script> tag into <head> and return a Promise that resolves
   * when the script loads (or immediately if a check passes).
   *
   * @param {string} src  – script URL
   * @param {object} opts
   * @param {string} [opts.check] – global variable to test before injecting
   * @param {boolean} [opts.async]
   * @param {boolean} [opts.defer]
   * @param {string}  [opts.type]
   * @param {string}  [opts.integrity]
   * @param {string}  [opts.crossorigin]
   */
  function injectScript(src, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      // Already loaded?
      if (opts.check && typeof window[opts.check] !== 'undefined') {
        return resolve();
      }

      // Deduplicate by src
      var existing = document.querySelector('script[src="' + src.replace(/"/g, '&quot;') + '"]');
      if (existing) {
        // If already loaded, resolve; otherwise wait for its load event
        if (existing.getAttribute('data-loaded') === '1') return resolve();
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', reject);
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      if (opts.async !== undefined) script.async = opts.async;
      if (opts.defer !== undefined) script.defer = opts.defer;
      if (opts.type) script.type = opts.type;
      if (opts.integrity) script.integrity = opts.integrity;
      if (opts.crossorigin) script.crossOrigin = opts.crossorigin;

      script.onload = function () {
        script.setAttribute('data-loaded', '1');
        resolve();
      };
      script.onerror = function (err) {
        reject(new Error('Failed to load script: ' + src + ' — ' + (err.message || '')));
      };
      document.head.appendChild(script);
    });
  }

  // ──────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────

  var api = {
    version: VERSION,

    /**
     * Observe `element` with an IntersectionObserver. The callback fires
     * once when the element first intersects (plus a rootMargin cushion).
     * The observer is disconnected after the first callback.
     *
     * @param  {Element|string} el       – DOM node or CSS selector
     * @param  {Function}       callback – called when visible
     * @param  {object}         [options]
     * @param  {string}         [options.rootMargin='200px']
     * @param  {number|number[]} [options.threshold]
     * @return {IntersectionObserver|undefined} – the observer (so callers can disconnect early)
     */
    whenVisible: function (el, callback, options) {
      var element = resolveElement(el);
      if (!element) {
        // Element not found — fire callback anyway as a safe fallback
        if (typeof callback === 'function') callback();
        return undefined;
      }

      // IntersectionObserver not supported — fire immediately
      if (typeof IntersectionObserver === 'undefined') {
        if (typeof callback === 'function') callback();
        return undefined;
      }

      options = options || {};
      var observer = new IntersectionObserver(
        function (entries) {
          if (entries[0] && entries[0].isIntersecting) {
            observer.disconnect();
            if (typeof callback === 'function') callback();
          }
        },
        {
          rootMargin: options.rootMargin || '200px',
          threshold: options.threshold !== undefined ? options.threshold : 0,
        }
      );
      observer.observe(element);
      return observer;
    },

    /**
     * Inject an array of scripts in order, optionally guarded by a `check`.
     * Each item: { src, check?, async?, defer?, type?, integrity?, crossorigin? }
     *
     * @param  {Array<object>} scripts
     * @return {Promise<void>}
     */
    injectScripts: function (scripts) {
      return scripts.reduce(function (chain, item) {
        return chain.then(function () {
          return injectScript(item.src, item);
        });
      }, Promise.resolve());
    },

    /**
     * Lazy‑load Three.js (r128) + OrbitControls for a given container.
     * Calls `callback` after both scripts have loaded.
     *
     * @param {Element|string} container – container element or CSS selector
     * @param {Function}       callback  – called after Three.js is ready
     * @param {object}         [options]
     * @param {string}         [options.threeSrc]
     * @param {string}         [options.orbitSrc]
     * @param {string}         [options.rootMargin]
     */
    lazyLoadThree: function (container, callback, options) {
      options = options || {};
      var threeSrc =
        options.threeSrc ||
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      var orbitSrc =
        options.orbitSrc ||
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';

      if (typeof THREE !== 'undefined') {
        // Already loaded — call callback directly
        if (typeof callback === 'function') callback();
        return;
      }

      this.whenVisible(container, function () {
        api
          .injectScripts([
            { src: threeSrc, check: 'THREE' },
            { src: orbitSrc, check: 'OrbitControls' },
          ])
          .then(function () {
            if (typeof callback === 'function') callback();
          })
          .catch(function (err) {
            console.error('[lazyVisualizer] Failed to load Three.js:', err);
          });
      }, options);
    },

    /**
     * Lazy‑load Chart.js for a given container / set of containers.
     * Calls `callback` after Chart.js has loaded.
     *
     * @param {Element|string|Array<Element|string>} containers
     * @param {Function} callback – called after Chart.js is ready
     * @param {object}   [options]
     * @param {string}   [options.chartSrc]
     * @param {string}   [options.rootMargin]
     */
    lazyLoadChartJS: function (containers, callback, options) {
      options = options || {};
      var chartSrc =
        options.chartSrc ||
        'https://cdn.jsdelivr.net/npm/chart.js';

      if (typeof Chart !== 'undefined') {
        if (typeof callback === 'function') callback();
        return;
      }

      // Normalise to array
      var items = Array.isArray(containers) ? containers : [containers];

      // Pick the first resolvable container to observe
      var target = null;
      for (var i = 0; i < items.length; i++) {
        target = resolveElement(items[i]);
        if (target) break;
      }

      if (!target) {
        // Fallback: load immediately
        injectScript(chartSrc, { check: 'Chart' }).then(function () {
          if (typeof callback === 'function') callback();
        });
        return;
      }

      this.whenVisible(target, function () {
        injectScript(chartSrc, { check: 'Chart' })
          .then(function () {
            if (typeof callback === 'function') callback();
          })
          .catch(function (err) {
            console.error('[lazyVisualizer] Failed to load Chart.js:', err);
          });
      }, options);
    },

    /**
     * Lazy‑load an ES module script (e.g. marching-cubes.js) that uses an
     * existing importmap.  The importmap must already be declared in the HTML.
     *
     * @param {Element|string} container
     * @param {string}         moduleUrl – path to the module script
     * @param {object}         [options]
     * @param {string}         [options.rootMargin]
     */
    lazyLoadModule: function (container, moduleUrl, options) {
      options = options || {};
      this.whenVisible(
        container,
        function () {
          // Guard: already injected?
          var existing = document.querySelector(
            'script[type="module"][src="' + moduleUrl.replace(/"/g, '&quot;') + '"]'
          );
          if (existing) return;

          var script = document.createElement('script');
          script.type = 'module';
          script.src = moduleUrl;
          document.body.appendChild(script);
        },
        options
      );
    },

    /**
     * Generic helper: lazy‑load arbitrary scripts when a container is visible.
     *
     * @param {Element|string}  container
     * @param {Array<object>}   scripts – same shape as injectScripts items
     * @param {Function}        [callback]
     * @param {object}          [options]
     */
    lazyLoad: function (container, scripts, callback, options) {
      options = options || {};
      this.whenVisible(container, function () {
        api
          .injectScripts(scripts)
          .then(function () {
            if (typeof callback === 'function') callback();
          })
          .catch(function (err) {
            console.error('[lazyVisualizer] lazyLoad error:', err);
          });
      }, options);
    },
  };

  // Expose globally
  window.lazyVisualizer = api;
})();
