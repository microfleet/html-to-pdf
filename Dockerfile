FROM makeomatic/node:$NODE_VERSION-chrome

ENV NCONF_NAMESPACE=MS_MAILER \
    NODE_ENV=$NODE_ENV

VOLUME ["/src/templates"]
