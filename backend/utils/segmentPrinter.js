/**
 * Pretty-prints segments to console or file for analysis.
 * @param {Object} transcription - Transcription object
 * @param {Object} options - Segmentation parameters
 * @param {string|null} outputFile - If set, writes to file; otherwise prints to console
 */
function printSegments(transcription, options = {}, outputFile = null) {
  function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
  const lines = [];
  lines.push('SEGMENTATION PARAMETERS:');
  for (const [key, value] of Object.entries(options)) {
    lines.push(`  ${key}: ${value}`);
  }
  lines.push('');
  let segmentCount = 0;
  let segmentWordCount = 0;
  let currentSpeaker = null;
  let currentSegmentUtterances = [];
  for (const sentence of transcription.sentences) {
    for (const utt of sentence.utterances) {
      if (utt.is_segment_start) {
        if (segmentCount > 0) {
          lines.push(`  Speaker: ${currentSpeaker} | WordsCount: ${segmentWordCount}`);
          for (const u of currentSegmentUtterances) {
            lines.push(`    [${u.speaker}] (${countWords(u.text)}) ${u.text}`);
          }
          lines.push('');
        }
        segmentCount++;
        segmentWordCount = 0;
        currentSpeaker = utt.speaker;
        currentSegmentUtterances = [];
        lines.push(`--- SEGMENT ${segmentCount} ---`);
      }
      segmentWordCount += countWords(utt.text);
      currentSegmentUtterances.push(utt);
    }
  }
  // Last segment
  if (segmentCount > 0) {
    lines.push(`  Speaker: ${currentSpeaker} | WordsCount: ${segmentWordCount}`);
    for (const u of currentSegmentUtterances) {
      lines.push(`    [${u.speaker}] (${countWords(u.text)}) ${u.text}`);
    }
    lines.push('');
  }
  const output = lines.join('\n');
  if (outputFile) {
    require('fs').writeFileSync(outputFile, output, 'utf-8');
    console.log(`Segments printed to ${outputFile}`);
  } else {
    console.log(output);
  }
}

module.exports = { printSegments }; 