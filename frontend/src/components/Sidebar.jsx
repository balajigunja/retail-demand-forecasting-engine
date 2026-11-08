import {
  LayoutDashboard,
  ChartNoAxesCombined,
  Package,
  BrainCircuit,
  CircleHelp,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Demand Forecast", icon: ChartNoAxesCombined },
  { label: "Product Categories", icon: Package },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <a className="brand" href="#dashboard">
        <span className="brand-icon">
          <BrainCircuit size={25} />
        </span>
        <span>
          <strong>RetailIQ</strong>
          <small>INTELLIGENCE PLATFORM</small>
        </span>
      </a>

      <p className="nav-heading">WORKSPACE</p>

      <nav className="navigation">
        {navigation.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href={
              label === "Product Categories"
                ? "#categories"
                : label === "Demand Forecast"
                  ? "#forecast"
                  : "#dashboard"
            }
            className={`nav-item ${active ? "active" : ""}`}
          >
            <Icon size={19} />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <span className="sidebar-help-icon">
          <CircleHelp size={18} />
        </span>
        <div>
          <strong>Forecasting engine</strong>
          <small>Python ML service</small>
        </div>
        <span className="status-dot" />
      </div>
    </aside>
  );
}