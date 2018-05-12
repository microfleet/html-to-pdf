FROM makeomatic/node:$NODE_VERSION-chrome

ENV NCONF_NAMESPACE=MS_PRINTER \
    NODE_ENV=$NODE_ENV \
    CHROME_PATH=/usr/bin/chromium-browser

WORKDIR /src
VOLUME ["/src/templates"]

COPY yarn.lock package.json ./
RUN \
  apk --update upgrade \
  && apk add --virtual .build-deps \
    g++ \
    make \
    python \
    linux-headers \
  && yarn --production --frozen-lockfile \
  && apk del .build-deps
  && rm -rf \
    /tmp/* \
    /root/.node-gyp \
    /root/.npm \
    /etc/apk/cache/* \
    /var/cache/apk/*

COPY . /src
RUN  chown -R node /src
USER node
