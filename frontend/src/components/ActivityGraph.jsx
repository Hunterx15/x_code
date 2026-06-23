import { useMemo } from "react";

// ---------------------------------------------------------------------------
// ActivityGraph — GitHub-style submission heatmap.
//
// Props:
//   data: Array<{ date: 'YYYY-MM-DD', submissions: number, accepted: number }>
//   days?: number  (default 90) — how many most-recent days to render
//   compact?: boolean — when true, renders a smaller version for dashboards
//
// The component renders a 7-row (Sun..Sat) x N-column (weeks) grid where each
// cell's color intensity reflects the submission count for that day. Empty
// days (no data) are rendered as the lowest-intensity color.
//
// We don't depend on any chart library — pure CSS grid + native title attr
// for tooltips (no extra deps).
// ---------------------------------------------------------------------------

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// 5-level intensity scale (0..4). Matches LeetCode's color ramp.
const LEVEL_COLORS = [
  "#161b22", // 0 submissions — slightly lighter than bg so cells are visible
  "#0e4429", // 1
  "#006d32", // 2
  "#26a641", // 3
  "#39d353", // 4 (highest)
];

// Map a submission count to a 0..4 intensity bucket.
// Thresholds: 0 -> 0, 1 -> 1, 2-3 -> 2, 4-6 -> 3, 7+ -> 4
const countToLevel = (count) => {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
};

const parseDate = (dateStr) => {
  // dateStr is 'YYYY-MM-DD' in UTC; parse without timezone shift.
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const ActivityGraph = ({ data = [], days = 90, compact = false }) => {
  // Take the last N days and bucket into weeks (columns).
  const { weeks, monthLabels } = useMemo(() => {
    // Build a lookup map for O(1) access.
    const lookup = new Map(
      data.map((d) => [d.date, { submissions: d.submissions, accepted: d.accepted }])
    );

    // Determine the date range: end = today (UTC), start = end - (days-1)
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    // Align start back to the most recent Sunday so weeks are complete columns.
    const startSunday = new Date(start);
    startSunday.setUTCDate(startSunday.getUTCDate() - startSunday.getUTCDay());

    // Walk forward day-by-day, grouping into 7-day columns.
    const cols = [];
    const monthLabelsArr = [];
    let cursor = new Date(startSunday);
    let currentWeek = [];
    let lastMonthLabel = -1;

    while (cursor <= end) {
      const dateStr = `${cursor.getUTCFullYear()}-${String(
        cursor.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
      const entry = lookup.get(dateStr) || { submissions: 0, accepted: 0 };

      // Only render cells that fall within our target range; earlier cells
      // (from the Sunday alignment) are rendered as "empty" placeholders so
      // the column structure stays aligned.
      const inRange = cursor >= start;
      currentWeek.push({
        date: dateStr,
        submissions: inRange ? entry.submissions : 0,
        accepted: inRange ? entry.accepted : 0,
        inRange,
      });

      // Track month label for the first cell of each week.
      if (currentWeek.length === 1) {
        const monthIdx = cursor.getUTCMonth();
        if (monthIdx !== lastMonthLabel) {
          monthLabelsArr.push({
            weekIndex: cols.length,
            label: MONTH_LABELS[monthIdx],
          });
          lastMonthLabel = monthIdx;
        }
      }

      // Advance to the next day; if we've completed a Sunday-Saturday week,
      // push the column and start a new one.
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      if (currentWeek.length === 7) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) cols.push(currentWeek);

    return { weeks: cols, monthLabels: monthLabelsArr };
  }, [data, days]);

  const cellSize = compact ? 10 : 13;
  const cellGap = compact ? 2 : 3;
  const totalCellSize = cellSize + cellGap;

  // Aggregate stats for the footer
  const totals = useMemo(() => {
    let totalSubs = 0;
    let totalAccepted = 0;
    let activeDays = 0;
    weeks.forEach((week) =>
      week.forEach((day) => {
        if (day.inRange) {
          totalSubs += day.submissions;
          totalAccepted += day.accepted;
          if (day.submissions > 0) activeDays++;
        }
      })
    );
    return { totalSubs, totalAccepted, activeDays };
  }, [weeks]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Month labels row */}
        <div
          className="flex relative h-4 mb-1"
          style={{ paddingLeft: 28 }}
        >
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="absolute text-[10px] text-zinc-500"
              style={{ left: 28 + m.weekIndex * totalCellSize }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex">
          {/* Weekday labels column */}
          <div className="flex flex-col mr-1" style={{ gap: cellGap }}>
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={label}
                className="text-[10px] text-zinc-500 flex items-center"
                style={{ height: cellSize, width: 24 }}
              >
                {i % 2 === 1 ? label : ""}
              </div>
            ))}
          </div>

          {/* Cells grid (flex of columns) */}
          <div className="flex" style={{ gap: cellGap }}>
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col" style={{ gap: cellGap }}>
                {week.map((day, dayIdx) => {
                  const level = countToLevel(day.submissions);
                  const tooltipText = day.inRange
                    ? `${day.date}: ${day.submissions} submission${
                        day.submissions === 1 ? "" : "s"
                      }, ${day.accepted} accepted`
                    : "";
                  return (
                    <div
                      key={dayIdx}
                      title={tooltipText || undefined}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: day.inRange
                          ? LEVEL_COLORS[level]
                          : "transparent",
                        borderRadius: 2,
                        cursor: day.inRange ? "pointer" : "default",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend + totals footer */}
        {!compact && (
          <div className="flex items-center justify-between mt-3 text-[10px] text-zinc-500">
            <span>
              {totals.totalSubs} submissions in the last {days} days ·{" "}
              {totals.activeDays} active days
            </span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              {LEVEL_COLORS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: cellSize - 2,
                    height: cellSize - 2,
                    backgroundColor: c,
                    borderRadius: 2,
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityGraph;
