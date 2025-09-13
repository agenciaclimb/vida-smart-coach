module.exports = {
  apps: [{
    name: 'vida-smart-safeguard',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/user/webapp',
    watch: false,
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    max_memory_restart: '500M',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_restarts: 3,
    min_uptime: '10s',
    log_file: '/home/user/webapp/logs/safeguard-combined.log',
    out_file: '/home/user/webapp/logs/safeguard-out.log',
    error_file: '/home/user/webapp/logs/safeguard-err.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};