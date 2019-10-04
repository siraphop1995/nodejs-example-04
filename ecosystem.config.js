module.exports = {
  apps: [
    {
      name: 'express04',
      script: 'server.js',
      env: {
        PORT: 3000,
        NODE_ENV: 'development',
        MONGO_URL: 'mongodb://localhost:27017/express04',
        AUTH_SERVER: 'http://localhost:3000'
      }
    }
  ].map(service => {
    service.env.NODE_ENV = 'development';
    service.watch = true;
    service.instances = 1;
    service.exec_mode = 'cluster';
    return service;
  })
};
