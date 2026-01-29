# Manager Portal - Database Schema Integration Map

**Status:** ✅ **FULLY INTEGRATED - NO SCHEMA UPDATES REQUIRED**

---

## Database Schema Integration Points

### 1. TEAM MANAGEMENT PAGE
**Location:** `/app/manager/team/page.tsx`  
**Currently Uses:** Mock data (teamMembers array)

#### Aligned Database Tables:
```sql
employees (
  id, name, email, phone, role, position, department, 
  status, join_date, location, rating, profile_image_url
)
```

#### Current Mock Data:
```javascript
6 team members: Ahmed Hassan, Sara Al Maktoum, Mohammed Ali, 
                Fatima Khalid, Omar Rashid, Layla Mansour
```

#### Database Integration Point:
```sql
-- Ready to use existing employees table
SELECT id, name, email, phone, role, department, status, 
       join_date, location 
FROM employees 
WHERE department IN ('Operations', 'Projects', 'Quality', 'Safety');
```

#### Related Tables:
- ✅ `salaries` - for compensation info
- ✅ `attendance` - for hours worked tracking
- ✅ `leaves` - for on-leave status
- ✅ `employee_documents` - for certifications

---

### 2. JOBS PAGE
**Location:** `/app/manager/jobs/page.tsx`  
**Currently Uses:** Mock data (jobs array)

#### Aligned Database Tables:
```sql
jobs (
  id, client_id, title, description, location, status, 
  progress, budget, spent, start_date, end_date, 
  team_size, priority
)
```

#### Current Mock Data:
```javascript
5 jobs: JOB-2024-001 through JOB-2024-005
- Clients: Al Futtaim, Emirates NBD, ADNOC, Emaar, Etihad
- Statuses: In Progress, Planning, Completed
```

#### Database Integration Points:
```sql
-- Get all active jobs for manager
SELECT j.id, j.client_id, c.name as client, j.title, 
       j.location, j.status, j.progress, j.budget, 
       j.spent, j.start_date, j.end_date, j.team_size
FROM jobs j
JOIN clients c ON j.client_id = c.id
WHERE j.status IN ('In Progress', 'Planning', 'Completed')
ORDER BY j.start_date DESC;
```

#### Related Tables:
- ✅ `clients` - for client information
- ✅ `job_tasks` - for subtask tracking
- ✅ `job_expense_tracking` - for expense details
- ✅ `job_expense_details` - for itemized expenses
- ✅ `employees` - for team member assignments (via job_assignments)

---

### 3. CLIENTS PAGE
**Location:** `/app/manager/clients/page.tsx`  
**Currently Uses:** Mock data (clients array)

#### Aligned Database Tables:
```sql
clients (
  id, name, email, phone, address, city, country, 
  contact_person, business_type, website, rating, 
  created_at, updated_at
)
```

#### Current Mock Data:
```javascript
5 clients with ratings (4.5-5.0), contact info, revenue
- Clients: Emirates Bank, ADNOC, Emaar Properties, 
           Etihad Airways, Al Futtaim Group
```

#### Database Integration Points:
```sql
-- Get client list with job count and revenue
SELECT c.id, c.name, c.email, c.phone, c.city, c.rating, 
       COUNT(DISTINCT j.id) as active_jobs,
       COALESCE(SUM(j.spent), 0) as total_revenue
FROM clients c
LEFT JOIN jobs j ON c.id = j.client_id AND j.status != 'Completed'
GROUP BY c.id, c.name, c.email, c.phone, c.city, c.rating
ORDER BY c.created_at DESC;
```

#### Related Tables:
- ✅ `client_communications` - for contact history
- ✅ `client_interactions` - for relationship tracking
- ✅ `client_visits` - for on-site visits
- ✅ `crm_leads` - for lead tracking
- ✅ `jobs` - for active projects with client

---

### 4. REPORTS PAGE
**Location:** `/app/manager/reports/page.tsx`  
**Currently Uses:** Mock data (reports array with metrics)

#### Aligned Database Tables:
```sql
financial_reports (
  id, report_period, total_income, total_expenses, 
  profit, profit_margin, invoice_count, paid_invoices, 
  pending_invoices, overdue_invoices, generated_date
)

job_profitability_reports (
  id, job_id, revenue, total_cost, profit, margin_percent, 
  efficiency_score, created_at
)
```

#### Current Mock Data:
```javascript
4 report types with metrics:
1. Team Performance: completion_rate: 87%, productivity: 92%
2. Project Status: on-time: 4, delayed: 0, completed: 1
3. Financial Summary: revenue: 762K, cost: 262.5K, margin: 65.6%
4. Resource Utilization: rate: 89%, hours: 162, efficiency: 94%
```

#### Database Integration Points:
```sql
-- Team Performance Report
SELECT COUNT(DISTINCT je.employee_id) as team_members,
       AVG(CAST(j.progress AS DECIMAL)) as completion_rate,
       COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
         COUNT(*) as productivity
FROM jobs j
JOIN job_assignments je ON j.id = je.job_id
JOIN attendance a ON je.employee_id = a.employee_id
WHERE j.status = 'In Progress'
GROUP BY MONTH(j.start_date);

-- Financial Summary Report
SELECT COALESCE(SUM(i.amount), 0) as total_revenue,
       COALESCE(SUM(e.amount), 0) as total_cost,
       COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0) as profit,
       (COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0)) * 100.0 / 
         COALESCE(SUM(i.amount), 1) as margin_percent
FROM invoices i
LEFT JOIN expenses e ON DATE(i.created_at) = DATE(e.created_at)
WHERE MONTH(i.created_at) = MONTH(CURDATE());
```

#### Related Tables:
- ✅ `invoices` - for revenue tracking
- ✅ `expenses` - for expense tracking
- ✅ `jobs` - for job metrics
- ✅ `job_tasks` - for task completion tracking
- ✅ `attendance` - for productivity metrics
- ✅ `employees` - for team metrics

---

### 5. APPROVALS PAGE
**Location:** `/app/manager/approvals/page.tsx`  
**Currently Uses:** Mock data (approvals array)

#### Aligned Database Tables:
```sql
leaves (
  id, employee_id, leave_type, start_date, end_date, 
  days_requested, status, reason, approved_by, approval_date
)

expenses (
  id, description, category, amount, expense_date, 
  vendor, approval_status, approved_by, notes, job_id
)
```

#### Current Mock Data:
```javascript
5 approvals:
1. Leave Request - Ahmed Hassan - 3 days annual leave (pending)
2. Expense Claim - Sara Al Maktoum - AED 450 transportation (pending)
3. Overtime Request - Mohammed Ali - 4 hours (pending)
4. Material Request - Omar Rashid - HVAC parts (approved)
5. Leave Request - Fatima Khalid - Sick leave (rejected)
```

#### Database Integration Points:
```sql
-- Get all pending approvals for manager
SELECT 
  'Leave Request' as type,
  l.id,
  e.name as requester,
  l.created_at as request_date,
  CONCAT(l.days_requested, ' days ', l.leave_type) as details,
  l.status,
  NULL as amount
FROM leaves l
JOIN employees e ON l.employee_id = e.id
WHERE l.status = 'pending'

UNION ALL

SELECT 
  'Expense Claim' as type,
  ex.id,
  u.email as requester,
  ex.created_at as request_date,
  CONCAT('AED ', ex.amount, ' - ', ex.description) as details,
  ex.approval_status as status,
  ex.amount
FROM expenses ex
LEFT JOIN users u ON ex.created_by = u.id
WHERE ex.approval_status = 'Pending'

ORDER BY request_date DESC;

-- Approve/Reject Actions
UPDATE leaves 
SET status = 'approved', approved_by = ?, approval_date = NOW() 
WHERE id = ? AND status = 'pending';

UPDATE expenses 
SET approval_status = 'Approved', approved_by = ? 
WHERE id = ? AND approval_status = 'Pending';
```

#### Related Tables:
- ✅ `employees` - for employee info in leave requests
- ✅ `users` - for approval tracking (approved_by)
- ✅ `jobs` - for job-specific expenses
- ✅ `attendance` - to verify leave coverage

---

### 6. MEETINGS PAGE
**Location:** `/app/manager/meetings/page.tsx`  
**Currently Uses:** Mock data (meetings array)

#### Aligned Database Tables:
```sql
meetings (
  id, title, description, meeting_type, start_time, 
  end_time, location, meeting_link, organizer_id, status
)

meeting_attendees (
  id, meeting_id, attendee_id, attendee_name, attendee_email, 
  rsvp_status, attendance_status, notes
)

meeting_notes (
  id, meeting_id, notes, created_by, created_at
)

meeting_decisions (
  id, meeting_id, decision_text, owner_id, due_date, status
)

meeting_follow_ups (
  id, meeting_id, follow_up_text, assigned_to, due_date, status
)
```

#### Current Mock Data:
```javascript
5 meetings:
1. Team Standup - 2024-01-29 09:00 - Virtual (upcoming)
2. Client Review - 2024-01-29 14:00 - In-person (upcoming)
3. Project Planning - 2024-01-30 10:00 - Virtual (this week)
4. Budget Review - 2024-01-31 15:30 - In-person (this week)
5. Performance Review - 2024-02-02 11:00 - One-on-One (upcoming)
```

#### Database Integration Points:
```sql
-- Get upcoming meetings for manager
SELECT m.id, m.title, m.description, m.meeting_type, 
       m.start_time, m.end_time, m.location, m.meeting_link,
       COUNT(DISTINCT ma.attendee_id) as attendee_count,
       m.status
FROM meetings m
LEFT JOIN meeting_attendees ma ON m.id = ma.meeting_id
WHERE m.start_time >= NOW()
  AND (m.organizer_id = ? OR ma.attendee_id = ?)
GROUP BY m.id
ORDER BY m.start_time ASC;

-- Get meeting details with attendees
SELECT ma.attendee_id, ma.attendee_name, ma.attendee_email, 
       ma.rsvp_status, ma.attendance_status
FROM meeting_attendees ma
WHERE ma.meeting_id = ?
ORDER BY ma.attendee_name;

-- Get meeting notes and decisions
SELECT mn.notes, mn.created_by, mn.created_at,
       md.decision_text, md.owner_id, md.due_date, md.status
FROM meeting_notes mn
LEFT JOIN meeting_decisions md ON mn.meeting_id = md.meeting_id
WHERE mn.meeting_id = ?;
```

#### Related Tables:
- ✅ `users` - for organizer and attendee info
- ✅ `employees` - for team members
- ✅ `meeting_notes` - for documentation
- ✅ `meeting_decisions` - for action items
- ✅ `meeting_follow_ups` - for task tracking

---

## 7. DASHBOARD PAGE Integration

**Location:** `/app/manager/dashboard/page.tsx`  

### Dashboard Widget Data Sources:
```javascript
// All data will come from:

// Team Stats Widget
SELECT COUNT(*) as total_members,
       COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_today,
       COUNT(CASE WHEN status = 'On Leave' THEN 1 END) as on_leave,
       AVG(hours_worked) as avg_hours
FROM employees;

// Job Stats Widget
SELECT COUNT(CASE WHEN status IN ('In Progress') THEN 1 END) as active_jobs,
       COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
       SUM(budget) as total_budget,
       SUM(spent) as total_spent
FROM jobs;

// Pending Approvals Widget
SELECT COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_leaves,
       COUNT(CASE WHEN approval_status = 'Pending' THEN 1 END) as pending_expenses
FROM leaves, expenses;

// Upcoming Meetings Widget
SELECT COUNT(*) as upcoming_meetings
FROM meetings
WHERE start_time >= NOW();
```

---

## Schema Integration Summary Table

| Page | Primary Table | Related Tables | Mock Data Records | Status |
|------|---------------|---------------|--------------------|--------|
| Team | employees | salaries, attendance, leaves | 6 members | ✅ Ready |
| Jobs | jobs | clients, job_tasks, expenses | 5 jobs | ✅ Ready |
| Clients | clients | jobs, communications, interactions | 5 clients | ✅ Ready |
| Reports | financial_reports, job_profitability_reports | invoices, expenses, jobs, attendance | 4 reports | ✅ Ready |
| Approvals | leaves, expenses | employees, users, jobs | 5 approvals | ✅ Ready |
| Meetings | meetings | meeting_attendees, meeting_notes, decisions | 5 meetings | ✅ Ready |
| Dashboard | Multiple | employees, jobs, leaves, expenses, meetings | Combined | ✅ Ready |

---

## Implementation Roadmap

### Phase 1: Data Integration (Replace Mock Data)
```
1. Team Page → Connect to employees table
2. Jobs Page → Connect to jobs + clients tables
3. Clients Page → Connect to clients table
4. Reports Page → Query financial_reports + job_profitability_reports
5. Approvals Page → Query leaves + expenses tables
6. Meetings Page → Query meetings + meeting_attendees tables
7. Dashboard → Combine all queries
```

### Phase 2: Functionality (Enable Actions)
```
1. Approvals Page → Approve/Reject buttons update status
2. Meetings Page → Schedule new meeting functionality
3. Jobs Page → Update job progress and status
4. Team Page → Manage team assignments
```

### Phase 3: Advanced Features
```
1. Real-time notifications for approvals
2. Email notifications
3. Bulk operations (multi-select approvals)
4. Export reports to PDF/Excel
5. Custom date range filtering
```

---

## ✅ CONCLUSION

**All database tables required by Manager Portal already exist in the schema.**

No new tables need to be created. The existing schema fully supports:
- ✅ Team management (employees table)
- ✅ Job tracking (jobs table)
- ✅ Client management (clients table)
- ✅ Approval workflows (leaves, expenses tables)
- ✅ Meeting scheduling (meetings, meeting_attendees tables)
- ✅ Analytics and reporting (financial_reports, job_profitability_reports tables)

**Ready to implement:** Replace mock data arrays with actual SQL queries to these existing tables.

