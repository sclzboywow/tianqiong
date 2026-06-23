/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "tianqiong-internal-test",
      script: "npm",
      args: "run start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "3500M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
