/* ============================================================
   Algo Infinity Verse — Contest Archive JS
   Renders the latest-round podium, the past-contest roll of honor,
   and final standings from data/contest-archive.js
   ============================================================ */

(function () {
  'use strict';

  const ARCHIVE = window.contestArchive;

  /* ── Helpers ── */
  function escapeHtml(str) {
    return String(str).replace(
      /[&<>"']/g,
      (ch) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[ch]
    );
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('en-US');
  }

  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function capitalize(str) {
    return String(str).charAt(0).toUpperCase() + String(str).slice(1);
  }

  function initialsOf(name) {
    const parts = String(name).trim().split(/\s+/);
    if (!parts.length) return '?';
    const first = parts[0].charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase() || '?';
  }

  /* Resolve problem details from the shared practice-problem dataset so
     titles, difficulties, and editor links always stay in sync. */
  const problemById = new Map(
    (Array.isArray(window.practiceProblems) ? window.practiceProblems : []).map((p) => [
      Number(p.id),
      p,
    ])
  );

  function resolveProblem(id) {
    const p = problemById.get(Number(id));
    if (p) {
      return { title: p.title, difficulty: String(p.difficulty).toLowerCase() };
    }
    return { title: 'Problem ' + id, difficulty: 'medium' };
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ── Hero stats ── */
  function renderStats() {
    if (!ARCHIVE || !Array.isArray(ARCHIVE.contests)) return;
    const contests = ARCHIVE.contests;
    const totalProblems = contests.reduce((sum, c) => sum + c.problems.length, 0);
    const totalParticipants = contests.reduce((sum, c) => sum + c.participants, 0);
    setText('caStatContests', formatNumber(contests.length));
    setText('caStatProblems', formatNumber(totalProblems));
    setText('caStatParticipants', formatNumber(totalParticipants));
  }

  /* ── Latest round podium ── */
  function renderPodium() {
    const wrap = document.getElementById('caPodiumWrap');
    const host = document.getElementById('caPodium');
    if (!wrap || !host || !ARCHIVE || !ARCHIVE.contests.length) return;

    const latest = ARCHIVE.contests[0];
    const top3 = latest.leaderboard.slice(0, 3);
    if (top3.length < 3) return;

    const label = document.getElementById('caPodiumLabel');
    if (label) {
      label.innerHTML =
        'Final standings &mdash; Round ' +
        latest.id +
        ' &middot; ' +
        escapeHtml(latest.name) +
        ' &middot; ' +
        formatDate(latest.date);
    }

    // Podium order: 2nd, 1st, 3rd (1st tallest in the centre)
    const order = [top3[1], top3[0], top3[2]];
    const placeClass = ['ca-podium-cell--2nd', 'ca-podium-cell--1st', 'ca-podium-cell--3rd'];

    host.innerHTML = order
      .map((entry, i) => {
        const rank = String(entry.rank).padStart(2, '0');
        const crown = i === 1 ? '<i class="fas fa-crown" aria-hidden="true"></i> ' : '';
        return (
          '<div class="ca-podium-cell ' +
          placeClass[i] +
          '">' +
          '<span class="ca-podium-rank">' +
          crown +
          rank +
          '</span>' +
          '<span class="ca-podium-name">' +
          escapeHtml(entry.name) +
          '</span>' +
          '<span class="ca-podium-score">' +
          formatNumber(entry.score) +
          ' pts</span>' +
          '<span class="ca-podium-solved">' +
          entry.solved +
          ' problems solved</span>' +
          '<span class="ca-podium-base" aria-hidden="true"></span>' +
          '</div>'
        );
      })
      .join('');

    wrap.hidden = false;
  }

  /* ── Past contests list ── */
  function buildStandings(leaderboard) {
    const rows = leaderboard
      .slice(0, 5)
      .map((entry) => {
        return (
          '<tr class="ca-stand-row--top' +
          entry.rank +
          '">' +
          '<td class="ca-stand-rank">' +
          entry.rank +
          '</td>' +
          '<td>' +
          '<span class="ca-stand-avatar" aria-hidden="true">' +
          escapeHtml(initialsOf(entry.name)) +
          '</span>' +
          '<span class="ca-stand-name">' +
          escapeHtml(entry.name) +
          '</span>' +
          '</td>' +
          '<td>' +
          entry.solved +
          '</td>' +
          '<td class="ca-stand-score">' +
          formatNumber(entry.score) +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    return (
      '<table class="ca-stand-table">' +
      '<thead>' +
      '<tr><th scope="col">Rank</th><th scope="col">Learner</th>' +
      '<th scope="col">Solved</th><th scope="col">Score</th></tr>' +
      '</thead>' +
      '<tbody>' +
      rows +
      '</tbody>' +
      '</table>'
    );
  }

  function buildContest(contest) {
    const problems = contest.problems
      .map((problem, idx) => {
        const info = resolveProblem(problem.id);
        const letter = String.fromCharCode(65 + idx);
        const lang = localStorage.getItem('preferredLanguage') || 'javascript';
        return (
          '<li class="ca-problem-row">' +
          '<span class="ca-problem-letter" aria-hidden="true">' +
          letter +
          '</span>' +
          '<a class="ca-problem-title" href="/practice/editor?problemId=' +
          problem.id +
          '&amp;lang=' +
          encodeURIComponent(lang) +
          '" target="_blank" rel="noopener noreferrer">' +
          escapeHtml(info.title) +
          '</a>' +
          '<span class="ca-problem-tags">' +
          '<span class="ca-diff ca-diff--' +
          info.difficulty +
          '">' +
          capitalize(info.difficulty) +
          '</span>' +
          '<span>' +
          formatNumber(problem.points) +
          ' pts</span>' +
          '</span>' +
          '</li>'
        );
      })
      .join('');

    return (
      '<details class="ca-contest hp-reveal">' +
      '<summary class="ca-contest-summary">' +
      '<span class="ca-round" aria-hidden="true">R' +
      contest.id +
      '</span>' +
      '<span class="ca-contest-main">' +
      '<span class="ca-contest-name">' +
      escapeHtml(contest.name) +
      '</span>' +
      '<span class="ca-contest-meta">' +
      '<span><i class="fas fa-calendar-alt" aria-hidden="true"></i>' +
      formatDate(contest.date) +
      '</span>' +
      '<span><i class="fas fa-clock" aria-hidden="true"></i>' +
      escapeHtml(contest.duration) +
      '</span>' +
      '<span><i class="fas fa-users" aria-hidden="true"></i>' +
      formatNumber(contest.participants) +
      ' participants</span>' +
      '</span>' +
      '</span>' +
      '<span class="ca-contest-side">' +
      '<span class="ca-count">' +
      contest.problems.length +
      ' problems</span>' +
      '<span class="ca-diff ca-diff--' +
      contest.difficulty +
      '">' +
      capitalize(contest.difficulty) +
      '</span>' +
      '<i class="fas fa-chevron-down ca-chevron" aria-hidden="true"></i>' +
      '</span>' +
      '</summary>' +
      '<div class="ca-contest-body">' +
      '<div class="ca-problems">' +
      '<h3>Problems</h3>' +
      '<ul class="ca-problem-list">' +
      problems +
      '</ul>' +
      '<p class="ca-practice-hint">' +
      '<i class="fas fa-unlock-alt" aria-hidden="true"></i>' +
      'Every round stays open &mdash; attempt these problems any time for practice.' +
      '</p>' +
      '</div>' +
      '<div class="ca-standings">' +
      '<h3>Final standings</h3>' +
      buildStandings(contest.leaderboard) +
      '</div>' +
      '</div>' +
      '</details>'
    );
  }

  function renderList() {
    const host = document.getElementById('caList');
    if (!host) return;

    if (!ARCHIVE || !Array.isArray(ARCHIVE.contests) || !ARCHIVE.contests.length) {
      host.innerHTML =
        '<p class="ca-nojs">No past contests yet &mdash; check back after the first round ends.</p>';
      return;
    }

    host.innerHTML = ARCHIVE.contests.map(buildContest).join('');
  }

  /* ── Boot ── */
  if (document.querySelector('.hp-hero') && ARCHIVE && ARCHIVE.contests) {
    renderStats();
    renderPodium();
    renderList();
  }
})();
