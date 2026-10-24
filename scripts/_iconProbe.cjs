// One-off probe: report size/alpha of the brand marks so we know whether the
// alpha asset can be used as a favicon as-is or needs a transparent cut-out.
const sharp = require('sharp');
const path = require('path');

const files = ['ainos-alpha.png', 'ainos-logo-purple.png', 'ainos-logo.png', 'aino.png'];

(async () => {
  for (const name of files) {
    const file = path.join(__dirname, '..', 'public', name);
    try {
      const img = sharp(file);
      const meta = await img.metadata();
      const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const channels = info.channels;
      let opaque = 0;
      let transparent = 0;
      const corners = [];
      const at = (x, y) => {
        const i = (y * info.width + x) * channels;
        return [data[i], data[i + 1], data[i + 2], data[i + 3]];
      };
      for (let i = 3; i < data.length; i += channels) {
        if (data[i] === 0) transparent++;
        else opaque++;
      }
      corners.push(['TL', at(0, 0)], ['TR', at(info.width - 1, 0)], ['BL', at(0, info.height - 1)], ['BR', at(info.width - 1, info.height - 1)], ['C', at(info.width >> 1, info.height >> 1)]);
      const total = opaque + transparent;
      console.log(`${name}: ${meta.width}x${meta.height} channels=${channels} format=${meta.format}`);
      console.log(`  transparent px: ${transparent} (${((transparent / total) * 100).toFixed(1)}%)`);
      console.log(`  corners: ${corners.map(([k, v]) => `${k}=rgba(${v.join(',')})`).join(' ')}`);
    } catch (error) {
      console.log(`${name}: could not read (${error.message})`);
    }
  }
})();
