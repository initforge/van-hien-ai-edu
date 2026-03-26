import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json() as Promise<any>);

interface Exam {
  id: string;
  title: string;
  type: 'exam' | 'exercise';
  deadline: string;
}

interface Result {
  submissionId: string;
  examTitle: string;
  examType: 'exam' | 'exercise';
  teacherScore: number | null;
  aiScore: number | null;
  teacherComment: string | null;
}

interface StatsData {
  upcomingExams: Exam[];
  recentResults: Result[];
}

export default function DashboardPage() {
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const { data, isLoading } = useSWR<StatsData>('/api/stats', fetcher);
  
  const statsData = data;
  
  const upcomingExams: Exam[] = statsData?.upcomingExams?.length ? statsData.upcomingExams : [
    { id: '1', title: 'Phân tích nhân vật Lão Hạc', type: 'exercise', deadline: '22/03/2026' }, 
    { id: '2', title: 'Đề thi giữa kỳ — Lớp 8', type: 'exam', deadline: '25/03/2026' }
  ];

  const recentResults: Result[] = statsData?.recentResults?.length ? statsData.recentResults : [
    { submissionId: 'r1', examTitle: 'Nghị luận xã hội — Lòng dũng cảm', examType: 'exercise', teacherScore: 8.0, aiScore: 8.5, teacherComment: "Bài viết có ý tưởng tốt, phân tích sâu sắc." },
    { submissionId: 'r2', examTitle: 'Đọc hiểu — Đồng chí', examType: 'exam', teacherScore: 7.5, aiScore: 7.0, teacherComment: "Phân tích tốt hình ảnh thơ." }
  ];

  if (isLoading) return <div className="p-10 text-center font-serif text-[#003857]">Đang tải trí tuệ Việt...</div>;

  return (
    <div className="min-h-screen bg-[#f9f9f6]">
      {/* TopAppBar */}
      <header className="fixed top-0 right-0 left-0 z-30 bg-[#f9f9f6]/80 backdrop-blur-xl flex justify-between items-center px-8 h-16 border-b border-[#003857]/5">
        <div className="flex items-center flex-1 max-w-xl">
          <div className="relative w-full group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72787e]">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-full text-sm focus:ring-1 focus:ring-[#003857] transition-all" 
              placeholder="Tìm kiếm bài học, nhân vật..." 
              type="text" 
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#72787e] hover:text-[#003857] transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#9c4146] rounded-full"></span>
            </button>
            <Link to="/login" className="w-8 h-8 rounded-full bg-[#003857] flex items-center justify-center text-white text-xs font-bold shadow-sm">M</Link>
        </div>
      </header>

      {/* Page Content */}
      <div className="pt-24 pb-12 px-10 max-w-6xl mx-auto">
        {/* Greeting */}
        <section className="mb-12">
          <h2 className="font-serif text-4xl font-extrabold text-[#003857] tracking-tight mb-2">Chào buổi sáng!</h2>
          <p className="text-[#72787e] font-sans">Cùng tiếp tục hành trình khám phá vẻ đẹp của ngôn từ nhé.</p>
        </section>

        {/* Bài sắp tới Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-2xl font-bold text-[#003857]">Bài sắp tới</h3>
            <button className="text-sm font-semibold text-[#003857] hover:underline">Tất cả bài tập</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingExams.map((exam, index) => (
              <div key={exam.id || index} className="bg-white rounded-2xl border border-[#003857]/5 p-6 flex flex-col h-full hover:shadow-lg transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${exam.type === 'exam' ? 'bg-[#9c4146]/10 text-[#9c4146]' : 'bg-[#003857]/10 text-[#003857]'}`}>
                    {exam.type === 'exam' ? 'Bài thi' : 'Bài tập'}
                  </span>
                  <span className="text-[11px] font-medium text-[#72787e]">
                    {exam.deadline || 'Sắp tới'}
                  </span>
                </div>
                <h4 className="font-serif text-lg font-bold text-[#003857] mb-6 flex-grow group-hover:text-[#006a6a] transition-colors">{exam.title}</h4>
                <div className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${exam.type === 'exam' ? 'border border-[#72787e]/20 text-[#72787e] group-hover:bg-[#003857] group-hover:text-white' : 'bg-[#003857] text-white'}`}>
                  {exam.type === 'exam' ? 'Xem chi tiết' : 'Làm bài →'}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Kết quả mới Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-2xl font-bold text-[#003857]">Kết quả mới</h3>
            <button className="text-sm font-semibold text-[#003857] hover:underline">Xem học bạ</button>
          </div>

          <div className="space-y-4">
            {recentResults.map((result, index) => (
              <div 
                key={result.submissionId || index}
                onClick={() => setExpandedResult(expandedResult === index ? null : index)}
                className="bg-white rounded-2xl border border-[#003857]/5 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-bold text-lg ${result.examType === 'exam' ? 'border-[#003857]/20 text-[#003857]' : 'border-[#006a6a]/20 text-[#006a6a]'}`}>
                      {result.teacherScore?.toFixed(1) || result.aiScore?.toFixed(1) || '?'}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-[#003857]">{result.examTitle}</h4>
                      <p className="text-[10px] text-[#72787e] mt-1 uppercase tracking-widest font-bold">
                        {result.examType === 'exam' ? 'Bài thi' : 'Bài tập'} · Đã trả kết quả
                      </p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-[#003857] transition-transform ${expandedResult === index ? "rotate-180" : ""}`}>expand_more</span>
                </div>
                {expandedResult === index && (
                  <div className="px-6 pb-6 border-t border-[#003857]/5 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                       <div className="bg-[#f9f9f6] p-3 rounded-lg text-center">
                        <p className="text-[10px] text-[#72787e] uppercase font-bold mb-1">AI Đánh Giá</p>
                        <p className="font-bold text-[#9c4146] text-lg">{result.aiScore?.toFixed(1) || 'N/A'}</p>
                      </div>
                      <div className="bg-[#f9f9f6] p-3 rounded-lg text-center">
                        <p className="text-[10px] text-[#72787e] uppercase font-bold mb-1">Giáo viên</p>
                        <p className="font-bold text-[#003857] text-lg">{result.teacherScore?.toFixed(1) || 'N/A'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#72787e] italic border-l-2 border-[#003857]/20 pl-3">
                      &quot;{result.teacherComment || 'Giáo viên chưa để lại nhận xét chi tiết.'}&quot;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Decorative Motif */}
      <div className="fixed bottom-0 right-0 pointer-events-none opacity-[0.05] z-[-1] transform translate-x-1/4 translate-y-1/4 scale-150">
        <svg fill="none" height="400" viewBox="0 0 400 400" width="400" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="190" stroke="#003857" strokeDasharray="10 20" strokeWidth="2"></circle>
          <path d="M200 10V40M200 360V390M390 200H360M40 200H10" stroke="#003857" strokeWidth="2"></path>
        </svg>
      </div>
    </div>
  );
}
