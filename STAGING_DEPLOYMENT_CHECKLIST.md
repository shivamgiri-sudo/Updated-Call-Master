# Call Master Control Tower - Staging Deployment Checklist

## Pre-Deployment Requirements

### Server Requirements
- [ ] Ubuntu 20.04 LTS or higher (or CentOS 8+)
- [ ] Minimum 2GB RAM
- [ ] Minimum 20GB disk space
- [ ] Static IP or domain name
- [ ] Root or sudo access

### Software Stack
- [ ] Node.js 18.x or 20.x installed
- [ ] npm 9.x or higher
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Nginx installed and running
- [ ] MySQL client installed (for connection testing)

**Verify Node.js version:**
```bash
node --version   # Should be v18.x or v20.x
npm --version    # Should be 9.x or higher
```

**Install PM2:**
```bash
npm install -g pm2
pm2 --version
```

**Install Nginx:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

sudo systemctl start nginx
sudo systemctl enable nginx
```

### MySQL Database Access
- [ ] MySQL server accessible from staging server (122.184.128.90:3306)
- [ ] Database credentials ready (username, password)
- [ ] Firewall allows outbound connection to MySQL port
- [ ] Test connection: `mysql -h 122.184.128.90 -u [user] -p Shivamgiri -e "SELECT 1"`

**Required databases:**
- `Shivamgiri` (read/write to ci_* tables)
- `db_external` (read-only)
- `db_audit` (read-only)

**Required tables must exist:**
- `Shivamgiri.ci_process_master`
- `Shivamgiri.ci_call_master`
- `Shivamgiri.ci_coaching_triggers`
- `Shivamgiri.ci_governance_actions`
- `Shivamgiri.cm_process_daily_summary`
- `Shivamgiri.users`
- `Shivamgiri.user_scope_mapping`

## Deployment Steps

### 1. Create Deployment Directory
```bash
sudo mkdir -p /opt/call-master
sudo chown $USER:$USER /opt/call-master
cd /opt/call-master
```

### 2. Upload/Clone Code
**Option A: Git Clone**
```bash
git clone [repository-url] /opt/call-master
cd /opt/call-master
git checkout main  # or specific tag/branch
```

**Option B: SCP Upload**
```bash
# From local machine
cd /home/shuvam/Downloads/call-master-control-tower
tar czf call-master.tar.gz backend/ frontend/ sql/ *.md
scp call-master.tar.gz user@staging-server:/tmp/

# On staging server
cd /opt/call-master
tar xzf /tmp/call-master.tar.gz
```

### 3. Backend Setup

#### Install Dependencies
```bash
cd /opt/call-master/backend
npm install --production
```

#### Configure Environment (.env)
```bash
cat > .env << 'EOF'
# Database Configuration
DB_HOST=122.184.128.90
DB_PORT=3306
DB_USER=your_staging_username
DB_PASSWORD=your_staging_password
DB_APP=Shivamgiri
DB_EXTERNAL=db_external
DB_AUDIT=db_audit

# API Configuration
PORT=5000
NODE_ENV=production

# Authentication
AUTH_MODE=jwt
JWT_SECRET=your_32_plus_character_jwt_secret_for_staging
JWT_EXPIRY=24h

# CORS
CORS_ORIGIN=https://staging.yourdomain.com
EOF

# Secure permissions
chmod 600 .env
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Build Backend
```bash
npm run build
```

#### Test Backend Locally
```bash
node dist/server.js &
sleep 3
curl http://localhost:5000/api/health
# Should return: {"success":true,"status":"running","service":"Call Master Control Tower API"}
kill %1
```

### 4. Frontend Setup

#### Install Dependencies
```bash
cd /opt/call-master/frontend
npm install
```

#### Configure Environment (.env)
```bash
cat > .env << 'EOF'
VITE_API_BASE=https://staging.yourdomain.com/api
EOF
```

#### Build Frontend
```bash
npm run build
```

**Verify build output:**
```bash
ls -lh dist/
# Should see: index.html, assets/ directory
```

### 5. PM2 Configuration

#### Copy Ecosystem Config
```bash
cd /opt/call-master
cp PM2_ECOSYSTEM.config.js ecosystem.config.js
```

#### Start Backend with PM2
```bash
cd /opt/call-master/backend
pm2 start ../ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions printed
```

**Verify PM2:**
```bash
pm2 status
pm2 logs call-master-api --lines 20
```

### 6. Nginx Configuration

#### Copy Nginx Config
```bash
sudo cp /opt/call-master/nginx-call-master.conf /etc/nginx/sites-available/call-master
sudo ln -s /etc/nginx/sites-available/call-master /etc/nginx/sites-enabled/
```

#### Test Nginx Config
```bash
sudo nginx -t
```

#### Reload Nginx
```bash
sudo systemctl reload nginx
```

### 7. Firewall Configuration

#### Open Required Ports
```bash
# Ubuntu (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

**Verify ports:**
```bash
sudo netstat -tulpn | grep -E ':(80|443|5000)'
```

### 8. SSL Certificate (Let's Encrypt)

**Install Certbot:**
```bash
# Ubuntu
sudo apt install certbot python3-certbot-nginx -y

# CentOS
sudo yum install certbot python3-certbot-nginx -y
```

**Obtain Certificate:**
```bash
sudo certbot --nginx -d staging.yourdomain.com
```

**Auto-Renewal Test:**
```bash
sudo certbot renew --dry-run
```

### 9. Database Connection Test

```bash
cd /opt/call-master/backend
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM Shivamgiri.ci_process_master');
  console.log('Process count:', rows[0].count);
  process.exit(0);
})();
"
```

### 10. Smoke Tests

#### Health Check
```bash
curl https://staging.yourdomain.com/api/health
# Expected: {"success":true,"status":"running",...}
```

#### Process List
```bash
curl https://staging.yourdomain.com/api/processes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: {"success":true,"data":[...]}
```

#### Frontend Load
```bash
curl -I https://staging.yourdomain.com/
# Expected: HTTP/1.1 200 OK
```

## Environment Variables Reference

### Backend Required Variables
| Variable | Example | Description |
|----------|---------|-------------|
| DB_HOST | 122.184.128.90 | MySQL host |
| DB_PORT | 3306 | MySQL port |
| DB_USER | staging_user | Database username |
| DB_PASSWORD | [secure_password] | Database password |
| DB_APP | Shivamgiri | Application database |
| DB_EXTERNAL | db_external | External data (read-only) |
| DB_AUDIT | db_audit | Audit data (read-only) |
| PORT | 5000 | Backend API port |
| NODE_ENV | production | Node environment |
| AUTH_MODE | jwt | Authentication mode |
| JWT_SECRET | [32+ chars] | JWT signing secret |
| JWT_EXPIRY | 24h | JWT token expiry |
| CORS_ORIGIN | https://staging.yourdomain.com | Frontend domain |

### Frontend Required Variables
| Variable | Example | Description |
|----------|---------|-------------|
| VITE_API_BASE | https://staging.yourdomain.com/api | Backend API URL |

## Port Configuration

| Service | Port | Access |
|---------|------|--------|
| Nginx | 80 | Public (HTTP) |
| Nginx | 443 | Public (HTTPS) |
| Backend API | 5000 | Internal (proxied via Nginx) |

**Important:** Backend port 5000 should NOT be exposed publicly. Access via Nginx reverse proxy only.

## Backup Plan

### Pre-Deployment Backup
```bash
# Backup existing deployment (if updating)
cd /opt
sudo tar czf call-master-backup-$(date +%Y%m%d_%H%M%S).tar.gz call-master/

# Store backup
sudo mv call-master-backup-*.tar.gz /opt/backups/
```

### Database Backup
```bash
mysqldump -h 122.184.128.90 -u [user] -p Shivamgiri \
  ci_process_master ci_call_master ci_coaching_triggers \
  ci_governance_actions cm_process_daily_summary > \
  staging_backup_$(date +%Y%m%d).sql
```

## Rollback Plan

### If Deployment Fails

**1. Stop new deployment:**
```bash
pm2 stop call-master-api
```

**2. Restore previous version:**
```bash
cd /opt
sudo rm -rf call-master/
sudo tar xzf backups/call-master-backup-[timestamp].tar.gz
```

**3. Restart services:**
```bash
cd /opt/call-master/backend
pm2 start ../ecosystem.config.js
pm2 save
sudo systemctl reload nginx
```

**4. Verify rollback:**
```bash
curl https://staging.yourdomain.com/api/health
pm2 logs call-master-api --lines 50
```

### If Database Issues

```bash
mysql -h 122.184.128.90 -u [user] -p Shivamgiri < staging_backup_YYYYMMDD.sql
```

## Monitoring Setup

### PM2 Monitoring
```bash
pm2 monitor           # Enable PM2 Plus (optional)
pm2 logs call-master-api --lines 100
pm2 monit            # Real-time monitoring
```

### Log Files
```bash
# PM2 logs
~/.pm2/logs/call-master-api-out.log
~/.pm2/logs/call-master-api-error.log

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### Health Check Monitoring
```bash
# Setup cron job for health checks
crontab -e
```

Add:
```
*/5 * * * * curl -f https://staging.yourdomain.com/api/health || echo "API down at $(date)" | mail -s "Staging API Alert" admin@yourdomain.com
```

## Security Checklist

- [ ] `.env` files have 600 permissions
- [ ] Database password is strong (16+ characters)
- [ ] JWT_SECRET is strong (32+ characters random)
- [ ] AUTH_MODE=jwt (not mock)
- [ ] CORS_ORIGIN set to staging domain only
- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (only 80, 443, 22 open)
- [ ] Backend port 5000 not exposed publicly
- [ ] PM2 runs as non-root user
- [ ] Nginx runs as www-data (default)
- [ ] No .env files committed to git
- [ ] Database connections use connection pooling
- [ ] Rate limiting considered (optional for staging)

## Troubleshooting

### Backend won't start
```bash
pm2 logs call-master-api --err
# Common issues:
# - Wrong DB credentials → check .env
# - DB connection refused → check firewall/IP whitelist
# - Port 5000 in use → sudo lsof -i :5000
```

### Frontend shows blank page
```bash
# Check browser console (F12)
# Common issues:
# - CORS error → verify CORS_ORIGIN in backend .env
# - API_BASE wrong → check VITE_API_BASE in frontend .env
# - Build failed → npm run build and check output
```

### SSL certificate issues
```bash
sudo certbot certificates
sudo certbot renew --dry-run
# Check nginx config: sudo nginx -t
```

### Database connection timeout
```bash
# Test connection
mysql -h 122.184.128.90 -u [user] -p Shivamgiri -e "SELECT 1"

# Check firewall (staging server must allow outbound to 3306)
telnet 122.184.128.90 3306
```

## Post-Deployment Verification

- [ ] Health endpoint responds: `/api/health`
- [ ] Process list loads: `/api/processes`
- [ ] Frontend loads without errors
- [ ] Login works (with real user or test user)
- [ ] FINNABLE process selectable
- [ ] Outbound funnel displays data
- [ ] Audit 360 modal opens
- [ ] Coaching trigger creation works
- [ ] Governance actions load
- [ ] Data diagnostics page loads
- [ ] Deployment checklist shows green checks
- [ ] PM2 shows "online" status
- [ ] Nginx access logs show requests
- [ ] No errors in PM2 logs
- [ ] SSL certificate valid (no browser warnings)

## Ready for UAT

Once all checklist items are complete and verified:

1. Document staging URL
2. Create test user accounts for UAT team
3. Share UAT_TEST_CASES.md with testing team
4. Schedule UAT kickoff meeting
5. Monitor logs during UAT for issues
6. Collect feedback for production deployment

## Support Contacts

- **Deployment Issues:** DevOps team
- **Application Errors:** Development team
- **Database Access:** DBA team
- **SSL/Domain:** Infrastructure team
- **Security Review:** Security team
