import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useSWR from 'swr';
import { useAuth } from '../../contexts/AuthContext';
import { fetcher } from '../../lib/fetcher';
import type { ExamDetail } from '../../types/api';

// Hardcoded passage for fallback when no API data
const FALLBACK_PASSAGE = [
  "Mặt lão đột nhiên co rúm lại. Những vết nhăn xô lại với nhau, ép cho nước mắt chảy ra. Cái đầu lão ngoẹo về một bên và cái miệng móm mém của lão mếu như con nít. Lão hu hu khóc...",
  "— Khốn nạn... Ông giáo ơi! Nó có biết gì đâu! Nó kiến tôi đi gọi về thì nó vẫy đuôi mừng. Tôi cho nó ăn cơm xong thì thằng Mục, thằng Xiên, hai thằng chúng nó nấp sẵn ở trong nhà, chỉ việc xông ra mà tóm lấy nó. Nó đang ăn thì thằng Mục tóm được hai cẳng sau của nó dốc ngược nó lên...",
  "Này! Ông giáo ạ! Cái giống nó cũng khôn! Nó cứ làm in như nó trách tôi; nó bảo tôi rằng: \"A! Lão già tệ lắm! Tôi ăn ở với lão như thế mà lão xử với tôi như thế này à?\".",
  "Tôi già bằng này tuổi đầu rồi còn đi đánh lừa một con chó, nó không ngờ tôi nỡ tâm lừa nó!",
];

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
      await fetch('/api/submissions', {
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

    const ans: Record<string, string> = {};
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-answer-id]').forEach(el => {
      ans[el.dataset.answerId || el.id] = el.value;
    });

    try {
      const res = await fetch('/api/submissions', {
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
    }
  };

  // Progress
  const totalQuestions = questions.length > 0 ? questions.length : 5; // fallback count for hardcoded
  const answeredCount = (() => {
    if (questions.length > 0) {
      return questions.filter((q) => {
        const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-answer-id="${q.id}"]`);
        return el && el.value.trim().length > 0;
      }).length;
    }
    return Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-answer-id]'))
      .filter(el => el.value.trim().length > 0).length;
  })();
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  const passageContent = exam?.passage
    ? exam.passage.split('\n').filter((p: string) => p.trim().length > 0)
    : FALLBACK_PASSAGE;

  const examTitle = exam?.title || 'Đang tải...';
  const examDuration = exam?.duration ? `${exam.duration} phút` : '';
  const workTitle = exam?.workTitle || 'Lão Hạc';
  const author = exam?.author || 'Nam Cao';

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
              {passageContent.map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
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
                <>
                  {/* Fallback hardcoded questions */}
                  <div className="group">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Câu 1 (0.5 điểm)</label>
                    <p className="font-headline text-xl mb-4 text-on-surface font-semibold">Phương thức biểu đạt chính được sử dụng trong đoạn trích trên là gì?</p>
                    <input className="w-full bg-transparent border-0 border-b border-outline-variant/40 focus:border-primary focus:ring-0 transition-all py-3 px-0 font-headline text-lg placeholder:italic placeholder:text-slate-400" placeholder="Nhập câu trả lời của bạn..." type="text" data-answer-id="q1" />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Câu 2 (0.5 điểm)</label>
                    <p className="font-headline text-xl mb-4 text-on-surface font-semibold">Tìm những từ ngữ miêu tả ngoại hình và cử chỉ của Lão Hạc khi kể chuyện bán chó.</p>
                    <input className="w-full bg-transparent border-0 border-b border-outline-variant/40 focus:border-primary focus:ring-0 transition-all py-3 px-0 font-headline text-lg placeholder:italic placeholder:text-slate-400" placeholder="Nhập câu trả lời của bạn..." type="text" data-answer-id="q2" />
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Câu 3 (2.0 điểm)</label>
                    <p className="font-headline text-xl mb-4 text-on-surface font-semibold">Vì sao Lão Hạc lại cảm thấy mình "nỡ tâm lừa" một con chó? Phân tích diễn biến tâm lý của nhân vật.</p>
                    <textarea className="w-full bg-white/50 backdrop-blur-sm border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all p-6 font-headline text-lg leading-relaxed shadow-inner placeholder:italic placeholder:text-slate-400" placeholder="Viết phân tích của bạn ở đây..." rows={6} data-answer-id="q3"></textarea>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Essay Writing */}
        <section className="max-w-4xl mx-auto space-y-16 pb-32">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold tracking-[0.3em] text-primary/70 uppercase">Phần II: Làm văn (7.0 điểm)</span>
            <div className="h-1 w-12 bg-tertiary/30 mx-auto rounded-full"></div>
          </div>

          {/* Essay Question 1 */}
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
              <h3 className="font-headline text-2xl font-bold text-primary">Câu 1 (2.0 điểm): Nghị luận xã hội</h3>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số chữ gợi ý: 200 - 300</span>
            </div>
            <p className="font-headline text-xl text-on-surface leading-relaxed italic font-medium">
              Viết một đoạn văn ngắn bàn về ý nghĩa của lòng dũng cảm trong cuộc sống hiện đại.
            </p>
            <div className="relative group mt-4">
              <div className="absolute -left-12 top-0 bottom-0 w-1 bg-surface-container-high group-focus-within:bg-secondary transition-colors rounded-full"></div>
              <div className="bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-2xl shadow-sm p-8 min-h-[350px] focus-within:shadow-md transition-shadow">
                <div className="flex gap-4 mb-6 pb-4 border-b border-outline-variant/10 text-slate-400">
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">format_bold</span>
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">format_italic</span>
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">format_list_bulleted</span>
                  <div className="w-px h-6 bg-outline-variant/20"></div>
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">format_quote</span>
                </div>
                <textarea className="w-full h-full min-h-[250px] border-0 focus:ring-0 font-headline text-lg leading-[2] p-0 bg-transparent resize-none placeholder:italic placeholder:text-slate-300" placeholder="Bắt đầu viết bài luận của bạn..." data-answer-id="essay1"></textarea>
              </div>
            </div>
          </div>

          {/* Essay Question 2 */}
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-4">
              <h3 className="font-headline text-2xl font-bold text-primary">Câu 2 (5.0 điểm): Nghị luận văn học</h3>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số chữ gợi ý: &gt; 600</span>
            </div>
            <p className="font-headline text-xl text-on-surface leading-relaxed italic font-medium">
              Phân tích giá trị nhân đạo của tác phẩm "Lão Hạc" qua nhân vật cùng tên.
            </p>
            <div className="relative group mt-4">
              <div className="absolute -left-12 top-0 bottom-0 w-1 bg-surface-container-high group-focus-within:bg-primary transition-colors rounded-full"></div>
              <div className="bg-white/90 backdrop-blur-xl border border-outline-variant/30 rounded-2xl shadow-sm p-8 min-h-[700px] focus-within:shadow-lg transition-shadow relative">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/10">
                  <div className="flex gap-4 text-slate-400">
                    <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">format_bold</span>
                    <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">format_italic</span>
                    <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">format_underlined</span>
                    <div className="w-px h-6 bg-outline-variant/20"></div>
                    <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">align_horizontal_left</span>
                    <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">align_horizontal_center</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-secondary uppercase bg-secondary/10 px-3 py-1.5 rounded cursor-pointer hover:bg-secondary/20 transition-colors">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                    Chế độ tập trung
                  </div>
                </div>
                <textarea className="w-full h-full min-h-[600px] border-0 focus:ring-0 font-headline text-lg leading-[2.2] p-0 bg-transparent resize-none placeholder:italic placeholder:text-slate-300" placeholder="Phân tích sâu về nhân vật Lão Hạc..." data-answer-id="essay2"></textarea>
                <div className="absolute bottom-6 right-6 flex justify-end">
                  <div className="bg-primary hover:bg-primary-container transition-colors backdrop-blur-md text-white px-5 py-2.5 rounded-full text-[10px] font-bold tracking-widest shadow-xl flex items-center gap-2 cursor-default">
                    <span className="material-symbols-outlined text-[16px]">text_fields</span>
                    SỐ CHỮ: 0
                  </div>
                </div>
              </div>
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
