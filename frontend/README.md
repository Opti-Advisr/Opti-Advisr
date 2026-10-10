# Opti Advisr

A React.js recreation of the Opti Advisr AWS cost optimization dashboard.

## Tech Stack

- React 19
- Vite 6
- React Router
- Recharts (charts)
- Lucide React (icons)
- Sonner (toast notifications)
- Custom CSS (no Tailwind)

## Getting Started

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
aws-optimizer-recreated/
├── package.json
├── index.html
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── pages/
    │   └── Home.jsx
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── Topbar.jsx
    │   ├── Dashboard.jsx
    │   ├── MetricCard.jsx
    │   ├── SpendTrendCard.jsx
    │   ├── WeekdayCard.jsx
    │   ├── SavingsCard.jsx
    │   ├── ForecastCard.jsx
    │   ├── ResourcesSummary.jsx
    │   ├── ServicesTable.jsx
    │   ├── AdvisorCard.jsx
    │   ├── ResourcesView.jsx
    │   ├── AdvisorView.jsx
    │   ├── WidgetDrawer.jsx
    │   ├── TerminateModal.jsx
    │   └── PlaceholderView.jsx
    ├── styles/
    │   └── index.css
    └── utils/
        └── demoData.js
```

## Features

- Dashboard with spend metrics, trends, and charts
- Resource management (EC2, RDS, S3)
- AI Cost Advisor chat interface
- Widget drawer for dashboard customization
- Dark/light theme toggle
- CSV export
- Responsive sidebar with collapse/expand
- Toast notifications

## Notes

- Uses demo/mock data (no backend required)
- The API calls fall back to demo data when unavailable
- The AI Advisor provides simulated responses
