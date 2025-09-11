export default {
  apps: [
    {
      name: 'vida-smart-coach-preview',
      script: 'npx',
      args: 'pnpm run preview',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'production',
        PORT: 4173,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      pid_file: './logs/pm2.pid',
    },
  ],
};