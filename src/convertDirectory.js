const fork = require('child_process').fork;
const fs = require('fs');
const path = require('path');
const rxjs = require('../lib/rxjs.umd.min');
const { from } = rxjs;
const { filter, mergeMap } = rxjs.operators;
const milkdropPresetConverter = require('../dist/milkdrop-preset-converter-node.min');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(
    "not enough arguments: yarn run convert preset-directory output-directory presets-in-parallel"
  );
  process.exit(1);
}

function convertPreset (item) {
  return new Promise((resolve, reject) => {
    try {
      // still need to spawn new process to really get parallel
      const preset = fs.readFileSync(`${args[0]}/${item}`, 'utf8');
      const presetOutput = milkdropPresetConverter.convertPreset(preset);

      const presetName = path.basename(`${args[0]}/${item}`);
      const presetOutputName = presetName.replace('.milk', '.json');
      fs.writeFileSync(`${args[1]}/${presetOutputName}`, JSON.stringify(presetOutput));
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

fs.readdir(args[0], (err, items) => {
  from(items)
    .pipe(
      filter((item) => item.endsWith('.milk')),
      mergeMap(
        async (item) => {
          try {
            await convertPreset(item);
          } catch (e) {
            console.log('err %O: %O', item, e);
          }
        },
        (item) => item,
        args[2] || 1
      ))
    .subscribe((item) => console.log('finished: %O', item));
});
