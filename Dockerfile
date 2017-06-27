FROM makeomatic/node:$NODE_VERSION-onbuild

ENV NCONF_NAMESPACE=MS_MAILER \
    NODE_ENV=$NODE_ENV

# adds latex package
RUN \
  echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories \
  && apk --no-cache add texlive

VOLUME ["/src/templates"]
