import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Clock, ChevronRight } from 'lucide-react';

const PRIORITY_STYLES = {
    High: {
        pill: 'bg-[#C98B7A]/20 text-[#A0522D]',
        dot: 'bg-[#C98B7A]',
        border: 'border-l-[#C98B7A]',
    },
    Medium: {
        pill: 'bg-[#C9A87A]/20 text-[#8B6914]',
        dot: 'bg-[#C9A87A]',
        border: 'border-l-[#C9A87A]',
    },
    Low: {
        pill: 'bg-[#8DBF8D]/20 text-[#3A7A3A]',
        dot: 'bg-[#8DBF8D]',
        border: 'border-l-[#8DBF8D]',
    },
};

function TaskCard({ task }) {
    const styles = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-sage-bg/60 rounded-2xl p-5 border-l-4 ${styles.border} shadow-sm`}
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-hand text-[17px] text-ink font-semibold leading-snug">
                    {task.title}
                </h3>
                <span
                    className={`inline-flex items-center gap-1.5 text-[13px] font-hand px-3 py-0.5 rounded-full shrink-0 ${styles.pill}`}
                >
                    <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                    {task.priority}
                </span>
            </div>

            {task.deadline && (
                <p className="flex items-center gap-1.5 text-[14px] font-hand text-taupe-text mb-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {task.deadline}
                </p>
            )}

            <p className="font-hand text-[14px] text-taupe-text leading-relaxed mb-2">
                {task.reason}
            </p>

            {task.nextAction && (
                <p className="flex items-start gap-1.5 font-hand text-[14px] text-ink/75 leading-relaxed">
                    <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-taupe-dark" />
                    {task.nextAction}
                </p>
            )}
        </motion.div>
    );
}

function PriorityGroup({ label, tasks }) {
    if (!tasks.length) return null;
    return (
        <div className="mb-6">
            <h2 className="font-hand text-[16px] text-taupe-text uppercase tracking-widest mb-3">
                {label} Priority
            </h2>
            <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
}

export default function TaskResults({ results, onClear }) {
    if (!results || !results.length) return null;

    const high = results.filter((t) => t.priority === 'High');
    const medium = results.filter((t) => t.priority === 'Medium');
    const low = results.filter((t) => t.priority === 'Low');

    return (
        <AnimatePresence>
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="mt-8 w-full"
                aria-label="Task prioritization results"
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-taupe-text" />
                        <p className="font-hand text-[16px] text-taupe-text">
                            {results.length} task{results.length !== 1 ? 's' : ''} organized
                        </p>
                    </div>
                    <button
                        onClick={onClear}
                        className="flex items-center gap-1 font-hand text-[14px] text-taupe-text hover:text-ink transition-colors"
                        aria-label="Clear results"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                </div>

                <PriorityGroup label="High" tasks={high} />
                <PriorityGroup label="Medium" tasks={medium} />
                <PriorityGroup label="Low" tasks={low} />
            </motion.section>
        </AnimatePresence>
    );
}
