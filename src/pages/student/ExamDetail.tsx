import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '../../contexts/AuthContext';
import { fetcher, authFetch } from '../../lib/fetcher';
import type { ExamDetail } from '../../types/api';



function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ExamDetailPage() {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data } = useSWR<ExamDetail>(examId ? `/api/exam-detail?id=${examId}` : null, fetcher);

  const exam = data?.exam;
  const questions = data?.questions ?? [];

  const totalSeconds = (exam?.duration || 45) * 60;
  const [elapsed, setElapsed] = useState(0);
  const remaining = Math.max(0, totalSeconds - elapsed);

  const draftKey = examId ? `exam-draft-${examId}` : '';
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (!draftKey) return {};
    try { return JSON.parse(localStorage.getItem(draftKey) || '{}'); } catch { return {}; }
  });

  // Restore textarea values on mount/change
  useEffect(() => {
    if (!examId) return;
    const saved: Record<string, string> = {};
    try { Object.assign(saved, JSON.parse(localStorage.getItem(`exam-draft-${examId}`) || '{}')); } catch { /* ignore localStorage parse error */ }
    Object.entries(saved).forEach(([id, val]) => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-answer-id="${id}"]`);
      if (el) el.value = val as string;
    });
  }, [examId, data]);

  const handleAutoSubmit = useCallback(async () => {
    if (!user || !examId) return;
    setIsSubmitting(true);
    const ans: Record<string, string> = {};
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-answer-id]').forEach(el => {
      ans[el.dataset.answerId || el.id] = el.value;
    });
    try {
      await authFetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, answers: ans })
      });
    } catch (e) { console.error('Auto-submit failed:', e); }
    navigate('/student/results');
  }, [user, examId, navigate]);

  // Timer tick
  useEffect(() => {
    if (!examId) return;
    tickRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          if (tickRef.current) clearInterval(tickRef.current);
          if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
          handleAutoSubmit();
        }
        return next;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [examId, totalSeconds, handleAutoSubmit]);

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!examId) return;
    autoSaveTimer.current = setInterval(() => {
      const ans: Record<string, string> = {};
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-answer-id]').forEach(el => {
        ans[el.dataset.answerId || el.id] = el.value;
      });
      localStorage.setItem(`exam-draft-${examId}`, JSON.stringify(ans));
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 1500);
    }, 5000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [examId]);

  const handleSubmit = async () => {
    if (!user) {
      setError('Vui lòng đăng nhập để nộp bài.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    // Stop both timers immediately
    if (tickRef.current) clearInterval(tickRef.current);
    if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);

    const ans: Record<string, string> = {};
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-answer-id]').forEach(el => {
      ans[el.dataset.answerId || el.id] = el.value;
    });

    try {
      const res = await authFetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, answers: ans })
      });
      if (!res.ok) throw new Error('Submit failed');
      if (examId) localStorage.removeItem(`exam-draft-${examId}`);
      navigate('/student/results');
    } catch {
      setError('Nộp bài thất bại. Vui lòng thử lại.');
      setIsSubmitting(false);
      // Restart timers on failure
      tickRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          if (next >= totalSeconds) {
            if (tickRef.current) clearInterval(tickRef.current);
            if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
            handleAutoSubmit();
          }
          return next;
        });
      }, 1000);
    }
  };

  // Progress
  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => {
    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-answer-id="${q.id}"]`);
    return el && el.value.trim().length > 0;
  }).length;
  const progressPct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const passageContent = exam?.passage
    ? exam.passage.split('\n').filter((p: string) => p.trim().length > 0)
    : [];

  const examTitle = exam?.title || 'Đang tải...';
  const examDuration = exam?.duration ? `${exam.duration} phút` : '';
  const workTitle = exam?.workTitle || '';
  const author = exam?.author || '';

  // Loading state: show spinner while SWR fetches
  if (!data) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
          <p className="font-headline text-lg text-slate-400">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f9f9f6]/80 backdrop-blur-xl shadow-[0_12px_40px_-10px_rgba(26,28,27,0.06)]">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-full mx-auto">
          <div className="flex items-center gap-6">
            <Link to="/student/dashboard" className="text-xl font-bold tracking-tight text-primary font-headline">Văn Học AI</Link>
            <div className="h-4 w-px bg-outline-variant/30"></div>
            <h1 className="text-primary font-bold border-b-2 border-primary font-headline">{examTitle}</h1>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/10 shadow-sm">
            <span className="material-symbols-outlined text-primary text-sm">schedule</span>
            <span className="font-medium text-primary tracking-widest tabular-nums font-label">{formatTimer(remaining)}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-secondary text-sm font-medium">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span>{autoSaved ? 'Đã lưu nháp' : 'Tự động lưu nháp'}</span>
            </div>
            {error && <span className="text-red-500 text-sm font-medium">{error}</span>}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-tertiary hover:bg-[#8a1b13] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold font-headline transition-colors shadow-lg shadow-tertiary/20 active:scale-95"
            >
              {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          </div>
        </div>
        <div className="bg-gradient-to-b from-[#f9f9f6] to-transparent h-px w-full"></div>
      </header>

      <main className="pt-24 pb-20 px-8 max-w-[1400px] mx-auto space-y-24">
        {/* Section 1: Reading Comprehension */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[716px]">
          {/* Left: Literature Passage */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-10 overflow-y-auto max-h-[819px] sticky top-28 border-[0.5px] border-outline-variant/30 shadow-[0_4px_20px_-5px_rgba(26,28,27,0.06)]">
            <div className="mb-8 relative z-10">
              <span className="text-[10px] font-bold tracking-[0.2em] text-primary/70 uppercase block mb-2">Phần I: Đọc hiểu (3.0 điểm)</span>
              <h2 className="font-headline text-3xl font-bold text-primary leading-tight">{workTitle}</h2>
              <p className="text-sm text-on-surface-variant/80 italic mt-1 font-medium">— {author}</p>
            </div>
            <article className="font-headline text-lg leading-[1.8] text-on-surface space-y-6 relative z-10">
              {passageContent.length > 0 ? (
                passageContent.map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p className="italic text-slate-400">Không có đoạn trích cho đề thi này.</p>
              )}
            </article>
            <div className="mt-12 pt-8 border-t border-outline-variant/20 relative z-10">
              <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-primary/20">landscape</span>
              </div>
            </div>
          </div>

          {/* Right: Questions */}
          <div className="space-y-10 py-4">
            <div className="space-y-8">
              {questions.length > 0 ? (
                questions.map((q: { id: string; order_index: number; type: string; content: string; points: number }) => (
                  <div key={q.id} className="group">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">
                      Câu {q.order_index} ({q.points || 0} điểm)
                    </label>
                    <p className="font-headline text-xl mb-4 text-on-surface font-semibold">{q.content}</p>
                    {q.type === 'essay' ? (
                      <textarea
                        className="w-full bg-white/50 backdrop-blur-sm border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all p-6 font-headline text-lg leading-relaxed shadow-inner placeholder:italic placeholder:text-slate-400"
                        placeholder="Viết câu trả lời của bạn..."
                        rows={6}
                        data-answer-id={q.id}
                        defaultValue={answers[q.id] || ''}
                      />
                    ) : (
                      <input
                        className="w-full bg-transparent border-0 border-b border-outline-variant/40 focus:border-primary focus:ring-0 transition-all py-3 px-0 font-headline text-lg placeholder:italic placeholder:text-slate-400"
                        placeholder="Nhập câu trả lời của bạn..."
                        type="text"
                        data-answer-id={q.id}
                        defaultValue={answers[q.id] || ''}
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <span className="material-symbols-outlined text-6xl text-outline-variant">error_outline</span>
                  <p className="font-headline text-xl text-on-surface font-semibold">
                    Không tìm thấy đề thi hoặc đề chưa có câu hỏi.
                  </p>
                  <p className="text-sm text-slate-400">Vui lòng liên hệ giáo viên để được hỗ trợ.</p>
                  <Link
                    to="/student/dashboard"
                    className="mt-4 px-6 py-3 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-colors"
                  >
                    Quay về dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Progress */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-outline-variant/20 py-3 px-8 z-40 shadow-[0_-4px_20px_rgba(26,28,27,0.03)]">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-40 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className="bg-secondary h-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiến độ: {progressPct}%</span>
            </div>
            <div className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              Đang kết nối AI hỗ trợ
            </div>
          </div>
          <span className="text-xs text-outline font-medium">{examDuration}</span>
        </div>
      </footer>

      {/* Decorative Motif */}
      <div className="fixed top-40 right-10 pointer-events-none opacity-[0.03] select-none z-0">
        <svg className="fill-primary" height="400" viewBox="0 0 100 100" width="400">
          <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z"></path>
          <path d="M50 20c-16.6 0-30 13.4-30 30s13.4 30 30 30 30-13.4 30-30-13.4-30-30-30zm0 50c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z"></path>
        </svg>
      </div>
    </div>
  );
}
