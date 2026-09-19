import { Volume2 } from 'lucide-react';
import { Card } from '@/components/ui';
import type { Word } from '@/types';

type WordCardProps = {
  word: Word;
  index?: number;
};

const POS_LABELS: Record<string, string> = {
  noun: 'اسم',
  verb: 'فعل',
  adjective: 'صفة',
  adverb: 'ظرف',
  preposition: 'حرف جر',
  conjunction: 'أداة ربط',
  pronoun: 'ضمير',
  phrase: 'عبارة',
};

export function WordCard({ word, index = 0 }: WordCardProps) {
  return (
    <Card
      className="p-4 animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-text-primary ltr truncate">{word.word}</h3>
            <span className="shrink-0 rounded-pill bg-primary-500/15 px-2 py-0.5 text-2xs font-semibold text-primary-500">
              {word.cefrLevel}
            </span>
          </div>
          <p className="text-sm font-semibold text-text-secondary mt-0.5">
            {word.arabicTranslation}
          </p>
        </div>
        <button
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-white/5 text-text-muted hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
          aria-label="استمع للنطق"
        >
          <Volume2 size={16} />
        </button>
      </div>

      <p className="text-2xs text-text-muted ltr mb-2">{word.pronunciation}</p>

      <p className="text-sm text-text-secondary leading-relaxed mb-2">{word.englishDefinition}</p>

      <div className="rounded-md bg-white/5 p-3 mt-1">
        <p className="text-sm text-text-primary ltr mb-1">{word.exampleSentence}</p>
        <p className="text-2xs text-text-muted">{word.arabicExampleTranslation}</p>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="rounded-pill bg-white/5 px-2 py-0.5 text-2xs text-text-muted">
          {POS_LABELS[word.partOfSpeech] ?? word.partOfSpeech}
        </span>
        <span className="text-2xs text-text-muted ltr">صعوبة {word.difficulty}/5</span>
      </div>
    </Card>
  );
}

export default WordCard;
