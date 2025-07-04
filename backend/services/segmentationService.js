/**
 * SegmentationService — business logic for automatic transcription segmentation.
 * See SEGMENTATION_ALGORITHM.md for details.
 */

class SegmentationService {
  /**
   * @param {Object} defaultOptions - Default segmentation parameters
   */
  constructor(defaultOptions = {}) {
    this.defaultOptions = {
      minWords: 5,
      maxWords: 15,
      allowDifferentSpeakers: false,
      allowCutInsideSentence: false,
      avoidSmallSegments: true,
      ...defaultOptions
    };
  }

  /**
   * Segments a transcription object into logical segments according to rules.
   * @param {Object} transcription - The transcription object (see SEGMENTATION_ALGORITHM.md)
   * @param {Object} options - Segmentation parameters (overrides defaults)
   * @returns {Object} - Transcription object with is_segment_start flags set
   */
  segmentTranscription(transcription, options = {}) {
    const {
      minWords,
      maxWords,
      allowDifferentSpeakers,
      allowCutInsideSentence,
      avoidSmallSegments
    } = { ...this.defaultOptions, ...options };
    if (!transcription.sentences) return transcription;

    // Reset all is_segment_start flags
    for (const sentence of transcription.sentences) {
      for (const utt of sentence.utterances) {
        utt.is_segment_start = false;
      }
    }

    if (!allowCutInsideSentence) {
      // Segmentation only at sentence boundaries
      let segments = [];
      let currentSegment = [];
      let currentSpeaker = null;
      let segmentWordCount = 0;
      for (let i = 0; i < transcription.sentences.length; i++) {
        const sentence = transcription.sentences[i];
        const allUtterancesSameSpeaker = sentence.utterances.every(u => u.speaker === sentence.speaker);
        if (!allowDifferentSpeakers && !allUtterancesSameSpeaker) {
          if (currentSegment.length > 0) {
            segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
          }
          currentSegment = [i];
          currentSpeaker = sentence.speaker;
          segmentWordCount = sentence.utterances.reduce((sum, utt) => sum + utt.text.trim().split(/\s+/).filter(Boolean).length, 0);
          continue;
        }
        if (currentSegment.length === 0) {
          currentSegment.push(i);
          currentSpeaker = sentence.speaker;
          segmentWordCount = sentence.utterances.reduce((sum, utt) => sum + utt.text.trim().split(/\s+/).filter(Boolean).length, 0);
          continue;
        }
        if (!allowDifferentSpeakers && sentence.speaker !== currentSpeaker) {
          segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
          currentSegment = [i];
          currentSpeaker = sentence.speaker;
          segmentWordCount = sentence.utterances.reduce((sum, utt) => sum + utt.text.trim().split(/\s+/).filter(Boolean).length, 0);
          continue;
        }
        currentSegment.push(i);
        segmentWordCount += sentence.utterances.reduce((sum, utt) => sum + utt.text.trim().split(/\s+/).filter(Boolean).length, 0);
        if (segmentWordCount >= minWords && segmentWordCount <= maxWords) {
          continue;
        }
        if (segmentWordCount < minWords) {
          continue;
        }
        if (segmentWordCount > maxWords && segmentWordCount >= minWords) {
          segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
          currentSegment = [];
          currentSpeaker = null;
          segmentWordCount = 0;
        }
      }
      if (currentSegment.length > 0) {
        segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
      }
      // Merge small segments if needed
      if (avoidSmallSegments && segments.length > 1) {
        let mergedSegments = [];
        let prev = segments[0];
        for (let i = 1; i < segments.length; i++) {
          const curr = segments[i];
          if (curr.words < minWords && (!allowDifferentSpeakers && curr.speaker === prev.speaker)) {
            prev.indices = prev.indices.concat(curr.indices);
            prev.words += curr.words;
          } else {
            mergedSegments.push(prev);
            prev = curr;
          }
        }
        mergedSegments.push(prev);
        segments = mergedSegments;
      }
      // Reset all is_segment_start
      for (const sentence of transcription.sentences) {
        for (const utt of sentence.utterances) {
          utt.is_segment_start = false;
        }
      }
      // Set is_segment_start for first utterance of each segment
      for (const seg of segments) {
        const firstSentenceIdx = seg.indices[0];
        transcription.sentences[firstSentenceIdx].utterances[0].is_segment_start = true;
      }
      return transcription;
    } else {
      // Segmentation by utterance
      const flatUtterances = [];
      transcription.sentences.forEach((sentence, sentenceIdx) => {
        sentence.utterances.forEach((utt, uttIdx) => {
          flatUtterances.push({
            ...utt,
            _sentenceIdx: sentenceIdx,
            _uttIdx: uttIdx,
            _speaker: utt.speaker,
            _text: utt.text,
          });
        });
      });
      let segments = [];
      let currentSegment = [];
      let currentSpeaker = null;
      let segmentWordCount = 0;
      for (let i = 0; i < flatUtterances.length; i++) {
        const utt = flatUtterances[i];
        const wordCount = utt._text.trim().split(/\s+/).filter(Boolean).length;
        if (!allowDifferentSpeakers && utt._speaker !== currentSpeaker && currentSegment.length > 0) {
          segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
          currentSegment = [];
          segmentWordCount = 0;
        }
        if (currentSegment.length === 0) {
          currentSegment.push(i);
          currentSpeaker = utt._speaker;
          segmentWordCount = wordCount;
          continue;
        }
        currentSegment.push(i);
        segmentWordCount += wordCount;
        if (segmentWordCount >= minWords && segmentWordCount <= maxWords) {
          continue;
        }
        if (segmentWordCount > maxWords && segmentWordCount - wordCount >= minWords) {
          segments.push({ indices: currentSegment.slice(0, -1), speaker: currentSpeaker, words: segmentWordCount - wordCount });
          currentSegment = [i];
          segmentWordCount = wordCount;
        }
      }
      if (currentSegment.length > 0) {
        segments.push({ indices: currentSegment.slice(), speaker: currentSpeaker, words: segmentWordCount });
      }
      // Merge small segments if needed
      if (avoidSmallSegments && segments.length > 1) {
        let mergedSegments = [];
        let prev = segments[0];
        for (let i = 1; i < segments.length; i++) {
          const curr = segments[i];
          if (curr.words < minWords && (!allowDifferentSpeakers && curr.speaker === prev.speaker)) {
            prev.indices = prev.indices.concat(curr.indices);
            prev.words += curr.words;
          } else {
            mergedSegments.push(prev);
            prev = curr;
          }
        }
        mergedSegments.push(prev);
        segments = mergedSegments;
      }
      // Reset all is_segment_start
      for (const sentence of transcription.sentences) {
        for (const utt of sentence.utterances) {
          utt.is_segment_start = false;
        }
      }
      // Set is_segment_start for first utterance of each segment
      for (const seg of segments) {
        const firstUtt = flatUtterances[seg.indices[0]];
        transcription.sentences[firstUtt._sentenceIdx].utterances[firstUtt._uttIdx].is_segment_start = true;
      }
      return transcription;
    }
  }
}

module.exports = new SegmentationService(); 