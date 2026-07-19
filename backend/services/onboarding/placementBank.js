// Ngân hàng câu hỏi placement DETERMINISTIC theo blueprint 3 cấp (fallback khi AI
// không khả dụng). Mỗi cấp có ma trận riêng, 4 trụ cột (Toán·Logic, Ngữ văn, Khoa
// học, Tiếng Anh) và 3 loại câu (mcq / fill_blank / open).
//
// Ánh xạ trục STEAM theo DẠNG TƯ DUY (không theo môn):
//   Toán số học/tiền/%/phân số/đại số/xác suất -> M
//   Quy luật/dãy số/logic (tư duy thuật toán)   -> T
//   Hình học/đo lường/thể tích/đọc dữ liệu       -> E
//   Ngữ văn + Tiếng Anh (ngôn ngữ)               -> A
//   Khoa học tự nhiên/đời sống                    -> S
// (Theo quyết định sản phẩm: giữ radar 5 trục, Tiếng Anh gộp vào trục A.)
//
// Câu open KHÔNG tự chấm (chuyển giáo viên); chỉ mcq + fill_blank tính điểm.

const DIFF_BY_LEVEL = { recognition: "easy", comprehension: "medium", application: "hard" };

function mcq(axis, pillar, level, body, options, answerIndex, explanation) {
  return {
    steam_axis: axis,
    pillar,
    type: "mcq",
    cognitive_level: level,
    difficulty: DIFF_BY_LEVEL[level],
    body,
    options,
    answer_index: answerIndex,
    accepted_answers: null,
    explanation,
  };
}

function fill(axis, pillar, level, body, accepted, explanation) {
  return {
    steam_axis: axis,
    pillar,
    type: "fill_blank",
    cognitive_level: level,
    difficulty: DIFF_BY_LEVEL[level],
    body,
    options: null,
    answer_index: null,
    accepted_answers: accepted,
    explanation,
  };
}

function open(axis, pillar, body, guidance) {
  return {
    steam_axis: axis,
    pillar,
    type: "open",
    cognitive_level: "application",
    difficulty: "hard",
    body,
    options: null,
    answer_index: null,
    accepted_answers: null,
    explanation: guidance,
  };
}

function interactive(axis, pillar, body, url, options, answerIndex, explanation) {
  return {
    steam_axis: axis,
    pillar,
    type: "interactive_visual",
    cognitive_level: "application",
    difficulty: "medium",
    body,
    options: options,
    answer_index: answerIndex,
    accepted_answers: null,
    explanation,
    image_url: url,
  };
}

function trueFalseCluster(axis, pillar, level, body, clauses, answers, explanation) {
  return {
    steam_axis: axis,
    pillar,
    type: "true_false_cluster",
    cognitive_level: level,
    difficulty: DIFF_BY_LEVEL[level],
    body,
    options: clauses, // stored in options
    accepted_answers: answers, // boolean array
    answer_index: null,
    explanation,
  };
}

// Đặt đáp án đúng vào một vị trí xác định trong 4 lựa chọn số.
function numericOptions(correct, distractors, slot) {
  const unique = [];
  for (const value of [correct, ...distractors]) {
    if (!unique.includes(value)) unique.push(value);
  }
  let pad = 1;
  while (unique.length < 4) {
    const candidate = correct + pad;
    if (!unique.includes(candidate)) unique.push(candidate);
    pad += 1;
  }
  const others = unique.filter((value) => value !== correct).slice(0, 3);
  const options = [...others];
  const answerIndex = slot % 4;
  options.splice(answerIndex, 0, correct);
  return { options: options.slice(0, 4).map(String), answerIndex };
}

// ---------------------------------------------------------------------------
// Generator Toán (đúng theo cấu tạo) — bổ sung cho câu Toán khi bank curated
// chưa đủ số theo ma trận. axis M/T/E theo dạng tư duy.
// ---------------------------------------------------------------------------
function genPercent(grade, slot) {
  const price = 100000 + grade * 20000 + slot * 10000;
  const percent = [10, 15, 20, 25][slot % 4];
  const discount = (price * percent) / 100;
  const answer = price - discount;
  const { options, answerIndex } = numericOptions(answer, [discount, answer + 10000, answer - 10000], slot);
  return mcq("M", "math", "comprehension",
    `Một món hàng giá ${price} đồng được giảm ${percent}%. Giá sau khi giảm là bao nhiêu (đồng)?`,
    options, answerIndex, `Giảm ${percent}% của ${price} là ${discount}, còn lại ${answer} đồng.`);
}

function genLinearEq(grade, slot) {
  const x = 3 + slot;
  const a = 2 + (slot % 4);
  const b = 5 + slot * 2;
  const c = a * x - b;
  const { options, answerIndex } = numericOptions(x, [x + 1, x - 1, x + 2], slot);
  return mcq("M", "math", "comprehension",
    `Tìm x, biết ${a}x − ${b} = ${c}.`,
    options.map((v) => `x = ${v}`), answerIndex, `${a}x = ${c + b} nên x = ${x}.`);
}

function genArea(grade, slot) {
  const length = 4 + slot;
  const width = 3 + (slot % 3);
  const count = length * width * 4; // gạch cạnh 0,5m
  const { options, answerIndex } = numericOptions(count, [count / 2, count + 12, count - 8], slot);
  return mcq("E", "math", "application",
    `Một nền phòng hình chữ nhật dài ${length}m, rộng ${width}m được lát kín bằng gạch vuông cạnh 0,5m. Cần bao nhiêu viên gạch?`,
    options, answerIndex, `Diện tích ${length * width}m², mỗi viên 0,25m² nên cần ${count} viên.`);
}

function genPerimeter(grade, slot) {
  const length = 6 + slot;
  const width = 3 + (slot % 4);
  const answer = 2 * (length + width);
  const { options, answerIndex } = numericOptions(answer, [length + width, length * width, answer + 4], slot);
  return mcq("E", "math", "comprehension",
    `Mảnh vườn hình chữ nhật dài ${length}m, rộng ${width}m. Chu vi mảnh vườn là bao nhiêu mét?`,
    options, answerIndex, `Chu vi = 2 × (${length} + ${width}) = ${answer}m.`);
}

function genVolume(grade, slot) {
  const base = 12 + slot * 3;
  const height = 5 + slot;
  const answer = (base * height) / 3;
  const { options, answerIndex } = numericOptions(answer, [base * height, answer * 2, answer + 8], slot);
  return mcq("E", "math", "application",
    `Khối chóp có diện tích đáy ${base}cm² và chiều cao ${height}cm. Thể tích khối chóp là bao nhiêu cm³?`,
    options, answerIndex, `V = (${base} × ${height}) / 3 = ${answer}cm³.`);
}

function genPattern(grade, slot) {
  const start = 2 + grade % 5 + slot;
  const step = 2 + (slot % 3);
  const seq = [start, start + step, start + 2 * step, start + 3 * step];
  const answer = start + 4 * step;
  const { options, answerIndex } = numericOptions(answer, [answer + step, answer - step, answer + 1], slot);
  return mcq("T", "math", "comprehension",
    `Số tiếp theo trong dãy ${seq.join(", ")}, ... là số nào?`,
    options, answerIndex, `Dãy cộng thêm ${step}, số tiếp theo là ${answer}.`);
}

function genSequenceFill(grade, slot) {
  const start = 2 + slot;
  const ratio = 2;
  const seq = [start, start * ratio, start * ratio * ratio];
  const answer = start * ratio * ratio * ratio;
  return fill("T", "math", "application",
    `Điền số còn thiếu để hoàn thành dãy: ${seq.join(", ")}, ...`,
    [String(answer)], `Mỗi số gấp đôi số trước, nên số tiếp theo là ${answer}.`);
}

// Danh sách generator Toán bổ sung theo cấp (đã trừ các câu curated bên dưới).
function extraMath(grade, band) {
  if (band === "primary") return [];
  if (band === "secondary") {
    return [
      genPercent(grade, 0), genLinearEq(grade, 1),
      genArea(grade, 0), genPerimeter(grade, 1),
      genPattern(grade, 0), genSequenceFill(grade, 1),
    ];
  }
  // high_school
  return [
    genPercent(grade, 2), genLinearEq(grade, 3),
    genVolume(grade, 0), genArea(grade, 2),
    genPattern(grade, 2), genSequenceFill(grade, 3),
  ];
}

// ---------------------------------------------------------------------------
// CẤP K-2 — Mầm non đến Lớp 2: 15 câu interactive_visual
// ---------------------------------------------------------------------------
const KINDERGARTEN = [
  interactive("S", "science", "Thử thách Màu sắc: Dùng đèn pin kéo màu Đỏ pha với Xanh lá. Màu mới tạo ra ở giữa là màu gì?", "/phet/color-vision.html", ["😃 Màu Vàng", "😃 Màu Trắng", "😃 Màu Xanh dương"], 0, "Đỏ pha Xanh lá tạo ra Vàng."),
  interactive("M", "math", "Thử thách Xây dựng: Xếp 4 khối hình vuông (1x1) cạnh nhau tạo thành một hình lớn. Hình đó lớn bằng bao nhiêu khối?", "/phet/area-builder.html", ["😃 Bằng 2 khối", "😃 Bằng 4 khối", "😃 Bằng 8 khối"], 1, "Dùng 4 khối xếp thành hình vuông 2x2 thì diện tích là 4."),
  interactive("E", "physics", "Cân bằng: Đặt một bình chữa cháy (5kg) ở giữa bập bênh. Đặt thêm thùng rác (10kg) lên, bập bênh sẽ thế nào?", "/phet/balancing-act.html", ["😃 Bập bênh bay lên cao", "😃 Bập bênh bị nghiêng xuống", "😃 Bập bênh vẫn đứng yên"], 1, "Khối lượng nặng hơn sẽ làm bập bênh bị nghiêng."),
  interactive("M", "math", "Phân số: Kéo hình nửa cái bánh đặt vào cột có ghi 1/2. Hình 1/2 trông giống gì nhất?", "/phet/fraction-matcher.html", ["😃 Một nửa hình tròn", "😃 Một hình tròn nguyên", "😃 Hai hình tròn"], 0, "1/2 đại diện cho một nửa cái bánh."),
  interactive("M", "math", "Tạo số 10: Lấy thanh 6 ô ghép với thanh mấy ô để được 10 ô?", "/phet/make-a-ten.html", ["😃 Thanh 2 ô", "😃 Thanh 4 ô", "😃 Thanh 5 ô"], 1, "6 cộng 4 bằng 10."),
  interactive("S", "physics", "Trượt băng: Nếu bạn kéo cậu bé lên điểm cao nhất của máng trượt rồi thả ra, cậu bé sẽ trượt thế nào?", "/phet/energy-skate-park-basics.html", ["😃 Trượt cực kỳ chậm", "😃 Trượt rất nhanh", "😃 Đứng yên không trượt"], 1, "Độ cao càng lớn, năng lượng tiềm năng càng lớn giúp trượt nhanh."),
  interactive("S", "physics", "Kéo co: Cho 2 người đỏ kéo và 1 người xanh kéo. Ai sẽ thắng?", "/phet/forces-and-motion-basics.html", ["😃 Đội Đỏ thắng", "😃 Đội Xanh thắng", "😃 Hòa nhau"], 0, "Đội có tổng lực kéo lớn hơn (đội đỏ đông hơn) sẽ thắng."),
  interactive("S", "physics", "Trái Đất và Mặt Trời: Nếu bạn tắt lực hấp dẫn (bấm nút Off), Trái Đất sẽ đi đâu?", "/phet/gravity-and-orbits.html", ["😃 Rơi thẳng vào Mặt Trời", "😃 Tiếp tục quay vòng tròn", "😃 Bay tuột ra ngoài không gian"], 2, "Nếu không có lực hấp dẫn, Trái Đất sẽ văng khỏi quỹ đạo bay vào vũ trụ."),
  interactive("M", "math", "Trò chơi Đếm số: Chọn màn chơi hình cái cây, treo 3 quả táo lên cành. Trên màn hình sẽ hiện số mấy?", "/phet/number-play.html", ["😃 Số 1", "😃 Số 3", "😃 Số 5"], 1, "Treo 3 quả táo thì màn hình sẽ hiện số 3."),
  interactive("S", "science", "Trạng thái vật chất: Kéo vòi đun nóng (Heat) khối đá lạnh. Hiện tượng gì xảy ra?", "/phet/states-of-matter-basics.html", ["😃 Khối đá đóng cứng hơn", "😃 Đá tan chảy và bay hơi", "😃 Khối đá đổi màu"], 1, "Nhiệt độ cao làm chất rắn tan chảy và hóa hơi."),
  interactive("T", "logic", "Tĩnh điện: Cọ xát quả bóng bay thật mạnh vào áo len rồi thả ra gần áo. Quả bóng bay đi đâu?", "/phet/balloons-and-static-electricity.html", ["😃 Rơi xuống đất", "😃 Bay vút lên trời", "😃 Bị hút dính vào áo len"], 2, "Quả bóng hút điện tích âm nên bị hút dính vào áo len."),
  interactive("S", "physics", "Ma sát: Trượt hai cuốn sách chà xát thật mạnh vào nhau, nhiệt độ (Nhiệt kế) sẽ ra sao?", "/phet/friction.html", ["😃 Tăng lên rất nóng", "😃 Lạnh cóng đi", "😃 Đứng yên"], 0, "Ma sát sinh ra nhiều nhiệt độ cao."),
  interactive("T", "logic", "Ánh sáng: Bật đèn pin chiếu chéo xuống mặt nước. Tia sáng có đi thẳng băng không?", "/phet/bending-light.html", ["😃 Có, đi thẳng băng", "😃 Không, bị gập khúc", "😃 Không, biến mất luôn"], 1, "Ánh sáng bị gập ghềnh (khúc xạ) khi truyền qua nước."),
  interactive("E", "engineering", "Mạch điện: Dùng dây điện nối nối hai đầu viên pin lại với bóng đèn. Đèn sẽ như thế nào?", "/phet/circuit-construction-kit-dc-virtual-lab.html", ["😃 Bóng đèn phát sáng", "😃 Bóng đèn nổ tung", "😃 Pin đổi màu đỏ"], 0, "Tạo mạch khép kín sẽ làm đèn sáng."),
  interactive("S", "science", "Tỉ trọng: Thả khối gỗ và khối sắt xuống hồ nước. Bạn thấy gì?", "/phet/density.html", ["😃 Gỗ nổi lên, Sắt chìm xuống", "😃 Gỗ và Sắt cùng chìm", "😃 Sắt nổi lên trên"], 0, "Gỗ nhẹ hơn nước nên nổi, khối sắt nặng nên chìm."),
  interactive("S", "science", "Dòng điện tĩnh: Chà xát chân John xuống thảm rồi đưa tay anh ấy gần tay nắm cửa. Chuyện gì xảy ra?", "/phet/john-travoltage.html", ["😃 Anh ấy bị giật điện", "😃 Tay nắm cửa bị rơi", "😃 Anh ấy lớn lên"], 0, "Điện tích truyền từ thảm tích tụ lại và gây giật điện nhẹ (phóng điện)."),
  interactive("M", "math", "So sánh lớn bé: Mở mục So sánh. Kéo 5 quả táo vào đĩa bên trái, và 2 quả táo vào đĩa bên phải. Con Cáo sẽ há miệng về bên nào?", "/phet/number-compare.html", ["😃 Há về bên trái (5 quả)", "😃 Há về bên phải (2 quả)", "😃 Không há miệng"], 0, "5 lớn hơn 2, nên dấu lớn hơn (Cáo há miệng) hướng về số 5."),
  interactive("M", "math", "Phân số căn bản: Mở màn đầu tiên. Tô màu 1 nửa hình tròn. Phân số bên cạnh sẽ hiển thị con số nào?", "/phet/fractions-intro.html", ["😃 1/2", "😃 1/3", "😃 1/4"], 0, "Tô một nửa nghĩa là 1 phần của 2 phần (1/2)."),
  interactive("M", "math", "Xây dựng phân số: Để tạo phân số 3/4, bạn phải nhặt bao nhiêu miếng bánh đặt vào vòng tròn?", "/phet/build-a-fraction.html", ["😃 Lấy 1 miếng", "😃 Lấy 3 miếng", "😃 Lấy 4 miếng"], 1, "Mẫu số là 4 miếng, lấy 3 miếng sẽ được phân số 3/4."),
  interactive("S", "physics", "Lò xo: Móc khối tạ 250g vào cái lò xo. Lò xo sẽ phản ứng ra sao?", "/phet/masses-and-springs-basics.html", ["😃 Bị giãn dài ra", "😃 Bị co ngắn lại", "😃 Đứt làm đôi"], 0, "Khối lượng nặng sẽ kéo lò xo giãn thẳng ra."),
];

// ---------------------------------------------------------------------------
// CẤP 3-5 — Tiểu học (lớp 3-5): 20 câu, 45'. M8 / Ngữ văn6 / Khoa học3 / Anh3.
// ---------------------------------------------------------------------------
const PRIMARY = [
  // A. Toán & Logic (8) -> M/T/E theo dạng
  mcq("M", "math", "comprehension", "Mẹ cho An 50.000 đồng đi siêu thị. An mua hộp sữa 25.000 đồng và gói bánh 15.000 đồng. An còn lại bao nhiêu tiền?", ["15.000 đồng", "10.000 đồng", "5.000 đồng", "20.000 đồng"], 1, "50.000 − 25.000 − 15.000 = 10.000 đồng."),
  mcq("M", "math", "comprehension", "Đồng hồ đang chỉ 7 giờ 15 phút. 45 phút nữa trường đánh trống vào lớp. Trường đánh trống lúc mấy giờ?", ["7 giờ 45 phút", "8 giờ 00 phút", "8 giờ 15 phút", "8 giờ 30 phút"], 1, "7h15 + 45 phút = 8h00."),
  mcq("T", "math", "comprehension", "Tìm hình tiếp theo trong quy luật: 🔴 🟦 🔺 🔴 🟦 🔺 🔴 🟦 ...", ["🔴 Tròn đỏ", "🟦 Vuông xanh", "🔺 Tam giác đỏ", "🟢 Tròn xanh"], 2, "Quy luật lặp 🔴🟦🔺, sau 🔴🟦 là 🔺."),
  mcq("E", "math", "comprehension", "Một khảo sát cho thấy 8 bạn thích Táo và 4 bạn thích Cam. Số bạn thích Táo gấp mấy lần số bạn thích Cam?", ["2 lần", "3 lần", "4 lần", "Một nửa"], 0, "8 : 4 = 2 lần."),
  mcq("E", "math", "comprehension", "Mảnh vườn hình chữ nhật dài 10m, rộng 5m. Bố xây hàng rào xung quanh. Chiều dài hàng rào là bao nhiêu mét?", ["15m", "30m", "50m", "20m"], 1, "Chu vi = 2 × (10 + 5) = 30m."),
  mcq("M", "math", "application", "Trong rổ có 24 quả trứng. Nếu 1/3 số trứng bị vỡ, còn lại bao nhiêu quả trứng nguyên vẹn?", ["8 quả", "12 quả", "16 quả", "18 quả"], 2, "1/3 của 24 là 8 quả vỡ, còn 16 quả."),
  open("M", "math", "Bếp có 5 cái pizza, mỗi cái cắt 4 miếng. Có 18 bạn, mỗi bạn ăn 1 miếng. Số bánh có đủ chia không? Vì sao?", "Có 5 × 4 = 20 miếng, nhiều hơn 18 bạn nên đủ (dư 2 miếng)."),
  fill("T", "math", "application", "Điền số thích hợp để hoàn thành dãy: 2, 4, 8, 14, 22, ...", ["32"], "Khoảng cách tăng 2, 4, 6, 8, 10 nên số tiếp theo là 22 + 10 = 32."),
  // B. Ngữ văn & Đọc hiểu (6) -> A. Đoạn văn dùng chung.
  mcq("A", "language", "comprehension", "Đọc: \"Khu vườn của ông nội giống như một chiếc hộp ma thuật. Buổi sáng, những nụ hoa hồng còn cuộn tròn e ấp. Đến trưa, dưới ánh nắng ấm áp, chúng bung nở đỏ rực. Góc vườn, đàn ong mật vo ve chăm chỉ bay từ bông hoa này sang bông hoa khác.\" — Đoạn văn chủ yếu miêu tả điều gì?", ["Sự thay đổi của khu vườn từ sáng đến chiều", "Cách ong mật đi tìm mồi", "Cách trồng hoa hồng của ông nội", "Chiếc hộp ma thuật chứa đồ chơi"], 0, "Đoạn văn tả khu vườn biến đổi theo thời gian trong ngày."),
  mcq("A", "language", "comprehension", "Trong câu \"Đến trưa, dưới ánh nắng ấm áp, chúng bung nở đỏ rực\", từ \"chúng\" thay thế cho từ nào?", ["Ánh nắng", "Đàn ong mật", "Nụ hoa hồng", "Chiếc hộp"], 2, "\"Chúng\" chỉ những nụ hoa hồng."),
  mcq("A", "language", "recognition", "Từ nào sau đây là từ chỉ hoạt động?", ["Khu vườn", "Chăm chỉ", "Bay", "Ấm áp"], 2, "\"Bay\" chỉ hoạt động."),
  mcq("A", "language", "comprehension", "Từ nào đồng nghĩa với từ \"chăm chỉ\"?", ["Lười biếng", "Siêng năng", "Nhanh nhẹn", "Rực rỡ"], 1, "\"Chăm chỉ\" đồng nghĩa \"siêng năng\"."),
  mcq("A", "language", "comprehension", "Ghép hai nửa câu cho đúng: (1) Trời mưa to... (2) Vì thức khuya... với a) ...nên Nam đi học muộn. b) ...nên đường phố ngập nước.", ["1-b, 2-a", "1-a, 2-b"], 0, "Mưa to → ngập nước (b); thức khuya → đi học muộn (a)."),
  open("A", "language", "Nếu em có một khu vườn, em muốn trồng cây gì nhất? Hãy viết 1-2 câu giải thích lý do.", "Đánh giá khả năng diễn đạt cảm xúc và lý do của học sinh."),
  // C. Khoa học & Đời sống (3) -> S
  mcq("S", "science", "comprehension", "Điều gì xảy ra nếu đặt một viên đá lạnh ra ngoài trời nắng mùa hè?", ["Viên đá to lên", "Viên đá tan thành nước rồi bốc hơi", "Viên đá biến thành sương mù", "Viên đá chuyển màu trắng"], 1, "Đá tan thành nước rồi bay hơi dưới nắng."),
  mcq("S", "science", "recognition", "Động vật nào dưới đây đẻ trứng?", ["Mèo", "Chó", "Gà", "Bò"], 2, "Gà đẻ trứng."),
  mcq("S", "science", "comprehension", "Để bảo vệ răng miệng chắc khỏe, hành động nào sau đây là KHÔNG đúng?", ["Đánh răng 2 lần mỗi ngày", "Ăn nhiều kẹo ngọt vào buổi tối", "Thay bàn chải định kỳ", "Hạn chế uống nước có gas"], 1, "Ăn nhiều kẹo ngọt buổi tối có hại cho răng."),
  // D. Tiếng Anh (3) -> A
  mcq("A", "english", "recognition", "Choose the correct English word for a red apple (quả táo):", ["Banana", "Apple", "Orange", "Grape"], 1, "Quả táo là \"apple\"."),
  mcq("A", "english", "recognition", "Choose the correct answer: \"I ______ a student.\"", ["am", "is", "are", "be"], 0, "Với \"I\" dùng \"am\"."),
  fill("A", "english", "comprehension", "Sắp xếp các từ sau thành một câu tiếng Anh hoàn chỉnh: name / is / My / Peter.", ["my name is peter"], "Câu đúng: \"My name is Peter\"."),
];

// ---------------------------------------------------------------------------
// CẤP 2 — THCS (lớp 6-9): 25 câu, 60'. M10 / Ngữ văn5 / Khoa học5 / Anh5.
// ---------------------------------------------------------------------------
const SECONDARY_CURATED_MATH = [
  mcq("M", "math", "comprehension", "Một cửa hàng giảm giá 20% cho tất cả mặt hàng. Chiếc cặp giá gốc 250.000 đồng. Sau khi giảm, chiếc cặp giá bao nhiêu?", ["50.000 đồng", "200.000 đồng", "230.000 đồng", "150.000 đồng"], 1, "Giảm 20% của 250.000 là 50.000, còn 200.000 đồng."),
  mcq("M", "math", "comprehension", "Tìm x, biết: 3x − 7 = 14.", ["x = 5", "x = 7", "x = 21", "x = 4"], 1, "3x = 21 nên x = 7."),
  mcq("E", "math", "application", "Phòng hình chữ nhật dài 6m, rộng 4m, lát kín bằng gạch vuông cạnh 0,5m. Cần bao nhiêu viên gạch?", ["48 viên", "96 viên", "24 viên", "120 viên"], 1, "Diện tích 24m², mỗi viên 0,25m² nên cần 96 viên."),
  open("T", "math", "Trong một cuộc đua, bạn vừa vượt qua người đang xếp thứ hai. Hiện tại bạn xếp thứ mấy? Giải thích ngắn gọn.", "Đáp án: thứ hai — vì bạn chiếm chỗ của người thứ hai, không phải thứ nhất."),
];
const SECONDARY_LANG = [
  mcq("A", "language", "comprehension", "Đọc: \"Lá bàng đang đỏ ngọn cây. / Sếu giang mang lạnh đang bay ngang trời.\" (Tố Hữu). Đoạn thơ tả khung cảnh mùa nào?", ["Mùa xuân", "Mùa hạ", "Mùa thu", "Mùa đông"], 3, "Lá bàng đỏ và cái lạnh gợi mùa đông."),
  mcq("A", "language", "comprehension", "Chỉ ra biện pháp tu từ nổi bật trong câu: \"Trăng nhòm khe cửa ngắm nhà thơ.\"", ["So sánh", "Nhân hóa", "Ẩn dụ", "Điệp ngữ"], 1, "Trăng \"nhòm\", \"ngắm\" như con người → nhân hóa."),
  open("A", "language", "Viết một đoạn văn ngắn (3-5 câu) nêu suy nghĩ của em về tầm quan trọng của việc đọc sách mỗi ngày.", "Đánh giá khả năng lập luận và diễn đạt của học sinh."),
  mcq("A", "language", "recognition", "Từ nào đồng nghĩa với từ \"dũng cảm\"?", ["Hèn nhát", "Gan dạ", "Lười biếng", "Vui vẻ"], 1, "\"Dũng cảm\" đồng nghĩa \"gan dạ\"."),
  mcq("A", "language", "comprehension", "Câu \"Ông mặt trời thức dậy sau rặng núi\" sử dụng biện pháp tu từ nào?", ["So sánh", "Nhân hóa", "Ẩn dụ", "Hoán dụ"], 1, "Mặt trời \"thức dậy\" như người → nhân hóa."),
];
const SECONDARY_SCIENCE = [
  mcq("S", "science", "comprehension", "Khi đun nước, ta thấy \"khói trắng\" bốc lên từ vòi ấm. \"Khói trắng\" đó thực chất là gì?", ["Hơi nước", "Khí Oxi", "Những hạt nước nhỏ li ti ngưng tụ lại", "Khí Cacbonic"], 2, "Hơi nước gặp không khí lạnh ngưng tụ thành hạt nước nhỏ."),
  mcq("S", "science", "comprehension", "Quá trình quang hợp của cây xanh hấp thụ khí gì và thải ra khí gì?", ["Hấp thụ Oxi, thải Cacbonic", "Hấp thụ Cacbonic, thải Oxi", "Hấp thụ Nitơ, thải Oxi", "Hấp thụ Cacbonic, thải Nitơ"], 1, "Quang hợp hấp thụ CO₂, thải O₂."),
  mcq("S", "science", "recognition", "Ở điều kiện thường, nước sôi ở nhiệt độ nào?", ["50°C", "100°C", "0°C", "200°C"], 1, "Nước sôi ở 100°C."),
  mcq("S", "science", "recognition", "Bộ phận nào của cây làm nhiệm vụ hút nước và muối khoáng?", ["Lá", "Rễ", "Hoa", "Quả"], 1, "Rễ hút nước và muối khoáng."),
  mcq("S", "science", "recognition", "Vật liệu nào dưới đây dẫn điện tốt?", ["Gỗ khô", "Nhựa", "Đồng", "Thủy tinh"], 2, "Đồng là kim loại dẫn điện tốt."),
];
const SECONDARY_ENGLISH = [
  mcq("A", "english", "application", "Choose the correct answer: \"My brother usually ______ football on weekends, but today he ______ basketball.\"", ["plays / is playing", "is playing / plays", "play / playing", "played / plays"], 0, "Thói quen dùng hiện tại đơn, việc đang xảy ra dùng hiện tại tiếp diễn."),
  fill("A", "english", "application", "Viết lại câu, bắt đầu bằng \"Because of\": \"Because the weather was bad, we stayed at home.\"", ["because of the bad weather, we stayed at home", "because of the bad weather we stayed at home"], "\"Because of the bad weather, we stayed at home.\""),
  mcq("A", "english", "recognition", "Choose the correct answer: \"Yesterday I ______ to school.\"", ["go", "went", "going", "gone"], 1, "Quá khứ của \"go\" là \"went\"."),
  mcq("A", "english", "recognition", "Từ \"book\" trong tiếng Anh nghĩa là gì?", ["Bút", "Sách", "Bàn", "Ghế"], 1, "\"Book\" nghĩa là sách."),
  fill("A", "english", "comprehension", "Sắp xếp thành câu hoàn chỉnh: she / a / teacher / is.", ["she is a teacher"], "Câu đúng: \"She is a teacher\"."),
];

// ---------------------------------------------------------------------------
// CẤP 3 — THPT (lớp 10-12): 30 câu, 90'. M10 / Ngữ văn7 / Khoa học7 / Anh6.
// ---------------------------------------------------------------------------
const HIGH_CURATED_MATH = [
  mcq("M", "math", "application", "Parabol y = x² − 4x + 3 cắt trục hoành tại các điểm có hoành độ là:", ["x = 1 và x = 3", "x = −1 và x = −3", "x = 1 và x = −3", "Không cắt trục hoành"], 0, "x² − 4x + 3 = 0 có nghiệm x = 1 và x = 3."),
  mcq("M", "math", "application", "Taxi tính phí: 12.000đ cho 1km đầu; từ km 2 đến km 20 là 10.000đ/km; từ km 21 trở đi là 8.000đ/km. Đi 25km trả bao nhiêu?", ["250.000 đồng", "242.000 đồng", "200.000 đồng", "230.000 đồng"], 1, "12.000 + 19×10.000 + 5×8.000 = 242.000 đồng."),
  mcq("E", "math", "application", "Tính thể tích khối chóp tứ giác đều có diện tích đáy 16cm² và chiều cao 6cm.", ["96cm³", "48cm³", "32cm³", "64cm³"], 2, "V = (16 × 6) / 3 = 32cm³."),
  open("M", "math", "Lớp 40 học sinh: 25 đăng ký CLB Tiếng Anh, 20 đăng ký CLB Kỹ năng sống, 10 đăng ký cả hai. Chọn ngẫu nhiên 1 học sinh, tính xác suất bạn đó không đăng ký CLB nào. Giải chi tiết.", "Số đăng ký ít nhất 1 CLB = 25 + 20 − 10 = 35; không CLB = 5; xác suất = 5/40 = 1/8."),
];
const HIGH_LANG = [
  mcq("A", "language", "application", "\"Kẻ mạnh không phải là kẻ giẫm lên vai kẻ khác để thỏa mãn lòng ích kỉ. Kẻ mạnh chính là kẻ giúp đỡ kẻ khác trên đôi vai của mình.\" (Nam Cao). Nhận định bàn về vấn đề gì?", ["Lòng dũng cảm", "Lòng nhân đạo, sự vị tha", "Sức mạnh thể chất", "Tham vọng của con người"], 1, "Câu nói đề cao lòng nhân đạo, sự sẻ chia."),
  open("A", "language", "Sự bùng nổ của Trí tuệ nhân tạo (AI) dấy lên lo ngại robot thay thế con người. Viết đoạn văn (khoảng 150 chữ) trình bày: học sinh cấp 3 cần trang bị kỹ năng gì để không bị đào thải trong kỷ nguyên số?", "Đánh giá tư duy phản biện, lập luận và quan điểm cá nhân."),
  mcq("A", "language", "comprehension", "Câu \"Thời gian là vàng bạc\" sử dụng biện pháp tu từ nào?", ["Ẩn dụ", "Nhân hóa", "Điệp ngữ", "Nói giảm"], 0, "Ví thời gian như vàng bạc → ẩn dụ."),
  trueFalseCluster("A", "language", "comprehension", "Đọc các nhận định sau về câu \"Trăng nhòm khe cửa ngắm nhà thơ\":", [
    "A. Biện pháp nghệ thuật nổi bật là nhân hóa.",
    "B. Từ \"nhòm\" và \"ngắm\" thể hiện hành động của con người.",
    "C. Câu thơ thuộc bài thơ \"Cảnh khuya\".",
    "D. Tác giả là Nguyễn Trãi."
  ], [true, true, false, false], "Câu thơ trong bài Ngắm trăng của Hồ Chí Minh, sử dụng nhân hóa."),
  mcq("A", "language", "recognition", "Từ nào trái nghĩa với \"lạc quan\"?", ["Vui vẻ", "Bi quan", "Hạnh phúc", "Tự tin"], 1, "Trái nghĩa với \"lạc quan\" là \"bi quan\"."),
];
const HIGH_SCIENCE = [
  mcq("S", "science", "application", "Tại sao khi ô tô phanh gấp, hành khách bị chúi người về phía trước?", ["Do lực ma sát", "Do quán tính", "Do lực đàn hồi của ghế", "Do trọng lực tăng lên"], 1, "Quán tính giữ người tiếp tục chuyển động về trước."),
  trueFalseCluster("S", "science", "application", "Nhận định về hiện tượng Trái Đất nóng lên (hiệu ứng nhà kính):", [
    "A. Nguyên nhân chính là do sự gia tăng khí CO2.",
    "B. Nó làm băng ở hai cực tan chảy.",
    "C. Trồng nhiều cây xanh sẽ làm tăng hiệu ứng nhà kính.",
    "D. Sử dụng năng lượng mặt trời giúp giảm hiệu ứng nhà kính."
  ], [true, true, false, true], "Cây xanh hấp thụ CO2 giúp giảm, không làm tăng. Năng lượng mặt trời sạch giúp giảm thiểu."),
  mcq("S", "science", "recognition", "Công thức hóa học của nước là gì?", ["CO₂", "H₂O", "O₂", "NaCl"], 1, "Nước là H₂O."),
  mcq("S", "science", "recognition", "Đơn vị đo lực trong hệ SI là gì?", ["Jun (J)", "Niutơn (N)", "Oát (W)", "Paxcan (Pa)"], 1, "Lực đo bằng Niutơn (N)."),
  mcq("S", "science", "comprehension", "Nguồn năng lượng nào sau đây là năng lượng tái tạo?", ["Than đá", "Dầu mỏ", "Năng lượng mặt trời", "Khí đốt tự nhiên"], 2, "Năng lượng mặt trời là năng lượng tái tạo."),
];
const HIGH_ENGLISH = [
  mcq("A", "english", "application", "Choose the best option: \"If they ______ earlier, they wouldn't have missed the flight.\"", ["leave", "left", "had left", "have left"], 2, "Câu điều kiện loại 3 dùng \"had left\"."),
  mcq("A", "english", "application", "Identify the mistake: \"Despite of the heavy rain, they decided to go hiking.\"", ["Despite of", "heavy rain", "decided", "go hiking"], 0, "Đúng phải là \"Despite\" (không có \"of\")."),
  mcq("A", "english", "recognition", "Từ \"environment\" nghĩa là gì?", ["Kinh tế", "Môi trường", "Giáo dục", "Chính phủ"], 1, "\"Environment\" nghĩa là môi trường."),
  mcq("A", "english", "comprehension", "Choose the correct answer: \"She has lived here ______ 2010.\"", ["for", "since", "in", "at"], 1, "Mốc thời gian dùng \"since\"."),
  fill("A", "english", "application", "Viết lại dạng bị động: \"People speak English all over the world.\" → English ...", ["english is spoken all over the world", "is spoken all over the world"], "\"English is spoken all over the world.\""),
  mcq("A", "english", "recognition", "Choose the correct preposition: \"I'm good ______ mathematics.\"", ["at", "in", "on", "of"], 0, "\"Good at\" là cụm cố định."),
];

const BANKS = {
  kindergarten: () => [...KINDERGARTEN],
  primary: () => [...PRIMARY],
  secondary: (grade) => [
    ...SECONDARY_CURATED_MATH, ...extraMath(grade, "secondary"),
    ...SECONDARY_LANG, ...SECONDARY_SCIENCE, ...SECONDARY_ENGLISH,
  ],
  high_school: (grade) => [
    ...HIGH_CURATED_MATH, ...extraMath(grade, "high_school"),
    ...HIGH_LANG, ...HIGH_SCIENCE, ...HIGH_ENGLISH,
  ],
};

export function buildDeterministicQuestions(gradeLevel, gradeBand) {
  let band = gradeBand;
  if (gradeLevel <= 2) band = "kindergarten";
  else if (gradeLevel <= 5) band = "primary";
  else if (gradeLevel <= 9) band = "secondary";
  else band = "high_school";

  const build = BANKS[band] || BANKS.secondary;
  const allQuestions = build(Number(gradeLevel));
  // Khối Mầm non - Lớp 2 cấu trúc là 15 câu, lấy 15 câu ngẫu nhiên từ ngân hàng 20 câu PhET
  if (band === "kindergarten") {
    // Trộn mảng đơn giản
    allQuestions.sort(() => Math.random() - 0.5);
    return allQuestions.slice(0, 15).map((q, index) => ({ ...q, order_index: index }));
  }
  return allQuestions.map((question, index) => ({ ...question, order_index: index }));
}
