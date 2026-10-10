// Demo data constants for the Opti Advisr dashboard

export const DEMO_METRICS = {
  total_spend: 26.48,
  total_change_percent: 12,
  daily_average: 1.89,
  top_service_name: 'EC2 Compute',
  top_service_cost: 14.62,
  top_service_share: 55.2,
  idle_candidates: 1,
  idle_savings: 6.3,
  budget: 10,
  budget_spent: 2.04,
  savings_opportunity_percent: 68,
  weekday: [
    { day: 'Mon', amount: 3.54 },
    { day: 'Tue', amount: 4.12 },
    { day: 'Wed', amount: 3.72 },
    { day: 'Thu', amount: 5.26 },
    { day: 'Fri', amount: 4.41 },
    { day: 'Sat', amount: 2.64 },
    { day: 'Sun', amount: 2.79 },
  ],
  resource_summary: [
    { kind: 'EC2 instances', count: 2, color: 'blue' },
    { kind: 'RDS databases', count: 1, color: 'green' },
    { kind: 'S3 buckets', count: 3, color: 'orange' },
  ],
};

export const DEMO_TREND = [
  { date: 'Oct 1', this_period: 3.04, previous_period: 2.72 },
  { date: 'Oct 2', this_period: 3.62, previous_period: 3.31 },
  { date: 'Oct 3', this_period: 3.15, previous_period: 3.06 },
  { date: 'Oct 4', this_period: 4.18, previous_period: 3.54 },
  { date: 'Oct 5', this_period: 1.97, previous_period: 1.74 },
  { date: 'Oct 6', this_period: 5.18, previous_period: 4.23 },
  { date: 'Oct 7', this_period: 5.34, previous_period: 4.59 },
];

export const DEMO_SERVICES = [
  { service: 'Amazon EC2 - Compute', cost: 14.62, share: 55.2, trend: [2, 4, 3, 5, 4, 7] },
  { service: 'Amazon RDS', cost: 9.84, share: 37.2, trend: [3, 3, 4, 3, 5, 4] },
  { service: 'Amazon S3', cost: 1.12, share: 4.2, trend: [1, 2, 2, 1, 3, 2] },
  { service: 'AWS Lambda', cost: 0.43, share: 1.6, trend: [2, 1, 2, 1, 2, 1] },
  { service: 'API Gateway', cost: 0.28, share: 1.1, trend: [1, 2, 1, 2, 1, 2] },
];

export const DEMO_RESOURCES = [
  { id: 'demo-server', name: 'demo-server', resource_id: 'i-0a91f4c2d8e7b3a5d', kind: 'EC2', size: 't3.micro', state: 'running', monthly_savings: 6.3 },
  { id: 'batch-worker', name: 'batch-worker', resource_id: 'i-0b82e5d1c9f4a6b3e', kind: 'EC2', size: 't3.small', state: 'stopped', monthly_savings: 0 },
  { id: 'demo-db', name: 'demo-db', resource_id: 'db.t3.micro', kind: 'RDS', size: 'db.t3.micro', state: 'available', monthly_savings: 0 },
  { id: 'assets-bucket', name: 'assets-bucket', resource_id: 's3://assets-bucket', kind: 'S3', size: 'Standard', state: 'available', monthly_savings: 0 },
  { id: 'logs-bucket', name: 'logs-bucket', resource_id: 's3://logs-bucket', kind: 'S3', size: 'Intelligent-Tiering', state: 'available', monthly_savings: 0 },
  { id: 'backups-bucket', name: 'backups-bucket', resource_id: 's3://backups-bucket', kind: 'S3', size: 'Standard-IA', state: 'available', monthly_savings: 0 },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', badge: '1' },
  { id: 'resources', label: 'Resources' },
  { id: 'advisor', label: 'AI Advisor' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'settings', label: 'Settings' },
  { id: 'help', label: 'Help & Support' },
];

export const SUGGESTED_PROMPTS = [
  'Which resources can I stop to save money?',
  'Why did costs go up this week?',
  'How am I tracking against budget?',
];

export const WIDGETS = [
  { title: 'Cost by Service', description: 'Break down spend across AWS services.', tag: '#Costs', tone: 'blue' },
  { title: 'Daily Spend Trend', description: 'Track spend movement across the week.', tag: '#Costs', tone: 'purple' },
  { title: 'Idle Resource Finder', description: 'Find running instances with low CPU you can stop.', tag: '#Savings', tone: 'orange' },
  { title: 'Budget Tracker', description: 'Month-to-date spend against your $10 budget.', tag: '#Budgets', tone: 'green' },
  { title: 'Usage Forecast', description: 'Estimate month-end spend from current daily trends.', tag: '#Forecasts', tone: 'blue' },
];

export function formatUsd(value) {
  return `$${value.toFixed(2)}`;
}
