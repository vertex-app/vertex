// bencode 4 仅提供 ESM 导出，集中处理 CommonJS 下的异步加载。
module.exports = async () => (await import('bencode')).default;
