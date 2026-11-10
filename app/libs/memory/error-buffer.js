class ErrorBuffer {
  constructor (limit = 5, maxBytes = 64 * 1024) {
    this.limit = limit;
    this.maxBytes = maxBytes;
    this.entries = [];
  }

  push (data) {
    try {
      const seen = new WeakSet();
      let remaining = this.maxBytes;
      const value = JSON.stringify(data, (key, item) => {
        if (/cookie|password|authorization|cert/i.test(key)) return '[已隐藏]';
        if (item instanceof Error) item = { message: item.message, stack: item.stack };
        if (typeof item === 'object' && item !== null) {
          if (seen.has(item)) return '[循环引用]';
          seen.add(item);
        }
        if (typeof item === 'string') {
          const buffer = Buffer.from(item);
          const text = buffer.subarray(0, Math.max(0, remaining)).toString('utf8');
          remaining -= Buffer.byteLength(text);
          return text;
        }
        if (typeof item === 'bigint') return item.toString();
        return item;
      });
      // Large object structures also have to fit, not only their string fields.
      this.entries.push(value && Buffer.byteLength(value) <= this.maxBytes ? JSON.parse(value) : ['错误内容过长']);
    } catch (e) {
      this.entries.push(['错误内容无法序列化']);
    }
    while (this.entries.length > this.limit) this.entries.shift();
  }

  drain () {
    const entries = this.entries;
    this.entries = [];
    return entries;
  }
}

module.exports = new ErrorBuffer();
module.exports.ErrorBuffer = ErrorBuffer;
