/**
 * Reusable Activity Heatmap Module (GitHub-style 52-week activity calendar)
 * Algo Infinity Verse
 */

export class ActivityHeatmap {
  constructor(options = {}) {
    this.weeks = options.weeks || 52;
    this.container = options.container || null;
    this.data = options.data || {};
  }

  static formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static getIntensityLevel(count) {
    const num = Number(count) || 0;
    if (num <= 0) return 0;
    if (num <= 2) return 1;
    if (num <= 5) return 2;
    if (num <= 9) return 3;
    return 4;
  }

  calculateStats(activityMap = this.data) {
    const keys = Object.keys(activityMap).sort();
    let totalActivities = 0;
    let activeDays = 0;

    keys.forEach((key) => {
      const val =
        typeof activityMap[key] === 'object'
          ? activityMap[key].count || 0
          : Number(activityMap[key]) || 0;
      if (val > 0) {
        activeDays += 1;
        totalActivities += val;
      }
    });

    // Calculate current and longest streaks from dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    let todayKey = ActivityHeatmap.formatDateKey(today);
    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let yesterdayKey = ActivityHeatmap.formatDateKey(yesterday);

    let startPoint = activityMap[todayKey] ? today : activityMap[yesterdayKey] ? yesterday : null;
    if (startPoint) {
      let d = new Date(startPoint);
      let counting = true;
      while (counting) {
        let key = ActivityHeatmap.formatDateKey(d);
        let count =
          typeof activityMap[key] === 'object'
            ? activityMap[key].count || 0
            : Number(activityMap[key]) || 0;
        if (count > 0) {
          currentStreak++;
          d.setDate(d.getDate() - 1);
        } else {
          counting = false;
        }
      }
    }
    if (keys.length > 0) {
      let sortedDates = keys
        .filter((k) => {
          let count =
            typeof activityMap[k] === 'object'
              ? activityMap[k].count || 0
              : Number(activityMap[k]) || 0;
          return count > 0;
        })
        .map((k) => new Date(k + 'T00:00:00'))
        .sort((a, b) => a - b);

      if (sortedDates.length > 0) {
        tempStreak = 1;
        longestStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          let diff = Math.round((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24));
          if (diff === 1) {
            tempStreak++;
          } else if (diff > 1) {
            tempStreak = 1;
          }
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
        }
      }
    }

    return {
      totalActivities,
      activeDays,
      currentStreak,
      longestStreak: Math.max(currentStreak, longestStreak),
    };
  }

  generateGridData(weeksCount = this.weeks, endDate = new Date()) {
    const grid = [];
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    // End on upcoming Saturday to complete full week column
    const dayOfWeek = end.getDay(); // 0 is Sun, 6 is Sat
    const gridEnd = new Date(end);
    gridEnd.setDate(end.getDate() + (6 - dayOfWeek));

    const totalDays = weeksCount * 7;
    const gridStart = new Date(gridEnd);
    gridStart.setDate(gridEnd.getDate() - totalDays + 1);

    let curr = new Date(gridStart);
    let currentWeek = [];

    while (curr <= gridEnd) {
      const dateKey = ActivityHeatmap.formatDateKey(curr);
      const rawVal = this.data[dateKey] || 0;
      const count = typeof rawVal === 'object' ? rawVal.count || 0 : Number(rawVal) || 0;
      const minutes = typeof rawVal === 'object' ? rawVal.minutes || 0 : 0;

      currentWeek.push({
        date: new Date(curr),
        dateKey,
        count,
        minutes,
        level: ActivityHeatmap.getIntensityLevel(count),
        isFuture: curr > end,
      });

      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }

      curr.setDate(curr.getDate() + 1);
    }

    return { grid, gridStart, gridEnd };
  }

  render(targetContainer = this.container, activityMap = this.data) {
    if (typeof targetContainer === 'string') {
      targetContainer = document.getElementById(targetContainer);
    }
    if (!targetContainer) return;

    this.container = targetContainer;
    this.data = activityMap;

    const { grid } = this.generateGridData();
    const stats = this.calculateStats();

    // Months row logic
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthLabels = [];
    let lastMonth = -1;

    grid.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0].date;
      const m = firstDayOfWeek.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ name: monthNames[m], col: weekIndex });
        lastMonth = m;
      }
    });

    let html = `
      <div class="heatmap-wrapper">
        <div class="heatmap-stats-bar">
          <div class="heatmap-stat">
            <span class="heatmap-stat-val">${stats.totalActivities}</span>
            <span class="heatmap-stat-lbl">Total Activities</span>
          </div>
          <div class="heatmap-stat">
            <span class="heatmap-stat-val">${stats.activeDays}</span>
            <span class="heatmap-stat-lbl">Active Days</span>
          </div>
          <div class="heatmap-stat">
            <span class="heatmap-stat-val">${stats.currentStreak} 🔥</span>
            <span class="heatmap-stat-lbl">Current Streak</span>
          </div>
          <div class="heatmap-stat">
            <span class="heatmap-stat-val">${stats.longestStreak} 🏆</span>
            <span class="heatmap-stat-lbl">Longest Streak</span>
          </div>
        </div>

        <div class="heatmap-grid-container">
          <div class="heatmap-months-row">
            <div class="heatmap-weekday-spacer"></div>
            <div class="heatmap-months-track">
              ${monthLabels
                .map(
                  (m) =>
                    `<span class="heatmap-month-label" style="grid-column-start: ${m.col + 1}">${m.name}</span>`
                )
                .join('')}
            </div>
          </div>

          <div class="heatmap-body">
            <div class="heatmap-weekdays-col">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div class="heatmap-matrix" style="grid-template-columns: repeat(${grid.length}, 1fr);">
              ${grid
                .map((week) =>
                  week
                    .map((day) => {
                      const dateStr = day.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                      const tooltip = day.isFuture
                        ? ''
                        : `${dateStr}: ${day.count} activity${day.count === 1 ? '' : 'ies'}${
                            day.minutes ? ` (${day.minutes} mins studied)` : ''
                          }`;
                      return `
                        <div class="heatmap-cell level-${day.level} ${day.isFuture ? 'future' : ''}"
                             data-date="${day.dateKey}"
                             data-count="${day.count}"
                             data-tooltip="${tooltip}">
                        </div>
                      `;
                    })
                    .join('')
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="heatmap-legend">
          <span>Less</span>
          <div class="heatmap-cell level-0"></div>
          <div class="heatmap-cell level-1"></div>
          <div class="heatmap-cell level-2"></div>
          <div class="heatmap-cell level-3"></div>
          <div class="heatmap-cell level-4"></div>
          <span>More</span>
        </div>
      </div>
    `;

    targetContainer.innerHTML = html;
    this.attachTooltipListeners(targetContainer);
  }

  attachTooltipListeners(container) {
    let tooltipEl = document.getElementById('heatmap-global-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'heatmap-global-tooltip';
      tooltipEl.className = 'heatmap-tooltip hidden';
      document.body.appendChild(tooltipEl);
    }

    const cells = container.querySelectorAll('.heatmap-cell[data-tooltip]');
    cells.forEach((cell) => {
      const text = cell.getAttribute('data-tooltip');
      if (!text) return;

      cell.addEventListener('mouseenter', () => {
        tooltipEl.textContent = text;
        tooltipEl.classList.remove('hidden');
        const rect = cell.getBoundingClientRect();
        tooltipEl.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
        tooltipEl.style.top = `${rect.top + window.scrollY - 36}px`;
      });

      cell.addEventListener('mouseleave', () => {
        tooltipEl.classList.add('hidden');
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.ActivityHeatmap = ActivityHeatmap;
}
