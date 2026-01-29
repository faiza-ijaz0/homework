-- =====================================================
-- MULTI-PORTAL DATABASE SCHEMA UPDATE
-- Homeware Management System
-- Version: 2.0.0
-- Date: 2024-02-01
-- =====================================================
-- This script adds portal-specific tables to support
-- the multi-portal authentication and authorization system
-- =====================================================

-- =====================================================
-- SECTION 1: PORTAL CONFIGURATION TABLES
-- =====================================================

-- Portal Definitions
CREATE TABLE IF NOT EXISTS portals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    gradient VARCHAR(100),
    dashboard_path VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default portals
INSERT INTO portals (code, name, description, icon, color, dashboard_path, display_order) VALUES
('admin', 'Admin Portal', 'Full system administration and organization management', 'Building2', 'blue', '/admin/dashboard', 1),
('manager', 'Manager Portal', 'Team management, project oversight, and performance tracking', 'UserCog', 'indigo', '/manager/dashboard', 2),
('supervisor', 'Supervisor Portal', 'Daily operations, team oversight, and approval workflows', 'ClipboardCheck', 'emerald', '/supervisor/dashboard', 3),
('employee', 'Employee Portal', 'Self-service, attendance, leave requests, and job assignments', 'User', 'violet', '/employee/dashboard', 4),
('client', 'Client Portal', 'Service requests, job tracking, invoices, and support', 'Building', 'green', '/client/dashboard', 5),
('guest', 'Guest Portal', 'Limited read-only access to public information', 'Eye', 'gray', '/guest/dashboard', 6);

-- Portal Modules (dynamic module configuration)
CREATE TABLE IF NOT EXISTS portal_modules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portal_id INT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    path VARCHAR(100) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    parent_module_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_module_id) REFERENCES portal_modules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_portal_module (portal_id, code)
);

-- Portal Module Permissions (which permissions are needed for each module)
CREATE TABLE IF NOT EXISTS portal_module_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    module_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES portal_modules(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_module_permission (module_id, permission_id)
);

-- =====================================================
-- SECTION 2: PORTAL ACCESS CONTROL
-- =====================================================

-- Role-Portal Access (which roles can access which portals)
CREATE TABLE IF NOT EXISTS role_portal_access (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    portal_id INT NOT NULL,
    is_default_portal BOOLEAN DEFAULT false,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INT,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_role_portal (role_id, portal_id)
);

-- User-Portal Access (override access for specific users)
CREATE TABLE IF NOT EXISTS user_portal_access (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    portal_id INT NOT NULL,
    access_type ENUM('grant', 'deny') DEFAULT 'grant',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INT,
    expires_at TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_portal (user_id, portal_id)
);

-- =====================================================
-- SECTION 3: SESSION MANAGEMENT
-- =====================================================

-- User Sessions (active login sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    portal_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    device_name VARCHAR(100),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    logout_time TIMESTAMP NULL,
    logout_reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_token_active (session_token, is_active)
);

-- Session Activity Log (track important actions within session)
CREATE TABLE IF NOT EXISTS session_activity_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT,
    module_accessed VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_action (session_id, action_type),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- SECTION 4: PORTAL CONFIGURATION & PREFERENCES
-- =====================================================

-- Portal Theme Configuration
CREATE TABLE IF NOT EXISTS portal_themes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portal_id INT NOT NULL,
    theme_name VARCHAR(50) DEFAULT 'default',
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    accent_color VARCHAR(20),
    background_gradient VARCHAR(200),
    logo_url VARCHAR(255),
    favicon_url VARCHAR(255),
    custom_css TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE
);

-- User Portal Preferences
CREATE TABLE IF NOT EXISTS user_portal_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    portal_id INT NOT NULL,
    dashboard_layout JSON,
    sidebar_collapsed BOOLEAN DEFAULT false,
    theme_mode ENUM('light', 'dark', 'system') DEFAULT 'dark',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Dubai',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    items_per_page INT DEFAULT 10,
    default_view VARCHAR(50),
    pinned_modules JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_portal_prefs (user_id, portal_id)
);

-- =====================================================
-- SECTION 5: PORTAL ANNOUNCEMENTS & NOTIFICATIONS
-- =====================================================

-- Portal-Specific Announcements
CREATE TABLE IF NOT EXISTS portal_announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    target_portals JSON NOT NULL COMMENT 'Array of portal codes',
    target_roles JSON COMMENT 'Array of role IDs (null for all)',
    is_dismissible BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    publish_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_active_publish (is_active, publish_at, expires_at)
);

-- Announcement Read Status
CREATE TABLE IF NOT EXISTS announcement_reads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dismissed_at TIMESTAMP NULL,
    FOREIGN KEY (announcement_id) REFERENCES portal_announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_announcement_user (announcement_id, user_id)
);

-- =====================================================
-- SECTION 6: PORTAL WIDGETS & DASHBOARD COMPONENTS
-- =====================================================

-- Available Dashboard Widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    component_name VARCHAR(100) NOT NULL,
    default_size ENUM('small', 'medium', 'large', 'full') DEFAULT 'medium',
    min_width INT DEFAULT 1,
    max_width INT DEFAULT 4,
    min_height INT DEFAULT 1,
    max_height INT DEFAULT 4,
    available_portals JSON COMMENT 'Array of portal codes',
    required_permissions JSON COMMENT 'Array of permission codes',
    default_config JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Dashboard Widget Configuration
CREATE TABLE IF NOT EXISTS user_dashboard_widgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    portal_id INT NOT NULL,
    widget_id INT NOT NULL,
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    width INT DEFAULT 2,
    height INT DEFAULT 2,
    config JSON,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    FOREIGN KEY (widget_id) REFERENCES dashboard_widgets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_portal_widget (user_id, portal_id, widget_id)
);

-- =====================================================
-- SECTION 7: PORTAL QUICK ACTIONS & SHORTCUTS
-- =====================================================

-- Portal Quick Actions
CREATE TABLE IF NOT EXISTS portal_quick_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portal_id INT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    action_type ENUM('navigate', 'modal', 'command') DEFAULT 'navigate',
    action_target VARCHAR(200) NOT NULL,
    required_permissions JSON,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE
);

-- User Shortcuts/Bookmarks
CREATE TABLE IF NOT EXISTS user_shortcuts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    portal_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    url VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    keyboard_shortcut VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE
);

-- =====================================================
-- SECTION 8: PORTAL ANALYTICS
-- =====================================================

-- Portal Usage Statistics (daily aggregates)
CREATE TABLE IF NOT EXISTS portal_usage_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    portal_id INT NOT NULL,
    stat_date DATE NOT NULL,
    total_logins INT DEFAULT 0,
    unique_users INT DEFAULT 0,
    total_page_views INT DEFAULT 0,
    avg_session_duration INT DEFAULT 0 COMMENT 'In seconds',
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    most_visited_module VARCHAR(100),
    peak_hour TINYINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE,
    UNIQUE KEY unique_portal_date (portal_id, stat_date),
    INDEX idx_stat_date (stat_date)
);

-- Module Usage Statistics
CREATE TABLE IF NOT EXISTS module_usage_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    module_id INT NOT NULL,
    stat_date DATE NOT NULL,
    view_count INT DEFAULT 0,
    unique_users INT DEFAULT 0,
    avg_time_spent INT DEFAULT 0 COMMENT 'In seconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES portal_modules(id) ON DELETE CASCADE,
    UNIQUE KEY unique_module_date (module_id, stat_date)
);

-- =====================================================
-- SECTION 9: INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional indexes for common queries
CREATE INDEX idx_portals_active ON portals(is_active, display_order);
CREATE INDEX idx_portal_modules_active ON portal_modules(portal_id, is_active, display_order);
CREATE INDEX idx_sessions_user_active ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX idx_announcements_active ON portal_announcements(is_active, publish_at, expires_at);

-- =====================================================
-- SECTION 10: INSERT DEFAULT DATA
-- =====================================================

-- Insert default role-portal access
INSERT INTO role_portal_access (role_id, portal_id, is_default_portal) 
SELECT r.id, p.id, 
    CASE 
        WHEN r.code = 'super_admin' AND p.code = 'admin' THEN true
        WHEN r.code = 'admin' AND p.code = 'admin' THEN true
        WHEN r.code = 'manager' AND p.code = 'manager' THEN true
        WHEN r.code = 'supervisor' AND p.code = 'supervisor' THEN true
        WHEN r.code = 'employee' AND p.code = 'employee' THEN true
        ELSE false
    END
FROM roles r
CROSS JOIN portals p
WHERE 
    (r.code IN ('super_admin', 'admin') AND p.code = 'admin') OR
    (r.code = 'manager' AND p.code = 'manager') OR
    (r.code = 'supervisor' AND p.code = 'supervisor') OR
    (r.code = 'employee' AND p.code = 'employee');

-- Insert default dashboard widgets
INSERT INTO dashboard_widgets (code, name, description, component_name, default_size, available_portals) VALUES
('stats_overview', 'Statistics Overview', 'Quick stats cards showing key metrics', 'StatsOverviewWidget', 'large', '["admin", "manager", "supervisor"]'),
('recent_activity', 'Recent Activity', 'Timeline of recent system activities', 'RecentActivityWidget', 'medium', '["admin", "manager", "supervisor", "employee"]'),
('pending_approvals', 'Pending Approvals', 'List of items awaiting approval', 'PendingApprovalsWidget', 'medium', '["manager", "supervisor"]'),
('team_status', 'Team Status', 'Current team attendance and status', 'TeamStatusWidget', 'medium', '["manager", "supervisor"]'),
('my_tasks', 'My Tasks', 'Personal task list and assignments', 'MyTasksWidget', 'medium', '["supervisor", "employee"]'),
('attendance_card', 'Attendance', 'Check-in/check-out controls', 'AttendanceWidget', 'small', '["employee"]'),
('leave_balance', 'Leave Balance', 'Current leave balances', 'LeaveBalanceWidget', 'small', '["employee"]'),
('active_jobs', 'Active Jobs', 'Current job status overview', 'ActiveJobsWidget', 'large', '["admin", "manager", "client"]'),
('invoices_summary', 'Invoices Summary', 'Outstanding and recent invoices', 'InvoicesSummaryWidget', 'medium', '["client"]'),
('announcements', 'Announcements', 'Latest company announcements', 'AnnouncementsWidget', 'medium', '["admin", "manager", "supervisor", "employee", "guest"]'),
('calendar', 'Calendar', 'Upcoming events and meetings', 'CalendarWidget', 'large', '["admin", "manager", "supervisor", "employee"]'),
('quick_actions', 'Quick Actions', 'Frequently used actions', 'QuickActionsWidget', 'small', '["admin", "manager", "supervisor", "employee", "client"]');

-- =====================================================
-- END OF MULTI-PORTAL SCHEMA UPDATE
-- =====================================================

-- Summary:
-- - 17 new tables created for portal management
-- - 6 default portals configured
-- - Role-portal access mappings established
-- - Dashboard widgets system implemented
-- - Session tracking and analytics ready
-- - User preferences and customization supported
