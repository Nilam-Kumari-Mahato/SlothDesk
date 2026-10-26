import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import FeatureTabs from './components/FeatureTabs';
import TaskInput from './components/TaskInput';
import ActionButton from './components/ActionButton';
import TaskResults from './components/TaskResults';
import SummaryResults from './components/SummaryResults';
import SlothMascot from './components/SlothMascot';
import { prioritizeTasks, summarizeText } from './services/aiService';

export default function App() {
  // Tab state
  const [activeTab, setActiveTab] = useState('tasks');

  // Input state — retained per tab
  const [taskText, setTaskText] = useState('');
  const [noteText, setNoteText] = useState('');

  // Results state
  const [taskResults, setTaskResults] = useState(null);
  const [summaryResults, setSummaryResults] = useState(null);
  const [summaryMode, setSummaryMode] = useState('balanced');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentValue = activeTab === 'tasks' ? taskText : noteText;
  const isEmpty = currentValue.trim().length === 0;

  const handleSubmit = async () => {
    if (isEmpty || loading) return;
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'tasks') {
        const results = await prioritizeTasks(taskText);
        setTaskResults(results);
      } else {
        const results = await summarizeText(noteText, summaryMode);
        setSummaryResults(results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearTasks = () => {
    setTaskResults(null);
    setTaskText('');
  };

  const handleClearSummary = () => {
    setSummaryResults(null);
    setNoteText('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  return (
    <div className="min-h-screen bg-sage-bg font-hand relative">
      {/* ───── Main centered content ───── */}
      <main className="max-w-3xl mx-auto px-5 sm:px-8 pb-48 sm:pb-32">
        <Header />
        <FeatureTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Input panel */}
        <TaskInput
          activeTab={activeTab}
          value={activeTab === 'tasks' ? taskText : noteText}
          onChange={activeTab === 'tasks' ? setTaskText : setNoteText}
        />

        {/* Validation error */}
        {error && (
          <p
            role="alert"
            className="text-center font-hand text-[15px] text-[#A0522D] mt-3"
          >
            {error}
          </p>
        )}

        {/* Action button */}
        <ActionButton
          activeTab={activeTab}
          disabled={isEmpty}
          loading={loading}
          onClick={handleSubmit}
        />

        {/* Results */}
        {activeTab === 'tasks' && taskResults && (
          <TaskResults results={taskResults} onClear={handleClearTasks} />
        )}
        {activeTab === 'notes' && summaryResults && (
          <SummaryResults
            results={summaryResults}
            summaryMode={summaryMode}
            onModeChange={(mode) => {
              setSummaryMode(mode);
              setSummaryResults(null);
              // Re-run with new mode if user has already submitted
            }}
            onClear={handleClearSummary}
          />
        )}
      </main>

      {/* ───── Sloth mascot (fixed, bottom-left) ───── */}
      <SlothMascot />
    </div>
  );
}
