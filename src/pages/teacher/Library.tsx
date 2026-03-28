import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json() as Promise<any[]>);

export default function LibraryPage() {
  const [selected, setSelected] = useState<number>(1);
  const [showForm, setShowForm] = useState(false);

  const { data: WORKS = [], isLoading, mutate } = useSWR('/api/works', fetcher);

  const work = WORKS?.find(w => w.id === selected);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch('/api/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.get('title'),
        author: formData.get('author'),
        grade: formData.get('grade'),
        genre: formData.get('genre'),
        content: formData.get('content')
      })
    });
    await mutate();
    setShowForm(false);
  };

  return (
    <div className="flex gap-8 items-start relative h-full page-enter">
      {/* Center Canvas */}
      <div className="flex-1 pb-12">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-headline font-bold text-primary tracking-tight">Thư viện Tác phẩm</h2>
            <p className="text-sm text-outline mt-1 font-body">Quản lý và tra cứu các kiệt tác văn học trong chương trình.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-container text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">{showForm ? "close" : "add_circle"}</span>
            <span>{showForm ? "Đóng" : "Thêm tác phẩm"}</span>
          </button>
        </header>

        {/* Add Work Form */}
        {showForm && (
          <div className="mb-8 bg-white/80 backdrop-blur-md p-8 rounded-2xl border-[0.5px] border-primary/20 shadow-lg animate-[fadeIn_0.2s_ease-out]">
            <h3 className="font-headline text-xl font-bold text-primary mb-6">Thêm tác phẩm mới</h3>
            <form className="grid grid-cols-2 gap-6" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên tác phẩm *</label>
                <input name="title" required className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="VD: Chí Phèo" type="text" />
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác giả *</label>
                <input name="author" required className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="VD: Nam Cao" type="text" />
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Lớp học</label>
                <select name="grade" className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20">
                  <option>Lớp 8</option>
                  <option>Lớp 9</option>
                  <option>Lớp 10</option>
                  <option>Lớp 11</option>
                  <option>Lớp 12</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Thể loại</label>
                <select name="genre" className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20">
                  <option>Truyện ngắn</option>
                  <option>Tiểu thuyết</option>
                  <option>Truyện thơ</option>
                  <option>Thơ</option>
                  <option>Truyện truyền kỳ</option>
                  <option>Kịch</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Nội dung / đoạn trích chính</label>
                <textarea name="content" className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Dán nội dung tác phẩm hoặc đoạn trích vào đây để AI phân tích..." rows={5}></textarea>
              </div>
              <div className="col-span-2 flex justify-end gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-primary transition-colors">Hủy</button>
                <button type="submit" className="px-8 py-3 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-container transition-all active:scale-[0.98]">
                  Thêm và Phân tích AI
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Bar */}
        <section className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input className="w-full bg-surface-container-low border-none rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-outline/60" placeholder="Tìm kiếm tác phẩm..." type="text" />
          </div>
          <div className="relative group">
            <button className="bg-white border-[0.5px] border-outline-variant/30 px-4 py-3 rounded-lg flex items-center gap-6 text-sm font-medium hover:bg-surface-container-low transition-colors">
              <span>Lớp học</span>
              <span className="material-symbols-outlined text-outline">expand_more</span>
            </button>
          </div>
          <div className="relative group">
            <button className="bg-white border-[0.5px] border-outline-variant/30 px-4 py-3 rounded-lg flex items-center gap-6 text-sm font-medium hover:bg-surface-container-low transition-colors">
              <span>Thể loại</span>
              <span className="material-symbols-outlined text-outline">filter_list</span>
            </button>
          </div>
        </section>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {WORKS?.map(w => (
            <div
              key={w.id}
              onClick={() => setSelected(w.id)}
              className={`bg-white/80 backdrop-blur-md p-5 rounded-2xl relative transition-all duration-300 cursor-pointer ${selected === w.id ? "ring-2 ring-primary" : "border-[0.5px] border-outline-variant/30 hover:shadow-lg"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-secondary-fixed/30 text-secondary px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{w.grade}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${w.status === "analyzed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${w.status === "analyzed" ? "bg-green-500" : "bg-amber-500 animate-pulse"}`}></span>
                  {w.status === "analyzed" ? "Đã phân tích" : "Chờ phân tích"}
                </span>
              </div>
              <h3 className="text-xl font-headline font-bold text-primary mb-1">{w.title}</h3>
              <p className="text-sm text-outline italic mb-4">{w.author}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-[11px] bg-surface-container px-2 py-1 rounded text-on-surface-variant font-medium">{w.genre}</span>
              </div>
              {w.status === "analyzed" && (
                <div className="grid grid-cols-3 gap-2 border-t border-outline-variant/20 pt-4 text-center">
                  <div><p className="text-lg font-bold text-primary">{w.chars}</p><p className="text-[10px] text-outline uppercase">Nhân vật</p></div>
                  <div><p className="text-lg font-bold text-primary">{w.excerpts}</p><p className="text-[10px] text-outline uppercase">Đoạn trích</p></div>
                  <div><p className="text-lg font-bold text-primary">{w.chunks}</p><p className="text-[10px] text-outline uppercase">Chunks</p></div>
                </div>
              )}
              {selected === w.id && <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-l-full"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Right Side Panel */}
      {work && (
        <aside className="w-96 bg-surface-container-low/80 backdrop-blur-sm border-[0.5px] border-outline-variant/30 p-8 rounded-2xl sticky top-28 self-start shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xs font-bold uppercase tracking-widest text-outline">Bối cảnh &amp; Chunks</h4>
            <span className="material-symbols-outlined text-primary cursor-pointer hover:bg-white p-1 rounded transition-colors">open_in_full</span>
          </div>
          <div className="mb-10">
            <h3 className="text-2xl font-headline font-bold text-primary mb-2">{work.title}</h3>
            {work.status === "analyzed" && (
              <div className="flex items-center gap-2">
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: '80%' }}></div>
                </div>
                <span className="text-[10px] font-bold text-secondary">80%</span>
              </div>
            )}
          </div>
          {work.status === "analyzed" ? (
            <div className="space-y-4">
              {["Tóm tắt cốt truyện", "Nhân vật: " + work.title.split(' ')[0], "Đặc sắc nghệ thuật", "Giá trị nội dung"].map((name, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm border border-secondary/20 hover:-translate-y-0.5 transition-transform cursor-pointer">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{name}</p>
                    <p className="text-xs text-outline mt-0.5">{i === 2 ? "Phong cách nghệ thuật đặc trưng" : "Dữ liệu hoàn thiện"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-4 block animate-spin">sync</span>
              <p className="font-medium">Đang chờ AI phân tích...</p>
              <p className="text-xs mt-2">Quá trình này có thể mất 2-5 phút</p>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
