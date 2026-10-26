import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, List, Calendar, CheckSquare } from 'lucide-react';

function Section({ icon: Icon, title, children }) {
    return (
        <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-taupe-dark shrink-0" />
                <h3 className="font-hand text-[15px] text-taupe-text uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}

const LENGTH_LABELS = { short: 'Short', balanced: 'Balanced', detailed: 'Detailed' };

export default function SummaryResults({ results, summaryMode, onModeChange, onClear }) {
    if (!results) return null;

    return (
        <AnimatePresence>
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="mt-8 w-full"
                aria-label="Note summarization results"
            >
                {/* Controls bar */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex gap-1.5">
                        {['short', 'balanced', 'detailed'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => onModeChange(mode)}
                                className={[
                                    'font-hand text-[13px] px-3 py-1 rounded-full transition-colors duration-150',
                                    summaryMode === mode
                                        ? 'bg-taupe text-cream'
                                        : 'bg-sage-input text-taupe-text hover:bg-taupe/20',
                                ].join(' ')}
                            >
                                {LENGTH_LABELS[mode]}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={onClear}
                        className="flex items-center gap-1 font-hand text-[14px] text-taupe-text hover:text-ink transition-colors"
                        aria-label="Clear summary"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                </div>

                {/* Results panel */}
                <div className="bg-sage-input rounded-2xl p-7 sm:p-10">
                    {/* Main idea */}
                    <Section icon={Lightbulb} title="Main Idea">
                        <p className="font-hand text-[16px] text-ink leading-relaxed">
                            {results.mainIdea}
                        </p>
                    </Section>

                    {results.summary && (
                        <Section icon={Lightbulb} title="Summary">
                            <p className="font-hand text-[16px] text-ink leading-relaxed">{results.summary}</p>
                        </Section>
                    )}

                    {/* Key points */}
                    {results.keyPoints?.length > 0 && (
                        <Section icon={List} title="Key Points">
                            <ul className="flex flex-col gap-2">
                                {results.keyPoints.map((pt, i) => (
                                    <li key={i} className="flex items-start gap-2 font-hand text-[15px] text-ink/85 leading-relaxed">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-taupe-dark shrink-0" />
                                        {pt}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* Dates */}
                    {results.dates?.length > 0 && (
                        <Section icon={Calendar} title="Dates & Deadlines">
                            <ul className="flex flex-col gap-1.5">
                                {results.dates.map((d, i) => (
                                    <li key={i} className="flex items-center gap-2 font-hand text-[15px]">
                                        <span className="text-taupe-text">{d.label}:</span>
                                        <span className="text-ink">{d.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* Action items */}
                    {results.actionItems?.length > 0 && (
                        <Section icon={CheckSquare} title="Action Items">
                            <ul className="flex flex-col gap-2">
                                {results.actionItems.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 font-hand text-[15px] text-ink/85 leading-relaxed">
                                        <span className="mt-1 text-taupe-dark font-bold">→</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}
                </div>
            </motion.section>
        </AnimatePresence>
    );
}
