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
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ThemeProvider,
  CssBaseline,
  Card as MuiCard,
  CardContent,
  Typography,
  Button as MuiButton,
  IconButton,
  InputBase,
  Paper,
  Box,
  Chip,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Badge,
  Tooltip,
  LinearProgress,
} from "@mui/material";
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
import { getAppTheme } from "../theme/theme";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "1" },
  { id: "resources", label: "Resources", icon: Server },
  { id: "advisor", label: "AI Advisor", icon: Sparkles },
  { id: "budgets", label: "Budgets", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

function LogoMark() {
  return (
    <img
      src="/logo.jpg"
      alt="Opti Advisr Logo"
      className="logo-mark"
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}

function DemoBadge() {
  return null;
}

function Card({ children, className = "", testId, sx = {} }) {
  return (
    <MuiCard
      className={`console-card ${className}`}
      data-testid={testId}
      sx={{
        borderRadius: "14px",
        overflow: "hidden",
        ...sx,
      }}
    >
      {children}
    </MuiCard>
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
  const points = values.map((val, index) => ({ x: index, y: val }));
  return (
    <div className="sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Orb({ small = false }) {
  return (
    <div className={small ? "advisor-orb advisor-orb-small" : "advisor-orb"}>
      <div className="orb-highlight" />
      <span>✦</span>
    </div>
  );
}

function SidebarContent({ activeView, onNavigate, collapsed, onToggle, isMobile = false, onCloseMobile }) {
  const handleNavClick = (id) => {
    onNavigate(id);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <div className={`sidebar-inner-container ${collapsed ? "sidebar-collapsed-inner" : ""}`} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="sidebar-top">
        <div className="brand-lockup" data-testid="brand-lockup">
          <LogoMark />
          <span className="sidebar-label">Opti <strong>Advisr</strong></span>
        </div>
        {isMobile ? (
          <IconButton
            onClick={onCloseMobile}
            aria-label="Close navigation"
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <X size={18} />
          </IconButton>
        ) : (
          <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
            <IconButton
              className="sidebar-toggle"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              data-testid="sidebar-toggle-button"
              size="small"
              sx={{ color: "text.secondary" }}
            >
              {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </IconButton>
          </Tooltip>
        )}
      </div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="nav-caption sidebar-label">Workspace</p>
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? "nav-item-active" : ""}`}
              onClick={() => handleNavClick(item.id)}
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
              onClick={() => handleNavClick(item.id)}
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
        <Box sx={{ width: "100%", mt: 1, mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={20.4}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "rgba(47, 107, 255, 0.15)",
              "& .MuiLinearProgress-bar": { backgroundColor: "#2f6bff", borderRadius: 3 },
            }}
          />
        </Box>
        <div className="budget-foot">
          <span>20% used</span>
          <span>On track</span>
        </div>
      </div>
      <div className="sidebar-profile" data-testid="sidebar-profile">
        <div className="avatar avatar-blue">OA</div>
        <div className="sidebar-label">
          <strong>Opti Advisr Team</strong>
          <span>AWS Workspace (ap-south-1)</span>
        </div>
        <MoreHorizontal size={15} />
      </div>
    </div>
  );
}

function Sidebar({ activeView, onNavigate, collapsed, onToggle }) {
  return (
    <aside className={`app-sidebar ${collapsed ? "sidebar-collapsed" : ""}`} data-testid="app-sidebar">
      <SidebarContent
        activeView={activeView}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggle={onToggle}
      />
    </aside>
  );
}

function Topbar({ onOpenWidgets, darkMode, onToggleTheme, onSearch, onOpenMobileNav }) {
  const [search, setSearch] = useState("");
  return (
    <header className="topbar" data-testid="app-topbar">
      <div className="mobile-menu-button">
        <IconButton
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          size="small"
          data-testid="mobile-menu-toggle"
          sx={{ color: "text.secondary", p: 0.5 }}
        >
          <Menu size={20} />
        </IconButton>
      </div>
      <Box
        className="topbar-search"
        sx={{
          border: darkMode ? "1.5px solid #ffffff !important" : "1.5px solid #000000 !important",
          background: darkMode ? "rgba(255,255,255,0.06) !important" : "#ffffff !important",
          borderRadius: "8px",
          px: 1.5,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          maxWidth: 340,
          flex: 1,
        }}
      >
        <Search size={16} />
        <InputBase
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            onSearch(event.target.value);
          }}
          placeholder="Search resources..."
          inputProps={{ "aria-label": "Search resources" }}
          data-testid="resource-search-input"
          sx={{
            flex: 1,
            fontSize: "13px",
            color: "inherit",
          }}
        />
        <kbd>⌘K</kbd>
      </Box>
      <div className="topbar-controls">
        <MuiButton
          variant="text"
          className="date-control"
          data-testid="date-range-control"
          startIcon={<CalendarDays size={15} />}
          endIcon={<ChevronDown size={14} />}
          sx={{
            color: "text.secondary",
            fontSize: "13px",
            textTransform: "none",
            px: 1,
          }}
        >
          01/10/2026 - 12/10/2026
        </MuiButton>
        <MuiButton
          variant="text"
          className="granularity-control"
          data-testid="granularity-control"
          endIcon={<ChevronDown size={14} />}
          sx={{
            color: "text.secondary",
            fontSize: "13px",
            textTransform: "none",
            px: 1,
          }}
        >
          Daily
        </MuiButton>
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
        <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
          <IconButton
            className="icon-button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            data-testid="theme-toggle-button"
            size="small"
            sx={{ color: "text.secondary" }}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Notifications">
          <IconButton
            className="icon-button notification-button"
            aria-label="View notifications"
            data-testid="notification-button"
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <Badge color="error" variant="dot">
              <Bell size={17} />
            </Badge>
          </IconButton>
        </Tooltip>
        <div className="avatar avatar-light top-avatar">OA</div>
      </div>
    </header>
  );
}

function MetricCard({
  label,
  value,
  detail,
  badge,
  icon: Icon,
  tone = "blue",
  testId,
}) {
  return (
    <Card className="metric-card" testId={testId}>
      <div className={`metric-icon metric-icon-${tone}`}>
        <Icon size={17} />
      </div>
      <p className="metric-label">{label}</p>
      <div className="metric-value" data-testid={`${testId}-value`}>
        {value}
      </div>
      <div className="metric-meta">
        {badge && (
          <Chip
            size="small"
            icon={<ArrowUpRight size={11} />}
            label={badge}
            className={`change-pill ${
              badge.startsWith("+") ? "change-negative" : "change-neutral"
            }`}
            sx={{
              height: 22,
              fontSize: "11px",
              fontWeight: 500,
              "& .MuiChip-icon": { ml: "4px" },
            }}
          />
        )}
        <span>{detail}</span>
      </div>
    </Card>
  );
}

function SpendTrendCard({ trend, totalSpend }) {
  const currentTotal = totalSpend !== undefined ? totalSpend : 26.48;
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
          <strong>{formatUsd(currentTotal)}</strong>
          <span className="positive-text">
            <ArrowUpRight size={14} /> Month-to-date (AWS)
          </span>
        </div>
        <IconButton
          className="more-button"
          aria-label="More spend trend options"
          data-testid="spend-trend-more-button"
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <MoreHorizontal size={18} />
        </IconButton>
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
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="chart-tooltip">
                      <strong>{payload[0].payload.date}</strong>
                      <div>
                        <i style={{ background: "#2f6bff" }} />
                        <span>This period: <b>${payload[0].value}</b></span>
                      </div>
                      {payload[1] && (
                        <div>
                          <i style={{ background: "#a9b4c5" }} />
                          <span>Previous: <b>${payload[1].value}</b></span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="this_period"
              stroke="#2f6bff"
              strokeWidth={2.4}
              fill="url(#spendFill)"
            />
            <Line
              type="monotone"
              dataKey="previous_period"
              stroke="#a9b4c5"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function WeekdayCard({ metrics }) {
  const weekdayData = metrics?.weekday || [
    { day: "Mon", amount: 3.54 },
    { day: "Tue", amount: 4.12 },
    { day: "Wed", amount: 3.72 },
    { day: "Thu", amount: 5.26 },
    { day: "Fri", amount: 4.41 },
    { day: "Sat", amount: 2.64 },
    { day: "Sun", amount: 2.79 },
  ];
  const maxDay = Math.max(...weekdayData.map((item) => item.amount));

  return (
    <Card className="weekday-card" testId="weekday-spend-card">
      <SectionHeading
        title="Spend by Weekday"
        action={
          <IconButton
            className="more-button"
            aria-label="More weekday options"
            data-testid="weekday-more-button"
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <MoreHorizontal size={18} />
          </IconButton>
        }
      />
      <div className="chart-wrap weekday-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekdayData} margin={{ top: 18, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#edf2f7" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <YAxis hide />
            <RechartsTooltip
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
              {weekdayData.map((item) => (
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
  const percent = metrics?.savings_opportunity_percent ?? 68;
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
        style={{ "--gauge": `${percent * 3.6}deg` }}
      >
        <div>
          <strong>{percent}%</strong>
          <span>optimized</span>
        </div>
      </div>
    </Card>
  );
}

function ForecastCard({ trend = [], metrics = {} }) {
  const observedSpend = trend.reduce((total, point) => total + (point.this_period || 0), 0);
  const dailyAverage = trend.length ? observedSpend / trend.length : 3.78;
  const monthEndEstimate = dailyAverage * 31;
  const remainingBudget = monthEndEstimate - (metrics.budget || 10);
  const forecastData = [
    ...trend.map((point) => ({
      date: point.date,
      actual: point.this_period,
      projected: point.this_period,
    })),
    ...Array.from({ length: 24 }, (_, index) => ({
      date: `${String(index + 8).padStart(2, "0")}/10/2026`,
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
            <RechartsTooltip
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
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="forecast-footer">
        <span className="forecast-badge">
          <TrendingUp size={13} /> On track with $10.00 budget
        </span>
        <span className="forecast-budget-note">
          Forecast is a demo estimate, not a billing commitment.
        </span>
      </div>
    </Card>
  );
}


function ResourcesSummary({ metrics, onNavigate }) {
  const total = metrics.resource_summary.reduce((acc, item) => acc + item.count, 0) || 1;
  return (
    <Card className="resource-summary-card" testId="resources-summary-card">
      <SectionHeading
        title="Resources"
        action={
          <button className="text-link" onClick={() => onNavigate && onNavigate("resources")} data-testid="view-all-resources-button">
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
          <IconButton
            className="more-button"
            aria-label="More service options"
            data-testid="services-more-button"
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <MoreHorizontal size={18} />
          </IconButton>
        }
      />
      <TableContainer component={Box} sx={{ mt: 1, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <Table size="small" aria-label="top services table" sx={{ minWidth: 420 }}>
          <TableHead>
            <TableRow>
              <TableCell>SERVICE</TableCell>
              <TableCell>COST</TableCell>
              <TableCell>SHARE</TableCell>
              <TableCell>TREND</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow
                key={service.service}
                data-testid={`service-row-${service.service.toLowerCase().replaceAll(" ", "-")}`}
                hover
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <span className="service-dot" />
                    <strong>{service.service}</strong>
                  </Box>
                </TableCell>
                <TableCell>
                  <strong>{formatUsd(service.cost)}</strong>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span className="share-value">{service.share}%</span>
                    <Box sx={{ width: 50 }}>
                      <LinearProgress
                        variant="determinate"
                        value={service.share}
                        sx={{
                          height: 5,
                          borderRadius: 2,
                          backgroundColor: "rgba(47, 107, 255, 0.12)",
                          "& .MuiLinearProgress-bar": { backgroundColor: "#2f6bff", borderRadius: 2 },
                        }}
                      />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Sparkline values={service.trend} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

function AdvisorCard({ onAsk, onNavigate }) {
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
          <div className="avatar avatar-light">OA</div>
          <span>Which resources can I stop?</span>
        </div>
        <div className="advisor-answer">
          <p>
            You have 1 idle EC2 instance (<code>demo-server</code>) with &lt;2% average CPU over 7 days.
            Stopping it saves ~<strong>$6.30/mo</strong>.
          </p>
        </div>
      </div>
      <div className="advisor-input">
        <Input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder="Ask Opti Advisor..."
          aria-label="Advisor question"
          data-testid="advisor-quick-input"
        />
        <IconButton
          onClick={submit}
          aria-label="Send question"
          data-testid="advisor-quick-submit"
          size="small"
          sx={{
            backgroundColor: "#2f6bff",
            color: "#ffffff",
            "&:hover": { backgroundColor: "#2256d6" },
          }}
        >
          <Send size={15} />
        </IconButton>
      </div>
      <button
        className="advisor-open-link"
        onClick={() => onNavigate && onNavigate("advisor")}
        data-testid="open-full-advisor-button"
      >
        Open full advisor chat <ArrowUpRight size={13} />
      </button>
    </Card>
  );
}

function Dashboard({
  metrics,
  trend,
  services,
  onAsk,
  showForecast,
  isLive,
  onNavigate,
}) {
  return (
    <div className="page-stack" data-testid="dashboard-view">
      <div className="page-intro">
        <div>
          <p className="eyebrow">OVERVIEW / OCTOBER 2026</p>
          <h1 data-testid="dashboard-title">
            Cloud Cost Dashboard <span className="wave">👋</span>
          </h1>
          <p className="page-subtitle">
            Optimize, track, and reduce AWS infrastructure spend with intelligent recommendations.
          </p>
        </div>
        <DemoBadge isLive={isLive} />
      </div>
      <div className="metrics-grid">
        <MetricCard
          label="Total Spend"
          value={formatUsd(metrics.total_spend)}
          badge="+12.4%"
          detail="vs previous period"
          icon={Activity}
          tone="blue"
          testId="total-spend-metric"
        />
        <MetricCard
          label="Top Service"
          value={metrics.top_service_name}
          detail={`${metrics.top_service_share}% of total spend`}
          icon={Cloud}
          tone="purple"
          testId="top-service-metric"
        />
        <MetricCard
          label="Daily Average"
          value={formatUsd(metrics.daily_average)}
          detail="across current month"
          icon={TrendingUp}
          tone="green"
          testId="daily-average-metric"
        />
        <MetricCard
          label="Idle Candidates"
          value={metrics.idle_candidates.toString()}
          badge={`~${formatUsd(metrics.idle_savings)}/mo`}
          detail="savings found"
          icon={AlertTriangle}
          tone="orange"
          testId="idle-candidates-metric"
        />
      </div>
      <div className="dashboard-grid dashboard-grid-top">
        <SpendTrendCard trend={trend} totalSpend={metrics.total_spend} />
        <div className="dashboard-side-stack">
          <WeekdayCard metrics={metrics} />
          <SavingsCard metrics={metrics} />
        </div>
      </div>
      {showForecast && <ForecastCard trend={trend} metrics={metrics} />}
      <div className="dashboard-grid dashboard-grid-bottom">
        <div className="left-stack">
          <ResourcesSummary metrics={metrics} onNavigate={onNavigate} />
          <ServicesTable services={services} />
        </div>
        <AdvisorCard onAsk={onAsk} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function stateLabel(state) {
  return state === "available" ? "Available" : state.charAt(0).toUpperCase() + state.slice(1);
}

function ResourcesView({ resources, onStateChange, onTerminate, isLive }) {
  const [tab, setTab] = useState("EC2");
  const filtered = resources.filter((resource) => resource.kind === tab);
  return (
    <div className="page-stack" data-testid="resources-view">
      <div className="page-intro">
        <div>
          <p className="eyebrow">WORKSPACE / INVENTORY</p>
          <h1 data-testid="resources-title">Resources</h1>
          <p className="page-subtitle">
            Review your AWS footprint and take action on infrastructure across your cloud account.
          </p>
        </div>
        <DemoBadge isLive={isLive} />
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
        <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
          <Tabs
            value={tab}
            onChange={(e, val) => setTab(val)}
            aria-label="resource categories"
            textColor="primary"
            indicatorColor="primary"
          >
            {["EC2", "RDS", "S3"].map((item) => (
              <Tab
                key={item}
                value={item}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{item}</span>
                    <Chip
                      size="small"
                      label={resources.filter((resource) => resource.kind === item).length}
                      sx={{ height: 18, fontSize: "10px" }}
                    />
                  </Box>
                }
                data-testid={`resource-tab-${item.toLowerCase()}`}
              />
            ))}
          </Tabs>
        </Box>
        <TableContainer component={Box} sx={{ mt: 2, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Table size="small" aria-label="resources inventory table" sx={{ minWidth: 620 }}>
            <TableHead>
              <TableRow>
                <TableCell>NAME</TableCell>
                <TableCell>RESOURCE ID</TableCell>
                <TableCell>SIZE</TableCell>
                <TableCell>STATE</TableCell>
                <TableCell>MONTHLY SAVINGS</TableCell>
                <TableCell>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((resource) => (
                <TableRow key={resource.id} data-testid={`resource-row-${resource.id}`} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                    </Box>
                  </TableCell>
                  <TableCell>
                    <code>{resource.resource_id}</code>
                  </TableCell>
                  <TableCell>{resource.size}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={stateLabel(resource.state)}
                      color={
                        resource.state === "running" || resource.state === "available"
                          ? "success"
                          : "default"
                      }
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: "11px" }}
                    />
                  </TableCell>
                  <TableCell>
                    {resource.monthly_savings ? (
                      <span className="savings-value">
                        {formatUsd(resource.monthly_savings)}/mo
                      </span>
                    ) : (
                      <span className="muted-copy">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {resource.kind === "EC2" && (
                        <MuiButton
                          size="small"
                          variant="text"
                          onClick={() => onStateChange(resource)}
                          data-testid={`resource-${resource.id}-toggle-button`}
                          sx={{ textTransform: "none", fontSize: "12px", p: 0.5 }}
                        >
                          {resource.state === "running" ? "Stop" : "Start"}
                        </MuiButton>
                      )}
                      <MuiButton
                        size="small"
                        color="error"
                        variant="text"
                        onClick={() => onTerminate(resource)}
                        data-testid={`resource-${resource.id}-terminate-button`}
                        startIcon={<Trash2 size={13} />}
                        sx={{ textTransform: "none", fontSize: "12px", p: 0.5 }}
                      >
                        Terminate
                      </MuiButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
}

function TerminateModal({ resource, onClose, onConfirm }) {
  const [understood, setUnderstood] = useState(false);
  return (
    <Dialog
      open={Boolean(resource)}
      onClose={onClose}
      aria-labelledby="terminate-title"
      data-testid="terminate-confirmation-modal"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="terminate-title" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Trash2 size={20} color="#ef4444" /> Terminate {resource.name}?
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This action permanently removes the resource from your AWS environment. It cannot be undone.
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, bgcolor: "action.hover", borderRadius: 1.5, mb: 2 }}>
          <div className="resource-kind-icon ec2">
            <Server size={15} />
          </div>
          <div>
            <strong>{resource.name}</strong>
            <br />
            <code>{resource.resource_id}</code>
          </div>
        </Box>
        <label className="confirm-check" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <Checkbox
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(checked === true)}
            data-testid="terminate-permanent-checkbox"
          />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            I understand this is permanent
          </Typography>
        </label>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
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
      </DialogActions>
    </Dialog>
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, px: 3, pb: 2 }}>
          {suggestedPrompts.map((prompt) => (
            <Chip
              key={prompt}
              label={prompt}
              onClick={() => send(prompt)}
              icon={<ArrowUpRight size={13} />}
              variant="outlined"
              data-testid={`suggested-prompt-${prompt.slice(0, 12).toLowerCase().replaceAll(" ", "-")}`}
              sx={{ cursor: "pointer", fontSize: "12px", height: 28 }}
            />
          ))}
        </Box>
        <div className="chat-composer">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && send()}
            placeholder="Ask about your AWS costs..."
            aria-label="Advisor message"
            data-testid="advisor-message-input"
          />
          <IconButton
            onClick={() => send()}
            aria-label="Send message"
            data-testid="advisor-send-button"
            size="small"
            sx={{
              backgroundColor: "#2f6bff",
              color: "#ffffff",
              "&:hover": { backgroundColor: "#2256d6" },
            }}
          >
            <Send size={15} />
          </IconButton>
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
    description: "Inspect month-to-date trajectory against previous period.",
    tag: "#Trends",
    icon: TrendingUp,
    tone: "green",
  },
  {
    title: "Idle Candidates",
    description: "Flag resources that have been idle for at least 7 days.",
    tag: "#Savings",
    icon: AlertTriangle,
    tone: "orange",
  },
  {
    title: "Usage Forecast",
    description: "Extrapolate run-rate to project end-of-month spend.",
    tag: "#Forecast",
    icon: Zap,
    tone: "purple",
  },
];

function WidgetDrawer({ onClose, selectedWidgets, onSelectWidget }) {
  const [search, setSearch] = useState("");
  const filteredWidgets = widgets.filter((widget) =>
    widget.title.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Drawer
      anchor="right"
      open={true}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          p: 3,
        },
      }}
      data-testid="widget-drawer"
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <div>
          <p className="eyebrow">PERSONALIZE</p>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Add widget
          </Typography>
        </div>
        <IconButton
          onClick={onClose}
          aria-label="Close widget panel"
          data-testid="widget-drawer-close-button"
          size="small"
        >
          <X size={18} />
        </IconButton>
      </Box>
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          px: 1.5,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        <Search size={15} />
        <InputBase
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search widgets..."
          inputProps={{ "aria-label": "Search widgets" }}
          data-testid="widget-search-input"
          sx={{ flex: 1, fontSize: "13px" }}
        />
      </Box>
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
      <Box sx={{ display: "flex", justifyContent: "space-between", my: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 500, color: "text.secondary" }}>
          Recommended for you
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {filteredWidgets.length} widgets
        </Typography>
      </Box>
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
    </Drawer>
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
  };
  const item = copy[view] || copy.budgets;
  const Icon = item.icon;
  return (
    <Card className="placeholder-card" testId={`${view}-view`}>
      <div className="placeholder-icon">
        <Icon size={24} />
      </div>
      <h2>{item.title}</h2>
      <p>{item.description}</p>
      <Button variant="outline">
        Configure <ExternalLink size={13} />
      </Button>
    </Card>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("opti_dark_mode");
    return saved !== null ? saved === "true" : true;
  });
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [resources, setResources] = useState(DEMO_RESOURCES);
  const [metrics, setMetrics] = useState(DEMO_METRICS);
  const [trend, setTrend] = useState(DEMO_TREND);
  const [services, setServices] = useState(DEMO_SERVICES);

  const muiTheme = useMemo(() => getAppTheme(darkMode ? "dark" : "light"), [darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("opti_dark_mode", darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    apiPost("/costs", { period: "monthly", metric: "cost" })
      .then((data) => {
        const amount = Number(data?.amount);
        if (!Number.isFinite(amount)) return;
        setIsLiveConnected(true);

        let liveServices = [];
        let topName = "AWS Services";
        let topCost = 0;
        let topShare = 0;

        if (Array.isArray(data.services) && data.services.length > 0) {
          liveServices = data.services.map((item) => ({
            service: item.service,
            cost: Number(item.amount) || 0,
            share: amount > 0 ? ((Number(item.amount) || 0) / amount) * 100 : 0,
            trend: [1, 2, 1, 2, 1, 2],
          }));
          const sorted = [...liveServices].sort((a, b) => b.cost - a.cost);
          topName = sorted[0]?.service || "AWS Services";
          topCost = sorted[0]?.cost || 0;
          topShare = sorted[0]?.share || 0;
          setServices(liveServices);
        }

        const daysInMonth = new Date().getDate() || 1;
        setMetrics((current) => ({
          ...current,
          total_spend: amount,
          daily_average: amount / daysInMonth,
          top_service_name: topName,
          top_service_cost: topCost,
          top_service_share: topShare,
        }));
      })
      .catch((err) => {
        console.warn("Could not load AWS costs:", err);
      });

    apiGet("/resources")
      .then((data) => {
        const groups = data?.resources;
        if (!groups || typeof groups !== "object") return;
        setIsLiveConnected(true);

        const liveResources = [
          ...(groups.instances || []).map((item) => ({
            id: item.id,
            resource_id: item.id,
            name:
              item.tags?.find((tag) => tag.Key === "Name")?.Value || item.id,
            kind: "EC2",
            size: item.type,
            state: item.state,
            monthly_savings: 0,
          })),
          ...(groups.databases || []).map((item) => ({
            id: item.id,
            resource_id: item.id,
            name: item.id,
            kind: "RDS",
            size: item.class,
            state: item.status,
            monthly_savings: 0,
          })),
          ...(groups.buckets || []).map((item) => ({
            id: item.name,
            resource_id: item.name,
            name: item.name,
            kind: "S3",
            size: "AWS storage",
            state: "available",
            monthly_savings: 0,
          })),
        ];

        if (liveResources.length > 0) {
          setResources(liveResources);
          const ec2Count = liveResources.filter((r) => r.kind === "EC2").length;
          const rdsCount = liveResources.filter((r) => r.kind === "RDS").length;
          const s3Count = liveResources.filter((r) => r.kind === "S3").length;
          setMetrics((current) => ({
            ...current,
            resource_summary: [
              { kind: "EC2 instances", count: ec2Count, color: "blue" },
              { kind: "RDS databases", count: rdsCount, color: "green" },
              { kind: "S3 buckets", count: s3Count, color: "orange" },
            ],
          }));
        }
      })
      .catch((err) => {
        console.warn("Could not load AWS resources:", err);
      });
  }, []);

  const handleStateChange = async (resource) => {
    const nextAction = resource.state === "running" ? "stop" : "start";
    const nextState = resource.state === "running" ? "stopped" : "running";
    try {
      await apiPatch(`/resources/${resource.id}`, { action: nextAction });
      setResources((list) =>
        list.map((r) => (r.id === resource.id ? { ...r, state: nextState } : r))
      );
      toast.success(`${resource.name} is now ${nextState}`);
    } catch {
      setResources((list) =>
        list.map((r) => (r.id === resource.id ? { ...r, state: nextState } : r))
      );
      toast.success(`${resource.name} is now ${nextState} (demo)`);
    }
  };

  const handleTerminate = async (id) => {
    try {
      await apiDelete(`/resources/${id}`);
      setResources((list) => list.filter((r) => r.id !== id));
      setTerminateTarget(null);
      toast.success("Resource terminated");
    } catch {
      setResources((list) => list.filter((r) => r.id !== id));
      setTerminateTarget(null);
      toast.success("Resource terminated (demo)");
    }
  };

  const askAdvisor = async (prompt) => {
    setIsTyping(true);
    setMessages((curr) => [...curr, { role: "user", content: prompt }]);
    try {
      const res = await apiPost("/advisor", { prompt });
      const reply =
        res?.advice ||
        res?.reply ||
        res?.content ||
        (Array.isArray(res?.recommendations) && res.recommendations[0]?.description);
      if (!reply) throw new Error("Advisor response did not include advice");
      setMessages((curr) => [...curr, { role: "advisor", content: reply }]);
    } catch {
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
            "Spend increased by 12.0% on 06/10 - 07/10 primarily due to data transfer and batch workloads on demo-server.";
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
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div className="console-shell">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
        <Drawer
          anchor="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          PaperProps={{
            sx: {
              width: 260,
              p: 2,
              background: "background.paper",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
          data-testid="mobile-navigation-drawer"
        >
          <SidebarContent
            activeView={activeView}
            onNavigate={setActiveView}
            collapsed={false}
            isMobile={true}
            onCloseMobile={() => setMobileNavOpen(false)}
          />
        </Drawer>
        <div className="app-main">
          <Topbar
            onOpenWidgets={() => setWidgetOpen(true)}
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode((value) => !value)}
            onSearch={() => undefined}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <main className="main-content">
            {activeView === "dashboard" && (
              <Dashboard
                metrics={metrics}
                trend={trend}
                services={services}
                onAsk={askAdvisor}
                showForecast={selectedWidgets.includes("Usage Forecast")}
                isLive={isLiveConnected}
                onNavigate={setActiveView}
              />
            )}
            {activeView === "resources" && (
              <ResourcesView
                resources={resources}
                onStateChange={handleStateChange}
                onTerminate={setTerminateTarget}
                isLive={isLiveConnected}
              />
            )}
            {activeView === "advisor" && (
              <AdvisorView
                messages={messages}
                isTyping={isTyping}
                onAsk={askAdvisor}
              />
            )}
            {["budgets", "settings"].includes(activeView) && (
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
    </ThemeProvider>
  );
}
