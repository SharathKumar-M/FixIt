import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router';
import styles from './AppLayout.module.css';
import { useAuth } from '@/hooks/useAuth';
import {
  WrenchIcon,
  LogOutIcon,
  ChevronDownIcon,
  ShieldIcon,
  PlusIcon,
  InboxIcon,
  CheckCircleIcon,
  ClockIcon,
  TagIcon,
} from '@/components/icons';
import { getInitials, formatRoleName } from '@/utils/format';

export const AppLayout: React.FC = () => {
  const { user, role, dept, isMaintenanceStaff, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.navContainer}>
          {/* Brand Logo */}
          <NavLink to={isMaintenanceStaff ? '/maintenance' : isAdmin ? '/admin' : '/dashboard'} className={styles.brandGroup}>
            <div className={styles.logoIcon}>
              <WrenchIcon size={20} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>FixIt</span>
              <span className={styles.brandSub}>Campus Ops</span>
            </div>
          </NavLink>

          {/* Navigation Links based on role */}
          <nav className={styles.navLinks} aria-label="Main navigation">
            {isMaintenanceStaff ? (
              // Maintenance Staff Navigation
              <>
                <NavLink
                  to="/maintenance"
                  end
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <ShieldIcon size={16} />
                  <span>Control Center</span>
                </NavLink>
                <NavLink
                  to="/maintenance/tickets"
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <InboxIcon size={16} />
                  <span>Ticket Workbench</span>
                </NavLink>
                <NavLink
                  to="/maintenance/deadlines"
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <ClockIcon size={16} />
                  <span>Deadlines</span>
                </NavLink>
                <NavLink
                  to="/maintenance/issue-types"
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <TagIcon size={16} />
                  <span>Issue Types</span>
                </NavLink>
              </>
            ) : isAdmin ? (
              // Admin Navigation
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <ShieldIcon size={16} />
                <span>Admin Inspection</span>
              </NavLink>
            ) : (
              // Student & Faculty Reporter Navigation
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <span>Dashboard</span>
                </NavLink>
                <NavLink
                  to="/tickets/new"
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <PlusIcon size={16} />
                  <span>Report Issue</span>
                </NavLink>
                <NavLink
                  to="/tickets"
                  end
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <InboxIcon size={16} />
                  <span>My Tickets</span>
                </NavLink>
                <NavLink
                  to="/resolutions"
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <CheckCircleIcon size={16} />
                  <span>Resolution Center</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* User Profile & Actions */}
          <div className={styles.rightActions}>
            <button
              type="button"
              className={styles.mobileToggle}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              <ChevronDownIcon size={20} />
            </button>
            <div className={styles.profileMenu} ref={dropdownRef}>
              <button
                type="button"
                className={styles.profileBtn}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className={styles.avatar}>{getInitials(user?.name)}</div>
                <div className={styles.profileInfo}>
                  <span className={styles.profileName}>{user?.name || 'User'}</span>
                  <span className={styles.profileRole}>{role || 'Member'}</span>
                </div>
                <ChevronDownIcon size={14} />
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown} role="menu">
                  <div className={styles.dropdownHeader}>
                    <strong>{user?.name}</strong>
                    <div className={styles.dropdownEmail}>{user?.email}</div>
                    <div className={styles.dropdownRoleBadge}>
                      {formatRoleName(role || undefined, dept || undefined)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOutIcon size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className={styles.navLinksMobile}>
            {isMaintenanceStaff ? (
              <>
                <NavLink to="/maintenance" end className={styles.navItem}>
                  <ShieldIcon size={16} />
                  <span>Control Center</span>
                </NavLink>
                <NavLink to="/maintenance/tickets" className={styles.navItem}>
                  <InboxIcon size={16} />
                  <span>Ticket Workbench</span>
                </NavLink>
                <NavLink to="/maintenance/deadlines" className={styles.navItem}>
                  <ClockIcon size={16} />
                  <span>Deadlines</span>
                </NavLink>
                <NavLink to="/maintenance/issue-types" className={styles.navItem}>
                  <TagIcon size={16} />
                  <span>Issue Types</span>
                </NavLink>
              </>
            ) : isAdmin ? (
              <NavLink to="/admin" className={styles.navItem}>
                <ShieldIcon size={16} />
                <span>Admin Inspection</span>
              </NavLink>
            ) : (
              <>
                <NavLink to="/dashboard" className={styles.navItem}>
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/tickets/new" className={styles.navItem}>
                  <PlusIcon size={16} />
                  <span>Report Issue</span>
                </NavLink>
                <NavLink to="/tickets" end className={styles.navItem}>
                  <InboxIcon size={16} />
                  <span>My Tickets</span>
                </NavLink>
                <NavLink to="/resolutions" className={styles.navItem}>
                  <CheckCircleIcon size={16} />
                  <span>Resolution Center</span>
                </NavLink>
              </>
            )}
          </nav>
        )}
      </header>

      {/* Main Page Content */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* CampusOS Platform Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span>FixIt • Campus Infrastructure Maintenance Portal</span>
          <span>Powered by CampusOS Backend • API v1</span>
        </div>
      </footer>
    </div>
  );
};
