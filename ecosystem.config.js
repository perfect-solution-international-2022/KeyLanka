module.exports = {
  apps: [
    {
      name: "keylanka",
      cwd: "/var/www/keylanka",
      script: "npm",
      args: "start -- -p 3000",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
    },
  ],
};
