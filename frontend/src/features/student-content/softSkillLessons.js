// Thư viện kỹ năng mềm STEAM cho học sinh.
// Mỗi node gắn tag STEAM (trục đầu tiên là trục chính, quyết định màu của node)
// và chỉ giữ những kỹ năng thực sự phục vụ việc học/làm dự án STEAM — các kỹ năng
// nghề nghiệp thuần (CV, tài chính cá nhân, thương hiệu cá nhân) đã được lược bỏ.
// Tất cả bài học đều mở khóa (status: READY) - không có điều kiện tiên quyết.

export const SOFT_SKILL_LESSONS = [
  {
    id: "NODE_01",
    nodeCode: "NODE 01 - GIAO TIẾP KHOA HỌC",
    title: "Giao tiếp khoa học & Lắng nghe chủ động",
    description:
      "Học cách giải thích một ý tưởng khoa học sao cho người khác hiểu đúng ngay lần đầu. Rèn kỹ thuật lắng nghe chủ động để tiếp thu góp ý và làm việc ăn ý với bạn cùng nhóm.",
    status: "READY",
    isApproved: true,
    steam: ["S", "A"],
    category: "Giao tiếp",
    emoji: "🗣️",
    duration: "45 phút",
    xpReward: 50,
    accent: "green",
    hero: "Bạn chỉ thực sự hiểu một hiện tượng khoa học khi giải thích được nó cho người chưa biết gì.",
    objectives: [
      "Giải thích một khái niệm khoa học bằng ngôn ngữ đơn giản, đúng trọng tâm",
      "Áp dụng lắng nghe chủ động để tiếp thu góp ý về bài làm của mình",
      "Dùng hình vẽ, ví dụ và so sánh để làm rõ ý tưởng trừu tượng",
    ],
    sections: [
      {
        heading: "Giải thích khoa học cho người chưa biết",
        body:
          "Một lời giải thích tốt bắt đầu từ điều người nghe đã biết rồi mới bắc cầu sang cái mới. Hãy đi theo mạch: hiện tượng là gì → vì sao nó xảy ra → ví dụ trong đời sống. Tránh dùng thuật ngữ khi chưa định nghĩa, vì thuật ngữ thường che giấu chính chỗ bạn chưa hiểu rõ.",
        tips: [
          "Dùng công thức: Ý chính → Lý do → Ví dụ đời thường",
          "Nếu không giải thích được cho em nhỏ, bạn chưa hiểu đủ sâu",
        ],
      },
      {
        heading: "Lắng nghe chủ động khi nhận góp ý",
        body:
          "Trong dự án STEAM, bài làm của bạn sẽ liên tục được thầy cô và bạn bè góp ý. Lắng nghe chủ động nghĩa là nghe để hiểu chứ không phải để phản bác. Hãy diễn giải lại ('Ý bạn là phần đo đạc của mình chưa đủ số lần đúng không?') trước khi trả lời — vừa xác nhận mình hiểu đúng, vừa cho người góp ý thấy được tôn trọng.",
        tips: [
          "Ghi lại góp ý trước, tranh luận sau",
          "Đặt câu hỏi mở: 'Vì sao', 'Như thế nào', 'Nếu... thì sao'",
        ],
      },
      {
        heading: "Hình ảnh hóa ý tưởng",
        body:
          "Nhiều khái niệm STEAM rất trừu tượng: mạch điện, thuật toán, lực. Một hình vẽ nguệch ngoạc trên giấy thường hiệu quả hơn ba đoạn văn. Hãy tập vẽ sơ đồ khối, mũi tên dòng chảy hoặc dùng phép so sánh quen thuộc (dòng điện như dòng nước trong ống) để người nghe hình dung ngay.",
        tips: [
          "Vừa nói vừa vẽ sơ đồ — người nghe nhớ lâu gấp nhiều lần",
          "Mỗi phép so sánh đều có giới hạn, hãy nói rõ giới hạn đó",
        ],
      },
    ],
    keyTakeaways: [
      "Bắt đầu từ điều người nghe đã biết rồi mới bắc cầu",
      "Diễn giải lại góp ý trước khi phản hồi",
      "Một sơ đồ tốt thay được nhiều đoạn văn",
    ],
    practice: {
      title: "Thử thách 3 ngày",
      steps: [
        "Ngày 1: Chọn một khái niệm vừa học và giải thích cho người thân trong 2 phút",
        "Ngày 2: Vẽ sơ đồ cho khái niệm đó rồi giải thích lại bằng sơ đồ",
        "Ngày 3: Nhờ một bạn góp ý và diễn giải lại góp ý đó trước khi trả lời",
      ],
    },
    quiz: {
      question: "Đâu là biểu hiện của lắng nghe chủ động khi nhận góp ý về dự án?",
      options: [
        "Chuẩn bị sẵn lý lẽ phản bác trong khi bạn kia đang nói",
        "Diễn giải lại góp ý để xác nhận mình đã hiểu đúng",
        "Im lặng cho qua rồi giữ nguyên cách làm cũ",
        "Nói nhiều hơn để bảo vệ bài làm của mình",
      ],
      answerIndex: 1,
      explanation:
        "Diễn giải lại ('Ý bạn là...?') là dấu hiệu rõ ràng của lắng nghe chủ động: nó xác nhận sự thấu hiểu và khiến người góp ý thấy được tôn trọng.",
    },
  },
  {
    id: "NODE_02",
    nodeCode: "NODE 02 - QUẢN LÝ DỰ ÁN STEAM",
    title: "Quản lý thời gian & tiến độ dự án STEAM",
    description:
      "Chia một dự án lớn thành các mốc nhỏ đo được và bảo vệ thời gian tập trung của bạn. Áp dụng Pomodoro cùng bảng tiến độ để nhóm luôn biết mình đang ở đâu trên chặng đường.",
    status: "READY",
    isApproved: true,
    steam: ["E", "M"],
    category: "Kỹ thuật dự án",
    emoji: "⏱️",
    duration: "1 giờ",
    xpReward: 60,
    accent: "amber",
    hero: "Một dự án trễ hạn hiếm khi trễ vì một cú sốc lớn — nó trễ vì mỗi ngày trễ một chút.",
    objectives: [
      "Chia dự án thành các mốc (milestone) có thể kiểm chứng",
      "Vận hành chu kỳ Pomodoro để tập trung sâu khi làm thí nghiệm hoặc viết code",
      "Ước lượng thời gian và theo dõi tiến độ bằng bảng công việc",
    ],
    sections: [
      {
        heading: "Chia nhỏ dự án thành mốc kiểm chứng được",
        body:
          "'Làm mô hình nhà thông minh' là một mục tiêu quá lớn để bắt đầu. Hãy chia thành các mốc có thể tick xong: vẽ sơ đồ mạch → lắp mạch đèn → viết code cảm biến → ghép vỏ mô hình → chạy thử 10 lần. Mỗi mốc phải có tiêu chí 'hoàn thành' rõ ràng, nếu không bạn sẽ mãi cảm thấy dự án còn dang dở.",
        tips: [
          "Mốc tốt là mốc trả lời được câu hỏi 'làm sao biết đã xong?'",
          "Mỗi mốc nên gói gọn trong 1-2 buổi làm việc",
        ],
      },
      {
        heading: "Kỹ thuật Pomodoro cho công việc cần tập trung sâu",
        body:
          "Lắp mạch, gỡ lỗi chương trình hay xử lý số liệu đều đòi hỏi tập trung liên tục — một lần bị ngắt quãng có thể khiến bạn mất 15 phút mới lấy lại mạch suy nghĩ. Làm 25 phút, nghỉ 5 phút là một 'pomodoro'; sau 4 chu kỳ nghỉ dài 15-30 phút. Chu kỳ ngắn giúp giữ sự tập trung mà không kiệt sức.",
        tips: [
          "Tắt thông báo và úp điện thoại trong 25 phút",
          "Ghi lại số pomodoro cho mỗi mốc để lần sau ước lượng chuẩn hơn",
        ],
      },
      {
        heading: "Ước lượng và bám tiến độ",
        body:
          "Người mới thường ước lượng thời gian lạc quan gấp 2-3 lần thực tế, nhất là với phần gỡ lỗi. Hãy ghi lại thời gian thực tế của vài mốc đầu rồi dùng số đó để hiệu chỉnh phần còn lại. Một bảng công việc đơn giản với ba cột 'Cần làm - Đang làm - Xong' đủ để cả nhóm nhìn ra ai đang tắc ở đâu.",
        tips: [
          "Luôn cộng thêm quỹ thời gian dự phòng cho khâu thử nghiệm",
          "Cập nhật bảng công việc cuối mỗi buổi, đừng để dồn",
        ],
      },
    ],
    keyTakeaways: [
      "Mốc phải có tiêu chí 'hoàn thành' kiểm chứng được",
      "Chu kỳ 25/5 bảo vệ sự tập trung khi gỡ lỗi",
      "Ghi thời gian thực tế để ước lượng ngày càng chuẩn",
    ],
    practice: {
      title: "Lập kế hoạch cho một dự án",
      steps: [
        "Chọn một dự án đang làm và chia thành 5-7 mốc có tiêu chí hoàn thành",
        "Ước lượng số pomodoro cho từng mốc",
        "Làm ít nhất 4 pomodoro và so sánh thời gian thực tế với ước lượng",
      ],
    },
    quiz: {
      question: "Một mốc (milestone) tốt trong dự án STEAM cần có đặc điểm gì?",
      options: [
        "Càng lớn càng tốt để ít phải theo dõi",
        "Có tiêu chí 'hoàn thành' rõ ràng, kiểm chứng được",
        "Không cần ước lượng thời gian",
        "Chỉ nhóm trưởng mới cần biết",
      ],
      answerIndex: 1,
      explanation:
        "Nếu không trả lời được 'làm sao biết đã xong?', bạn sẽ không đo được tiến độ. Tiêu chí hoàn thành rõ ràng là điều làm nên một mốc hữu ích.",
    },
  },
  {
    id: "NODE_03",
    nodeCode: "NODE 03 - TƯ DUY PHẢN BIỆN",
    title: "Tư duy phản biện & Phương pháp khoa học",
    description:
      "Phân biệt bằng chứng với suy đoán và nhận diện các thiên kiến khiến ta kết luận vội. Nắm quy trình khoa học từ đặt giả thuyết đến kiểm chứng để giải quyết vấn đề bài bản.",
    status: "READY",
    isApproved: true,
    steam: ["S", "M"],
    category: "Tư duy",
    emoji: "🧠",
    duration: "1.5 giờ",
    xpReward: 100,
    accent: "green",
    hero: "Người tư duy phản biện không tin điều đầu tiên họ nghe — họ hỏi 'Bằng chứng đâu?'",
    objectives: [
      "Phân biệt sự thật kiểm chứng được, suy luận và ý kiến cá nhân",
      "Nhận diện các thiên kiến nhận thức phổ biến trong nghiên cứu",
      "Áp dụng vòng lặp giả thuyết - thí nghiệm - kết luận",
    ],
    sections: [
      {
        heading: "Đặt câu hỏi đúng trước một thông tin",
        body:
          "Tư duy phản biện bắt đầu bằng việc không chấp nhận thông tin một cách thụ động. Hãy hỏi: nguồn này đáng tin không? Có dữ liệu nào đi kèm không? Cỡ mẫu bao nhiêu? Có góc nhìn nào khác không? Ai được lợi từ kết luận này? Trong khoa học, một câu hỏi tốt có giá trị hơn một câu trả lời nhanh.",
        tips: [
          "Tách 'điều đo được' khỏi 'điều mình suy đoán'",
          "Tìm ít nhất một nguồn nói ngược lại trước khi tin",
        ],
      },
      {
        heading: "Thiên kiến làm hỏng kết luận",
        body:
          "Não bộ hay đi đường tắt. Thiên kiến xác nhận khiến ta chỉ ghi nhận những lần thí nghiệm ra kết quả như mong đợi và bỏ qua các lần 'bất thường'. Hiệu ứng mỏ neo khiến số đo đầu tiên chi phối cả loạt đo sau. Biết tên các thiên kiến này giúp bạn kịp nhận ra và tự điều chỉnh.",
        tips: [
          "Ghi lại mọi lần đo, kể cả lần trái với kỳ vọng",
          "Trước khi kết luận, hỏi 'Tôi có đang chỉ tìm thứ mình muốn tin?'",
        ],
      },
      {
        heading: "Vòng lặp khoa học 5 bước",
        body:
          "1) Quan sát và nêu câu hỏi. 2) Đặt giả thuyết có thể sai (tức là kiểm chứng được). 3) Thiết kế thí nghiệm với biến kiểm soát. 4) Thu thập và phân tích dữ liệu. 5) Kết luận — và nếu giả thuyết sai, đó vẫn là một kết quả có giá trị. Quy trình này cũng chính là cách gỡ lỗi một chương trình hay tìm nguyên nhân một mô hình không chạy.",
        tips: [
          "Dùng kỹ thuật '5 Whys' để truy về nguyên nhân gốc",
          "Mỗi lần chỉ thay đổi một biến, nếu không sẽ không biết cái gì gây ra kết quả",
        ],
      },
    ],
    keyTakeaways: [
      "Câu hỏi tốt quan trọng hơn câu trả lời nhanh",
      "Ghi cả dữ liệu trái kỳ vọng để tránh thiên kiến xác nhận",
      "Mỗi lần chỉ đổi một biến khi thí nghiệm",
    ],
    practice: {
      title: "Giải mã một vấn đề thực tế",
      steps: [
        "Chọn một hiện tượng bạn tò mò và viết giả thuyết bằng 1 câu kiểm chứng được",
        "Thiết kế cách kiểm chứng, chỉ ra rõ biến thay đổi và biến giữ nguyên",
        "Dùng '5 Whys' để truy nguyên nhân gốc của một lỗi bạn từng gặp",
      ],
    },
    quiz: {
      question: "Vì sao khi thí nghiệm chỉ nên thay đổi một biến mỗi lần?",
      options: [
        "Để thí nghiệm diễn ra nhanh hơn",
        "Để biết chắc yếu tố nào đã gây ra thay đổi trong kết quả",
        "Để tiết kiệm dụng cụ thí nghiệm",
        "Vì sách giáo khoa quy định như vậy",
      ],
      answerIndex: 1,
      explanation:
        "Nếu đổi nhiều biến cùng lúc, bạn không thể quy kết kết quả cho biến nào. Kiểm soát biến là điều làm nên giá trị của một thí nghiệm.",
    },
  },
  {
    id: "NODE_04",
    nodeCode: "NODE 04 - LÀM VIỆC NHÓM",
    title: "Làm việc nhóm trong dự án STEAM",
    description:
      "Phân vai rõ ràng theo thế mạnh từng người và giữ cho cả nhóm cùng nhìn về một mục tiêu. Học cách phản hồi xây dựng và xử lý bất đồng kỹ thuật mà không làm rạn nứt quan hệ.",
    status: "READY",
    isApproved: true,
    steam: ["E", "A"],
    category: "Cộng tác",
    emoji: "🤝",
    duration: "1 giờ",
    xpReward: 70,
    accent: "amber",
    hero: "Một nhóm mạnh không phải nơi không có tranh luận, mà là nơi tranh luận về ý tưởng chứ không về con người.",
    objectives: [
      "Phân vai trong nhóm dự án theo thế mạnh STEAM của từng thành viên",
      "Đưa phản hồi kỹ thuật mang tính xây dựng theo mô hình SBI",
      "Xử lý bất đồng về phương án bằng dữ liệu thay vì cảm tính",
    ],
    sections: [
      {
        heading: "Phân vai theo thế mạnh",
        body:
          "Một dự án STEAM cần nhiều loại năng lực khác nhau: người giỏi lập trình (T), người khéo tay lắp ráp (E), người phân tích số liệu (M), người thiết kế hình ảnh và thuyết trình (A). Phân vai theo thế mạnh giúp mỗi người tỏa sáng, nhưng hãy luân phiên để ai cũng được chạm vào các mảng khác. Quan trọng nhất: viết rõ ai chịu trách nhiệm phần nào.",
        tips: [
          "Thống nhất mục tiêu và tiêu chí 'hoàn thành' ngay buổi đầu",
          "Mỗi phần việc phải có đúng một người chịu trách nhiệm chính",
        ],
      },
      {
        heading: "Phản hồi xây dựng theo mô hình SBI",
        body:
          "Phản hồi tốt nhắm vào việc, không nhắm vào người. Dùng SBI: Tình huống (Situation) - Hành vi (Behavior) - Tác động (Impact). Ví dụ: 'Ở buổi chạy thử hôm qua, phần code cảm biến chưa đẩy lên kho chung, nên nhóm không ghép được mô hình'. Cụ thể và không quy chụp giúp người nghe sửa được thay vì phòng thủ.",
        tips: [
          "Khen công khai, góp ý riêng tư",
          "Kết thúc bằng một đề xuất cải thiện cụ thể",
        ],
      },
      {
        heading: "Bất đồng kỹ thuật: để dữ liệu phân xử",
        body:
          "Khi hai bạn tranh cãi nên dùng cảm biến A hay B, cách nhanh nhất không phải là ai nói to hơn mà là đặt tiêu chí (độ chính xác, giá, độ khó lắp) rồi thử cả hai trên một mẫu nhỏ. Biến cuộc tranh luận thành một thí nghiệm nhỏ vừa giải quyết được bất đồng, vừa cho cả nhóm học được điều mới.",
        tips: [
          "Thống nhất tiêu chí đánh giá trước khi tranh luận phương án",
          "Tách vấn đề khỏi con người: 'phương án này' chứ không phải 'cậu sai'",
        ],
      },
    ],
    keyTakeaways: [
      "Mỗi phần việc có đúng một người chịu trách nhiệm chính",
      "Phản hồi vào hành vi cụ thể, dùng mô hình SBI",
      "Biến bất đồng kỹ thuật thành một phép thử nhỏ",
    ],
    practice: {
      title: "Rèn kỹ năng cộng tác",
      steps: [
        "Với dự án nhóm gần nhất, viết ra vai trò và phần việc của từng người",
        "Đưa một phản hồi cho đồng đội theo mô hình SBI",
        "Chọn một bất đồng đang có và đặt ra 3 tiêu chí để so sánh phương án",
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
    nodeCode: "NODE 05 - THUYẾT TRÌNH KHOA HỌC",
    title: "Thuyết trình & bảo vệ dự án khoa học",
    description:
      "Cấu trúc một bài báo cáo dự án mạch lạc từ vấn đề đến kết quả và dùng poster, biểu đồ hợp lý. Tự tin trả lời câu hỏi phản biện của ban giám khảo mà không mất bình tĩnh.",
    status: "READY",
    isApproved: true,
    steam: ["A", "S"],
    category: "Trình bày",
    emoji: "🎤",
    duration: "1.5 giờ",
    xpReward: 100,
    accent: "violet",
    hero: "Ban giám khảo sẽ quên slide của bạn, nhưng nhớ cách bạn trả lời câu hỏi khó.",
    objectives: [
      "Cấu trúc bài báo cáo dự án theo mạch vấn đề - giải pháp - kết quả",
      "Thiết kế poster và biểu đồ làm nổi bật dữ liệu thay vì che lấp nó",
      "Bình tĩnh xử lý câu hỏi phản biện, kể cả khi bị chỉ ra điểm yếu",
    ],
    sections: [
      {
        heading: "Mạch của một bài báo cáo dự án",
        body:
          "Bài trình bày dự án STEAM có mạch khá cố định: Vấn đề thực tế bạn muốn giải quyết → Giải pháp và nguyên lý hoạt động → Cách bạn kiểm chứng → Kết quả và số liệu → Hạn chế và hướng phát triển. Đừng bỏ phần hạn chế: người đánh giá luôn ấn tượng với nhóm biết rõ điểm yếu của mình hơn là nhóm nói mọi thứ đều hoàn hảo.",
        tips: [
          "Mở đầu bằng vấn đề thực tế, đừng mở bằng công nghệ",
          "Giới hạn 3 ý chính — nhiều hơn khán giả sẽ không nhớ",
        ],
      },
      {
        heading: "Poster và biểu đồ nói thay bạn",
        body:
          "Slide dày đặc chữ khiến khán giả đọc thay vì nghe. Với dự án khoa học, một biểu đồ đúng loại có sức thuyết phục hơn cả đoạn văn: dùng biểu đồ cột để so sánh, đường để thể hiện xu hướng theo thời gian. Luôn ghi rõ đơn vị và số lần đo — thiếu hai thứ đó, dữ liệu của bạn sẽ bị nghi ngờ ngay.",
        tips: [
          "Mỗi slide một thông điệp, cỡ chữ tối thiểu đọc được từ cuối phòng",
          "Ghi rõ đơn vị, cỡ mẫu và sai số trên mọi biểu đồ",
        ],
      },
      {
        heading: "Trả lời câu hỏi phản biện",
        body:
          "Câu hỏi khó không phải là đòn tấn công mà là dấu hiệu ban giám khảo đang quan tâm. Hãy nghe hết câu hỏi, nhắc lại để chắc mình hiểu đúng, rồi trả lời thẳng vào trọng tâm. Nếu không biết, câu trả lời tốt nhất là 'Nhóm em chưa kiểm chứng phần đó, đây là cách em sẽ làm để tìm hiểu' — trung thực luôn ghi điểm hơn là đoán bừa.",
        tips: [
          "Luyện thành tiếng ít nhất 3 lần và tự bấm giờ",
          "Chuẩn bị trước câu trả lời cho 3 điểm yếu rõ nhất của dự án",
        ],
      },
    ],
    keyTakeaways: [
      "Mở bằng vấn đề thực tế, kết bằng hạn chế và hướng phát triển",
      "Biểu đồ phải ghi rõ đơn vị và cỡ mẫu",
      "Không biết thì nói không biết, kèm cách bạn sẽ tìm hiểu",
    ],
    practice: {
      title: "Chuẩn bị bài bảo vệ 3 phút",
      steps: [
        "Viết mạch vấn đề - giải pháp - kiểm chứng - kết quả - hạn chế cho dự án của bạn",
        "Chọn đúng một biểu đồ thể hiện kết quả chính và ghi đủ đơn vị, cỡ mẫu",
        "Nhờ bạn đặt 3 câu hỏi phản biện khó nhất và tập trả lời",
      ],
    },
    quiz: {
      question: "Khi bị hỏi một điều bạn chưa kiểm chứng, cách trả lời tốt nhất là gì?",
      options: [
        "Đoán một câu trả lời nghe có vẻ hợp lý",
        "Nói thẳng là chưa kiểm chứng và nêu cách bạn sẽ tìm hiểu",
        "Lảng sang một kết quả khác của dự án",
        "Nói rằng câu hỏi đó nằm ngoài phạm vi",
      ],
      answerIndex: 1,
      explanation:
        "Trung thực về giới hạn của nghiên cứu là một phẩm chất khoa học. Nêu kèm hướng kiểm chứng cho thấy bạn hiểu vấn đề chứ không né tránh.",
    },
  },
  {
    id: "NODE_06",
    nodeCode: "NODE 06 - TỰ HỌC STEAM",
    title: "Kỹ năng tự học & Tư duy phát triển",
    description:
      "Áp dụng active recall và spaced repetition để nhớ công thức, khái niệm lâu dài. Rèn tư duy phát triển để không bỏ cuộc khi gặp bài toán hay đoạn code khó.",
    status: "READY",
    isApproved: true,
    steam: ["S", "T"],
    category: "Phát triển",
    emoji: "📚",
    duration: "1 giờ",
    xpReward: 70,
    accent: "green",
    hero: "Trong lĩnh vực công nghệ thay đổi từng năm, khả năng tự học chính là siêu năng lực bền nhất.",
    objectives: [
      "Áp dụng các kỹ thuật học tập hiệu quả có cơ sở khoa học",
      "Dùng kỹ thuật Feynman để phát hiện lỗ hổng kiến thức",
      "Nuôi dưỡng tư duy phát triển khi gặp bài khó",
    ],
    sections: [
      {
        heading: "Học đúng cách, không chỉ học chăm",
        body:
          "Đọc lại nhiều lần là cách học kém hiệu quả nhất — nó tạo cảm giác quen thuộc chứ không tạo trí nhớ. Thay vào đó, hãy dùng 'active recall' (gấp sách lại và tự viết ra những gì nhớ được) và 'spaced repetition' (ôn lại theo khoảng cách tăng dần). Với môn Toán và Khoa học, tự giải lại bài mà không nhìn lời giải là dạng active recall mạnh nhất.",
        tips: [
          "Sau khi học, gấp sách và tự viết lại sơ đồ khái niệm",
          "Ôn lại sau 1 ngày, 3 ngày, 1 tuần, 1 tháng",
        ],
      },
      {
        heading: "Kỹ thuật Feynman",
        body:
          "Muốn biết mình hiểu sâu tới đâu, hãy thử giải thích khái niệm bằng ngôn ngữ đơn giản như đang dạy một em nhỏ. Chỗ nào bạn phải viện đến thuật ngữ hoặc nói vòng vo — chính chỗ đó là lỗ hổng. Quay lại tài liệu lấp đúng lỗ hổng ấy rồi giải thích lại. Dạy lại là cách học nhanh nhất.",
        tips: [
          "Giải thích khái niệm mới cho bạn cùng lớp hoặc viết ra giấy",
          "Tránh dùng thuật ngữ phức tạp để che chỗ chưa hiểu",
        ],
      },
      {
        heading: "Tư duy phát triển khi gặp bài khó",
        body:
          "Người có tư duy phát triển tin rằng năng lực rèn được, nên họ xem một bài toán chưa giải được là 'chưa giải được' chứ không phải 'mình dốt'. Trong lập trình, mỗi lỗi báo đỏ là một manh mối chứ không phải một lời phán xét. Thái độ 'tôi chưa biết, nhưng tôi có thể học' quan trọng hơn bất kỳ kiến thức cố định nào.",
        tips: [
          "Thêm chữ 'chưa' vào suy nghĩ: 'Mình chưa làm được điều này'",
          "Đọc kỹ thông báo lỗi — nó thường nói đúng chỗ sai",
        ],
      },
    ],
    keyTakeaways: [
      "Active recall và spaced repetition giúp nhớ lâu",
      "Dạy lại (Feynman) là cách phát hiện lỗ hổng nhanh nhất",
      "Thêm chữ 'chưa' để biến thất bại thành bước trung gian",
    ],
    practice: {
      title: "Nâng cấp cách học",
      steps: [
        "Học một chủ đề mới rồi tự viết lại sơ đồ mà không nhìn tài liệu",
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
        "Chép lại nguyên văn bài giảng",
      ],
      answerIndex: 1,
      explanation:
        "Active recall là chủ động truy xuất kiến thức từ trí nhớ thay vì đọc lại thụ động — phương pháp được chứng minh giúp ghi nhớ lâu hơn nhiều lần.",
    },
  },
  {
    id: "NODE_07",
    nodeCode: "NODE 07 - TƯ DUY THIẾT KẾ",
    title: "Tư duy thiết kế (Design Thinking)",
    description:
      "Đi từ nhu cầu thật của người dùng đến nguyên mẫu chạy được qua 5 bước Design Thinking. Học cách làm prototype nhanh, rẻ để thử ý tưởng trước khi đầu tư công sức lớn.",
    status: "READY",
    isApproved: true,
    steam: ["E", "A"],
    category: "Thiết kế",
    emoji: "💡",
    duration: "1.5 giờ",
    xpReward: 90,
    accent: "amber",
    hero: "Đừng yêu giải pháp đầu tiên của bạn — hãy yêu vấn đề bạn đang giải.",
    objectives: [
      "Vận dụng 5 bước: Thấu cảm - Xác định - Lên ý tưởng - Nguyên mẫu - Kiểm thử",
      "Phỏng vấn người dùng để tìm nhu cầu thật thay vì nhu cầu giả định",
      "Dựng prototype nhanh bằng vật liệu rẻ để thử ý tưởng sớm",
    ],
    sections: [
      {
        heading: "Thấu cảm & xác định đúng vấn đề",
        body:
          "Rất nhiều dự án thất bại vì giải một vấn đề không ai có. Hãy bắt đầu bằng quan sát và phỏng vấn người sẽ dùng sản phẩm: họ đang khó khăn ở đâu, họ đang xoay xở thế nào? Sau đó viết vấn đề thành một câu chuẩn: '[Người dùng] cần [nhu cầu] bởi vì [lý do]'. Câu này sẽ là kim chỉ nam cho cả dự án.",
        tips: [
          "Hỏi về hành vi đã xảy ra, đừng hỏi 'bạn có thích không'",
          "Viết lại câu vấn đề khi phát hiện hiểu sai — điều đó là bình thường",
        ],
      },
      {
        heading: "Lên ý tưởng: số lượng trước, chất lượng sau",
        body:
          "Ở bước brainstorm, mục tiêu là số lượng. Đặt luật: không phê bình trong lúc nghĩ, ý tưởng lạ được hoan nghênh, xây tiếp lên ý người khác. Sau khi có 20-30 ý, mới bắt đầu sàng lọc theo tiêu chí: tính khả thi, chi phí, thời gian, mức độ giải quyết đúng vấn đề.",
        tips: [
          "Đặt hẹn giờ 10 phút để ép ra nhiều ý",
          "Mỗi người viết ý riêng trước rồi mới chia sẻ, tránh bị ý người nói trước dẫn dắt",
        ],
      },
      {
        heading: "Nguyên mẫu nhanh & kiểm thử",
        body:
          "Prototype không cần đẹp — nó cần trả lời được một câu hỏi. Bìa carton, ống hút, giấy vẽ giao diện đều là prototype hợp lệ. Mục tiêu là đưa cho người dùng thử càng sớm càng tốt để phát hiện sai lầm khi sửa còn rẻ. Thất bại ở bước prototype là thành công, vì bạn vừa tiết kiệm được hàng tuần công sức.",
        tips: [
          "Hỏi 'prototype này cần trả lời câu hỏi gì?' trước khi làm",
          "Quan sát người dùng thao tác, đừng hướng dẫn họ",
        ],
      },
    ],
    keyTakeaways: [
      "Xác định đúng vấn đề quan trọng hơn nghĩ ra giải pháp hay",
      "Brainstorm ưu tiên số lượng, sàng lọc để sau",
      "Prototype rẻ và xấu vẫn tốt hơn ý tưởng chỉ nằm trên giấy",
    ],
    practice: {
      title: "Chạy một vòng Design Thinking",
      steps: [
        "Phỏng vấn 3 người về một khó khăn trong lớp học và viết câu vấn đề",
        "Brainstorm 20 ý tưởng trong 10 phút rồi chọn ra 2 ý khả thi nhất",
        "Dựng prototype giấy/carton trong 30 phút và cho 2 người thử",
      ],
    },
    quiz: {
      question: "Mục đích chính của việc làm prototype nhanh và rẻ là gì?",
      options: [
        "Để sản phẩm trông chuyên nghiệp ngay từ đầu",
        "Để phát hiện sai lầm sớm khi chi phí sửa còn thấp",
        "Để tiết kiệm thời gian phỏng vấn người dùng",
        "Để thay thế hoàn toàn bước kiểm thử",
      ],
      answerIndex: 1,
      explanation:
        "Prototype tồn tại để học nhanh. Phát hiện ý tưởng sai khi mới tốn vài tờ bìa sẽ rẻ hơn rất nhiều so với khi đã dựng xong sản phẩm hoàn chỉnh.",
    },
  },
  {
    id: "NODE_08",
    nodeCode: "NODE 08 - TƯ DUY MÁY TÍNH",
    title: "Tư duy máy tính (Computational Thinking)",
    description:
      "Bốn trụ cột giúp bạn nghĩ như một lập trình viên: chia nhỏ, nhận mẫu, trừu tượng hóa và thuật toán. Áp dụng được cả khi không ngồi trước máy tính.",
    status: "READY",
    isApproved: true,
    steam: ["T", "M"],
    category: "Công nghệ",
    emoji: "🧩",
    duration: "1.5 giờ",
    xpReward: 90,
    accent: "sky",
    hero: "Tư duy máy tính không phải là biết code — đó là biết chia một vấn đề rối thành các bước máy có thể làm.",
    objectives: [
      "Chia nhỏ (decomposition) một vấn đề lớn thành các phần xử lý được",
      "Nhận diện mẫu lặp lại và trừu tượng hóa thành quy tắc chung",
      "Viết thuật toán dạng các bước rõ ràng, không mơ hồ",
    ],
    sections: [
      {
        heading: "Chia nhỏ & nhận mẫu",
        body:
          "Trước một bài toán lớn, hãy hỏi 'vấn đề này gồm những phần nào?'. Làm game rắn săn mồi = vẽ khung + di chuyển rắn + sinh mồi + kiểm tra va chạm + tính điểm. Khi đã chia nhỏ, bạn sẽ thấy nhiều phần lặp lại mẫu giống nhau (kiểm tra va chạm với tường và với thân rắn thực chất cùng một dạng) — nhận ra mẫu giúp bạn viết một lần dùng nhiều nơi.",
        tips: [
          "Chia đến khi mỗi phần có thể mô tả trong một câu",
          "Thấy mình copy-paste lần thứ ba thì đó là dấu hiệu của một mẫu",
        ],
      },
      {
        heading: "Trừu tượng hóa: giữ cái cần, bỏ cái nhiễu",
        body:
          "Bản đồ tàu điện không vẽ đúng khoảng cách thật, vì hành khách chỉ cần biết thứ tự ga và điểm chuyển tuyến. Đó là trừu tượng hóa: giữ lại thông tin phục vụ mục tiêu, lược bỏ phần còn lại. Trong lập trình, đặt tên hàm `tinhDiem()` cho phép bạn dùng nó mà không cần nhớ bên trong có gì.",
        tips: [
          "Hỏi 'thông tin này có ảnh hưởng tới kết quả không?' — không thì bỏ",
          "Một hàm tốt là hàm bạn dùng được mà không cần đọc ruột của nó",
        ],
      },
      {
        heading: "Thuật toán: viết các bước không thể hiểu nhầm",
        body:
          "Máy tính làm đúng những gì bạn viết, không phải điều bạn định nói. Hãy viết thuật toán dưới dạng các bước tuần tự, có điều kiện và vòng lặp rõ ràng, rồi thử 'chạy bằng tay' với một ví dụ cụ thể. Đừng quên các trường hợp biên: danh sách rỗng, số âm, người dùng nhập chữ thay vì số.",
        tips: [
          "Chạy thuật toán bằng tay trên giấy trước khi gõ code",
          "Luôn nghĩ trước 3 trường hợp biên dễ làm chương trình vỡ",
        ],
      },
    ],
    keyTakeaways: [
      "Chia nhỏ đến khi mỗi phần mô tả được trong một câu",
      "Trừu tượng hóa là giữ cái cần cho mục tiêu, bỏ phần nhiễu",
      "Thuật toán phải rõ đến mức không thể hiểu nhầm",
    ],
    practice: {
      title: "Thuật toán hóa việc đời thường",
      steps: [
        "Viết thuật toán pha một cốc trà sữa dưới dạng các bước đánh số",
        "Đưa cho bạn làm theo đúng từng chữ và ghi lại chỗ bị hiểu nhầm",
        "Chia một bài tập lập trình đang làm thành 4-6 phần nhỏ độc lập",
      ],
    },
    quiz: {
      question: "Trừu tượng hóa (abstraction) trong tư duy máy tính nghĩa là gì?",
      options: [
        "Làm cho vấn đề trở nên khó hiểu hơn",
        "Giữ lại thông tin cần cho mục tiêu và lược bỏ chi tiết gây nhiễu",
        "Viết chương trình càng ngắn càng tốt",
        "Chia bài toán thành nhiều phần nhỏ",
      ],
      answerIndex: 1,
      explanation:
        "Trừu tượng hóa là lược bỏ chi tiết không ảnh hưởng tới mục tiêu — như bản đồ tàu điện bỏ khoảng cách thật để làm nổi thứ tự ga. Chia nhỏ là một trụ cột khác (decomposition).",
    },
  },
  {
    id: "NODE_09",
    nodeCode: "NODE 09 - ĐỌC HIỂU DỮ LIỆU",
    title: "Đọc hiểu dữ liệu & Trực quan hóa",
    description:
      "Đọc được câu chuyện đằng sau một bảng số và chọn đúng loại biểu đồ để kể lại nó. Nhận diện các thủ thuật biểu đồ gây hiểu lầm thường gặp trên mạng.",
    status: "READY",
    isApproved: true,
    steam: ["M", "T"],
    category: "Dữ liệu",
    emoji: "📊",
    duration: "1 giờ",
    xpReward: 80,
    accent: "rose",
    hero: "Số liệu không tự nói dối — nhưng một biểu đồ cắt trục thì có thể.",
    objectives: [
      "Đọc và tóm tắt một tập dữ liệu bằng trung bình, trung vị và khoảng biến thiên",
      "Chọn đúng loại biểu đồ cho từng câu hỏi cần trả lời",
      "Nhận diện biểu đồ gây hiểu lầm và tương quan giả",
    ],
    sections: [
      {
        heading: "Tóm tắt một tập số liệu",
        body:
          "Trước khi vẽ gì, hãy tóm tắt: bao nhiêu số đo, giá trị nhỏ nhất và lớn nhất, trung bình và trung vị. Khi trung bình lệch xa trung vị, thường có giá trị ngoại lai kéo lệch — ví dụ một lần đo hỏng. Đừng vội xóa ngoại lai; hãy tìm hiểu vì sao nó xuất hiện, đôi khi đó mới là phát hiện thú vị nhất.",
        tips: [
          "Luôn ghi số lần đo cùng với kết quả trung bình",
          "Trung vị đáng tin hơn trung bình khi có giá trị ngoại lai",
        ],
      },
      {
        heading: "Chọn đúng loại biểu đồ",
        body:
          "Mỗi loại biểu đồ trả lời một kiểu câu hỏi. So sánh giữa các nhóm → biểu đồ cột. Xu hướng theo thời gian → biểu đồ đường. Quan hệ giữa hai đại lượng → biểu đồ phân tán. Tỷ lệ thành phần → biểu đồ tròn, và chỉ khi có ít hơn 5 phần. Chọn sai loại biểu đồ khiến người xem phải làm việc thay bạn.",
        tips: [
          "Hỏi 'biểu đồ này trả lời câu hỏi gì?' trước khi vẽ",
          "Đặt tiêu đề biểu đồ là chính kết luận bạn muốn người xem thấy",
        ],
      },
      {
        heading: "Biểu đồ gây hiểu lầm",
        body:
          "Trục tung không bắt đầu từ 0 làm chênh lệch nhỏ trông như khổng lồ. Đổi tỷ lệ trục hoành làm một xu hướng đi ngang trông như dốc đứng. Và quan trọng nhất: tương quan không phải nhân quả — doanh số kem và số vụ cháy nắng cùng tăng vào mùa hè, nhưng ăn kem không gây cháy nắng. Luôn hỏi liệu có yếu tố thứ ba nào không.",
        tips: [
          "Kiểm tra trục tung có bắt đầu từ 0 không",
          "Trước khi kết luận nhân quả, tìm biến thứ ba có thể gây ra cả hai",
        ],
      },
    ],
    keyTakeaways: [
      "Tóm tắt dữ liệu trước khi vẽ biểu đồ",
      "Loại biểu đồ phải khớp với câu hỏi cần trả lời",
      "Tương quan không đồng nghĩa với nhân quả",
    ],
    practice: {
      title: "Đọc vị một biểu đồ",
      steps: [
        "Lấy số liệu một thí nghiệm của bạn và tính trung bình, trung vị, khoảng biến thiên",
        "Vẽ hai loại biểu đồ khác nhau cho cùng dữ liệu và so sánh cái nào rõ hơn",
        "Tìm một biểu đồ trên mạng và chỉ ra một điểm có thể gây hiểu lầm",
      ],
    },
    quiz: {
      question: "Doanh số kem và số vụ cháy nắng đều tăng vào mùa hè. Kết luận nào đúng?",
      options: [
        "Ăn kem gây cháy nắng",
        "Hai đại lượng tương quan nhưng có thể do một yếu tố thứ ba là thời tiết nắng nóng",
        "Cháy nắng khiến người ta mua kem nhiều hơn",
        "Dữ liệu này chắc chắn bị sai",
      ],
      answerIndex: 1,
      explanation:
        "Đây là ví dụ kinh điển về tương quan không phải nhân quả: nhiệt độ cao là biến thứ ba gây ra cả hai hiện tượng.",
    },
  },
  {
    id: "NODE_10",
    nodeCode: "NODE 10 - ĐẠO ĐỨC SỐ & AI",
    title: "Dùng AI có trách nhiệm & An toàn số",
    description:
      "Dùng AI như một trợ lý học tập mà không đánh mất năng lực tư duy của chính mình. Biết kiểm chứng thông tin, bảo vệ dữ liệu cá nhân và trích dẫn nguồn trung thực.",
    status: "READY",
    isApproved: true,
    steam: ["T", "S"],
    category: "Công dân số",
    emoji: "🛡️",
    duration: "1 giờ",
    xpReward: 80,
    accent: "sky",
    hero: "AI có thể viết hộ bạn một đoạn văn, nhưng không thể học hộ bạn.",
    objectives: [
      "Dùng AI để hỗ trợ tư duy thay vì thay thế tư duy",
      "Kiểm chứng thông tin AI đưa ra và nhận diện thông tin bịa",
      "Bảo vệ dữ liệu cá nhân và trích dẫn nguồn trung thực",
    ],
    sections: [
      {
        heading: "AI là trợ lý, không phải người làm hộ",
        body:
          "Nhờ AI giải thích một khái niệm khó, gợi ý hướng tiếp cận hay chỉ ra lỗi trong lập luận của bạn — đó là dùng đúng. Chép nguyên đáp án AI đưa ra để nộp — đó là tự lấy đi cơ hội học của chính mình, và thường lộ ra ngay khi bị hỏi lại. Nguyên tắc đơn giản: bạn phải giải thích được mọi dòng trong bài nộp của mình.",
        tips: [
          "Hỏi AI 'vì sao' thay vì chỉ hỏi 'đáp án là gì'",
          "Nếu không giải thích được phần AI viết, đừng đưa vào bài",
        ],
      },
      {
        heading: "Kiểm chứng: AI có thể bịa rất trôi chảy",
        body:
          "Mô hình ngôn ngữ tạo ra câu chữ nghe hợp lý, nhưng không đảm bảo đúng sự thật — nó có thể bịa ra số liệu, tên tác giả hay công thức với giọng điệu rất tự tin. Với mọi con số, ngày tháng, trích dẫn hay công thức, hãy đối chiếu với ít nhất một nguồn đáng tin trước khi dùng.",
        tips: [
          "Luôn kiểm chứng số liệu và trích dẫn ở nguồn gốc",
          "Cảnh giác nhất khi câu trả lời khớp hoàn hảo với điều bạn muốn nghe",
        ],
      },
      {
        heading: "Dữ liệu cá nhân & sự trung thực",
        body:
          "Đừng dán thông tin cá nhân của bạn hay của người khác (số điện thoại, địa chỉ, ảnh bạn bè, bài làm chưa xin phép) vào công cụ trên mạng. Khi dùng AI hoặc tài liệu tham khảo trong dự án, hãy ghi rõ ở phần nguồn: bạn đã dùng công cụ gì, cho phần việc nào. Sự minh bạch này chính là điều ban giám khảo đánh giá cao.",
        tips: [
          "Không chia sẻ dữ liệu cá nhân của người khác khi chưa được phép",
          "Ghi rõ trong báo cáo phần nào có sự hỗ trợ của AI",
        ],
      },
    ],
    keyTakeaways: [
      "Bạn phải giải thích được mọi dòng trong bài nộp của mình",
      "AI có thể bịa rất trôi chảy — luôn kiểm chứng số liệu và trích dẫn",
      "Minh bạch về công cụ đã dùng là một điểm cộng, không phải điểm trừ",
    ],
    practice: {
      title: "Dùng AI đúng cách trong một bài tập",
      steps: [
        "Nhờ AI giải thích một khái niệm khó rồi tự viết lại bằng lời của bạn",
        "Chọn 3 con số hoặc trích dẫn AI đưa ra và kiểm chứng ở nguồn gốc",
        "Viết một đoạn ghi nguồn nêu rõ AI đã hỗ trợ phần nào trong bài",
      ],
    },
    quiz: {
      question: "Vì sao phải kiểm chứng số liệu do AI cung cấp?",
      options: [
        "Vì AI luôn cố tình đưa thông tin sai",
        "Vì AI tạo câu chữ nghe hợp lý nhưng có thể bịa số liệu, trích dẫn",
        "Vì AI chỉ biết thông tin trước năm 2000",
        "Vì kiểm chứng là quy định bắt buộc của trường",
      ],
      answerIndex: 1,
      explanation:
        "Mô hình ngôn ngữ tối ưu cho việc tạo văn bản trôi chảy, không đảm bảo tính đúng đắn. Nó có thể bịa số liệu hay trích dẫn với giọng điệu rất tự tin, nên mọi dữ kiện cần đối chiếu nguồn gốc.",
    },
  },
  {
    id: "NODE_11",
    nodeCode: "NODE 11 - KIÊN TRÌ THỰC NGHIỆM",
    title: "Kiên trì & Học từ thất bại trong thí nghiệm",
    description:
      "Giữ bình tĩnh khi thí nghiệm hỏng hoặc chương trình chạy sai lần thứ mười. Biến mỗi lần thất bại thành dữ liệu để lần sau làm tốt hơn thay vì bỏ cuộc.",
    status: "READY",
    isApproved: true,
    steam: ["S", "E"],
    category: "Bản lĩnh",
    emoji: "🔁",
    duration: "1 giờ",
    xpReward: 80,
    accent: "green",
    hero: "Trong nghiên cứu, một thí nghiệm thất bại vẫn là một kết quả — chỉ bỏ cuộc mới là mất trắng.",
    objectives: [
      "Xem kết quả ngoài kỳ vọng là dữ liệu chứ không phải thất bại cá nhân",
      "Gỡ lỗi có hệ thống thay vì thử ngẫu nhiên trong lo lắng",
      "Điều tiết cảm xúc khi bế tắc và biết lúc nào nên dừng để nghỉ",
    ],
    sections: [
      {
        heading: "Thất bại là dữ liệu",
        body:
          "Khi mạch không sáng hay chương trình báo lỗi, phản ứng đầu tiên thường là 'mình dốt quá'. Nhưng trong khoa học, mỗi lần không thành công đều loại trừ được một khả năng — đó chính là tiến bộ. Hãy ghi lại: mình đã thử gì, kết quả ra sao, loại trừ được điều gì. Cuốn nhật ký thất bại này thường có giá trị hơn cả bản báo cáo cuối cùng.",
        tips: [
          "Ghi nhật ký thử nghiệm: đã thử gì - kết quả - loại trừ được gì",
          "Tách 'kết quả này sai' khỏi 'mình kém'",
        ],
      },
      {
        heading: "Gỡ lỗi có hệ thống",
        body:
          "Khi bế tắc, đừng thử lung tung theo cảm tính — bạn sẽ mệt mà không học được gì. Hãy thu hẹp phạm vi bằng cách chia đôi: kiểm tra xem lỗi nằm ở nửa đầu hay nửa sau của hệ thống, rồi lại chia đôi tiếp. Với mạch điện là đo từng đoạn; với chương trình là in giá trị ra ở các điểm giữa. Vài bước chia đôi thường đủ để khoanh vùng chính xác.",
        tips: [
          "Chia đôi phạm vi nghi ngờ thay vì thử ngẫu nhiên",
          "Mỗi lần chỉ thay đổi một thứ rồi thử lại",
        ],
      },
      {
        heading: "Điều tiết cảm xúc khi bế tắc",
        body:
          "Càng bực bội, khả năng nhìn ra lỗi càng giảm — rất nhiều người tìm ra nguyên nhân ngay sau khi rời bàn đi uống nước. Khi thấy mình đọc lại cùng một dòng lần thứ năm mà không hiểu gì, đó là tín hiệu nên dừng 10 phút. Nói ra vấn đề thành lời cho một người bạn (kể cả khi họ không hiểu gì) cũng thường giúp bạn tự phát hiện chỗ sai.",
        tips: [
          "Bế tắc quá 20 phút thì đứng dậy nghỉ 10 phút",
          "Giải thích vấn đề thành tiếng cho người khác nghe",
        ],
      },
    ],
    keyTakeaways: [
      "Mỗi lần thất bại loại trừ được một khả năng — đó là tiến bộ",
      "Gỡ lỗi bằng cách chia đôi phạm vi, không thử ngẫu nhiên",
      "Nghỉ đúng lúc giúp tìm ra lỗi nhanh hơn cố lì",
    ],
    practice: {
      title: "Biến thất bại thành bài học",
      steps: [
        "Chọn một lần thí nghiệm/bài code thất bại và viết lại: đã thử gì, loại trừ được gì",
        "Áp dụng chia đôi phạm vi để khoanh vùng một lỗi đang gặp",
        "Lần tới khi bế tắc quá 20 phút, nghỉ 10 phút rồi ghi lại kết quả sau khi quay lại",
      ],
    },
    quiz: {
      question: "Cách gỡ lỗi có hệ thống hiệu quả nhất khi chưa biết lỗi nằm ở đâu là gì?",
      options: [
        "Thử thay đổi thật nhiều thứ cùng lúc cho nhanh",
        "Chia đôi phạm vi nghi ngờ để khoanh vùng dần",
        "Làm lại toàn bộ từ đầu",
        "Chờ người khác sửa hộ",
      ],
      answerIndex: 1,
      explanation:
        "Chia đôi phạm vi giúp loại trừ một nửa khả năng sau mỗi lần kiểm tra, khoanh vùng lỗi rất nhanh. Thay đổi nhiều thứ cùng lúc khiến bạn không biết điều gì đã tạo ra kết quả.",
    },
  },
];

export function getSoftSkillLesson(id) {
  return SOFT_SKILL_LESSONS.find((lesson) => lesson.id === id) ?? null;
}
