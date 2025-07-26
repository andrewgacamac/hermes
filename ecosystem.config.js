module.exports = {
  apps: [{
    name: 'picotin-monitor',
    script: './server-with-controls.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
      TEST_RECIPIENT_NUMBER: process.env.TEST_RECIPIENT_NUMBER,
      MONITOR_INTERVAL_MINUTES: '5',
      MONITOR_BUSINESS_HOURS_ONLY: 'true',
      MONITOR_START_HOUR: '9',
      MONITOR_END_HOUR: '18',
      MONITOR_WEEKDAYS_ONLY: 'true'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};