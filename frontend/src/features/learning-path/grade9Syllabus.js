/**
 * Tóm tắt — Mục tiêu — Mục lục (phần → chương → bài học) cho các môn Lớp 9.
 * Dùng ở trang Lộ trình học: phần tổng quan (summary/objectives/mục lục) và
 * trang Lộ trình chi tiết dạng gamification (Hero mục lớn + accordion chương).
 *
 * Cấu trúc mỗi môn:
 *   summary     — đoạn tóm tắt ngắn
 *   objectives  — mục tiêu đầu ra: { title, detail }
 *   bonusMeta   — chủ đề phần BONUS của môn: { label, emoji, xp }
 *   parts       — các "Mục lớn": { id, title, chapters }
 *     chapters  — { id, title, lessons?, bonus? }
 *       lessons — { title, subtitle? }  (tên rút gọn + phụ đề điều kiện/định lý)
 *       bonus   — thử thách nổi bật cuối chương: { title, subtitle? }
 *                 (mở khóa khi hoàn thành hết bài trong chương, thưởng nhiều XP)
 */
export const GRADE9_SYLLABUS = {
  math: {
    summary:
      "Toán 9 là năm bản lề chuẩn bị cho kỳ thi vào lớp 10, gồm hai mạch song song: Đại số (căn thức, hàm số, phương trình – hệ phương trình) rèn kỹ năng tính toán và biến đổi; Hình học (đường tròn, góc với đường tròn, hình không gian) rèn tư duy chứng minh chặt chẽ.",
    objectives: [
      {
        title: "Về kỹ năng tính toán",
        detail:
          "Đạt tốc độ xử lý nhanh và chính xác đối với các phép toán căn thức, biến đổi đại số, và giải phương trình/hệ phương trình.",
      },
      {
        title: "Về tư duy hình học",
        detail:
          "Phát triển năng lực chứng minh logic chặt chẽ, biết cách vẽ thêm đường phụ, kết nối các giả thiết từ câu trước để giải quyết câu sau của một bài toán hình tổng hợp.",
      },
    ],
    bonusMeta: { label: "Thực hành động", emoji: "🧩", xp: 30 },
    parts: [
      {
        id: "algebra",
        title: "I. Đại Số: Công Cụ Tính Toán Và Tư Duy Biến Đổi",
        chapters: [
          {
            id: "c1",
            title: "Chương 1: Căn Bậc Hai, Căn Bậc Ba",
            lessons: [
              { title: "Căn bậc hai số học", subtitle: "Điều kiện A ≥ 0" },
              { title: "Hằng đẳng thức", subtitle: "√(A²) = |A|" },
              { title: "Nhân các căn thức bậc hai" },
              { title: "Chia các căn thức bậc hai" },
              { title: "Đưa thừa số ra/vào dấu căn" },
              { title: "Khử mẫu và trục căn thức" },
              { title: "Rút gọn biểu thức tổng hợp" },
              { title: "Căn bậc ba và tính chất" },
            ],
            bonus: { title: "Trò chơi rút gọn căn thức", subtitle: "Kéo–thả biến đổi biểu thức về dạng gọn nhất" },
          },
          {
            id: "c2",
            title: "Chương 2: Hàm Số Bậc Nhất (y = ax + b)",
            lessons: [
              { title: "Khái niệm hàm số bậc nhất" },
              { title: "Tính đồng biến, nghịch biến", subtitle: "Xét theo hệ số a" },
              { title: "Đồ thị hàm số", subtitle: "y = ax + b" },
              { title: "Hệ số góc của đường thẳng" },
              { title: "Hai đường thẳng song song, cắt nhau" },
            ],
            bonus: { title: "Vẽ đồ thị động y = ax + b", subtitle: "Chỉnh hệ số a, b và quan sát đường thẳng thay đổi" },
          },
          {
            id: "c3",
            title: "Chương 3: Hệ Hai Phương Trình Bậc Nhất Hai Ẩn",
            lessons: [
              { title: "Phương trình bậc nhất hai ẩn" },
              { title: "Hệ phương trình bậc nhất hai ẩn" },
              { title: "Giải hệ bằng phương pháp thế" },
              { title: "Giải hệ bằng phương pháp cộng đại số" },
              { title: "Giải bài toán bằng cách lập hệ" },
            ],
            bonus: { title: "Giải hệ bằng đồ thị tương tác", subtitle: "Kéo hai đường thẳng, tìm giao điểm nghiệm" },
          },
          {
            id: "c4",
            title: "Chương 4: Hàm Số y = ax² — Phương Trình Bậc Hai Một Ẩn",
            lessons: [
              { title: "Hàm số y = ax²", subtitle: "với a ≠ 0" },
              { title: "Đồ thị hàm số y = ax²" },
              { title: "Phương trình bậc hai một ẩn" },
              { title: "Công thức nghiệm", subtitle: "Δ = b² − 4ac" },
              { title: "Hệ thức Vi-ét và ứng dụng" },
              { title: "Phương trình quy về bậc hai" },
            ],
            bonus: { title: "Khám phá parabol động", subtitle: "Thay đổi a, quan sát bề lõm và số nghiệm" },
          },
        ],
      },
      {
        id: "geometry",
        title: "II. Hình Học: Tư Duy Chứng Minh Và Không Gian",
        chapters: [
          {
            id: "g1",
            title: "Chương 1: Hệ Thức Lượng Trong Tam Giác Vuông",
            lessons: [
              { title: "Hệ thức về cạnh và đường cao" },
              { title: "Tỉ số lượng giác của góc nhọn" },
              { title: "Hệ thức về cạnh và góc" },
              { title: "Giải tam giác vuông", subtitle: "Ứng dụng thực tế" },
            ],
            bonus: { title: "Đo chiều cao cây bằng bóng nắng", subtitle: "Mô phỏng ứng dụng tỉ số lượng giác ngoài trời" },
          },
          {
            id: "g2",
            title: "Chương 2: Đường Tròn",
            lessons: [
              { title: "Sự xác định đường tròn" },
              { title: "Đường kính và dây của đường tròn" },
              { title: "Liên hệ giữa dây và khoảng cách đến tâm" },
              { title: "Vị trí tương đối của đường thẳng và đường tròn" },
              { title: "Tiếp tuyến của đường tròn" },
              { title: "Vị trí tương đối của hai đường tròn" },
            ],
            bonus: { title: "Xưởng dựng hình đường tròn", subtitle: "Kéo điểm để dựng tiếp tuyến, dây cung" },
          },
          {
            id: "g3",
            title: "Chương 3: Góc Với Đường Tròn",
            lessons: [
              { title: "Góc ở tâm — Số đo cung" },
              { title: "Góc nội tiếp" },
              { title: "Góc tạo bởi tia tiếp tuyến và dây" },
              { title: "Góc có đỉnh bên trong/ngoài đường tròn" },
              { title: "Tứ giác nội tiếp" },
              { title: "Độ dài đường tròn — Diện tích hình tròn" },
            ],
            bonus: { title: "Phòng thí nghiệm góc nội tiếp", subtitle: "Di chuyển điểm trên cung, kiểm chứng định lý" },
          },
          {
            id: "g4",
            title: "Chương 4: Hình Trụ — Hình Nón — Hình Cầu",
            lessons: [
              { title: "Hình trụ", subtitle: "Diện tích và thể tích" },
              { title: "Hình nón — Hình nón cụt" },
              { title: "Hình cầu", subtitle: "Diện tích và thể tích" },
            ],
            bonus: { title: "Thiết kế mô hình 3D & tính vật liệu", subtitle: "Sáng tạo sản phẩm từ hình trụ, nón, cầu" },
          },
        ],
      },
    ],
  },

  natural_science: {
    summary:
      "Khoa học Tự nhiên 9 tích hợp ba phân môn Vật lí – Hoá học – Sinh học quanh các mạch nội dung chung, giúp học sinh giải thích hiện tượng tự nhiên và vận dụng vào đời sống.",
    objectives: [
      { title: "Hiểu bản chất", detail: "Nắm vững khái niệm và định luật cốt lõi về chất, năng lượng và sự sống." },
      { title: "Vận dụng & thực nghiệm", detail: "Thiết kế, tiến hành thí nghiệm đơn giản, giải thích kết quả và liên hệ thực tiễn." },
    ],
    bonusMeta: { label: "Sáng tạo sản phẩm", emoji: "🔬", xp: 40 },
    parts: [
      {
        id: "khtn",
        title: "Mạch nội dung Khoa học Tự nhiên 9",
        chapters: [
          {
            id: "kt1",
            title: "Năng lượng và sự biến đổi (Vật lí)",
            bonus: { title: "Chế tạo mô hình phát điện mini", subtitle: "Sáng tạo sản phẩm từ nam châm và cuộn dây" },
          },
          { id: "kt2", title: "Chất và sự biến đổi của chất (Hoá học)" },
          { id: "kt3", title: "Vật sống — Di truyền và tiến hoá (Sinh học)" },
          { id: "kt4", title: "Trái Đất và bầu trời" },
        ],
      },
    ],
  },

  technology: {
    summary:
      "Công nghệ 9 tập trung định hướng nghề nghiệp và trải nghiệm một mô-đun nghề cụ thể, giúp học sinh làm quen kỹ năng kĩ thuật thực hành và lựa chọn hướng đi phù hợp.",
    objectives: [
      { title: "Định hướng nghề", detail: "Nhận biết các nhóm nghề trong lĩnh vực kĩ thuật – công nghệ và yêu cầu của chúng." },
      { title: "Kĩ năng thực hành", detail: "Thực hiện an toàn, đúng quy trình một số thao tác kĩ thuật cơ bản của mô-đun đã chọn." },
    ],
    bonusMeta: { label: "Dự án kĩ thuật", emoji: "🛠️", xp: 40 },
    parts: [
      {
        id: "tech",
        title: "Định hướng nghề nghiệp & Trải nghiệm nghề",
        chapters: [
          {
            id: "tc1",
            title: "Chương 1: Nghề nghiệp trong lĩnh vực kĩ thuật, công nghệ",
            bonus: { title: "Thiết kế sơ đồ mạng điện trong nhà", subtitle: "Dự án nhóm: bản vẽ và thuyết trình" },
          },
          { id: "tc2", title: "Chương 2: Lựa chọn nghề nghiệp" },
          { id: "tc3", title: "Mô-đun trải nghiệm nghề (Lắp mạng điện / Chế biến / Trồng trọt...)" },
        ],
      },
    ],
  },

  scratch: {
    summary:
      "Tin học 9 hoàn thiện các chủ đề nền tảng về ứng dụng tin học, tổ chức – khai thác thông tin số và hướng nghiệp, chuẩn bị năng lực số cho bậc THPT.",
    objectives: [
      { title: "Năng lực số", detail: "Sử dụng phần mềm và dịch vụ số hiệu quả, an toàn để phục vụ học tập." },
      { title: "Giải quyết vấn đề", detail: "Phân tích bài toán và dùng công cụ tin học để xử lý, trình bày kết quả." },
    ],
    bonusMeta: { label: "Thử thách lập trình", emoji: "💻", xp: 40 },
    parts: [
      {
        id: "ict",
        title: "Các chủ đề Tin học 9",
        chapters: [
          {
            id: "ic1",
            title: "Chủ đề A: Máy tính và cộng đồng",
            bonus: { title: "Lập trình một trò chơi nhỏ", subtitle: "Vận dụng thuật toán và tư duy máy tính" },
          },
          { id: "ic2", title: "Chủ đề C: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin" },
          { id: "ic3", title: "Chủ đề D: Đạo đức, pháp luật và văn hoá số" },
          { id: "ic4", title: "Chủ đề E: Ứng dụng tin học" },
          { id: "ic5", title: "Chủ đề F: Giải quyết vấn đề với máy tính" },
          { id: "ic6", title: "Chủ đề G: Hướng nghiệp với tin học" },
        ],
      },
    ],
  },

  arts: {
    summary:
      "Nghệ thuật 9 gồm hai nội dung Mỹ thuật và Âm nhạc, phát triển cảm thụ thẩm mỹ, kỹ năng thực hành sáng tạo và hiểu biết văn hoá nghệ thuật.",
    objectives: [
      { title: "Cảm thụ thẩm mỹ", detail: "Phân tích, cảm nhận và đánh giá vẻ đẹp của tác phẩm mĩ thuật, âm nhạc." },
      { title: "Thực hành sáng tạo", detail: "Thể hiện ý tưởng qua sản phẩm mĩ thuật và hoạt động âm nhạc phù hợp lứa tuổi." },
    ],
    bonusMeta: { label: "Sáng tác nghệ thuật", emoji: "🎨", xp: 40 },
    parts: [
      {
        id: "arts",
        title: "Nội dung Nghệ thuật 9",
        chapters: [
          {
            id: "ar1",
            title: "Mỹ thuật: Mĩ thuật tạo hình và ứng dụng",
            bonus: { title: "Sáng tác poster chủ đề tự chọn", subtitle: "Kết hợp bố cục, màu sắc và thông điệp" },
          },
          { id: "ar2", title: "Âm nhạc: Hát, Nhạc cụ, Nghe nhạc, Thường thức" },
        ],
      },
    ],
  },
};

// Đếm tổng số bài học của một Mục lớn (part) — bỏ qua chương chưa có bài.
export function countPartLessons(part) {
  return (part.chapters || []).reduce((sum, chapter) => sum + (chapter.lessons?.length || 0), 0);
}
