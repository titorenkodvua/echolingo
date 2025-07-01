 //так ну не плохо, тогда у нас новая структура данных для хранения траскриции должна выглядеть примерно так.

const transcription = {
    language: String, // язык оригинала
    full_transcript: String,
    count_of_speakers: Number, // количество говорящих в тексте
    translation: [
        {
            id: String, // уникальный id перевода всего текста, например: trans-1
            language: String, // язык перевода всего текста (например, ru)
            text: String, // текст перевода всего текста           
        },
    ],   
    sentences: [ // массив предложений
        {
            id: String, // уникальный id предложения, например: sent-1
            sentence: String, // Текст предложения
            speaker: Number, // Номер говорящего
            start: Number, // Время начала предложения
            end: Number, // Время окончания предложения
            translation: [ // массив переводов предложения
                {
                    id: String, // уникальный id перевода предложения, например: sent-1-tr-1
                    language: String, // язык перевода предложения (например, en)
                    text: String, // текст перевода предложения
                }
            ],
            utterances: [ // массив фраз в предложении
                {   
                    id: String, // уникальный id utterance, например: utt-1 или utt-1-1
                    is_segment_start: Boolean, // признак начала сегмента нарезки
                    speaker: Number, // Номер говорящего
                    text: String, // текст фразы
                    start: Number, // Время начала фразы
                    end: Number, // Время окончания фразы
                    confidence: Number, // Достоверность перевода
                    translation: [
                        {
                            id: String, // уникальный id перевода utterance, например: utt-1-tr-1
                            language: String, // язык перевода фразы (например, en)
                            text: String, // текст перевода фразы
                        }
                    ],                  
                }
            ]
        },
    ]
}