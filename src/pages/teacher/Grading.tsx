import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { RUBRIC_DEFAULT } from '../../constants/grading';
import type { RubricRow } from '../../constants/grading';
import { fetcher, authFetch } from '../../lib/fetcher';
import { SUBMISSION_STATUS } from '../../lib/utils';

type Step = 'class' | 'exam' | 'student' | 'grading';

interface ClassRow {
  id: string;
  name: string;
  students: number;
  pendingExams: number;
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

export default function GradingPage() {
  const [step, setStep] = useState<Step>('class');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Grading state
  const [rubricScores, setRubricScores] = useState<RubricRow[]>(
    RUBRIC_DEFAULT.map(r => ({ ...r }))
  );
  const [teacherComment, setTeacherComment] = useState('');
  const [aiGrading, setAiGrading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    score: number | null;
    summary: string;
    scores: { questionId: string; points: number }[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const { data: rubricData } = useSWR<{ data: { name: string; description: string }[] }>('/api/teacher/rubric', fetcher);

  const CLASSES: ClassRow[] = classesData?.data ?? [];
  const EXAMS: ExamRow[] = examsData?.data ?? [];
  const SUBMISSIONS: SubmissionRow[] = submissionsData?.data ?? [];

  // Load rubric from DB (fall back to default)
  const rubricFromDb = useMemo(() => {
    const rows = rubricData?.data ?? [];
    if (!rows.length) return null;
    return rows.map((r) => ({
      name: r.name,
      desc: r.description || '',
      ai: '',
      gvRef: '',
    }));
  }, [rubricData]);

  const { data: essayData } = useSWR(
    selectedStudent ? `/api/answers?submissionId=${selectedStudent}` : null,
    fetcher
  ) as { data: { studentName: string; answers: { questionId: string; content: string }[] } | undefined };

  // ── Derived data ──────────────────────────────────────────────────────────
  const exams = useMemo(
    () => selectedClass ? EXAMS.filter(e => e.classId === selectedClass) : [],
    [selectedClass, EXAMS]
  );

  const students = useMemo(
    () => selectedExam
      ? SUBMISSIONS.filter(s => s.examId === selectedExam)
      : [],
    [selectedExam, SUBMISSIONS]
  );

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

  // When entering grading step, initialize rubric from DB
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
    if (step === 'grading') { setStep('student'); setSelectedStudent(null); }
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
      if (data.success && data.aiScore != null) {
        setAiResult({
          score: data.aiScore,
          summary: data.summary || '',
          scores: data.details || [],
        });
        // Pre-fill rubric AI scores if details available
        if (data.details?.length && rubricScores.length > 0) {
          const updated = rubricScores.map((r, i) => ({
            ...r,
            ai: data.details[i]?.points != null ? String(data.details[i].points) : '',
          }));
          setRubricScores(updated);
        } else {
          // Single total score: spread evenly
          const avg = data.aiScore / rubricScores.length;
          setRubricScores(prev => prev.map(r => ({ ...r, ai: avg.toFixed(1) })));
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
    const prevSubmissions = submissionsData?.data ?? [];

    // Optimistic: mark as returned instantly
    if (selectedExam) {
      await mutateSubmissions(
        (current: { data: SubmissionRow[] } | undefined) => ({
          ...current,
          data: (current?.data ?? []).map(s =>
            s.id === selectedStudent ? { ...s, status: 'returned' as const } : s
          ),
        }),
        false
      );
    }

    try {
      const res = await authFetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedStudent,
          teacherScore: teacherTotal,
          teacherComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đã trả bài.');
        goBack();
      } else {
        // Rollback
        await mutateSubmissions();
        alert(data.error);
      }
    } catch {
      await mutateSubmissions();
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

  return (
    <div className="max-w-7xl mx-auto pb-12 page-enter">
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
            {CLASSES.map(c => (
              <div
                key={c.id}
                onClick={() => { setSelectedClass(c.id); setStep('exam'); }}
                className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border-[0.5px] border-outline-variant/30 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <h3 className="font-headline text-2xl font-bold text-primary mb-3 group-hover:text-secondary transition-colors">
                  {c.name}
                </h3>
                <div className="flex justify-between text-sm text-slate-500 mb-4">
                  <span>{c.students ?? 0} học sinh</span>
                  {(c.pendingExams ?? 0) > 0 && (
                    <span className="text-tertiary font-bold">{c.pendingExams} đề chờ chấm</span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{
                      width: (c.pendingExams ?? 0) === 0
                        ? '100%'
                        : `${Math.max(10, 100 - (c.pendingExams ?? 0) * 20)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
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
          {exams.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4 block">inbox</span>
              <p className="font-medium">Chưa có đề thi nào cần chấm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map(e => (
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

          {/* Filter Bar */}
          <div className="flex gap-4 mb-8 text-sm">
            <button className="px-4 py-2 bg-primary text-white rounded-full font-bold">
              Tất cả ({students.length})
            </button>
            <button className="px-4 py-2 bg-white border border-outline-variant/30 rounded-full text-slate-500 hover:text-primary transition-colors">
              Chờ chấm ({pendingCount})
            </button>
            <button className="px-4 py-2 bg-white border border-outline-variant/30 rounded-full text-slate-500 hover:text-primary transition-colors">
              AI đã chấm ({aiGradedCount})
            </button>
            <button className="px-4 py-2 bg-white border border-outline-variant/30 rounded-full text-slate-500 hover:text-primary transition-colors">
              Đã trả ({returnedCount})
            </button>
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
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                    <h3 className="font-headline text-xl font-bold text-primary">Kết quả chấm AI</h3>
                  </div>
                  <div className="flex items-center gap-2">
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
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
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

                <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm overflow-hidden border-[0.5px] border-outline-variant/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-primary/5 text-primary text-xs font-label uppercase tracking-widest border-b border-outline-variant/20">
                        <th className="px-6 py-4">Tiêu chí</th>
                        <th className="px-6 py-4">AI chấm</th>
                        <th className="px-6 py-4">GV chỉnh</th>
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
                            <div className="text-xs text-slate-400 mt-1">{row.desc}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-secondary text-lg">{row.ai || '—'}</td>
                          <td className="px-6 py-4">
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
                        <td className="px-6 py-5 font-headline font-black text-2xl text-blue-200">
                          {rubricScores.reduce((s, r) => s + (parseFloat(r.ai) || 0), 0).toFixed(1)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="w-16 text-center font-headline font-bold text-2xl">
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
                      style={{ fontVariationSettings: "'FILL' 1" }}
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
