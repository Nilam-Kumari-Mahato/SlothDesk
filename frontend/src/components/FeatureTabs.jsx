const TABS = [
    { id: 'tasks', label: 'Task Prioritization' },
    { id: 'notes', label: 'Note Summarization' },
];

export default function FeatureTabs({ activeTab, onTabChange }) {
    return (
        <nav
            className="flex justify-between px-2 mt-10 mb-6"
            role="tablist"
            aria-label="Feature navigation"
        >
            {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onTabChange(tab.id)}
                        className={[
                            'font-hand text-[19px] sm:text-[20px] pb-1 transition-colors duration-200',
                            isActive
                                ? 'text-ink border-b-2 border-taupe-dark font-semibold'
                                : 'text-taupe-text hover:text-ink',
                        ].join(' ')}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}
