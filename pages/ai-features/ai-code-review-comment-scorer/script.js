/**
 * AI Code Review Comment Scorer
 * Heuristic clarity / specificity / actionability / toxicity + inclusive rewrites.
 */
(function () {
  'use strict';

  var DEMO_COMMENTS =
    'This is completely wrong. Did you even test it?\n\n' +
    'Why?\n\n' +
    'You always make the same mistakes. Fix your code.\n\n' +
    'nit: naming\n\n' +
    'This function is garbage and should be deleted immediately.\n\n' +
    'Consider extracting the validation into a shared helper and adding a unit test for the empty-input case.\n\n' +
    "I don't like this.\n\n" +
    'LGTM but maybe rethink the approach?';

  var TOXIC_PATTERNS = [
    { re: /\b(idiot|stupid|dumb|moron|garbage|trash|pathetic|incompetent)\b/i, w: 35 },
    { re: /\byou always\b|\byou never\b|\byou clearly\b/i, w: 20 },
    { re: /\bdid you even\b|\bobviously\b|\bwtf\b|\bseriously\?\b/i, w: 18 },
    { re: /\bcompletely wrong\b|\btotally broken\b|\buseless\b/i, w: 15 },
    { re: /!{2,}|\?{2,}/, w: 8 }
  ];

  var ACTION_CUES = [
    /\bconsider\b/i,
    /\bsuggest\b/i,
    /\bcould\b/i,
    /\bwould\b/i,
    /\bplease\b/i,
    /\bextract\b/i,
    /\brename\b/i,
    /\badd (a |an |the )?(test|check|guard|comment)\b/i,
    /\bmove\b/i,
    /\breplace\b/i,
    /\bprefer\b/i
  ];

  var SPECIFIC_CUES = [
    /\bline\s*\d+\b/i,
    /\bfunction\b|\bmethod\b|\bclass\b|\bfile\b/i,
    /`[^`]+`/,
    /\bnull\b|\bundefined\b|\bempty\b|\bedge case\b/i,
    /\btest(s)?\b/i,
    /\bperformance\b|\bsecurity\b|\baccessib/i,
    /\bhere\b.*\bbecause\b/i
  ];

  var lastReport = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function splitComments(text) {
    var raw = String(text || '').trim();
    if (!raw) return [];
    var parts = raw.indexOf('\n\n') !== -1 ? raw.split(/\n\s*\n/) : raw.split(/\n/);
    return parts
      .map(function (p) { return p.trim(); })
      .filter(Boolean);
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function scoreComment(text) {
    var words = text.trim().split(/\s+/).filter(Boolean);
    var len = words.length;

    var clarity = 40;
    if (len >= 8) clarity += 25;
    else if (len >= 4) clarity += 12;
    else clarity -= 15;
    if (/[.?!]$/.test(text.trim())) clarity += 5;
    if (/^(why|what|huh)\??$/i.test(text.trim())) clarity -= 25;
    if (/\bbecause\b|\bso that\b|\bin order to\b/i.test(text)) clarity += 15;
    clarity = clamp(clarity, 0, 100);

    var specificity = 30;
    SPECIFIC_CUES.forEach(function (re) {
      if (re.test(text)) specificity += 12;
    });
    if (len < 3) specificity -= 20;
    if (/^(nit|lgtm|ok|fine)\b/i.test(text) && len < 6) specificity -= 10;
    specificity = clamp(specificity, 0, 100);

    var actionability = 25;
    ACTION_CUES.forEach(function (re) {
      if (re.test(text)) actionability += 14;
    });
    if (/\?$/.test(text.trim()) && len < 6) actionability -= 10;
    if (/fix|change|update|remove|add|extract|rename/i.test(text)) actionability += 10;
    actionability = clamp(actionability, 0, 100);

    var toxicity = 0;
    var flags = [];
    TOXIC_PATTERNS.forEach(function (p) {
      if (p.re.test(text)) {
        toxicity += p.w;
        flags.push(p.re.source);
      }
    });
    toxicity = clamp(toxicity, 0, 100);

    var respect = clamp(100 - toxicity, 0, 100);
    var overall = Math.round((clarity + specificity + actionability + respect) / 4);

    return {
      text: text,
      clarity: clarity,
      specificity: specificity,
      actionability: actionability,
      toxicity: toxicity,
      respect: respect,
      overall: overall,
      toxicityLevel: toxicity >= 40 ? 'high' : toxicity >= 15 ? 'medium' : 'low',
      flags: flags
    };
  }

  function rewriteInclusive(text, scored) {
    var t = text.trim();

    if (/^(why|what|huh)\??$/i.test(t)) {
      return 'Could you walk me through the intent here? I want to make sure I understand the trade-off before suggesting a change.';
    }
    if (/^nit:?\s*naming$/i.test(t) || /^nit:?\s*$/i.test(t)) {
      return 'Nit: would a more descriptive name help future readers? Happy to bike-shed alternatives if useful.';
    }
    if (/i don'?t like this/i.test(t)) {
      return 'I have a concern with this approach — could we discuss the goal and see if there is a clearer alternative?';
    }
    if (/lgtm but maybe rethink/i.test(t)) {
      return 'LGTM for merge readiness. Optionally, we could revisit the approach in a follow-up if we want a simpler long-term design.';
    }

    var out = t;
    out = out.replace(/\bthis is completely wrong\b/gi, 'I think there may be a bug here');
    out = out.replace(/\bdid you even test it\??/gi, 'Could we add a quick test covering this path?');
    out = out.replace(/\byou always make the same mistakes\.?\s*fix your code\.?/gi,
      'I have seen a similar pattern before — would it help to extract a shared helper and add a regression test?');
    out = out.replace(/\bthis function is garbage and should be deleted immediately\.?/gi,
      'This function looks hard to maintain. Could we delete or split it if it is unused, or refactor the core path?');
    out = out.replace(/\byou always\b/gi, 'this often');
    out = out.replace(/\byou never\b/gi, 'we rarely');
    out = out.replace(/\byour code\b/gi, 'this code');
    out = out.replace(/\bstupid|idiot|dumb|moron|garbage|trash|pathetic|incompetent\b/gi, 'unclear');
    out = out.replace(/!{2,}/g, '.');
    out = out.replace(/\bwtf\b/gi, 'unexpected');

    if (scored.actionability < 50 && scored.toxicity < 40) {
      out += ' Suggested next step: propose a concrete alternative or link to an example.';
    }
    if (scored.specificity < 50) {
      out = out.replace(/\.$/, '') + ' (e.g. call out the symbol, line, or failing case).';
    }

    if (out === t && scored.overall < 70) {
      out = 'Suggestion: ' + t.replace(/\?+$/, '') +
        ' — could we make the expected change explicit so it is easy to act on?';
    }

    return out.trim();
  }

  function runScore() {
    var comments = splitComments($('revComments').value);
    if (!comments.length) {
      $('revStatus').textContent = 'Paste at least one review comment.';
      return;
    }

    var scored = comments.map(scoreComment);
    var rewrites = scored.map(function (s) {
      return { before: s.text, after: rewriteInclusive(s.text, s), scores: s };
    });

    var avg = Math.round(
      scored.reduce(function (a, s) { return a + s.overall; }, 0) / scored.length
    );
    var toxFlags = scored.filter(function (s) { return s.toxicity >= 15; }).length;

    lastReport = {
      generatedAt: new Date().toISOString(),
      avg: avg,
      toxFlags: toxFlags,
      items: rewrites
    };

    renderResults(rewrites);
    updateHero(scored.length, avg, toxFlags);
    $('revExportBtn').disabled = false;
    $('revStatus').textContent = 'Scored ' + scored.length + ' comment(s). Average ' + avg + '/100.';
  }

  function updateHero(count, avg, tox) {
    $('statComments').textContent = count == null ? '—' : String(count);
    $('statAvg').textContent = avg == null ? '—' : String(avg);
    $('statToxicity').textContent = tox == null ? '—' : String(tox);
  }

  function renderResults(items) {
    $('revResults').innerHTML = items
      .map(function (it, idx) {
        var s = it.scores;
        return (
          '<article class="rev-card" data-toxicity="' + escapeHtml(s.toxicityLevel) + '">' +
          '<p class="rev-card-original"><strong>#' + (idx + 1) + '</strong> ' + escapeHtml(it.before) + '</p>' +
          '<div class="rev-score-grid">' +
          scoreCell('Clarity', s.clarity) +
          scoreCell('Specificity', s.specificity) +
          scoreCell('Actionable', s.actionability) +
          scoreCell('Toxicity', s.toxicity) +
          '</div>' +
          '<div class="rev-rewrite">' +
          '<div class="rev-rewrite-box"><h4>Before</h4><p>' + escapeHtml(it.before) + '</p></div>' +
          '<div class="rev-rewrite-box after"><h4>Inclusive rewrite</h4><p>' + escapeHtml(it.after) + '</p></div>' +
          '</div>' +
          '</article>'
        );
      })
      .join('');
  }

  function scoreCell(label, val) {
    return (
      '<div class="rev-score-item"><span>' + escapeHtml(label) + '</span><strong>' +
      escapeHtml(String(val)) + '</strong></div>'
    );
  }

  function exportReport() {
    if (!lastReport) return;
    var r = lastReport;
    var lines = [];
    lines.push('# Code Review Coaching Report');
    lines.push('Generated: ' + r.generatedAt);
    lines.push('Comments scored: ' + r.items.length);
    lines.push('Average overall: ' + r.avg + '/100');
    lines.push('Toxicity flags (≥15): ' + r.toxFlags);
    lines.push('');
    lines.push('## CoC-aligned rubric');
    lines.push('- Clarity, specificity, actionability, and respectful tone');
    lines.push('- Prefer inclusive “we / this code” language over personal blame');
    lines.push('');
    r.items.forEach(function (it, i) {
      var s = it.scores;
      lines.push('## Comment ' + (i + 1));
      lines.push('Scores — clarity: ' + s.clarity + ', specificity: ' + s.specificity +
        ', actionability: ' + s.actionability + ', toxicity: ' + s.toxicity +
        ', overall: ' + s.overall);
      lines.push('');
      lines.push('Before:');
      lines.push(it.before);
      lines.push('');
      lines.push('Inclusive rewrite:');
      lines.push(it.after);
      lines.push('');
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'review-comment-coaching-report.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadDemo() {
    $('revComments').value = DEMO_COMMENTS;
    $('revStatus').textContent = 'Loaded harsh / vague demo comments.';
  }

  function clearAll() {
    $('revComments').value = '';
    $('revResults').innerHTML = '<p class="rev-empty">Score comments to see per-dimension ratings and inclusive rewrites.</p>';
    $('revExportBtn').disabled = true;
    lastReport = null;
    updateHero(null, null, null);
    $('revStatus').textContent = 'Cleared.';
  }

  function init() {
    $('revDemoBtn').addEventListener('click', loadDemo);
    $('revScoreBtn').addEventListener('click', runScore);
    $('revClearBtn').addEventListener('click', clearAll);
    $('revExportBtn').addEventListener('click', exportReport);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
