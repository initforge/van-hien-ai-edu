import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { RUBRIC_DEFAULT } from '../../constants/grading';
import type { RubricRow } from '../../constants/grading';
import { fetcher, authFetch } from '../../lib/fetcher';
import { SUBMISSION_STATUS } from '../../lib/utils';
import { FILL_SETTINGS } from '../../lib/utils';

type Step = 'class' | 'exam' | 'student' | 'grading';
type FilterStatus = 'all' | 'pending' | 'ai_graded' | 'returned';

interface ClassRow {
  id: string;
  name: string;
  students: number;
  pendingCount: number;
  totalSubmitted: number;
  gradedCount: number;
}

interface ExamRow {
  id: string;
  title: string;
  classId: string | null;
  graded: number;
  total: number;
  status: string;
  createdAt: string;
}

interface SubmissionRow {
  id: string;
  examId: string;
  studentId: string;
  studentName: string | null;
  examTitle: string;
  classId: string | null;
  status: string;
  aiScore: number | null;
  teacherScore: number | null;
  teacherComment: string | null;
  submittedAt: string | null;
}

// ─── Chat Thread Modal ────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}
interface ChatThreadDetail {
  id: string;
  characterName: string;
  studentName: string;
  createdAt: string;
  messages: ChatMessage[];
}

function ChatThreadModal({
  threadId,
  onClose,
}: {
  threadId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useSWR<{
    threadId: string;
    messages: ChatMessage[];
  }>(`/api/chat?threadId=${threadId}`, fetcher);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-[fadeIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" style={FILL_SETTINGS}>chat</span>
            <span className="font-headline font-bold text-primary">Nội dung cuộc trò chuyện</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-xl text-outline">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">
              <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
              <p className="mt-2 text-sm">Đang tải...</p>
            </div>
          ) : !data?.messages?.length ? (
            <div className="text-center py-8 text-slate-400">Chưa có tin nhắn.</div>
          ) : (
            data.messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-surface-container-high text-on-surface rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-outline-variant/20 shrink-0">
          <p className="text-xs text-outline text-center">
            {data?.messages?.length ?? 0} tin nhắn
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Test Chat Modal ───────────────────────────────────────────────────────────
function TestChatModal({
  characterId,
  characterName,
  systemPrompt,
  onClose,
}: {
  characterId: string;
  characterName: string;
  systemPrompt: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<{ role: string; text: string }[]>([]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setLoading(true);
    setMessages(prev => {
      const next = [...prev, { role: 'user', text: userText }];
      messagesRef.current = next;
      return next;
    });

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messagesRef.current, { role: 'user', text: userText }],
          characterId,
        }),
      });

      if (res.headers.get('content-type')?.includes('text/plain')) {
        const text = await res.text();
        setMessages(prev => {
          const next = [...prev, { role: 'assistant', text }];
          messagesRef.current = next;
          return next;
        });
      } else {
        const data = await res.json();
        if (data.error) {
          setMessages(prev => {
            const next = [...prev, { role: 'assistant', text: `[Lỗi: ${data.error}]` }];
            messagesRef.current = next;
            return next;
          });
        }
      }
    } catch {
      setMessages(prev => {
        const next = [...prev, { role: 'assistant', text: '[Lỗi kết nối.]' }];
        messagesRef.current = next;
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative z-10 bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-[fadeIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary" style={FILL_SETTINGS}>chat</span>
            <div>
              <p className="font-headline font-bold text-primary">Test nhân vật</p>
              <p className="text-xs text-outline">{characterName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-xl text-outline">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">chat</span>
              <p className="text-sm">Gửi tin nhắn để thử nhân vật này.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-secondary/10 text-secondary rounded-bl-md'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-container-high rounded-2xl px-4 py-3 text-sm text-slate-400 rounded-bl-md">
                <span className="material-symbols-outlined text-base animate-spin">sync</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/20 shrink-0 space-y-2">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-white border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base" style={FILL_SETTINGS}>send</span>
            </button>
          </div>
          <p className="text-[10px] text-outline text-center">Phản hồi được sinh bởi AI thật — đây là preview chính xác trải nghiệm học sinh.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main GradingPage ──────────────────────────────────────────────────────────
export default function GradingPage() {
  const [step, setStep] = useState<Step>('class');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Filter
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  // Grading state
  const [rubricScores, setRubricScores] = useState<RubricRow[]>(
    RUBRIC_DEFAULT.map(r => ({ ...r }))
  );
  const [teacherComment, setTeacherComment] = useState('');
  const [aiGrading, setAiGrading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    score: number | null;
    summary: string;
    rubricScores: { name: string; points: number; comment: string }[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [testChatChar, setTestChatChar] = useState<{ id?: string; name: string; prompt: string } | null>(null);
  const [viewChatThreadId, setViewChatThreadId] = useState<string | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: classesData, mutate: mutateClasses } = useSWR('/api/classes', fetcher);
  const { data: examsData, mutate: mutateExams } = useSWR(
    selectedClass ? `/api/exams?classId=${selectedClass}` : null,
    fetcher
  );
  const { data: submissionsData, mutate: mutateSubmissions } = useSWR(
    selectedExam ? `/api/submissions?examId=${selectedExam}` : null,
    fetcher
  );
  const { data: rubricData } = useSWR<{ data: { name: string; description: string; weight: number }[] }>(
    '/api/teacher/rubric',
    fetcher
  );
  const { data: essayData } = useSWR(
    selectedStudent ? `/api/answers?submissionId=${selectedStudent}` : null,
    fetcher
  ) as { data: { studentName: string; answers: { questionId: string; content: string }[] } | undefined };

  const CLASSES: ClassRow[] = (classesData?.data ?? []).map((c: any) => ({
    ...c,
    // Normalise field names: classes.js returns `pendingExams`, rename to pendingCount
    pendingCount: c.pendingCount ?? c.pendingExams ?? 0,
    totalSubmitted: c.totalSubmitted ?? c.total ?? 0,
    gradedCount: c.gradedCount ?? c.graded ?? 0,
  }));
  const EXAMS: ExamRow[] = examsData?.data ?? [];
  const ALL_SUBMISSIONS: SubmissionRow[] = submissionsData?.data ?? [];

  // Load rubric from DB (fall back to default)
  const rubricFromDb = useMemo(() => {
    const rows = rubricData?.data ?? [];
    if (!rows.length) return null;
    return rows.map((r) => ({
      name: r.name,
      desc: r.description || '',
      weight: r.weight ?? 0,
      ai: '',
      gvRef: '',
    }));
  }, [rubricData]);

  // ── Filter submissions ───────────────────────────────────────────────────
  const students = useMemo(() => {
    let list = selectedExam ? ALL_SUBMISSIONS.filter(s => s.examId === selectedExam) : [];
    switch (activeFilter) {
      case 'pending':    list = list.filter(s => s.status === 'submitted'); break;
      case 'ai_graded': list = list.filter(s => s.status === SUBMISSION_STATUS.AI_GRADED); break;
      case 'returned':  list = list.filter(s => s.status === SUBMISSION_STATUS.RETURNED); break;
    }
    return list;
  }, [activeFilter, selectedExam, ALL_SUBMISSIONS]);

  const pendingCount = useMemo(
    () => students.filter(s => s.status === 'submitted').length,
    [students]
  );
  const aiGradedCount = useMemo(
    () => students.filter(s => s.status === SUBMISSION_STATUS.AI_GRADED).length,
    [students]
  );
  const returnedCount = useMemo(
    () => students.filter(s => s.status === SUBMISSION_STATUS.RETURNED).length,
    [students]
  );

  const student = useMemo(
    () => students.find(s => s.id === selectedStudent),
    [students, selectedStudent]
  );

  const teacherTotal = rubricScores.reduce((sum, r) => sum + (parseFloat(r.gvRef) || 0), 0);

  // When entering grading step, initialise rubric from DB
  const handleEnterGrading = (submissionId: string) => {
    setSelectedStudent(submissionId);
    if (rubricFromDb && rubricFromDb.length > 0) {
      setRubricScores(rubricFromDb.map(r => ({ ...r, ai: '', gvRef: '' })));
    } else {
      setRubricScores(RUBRIC_DEFAULT.map(r => ({ ...r, ai: '', gvRef: '' })));
    }
    setAiResult(null);
    setTeacherComment('');
    setStep('grading');
  };

  const goBack = () => {
    if (step === 'grading') { setStep('student'); setSelectedStudent(null); setActiveFilter('all'); }
    else if (step === 'student') { setStep('exam'); setSelectedExam(null); }
    else if (step === 'exam') { setStep('class'); setSelectedClass(null); }
  };

  const handleAiGrade = async () => {
    if (!selectedStudent) return;
    setAiGrading(true);
    setAiResult(null);
    try {
      const res = await authFetch('/api/ai/grade-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: selectedStudent }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Chấm điểm thất bại.');
        return;
      }
      const data = await res.json();
      if (data.totalScore != null) {
        setAiResult({
          score: data.totalScore,
          summary: data.summary || '',
          rubricScores: data.rubricScores || [],
        });
        // Map AI rubric scores to local rubric by name match
        if (data.rubricScores?.length) {
          const updated = rubricScores.map(r => {
            const matched = data.rubricScores.find(
              (s: { name: string; points: number; comment: string }) =>
                s.name.toLowerCase().trim() === r.name.toLowerCase().trim()
            );
            return matched
              ? { ...r, ai: String(matched.points), aiComment: matched.comment }
              : r;
          });
          setRubricScores(updated);
        }
      } else {
        alert(data.error || 'Chấm điểm thất bại.');
      }
    } catch (e) {
      console.error('AI grading failed:', e);
      alert('Lỗi mạng. Vui lòng thử lại.');
    } finally {
      setAiGrading(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);

    try {
      // If AI was graded, persist aiScore first, then teacherScore
      if (aiResult?.score != null) {
        await authFetch('/api/submissions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedStudent,
            aiScore: aiResult.score,
            teacherScore: teacherTotal,
            teacherComment,
          }),
        });
      } else {
        await authFetch('/api/submissions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedStudent,
            teacherScore: teacherTotal,
            teacherComment,
          }),
        });
      }

      showToast('Đã trả bài.');
      goBack();
      mutateSubmissions();
    } catch {
      alert('Lỗi khi trả bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const currentExam = EXAMS.find(e => e.id === selectedExam);
  const progressPct = currentExam && currentExam.total > 0
    ? (currentExam.graded / currentExam.total) * 100
    : 0;

  const filterBtns: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all',      label: 'Tất cả',      count: students.length },
    { key: 'pending',  label: 'Chờ chấm',    count: pendingCount },
    { key: 'ai_graded',label: 'AI đã chấm',  count: aiGradedCount },
    { key: 'returned', label: 'Đã trả',      count: returnedCount },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12 page-enter">

      {/* Modals */}
      {testChatChar && (
        <TestChatModal
          characterId={testChatChar.id ?? testChatChar.name}
          characterName={testChatChar.name}
          systemPrompt={testChatChar.prompt}
          onClose={() => setTestChatChar(null)}
        />
      )}
      {viewChatThreadId && (
        <ChatThreadModal
          threadId={viewChatThreadId}
          onClose={() => setViewChatThreadId(null)}
        />
      )}

      {/* Breadcrumb */}
      {step !== 'class' && (
        <div className="flex items-center gap-2 mb-8 text-sm">
          <button
            onClick={() => { setStep('class'); setSelectedClass(null); setSelectedExam(null); setSelectedStudent(null); }}
            className="text-primary hover:underline font-medium"
          >
            Chấm bài
          </button>
          {selectedClass && (
            <>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => { setStep('exam'); setSelectedExam(null); setSelectedStudent(null); }}
                className="text-primary hover:underline font-medium"
              >
                {CLASSES.find(c => c.id === selectedClass)?.name}
              </button>
            </>
          )}
          {selectedExam && (
            <>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => { setStep('student'); setSelectedStudent(null); }}
                className="text-primary hover:underline font-medium"
              >
                {EXAMS.find(e => e.id === selectedExam)?.title}
              </button>
            </>
          )}
          {selectedStudent && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 font-medium">
                {student?.studentName || student?.studentId}
              </span>
            </>
          )}
        </div>
      )}

      {/* ═══ STEP 1: CHỌN LỚP ═══ */}
      {step === 'class' && (
        <>
          <div className="mb-10">
            <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block">
              Hệ thống chấm bài
            </span>
            <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">
              Chọn lớp học
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CLASSES.map(c => {
              const submitted = c.totalSubmitted ?? (c.pendingCount + c.gradedCount);
              const pending = c.pendingCount ?? 0;
              const pct = submitted > 0 ? Math.round(((submitted - pending) / submitted) * 100) : 0;
              return (
                <div
                  key={c.id}
                  onClick={() => { setSelectedClass(c.id); setStep('exam'); }}
                  className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border-[0.5px] border-outline-variant/30 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <h3 className="font-headline text-2xl font-bold text-primary mb-3 group-hover:text-secondary transition-colors">
                    {c.name}
                  </h3>

                  {/* Metrics row */}
                  <div className="flex justify-between text-sm text-slate-500 mb-1">
                    <span>{submitted} bài nộp</span>
                    <span className="text-tertiary font-bold">{pending} chờ chấm</span>
                  </div>

                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-4">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: submitted === 0 ? '0%' : `${Math.max(10, pct)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{pct}% đã chấm</p>
                </div>
              );
            })}
            {CLASSES.length === 0 && (
              <div className="col-span-3 text-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 block">school</span>
                <p className="font-medium">Chưa có lớp nào.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ STEP 2: CHỌN ĐỀ THI ═══ */}
      {step === 'exam' && (
        <>
          <div className="mb-10 flex items-center justify-between">
            <div>
              <button onClick={goBack} className="text-sm text-primary hover:underline mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Quay lại
              </button>
              <h2 className="text-3xl font-headline font-bold text-primary">
                {CLASSES.find(c => c.id === selectedClass)?.name} — Chọn đề thi
              </h2>
            </div>
          </div>
          {EXAMS.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4 block">inbox</span>
              <p className="font-medium">Chưa có đề thi nào cần chấm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EXAMS.map(e => (
                <div
                  key={e.id}
                  onClick={() => { setSelectedExam(e.id); setStep('student'); }}
                  className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border-[0.5px] border-outline-variant/30 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      e.graded === e.total ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {e.graded === e.total ? 'Đã chấm xong' : `${e.graded}/${e.total} đã chấm`}
                    </span>
                    <span className="text-xs text-outline">{formatDate(e.createdAt)}</span>
                  </div>
                  <h3 className="font-headline text-xl font-bold text-primary mb-1 group-hover:text-secondary transition-colors">
                    {e.title}
                  </h3>
                  <div className="mt-4 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${e.total > 0 ? (e.graded / e.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ STEP 3: CHỌN HỌC SINH ═══ */}
      {step === 'student' && (
        <>
          <div className="mb-10">
            <button onClick={goBack} className="text-sm text-primary hover:underline mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Quay lại
            </button>
            <h2 className="text-3xl font-headline font-bold text-primary mb-2">
              {EXAMS.find(e => e.id === selectedExam)?.title}
            </h2>
            <p className="text-sm text-slate-500">Chọn học sinh để bắt đầu chấm bài</p>
          </div>

          {/* Filter Bar — ACTIVE */}
          <div className="flex gap-3 mb-8 flex-wrap">
            {filterBtns.map(btn => (
              <button
                key={btn.key}
                onClick={() => setActiveFilter(btn.key)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeFilter === btn.key
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white border border-outline-variant/30 text-slate-500 hover:text-primary hover:border-primary/30'
                }`}
              >
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl border-[0.5px] border-outline-variant/30 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Học sinh</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Điểm</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center font-headline text-primary font-bold text-sm">
                          {(s.studentName || s.studentId || '?').split(' ').pop()?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-primary">{s.studentName || s.studentId || 'Chưa rõ'}</div>
                          <div className="text-xs text-slate-400">{formatDate(s.submittedAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.status === SUBMISSION_STATUS.RETURNED ? 'bg-green-100 text-green-700' :
                        s.status === SUBMISSION_STATUS.AI_GRADED ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          s.status === SUBMISSION_STATUS.RETURNED ? 'bg-green-500' :
                          s.status === SUBMISSION_STATUS.AI_GRADED ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`} />
                        {s.status === SUBMISSION_STATUS.RETURNED ? 'Đã trả' :
                         s.status === SUBMISSION_STATUS.AI_GRADED ? 'AI đã chấm' : 'Chờ chấm'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-primary text-lg">
                      {s.teacherScore != null ? `${s.teacherScore}/10` :
                       s.aiScore != null ? `${s.aiScore}/10` : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEnterGrading(s.id)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
                      >
                        {s.status === SUBMISSION_STATUS.RETURNED ? 'Xem lại' : 'Chấm bài'}
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      Không có bài nộp nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══ STEP 4: GIAO DIỆN CHẤM BÀI ═══ */}
      {step === 'grading' && student && (
        <>
          <div className="mb-6">
            <button onClick={goBack} className="text-sm text-primary hover:underline mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Quay lại danh sách
            </button>
          </div>
          <div className="flex gap-0 h-[calc(100vh-200px)] -mx-10 -mb-12 rounded-t-2xl overflow-hidden border border-outline-variant/15">
            {/* Left: Essay */}
            <section className="w-[45%] bg-surface-container-lowest p-10 overflow-y-auto border-r border-outline-variant/30 flex justify-center">
              <div className="max-w-2xl w-full">
                <header className="mb-10">
                  <h2 className="font-headline text-3xl font-black text-primary mb-2">
                    {essayData?.studentName || student?.studentName || 'Học sinh'}
                  </h2>
                  <div className="flex gap-4 text-sm text-slate-500 font-medium">
                    <span>{CLASSES.find(c => c.id === selectedClass)?.name}</span>
                    <span className="text-outline-variant">•</span>
                    <span>{EXAMS.find(e => e.id === selectedExam)?.title}</span>
                  </div>
                </header>
                <article className="font-body text-lg leading-relaxed text-on-surface/90 space-y-6 text-justify">
                  {!essayData?.answers?.length && (
                    <p className="text-slate-400 italic">Đang tải bài làm...</p>
                  )}
                  {essayData?.answers?.map((a, i) => (
                    <p key={a.questionId || i}>
                      {a.content || '(Chưa có nội dung)'}
                    </p>
                  ))}
                </article>
                <footer className="mt-12 pt-6 border-t border-outline-variant/20 flex justify-between items-center text-sm text-slate-400 italic">
                  <span>{essayData?.answers?.length || 0} câu trả lời</span>
                  <span>{essayData?.studentName ? 'Từ học sinh' : '—'}</span>
                </footer>
              </div>
            </section>

            {/* Right: Grading */}
            <section className="w-[55%] bg-surface p-10 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary" style={FILL_SETTINGS}>
                      auto_awesome
                    </span>
                    <h3 className="font-headline text-xl font-bold text-primary">Kết quả chấm AI</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {aiResult && aiResult.score !== null && (
                      <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold">
                        AI: {aiResult.score}/10
                      </span>
                    )}
                    <button
                      onClick={handleAiGrade}
                      disabled={aiGrading || student.status === SUBMISSION_STATUS.RETURNED}
                      className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm" style={FILL_SETTINGS}>
                        auto_awesome
                      </span>
                      {aiGrading ? 'Đang chấm...' :
                       student.status === SUBMISSION_STATUS.RETURNED ? 'Đã chấm rồi' : 'Chấm bằng AI'}
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      student.status === SUBMISSION_STATUS.RETURNED
                        ? 'bg-green-100 text-green-700'
                        : 'bg-tertiary/10 text-tertiary'
                    }`}>
                      {student.status === SUBMISSION_STATUS.RETURNED ? 'Đã trả bài' : 'Đang chờ GV duyệt'}
                    </span>
                  </div>
                </div>

                {/* Rubric table with weight % */}
                <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm overflow-hidden border-[0.5px] border-outline-variant/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-primary/5 text-primary text-xs font-label uppercase tracking-widest border-b border-outline-variant/20">
                        <th className="px-6 py-4">Tiêu chí</th>
                        <th className="px-6 py-4 text-center">%</th>
                        <th className="px-6 py-4 text-center">AI</th>
                        <th className="px-6 py-4 text-center">GV</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {rubricScores.map((row, idx) => (
                        <tr
                          key={row.name}
                          className="border-b border-outline-variant/10 hover:bg-surface-container-low/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold">{row.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{row.desc}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-bold text-outline px-2 py-0.5 bg-surface-container-low rounded-full">
                              {row.weight > 0 ? `${row.weight}%` : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="font-bold text-secondary text-lg">{row.ai || '—'}</div>
                            {row.aiComment && (
                              <div className="text-[10px] text-secondary/60 leading-tight mt-0.5 max-w-[120px] mx-auto">{row.aiComment}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input
                              className="w-16 bg-white border-[0.5px] border-outline-variant/30 rounded focus:ring-2 focus:ring-primary py-1.5 text-center font-medium"
                              value={row.gvRef}
                              onChange={e => {
                                const next = [...rubricScores];
                                next[idx] = { ...next[idx], gvRef: e.target.value };
                                setRubricScores(next);
                              }}
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-primary text-white">
                        <td className="px-6 py-5 font-headline font-bold text-lg uppercase tracking-wider">
                          Tổng điểm
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-xs font-bold text-blue-200">100%</span>
                        </td>
                        <td className="px-6 py-5 font-headline font-black text-2xl text-blue-200 text-center">
                          {rubricScores.reduce((s, r) => s + (parseFloat(r.ai) || 0), 0).toFixed(1)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="w-16 mx-auto text-center font-headline font-bold text-2xl">
                            {teacherTotal.toFixed(1)}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-label text-slate-500 uppercase tracking-widest font-bold">
                    NHẬN XÉT TỪ AI
                  </label>
                  <div className="p-6 bg-secondary/5 border-l-4 border-secondary rounded-r-xl italic text-[#005142] leading-relaxed relative">
                    <span
                      className="material-symbols-outlined absolute top-4 right-4 text-secondary/20 text-4xl"
                      style={FILL_SETTINGS}
                    >
                      format_quote
                    </span>
                    &quot;{aiResult?.summary || 'Chưa có nhận xét. Nhấn &quot;Chấm bằng AI&quot; để phân tích bài viết.'}&quot;
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-label text-slate-500 uppercase tracking-widest font-bold">
                    NHẬN XÉT CỦA GIÁO VIÊN
                  </label>
                  <textarea
                    className="w-full bg-white border-[0.5px] border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-6 shadow-sm leading-relaxed text-slate-700 transition-all"
                    placeholder="Nhập nhận xét cho học sinh..."
                    rows={4}
                    value={teacherComment}
                    onChange={e => setTeacherComment(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-outline-variant/10">
                  <button
                    onClick={goBack}
                    className="px-8 py-3 text-slate-500 font-bold hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors"
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={handleReturn}
                    disabled={isSubmitting}
                    className="px-10 py-3 disabled:opacity-50 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-headline font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-[1px] transition-all active:scale-[0.98] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    {isSubmitting ? 'Đang trả bài...' : 'Trả bài'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function showToast(message: string) {
  // Simple browser notification via a temporary element
  const el = document.createElement('div');
  el.className = 'fixed bottom-6 right-6 z-[100] bg-primary text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-sm animate-[fadeIn_0.2s_ease-out]';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 2500);
}
