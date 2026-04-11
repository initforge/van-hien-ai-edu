# BÁO CÁO GIẢI PHÁP - NỀN TẢNG VĂN HỌC AI

## PHẦN MỞ ĐẦU
- **Trang bìa:** (Theo mẫu của trường)
- **Lời cam đoan:** (Theo mẫu của trường)
- **Lời cảm ơn:** (Nhóm tác giả tự viết)
- **Mục lục:** (Tự động cập nhật)
- **Danh mục hình ảnh, bảng biểu:** (Tự động cập nhật)

_(Nội dung file tom-tat.md sẽ được chèn vào đây)_

---

## CHƯƠNG 1: GIỚI THIỆU

### 1.1 Thực trạng dạy & học Ngữ Văn THCS
Môn Ngữ Văn cấp THCS đóng vai trò bản lề trong việc hình thành nhân cách và tư duy ngôn ngữ cho học sinh. Tuy nhiên, phương pháp tiếp cận hiện tại đôi lúc vẫn mang tính truyền đạt một chiều. Học sinh ít có không gian để rèn luyện tư duy phản biện hoặc thực sự đặt mình vào hoàn cảnh của nhân vật để đồng cảm sâu sắc với tình tiết cốt truyện. Về phía nhà trường, việc giáo viên phải đọc và đánh giá chi tiết hàng trăm bài văn tự luận trong mỗi kỳ thi là một khối lượng công việc rất lớn, dẫn đến khó khăn trong việc cung cấp phản hồi cá nhân hóa định kỳ cho từng người học.

### 1.2 Mục tiêu đề tài
Đề tài hướng tới việc xây dựng một nền tảng giáo dục hỗ trợ học sinh học tập tự chủ và thu hút hơn, với các mục tiêu cụ thể:
- Tạo ra môi trường học tập nơi người học có thể đối thoại trực tiếp với các hình tượng nhân vật trong nguyên tác thông qua AI.
- Khuyến khích tư duy mở bằng cách cho học sinh thử nghiệm tạo các nhánh hệ quả tác phẩm (Đa vũ trụ văn học).
- Giảm tải áp lực chấm bài cho giáo viên bằng công cụ đánh giá tự động, bám sát các tiêu chí chấm điểm (Rubric) công bằng và minh bạch.

### 1.3 Phạm vi & Giới hạn của dự án
- **Đối tượng sử dụng:** Học sinh và giáo viên khối Trung học Cơ sở.
- **Phạm vi nội dung:** Tập trung mô phỏng cốt truyện và nhân vật ở các tác phẩm truyện tiểu thuyết, tác phẩm tự sự tiêu biểu trong chương trình.
- **Giới hạn công nghệ:** Hệ thống trí tuệ nhân tạo được lựa chọn phát triển dựa trên các mô hình ngôn ngữ mã nguồn mở. Do sự tối ưu về chi phí hạ tầng, mô hình ở mức độ vừa phải, do đó ứng dụng thỉnh thoảng sẽ gặp độ trễ hoặc phản hồi thiếu chính xác ở những tình huống phân tích quá phức tạp.

### 1.4 Kết cấu báo cáo
Báo cáo gồm 7 chương: Giới thiệu chung (Chương 1), Cơ sở lý thuyết và định hướng công nghệ (Chương 2), Khảo sát và phân tích yêu cầu (Chương 3), Thiết kế hệ thống ứng dụng (Chương 4), Quá trình triển khai ứng dụng (Chương 5), Kiểm thử hiệu năng và kết quả (Chương 6), Kết luận và định hướng (Chương 7).

---

## CHƯƠNG 2: CƠ SỞ LÝ THUYẾT & ĐỊNH HƯỚNG CÔNG NGHỆ

### 2.1 Trí tuệ nhân tạo trong giáo dục (AI in Education)
Trí tuệ nhân tạo hiện nay đang đóng vai trò như một hệ thống "trợ giảng ảo" hỗ trợ mạnh mẽ nền giáo dục trực tuyến. Thay vì cung cấp đáp án sẵn có, các hệ thống AI được huấn luyện để đóng vai trò khơi gợi, liên tục đặt câu hỏi nhằm kích thích học sinh phải tự tư duy và tìm ra hướng đi đúng đắn nhất trước khi đưa ra kết luận đánh giá.

### 2.2 Các giải pháp nền tảng cho ứng dụng
Để đạt sự thuận tiện tối đa cho người sử dụng, đề tài tập trung vào việc áp dụng công nghệ nâng cao chất lượng trải nghiệm, biểu hiện qua ba thành phần chính:
- **Giao diện hiện đại, tính tương tác cao:** Đảm bảo hệ thống hiển thị mượt mà trên mọi thiết bị cá nhân, phản hồi tương tác liền mạch theo phong cách đặc trưng của các ứng dụng hội thoại thông dụng giúp học sinh dễ thao tác.
- **Hệ thống lưu trữ đám mây phân tán:** Ứng dụng hoạt động trên hạ tầng phi tập trung toàn cầu (Cloud Edge), giúp dữ liệu được truy xuất nhanh chóng mà không yêu cầu nhà trường phải trang bị các máy chủ vật lý tốn kém hoặc bảo trì thường xuyên.
- **Mô hình lập luận ngôn ngữ tiên tiến:** Hệ thống áp dụng cấu trúc hướng dẫn AI hiểu ngữ cảnh tự động, đảm bảo trước khi giao tiếp với học sinh, AI đã được cung cấp một bản lý lịch phân tích tâm lý của nhân vật để đưa ra những phân tích đúng nguyên tác nhất.

### 2.3 Điểm khác biệt so với các sản phẩm hiện có
Các nền tảng hỗ trợ học trực tuyến phổ biến hiện nay (quốc tế và trong nước) thường được thiết kế để phục vụ việc giao bài tập trắc nghiệm khách quan hoặc gửi tài liệu định dạng tĩnh. Hạn chế lớn nằm ở quy trình phản hồi dành cho môn Ngữ văn - vốn đòi hỏi việc đánh giá tự luận định tính. Hệ thống của đề tài tạo ra điểm nhấn bằng một không gian trò chuyện chuyên biệt, đưa ra khả năng thẩm định lỗi chi tiết trên một bài làm tự luận dài thành các mức độ theo biểu điểm cấu trúc chặt chẽ.

---

## CHƯƠNG 3: KHẢO SÁT CHỨC NĂNG ỨNG DỤNG

### 3.1 Nhu cầu thực tiễn
Từ những đợt phỏng vấn định tính với các giáo viên Ngữ Văn, có thể thấy mong muốn rất lớn về một công cụ "chỉ ra chính xác luận điểm mắc lỗi ở dòng nào trong bài" thay vì một hệ thống tự động cộng điểm cảm tính. Đối với học sinh, một phương thức tiếp cận tình tiết tác phẩm thông qua tương tác dạng văn bản nhắn tin sẽ mang lại sự hấp dẫn và thu hút sự tập trung trong thời đại số.

### 3.2 Nhóm tác nhân sử dụng hệ thống
- **Học sinh (Người học):** Khám phá tình tiết tác phẩm, tương tác giả lập với các hình mẫu nhân vật, thực hiện các bài kiểm tra được giao.
- **Giáo viên (Người điều hành lớp):** Giao bài tự luận, thiết lập các bộ tiêu chuẩn chấm điểm chi tiết định hướng phân tích định lượng (Rubric) làm căn cứ cho hệ thống, và giám sát thống kê quá trình làm bài của lớp.
- **Ban Quản trị (Admin):** Theo dõi hệ thống, cấp phát tài khoản làm việc cho tổ chuyên môn và xử lý các sự cố về an toàn dữ liệu cơ bản.

### 3.3 Yêu cầu nhóm nghiệp vụ chính
- Mô phỏng và duy trì phong cách đàm thoại ổn định của nhân vật truyện.
- Cho phép người dùng trực tiếp thay đổi quyết định của nhân vật nhằm khám phá hậu quả của chi tiết mới (Sơ đồ Đa vũ trụ phân nhánh).
- Quản lý quá trình kiểm tra, bảo vệ bài làm và thiết định các khung thời hạn chấm trả rõ ràng.
- Chấm bài tự động, phân tích rành mạch nhận xét cho phân đoạn văn bản học sinh sinh nộp dựa vào biểu điểm giáo viên cấu hình.

### 3.4 Yêu cầu tiêu chuẩn trải nghiệm (Phi chức năng)
- Tốc độ hiển thị văn bản trả về từ phần mềm (AI Response Streaming) phải được nối tiếp tuần tự và trôi chảy. Tránh gây ra trạng thái ứng dụng chờ hệ thống phân tích quá trên 3 giây làm phát sinh nguy cơ học sinh bỏ dở bài viết.
- Giao diện thiết kế không nên chứa không gian quảng cáo hay nút bấm phức tạp, nhằm thúc đẩy tính tập trung chuyên sâu cho lớp học chữ và làm bài tập.

---

## CHƯƠNG 4: THIẾT KẾ CẤU TRÚC HỆ THỐNG

### 4.1 Quy trình phục vụ người yêu cầu
Mọi thao tác yêu cầu gửi đi của người học từ ứng dụng sẽ được chuyển lên giao thức giao tiếp lập trình (API). Tại lớp bảo mật biên mạng, hệ thống đóng gói các thông số lớp học cá nhân và bối cảnh quy định cho nhân vật truyện. Toàn bộ gói dữ liệu được dịch chuyển để hệ thống Trí Tuệ Nhân Tạo đưa ra kết quả phân loại logic. Dữ liệu văn bản phản hồi sẽ giải nén nhỏ và truyền song song về thiết bị hiển thị liên tục.
[PLACEHOLDER: bao-cao/hinh-anh/kien-truc-tong-quan.png]

### 4.2 Thiết kế Cơ sở dữ liệu và Thông tin lưu trữ
Hệ thống sử dụng nguyên tắc tổ chức dữ liệu theo nhóm, với cấu trúc nổi bật: Khối định danh khối lớp người dùng, Khối lưu trữ nhật ký đối thoại văn học, và phần mềm Khảo thí (kỳ thi/bài khảo sát/phiếu nhận xét chi tiết Rubric). Việc phân buồng cụ thể này giúp bảo đảm nguyên tắc bảo mật thông tin tối kỵ dành cho môi trường sư phạm, đồng thời phân bổ khả năng truy xuất nhẹ nhàng nhanh chóng cho thiết bị người dùng.
[PLACEHOLDER: bao-cao/hinh-anh/so-do-kho-du-lieu.png]

### 4.3 Trải nghiệm và Bố cục giao diện
Thiết kế nền tảng dựa trên triết lý tối giản (Minimalism) với phân vùng làm việc gọn gàng. Sử dụng các gam nền sáng nhẹ làm chủ đạo để phù hợp không gian soạn thảo văn bản quy mô lớn mà không tạo trải nghiệm bức bối cho mắt người xem.

---

## CHƯƠNG 5: QUÁ TRÌNH PHÁT TRIỂN ỨNG DỤNG

### 5.1 Giao diện người dùng hướng tới thực tế
Trong quá trình xây dựng, cấu trúc hội thoại và hệ thống dẫn hướng (Navigation) được tinh chỉnh dựa trên thói quen người dùng chung. Ứng dụng tích hợp hiệu ứng thông báo hoạt động của hệ thống, giúp học sinh nhận thức được quá trình phân tích bài thi trên máy chủ hoặc xác định kết nối mạng vẫn đang chạy liên tục.

### 5.2 Xây dựng kết nối và hạn chế giới hạn hệ thống
Bước lập trình các đoạn "Chỉ thị gốc" (System Prompting) quy định hành vi nhân sinh quan cho nhân vật trên thiết bị được triển khai rất kiên nhẫn. Đội ngũ thực hiện nghiêm túc việc áp đặt các giới hạn từ vựng lịch sử, bảo đảm AI giữ nguyên nét nghiêm cẩn của tác phẩm nguyên tác của bộ Giáo dục mà không rơi vào chiều hướng phân tích lệch chuẩn kiến thức, duy trì trọn vẹn đặc trưng phong cách sống của thế kỷ cũ trong ngữ cảnh môn Ngữ Văn truyền thống.

---

## CHƯƠNG 6: KẾT QUẢ VÀ TỐI ƯU CÁC BÀI TOÁN TRẢI NGHIỆM

*(Lưu ý: Mọi ảnh minh hoạ đều được xuất trình từ quá trình thao tác kiểm thử trực tiếp trên ứng dụng thực tế).*

### 6.1 Giao diện chức năng trực quan

#### 6.1.1 Chức năng đối thoại văn học
Tính năng mô phỏng nhân vật trả về hiệu quả hội thoại chân thực đến bất ngờ. Các hệ thống phản hồi duy trì sự nghiêm ngặt sát gốc theo hình tượng nhân vật (Chí Phèo, Lão Hạc). Các câu trả lời đưa vào phong cách suy luận cởi mở dẫn dắt sự tư duy sáng tạo chủ động của người dùng hệ thống.
[PLACEHOLDER: bao-cao/hinh-anh/demo-chat-nhan-vat.png]

#### 6.1.2 Không gian luyện thi trực tuyến tập trung
Hệ thống lớp học số hóa hiện rất logic và cung cấp đầy đủ thông tin về tình trạng đóng/mở bài tập giao về máy. Khung đăng ký làm bài cho cái nhìn rất thân thiện, giáo viên đánh giá được quá trình tương tác nhóm học theo thống kê minh bạch.
[PLACEHOLDER: bao-cao/hinh-anh/demo-phong-thi.png]

#### 6.1.3 Phân tích và báo cáo chấm điểm chi tiết (Rubric Grading Report)
Đạt hiệu quả ưu việt trong khả năng báo lỗi ngữ pháp và nhận xét chiều sâu cảm thụ tự luận. Giao diện thay vì áp đặt số điểm vô tri nay chuyển hướng tách bài viết nhỏ ra phân kỳ. Điểm được cấp sẽ được ứng hệ thống cấp chứng cứ bám sát luận điểm học sinh ghi trực tiếp.
[PLACEHOLDER: bao-cao/hinh-anh/demo-phieu-cham-diem.png]

#### 6.1.4 Cây sự kiện Đa vũ trụ văn học sinh động
Cung cấp giải pháp minh hoạ chuỗi nhân quả hoàn mĩ. Các phân nhánh giúp học sinh trực diện chiêm ngưỡng nếu tính huống đưa cho tác giả rẽ qua lối khác sẽ đem đến những hậu quả số phận như thế nào mà ứng dụng cung cấp được giải pháp tương đối sát thực với đời thật.
[PLACEHOLDER: bao-cao/hinh-anh/demo-da-vu-tru.png]

### 6.2 Giải quyết những Bài toán trải nghiệm phần mềm phát sinh

- **Khắc phục 1: Rủi ro mất đoạn hội thoại khi gián đoạn viễn thông**
Hệ thống sử dụng các tín hiệu truyền số lượng từ vựng nặng với tốc độ cao. Bất kì đứt gãy nào từ bên phía kết nối của học sinh cũng làm mất thông tin xử lý chưa kịp lưu trên máy học. Công nghệ ứng phó bao gồm "Cơ chế sao lưu ẩn liên tục trong vùng nhớ bộ đệm nền", đảm bảo thông tin sẽ không bao giờ thất lạc và chỉ xuất kho tải lại khi dòng mạng đường truyền bình ổn.

- **Khắc phục 2: Sự ổn định của khả năng AI trên khâu tự đánh giá (Rubric consistency)**
Bản chất của các thuật toán trí tuệ ảo đôi khi tạo ra sai số không nhất quán với cùng một cấu trúc tham chiếu chuẩn mực (ảo giác bộ dữ liệu AI). Tuy nhiên nhóm đã đưa vào ràng buộc thông qua cách thức đúc dòng kết quả thành khuôn dữ liệu cố định (JSON Schema định dạng cứng). Các thuật toán lúc này mất tính tự do mà phải giải thích kết quả và kiểm điểm số chặt chẽ tuyệt đối dựa theo biểu mẫu yêu cầu, nếu không lệnh nộp bảng hoàn thiện đến người dùng học sinh bị hủy xuất trình.

- **Khắc phục 3: An toàn cơ sở dữ liệu trước hệ thống mã điều khiển (Input Integrity)**
Những bài văn do học sinh truyền nhập sẽ rủi ro khi học sinh lỡ đính kèm những tham số nhầm lẫn mang bộ cú pháp chuyên biệt với hệ quản trị cơ sở dữ liệu. Nhằm giảm sự cố kĩ thuật nguy hiểm sập máy giáo viên, nền tảng bắt buộc gói khóa toàn bộ dạng chuỗi đầu vào theo dạng "thuần chữ thụ động". Mã sẽ được phân lọc vô trùng trước khi tác động và ghi nhận.

- **Khắc phục 4: Cách ly phân vùng lỗi logic phân nhánh truyện đa vũ trụ**
Sự cố của kịch bản bị "đứt chuỗi logic" có thể đánh sập hệ thống hội thoại cây nhân quả hiện hành và làm khó chịu hệ sinh thái ứng dụng. Bằng cách tái phát và khoanh kín từng vùng bộ gõ logic lỗi, khi một hạt cây cốt chuyện sai, người dùng sẽ yêu cầu tạo mới tại phạm vi riêng rẽ nhánh khu vực bị lỗi đấy mà chẳng ảnh hưởng tổn thương đến cả một công sức sáng tác dài suốt buổi trước đó.

### 6.3 Hồi đáp chung trình duyệt nghiệm thử
Kết quả vận hành mượt và khả năng phân tích chữ trên chu kì cực chuẩn tương đương ứng dụng quy mô phần mềm thương mại lớn. Cùng bố cục sắp xếp phân cấp cực kỳ bài bản và tối ưu thị lực thì kết cấu nền này được tín nhiệm lớn.

---

## CHƯƠNG 7: TỔNG KẾT VÀ KỲ VỌNG Ở TƯƠNG LAI

### 7.1 Đóng góp nổi bật của đề tài
Nền tảng Văn Học AI THCS đã minh họa rất thực tế cho tiềm năng mở của công nghệ Trí tuệ Nhân tạo - không chỉ giỏi trong việc tính toán xác suất tự nhiên mà còn có khả năng áp dụng vượt trội trong nhóm ngành Khoa học Xã hội nói chung, Văn học phổ thông nói riêng. Đề án định hình góc nhìn Giáo dục tương tác tích cực đa hướng, loại bỏ tư duy áp lực giảng thuật đơn luồng giáo viên.

### 7.2 Các mặt hạn chế có tính thời đại
- Để khả thi quy trình duy trì và chi phí rẻ cho giáo dục nghèo, lõi tính toán trí tuệ chỉ ưu tiên lựa chọn bản mô hình vận hành giới hạn trung bình khá. Cho nên những câu hỏi triết học nặng độ với độ lắt léo đòi hỏi sự thẩm định của giáo sư lão thành vẫn có khi cho mô hình kết quả phi logic lệch định hướng ban đầu.

### 7.3 Tầm nhìn tương lai định hướng sau đề án
Đề tài nuôi kì vọng cải tạo xây nên hệ thống lớp "Phòng trải nghiệm tương tác đồng đội" (Online Multiplayer Class). Các học sinh có cơ chế tổ 5 người với thao tác can thiệp chỉnh lí tình huống văn học trực tuyến mà quản trị hệ thống AI làm vị trí phân tích tác giá đánh giá tính hợp lệ phân bổ nhân vật tập thể mang tính khoa học phối hợp nhân văn.

---

## TÀI LIỆU THAM KHẢO
1. [Khung chương trình Giáo dục Phổ thông hiện hành 2018 - Môn Ngữ Văn cấp cơ sở]
2. [Hệ Sách giáo khoa Ngữ văn cấp Trung học Cơ sở trực thuộc Nhà xuất bản Giáo dục]
3. [Nguồn tài liệu mở uy tín đào sâu về khả năng tinh chỉnh nhận thức suy luận các mô hình Generative AI hiện hành]

---

## PHỤ LỤC BÁO CÁO KÈM THEO
### Phụ lục 1: Cấu trúc Ràng buộc kiểm soát Hành vi mô phỏng hệ thống (Control Parameters System)
_(Chèn một bức ảnh chụp nội dung mã văn lệnh tạo điều hướng nhận thức nhân phẩm, đặc tính riêng nhân vật Lão Hạc/Chí Phèo nhằm diễn giải quy trình kìm giữ và lập khuôn tính cách hệ thống)._

### Phụ lục 2: Phiếu xác nhận chất lượng đánh giá người dùng
_(Bản in ảnh các kết quả và biểu đồ thể hiện tín nhiệm và phản ánh ghi danh bằng phiếu bình thuận đánh giá trong kì làm thử mẫu ở trường học)._
