/**
 * Dữ liệu bài đọc và câu hỏi đọc hiểu chuyên sâu về Mỹ thuật & Thủ công nghệ thuật
 */

const readingsData = [
  // --- TOPIC 1: Types of Paintings (Các loại tranh) ---
  {
    topic_id: 1,
    title: 'The Evolution of Oil Painting',
    title_vi: 'Sự Phát Triển Của Nghệ Thuật Tranh Sơn Dầu',
    content: `Oil painting has long been considered one of the most prominent mediums in Western art history. Before its widespread adoption in the early fifteenth century, artists primarily used tempera, which dried rapidly and made subtle blending difficult. Early Netherlandish masters such as Jan van Eyck refined the use of drying oils, such as linseed oil, as binders for pigments.

This innovative technique provided remarkable flexibility. Because oil paint dries very slowly through oxidation, painters could apply thin, luminous glazes over weeks or months. This allowed unprecedented realism in depicting light, skin textures, and reflective surfaces. During the Italian Renaissance and Baroque eras, masters like Titian, Rembrandt, and Caravaggio pushed the medium further, utilizing energetic brushstrokes and intense chiaroscuro. Today, oil painting remains an enduring standard of fine art.`,
    content_vi: `Tranh sơn dầu từ lâu đã được coi là một trong những chất liệu nổi bật nhất trong lịch sử hội họa phương Tây. Trước khi được sử dụng rộng rãi vào đầu thế kỷ 15, các họa sĩ chủ yếu dùng màu keo tempera, vốn khô rất nhanh và gây khó khăn khi tạo độ chuyển màu tinh tế. Các bậc thầy vùng Netherland như Jan van Eyck đã hoàn thiện việc sử dụng dầu khô như dầu lanh làm chất kết dính cho bột màu.

Kỹ thuật đột phá này mang lại sự linh hoạt đáng kinh ngạc. Vì sơn dầu khô rất chậm qua quá trình oxy hóa, các họa sĩ có thể phủ nhiều lớp men mỏng trong suốt qua hàng tuần hoặc hàng tháng. Điều này cho phép độ chân thực chưa từng có trong việc thể hiện ánh sáng, kết cấu da và các bề mặt phản chiếu. Đến thời kỳ Phục hưng Ý và Baroque, các danh họa như Titian, Rembrandt và Caravaggio đã đẩy chất liệu này đi xa hơn với các nét cọ tràn đầy năng lượng và độ tương phản sáng tối kịch tính. Ngày nay, tranh sơn dầu vẫn là một chuẩn mực bền vững của mỹ thuật hàn lâm.`,
    difficulty: 'medium',
    word_count: 155,
    estimated_time_minutes: 4,
    questions: [
      {
        question_text: 'What major challenge did artists face when using egg tempera prior to oil paint?',
        question_text_vi: 'Thách thức lớn mà họa sĩ gặp phải khi dùng màu keo tempera trước sơn dầu là gì?',
        options: [
          'It was extremely expensive to purchase in Europe',
          'It dried too quickly, making smooth blending difficult',
          'It only adhered to stone walls',
          'It caused severe skin irritation'
        ],
        correct_option: 1,
        explanation_vi: 'Đoạn 1 nêu: "artists primarily used tempera, which dried rapidly and made subtle blending difficult".'
      },
      {
        question_text: 'Which drying oil is specifically mentioned as a popular pigment binder?',
        question_text_vi: 'Loại dầu khô nào được nhắc đến cụ thể như một chất kết dính hạt màu phổ biến?',
        options: ['Linseed oil', 'Olive oil', 'Mineral motor oil', 'Sunflower oil'],
        correct_option: 0,
        explanation_vi: 'Đoạn 1 nêu: "refined the use of drying oils, such as linseed oil, as binders for pigments".'
      },
      {
        question_text: 'Why does the slow drying process of oil paint benefit artists?',
        question_text_vi: 'Tại sao quá trình khô chậm của sơn dầu lại có lợi cho họa sĩ?',
        options: [
          'It allows canvases to be folded and transported easily',
          'It eliminates the need to use paintbrushes',
          'It enables painters to work in layers and render subtle light and textures',
          'It prevents paintings from ever fading over time'
        ],
        correct_option: 2,
        explanation_vi: 'Đoạn 2 giải thích: "painters could apply thin, luminous glazes over weeks... allowed unprecedented realism in depicting light, skin textures".'
      },
      {
        question_text: 'Which artistic technique was famously championed by Caravaggio and Rembrandt in oil works?',
        question_text_vi: 'Kỹ thuật nghệ thuật nào nổi tiếng được Caravaggio và Rembrandt phát huy trong các tác phẩm sơn dầu?',
        options: ['Chiaroscuro', 'Origami', 'Lithography', 'Watercolor washes'],
        correct_option: 0,
        explanation_vi: 'Đoạn 2 nêu: "masters like Titian, Rembrandt, and Caravaggio pushed the medium further, utilizing... intense chiaroscuro".'
      }
    ]
  },
  {
    topic_id: 1,
    title: 'Impressionism: Capturing Fleeting Light',
    title_vi: 'Trường Phái Ấn Tượng: Bắt Trọn Ánh Sáng Phù Du',
    content: `In late nineteenth-century Paris, a bold group of painters revolted against the rigid rules of the official French Academy. Instead of painting historical battles and mythological allegories inside dimly lit studios, Claude Monet, Pierre-Auguste Renoir, Camille Pissarro, and Edgar Degas took their easels outdoors (en plein air) to capture everyday modern life.

The invention of premixed paint in portable metal tubes in 1841 made outdoor painting immensely practical. Impressionists worked quickly with visible, unblended brushstrokes and bright pigments to convey the shifting atmosphere and changing qualities of natural daylight. While art critics initially ridiculed their spontaneous work as mere "unfinished sketches," Impressionism quickly sparked a profound revolution that paved the way for modern abstract art.`,
    content_vi: `Vào cuối thế kỷ 19 tại Paris, một nhóm họa sĩ táo bạo đã nổi dậy chống lại những quy tắc cứng nhắc của Viện Hàn lâm Pháp. Thay vì vẽ những trận chiến lịch sử hay thần thoại ngụ ngôn bên trong các xưởng vẽ thiếu sáng, Claude Monet, Pierre-Auguste Renoir, Camille Pissarro và Edgar Degas đã mang giá vẽ ra ngoài trời (en plein air) để nắm bắt nhịp sống thường nhật hiện đại.

Việc phát minh ra tuýp sơn kim loại tiện lợi vào năm 1841 đã khiến việc vẽ tranh ngoài trời trở nên khả thi hơn bao giờ hết. Các họa sĩ trường phái Ấn tượng vẽ nhanh với những vệt cọ lộ rõ, không pha trộn kỹ và các hạt màu tươi sáng để truyền tải bầu không khí biến chuyển cùng đặc tính thay đổi của ánh sáng tự nhiên. Dù ban đầu bị các nhà phê bình chế giễu là những "bản phác thảo chưa hoàn thiện", trường phái Ấn tượng đã nhanh chóng tạo nên một cuộc cách mạng sâu sắc, mở đường cho nghệ thuật trừu tượng hiện đại.`,
    difficulty: 'medium',
    word_count: 140,
    estimated_time_minutes: 4,
    questions: [
      {
        question_text: 'What French term refers to the practice of painting outdoors?',
        question_text_vi: 'Thuật ngữ tiếng Pháp nào dùng để chỉ việc vẽ tranh ngoài trời?',
        options: ['En plein air', 'Trompe l\'oeil', 'Chiaroscuro', 'Haute couture'],
        correct_option: 0,
        explanation_vi: 'Đoạn 1 nêu: "took their easels outdoors (en plein air) to capture everyday modern life".'
      },
      {
        question_text: 'What nineteenth-century invention greatly facilitated painting in the open air?',
        question_text_vi: 'Phát minh nào vào thế kỷ 19 đã hỗ trợ đắc lực cho việc vẽ ngoài trời?',
        options: ['Digital cameras', 'Portable metal paint tubes', 'Synthetic acrylic polymer', 'Electric spotlights'],
        correct_option: 1,
        explanation_vi: 'Đoạn 2 nêu: "The invention of premixed paint in portable metal tubes in 1841 made outdoor painting immensely practical".'
      },
      {
        question_text: 'How did conservative art critics initially react to Impressionist paintings?',
        question_text_vi: 'Các nhà phê bình nghệ thuật ban đầu phản ứng như thế nào với tranh Ấn tượng?',
        options: [
          'They universally praised their classical elegance',
          'They mocked them as incomplete and crude sketches',
          'They banned all members from purchasing canvases',
          'They purchased all pieces for royal collections'
        ],
        correct_option: 1,
        explanation_vi: 'Đoạn 2 nêu: "art critics initially ridiculed their spontaneous work as mere \'unfinished sketches\'".'
      },
      {
        question_text: 'What was the primary visual focus of the Impressionist style?',
        question_text_vi: 'Mục tiêu thị giác trọng tâm của phong cách Ấn tượng là gì?',
        options: [
          'Detailed mathematical perspectives',
          'Capturing changing light and natural atmospheric conditions',
          'Religious symbols and saints',
          'Perfect geometric line drawings'
        ],
        correct_option: 1,
        explanation_vi: 'Bài đọc nêu trọng tâm là "convey the shifting atmosphere and changing qualities of natural daylight".'
      }
    ]
  },
  {
    topic_id: 1,
    title: 'Fresco and Mural: Painting on Monumental Walls',
    title_vi: 'Bích Họa Và Tranh Tường: Hội Họa Trên Những Vách Đá Đồ Sộ',
    content: `Murals are among the oldest forms of human artistic expression, stretching back tens of thousands of years to prehistoric cave paintings in Lascaux and Altamira. Among monumental wall painting methods, the fresco technique represents the pinnacle of craftsmanship. True fresco (buon fresco) requires applying water-based pigments directly onto fresh, wet lime plaster.

As the plaster dries and reacts with carbon dioxide in the air, a chemical process converts the lime into calcium carbonate, permanently binding the pigment into the wall itself. This makes buon fresco extraordinarily durable over centuries. However, the technique demands extreme speed and confidence: artists can only paint on the plaster section that has been prepared for that single day (called a giornata). Any mistake cannot simply be wiped away; the dry plaster must be chipped off completely and replastered.`,
    content_vi: `Tranh tường là một trong những hình thức biểu đạt nghệ thuật lâu đời nhất của nhân loại, có nguồn gốc từ hàng chục nghìn năm trước tại các bức vẽ hang động tiền sử ở Lascaux và Altamira. Trong số các phương pháp vẽ tường đồ sộ, kỹ thuật fresco đại diện cho đỉnh cao của kỹ nghệ tay nghề. Kỹ thuật fresco chuẩn (buon fresco) đòi hỏi quét bột màu pha nước trực tiếp lên lớp vữa vôi còn tươi và ướt.

Khi vữa khô và phản ứng với carbon dioxide trong không khí, phản ứng hóa học chuyển vôi thành canxi cacbonat, gắn kết vĩnh viễn hạt màu vào chính cấu trúc của bức tường. Điều này giúp tranh buon fresco bền vững phi thường qua nhiều thế kỷ. Tuy nhiên, kỹ thuật này đòi hỏi tốc độ và sự quyết đoán tuyệt đối: họa sĩ chỉ có thể vẽ trên diện tích vữa được trát cho ngày hôm đó (gọi là giornata). Mọi sai sót đều không thể xóa đi dễ dàng; lớp vữa khô buộc phải bị đục bỏ hoàn toàn và trát lại từ đầu.`,
    difficulty: 'hard',
    word_count: 155,
    estimated_time_minutes: 5,
    questions: [
      {
        question_text: 'What is the surface requirement for "buon fresco" (true fresco)?',
        question_text_vi: 'Yêu cầu bề mặt của kỹ thuật "buon fresco" là gì?',
        options: [
          'Stretched cotton canvas with oil primer',
          'Wet, freshly laid lime plaster',
          'Dry wooden panel treated with beeswax',
          'Sandblasted tempered glass'
        ],
        correct_option: 1,
        explanation_vi: 'Đoạn 1 nêu: "True fresco (buon fresco) requires applying water-based pigments directly onto fresh, wet lime plaster".'
      },
      {
        question_text: 'What chemical compound forms to permanently bind fresco pigments into the plaster?',
        question_text_vi: 'Hợp chất hóa học nào được hình thành để gắn kết vĩnh viễn hạt màu vào lớp vữa?',
        options: ['Calcium carbonate', 'Sodium chloride', 'Ferric oxide', 'Polyvinyl acetate'],
        correct_option: 0,
        explanation_vi: 'Đoạn 2 nêu: "converts the lime into calcium carbonate, permanently binding the pigment".'
      },
      {
        question_text: 'What Italian term describes the patch of fresh plaster an artist can paint in one working day?',
        question_text_vi: 'Thuật ngữ tiếng Ý nào mô tả mảng vữa tươi một họa sĩ có thể vẽ trong một ngày làm việc?',
        options: ['Chiaroscuro', 'Giornata', 'Triptych', 'Sfumato'],
        correct_option: 1,
        explanation_vi: 'Đoạn 2 viết: "prepared for that single day (called a giornata)".'
      },
      {
        question_text: 'What must an artist do if a serious error occurs while painting a buon fresco?',
        question_text_vi: 'Họa sĩ phải làm gì nếu xảy ra sai sót nghiêm trọng khi đang vẽ buon fresco?',
        options: [
          'Wash the mistake off with solvent liquid',
          'Chip off the plaster completely and reapply fresh mortar',
          'Cover the area with thick adhesive tape',
          'Use an eraser made of vulcanized rubber'
        ],
        correct_option: 1,
        explanation_vi: 'Đoạn 2 nêu: "the dry plaster must be chipped off completely and replastered".'
      }
    ]
  },

  // --- TOPIC 2: Fine Arts & Crafts Professions (Ngành nghề mỹ nghệ) ---
  {
    topic_id: 2,
    title: 'The Ancient Art of Ceramics and Pottery',
    title_vi: 'Nghệ Thuật Cổ Truyền Của Gốm Sứ Và Nghề Làm Gốm',
    content: `Ceramics and pottery represent humanity’s enduring relationship with earth and fire. Archaeological discoveries confirm that humans have molded earthen clay into functional and ornamental vessels since the Neolithic era. In East Asia, the mastery of high-temperature porcelain firing led to delicate celadon and blue-and-white porcelain that became prized luxury goods traded across continents.

The process of pottery involves several distinct stages. First, the potter wedges raw clay to remove trapped air bubbles. The clay is then centered on a spinning potter\'s wheel and thrown into symmetrical shapes like bowls, vases, and teapots. After air-drying to a "leather-hard" state, decorative carvings may be added before the piece undergoes bisque firing. Finally, liquid mineral glazes are brushed or dipped onto the piece before a final high-temperature kiln firing creates a glassy, waterproof finish.`,
    content_vi: `Gốm sứ đại diện cho mối liên hệ bền bỉ của con người với đất và lửa. Các khám phá khảo cổ khẳng định con người đã nặn đất sét thành các vật dụng chức năng và trang trí từ thời kỳ đồ đá mới. Tại Đông Á, việc làm chủ nhiệt độ cao trong nung sứ đã tạo ra đồ sứ men ngọc (celadon) và đồ gốm hoa lam tinh tế, trở thành hàng hóa xa xỉ được giao thương khắp các châu lục.

Quy trình làm gốm gồm nhiều công đoạn riêng biệt. Đầu tiên, nghệ nhân nhào đập đất sét để loại bỏ bọt khí. Đất sau đó được định tâm trên bàn xoay và tạo hình thành các dáng đối xứng như bát, bình hoa hay ấm trà. Sau khi để khô tự nhiên đến trạng thái cứng vừa (leather-hard), các chi tiết khắc chạm có thể được thêm vào trước khi đem nung mộc (bisque firing). Cuối cùng, lớp men khoáng lỏng được quét hoặc nhúng trước khi lần nung lò nhiệt cao cuối cùng tạo nên bề mặt phủ bóng như thủy tinh và chống thấm nước.`,
    difficulty: 'easy',
    word_count: 145,
    estimated_time_minutes: 3,
    questions: [
      {
        question_text: 'Why does a potter wedge clay before shaping it on the wheel?',
        question_text_vi: 'Tại sao thợ gốm phải nhào đập đất sét trước khi tạo hình trên bàn xoay?',
        options: [
          'To remove trapped air bubbles that could crack the piece in the kiln',
          'To change its color from brown to dark blue',
          'To cool the clay to freezing temperatures',
          'To make it adhere permanently to metal tools'
        ],
        correct_option: 0,
        explanation_vi: 'Đoạn 2 viết: "First, the potter wedges raw clay to remove trapped air bubbles".'
      },
      {
        question_text: 'What historical Asian ceramic styles are highlighted in the passage?',
        question_text_vi: 'Những dòng gốm châu Á lịch sử nào được làm nổi bật trong bài đọc?',
        options: [
          'Celadon and blue-and-white porcelain',
          'Plastic resin molds',
          'Stained cathedral glass',
          'Cast bronze kettles'
        ],
        correct_option: 0,
        explanation_vi: 'Đoạn 1 nêu: "delicate celadon and blue-and-white porcelain that became prized luxury goods".'
      },
      {
        question_text: 'What gives ceramic pottery its shiny, waterproof outer coating?',
        question_text_vi: 'Yếu tố nào mang lại cho đồ gốm lớp phủ ngoài bóng đẹp và chống thấm nước?',
        options: ['Linseed oil paint', 'Varnish polish', 'Mineral glaze fired at high temperature', 'Beeswax paste'],
        correct_option: 2,
        explanation_vi: 'Đoạn 2 giải thích: "mineral glazes are brushed or dipped onto the piece before a final high-temperature kiln firing creates a glassy, waterproof finish".'
      },
      {
        question_text: 'What is the preliminary firing stage called before glazing?',
        question_text_vi: 'Giai đoạn nung sơ bộ trước khi tráng men được gọi là gì?',
        options: ['Bisque firing', 'Tempera glaze', 'Gilding', 'Annealing'],
        correct_option: 0,
        explanation_vi: 'Đoạn 2 nhắc đến: "before the piece undergoes bisque firing".'
      }
    ]
  },
  {
    topic_id: 2,
    title: 'Vietnamese Lacquerware: Mastery of Natural Resin',
    title_vi: 'Sơn Mài Việt Nam: Đỉnh Cao Kỹ Nghệ Nhựa Cây Tự Nhiên',
    content: `Vietnamese lacquerware (sơn mài) is an extraordinary craft that bridges traditional decorative art and modern fine painting. The primary ingredient is harvested from the sap of the lacquer tree (Toxicodendron succedaneum), cultivated mainly in the hills of Phu Tho province. When applied to wooden panels, the natural resin reacts with moisture in the air to form an impenetrable, lustrous coat.

Unlike standard painting where pigment is merely applied to a surface, traditional sơn mài involves an intensive additive and subtractive process. Artisans inlay iridescent mother-of-pearl, crushed eggshells, gold foil, and silver dust into wet layers of lacquer. Once numerous coats have cured in humid drying chambers, the artwork is submerged in water and repeatedly polished with sandpaper and fine charcoal. Through this sanding, hidden luminous layers emerge, revealing hypnotic depth and glowing warmth.`,
    content_vi: `Nghệ thuật sơn mài Việt Nam là một ngành thủ công mỹ nghệ phi thường kết nối giữa nghệ thuật trang trí truyền thống và hội họa hàn lâm hiện đại. Thành phần chính được thu hoạch từ nhựa cây sơn (Toxicodendron succedaneum), chủ yếu trồng tại vùng đồi tỉnh Phú Thọ. Khi quét lên các tấm ván gỗ, nhựa tự nhiên phản ứng với độ ẩm không khí tạo thành một lớp phủ bóng bẩy, bền chắc không thể xuyên thủng.

Không giống như hội họa thông thường nơi màu vẽ chỉ đơn giản được quét lên bề mặt, sơn mài truyền thống bao gồm một quy trình bồi đắp và mài giũa công phu. Các nghệ nhân cẩn khảm vỏ ốc xà cừ óng ánh, vỏ trứng nghiền, lá vàng quỳ và bột bạc vào các lớp sơn ướt. Sau khi nhiều lớp sơn khô trong buồng ủ ẩm, tác phẩm được dìm xuống nước và mài đi mài lại nhiều lần bằng giấy ráp và than củi mịn. Thông qua công đoạn mài này, những tầng lớp lấp lánh ẩn sâu dần lộ diện, mang lại chiều sâu huyền ảo và vẻ đẹp ấm áp diệu kỳ.`,
    difficulty: 'medium',
    word_count: 150,
    estimated_time_minutes: 4,
    questions: [
      {
        question_text: 'Where is the natural resin for traditional Vietnamese lacquer harvested from?',
        question_text_vi: 'Nhựa tự nhiên cho sơn mài truyền thống Việt Nam được thu hoạch từ đâu?',
        options: [
          'Petroleum chemical refineries',
          'Sap of the native lacquer tree grown in Phu Tho',
          'Pine tree resin imported from Europe',
          'Beeswax combs'
        ],
        correct_option: 1,
        explanation_vi: 'Đoạn 1 nêu: "harvested from the sap of the lacquer tree... cultivated mainly in the hills of Phu Tho province".'
      },
      {
        question_text: 'Which inlay materials are traditionally embedded into the lacquer layers?',
        question_text_vi: 'Những vật liệu cẩn khảm nào được đưa vào các lớp sơn mài theo truyền thống?',
        options: [
          'Crushed eggshells, mother-of-pearl, gold foil, and silver dust',
          'Plastic beads and synthetic glitter',
          'Lead weights and crushed glass',
          'Dry sand and acrylic yarn'
        ],
        correct_option: 0,
        explanation_vi: 'Đoạn 2 nêu: "Artisans inlay iridescent mother-of-pearl, crushed eggshells, gold foil, and silver dust".'
      },
      {
        question_text: 'How do hidden colors and textures reveal themselves in a finished lacquer painting?',
        question_text_vi: 'Làm thế nào để các tầng màu sắc và hoa văn ẩn sâu hiện lên trong một bức tranh sơn mài hoàn chỉnh?',
        options: [
          'By exposing the painting to strong direct sunlight',
          'Through submerging the piece in water and polishing it with sandpaper and fine charcoal',
          'By burning off the top coat with an open torch flame',
          'By applying chemical bleaching agents'
        ],
        correct_option: 1,
        explanation_vi: 'Đoạn 2 nêu: "submerged in water and repeatedly polished with sandpaper and fine charcoal. Through this sanding, hidden luminous layers emerge".'
      },
      {
        question_text: 'What environmental condition is necessary for natural lacquer resin to properly cure?',
        question_text_vi: 'Điều kiện môi trường nào là cần thiết để nhựa sơn mài tự nhiên đóng rắn đạt chuẩn?',
        options: ['Completely dry desert air', 'High humidity and moisture', 'Sub-zero freezing temperatures', 'Direct ultraviolet rays'],
        correct_option: 1,
        explanation_vi: 'Đoạn 1 và 2 đều nêu: "reacts with moisture in the air... cured in humid drying chambers".'
      }
    ]
  },
  {
    topic_id: 2,
    title: 'Preserving Cultural Heritage Through Artisan Crafts',
    title_vi: 'Gìn Giữ Di Sản Văn Hóa Qua Bàn Tay Nghệ Nhân Thủ Công',
    content: `Across the world, artisanal crafts such as woodcarving, handloom weaving, calligraphy, and silversmithing carry centuries of intangible cultural heritage. Unlike automated mass production, handcrafted objects embody the intimate identity of their creators, reflecting community folklore, sustainable natural materials, and deeply honed manual techniques.

However, the rapid spread of industrial manufacturing poses significant challenges for traditional artisans. Younger generations frequently migrate to urban centers in search of tech careers, leaving craft guilds with aging masters and dwindling apprenticeships. To survive and flourish in the modern era, craft communities are adopting creative strategies: fusing time-tested techniques with contemporary designs, leveraging digital e-commerce platforms, and partnering with cultural tourism initiatives. Protecting these master artisans preserves not only exquisite objects, but the living memory of human civilization.`,
    content_vi: `Trên khắp thế giới, các ngành nghề thủ công mỹ nghệ như điêu khắc gỗ, dệt thổ cẩm, nghệ thuật thư pháp và chạm bạc mang trong mình hàng thế kỷ di sản văn hóa phi vật thể. Khác với dây chuyền sản xuất hàng loạt tự động, mỗi sản phẩm thủ công chứa đựng bản sắc sâu sắc của người sáng tạo, phản ánh văn hóa dân gian cộng đồng, nguồn nguyên liệu tự nhiên bền vững và kỹ thuật đôi tay điêu luyện.

Tuy nhiên, sự bùng nổ của sản xuất công nghiệp đang đặt ra những thách thức không nhỏ cho các nghệ nhân truyền thống. Thế hệ trẻ thường di cư ra đô thị lớn tìm kiếm công việc công nghệ, khiến các phường nghề chỉ còn lại những nghệ nhân cao tuổi và số lượng học việc ngày một ít ỏi. Để tồn tại và hưng thịnh trong kỷ nguyên mới, các làng nghề đang áp dụng những chiến lược sáng tạo: kết hợp kỹ thuật truyền thống với thiết kế đương đại, tận dụng sàn thương mại điện tử và kết hợp du lịch trải nghiệm văn hóa. Bảo vệ những nghệ nhân bậc thầy không chỉ là gìn giữ những hiện vật tuyệt mỹ, mà còn là bảo tồn ký ức sống của nền văn minh nhân loại.`,
    difficulty: 'hard',
    word_count: 155,
    estimated_time_minutes: 5,
    questions: [
      {
        question_text: 'What makes handcrafted artisan objects fundamentally different from mass-manufactured goods?',
        question_text_vi: 'Điều gì khiến sản phẩm thủ công mỹ nghệ khác biệt căn bản với đồ sản xuất hàng loạt?',
        options: [
          'They are made entirely by automated robotics',
          'They carry unique cultural identity, sustainable materials, and honed personal technique',
          'They can only be purchased with barter goods',
          'They decompose completely within one year'
        ],
        correct_option: 1,
        explanation_vi: 'Đoạn 1 nêu: "handcrafted objects embody the intimate identity of their creators, reflecting community folklore, sustainable natural materials, and deeply honed manual techniques".'
      },
      {
        question_text: 'What major challenge threatens the continuation of traditional craft guilds?',
        question_text_vi: 'Thách thức lớn nào đe dọa sự tiếp nối của các phường nghề thủ công truyền thống?',
        options: [
          'A total global shortage of wood and clay',
          'Youth migration to cities and a lack of apprentice successors',
          'Governments outlawing the use of manual tools',
          'Museums refusing to display handmade crafts'
        ],
        correct_option: 1,
        explanation_vi: 'Đoạn 2 nêu: "Younger generations frequently migrate to urban centers... leaving craft guilds with aging masters and dwindling apprenticeships".'
      },
      {
        question_text: 'Which innovative approaches are modern craft communities using to thrive?',
        question_text_vi: 'Những cách tiếp cận đổi mới nào đang được các làng nghề áp dụng để phát triển?',
        options: [
          'Lowering quality standards and using toxic plastics',
          'Blending heritage craftsmanship with modern design, e-commerce, and cultural tourism',
          'Abandoning their workshops to work in factories',
          'Stopping all international sales'
        ],
        correct_option: 1,
        explanation_vi: 'Đoạn 2 nêu: "fusing time-tested techniques with contemporary designs, leveraging digital e-commerce platforms, and partnering with cultural tourism initiatives".'
      },
      {
        question_text: 'According to the author, why is safeguarding master artisans critical?',
        question_text_vi: 'Theo tác giả, vì sao việc bảo vệ các nghệ nhân bậc thầy lại mang tính sống còn?',
        options: [
          'It preserves the living cultural memory and heritage of human civilization',
          'It guarantees stock market stability',
          'It replaces the need for higher education',
          'It forces everyone to use handwoven clothing'
        ],
        correct_option: 0,
        explanation_vi: 'Câu kết bài: "Protecting these master artisans preserves not only exquisite objects, but the living memory of human civilization".'
      }
    ]
  }
];

module.exports = {
  readingsData
};
