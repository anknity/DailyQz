import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SCHEDULED_EXAM_CONFIG, DAILY_TEST_CONFIG, COMPANY_TEST_CONFIG, GOVERNMENT_EXAM_CONFIG } from '../config/categories';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminExamManager = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('create');
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState([]);
  const [editingExamId, setEditingExamId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subject: '',
    description: '',
    questionCount: 20,
    durationMinutes: 30,
    startDate: '',
    startTime: '',
    isProctored: true,
    negativeMarking: false,
    negativeMarkValue: 0.25,
    passPercentage: 40,
    questionSource: 'manual' // 'manual', 'ai', 'pdf'
  });

  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // PDF Upload State
  const [pdfFile, setPdfFile] = useState(null);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState([]);

  // Manual Questions State
  const [manualQuestions, setManualQuestions] = useState([]);

  // Question Bank State
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState([]);
  const [bankFilter, setBankFilter] = useState({ category: '', difficulty: '' });
  const [loadingBank, setLoadingBank] = useState(false);
  const [bankStats, setBankStats] = useState(null);

  const allCategories = [
    { group: 'Scheduled Exams', items: SCHEDULED_EXAM_CONFIG?.categories || [] },
    { group: 'Daily Practice', items: DAILY_TEST_CONFIG?.subcategories || [] },
    { group: 'Company Tests', items: COMPANY_TEST_CONFIG?.companies || [] },
    { group: 'Government Exams', items: GOVERNMENT_EXAM_CONFIG?.subcategories || [] }
  ].filter(group => group.items && group.items.length > 0);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchExams();
    }
  }, [activeTab]);

  // Load bank stats when question source changes to 'bank'
  useEffect(() => {
    if (formData.questionSource === 'bank') {
      fetchBankStats();
    }
  }, [formData.questionSource]);

  const getAuthHeaders = async () => {
    const token = await currentUser?.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/exams/scheduled`, { headers });
      const data = await response.json();
      
      if (data.success) {
        setExams(data.data || []);
      } else {
        setExams([]);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a topic or prompt for AI generation');
      return;
    }

    setGeneratingQuestions(true);
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/competitive/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category: formData.category || 'aptitude',
          subject: aiPrompt,
          difficulty: aiDifficulty,
          count: Math.min(formData.questionCount, 20)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Use actual generated questions from the API response
        const questions = data.data.questions || [];
        
        if (questions.length > 0) {
          setGeneratedQuestions(questions);
          alert(`Successfully generated ${questions.length} questions!`);
        } else {
          // Fallback: fetch from question bank if questions weren't returned
          alert(`Generated ${data.data.generatedCount} questions! Fetching from question bank...`);
          await fetchQuestionBank({ category: formData.category || 'aptitude' });
        }
      } else {
        alert('Failed to generate questions: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setPdfFile(file);
    setExtractingPdf(true);

    try {
      const token = await currentUser?.getIdToken();
      
      const formDataObj = new FormData();
      formDataObj.append('pdf', file);
      formDataObj.append('category', formData.category || 'aptitude');
      formDataObj.append('subject', formData.subject || 'general');

      const response = await fetch(`${API_URL.replace('/api', '')}/api/v2/competitive/upload-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });

      const data = await response.json();

      if (data.success) {
        // Use actual extracted questions from the API response
        const questions = data.data.questions || [];
        
        if (questions.length > 0) {
          setExtractedQuestions(questions.map(q => ({
            ...q,
            confidence: 0.9
          })));
          alert(`Successfully extracted ${questions.length} questions from PDF!`);
        } else {
          alert(`Extracted ${data.data.extractedCount} questions! They have been saved to the question bank.`);
        }
      } else {
        alert('Failed to extract questions: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error extracting PDF:', error);
      alert('Failed to extract questions from PDF. Please try again.');
    } finally {
      setExtractingPdf(false);
    }
  };

  const addManualQuestion = () => {
    setManualQuestions(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ]);
  };

  const updateManualQuestion = (index, field, value) => {
    setManualQuestions(prev => {
      const updated = [...prev];
      if (field === 'option') {
        updated[index].options[value.optionIndex] = value.text;
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  const removeManualQuestion = (index) => {
    setManualQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // Question Bank Functions
  const fetchQuestionBank = async (filters = {}) => {
    setLoadingBank(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        approved: 'true',
        limit: '100',
        ...(filters.category && { category: filters.category }),
        ...(filters.difficulty && { difficulty: filters.difficulty })
      });

      const response = await fetch(`${API_URL}/exams/question-bank?${params}`, { headers });
      const data = await response.json();

      if (data.success) {
        setBankQuestions(data.data || []);
      } else {
        console.error('Failed to fetch questions:', data.error);
        setBankQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching question bank:', error);
      setBankQuestions([]);
    } finally {
      setLoadingBank(false);
    }
  };

  const fetchBankStats = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/exams/question-bank/stats`, { headers });
      const data = await response.json();
      if (data.success) {
        setBankStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching bank stats:', error);
    }
  };

  const fetchRandomQuestions = async () => {
    setLoadingBank(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        count: formData.questionCount.toString(),
        ...(bankFilter.category && { category: bankFilter.category }),
        ...(bankFilter.difficulty && { difficulty: bankFilter.difficulty })
      });

      const response = await fetch(`${API_URL}/exams/question-bank/random?${params}`, { headers });
      const data = await response.json();

      if (data.success) {
        setSelectedBankQuestions(data.data || []);
        alert(`Selected ${data.count} random questions!`);
      } else {
        alert('Failed to fetch random questions: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching random questions:', error);
      alert('Error fetching questions');
    } finally {
      setLoadingBank(false);
    }
  };

  const toggleBankQuestion = (question) => {
    setSelectedBankQuestions(prev => {
      const exists = prev.find(q => q.id === question.id);
      if (exists) {
        return prev.filter(q => q.id !== question.id);
      } else {
        return [...prev, question];
      }
    });
  };

  const selectAllBankQuestions = () => {
    if (selectedBankQuestions.length === bankQuestions.length) {
      setSelectedBankQuestions([]);
    } else {
      setSelectedBankQuestions([...bankQuestions]);
    }
  };

  const handleCreateExam = async () => {
    // Validation
    if (!formData.title || !formData.category || !formData.startDate || !formData.startTime) {
      alert('Please fill in all required fields');
      return;
    }

    let questions = [];
    let useCreateFromBank = false;

    if (formData.questionSource === 'ai') {
      questions = generatedQuestions;
    } else if (formData.questionSource === 'pdf') {
      questions = extractedQuestions;
    } else if (formData.questionSource === 'bank') {
      questions = selectedBankQuestions;
      // If no questions selected but bank is chosen, use create-from-bank API
      if (questions.length === 0) {
        useCreateFromBank = true;
      }
    } else {
      questions = manualQuestions;
    }

    if (questions.length === 0 && !useCreateFromBank) {
      alert('Please add at least one question or generate questions using AI/PDF/Question Bank');
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + formData.durationMinutes * 60 * 1000);
      
      // Use create-from-bank API if bank source with no selection
      if (useCreateFromBank) {
        const examData = {
          title: formData.title,
          category: formData.category,
          subject: formData.subject,
          description: formData.description,
          questionCount: formData.questionCount,
          durationMinutes: formData.durationMinutes,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          isProctored: formData.isProctored,
          passPercentage: formData.passPercentage,
          difficulty: bankFilter.difficulty || 'all'
        };

        const response = await fetch(`${API_URL}/exams/create-from-bank`, {
          method: 'POST',
          headers,
          body: JSON.stringify(examData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert(`Exam created successfully with ${data.data.questionCount} questions from the bank!`);
          navigate('/exams');
        } else {
          alert('Failed to create exam: ' + (data.error || 'Unknown error'));
        }
        setLoading(false);
        return;
      }

      const examData = {
        title: formData.title,
        category: formData.category,
        subject: formData.subject,
        description: formData.description,
        questionCount: questions.length,
        durationMinutes: formData.durationMinutes,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isProctored: formData.isProctored,
        negativeMarking: formData.negativeMarking,
        negativeMarkValue: formData.negativeMarkValue,
        passPercentage: formData.passPercentage,
        questions: questions.map(q => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium'
        })),
        createdBy: currentUser?.uid,
        status: 'scheduled'
      };

      const response = await fetch(`${API_URL}/exams/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(examData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Exam created successfully!');
        navigate('/exams');
      } else {
        alert('Failed to create exam: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.start_time || exam.startTime);
    const endTime = new Date(exam.end_time || exam.endTime);
    
    if (now < startTime) return 'scheduled';
    if (now >= startTime && now <= endTime) return 'ongoing';
    return 'completed';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400';
      case 'ongoing':
        return 'bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400';
      case 'completed':
        return 'bg-gray-100 dark:bg-gray-600/20 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-600/20 text-gray-700 dark:text-gray-400';
    }
  };

  const handleEditExam = (exam) => {
    // Populate form with exam data
    setFormData({
      title: exam.title || '',
      category: exam.category || '',
      subject: exam.subject || '',
      description: exam.description || '',
      questionCount: exam.question_count || exam.questionCount || 20,
      durationMinutes: exam.duration_minutes || exam.durationMinutes || 30,
      startDate: new Date(exam.start_time || exam.startTime).toISOString().split('T')[0],
      startTime: new Date(exam.start_time || exam.startTime).toTimeString().slice(0, 5),
      isProctored: exam.is_proctored || exam.isProctored || false,
      negativeMarking: exam.negative_marking || exam.negativeMarking || false,
      negativeMarkValue: exam.negative_mark_value || exam.negativeMarkValue || 0.25,
      passPercentage: exam.pass_percentage || exam.passPercentage || 40,
      questionSource: 'manual'
    });
    // Store the exam ID for update
    setEditingExamId(exam.id);
    setActiveTab('create');
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/exams/scheduled/${examId}`, {
        method: 'DELETE',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Exam deleted successfully!');
        fetchExams(); // Refresh the list
      } else {
        alert('Failed to delete exam: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam. Please try again.');
    }
  };

  const handleCancelExam = async (examId) => {
    if (!window.confirm('Are you sure you want to cancel this exam?')) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/exams/scheduled/${examId}/cancel`, {
        method: 'POST',
        headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Exam cancelled successfully!');
        fetchExams();
      } else {
        alert('Failed to cancel exam: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error cancelling exam:', error);
      alert('Failed to cancel exam. Please try again.');
    }
  };

  const handleViewResults = (examId) => {
    navigate(`/exam/${examId}/leaderboard`);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Exam Manager</h1>
          <p className="text-gray-500 dark:text-gray-400">Create and manage scheduled exams</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'create', label: editingExamId ? '✏️ Edit Exam' : '➕ Create New Exam' },
            { id: 'manage', label: '📋 Manage Exams' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'manage') {
                  setEditingExamId(null);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {editingExamId && activeTab === 'create' && (
            <button
              onClick={() => {
                setEditingExamId(null);
                setFormData({
                  title: '',
                  category: '',
                  subject: '',
                  description: '',
                  questionCount: 20,
                  durationMinutes: 30,
                  startDate: '',
                  startTime: '',
                  isProctored: true,
                  negativeMarking: false,
                  negativeMarkValue: 0.25,
                  passPercentage: 40,
                  questionSource: 'manual'
                });
              }}
              className="px-4 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-600/20"
            >
              ✕ Cancel Edit
            </button>
          )}
        </div>

        {/* Create Exam Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Details */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📝 Basic Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Exam Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Weekly Test - Computer Science"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {allCategories.map(group => (
                        <optgroup key={group.group} label={group.group}>
                          {group.items.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.icon} {item.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="e.g., Physics, Math"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Brief description of the exam..."
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Exam Configuration */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⚙️ Configuration</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Questions</label>
                    <input
                      type="number"
                      name="questionCount"
                      value={formData.questionCount}
                      onChange={handleInputChange}
                      min={1}
                      max={200}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Duration (min)</label>
                    <input
                      type="number"
                      name="durationMinutes"
                      value={formData.durationMinutes}
                      onChange={handleInputChange}
                      min={5}
                      max={300}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Start Time *</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 mt-4">
                  <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isProctored"
                      checked={formData.isProctored}
                      onChange={handleInputChange}
                      className="w-4 h-4 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 rounded"
                    />
                    <span>👁️ Proctored Exam</span>
                  </label>

                  <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="negativeMarking"
                      checked={formData.negativeMarking}
                      onChange={handleInputChange}
                      className="w-4 h-4 bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 rounded"
                    />
                    <span>➖ Negative Marking</span>
                  </label>
                </div>

                {formData.negativeMarking && (
                  <div className="mt-4">
                    <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Negative Mark Value</label>
                    <input
                      type="number"
                      name="negativeMarkValue"
                      value={formData.negativeMarkValue}
                      onChange={handleInputChange}
                      step={0.25}
                      min={0}
                      max={1}
                      className="w-32 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Question Source */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📚 Question Source</h3>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {[
                    { id: 'manual', label: '✏️ Manual Entry', desc: 'Add questions manually' },
                    { id: 'bank', label: '🗄️ Question Bank', desc: 'Use existing questions' },
                    { id: 'ai', label: '🤖 AI Generate', desc: 'Generate with Groq AI' },
                    { id: 'pdf', label: '📄 Upload PDF', desc: 'Extract from PDF' }
                  ].map(source => (
                    <button
                      key={source.id}
                      onClick={() => setFormData(prev => ({ ...prev, questionSource: source.id }))}
                      className={`flex-1 min-w-[140px] p-4 rounded-xl border text-left transition-all ${
                        formData.questionSource === source.id
                          ? 'bg-purple-100 dark:bg-purple-600/20 border-purple-500'
                          : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="text-lg mb-1 text-gray-900 dark:text-white">{source.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{source.desc}</div>
                    </button>
                  ))}
                </div>

                {/* AI Generation */}
                {formData.questionSource === 'ai' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Topic/Prompt</label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={3}
                        placeholder="e.g., Generate questions about data structures and algorithms, focusing on arrays and linked lists"
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Difficulty</label>
                        <select
                          value={aiDifficulty}
                          onChange={(e) => setAiDifficulty(e.target.value)}
                          className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>

                      <button
                        onClick={handleGenerateWithAI}
                        disabled={generatingQuestions}
                        className="mt-5 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        {generatingQuestions ? '🔄 Generating...' : '✨ Generate Questions'}
                      </button>
                    </div>

                    {generatedQuestions.length > 0 && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-gray-900/50 rounded-lg border border-green-300 dark:border-green-500/30">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                          <span>✓</span>
                          <span>{generatedQuestions.length} questions generated</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Questions will be added to the exam when you create it.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF Upload */}
                {formData.questionSource === 'pdf' && (
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                      {extractingPdf ? (
                        <div>
                          <div className="text-4xl mb-2">🔄</div>
                          <p className="text-gray-500 dark:text-gray-400">Analyzing PDF with Groq AI...</p>
                        </div>
                      ) : pdfFile ? (
                        <div>
                          <div className="text-4xl mb-2">📄</div>
                          <p className="text-gray-900 dark:text-white font-medium">{pdfFile.name}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Click to upload a different file</p>
                        </div>
                      ) : (
                        <div>
                          <div className="text-4xl mb-2">📤</div>
                          <p className="text-gray-500 dark:text-gray-400">Click to upload PDF</p>
                          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                            Questions will be extracted using Groq AI
                          </p>
                        </div>
                      )}
                    </div>

                    {extractedQuestions.length > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-gray-900/50 rounded-lg border border-green-300 dark:border-green-500/30">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                          <span>✓</span>
                          <span>{extractedQuestions.length} questions extracted</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Review and edit questions before creating the exam.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Entry */}
                {formData.questionSource === 'manual' && (
                  <div className="space-y-4">
                    {manualQuestions.map((q, qIndex) => (
                      <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-purple-600 dark:text-purple-400 text-sm">Question {qIndex + 1}</span>
                          <button
                            onClick={() => removeManualQuestion(qIndex)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <input
                          type="text"
                          value={q.text}
                          onChange={(e) => updateManualQuestion(qIndex, 'text', e.target.value)}
                          placeholder="Enter question text"
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white mb-3 focus:border-purple-500 focus:outline-none"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctAnswer === optIndex}
                                onChange={() => updateManualQuestion(qIndex, 'correctAnswer', optIndex)}
                                className="w-4 h-4"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateManualQuestion(qIndex, 'option', { optionIndex: optIndex, text: e.target.value })}
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1 text-gray-900 dark:text-white text-sm focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addManualQuestion}
                      className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      + Add Question
                    </button>
                  </div>
                )}

                {/* Question Bank */}
                {formData.questionSource === 'bank' && (
                  <div className="space-y-4">
                    {/* Filters and Stats */}
                    <div className="flex flex-wrap gap-4 items-end">
                      <div>
                        <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Filter by Category</label>
                        <select
                          value={bankFilter.category}
                          onChange={(e) => setBankFilter(prev => ({ ...prev, category: e.target.value }))}
                          className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">All Categories</option>
                          {bankStats?.byCategory && Object.keys(bankStats.byCategory).map(cat => (
                            <option key={cat} value={cat}>
                              {cat} ({bankStats.byCategory[cat].approved})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-600 dark:text-gray-400 text-sm mb-1">Filter by Difficulty</label>
                        <select
                          value={bankFilter.difficulty}
                          onChange={(e) => setBankFilter(prev => ({ ...prev, difficulty: e.target.value }))}
                          className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">All Difficulties</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <button
                        onClick={() => fetchQuestionBank(bankFilter)}
                        disabled={loadingBank}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg text-sm"
                      >
                        🔍 Search
                      </button>

                      <button
                        onClick={fetchRandomQuestions}
                        disabled={loadingBank}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm"
                      >
                        🎲 Random {formData.questionCount}
                      </button>
                    </div>

                    {/* Stats Display */}
                    {bankStats && (
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Total: <span className="text-gray-900 dark:text-white">{bankStats.total}</span>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Approved: <span className="text-green-600 dark:text-green-400">{bankStats.approved}</span>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Selected: <span className="text-purple-600 dark:text-purple-400">{selectedBankQuestions.length}</span>
                        </span>
                      </div>
                    )}

                    {/* Question List */}
                    {loadingBank ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading questions...</div>
                    ) : bankQuestions.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{bankQuestions.length} questions found</span>
                          <button
                            onClick={selectAllBankQuestions}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                          >
                            {selectedBankQuestions.length === bankQuestions.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>

                        {bankQuestions.map((q) => (
                          <div
                            key={q.id}
                            onClick={() => toggleBankQuestion(q)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              selectedBankQuestions.find(sq => sq.id === q.id)
                                ? 'bg-purple-100 dark:bg-purple-600/20 border border-purple-500'
                                : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={!!selectedBankQuestions.find(sq => sq.id === q.id)}
                                onChange={() => {}}
                                className="mt-1 w-4 h-4"
                              />
                              <div className="flex-1">
                                <p className="text-gray-900 dark:text-white text-sm line-clamp-2">{q.text}</p>
                                <div className="flex gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    q.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400' :
                                    q.difficulty === 'hard' ? 'bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400' :
                                    'bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-400'
                                  }`}>
                                    {q.difficulty || 'medium'}
                                  </span>
                                  {q.category && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                      {q.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🗄️</div>
                        <p className="text-gray-500 dark:text-gray-400">Click "Search" to load questions from the bank</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                          Or use "Random" to auto-select questions
                        </p>
                      </div>
                    )}

                    {selectedBankQuestions.length > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-gray-900/50 rounded-lg border border-green-300 dark:border-green-500/30">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                          <span>✓</span>
                          <span>{selectedBankQuestions.length} questions selected</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Ready to create exam with selected questions.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              {/* Preview Card */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Preview</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Title</span>
                    <span className="text-gray-900 dark:text-white">{formData.title || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Category</span>
                    <span className="text-gray-900 dark:text-white">{formData.category || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Questions</span>
                    <span className="text-gray-900 dark:text-white">{formData.questionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Duration</span>
                    <span className="text-gray-900 dark:text-white">{formData.durationMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Schedule</span>
                    <span className="text-gray-900 dark:text-white">
                      {formData.startDate && formData.startTime
                        ? new Date(`${formData.startDate}T${formData.startTime}`).toLocaleString()
                        : '-'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Proctored</span>
                    <span className={formData.isProctored ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>
                      {formData.isProctored ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Question Source</span>
                    <span className="text-purple-600 dark:text-purple-400 capitalize">{formData.questionSource}</span>
                  </div>
                </div>
              </div>

              {/* Question Count */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Questions Added</h3>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {formData.questionSource === 'ai' 
                      ? generatedQuestions.length 
                      : formData.questionSource === 'pdf'
                      ? extractedQuestions.length
                      : formData.questionSource === 'bank'
                      ? selectedBankQuestions.length
                      : manualQuestions.length
                    }
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">of {formData.questionCount} required</div>
                </div>
              </div>

              {/* Create/Update Button */}
              <button
                onClick={handleCreateExam}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? '🔄 Creating...' : editingExamId ? '💾 Update Exam' : '🚀 Create Exam'}
              </button>
            </div>
          </div>
        )}

        {/* Manage Exams Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {loading ? (
              <LoadingSpinner />
            ) : exams.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No exams created</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first exam to get started</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Exam
                </button>
              </div>
            ) : (
              exams.map(exam => {
                const status = getExamStatus(exam);
                const startTime = new Date(exam.start_time || exam.startTime);
                const questionCount = exam.question_count || exam.questionCount || 0;
                const participants = exam.participants || 0;
                const isProctored = exam.is_proctored || exam.isProctored || false;
                
                return (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{exam.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(status)}`}>
                            {status}
                          </span>
                          {isProctored && (
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400">
                              👁️ Proctored
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400 text-sm">
                          <span className="flex items-center gap-1">
                            📝 {questionCount} questions
                          </span>
                          <span className="flex items-center gap-1">
                            📅 {formatDate(startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            👥 {participants} registered
                          </span>
                          {exam.category && (
                            <span className="flex items-center gap-1">
                              📂 {exam.category}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {status === 'completed' && (
                          <button 
                            onClick={() => handleViewResults(exam.id)}
                            className="px-4 py-2 bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-600/30 text-sm font-medium"
                          >
                            📊 Results
                          </button>
                        )}
                        {status === 'scheduled' && (
                          <>
                            <button 
                              onClick={() => handleEditExam(exam)}
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              onClick={() => handleCancelExam(exam.id)}
                              className="px-4 py-2 bg-yellow-100 dark:bg-yellow-600/20 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-600/30 text-sm font-medium"
                            >
                              ⏸️ Cancel
                            </button>
                          </>
                        )}
                        {status === 'ongoing' && (
                          <span className="px-4 py-2 bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium animate-pulse">
                            🟢 In Progress
                          </span>
                        )}
                        <button 
                          onClick={() => handleDeleteExam(exam.id)}
                          className="px-4 py-2 bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-600/30 text-sm font-medium"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExamManager;
