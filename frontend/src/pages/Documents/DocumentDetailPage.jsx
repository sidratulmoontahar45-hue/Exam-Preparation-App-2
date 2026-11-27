import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import documentService from '../../services/documentService';
import aiService from '../../services/aiService';
import quizService from '../../services/quizService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink, Send, Sparkles, BrainCircuit, PlayCircle } from 'lucide-react';

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Content');

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // AI Actions State
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [concept, setConcept] = useState('');
  const [explanation, setExplanation] = useState('');
  const [explainLoading, setExplainLoading] = useState(false);

  // Quizzes State
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        const data = await documentService.getDocumentById(id);
        setDocument(data);
      } catch (error) {
        toast.error('Failed to fetch document details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentDetails();
  }, [id]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch data when tabs are clicked
  useEffect(() => {
    if (activeTab === 'Chat' && document) {
      fetchChatHistory();
    } else if (activeTab === 'Quizzes' && document) {
      fetchQuizzes();
    }
  }, [activeTab, document]);

  // --- Helper Functions ---
  const getPdfUrl = () => {
    if (!document?.data?.filePath) return null;
    const filePath = document.data.filePath;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };

  // --- Chat Logic ---
  const fetchChatHistory = async () => {
    try {
      const res = await aiService.getChatHistory(id);
      setChatMessages(res.data || []);
    } catch (error) {
      console.error('Failed to load chat history', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await aiService.chat(id, userMsg);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (error) {
      toast.error('Failed to send message');
      setChatMessages((prev) => prev.slice(0, -1)); // Remove failed message
    } finally {
      setChatLoading(false);
    }
  };

  // --- AI Actions Logic ---
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await aiService.generateSummary(id);
      setSummary(res.summary);
    } catch (error) {
      toast.error(error.message || 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleExplainConcept = async (e) => {
    e.preventDefault();
    if (!concept.trim()) return;
    setExplainLoading(true);
    try {
      const res = await aiService.explainConcept(id, concept);
      setExplanation(res.explanation);
    } catch (error) {
      toast.error(error.message || 'Failed to explain concept');
    } finally {
      setExplainLoading(false);
    }
  };

  // --- Quizzes Logic ---
  const fetchQuizzes = async () => {
    setQuizzesLoading(true);
    try {
      const res = await quizService.getQuizzesForDocument(id);
      setQuizzes(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      await aiService.generateQuiz(id, { numQuestions:10 });
      toast.success('Quiz generated successfully!');
      fetchQuizzes(); // Refresh list
    } catch (error) {
      toast.error(error.message || 'Failed to generate quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // --- Renderers ---
  const renderContent = () => {
    if (!document || !document.data || !document.data.filePath) {
      return <div className="text-center p-8 text-slate-500">PDF not available.</div>;
    }

    const pdfUrl = getPdfUrl();

    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
          <span className="text-sm font-medium text-slate-700">Document Viewer</span>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink size={16} /> Open in new tab
          </a>
        </div>
        <div className="bg-slate-100 p-2">
          <iframe
            src={pdfUrl}
            className="w-full h-[70vh] bg-white rounded-lg border border-slate-200"
            title="PDF Viewer"
            frameBorder="0"
          />
        </div>
      </div>
    );
  };

  const renderChat = () => {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm h-[70vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
              <p>Ask any question about this document!</p>
            </div>
          ) : (
            chatMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-base font-medium whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-900 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {chatLoading && <div className="text-sm text-slate-500 italic">AI is thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question..."
            autoFocus
            className="flex-1 px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    );
  };

  const renderAIActions = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-semibold text-slate-800">Document Summary</h3>
          </div>
          <button
            onClick={handleGenerateSummary}
            disabled={summaryLoading || summary}
            className="w-full bg-slate-900 text-white py-2 rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 mb-4"
          >
            {summaryLoading ? 'Generating...' : summary ? 'Summary Generated' : 'Generate Summary'}
          </button>
          {summary && (
            <div className="text-base font-medium text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-xl whitespace-pre-wrap">
              {summary}
            </div>
          )}
        </div>

        {/* Explain Concept Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-slate-800">Explain a Concept</h3>
          </div>
          <form onSubmit={handleExplainConcept} className="mb-4">
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. React Hooks"
              className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 mb-2 text-sm"
            />
            <button
              type="submit"
              disabled={explainLoading || !concept.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {explainLoading ? 'Explaining...' : 'Explain Concept'}
            </button>
          </form>
          {explanation && (
            <div className="text-base font-medium text-slate-900 leading-relaxed bg-blue-50 p-4 rounded-xl whitespace-pre-wrap">
              {explanation}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuizzesTab = () => {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Quizzes</h3>
          <button
            onClick={handleGenerateQuiz}
            disabled={generatingQuiz}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {generatingQuiz ? 'Generating...' : 'Generate New Quiz'}
          </button>
        </div>

        {quizzesLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : quizzes.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No quizzes available. Generate one to test your knowledge!
          </p>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz._id}
                className="flex items-center justify-between border border-slate-200 p-4 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-slate-800">{quiz.title}</h4>
                  <p className="text-xs text-slate-500">{quiz.totalQuestions} Questions</p>
                </div>
                <button
                  onClick={() => navigate(`/quizzes/${quiz._id}`)}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
                >
                  Take Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { name: 'Content', label: 'Content', content: renderContent() },
    { name: 'Chat', label: 'Chat', content: renderChat() },
    { name: 'AI Actions', label: 'AI Actions', content: renderAIActions() },
    { name: 'Quizzes', label: 'Quizzes', content: renderQuizzesTab() },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  if (!document) {
    return <div className="text-center p-8 text-xl text-slate-600">Document not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 relative pb-12">

      <div className="relative max-w-7xl mx-auto p-6 md:p-10">
        <Link
          to="/documents"
          className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 shadow-sm text-[15px] font-medium text-slate-700 hover:text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50/50 mb-6 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" /> Back to My Notes
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {document.data?.title || 'Document Details'}
          </h1>
          <p className="text-[15px] text-slate-600">
            Uploaded on {new Date(document.data?.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mb-6">
          <nav className="inline-flex max-w-full overflow-x-auto p-1 gap-1 rounded-2xl bg-slate-100/80 border border-slate-200/60">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`whitespace-nowrap px-5 py-2 rounded-xl text-[15px] font-semibold transition-all duration-200 ${
                  activeTab === tab.name
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-4 animate-in fade-in duration-300">
          {tabs.find((tab) => tab.name === activeTab)?.content}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;