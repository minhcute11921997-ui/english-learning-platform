/**
 * Bộ từ vựng chuẩn Mỹ thuật & Thủ công nghệ thuật (Fine Arts & Crafts)
 * Nguồn tham chiếu: Oxford Art & Design Dictionary, Duden Bildwörterbuch, Tate Art Glossary, Britannica
 */

const topicsData = [
  {
    id: 1,
    name: 'Types of Paintings',
    name_vi: 'Các loại tranh',
    icon: 'HiPaintBrush',
    display_order: 1,
    description: 'Từ vựng và bài đọc về các thể loại tranh vẽ, chất liệu, kỹ thuật thể hiện và trường phái hội họa kinh điển.'
  },
  {
    id: 2,
    name: 'Fine Arts & Crafts Professions',
    name_vi: 'Ngành nghề mỹ nghệ',
    icon: 'HiSparkles',
    display_order: 2,
    description: 'Từ vựng và bài đọc về các ngành nghề thủ công mỹ nghệ tinh xảo, nghệ nhân và kỹ nghệ chế tác truyền thống lẫn hiện đại.'
  }
];

const vocabByTopic = {
  1: [
    {
      word: 'oil painting',
      pronunciation: '/ˈɔɪl ˈpeɪntɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh sơn dầu',
      example_sentence: 'The museum exhibits a famous Renaissance oil painting.',
      example_translation: 'Bảo tàng trưng bày một bức tranh sơn dầu thời Phục hưng nổi tiếng.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/oil_painting.svg'
    },
    {
      word: 'watercolor',
      pronunciation: '/ˈwɔːtəkʌlər/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh màu nước',
      example_sentence: 'Watercolor allows artists to create soft and translucent layers.',
      example_translation: 'Màu nước cho phép họa sĩ tạo ra những lớp màu mềm mại và trong trẻo.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/watercolor.svg'
    },
    {
      word: 'acrylic painting',
      pronunciation: '/əˈkrɪlɪk ˈpeɪntɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh màu acrylic',
      example_sentence: 'Acrylic paint dries much faster than traditional oil paint.',
      example_translation: 'Sơn acrylic khô nhanh hơn nhiều so với sơn dầu truyền thống.',
      difficulty: 'easy',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/acrylic_painting.svg'
    },
    {
      word: 'fresco',
      pronunciation: '/ˈfreskəʊ/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh bích họa trên vữa ướt',
      example_sentence: 'Michelangelo painted monumental frescos on the ceiling of the Sistine Chapel.',
      example_translation: 'Michelangelo đã vẽ những bức bích họa đồ sộ trên trần Nhà nguyện Sistine.',
      difficulty: 'medium',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/fresco.svg'
    },
    {
      word: 'portrait',
      pronunciation: '/ˈpɔːtrɪt/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh chân dung',
      example_sentence: 'The Mona Lisa is perhaps the most celebrated portrait in the world.',
      example_translation: 'Mona Lisa có lẽ là bức tranh chân dung nổi tiếng nhất thế giới.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/portrait.svg'
    },
    {
      word: 'landscape',
      pronunciation: '/ˈlændskeɪp/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh phong cảnh',
      example_sentence: 'He captured the golden sunset in a peaceful countryside landscape.',
      example_translation: 'Ông đã bắt trọn hoàng hôn rực vàng trong một bức tranh phong cảnh đồng quê thanh bình.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/landscape.svg'
    },
    {
      word: 'still life',
      pronunciation: '/stɪl laɪf/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh tĩnh vật',
      example_sentence: 'Dutch painters were masters of detailed still life compositions.',
      example_translation: 'Các danh họa Hà Lan là bậc thầy về những bố cục tranh tĩnh vật chi tiết.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/still_life.svg'
    },
    {
      word: 'abstract art',
      pronunciation: '/ˈæbstrækt ɑːt/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ thuật trừu tượng',
      example_sentence: 'Abstract art focuses on shapes, colors, and emotions rather than realistic figures.',
      example_translation: 'Nghệ thuật trừu tượng chú trọng vào hình khối, màu sắc và cảm xúc thay vì hình tượng hiện thực.',
      difficulty: 'medium',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/abstract_art.svg'
    },
    {
      word: 'impressionism',
      pronunciation: '/ɪmˈpreʃənɪzəm/',
      part_of_speech: 'noun',
      meaning_vi: 'trường phái ấn tượng',
      example_sentence: 'Impressionism emerged in France with Claude Monet as a key figure.',
      example_translation: 'Trường phái ấn tượng khởi phát tại Pháp với Claude Monet là một nhân vật then chốt.',
      difficulty: 'medium',
      source_ref: 'Encyclopædia Britannica',
      image_url: '/images/vocab/impressionism.svg'
    },
    {
      word: 'surrealism',
      pronunciation: '/səˈrɪəlɪzəm/',
      part_of_speech: 'noun',
      meaning_vi: 'trường phái siêu thực',
      example_sentence: 'Surrealism explores dreamlike imagery and the subconscious mind.',
      example_translation: 'Trường phái siêu thực khám phá những hình ảnh tựa giấc mơ và tiềm thức con người.',
      difficulty: 'hard',
      source_ref: 'MoMA Art Terms',
      image_url: '/images/vocab/surrealism.svg'
    },
    {
      word: 'cubism',
      pronunciation: '/ˈkjuːbɪzəm/',
      part_of_speech: 'noun',
      meaning_vi: 'trường phái lập thể',
      example_sentence: 'Picasso pioneered cubism by breaking subjects into geometric facets.',
      example_translation: 'Picasso mở đường cho trường phái lập thể bằng cách phân tích đối tượng thành các diện kỷ hà hình học.',
      difficulty: 'hard',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/cubism.svg'
    },
    {
      word: 'canvas',
      pronunciation: '/ˈkænvəs/',
      part_of_speech: 'noun',
      meaning_vi: 'vải vẽ tranh, toan vẽ',
      example_sentence: 'She stretched a clean cotton canvas onto the wooden frame.',
      example_translation: 'Cô căng một tấm toan vải cotton sạch lên khung gỗ.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/canvas.svg'
    },
    {
      word: 'easel',
      pronunciation: '/ˈiːzl/',
      part_of_speech: 'noun',
      meaning_vi: 'giá vẽ tranh',
      example_sentence: 'The painter placed the canvas securely upon the wooden easel.',
      example_translation: 'Họa sĩ đặt tấm toan chắc chắn lên giá vẽ bằng gỗ.',
      difficulty: 'easy',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/easel.svg'
    },
    {
      word: 'palette',
      pronunciation: '/ˈpælət/',
      part_of_speech: 'noun',
      meaning_vi: 'bảng pha màu',
      example_sentence: 'He mixed vibrant shades of blue and gold on his wooden palette.',
      example_translation: 'Anh ấy pha trộn những sắc thái rực rỡ của màu xanh và vàng trên bảng pha màu bằng gỗ.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/palette.svg'
    },
    {
      word: 'brushstroke',
      pronunciation: '/ˈbrʌʃstrəʊk/',
      part_of_speech: 'noun',
      meaning_vi: 'nét cọ, nét bút vẽ',
      example_sentence: 'Van Gogh was famous for his thick and energetic brushstrokes.',
      example_translation: 'Van Gogh nổi tiếng với những nét cọ dày và tràn đầy năng lượng.',
      difficulty: 'medium',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/brushstroke.svg'
    },
    {
      word: 'sketch',
      pronunciation: '/sketʃ/',
      part_of_speech: 'noun',
      meaning_vi: 'bản phác thảo, bản vẽ nháp',
      example_sentence: 'Before making the final piece, she drew a quick charcoal sketch.',
      example_translation: 'Trước khi thực hiện tác phẩm chính thức, cô đã vẽ một bản phác thảo nhanh bằng than.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/sketch.svg'
    },
    {
      word: 'mural',
      pronunciation: '/ˈmjʊərəl/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh tường',
      example_sentence: 'A giant colorful mural decorated the entire side of the building.',
      example_translation: 'Một bức tranh tường khổng lồ đầy màu sắc trang hoàng toàn bộ mặt bên của tòa nhà.',
      difficulty: 'easy',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/mural.svg'
    },
    {
      word: 'gouache',
      pronunciation: '/ɡuˈɑːʃ/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh màu bột gouache',
      example_sentence: 'Gouache is an opaque watercolor that provides dense, matte coverage.',
      example_translation: 'Gouache là loại màu nước đục mang lại độ phủ đậm đặc và bề mặt lì.',
      difficulty: 'medium',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/gouache.svg'
    },
    {
      word: 'tempera',
      pronunciation: '/ˈtempərə/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh vẽ màu keo (lòng đỏ trứng)',
      example_sentence: 'Medieval religious icons were commonly painted using egg tempera.',
      example_translation: 'Các biểu tượng tôn giáo thời Trung Cổ thường được vẽ bằng màu keo lòng đỏ trứng.',
      difficulty: 'hard',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/tempera.svg'
    },
    {
      word: 'minimalism',
      pronunciation: '/ˈmɪnɪməlɪzəm/',
      part_of_speech: 'noun',
      meaning_vi: 'chủ nghĩa tối giản',
      example_sentence: 'Minimalism emphasizes simple geometrical forms and monochromatic tones.',
      example_translation: 'Chủ nghĩa tối giản đề cao các hình thức hình học đơn giản và sắc thái đơn sắc.',
      difficulty: 'medium',
      source_ref: 'MoMA Art Terms',
      image_url: '/images/vocab/minimalism.svg'
    },
    {
      word: 'expressionism',
      pronunciation: '/ɪkˈspreʃənɪzəm/',
      part_of_speech: 'noun',
      meaning_vi: 'trường phái biểu hiện',
      example_sentence: 'German expressionism aimed to portray subjective emotional responses.',
      example_translation: 'Trường phái biểu hiện Đức hướng đến diễn tả phản ứng cảm xúc chủ quan sâu sắc.',
      difficulty: 'hard',
      source_ref: 'Encyclopædia Britannica',
      image_url: '/images/vocab/expressionism.svg'
    },
    {
      word: 'realism',
      pronunciation: '/ˈrɪəlɪzəm/',
      part_of_speech: 'noun',
      meaning_vi: 'chủ nghĩa hiện thực',
      example_sentence: 'Realism sought to portray everyday life without idealization.',
      example_translation: 'Chủ nghĩa hiện thực tìm cách miêu tả đời sống thường nhật một cách chân thực không lý tưởng hóa.',
      difficulty: 'medium',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/realism.svg'
    },
    {
      word: 'miniature',
      pronunciation: '/ˈmɪnətʃər/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh tiểu họa',
      example_sentence: 'Persian miniature paintings feature extraordinarily intricate details.',
      example_translation: 'Những bức tranh tiểu họa Ba Tư thể hiện các chi tiết cực kỳ tinh xảo.',
      difficulty: 'medium',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/miniature.svg'
    },
    {
      word: 'self-portrait',
      pronunciation: '/ˌself ˈpɔːtrɪt/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh tự họa',
      example_sentence: 'Rembrandt completed dozens of self-portraits chronicling his lifetime.',
      example_translation: 'Rembrandt đã vẽ hàng chục bức tranh tự họa ghi lại từng chặng đường cuộc đời mình.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/self_portrait.svg'
    },
    {
      word: 'seascape',
      pronunciation: '/ˈsiːskeɪp/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh phong cảnh biển',
      example_sentence: 'Turner created turbulent seascapes showing stormy waves and majestic ships.',
      example_translation: 'Turner tạo nên những bức tranh cảnh biển dữ dội thể hiện sóng bão và tàu bè uy nghi.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/seascape.svg'
    },
    {
      word: 'cityscape',
      pronunciation: '/ˈsɪtiskeɪp/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh phong cảnh đô thị',
      example_sentence: 'The modern cityscape highlights illuminated skyscrapers at twilight.',
      example_translation: 'Bức tranh phong cảnh đô thị hiện đại nổi bật với những tòa nhà chọc trời rực sáng lúc chạng vạng.',
      difficulty: 'easy',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/cityscape.svg'
    },
    {
      word: 'chiaroscuro',
      pronunciation: '/kiˌɑːrəˈskjʊərəʊ/',
      part_of_speech: 'noun',
      meaning_vi: 'kỹ thuật tương phản sáng tối',
      example_sentence: 'Caravaggio was a master of dramatic chiaroscuro in Baroque painting.',
      example_translation: 'Caravaggio là bậc thầy kỹ thuật tương phản sáng tối đầy kịch tính trong hội họa Baroque.',
      difficulty: 'hard',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/chiaroscuro.svg'
    },
    {
      word: 'charcoal',
      pronunciation: '/ˈtʃɑːrkəʊl/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh vẽ chì than, than vẽ',
      example_sentence: 'Charcoal drawing produces deep, velvety blacks and soft gradients.',
      example_translation: 'Vẽ than tạo ra những mảng đen sâu thẳm như nhung cùng những độ chuyển êm ái.',
      difficulty: 'easy',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/charcoal.svg'
    },
    {
      word: 'pastel',
      pronunciation: '/pæˈstel/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh phấn màu pastel',
      example_sentence: 'Degas used pastel sticks to capture the graceful movement of ballet dancers.',
      example_translation: 'Degas dùng thỏi phấn màu để bắt trọn chuyển động duyên dáng của các vũ công múa ba-lê.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/pastel.svg'
    },
    {
      word: 'triptych',
      pronunciation: '/ˈtrɪptɪk/',
      part_of_speech: 'noun',
      meaning_vi: 'tranh bộ ba tấm ghép',
      example_sentence: 'The altar was adorned with an elaborate three-panelled triptych.',
      example_translation: 'Bàn thờ được tôn nghiêm bằng một bức tranh triptych ba tấm ghép công phu.',
      difficulty: 'hard',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/triptych.svg'
    }
  ],
  2: [
    {
      word: 'ceramics',
      pronunciation: '/sɪˈræmɪks/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ thuật gốm sứ',
      example_sentence: 'Ceramics involves shaping clay and hardening it at high temperatures in a kiln.',
      example_translation: 'Nghệ thuật gốm sứ liên quan đến việc nặn đất sét và nung cứng ở nhiệt độ cao trong lò nung.',
      difficulty: 'easy',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/ceramics.svg'
    },
    {
      word: 'pottery',
      pronunciation: '/ˈpɒtəri/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề làm đồ gốm',
      example_sentence: 'The village has practiced traditional pottery for over five centuries.',
      example_translation: 'Ngôi làng đã lưu truyền nghề làm đồ gốm truyền thống hơn năm thế kỷ qua.',
      difficulty: 'easy',
      source_ref: 'Oxford Crafts Dictionary',
      image_url: '/images/vocab/pottery.svg'
    },
    {
      word: 'lacquerware',
      pronunciation: '/ˈlækərweər/',
      part_of_speech: 'noun',
      meaning_vi: 'đồ thủ công sơn mài',
      example_sentence: 'Vietnamese lacquerware requires multiple layers of natural resin and polishing.',
      example_translation: 'Sơn mài Việt Nam đòi hỏi nhiều lớp nhựa tự nhiên cùng quy trình mài đánh bóng tỉ mỉ.',
      difficulty: 'medium',
      source_ref: 'Britannica Crafts',
      image_url: '/images/vocab/lacquerware.svg'
    },
    {
      word: 'embroidery',
      pronunciation: '/ɪmˈbrɔɪdəri/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề thêu ren mỹ nghệ',
      example_sentence: 'Her exquisite silk embroidery depicted cranes flying over lotus ponds.',
      example_translation: 'Tác phẩm thêu tơ tằm tinh xảo của bà miêu tả đàn hạc bay lượn trên đầm sen.',
      difficulty: 'medium',
      source_ref: 'Oxford Crafts Dictionary',
      image_url: '/images/vocab/embroidery.svg'
    },
    {
      word: 'woodcarving',
      pronunciation: '/ˈwʊdkɑːvɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ thuật điêu khắc gỗ',
      example_sentence: 'The temple doors feature magnificent woodcarving of mythological dragons.',
      example_translation: 'Những cánh cửa đền nổi bật với nghệ thuật điêu khắc gỗ rồng thần thoại tráng lệ.',
      difficulty: 'easy',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/woodcarving.svg'
    },
    {
      word: 'calligraphy',
      pronunciation: '/kəˈlɪɡrəfi/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ thuật thư pháp',
      example_sentence: 'Traditional calligraphy turns written words into an expressive visual art form.',
      example_translation: 'Thư pháp truyền thống biến các con chữ viết thành một hình thái nghệ thuật thị giác truyền cảm.',
      difficulty: 'medium',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/calligraphy.svg'
    },
    {
      word: 'sculpture',
      pronunciation: '/ˈskʌlptʃər/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ thuật điêu khắc',
      example_sentence: 'Marble sculpture demands immense precision, patience, and technical skill.',
      example_translation: 'Nghệ thuật điêu khắc đá cẩm thạch đòi hỏi sự chuẩn xác cao độ, lòng kiên nhẫn và kỹ năng tay nghề.',
      difficulty: 'easy',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/sculpture.svg'
    },
    {
      word: 'weaving',
      pronunciation: '/ˈwiːvɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề dệt thủ công, dệt thổ cẩm',
      example_sentence: 'Handloom weaving preserves indigenous patterns handed down through generations.',
      example_translation: 'Nghề dệt khung cửi thủ công lưu giữ các hoa văn bản địa truyền qua nhiều thế hệ.',
      difficulty: 'easy',
      source_ref: 'Britannica Crafts',
      image_url: '/images/vocab/weaving.svg'
    },
    {
      word: 'glassblowing',
      pronunciation: '/ˈɡlɑːsbfləʊɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề thổi thủy tinh mỹ nghệ',
      example_sentence: 'Murano island in Venice is world-renowned for exquisite glassblowing.',
      example_translation: 'Hòn đảo Murano tại Venice nổi danh toàn cầu nhờ nghệ thuật thổi thủy tinh tinh xảo.',
      difficulty: 'hard',
      source_ref: 'Oxford Crafts Dictionary',
      image_url: '/images/vocab/glassblowing.svg'
    },
    {
      word: 'silversmithing',
      pronunciation: '/ˈsɪlvəsmɪθɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề chế tác bạc mỹ nghệ',
      example_sentence: 'Silversmithing involves hammering and soldering precious silver into fine vessels.',
      example_translation: 'Nghề chế tác bạc bao gồm rèn gò và hàn bạc quý thành các đồ vật mỹ nghệ tinh mỹ.',
      difficulty: 'hard',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/silversmithing.svg'
    },
    {
      word: 'jewelry design',
      pronunciation: '/ˈdʒuːəlri dɪˈzaɪn/',
      part_of_speech: 'noun',
      meaning_vi: 'thiết kế kim hoàn trang sức',
      example_sentence: 'She studied contemporary jewelry design in Florence.',
      example_translation: 'Cô ấy theo học chuyên ngành thiết kế trang sức kim hoàn đương đại tại Florence.',
      difficulty: 'medium',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/jewelry_design.svg'
    },
    {
      word: 'leathercraft',
      pronunciation: '/ˈleðəkrɑːft/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề làm đồ da thủ công',
      example_sentence: 'Custom leathercraft goods are prized for hand-stitching and durability.',
      example_translation: 'Các sản phẩm đồ da thủ công được ưa chuộng nhờ đường may tay và độ bền vượt trội.',
      difficulty: 'medium',
      source_ref: 'Oxford Crafts Dictionary',
      image_url: '/images/vocab/leathercraft.svg'
    },
    {
      word: 'quilting',
      pronunciation: '/ˈkwɪltɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề chần ghép vải mỹ nghệ',
      example_sentence: 'Artistic quilting combines colorful fabric scraps into narrative wall hangings.',
      example_translation: 'Nghề chần ghép vải mỹ thuật kết hợp các mảnh vải sắc màu thành tranh treo tường mang tính tự sự.',
      difficulty: 'medium',
      source_ref: 'Britannica Crafts',
      image_url: '/images/vocab/quilting.svg'
    },
    {
      word: 'printmaking',
      pronunciation: '/ˈprɪntmeɪkɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ thuật in khắc đồ họa',
      example_sentence: 'Woodblock printmaking played a vital role in Asian art history.',
      example_translation: 'Nghệ thuật in mộc bản đóng vai trò quan trọng trong lịch sử mỹ thuật Á Đông.',
      difficulty: 'medium',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/printmaking.svg'
    },
    {
      word: 'engraving',
      pronunciation: '/ɪnˈɡreɪvɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'kỹ thuật chạm khắc kim loại/đá',
      example_sentence: 'Copperplate engraving was widely used for book illustrations in the eighteenth century.',
      example_translation: 'Chạm khắc bản đồng từng được sử dụng rộng rãi để minh họa sách vào thế kỷ 18.',
      difficulty: 'medium',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/engraving.svg'
    },
    {
      word: 'mosaic',
      pronunciation: '/məʊˈzeɪɪk/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ thuật khảm ghép sành sứ/đá',
      example_sentence: 'Byzantine basilicas are adorned with glistening gold mosaics.',
      example_translation: 'Các thánh đường Byzantine được trang hoàng bằng những bức tranh khảm vàng lấp lánh.',
      difficulty: 'easy',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/mosaic.svg'
    },
    {
      word: 'basketry',
      pronunciation: '/ˈbɑːskɪtri/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề đan lát mây tre',
      example_sentence: 'Bamboo basketry is an eco-friendly traditional craft in Southeast Asia.',
      example_translation: 'Nghề đan lát mây tre là nghề thủ công truyền thống thân thiện môi trường ở Đông Nam Á.',
      difficulty: 'medium',
      source_ref: 'Britannica Crafts',
      image_url: '/images/vocab/basketry.svg'
    },
    {
      word: 'tapestry',
      pronunciation: '/ˈtæpəstri/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ thuật dệt thảm trang trí',
      example_sentence: 'The royal banquet hall was lined with rich wool tapestries.',
      example_translation: 'Đại sảnh yến tiệc hoàng gia được phủ kín bởi những tấm thảm dệt len trang trí lộng lẫy.',
      difficulty: 'medium',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/tapestry.svg'
    },
    {
      word: 'gilding',
      pronunciation: '/ˈɡɪldɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'kỹ thuật dát vàng lá mỹ nghệ',
      example_sentence: 'Artisans applied delicate gold leaf through the technique of gilding.',
      example_translation: 'Các nghệ nhân gắn lá vàng mỏng bằng kỹ thuật dát vàng lá công phu.',
      difficulty: 'hard',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/gilding.svg'
    },
    {
      word: 'stonemasonry',
      pronunciation: '/ˈstəʊnmeɪsənri/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề chạm khắc đá mỹ nghệ',
      example_sentence: 'Gothic cathedrals stand as enduring monuments to masterful stonemasonry.',
      example_translation: 'Các nhà thờ Gothic đứng vững như những đài tưởng niệm cho nghề chạm khắc đá bậc thầy.',
      difficulty: 'hard',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/stonemasonry.svg'
    },
    {
      word: 'origami',
      pronunciation: '/ˌɒrɪˈɡɑːmi/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ thuật gấp giấy',
      example_sentence: 'Origami transforms flat sheets of paper into complex geometric sculptures.',
      example_translation: 'Nghệ thuật origami biến những tờ giấy phẳng thành những tạo hình điêu khắc kỷ hà phức tạp.',
      difficulty: 'easy',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/origami.svg'
    },
    {
      word: 'blacksmithing',
      pronunciation: '/ˈblæksmɪθɪŋ/',
      part_of_speech: 'noun',
      meaning_vi: 'nghề rèn sắt mỹ nghệ',
      example_sentence: 'Artistic blacksmithing forges heated iron into ornate garden gates.',
      example_translation: 'Nghề rèn sắt mỹ thuật rèn sắt nung nóng thành những cánh cổng vườn hoa văn cầu kỳ.',
      difficulty: 'medium',
      source_ref: 'Britannica Crafts',
      image_url: '/images/vocab/blacksmithing.svg'
    },
    {
      word: 'potter',
      pronunciation: '/ˈpɒtər/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ nhân làm gốm',
      example_sentence: 'The potter centered the damp clay spinning rapidly on the wheel.',
      example_translation: 'Nghệ nhân làm gốm nắn định tâm khối đất sét đang quay nhanh trên bàn xoay.',
      difficulty: 'easy',
      source_ref: 'Oxford Crafts Dictionary',
      image_url: '/images/vocab/potter.svg'
    },
    {
      word: 'sculptor',
      pronunciation: '/ˈskʌlptər/',
      part_of_speech: 'noun',
      meaning_vi: 'nhà điêu khắc',
      example_sentence: 'The sculptor chisels away excess stone to reveal the figure within.',
      example_translation: 'Nhà điêu khắc đục bỏ phần đá thừa để làm lộ diện hình tượng bên trong.',
      difficulty: 'easy',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/sculptor.svg'
    },
    {
      word: 'artisan',
      pronunciation: '/ˌɑːtɪˈzæn/',
      part_of_speech: 'noun',
      meaning_vi: 'nghệ nhân thủ công lành nghề',
      example_sentence: 'Each handcrafted piece carries the unique touch of the master artisan.',
      example_translation: 'Mỗi sản phẩm thủ công đều mang dấu ấn độc đáo của nghệ nhân bậc thầy.',
      difficulty: 'medium',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/artisan.svg'
    },
    {
      word: 'craftsman',
      pronunciation: '/ˈkrɑːftsmən/',
      part_of_speech: 'noun',
      meaning_vi: 'thợ thủ công',
      example_sentence: 'An experienced craftsman takes pride in the flawless finish of his work.',
      example_translation: 'Một người thợ thủ công lành nghề luôn tự hào về độ hoàn thiện hoàn mỹ của tác phẩm.',
      difficulty: 'easy',
      source_ref: 'Duden Bildwörterbuch',
      image_url: '/images/vocab/craftsman.svg'
    },
    {
      word: 'weaver',
      pronunciation: '/ˈwiːvər/',
      part_of_speech: 'noun',
      meaning_vi: 'thợ dệt vải/thảm',
      example_sentence: 'The skilled weaver interlaces threads with extraordinary speed and rhythm.',
      example_translation: 'Người thợ dệt lành nghề đan luồn các sợi chỉ với tốc độ và nhịp điệu phi thường.',
      difficulty: 'easy',
      source_ref: 'Oxford Crafts Dictionary',
      image_url: '/images/vocab/weaver.svg'
    },
    {
      word: 'metalsmith',
      pronunciation: '/ˈmetlsmɪθ/',
      part_of_speech: 'noun',
      meaning_vi: 'thợ chế tác kim loại mỹ nghệ',
      example_sentence: 'The metalsmith hammered bronze sheets into ornamental wall reliefs.',
      example_translation: 'Người thợ kim loại gò những tấm đồng thành phù điêu trang trí tường.',
      difficulty: 'medium',
      source_ref: 'Britannica Crafts',
      image_url: '/images/vocab/metalsmith.svg'
    },
    {
      word: 'calligrapher',
      pronunciation: '/kəˈlɪɡrəfər/',
      part_of_speech: 'noun',
      meaning_vi: 'nhà thư pháp',
      example_sentence: 'During the Lunar New Year, the calligrapher writes lucky couplets for visitors.',
      example_translation: 'Vào dịp Tết, nhà thư pháp viết những câu đối may mắn cho khách ghé thăm.',
      difficulty: 'medium',
      source_ref: 'Oxford Art Dictionary',
      image_url: '/images/vocab/calligrapher.svg'
    },
    {
      word: 'restorer',
      pronunciation: '/rɪˈstɔːrər/',
      part_of_speech: 'noun',
      meaning_vi: 'chuyên gia phục chế tác phẩm',
      example_sentence: 'The art restorer carefully cleaned grime off the centuries-old canvas.',
      example_translation: 'Chuyên gia phục chế nghệ thuật cẩn trọng làm sạch bụi bẩn trên tấm toan hàng thế kỷ tuổi.',
      difficulty: 'hard',
      source_ref: 'Tate Art Glossary',
      image_url: '/images/vocab/restorer.svg'
    }
  ]
};

module.exports = {
  topicsData,
  vocabByTopic
};
