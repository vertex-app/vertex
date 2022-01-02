const util = require('./util');

const _getCpuStat = async function () {
  const { stdout } = await util.exec('cat /proc/stat');
  const lines = stdout.trim().split('\n');
  const data = {};
  for (const line of lines) {
    if (line.startsWith('cpu')) {
      const values = line.split(/\s+/);
      const cpuStat = {
        user: parseInt(values[1]),
        nice: parseInt(values[2]),
        system: parseInt(values[3]),
        idle: parseInt(values[4]),
        iowait: parseInt(values[5]),
        irq: parseInt(values[6]),
        softirq: parseInt(values[7]),
        steal: parseInt(values[8] || 0),
        guest: parseInt(values[9] || 0),
        guest_nice: parseInt(values[10] || 0)
      };
      const keys = Object.keys(cpuStat);
      cpuStat.total = 0;
      for (const k of keys) {
        cpuStat.total += cpuStat[k];
      }
      data[values[0].replace(':', '')] = cpuStat;
    }
  }
  return data;
};

exports.getNetSpeed = async function () {
  const { stdout } = await util.exec('sar -n DEV 1 1');
  const lines = stdout.trim().split('\n');
  const netSpeed = {};
  for (const line of lines) {
    if (!line.startsWith('Average') || line.indexOf('IFACE') !== -1) continue;
    const values = line.split(/\s+/);
    const infc = {
      rxBytes: parseInt(values[4] * 1024),
      txBytes: parseInt(values[5] * 1024),
      rxPackets: parseInt(values[2]),
      txPackets: parseInt(values[3])
    };
    netSpeed[values[1]] = infc;
  }
  return netSpeed;
};

exports.getCpuUse = async function () {
  const t1 = await _getCpuStat();
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  const t2 = await _getCpuStat();
  const cpuStat = {};
  for (const k of Object.keys(t1)) {
    cpuStat[k] = {};
    for (const _k of Object.keys(t1[k])) {
      cpuStat[k][_k] = t2[k][_k] - t1[k][_k];
    }
  }
  return cpuStat;
};

exports.getDiskUse = async function () {
  const { stdout } = await util.exec('df');
  const lines = stdout.trim().split('\n');
  const disks = {};
  for (const line of lines) {
    if (!line.startsWith('/dev/')) continue;
    const values = line.split(/\s+/);
    const disk = {
      mountPoint: values[5],
      size: parseInt(values[1]),
      used: parseInt(values[2]),
      left: parseInt(values[3])
    };
    disks[values[0]] = disk;
  }
  return disks;
};

exports.getVnstat5 = async function () {
  const { stdout } = await util.exec('vnstat --json f 24');
  return JSON.parse(stdout.trim());
};

exports.getVnstatHour = async function () {
  const { stdout } = await util.exec('vnstat --json h 24');
  return JSON.parse(stdout.trim());
};

exports.getVnstatDay = async function () {
  const { stdout } = await util.exec('vnstat --json d 30');
  return JSON.parse(stdout.trim());
};

exports.getVnstatMonth = async function () {
  const { stdout } = await util.exec('vnstat --json m 12');
  return JSON.parse(stdout.trim());
};

exports.getMemoryUse = async function () {
  const { stdout } = await util.exec('cat /proc/meminfo');
  const lines = stdout.trim().split('\n');
  const total = parseInt(lines[0].split(/\s+/)[1]);
  const free = parseInt(lines[1].split(/\s+/)[1]);
  const buffers = parseInt(lines[3].split(/\s+/)[1]);
  const cached = parseInt(lines[4].split(/\s+/)[1]);
  return {
    total,
    used: total - free - buffers - cached
  };
};

exports.getNetSpeed();
