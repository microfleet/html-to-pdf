# @microfleet/html-to-pdf

HTML to PDF @microfleet service is designed to render any provided mustache template with arbitrary context and is able to send back base64 encoded PDF or upload id in case of integration with @microfleet/files

## Configuration

* Consult with [@microfleet/core](https://github.com/microfleet/core) for generic configuration
* [configuration schema](schemas/config.json) - service configuration options

## API

Description of available API methods

### `pdf.render`

Renders `mustache` template with passed context, feeds that document to Chrome & save it as PDF. Then uploads it to storage of choice using [@microfleet/files](https://github.com/makeomatic/ms-files) or returns PDF as base64 encoded data

Following params are accepted:

```js
{
  "template": "name-of-the-template-to-render",
  "context": {
    ... // arbitrary object with data thats passed to template for rendering
  },
  "documentOptions": {
    ... // chrome's printToPdf document options - https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-printToPDF
  },
  "meta": {
    ... // can be boolean `false` to turn off @microfleet/files integration
    ... // or can be an object defining the upload
  },
}
```

For a detailed description of API params look at [validation schema](schemas/render.json)
