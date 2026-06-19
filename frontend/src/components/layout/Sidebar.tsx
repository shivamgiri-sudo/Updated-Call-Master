import React from "react";
import { NavLink } from "react-router-dom";

export interface NavItem {
  path: string;
  label: string;
}

export interface SidebarProps {
  navItems: NavItem[];
  processes: string[];
  selectedProcess: string;
  onProcessChange: (process: string) => void;
}

export default function Sidebar({
  navItems,
  processes,
  selectedProcess,
  onProcessChange
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">CM</div>
        <div>
          <h1>Call Master</h1>
          <p>Enterprise IQ</p>
        </div>
      </div>

      <nav className="nav-section" aria-label="Main navigation">
        <span>Enterprise modules</span>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: '24px' }}>
        <label
          htmlFor="process-select"
          style={{
            display: 'block',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            color: '#64748b',
            fontWeight: 900,
            marginBottom: '8px'
          }}
        >
          Process
        </label>
        <select
          id="process-select"
          value={selectedProcess}
          onChange={(e) => onProcessChange(e.target.value)}
          style={{
            width: '100%',
            border: '1px solid rgba(148,163,184,0.22)',
            borderRadius: '14px',
            background: '#0f172a',
            color: '#e2e8f0',
            padding: '10px 12px',
            fontWeight: 800,
            fontSize: '14px'
          }}
        >
          {processes.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="sidebar-card">
        <b>World-class SaaS build</b>
        <p>
          Executive intelligence, funnels, live assist, email templates,
          coaching calendar, SaaS control and client portal in one console.
        </p>
      </div>
    </aside>
  );
}
