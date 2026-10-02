import type { WeekPoint } from "../utils/calculations";
import { formatCurrency, formatNumber } from "../utils/format";

const SLOT = 64; // عرض كل أسبوع
const BAR = 34; // عرض العمود
const HEIGHT = 230;
const TOP = 26;
const BOTTOM = 40;

// 5500 → 5.5k
function compact(value: number) {
  return Math.abs(value) >= 1000
    ? `${formatNumber(Math.round(value / 100) / 10)}k`
    : formatNumber(value);
}

function WeeklyChart({ data }: { data: WeekPoint[] }) {
  if (data.length === 0) {
    return <p className="state">لا توجد بيانات كافية للرسم</p>;
  }

  const max = Math.max(0, ...data.map((d) => d.net));
  const min = Math.min(0, ...data.map((d) => d.net));
  const scale = (HEIGHT - TOP - BOTTOM) / (max - min || 1);
  const zeroY = TOP + max * scale; // خط الصفر
  const width = data.length * SLOT;

  return (
    // الرسم بيمشي من الأقدم للأحدث (يسار ← يمين) حتى في الصفحة العربي
    <div className="chart-scroll" dir="ltr">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label="الصافي الأسبوعي: قيمة الشغل ناقص الدفعات"
      >
        <line x1={0} x2={width} y1={zeroY} y2={zeroY} className="chart-axis" />

        {data.map((d, i) => {
          const h = Math.abs(d.net) * scale;
          const x = i * SLOT + (SLOT - BAR) / 2;
          const y = d.net >= 0 ? zeroY - h : zeroY;
          const labelY = d.net >= 0 ? y - 6 : y + h + 14;
          const tone = d.net > 0 ? "bar-pos" : d.net < 0 ? "bar-neg" : "bar-zero";

          return (
            <g key={d.weekStart}>
              <title>
                {`أسبوع ${d.weekStart}\nالشغل: ${formatCurrency(d.work)}\nالدفعات: ${formatCurrency(d.payments)}\nالصافي: ${formatCurrency(d.net)}`}
              </title>
              <rect
                x={x}
                y={y}
                width={BAR}
                height={d.net === 0 ? 2 : Math.max(h, 2)}
                rx={4}
                className={tone}
              />
              <text x={i * SLOT + SLOT / 2} y={labelY} textAnchor="middle" className="chart-value">
                {compact(d.net)}
              </text>
              <text x={i * SLOT + SLOT / 2} y={HEIGHT - 10} textAnchor="middle" className="chart-label">
                {d.weekStart.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default WeeklyChart;
