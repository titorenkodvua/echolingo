# Automatic Transcription Segmentation Algorithm

## Problem Description

Automatic segmentation splits a transcription of an audio recording into logical segments (fragments) to facilitate further processing, analysis, or learning. Segments are formed according to a flexible set of rules, taking into account length, speakers, sentence boundaries, and more.

---

## Input Data Format

A transcription is an object with the following structure:

```js
{
  language: String, // original language
  full_transcript: String,
  count_of_speakers: Number,
  translation: [ ... ], // translations of the entire text
  sentences: [
    {
      id: String,
      sentence: String,
      speaker: Number,
      start: Number,
      end: Number,
      translation: [ ... ], // translations of the sentence
      utterances: [
        {
          id: String,
          is_segment_start: Boolean, // set by the algorithm
          speaker: Number,
          text: String,
          start: Number,
          end: Number,
          confidence: Number,
          translation: [ ... ] // translations of the utterance
        }
      ]
    }
  ]
}
```

---

## Segmentation Parameters

- **minWords**: minimum number of words per segment
- **maxWords**: maximum number of words per segment
- **allowDifferentSpeakers**: whether utterances from different speakers can be combined into one segment
- **allowCutInsideSentence**: whether cuts inside a sentence are allowed (if false, segments only at sentence boundaries)
- **avoidSmallSegments**: avoid small segments (if true, short segments are merged with the previous one if possible)

---

## Algorithm Logic

### 1. Segmentation only at sentence boundaries (`allowCutInsideSentence: false`)
- Segments are formed from whole sentences.
- If `allowDifferentSpeakers: false`, segments do not cross speaker boundaries.
- If a segment exceeds `maxWords` and has reached `minWords`, it is closed.
- If `avoidSmallSegments: true`, short segments are merged with the previous one (if possible).

### 2. Segmentation by utterance (`allowCutInsideSentence: true`)
- Segments can start and end at any utterance.
- If `allowDifferentSpeakers: false`, segments do not cross speaker boundaries.
- If a segment exceeds `maxWords` and has reached `minWords`, it is closed.
- If `avoidSmallSegments: true`, short segments are merged with the previous one (if possible).

### 3. General Rules
- For each segment, the `is_segment_start` flag is set on the first utterance.
- Segments cannot be empty.
- If it is impossible to avoid a short segment (e.g., a short sentence), it remains as is.

---

## Edge Cases
- **Short sentences/utterances**: if the length is less than `minWords` and merging is impossible, the segment remains short.
- **Speaker change**: if combining different speakers is not allowed, the segment is closed on speaker change.
- **Long utterances**: if a single utterance exceeds `maxWords`, it becomes a separate segment.

---

## Example Usage (CLI)

```bash
node backend/segment-transcription.js \
  --input input.json \
  --output output.json \
  --minWords 5 \
  --maxWords 15 \
  --allowDifferentSpeakers false \
  --allowCutInsideSentence false \
  --avoidSmallSegments true \
  --logFile output.log
```

- `output.json` — result with `is_segment_start` flags set.
- `output.log` — detailed segment breakdown (speaker, word count, text).

---

## Example Segmented Output

```
SEGMENTATION PARAMETERS:
  minWords: 5
  maxWords: 15
  allowDifferentSpeakers: false
  allowCutInsideSentence: false
  avoidSmallSegments: true

--- SEGMENT 1 ---
  Speaker: 0 | WordsCount: 12
    [0] (4) Hello, how are you?
    [0] (8) I'm fine, thank you!

--- SEGMENT 2 ---
  Speaker: 1 | WordsCount: 7
    [1] (7) And you?
```

---

## Testing

For automated validation, use the script `backend/test-segmentation.js`, which:
- Runs different parameter sets on test and real transcriptions from the database.
- Saves results and logs for analysis.
- Checks that segments comply with the rules (minWords, maxWords, speakers, etc.).

---

## Recommendations
- For new languages and data structures, ensure the structure matches the format above.
- For complex cases, use the `--logFile` option to analyze segments.
- For batch testing, use `TEST_DB=1 node backend/test-segmentation.js`.

---

## Authors & Support
- The algorithm is implemented in `backend/segment-transcription.js`.
- For questions and suggestions, use issues in the repository. 