const OpenApiMod = require('../model/OpenApiMod');

const openApiMod = new OpenApiMod();

class OpenApi {
  async widget (req, res) {
    const canvas = await openApiMod.widget(req.query);
    res.setHeader('content-type', 'image/png');
    res.send(canvas.toBuffer());
  }
}
module.exports = OpenApi;
