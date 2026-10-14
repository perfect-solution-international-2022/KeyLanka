module.exports = {
  apps: [
    {
      name: "keylanka",
      cwd: "/var/www/keylanka",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
    },
  ],
};
