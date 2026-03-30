export type StorylineNode = {
  id: string;
  text: string;
  tag: string;
  tagColor: 'tertiary' | 'primary' | 'slate';
  detail: string;
};

export type Storyline = {
  id: string;
  title: string;
  work: string;
  author: string;
  timeAgo: string;
  rootText: string;
  branchPoint: string;
  nodes: StorylineNode[];
};

export const STORYLINES: Storyline[] = [
  {
    id: 'lao-hac-khong-ban',
    title: 'Lão Hạc — Nếu không bán cậu Vàng',
    work: 'Lão Hạc',
    author: 'Nam Cao',
    timeAgo: 'Hôm qua',
    rootText: 'Lão Hạc bán cậu Vàng → dằn vặt → tự tử bằng bả chó',
    branchPoint: 'Lão Hạc KHÔNG bán cậu Vàng',
    nodes: [
      { id: 'n1', text: 'Lão Hạc giữ cậu Vàng, cả hai chết đói dần vì kiệt quệ — bi kịch vẫn không tránh khỏi', tag: 'Bi kịch', tagColor: 'tertiary', detail: 'Trong nhánh này, Lão Hạc quyết giữ cậu Vàng vì lời hứa với con. Nhưng nạn đói tàn khốc vẫn cướp đi mạng sống của cả hai. Cái chết chậm rãi, đau đớn hơn — nhưng lão giữ được lương tâm trong sạch.' },
      { id: 'n2', text: 'Con trai bất ngờ trở về với số bạc lớn, cha con đoàn tụ trong nước mắt', tag: 'Kết có hậu', tagColor: 'primary', detail: 'Người con trai trở về từ đồn điền cao su với số tiền dành dụm. Lão Hạc khóc ngất khi thấy con. Cậu Vàng mừng rỡ quấn quýt. Gia đình ba nhân khẩu ấm áp trở lại.' },
      { id: 'n3', text: 'Gia đình đoàn tụ nhưng vẫn đối mặt sưu thuế nặng nề — bi kịch chưa kết thúc', tag: 'Kết mở', tagColor: 'slate', detail: 'Con trai về, mảnh vườn vẫn còn. Nhưng sưu thuế đè nặng. Liệu gia đình có trụ vững? Câu trả lời để ngỏ — phản ánh thực trạng xã hội Việt Nam trước 1945.' },
    ],
  },
  {
    id: 'tat-den-co-tien',
    title: 'Tắt đèn — Chị Dậu có tiền sưu',
    work: 'Tắt đèn',
    author: 'Ngô Tất Tố',
    timeAgo: '3 ngày trước',
    rootText: 'Chị Dậu bán con, bán chó → nộp sưu → bị hành hạ',
    branchPoint: 'Chị Dậu kiếm được tiền từ phiên chợ',
    nodes: [
      { id: 'n1', text: 'Chị Dậu giữ được con, gia đình cùng nhau vượt qua mùa sưu tàn khốc', tag: 'Kết có hậu', tagColor: 'primary', detail: 'Nhờ bán được vựa khoai, Chị Dậu nộp đủ sưu. Cái Tí không bị bán, gia đình đoàn tụ dưới mái nhà rách nát nhưng ấm áp tình thương.' },
      { id: 'n2', text: 'Tiền không đủ, Chị Dậu đứng lên đối đầu tên cai lệ ngay tại nhà mình', tag: 'Phản kháng', tagColor: 'tertiary', detail: 'Chị Dậu phản kháng — không phải vì sức mạnh, mà vì tình mẫu tử. Cú tát vào mặt cai lệ là tiếng nói của cả tầng lớp bị áp bức.' },
    ],
  },
  {
    id: 'truyen-kieu-khong-ban',
    title: 'Truyện Kiều — Kiều không bán mình',
    work: 'Truyện Kiều',
    author: 'Nguyễn Du',
    timeAgo: '1 tuần trước',
    rootText: 'Kiều bán mình chuộc cha → 15 năm lưu lạc → đoàn tụ Kim Trọng',
    branchPoint: 'Thuý Vân đứng ra thay Kiều chuộc cha',
    nodes: [
      { id: 'n1', text: 'Kiều ở với Kim Trọng, Thuý Vân chịu kiếp lưu lạc thay chị', tag: 'Đảo vai', tagColor: 'primary', detail: 'Vân thay Kiều gánh chịu số phận. Kim Trọng được Kiều nhưng mang nỗi day dứt vì Vân. Bi kịch vẫn tồn tại — chỉ đổi chủ nhân.' },
    ],
  },
];
