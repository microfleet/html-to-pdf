module.exports = {
  redis: {
    hosts: Array.from({ length: 3 }).map((_, i) => ({
      host: 'redis-cluster',
      port: 7000 + i,
    })),
  },
};
