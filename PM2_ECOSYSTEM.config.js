module.exports = {
  apps: [
    {
      name: 'call-master-api',
      script: './dist/server.js',
      cwd: '/opt/call-master/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '~/.pm2/logs/call-master-api-error.log',
      out_file: '~/.pm2/logs/call-master-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000
    }
  ]
};
