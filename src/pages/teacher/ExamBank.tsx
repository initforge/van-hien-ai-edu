import React, { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../../lib/fetcher';
import type { Exam } from '../../types/api';
import AiPreviewModal from '../../components/ai/AiPreviewModal';
import ExamPreviewContent, { type EditableQuestion } from '../../components/ai/ExamPreviewContent';

type Tab = "exercise" | "exam";

export default function ExamBankPage() {
  const [activeTab, setActiveTab] = useState<Tab>("exercise");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [publishTarget, setPublishTarget] = useState<Exam | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const { data: apiExamsData, isLoading, mutate } = useSWR(
    `/api/exams${filterClass ? `?classId=${filterClass}` : ''}`,
    fetcher
  );
  const { data: worksData } = useSWR('/api/works', fetcher);
  const { data: classesData } = useSWR('/api/classes', fetcher);
  const apiExams = apiExamsData?.data ?? [];
  const works = worksData?.data ?? [];
  const classes = classesData?.data ?? [];

  // Filter by tab (class filter is now handled server-side via API)
  const filtered = apiExams.filter((e: Exam) => e.type === activeTab);

  // ── AI Preview state ──────────────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    previewId: string;
    title: string;
    questions: EditableQuestion[];
  } | null>(null);
  const [editableQuestions, setEditableQuestions] = useState<EditableQuestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Publish / unpublish — show confirm dialog first
  const handlePublishClick = (exam: Exam) => {
    setPublishTarget(exam);
  };

  const handlePublishConfirm = async () => {
    if (!publishTarget) return;
    setPublishingId(publishTarget.id);
    const isPublishing = publishTarget.status !== 'published';
    const newStatus = isPublishing ? 'published' : 'draft';
    const prevStatus = publishTarget.status;

    // Optimistic update — instant UI
    await mutate(
      `/api/exams${filterClass ? `?classId=${filterClass}` : ''}`,
      (current: { data: Exam[] } | undefined) => ({
        ...current,
        data: (current?.data ?? []).map(e =>
          e.id === publishTarget.id ? { ...e, status: newStatus } : e
        ),
      }),
      false
    );
    setPublishTarget(null);

    try {
      await fetch('/api/exams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: publishTarget.id, status: newStatus }),
      });
      showToast(isPublishing ? 'Đã đăng đề.' : 'Đã gỡ đăng.', 'success');
    } catch {
      // Rollback on failure
      await mutate(
        `/api/exams${filterClass ? `?classId=${filterClass}` : ''}`,
        (current: { data: Exam[] } | undefined) => ({
          ...current,
          data: (current?.data ?? []).map(e =>
            e.id === publishTarget.id ? { ...e, status: prevStatus } : e
          ),
        }),
        false
      );
      showToast('Lỗi khi cập nhật trạng thái.', 'error');
    } finally {
      setPublishingId(null);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    const deletedId = deleteTarget.id;

    // Optimistic update — instant UI
    await mutate(
      `/api/exams${filterClass ? `?classId=${filterClass}` : ''}`,
      (current: { data: Exam[] } | undefined) => ({
        ...current,
        data: (current?.data ?? []).filter(e => e.id !== deletedId),
      }),
      false
    );
    setDeleteTarget(null);

    try {
      await fetch(`/api/exams?id=${deletedId}`, { method: 'DELETE' });
      showToast('Đã xóa đề.', 'success');
    } catch {
      // Rollback on failure
      await mutate(`/api/exams${filterClass ? `?classId=${filterClass}` : ''}`);
      showToast('Lỗi khi xóa.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Class name lookup
  const className = (id: string) => classes.find((c: { id: string; name: string }) => c.id === id)?.name || '—';
  const workTitle = (id: string) => works.find((w: { id: string; title: string }) => w.id === id)?.title || '';

  // Form state for AI generation — type is always the activeTab
  const [genForm, setGenForm] = useState({
    title: '',
    work: '',
    cls: '',
    duration: 45,
    deadline: '',
  });

  const handleAiGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAiLoading(true);
    setPreviewData(null);

    try {
      const res = await fetch('/api/ai/exam-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: genForm.title,
          workId: genForm.work || undefined,
          classId: genForm.cls || undefined,
          type: activeTab,
          duration: genForm.duration,
          deadline: genForm.deadline || undefined,
        }),
      });
      const data = await res.json();
      if (data.previewId && data.questions?.length) {
        setPreviewData(data);
        setEditableQuestions(data.questions.map((q: { content: string; type: string; points: number; rubric: string }) => ({
          content: q.content || '',
          type: q.type || 'essay',
          points: q.points || 2,
          rubric: q.rubric || '',
        })));
        setShowPreview(true);
        setShowCreateForm(false);
      } else {
        showToast(data.error || 'AI không tạo được đề. Thử lại.', 'error');
      }
    } catch {
      showToast('Lỗi khi gọi AI. Kiểm tra kết nối.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!previewData) return;
    setModalLoading(true);
    try {
      const res = await fetch('/api/ai/exam-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewId: previewData.previewId,
          title: previewData.title,
          questions: editableQuestions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đề đã được tạo, sẵn sàng để chỉnh sửa trước khi đăng.', 'success');
        await mutate();
        setShowPreview(false);
        setPreviewData(null);
        setEditableQuestions([]);
      } else {
        showToast(data.error || 'Lỗi khi lưu đề.', 'error');
      }
    } catch {
      showToast('Lỗi khi lưu đề.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReject = async () => {
    if (!previewData) return;
    await fetch('/api/ai/exam-reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previewId: previewData.previewId }),
    });
    setShowPreview(false);
    setPreviewData(null);
    setEditableQuestions([]);
    showToast('Đã hủy.', 'error');
  };

  return (
    <>
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-lg animate-[fadeIn_0.2s_ease-out] ${
          toastType === 'success' ? 'bg-secondary text-white' : 'bg-red-500 text-white'
        }`}>
          {toastMsg}
        </div>
      )}

      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block">Quản lý học liệu</span>
          <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Ngân hàng Đề</h2>
        </div>
        <div className="flex gap-4">
          {/* AI Generate Form (inline, no separate form) */}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-6 py-3 border border-primary text-primary hover:bg-primary/5 transition-all rounded-md font-medium active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">{aiLoading ? 'hourglass_empty' : 'auto_awesome'}</span>
            {aiLoading ? 'Đang tạo...' : 'AI gợi ý đề'}
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-md shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all font-medium"
          >
            <span className="material-symbols-outlined">{showCreateForm ? "close" : "add"}</span>
            {showCreateForm ? "Đóng" : "Tạo đề mới"}
          </button>
        </div>
      </div>

      {/* AI Generate Form */}
      {showCreateForm && (
        <div className="mb-10 bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-primary/20 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <h3 className="font-headline text-xl font-bold text-primary mb-6">
            Tạo bài tập / đề thi mới
          </h3>
          <form className="grid grid-cols-2 gap-6" onSubmit={handleAiGenerate}>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tên đề *</label>
              <input
                name="title"
                required
                value={genForm.title}
                onChange={e => setGenForm({ ...genForm, title: e.target.value })}
                className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="VD: Phân tích nhân vật..."
              />
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Tác phẩm liên quan</label>
              <select
                name="work"
                value={genForm.work}
                onChange={e => setGenForm({ ...genForm, work: e.target.value })}
                className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">— Không chọn —</option>
                {works.map((w: { id: string; title: string }) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Lớp giao bài</label>
              <select
                name="cls"
                value={genForm.cls}
                onChange={e => setGenForm({ ...genForm, cls: e.target.value })}
                className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="">— Để sau —</option>
                {classes.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Thời lượng</label>
              <select
                name="duration"
                value={genForm.duration}
                onChange={e => setGenForm({ ...genForm, duration: Number(e.target.value) })}
                className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
              >
                <option value="15">15 phút</option>
                <option value="45">45 phút</option>
                <option value="90">90 phút</option>
                <option value="120">120 phút</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-slate-500">Hạn nộp (tùy chọn)</label>
              <input
                type="datetime-local"
                value={genForm.deadline}
                onChange={e => setGenForm({ ...genForm, deadline: e.target.value })}
                className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="col-span-2 flex justify-end gap-4 items-end">
              <button type="button" onClick={() => setShowCreateForm(false)} className="px-6 py-3 text-slate-500 font-bold hover:text-primary">Hủy</button>
              <button
                type="submit"
                disabled={aiLoading || !genForm.title.trim()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">{aiLoading ? 'hourglass_empty' : 'auto_awesome'}</span>
                {aiLoading ? 'Đang tạo xem trước...' : 'Tạo bằng AI'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("exercise")}
                className={`relative pb-4 font-bold group ${activeTab === "exercise" ? "text-primary" : "text-slate-400 hover:text-primary"}`}
              >
                <span>Bài tập</span>
                {activeTab === "exercise" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>}
              </button>
              <button
                onClick={() => setActiveTab("exam")}
                className={`relative pb-4 font-bold group ${activeTab === "exam" ? "text-primary" : "text-slate-400 hover:text-primary"}`}
              >
                <span>Bài thi</span>
                {activeTab === "exam" && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></div>}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={filterClass}
                  onChange={e => setFilterClass(e.target.value)}
                  className="appearance-none bg-surface-container-low border-none rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:ring-1 focus:ring-primary/20 text-on-surface cursor-pointer"
                >
                  <option value="">Tất cả lớp</option>
                  {classes.map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
              </div>
            </div>
          </div>

          {/* Exam Table */}
          <div className="bg-surface-container-lowest shadow-sm rounded-2xl overflow-hidden border border-outline-variant/15">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên đề</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tác phẩm</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lớp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Đang tải...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Chưa có đề nào.</td></tr>
                ) : (
                  filtered.map((e: Exam) => (
                    <tr key={e.id} className="hover:bg-surface-container-low/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-headline font-bold text-primary group-hover:text-secondary transition-colors">{e.title}</div>
                        <div className="text-xs text-slate-400 font-body mt-0.5 italic">
                          {e.duration ? `${e.duration} phút` : ''} {e.workTitle ? `• ${e.workTitle}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface font-medium">{e.workTitle || '—'}</td>
                      <td className="px-6 py-5 text-sm text-on-surface font-medium">{e.className || '—'}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                          e.status === 'published'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {e.status === 'published' ? 'Đã đăng' : 'Nháp'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 text-sm font-medium">
                          <button
                            className="px-3 py-1.5 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => handlePublishClick(e)}
                            disabled={publishingId === e.id}
                            className={`px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              e.status === 'published'
                                ? 'text-slate-400 hover:bg-slate-100'
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {publishingId === e.id ? '...' : e.status === 'published' ? 'Gỡ đăng' : 'Đăng'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            disabled={deletingId === e.id}
                            className="px-3 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingId === e.id ? '...' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteTarget && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
              onClick={() => setDeleteTarget(null)}>
              <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                  <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <div>
                    <h3 className="text-xl font-headline font-bold text-error">Xác nhận xóa</h3>
                    <p className="text-sm text-outline">Hành động không thể hoàn tác.</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface px-6 pb-2 mt-1">
                  Xóa đề <strong>"{deleteTarget.title}"</strong>?
                </p>
                <div className="flex gap-3 px-6 pb-6 mt-4">
                  <button onClick={() => setDeleteTarget(null)}
                    className="flex-1 border border-outline-variant py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
                    Hủy
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 bg-error text-on-error py-2.5 rounded-xl font-semibold hover:bg-error/90 transition-colors">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Publish Confirm Modal */}
          {publishTarget && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
              onClick={() => setPublishTarget(null)}>
              <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                {publishTarget.status === 'published' ? (
                  <>
                    <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                      <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>unpublished</span>
                      <div>
                        <h3 className="text-xl font-headline font-bold text-primary">Gỡ đăng đề</h3>
                        <p className="text-sm text-outline">Học sinh sẽ không thấy bài thi này.</p>
                      </div>
                    </div>
                    <p className="text-sm text-on-surface px-6 pb-2 mt-1">
                      Bỏ đăng đề <strong>"{publishTarget.title}"</strong>? Học sinh đã nộp sẽ giữ bài nhưng không thấy kết quả.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-6 pt-6 pb-2">
                      <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                      <div>
                        <h3 className="text-xl font-headline font-bold text-primary">Xuất bản đề thi</h3>
                        <p className="text-sm text-outline">Học sinh sẽ thấy ngay bài thi này.</p>
                      </div>
                    </div>
                    <p className="text-sm text-on-surface px-6 pb-2 mt-1">
                      Đăng đề <strong>"{publishTarget.title}"</strong>? Bài thi sẽ hiển thị ngay cho học sinh trong lớp.
                    </p>
                  </>
                )}
                <div className="flex gap-3 px-6 pb-6 mt-4">
                  <button onClick={() => setPublishTarget(null)}
                    className="flex-1 border border-outline-variant py-2.5 rounded-xl font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
                    Hủy
                  </button>
                  <button onClick={handlePublishConfirm}
                    className="flex-1 bg-secondary text-on-secondary py-2.5 rounded-xl font-semibold hover:bg-secondary/90 transition-colors">
                    {publishTarget.status === 'published' ? 'Gỡ đăng' : 'Đăng'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="col-span-12 lg:col-span-4 sticky top-28">
          <div className="bg-white/80 backdrop-blur-md shadow-sm rounded-2xl p-8 border border-outline-variant/15 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-headline font-bold text-primary">Cấu trúc Đề thi</h3>
                <span className="text-[10px] font-bold bg-primary/5 text-primary px-2 py-1 rounded">MẪU CHUẨN</span>
              </div>
              <div className="space-y-8">
                <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-secondary/20">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-headline font-bold text-secondary text-sm uppercase tracking-wider">Phần I — Đọc hiểu</h4>
                    <span className="text-xs font-bold text-slate-500">3-4 điểm</span>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600 leading-relaxed">
                    <li className="flex gap-3"><span className="text-primary font-bold">•</span>Văn bản ngoài SGK hoặc đoạn trích tiêu biểu.</li>
                    <li className="flex gap-3"><span className="text-primary font-bold">•</span>4 câu hỏi nhận biết, thông hiểu, vận dụng.</li>
                  </ul>
                </div>
                <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-primary/20">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-headline font-bold text-primary text-sm uppercase tracking-wider">Phần II — Làm văn</h4>
                    <span className="text-xs font-bold text-slate-500">6-7 điểm</span>
                  </div>
                </div>
              </div>
              <button className="w-full mt-10 py-4 border border-dashed border-outline-variant hover:border-primary hover:text-primary transition-all rounded-xl text-sm font-bold text-slate-400 flex items-center justify-center gap-2 active:scale-[0.98]">
                <span className="material-symbols-outlined text-sm">settings_suggest</span>
                Tùy chỉnh cấu trúc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Preview Modal */}
      {previewData && (
        <AiPreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          title={`Xem trước: ${previewData.title}`}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={modalLoading}
          loadingLabel="Đang lưu..."
          footerNote="Bạn có thể chỉnh sửa bất kỳ câu hỏi nào trước khi duyệt."
        >
          <ExamPreviewContent
            title={previewData.title}
            questions={editableQuestions}
            onChange={setEditableQuestions}
          />
        </AiPreviewModal>
      )}
    </>
  );
}
