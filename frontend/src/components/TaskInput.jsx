const PLACEHOLDERS = {
    tasks: 'Describe all your tasks…',
    notes: 'Paste your notes, documents, or long messages here…',
};

export default function TaskInput({ activeTab, value, onChange }) {
    return (
        <div
            className="w-full rounded-[20px] bg-sage-input px-8 sm:px-14 py-10 sm:py-14 min-h-[380px] sm:min-h-[420px] flex"
            aria-label="Input panel"
        >
            <textarea
                id="main-input"
                aria-label={activeTab === 'tasks' ? 'Describe your tasks' : 'Paste your notes'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={PLACEHOLDERS[activeTab]}
                className="w-full bg-transparent text-ink font-hand text-[18px] sm:text-[19px] placeholder-taupe-text/70 leading-relaxed scrollbar-thin"
                style={{ minHeight: '280px' }}
            />
        </div>
    );
}
