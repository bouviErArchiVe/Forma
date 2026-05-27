/** ZIP minimal (store, sans compression) pour exports dossiers. */

function crc32buf(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc = crc32Table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ -1) >>> 0
}

const crc32Table = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c >>> 0
  }
  return t
})()

function u16(n) {
  const b = new Uint8Array(2)
  new DataView(b.buffer).setUint16(0, n, true)
  return b
}

function u32(n) {
  const b = new Uint8Array(4)
  new DataView(b.buffer).setUint32(0, n >>> 0, true)
  return b
}

function concat(chunks) {
  const len = chunks.reduce((s, c) => s + c.length, 0)
  const out = new Uint8Array(len)
  let off = 0
  chunks.forEach((c) => { out.set(c, off); off += c.length })
  return out
}

function toBytes(data) {
  if (data instanceof Uint8Array) return data
  return new TextEncoder().encode(String(data))
}

function dosTimeDate(d = new Date()) {
  const dt = d
  const dosTime = ((dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >> 1)) & 0xffff
  const dosDate = (((dt.getFullYear() - 1980) << 9) | ((dt.getMonth() + 1) << 5) | dt.getDate()) & 0xffff
  return { dosTime, dosDate }
}

/** @param {{ name: string, data: string|Uint8Array }[]} files */
export function buildZip(files) {
  const localParts = []
  const centralParts = []
  let offset = 0
  const now = dosTimeDate()

  files.forEach(({ name, data }) => {
    const path = toBytes(name.replace(/\\/g, '/'))
    const body = toBytes(data)
    const crc = crc32buf(body)
    const size = body.length

    const localHeader = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0),
      u16(now.dosTime), u16(now.dosDate), u32(crc), u32(size), u32(size),
      u16(path.length), u16(0), path, body,
    ])
    localParts.push(localHeader)

    const centralHeader = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0),
      u16(now.dosTime), u16(now.dosDate), u32(crc), u32(size), u32(size),
      u16(path.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), path,
    ])
    centralParts.push(centralHeader)
    offset += localHeader.length
  })

  const central = concat(centralParts)
  const locals = concat(localParts)
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(central.length), u32(locals.length), u16(0),
  ])
  return concat([locals, central, end])
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function safeExportName(name) {
  return String(name || 'export').replace(/[^\w\- ]+/g, '_').replace(/\s+/g, '_').slice(0, 80)
}
