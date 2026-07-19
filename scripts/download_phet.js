const fs = require('fs');
const path = require('path');
const https = require('https');

const sims = [
  'color-vision',
  'area-builder',
  'balancing-act',
  'fraction-matcher',
  'make-a-ten',
  'energy-skate-park-basics',
  'forces-and-motion-basics',
  'gravity-and-orbits',
  'under-pressure',
  'states-of-matter-basics',
  'john-travoltage',
  'friction',
  'balloons-and-static-electricity',
  'bending-light',
  'circuit-construction-kit-dc-virtual-lab',
  'density',
  'ph-scale-basics',
  'wave-on-a-string',
  'build-a-fraction',
  'masses-and-springs-basics'
];

const targetDir = path.join(__dirname, '../frontend/public/phet');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadSim(simName) {
  const url = `https://phet.colorado.edu/sims/html/${simName}/latest/${simName}_all.html`;
  const filePath = path.join(targetDir, `${simName}.html`);
  
  console.log(`Downloading ${simName}...`);
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Failed to download ${simName}: Status ${res.statusCode}`);
        res.resume();
        resolve(false);
        return;
      }
      const file = fs.createWriteStream(filePath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Saved ${simName}.html`);
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.error(`Error downloading ${simName}: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  for (const sim of sims) {
    await downloadSim(sim);
  }
  console.log("Finished downloading PhET simulations.");
}

main();
