// Dữ liệu kỹ năng mềm cho sinh viên / người đi làm.
// Mỗi khóa gồm metadata (dùng cho thư viện) + nội dung chi tiết (dùng cho trang học).
// Tất cả bài học đều mở khóa (status: READY) - không có điều kiện tiên quyết.

export const SOFT_SKILL_LESSONS = [
  {
    id: "NODE_01",
    nodeCode: "NODE 01 - KỸ NĂNG GIAO TIẾP",
    title: "Giao tiếp hiệu quả & Lắng nghe chủ động",
    description:
      "Học cách truyền đạt ý tưởng rõ ràng, mạch lạc và tự tin trong mọi tình huống. Rèn luyện kỹ thuật lắng nghe chủ động để thấu hiểu người đối diện và xây dựng các mối quan hệ bền vững.",
    status: "READY",
    isApproved: true,
    category: "Giao tiếp",
    duration: "45 phút",
    xpReward: 50,
    accent: "emerald",
    hero: "Giao tiếp không phải là nói nhiều, mà là làm cho người khác hiểu đúng và cảm thấy được lắng nghe.",
    objectives: [
      "Truyền đạt thông điệp rõ ràng, đúng trọng tâm và phù hợp với người nghe",
      "Áp dụng kỹ thuật lắng nghe chủ động để thấu hiểu thay vì chỉ chờ đến lượt nói",
      "Sử dụng ngôn ngữ cơ thể và giọng điệu để tăng sức thuyết phục",
    ],
    sections: [
      {
        heading: "Nền tảng của giao tiếp hiệu quả",
        body:
          "Một thông điệp tốt bắt đầu từ việc hiểu người nghe: họ đã biết gì, cần gì và đang cảm thấy thế nào. Trước khi nói, hãy tự hỏi 'mục tiêu của cuộc trò chuyện này là gì?'. Nói ngắn gọn, đi thẳng vào ý chính rồi mới giải thích chi tiết sẽ giúp người nghe theo kịp dễ dàng.",
        tips: [
          "Dùng công thức: Ý chính → Lý do → Ví dụ cụ thể",
          "Thay câu phủ định bằng câu khẳng định để tạo thiện chí",
        ],
      },
      {
        heading: "Lắng nghe chủ động (Active Listening)",
        body:
          "Lắng nghe chủ động nghĩa là tập trung hoàn toàn vào người nói, quan sát cả lời nói lẫn cảm xúc. Thay vì chuẩn bị câu trả lời trong đầu, hãy diễn giải lại ('Ý bạn là...?') để xác nhận mình hiểu đúng. Điều này khiến người đối diện cảm thấy được tôn trọng và mở lòng hơn.",
        tips: [
          "Gật đầu, giao tiếp bằng mắt và tránh cắt lời",
          "Đặt câu hỏi mở bắt đầu bằng 'Như thế nào', 'Vì sao'",
        ],
      },
      {
        heading: "Ngôn ngữ cơ thể & giọng điệu",
        body:
          "Nghiên cứu cho thấy phần lớn ấn tượng đến từ phi ngôn ngữ. Tư thế thẳng, ánh mắt tự tin và giọng nói rõ ràng có thể làm thông điệp mạnh mẽ gấp đôi. Hãy đồng bộ lời nói với biểu cảm để tránh gây cảm giác thiếu chân thành.",
        tips: [
          "Giữ vai thả lỏng, tay không khoanh trước ngực",
          "Điều chỉnh tốc độ nói - chậm lại ở ý quan trọng",
        ],
      },
    ],
    keyTakeaways: [
      "Hiểu người nghe trước khi truyền đạt",
      "Lắng nghe để thấu hiểu, không phải để phản hồi",
      "Phi ngôn ngữ quyết định phần lớn ấn tượng",
    ],
    practice: {
      title: "Thử thách 3 ngày",
      steps: [
        "Ngày 1: Trong mỗi cuộc trò chuyện, diễn giải lại ý người kia trước khi trả lời",
        "Ngày 2: Trình bày một ý tưởng theo công thức Ý chính → Lý do → Ví dụ",
        "Ngày 3: Ghi hình 1 phút bản thân nói và tự đánh giá ngôn ngữ cơ thể",
      ],
    },
    quiz: {
      question: "Đâu là biểu hiện của lắng nghe chủ động?",
      options: [
        "Chuẩn bị sẵn câu trả lời trong khi người kia đang nói",
        "Diễn giải lại ý của người nói để xác nhận đã hiểu đúng",
        "Nhìn điện thoại nhưng vẫn nghe được nội dung",
        "Nói nhiều hơn để thể hiện sự quan tâm",
      ],
      answerIndex: 1,
      explanation:
        "Diễn giải lại ý người nói ('Ý bạn là...?') là dấu hiệu rõ ràng của lắng nghe chủ động, giúp xác nhận sự thấu hiểu và khiến đối phương thấy được tôn trọng.",
    },
  },
  {
    id: "NODE_02",
    nodeCode: "NODE 02 - QUẢN LÝ THỜI GIAN",
    title: "Quản lý thời gian & Kỹ thuật Pomodoro",
    description:
      "Nắm vững cách sắp xếp công việc theo thứ tự ưu tiên và loại bỏ sự trì hoãn. Áp dụng kỹ thuật Pomodoro để duy trì sự tập trung cao độ và làm việc hiệu quả hơn mỗi ngày.",
    status: "READY",
    isApproved: true,
    category: "Hiệu suất",
    duration: "1 giờ",
    xpReward: 60,
    accent: "sky",
    hero: "Bạn không thiếu thời gian - bạn chỉ đang thiếu một hệ thống để bảo vệ nó.",
    objectives: [
      "Phân loại công việc theo ma trận ưu tiên Eisenhower",
      "Vận hành chu kỳ Pomodoro để tập trung sâu và tránh kiệt sức",
      "Nhận diện và loại bỏ các 'kẻ đánh cắp' thời gian",
    ],
    sections: [
      {
        heading: "Ma trận Eisenhower: Việc gì làm trước?",
        body:
          "Chia công việc thành 4 nhóm dựa trên 2 yếu tố Quan trọng và Khẩn cấp. Việc quan trọng-khẩn cấp: làm ngay. Quan trọng-không khẩn cấp: lên lịch (đây là nhóm tạo ra giá trị lớn nhất). Không quan trọng-khẩn cấp: ủy thác. Không quan trọng-không khẩn cấp: loại bỏ.",
        tips: [
          "Đừng để nhóm 'khẩn cấp' lấn át nhóm 'quan trọng'",
          "Mỗi sáng chọn 1-3 việc quan trọng nhất trong ngày",
        ],
      },
      {
        heading: "Kỹ thuật Pomodoro",
        body:
          "Làm việc tập trung 25 phút, nghỉ 5 phút - đó là một 'pomodoro'. Sau 4 pomodoro, nghỉ dài 15-30 phút. Chu kỳ ngắn giúp não duy trì sự tập trung mà không kiệt sức, đồng thời tạo cảm giác cấp bách lành mạnh để hoàn thành công việc.",
        tips: [
          "Tắt thông báo trong 25 phút tập trung",
          "Ghi lại số pomodoro hoàn thành để tạo động lực",
        ],
      },
      {
        heading: "Đánh bại sự trì hoãn",
        body:
          "Trì hoãn thường bắt nguồn từ việc cảm thấy nhiệm vụ quá lớn hoặc mơ hồ. Hãy chia nhỏ đến mức 'bắt đầu chỉ mất 2 phút'. Quy tắc 2 phút: nếu một việc mất dưới 2 phút, làm ngay. Với việc lớn, chỉ cần cam kết làm trong 1 pomodoro đầu tiên - quán tính sẽ giúp bạn tiếp tục.",
        tips: [
          "Chia nhiệm vụ lớn thành các bước cụ thể có thể tick xong",
          "Bắt đầu bằng phần dễ nhất để tạo đà",
        ],
      },
    ],
    keyTakeaways: [
      "Ưu tiên theo mức độ quan trọng, không chỉ khẩn cấp",
      "Tập trung theo chu kỳ 25/5 để giữ năng lượng",
      "Chia nhỏ nhiệm vụ để vượt qua trì hoãn",
    ],
    practice: {
      title: "Lập kế hoạch một ngày",
      steps: [
        "Liệt kê mọi việc cần làm rồi xếp vào ma trận Eisenhower",
        "Chọn 3 việc quan trọng nhất và ước lượng số pomodoro",
        "Thực hiện ít nhất 4 pomodoro và ghi lại kết quả",
      ],
    },
    quiz: {
      question: "Một chu kỳ Pomodoro tiêu chuẩn kéo dài bao lâu cho phần tập trung?",
      options: ["10 phút", "25 phút", "60 phút", "90 phút"],
      answerIndex: 1,
      explanation:
        "Pomodoro tiêu chuẩn là 25 phút tập trung + 5 phút nghỉ. Chu kỳ ngắn này giúp duy trì tập trung mà không gây kiệt sức.",
    },
  },
  {
    id: "NODE_03",
    nodeCode: "NODE 03 - TƯ DUY PHẢN BIỆN",
    title: "Tư duy phản biện & Giải quyết vấn đề",
    description:
      "Phát triển khả năng phân tích thông tin đa chiều và đặt câu hỏi đúng trọng tâm. Trang bị quy trình giải quyết vấn đề bài bản để đưa ra quyết định sáng suốt dưới áp lực.",
    status: "READY",
    isApproved: true,
    category: "Tư duy",
    duration: "1.5 giờ",
    xpReward: 100,
    accent: "violet",
    hero: "Người tư duy phản biện không tin điều đầu tiên họ nghe - họ hỏi 'Bằng chứng đâu?'",
    objectives: [
      "Phân biệt sự thật, ý kiến và suy luận",
      "Nhận diện các thiên kiến nhận thức phổ biến",
      "Áp dụng quy trình 5 bước để giải quyết vấn đề",
    ],
    sections: [
      {
        heading: "Đặt câu hỏi đúng",
        body:
          "Tư duy phản biện bắt đầu bằng việc không chấp nhận thông tin một cách thụ động. Hãy hỏi: Nguồn tin này đáng tin không? Có bằng chứng nào không? Có góc nhìn nào khác không? Ai được lợi từ thông tin này? Câu hỏi tốt quan trọng hơn câu trả lời nhanh.",
        tips: [
          "Tách 'sự thật có thể kiểm chứng' khỏi 'ý kiến cá nhân'",
          "Luôn tìm ít nhất một góc nhìn đối lập",
        ],
      },
      {
        heading: "Cảnh giác với thiên kiến nhận thức",
        body:
          "Não bộ hay đi đường tắt và dễ mắc lỗi. Thiên kiến xác nhận khiến ta chỉ tìm thông tin ủng hộ điều đã tin. Hiệu ứng mỏ neo khiến con số đầu tiên chi phối quyết định. Biết tên các thiên kiến này giúp bạn kịp nhận ra và điều chỉnh.",
        tips: [
          "Trước khi kết luận, hỏi 'Tôi có đang chỉ tìm thứ mình muốn tin?'",
          "Ra quyết định lớn khi bình tĩnh, không lúc cảm xúc mạnh",
        ],
      },
      {
        heading: "Quy trình giải quyết vấn đề 5 bước",
        body:
          "1) Xác định vấn đề thật sự (không nhầm với triệu chứng). 2) Thu thập thông tin và dữ kiện. 3) Đưa ra nhiều phương án. 4) Đánh giá ưu-nhược của từng phương án. 5) Chọn, thực thi và rà soát kết quả. Quy trình rõ ràng giúp bạn quyết định tỉnh táo ngay cả khi áp lực.",
        tips: [
          "Dùng kỹ thuật '5 Whys' để truy tận gốc nguyên nhân",
          "Viết ra ít nhất 3 phương án trước khi chọn",
        ],
      },
    ],
    keyTakeaways: [
      "Câu hỏi tốt quan trọng hơn câu trả lời nhanh",
      "Nhận diện thiên kiến để quyết định khách quan hơn",
      "Quy trình 5 bước giúp gỡ rối vấn đề phức tạp",
    ],
    practice: {
      title: "Giải mã một vấn đề thực tế",
      steps: [
        "Chọn một vấn đề bạn đang gặp và viết ra 'vấn đề thật sự' bằng 1 câu",
        "Dùng '5 Whys' để tìm nguyên nhân gốc rễ",
        "Liệt kê 3 phương án và chấm điểm ưu-nhược từng cái",
      ],
    },
    quiz: {
      question: "Thiên kiến xác nhận (confirmation bias) là gì?",
      options: [
        "Xu hướng tin vào con số đầu tiên nghe được",
        "Xu hướng chỉ tìm thông tin ủng hộ điều mình đã tin",
        "Xu hướng làm theo số đông",
        "Xu hướng đánh giá thấp rủi ro",
      ],
      answerIndex: 1,
      explanation:
        "Thiên kiến xác nhận khiến ta vô thức chỉ tìm và ghi nhớ thông tin củng cố niềm tin sẵn có, bỏ qua bằng chứng trái chiều.",
    },
  },
  {
    id: "NODE_04",
    nodeCode: "NODE 04 - LÀM VIỆC NHÓM",
    title: "Kỹ năng làm việc nhóm & Xử lý xung đột",
    description:
      "Học cách phối hợp, phân chia vai trò và đóng góp giá trị trong một tập thể. Nắm bắt các chiến lược hòa giải để biến xung đột thành cơ hội phát triển thay vì rạn nứt.",
    status: "READY",
    isApproved: true,
    category: "Cộng tác",
    duration: "1 giờ",
    xpReward: 70,
    accent: "amber",
    hero: "Một đội mạnh không phải nơi không có mâu thuẫn, mà là nơi mâu thuẫn được giải quyết đúng cách.",
    objectives: [
      "Hiểu vai trò và trách nhiệm trong một nhóm hiệu quả",
      "Đóng góp và phản hồi mang tính xây dựng",
      "Xử lý xung đột theo hướng đôi bên cùng thắng",
    ],
    sections: [
      {
        heading: "Yếu tố tạo nên một đội mạnh",
        body:
          "Nghiên cứu của Google (Project Aristotle) chỉ ra 'an toàn tâm lý' là yếu tố số một: mọi người dám nói ra ý kiến mà không sợ bị chê cười. Cùng với đó là mục tiêu rõ ràng, vai trò minh bạch và sự tin cậy lẫn nhau. Một đội tốt biết ai làm gì và tin nhau sẽ hoàn thành phần việc.",
        tips: [
          "Thống nhất mục tiêu và tiêu chí 'hoàn thành' ngay từ đầu",
          "Tạo không gian để mọi thành viên được lên tiếng",
        ],
      },
      {
        heading: "Phản hồi mang tính xây dựng",
        body:
          "Phản hồi tốt tập trung vào hành vi, không phải con người. Dùng mô hình SBI: Tình huống (Situation) - Hành vi (Behavior) - Tác động (Impact). Ví dụ: 'Trong buổi họp hôm qua, khi bạn gửi báo cáo trễ, cả nhóm phải lùi lịch'. Cụ thể và không quy chụp giúp người nghe dễ tiếp thu.",
        tips: [
          "Khen công khai, góp ý riêng tư",
          "Kết thúc bằng đề xuất cải thiện cụ thể",
        ],
      },
      {
        heading: "Xử lý xung đột",
        body:
          "Xung đột là tự nhiên khi nhiều người cùng làm việc. Chìa khóa là tách vấn đề khỏi con người và tìm lợi ích chung phía sau mỗi quan điểm. Thay vì tranh ai đúng ai sai, hãy hỏi 'Chúng ta cùng muốn đạt được gì?'. Đôi khi giải pháp thứ ba mà chưa ai nghĩ tới lại là tốt nhất.",
        tips: [
          "Lắng nghe để hiểu nhu cầu ẩn sau lập trường",
          "Tập trung vào tương lai và giải pháp, không đổ lỗi quá khứ",
        ],
      },
    ],
    keyTakeaways: [
      "An toàn tâm lý là nền tảng của đội mạnh",
      "Phản hồi vào hành vi, dùng mô hình SBI",
      "Biến xung đột thành cơ hội bằng cách tìm lợi ích chung",
    ],
    practice: {
      title: "Rèn kỹ năng cộng tác",
      steps: [
        "Trong dự án nhóm gần nhất, viết ra vai trò của từng người",
        "Đưa một phản hồi cho đồng đội theo mô hình SBI",
        "Chọn một mâu thuẫn nhỏ và tìm 'lợi ích chung' phía sau",
      ],
    },
    quiz: {
      question: "Mô hình SBI khi đưa phản hồi bao gồm những yếu tố nào?",
      options: [
        "Sự thật - Niềm tin - Ý định",
        "Tình huống - Hành vi - Tác động",
        "Mục tiêu - Kế hoạch - Kết quả",
        "Nói - Nghe - Ghi nhớ",
      ],
      answerIndex: 1,
      explanation:
        "SBI = Situation (Tình huống) - Behavior (Hành vi) - Impact (Tác động), giúp phản hồi cụ thể, khách quan và dễ tiếp thu.",
    },
  },
  {
    id: "NODE_05",
    nodeCode: "NODE 05 - TRÍ TUỆ CẢM XÚC",
    title: "Trí tuệ cảm xúc (EQ) trong công việc",
    description:
      "Nhận diện và điều tiết cảm xúc của bản thân để giữ bình tĩnh trong áp lực. Thấu cảm với đồng nghiệp giúp bạn xây dựng uy tín và trở thành người dẫn dắt được tin tưởng.",
    status: "READY",
    isApproved: true,
    category: "Cảm xúc",
    duration: "1.5 giờ",
    xpReward: 90,
    accent: "rose",
    hero: "IQ giúp bạn được tuyển dụng, nhưng EQ mới quyết định bạn tiến xa đến đâu.",
    objectives: [
      "Nhận diện và gọi tên cảm xúc của bản thân",
      "Điều tiết cảm xúc dưới áp lực thay vì phản ứng bốc đồng",
      "Thực hành thấu cảm để kết nối với người khác",
    ],
    sections: [
      {
        heading: "Tự nhận thức cảm xúc",
        body:
          "Bước đầu tiên của EQ là nhận ra mình đang cảm thấy gì và vì sao. Nhiều người phản ứng theo cảm xúc mà không hề ý thức. Hãy tập 'gọi tên' cảm xúc: 'Tôi đang lo lắng vì deadline'. Chỉ riêng việc đặt tên đã làm giảm cường độ cảm xúc và giúp bạn phản ứng tỉnh táo hơn.",
        tips: [
          "Viết nhật ký cảm xúc 2 phút mỗi tối",
          "Khi thấy căng thẳng, dừng lại và hỏi 'Điều gì đang kích hoạt tôi?'",
        ],
      },
      {
        heading: "Điều tiết cảm xúc",
        body:
          "Giữa kích thích và phản ứng luôn có một khoảng lặng - đó là nơi bạn chọn cách hành xử. Khi cảm xúc dâng cao, hãy hít thở sâu, đếm đến 6, hoặc tạm rời khỏi tình huống. Trả lời email khó chịu sau 10 phút thay vì ngay lập tức có thể cứu cả một mối quan hệ.",
        tips: [
          "Kỹ thuật thở 4-7-8 để hạ nhiệt nhanh",
          "Không ra quyết định hay gửi tin nhắn khi đang tức giận",
        ],
      },
      {
        heading: "Thấu cảm & kỹ năng xã hội",
        body:
          "Thấu cảm là khả năng đặt mình vào vị trí người khác. Trong công việc, người có EQ cao nhận ra khi đồng nghiệp mệt mỏi, biết chọn thời điểm để nói và cách nói phù hợp. Đây là nền tảng của sự tin cậy và khả năng lãnh đạo tự nhiên.",
        tips: [
          "Quan sát tín hiệu phi ngôn ngữ của người khác",
          "Trước khi phản hồi, tự hỏi 'Người này đang thực sự cần gì?'",
        ],
      },
    ],
    keyTakeaways: [
      "Gọi tên cảm xúc giúp giảm cường độ và tăng tỉnh táo",
      "Tận dụng khoảng lặng giữa kích thích và phản ứng",
      "Thấu cảm là nền tảng của tin cậy và lãnh đạo",
    ],
    practice: {
      title: "Rèn EQ trong 3 tình huống",
      steps: [
        "Ghi lại một lần bạn phản ứng theo cảm xúc và cách bạn sẽ làm khác",
        "Áp dụng quy tắc 'chờ 10 phút' trước khi phản hồi một tin nhắn khó chịu",
        "Chủ động hỏi thăm cảm xúc của một đồng nghiệp/bạn học",
      ],
    },
    quiz: {
      question: "Đâu là bước đầu tiên và quan trọng nhất của trí tuệ cảm xúc?",
      options: [
        "Kiểm soát cảm xúc của người khác",
        "Tự nhận thức - nhận ra và gọi tên cảm xúc của mình",
        "Luôn giấu kín cảm xúc thật",
        "Phản ứng thật nhanh với mọi tình huống",
      ],
      answerIndex: 1,
      explanation:
        "Tự nhận thức (self-awareness) là nền tảng của EQ. Nhận ra và gọi tên cảm xúc giúp bạn hiểu nguyên nhân và chọn cách phản ứng phù hợp.",
    },
  },
  {
    id: "NODE_06",
    nodeCode: "NODE 06 - KỸ NĂNG THUYẾT TRÌNH",
    title: "Kỹ năng thuyết trình trước công chúng",
    description:
      "Vượt qua nỗi sợ sân khấu và làm chủ ngôn ngữ cơ thể để thu hút khán giả. Học cách cấu trúc một bài nói thuyết phục và kể chuyện hấp dẫn để truyền cảm hứng.",
    status: "READY",
    isApproved: true,
    category: "Giao tiếp",
    duration: "1.5 giờ",
    xpReward: 100,
    accent: "indigo",
    hero: "Khán giả sẽ quên slide của bạn, nhưng nhớ cảm xúc mà bạn mang lại.",
    objectives: [
      "Cấu trúc bài thuyết trình theo mạch mở - thân - kết rõ ràng",
      "Vượt qua nỗi sợ sân khấu bằng kỹ thuật cụ thể",
      "Dùng storytelling để bài nói đáng nhớ",
    ],
    sections: [
      {
        heading: "Cấu trúc một bài nói thuyết phục",
        body:
          "Một bài thuyết trình tốt có mạch rõ: Mở đầu gây chú ý (câu hỏi, số liệu gây sốc, hoặc câu chuyện), Thân bài với 3 ý chính được hỗ trợ bằng ví dụ, và Kết luận đọng lại một thông điệp. Quy tắc 'Nói cho họ biết bạn sẽ nói gì - Nói - Nhắc lại điều đã nói' giúp khán giả không lạc lối.",
        tips: [
          "Giới hạn 3 ý chính - nhiều hơn sẽ khó nhớ",
          "Mở đầu 30 giây quyết định khán giả có tập trung hay không",
        ],
      },
      {
        heading: "Vượt qua nỗi sợ sân khấu",
        body:
          "Hồi hộp là bình thường, kể cả với diễn giả chuyên nghiệp. Bí quyết không phải là loại bỏ mà là quản lý nó. Chuẩn bị kỹ và luyện tập nhiều lần tạo sự tự tin. Hít thở sâu trước khi lên, tập trung vào việc trao giá trị cho khán giả thay vì lo bị đánh giá.",
        tips: [
          "Luyện tập thành tiếng ít nhất 3 lần trước khi trình bày",
          "Diễn tập trước gương hoặc quay video để tự sửa",
        ],
      },
      {
        heading: "Sức mạnh của kể chuyện",
        body:
          "Não bộ ghi nhớ câu chuyện tốt hơn dữ liệu khô khan. Thay vì chỉ đưa số liệu, hãy lồng nó vào một câu chuyện có nhân vật, xung đột và giải pháp. Một ví dụ đời thực có thể làm cả bài nói sống động và dễ nhớ hơn mười biểu đồ.",
        tips: [
          "Bắt đầu bằng một câu chuyện ngắn liên quan đến chủ đề",
          "Dùng dữ liệu để củng cố, câu chuyện để kết nối cảm xúc",
        ],
      },
    ],
    keyTakeaways: [
      "Giới hạn 3 ý chính và có mạch mở - thân - kết",
      "Quản lý nỗi sợ bằng chuẩn bị và luyện tập",
      "Câu chuyện khiến bài nói đáng nhớ hơn số liệu",
    ],
    practice: {
      title: "Chuẩn bị bài nói 3 phút",
      steps: [
        "Chọn một chủ đề và viết mở đầu gây chú ý trong 30 giây",
        "Xây 3 ý chính, mỗi ý kèm một ví dụ hoặc câu chuyện",
        "Luyện thành tiếng 3 lần và tự quay video để đánh giá",
      ],
    },
    quiz: {
      question: "Vì sao nên dùng storytelling trong thuyết trình?",
      options: [
        "Vì câu chuyện làm bài nói dài hơn",
        "Vì não bộ ghi nhớ câu chuyện tốt hơn dữ liệu khô khan",
        "Vì không cần chuẩn bị số liệu nữa",
        "Vì storytelling giúp che giấu nội dung yếu",
      ],
      answerIndex: 1,
      explanation:
        "Câu chuyện có nhân vật và cảm xúc được não bộ ghi nhớ tốt hơn nhiều so với dữ liệu rời rạc, giúp thông điệp đọng lại lâu hơn.",
    },
  },
  {
    id: "NODE_07",
    nodeCode: "NODE 07 - CV & PHỎNG VẤN",
    title: "Viết CV và Trả lời phỏng vấn ấn tượng",
    description:
      "Tạo một bản CV nổi bật giúp bạn lọt vào mắt xanh của nhà tuyển dụng. Luyện tập trả lời các câu hỏi phỏng vấn hóc búa một cách tự tin và chuyên nghiệp.",
    status: "READY",
    isApproved: true,
    category: "Sự nghiệp",
    duration: "1 giờ",
    xpReward: 80,
    accent: "teal",
    hero: "CV có 6 giây để gây ấn tượng, và buổi phỏng vấn có 5 phút đầu để định đoạt kết quả.",
    objectives: [
      "Viết CV tập trung vào thành tựu và kết quả đo lường được",
      "Chuẩn bị câu chuyện theo phương pháp STAR",
      "Tự tin xử lý các câu hỏi phỏng vấn khó",
    ],
    sections: [
      {
        heading: "CV nổi bật trong 6 giây",
        body:
          "Nhà tuyển dụng lướt qua mỗi CV chỉ vài giây. Hãy đặt thông tin quan trọng nhất lên đầu, dùng động từ mạnh và định lượng thành tựu ('Tăng doanh số 20%' thay vì 'Phụ trách bán hàng'). Một CV gọn 1-2 trang, dễ đọc, không lỗi chính tả sẽ vượt qua vòng sàng lọc.",
        tips: [
          "Mỗi gạch đầu dòng: Động từ mạnh + việc làm + kết quả",
          "Tùy chỉnh CV theo từng vị trí ứng tuyển",
        ],
      },
      {
        heading: "Phương pháp STAR",
        body:
          "Với câu hỏi hành vi ('Kể về một lần bạn...'), dùng cấu trúc STAR: Situation (bối cảnh), Task (nhiệm vụ), Action (hành động bạn làm), Result (kết quả). Cách trả lời này giúp câu chuyện mạch lạc, cụ thể và làm nổi bật đóng góp cá nhân của bạn.",
        tips: [
          "Chuẩn bị sẵn 3-4 câu chuyện STAR đa dạng tình huống",
          "Nhấn mạnh phần 'Action' - điều bạn đã làm",
        ],
      },
      {
        heading: "Xử lý câu hỏi khó",
        body:
          "Với câu 'Điểm yếu của bạn là gì?', hãy chọn một điểm yếu thật và cho thấy bạn đang cải thiện. Với 'Vì sao chúng tôi nên tuyển bạn?', kết nối kỹ năng của bạn với nhu cầu cụ thể của công ty. Luôn chuẩn bị 2-3 câu hỏi ngược để thể hiện sự quan tâm nghiêm túc.",
        tips: [
          "Nghiên cứu công ty trước khi phỏng vấn",
          "Thành thật nhưng luôn hướng đến sự tích cực",
        ],
      },
    ],
    keyTakeaways: [
      "Định lượng thành tựu để CV nổi bật",
      "Dùng STAR để trả lời câu hỏi hành vi",
      "Chuẩn bị câu hỏi ngược cho nhà tuyển dụng",
    ],
    practice: {
      title: "Sẵn sàng cho buổi phỏng vấn",
      steps: [
        "Viết lại 3 gạch đầu dòng trong CV theo công thức động từ + kết quả",
        "Chuẩn bị 3 câu chuyện theo cấu trúc STAR",
        "Soạn 3 câu hỏi bạn sẽ hỏi ngược nhà tuyển dụng",
      ],
    },
    quiz: {
      question: "Chữ 'A' trong phương pháp STAR đại diện cho điều gì?",
      options: [
        "Attitude - Thái độ",
        "Action - Hành động bạn đã thực hiện",
        "Achievement - Thành tích chung của công ty",
        "Ambition - Tham vọng",
      ],
      answerIndex: 1,
      explanation:
        "STAR = Situation, Task, Action, Result. 'Action' là phần quan trọng nhất - mô tả cụ thể hành động bạn đã làm để giải quyết tình huống.",
    },
  },
  {
    id: "NODE_08",
    nodeCode: "NODE 08 - TÀI CHÍNH CÁ NHÂN",
    title: "Quản lý tài chính cá nhân cho người trẻ",
    description:
      "Xây dựng thói quen chi tiêu thông minh và lập ngân sách phù hợp với thu nhập. Hiểu về tiết kiệm, quỹ dự phòng và những nguyên tắc đầu tư cơ bản để tự chủ tài chính.",
    status: "READY",
    isApproved: true,
    category: "Tài chính",
    duration: "1 giờ",
    xpReward: 80,
    accent: "green",
    hero: "Không phải bạn kiếm được bao nhiêu, mà bạn giữ lại được bao nhiêu mới quan trọng.",
    objectives: [
      "Lập ngân sách cá nhân theo quy tắc 50/30/20",
      "Xây dựng quỹ dự phòng và thói quen tiết kiệm",
      "Hiểu các nguyên tắc đầu tư cơ bản và lãi kép",
    ],
    sections: [
      {
        heading: "Quy tắc ngân sách 50/30/20",
        body:
          "Chia thu nhập thành 3 phần: 50% cho nhu cầu thiết yếu (ăn, ở, đi lại), 30% cho mong muốn (giải trí, mua sắm), và 20% cho tiết kiệm/trả nợ. Quy tắc đơn giản này giúp bạn kiểm soát dòng tiền mà không cần bảng tính phức tạp.",
        tips: [
          "Ghi lại mọi khoản chi trong 1 tháng để biết tiền đi đâu",
          "Trả cho bản thân trước - trích tiết kiệm ngay khi có thu nhập",
        ],
      },
      {
        heading: "Quỹ dự phòng khẩn cấp",
        body:
          "Trước khi nghĩ đến đầu tư, hãy xây quỹ dự phòng bằng 3-6 tháng chi tiêu. Đây là tấm đệm giúp bạn không rơi vào nợ nần khi gặp sự cố (mất việc, ốm đau). Để quỹ này ở nơi an toàn và dễ rút như tài khoản tiết kiệm.",
        tips: [
          "Bắt đầu nhỏ: mục tiêu 1 tháng chi tiêu trước",
          "Tự động chuyển một khoản cố định vào quỹ mỗi tháng",
        ],
      },
      {
        heading: "Sức mạnh của lãi kép",
        body:
          "Lãi kép là 'kỳ quan thứ tám của thế giới': tiền lãi lại sinh ra lãi. Đầu tư sớm dù ít vẫn hơn đầu tư nhiều nhưng muộn, vì thời gian là yếu tố quan trọng nhất. Hãy tìm hiểu các kênh phù hợp với mức độ rủi ro của bản thân và luôn đa dạng hóa.",
        tips: [
          "Bắt đầu đầu tư càng sớm càng tốt, dù số tiền nhỏ",
          "Không bỏ tất cả trứng vào một giỏ",
        ],
      },
    ],
    keyTakeaways: [
      "Áp dụng quy tắc 50/30/20 để kiểm soát chi tiêu",
      "Xây quỹ dự phòng 3-6 tháng trước khi đầu tư",
      "Đầu tư sớm để tận dụng sức mạnh lãi kép",
    ],
    practice: {
      title: "Kiểm soát tài chính 30 ngày",
      steps: [
        "Ghi lại toàn bộ chi tiêu trong 1 tuần",
        "Phân bổ thu nhập theo quy tắc 50/30/20",
        "Thiết lập chuyển khoản tự động vào quỹ tiết kiệm",
      ],
    },
    quiz: {
      question: "Theo quy tắc 50/30/20, 20% thu nhập nên dành cho việc gì?",
      options: [
        "Nhu cầu thiết yếu",
        "Giải trí và mua sắm",
        "Tiết kiệm và trả nợ",
        "Từ thiện",
      ],
      answerIndex: 2,
      explanation:
        "Quy tắc 50/30/20: 50% nhu cầu thiết yếu, 30% mong muốn, và 20% dành cho tiết kiệm hoặc trả nợ - phần xây dựng tương lai tài chính.",
    },
  },
  {
    id: "NODE_09",
    nodeCode: "NODE 09 - KỸ NĂNG TỰ HỌC",
    title: "Kỹ năng tự học và Thích nghi với thay đổi",
    description:
      "Xây dựng phương pháp học tập chủ động và ghi nhớ kiến thức lâu dài. Rèn luyện tư duy linh hoạt để nhanh chóng thích nghi với công nghệ và môi trường luôn biến động.",
    status: "READY",
    isApproved: true,
    category: "Phát triển",
    duration: "1 giờ",
    xpReward: 70,
    accent: "cyan",
    hero: "Trong thế giới thay đổi nhanh, khả năng tự học chính là siêu năng lực bền vững nhất.",
    objectives: [
      "Áp dụng các kỹ thuật học tập hiệu quả có cơ sở khoa học",
      "Xây dựng thói quen học tập chủ động và bền vững",
      "Nuôi dưỡng tư duy phát triển để thích nghi với thay đổi",
    ],
    sections: [
      {
        heading: "Học đúng cách, không chỉ học chăm",
        body:
          "Đọc lại nhiều lần là cách học kém hiệu quả nhất. Thay vào đó, hãy dùng 'active recall' (tự kiểm tra lại kiến thức mà không nhìn tài liệu) và 'spaced repetition' (ôn lại theo khoảng cách tăng dần). Hai kỹ thuật này được khoa học chứng minh giúp ghi nhớ lâu hơn nhiều lần.",
        tips: [
          "Sau khi học, gấp sách lại và tự viết ra những gì nhớ được",
          "Ôn lại sau 1 ngày, 3 ngày, 1 tuần, 1 tháng",
        ],
      },
      {
        heading: "Kỹ thuật Feynman",
        body:
          "Muốn hiểu sâu điều gì, hãy thử giải thích nó bằng ngôn ngữ đơn giản như đang dạy một đứa trẻ. Khi gặp chỗ giải thích không trôi, đó chính là lỗ hổng kiến thức cần lấp. Dạy lại là cách học nhanh nhất.",
        tips: [
          "Giải thích khái niệm mới cho bạn bè hoặc viết ra giấy",
          "Tránh dùng thuật ngữ phức tạp để che giấu chỗ chưa hiểu",
        ],
      },
      {
        heading: "Tư duy phát triển (Growth Mindset)",
        body:
          "Người có tư duy phát triển tin rằng năng lực có thể rèn luyện, nên họ xem thất bại là bài học chứ không phải bản án. Trong thời đại công nghệ thay đổi liên tục, thái độ 'tôi chưa biết, nhưng tôi có thể học' quan trọng hơn bất kỳ kỹ năng cố định nào.",
        tips: [
          "Thêm chữ 'chưa' vào suy nghĩ: 'Tôi chưa làm được điều này'",
          "Đón nhận thử thách mới như cơ hội để lớn lên",
        ],
      },
    ],
    keyTakeaways: [
      "Active recall và spaced repetition giúp nhớ lâu",
      "Dạy lại (Feynman) là cách hiểu sâu nhất",
      "Tư duy phát triển giúp thích nghi với mọi thay đổi",
    ],
    practice: {
      title: "Nâng cấp cách học",
      steps: [
        "Học một chủ đề mới rồi tự viết lại mà không nhìn tài liệu",
        "Giải thích chủ đề đó cho một người khác theo kỹ thuật Feynman",
        "Lập lịch ôn lại theo spaced repetition (1-3-7 ngày)",
      ],
    },
    quiz: {
      question: "'Active recall' trong học tập nghĩa là gì?",
      options: [
        "Đọc lại tài liệu càng nhiều lần càng tốt",
        "Tự kiểm tra và nhớ lại kiến thức mà không nhìn tài liệu",
        "Nghe giảng một cách thụ động",
        "Ghi chép lại nguyên văn bài giảng",
      ],
      answerIndex: 1,
      explanation:
        "Active recall là chủ động truy xuất kiến thức từ trí nhớ (tự kiểm tra) thay vì đọc lại thụ động - phương pháp được chứng minh giúp ghi nhớ lâu hơn.",
    },
  },
  {
    id: "NODE_10",
    nodeCode: "NODE 10 - THƯƠNG HIỆU CÁ NHÂN",
    title: "Xây dựng thương hiệu cá nhân trên mạng xã hội",
    description:
      "Định vị bản thân và tạo dựng hình ảnh chuyên nghiệp trên các nền tảng số. Học cách chia sẻ giá trị và mở rộng mạng lưới quan hệ để tạo ra cơ hội nghề nghiệp.",
    status: "READY",
    isApproved: true,
    category: "Thương hiệu",
    duration: "1 giờ",
    xpReward: 80,
    accent: "fuchsia",
    hero: "Thương hiệu cá nhân là những gì người ta nói về bạn khi bạn không có mặt ở đó.",
    objectives: [
      "Xác định định vị và giá trị cốt lõi của bản thân",
      "Xây dựng hình ảnh chuyên nghiệp nhất quán trên nền tảng số",
      "Chia sẻ giá trị và mở rộng mạng lưới quan hệ",
    ],
    sections: [
      {
        heading: "Định vị bản thân",
        body:
          "Thương hiệu cá nhân bắt đầu bằng câu hỏi: Bạn muốn được biết đến vì điều gì? Chọn 2-3 chủ đề bạn giỏi và đam mê, rồi kiên trì tạo giá trị quanh chúng. Sự nhất quán về chủ đề và giọng điệu giúp người khác nhớ đến bạn khi cần đến lĩnh vực đó.",
        tips: [
          "Viết một câu 'định vị' về bản thân trong 15 từ",
          "Chọn lĩnh vực giao giữa 'giỏi' và 'thích'",
        ],
      },
      {
        heading: "Hình ảnh chuyên nghiệp nhất quán",
        body:
          "Hồ sơ trực tuyến (LinkedIn, hồ sơ mạng xã hội) là 'CV sống' của bạn. Dùng ảnh đại diện chuyên nghiệp, tiêu đề rõ ràng và mô tả nêu bật giá trị bạn mang lại. Nhớ rằng nhà tuyển dụng thường tìm kiếm bạn online - hãy đảm bảo họ thấy hình ảnh bạn muốn xây dựng.",
        tips: [
          "Đồng bộ ảnh, tên và mô tả trên các nền tảng",
          "Dọn dẹp các nội dung cũ không phù hợp",
        ],
      },
      {
        heading: "Chia sẻ giá trị & kết nối",
        body:
          "Xây thương hiệu không phải khoe khoang mà là cho đi giá trị. Chia sẻ những gì bạn học được, bình luận sâu sắc vào bài của người khác, và kết nối chân thành. Networking hiệu quả là xây quan hệ trước khi bạn cần đến nó - hãy giúp đỡ trước, cơ hội sẽ tự tìm đến.",
        tips: [
          "Chia sẻ 1 điều hữu ích bạn học được mỗi tuần",
          "Tương tác thật lòng thay vì chỉ thả like",
        ],
      },
    ],
    keyTakeaways: [
      "Định vị rõ ràng quanh 2-3 chủ đề bạn giỏi và thích",
      "Giữ hình ảnh chuyên nghiệp nhất quán trên nền tảng số",
      "Cho đi giá trị trước, cơ hội sẽ đến sau",
    ],
    practice: {
      title: "Khởi động thương hiệu cá nhân",
      steps: [
        "Viết câu định vị bản thân trong 15 từ",
        "Cập nhật ảnh đại diện và tiêu đề hồ sơ chuyên nghiệp",
        "Đăng một bài chia sẻ giá trị về lĩnh vực của bạn",
      ],
    },
    quiz: {
      question: "Nguyên tắc cốt lõi của networking hiệu quả là gì?",
      options: [
        "Kết nối với càng nhiều người càng tốt để tăng số lượng",
        "Xây dựng quan hệ và cho đi giá trị trước khi bạn cần đến nó",
        "Chỉ kết nối khi bạn đang cần tìm việc",
        "Chỉ tương tác với người nổi tiếng",
      ],
      answerIndex: 1,
      explanation:
        "Networking bền vững dựa trên việc cho đi giá trị và xây quan hệ chân thành trước - khi bạn giúp đỡ người khác, cơ hội sẽ tự tìm đến đúng lúc.",
    },
  },
];

export function getSoftSkillLesson(id) {
  return SOFT_SKILL_LESSONS.find((lesson) => lesson.id === id) ?? null;
}
