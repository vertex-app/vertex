const OpenApiMod = require('../model/OpenApiMod');

const openApiMod = new OpenApiMod();

class OpenApi {
  async widget (req, res) {
    const image = await openApiMod.widget(req.query);
    res.setHeader('content-type', 'image/png');
    res.send(image);
  }

  async siteInfo (req, res) {
    const image = await openApiMod.siteInfo(req.query);
    res.setHeader('content-type', 'image/jpeg');
    res.send(image);
  }
}
module.exports = OpenApi;
