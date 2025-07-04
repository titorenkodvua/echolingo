#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');

const speakerColors = [chalk.green, chalk.blue, chalk.yellow, chalk.red, chalk.magenta, chalk.cyan];

function printSegments(transcription) {
  if (!transcription.sentences) {
    console.log(chalk.red('Нет предложений в транскрипции.'));
    return;
  }
  let segmentCount = 0;
  for (const sentence of transcription.sentences) {
    for (const utt of sentence.utterances) {
      if (utt.is_segment_start) {
        segmentCount++;
        console.log(chalk.bold.bgWhite.black(`\n--- SEGMENT ${segmentCount} ---`));
      }
      const speakerIdx = typeof utt.speaker === 'number' ? utt.speaker : 0;
      const color = speakerColors[speakerIdx % speakerColors.length];
      const speakerLabel = chalk.gray(`[Speaker ${utt.speaker}]`);
      console.log(color(`${speakerLabel} ${utt.text}`));
    }
  }
}

// CLI
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --input <segmented.json>')
  .option('input', { alias: 'i', describe: 'Input JSON file', demandOption: true, type: 'string' })
  .help()
  .argv;

const inputPath = path.resolve(argv.input);
const raw = fs.readFileSync(inputPath, 'utf-8');
const transcription = JSON.parse(raw);
printSegments(transcription); 