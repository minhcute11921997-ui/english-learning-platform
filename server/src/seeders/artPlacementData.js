/**
 * Bộ câu hỏi kiểm tra năng lực đầu vào (30 Placement Assessment Questions)
 */

const placementQuestionsData = [
  {
    question_text: 'What ___ your name?',
    question_text_vi: 'Tên của bạn là gì?',
    options: ['is', 'are', 'am', 'be'],
    correct_option: 0,
    explanation_vi: '"Your name" là chủ ngữ số ít nên dùng động từ "is".'
  },
  {
    question_text: 'She ___ a doctor at the city hospital.',
    question_text_vi: 'Cô ấy là bác sĩ ở bệnh viện thành phố.',
    options: ['am', 'are', 'is', 'were'],
    correct_option: 2,
    explanation_vi: 'Đại từ nhân xưng "She" ngôi thứ ba số ít đi với động từ to be "is".'
  },
  {
    question_text: 'They ___ in a quiet apartment in Da Nang.',
    question_text_vi: 'Họ sống trong một căn hộ yên tĩnh ở Đà Nẵng.',
    options: ['live', 'lives', 'living', 'is live'],
    correct_option: 0,
    explanation_vi: 'Chủ ngữ "They" số nhiều ở thì hiện tại đơn đi với động từ nguyên thể "live".'
  },
  {
    question_text: 'How many books ___ on the desk?',
    question_text_vi: 'Có bao nhiêu cuốn sách ở trên bàn học?',
    options: ['is there', 'are there', 'there is', 'there are'],
    correct_option: 1,
    explanation_vi: 'Câu hỏi với danh từ đếm được số nhiều "books" đảo cấu trúc thành "are there".'
  },
  {
    question_text: 'I usually get up ___ 6:00 AM every morning.',
    question_text_vi: 'Tôi thường thức dậy vào lúc 6:00 sáng mỗi ngày.',
    options: ['in', 'on', 'at', 'to'],
    correct_option: 2,
    explanation_vi: 'Giới từ chỉ mốc thời gian cụ thể trong ngày là "at".'
  },
  {
    question_text: 'My sister is very ___. She always helps people.',
    question_text_vi: 'Chị gái tôi rất tốt bụng. Chị ấy luôn giúp đỡ mọi người.',
    options: ['lazy', 'kind', 'angry', 'tall'],
    correct_option: 1,
    explanation_vi: '"Kind" mang nghĩa là tốt bụng, phù hợp với ngữ cảnh giúp đỡ người khác.'
  },
  {
    question_text: 'He ___ watch television yesterday evening.',
    question_text_vi: 'Anh ấy đã không xem tivi tối hôm qua.',
    options: ['doesn\'t', 'didn\'t', 'wasn\'t', 'don\'t'],
    correct_option: 1,
    explanation_vi: '"Yesterday" là dấu hiệu thì quá khứ đơn, câu phủ định dùng trợ động từ "didn\'t".'
  },
  {
    question_text: 'This bag is ___ than that one.',
    question_text_vi: 'Chiếc túi này to hơn chiếc túi kia.',
    options: ['big', 'bigger', 'more big', 'biggest'],
    correct_option: 1,
    explanation_vi: 'Cấu trúc so sánh hơn của tính từ ngắn "big" gấp đôi phụ âm thành "bigger than".'
  },
  {
    question_text: 'Listen! The birds ___ in the trees.',
    question_text_vi: 'Hãy lắng nghe kìa! Những chú chim đang hót trên cây.',
    options: ['sing', 'sang', 'are singing', 'were singing'],
    correct_option: 2,
    explanation_vi: '"Listen!" là dấu hiệu hành động đang diễn ra tại thời điểm nói → Hiện tại tiếp diễn "are singing".'
  },
  {
    question_text: 'We went to the beach ___ the weather was sunny.',
    question_text_vi: 'Chúng tôi đi ra bãi biển bởi vì thời tiết đầy nắng.',
    options: ['because', 'although', 'but', 'so that'],
    correct_option: 0,
    explanation_vi: '"Because" (bởi vì) dùng để nối mệnh đề chỉ nguyên nhân cho hành động đi biển.'
  },
  {
    question_text: 'She has studied English ___ three years.',
    question_text_vi: 'Cô ấy đã học tiếng Anh được ba năm rồi.',
    options: ['since', 'for', 'at', 'in'],
    correct_option: 1,
    explanation_vi: 'Trong thì hiện tại hoàn thành, "for" đi với một khoảng thời gian (for three years).'
  },
  {
    question_text: 'If it rains tomorrow, we ___ at home.',
    question_text_vi: 'Nếu ngày mai trời mưa, chúng tôi sẽ ở nhà.',
    options: ['stay', 'will stay', 'stayed', 'would stay'],
    correct_option: 1,
    explanation_vi: 'Câu điều kiện loại 1: If + HTĐ (rains), Mệnh đề chính dùng "will + V" (will stay).'
  },
  {
    question_text: 'You ___ wear a helmet when riding a motorbike.',
    question_text_vi: 'Bạn phải đội mũ bảo hiểm khi đi xe máy.',
    options: ['must', 'might', 'can', 'may'],
    correct_option: 0,
    explanation_vi: '"Must" diễn tả sự bắt buộc, quy định luật pháp.'
  },
  {
    question_text: 'He was tired, ___ he continued working.',
    question_text_vi: 'Anh ấy mệt, nhưng anh ấy vẫn tiếp tục làm việc.',
    options: ['so', 'but', 'and', 'because'],
    correct_option: 1,
    explanation_vi: '"But" diễn tả mối quan hệ tương phản giữa hai mệnh đề.'
  },
  {
    question_text: 'My mother is interested ___ cooking healthy meals.',
    question_text_vi: 'Mẹ tôi rất thích việc nấu những bữa ăn lành mạnh.',
    options: ['on', 'at', 'in', 'with'],
    correct_option: 2,
    explanation_vi: 'Cụm từ cố định: "to be interested in + V-ing/Noun" (thích thú với cái gì).'
  },
  {
    question_text: 'The telephone was invented ___ Alexander Graham Bell.',
    question_text_vi: 'Điện thoại được phát minh bởi Alexander Graham Bell.',
    options: ['by', 'from', 'with', 'in'],
    correct_option: 0,
    explanation_vi: 'Câu bị động chỉ tác nhân gây ra hành động dùng "by + tân ngữ".'
  },
  {
    question_text: 'She asked me where I ___ from.',
    question_text_vi: 'Cô ấy đã hỏi tôi đến từ đâu.',
    options: ['come', 'came', 'coming', 'comes'],
    correct_option: 1,
    explanation_vi: 'Câu tường thuật gián tiếp ở quá khứ (asked me where...) cần lùi thì về quá khứ đơn "came".'
  },
  {
    question_text: 'If I ___ a bird, I would fly around the world.',
    question_text_vi: 'Nếu tôi là một chú chim, tôi sẽ bay khắp thế giới.',
    options: ['am', 'was', 'were', 'had been'],
    correct_option: 2,
    explanation_vi: 'Câu điều kiện loại 2 giả định điều không có thật ở hiện tại: If + S + were/V-ed.'
  },
  {
    question_text: 'The gallery exhibited an extraordinary ___ depicting the rural countryside.',
    question_text_vi: 'Phòng tranh đã trưng bày một bức tranh phong cảnh phi thường miêu tả vùng đồng quê nông thôn.',
    options: ['landscape', 'sculptor', 'weaver', 'potter'],
    correct_option: 0,
    explanation_vi: '"Landscape" là tranh phong cảnh, thích hợp với ngữ cảnh miêu tả countryside.'
  },
  {
    question_text: 'Master artisans practice intricate ___ to shape heated precious metals.',
    question_text_vi: 'Các nghệ nhân bậc thầy thực hiện nghề kim hoàn tinh xảo để định hình kim loại quý được nung nóng.',
    options: ['silversmithing', 'canvas', 'sketch', 'easel'],
    correct_option: 0,
    explanation_vi: '"Silversmithing" là nghề kim hoàn chế tác bạc/kim loại quý.'
  },
  {
    question_text: 'By the time the museum opened, hundreds of visitors ___ in line.',
    question_text_vi: 'Vào thời điểm viện bảo tàng mở cửa, hàng trăm du khách đã xếp hàng đợi.',
    options: ['waited', 'had waited', 'have waited', 'were waiting'],
    correct_option: 1,
    explanation_vi: 'Hành động xảy ra trước một mốc thời gian trong quá khứ ("By the time... opened") dùng thì quá khứ hoàn thành "had waited".'
  },
  {
    question_text: 'The artist avoided ___ artificial colors in her traditional landscape painting.',
    question_text_vi: 'Nữ họa sĩ tránh sử dụng màu nhân tạo trong bức tranh phong cảnh truyền thống của mình.',
    options: ['to use', 'using', 'used', 'use'],
    correct_option: 1,
    explanation_vi: 'Động từ "avoid" luôn đi kèm với danh động từ "V-ing" (avoid doing something).'
  },
  {
    question_text: 'Neither the curator nor the painters ___ satisfied with the lighting arrangement.',
    question_text_vi: 'Cả giám tuyển lẫn các họa sĩ đều không hài lòng với cách bố trí ánh sáng.',
    options: ['was', 'were', 'is', 'are'],
    correct_option: 1,
    explanation_vi: 'Cấu trúc "Neither... nor..." hòa hợp thì với chủ ngữ gần nhất ("the painters" - số nhiều) trong quá khứ → "were".'
  },
  {
    question_text: 'Had I known about the art exhibition earlier, I ___ tickets.',
    question_text_vi: 'Nếu tôi biết về triển lãm nghệ thuật sớm hơn, tôi đã đặt vé rồi.',
    options: ['would book', 'will book', 'would have booked', 'had booked'],
    correct_option: 2,
    explanation_vi: 'Đảo ngữ câu điều kiện loại 3 (Had + S + V3/ed) có mệnh đề chính dùng "would have + V3/ed".'
  },
  {
    question_text: 'The antique vase, ___ was crafted in the seventeenth century, fetched a record price.',
    question_text_vi: 'Chiếc bình cổ, thứ được chế tác vào thế kỷ 17, đã đạt mức giá kỷ lục.',
    options: ['that', 'which', 'who', 'whose'],
    correct_option: 1,
    explanation_vi: 'Mệnh đề quan hệ không xác định (có dấu phẩy) chỉ vật dùng đại từ quan hệ "which", không dùng "that".'
  },
  {
    question_text: 'The intricate tapestry was woven ___ supreme patience and precision.',
    question_text_vi: 'Tấm thảm thêu tinh xảo được dệt nên với lòng kiên nhẫn và sự chuẩn xác tột cùng.',
    options: ['with', 'by', 'at', 'on'],
    correct_option: 0,
    explanation_vi: 'Cụm từ chỉ cách thức thực hiện: "with patience and precision" (với sự kiên nhẫn và chuẩn xác).'
  },
  {
    question_text: 'Scarcely had the master craftsman finished the sculpture ___ the bell chimed midnight.',
    question_text_vi: 'Nghệ nhân bậc thầy vừa hoàn thành bức điêu khắc thì chuông đồng hồ điểm nửa đêm.',
    options: ['when', 'than', 'then', 'as'],
    correct_option: 0,
    explanation_vi: 'Cấu trúc đảo ngữ: "Scarcely had + S + V3/ed... when + S + V-ed" (vừa mới... thì).'
  },
  {
    question_text: 'He succeeded in the art competition ___ facing intense rivalry from international painters.',
    question_text_vi: 'Anh ấy đã thành công tại cuộc thi nghệ thuật mặc dù đối mặt với sự cạnh tranh khốc liệt từ các họa sĩ quốc tế.',
    options: ['despite', 'although', 'even though', 'because of'],
    correct_option: 0,
    explanation_vi: '"Despite" đi với danh động từ (V-ing phrase: facing intense rivalry), trong khi "although/even though" đi với mệnh đề.'
  },
  {
    question_text: 'The conservation team suggested that the ancient mural ___ immediately.',
    question_text_vi: 'Đội ngũ bảo tồn đề xuất rằng bức bích họa cổ nên được phục chế ngay lập tức.',
    options: ['be restored', 'is restored', 'was restored', 'has been restored'],
    correct_option: 0,
    explanation_vi: 'Cấu trúc giả định thức (Subjunctive mood): "suggest that + S + (should) be + V3/ed".'
  },
  {
    question_text: 'The research team made a breakthrough discovery that could ___ revolutionize medicine.',
    question_text_vi: 'Đội ngũ nghiên cứu đã tạo ra một phát hiện đột phá có khả năng cách mạng hóa nền y học.',
    options: ['potential', 'potentially', 'potentiality', 'potent'],
    correct_option: 1,
    explanation_vi: 'Đứng trước động từ "revolutionize" để bổ nghĩa cho khả năng diễn ra cần một trạng từ "potentially".'
  }
];

module.exports = {
  placementQuestionsData
};
