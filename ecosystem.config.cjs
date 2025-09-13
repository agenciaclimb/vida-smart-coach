module.exports = {
  apps: [
    {
      name: 'vida-smart-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/user/webapp',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 5173,
        HOST: '0.0.0.0'
      },
      log_file: '/home/user/webapp/logs/combined.log',
      out_file: '/home/user/webapp/logs/out.log',
      error_file: '/home/user/webapp/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 3,
      min_uptime: '10s',
      restart_delay: 1000
    }
  ]
};