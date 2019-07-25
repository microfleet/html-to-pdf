const Promise = require('bluebird');

describe('chrome', () => {
  const config = require('../../src/config');
  const Chrome = require('../../src/utils/chrome');

  const conf = config.get('/', { env: process.env.NODE_ENV });
  const url = 'data:text/html,<html><body><h1>Hello</h1></body></html>';

  let chrome = null;

  beforeAll(async () => {
    chrome = await new Chrome(conf.chrome).init();
  });

  it('inits chrome browser', async () => {
    await chrome;
    // must be defined
    expect(chrome).toBeDefined();
    expect(chrome.launcher).toBeTruthy();
  });

  it('should able to open a tab', async () => {
    const tab = await chrome.openTab();
    const { client: { Page } } = tab;

    try {
      await Promise.all([
        Page.navigate({ url }),
        Page.loadEventFired(),
      ]);
    } finally {
      await Chrome.disposer(tab.target, tab.client);
    }
  });

  it('should able to render a pdf', async () => {
    const pdf = await chrome.printToPdf(url);

    expect(pdf).toBeDefined();
  });

  // close chrome
  afterAll(async () => {
    await chrome.kill();

    expect(chrome.launcher).toBeNull();
  });
});
