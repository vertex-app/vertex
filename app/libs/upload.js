const multer = require('multer');
const os = require('os');
const fs = require('fs');
const path = require('path');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, done) => {
      fs.mkdtemp(path.join(os.tmpdir(), 'vertex-upload-'), (err, directory) => {
        if (err) return done(err);
        req.vertexUploadDirectory = directory;
        done(null, directory);
      });
    }
  }),
  limits: { files: 1 }
}).single('file');

module.exports = function (req, res, next) {
  // 备份可能包含凭据，使用权限为 700 的独立目录，并在失败时同样清理。
  let removed = false;
  const cleanup = () => {
    if (removed || !req.vertexUploadDirectory) return;
    removed = true;
    fs.rm(req.vertexUploadDirectory, { recursive: true, force: true }, () => {});
  };
  upload(req, res, err => {
    if (err) { cleanup(); return next(err); }
    if (!req.file) return res.status(400).send({ success: false, message: '请选择备份文件' });
    // 响应完成或连接中断后删除临时上传文件，恢复过程始终使用磁盘文件。
    res.once('finish', cleanup);
    res.once('close', cleanup);
    next();
  });
};
