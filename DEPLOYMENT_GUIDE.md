# Call Master Control Tower - Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ (real database at 122.184.128.90)
- Real database credentials (no mock data)
- Production domain for CORS

## Database Setup

### 1. Canonical Schema (Shivamgiri/mas_hrms)

Run SQL scripts in order:

```bash
cd sql/
mysql -h 122.184.128.90 -u [username] -p Shivamgiri < 01_process_master.sql
mysql -h 122.184.128.90 -u [username] -p Shivamgiri < 02_call_master.sql
mysql -h 122.184.128.90 -u [username] -p Shivamgiri < 03_coaching_governance.sql
mysql -h 122.184.128.90 -u [username] -p Shivamgiri < 04_summary_tables.sql
```

**Required Tables:**
- `ci_process_master` (process definitions)
- `ci_call_master` (canonical call records)
- `ci_coaching_triggers` (coaching events)
- `ci_governance_actions` (governance actions)
- `cm_process_daily_summary` (aggregated metrics)
- `user_scope_mapping` (RBAC permissions)
- `users` (authentication)

### 2. External Databases (READ-ONLY)

**No setup required** - these databases already exist:
- `db_external.CallDetails` (raw outbound calls)
- `db_audit.call_quality_assessment` (raw inbound quality)
- `Shivamgiri.dialer_db.*` (legacy dialer data)

**⚠️ CRITICAL: NEVER write to db_external or db_audit**

### 3. Heavy Views Warning

**DO NOT CREATE:**
- ❌ Complex JOINs across db_external + Shivamgiri
- ❌ Materialized views on external tables
- ❌ Full table scans on CallDetails (500K+ rows)
- ❌ Aggregate views without WHERE clauses

**Safe Patterns:**
- ✅ `WHERE process_code = ?` (indexed)
- ✅ `WHERE call_id = ?` (primary key)
- ✅ Date range filters on indexed date columns
- ✅ Connection pool limits (10 connections)

## Environment Setup

### Backend (.env)

```bash
cd backend/
cp .env.example .env
# Edit .env with real credentials
```

**Required Variables:**
```env
DB_HOST=122.184.128.90
DB_PORT=3306
DB_USER=your_real_username
DB_PASSWORD=your_real_password
DB_APP=Shivamgiri
DB_EXTERNAL=db_external
DB_AUDIT=db_audit
PORT=5000
AUTH_MODE=jwt
JWT_SECRET=[32+ character random string]
JWT_EXPIRY=24h
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend (.env)

```bash
cd frontend/
cp .env.example .env
```

```env
VITE_API_BASE=https://api.yourdomain.com
```

## Backend Deployment

### Development

```bash
cd backend/
npm install
npm run dev    # ts-node-dev with hot reload
```

### Production

```bash
cd backend/
npm install --production
npm run build  # Compile TypeScript → dist/
npm start      # Run dist/server.js
```

**Production Checklist:**
- ✅ Set `AUTH_MODE=jwt` (not mock)
- ✅ Strong `JWT_SECRET` (32+ chars)
- ✅ `NODE_ENV=production`
- ✅ CORS configured to frontend domain
- ✅ Helmet.js enabled (already configured)
- ✅ Database credentials secure
- ✅ `.env` not committed to git

**Process Manager (PM2):**
```bash
npm install -g pm2
pm2 start dist/server.js --name call-master-api
pm2 startup
pm2 save
```

## Frontend Deployment

### Development

```bash
cd frontend/
npm install
npm run dev    # Vite dev server on port 5173
```

### Production Build

```bash
cd frontend/
npm install
npm run build  # Output: dist/
```

**Deploy dist/ to:**
- Static hosting (Vercel, Netlify, AWS S3 + CloudFront)
- Nginx reverse proxy
- Apache with mod_rewrite

### Nginx Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/call-master/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Password Rotation

**⚠️ CRITICAL SECURITY:**

1. **Schedule:** Rotate every 90 days minimum
2. **Process:**
   ```bash
   # 1. Generate new password
   NEW_PASS=$(openssl rand -base64 32)
   
   # 2. Update MySQL user
   mysql -h 122.184.128.90 -u root -p
   mysql> ALTER USER 'call_master_user'@'%' IDENTIFIED BY '$NEW_PASS';
   mysql> FLUSH PRIVILEGES;
   
   # 3. Update .env
   vim backend/.env  # Update DB_PASSWORD
   
   # 4. Restart backend
   pm2 restart call-master-api
   
   # 5. Test connection
   curl http://localhost:5000/api/health
   ```

3. **Audit Log:** Document rotation in security log
4. **Backup:** Store old password in secure vault for 7 days (rollback window)

## Production Environment Notes

### Port Configuration

- **Backend:** 5000 (configurable via `PORT`)
- **Frontend Dev:** 5173 (Vite default)
- **Frontend Prod:** 80/443 (Nginx/Apache)

### CORS Setup

Update `backend/src/server.ts` for production:

```typescript
app.use(cors({
  origin: 'https://yourdomain.com',  // Single domain
  credentials: true
}));
```

### SSL/TLS

Use Let's Encrypt or cloud provider certificates:

```bash
certbot --nginx -d yourdomain.com
```

### Database Connections

- **Pool Size:** 10 (already configured)
- **Wait for Connections:** true (prevents timeout errors)
- **Connection Timeout:** 10s (default)
- **Queue Limit:** 0 (unlimited)

**Monitor connections:**
```sql
SHOW PROCESSLIST;
SELECT COUNT(*) FROM information_schema.PROCESSLIST 
WHERE USER = 'call_master_user';
```

### Logging

**Backend logs:**
```bash
pm2 logs call-master-api
pm2 logs call-master-api --lines 100
```

**Enable structured logging:**
```typescript
// Add to server.ts
import winston from 'winston';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Monitoring

**Health Check:**
```bash
curl http://localhost:5000/api/health
# Response: {"success":true,"status":"running","service":"Call Master Control Tower API"}
```

**Database Check:**
```bash
curl http://localhost:5000/api/diagnostics/deployment-checklist
```

**Uptime Monitoring:** Use Pingdom, UptimeRobot, or cloud provider

### Backups

**Database:**
```bash
# Daily backup script
mysqldump -h 122.184.128.90 -u [user] -p Shivamgiri \
  ci_process_master ci_call_master ci_coaching_triggers \
  ci_governance_actions cm_process_daily_summary > \
  backup_$(date +%Y%m%d).sql

# Retention: 30 days
find /backups/ -name "backup_*.sql" -mtime +30 -delete
```

**Code:**
```bash
# Git tag releases
git tag -a v1.0.0 -m "Phase 1-9 complete"
git push origin v1.0.0
```

## Rollback Plan

**If deployment fails:**

1. **Restore previous version:**
   ```bash
   pm2 stop call-master-api
   git checkout v1.0.0  # Previous stable tag
   cd backend && npm run build && pm2 restart call-master-api
   ```

2. **Database rollback:**
   ```bash
   mysql -h 122.184.128.90 -u [user] -p Shivamgiri < backup_YYYYMMDD.sql
   ```

3. **Verify:**
   ```bash
   curl http://localhost:5000/api/health
   curl http://localhost:5000/api/processes
   ```

## Troubleshooting

### Backend won't start

```bash
# Check logs
pm2 logs call-master-api --err

# Common issues:
# - DB credentials wrong → verify .env
# - Port already in use → lsof -i :5000
# - Missing dependencies → npm install
```

### Frontend blank page

```bash
# Check browser console for errors
# Common issues:
# - CORS error → check CORS_ORIGIN in backend
# - API_BASE wrong → check VITE_API_BASE in frontend .env
# - Build failed → npm run build and check output
```

### Database connection timeout

```bash
# Test connection
mysql -h 122.184.128.90 -u [user] -p Shivamgiri -e "SELECT 1"

# Check firewall
telnet 122.184.128.90 3306

# Verify pool settings in backend/src/config/db.ts
```

### High database load

```bash
# Check slow queries
mysql> SET GLOBAL slow_query_log = 'ON';
mysql> SET GLOBAL long_query_time = 2;
mysql> SHOW VARIABLES LIKE 'slow_query_log_file';

# Analyze
pt-query-digest /var/log/mysql/slow.log
```

## Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] AUTH_MODE=jwt (not mock)
- [ ] .env files not committed
- [ ] Database password rotated (90 days)
- [ ] CORS restricted to production domain
- [ ] HTTPS enabled (SSL certificate)
- [ ] Helmet.js enabled (already configured)
- [ ] SQL injection protection via qid() (already implemented)
- [ ] RBAC enforced (already implemented)
- [ ] No writes to db_external or db_audit
- [ ] Rate limiting configured (optional, recommended)
- [ ] Firewall rules restrict DB access (IP whitelist)

## Post-Deployment

1. **Smoke Tests:**
   ```bash
   curl https://yourdomain.com/api/health
   curl https://yourdomain.com/api/processes
   ```

2. **User Acceptance:**
   - Login as T&Q Head
   - Select FINNABLE process
   - Open Audit 360 on a call
   - Create coaching trigger
   - Verify governance actions

3. **Monitoring Setup:**
   - Health check alerts
   - Database connection alerts
   - Error rate tracking
   - Response time monitoring

4. **Documentation:**
   - Share deployment date
   - Update runbook
   - Train operations team
   - Document rollback procedure

## Support Contacts

- **Database Issues:** DBA team
- **Application Errors:** Development team
- **RBAC/Access:** Security team
- **Infrastructure:** DevOps team
