import React, { useState } from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TeacherMultiversePage() {
  const { data: storylinesData, mutate, isLoading } = useSWR('/api/storylines', fetcher);
  const { data: charactersData } = useSWR('/api/characters', fetcher);
  const storylines = storylinesData?.data ?? [];
  const characters = charactersData?.data ?? [];

  // Derive unique works from characters
  const works = React.useMemo(() => {
    const map = new Map<string, { id: string; title: string }>();
    for (const c of characters) {
      if (c.workId && !map.has(c.workId)) {
        map.set(c.workId, { id: c.workId, title: c.workTitle || c.workId });
      }
    }
    return Array.from(map.values());
  }, [characters]);

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ workId: works[0]?.id || '', branchPoint: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/storylines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      mutate();
      setIsCreating(false);
      setFormData({ workId: works[0]?.id || '', branchPoint: '' });
    } catch (err) {
      console.error('Failed to create storyline:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] pb-20">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Quản lý Đa vũ trụ cốt truyện</h2>
          <p className="text-outline mt-2 font-body italic max-w-2xl">Thiết lập các điểm rẽ nhánh (What-if scenarios) để học sinh khám phá góc nhìn mới của văn học kinh điển thông qua AI hóa thân.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-primary text-white px-6 py-3 rounded-full font-headline font-bold hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span> Tạo nhánh mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lệft Column: List of Storylines (7 or 12 depending on states) */}
        <div className={`transition-all duration-500 ease-in-out ${isCreating ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <div className="p-8 text-center text-outline w-full col-span-2">Đang tải không gian đa vũ trụ...</div>
            ) : storylines?.length === 0 ? (
               <div className="p-12 text-center text-outline bg-surface-container-lowest border border-dashed border-outline-variant/50 rounded-3xl w-full col-span-2">
                 <span className="material-symbols-outlined text-4xl mb-3 opacity-50">auto_awesome_mosaic</span>
                 <p className="font-headline">Chưa có nhánh cốt truyện nào được khởi tạo.</p>
               </div>
            ) : (
              storylines?.map((story: { id: string; workId: string; workTitle?: string; branchPoint: string; createdAt: string }, i: number) => (
                <div key={story.id} className="group p-6 bg-white/80 backdrop-blur-md rounded-2xl border border-outline-variant/30 hover:shadow-xl hover:border-secondary/30 transition-all duration-300 relative overflow-hidden flex flex-col justify-between" style={{ animation: `fadeIn 0.5s ease-out ${i * 0.1}s both` }}>
                   {/* Background Decorative Blur */}
                   <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors pointer-events-none"></div>
                   
                   <div className="relative z-10">
                     <div className="flex justify-between items-start mb-4">
                       <span className="bg-primary/5 text-primary text-[10px] font-bold px-3 py-1 rounded-full border border-primary/10 uppercase tracking-widest">
                         {story.workTitle || 'Tác phẩm'}
                       </span>
                       <span className="text-[10px] text-outline font-medium">Hôm nay</span>
                     </div>
                     <h3 className="font-headline font-bold text-xl text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors">
                       Điểm rẽ nhánh: {story.branchPoint?.substring(0, 60)}{story.branchPoint?.length > 60 ? '...' : ''}
                     </h3>
                     <p className="text-sm text-outline mb-6">Mô phỏng 12 nhân vật tương tác tự do dựa trên prompt gốc.</p>
                   </div>
                   
                   <div className="border-t border-outline-variant/20 pt-4 flex gap-3 relative z-10">
                     <button className="text-xs font-bold text-tertiary flex items-center gap-1 hover:underline">
                        <span className="material-symbols-outlined text-[14px]">edit_document</span> Sửa Prompt
                     </button>
                     <button className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline ml-auto">
                        Quản lý Node <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                     </button>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Creation Panel */}
        {isCreating && (
          <div className="lg:col-span-5 relative" style={{ animation: "slideLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
            <div className="sticky top-24 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-8 shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-headline font-bold text-2xl text-primary">Tạo nhánh mới</h3>
                 <button onClick={() => setIsCreating(false)} className="text-outline hover:text-primary transition-colors">
                   <span className="material-symbols-outlined">close</span>
                 </button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                   <label className="text-[11px] font-label font-bold uppercase text-on-surface-variant/70 ml-1 block mb-2">Tác phẩm gốc</label>
                   <select 
                     value={formData.workId}
                     onChange={(e) => setFormData({...formData, workId: e.target.value})}
                     className="w-full bg-surface-container-low/50 border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/20 px-4 py-3 text-sm transition-all outline-none rounded-xl"
                   >
                     {works.map(w => (
                       <option key={w.id} value={w.id}>{w.title}</option>
                     ))}
                     {!works.length && (
                       <option value="work-1">Truyện Kiều — Nguyễn Du</option>
                     )}
                   </select>
                 </div>
                 
                 <div>
                   <label className="text-[11px] font-label font-bold uppercase text-on-surface-variant/70 ml-1 block mb-2">AI Prompt Khởi tạo giả định (What-if)</label>
                   <textarea 
                     required
                     rows={5}
                     placeholder="Ví dụ: Hãy đóng vai cậu Vàng lúc hấp hối, Lão Hạc đang ôm cậu khóc. Cậu Vàng bỗng dưng biết nói tiếng người..."
                     value={formData.branchPoint}
                     onChange={(e) => setFormData({...formData, branchPoint: e.target.value})}
                     className="w-full bg-surface-container-low/50 border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/20 px-4 py-3 text-sm transition-all outline-none rounded-xl resize-none leading-relaxed"
                   />
                   <p className="text-[10px] text-outline mt-2 italic">Hệ thống sẽ truyền System Prompt này vào không gian trò chuyện của Học sinh.</p>
                 </div>

                 <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white font-bold tracking-wide shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                 >
                   {isSubmitting ? 'Đang thiết lập...' : 'Khởi tạo Đa vũ trụ'}
                 </button>
               </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
