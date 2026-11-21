"""
Domain-specific visual prompts for the 60 Fine Arts & Crafts vocabulary labels
plus Out-of-Domain (OOD) negative anchors to reject off-topic images accurately.
"""

CLASS_VISUAL_HINTS = {
    # Topic 1: Types of Paintings & Drawing Techniques
    "oil painting": [
        "an oil painting on canvas with rich impasto texture and oil pigments",
        "a classic Renaissance or Baroque oil painting artwork",
        "oil paint artwork with deep colors and visible canvas brushwork",
    ],
    "watercolor": [
        "a watercolor painting on textured paper with translucent washes and bleeding pigments",
        "a delicate aquarelle watercolor artwork with soft wet-on-wet layers",
        "watercolor illustration showing light translucent pigment on white paper",
    ],
    "acrylic painting": [
        "a vibrant modern acrylic painting on canvas with bold opaque colors",
        "contemporary acrylic paint artwork with crisp matte or satin edges",
        "bright colorful acrylic painting on stretched canvas",
    ],
    "fresco": [
        "a classical fresco mural painted on wet lime plaster church wall or ceiling",
        "Renaissance buen fresco wall painting on architectural plaster",
        "ancient plaster wall fresco artwork with mineral pigments",
    ],
    "portrait": [
        "a painted artistic portrait depicting a person's face and expression",
        "a classic portrait painting of a sitter in fine art style",
        "painted portrait artwork focusing on head and shoulders",
    ],
    "landscape": [
        "a painted landscape artwork showing mountains, trees, fields, or sky",
        "a fine art landscape painting of countryside scenery",
        "oil or watercolor landscape painting of nature scenery, not a photograph",
    ],
    "still life": [
        "a still life painting of fruit, flowers, vases, and bowls arranged on a table",
        "classical Dutch still life artwork depicting inanimate tabletop objects",
        "painted still life composition of bottles, fruit, and tableware",
    ],
    "abstract art": [
        "an abstract painting with non-representational geometric shapes, lines, and colors",
        "modern abstract art canvas without recognizable figures or objects",
        "colorful non-figurative abstract composition artwork",
    ],
    "impressionism": [
        "an impressionist painting with short broken brushstrokes capturing outdoor sunlight",
        "19th-century French impressionism painting in the style of Monet or Renoir",
        "impressionist artwork with shimmering light and pastel dappled color strokes",
    ],
    "surrealism": [
        "a surrealist painting with dreamlike, bizarre, impossible, or subconscious imagery",
        "surrealism fine art painting in the style of Dali or Magritte",
        "dreamlike surrealist artwork combining strange symbolic objects",
    ],
    "cubism": [
        "a cubist painting fragmenting subjects into geometric facets and multiple viewpoints",
        "early 20th-century cubism artwork in the style of Picasso or Braque",
        "angular geometric fractured planes in a cubist painting",
    ],
    "canvas": [
        "a blank stretched cotton or linen painting canvas mounted on a wooden frame",
        "an empty white artist canvas prepared with gesso for painting",
        "stretched artist canvas texture on wooden stretcher bars",
    ],
    "easel": [
        "a wooden artist tripod easel standing in an art studio holding a canvas",
        "an A-frame or H-frame wooden painting easel",
        "studio painting easel supporting a painting",
    ],
    "palette": [
        "a wooden or plastic artist paint palette covered with dabs of mixed oil or acrylic paint",
        "painter's oval thumb-hole mixing palette with colorful paint blobs",
        "close-up of an artist mixing colors on a paint palette",
    ],
    "brushstroke": [
        "extreme close-up macro view of thick textured brushstrokes of paint on canvas",
        "expressive impasto paint ridges and visible paintbrush strokes",
        "detailed texture of heavy swirling brushstrokes on a painted surface",
    ],
    "sketch": [
        "a rough pencil or ink sketch drawing on paper with loose gesture lines",
        "an unfinished artist study sketch with graphite hatching lines",
        "hand-drawn line sketch study on sketchbook paper",
    ],
    "mural": [
        "a large-scale outdoor or indoor mural painting covering an entire building wall",
        "monumental street art or architectural wall mural painting",
        "giant colorful mural painted directly onto a public wall",
    ],
    "gouache": [
        "a gouache painting with flat opaque matte watercolor pigment layers",
        "illustration painted in opaque matte gouache paint on paper",
        "dense flat matte color fields characteristic of gouache paint",
    ],
    "tempera": [
        "a medieval or early Renaissance egg tempera painting on wooden panel with gold leaf",
        "traditional tempera religious icon or panel painting with crisp linear detail",
        "egg tempera artwork on gessoed wood panel",
    ],
    "minimalism": [
        "a minimalist artwork with ultra-simple monochromatic rectangles, grids, or clean lines",
        "minimalism abstract painting using very few colors and pure geometric order",
        "stark contemporary minimalist art composition",
    ],
    "expressionism": [
        "an expressionist painting with distorted forms, raw emotional intensity, and bold clashing colors",
        "German expressionism artwork with dramatic jagged brushwork and angst",
        "emotionally charged expressionist painting",
    ],
    "realism": [
        "a 19th-century realism painting depicting ordinary people and rural labor faithfully",
        "realist fine art painting portraying everyday life without idealization",
        "academic realism oil painting with lifelike proportion and natural light",
    ],
    "miniature": [
        "an intricate Persian, Mughal, or medieval illuminated miniature painting with tiny fine details",
        "traditional miniature book illustration with ornate borders and flat perspective",
        "highly detailed small-scale miniature manuscript painting",
    ],
    "self-portrait": [
        "a painted self-portrait where the artist depicts themselves, often holding a brush or palette",
        "famous artist self-portrait painting looking straight at the viewer",
        "self-portrait artwork by a painter depicting their own likeness",
    ],
    "seascape": [
        "a seascape painting of ocean waves, stormy sea, sailing ships, or coastal cliffs",
        "maritime painting depicting crashing waves and dramatic sea horizon",
        "fine art painting of the sea and ships, not a normal photograph",
    ],
    "cityscape": [
        "a cityscape painting depicting urban streets, buildings, bridges, and city skyline",
        "fine art painting of a town or city street scene",
        "painted urban landscape showing architecture and street life",
    ],
    "chiaroscuro": [
        "a dramatic Baroque painting with intense chiaroscuro contrast between bright light and deep shadow",
        "Caravaggio-style chiaroscuro painting illuminated from one sharp light source in darkness",
        "fine art painting showcasing strong light-and-shadow chiaroscuro modeling",
    ],
    "charcoal": [
        "a black-and-white charcoal drawing on paper with deep velvety blacks and smudged shading",
        "expressive vine or compressed charcoal sketch with soft tonal gradients",
        "monochrome charcoal artwork on textured drawing paper",
    ],
    "pastel": [
        "a soft pastel chalk drawing on paper with powdery velvety color strokes",
        "pastel painting with luminous dry chalk pigment texture",
        "artwork drawn with dry pastel sticks on toned paper",
    ],
    "triptych": [
        "a three-panelled triptych painting consisting of a central panel and two side wings",
        "hinged altarpiece triptych artwork divided into three vertical sections",
        "three-part triptych painting displayed side by side",
    ],

    # Topic 2: Fine Arts & Crafts Professions & Traditional Crafts
    "ceramics": [
        "glazed porcelain or stoneware ceramics vessels, bowls, and decorative ceramic vases",
        "finished high-fired ceramic pottery pieces with shiny glaze",
        "fine art ceramics exhibition of glazed porcelain vases",
    ],
    "pottery": [
        "earthenware clay pottery vessels, rustic terracotta pots, or clay jars on a pottery wheel",
        "hand-thrown unglazed or rustic clay pottery bowls and amphora",
        "traditional handmade clay pottery craft",
    ],
    "lacquerware": [
        "glossy black, red, and gold-inlaid Vietnamese or East Asian lacquerware box, tray, or painting",
        "polished traditional urushi or son mai lacquerware craft inlaid with eggshell or mother-of-pearl",
        "shiny carved or gilded lacquerware decorative object",
    ],
    "embroidery": [
        "hand-stitched silk or cotton embroidery needlework with floral thread patterns on fabric",
        "traditional hand embroidery hoop or embroidered silk tapestry art",
        "close-up of intricate colorful embroidery stitches on cloth",
    ],
    "woodcarving": [
        "intricately carved wooden relief sculpture, ornate woodcarving panel, or carved timber statue",
        "traditional hand-carved woodcraft with chiselled relief motifs",
        "decorative carved wood artwork showing wood grain and chisel detail",
    ],
    "calligraphy": [
        "traditional brush ink calligraphy characters written gracefully on rice paper or parchment",
        "artistic calligraphy lettering with ink brush or nib pen",
        "East Asian or Western ornamental calligraphy scroll artwork",
    ],
    "sculpture": [
        "a three-dimensional marble, bronze, or stone fine art sculpture statue",
        "museum sculpture artwork carved in stone or cast in bronze",
        "standing 3D figurative or abstract sculpture piece",
    ],
    "weaving": [
        "a traditional wooden handloom weaving colorful brocade or silk textile threads",
        "woven patterned fabric on a loom showing warp and weft threads",
        "close-up of handwoven textile weaving craft",
    ],
    "glassblowing": [
        "an artisan blowing molten glowing glass on a blowpipe in a hot glass studio",
        "molten orange glass being shaped at a glassblowing furnace",
        "handblown glassblowing craft in progress",
    ],
    "silversmithing": [
        "ornate handcrafted silver teapot, tray, filigree silverwork, or chased silverware",
        "intricately hammered and engraved artisan silver vessel",
        "traditional silversmithing metalwork object in shiny sterling silver",
    ],
    "jewelry design": [
        "handcrafted fine art jewelry, gemstone ring, gold brooch, or ornate necklace",
        "artisan designed precious metal and gemstone jewelry piece",
        "intricate goldsmith jewelry design with stones and filigree",
    ],
    "leathercraft": [
        "hand-stitched leather bag, wallet, belt, or tooled leather craft with awl and wax thread",
        "artisan leatherworking tools and vegetable-tanned stitched leather goods",
        "craft of hand-sewing and embossing leather items",
    ],
    "quilting": [
        "a colorful patchwork quilt blanket stitched from geometric fabric scraps",
        "hand-stitched quilted textile wall hanging with patterned patchwork blocks",
        "traditional patchwork quilting craft with visible quilting stitches",
    ],
    "printmaking": [
        "woodblock print, linocut, screenprint, or lithograph printmaking artwork and carved block",
        "traditional woodblock printmaking ukiyo-e or folk print on paper",
        "inked printmaking plate or hand-pulled relief print",
    ],
    "engraving": [
        "detailed copperplate intaglio engraving print or metal plate incised with fine hatched lines",
        "classical fine-line metal engraving print with cross-hatching",
        "artisan engraving metal with a burin graver tool",
    ],
    "mosaic": [
        "a colorful mosaic artwork assembled from thousands of tiny glass, stone, or ceramic tesserae tiles",
        "Byzantine gold mosaic or tiled mosaic mural surface",
        "close-up of patterned mosaic tile craft",
    ],
    "basketry": [
        "handwoven bamboo, rattan, or wicker baskets crafted by traditional basketry",
        "artisan woven cane and bamboo basketwork containers",
        "intricate plaited bamboo basketry craft",
    ],
    "tapestry": [
        "a large woven pictorial wool or silk wall tapestry depicting medieval or floral scenes",
        "ornate handwoven textile tapestry hanging on a wall",
        "historical woven tapestry art with intricate figurative motifs",
    ],
    "gilding": [
        "applying ultra-thin gold leaf sheets onto wood, frame, or statue using gilding craft",
        "ornate gilded gold-leaf frame, altar carving, or gold-leafed surface",
        "craft of gold leaf gilding on decorative art",
    ],
    "stonemasonry": [
        "carved architectural stone blocks, gothic stone gargoyles, or stone mason chiselling granite",
        "traditional stonemasonry stonework and carved stone relief",
        "rough-hewn and dressed stone blocks shaped by stonemasonry",
    ],
    "origami": [
        "folded paper origami crane, animal, or geometric polyhedron made from square paper",
        "Japanese origami paper folding art with crisp creases",
        "intricate folded paper sculpture without cuts",
    ],
    "blacksmithing": [
        "glowing red-hot iron hammered on an anvil with tongs at a blacksmith forge",
        "forged wrought iron gate scrollwork and blacksmithing tools",
        "sparks flying as iron is forged in traditional blacksmithing",
    ],
    "potter": [
        "a potter shaping wet clay on a spinning pottery wheel with muddy hands",
        "ceramic artist person throwing a clay vase on a potter's wheel",
        "craftsperson potter working clay at a wheel in a studio",
    ],
    "sculptor": [
        "a sculptor artist standing beside a statue carving stone or clay with chisel and mallet",
        "portrait of a sculptor working on a clay bust or marble figure in a studio",
        "artist sculptor actively sculpting a three-dimensional figure",
    ],
    "artisan": [
        "a master traditional craftsperson artisan carefully hand-finishing an intricate craft piece in a workshop",
        "skilled heritage artisan working with hand tools on fine decorative craft",
        "elder or master artisan demonstrating traditional handcraft",
    ],
    "craftsman": [
        "a skilled craftsman working at a wooden workbench surrounded by hand planes, chisels, and tools",
        "woodworker or traditional craftsman measuring and shaping materials by hand",
        "workshop craftsman crafting fine handmade goods",
    ],
    "weaver": [
        "a weaver person sitting at a wooden loom passing a shuttle through threads",
        "traditional textile weaver operating a handloom",
        "craftsperson weaver weaving fabric on a loom",
    ],
    "metalsmith": [
        "a metalsmith artisan hammering, soldering, or casting bronze, copper, or brass metalwork",
        "person working sheet metal or molten bronze with hammer and torch in a metal studio",
        "copper or bronze metalsmith shaping metal vessels",
    ],
    "calligrapher": [
        "a calligrapher holding an ink brush or fountain pen writing calligraphy at a desk",
        "person practicing brush calligraphy on paper scroll",
        "artist calligrapher writing decorative ink characters",
    ],
    "restorer": [
        "an art restorer conservator wearing gloves using a magnifier and fine brush to repair an old painting",
        "museum painting conservator cleaning and restoring a damaged historic canvas",
        "art conservation restorer carefully retouching an antique artwork",
    ],
}

# Out-of-domain negative anchors: everyday photos, screenshots, memes, casual objects,
# and natural photographs (which should NOT be confused with landscape/portrait paintings).
OOD_ANCHORS = [
    ("everyday_photo", "a casual smartphone snapshot of food, a meal, a coffee cup, or a restaurant table"),
    ("animal_pet", "a regular photograph of a pet dog, cat, bird, or wild animal"),
    ("vehicle_tech", "a photo of a car, motorcycle, smartphone, laptop, keyboard, or electronic gadget"),
    ("screenshot_ui", "a computer or phone screenshot showing software UI, source code, chat messages, or website"),
    ("document_text", "a photo or scan of a printed book page, invoice, receipt, or spreadsheet"),
    ("selfie_casual", "a casual modern smartphone selfie or group photo of people smiling at camera"),
    ("real_nature_photo", "a real-world DSLR camera photograph of mountains, ocean, or city street, not a painting"),
    ("fashion_product", "an e-commerce product photo of sneakers, t-shirt, or household plastic item on white background"),
    ("diagram_chart", "a business bar chart, flowchart diagram, mathematical graph, or map"),
]

def build_prompts_for_label(item: dict) -> list[str]:
    word = item["word"]
    hints = CLASS_VISUAL_HINTS.get(word, [])
    prompts = list(hints)
    prompts.append(f"a photo representing the fine arts and crafts term '{word}' ({item.get('topic_name', '')})")
    if item.get("image_alt"):
        prompts.append(f"visual artwork of {word}")
    return prompts
