import React, { useState } from "react";
import { Link } from 'react-router-dom';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json() as Promise<any[]>);

// Safe field extractors based on /api/exams schema: { id, title, type, duration, status, deadline, createdAt }
function examDescription(exam: any): string {
  return exam.type === 'exercise' ? 'Bài tập văn học' : 'Đề thi';
}

function examDeadline(exam: any): string {
  if (!exam.deadline) return 'Không có hạn';
  try {
    const d = new Date(exam.deadline);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return exam.deadline;
  }
}

type ExamFilter = "all" | "exercise" | "exam";

export default function ExamRoomPage() {
  const { data, isLoading } = useSWR('/api/exams', fetcher);

  // Fetch student's submissions to know which exams are already submitted
  const { data: submissions } = useSWR('/api/submissions', fetcher);

  const EXAM_ROOMS = data || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [filter, setFilter] = useState<ExamFilter>("all");

  // Build set of submitted examIds
  const submittedIds = React.useMemo(() => {
    const ids = new Set<string>();
    if (Array.isArray(submissions)) {
      submissions.forEach((s: any) => { if (s.examId) ids.add(s.examId); });
    }
    return ids;
  }, [submissions]);

  const selected = EXAM_ROOMS.find((e) => e.id === selectedId);
  const filtered = EXAM_ROOMS.filter((e) => filter === "all" || e.type === filter);

  const isExamSubmitted = (examId: string) => submittedIds.has(examId);

  return (
    <div className="p-8 lg:p-12 min-h-screen page-enter">
      {/* Header */}
      <header className="mb-10">
        <span className="text-xs font-label tracking-widest text-secondary font-bold uppercase mb-2 block">Phòng thi trực tuyến</span>
        <h2 className="text-4xl font-headline font-bold text-primary tracking-tight mb-2">Chọn phòng thi</h2>
        <p className="text-on-surface-variant max-w-xl">Chọn đề thi bạn muốn làm, xem thông tin chi tiết và xác nhận trước khi bắt đầu.</p>
      </header>

      {/* Filter Bar */}
      <div className="flex gap-2 mb-8">
        {(["all", "exercise", "exam"] as ExamFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              filter === f
                ? "bg-primary text-white shadow-md"
                : "bg-white text-slate-500 border border-outline-variant/30 hover:bg-primary/5 hover:text-primary"
            }`}
          >
            {f === "all" ? "Tất cả" : f === "exercise" ? "Bài tập" : "Đề thi"}
          </button>
        ))}
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {isLoading ? (
          <p className="text-on-surface-variant col-span-full text-center py-10">Đang tải danh sách đề thi...</p>
        ) : filtered.length === 0 ? (
          <p className="text-on-surface-variant col-span-full text-center py-10">Không có đề thi nào.</p>
        ) : filtered.map((exam) => {
          const submitted = isExamSubmitted(exam.id);
          return (
            <div
              key={exam.id}
              onClick={() => { setSelectedId(exam.id); setShowConfirm(false); }}
              className={`bg-white/80 backdrop-blur-md rounded-2xl p-6 border-[0.5px] cursor-pointer transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-lg ${
                selectedId === exam.id
                  ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                  : "border-outline-variant/30 hover:border-primary/40"
              } ${submitted ? "opacity-70" : ""}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                  submitted
                    ? "bg-slate-100 text-slate-500"
                    : "bg-secondary/10 text-secondary"
                }`}>
                  {submitted ? "Đã hoàn thành" : "Sẵn sàng"}
                </span>
                <span className="text-xs text-outline font-medium">{exam.duration} phút</span>
              </div>

              <h3 className="font-headline font-bold text-lg text-primary mb-2">{exam.title}</h3>
              <p className="text-sm text-on-surface-variant mb-4 flex-grow">{examDescription(exam)}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="px-2 py-0.5 bg-surface-container-low rounded-full text-[10px] font-medium text-on-surface-variant">
                  {exam.type === 'exam' ? 'Đề thi' : 'Bài tập'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-2 text-xs text-outline">
                  <span className="material-symbols-outlined text-sm">quiz</span>
                  {"—"} câu hỏi
                </div>
                <div className="flex items-center gap-2 text-xs text-outline">
                  <span className="material-symbols-outlined text-sm">event</span>
                  Hạn: {examDeadline(exam)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Exam Detail + Confirm */}
      {selected && (
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 border border-primary/20 shadow-xl max-w-2xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-headline text-2xl font-bold text-primary mb-1">{selected.title}</h3>
              <p className="text-on-surface-variant">{examDescription(selected)}</p>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-tertiary transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-surface-container-low p-4 rounded-xl text-center">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">schedule</span>
              <p className="text-xs text-outline uppercase font-bold tracking-wider">Thời gian</p>
              <p className="font-bold text-primary">{selected.duration} phút</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl text-center">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">quiz</span>
              <p className="text-xs text-outline uppercase font-bold tracking-wider">Câu hỏi</p>
              <p className="font-bold text-primary">{"—"}</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl text-center">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">signal_cellular_alt</span>
              <p className="text-xs text-outline uppercase font-bold tracking-wider">Độ khó</p>
              <p className="font-bold text-primary">{"—"}</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl text-center">
              <span className="material-symbols-outlined text-primary text-2xl mb-2">menu_book</span>
              <p className="text-xs text-outline uppercase font-bold tracking-wider">Môn</p>
              <p className="font-bold text-primary">Ngữ Văn</p>
            </div>
          </div>

          {isExamSubmitted(selected.id) ? (
            <Link to="/student/results"
              className="block w-full text-center py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Xem kết quả bài đã làm
            </Link>
          ) : !showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-container hover:shadow-lg active:scale-[0.98] transition-all"
            >
              Xác nhận vào phòng thi
            </button>
          ) : (
            <div className="bg-tertiary/5 border border-tertiary/20 rounded-xl p-6 text-center space-y-4">
              <span className="material-symbols-outlined text-tertiary text-4xl">warning</span>
              <p className="font-bold text-primary text-lg">Bạn chắc chắn muốn bắt đầu?</p>
              <p className="text-sm text-on-surface-variant">Sau khi vào phòng thi, bộ đếm thời gian sẽ bắt đầu. Bạn không thể tạm dừng.</p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-8 py-3 border border-outline-variant/30 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Huỷ
                </button>
                <Link to={`/exam-room/${selected.id}`}
                  className="px-8 py-3 bg-tertiary text-white rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-tertiary/20"
                >
                  Bắt đầu thi ngay
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
