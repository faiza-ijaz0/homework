# Database Schema Implementation Guide

## Overview
Complete database schema for Homeware Admin Portal with 73 tables across 14 modules. This guide provides step-by-step implementation instructions.

## Quick Start

### 1. Database Setup
```sql
-- Create database
CREATE DATABASE homeware_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE homeware_erp;

-- Run Part 1 (Admin, HR, Finance, Jobs - 42 tables)
SOURCE /path/to/DATABASE_SCHEMA_MIGRATION_PART1.sql;

-- Run Part 2 (Products, CRM, Meetings, Surveys, Blog, Equipment - 31 tables)
SOURCE /path/to/DATABASE_SCHEMA_MIGRATION_PART2.sql;
```

### 2. Verify Installation
```sql
-- Check all tables created
SHOW TABLES;

-- Expected output: 73 tables
SELECT COUNT(*) as table_count FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'homeware_erp';

-- Check all relationships
SELECT * FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'homeware_erp' AND REFERENCED_TABLE_NAME IS NOT NULL;
```

## Implementation Timeline

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create database and run migrations
- [ ] Create initial user accounts and roles
- [ ] Set up audit logging
- [ ] Configure system settings

### Phase 2: HR Module (Week 2-3)
- [ ] Import employee data
- [ ] Set up salary structures
- [ ] Configure leave types
- [ ] Initialize attendance tracking

### Phase 3: Finance Module (Week 3-4)
- [ ] Import client data
- [ ] Set up invoice templates
- [ ] Configure payment methods
- [ ] Import historical financial data

### Phase 4: Jobs Module (Week 4-5)
- [ ] Create job templates
- [ ] Import service types
- [ ] Set up team assignments
- [ ] Initialize job checklist templates

### Phase 5: Additional Modules (Week 5-6)
- [ ] Set up products and inventory
- [ ] Configure CRM leads management
- [ ] Initialize meetings and surveys
- [ ] Set up equipment tracking

## Data Migration Strategy

### For Existing Databases
```sql
-- 1. Export from old system
SELECT * INTO OUTFILE '/path/file.txt' FROM old_table;

-- 2. Transform data (use mapping scripts)
-- 3. Load into new tables
LOAD DATA INFILE '/path/file.txt' INTO TABLE new_table;

-- 4. Verify row counts
SELECT COUNT(*) FROM old_table;
SELECT COUNT(*) FROM new_table;
```

### Critical Validations
```sql
-- Check referential integrity
SELECT * FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
WHERE c.id IS NULL;

-- Check for orphaned records
SELECT * FROM payments p
WHERE p.invoice_id NOT IN (SELECT id FROM invoices);

-- Verify date consistency
SELECT * FROM leaves
WHERE start_date > end_date;
```

## Security Configuration

### 1. User Roles
```sql
INSERT INTO roles (id, name, level, description, status) VALUES
('ROLE001', 'Super Admin', 'super', 'Full system access', 'Active'),
('ROLE002', 'Admin', 'admin', 'Admin portal access', 'Active'),
('ROLE003', 'Manager', 'manager', 'Team management', 'Active'),
('ROLE004', 'Supervisor', 'supervisor', 'Direct supervision', 'Active'),
('ROLE005', 'User', 'user', 'Basic user access', 'Active'),
('ROLE006', 'Guest', 'guest', 'Limited viewing access', 'Active');
```

### 2. Permission Assignment
```sql
-- Super Admin gets all permissions
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT CONCAT('RP_', UUID()), 'ROLE001', id FROM permissions;

-- Admin gets most permissions (exclude delete_content)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT CONCAT('RP_', UUID()), 'ROLE002', id FROM permissions
WHERE name NOT IN ('manage_system');
```

### 3. Enable Audit Logging
```sql
-- All user actions automatically logged to audit_logs
-- Trigger on INSERT/UPDATE/DELETE for key tables
-- Retention: 90 days minimum for compliance
```

## Backup & Recovery

### Backup Strategy
```bash
# Daily backups (MySQL)
mysqldump -u root -p homeware_erp > backup_$(date +%Y%m%d).sql

# Weekly full backup
mysqldump -u root -p --all-databases > full_backup_$(date +%Y%m%d).sql

# Store backups in: /backups/homeware_erp/
```

### Recovery Procedure
```sql
-- Full restore
mysql -u root -p homeware_erp < backup_20260128.sql;

-- Point-in-time recovery (if available)
mysqlbinlog binlog.000001 | mysql -u root -p homeware_erp;
```

## Performance Optimization

### Query Optimization Tips
1. **Always use indexes** for WHERE, JOIN, and ORDER BY clauses
2. **Batch updates** for large data operations
3. **Archive old records** from audit_logs quarterly
4. **Use EXPLAIN** to analyze query performance

```sql
-- Check slow queries
SET SESSION long_query_time = 2;
SELECT * FROM mysql.slow_log;

-- Analyze table structure
ANALYZE TABLE invoices;
ANALYZE TABLE employees;
ANALYZE TABLE jobs;
```

### Index Maintenance
```sql
-- Rebuild indexes monthly
OPTIMIZE TABLE invoices;
OPTIMIZE TABLE employees;
OPTIMIZE TABLE audit_logs;

-- Monitor index usage
SELECT * FROM sys.schema_unused_indexes;
```

## Maintenance Tasks

### Daily
- [ ] Check system_activity_logs for anomalies
- [ ] Review audit_logs for unauthorized access
- [ ] Verify backup completion

### Weekly
- [ ] Review invoice aging report
- [ ] Check visa expiry dates
- [ ] Verify payment reconciliation

### Monthly
- [ ] Archive old audit logs (>90 days)
- [ ] Run financial close procedures
- [ ] Update system statistics

### Quarterly
- [ ] Review and optimize slow queries
- [ ] Audit user permissions
- [ ] Verify data integrity

## Integration with Application

### 1. ORM Configuration (Prisma)
```prisma
// schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id    String  @id @default(cuid())
  email String  @unique
  role  Role    @relation(fields: [roleId], references: [id])
  roleId String
}

model Role {
  id   String @id @default(cuid())
  name String @unique
  users User[]
  permissions RolePermission[]
}

// ... (more models for other tables)
```

### 2. Connection String
```
DATABASE_URL="mysql://user:password@localhost:3306/homeware_erp?ssl=prefer"
```

### 3. Initialize Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

## Monitoring & Alerting

### Key Metrics to Monitor
1. **Database Size**: Should not exceed threshold
2. **Connection Pool**: Active connections vs. max
3. **Query Performance**: Avg response time per query
4. **Replication Lag**: If using master-slave setup
5. **Disk Space**: Free space on database server

### Set Up Alerts
```sql
-- Create monitoring view
CREATE VIEW db_monitoring AS
SELECT 
  'table_count' as metric,
  COUNT(*) as value
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'homeware_erp'
UNION ALL
SELECT 
  'total_records',
  SUM(TABLE_ROWS)
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'homeware_erp';
```

## Compliance & Audit

### Data Retention Policy
- **Audit Logs**: Minimum 90 days, 1 year recommended
- **Activity Logs**: Minimum 30 days
- **Deleted Records**: Soft delete with archive table
- **Financial Records**: 7 years minimum

### GDPR Compliance
- [ ] User consent tracking
- [ ] Right to be forgotten implementation
- [ ] Data portability exports
- [ ] Privacy impact assessment

### Security Checklist
- [ ] All passwords hashed (SHA-256 minimum)
- [ ] Connections use SSL/TLS
- [ ] Audit logging enabled for all changes
- [ ] Regular security audits scheduled
- [ ] Backup encryption enabled
- [ ] Access logs monitored

## Troubleshooting

### Common Issues & Solutions

#### 1. Foreign Key Constraint Error
```sql
-- Problem: Cannot delete parent record with children
-- Solution: Check referential integrity
FOREIGN_KEY_CHECKS=1;
SELECT * FROM child_table WHERE parent_id = 'xxx';

-- Then safely delete
DELETE FROM child_table WHERE parent_id = 'xxx';
DELETE FROM parent_table WHERE id = 'xxx';
```

#### 2. Deadlock Errors
```sql
-- Check for long-running transactions
SELECT * FROM information_schema.PROCESSLIST
WHERE TIME > 300;

-- Kill long-running query
KILL QUERY 123;
```

#### 3. Disk Space Issues
```sql
-- Find largest tables
SELECT 
  TABLE_NAME,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'homeware_erp'
ORDER BY (data_length + index_length) DESC;
```

## Support & Resources

### Documentation References
- [MySQL 8.0 Documentation](https://dev.mysql.com/doc/)
- [Homeware Database Schema](DATABASE_SCHEMA_COMPLETE.md)
- [Quick Reference](DATABASE_SCHEMA_QUICK_REFERENCE.md)

### Contact
- **Database Administrator**: [admin contact]
- **System Owner**: [owner contact]
- **Support Email**: support@homeware.com

## Checklist for Go-Live

- [ ] All 73 tables created successfully
- [ ] All foreign key relationships verified
- [ ] Audit logging enabled
- [ ] Backup process tested
- [ ] Restore procedure tested
- [ ] Performance baseline established
- [ ] Security hardening completed
- [ ] User roles and permissions configured
- [ ] Initial data loaded and validated
- [ ] Monitoring and alerting set up
- [ ] Documentation completed
- [ ] Team training completed
- [ ] Change management approval obtained

---

**Last Updated**: 28 January 2026
**Schema Version**: 1.0
**Database**: MySQL 8.0+
**Status**: Ready for Implementation
