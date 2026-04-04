import { Link } from 'react-router-dom';
import { useState } from 'react';

import useSWR from 'swr';
import { useAuth } from '../../contexts/AuthContext';

import { fetcher } from '../../lib/fetcher';
import type { StudentStats, UpcomingExam, RecentResult } from '../../types/api';

export default function StudentDashboardPage() {
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const { user } = useAuth();
  const { data } = useSWR<StudentStats>('/api/stats', fetcher);

  const upcomingExams: UpcomingExam[] = data?.upcomingExams ?? [];
  const recentResults: RecentResult[] = data?.recentResults ?? [];


  return (
    <>
      {/* Page Content — no top bar, sidebar provides context */}
      <div className="pt-8 pb-12 px-10 max-w-6xl mx-auto">
        {/* Greeting */}
        <section className="mb-12">
          <h2 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-2">Chào buổi sáng, {user?.name || 'bạn'}!</h2>
          <p className="text-on-surface-variant font-body">Cùng tiếp tục hành trình khám phá vẻ đẹp của ngôn từ nhé.</p>
        </section>

        {/* Bài sắp tới Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-2xl font-bold text-on-surface">Bài sắp tới</h3>
            <Link className="text-sm font-semibold text-primary hover:underline" to="/student/exam-room">Tất cả bài tập</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingExams.map((exam, index) => (
              <Link key={exam.id || index} to={`/student/exam-room/${exam.id}`} className="bg-white/80 backdrop-blur-md rounded-2xl border-[0.5px] border-outline-variant/30 p-6 flex flex-col h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${exam.type === 'exam' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'}`}>
                    {exam.type === 'exam' ? 'Bài thi' : 'Bài tập'}
                  </span>
                  <span className={`text-[11px] font-medium ${exam.type === 'exam' ? 'text-tertiary font-bold' : 'text-outline'}`}>
                    {exam.deadline || 'Sắp tới'}
                  </span>
                </div>
                <h4 className="font-headline text-lg font-bold text-on-surface mb-6 flex-grow group-hover:text-primary transition-colors">{exam.title}</h4>
                <div className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${exam.type === 'exam' ? 'border-[0.5px] border-outline-variant/30 text-slate-600 group-hover:bg-primary group-hover:text-white group-hover:border-primary' : 'bg-gradient-to-r from-primary to-primary-container text-white'}`}>
                  {exam.type === 'exam' ? 'Xem chi tiết' : 'Làm bài →'}
                </div>
              </Link>
            ))}

            {/* Card 3 Placeholder */}
            <div className="rounded-2xl border-[1.5px] border-dashed border-outline-variant/40 p-6 flex flex-col items-center justify-center text-center group hover:border-primary/40 transition-colors bg-white/30 backdrop-blur-sm cursor-pointer hover:bg-primary/5">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-outline group-hover:bg-primary/10 group-hover:text-primary transition-all mb-4">
                <span className="material-symbols-outlined">add_task</span>
              </div>
              <p className="text-sm font-medium text-outline group-hover:text-on-surface transition-colors">Sẵn sàng cho bài tiếp theo</p>
            </div>
          </div>
        </section>

        {/* Kết quả mới Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-2xl font-bold text-on-surface">Kết quả mới</h3>
            <Link className="text-sm font-semibold text-primary hover:underline" to="/student/results">Xem học bạ</Link>
          </div>

          <div className="space-y-4">
            {recentResults.map((result, index) => (
              <div 
                key={result.submissionId || index}
                onClick={() => setExpandedResult(expandedResult === index ? null : index)}
                className="bg-white/80 backdrop-blur-md rounded-2xl border-[0.5px] border-outline-variant/30 overflow-hidden hover:shadow-md transition-all shadow-[0_4px_20px_-5px_rgba(26,28,27,0.08)] cursor-pointer group"
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-full border-[3px] flex items-center justify-center font-bold text-xl transition-colors ${result.examType === 'exam' ? 'border-primary/30 text-primary group-hover:border-primary' : 'border-secondary/30 text-secondary group-hover:border-secondary'}`}>
                      {result.teacherScore?.toFixed(1) || result.aiScore?.toFixed(1) || '?'}
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface">{result.examTitle}</h4>
                      <p className="text-[10px] text-outline mt-1 uppercase tracking-widest font-label font-bold">
                        {result.examType === 'exam' ? 'Bài thi' : 'Bài tập'} · Đã trả kết quả
                      </p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${expandedResult === index ? "rotate-180" : ""}`}>expand_more</span>
                </div>
                {expandedResult === index && (
                  <div className="px-6 pb-6 border-t border-outline-variant/10 pt-4 space-y-3 animate-[fadeIn_0.2s_ease-out]">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                       <div className="bg-surface-container-low p-3 rounded-lg text-center">
                        <p className="text-[10px] text-outline uppercase font-bold mb-1">AI Đánh Giá</p>
                        <p className="font-bold text-tertiary text-lg">{result.aiScore?.toFixed(1) || 'N/A'}</p>
                      </div>
                      <div className="bg-surface-container-low p-3 rounded-lg text-center">
                        <p className="text-[10px] text-outline uppercase font-bold mb-1">Giáo viên chấm</p>
                        <p className="font-bold text-primary text-lg">{result.teacherScore?.toFixed(1) || 'N/A'}</p>
                      </div>
                    </div>
                    <p className={`text-sm text-on-surface-variant italic border-l-2 pl-3 ${result.examType === 'exam' ? 'border-primary/30' : 'border-secondary/30'}`}>
                      &quot;{result.teacherComment || 'Giáo viên chưa để lại nhận xét chi tiết.'}&quot;
                    </p>
                    <Link to="/student/results" className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">
                      Xem chi tiết đầy đủ <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Background Decoration Motif */}
      <div className="fixed bottom-0 right-0 pointer-events-none opacity-[0.03] select-none z-[-1] transform translate-x-1/4 translate-y-1/4 scale-150">
        <svg fill="none" height="400" viewBox="0 0 400 400" width="400" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="190" stroke="#003857" strokeDasharray="10 20" strokeWidth="2"></circle>
          <circle cx="200" cy="200" r="140" stroke="#003857" strokeWidth="2"></circle>
          <circle cx="200" cy="200" r="80" stroke="#003857" strokeWidth="1"></circle>
          <path d="M200 10V40M200 360V390M390 200H360M40 200H10" stroke="#003857" strokeWidth="2"></path>
        </svg>
      </div>
    </>
  );
}
