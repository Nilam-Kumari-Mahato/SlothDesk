import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LABELS = {
    tasks: 'Prioritize my tasks',
    notes: 'Summarize for me',
};

export default function ActionButton({ activeTab, disabled, loading, onClick }) {
    const label = LABELS[activeTab];

    return (
        <div className="flex flex-col items-center gap-3 mt-8">
            {loading && (
                <p className="font-hand text-[16px] text-taupe-text animate-pulse">
                    Your sloth is sorting things out…
                </p>
            )}
            <motion.button
                whileHover={!disabled && !loading ? { scale: 1.04 } : {}}
                whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
                onClick={onClick}
                disabled={disabled || loading}
                aria-label={label}
                className={[
                    'font-hand text-[19px] sm:text-[20px] text-cream rounded-full',
                    'w-[240px] sm:w-[260px] h-[56px] sm:h-[62px]',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-4 focus-visible:ring-taupe-dark/50',
                    disabled || loading
                        ? 'bg-taupe/50 cursor-not-allowed'
                        : 'bg-taupe hover:bg-taupe-dark active:bg-taupe-dark',
                ].join(' ')}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Working…
                    </span>
                ) : (
                    label
                )}
            </motion.button>
        </div>
    );
}
