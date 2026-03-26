import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json() as Promise<any[]>);

/*
const CLASSES = [
  { id: "8a", name: "Lớp 8A", students: 35, pendingExams: 2 },
  { id: "9b", name: "Lớp 9B", students: 32, pendingExams: 1 },
  { id: "9c", name: "Lớp 9C", students: 30, pendingExams: 0 },
];

const EXAMS: Record<string, Array<{ id: string; title: string; subject: string; date: string; total: number; graded: number }>> = {
  "8a": [
    { id: "e1", title: "Phân tích nhân vật Lão Hạc", subject: "Lão Hạc — Nam Cao", date: "18/03/2026", total: 35, graded: 30 },
    { id: "e2", title: "Tóm tắt Tắt đèn", subject: "Tắt đèn — Ngô Tất Tố", date: "10/03/2026", total: 35, graded: 35 },
  ],
  "9b": [
    { id: "e3", title: "Cảm nhận bài thơ Đồng chí", subject: "Đồng chí — Chính Hữu", date: "15/03/2026", total: 32, graded: 20 },
  ],
  "9c": [],
};

const STUDENTS: Record<string, Array<{ id: string; name: string; score: number | null; status: string }>> = {
  "e1": [
    { id: "s1", name: "Nguyễn Thị Mai", score: 7.8, status: "ai_graded" },
    { id: "s2", name: "Trần Văn Hào", score: 6.5, status: "ai_graded" },
    { id: "s3", name: "Lê Minh Anh", score: null, status: "pending" },
    { id: "s4", name: "Phạm Hương Giang", score: 8.2, status: "returned" },
    { id: "s5", name: "Đỗ Quang Minh", score: null, status: "pending" },
  ],
  "e2": [
    { id: "s6", name: "Nguyễn Thị Mai", score: 8.5, status: "returned" },
    { id: "s7", name: "Trần Văn Hào", score: 7.0, status: "returned" },
  ],
  "e3": [
    { id: "s8", name: "Vũ Thị Hồng", score: 7.5, status: "ai_graded" },
    { id: "s9", name: "Bùi Đức Anh", score: null, status: "pending" },
  ],
};
*/

type Step = "class" | "exam" | "student" | "grading";

export default function GradingPage() {
  const [step, setStep] = useState<Step>("class");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const { data: CLASSES = [] } = useSWR('/api/classes', fetcher);
  const { data: EXAMS = [] } = useSWR('/api/exams', fetcher);
  const { data: SUBMISSIONS = [], mutate: mutateSubmissions } = useSWR('/api/submissions', fetcher);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goBack = () => {
    if (step === "grading") { setStep("student"); setSelectedStudent(null); }
    else if (step === "student") { setStep("exam"); setSelectedExam(null); }
    else if (step === "exam") { setStep("class"); setSelectedClass(null); }
  };

  const handleReturn = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedStudent,
        teacherScore: 8.5,
        teacherComment: "Đã chấm xong, bài làm chi tiết."
      })
    });
    await mutateSubmissions();
    setIsSubmitting(false);
    goBack();
  };

  const exams = selectedClass ? EXAMS.filter((e: any) => e.classId === selectedClass) : [];
  const students = selectedExam ? SUBMISSIONS.filter((s: any) => s.examId === selectedExam) : [];
  const student = students.find((s: any) => s.id === selectedStudent);

  return (
    <div className="max-w-7xl mx-auto pb-12 page-enter">
      {/* Breadcrumb */}
      {step !== "class" && (
        <div className="flex items-center gap-2 mb-8 text-sm">
          <button onClick={() => { setStep("class"); setSelectedClass(null); setSelectedExam(null); setSelectedStudent(null); }} className="text-primary hover:underline font-medium">Chấm bài</button>
          {selectedClass && (
            <>
              <span className="text-slate-300">/</span>
              <button onClick={() => { setStep("exam"); setSelectedExam(null); setSelectedStudent(null); }} className="text-primary hover:underline font-medium">{CLASSES.find(c => c.id === selectedClass)?.name}</button>
            </>
          )}
          {selectedExam && (
            <>
              <span className="text-slate-300">/</span>
              <button onClick={() => { setStep("student"); setSelectedStudent(null); }} className="text-primary hover:underline font-medium">{exams.find(e => e.id === selectedExam)?.title}</button>
            </>
          )}
          {selectedStudent && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 font-medium">{student?.name}</span>
            </>
          )}
        </div>
      )}

      {/* ═══ STEP 1: CHỌN LỚP ═══ */}
      {step === "class" && (
        <>
          <div className="mb-10">
            <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-2 block">Hệ thống chấm bài</span>
            <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Chọn lớp học</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CLASSES.map(c => (
              <div
                key={c.id}
                onClick={() => { setSelectedClass(c.id); setStep("exam"); }}
                className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border-[0.5px] border-outline-variant/30 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
              >
                <h3 className="font-headline text-2xl font-bold text-primary mb-3 group-hover:text-secondary transition-colors">{c.name}</h3>
                <div className="flex justify-between text-sm text-slate-500 mb-4">
                  <span>{c.students} học sinh</span>
                  {c.pendingExams > 0 && <span className="text-tertiary font-bold">{c.pendingExams} đề chờ chấm</span>}
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all" style={{ width: c.pendingExams === 0 ? "100%" : `${100 - c.pendingExams * 20}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══ STEP 2: CHỌN ĐỀ THI ═══ */}
      {step === "exam" && (
        <>
          <div className="mb-10 flex items-center justify-between">
            <div>
              <button onClick={goBack} className="text-sm text-primary hover:underline mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Quay lại
              </button>
              <h2 className="text-3xl font-headline font-bold text-primary">{CLASSES.find(c => c.id === selectedClass)?.name} — Chọn đề thi</h2>
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
                  onClick={() => { setSelectedExam(e.id); setStep("student"); }}
                  className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border-[0.5px] border-outline-variant/30 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${e.graded === e.total ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {e.graded === e.total ? "Đã chấm xong" : `${e.graded}/${e.total} đã chấm`}
                    </span>
                    <span className="text-xs text-outline">{e.date}</span>
                  </div>
                  <h3 className="font-headline text-xl font-bold text-primary mb-1 group-hover:text-secondary transition-colors">{e.title}</h3>
                  <p className="text-sm text-slate-500 italic">{e.subject}</p>
                  <div className="mt-4 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${(e.graded / e.total) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ STEP 3: CHỌN HỌC SINH ═══ */}
      {step === "student" && (
        <>
          <div className="mb-10">
            <button onClick={goBack} className="text-sm text-primary hover:underline mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Quay lại
            </button>
            <h2 className="text-3xl font-headline font-bold text-primary mb-2">{exams.find(e => e.id === selectedExam)?.title}</h2>
            <p className="text-sm text-slate-500">Chọn học sinh để bắt đầu chấm bài</p>
          </div>

          {/* Filter Bar */}
          <div className="flex gap-4 mb-8 text-sm">
            <button className="px-4 py-2 bg-primary text-white rounded-full font-bold">Tất cả ({students.length})</button>
            <button className="px-4 py-2 bg-white border border-outline-variant/30 rounded-full text-slate-500 hover:text-primary transition-colors">
              Chờ chấm ({students.filter(s => s.status === "pending").length})
            </button>
            <button className="px-4 py-2 bg-white border border-outline-variant/30 rounded-full text-slate-500 hover:text-primary transition-colors">
              AI đã chấm ({students.filter(s => s.status === "ai_graded").length})
            </button>
            <button className="px-4 py-2 bg-white border border-outline-variant/30 rounded-full text-slate-500 hover:text-primary transition-colors">
              Đã trả ({students.filter(s => s.status === "returned").length})
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl border-[0.5px] border-outline-variant/30 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Học sinh</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Điểm AI</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center font-headline text-primary font-bold text-sm">
                          {s.name.split(' ').pop()?.charAt(0)}
                        </div>
                        <span className="font-semibold text-primary">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.status === "returned" ? "bg-green-100 text-green-700" :
                        s.status === "ai_graded" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          s.status === "returned" ? "bg-green-500" :
                          s.status === "ai_graded" ? "bg-blue-500" :
                          "bg-amber-500"
                        }`}></span>
                        {s.status === "returned" ? "Đã trả" : s.status === "ai_graded" ? "AI đã chấm" : "Chờ chấm"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-primary text-lg">{s.score ?? "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedStudent(s.id); setStep("grading"); }}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-container transition-colors"
                      >
                        {s.status === "returned" ? "Xem lại" : "Chấm bài"}
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
      {step === "grading" && student && (
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
                  <h2 className="font-headline text-3xl font-black text-primary mb-2">{student.name}</h2>
                  <div className="flex gap-4 text-sm text-slate-500 font-medium">
                    <span>{CLASSES.find(c => c.id === selectedClass)?.name}</span>
                    <span className="text-outline-variant">•</span>
                    <span>{exams.find(e => e.id === selectedExam)?.title}</span>
                  </div>
                </header>
                <article className="font-body text-lg leading-relaxed text-on-surface/90 space-y-6 text-justify">
                  <p>Lão Hạc là một trong những hình tượng tiêu biểu nhất cho vẻ đẹp và nỗi khổ của người nông dân Việt Nam trước Cách mạng tháng Tám. Nhân vật này không chỉ mang trong mình nỗi đau về thể xác mà còn là một tấm gương sáng về lòng tự trọng và tình yêu thương con vô hạn.</p>
                  <p>Mở đầu tác phẩm, Nam Cao đã khắc họa một Lão Hạc già yếu, cô đơn sau khi con trai đi phu đồn điền. Lão sống cùng cậu Vàng - người bạn thân thiết duy nhất.</p>
                  <p>Cái chết của Lão Hạc ở cuối truyện là một kết thúc đầy ám ảnh. Lão chọn bả chó để kết thúc đời mình — một cái chết đau đớn nhưng sạch sẽ.</p>
                  <p>Tóm lại, Lão Hạc không chỉ là một lão nông nghèo khổ mà là hiện thân của những giá trị đạo đức cao đẹp.</p>
                </article>
                <footer className="mt-12 pt-6 border-t border-outline-variant/20 flex justify-between items-center text-sm text-slate-400 italic">
                  <span>Số chữ: 487</span>
                  <span>Cập nhật: 2 giờ trước</span>
                </footer>
              </div>
            </section>

            {/* Right: Grading */}
            <section className="w-[55%] bg-surface p-10 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h3 className="font-headline text-xl font-bold text-primary">Kết quả chấm AI</h3>
                  </div>
                  <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {student.status === "returned" ? "Đã trả bài" : "Đang chờ GV duyệt"}
                  </span>
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
                      {[
                        { name: "Nội dung (40%)", desc: "Phân tích đúng yêu cầu đề bài", ai: "7.5", gv: "7.5" },
                        { name: "Lập luận (25%)", desc: "Sự logic và thuyết phục", ai: "6.0", gv: "6.5" },
                        { name: "Diễn đạt (20%)", desc: "Từ vựng, ngữ pháp linh hoạt", ai: "8.0", gv: "8.0" },
                        { name: "Hình thức (15%)", desc: "Trình bày, lỗi chính tả", ai: "9.0", gv: "9.0" },
                      ].map((row) => (
                        <tr key={row.name} className="border-b border-outline-variant/10 hover:bg-surface-container-low/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold">{row.name}</div>
                            <div className="text-xs text-slate-400 mt-1">{row.desc}</div>
                          </td>
                          <td className="px-6 py-4 font-bold text-secondary text-lg">{row.ai}</td>
                          <td className="px-6 py-4">
                            <input className="w-16 bg-white border-[0.5px] border-outline-variant/30 rounded focus:ring-2 focus:ring-primary py-1.5 text-center font-medium" defaultValue={row.gv} type="text" />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-primary text-white">
                        <td className="px-6 py-5 font-headline font-bold text-lg uppercase tracking-wider">Tổng điểm</td>
                        <td className="px-6 py-5 font-headline font-black text-2xl text-blue-200">7.4</td>
                        <td className="px-6 py-5"><div className="w-16 text-center font-headline font-bold text-2xl">7.5</div></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-label text-slate-500 uppercase tracking-widest font-bold">NHẬN XÉT TỪ AI</label>
                  <div className="p-6 bg-secondary/5 border-l-4 border-secondary rounded-r-xl italic text-[#005142] leading-relaxed relative">
                    <span className="material-symbols-outlined absolute top-4 right-4 text-secondary/20 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                    &quot;Bài viết có ý tưởng tốt, phân tích được nội tâm Lão Hạc. Cần bổ sung thêm dẫn chứng cụ thể.&quot;
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-label text-slate-500 uppercase tracking-widest font-bold">NHẬN XÉT CỦA GIÁO VIÊN</label>
                  <textarea className="w-full bg-white border-[0.5px] border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl p-6 shadow-sm italic leading-relaxed text-slate-700 transition-all" placeholder="Nhập nhận xét..." rows={4}></textarea>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-outline-variant/10">
                  <button onClick={goBack} className="px-8 py-3 text-slate-500 font-bold hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors">Bỏ qua</button>
                  <button onClick={handleReturn} disabled={isSubmitting} className="px-10 py-3 disabled:opacity-50 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-headline font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-[1px] transition-all active:scale-[0.98] flex items-center gap-2">
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
