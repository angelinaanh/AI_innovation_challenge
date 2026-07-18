/**
 * Nguồn dữ liệu chuẩn cho LỘ TRÌNH HỌC theo môn (Lớp 9).
 *
 * Đây là "template" thống nhất cho mọi môn — cùng shape với môn Toán:
 *   { name, summary, objectives[], bonusMeta{label,emoji,xp}, parts[] }
 *     parts    → { id, title, chapters[] }
 *       chapters → { id, title, lessons[], bonus? }
 *         lessons  → { title, subtitle? }
 *         bonus    → { title, subtitle? }   (thử thách thực hành/sáng tạo, thưởng lớn)
 *
 * Dùng để seed vào bảng public.learning_paths và làm fallback khi DB chưa seed.
 * Backend là nguồn sự thật; frontend lấy qua API /student/learning-path.
 */

const math = {
  name: "Toán học",
  summary:
    "Toán 9 là năm bản lề chuẩn bị cho kỳ thi vào lớp 10, gồm hai mạch song song: Đại số (căn thức, hàm số, phương trình – hệ phương trình) rèn kỹ năng tính toán và biến đổi; Hình học (đường tròn, góc với đường tròn, hình không gian) rèn tư duy chứng minh chặt chẽ.",
  objectives: [
    { title: "Về kỹ năng tính toán", detail: "Đạt tốc độ xử lý nhanh và chính xác đối với các phép toán căn thức, biến đổi đại số, và giải phương trình/hệ phương trình." },
    { title: "Về tư duy hình học", detail: "Phát triển năng lực chứng minh logic chặt chẽ, biết cách vẽ thêm đường phụ, kết nối các giả thiết từ câu trước để giải quyết câu sau của một bài toán hình tổng hợp." },
  ],
  bonusMeta: { label: "Thực hành động", emoji: "🧩", xp: 30 },
  parts: [
    {
      id: "algebra",
      title: "I. Đại Số: Công Cụ Tính Toán Và Tư Duy Biến Đổi",
      chapters: [
        {
          id: "c1", title: "Chương 1: Căn Bậc Hai, Căn Bậc Ba",
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
          id: "c2", title: "Chương 2: Hàm Số Bậc Nhất (y = ax + b)",
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
          id: "c3", title: "Chương 3: Hệ Hai Phương Trình Bậc Nhất Hai Ẩn",
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
          id: "c4", title: "Chương 4: Hàm Số y = ax² — Phương Trình Bậc Hai Một Ẩn",
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
          id: "g1", title: "Chương 1: Hệ Thức Lượng Trong Tam Giác Vuông",
          lessons: [
            { title: "Hệ thức về cạnh và đường cao" },
            { title: "Tỉ số lượng giác của góc nhọn" },
            { title: "Hệ thức về cạnh và góc" },
            { title: "Giải tam giác vuông", subtitle: "Ứng dụng thực tế" },
          ],
          bonus: { title: "Đo chiều cao cây bằng bóng nắng", subtitle: "Mô phỏng ứng dụng tỉ số lượng giác ngoài trời" },
        },
        {
          id: "g2", title: "Chương 2: Đường Tròn",
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
          id: "g3", title: "Chương 3: Góc Với Đường Tròn",
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
          id: "g4", title: "Chương 4: Hình Trụ — Hình Nón — Hình Cầu",
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
};

const naturalScience = {
  name: "Khoa học Tự nhiên",
  summary:
    "Khoa học Tự nhiên 9 tích hợp ba phân môn Vật lí – Hoá học – Sinh học, giúp học sinh giải thích hiện tượng tự nhiên, làm thí nghiệm và vận dụng vào đời sống, kết nối kiến thức liên môn.",
  objectives: [
    { title: "Hiểu bản chất", detail: "Nắm vững khái niệm và định luật cốt lõi về năng lượng, chất và sự sống." },
    { title: "Thực nghiệm & vận dụng", detail: "Thiết kế, tiến hành thí nghiệm an toàn, giải thích kết quả và liên hệ thực tiễn." },
  ],
  bonusMeta: { label: "Sáng tạo sản phẩm", emoji: "🔬", xp: 40 },
  parts: [
    {
      id: "physics-chem",
      title: "I. Vật Lí & Hoá Học: Năng Lượng Và Chất",
      chapters: [
        {
          id: "ns1", title: "Chương 1: Năng lượng điện và sự biến đổi (Vật lí)",
          lessons: [
            { title: "Điện trở — Định luật Ohm" },
            { title: "Đoạn mạch nối tiếp và song song" },
            { title: "Công và công suất điện" },
            { title: "Định luật Joule – Lenz" },
            { title: "Cảm ứng điện từ", subtitle: "Nguyên lí máy phát điện" },
          ],
          bonus: { title: "Chế tạo mô hình phát điện mini", subtitle: "Sáng tạo sản phẩm từ nam châm và cuộn dây" },
        },
        {
          id: "ns2", title: "Chương 2: Chất và sự biến đổi của chất (Hoá học)",
          lessons: [
            { title: "Kim loại — Dãy hoạt động hoá học" },
            { title: "Hợp kim và sự ăn mòn" },
            { title: "Phi kim tiêu biểu" },
            { title: "Sơ lược bảng tuần hoàn" },
            { title: "Mở đầu về hợp chất hữu cơ" },
          ],
          bonus: { title: "Thử nghiệm pin điện hoá từ vật liệu quen thuộc", subtitle: "Sáng tạo sản phẩm hoá học an toàn" },
        },
      ],
    },
    {
      id: "bio-earth",
      title: "II. Sinh Học & Trái Đất: Sự Sống Và Vũ Trụ",
      chapters: [
        {
          id: "ns3", title: "Chương 3: Di truyền và tiến hoá (Sinh học)",
          lessons: [
            { title: "Nhiễm sắc thể và phân bào" },
            { title: "ADN, gen và mã di truyền" },
            { title: "Quy luật di truyền Mendel" },
            { title: "Đột biến và ứng dụng" },
            { title: "Bằng chứng và cơ chế tiến hoá" },
          ],
          bonus: { title: "Mô hình ADN xoắn kép bằng vật liệu tái chế", subtitle: "Sáng tạo sản phẩm trực quan" },
        },
        {
          id: "ns4", title: "Chương 4: Trái Đất và bầu trời",
          lessons: [
            { title: "Hệ Mặt Trời" },
            { title: "Chuyển động nhìn thấy của Mặt Trời, Mặt Trăng" },
            { title: "Năng lượng tái tạo và môi trường" },
          ],
          bonus: { title: "Thiết kế mô hình thu năng lượng mặt trời", subtitle: "Sáng tạo sản phẩm xanh" },
        },
      ],
    },
  ],
};

const technology = {
  name: "Công nghệ",
  summary:
    "Công nghệ 9 định hướng nghề nghiệp trong lĩnh vực kĩ thuật – công nghệ và cho học sinh trải nghiệm một mô-đun nghề cụ thể, rèn kỹ năng thực hành an toàn và tư duy thiết kế.",
  objectives: [
    { title: "Định hướng nghề", detail: "Nhận biết các nhóm nghề kĩ thuật – công nghệ và phẩm chất, năng lực cần có." },
    { title: "Thực hành kĩ thuật", detail: "Thực hiện đúng quy trình, an toàn một số thao tác của mô-đun nghề đã chọn." },
  ],
  bonusMeta: { label: "Dự án kĩ thuật", emoji: "🛠️", xp: 40 },
  parts: [
    {
      id: "career",
      title: "I. Định Hướng Nghề Nghiệp",
      chapters: [
        {
          id: "tc1", title: "Chương 1: Nghề nghiệp trong lĩnh vực kĩ thuật, công nghệ",
          lessons: [
            { title: "Vai trò của kĩ thuật, công nghệ" },
            { title: "Các ngành nghề phổ biến" },
            { title: "Phẩm chất và năng lực cần có" },
            { title: "Thị trường lao động và xu hướng" },
          ],
          bonus: { title: "Khảo sát & thuyết trình một nghề em yêu thích", subtitle: "Dự án tìm hiểu nghề" },
        },
        {
          id: "tc2", title: "Chương 2: Lựa chọn nghề nghiệp",
          lessons: [
            { title: "Cơ sở lựa chọn nghề" },
            { title: "Quy trình ra quyết định nghề" },
            { title: "Lập kế hoạch nghề nghiệp cá nhân" },
          ],
          bonus: { title: "Xây dựng bản đồ nghề nghiệp của em", subtitle: "Dự án định hướng cá nhân" },
        },
      ],
    },
    {
      id: "module",
      title: "II. Trải Nghiệm Nghề: Lắp Đặt Mạng Điện Trong Nhà",
      chapters: [
        {
          id: "tc3", title: "Chương 3: Lắp đặt mạng điện trong nhà",
          lessons: [
            { title: "An toàn điện" },
            { title: "Thiết bị và vật liệu điện" },
            { title: "Sơ đồ nguyên lí và sơ đồ lắp đặt" },
            { title: "Lắp mạch bảng điện" },
            { title: "Kiểm tra và vận hành" },
          ],
          bonus: { title: "Thiết kế & lắp mô hình mạng điện phòng học", subtitle: "Dự án kĩ thuật nhóm" },
        },
      ],
    },
  ],
};

const informatics = {
  name: "Tin học",
  summary:
    "Tin học 9 hoàn thiện năng lực số: khai thác thông tin, ứng dụng phần mềm, giải quyết vấn đề bằng thuật toán và định hướng nghề, chuẩn bị hành trang cho bậc THPT.",
  objectives: [
    { title: "Năng lực số", detail: "Sử dụng phần mềm, dịch vụ số hiệu quả, an toàn và có đạo đức." },
    { title: "Tư duy giải quyết vấn đề", detail: "Phân tích bài toán, thiết kế thuật toán và lập trình để xử lý." },
  ],
  bonusMeta: { label: "Thử thách lập trình", emoji: "💻", xp: 40 },
  parts: [
    {
      id: "info-apps",
      title: "I. Thông Tin Số Và Ứng Dụng",
      chapters: [
        {
          id: "ic1", title: "Chủ đề A + C: Thông tin số và tổ chức dữ liệu",
          lessons: [
            { title: "Vai trò máy tính và Internet" },
            { title: "Tổ chức lưu trữ dữ liệu" },
            { title: "Tìm kiếm và đánh giá độ tin cậy thông tin" },
            { title: "Trao đổi, hợp tác trực tuyến an toàn" },
          ],
          bonus: { title: "Xây dựng kho tư liệu học tập số", subtitle: "Thử thách tổ chức & chia sẻ" },
        },
        {
          id: "ic2", title: "Chủ đề E: Ứng dụng tin học",
          lessons: [
            { title: "Bảng tính nâng cao", subtitle: "Hàm & biểu đồ" },
            { title: "Trình chiếu chuyên nghiệp" },
            { title: "Biên tập ảnh và đa phương tiện" },
          ],
          bonus: { title: "Thiết kế infographic từ dữ liệu thật", subtitle: "Thử thách sản phẩm số" },
        },
      ],
    },
    {
      id: "problem-solving",
      title: "II. Giải Quyết Vấn Đề & Hướng Nghiệp",
      chapters: [
        {
          id: "ic3", title: "Chủ đề F: Giải quyết vấn đề với máy tính",
          lessons: [
            { title: "Thuật toán và sơ đồ khối" },
            { title: "Cấu trúc tuần tự, rẽ nhánh, lặp" },
            { title: "Lập trình trực quan" },
            { title: "Kiểm thử và gỡ lỗi" },
          ],
          bonus: { title: "Lập trình một trò chơi nhỏ", subtitle: "Vận dụng thuật toán đã học" },
        },
        {
          id: "ic4", title: "Chủ đề D + G: Đạo đức số và hướng nghiệp",
          lessons: [
            { title: "Đạo đức, pháp luật và văn hoá số" },
            { title: "Bảo vệ dữ liệu cá nhân" },
            { title: "Nghề nghiệp trong lĩnh vực tin học" },
          ],
          bonus: { title: "Thiết kế áp phích 'Công dân số văn minh'", subtitle: "Thử thách sáng tạo số" },
        },
      ],
    },
  ],
};

const arts = {
  name: "Nghệ thuật",
  summary:
    "Nghệ thuật 9 gồm Mỹ thuật và Âm nhạc, phát triển cảm thụ thẩm mỹ, kỹ năng thực hành sáng tạo và hiểu biết văn hoá nghệ thuật, khuyến khích thể hiện cá tính.",
  objectives: [
    { title: "Cảm thụ thẩm mỹ", detail: "Phân tích, cảm nhận và đánh giá vẻ đẹp của tác phẩm mĩ thuật, âm nhạc." },
    { title: "Thực hành sáng tạo", detail: "Thể hiện ý tưởng qua sản phẩm mĩ thuật và hoạt động âm nhạc phù hợp lứa tuổi." },
  ],
  bonusMeta: { label: "Sáng tác nghệ thuật", emoji: "🎨", xp: 40 },
  parts: [
    {
      id: "fine-arts",
      title: "I. Mỹ Thuật",
      chapters: [
        {
          id: "ar1", title: "Chương 1: Mĩ thuật tạo hình",
          lessons: [
            { title: "Ngôn ngữ tạo hình" },
            { title: "Bố cục và màu sắc" },
            { title: "Vẽ theo mẫu và theo đề tài" },
            { title: "Nặn, tạo khối cơ bản" },
          ],
          bonus: { title: "Sáng tác tranh chủ đề tự chọn", subtitle: "Triển lãm mini của em" },
        },
        {
          id: "ar2", title: "Chương 2: Mĩ thuật ứng dụng",
          lessons: [
            { title: "Thiết kế đồ hoạ cơ bản" },
            { title: "Thiết kế sản phẩm/bao bì" },
            { title: "Trưng bày và thuyết trình" },
          ],
          bonus: { title: "Sáng tác poster chủ đề tự chọn", subtitle: "Kết hợp bố cục, màu sắc và thông điệp" },
        },
      ],
    },
    {
      id: "music",
      title: "II. Âm Nhạc",
      chapters: [
        {
          id: "ar3", title: "Chương 3: Hát và Nhạc cụ",
          lessons: [
            { title: "Kĩ thuật hát cơ bản" },
            { title: "Hát bè đơn giản" },
            { title: "Nhạc cụ tiết tấu và giai điệu" },
          ],
          bonus: { title: "Dàn dựng một tiết mục nhóm", subtitle: "Sáng tác & biểu diễn" },
        },
        {
          id: "ar4", title: "Chương 4: Đọc nhạc và Thường thức",
          lessons: [
            { title: "Đọc nhạc và lí thuyết âm nhạc" },
            { title: "Nghe và cảm thụ âm nhạc" },
            { title: "Âm nhạc trong đời sống" },
          ],
          bonus: { title: "Sáng tác một đoạn nhạc ngắn", subtitle: "Thể hiện cá tính âm nhạc" },
        },
      ],
    },
  ],
};

// Bản đồ theo grade -> subject_key -> syllabus. Hiện có Lớp 9; mở rộng lớp khác
// bằng cách thêm khoá tương ứng.
export const SYLLABUS_BY_GRADE = {
  9: {
    math,
    natural_science: naturalScience,
    technology,
    scratch: informatics,
    arts,
  },
};

export function getSyllabus(grade, subjectKey) {
  return SYLLABUS_BY_GRADE[grade]?.[subjectKey] || null;
}

export function listSyllabusSubjectKeys(grade) {
  return Object.keys(SYLLABUS_BY_GRADE[grade] || {});
}

// Các hàng để seed vào public.learning_paths.
export function syllabusSeedRows() {
  const rows = [];
  for (const [grade, subjects] of Object.entries(SYLLABUS_BY_GRADE)) {
    for (const [subjectKey, data] of Object.entries(subjects)) {
      rows.push({ grade: Number(grade), subject_key: subjectKey, data });
    }
  }
  return rows;
}
