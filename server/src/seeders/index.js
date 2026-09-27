const {
  User,
  Topic,
  Vocabulary,
  VocabExample,
  Reading,
  Question,
  Group,
  GroupMember,
  GroupVocabSet,
  GroupVocabItem,
  GroupReadingSet,
  LevelAssessment,
  sequelize
} = require('../models');

const topicsData = [
  { id: 1, name: 'About Me', name_vi: 'Bản thân', icon: 'HiUser', display_order: 1, description: 'Từ vựng và bài đọc về thông tin cá nhân, ngoại hình và tính cách.' },
  { id: 2, name: 'Family', name_vi: 'Gia đình', icon: 'HiUserGroup', display_order: 2, description: 'Từ vựng và bài đọc về các thành viên, mối quan hệ trong gia đình.' },
  { id: 3, name: 'School', name_vi: 'Trường học', icon: 'HiAcademicCap', display_order: 3, description: 'Từ vựng và bài đọc về đồ dùng học tập, môn học và đời sống học đường.' },
  { id: 4, name: 'Food & Drink', name_vi: 'Đồ ăn & Thức uống', icon: 'HiSparkles', display_order: 4, description: 'Từ vựng và bài đọc về các món ăn, đồ uống, bữa ăn và khẩu vị.' },
  { id: 5, name: 'Hobbies', name_vi: 'Sở thích', icon: 'HiHeart', display_order: 5, description: 'Từ vựng và bài đọc về thể thao, âm nhạc, nghệ thuật và giải trí.' },
  { id: 6, name: 'Animals', name_vi: 'Động vật', icon: 'HiGlobe', display_order: 6, description: 'Từ vựng và bài đọc về vật nuôi trong nhà, động vật hoang dã và tự nhiên.' },
  { id: 7, name: 'Daily Life', name_vi: 'Sinh hoạt hằng ngày', icon: 'HiClock', display_order: 7, description: 'Từ vựng và bài đọc về thói quen, thời gian, công việc nhà hằng ngày.' }
];

// Helper to generate 30 words per topic = 210 words total
const vocabByTopic = {
  1: [ // About Me (30 words)
    { word: 'name', pronunciation: '/neɪm/', part_of_speech: 'noun', meaning_vi: 'tên', example_sentence: 'My name is Minh.', example_translation: 'Tên tôi là Minh.', difficulty: 'easy' },
    { word: 'age', pronunciation: '/eɪdʒ/', part_of_speech: 'noun', meaning_vi: 'tuổi', example_sentence: 'I am fifteen years of age.', example_translation: 'Tôi mười lăm tuổi.', difficulty: 'easy' },
    { word: 'birthday', pronunciation: '/ˈbɜːθdeɪ/', part_of_speech: 'noun', meaning_vi: 'ngày sinh nhật', example_sentence: 'My birthday is in May.', example_translation: 'Sinh nhật tôi vào tháng Năm.', difficulty: 'easy' },
    { word: 'student', pronunciation: '/ˈstjuːdnt/', part_of_speech: 'noun', meaning_vi: 'học sinh, sinh viên', example_sentence: 'She is an active student.', example_translation: 'Cô ấy là một học sinh năng nổ.', difficulty: 'easy' },
    { word: 'tall', pronunciation: '/tɔːl/', part_of_speech: 'adjective', meaning_vi: 'cao', example_sentence: 'He is very tall and fit.', example_translation: 'Anh ấy rất cao và cân đối.', difficulty: 'easy' },
    { word: 'short', pronunciation: '/ʃɔːt/', part_of_speech: 'adjective', meaning_vi: 'thấp, ngắn', example_sentence: 'She has short dark hair.', example_translation: 'Cô ấy có mái tóc đen ngắn.', difficulty: 'easy' },
    { word: 'slim', pronunciation: '/slɪm/', part_of_speech: 'adjective', meaning_vi: 'thon thả, mảnh mai', example_sentence: 'She keeps a slim figure.', example_translation: 'Cô ấy giữ một vóc dáng thon thả.', difficulty: 'medium' },
    { word: 'friendly', pronunciation: '/ˈfrendli/', part_of_speech: 'adjective', meaning_vi: 'thân thiện', example_sentence: 'Our neighbors are very friendly.', example_translation: 'Hàng xóm của chúng tôi rất thân thiện.', difficulty: 'easy' },
    { word: 'cheerful', pronunciation: '/ˈtʃɪəfl/', part_of_speech: 'adjective', meaning_vi: 'vui tươi, rạng rỡ', example_sentence: 'He has a cheerful smile.', example_translation: 'Anh ấy có nụ cười rạng rỡ.', difficulty: 'medium' },
    { word: 'smart', pronunciation: '/smɑːt/', part_of_speech: 'adjective', meaning_vi: 'thông minh', example_sentence: 'Nam is a smart boy.', example_translation: 'Nam là một cậu bé thông minh.', difficulty: 'easy' },
    { word: 'clever', pronunciation: '/ˈklevər/', part_of_speech: 'adjective', meaning_vi: 'khéo léo, thông minh', example_sentence: 'That was a clever solution.', example_translation: 'Đó là một giải pháp thông minh.', difficulty: 'medium' },
    { word: 'kind', pronunciation: '/kaɪnd/', part_of_speech: 'adjective', meaning_vi: 'tốt bụng', example_sentence: 'Thank you for your kind words.', example_translation: 'Cảm ơn những lời tốt bụng của bạn.', difficulty: 'easy' },
    { word: 'honest', pronunciation: '/ˈɒnɪst/', part_of_speech: 'adjective', meaning_vi: 'thật thà, trung thực', example_sentence: 'Always be honest with yourself.', example_translation: 'Hãy luôn trung thực với chính mình.', difficulty: 'medium' },
    { word: 'brave', pronunciation: '/breɪv/', part_of_speech: 'adjective', meaning_vi: 'dũng cảm', example_sentence: 'The firefighter was very brave.', example_translation: 'Người lính cứu hỏa rất dũng cảm.', difficulty: 'medium' },
    { word: 'polite', pronunciation: '/pəˈlaɪt/', part_of_speech: 'adjective', meaning_vi: 'lịch sự', example_sentence: 'He is always polite to teachers.', example_translation: 'Cậu ấy luôn lịch sự với thầy cô.', difficulty: 'easy' },
    { word: 'hardworking', pronunciation: '/ˌhɑːdˈwɜːkɪŋ/', part_of_speech: 'adjective', meaning_vi: 'chăm chỉ', example_sentence: 'She is a hardworking girl.', example_translation: 'Cô ấy là một cô gái chăm chỉ.', difficulty: 'medium' },
    { word: 'lazy', pronunciation: '/ˈleɪzi/', part_of_speech: 'adjective', meaning_vi: 'lười biếng', example_sentence: 'Do not be lazy in your studies.', example_translation: 'Đừng lười biếng trong việc học tập.', difficulty: 'easy' },
    { word: 'shy', pronunciation: '/ʃaɪ/', part_of_speech: 'adjective', meaning_vi: 'nhút nhát, e thẹn', example_sentence: 'The child is shy around strangers.', example_translation: 'Đứa trẻ nhút nhát trước người lạ.', difficulty: 'easy' },
    { word: 'confident', pronunciation: '/ˈkɒnfɪdənt/', part_of_speech: 'adjective', meaning_vi: 'tự tin', example_sentence: 'Speak in a confident voice.', example_translation: 'Hãy nói với một giọng điệu tự tin.', difficulty: 'medium' },
    { word: 'creative', pronunciation: '/kriˈeɪtɪv/', part_of_speech: 'adjective', meaning_vi: 'sáng tạo', example_sentence: 'She has many creative ideas.', example_translation: 'Cô ấy có nhiều ý tưởng sáng tạo.', difficulty: 'medium' },
    { word: 'patient', pronunciation: '/ˈpeɪʃnt/', part_of_speech: 'adjective', meaning_vi: 'kiên nhẫn', example_sentence: 'Teachers need to be patient.', example_translation: 'Giáo viên cần phải kiên nhẫn.', difficulty: 'medium' },
    { word: 'generous', pronunciation: '/ˈdʒenərəs/', part_of_speech: 'adjective', meaning_vi: 'hào phóng, rộng lượng', example_sentence: 'He is generous with his time.', example_translation: 'Anh ấy rất hào phóng với thời gian của mình.', difficulty: 'hard' },
    { word: 'country', pronunciation: '/ˈkʌntri/', part_of_speech: 'noun', meaning_vi: 'đất nước, quốc gia', example_sentence: 'Vietnam is a beautiful country.', example_translation: 'Việt Nam là một đất nước tươi đẹp.', difficulty: 'easy' },
    { word: 'hometown', pronunciation: '/ˈhəʊmtaʊn/', part_of_speech: 'noun', meaning_vi: 'quê hương', example_sentence: 'My hometown is Da Nang.', example_translation: 'Quê hương tôi là Đà Nẵng.', difficulty: 'easy' },
    { word: 'live', pronunciation: '/lɪv/', part_of_speech: 'verb', meaning_vi: 'sống, sinh sống', example_sentence: 'I live in a small apartment.', example_translation: 'Tôi sống trong một căn hộ nhỏ.', difficulty: 'easy' },
    { word: 'grow', pronunciation: '/ɡrəʊ/', part_of_speech: 'verb', meaning_vi: 'lớn lên, phát triển', example_sentence: 'Children grow fast.', example_translation: 'Trẻ em lớn lên rất nhanh.', difficulty: 'easy' },
    { word: 'dream', pronunciation: '/driːm/', part_of_speech: 'noun', meaning_vi: 'ước mơ, giấc mơ', example_sentence: 'My dream is to become an engineer.', example_translation: 'Ước mơ của tôi là trở thành kỹ sư.', difficulty: 'easy' },
    { word: 'introduce', pronunciation: '/ˌɪntrəˈdjuːs/', part_of_speech: 'verb', meaning_vi: 'giới thiệu', example_sentence: 'Let me introduce myself.', example_translation: 'Để tôi tự giới thiệu bản thân.', difficulty: 'medium' },
    { word: 'appearance', pronunciation: '/əˈpɪərəns/', part_of_speech: 'noun', meaning_vi: 'ngoại hình, diện mạo', example_sentence: 'Appearance is not everything.', example_translation: 'Ngoại hình không phải là tất cả.', difficulty: 'hard' },
    { word: 'personality', pronunciation: '/ˌpɜːsəˈnæləti/', part_of_speech: 'noun', meaning_vi: 'tính cách, nhân cách', example_sentence: 'She has a warm personality.', example_translation: 'Cô ấy có một tính cách ấm áp.', difficulty: 'hard' }
  ],
  2: [ // Family (30 words)
    { word: 'family', pronunciation: '/ˈfæməli/', part_of_speech: 'noun', meaning_vi: 'gia đình', example_sentence: 'Family comes first.', example_translation: 'Gia đình luôn đứng hàng đầu.', difficulty: 'easy' },
    { word: 'parents', pronunciation: '/ˈpeərənts/', part_of_speech: 'noun', meaning_vi: 'bố mẹ, phụ huynh', example_sentence: 'My parents work very hard.', example_translation: 'Bố mẹ tôi làm việc rất chăm chỉ.', difficulty: 'easy' },
    { word: 'father', pronunciation: '/ˈfɑːðər/', part_of_speech: 'noun', meaning_vi: 'bố, cha', example_sentence: 'His father is a doctor.', example_translation: 'Bố của anh ấy là bác sĩ.', difficulty: 'easy' },
    { word: 'mother', pronunciation: '/ˈmʌðər/', part_of_speech: 'noun', meaning_vi: 'mẹ', example_sentence: 'My mother cooks delicious food.', example_translation: 'Mẹ tôi nấu ăn rất ngon.', difficulty: 'easy' },
    { word: 'brother', pronunciation: '/ˈbrʌðər/', part_of_speech: 'noun', meaning_vi: 'anh/em trai', example_sentence: 'My elder brother is in college.', example_translation: 'Anh trai tôi đang học đại học.', difficulty: 'easy' },
    { word: 'sister', pronunciation: '/ˈsɪstər/', part_of_speech: 'noun', meaning_vi: 'chị/em gái', example_sentence: 'Her little sister is cute.', example_translation: 'Em gái của cô ấy rất đáng yêu.', difficulty: 'easy' },
    { word: 'sibling', pronunciation: '/ˈsɪblɪŋ/', part_of_speech: 'noun', meaning_vi: 'anh chị em ruột', example_sentence: 'Do you have any siblings?', example_translation: 'Bạn có anh chị em ruột nào không?', difficulty: 'medium' },
    { word: 'grandfather', pronunciation: '/ˈɡrænfɑːðər/', part_of_speech: 'noun', meaning_vi: 'ông nội, ông ngoại', example_sentence: 'My grandfather tells great stories.', example_translation: 'Ông tôi kể những câu chuyện rất hay.', difficulty: 'easy' },
    { word: 'grandmother', pronunciation: '/ˈɡrænmʌðər/', part_of_speech: 'noun', meaning_vi: 'bà nội, bà ngoại', example_sentence: 'Grandmother bakes sweet cakes.', example_translation: 'Bà nướng những chiếc bánh ngọt ngào.', difficulty: 'easy' },
    { word: 'grandparents', pronunciation: '/ˈɡrænpeərənts/', part_of_speech: 'noun', meaning_vi: 'ông bà', example_sentence: 'We visit grandparents on Sundays.', example_translation: 'Chúng tôi thăm ông bà vào chủ nhật.', difficulty: 'easy' },
    { word: 'uncle', pronunciation: '/ˈʌŋkl/', part_of_speech: 'noun', meaning_vi: 'chú, bác, cậu', example_sentence: 'My uncle lives in the countryside.', example_translation: 'Bác tôi sống ở miền quê.', difficulty: 'easy' },
    { word: 'aunt', pronunciation: '/ɑːnt/', part_of_speech: 'noun', meaning_vi: 'cô, dì, mợ, thím', example_sentence: 'Aunt Mai brought some fresh fruits.', example_translation: 'Dì Mai đã mang một ít hoa quả tươi.', difficulty: 'easy' },
    { word: 'cousin', pronunciation: '/ˈkʌzn/', part_of_speech: 'noun', meaning_vi: 'anh chị em họ', example_sentence: 'I play chess with my cousin.', example_translation: 'Tôi chơi cờ với người anh họ.', difficulty: 'easy' },
    { word: 'nephew', pronunciation: '/ˈnefjuː/', part_of_speech: 'noun', meaning_vi: 'cháu trai (con anh chị em)', example_sentence: 'My nephew is three years old.', example_translation: 'Cháu trai tôi được ba tuổi.', difficulty: 'medium' },
    { word: 'niece', pronunciation: '/niːs/', part_of_speech: 'noun', meaning_vi: 'cháu gái (con anh chị em)', example_sentence: 'Her niece goes to kindergarten.', example_translation: 'Cháu gái của cô ấy đi học mẫu giáo.', difficulty: 'medium' },
    { word: 'child', pronunciation: '/tʃaɪld/', part_of_speech: 'noun', meaning_vi: 'đứa trẻ, con cái', example_sentence: 'Every child needs care and love.', example_translation: 'Mọi đứa trẻ đều cần sự quan tâm và tình thương.', difficulty: 'easy' },
    { word: 'children', pronunciation: '/ˈtʃɪldrən/', part_of_speech: 'noun', meaning_vi: 'những đứa trẻ, các con', example_sentence: 'The children are playing outside.', example_translation: 'Lũ trẻ đang chơi đùa ngoài sân.', difficulty: 'easy' },
    { word: 'baby', pronunciation: '/ˈbeɪbi/', part_of_speech: 'noun', meaning_vi: 'em bé', example_sentence: 'The baby is sleeping peacefully.', example_translation: 'Em bé đang ngủ say sưa.', difficulty: 'easy' },
    { word: 'husband', pronunciation: '/ˈhʌzbənd/', part_of_speech: 'noun', meaning_vi: 'chồng', example_sentence: 'Her husband works as an architect.', example_translation: 'Chồng cô ấy làm việc như một kiến trúc sư.', difficulty: 'medium' },
    { word: 'wife', pronunciation: '/waɪf/', part_of_speech: 'noun', meaning_vi: 'vợ', example_sentence: 'His wife is an accountant.', example_translation: 'Vợ anh ấy là kế toán viên.', difficulty: 'medium' },
    { word: 'son', pronunciation: '/sʌn/', part_of_speech: 'noun', meaning_vi: 'con trai', example_sentence: 'They have a smart son.', example_translation: 'Họ có một cậu con trai thông minh.', difficulty: 'easy' },
    { word: 'daughter', pronunciation: '/ˈdɔːtər/', part_of_speech: 'noun', meaning_vi: 'con gái', example_sentence: 'Their daughter loves painting.', example_translation: 'Con gái họ rất thích vẽ tranh.', difficulty: 'easy' },
    { word: 'relative', pronunciation: '/ˈrelətɪv/', part_of_speech: 'noun', meaning_vi: 'họ hàng, người thân', example_sentence: 'We invited all our relatives to dinner.', example_translation: 'Chúng tôi mời tất cả họ hàng đến ăn tối.', difficulty: 'medium' },
    { word: 'support', pronunciation: '/səˈpɔːt/', part_of_speech: 'verb', meaning_vi: 'ủng hộ, nâng đỡ', example_sentence: 'Families support each other through hardship.', example_translation: 'Gia đình ủng hộ lẫn nhau qua khó khăn.', difficulty: 'medium' },
    { word: 'care', pronunciation: '/keər/', part_of_speech: 'verb', meaning_vi: 'chăm sóc, quan tâm', example_sentence: 'Parents care deeply for their children.', example_translation: 'Cha mẹ quan tâm sâu sắc đến các con.', difficulty: 'easy' },
    { word: 'protect', pronunciation: '/prəˈtekt/', part_of_speech: 'verb', meaning_vi: 'bảo vệ', example_sentence: 'A father tries to protect his family.', example_translation: 'Người cha luôn cố gắng bảo vệ gia đình.', difficulty: 'medium' },
    { word: 'gather', pronunciation: '/ˈɡæðər/', part_of_speech: 'verb', meaning_vi: 'tụ họp, sum họp', example_sentence: 'We gather for dinner every evening.', example_translation: 'Chúng tôi sum họp ăn tối mỗi buổi tối.', difficulty: 'medium' },
    { word: 'generation', pronunciation: '/ˌdʒenəˈreɪʃn/', part_of_speech: 'noun', meaning_vi: 'thế hệ', example_sentence: 'Three generations live in this house.', example_translation: 'Ba thế hệ cùng sống trong ngôi nhà này.', difficulty: 'hard' },
    { word: 'household', pronunciation: '/ˈhaʊshəʊld/', part_of_speech: 'noun', meaning_vi: 'hộ gia đình', example_sentence: 'Household chores are shared equally.', example_translation: 'Công việc nội trợ được chia sẻ công bằng.', difficulty: 'hard' },
    { word: 'bond', pronunciation: '/bɒnd/', part_of_speech: 'noun', meaning_vi: 'sự gắn kết, tình cảm ràng buộc', example_sentence: 'There is a strong bond between the brothers.', example_translation: 'Có một sự gắn kết bền chặt giữa hai anh em.', difficulty: 'hard' }
  ],
  3: [ // School (30 words)
    { word: 'school', pronunciation: '/skuːl/', part_of_speech: 'noun', meaning_vi: 'trường học', example_sentence: 'I walk to school every morning.', example_translation: 'Tôi đi bộ đến trường mỗi sáng.', difficulty: 'easy' },
    { word: 'classroom', pronunciation: '/ˈklɑːsruːm/', part_of_speech: 'noun', meaning_vi: 'phòng học, lớp học', example_sentence: 'The classroom is clean and bright.', example_translation: 'Phòng học sạch sẽ và sáng sủa.', difficulty: 'easy' },
    { word: 'teacher', pronunciation: '/ˈtiːtʃər/', part_of_speech: 'noun', meaning_vi: 'giáo viên', example_sentence: 'Our English teacher is dedicated.', example_translation: 'Giáo viên tiếng Anh của chúng tôi rất tận tâm.', difficulty: 'easy' },
    { word: 'blackboard', pronunciation: '/ˈblækbɔːd/', part_of_speech: 'noun', meaning_vi: 'bảng đen', example_sentence: 'The teacher writes on the blackboard.', example_translation: 'Thầy giáo viết lên bảng đen.', difficulty: 'easy' },
    { word: 'desk', pronunciation: '/desk/', part_of_speech: 'noun', meaning_vi: 'bàn học', example_sentence: 'Please keep your desk tidy.', example_translation: 'Vui lòng giữ bàn học gọn gàng.', difficulty: 'easy' },
    { word: 'chair', pronunciation: '/tʃeər/', part_of_speech: 'noun', meaning_vi: 'ghế', example_sentence: 'Pull up a chair and sit down.', example_translation: 'Kéo một chiếc ghế và ngồi xuống nào.', difficulty: 'easy' },
    { word: 'book', pronunciation: '/bʊk/', part_of_speech: 'noun', meaning_vi: 'quyển sách', example_sentence: 'Open your textbook to page ten.', example_translation: 'Hãy mở sách giáo khoa đến trang mười.', difficulty: 'easy' },
    { word: 'notebook', pronunciation: '/ˈnəʊtbʊk/', part_of_speech: 'noun', meaning_vi: 'vở ghi chép', example_sentence: 'Write this lesson in your notebook.', example_translation: 'Hãy ghi bài học này vào vở.', difficulty: 'easy' },
    { word: 'pen', pronunciation: '/pen/', part_of_speech: 'noun', meaning_vi: 'bút mực', example_sentence: 'Can I borrow your blue pen?', example_translation: 'Tôi có thể mượn chiếc bút xanh của bạn không?', difficulty: 'easy' },
    { word: 'pencil', pronunciation: '/ˈpensl/', part_of_speech: 'noun', meaning_vi: 'bút chì', example_sentence: 'Use a sharp pencil for drawing.', example_translation: 'Hãy dùng một cây bút chì nhọn để vẽ.', difficulty: 'easy' },
    { word: 'eraser', pronunciation: '/ɪˈreɪzər/', part_of_speech: 'noun', meaning_vi: 'cục tẩy, gôm', example_sentence: 'An eraser helps correct mistakes.', example_translation: 'Cục tẩy giúp sửa những chỗ sai.', difficulty: 'easy' },
    { word: 'ruler', pronunciation: '/ˈruːlər/', part_of_speech: 'noun', meaning_vi: 'thước kẻ', example_sentence: 'Measure the line with a ruler.', example_translation: 'Hãy đo đường thẳng bằng thước kẻ.', difficulty: 'easy' },
    { word: 'backpack', pronunciation: '/ˈbækpæk/', part_of_speech: 'noun', meaning_vi: 'ba lô, cặp sách', example_sentence: 'My backpack is full of heavy books.', example_translation: 'Ba lô của tôi đầy những cuốn sách nặng.', difficulty: 'medium' },
    { word: 'library', pronunciation: '/ˈlaɪbrəri/', part_of_speech: 'noun', meaning_vi: 'thư viện', example_sentence: 'Silence must be kept in the library.', example_translation: 'Phải giữ im lặng trong thư viện.', difficulty: 'medium' },
    { word: 'homework', pronunciation: '/ˈhəʊmwɜːk/', part_of_speech: 'noun', meaning_vi: 'bài tập về nhà', example_sentence: 'Finish your homework before watching TV.', example_translation: 'Hãy làm xong bài tập về nhà trước khi xem TV.', difficulty: 'easy' },
    { word: 'lesson', pronunciation: '/ˈlesn/', part_of_speech: 'noun', meaning_vi: 'tiết học, bài học', example_sentence: 'Today\'s lesson is about biology.', example_translation: 'Bài học hôm nay nói về sinh học.', difficulty: 'easy' },
    { word: 'subject', pronunciation: '/ˈsʌbdʒɪkt/', part_of_speech: 'noun', meaning_vi: 'môn học', example_sentence: 'Mathematics is an important subject.', example_translation: 'Toán học là một môn học quan trọng.', difficulty: 'medium' },
    { word: 'history', pronunciation: '/ˈhɪstri/', part_of_speech: 'noun', meaning_vi: 'lịch sử', example_sentence: 'I enjoy studying ancient history.', example_translation: 'Tôi thích thú khi học lịch sử cổ đại.', difficulty: 'medium' },
    { word: 'science', pronunciation: '/ˈsaɪəns/', part_of_speech: 'noun', meaning_vi: 'khoa học', example_sentence: 'Science helps us understand nature.', example_translation: 'Khoa học giúp chúng ta hiểu tự nhiên.', difficulty: 'medium' },
    { word: 'exam', pronunciation: '/ɪɡˈzæm/', part_of_speech: 'noun', meaning_vi: 'kỳ thi, bài kiểm tra', example_sentence: 'The midterm exam is next week.', example_translation: 'Kỳ thi giữa kỳ diễn ra vào tuần tới.', difficulty: 'medium' },
    { word: 'grade', pronunciation: '/ɡreɪd/', part_of_speech: 'noun', meaning_vi: 'điểm số, khối lớp', example_sentence: 'He received a high grade on the test.', example_translation: 'Cậu ấy nhận điểm cao trong bài kiểm tra.', difficulty: 'medium' },
    { word: 'study', pronunciation: '/ˈstʌdi/', part_of_speech: 'verb', meaning_vi: 'học tập, nghiên cứu', example_sentence: 'Students study hard for success.', example_translation: 'Học sinh học tập chăm chỉ để thành công.', difficulty: 'easy' },
    { word: 'listen', pronunciation: '/ˈlɪsn/', part_of_speech: 'verb', meaning_vi: 'lắng nghe', example_sentence: 'Listen carefully to the instructions.', example_translation: 'Hãy lắng nghe cẩn thận các hướng dẫn.', difficulty: 'easy' },
    { word: 'practice', pronunciation: '/ˈpræktɪs/', part_of_speech: 'verb', meaning_vi: 'luyện tập, thực hành', example_sentence: 'Practice makes perfect.', example_translation: 'Có công mài sắt có ngày nên kim.', difficulty: 'medium' },
    { word: 'explain', pronunciation: '/ɪkˈspleɪn/', part_of_speech: 'verb', meaning_vi: 'giải thích', example_sentence: 'Could you explain this rule again?', example_translation: 'Bạn có thể giải thích lại quy tắc này không?', difficulty: 'medium' },
    { word: 'understand', pronunciation: '/ˌʌndəˈstænd/', part_of_speech: 'verb', meaning_vi: 'thấu hiểu, hiểu rõ', example_sentence: 'Do you understand this grammar point?', example_translation: 'Bạn có hiểu điểm ngữ pháp này không?', difficulty: 'medium' },
    { word: 'question', pronunciation: '/ˈkwestʃən/', part_of_speech: 'noun', meaning_vi: 'câu hỏi, thắc mắc', example_sentence: 'Raise your hand if you have a question.', example_translation: 'Hãy giơ tay nếu bạn có một câu hỏi.', difficulty: 'easy' },
    { word: 'answer', pronunciation: '/ˈɑːnsər/', part_of_speech: 'noun', meaning_vi: 'câu trả lời, lời đáp', example_sentence: 'Write your answer on the paper.', example_translation: 'Hãy viết câu trả lời của bạn lên giấy.', difficulty: 'easy' },
    { word: 'curriculum', pronunciation: '/kəˈrɪkjələm/', part_of_speech: 'noun', meaning_vi: 'chương trình giảng dạy', example_sentence: 'The new curriculum focuses on skills.', example_translation: 'Chương trình giảng dạy mới tập trung vào kỹ năng.', difficulty: 'hard' },
    { word: 'assignment', pronunciation: '/əˈsaɪnmənt/', part_of_speech: 'noun', meaning_vi: 'nhiệm vụ, bài tập lớn', example_sentence: 'The history assignment is due Friday.', example_translation: 'Bài tập môn lịch sử đến hạn vào thứ Sáu.', difficulty: 'hard' }
  ],
  4: [ // Food & Drink (30 words)
    { word: 'food', pronunciation: '/fuːd/', part_of_speech: 'noun', meaning_vi: 'đồ ăn, thức ăn', example_sentence: 'Good food gives us energy.', example_translation: 'Thức ăn ngon mang lại cho ta năng lượng.', difficulty: 'easy' },
    { word: 'drink', pronunciation: '/drɪŋk/', part_of_speech: 'verb', meaning_vi: 'uống; đồ uống', example_sentence: 'Drink plenty of pure water.', example_translation: 'Hãy uống thật nhiều nước tinh khiết.', difficulty: 'easy' },
    { word: 'water', pronunciation: '/ˈwɔːtər/', part_of_speech: 'noun', meaning_vi: 'nước', example_sentence: 'Water is essential for life.', example_translation: 'Nước là điều thiết yếu cho sự sống.', difficulty: 'easy' },
    { word: 'rice', pronunciation: '/raɪs/', part_of_speech: 'noun', meaning_vi: 'cơm, gạo', example_sentence: 'Rice is the staple grain in Vietnam.', example_translation: 'Cơm là lương thực chính ở Việt Nam.', difficulty: 'easy' },
    { word: 'bread', pronunciation: '/bred/', part_of_speech: 'noun', meaning_vi: 'bánh mì', example_sentence: 'He buys fresh bread every dawn.', example_translation: 'Anh ấy mua bánh mì tươi mỗi sáng sớm.', difficulty: 'easy' },
    { word: 'noodle', pronunciation: '/ˈnuːdl/', part_of_speech: 'noun', meaning_vi: 'mì, phở, bún', example_sentence: 'Beef noodle soup is very famous.', example_translation: 'Phở bò rất nổi tiếng.', difficulty: 'easy' },
    { word: 'meat', pronunciation: '/miːt/', part_of_speech: 'noun', meaning_vi: 'thịt', example_sentence: 'Some people prefer not to eat meat.', example_translation: 'Một số người thích không ăn thịt.', difficulty: 'easy' },
    { word: 'beef', pronunciation: '/biːf/', part_of_speech: 'noun', meaning_vi: 'thịt bò', example_sentence: 'The grilled beef is tender.', example_translation: 'Thịt bò nướng rất mềm.', difficulty: 'easy' },
    { word: 'pork', pronunciation: '/pɔːk/', part_of_speech: 'noun', meaning_vi: 'thịt lợn, thịt heo', example_sentence: 'Roast pork is a popular dish.', example_translation: 'Thịt heo quay là một món ăn phổ biến.', difficulty: 'easy' },
    { word: 'chicken', pronunciation: '/ˈtʃɪkɪn/', part_of_speech: 'noun', meaning_vi: 'thịt gà, con gà', example_sentence: 'We had steamed chicken for lunch.', example_translation: 'Chúng tôi ăn gà hấp cho bữa trưa.', difficulty: 'easy' },
    { word: 'fish', pronunciation: '/fɪʃ/', part_of_speech: 'noun', meaning_vi: 'cá, món cá', example_sentence: 'Fresh fish contains healthy oils.', example_translation: 'Cá tươi chứa nhiều loại dầu tốt cho sức khỏe.', difficulty: 'easy' },
    { word: 'egg', pronunciation: '/eɡ/', part_of_speech: 'noun', meaning_vi: 'quả trứng', example_sentence: 'Boiled eggs are easy to prepare.', example_translation: 'Trứng luộc rất dễ chuẩn bị.', difficulty: 'easy' },
    { word: 'vegetable', pronunciation: '/ˈvedʒtəbl/', part_of_speech: 'noun', meaning_vi: 'rau củ', example_sentence: 'Green vegetables are rich in fiber.', example_translation: 'Rau xanh rất giàu chất xơ.', difficulty: 'easy' },
    { word: 'fruit', pronunciation: '/fruːt/', part_of_speech: 'noun', meaning_vi: 'trái cây, hoa quả', example_sentence: 'Eat fresh fruit every single day.', example_translation: 'Hãy ăn trái cây tươi mỗi ngày.', difficulty: 'easy' },
    { word: 'apple', pronunciation: '/ˈæpl/', part_of_speech: 'noun', meaning_vi: 'quả táo', example_sentence: 'An apple a day keeps doctors away.', example_translation: 'Một quả táo mỗi ngày giúp tránh xa bác sĩ.', difficulty: 'easy' },
    { word: 'banana', pronunciation: '/bəˈnɑːnə/', part_of_speech: 'noun', meaning_vi: 'quả chuối', example_sentence: 'Monkeys love sweet bananas.', example_translation: 'Những chú khỉ thích chuối ngọt.', difficulty: 'easy' },
    { word: 'orange', pronunciation: '/ˈɒrɪndʒ/', part_of_speech: 'noun', meaning_vi: 'quả cam', example_sentence: 'Fresh orange juice is full of vitamin C.', example_translation: 'Nước cam tươi có nhiều vitamin C.', difficulty: 'easy' },
    { word: 'milk', pronunciation: '/mɪlk/', part_of_speech: 'noun', meaning_vi: 'sữa tươi', example_sentence: 'Warm milk helps you sleep soundly.', example_translation: 'Sữa ấm giúp bạn ngủ ngon giấc.', difficulty: 'easy' },
    { word: 'tea', pronunciation: '/tiː/', part_of_speech: 'noun', meaning_vi: 'trà, chè', example_sentence: 'Green tea is popular in Asian culture.', example_translation: 'Trà xanh rất phổ biến trong văn hóa châu Á.', difficulty: 'easy' },
    { word: 'coffee', pronunciation: '/ˈkɒfi/', part_of_speech: 'noun', meaning_vi: 'cà phê', example_sentence: 'I start my workday with strong coffee.', example_translation: 'Tôi bắt đầu ngày làm việc với một tách cà phê đậm.', difficulty: 'easy' },
    { word: 'breakfast', pronunciation: '/ˈbrekfəst/', part_of_speech: 'noun', meaning_vi: 'bữa ăn sáng', example_sentence: 'Never skip your morning breakfast.', example_translation: 'Đừng bao giờ bỏ bữa ăn sáng.', difficulty: 'easy' },
    { word: 'lunch', pronunciation: '/lʌntʃ/', part_of_speech: 'noun', meaning_vi: 'bữa ăn trưa', example_sentence: 'We had light lunch at the cafeteria.', example_translation: 'Chúng tôi ăn trưa nhẹ tại quán ăn tự phục vụ.', difficulty: 'easy' },
    { word: 'dinner', pronunciation: '/ˈdɪnər/', part_of_speech: 'noun', meaning_vi: 'bữa ăn tối', example_sentence: 'Dinner is served at seven o\'clock.', example_translation: 'Bữa tối được dọn lúc bảy giờ.', difficulty: 'easy' },
    { word: 'delicious', pronunciation: '/dɪˈlɪʃəs/', part_of_speech: 'adjective', meaning_vi: 'ngon lành, thơm ngon', example_sentence: 'The soup is extremely delicious.', example_translation: 'Món súp này cực kỳ thơm ngon.', difficulty: 'medium' },
    { word: 'sweet', pronunciation: '/swiːt/', part_of_speech: 'adjective', meaning_vi: 'ngọt ngào', example_sentence: 'These ripe mangoes taste sweet.', example_translation: 'Những quả xoài chín này có vị rất ngọt.', difficulty: 'easy' },
    { word: 'sour', pronunciation: '/ˈsaʊər/', part_of_speech: 'adjective', meaning_vi: 'chua', example_sentence: 'Lemon juice is very sour.', example_translation: 'Nước chanh có vị rất chua.', difficulty: 'easy' },
    { word: 'spicy', pronunciation: '/ˈspaɪsi/', part_of_speech: 'adjective', meaning_vi: 'cay nồng', example_sentence: 'I cannot eat overly spicy food.', example_translation: 'Tôi không thể ăn thức ăn quá cay.', difficulty: 'medium' },
    { word: 'salty', pronunciation: '/ˈsɔːlti/', part_of_speech: 'adjective', meaning_vi: 'mặn', example_sentence: 'Do not make the broth too salty.', example_translation: 'Đừng nấu nước dùng quá mặn.', difficulty: 'medium' },
    { word: 'nutritious', pronunciation: '/njuːˈtrɪʃəs/', part_of_speech: 'adjective', meaning_vi: 'bổ dưỡng, giàu dinh dưỡng', example_sentence: 'Nuts are highly nutritious snacks.', example_translation: 'Các loại hạt là đồ ăn vặt giàu dinh dưỡng.', difficulty: 'hard' },
    { word: 'ingredient', pronunciation: '/ɪnˈɡriːdiənt/', part_of_speech: 'noun', meaning_vi: 'nguyên liệu, thành phần', example_sentence: 'Fresh ingredients make food taste better.', example_translation: 'Nguyên liệu tươi làm món ăn ngon hơn.', difficulty: 'hard' }
  ],
  5: [ // Hobbies (30 words)
    { word: 'hobby', pronunciation: '/ˈhɒbi/', part_of_speech: 'noun', meaning_vi: 'sở thích', example_sentence: 'Photography is my favorite hobby.', example_translation: 'Nhiếp ảnh là sở thích yêu thích của tôi.', difficulty: 'easy' },
    { word: 'music', pronunciation: '/ˈmjuːzɪk/', part_of_speech: 'noun', meaning_vi: 'âm nhạc', example_sentence: 'Listening to music calms the mind.', example_translation: 'Nghe nhạc giúp làm dịu tâm trí.', difficulty: 'easy' },
    { word: 'song', pronunciation: '/sɒŋ/', part_of_speech: 'noun', meaning_vi: 'bài hát', example_sentence: 'That ballad is a soothing song.', example_translation: 'Khúc ca ấy là một bài hát êm dịu.', difficulty: 'easy' },
    { word: 'sing', pronunciation: '/sɪŋ/', part_of_speech: 'verb', meaning_vi: 'hát', example_sentence: 'Birds sing sweetly in the trees.', example_translation: 'Chim hót líu lo ngọt ngào trên cây.', difficulty: 'easy' },
    { word: 'dance', pronunciation: '/dɑːns/', part_of_speech: 'verb', meaning_vi: 'nhảy múa, khiêu vũ', example_sentence: 'They dance together on the stage.', example_translation: 'Họ cùng nhau nhảy múa trên sân khấu.', difficulty: 'easy' },
    { word: 'guitar', pronunciation: '/ɡɪˈtɑːr/', part_of_speech: 'noun', meaning_vi: 'đàn ghi-ta', example_sentence: 'He can play the acoustic guitar.', example_translation: 'Anh ấy có thể chơi đàn ghi-ta mộc.', difficulty: 'easy' },
    { word: 'piano', pronunciation: '/piˈænəʊ/', part_of_speech: 'noun', meaning_vi: 'đàn dương cầm', example_sentence: 'She plays classical piano tunes.', example_translation: 'Cô ấy chơi những điệu đàn piano cổ điển.', difficulty: 'easy' },
    { word: 'read', pronunciation: '/riːd/', part_of_speech: 'verb', meaning_vi: 'đọc sách', example_sentence: 'I read novels before going to bed.', example_translation: 'Tôi đọc tiểu thuyết trước khi đi ngủ.', difficulty: 'easy' },
    { word: 'draw', pronunciation: '/drɔː/', part_of_speech: 'verb', meaning_vi: 'vẽ hình, vẽ chì', example_sentence: 'Children love to draw cartoons.', example_translation: 'Trẻ em rất thích vẽ tranh hoạt hình.', difficulty: 'easy' },
    { word: 'paint', pronunciation: '/peɪnt/', part_of_speech: 'verb', meaning_vi: 'vẽ màu, sơn', example_sentence: 'He paints beautiful landscapes.', example_translation: 'Anh ấy vẽ những bức tranh phong cảnh đẹp tuyệt.', difficulty: 'easy' },
    { word: 'photograph', pronunciation: '/ˈfəʊtəɡrɑːf/', part_of_speech: 'noun', meaning_vi: 'bức ảnh chụp', example_sentence: 'She took a clear photograph of the sunset.', example_translation: 'Cô ấy chụp một bức ảnh hoàng hôn rất rõ nét.', difficulty: 'medium' },
    { word: 'travel', pronunciation: '/ˈtrævl/', part_of_speech: 'verb', meaning_vi: 'du lịch, di chuyển', example_sentence: 'Traveling opens your mind.', example_translation: 'Đi du lịch mở rộng tầm hiểu biết của bạn.', difficulty: 'easy' },
    { word: 'sport', pronunciation: '/spɔːt/', part_of_speech: 'noun', meaning_vi: 'môn thể thao', example_sentence: 'Playing sports keeps the body active.', example_translation: 'Chơi thể thao giữ cho cơ thể năng động.', difficulty: 'easy' },
    { word: 'football', pronunciation: '/ˈfʊtbɔːl/', part_of_speech: 'noun', meaning_vi: 'bóng đá', example_sentence: 'Football is the most popular sport.', example_translation: 'Bóng đá là môn thể thao phổ biến nhất.', difficulty: 'easy' },
    { word: 'badminton', pronunciation: '/ˈbædmɪntən/', part_of_speech: 'noun', meaning_vi: 'cầu lông', example_sentence: 'We play badminton in the schoolyard.', example_translation: 'Chúng tôi chơi cầu lông ở sân trường.', difficulty: 'easy' },
    { word: 'basketball', pronunciation: '/ˈbɑːskɪtbɔːl/', part_of_speech: 'noun', meaning_vi: 'bóng rổ', example_sentence: 'He practices basketball every afternoon.', example_translation: 'Cậu ấy tập luyện bóng rổ mỗi chiều.', difficulty: 'medium' },
    { word: 'swimming', pronunciation: '/ˈswɪmɪŋ/', part_of_speech: 'noun', meaning_vi: 'bơi lội', example_sentence: 'Swimming is great cardio exercise.', example_translation: 'Bơi lội là bài tập tim mạch tuyệt vời.', difficulty: 'easy' },
    { word: 'running', pronunciation: '/ˈrʌnɪŋ/', part_of_speech: 'noun', meaning_vi: 'chạy bộ', example_sentence: 'Running in the fresh air is refreshing.', example_translation: 'Chạy bộ trong bầu không khí trong lành thật sảng khoái.', difficulty: 'easy' },
    { word: 'cycling', pronunciation: '/ˈsaɪklɪŋ/', part_of_speech: 'noun', meaning_vi: 'đạp xe đạp', example_sentence: 'Cycling along the lake is peaceful.', example_translation: 'Đạp xe dọc bờ hồ rất thanh bình.', difficulty: 'medium' },
    { word: 'gardening', pronunciation: '/ˈɡɑːdnɪŋ/', part_of_speech: 'noun', meaning_vi: 'làm vườn', example_sentence: 'Grandpa spends hours gardening.', example_translation: 'Ông dành nhiều giờ đồng hồ để làm vườn.', difficulty: 'medium' },
    { word: 'cooking', pronunciation: '/ˈkʊkɪŋ/', part_of_speech: 'noun', meaning_vi: 'nấu ăn', example_sentence: 'Cooking at home saves money.', example_translation: 'Nấu ăn tại nhà giúp tiết kiệm tiền bạc.', difficulty: 'easy' },
    { word: 'fishing', pronunciation: '/ˈfɪʃɪŋ/', part_of_speech: 'noun', meaning_vi: 'câu cá', example_sentence: 'Fishing requires a lot of patience.', example_translation: 'Câu cá đòi hỏi rất nhiều sự kiên nhẫn.', difficulty: 'easy' },
    { word: 'chess', pronunciation: '/tʃes/', part_of_speech: 'noun', meaning_vi: 'cờ vua', example_sentence: 'Playing chess sharpens logical thinking.', example_translation: 'Chơi cờ vua rèn luyện tư duy logic.', difficulty: 'medium' },
    { word: 'camping', pronunciation: '/ˈkæmpɪŋ/', part_of_speech: 'noun', meaning_vi: 'cắm trại', example_sentence: 'We went camping in the national forest.', example_translation: 'Chúng tôi đi cắm trại trong rừng quốc gia.', difficulty: 'medium' },
    { word: 'collect', pronunciation: '/kəˈlekt/', part_of_speech: 'verb', meaning_vi: 'sưu tầm, thu thập', example_sentence: 'He likes to collect vintage stamps.', example_translation: 'Anh ấy thích sưu tầm những con tem cổ.', difficulty: 'medium' },
    { word: 'relax', pronunciation: '/rɪˈlæks/', part_of_speech: 'verb', meaning_vi: 'thư giãn, nghỉ ngơi', example_sentence: 'Take deep breaths and relax.', example_translation: 'Hãy hít thở sâu và thư giãn.', difficulty: 'easy' },
    { word: 'enjoy', pronunciation: '/ɪnˈdʒɔɪ/', part_of_speech: 'verb', meaning_vi: 'tận hưởng, thưởng thức', example_sentence: 'Enjoy the little moments in life.', example_translation: 'Hãy tận hưởng những khoảnh khắc nhỏ bé trong đời.', difficulty: 'easy' },
    { word: 'exciting', pronunciation: '/ɪkˈsaɪtɪŋ/', part_of_speech: 'adjective', meaning_vi: 'hào hứng, thú vị', example_sentence: 'The match had an exciting finish.', example_translation: 'Trận đấu có kết thúc vô cùng kịch tính.', difficulty: 'medium' },
    { word: 'entertainment', pronunciation: '/ˌentəˈteɪnmənt/', part_of_speech: 'noun', meaning_vi: 'sự giải trí', example_sentence: 'Cinema provides great entertainment.', example_translation: 'Rạp chiếu phim đem lại sự giải trí tuyệt vời.', difficulty: 'hard' },
    { word: 'recreation', pronunciation: '/ˌrekriˈeɪʃn/', part_of_speech: 'noun', meaning_vi: 'hoạt động giải trí tái tạo năng lượng', example_sentence: 'Parks offer space for community recreation.', example_translation: 'Các công viên cung cấp không gian giải trí cho cộng đồng.', difficulty: 'hard' }
  ],
  6: [ // Animals (30 words)
    { word: 'animal', pronunciation: '/ˈænɪml/', part_of_speech: 'noun', meaning_vi: 'động vật, muông thú', example_sentence: 'Protect endangered animal species.', example_translation: 'Hãy bảo vệ các loài động vật có nguy cơ tuyệt chủng.', difficulty: 'easy' },
    { word: 'pet', pronunciation: '/pet/', part_of_speech: 'noun', meaning_vi: 'thú cưng', example_sentence: 'A cute puppy is my favorite pet.', example_translation: 'Một chú cún con dễ thương là thú cưng yêu thích của tôi.', difficulty: 'easy' },
    { word: 'dog', pronunciation: '/dɒɡ/', part_of_speech: 'noun', meaning_vi: 'con chó', example_sentence: 'The loyal dog barks at strangers.', example_translation: 'Con chó trung thành sủa người lạ.', difficulty: 'easy' },
    { word: 'cat', pronunciation: '/kæt/', part_of_speech: 'noun', meaning_vi: 'con mèo', example_sentence: 'The cat is purring softly in the sun.', example_translation: 'Con mèo đang kêu rừ rừ êm ái dưới nắng.', difficulty: 'easy' },
    { word: 'bird', pronunciation: '/bɜːd/', part_of_speech: 'noun', meaning_vi: 'con chim', example_sentence: 'A blue bird built a nest on the branch.', example_translation: 'Một chú chim xanh đã làm tổ trên cành cây.', difficulty: 'easy' },
    { word: 'rabbit', pronunciation: '/ˈræbɪt/', part_of_speech: 'noun', meaning_vi: 'con thỏ', example_sentence: 'The white rabbit has long ears.', example_translation: 'Con thỏ trắng có đôi tai dài.', difficulty: 'easy' },
    { word: 'mouse', pronunciation: '/maʊs/', part_of_speech: 'noun', meaning_vi: 'con chuột', example_sentence: 'The cat chased a small mouse.', example_translation: 'Con mèo đuổi theo một con chuột nhỏ.', difficulty: 'easy' },
    { word: 'horse', pronunciation: '/hɔːs/', part_of_speech: 'noun', meaning_vi: 'con ngựa', example_sentence: 'The black horse ran across the meadow.', example_translation: 'Con ngựa đen chạy băng qua đồng cỏ.', difficulty: 'easy' },
    { word: 'cow', pronunciation: '/kaʊ/', part_of_speech: 'noun', meaning_vi: 'con bò cái', example_sentence: 'Dairy cows provide fresh milk.', example_translation: 'Bò sữa cung cấp nguồn sữa tươi.', difficulty: 'easy' },
    { word: 'pig', pronunciation: '/pɪɡ/', part_of_speech: 'noun', meaning_vi: 'con heo, con lợn', example_sentence: 'Pigs are actually intelligent animals.', example_translation: 'Heo thực ra là loài động vật rất thông minh.', difficulty: 'easy' },
    { word: 'sheep', pronunciation: '/ʃiːp/', part_of_speech: 'noun', meaning_vi: 'con cừu', example_sentence: 'The white sheep graze on the hillside.', example_translation: 'Đàn cừu trắng gặm cỏ trên sườn đồi.', difficulty: 'easy' },
    { word: 'duck', pronunciation: '/dʌk/', part_of_speech: 'noun', meaning_vi: 'con vịt', example_sentence: 'Ducks swim happily in the calm pond.', example_translation: 'Những chú vịt bơi lội vui vẻ trong ao phẳng lặng.', difficulty: 'easy' },
    { word: 'chicken', pronunciation: '/ˈtʃɪkɪn/', part_of_speech: 'noun', meaning_vi: 'con gà', example_sentence: 'The hen takes care of her chicks.', example_translation: 'Gà mái chăm sóc đàn gà con của mình.', difficulty: 'easy' },
    { word: 'elephant', pronunciation: '/ˈelɪfənt/', part_of_speech: 'noun', meaning_vi: 'con voi', example_sentence: 'The giant elephant has a long trunk.', example_translation: 'Chú voi khổng lồ có một chiếc vòi dài.', difficulty: 'medium' },
    { word: 'lion', pronunciation: '/ˈlaɪən/', part_of_speech: 'noun', meaning_vi: 'sư tử', example_sentence: 'The lion is called the king of the jungle.', example_translation: 'Sư tử được xưng là chúa tể muôn loài.', difficulty: 'medium' },
    { word: 'tiger', pronunciation: '/ˈtaɪɡər/', part_of_speech: 'noun', meaning_vi: 'con hổ, cọp', example_sentence: 'A wild tiger has distinctive orange stripes.', example_translation: 'Một chú hổ hoang dã có những vằn cam nổi bật.', difficulty: 'medium' },
    { word: 'monkey', pronunciation: '/ˈmʌŋki/', part_of_speech: 'noun', meaning_vi: 'con khỉ', example_sentence: 'Monkeys swing skillfully through trees.', example_translation: 'Khỉ chuyền cành khéo léo qua các tán cây.', difficulty: 'easy' },
    { word: 'bear', pronunciation: '/beər/', part_of_speech: 'noun', meaning_vi: 'con gấu', example_sentence: 'The brown bear catches fish in the stream.', example_translation: 'Gấu nâu bắt cá dưới dòng suối.', difficulty: 'easy' },
    { word: 'dolphin', pronunciation: '/ˈdɒlfɪn/', part_of_speech: 'noun', meaning_vi: 'cá heo', example_sentence: 'Dolphins are friendly to swimmers.', example_translation: 'Cá heo rất thân thiện với người đi bơi.', difficulty: 'medium' },
    { word: 'whale', pronunciation: '/weɪl/', part_of_speech: 'noun', meaning_vi: 'cá voi', example_sentence: 'The blue whale is the largest mammal on Earth.', example_translation: 'Cá voi xanh là loài thú lớn nhất trên Trái Đất.', difficulty: 'medium' },
    { word: 'shark', pronunciation: '/ʃɑːk/', part_of_speech: 'noun', meaning_vi: 'cá mập', example_sentence: 'The shark swam rapidly in deep ocean waters.', example_translation: 'Cá mập bơi lẹ làng dưới làn nước đại dương sâu thẳm.', difficulty: 'medium' },
    { word: 'snake', pronunciation: '/sneɪk/', part_of_speech: 'noun', meaning_vi: 'con rắn', example_sentence: 'Some snakes possess deadly venom.', example_translation: 'Một số loài rắn sở hữu nọc độc chết người.', difficulty: 'easy' },
    { word: 'frog', pronunciation: '/frɒɡ/', part_of_speech: 'noun', meaning_vi: 'con ếch', example_sentence: 'The green frog leaped into the water.', example_translation: 'Chú ếch xanh nhảy tõm xuống làn nước.', difficulty: 'easy' },
    { word: 'butterfly', pronunciation: '/ˈbʌtəflaɪ/', part_of_speech: 'noun', meaning_vi: 'con bướm', example_sentence: 'A colorful butterfly landed gently on the flower.', example_translation: 'Một chú bướm sặc sỡ đậu nhẹ nhàng lên bông hoa.', difficulty: 'medium' },
    { word: 'wild', pronunciation: '/waɪld/', part_of_speech: 'adjective', meaning_vi: 'hoang dã', example_sentence: 'Wild animals belong in natural habitats.', example_translation: 'Động vật hoang dã thuộc về môi trường sống tự nhiên.', difficulty: 'medium' },
    { word: 'tail', pronunciation: '/teɪl/', part_of_speech: 'noun', meaning_vi: 'cái đuôi', example_sentence: 'The puppy wags its tail happily.', example_translation: 'Chú cún con vẫy đuôi mừng rỡ.', difficulty: 'easy' },
    { word: 'feather', pronunciation: '/ˈfeðər/', part_of_speech: 'noun', meaning_vi: 'lông vũ', example_sentence: 'Peacocks have magnificent colored feathers.', example_translation: 'Chim công có bộ lông vũ nhiều màu tuyệt đẹp.', difficulty: 'medium' },
    { word: 'fur', pronunciation: '/fɜːr/', part_of_speech: 'noun', meaning_vi: 'lông mao, bộ lông thú', example_sentence: 'Polar bears have thick fur against freezing wind.', example_translation: 'Gấu Bắc cực có bộ lông dày chống lại gió buốt.', difficulty: 'medium' },
    { word: 'habitat', pronunciation: '/ˈhæbɪtæt/', part_of_speech: 'noun', meaning_vi: 'môi trường sống tự nhiên', example_sentence: 'Deforestation destroys forest animal habitats.', example_translation: 'Nạn phá rừng phá hủy môi trường sống của động vật rừng.', difficulty: 'hard' },
    { word: 'predator', pronunciation: '/ˈpredətər/', part_of_speech: 'noun', meaning_vi: 'loài săn mồi', example_sentence: 'Lions are apex predators in the savanna.', example_translation: 'Sư tử là loài săn mồi đỉnh cao trên thảo nguyên.', difficulty: 'hard' }
  ],
  7: [ // Daily Life (30 words)
    { word: 'morning', pronunciation: '/ˈmɔːnɪŋ/', part_of_speech: 'noun', meaning_vi: 'buổi sáng', example_sentence: 'Good morning to everyone!', example_translation: 'Chào buổi sáng mọi người!', difficulty: 'easy' },
    { word: 'afternoon', pronunciation: '/ˌɑːftəˈnuːn/', part_of_speech: 'noun', meaning_vi: 'buổi chiều', example_sentence: 'The heat peaks in the mid afternoon.', example_translation: 'Cơn nóng đạt đỉnh vào giữa buổi chiều.', difficulty: 'easy' },
    { word: 'evening', pronunciation: '/ˈiːvnɪŋ/', part_of_speech: 'noun', meaning_vi: 'buổi tối', example_sentence: 'We unwind together in the evening.', example_translation: 'Chúng tôi cùng nhau thư giãn vào buổi tối.', difficulty: 'easy' },
    { word: 'night', pronunciation: '/naɪt/', part_of_speech: 'noun', meaning_vi: 'đêm, ban đêm', example_sentence: 'Stars sparkle across the dark night.', example_translation: 'Những vì sao lấp lánh trên màn đêm tăm tối.', difficulty: 'easy' },
    { word: 'wake', pronunciation: '/weɪk/', part_of_speech: 'verb', meaning_vi: 'thức dậy, tỉnh giấc', example_sentence: 'I wake up at six every morning.', example_translation: 'Tôi thức dậy lúc sáu giờ mỗi sáng.', difficulty: 'easy' },
    { word: 'sleep', pronunciation: '/sliːp/', part_of_speech: 'verb', meaning_vi: 'ngủ', example_sentence: 'Aim to sleep eight hours a night.', example_translation: 'Hãy cố gắng ngủ đủ tám tiếng mỗi đêm.', difficulty: 'easy' },
    { word: 'wash', pronunciation: '/wɒʃ/', part_of_speech: 'verb', meaning_vi: 'rửa, giặt giũ', example_sentence: 'Wash your hands before eating meals.', example_translation: 'Hãy rửa tay sạch trước khi dùng bữa.', difficulty: 'easy' },
    { word: 'brush', pronunciation: '/brʌʃ/', part_of_speech: 'verb', meaning_vi: 'chải (tóc), đánh (răng)', example_sentence: 'Brush your teeth twice a day.', example_translation: 'Hãy đánh răng hai lần một ngày.', difficulty: 'easy' },
    { word: 'shower', pronunciation: '/ˈʃaʊər/', part_of_speech: 'noun', meaning_vi: 'vòi hoa sen; tắm vòi sen', example_sentence: 'A cool shower wakes you right up.', example_translation: 'Tắm vòi sen mát mẻ sẽ giúp bạn tỉnh táo ngay.', difficulty: 'easy' },
    { word: 'dress', pronunciation: '/dres/', part_of_speech: 'verb', meaning_vi: 'mặc quần áo', example_sentence: 'Dress warmly when it is cold outside.', example_translation: 'Hãy mặc ấm khi ngoài trời lạnh giá.', difficulty: 'easy' },
    { word: 'clothes', pronunciation: '/kləʊðz/', part_of_speech: 'noun', meaning_vi: 'quần áo, trang phục', example_sentence: 'Fold your clean clothes neatly.', example_translation: 'Hãy gấp quần áo sạch sẽ thật gọn gàng.', difficulty: 'easy' },
    { word: 'house', pronunciation: '/haʊs/', part_of_speech: 'noun', meaning_vi: 'ngôi nhà', example_sentence: 'Our house has a lovely front porch.', example_translation: 'Nhà chúng tôi có một hiên trước rất đáng yêu.', difficulty: 'easy' },
    { word: 'room', pronunciation: '/ruːm/', part_of_speech: 'noun', meaning_vi: 'căn phòng', example_sentence: 'Keep your bedroom tidy and fresh.', example_translation: 'Hãy giữ phòng ngủ ngăn nắp và thoáng mát.', difficulty: 'easy' },
    { word: 'kitchen', pronunciation: '/ˈkɪtʃɪn/', part_of_speech: 'noun', meaning_vi: 'nhà bếp', example_sentence: 'Mother is preparing soup in the kitchen.', example_translation: 'Mẹ đang nấu súp trong gian bếp.', difficulty: 'easy' },
    { word: 'clean', pronunciation: '/kliːn/', part_of_speech: 'verb', meaning_vi: 'lau dọn, làm sạch', example_sentence: 'We clean the living room every weekend.', example_translation: 'Chúng tôi lau dọn phòng khách mỗi cuối tuần.', difficulty: 'easy' },
    { word: 'cook', pronunciation: '/kʊk/', part_of_speech: 'verb', meaning_vi: 'nấu nướng', example_sentence: 'Learn to cook healthy simple dishes.', example_translation: 'Hãy học cách nấu những món ăn đơn giản lành mạnh.', difficulty: 'easy' },
    { word: 'market', pronunciation: '/ˈmɑːkɪt/', part_of_speech: 'noun', meaning_vi: 'chợ', example_sentence: 'She buys fresh herbs at the local market.', example_translation: 'Cô ấy mua rau thơm tươi ở khu chợ địa phương.', difficulty: 'easy' },
    { word: 'buy', pronunciation: '/baɪ/', part_of_speech: 'verb', meaning_vi: 'mua sắm', example_sentence: 'Buy only what you truly need.', example_translation: 'Chỉ nên mua những thứ bạn thực sự cần.', difficulty: 'easy' },
    { word: 'work', pronunciation: '/wɜːk/', part_of_speech: 'verb', meaning_vi: 'làm việc', example_sentence: 'My parents work at an enterprise.', example_translation: 'Bố mẹ tôi làm việc tại một doanh nghiệp.', difficulty: 'easy' },
    { word: 'busy', pronunciation: '/ˈbɪzi/', part_of_speech: 'adjective', meaning_vi: 'bận rộn', example_sentence: 'Mondays are usually very busy days.', example_translation: 'Thứ Hai thường là những ngày rất bận rộn.', difficulty: 'easy' },
    { word: 'clock', pronunciation: '/klɒk/', part_of_speech: 'noun', meaning_vi: 'đồng hồ treo tường/để bàn', example_sentence: 'The wall clock ticks in silence.', example_translation: 'Đồng hồ treo tường tích tắc trong tĩnh lặng.', difficulty: 'easy' },
    { word: 'time', pronunciation: '/taɪm/', part_of_speech: 'noun', meaning_vi: 'thời gian, giờ giấc', example_sentence: 'Time is the most precious gift.', example_translation: 'Thời gian là món quà quý giá nhất.', difficulty: 'easy' },
    { word: 'calendar', pronunciation: '/ˈkælɪndər/', part_of_speech: 'noun', meaning_vi: 'quyển lịch, lịch trình', example_sentence: 'Mark important exams on the wall calendar.', example_translation: 'Hãy đánh dấu các kỳ thi quan trọng lên lịch tường.', difficulty: 'medium' },
    { word: 'schedule', pronunciation: '/ˈʃedjuːl/', part_of_speech: 'noun', meaning_vi: 'thời gian biểu, lịch trình', example_sentence: 'Stick to a steady study schedule.', example_translation: 'Hãy tuân thủ một lịch trình học tập đều đặn.', difficulty: 'medium' },
    { word: 'habit', pronunciation: '/ˈhæbɪt/', part_of_speech: 'noun', meaning_vi: 'thói quen', example_sentence: 'Early rising is a wonderful habit.', example_translation: 'Dậy sớm là một thói quen tuyệt vời.', difficulty: 'medium' },
    { word: 'routine', pronunciation: '/ruːˈtiːn/', part_of_speech: 'noun', meaning_vi: 'thói quen thường nhật, lệ thường', example_sentence: 'Exercise is part of my daily routine.', example_translation: 'Tập thể dục là một phần thói quen hằng ngày của tôi.', difficulty: 'medium' },
    { word: 'chores', pronunciation: '/tʃɔːz/', part_of_speech: 'noun', meaning_vi: 'công việc vặt trong nhà', example_sentence: 'Doing chores teaches responsibility.', example_translation: 'Làm việc nhà dạy cho ta tinh thần trách nhiệm.', difficulty: 'medium' },
    { word: 'commute', pronunciation: '/kəˈmjuːt/', part_of_speech: 'verb', meaning_vi: 'đi lại hằng ngày (đi làm, đi học)', example_sentence: 'Many citizens commute to work by bus.', example_translation: 'Nhiều người dân đi làm hằng ngày bằng xe buýt.', difficulty: 'hard' },
    { word: 'punctual', pronunciation: '/ˈpʌŋktʃuəl/', part_of_speech: 'adjective', meaning_vi: 'đúng giờ', example_sentence: 'Always be punctual for business meetings.', example_translation: 'Hãy luôn đúng giờ cho các cuộc hẹn công việc.', difficulty: 'hard' },
    { word: 'lifestyle', pronunciation: '/ˈlaɪfstaɪl/', part_of_speech: 'noun', meaning_vi: 'phong cách sống, lối sống', example_sentence: 'A balanced lifestyle keeps you healthy and serene.', example_translation: 'Một lối sống cân bằng giúp bạn khỏe mạnh và thanh thản.', difficulty: 'hard' }
  ]
};

// 21 Readings (3 per topic: easy, medium, hard) with 4 questions each = 84 questions total!
const readingsData = [
  // Topic 1: About Me
  {
    topic_id: 1,
    title: 'Introducing Myself',
    title_vi: 'Tự Giới Thiệu Bản Thân',
    difficulty: 'easy',
    word_count: 85,
    estimated_time_minutes: 3,
    content: `Hello everyone! My name is Minh, and I am twelve years old. I am in grade six at Thang Long Middle School. I live in Hanoi with my mother, father, and baby brother. I am tall and a little shy, but once I get to know people, I am very friendly and helpful. In my free time, I love reading comic books and playing badminton with my classmates. I want to improve my English so I can talk to international friends.`,
    content_vi: `Xin chào mọi người! Tên tôi là Minh, và tôi mười hai tuổi. Tôi học lớp sáu tại trường Trung học cơ sở Thăng Long. Tôi sống ở Hà Nội cùng mẹ, bố và em trai nhỏ. Tôi cao và hơi nhút nhát một chút, nhưng khi đã quen mọi người, tôi rất thân thiện và hay giúp đỡ. Vào thời gian rảnh, tôi thích đọc truyện tranh và chơi cầu lông cùng các bạn cùng lớp. Tôi muốn nâng cao tiếng Anh của mình để có thể trò chuyện với bạn bè quốc tế.`,
    questions: [
      { question_text: 'How old is Minh?', question_text_vi: 'Minh bao nhiêu tuổi?', options: ['10 years old', '12 years old', '14 years old', '16 years old'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "My name is Minh, and I am twelve years old" (12 tuổi).' },
      { question_text: 'Where does Minh live?', question_text_vi: 'Minh sống ở đâu?', options: ['Da Nang', 'Hue', 'Hanoi', 'Ho Chi Minh City'], correct_option: 2, explanation_vi: 'Đoạn văn viết: "I live in Hanoi with my mother, father, and baby brother" (Hà Nội).' },
      { question_text: 'What does Minh like to do in his free time?', question_text_vi: 'Minh thích làm gì vào thời gian rảnh?', options: ['Playing football', 'Reading comic books and playing badminton', 'Watching television', 'Swimming'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "In my free time, I love reading comic books and playing badminton".' },
      { question_text: 'Why does Minh want to improve his English?', question_text_vi: 'Tại sao Minh muốn nâng cao tiếng Anh của mình?', options: ['To get high grades only', 'To travel alone', 'To speak with international friends', 'Because his parents force him'], correct_option: 2, explanation_vi: 'Đoạn văn viết: "so I can talk to international friends".' }
    ]
  },
  {
    topic_id: 1,
    title: 'A Person I Admire',
    title_vi: 'Một Người Tôi Ngưỡng Mộ',
    difficulty: 'medium',
    word_count: 140,
    estimated_time_minutes: 4,
    content: `Among all the people I know, I admire my older cousin, Lan, the most. She is currently studying computer science at university. Lan is not only intelligent but also exceptionally hardworking. She wakes up at five o'clock every morning to exercise and review her lectures before classes begin. Whenever anyone in our family faces a challenging technological problem, Lan is always patient and willing to explain the solution step by step. Her dream is to develop educational software that assists underprivileged children across our country. Seeing her dedication inspires me to set clear goals for my own studies and pursue them with perseverance every day.`,
    content_vi: `Trong số tất cả những người tôi biết, tôi ngưỡng mộ chị họ Lan nhất. Chị hiện đang học ngành khoa học máy tính tại trường đại học. Lan không chỉ thông minh mà còn vô cùng chăm chỉ. Chị thức dậy lúc năm giờ mỗi sáng để tập thể dục và xem lại bài giảng trước khi giờ học bắt đầu. Bất cứ khi nào có ai trong gia đình gặp phải vấn đề công nghệ hóc búa, Lan luôn kiên nhẫn và sẵn lòng giải thích giải pháp từng bước một. Ước mơ của chị là phát triển phần mềm giáo dục hỗ trợ trẻ em nghèo khó trên khắp đất nước. Chứng kiến sự cống hiến của chị đã truyền cảm hứng để tôi đặt ra những mục tiêu rõ ràng cho việc học của mình và kiên trì theo đuổi mỗi ngày.`,
    questions: [
      { question_text: 'What is Lan studying at university?', question_text_vi: 'Lan đang học ngành gì ở trường đại học?', options: ['Medicine', 'Computer science', 'Fine arts', 'Business management'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "She is currently studying computer science at university".' },
      { question_text: 'What does Lan do every morning at five o\'clock?', question_text_vi: 'Lan làm gì mỗi sáng lúc 5 giờ?', options: ['She goes to the market', 'She exercises and reviews lectures', 'She plays video games', 'She visits her friends'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "She wakes up at five o\'clock every morning to exercise and review her lectures".' },
      { question_text: 'What is Lan\'s ultimate dream?', question_text_vi: 'Ước mơ lớn nhất của Lan là gì?', options: ['To earn a lot of money abroad', 'To buy a large house', 'To build educational software for disadvantaged kids', 'To become a professional athlete'], correct_option: 2, explanation_vi: 'Đoạn văn viết: "Her dream is to develop educational software that assists underprivileged children".' },
      { question_text: 'What quality of Lan is highlighted when she helps family members?', question_text_vi: 'Phẩm chất nào của Lan được làm nổi bật khi chị giúp đỡ người thân?', options: ['Impatience', 'Patience and willingness', 'Strictness', 'Silence'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "Lan is always patient and willing to explain the solution step by step".' }
    ]
  },
  {
    topic_id: 1,
    title: 'The Journey of Self-Discovery',
    title_vi: 'Hành Trình Khám Phá Bản Thân',
    difficulty: 'hard',
    word_count: 175,
    estimated_time_minutes: 5,
    content: `Understanding oneself is widely considered one of the greatest accomplishments in human life. Many young adolescents experience confusion regarding their genuine interests and core values as they navigate school expectations and societal peer pressure. Psychologists suggest that self-discovery requires continuous reflection, the courage to embrace mistakes, and the willingness to explore unfamiliar hobbies. When we experiment with painting, coding, or public speaking, we gradually uncover hidden strengths that traditional examinations rarely measure. Furthermore, cultivating self-awareness enables us to make deliberate choices rather than merely imitating others. True confidence arises not from superficial compliments or comparisons, but from an authentic appreciation of one's own capabilities and an ongoing commitment to personal growth. Ultimately, when you know who you are and what you stand for, decisions become simpler and everyday challenges become opportunities for character building.`,
    content_vi: `Thấu hiểu bản thân được công nhận rộng rãi là một trong những thành tựu vĩ đại nhất của đời người. Rất nhiều thanh thiếu niên trải qua cảm giác bối rối liên quan đến những sở thích đích thực và các giá trị cốt lõi của họ khi phải đối mặt với kỳ vọng của nhà trường và áp lực đồng trang lứa. Các nhà tâm lý học gợi ý rằng việc khám phá bản thân đòi hỏi sự tự chiêm nghiệm liên tục, lòng dũng cảm đón nhận sai lầm và sự sẵn sàng khám phá các sở thích mới lạ. Khi chúng ta thử sức với hội họa, lập trình hay diễn thuyết trước đám đông, chúng ta sẽ dần dần hé lộ những thế mạnh tiềm ẩn mà các bài thi truyền thống hiếm khi đo lường được. Hơn thế nữa, việc nuôi dưỡng sự tự nhận thức giúp chúng ta đưa ra những lựa chọn có chủ đích thay vì chỉ đơn thuần bắt chước người khác. Sự tự tin thực sự không bắt nguồn từ những lời khen hời hợt hay sự so sánh, mà đến từ sự trân trọng chân thực đối với năng lực của chính mình cùng sự cam kết không ngừng cho sự trưởng thành cá nhân. Rốt cuộc, khi bạn biết mình là ai và đại diện cho điều gì, mọi quyết định sẽ trở nên đơn giản hơn và những thử thách thường nhật sẽ trở thành cơ hội tôi luyện nhân cách.`,
    questions: [
      { question_text: 'What often causes confusion for young adolescents according to the text?', question_text_vi: 'Điều gì thường gây bối rối cho thanh thiếu niên theo đoạn văn?', options: ['Lack of physical sleep', 'School expectations and peer pressure', 'Unhealthy nutrition', 'Excessive sports'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "Many young adolescents experience confusion... as they navigate school expectations and societal peer pressure".' },
      { question_text: 'What does self-discovery require according to psychologists?', question_text_vi: 'Theo các nhà tâm lý học, việc khám phá bản thân đòi hỏi điều gì?', options: ['Avoiding any mistakes', 'Reflection, embracing mistakes, and exploring new hobbies', 'Relying exclusively on test scores', 'Following popular trends blindly'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "requires continuous reflection, the courage to embrace mistakes, and the willingness to explore unfamiliar hobbies".' },
      { question_text: 'Where does genuine confidence stem from?', question_text_vi: 'Sự tự tin đích thực bắt nguồn từ đâu?', options: ['Superficial praise and winning trophies', 'Comparing oneself with others', 'Appreciation of one\'s capabilities and commitment to growth', 'High wealth'], correct_option: 2, explanation_vi: 'Đoạn văn viết: "arises not from superficial compliments... but from an authentic appreciation of one\'s own capabilities and an ongoing commitment to personal growth".' },
      { question_text: 'What is the main benefit of cultivating self-awareness mentioned in the passage?', question_text_vi: 'Lợi ích chính của việc nuôi dưỡng nhận thức bản thân được nhắc đến là gì?', options: ['Making deliberate choices instead of copying others', 'Winning arguments', 'Passing exams without studying', 'Becoming famous on social media'], correct_option: 0, explanation_vi: 'Đoạn văn viết: "cultivating self-awareness enables us to make deliberate choices rather than merely imitating others".' }
    ]
  },

  // Topic 2: Family
  {
    topic_id: 2,
    title: 'A Sunday with My Family',
    title_vi: 'Một Ngày Chủ Nhật Bên Gia Đình',
    difficulty: 'easy',
    word_count: 90,
    estimated_time_minutes: 3,
    content: `Sunday is my favorite day of the week because my whole family spends time together. In the morning, my father and I clean the garden and water the blooming flowers. My mother and sister go to the local market to buy fresh vegetables, pork, and sweet fruits. At noon, we prepare a delicious lunch together. We laugh and share stories from our school week. In the afternoon, we usually play board games or visit our grandparents who live nearby. Being together makes our family bond very strong and happy.`,
    content_vi: `Chủ Nhật là ngày tôi yêu thích nhất trong tuần vì cả gia đình tôi dành thời gian bên nhau. Vào buổi sáng, bố và tôi dọn dẹp vườn và tưới những bông hoa đang nở rộ. Mẹ và chị gái tôi đi chợ địa phương để mua rau tươi, thịt lợn và trái cây ngọt. Vào buổi trưa, chúng tôi cùng nhau chuẩn bị bữa trưa thơm ngon. Chúng tôi cười đùa và chia sẻ những câu chuyện trong tuần học. Vào buổi chiều, chúng tôi thường chơi trò chơi cờ bàn hoặc đến thăm ông bà sống gần đó. Được ở bên nhau làm cho tình cảm gia đình chúng tôi thêm gắn kết và hạnh phúc.`,
    questions: [
      { question_text: 'Why does the author like Sunday the most?', question_text_vi: 'Tại sao tác giả thích ngày Chủ nhật nhất?', options: ['Because there is no homework', 'Because the whole family spends time together', 'Because of cartoons on TV', 'Because of fast food'], correct_option: 1, explanation_vi: 'Đoạn văn nói: "because my whole family spends time together".' },
      { question_text: 'What do the father and the author do in the morning?', question_text_vi: 'Bố và tác giả làm gì vào buổi sáng?', options: ['Go shopping', 'Clean the garden and water flowers', 'Sleep until noon', 'Watch football'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "my father and I clean the garden and water the blooming flowers".' },
      { question_text: 'Where do mother and sister go?', question_text_vi: 'Mẹ và chị gái đi đâu?', options: ['To the supermarket in town', 'To the local market', 'To the hospital', 'To the cinema'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "My mother and sister go to the local market".' },
      { question_text: 'Whom does the family visit in the afternoon?', question_text_vi: 'Buổi chiều gia đình đến thăm ai?', options: ['Their teacher', 'Their grandparents', 'Their uncle in Da Nang', 'Their neighbor'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "or visit our grandparents who live nearby".' }
    ]
  },
  {
    topic_id: 2,
    title: 'The Value of Family Traditions',
    title_vi: 'Giá Trị Của Truyền Thống Gia Đình',
    difficulty: 'medium',
    word_count: 145,
    estimated_time_minutes: 4,
    content: `Family traditions are customs and rituals that households pass down from one generation to the next. In many Vietnamese homes, preparing chung cake before the Lunar New Year stands out as a cherished tradition. Every winter, uncles, aunts, cousins, and grandparents gather around a warm woodfire late into the night. While waiting for the large pot of square cakes to cook, elders recount ancestral legends and impart moral wisdom to the youth. Beyond festive celebrations, simple daily traditions like eating dinner together without mobile phones foster emotional security and open communication among family members. Sociological research consistently demonstrates that adolescents raised in homes with consistent traditions demonstrate higher self-esteem and stronger emotional resilience when confronting life challenges. Preserving these customs ensures that despite rapid modernization, individuals remain deeply anchored to their cultural roots.`,
    content_vi: `Truyền thống gia đình là những phong tục và tập quán mà các hộ gia đình truyền từ thế hệ này sang thế hệ khác. Trong nhiều gia đình Việt Nam, việc chuẩn bị bánh chưng trước Tết Nguyên Đán là một truyền thống thiêng liêng và đáng trân trọng. Mỗi mùa đông, các chú, dì, anh chị em họ và ông bà cùng tụ họp quanh bếp lửa ấm áp đến tận đêm khuya. Trong khi chờ đợi nồi bánh chưng vuông vức chín, những bậc cao niên kể lại những truyền thuyết của tổ tiên và truyền dạy những bài học đạo đức cho giới trẻ. Ngoài những dịp lễ hội, những thói quen giản dị hằng ngày như ăn tối cùng nhau mà không dùng điện thoại di động giúp nuôi dưỡng cảm giác an toàn và sự giao tiếp cởi mở giữa các thành viên. Nghiên cứu xã hội học liên tục chứng minh rằng những thiếu niên lớn lên trong các gia đình duy trì truyền thống bền vững thường có lòng tự trọng cao hơn và khả năng kiên cường cảm xúc tốt hơn khi đối mặt với thử thách cuộc sống. Việc giữ gìn những phong tục này đảm bảo rằng dù cho hiện đại hóa diễn ra nhanh chóng, mỗi cá nhân vẫn luôn gắn bó sâu sắc với cội nguồn văn hóa của mình.`,
    questions: [
      { question_text: 'What example of a Vietnamese tradition is highlighted in the text?', question_text_vi: 'Ví dụ nào về truyền thống Việt Nam được nêu bật trong bài?', options: ['Making chung cake before Tet', 'Racing boats in autumn', 'Flying kites in summer', 'Decorating pine trees in winter'], correct_option: 0, explanation_vi: 'Đoạn văn viết: "preparing chung cake before the Lunar New Year stands out as a cherished tradition".' },
      { question_text: 'What do elders do around the woodfire?', question_text_vi: 'Những người lớn tuổi làm gì bên bếp củi?', options: ['Sing pop songs', 'Recount legends and impart moral lessons', 'Use mobile phones', 'Sleep'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "elders recount ancestral legends and impart moral wisdom to the youth".' },
      { question_text: 'What simple daily tradition is praised for fostering communication?', question_text_vi: 'Thói quen thường nhật đơn giản nào được khen ngợi vì giúp tăng cường giao tiếp?', options: ['Watching news together', 'Eating dinner without mobile phones', 'Waking up at the same hour', 'Buying identical clothes'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "eating dinner together without mobile phones foster emotional security and open communication".' },
      { question_text: 'According to research, what benefit do children from traditional homes experience?', question_text_vi: 'Theo nghiên cứu, trẻ em từ những gia đình có truyền thống nhận được lợi ích gì?', options: ['Guaranteed financial wealth', 'Higher self-esteem and emotional resilience', 'Immunity from illnesses', 'Perfect school scores'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "demonstrate higher self-esteem and stronger emotional resilience when confronting life challenges".' }
    ]
  },
  {
    topic_id: 2,
    title: 'Intergenerational Harmony in Modern Households',
    title_vi: 'Hòa Hợp Giữa Các Thế Hệ Trong Gia Đình Hiện Đại',
    difficulty: 'hard',
    word_count: 180,
    estimated_time_minutes: 5,
    content: `The multigenerational household, where grandparents, parents, and offspring reside under the same roof, has long been the cornerstone of Asian society. While this living arrangement provides indispensable mutual support—such as cost-sharing and reliable childcare assistance—it inevitably introduces friction stemming from divergent generational perspectives. Grandparents often prioritize traditional manners, thriftiness, and historical norms, whereas younger members, influenced by global digitalization, value autonomy, technological engagement, and progressive social attitudes. Bridging this philosophical chasm requires active empathy and intentional dialogue. Parents frequently occupy the delicate mediator role, needing to honor elder customs while championing their children\'s developmental independence. Successful multigenerational families establish mutual boundaries and designate regular forums for collaborative problem-solving. When differences are addressed with sincere respect rather than authoritarian dismissal, children acquire deep empathy and reverence for cultural heritage, while elders remain mentally stimulated and emotionally connected. In a world characterized by loneliness and fragmented relationships, harmonious intergenerational living serves as a vibrant testament to enduring solidarity.`,
    content_vi: `Gia đình nhiều thế hệ, nơi ông bà, cha mẹ và con cái cùng chung sống dưới một mái nhà, từ lâu đã là nền tảng của xã hội châu Á. Mặc dù sự sắp đặt này mang lại những hỗ trợ thiết yếu lẫn nhau—chẳng hạn như san sẻ chi phí sinh hoạt và chăm sóc con trẻ đáng tin cậy—nhưng nó cũng khó tránh khỏi việc nảy sinh những xung đột xuất phát từ góc nhìn thế hệ khác biệt. Ông bà thường coi trọng lễ nghi truyền thống, tính cần kiệm và chuẩn mực lịch sử, trong khi các bạn trẻ chịu ảnh hưởng của thời đại số hóa toàn cầu lại đề cao quyền tự chủ, sự gắn kết công nghệ và những thái độ xã hội tiến bộ. Việc thu hẹp khoảng cách tư tưởng này đòi hỏi sự đồng cảm chủ động và các cuộc đối thoại chân thành. Bậc cha mẹ thường đóng vai trò hòa giải tế nhị, vừa phải tôn kính các phong tục của người lớn tuổi, vừa phải nâng đỡ sự độc lập phát triển của con mình. Những gia đình nhiều thế hệ thành công luôn thiết lập các ranh giới tôn trọng lẫn nhau và tạo ra các buổi trao đổi thường kỳ để cùng tháo gỡ vấn đề. Khi những khác biệt được đón nhận bằng sự tôn trọng chân thành thay vì áp đặt quyền uy, con trẻ sẽ học được lòng nhân ái sâu sắc và sự kính trọng đối với di sản văn hóa, trong khi các bậc trưởng bối vẫn duy trì được sự minh mẫn và gắn kết cảm xúc. Trong một thế giới đầy rẫy sự cô đơn và các mối quan hệ rời rạc, cuộc sống hòa hợp giữa các thế hệ là một minh chứng sống động cho tình đoàn kết vững bền.`,
    questions: [
      { question_text: 'What major advantage of multigenerational households is cited first?', question_text_vi: 'Lợi thế lớn nào của gia đình nhiều thế hệ được trích dẫn đầu tiên?', options: ['Complete silence', 'Mutual support like cost-sharing and childcare', 'Freedom from any rules', 'Higher travel frequency'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "indispensable mutual support—such as cost-sharing and reliable childcare assistance".' },
      { question_text: 'What is a typical point of divergence between grandparents and younger members?', question_text_vi: 'Điểm khác biệt điển hình giữa ông bà và các bạn trẻ là gì?', options: ['Favorite music genre only', 'Traditional manners and thriftiness versus autonomy and digital engagement', 'Dietary allergies', 'Choice of sports'], correct_option: 1, explanation_vi: 'Đoạn văn phân tích: "Grandparents often prioritize traditional manners, thriftiness... whereas younger members... value autonomy, technological engagement".' },
      { question_text: 'What role do parents commonly perform in such households?', question_text_vi: 'Cha mẹ thường đóng vai trò gì trong các gia đình như vậy?', options: ['Passive bystanders', 'Delicate mediators between elders and children', 'Strict commanders', 'Financial auditors only'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "Parents frequently occupy the delicate mediator role".' },
      { question_text: 'What positive outcome occurs when intergenerational differences are resolved respectfully?', question_text_vi: 'Kết quả tích cực nào xảy ra khi sự khác biệt giữa các thế hệ được giải quyết với sự tôn trọng?', options: ['Children gain empathy and elders stay emotionally connected', 'Elders completely adopt modern trends', 'Traditions are abandoned', 'Expenses decrease to zero'], correct_option: 0, explanation_vi: 'Đoạn văn kết luận: "children acquire deep empathy and reverence for cultural heritage, while elders remain mentally stimulated and emotionally connected".' }
    ]
  },

  // Topic 3: School
  {
    topic_id: 3,
    title: 'My Favorite School Day',
    title_vi: 'Ngày Đi Học Yêu Thích Của Tôi',
    difficulty: 'easy',
    word_count: 95,
    estimated_time_minutes: 3,
    content: `Wednesday is always my favorite day at school. On Wednesday, we have science, art, and English lessons. In science class, our teacher shows us exciting experiments with magnets and plants. During art period, we draw watercolor landscapes of nature. At lunch break, my best friend Lan and I eat sandwiches and talk in the shady schoolyard. After that, we visit the library to read illustrated mystery books. School is a wonderful place where I learn new things and create unforgettable memories with good friends every single day.`,
    content_vi: `Thứ Tư luôn là ngày yêu thích nhất của tôi ở trường. Vào thứ Tư, chúng tôi có các tiết học khoa học, mỹ thuật và tiếng Anh. Trong giờ khoa học, thầy giáo cho chúng tôi xem những thí nghiệm hào hứng với nam châm và cây cối. Trong giờ mỹ thuật, chúng tôi vẽ phong cảnh thiên nhiên bằng màu nước. Vào giờ nghỉ trưa, tôi và người bạn thân nhất tên Lan cùng ăn bánh mì kẹp và trò chuyện dưới sân trường rợp bóng cây. Sau đó, chúng tôi vào thư viện đọc sách truyện trinh thám có hình minh họa. Trường học là nơi tuyệt vời để tôi học hỏi những điều mới lạ và tạo nên những kỷ niệm khó quên cùng bạn bè mỗi ngày.`,
    questions: [
      { question_text: 'Which day of the week is the author\'s favorite at school?', question_text_vi: 'Ngày nào trong tuần là ngày tác giả yêu thích nhất ở trường?', options: ['Monday', 'Wednesday', 'Friday', 'Saturday'], correct_option: 1, explanation_vi: 'Đoạn văn mở đầu: "Wednesday is always my favorite day at school".' },
      { question_text: 'What do students do in the science class?', question_text_vi: 'Học sinh làm gì trong tiết khoa học?', options: ['Write essays', 'Watch experiments with magnets and plants', 'Play soccer', 'Sing songs'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "our teacher shows us exciting experiments with magnets and plants".' },
      { question_text: 'What does the author draw in art period?', question_text_vi: 'Tác giả vẽ gì trong giờ mỹ thuật?', options: ['Portraits of teachers', 'Watercolor landscapes of nature', 'Maps of the country', 'Cars and airplanes'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "we draw watercolor landscapes of nature".' },
      { question_text: 'Where do the author and Lan go after lunch?', question_text_vi: 'Tác giả và Lan đi đâu sau bữa trưa?', options: ['To the computer room', 'To the school library', 'Back home', 'To the gym'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "After that, we visit the library to read illustrated mystery books".' }
    ]
  },
  {
    topic_id: 3,
    title: 'The Modern School Library',
    title_vi: 'Thư Viện Trường Học Hiện Đại',
    difficulty: 'medium',
    word_count: 145,
    estimated_time_minutes: 4,
    content: `School libraries have evolved significantly beyond quiet rooms stacked with dusty paper books. Today\'s academic resource centers are dynamic learning hubs equipped with high-speed wireless internet, multimedia tablets, and collaborative study pods. In addition to borrowing physical literature and historical reference encyclopedias, students can access expansive digital repositories containing scientific journals, audiobooks, and interactive language tutorials. Librarians now operate as research facilitators, assisting students in verifying online sources and distinguishing credible facts from misinformation. Many progressive schools also designate a section of the library as a makerspace, providing 3D printers and robotics kits that allow learners to convert theoretical classroom ideas into physical prototypes. By blending traditional reading culture with state-of-the-art information technology, the modern library fosters intellectual curiosity and equips pupils with critical investigative skills essential for the twenty-first century.`,
    content_vi: `Thư viện trường học đã phát triển vượt bậc, không còn đơn thuần là những căn phòng tĩnh lặng chất đầy những cuốn sách giấy bám bụi. Các trung tâm học liệu ngày nay là những không gian học tập năng động được trang bị mạng không dây tốc độ cao, máy tính bảng đa phương tiện và các phòng thảo luận nhóm. Ngoài việc mượn văn học giấy và bách khoa toàn thư tham khảo lịch sử, học sinh có thể tiếp cận kho lưu trữ kỹ thuật số rộng lớn chứa các tạp chí khoa học, sách nói và bài học ngoại ngữ tương tác. Các thủ thư ngày nay đóng vai trò như người hỗ trợ nghiên cứu, giúp đỡ học sinh kiểm chứng các nguồn tin trực tuyến và phân biệt sự thật đáng tin cậy với tin tức sai lệch. Nhiều trường học tiến bộ còn dành riêng một khu vực làm không gian sáng chế (makerspace), trang bị máy in 3D và bộ lắp ráp robot cho phép người học biến những ý tưởng lý thuyết trên lớp thành nguyên mẫu vật lý. Bằng việc kết hợp văn hóa đọc truyền thống với công nghệ thông tin tiên tiến, thư viện hiện đại nuôi dưỡng tính tò mò tri thức và trang bị cho học sinh những kỹ năng điều tra phản biện thiết yếu cho thế kỷ 21.`,
    questions: [
      { question_text: 'How have modern school libraries changed compared to the past?', question_text_vi: 'Thư viện trường học hiện đại đã thay đổi như thế nào so với quá khứ?', options: ['They closed down completely', 'They become dynamic learning hubs with digital tools', 'They only allow digital materials without any books', 'They are used only for exams'], correct_option: 1, explanation_vi: 'Đoạn văn nêu: "dynamic learning hubs equipped with high-speed wireless internet, multimedia tablets".' },
      { question_text: 'What new role do librarians perform today?', question_text_vi: 'Thủ thư ngày nay đảm nhận vai trò mới nào?', options: ['Security guards', 'Research facilitators verifying online information', 'School cooks', 'Bus drivers'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "Librarians now operate as research facilitators, assisting students in verifying online sources".' },
      { question_text: 'What equipment can be found in a library makerspace?', question_text_vi: 'Thiết bị nào có thể được tìm thấy trong makerspace của thư viện?', options: ['Typewriters', '3D printers and robotics kits', 'Cooking stoves', 'Sewing machines only'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "providing 3D printers and robotics kits".' },
      { question_text: 'What is the overarching benefit of the modern library highlighted in the final sentence?', question_text_vi: 'Lợi ích bao trùm của thư viện hiện đại được nêu trong câu cuối là gì?', options: ['Decreasing tuition fees', 'Fostering intellectual curiosity and 21st-century investigative skills', 'Replacing human teachers', 'Eliminating homework'], correct_option: 1, explanation_vi: 'Đoạn văn kết: "fosters intellectual curiosity and equips pupils with critical investigative skills essential for the twenty-first century".' }
    ]
  },
  {
    topic_id: 3,
    title: 'Rethinking Assessment in Contemporary Education',
    title_vi: 'Đổi Mới Đánh Giá Trong Giáo Dục Đương Đại',
    difficulty: 'hard',
    word_count: 185,
    estimated_time_minutes: 5,
    content: `For generations, standard standardized multiple-choice examinations have served as the principal benchmark for academic achievement. Educational institutions appreciated their grading efficiency, objective scoring criteria, and straightforward statistical comparison. Nonetheless, modern pedagogical theorists increasingly argue that memorization-based testing fails to evaluate higher-order cognitive capabilities, including critical problem-solving, innovative synthesis, and collaborative adaptability. High-stakes testing environments also trigger acute psychological stress, frequently leading capable pupils to underperform due to evaluation anxiety. Consequently, forward-thinking educational systems are transitioning toward holistic formative assessment models. Rather than relying solely on single summative finals, educators integrate ongoing project portfolios, peer evaluations, oral presentations, and experiential laboratory demonstrations. These continuous assessment methodologies mirror professional workplace conditions, where success depends on iterative teamwork, constructive feedback, and the continuous application of knowledge rather than rote recollection. While implementing comprehensive portfolio assessment demands greater teacher training and institutional resources, it cultivates autonomous learners capable of flourishing within a rapidly shifting global economy.`,
    content_vi: `Trong nhiều thế hệ, các bài thi trắc nghiệm chuẩn hóa đã đóng vai trò là thước đo chính cho thành tích học tập. Các tổ chức giáo dục ưa chuộng chúng vì hiệu quả chấm điểm, tiêu chí tính điểm khách quan và khả năng so sánh thống kê dễ dàng. Mặc dù vậy, các nhà lý luận sư phạm hiện đại ngày càng lập luận rằng lối kiểm tra dựa trên ghi nhớ học vẹt không thể đánh giá được các năng lực nhận thức bậc cao, bao gồm giải quyết vấn đề phản biện, tổng hợp đổi mới và khả năng thích ứng hợp tác. Môi trường thi cử áp lực cao cũng kích hoạt căng thẳng tâm lý nghiêm trọng, thường khiến những học sinh có năng lực làm bài kém do nỗi lo âu thi cử. Do đó, các hệ thống giáo dục có tư duy tiến bộ đang chuyển dịch sang các mô hình đánh giá quá trình toàn diện. Thay vì chỉ phụ thuộc vào một kỳ thi tổng kết duy nhất, giáo viên tích hợp hồ sơ dự án liên tục, đánh giá chéo giữa bạn bè, thuyết trình vấn đáp và thực hành thí nghiệm. Các phương pháp đánh giá liên tục này phản ánh chân thực môi trường làm việc chuyên nghiệp, nơi thành công phụ thuộc vào tinh thần làm việc nhóm liên tục, phản hồi mang tính xây dựng và sự vận dụng kiến thức linh hoạt thay vì ghi nhớ thuộc lòng. Dẫu việc triển khai đánh giá hồ sơ toàn diện đòi hỏi đào tạo giáo viên và nguồn lực trường học lớn hơn, nó nuôi dưỡng những người học tự chủ, có khả năng phát triển vượt bậc trong nền kinh tế toàn cầu biến chuyển không ngừng.`,
    questions: [
      { question_text: 'Why did institutions historically favor multiple-choice exams?', question_text_vi: 'Tại sao trong lịch sử các trường học ưa chuộng thi trắc nghiệm?', options: ['They measure creativity perfectly', 'Because of grading efficiency, objectivity, and statistical comparison', 'Because students demanded them', 'They require no preparation'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "appreciated their grading efficiency, objective scoring criteria, and straightforward statistical comparison".' },
      { question_text: 'What major limitation of memorization testing is identified?', question_text_vi: 'Hạn chế lớn nào của thi ghi nhớ học vẹt được xác định?', options: ['It takes too many hours to print', 'It fails to measure higher-order cognitive capabilities and causes anxiety', 'It requires expensive computers', 'It only works in science subjects'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "fails to evaluate higher-order cognitive capabilities... triggers acute psychological stress".' },
      { question_text: 'What alternative assessment components are becoming popular?', question_text_vi: 'Những thành phần đánh giá thay thế nào đang trở nên phổ biến?', options: ['Surprise pop quizzes every day', 'Portfolios, peer reviews, presentations, and lab demonstrations', 'Physical fitness challenges only', 'IQ puzzles only'], correct_option: 1, explanation_vi: 'Đoạn văn nêu: "ongoing project portfolios, peer evaluations, oral presentations, and experiential laboratory demonstrations".' },
      { question_text: 'Why does continuous assessment better prepare students for the future?', question_text_vi: 'Tại sao đánh giá liên tục chuẩn bị tốt hơn cho học sinh trong tương lai?', options: ['It mirrors professional workplace conditions based on teamwork and applied knowledge', 'It allows students to skip college', 'It eliminates all future work', 'It guarantees government employment'], correct_option: 0, explanation_vi: 'Đoạn văn kết: "These continuous assessment methodologies mirror professional workplace conditions, where success depends on iterative teamwork... and continuous application of knowledge".' }
    ]
  },

  // Topic 4: Food & Drink
  {
    topic_id: 4,
    title: 'The Art of Vietnamese Pho',
    title_vi: 'Nghệ Thuật Của Phở Việt Nam',
    difficulty: 'easy',
    word_count: 90,
    estimated_time_minutes: 3,
    content: `Pho is undoubtedly the most celebrated dish in Vietnamese cuisine. A steaming bowl of pho consists of soft flat rice noodles, tender slices of beef or chicken, and fresh aromatic herbs like cilantro and green onions. The heart of any memorable bowl of pho lies in its clear, rich broth. Chefs simmer beef bones with fragrant spices such as star anise, cinnamon, ginger, and cardamom for over eight hours. Customers can customize their soup with a squeeze of fresh lime, chili slices, and bean sprouts before enjoying every flavorful spoonful.`,
    content_vi: `Phở chắc chắn là món ăn được tôn vinh nhiều nhất trong ẩm thực Việt Nam. Một tô phở nóng hổi gồm những sợi bánh phở mềm mại, những lát thịt bò hoặc gà mềm ngọt, cùng các loại rau thơm tươi như ngò gai và hành lá. Linh hồn của một bát phở đáng nhớ nằm ở phần nước dùng trong vắt, đậm đà. Các đầu bếp ninh xương bò cùng những gia vị thơm lừng như hoa hồi, quế, gừng và thảo quả trong hơn tám tiếng đồng hồ. Thực khách có thể tùy chỉnh tô súp của mình với một lát chanh tươi vắt nhẹ, vài lát ớt và giá đỗ trước khi thưởng thức từng thìa ngập tràn hương vị.`,
    questions: [
      { question_text: 'What is considered the core or heart of a delicious bowl of pho?', question_text_vi: 'Điều gì được xem là cốt lõi hay linh hồn của một tô phở ngon?', options: ['The bowl design', 'The clear and rich broth', 'The chopsticks', 'The lime seeds'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "The heart of any memorable bowl of pho lies in its clear, rich broth".' },
      { question_text: 'Which spices are simmered with the beef bones?', question_text_vi: 'Những loại gia vị nào được ninh cùng xương bò?', options: ['Chocolate and vanilla', 'Star anise, cinnamon, ginger, and cardamom', 'Curry powder and mustard', 'Sugar and vinegar'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "fragrant spices such as star anise, cinnamon, ginger, and cardamom".' },
      { question_text: 'For approximately how long is the broth simmered?', question_text_vi: 'Nước dùng được ninh trong khoảng bao lâu?', options: ['Ten minutes', 'One hour', 'Over eight hours', 'Three days'], correct_option: 2, explanation_vi: 'Đoạn văn viết: "for over eight hours".' },
      { question_text: 'What do customers typically add before eating pho?', question_text_vi: 'Thực khách thường cho thêm gì trước khi ăn phở?', options: ['Fresh lime, chili slices, and bean sprouts', 'Mayonnaise and ketchup', 'Cold milk', 'Butter and honey'], correct_option: 0, explanation_vi: 'Đoạn văn viết: "squeeze of fresh lime, chili slices, and bean sprouts".' }
    ]
  },
  {
    topic_id: 4,
    title: 'Balanced Nutrition for Young Learners',
    title_vi: 'Dinh Dưỡng Cân Bằng Cho Người Học Trẻ Tuổi',
    difficulty: 'medium',
    word_count: 145,
    estimated_time_minutes: 4,
    content: `Maintaining proper nutrition is fundamentally essential for optimal physical growth and cognitive academic performance in young students. Nutritionists recommend filling half of each meal plate with colorful vegetables and whole fruits, which provide vital antioxidants, dietary fibers, and essential micronutrients like vitamins A and C. Carbohydrates derived from whole grains—such as brown rice, oats, and whole-wheat toast—deliver sustained energy to fuel focus throughout arduous school mornings, unlike refined sugars that prompt energy crashes. Furthermore, incorporating lean proteins from fish, eggs, poultry, and legumes aids in muscle tissue repair and neurotransmitter production. Staying adequately hydrated by drinking plenty of plain water rather than sugary sodas prevents afternoon fatigue and headaches. Establishing mindful dietary habits during adolescence not only boosts immediate examination results but also provides enduring protection against chronic lifestyle diseases later in adulthood.`,
    content_vi: `Duy trì dinh dưỡng hợp lý là điều thiết yếu căn bản cho sự phát triển thể chất tối ưu và hiệu suất học tập nhận thức ở các học sinh trẻ tuổi. Các chuyên gia dinh dưỡng khuyến nghị nên lấp đầy một nửa đĩa ăn bằng các loại rau củ nhiều màu sắc và trái cây nguyên quả, vốn cung cấp chất chống oxy hóa quan trọng, chất xơ và các vi chất dinh dưỡng thiết yếu như vitamin A và C. Tinh bột từ ngũ cốc nguyên hạt—chẳng hạn như gạo lứt, yến mạch và bánh mì nguyên cám—mang lại nguồn năng lượng bền bỉ để duy trì sự tập trung trong suốt những buổi sáng học tập căng thẳng, không giống như đường tinh luyện thường gây sụt giảm năng lượng đột ngột. Hơn nữa, việc bổ sung protein nạc từ cá, trứng, thịt gia cầm và các loại đậu giúp tái tạo mô cơ và sản sinh chất dẫn truyền thần kinh. Giữ đủ nước bằng cách uống nhiều nước lọc thay vì nước ngọt có ga sẽ ngăn ngừa tình trạng mệt mỏi và đau đầu vào buổi chiều. Việc xây dựng thói quen ăn uống khoa học trong độ tuổi vị thành niên không chỉ thúc đẩy kết quả thi cử trước mắt mà còn mang lại sự bảo vệ lâu dài trước các căn bệnh mãn tính khi trưởng thành.`,
    questions: [
      { question_text: 'What portion of a meal plate should be vegetables and fruits?', question_text_vi: 'Phần nào của đĩa ăn nên là rau củ và trái cây?', options: ['One tenth', 'Half of the plate', 'The entire plate', 'None'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "filling half of each meal plate with colorful vegetables and whole fruits".' },
      { question_text: 'Why are whole grains better than refined sugars for school mornings?', question_text_vi: 'Tại sao ngũ cốc nguyên hạt tốt hơn đường tinh luyện cho các buổi sáng đi học?', options: ['They taste sweeter', 'They deliver sustained energy without energy crashes', 'They are cheaper to purchase', 'They digest in two minutes'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "deliver sustained energy to fuel focus... unlike refined sugars that prompt energy crashes".' },
      { question_text: 'What role do lean proteins play according to the text?', question_text_vi: 'Chất đạm nạc đóng vai trò gì theo đoạn văn?', options: ['Aiding muscle tissue repair and neurotransmitter production', 'Causing immediate sleep', 'Replacing water intake', 'Weakening bones'], correct_option: 0, explanation_vi: 'Đoạn văn viết: "aids in muscle tissue repair and neurotransmitter production".' },
      { question_text: 'What is the recommended beverage for preventing fatigue?', question_text_vi: 'Thức uống nào được khuyên dùng để tránh mệt mỏi?', options: ['Sugary carbonated soda', 'Plain water', 'Heavy energy drinks', 'Sweet iced tea'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "drinking plenty of plain water rather than sugary sodas prevents afternoon fatigue".' }
    ]
  },
  {
    topic_id: 4,
    title: 'The Global Transition Toward Sustainable Diets',
    title_vi: 'Sự Chuyển Dịch Toàn Cầu Sang Chế Độ Ăn Bền Vững',
    difficulty: 'hard',
    word_count: 180,
    estimated_time_minutes: 5,
    content: `The global food system currently accounts for more than a quarter of all anthropogenic greenhouse gas emissions, placing immense strain on terrestrial freshwater reserves and triggering extensive deforestation. In response, environmental scientists and culinary innovators advocate a decisive transition toward sustainable, plant-forward diets. Research published in international ecological journals emphasizes that animal agriculture—particularly industrial beef and dairy farming—requires significantly more land area, grain feed, and water per calorie produced compared to legumes, pulses, and grain crops. Embracing dietary sustainability does not necessitate universal strict veganism; rather, the widespread adoption of flexitarianism or reducing meat consumption by several portions weekly yields staggering environmental dividends. Furthermore, local agricultural cooperatives and urban vertical farming enterprises are revolutionizing supply chains by reducing food miles and eliminating chemical preservative dependency. By aligning gastronomic preferences with ecological responsibility, consumers possess remarkable agency to mitigate climate change with every dietary selection they make three times a day.`,
    content_vi: `Hệ thống thực phẩm toàn cầu hiện nay chiếm hơn một phần tư tổng lượng khí thải nhà kính do con người gây ra, đặt áp lực nặng nề lên nguồn nước ngọt trên đất liền và gây ra nạn phá rừng quy mô lớn. Để đối phó, các nhà khoa học môi trường và những người đổi mới ẩm thực đang ủng hộ mạnh mẽ sự chuyển dịch quyết định sang chế độ ăn uống bền vững, ưu tiên thực vật. Nghiên cứu đăng tải trên các tạp chí sinh thái quốc tế nhấn mạnh rằng ngành chăn nuôi động vật—đặc biệt là các trang trại bò thịt và bò sữa công nghiệp—đòi hỏi diện tích đất, ngũ cốc thức ăn và lượng nước trên mỗi calo tạo ra lớn hơn rất nhiều so với các loại đậu và cây lương thực. Đón nhận tính bền vững trong ẩm thực không nhất thiết đòi hỏi mọi người phải ăn chay nghiêm ngặt; thay vào đó, việc áp dụng rộng rãi lối ăn bán chay linh hoạt (flexitarianism) hoặc giảm bớt tiêu thụ thịt vài bữa mỗi tuần cũng mang lại những lợi ích môi trường đáng kinh ngạc. Thêm vào đó, các hợp tác xã nông nghiệp địa phương và các doanh nghiệp nông nghiệp thẳng đứng tại đô thị đang tạo nên cuộc cách mạng trong chuỗi cung ứng bằng việc giảm quãng đường vận chuyển thực phẩm và loại bỏ sự phụ thuộc vào hóa chất bảo quản. Bằng việc kết hợp sở thích ẩm thực với trách nhiệm sinh thái, người tiêu dùng nắm giữ quyền năng to lớn để giảm thiểu biến đổi khí hậu qua mỗi lựa chọn ăn uống ba lần mỗi ngày.`,
    questions: [
      { question_text: 'What fraction of human greenhouse gas emissions is linked to the food system?', question_text_vi: 'Tỷ lệ khí thải nhà kính do con người gây ra bắt nguồn từ hệ thống thực phẩm là bao nhiêu?', options: ['Less than five percent', 'More than a quarter', 'Exactly half', 'Nearly ninety percent'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "accounts for more than a quarter of all anthropogenic greenhouse gas emissions".' },
      { question_text: 'Why does animal agriculture have a higher environmental impact than crop farming?', question_text_vi: 'Tại sao chăn nuôi động vật lại có tác động môi trường lớn hơn trồng trọt?', options: ['It uses no technology', 'It requires much more land, water, and feed per calorie produced', 'Animals do not like farmers', 'It is located only on islands'], correct_option: 1, explanation_vi: 'Đoạn văn nêu: "requires significantly more land area, grain feed, and water per calorie produced".' },
      { question_text: 'Does sustainable eating require everyone to become 100% vegan?', question_text_vi: 'Việc ăn uống bền vững có đòi hỏi tất cả mọi người phải ăn thuần chay 100% không?', options: ['Yes, it is legally mandatory', 'No, reducing meat portions or flexitarianism already yields large benefits', 'Yes, vegetables are the only food allowed', 'No, diet has no effect on the environment'], correct_option: 1, explanation_vi: 'Đoạn văn làm rõ: "does not necessitate universal strict veganism; rather, the widespread adoption of flexitarianism... yields staggering environmental dividends".' },
      { question_text: 'How do urban vertical farms help improve food supply chains?', question_text_vi: 'Các nông trại thẳng đứng ở đô thị giúp cải thiện chuỗi cung ứng thế nào?', options: ['By increasing transportation distance', 'By reducing food miles and eliminating chemical preservative dependency', 'By selling only imported goods', 'By cutting down city parks'], correct_option: 1, explanation_vi: 'Đoạn văn chỉ rõ: "reducing food miles and eliminating chemical preservative dependency".' }
    ]
  },

  // Topic 5: Hobbies
  {
    topic_id: 5,
    title: 'Why I Love Playing the Guitar',
    title_vi: 'Tại Sao Tôi Thích Chơi Đàn Ghi-ta',
    difficulty: 'easy',
    word_count: 85,
    estimated_time_minutes: 3,
    content: `Playing the acoustic guitar is my favorite hobby in the world. My father gave me an old wooden guitar on my eleventh birthday. At first, my fingers hurt and pressing the steel strings felt difficult. However, I practiced simple chords for twenty minutes every single afternoon. Now, I can play dozens of sweet folk melodies and pop songs. Whenever I feel stressed after homework, strumming my guitar makes me feel completely calm and happy. Sharing songs with friends around a campfire is always magical.`,
    content_vi: `Chơi đàn ghi-ta mộc là sở thích yêu thích nhất của tôi trên thế giới. Bố đã tặng tôi một cây đàn ghi-ta gỗ cũ vào ngày sinh nhật thứ mười một của tôi. Ban đầu, ngón tay tôi bị đau và bấm các dây thép cảm thấy rất khó khăn. Dẫu vậy, tôi đã luyện tập các hợp âm đơn giản trong hai mươi phút mỗi buổi chiều. Bây giờ, tôi có thể chơi hàng chục giai điệu dân ca ngọt ngào và các bài hát nhạc trẻ. Bất cứ khi nào tôi cảm thấy căng thẳng sau khi làm bài tập, việc gảy đàn ghi-ta làm tôi cảm thấy hoàn toàn bình yên và vui vẻ. Chia sẻ những bài hát cùng bạn bè quanh đống lửa trại luôn là điều kỳ diệu.`,
    questions: [
      { question_text: 'When did the author receive the guitar?', question_text_vi: 'Tác giả nhận được cây đàn ghi-ta khi nào?', options: ['On his fifth birthday', 'On his eleventh birthday', 'Last Christmas', 'At graduation'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "gave me an old wooden guitar on my eleventh birthday".' },
      { question_text: 'What was difficult for the author in the beginning?', question_text_vi: 'Điều gì gây khó khăn cho tác giả lúc ban đầu?', options: ['Finding a teacher', 'Fingers hurting from pressing steel strings', 'Tuning the instrument', 'Reading lyrics'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "my fingers hurt and pressing the steel strings felt difficult".' },
      { question_text: 'How long did the author practice each afternoon?', question_text_vi: 'Tác giả luyện tập bao lâu mỗi buổi chiều?', options: ['Five minutes', 'Twenty minutes', 'Three hours', 'All night'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "practiced simple chords for twenty minutes every single afternoon".' },
      { question_text: 'How does playing the guitar affect the author\'s mood?', question_text_vi: 'Việc chơi đàn ảnh hưởng đến tâm trạng tác giả thế nào?', options: ['It makes him sleepy and angry', 'It makes him feel calm and happy', 'It makes him confused', 'It causes headaches'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "makes me feel completely calm and happy".' }
    ]
  },
  {
    topic_id: 5,
    title: 'The Mental Health Benefits of Reading',
    title_vi: 'Lợi Ích Sức Khỏe Tinh Thần Của Việc Đọc Sách',
    difficulty: 'medium',
    word_count: 140,
    estimated_time_minutes: 4,
    content: `In an era characterized by relentless digital notifications and rapid social media scrolling, deep reading offers a profound sanctuary for mental wellbeing. Neuroscientists have discovered that immersing oneself in a compelling narrative stimulates complex brain networks responsible for language comprehension and empathy. When we read literary fiction, we psychologically inhabit the perspectives of diverse characters, developing a nuanced understanding of human emotions and cross-cultural experiences. Furthermore, engaging with printed literature for just fifteen minutes before bed reduces cortisol levels and decelerates heart rate far more effectively than viewing illuminated phone screens. Unlike passive video entertainment, reading actively exercises imagination, requiring the brain to construct vivid mental imagery and conceptualize narrative sequences. Cultivating a regular reading habit thereby preserves cognitive agility, enriches personal vocabulary, and cultivates lasting mental tranquility in our busy modern lives.`,
    content_vi: `Trong kỷ nguyên tràn ngập những thông báo kỹ thuật số dồn dập và thói quen lướt mạng xã hội liên tục, việc đọc sâu mang lại một chốn bình yên sâu sắc cho sức khỏe tinh thần. Các nhà khoa học thần kinh đã phát hiện ra rằng việc đắm mình vào một câu chuyện hấp dẫn sẽ kích thích các mạng lưới não bộ phức tạp chịu trách nhiệm về thấu cảm và thấu hiểu ngôn ngữ. Khi chúng ta đọc văn học, chúng ta được đặt mình vào góc nhìn của nhiều nhân vật đa dạng, phát triển sự thấu hiểu tinh tế về cảm xúc con người và những trải nghiệm xuyên văn hóa. Hơn nữa, việc đọc sách giấy chỉ trong mười lăm phút trước khi ngủ giúp giảm nồng độ hormone căng thẳng cortisol và làm chậm nhịp tim hiệu quả hơn nhiều so với việc nhìn vào màn hình điện thoại phát sáng. Không giống như việc giải trí thụ động qua video, đọc sách tích cực rèn luyện trí tưởng tượng, đòi hỏi não bộ phải kiến tạo những hình ảnh tâm lý sống động và hình dung hóa các chuỗi câu chuyện. Do đó, việc xây dựng thói quen đọc sách thường xuyên sẽ giữ gìn sự nhanh nhạy nhận thức, làm phong phú vốn từ vựng cá nhân và nuôi dưỡng sự bình yên tâm hồn lâu bền trong cuộc sống hiện đại hối hả.`,
    questions: [
      { question_text: 'What do neuroscientists say happens when we read compelling narratives?', question_text_vi: 'Các nhà thần kinh học nói điều gì xảy ra khi chúng ta đọc những câu chuyện hấp dẫn?', options: ['Brain cells stop working', 'It stimulates neural networks for language and empathy', 'It damages eyesight instantly', 'It erases long-term memories'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "stimulates complex brain networks responsible for language comprehension and empathy".' },
      { question_text: 'How does reading fiction foster empathy?', question_text_vi: 'Đọc tiểu thuyết nuôi dưỡng sự đồng cảm như thế nào?', options: ['By forcing readers to memorize words', 'By allowing readers to psychologically inhabit characters\' perspectives', 'By showing colored photographs', 'By assigning homework'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "we psychologically inhabit the perspectives of diverse characters".' },
      { question_text: 'What physiological benefit does reading before bed offer over phone screens?', question_text_vi: 'Lợi ích sinh lý nào mà việc đọc trước khi ngủ mang lại so với màn hình điện thoại?', options: ['It causes intense dreams', 'It reduces cortisol levels and decelerates heart rate', 'It makes people hungry', 'It prevents all sleep'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "reduces cortisol levels and decelerates heart rate far more effectively than viewing illuminated phone screens".' },
      { question_text: 'How does reading differ from passive video watching?', question_text_vi: 'Đọc sách khác với việc xem video thụ động thế nào?', options: ['Reading requires the brain to construct vivid imagery actively', 'Reading is always boring', 'Reading requires electricity', 'Videos teach more vocabulary'], correct_option: 0, explanation_vi: 'Đoạn văn phân tích: "Unlike passive video entertainment, reading actively exercises imagination, requiring the brain to construct vivid mental imagery".' }
    ]
  },
  {
    topic_id: 5,
    title: 'The Psychology of Leisure and Flow States',
    title_vi: 'Tâm Lý Học Về Giải Trí Và Trạng Thái Dòng Chảy',
    difficulty: 'hard',
    word_count: 175,
    estimated_time_minutes: 5,
    content: `Psychologist Mihaly Csikszentmihalyi famously pioneered the concept of "flow"—an optimal psychological state characterized by total immersion, focused attention, and deep enjoyment in an activity. During a flow state, individuals become so thoroughly captivated by a challenging task that their awareness of time, self-consciousness, and extraneous worries completely vanishes. Hobbies such as oil painting, classical piano performance, competitive chess, or rock climbing represent fertile terrain for experiencing flow. Crucially, entering this state necessitates a delicate equilibrium between the participant\'s technical competence and the difficulty of the challenge; excessive difficulty breeds anxiety, whereas inadequate challenge induces lethargy. Unlike superficial passive diversions like binge-watching serial shows, active mastery-oriented leisure replenishes psychological resources and reinforces a durable sense of self-efficacy. By routinely pursuing hobbies that demand deliberate practice and creative problem-solving, individuals cultivate psychological autonomy, elevate subjective happiness, and construct meaningful lives resilient against occupational burnout and existential malaise.`,
    content_vi: `Nhà tâm lý học Mihaly Csikszentmihalyi đã đi tiên phong với khái niệm "dòng chảy" (flow)—một trạng thái tâm lý tối ưu được định hình bởi sự đắm chìm hoàn toàn, sự tập trung cao độ và niềm thích thú sâu sắc trong một hoạt động. Trong trạng thái dòng chảy, các cá nhân say mê một thử thách đến mức ý niệm về thời gian, sự tự nhận thức bản thân và những âu lo bên ngoài hoàn toàn tan biến. Những sở thích như vẽ tranh sơn dầu, biểu diễn dương cầm cổ điển, chơi cờ vua thi đấu hay leo núi thể thao là mảnh đất màu mỡ để trải nghiệm dòng chảy. Điều cốt yếu là, để bước vào trạng thái này đòi hỏi sự cân bằng tinh tế giữa năng lực kỹ thuật của người tham gia và độ khó của thử thách; độ khó quá mức sẽ sinh ra lo lắng, trong khi thử thách quá dễ sẽ gây ra sự chán nản lười biếng. Khác với những thú vui thụ động hời hợt như xem phim truyền hình hàng giờ liền, những hoạt động giải trí chủ động hướng tới sự tinh thông sẽ làm đầy lại các nguồn lực tâm lý và củng cố niềm tin vững chắc vào năng lực bản thân. Bằng việc đều đặn theo đuổi những sở thích đòi hỏi sự luyện tập có chủ đích và giải quyết vấn đề sáng tạo, mỗi người sẽ nuôi dưỡng quyền tự chủ tâm lý, nâng cao hạnh phúc chủ quan và kiến tạo một cuộc đời ý nghĩa, kiên cường trước sự kiệt quệ nghề nghiệp và cảm giác lạc lõng trong cuộc sống.`,
    questions: [
      { question_text: 'Who coined and pioneered the concept of "flow"?', question_text_vi: 'Ai đã đặt ra và đi tiên phong trong khái niệm "dòng chảy"?', options: ['Sigmund Freud', 'Mihaly Csikszentmihalyi', 'Albert Einstein', 'William Shakespeare'], correct_option: 1, explanation_vi: 'Đoạn văn mở đầu: "Psychologist Mihaly Csikszentmihalyi famously pioneered the concept of \'flow\'".' },
      { question_text: 'What happens to self-consciousness and time perception during flow?', question_text_vi: 'Điều gì xảy ra với sự tự ý thức và cảm nhận thời gian trong trạng thái dòng chảy?', options: ['Time seems very slow and painful', 'Awareness of time and worries completely vanishes', 'People become overly worried about test scores', 'People fall into deep sleep'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "awareness of time, self-consciousness, and extraneous worries completely vanishes".' },
      { question_text: 'What balance is essential to enter the flow state?', question_text_vi: 'Sự cân bằng nào là thiết yếu để bước vào trạng thái dòng chảy?', options: ['Between cost and profit', 'Between technical skill and challenge difficulty', 'Between age and height', 'Between indoors and outdoors'], correct_option: 1, explanation_vi: 'Đoạn văn nhấn mạnh: "necessitates a delicate equilibrium between the participant\'s technical competence and the difficulty of the challenge".' },
      { question_text: 'How does mastery-oriented leisure contrast with passive binge-watching?', question_text_vi: 'Giải trí hướng tới sự tinh thông khác gì với việc xem phim thụ động?', options: ['It costs more electricity', 'It replenishes psychological resources and builds self-efficacy', 'It requires international travel', 'It produces no happiness'], correct_option: 1, explanation_vi: 'Đoạn văn đối chiếu: "active mastery-oriented leisure replenishes psychological resources and reinforces a durable sense of self-efficacy".' }
    ]
  },

  // Topic 6: Animals
  {
    topic_id: 6,
    title: 'Man\'s Best Friend',
    title_vi: 'Người Bạn Thân Nhất Của Con Người',
    difficulty: 'easy',
    word_count: 85,
    estimated_time_minutes: 3,
    content: `Dogs have earned the title of "man's best friend" for thousands of years. They are renowned for their remarkable loyalty, protective instincts, and playful companionship. Whether large like a German Shepherd or tiny like a Chihuahua, dogs possess an incredible sense of smell that can detect lost items or assist rescue teams. In return, pet dogs need daily walks, nutritious dog food, clean drinking water, and lots of affectionate petting. Taking care of a dog teaches children important lessons about love and responsibility.`,
    content_vi: `Chó đã giành được danh hiệu "người bạn thân nhất của con người" trong suốt hàng ngàn năm qua. Chúng nổi tiếng vì sự trung thành đáng kinh ngạc, bản năng bảo vệ và tình bạn vui tươi. Dù to lớn như chó chăn cừu Đức hay nhỏ bé như giống Chihuahua, loài chó đều sở hữu khứu giác tuyệt vời có thể phát hiện đồ vật thất lạc hoặc hỗ trợ các đội cứu hộ. Đổi lại, thú cưng cần được dắt đi dạo hằng ngày, thức ăn bổ dưỡng, nước uống sạch và thật nhiều cử chỉ âu yếm vuốt ve. Chăm sóc một chú chó dạy cho trẻ em những bài học quý báu về tình thương và trách nhiệm.`,
    questions: [
      { question_text: 'How long have dogs been regarded as man\'s best friend?', question_text_vi: 'Chó đã được xem là người bạn thân nhất của con người trong bao lâu?', options: ['For a few weeks', 'For thousands of years', 'Since last year', 'Only recently'], correct_option: 1, explanation_vi: 'Đoạn văn nêu: "Dogs have earned the title of \'man\'s best friend\' for thousands of years".' },
      { question_text: 'What special physical sense is highlighted in dogs?', question_text_vi: 'Giác quan thể chất đặc biệt nào của loài chó được nêu bật?', options: ['Color vision', 'Incredible sense of smell', 'Hearing radio waves', 'Ability to fly'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "dogs possess an incredible sense of smell that can detect lost items".' },
      { question_text: 'What basic care do pet dogs require?', question_text_vi: 'Những chăm sóc cơ bản nào mà chó cưng cần?', options: ['Gold jewelry', 'Daily walks, nutritious food, clean water, and affection', 'Constant TV viewing', 'Expensive perfumes'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "pet dogs need daily walks, nutritious dog food, clean drinking water, and lots of affectionate petting".' },
      { question_text: 'What life lessons does raising a dog teach young children?', question_text_vi: 'Nuôi một chú chó dạy cho trẻ nhỏ bài học cuộc sống nào?', options: ['Love and responsibility', 'How to hunt wild beasts', 'Math formulas', 'Driving skills'], correct_option: 0, explanation_vi: 'Đoạn văn kết: "Taking care of a dog teaches children important lessons about love and responsibility".' }
    ]
  },
  {
    topic_id: 6,
    title: 'The Secret Intelligence of Dolphins',
    title_vi: 'Trí Thông Minh Bí Ẩn Của Loài Cá Heo',
    difficulty: 'medium',
    word_count: 145,
    estimated_time_minutes: 4,
    content: `Dolphins are widely acknowledged by marine biologists as among the most cognitively sophisticated creatures inhabiting the planet. Residing in complex social groupings termed pods, these cetaceans communicate through an intricate repertoire of whistles, clicks, and ultrasonic echolocation pulses. Astonishingly, researchers have discovered that each individual dolphin develops a unique signature whistle during youth, functioning much like a personal human name to identify itself to peers. Dolphins display advanced cooperative hunting strategies, such as herding schools of fish onto shallow mud banks or coordinating synchronized encircling maneuvers. Furthermore, dolphins exhibit undeniable self-awareness; when presented with mirrors during scientific tests, they examine marks on their bodies rather than treating their reflection as a rival creature. Their capacity for empathy is equally documented, with numerous verified historical accounts of wild dolphins guiding disoriented sailors through treacherous channels or shielding injured swimmers from predatory oceanic sharks.`,
    content_vi: `Cá heo được các nhà sinh vật học biển thừa nhận rộng rãi là một trong những sinh vật có nhận thức tinh vi nhất sống trên hành tinh. Sinh sống trong các bầy đàn xã hội phức tạp gọi là "pod", những loài động vật có vú biển này giao tiếp qua một hệ thống phức tạp gồm tiếng huýt, tiếng lách cách và các xung siêu âm định vị hồi âm. Đáng kinh ngạc là các nhà nghiên cứu đã phát hiện ra rằng mỗi cá thể cá heo tự phát triển một tiếng huýt mang chữ ký độc nhất lúc còn nhỏ, có chức năng tương tự như tên riêng của con người để tự nhận diện bản thân với đồng loại. Cá heo thể hiện những chiến thuật săn mồi hợp tác tân tiến, chẳng hạn như dồn các đàn cá lên bãi bùn nông hoặc phối hợp các thao tác bao vây đồng bộ. Hơn thế nữa, cá heo thể hiện sự tự nhận thức rõ rệt; khi được soi gương trong các thử nghiệm khoa học, chúng quan sát các vết đánh dấu trên cơ thể mình thay vì coi hình ảnh phản chiếu là đối thủ. Khả năng thấu cảm của chúng cũng được ghi nhận rõ ràng, với rất nhiều ghi chép lịch sử xác thực về việc cá heo hoang dã dẫn đường cho các thủy thủ mất phương hướng qua các eo biển nguy hiểm hoặc che chắn cho những người bơi bị thương khỏi cá mập đại dương săn mồi.`,
    questions: [
      { question_text: 'What are dolphin social groups called?', question_text_vi: 'Các đàn xã hội của cá heo được gọi là gì?', options: ['Flocks', 'Pods', 'Herds', 'Packs'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "Residing in complex social groupings termed pods".' },
      { question_text: 'What function does a dolphin\'s signature whistle serve?', question_text_vi: 'Tiếng huýt chữ ký của cá heo có chức năng gì?', options: ['To scare whales away', 'It functions like a personal human name for identification', 'To warn about thunderstorms', 'To find sweet fruit'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "functioning much like a personal human name to identify itself to peers".' },
      { question_text: 'How do dolphins react when seeing themselves in a mirror?', question_text_vi: 'Cá heo phản ứng thế nào khi thấy mình trong gương?', options: ['They attack the glass immediately', 'They swim away in fear', 'They examine marks on their bodies demonstrating self-awareness', 'They ignore the mirror completely'], correct_option: 2, explanation_vi: 'Đoạn văn giải thích: "they examine marks on their bodies rather than treating their reflection as a rival creature".' },
      { question_text: 'What altruistic behavior of wild dolphins is mentioned?', question_text_vi: 'Hành vi vị tha nào của cá heo hoang dã được nhắc tới?', options: ['Guiding sailors and shielding swimmers from sharks', 'Catching fish for humans daily', 'Building houses underwater', 'Teaching other animals to speak'], correct_option: 0, explanation_vi: 'Đoạn văn kết: "guiding disoriented sailors through treacherous channels or shielding injured swimmers from predatory oceanic sharks".' }
    ]
  },
  {
    topic_id: 6,
    title: 'Biodiversity Collapse and Ecosystem Resilience',
    title_vi: 'Sự Sụp Đổ Đa Dạng Sinh Học Và Khả Năng Phục Hồi Hệ Sinh Thái',
    difficulty: 'hard',
    word_count: 185,
    estimated_time_minutes: 5,
    content: `Biologists worldwide warn that planet Earth is currently experiencing the Anthropocene\'s sixth mass extinction event. Unlike preceding prehistoric collapses triggered by volcanic eruptions or celestial asteroid impacts, contemporary wildlife devastation stems unequivocally from human activities—predominantly habitat destruction, industrial chemical pollution, climate destabilization, and invasive species proliferation. The loss of keystone species poses especially catastrophic hazards to ecosystem integrity. When apex predators like wolves or sea otters disappear from a food web, unchecked herbivore populations decimate vegetative undergrowth, which subsequently leads to severe riverbank soil erosion and widespread collapse of insect habitats. Conversely, protecting keystone organisms triggers "trophic cascades" that revitalize degraded landscapes with astonishing speed. Conserving biological diversity is not merely a sentimental humanitarian obligation; intact biological ecosystems provide humanity with critical services including agricultural crop pollination, clean drinking water filtration, and atmospheric carbon sequestration. Preventing irreversible biological loss requires international treaties restricting commercial wildlife trade, expanding protected terrestrial corridors, and actively reintroducing native species into restored ecosystems.`,
    content_vi: `Các nhà sinh vật học trên toàn thế giới cảnh báo rằng Trái Đất hiện đang trải qua sự kiện tuyệt chủng hàng loạt lần thứ sáu trong kỷ Nhân sinh (Anthropocene). Khác với những đợt sụp đổ tiền sử trước đây do núi lửa phun trào hay thiên thạch va chạm, sự tàn phá thế giới hoang dã ngày nay bắt nguồn rõ ràng từ các hoạt động của con người—chủ yếu là phá hủy môi trường sống, ô nhiễm hóa chất công nghiệp, mất ổn định khí hậu và sự sinh sôi của các loài xâm lấn. Sự biến mất của các loài sinh vật chủ chốt (keystone species) đặt ra những mối nguy hiểm thảm khốc đặc biệt cho sự toàn vẹn của hệ sinh thái. Khi các loài săn mồi đỉnh cao như chó sói hay rái cá biển biến mất khỏi lưới thức ăn, số lượng động vật ăn cỏ không bị kiểm soát sẽ tàn phá thảm thực vật tầng thấp, từ đó dẫn đến xói mòn đất bờ sông nghiêm trọng và sự sụp đổ diện rộng của môi trường sống côn trùng. Ngược lại, việc bảo vệ các sinh vật chủ chốt sẽ kích hoạt các "chuỗi bậc dinh dưỡng" (trophic cascades) giúp hồi sinh những vùng cảnh quan bị suy thoái với tốc độ đáng kinh ngạc. Bảo tồn tính đa dạng sinh học không đơn thuần là nghĩa vụ nhân đạo đầy cảm xúc; những hệ sinh thái sinh học nguyên vẹn cung cấp cho nhân loại các dịch vụ quan trọng bao gồm thụ phấn cho mùa màng nông nghiệp, lọc nước uống sạch và hấp thụ carbon trong khí quyển. Việc ngăn chặn sự mất mát sinh học không thể phục hồi đòi hỏi các hiệp ước quốc tế hạn chế buôn bán động vật hoang dã thương mại, mở rộng các hành lang trên cạn được bảo vệ và chủ động tái thả các loài bản địa vào các hệ sinh thái đã được phục hồi.`,
    questions: [
      { question_text: 'What distinguishes the current sixth extinction event from prehistoric ones?', question_text_vi: 'Điều gì phân biệt đợt tuyệt chủng thứ sáu hiện nay với các đợt tiền sử?', options: ['It is caused exclusively by asteroid impacts', 'It is unequivocally driven by human activities rather than natural catastrophes', 'It only affects plant species', 'It is occurring much slower than ever before'], correct_option: 1, explanation_vi: 'Đoạn văn chỉ rõ: "contemporary wildlife devastation stems unequivocally from human activities".' },
      { question_text: 'What occurs when keystone apex predators disappear from an ecosystem?', question_text_vi: 'Điều gì xảy ra khi các loài săn mồi đầu bảng biến mất khỏi hệ sinh thái?', options: ['Vegetation increases dramatically everywhere', 'Herbivores multiply uncontrollably, destroying plant cover and causing soil erosion', 'Rivers turn into oceans', 'Insects immediately replace predators'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "unchecked herbivore populations decimate vegetative undergrowth, which subsequently leads to severe riverbank soil erosion".' },
      { question_text: 'What are "ecosystem services" provided by healthy nature mentioned in the text?', question_text_vi: '"Dịch vụ hệ sinh thái" do thiên nhiên khỏe mạnh cung cấp được nhắc đến là gì?', options: ['Free electricity and high-speed internet', 'Crop pollination, clean water filtration, and carbon sequestration', 'Manufacturing synthetic clothing', 'Building concrete highways'], correct_option: 1, explanation_vi: 'Đoạn văn liệt kê: "crop pollination, clean drinking water filtration, and atmospheric carbon sequestration".' },
      { question_text: 'What solution is recommended to prevent irreversible biodiversity loss?', question_text_vi: 'Giải pháp nào được khuyến nghị để ngăn chặn mất đa dạng sinh học?', options: ['Capturing all animals into city zoos', 'Restricting wildlife trade, expanding protected corridors, and reintroducing native species', 'Deforesting more land for agriculture', 'Using stronger pesticides worldwide'], correct_option: 1, explanation_vi: 'Đoạn văn kết: "international treaties restricting commercial wildlife trade, expanding protected terrestrial corridors, and actively reintroducing native species".' }
    ]
  },

  // Topic 7: Daily Life
  {
    topic_id: 7,
    title: 'My Daily Morning Routine',
    title_vi: 'Thói Quen Buổi Sáng Hằng Ngày Của Tôi',
    difficulty: 'easy',
    word_count: 85,
    estimated_time_minutes: 3,
    content: `Every weekday, my alarm clock rings cheerily at six o'clock in the morning. I stretch my arms and get out of bed immediately. First, I brush my teeth and wash my face with cool water. Then, I put on my school uniform and pack my books into my backpack. At six-thirty, my family sits down together for breakfast. We usually eat warm rice porridge or noodle soup with fried eggs. By seven o'clock, I walk to school with my neighborhood friends, feeling refreshed and ready for a brand new day of learning.`,
    content_vi: `Mỗi ngày trong tuần, đồng hồ báo thức của tôi reo vang vui vẻ vào lúc sáu giờ sáng. Tôi vươn vai và rời khỏi giường ngay lập tức. Trước hết, tôi đánh răng và rửa mặt bằng nước mát. Sau đó, tôi mặc đồng phục học sinh và xếp sách vở vào ba lô. Lúc sáu giờ ba mươi, gia đình tôi cùng nhau ngồi ăn sáng. Chúng tôi thường ăn cháo hoa ấm nóng hoặc phở cùng trứng rán. Đến bảy giờ, tôi đi bộ đến trường cùng các bạn cùng khu phố, cảm thấy sảng khoái và sẵn sàng cho một ngày học tập hoàn toàn mới.`,
    questions: [
      { question_text: 'What time does the author\'s alarm ring on weekdays?', question_text_vi: 'Đồng hồ báo thức của tác giả reo lúc mấy giờ vào ngày trong tuần?', options: ['5:00 AM', '6:00 AM', '7:00 AM', '8:00 AM'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "my alarm clock rings cheerily at six o\'clock in the morning".' },
      { question_text: 'What does the author do immediately after getting out of bed?', question_text_vi: 'Tác giả làm gì ngay sau khi rời khỏi giường?', options: ['Watches TV', 'Brushes teeth and washes face with cool water', 'Eats breakfast', 'Sleeps again'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "First, I brush my teeth and wash my face with cool water".' },
      { question_text: 'What does the family usually eat for breakfast?', question_text_vi: 'Gia đình thường ăn gì cho bữa sáng?', options: ['Pizza and burgers', 'Warm rice porridge or noodle soup with fried eggs', 'Cold cake', 'Coffee only'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "warm rice porridge or noodle soup with fried eggs".' },
      { question_text: 'How does the author travel to school at seven o\'clock?', question_text_vi: 'Tác giả đến trường bằng cách nào lúc 7 giờ?', options: ['Takes a taxi', 'Rides a motorcycle', 'Walks with neighborhood friends', 'Drives a car'], correct_option: 2, explanation_vi: 'Đoạn văn viết: "I walk to school with my neighborhood friends".' }
    ]
  },
  {
    topic_id: 7,
    title: 'The Balance Between Work, Study, and Rest',
    title_vi: 'Sự Cân Bằng Giữa Công Việc, Học Tập Và Nghỉ Ngơi',
    difficulty: 'medium',
    word_count: 140,
    estimated_time_minutes: 4,
    content: `In today\'s fiercely competitive academic and workplace landscape, individuals often prioritize productivity at the severe expense of restorative sleep and leisure. However, behavioral psychologists emphasize that sustainable performance relies on a cyclical rhythm between rigorous exertion and purposeful renewal. Depriving the brain of sufficient nightly rest compromises memory consolidation, weakens immune defenses, and impairs creative problem-solving capacity. Implementing time management techniques—such as scheduling designated breaks during study sessions or turning off electronic notifications after nine in the evening—allows the nervous system to recalibrate. In addition, participating in recreational physical activities like brisk walking or gardening replenishes mental vitality far more effectively than sedentary internet browsing. By regarding leisure not as a guilty indulgence but as a necessary biological prerequisite for excellence, students and professionals alike can maintain peak enthusiasm and safeguard long-term health.`,
    content_vi: `Trong môi trường học tập và làm việc cạnh tranh khốc liệt ngày nay, mọi người thường ưu tiên năng suất mà phải trả giá bằng giấc ngủ phục hồi và sự nghỉ ngơi. Tuy nhiên, các nhà tâm lý học hành vi nhấn mạnh rằng hiệu suất bền vững dựa trên một nhịp điệu chu kỳ giữa sự nỗ lực nghiêm ngặt và sự tái tạo có mục đích. Việc tước đoạt của não bộ giấc ngủ đêm đầy đủ sẽ làm suy giảm khả năng củng cố trí nhớ, làm yếu hệ miễn dịch và suy giảm năng lực giải quyết vấn đề sáng tạo. Việc áp dụng các kỹ thuật quản lý thời gian—chẳng hạn như lên lịch nghỉ ngơi cố định trong các buổi học hoặc tắt thông báo điện tử sau chín giờ tối—cho phép hệ thần kinh tự cân chỉnh lại. Thêm vào đó, việc tham gia các hoạt động thể chất giải trí như đi bộ nhanh hoặc làm vườn giúp làm đầy lại sinh lực tinh thần hiệu quả hơn nhiều so với việc lướt web tĩnh tại. Bằng cách xem việc giải trí không phải là sự nuông chiều tội lỗi mà là điều kiện sinh học tiên quyết cho sự xuất sắc, cả học sinh và người đi làm đều có thể duy trì lòng nhiệt huyết đỉnh cao và bảo vệ sức khỏe lâu dài.`,
    questions: [
      { question_text: 'What do people often sacrifice for the sake of productivity?', question_text_vi: 'Mọi người thường hy sinh điều gì vì năng suất?', options: ['Their clothes', 'Restorative sleep and leisure', 'Their smartphones', 'Their morning alarms'], correct_option: 1, explanation_vi: 'Đoạn văn nêu: "individuals often prioritize productivity at the severe expense of restorative sleep and leisure".' },
      { question_text: 'What happens to the brain when deprived of adequate sleep?', question_text_vi: 'Điều gì xảy ra với não bộ khi thiếu ngủ đầy đủ?', options: ['It grows bigger', 'Memory consolidation is compromised and immune defenses weaken', 'It learns foreign languages faster', 'Nothing changes'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "compromises memory consolidation, weakens immune defenses, and impairs creative problem-solving".' },
      { question_text: 'What simple habit is recommended after nine in the evening?', question_text_vi: 'Thói quen đơn giản nào được khuyên sau 9 giờ tối?', options: ['Drinking strong espresso', 'Turning off electronic notifications', 'Doing intense weightlifting', 'Going shopping'], correct_option: 1, explanation_vi: 'Đoạn văn gợi ý: "turning off electronic notifications after nine in the evening".' },
      { question_text: 'How should purposeful leisure be regarded according to the passage?', question_text_vi: 'Sự nghỉ ngơi có mục đích nên được nhìn nhận thế nào theo bài đọc?', options: ['As a sign of weakness and laziness', 'As a necessary biological prerequisite for sustained excellence', 'As a waste of precious career time', 'As something for retirement only'], correct_option: 1, explanation_vi: 'Đoạn văn kết luận: "not as a guilty indulgence but as a necessary biological prerequisite for excellence".' }
    ]
  },
  {
    topic_id: 7,
    title: 'Urbanization and the Evolution of Daily Living',
    title_vi: 'Đô Thị Hóa Và Sự Biến Đổi Của Đời Sống Thường Nhật',
    difficulty: 'hard',
    word_count: 180,
    estimated_time_minutes: 5,
    content: `Over the past half-century, rapid global urbanization has fundamentally reorganized the cadence and architecture of everyday human life. Rural communal routines once dictated by agrarian solar cycles and reciprocal village networks have been supplanted by hyper-efficient, metropolitan lifestyles structured around rapid transit timetables and high-density vertical living. While contemporary cities grant unprecedented access to specialized healthcare, diverse career pathways, and cosmopolitan cultural attractions, they simultaneously engender acute logistical challenges and psychological alienation. Urban inhabitants routinely endure prolonged daily commutes amid traffic congestion and exhaust fumes, compressing the disposable hours available for domestic cooking, face-to-face familial bonding, and genuine relaxation. Furthermore, the ubiquitous prevalence of digital commerce platforms allows urbanites to order groceries, complete banking transactions, and conduct white-collar employment without ever departing their private apartments. Urban planners now recognize the urgency of creating "fifteen-minute cities," where residential neighborhoods incorporate walkable green parks, public libraries, healthcare clinics, and fresh produce markets within immediate pedestrian proximity. Reclaiming human-scale urban environments ensures that efficiency does not erase the essential social connections and biological rhythms that sustain human happiness.`,
    content_vi: `Trong nửa thế kỷ qua, quá trình đô thị hóa nhanh chóng trên toàn cầu đã tái tổ chức căn bản nhịp điệu và cấu trúc đời sống thường nhật của con người. Những nếp sinh hoạt cộng đồng thôn dã từng được dẫn dắt bởi chu kỳ mặt trời nông nghiệp và mạng lưới làng xã tương trợ đã bị thay thế bởi lối sống đô thị siêu hiệu quả, được cấu trúc xung quanh lịch trình giao thông công cộng và các khu nhà chung cư cao tầng mật độ cao. Mặc dù các đô thị hiện đại mang lại khả năng tiếp cận chưa từng có tới hệ thống y tế chuyên sâu, các lộ trình nghề nghiệp đa dạng và những điểm hẹn văn hóa quốc tế, chúng đồng thời làm nảy sinh những thách thức hậu cần gay gắt và cảm giác xa lánh tâm lý. Cư dân thành thị thường xuyên phải chịu đựng những chuyến đi lại hằng ngày kéo dài giữa cảnh tắc nghẽn giao thông và khói bụi, làm co hẹp quỹ thời gian rảnh rỗi dành cho việc nấu nướng tại gia, gắn kết gia đình trực tiếp và sự thư giãn đích thực. Hơn nữa, sự phổ biến rộng khắp của các nền tảng thương mại điện tử cho phép người thành phố đặt mua thực phẩm, hoàn tất giao dịch ngân hàng và làm công việc văn phòng mà không bao giờ cần bước chân ra khỏi căn hộ riêng của họ. Các nhà quy hoạch đô thị hiện nay nhận thức rõ tính cấp bách của việc kiến tạo "những thành phố mười lăm phút", nơi các khu dân cư tích hợp công viên cây xanh đi bộ, thư viện công cộng, phòng khám y tế và chợ thực phẩm tươi sống trong cự ly đi bộ gần gũi. Việc giành lại môi trường đô thị vừa vặn với quy mô con người đảm bảo rằng tính hiệu quả không xóa nhòa đi những kết nối xã hội thiết yếu và các nhịp điệu sinh học nuôi dưỡng hạnh phúc của con người.`,
    questions: [
      { question_text: 'What replaced the rural routines formerly dictated by solar cycles?', question_text_vi: 'Điều gì đã thay thế nếp sinh hoạt nông thôn từng phụ thuộc vào chu kỳ mặt trời?', options: ['Nomadic hunting lifestyles', 'Hyper-efficient metropolitan lifestyles structured around transit timetables', 'Complete isolation in forests', 'Submarine communities'], correct_option: 1, explanation_vi: 'Đoạn văn viết: "supplanted by hyper-efficient, metropolitan lifestyles structured around rapid transit timetables".' },
      { question_text: 'What major drawback of dense urban living is described regarding daily schedules?', question_text_vi: 'Nhược điểm lớn nào của cuộc sống đô thị dày đặc được miêu tả liên quan đến thời gian biểu?', options: ['Stores close too early', 'Prolonged commutes compress hours for cooking, family, and relaxation', 'Lack of clothing stores', 'No electricity available'], correct_option: 1, explanation_vi: 'Đoạn văn phân tích: "endure prolonged daily commutes... compressing the disposable hours available for domestic cooking, face-to-face familial bonding, and genuine relaxation".' },
      { question_text: 'What is the core concept of a "fifteen-minute city"?', question_text_vi: 'Khái niệm cốt lõi của "thành phố 15 phút" là gì?', options: ['Cities that can be built in fifteen minutes', 'Neighborhoods with parks, libraries, clinics, and markets within immediate pedestrian proximity', 'Highways with 15-minute speed limits', 'Cities where everyone works for only 15 minutes a day'], correct_option: 1, explanation_vi: 'Đoạn văn chỉ rõ: "where residential neighborhoods incorporate walkable green parks, public libraries, healthcare clinics, and fresh produce markets within immediate pedestrian proximity".' },
      { question_text: 'Why is reclaiming human-scale urban environments vital according to the conclusion?', question_text_vi: 'Tại sao việc giành lại môi trường đô thị quy mô con người là tối quan trọng theo kết luận?', options: ['To raise property taxes higher', 'To ensure efficiency does not erase essential social connections and biological rhythms', 'To eliminate all motor vehicles entirely', 'To make everyone move back to villages'], correct_option: 1, explanation_vi: 'Đoạn văn kết: "ensures that efficiency does not erase the essential social connections and biological rhythms that sustain human happiness".' }
    ]
  }
];

// 30 Placement assessment questions for Level Assessment
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
    question_text: 'I didn\'t have ___ money left after shopping.',
    question_text_vi: 'Tôi không còn đồng tiền nào sau buổi mua sắm.',
    options: ['some', 'any', 'many', 'a few'],
    correct_option: 1,
    explanation_vi: 'Trong câu phủ định với danh từ không đếm được "money", ta dùng "any".'
  },
  {
    question_text: 'He asked me where I ___ from.',
    question_text_vi: 'Anh ấy đã hỏi tôi xem tôi đến từ đâu.',
    options: ['come', 'came', 'coming', 'am coming'],
    correct_option: 1,
    explanation_vi: 'Câu gián tiếp tường thuật ở quá khứ (asked) phải lùi thì: come → came.'
  },
  {
    question_text: 'The man ___ lives next door is a software engineer.',
    question_text_vi: 'Người đàn ông sống ở nhà bên cạnh là kỹ sư phần mềm.',
    options: ['which', 'who', 'whose', 'whom'],
    correct_option: 1,
    explanation_vi: 'Đại từ quan hệ thay thế cho danh từ chỉ người làm chủ ngữ là "who".'
  },
  {
    question_text: 'Would you mind ___ the window, please?',
    question_text_vi: 'Bạn có phiền lòng mở giúp cửa sổ không?',
    options: ['open', 'to open', 'opening', 'opened'],
    correct_option: 2,
    explanation_vi: 'Cấu trúc lịch sự: "Would you mind + V-ing...?"'
  },
  {
    question_text: 'Neither Nam nor his friends ___ attending the seminar.',
    question_text_vi: 'Cả Nam lẫn các bạn của anh ấy đều không tham dự buổi hội thảo.',
    options: ['is', 'are', 'was', 'am'],
    correct_option: 1,
    explanation_vi: 'Cấu trúc "Neither... nor..." động từ chia theo chủ ngữ gần nhất (his friends - số nhiều → are).'
  },
  {
    question_text: 'By the time we arrived at the cinema, the film ___.',
    question_text_vi: 'Vào lúc chúng tôi tới rạp chiếu phim, bộ phim đã bắt đầu rồi.',
    options: ['started', 'has started', 'had started', 'starts'],
    correct_option: 2,
    explanation_vi: 'Hành động xảy ra trước một mốc quá khứ (By the time + QKĐ) chia quá khứ hoàn thành (had started).'
  },
  {
    question_text: 'I look forward to ___ from you soon.',
    question_text_vi: 'Tôi rất mong đợi sớm nhận được tin từ bạn.',
    options: ['hear', 'hearing', 'heard', 'be heard'],
    correct_option: 1,
    explanation_vi: 'Cấu trúc trang trọng: "look forward to + V-ing" (mong đợi điều gì).'
  },
  {
    question_text: 'Although the traffic was heavy, we managed to arrive ___.',
    question_text_vi: 'Mặc dù giao thông đông đúc, chúng tôi vẫn cố gắng đến đúng giờ.',
    options: ['punctual', 'punctuality', 'punctually', 'punctualize'],
    correct_option: 2,
    explanation_vi: 'Đứng sau động từ "arrive" bổ nghĩa cho cách thức hành động cần một trạng từ "punctually".'
  },
  {
    question_text: 'It is essential that every student ___ the safety regulations.',
    question_text_vi: 'Điều thiết yếu là mọi học sinh đều phải tuân thủ các quy định an toàn.',
    options: ['follow', 'follows', 'followed', 'following'],
    correct_option: 0,
    explanation_vi: 'Cấu trúc giả định thức (subjunctive mood): "It is essential that + S + (should) V-infinitive" → follow.'
  },
  {
    question_text: 'She succeeded ___ passing the university entrance exam.',
    question_text_vi: 'Cô ấy đã thành công trong việc thi đỗ kỳ thi đại học.',
    options: ['at', 'on', 'in', 'for'],
    correct_option: 2,
    explanation_vi: 'Cụm giới từ cố định: "succeed in doing something" (thành công trong việc gì).'
  },
  {
    question_text: 'Had I known about the cancellation, I ___ all the way there.',
    question_text_vi: 'Giá như tôi biết về việc hủy bỏ, tôi đã không lái xe cả quãng đường tới đó.',
    options: ['wouldn\'t drive', 'wouldn\'t have driven', 'didn\'t drive', 'won\'t drive'],
    correct_option: 1,
    explanation_vi: 'Đảo ngữ câu điều kiện loại 3 (Had I known...): Mệnh đề kết quả dùng "would have + P2".'
  },
  {
    question_text: 'The economic crisis led to a significant ___ in consumer spending.',
    question_text_vi: 'Cuộc khủng hoảng kinh tế đã dẫn tới sự sụt giảm đáng kể trong chi tiêu tiêu dùng.',
    options: ['decline', 'declining', 'declined', 'declines'],
    correct_option: 0,
    explanation_vi: 'Sau mạo từ "a" và tính từ "significant" cần một danh từ số ít: "decline".'
  },
  {
    question_text: 'No sooner had she finished her speech ___ the audience erupted in applause.',
    question_text_vi: 'Ngay khi cô ấy vừa dứt lời phát biểu thì khán giả đã vỗ tay vang dội.',
    options: ['when', 'than', 'then', 'as'],
    correct_option: 1,
    explanation_vi: 'Cấu trúc đảo ngữ cố định: "No sooner had + S + P2... THAN + S + V-ed".'
  },
  {
    question_text: 'The research team made a breakthrough discovery that could ___ revolutionize medicine.',
    question_text_vi: 'Đội ngũ nghiên cứu đã tạo ra một phát hiện đột phá có khả năng cách mạng hóa nền y học.',
    options: ['potential', 'potentially', 'potentiality', 'potent'],
    correct_option: 1,
    explanation_vi: 'Đứng trước động từ "revolutionize" để bổ nghĩa cho khả năng diễn ra cần một trạng từ "potentially".'
  }
];

// Test users to seed
const usersData = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@enlearn.com',
    password_hash: 'Admin@123', // hooks will hash it
    full_name: 'Quản Trị Viên Hệ Thống',
    role: 'admin',
    learning_goal: 'Quản trị và phát triển hệ thống học tiếng Anh trực tuyến toàn diện.',
    initial_level: 100
  },
  {
    id: 2,
    username: 'teacher01',
    email: 'teacher@enlearn.com',
    password_hash: 'Teacher@123',
    full_name: 'Cô Giáo Mai Lan',
    role: 'group_owner',
    learning_goal: 'Soạn giáo trình, tạo nhóm học và hướng dẫn học sinh mất gốc.',
    initial_level: 95
  },
  {
    id: 3,
    username: 'student01',
    email: 'student1@enlearn.com',
    password_hash: 'Student@123',
    full_name: 'Nguyễn Văn Minh',
    role: 'learner',
    learning_goal: 'Học 10 từ vựng mỗi ngày và đạt trình độ tiếng Anh giao tiếp cơ bản.',
    initial_level: 45
  },
  {
    id: 4,
    username: 'student02',
    email: 'student2@enlearn.com',
    password_hash: 'Student@123',
    full_name: 'Trần Thị Hà',
    role: 'learner',
    learning_goal: 'Cải thiện kỹ năng đọc hiểu và ôn từ vựng ngắt quãng để thi học kỳ.',
    initial_level: 60
  }
];

async function seed() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Tự động tạo bảng nếu chưa có
  await sequelize.sync();

  // 1. Topics
  console.log('📌 Seeding 7 Topics...');
  for (const topic of topicsData) {
    await Topic.upsert(topic);
  }

  // 2. Users
  console.log('👤 Seeding Test Users...');
  for (const user of usersData) {
    const existing = await User.findOne({ where: { username: user.username } });
    if (!existing) {
      await User.create(user);
    }
  }

  // 3. Vocabularies
  console.log('📚 Seeding 210 Vocabularies across 7 topics...');
  let vocabCount = 0;
  for (const [topicId, words] of Object.entries(vocabByTopic)) {
    for (const item of words) {
      const existing = await Vocabulary.findOne({ where: { word: item.word, topic_id: topicId } });
      if (!existing) {
        const created = await Vocabulary.create({
          topic_id: parseInt(topicId),
          word: item.word,
          pronunciation: item.pronunciation,
          part_of_speech: item.part_of_speech,
          meaning_vi: item.meaning_vi,
          example_sentence: item.example_sentence,
          example_translation: item.example_translation,
          image_url: `/images/vocab/${item.word.toLowerCase().replace(/\s+/g, '_')}.svg`,
          difficulty: item.difficulty,
          source_type: 'system',
          is_approved: true
        });
        if (item.example_sentence) {
          await VocabExample.create({
            vocabulary_id: created.id,
            sentence: item.example_sentence,
            translation: item.example_translation
          });
        }
        vocabCount++;
      }
    }
  }
  console.log(`✅ Seeded ${vocabCount} new vocabularies`);

  // 4. Readings and Questions
  console.log('📖 Seeding 21 Readings with 84 comprehension questions...');
  for (const r of readingsData) {
    const { questions, ...readingInfo } = r;
    const [reading] = await Reading.findOrCreate({
      where: { title: readingInfo.title },
      defaults: {
        ...readingInfo,
        source_type: 'system',
        is_approved: true
      }
    });

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await Question.findOrCreate({
        where: { reading_id: reading.id, display_order: i },
        defaults: {
          reading_id: reading.id,
          question_text: q.question_text,
          question_text_vi: q.question_text_vi,
          options: q.options,
          correct_option: q.correct_option,
          explanation_vi: q.explanation_vi,
          display_order: i
        }
      });
    }
  }

  // 5. Placement Assessment Questions in LevelAssessment or special mock
  console.log('📝 Checking sample Group and content...');
  const teacher = await User.findOne({ where: { username: 'teacher01' } });
  const student1 = await User.findOne({ where: { username: 'student01' } });
  const student2 = await User.findOne({ where: { username: 'student02' } });

  if (teacher) {
    const [group] = await Group.findOrCreate({
      where: { name: 'Lớp Tiếng Anh Giao Tiếp A1' },
      defaults: {
        owner_id: teacher.id,
        name: 'Lớp Tiếng Anh Giao Tiếp A1',
        description: 'Nhóm học tập bổ trợ từ vựng và đọc hiểu cho người mới bắt đầu.',
        invite_code: 'ENG101A1',
        is_active: true
      }
    });

    // Members
    await GroupMember.findOrCreate({
      where: { group_id: group.id, user_id: teacher.id },
      defaults: { group_id: group.id, user_id: teacher.id, role: 'owner' }
    });

    if (student1) {
      await GroupMember.findOrCreate({
        where: { group_id: group.id, user_id: student1.id },
        defaults: { group_id: group.id, user_id: student1.id, role: 'member' }
      });
    }

    if (student2) {
      await GroupMember.findOrCreate({
        where: { group_id: group.id, user_id: student2.id },
        defaults: { group_id: group.id, user_id: student2.id, role: 'member' }
      });
    }

    // Group Vocab Set
    const [vocabSet] = await GroupVocabSet.findOrCreate({
      where: { group_id: group.id, title: 'Từ Vựng Cơ Bản Về Bản Thân & Gia Đình' },
      defaults: {
        group_id: group.id,
        created_by: teacher.id,
        title: 'Từ Vựng Cơ Bản Về Bản Thân & Gia Đình',
        description: 'Bộ 10 từ vựng căn bản cần ghi nhớ trong tuần đầu tiên.',
        is_published: true
      }
    });

    const sampleVocabs = await Vocabulary.findAll({ limit: 10 });
    for (let idx = 0; idx < sampleVocabs.length; idx++) {
      await GroupVocabItem.findOrCreate({
        where: { vocab_set_id: vocabSet.id, vocabulary_id: sampleVocabs[idx].id },
        defaults: {
          vocab_set_id: vocabSet.id,
          vocabulary_id: sampleVocabs[idx].id,
          display_order: idx
        }
      });
    }

    // Group Reading Set
    const sampleReading = await Reading.findOne();
    if (sampleReading) {
      await GroupReadingSet.findOrCreate({
        where: { group_id: group.id, reading_id: sampleReading.id },
        defaults: {
          group_id: group.id,
          reading_id: sampleReading.id,
          created_by: teacher.id,
          is_published: true
        }
      });
    }
  }

  console.log('🎉 Seeding completed successfully!');
}

module.exports = { seed, placementQuestionsData };

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
