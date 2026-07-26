import { ActivityHeatmap } from '../modules/activityHeatmap.js';
import streaksHandler from '../api/streaks.js';
import goalsHandler from '../api/goals.js';

describe('ActivityHeatmap Module', () => {
  test('getIntensityLevel categorizes activity count correctly', () => {
    expect(ActivityHeatmap.getIntensityLevel(0)).toBe(0);
    expect(ActivityHeatmap.getIntensityLevel(1)).toBe(1);
    expect(ActivityHeatmap.getIntensityLevel(2)).toBe(1);
    expect(ActivityHeatmap.getIntensityLevel(3)).toBe(2);
    expect(ActivityHeatmap.getIntensityLevel(5)).toBe(2);
    expect(ActivityHeatmap.getIntensityLevel(6)).toBe(3);
    expect(ActivityHeatmap.getIntensityLevel(9)).toBe(3);
    expect(ActivityHeatmap.getIntensityLevel(10)).toBe(4);
    expect(ActivityHeatmap.getIntensityLevel(25)).toBe(4);
  });

  test('calculateStats parses activity data accurately', () => {
    const heatmap = new ActivityHeatmap();
    const mockData = {
      '2026-07-20': 2,
      '2026-07-21': 4,
      '2026-07-22': 0,
      '2026-07-23': 1,
    };
    const stats = heatmap.calculateStats(mockData);
    expect(stats.totalActivities).toBe(7);
    expect(stats.activeDays).toBe(3);
  });

  test('generateGridData outputs 52 full weeks (364/371 days)', () => {
    const heatmap = new ActivityHeatmap({ weeks: 52 });
    const { grid } = heatmap.generateGridData(52, new Date('2026-07-26'));
    expect(grid.length).toBe(52);
    expect(grid[0].length).toBe(7);
  });
});

describe('Streak Multiplier & Freeze Mechanics', () => {
  beforeEach(async () => {
    global.window = global;
    window.userProgress = {
      streak: 0,
      longestStreak: 0,
      freezes: 2,
      freezeHistory: [],
      xp: 100,
      level: 1,
      studyTime: { todayMinutes: 0, totalMinutes: 0, sessionLogs: [], lastSessionDate: null },
      activityData: {},
    };
    await import('../modules/userProgress.js');
  });

  test('getStreakMultiplier calculates correct multipliers for streak tiers', () => {
    const getStreakMultiplier = window.getStreakMultiplier;
    expect(getStreakMultiplier(0)).toBe(1.0);
    expect(getStreakMultiplier(5)).toBe(1.0);
    expect(getStreakMultiplier(7)).toBe(1.2);
    expect(getStreakMultiplier(15)).toBe(1.2);
    expect(getStreakMultiplier(30)).toBe(1.5);
    expect(getStreakMultiplier(99)).toBe(1.5);
    expect(getStreakMultiplier(100)).toBe(2.0);
    expect(getStreakMultiplier(365)).toBe(2.0);
  });

  test('useStreakFreeze decrements available freezes and logs history', () => {
    const useStreakFreeze = window.useStreakFreeze;
    window.userProgress.freezes = 2;

    const result1 = useStreakFreeze();
    expect(result1).toBe(true);
    expect(window.userProgress.freezes).toBe(1);
    expect(window.userProgress.freezeHistory.length).toBe(1);

    const result2 = useStreakFreeze();
    expect(result2).toBe(true);
    expect(window.userProgress.freezes).toBe(0);

    const result3 = useStreakFreeze();
    expect(result3).toBe(false);
    expect(window.userProgress.freezes).toBe(0);
  });

  test('logStudyTime accumulates today and total study minutes', () => {
    const logStudyTime = window.logStudyTime;
    logStudyTime(25);
    expect(window.userProgress.studyTime.todayMinutes).toBe(25);
    expect(window.userProgress.studyTime.totalMinutes).toBe(25);

    logStudyTime(35);
    expect(window.userProgress.studyTime.todayMinutes).toBe(60);
    expect(window.userProgress.studyTime.totalMinutes).toBe(60);
  });
});

describe('Streaks & Goals API Routes', () => {
  function createMockRes() {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    return res;
  }

  test('GET /api/streaks returns 200 OK with streak payload', async () => {
    const req = { method: 'GET', headers: {} };
    const res = createMockRes();
    await streaksHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(typeof res.jsonData.multiplier).toBe('number');
  });

  test('GET /api/goals returns 200 OK with goals payload', async () => {
    const req = { method: 'GET', headers: {} };
    const res = createMockRes();
    await goalsHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.dailyGoals).toBeDefined();
    expect(res.jsonData.weeklyGoals).toBeDefined();
  });
});
