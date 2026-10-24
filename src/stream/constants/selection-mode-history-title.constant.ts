import { SelectionMode } from '../enums/selection-mode.enum';

export const SELECTION_MODE_HISTORY_TITLE: Record<SelectionMode, string> = {
  [SelectionMode.TRANSLATOR]: 'ترجمه',
  [SelectionMode.GENERAL_CHAT]: 'چت عمومی',
  [SelectionMode.EMBEDDER]: 'جاسازی',
  [SelectionMode.KEYWORD_EXTRACTOR]: 'استخراج‌ کلمات کلیدی',
  [SelectionMode.MINUTES_GENERATOR]: 'ساخت صورت جلسه',
  [SelectionMode.NER]: 'ner',
  [SelectionMode.OCR]: 'ocr',
  [SelectionMode.RAG]: 'rag',
  [SelectionMode.SENTIMENT_ANALYZER]: 'تحلیلگر احساسات',
  [SelectionMode.SUMMARIZER]: 'خلاصه‌کننده',
  [SelectionMode.LETTER]: 'نامه نگار',
  [SelectionMode.STT]: 'تبدیل صدا به متن',
  [SelectionMode.REPORTER]: 'گزارش‌گر',
};
