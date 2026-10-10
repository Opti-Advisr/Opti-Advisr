import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Cloud,
  Database,
  Download,
  ExternalLink,
  Grid2X2,
  HardDrive,
  LayoutDashboard,
  LifeBuoy,
  ListFilter,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  Send,
  Server,
  Settings,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch, apiPost } from "../lib/api";
import {
  DEMO_METRICS,
  DEMO_TREND,
  DEMO_SERVICES,
  DEMO_RESOURCES,
  formatUsd,
} from "../utils/demoData";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Toaster } from "../components/ui/sonner";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "1" },
  { id: "resources", label: "Resources", icon: Server },
  { id: "advisor", label: "AI Advisor", icon: Sparkles },
  { id: "budgets", label: "Budgets", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "help", label: "Help & Support", icon: LifeBuoy },
];

function LogoMark() {
  return (
    <div className="logo-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function DemoBadge() {
  return (
    <span className="demo-badge" data-testid="demo-data-badge">
      <span className="demo-dot" /> Demo data
    </span>
  );
}

function Card({ children, className = "", testId }) {
  return (
    <section className={`console-card ${className}`} data-testid={testId}>
      {children}
    </section>
  );
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="section-title" data-testid={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function Sparkline({ values, color = "#2f6bff" }) {
  const data = values.map((value, index) => ({ index, value }));
  return (
    <div className="sparkline" aria-label="service trend sparkline" data-testid="service-trend-sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Orb({ small = false }) {
  return (
    <div className={`advisor-orb ${small ? "advisor-orb-small" : ""}`} aria-hidden="true">
      <div className="orb-highlight" />
      <span>✦</span>
    </div>
  );
}

function Sidebar({ activeView, onNavigate, collapsed, onToggle }) {
  return (
    <aside className={`app-sidebar ${collapsed ? "sidebar-collapsed" : ""}`} data-testid="app-sidebar">
      <div className="sidebar-top">
        <div className="brand-lockup" data-testid="brand-lockup">
          <LogoMark />
          <span className="sidebar-label">Opti <strong>Advisr</strong></span>
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-testid="sidebar-toggle-button"
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="nav-caption sidebar-label">Workspace</p>
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? "nav-item-active" : ""}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              data-testid={`nav-${item.id}-button`}
            >
              <Icon size={17} strokeWidth={activeView === item.id ? 2.3 : 1.8} />
              <span className="sidebar-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
        <p className="nav-caption sidebar-label nav-caption-spaced">Manage</p>
        {navItems.slice(3).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? "nav-item-active" : ""}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
              data-testid={`nav-${item.id}-button`}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-bottom sidebar-label" data-testid="budget-summary-card">
        <div className="budget-top">
          <span>October Budget</span>
          <MoreHorizontal size={15} />
        </div>
        <div className="budget-amount">
          <strong>$2.04</strong>
          <span>of $10.00</span>
        </div>
        <div className="budget-progress">
          <span style={{ width: "20.4%" }} />
        </div>
        <div className="budget-foot">
          <span>20% used</span>
          <span>On track</span>
        </div>
      </div>
      <div className="sidebar-profile" data-testid="sidebar-profile">
        <div className="avatar avatar-blue">JD</div>
        <div className="sidebar-label">
          <strong>Jordan Davis</strong>
          <span>Admin workspace</span>
        </div>
        <MoreHorizontal size={15} />
      </div>
    </aside>
  );
}

function Topbar({ onOpenWidgets, darkMode, onToggleTheme, onSearch }) {
  const [search, setSearch] = useState("");
  return (
    <header className="topbar" data-testid="top-navbar">
      <div className="mobile-menu-button">
        <Menu size={19} />
      </div>
      <div className="topbar-search">
        <Search size={16} />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            onSearch(event.target.value);
          }}
          placeholder="Search resources..."
          aria-label="Search resources"
          data-testid="resource-search-input"
        />
        <kbd>⌘K</kbd>
      </div>
      <div className="topbar-controls">
        <button className="date-control" data-testid="date-range-control">
          <CalendarDays size={15} />
          <span>Oct 1, 2026 - Oct 7, 2026</span>
          <ChevronDown size={14} />
        </button>
        <button className="granularity-control" data-testid="granularity-control">
          Daily <ChevronDown size={14} />
        </button>
        <div className="topbar-divider" />
        <Button
          variant="outline"
          className="add-widget-button"
          onClick={onOpenWidgets}
          data-testid="add-widget-button"
        >
          <Grid2X2 size={15} /> <span>Add widget</span>
        </Button>
        <Button
          className="export-button"
          onClick={() => {
            const blob = new Blob(
              ["Opti Advisr demo export\nTotal spend,$26.48\nBudget spent,$2.04"],
              { type: "text/csv" }
            );
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "opti-advisr-export.csv";
            link.click();
            toast.success("Spend report exported");
          }}
          data-testid="export-button"
        >
          <Download size={15} /> <span>Export</span>
        </Button>
        <button
          className="icon-button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          data-testid="theme-toggle-button"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          className="icon-button notification-button"
          aria-label="Notifications"
          data-testid="notifications-button"
        >
          <Bell size={17} />
          <i />
        </button>
        <div className="avatar avatar-blue top-avatar" data-testid="user-avatar">
          JD
        </div>
      </div>
    </header>
  );
}

function MetricCard({ label, value, detail, badge, icon: Icon, tone = "blue", testId }) {
  return (
    <Card className="metric-card" testId={testId}>
      <div className={`metric-icon metric-icon-${tone}`}>
        <Icon size={16} />
      </div>
      <p className="metric-label">{label}</p>
      <div className="metric-value" data-testid={`${testId}-value`}>
        {value}
      </div>
      <div className="metric-meta">
        {badge && (
          <span
            className={`change-pill ${
              badge.startsWith("+") ? "change-negative" : "change-neutral"
            }`}
          >
            <ArrowUpRight size={11} />
            {badge}
          </span>
        )}
        <span>{detail}</span>
      </div>
    </Card>
  );
}

function SpendTrendCard({ trend }) {
  return (
    <Card className="trend-card" testId="spend-trend-card">
      <SectionHeading
        eyebrow="COST OVERVIEW"
        title="Spend Trend"
        action={
          <div className="chart-legend">
            <span>
              <i className="legend-dot blue" />
              This period
            </span>
            <span>
              <i className="legend-dot gray" />
              Previous period
            </span>
          </div>
        }
      />
      <div className="trend-summary">
        <div>
          <strong>$26.48</strong>
          <span className="positive-text">
            <ArrowUpRight size={14} /> 12.0% vs. prior period
          </span>
        </div>
        <button
          className="more-button"
          aria-label="More spend trend options"
          data-testid="spend-trend-more-button"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="chart-wrap trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 12, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2f6bff" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2f6bff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#edf2f7" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              cursor={{ stroke: "#dbe5ff", strokeWidth: 1 }}
              content={<SpendTooltip />}
            />
            <Area
              type="monotone"
              dataKey="this_period"
              stroke="#2f6bff"
              strokeWidth={2.5}
              fill="url(#spendFill)"
              name="This period"
            />
            <Line
              type="monotone"
              dataKey="previous_period"
              stroke="#a9b4c5"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Previous period"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SpendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}, 2026</strong>
      {payload.map((entry) => (
        <div key={entry.name}>
          <i style={{ background: entry.color }} />
          {entry.name === "This period" ? "This period" : "Previous"}:{" "}
          <b>{formatUsd(entry.value)}</b>
        </div>
      ))}
    </div>
  );
}

function WeekdayCard({ metrics }) {
  const maxDay = useMemo(
    () => Math.max(...metrics.weekday.map((item) => item.amount)),
    [metrics.weekday]
  );
  return (
    <Card className="weekday-card" testId="weekday-spend-card">
      <SectionHeading
        title="Spend by Weekday"
        action={
          <button
            className="more-button"
            aria-label="More weekday options"
            data-testid="weekday-more-button"
          >
            <MoreHorizontal size={18} />
          </button>
        }
      />
      <div className="chart-wrap weekday-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics.weekday} margin={{ top: 18, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#edf2f7" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "#f5f7fb" }}
              formatter={(value) => [formatUsd(value), "Spend"]}
            />
            <Bar
              dataKey="amount"
              radius={[5, 5, 2, 2]}
              label={{
                position: "top",
                fill: "#64748b",
                fontSize: 10,
                formatter: (value) => (value === maxDay ? formatUsd(Number(value)) : ""),
              }}
            >
              {metrics.weekday.map((item) => (
                <Cell key={item.day} fill={item.amount === maxDay ? "#2f6bff" : "#dce6f8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SavingsCard({ metrics }) {
  return (
    <Card className="savings-card" testId="savings-opportunity-card">
      <div className="savings-copy">
        <div className="eyebrow">OPTIMIZATION TARGET</div>
        <h2 className="section-title">Savings Opportunity</h2>
        <p>
          On track for <strong>$10/mo target</strong>
        </p>
        <button className="text-link" data-testid="show-savings-details-button">
          Show details <ArrowUpRight size={13} />
        </button>
      </div>
      <div
        className="gauge"
        style={{ "--gauge": `${metrics.savings_opportunity_percent * 3.6}deg` }}
      >
        <div>
          <strong>{metrics.savings_opportunity_percent}%</strong>
          <span>optimized</span>
        </div>
      </div>
    </Card>
  );
}

function ForecastCard({ trend, metrics }) {
  const observedSpend = trend.reduce((total, point) => total + point.this_period, 0);
  const dailyAverage = observedSpend / trend.length;
  const monthEndEstimate = dailyAverage * 31;
  const remainingBudget = monthEndEstimate - metrics.budget;
  const forecastData = [
    ...trend.map((point) => ({
      date: point.date,
      actual: point.this_period,
      projected: point.this_period,
    })),
    ...Array.from({ length: 24 }, (_, index) => ({
      date: `Oct ${index + 8}`,
      actual: null,
      projected: dailyAverage,
    })),
  ];

  return (
    <Card className="forecast-card" testId="usage-forecast-card">
      <div className="forecast-header">
        <div>
          <div className="eyebrow">ADDED WIDGET / #FORECASTS</div>
          <h2 className="section-title">Usage Forecast</h2>
          <p className="forecast-subtitle">
            Estimated month-end spend from your current daily trend.
          </p>
        </div>
        <span className="forecast-status">
          <TrendingUp size={13} /> On pace
        </span>
      </div>
      <div className="forecast-summary">
        <div>
          <span className="forecast-label">Projected October total</span>
          <strong data-testid="forecast-total-value">
            {formatUsd(monthEndEstimate)}
          </strong>
          <span className="forecast-note">
            {formatUsd(dailyAverage)} daily average · {trend.length} days observed
          </span>
        </div>
        <div className="forecast-budget-callout">
          <span>vs. $10 budget</span>
          <strong className="forecast-overage">+{formatUsd(remainingBudget)}</strong>
          <span>at current usage</span>
        </div>
      </div>
      <div className="chart-wrap forecast-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecastData} margin={{ top: 10, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#edf2f7" />
            <XAxis
              dataKey="date"
              interval={4}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value, name) => [
                formatUsd(value),
                name === "actual" ? "Observed" : "Projected",
              ]}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#2f6bff"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              name="actual"
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#8aaeff"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="projected"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="forecast-footer">
        <span>
          <i className="legend-dot blue" />
          Observed
        </span>
        <span>
          <i className="legend-dot gray" />
          Projected daily run rate
        </span>
        <span className="forecast-budget-note">
          Forecast is a demo estimate, not a billing commitment.
        </span>
      </div>
    </Card>
  );
}

function ResourcesSummary({ metrics }) {
  const total = 6;
  return (
    <Card className="resource-summary-card" testId="resources-summary-card">
      <SectionHeading
        title="Resources"
        action={
          <button className="text-link" data-testid="view-all-resources-button">
            View all <ArrowUpRight size={13} />
          </button>
        }
      />
      <div className="resource-stat-list">
        {metrics.resource_summary.map((item) => (
          <div
            className="resource-stat"
            key={item.kind}
            data-testid={`resource-summary-${item.color}`}
          >
            <div className={`resource-stat-icon ${item.color}`}>
              <Cloud size={15} />
            </div>
            <div className="resource-stat-info">
              <div>
                <strong>{item.count}</strong>
                <span>{item.kind}</span>
              </div>
              <div className="mini-progress">
                <span
                  className={item.color}
                  style={{ width: `${(item.count / total) * 100}%` }}
                />
              </div>
            </div>
            <span className="resource-percent">
              {Math.round((item.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ServicesTable({ services }) {
  return (
    <Card className="services-card" testId="top-services-card">
      <SectionHeading
        title="Top Services by Cost"
        action={
          <button
            className="more-button"
            aria-label="More service options"
            data-testid="services-more-button"
          >
            <MoreHorizontal size={18} />
          </button>
        }
      />
      <div className="table-scroll">
        <table className="services-table">
          <thead>
            <tr>
              <th>SERVICE</th>
              <th>COST</th>
              <th>SHARE</th>
              <th>TREND</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr
                key={service.service}
                data-testid={`service-row-${service.service.toLowerCase().replaceAll(" ", "-")}`}
              >
                <td>
                  <span className="service-dot" />
                  {service.service}
                </td>
                <td>
                  <strong>{formatUsd(service.cost)}</strong>
                </td>
                <td>
                  <span className="share-value">{service.share}%</span>
                  <div className="share-track">
                    <span style={{ width: `${service.share}%` }} />
                  </div>
                </td>
                <td>
                  <Sparkline values={service.trend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AdvisorCard({ onAsk }) {
  const [prompt, setPrompt] = useState("");
  const submit = () => {
    if (!prompt.trim()) return;
    onAsk(prompt.trim());
    setPrompt("");
  };
  return (
    <Card className="advisor-card" testId="dashboard-advisor-card">
      <div className="advisor-card-top">
        <div>
          <div className="eyebrow">INTELLIGENT INSIGHTS</div>
          <h2 className="section-title">AI Cost Advisor</h2>
        </div>
        <Orb small />
      </div>
      <div className="advisor-exchange">
        <div className="user-question">
          <div className="avatar avatar-light">JD</div>
          <span>Which resources can I stop?</span>
        </div>
        <div className="advisor-answer">
          <Orb small />
          <p>
            <strong>demo-server (t3.micro)</strong> averaged 1.8% CPU over 7 days. You could save{" "}
            <strong>$6.30/mo</strong> by stopping it.
          </p>
        </div>
      </div>
      <div className="advisor-input">
        <Input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder="Ask about your AWS costs..."
          aria-label="Ask about your AWS costs"
          data-testid="dashboard-advisor-input"
        />
        <button
          onClick={submit}
          aria-label="Send advisor question"
          data-testid="dashboard-advisor-send-button"
        >
          <Send size={15} />
        </button>
      </div>
      <button className="advisor-open-link" data-testid="open-advisor-view-button">
        Open full advisor <ExternalLink size={12} />
      </button>
    </Card>
  );
}

function Dashboard({ metrics, trend, services, onAsk, showForecast }) {
  return (
    <div className="page-stack" data-testid="dashboard-view">
      <div className="page-intro">
        <div>
          <p className="eyebrow">OVERVIEW / OCTOBER 2026</p>
          <h1 data-testid="dashboard-title">
            Good morning, Jordan <span className="wave">✦</span>
          </h1>
          <p className="page-subtitle">Here’s what’s happening with your cloud spend this week.</p>
        </div>
        <DemoBadge />
      </div>
      <div className="metrics-grid">
        <MetricCard
          label="Total Spend"
          value="$26.48"
          badge="+12.0%"
          detail="vs. prior 7 days"
          icon={Activity}
          tone="blue"
          testId="total-spend-metric"
        />
        <MetricCard
          label="Top Service"
          value="$14.62"
          badge="55.2%"
          detail="EC2 Compute"
          icon={Cloud}
          tone="purple"
          testId="top-service-metric"
        />
        <MetricCard
          label="Daily Average"
          value="$1.89"
          detail="across 7 days"
          icon={TrendingUp}
          tone="green"
          testId="daily-average-metric"
        />
        <MetricCard
          label="Idle Candidates"
          value="1"
          badge="~$6.30/mo"
          detail="savings found"
          icon={AlertTriangle}
          tone="orange"
          testId="idle-candidates-metric"
        />
      </div>
      <div className="dashboard-grid dashboard-grid-top">
        <SpendTrendCard trend={trend} />
        <div className="dashboard-side-stack">
          <WeekdayCard metrics={metrics} />
          <SavingsCard metrics={metrics} />
        </div>
      </div>
      {showForecast && <ForecastCard trend={trend} metrics={metrics} />}
      <div className="dashboard-grid dashboard-grid-bottom">
        <div className="left-stack">
          <ResourcesSummary metrics={metrics} />
          <ServicesTable services={services} />
        </div>
        <AdvisorCard onAsk={onAsk} />
      </div>
    </div>
  );
}

function stateLabel(state) {
  return state === "available" ? "Available" : state.charAt(0).toUpperCase() + state.slice(1);
}

function ResourcesView({ resources, onStateChange, onTerminate }) {
  const [tab, setTab] = useState("EC2");
  const filtered = resources.filter((resource) => resource.kind === tab);
  return (
    <div className="page-stack" data-testid="resources-view">
      <div className="page-intro">
        <div>
          <p className="eyebrow">WORKSPACE / INVENTORY</p>
          <h1 data-testid="resources-title">Resources</h1>
          <p className="page-subtitle">
            Review your AWS footprint and take action on idle infrastructure.
          </p>
        </div>
        <DemoBadge />
      </div>
      <Card className="resources-table-card" testId="resources-table-card">
        <div className="resource-view-toolbar">
          <div>
            <h2 className="section-title">Cloud resources</h2>
            <p className="muted-copy">6 resources connected to this demo workspace</p>
          </div>
          <Button variant="outline" data-testid="resource-filter-button">
            <ListFilter size={15} /> Filters
          </Button>
        </div>
        <div className="resource-tabs" role="tablist">
          {["EC2", "RDS", "S3"].map((item) => (
            <button
              key={item}
              className={tab === item ? "resource-tab-active" : ""}
              onClick={() => setTab(item)}
              role="tab"
              aria-selected={tab === item}
              data-testid={`resource-tab-${item.toLowerCase()}`}
            >
              {item}
              <span>{resources.filter((resource) => resource.kind === item).length}</span>
            </button>
          ))}
        </div>
        <div className="table-scroll">
          <table className="resources-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>RESOURCE ID</th>
                <th>SIZE</th>
                <th>STATE</th>
                <th>MONTHLY SAVINGS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((resource) => (
                <tr key={resource.id} data-testid={`resource-row-${resource.id}`}>
                  <td>
                    <div className="resource-name">
                      <div className={`resource-kind-icon ${resource.kind.toLowerCase()}`}>
                        {resource.kind === "EC2" ? (
                          <Server size={15} />
                        ) : resource.kind === "RDS" ? (
                          <Database size={15} />
                        ) : (
                          <HardDrive size={15} />
                        )}
                      </div>
                      <strong>{resource.name}</strong>
                    </div>
                  </td>
                  <td>
                    <code>{resource.resource_id}</code>
                  </td>
                  <td>{resource.size}</td>
                  <td>
                    <span className={`state-pill ${resource.state}`}>
                      {resource.state === "running" && <i />}
                      {stateLabel(resource.state)}
                    </span>
                  </td>
                  <td>
                    {resource.monthly_savings ? (
                      <span className="savings-value">
                        {formatUsd(resource.monthly_savings)}/mo
                      </span>
                    ) : (
                      <span className="muted-copy">—</span>
                    )}
                  </td>
                  <td>
                    <div className="resource-actions">
                      {resource.kind === "EC2" && (
                        <button
                          className="small-action"
                          onClick={() => onStateChange(resource)}
                          data-testid={`resource-${resource.id}-toggle-button`}
                        >
                          {resource.state === "running" ? "Stop" : "Start"}
                        </button>
                      )}
                      <button
                        className="terminate-action"
                        onClick={() => onTerminate(resource)}
                        data-testid={`resource-${resource.id}-terminate-button`}
                      >
                        <Trash2 size={13} /> Terminate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">No resources in this tab.</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function TerminateModal({ resource, onClose, onConfirm }) {
  const [understood, setUnderstood] = useState(false);
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminate-title"
        data-testid="terminate-confirmation-modal"
      >
        <div className="modal-icon">
          <Trash2 size={19} />
        </div>
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close confirmation"
          data-testid="terminate-modal-close-button"
        >
          <X size={18} />
        </button>
        <h2 id="terminate-title">Terminate {resource.name}?</h2>
        <p>
          This action permanently removes the resource from your AWS environment. It cannot be
          undone.
        </p>
        <div className="confirm-resource">
          <div className="resource-kind-icon ec2">
            <Server size={15} />
          </div>
          <div>
            <strong>{resource.name}</strong>
            <code>{resource.resource_id}</code>
          </div>
        </div>
        <label className="confirm-check">
          <Checkbox
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(checked === true)}
            data-testid="terminate-permanent-checkbox"
          />
          <span>I understand this is permanent</span>
        </label>
        <div className="modal-actions">
          <Button variant="outline" onClick={onClose} data-testid="terminate-cancel-button">
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!understood}
            onClick={onConfirm}
            data-testid="terminate-confirm-button"
          >
            Terminate resource
          </Button>
        </div>
      </div>
    </div>
  );
}

const suggestedPrompts = [
  "Which resources can I stop to save money?",
  "Why did costs go up this week?",
  "How am I tracking against budget?",
];

function AdvisorView({ messages, isTyping, onAsk }) {
  const [input, setInput] = useState("");
  const send = (value = input) => {
    if (!value.trim()) return;
    onAsk(value.trim());
    setInput("");
  };
  return (
    <div className="page-stack advisor-page" data-testid="advisor-view">
      <div className="page-intro">
        <div>
          <p className="eyebrow">INTELLIGENCE / READ-ONLY</p>
          <h1 data-testid="advisor-title">AI Cost Advisor</h1>
          <p className="page-subtitle">
            Ask questions about your AWS spend and uncover your next best action.
          </p>
        </div>
        <div className="advisor-page-badge">
          <Orb small /> <span>Advisor online</span>
        </div>
      </div>
      <Card className="chat-card" testId="advisor-chat-card">
        <div className="chat-header">
          <div className="chat-agent">
            <Orb />
            <div>
              <strong>Opti Advisor</strong>
              <span>Cost intelligence assistant</span>
            </div>
          </div>
          <span className="online-dot">Live demo</span>
        </div>
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="welcome-orb">
                <Orb />
              </div>
              <h2>What can I help you optimize?</h2>
              <p>Use a suggested question or ask about your current cloud spend.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              className={`chat-message ${message.role}`}
              key={`${message.role}-${index}`}
              data-testid={`advisor-message-${index}`}
            >
              <div className="message-avatar">
                {message.role === "advisor" ? (
                  <Orb small />
                ) : (
                  <div className="avatar avatar-blue">JD</div>
                )}
              </div>
              <div className="message-bubble">{message.content}</div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-message advisor">
              <div className="message-avatar">
                <Orb small />
              </div>
              <div className="message-bubble typing">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
        </div>
        <div className="suggested-prompts">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              data-testid={`suggested-prompt-${prompt.slice(0, 12).toLowerCase().replaceAll(" ", "-")}`}
            >
              {prompt}
              <ArrowUpRight size={13} />
            </button>
          ))}
        </div>
        <div className="chat-composer">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && send()}
            placeholder="Ask about your AWS costs..."
            aria-label="Advisor message"
            data-testid="advisor-message-input"
          />
          <button onClick={() => send()} aria-label="Send message" data-testid="advisor-send-button">
            <Send size={16} />
          </button>
        </div>
        <p className="read-only-disclaimer">
          <CircleHelp size={13} /> The advisor is read-only. It won’t make changes to your AWS account.
        </p>
      </Card>
    </div>
  );
}

const widgets = [
  {
    title: "Cost by Service",
    description: "Break down spend across AWS services.",
    tag: "#Costs",
    icon: BarChart3,
    tone: "blue",
  },
  {
    title: "Daily Spend Trend",
    description: "Track spend movement across the week.",
    tag: "#Costs",
    icon: TrendingUp,
    tone: "purple",
  },
  {
    title: "Idle Resource Finder",
    description: "Find running instances with low CPU you can stop.",
    tag: "#Savings",
    icon: Zap,
    tone: "orange",
  },
  {
    title: "Budget Tracker",
    description: "Month-to-date spend against your $10 budget.",
    tag: "#Budgets",
    icon: Activity,
    tone: "green",
  },
  {
    title: "Usage Forecast",
    description: "Estimate month-end spend from current daily trends.",
    tag: "#Forecasts",
    icon: TrendingUp,
    tone: "blue",
  },
];

function WidgetDrawer({ onClose, selectedWidgets, onSelectWidget }) {
  const [search, setSearch] = useState("");
  const filteredWidgets = widgets.filter((widget) =>
    widget.title.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside className="widget-drawer" data-testid="widget-drawer">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">PERSONALIZE</p>
            <h2>Add widget</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close widget panel"
            data-testid="widget-drawer-close-button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="widget-search">
          <Search size={15} />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search widgets..."
            aria-label="Search widgets"
            data-testid="widget-search-input"
          />
        </div>
        <div className="quick-widget-grid">
          {["Cost Anomaly", "Forecast", "Tag Coverage", "Rightsizing"].map((item, index) => (
            <button key={item} data-testid={`quick-widget-${index}`}>
              <span className={`quick-icon quick-icon-${index}`}>
                <Sparkles size={13} />
              </span>
              <strong>{item}</strong>
              <Plus size={14} />
            </button>
          ))}
        </div>
        <div className="drawer-section-title">
          <span>Recommended for you</span>
          <span>{filteredWidgets.length} widgets</span>
        </div>
        <div className="widget-list">
          {filteredWidgets.map((widget) => {
            const Icon = widget.icon;
            const isSelected = selectedWidgets.includes(widget.title);
            return (
              <div
                className="widget-item"
                key={widget.title}
                data-testid={`widget-card-${widget.title.toLowerCase().replaceAll(" ", "-")}`}
              >
                <div className={`widget-preview ${widget.tone}`}>
                  <Icon size={17} />
                  <div className="preview-bars">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="widget-copy">
                  <div>
                    <strong>{widget.title}</strong>
                    <span className="widget-tag">{widget.tag}</span>
                  </div>
                  <p>{widget.description}</p>
                </div>
                <Button
                  size="sm"
                  disabled={isSelected}
                  onClick={() => {
                    onSelectWidget(widget.title);
                    toast.success(`${widget.title} added to dashboard`);
                  }}
                  data-testid={`widget-select-${widget.title.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {isSelected ? (
                    <>
                      <Check size={12} /> Added
                    </>
                  ) : (
                    "Select"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function PlaceholderView({ view }) {
  const copy = {
    budgets: {
      icon: BarChart3,
      title: "Budgets",
      description: "Budget controls and threshold alerts are ready for your workspace.",
    },
    settings: {
      icon: Settings,
      title: "Settings",
      description: "Workspace preferences will live here when you connect a production account.",
    },
    help: {
      icon: LifeBuoy,
      title: "Help & Support",
      description: "Need a hand? The demo is configured with realistic AWS cost data to explore.",
    },
  };
  const item = copy[view] || copy.budgets;
  const Icon = item.icon;
  return (
    <div className="page-stack" data-testid={`${view}-view`}>
      <div className="page-intro">
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <h1>{item.title}</h1>
          <p className="page-subtitle">{item.description}</p>
        </div>
        <DemoBadge />
      </div>
      <Card className="placeholder-card">
        <div className="placeholder-icon">
          <Icon size={24} />
        </div>
        <h2>{item.title} workspace</h2>
        <p>{item.description}</p>
        <Button onClick={() => toast.message("This demo surface is ready for your real API")}>
          Explore demo
        </Button>
      </Card>
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [resources, setResources] = useState(DEMO_RESOURCES);
  const [metrics, setMetrics] = useState(DEMO_METRICS);
  const [trend, setTrend] = useState(DEMO_TREND);
  const [services, setServices] = useState(DEMO_SERVICES);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Initial load with API attempt, fallback to demo data
  useEffect(() => {
    apiGet("/metrics/spend")
      .then((data) => data && setMetrics(data))
      .catch(() => {});
    apiGet("/metrics/trend")
      .then((data) => data && setTrend(data))
      .catch(() => {});
    apiGet("/metrics/services")
      .then((data) => data && setServices(data))
      .catch(() => {});
    apiGet("/resources")
      .then((data) => data && setResources(data))
      .catch(() => {});
  }, []);

  const handleStateChange = async (resource) => {
    const nextState = resource.state === "running" ? "stopped" : "running";
    try {
      await apiPatch(`/resources/${resource.id}/state`, { state: nextState });
    } catch (e) {
      // Local state fallback
    }
    setResources((prev) =>
      prev.map((r) => (r.id === resource.id ? { ...r, state: nextState } : r))
    );
    toast.success(`${resource.name} is now ${nextState}`);
  };

  const handleTerminate = async (resourceId) => {
    try {
      await apiDelete(`/resources/${resourceId}`);
    } catch (e) {
      // Local state fallback
    }
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    setTerminateTarget(null);
    toast.success("Resource terminated in demo workspace");
  };

  const askAdvisor = async (prompt) => {
    setMessages((curr) => [...curr, { role: "user", content: prompt }]);
    setIsTyping(true);

    try {
      const res = await apiPost("/advisor/chat", { prompt });
      setMessages((curr) => [...curr, { role: "advisor", content: res.reply }]);
    } catch (err) {
      setTimeout(() => {
        let simulatedReply =
          "Based on your current spend patterns, EC2 Compute accounts for 55.2% of your monthly expenditure. Consider right-sizing instances or leveraging Savings Plans for up to 32% reduced cost.";
        if (prompt.toLowerCase().includes("stop") || prompt.toLowerCase().includes("idle")) {
          simulatedReply =
            "demo-server (t3.micro) averaged 1.8% CPU over 7 days. You could save $6.30/mo by stopping it.";
        } else if (prompt.toLowerCase().includes("budget")) {
          simulatedReply =
            "You have spent $2.04 of your $10.00 October budget (20.4%). You are currently on track to stay within limits.";
        } else if (prompt.toLowerCase().includes("up") || prompt.toLowerCase().includes("increase")) {
          simulatedReply =
            "Spend increased by 12.0% on Oct 6-7 primarily due to data transfer and batch workloads on demo-server.";
        }
        setMessages((curr) => [...curr, { role: "advisor", content: simulatedReply }]);
        setIsTyping(false);
      }, 700);
      return;
    }
    setIsTyping(false);
  };

  const selectWidget = (title) =>
    setSelectedWidgets((current) =>
      current.includes(title) ? current : [...current, title]
    );

  return (
    <div className="console-shell">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <div className="app-main">
        <Topbar
          onOpenWidgets={() => setWidgetOpen(true)}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode((value) => !value)}
          onSearch={() => undefined}
        />
        <main className="main-content">
          {activeView === "dashboard" && (
            <Dashboard
              metrics={metrics}
              trend={trend}
              services={services}
              onAsk={askAdvisor}
              showForecast={selectedWidgets.includes("Usage Forecast")}
            />
          )}
          {activeView === "resources" && (
            <ResourcesView
              resources={resources}
              onStateChange={handleStateChange}
              onTerminate={setTerminateTarget}
            />
          )}
          {activeView === "advisor" && (
            <AdvisorView
              messages={messages}
              isTyping={isTyping}
              onAsk={askAdvisor}
            />
          )}
          {["budgets", "settings", "help"].includes(activeView) && (
            <PlaceholderView view={activeView} />
          )}
        </main>
      </div>
      {widgetOpen && (
        <WidgetDrawer
          onClose={() => setWidgetOpen(false)}
          selectedWidgets={selectedWidgets}
          onSelectWidget={selectWidget}
        />
      )}
      {terminateTarget && (
        <TerminateModal
          resource={terminateTarget}
          onClose={() => setTerminateTarget(null)}
          onConfirm={() => handleTerminate(terminateTarget.id)}
        />
      )}
      <Toaster richColors />
    </div>
  );
}
