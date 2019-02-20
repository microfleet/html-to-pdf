module.exports = (api) => {
  const plugins = [
    '@babel/plugin-transform-strict-mode',
    '@babel/plugin-proposal-class-properties',
    ['@babel/plugin-proposal-object-rest-spread', {
      useBuiltIns: true,
    }],
  ];

  api.cache(() => process.env.NODE_ENV);

  return {
    plugins,
  };
};
