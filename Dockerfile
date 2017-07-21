FROM makeomatic/node:$NODE_VERSION-chrome-onbuild

ENV NCONF_NAMESPACE=MS_PRINTER \
    NODE_ENV=$NODE_ENV

VOLUME ["/src/templates"]
