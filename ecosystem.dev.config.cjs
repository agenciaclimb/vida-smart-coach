module.exports = {
  apps: [{
    name: 'vida-smart-dev',
    script: 'npm',
    args: 'run dev -- --port 3000 --host 0.0.0.0',
    cwd: '/home/user/webapp',
    watch: false,
    env: {
      NODE_ENV: 'development'
    },
    max_memory_restart: '500M',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_restarts: 3,
    min_uptime: '10s'
  }]
};