"""
Domain-specific visual prompts for the 36 Fine Arts & Crafts vocabulary labels
plus Out-of-Domain (OOD) negative anchors to reject off-topic images accurately.
"""

CLASS_VISUAL_HINTS = {
    "oil painting": [
        "an oil painting on canvas with rich impasto texture and oil pigments",
        "a classic Renaissance or Baroque oil painting artwork",
        "oil paint artwork with deep colors and visible canvas brushwork"
    ],
    "watercolor": [
        "a watercolor painting on textured paper with translucent washes and bleeding pigments",
        "a delicate aquarelle watercolor artwork with soft wet-on-wet layers",
        "watercolor illustration showing light translucent pigment on white paper"
    ],
    "acrylic painting": [
        "a vibrant modern acrylic painting on canvas with bold opaque colors",
        "contemporary acrylic paint artwork with crisp matte or satin edges",
        "bright colorful acrylic painting on stretched canvas"
    ],
    "fresco": [
        "a classical fresco mural painted on wet lime plaster church wall or ceiling",
        "Renaissance buen fresco wall painting on architectural plaster",
        "ancient plaster wall fresco artwork with mineral pigments"
    ],
    "sketch": [
        "a rough pencil or ink sketch drawing on paper with loose gesture lines",
        "an unfinished artist study sketch with graphite hatching lines",
        "hand-drawn line sketch study on sketchbook paper"
    ],
    "mural": [
        "a large-scale outdoor or indoor mural painting covering an entire building wall",
        "monumental street art or architectural wall mural painting",
        "giant colorful mural painted directly onto a public wall"
    ],
    "gouache": [
        "a gouache painting with flat opaque matte watercolor pigment layers",
        "illustration painted in opaque matte gouache paint on paper",
        "dense flat matte color fields characteristic of gouache paint"
    ],
    "tempera": [
        "a medieval or early Renaissance egg tempera painting on wooden panel with gold leaf",
        "traditional tempera religious icon or panel painting with crisp linear detail",
        "egg tempera artwork on gessoed wood panel"
    ],
    "miniature": [
        "an intricate Persian, Mughal, or medieval illuminated miniature painting with tiny fine details",
        "traditional miniature book illustration with ornate borders and flat perspective",
        "highly detailed small-scale miniature manuscript painting"
    ],
    "chiaroscuro": [
        "a dramatic Baroque painting with intense chiaroscuro contrast between bright light and deep shadow",
        "Caravaggio-style chiaroscuro painting illuminated from one sharp light source in darkness",
        "fine art painting showcasing strong light-and-shadow chiaroscuro modeling"
    ],
    "charcoal": [
        "a black-and-white charcoal drawing on paper with deep velvety blacks and smudged shading",
        "expressive vine or compressed charcoal sketch with soft tonal gradients",
        "monochrome charcoal artwork on textured drawing paper"
    ],
    "pastel": [
        "a soft pastel chalk drawing on paper with powdery velvety color strokes",
        "pastel painting with luminous dry chalk pigment texture",
        "artwork drawn with dry pastel sticks on toned paper"
    ],
    "triptych": [
        "a three-panelled triptych painting consisting of a central panel and two side wings",
        "hinged altarpiece triptych artwork divided into three vertical sections",
        "three-part triptych painting displayed side by side"
    ],
    "ceramics": [
        "glazed porcelain or stoneware ceramics vessels, bowls, and decorative ceramic vases",
        "finished high-fired ceramic pottery pieces with shiny glaze",
        "fine art ceramics exhibition of glazed porcelain vases"
    ],
    "pottery": [
        "earthenware clay pottery vessels, rustic terracotta pots, or clay jars on a pottery wheel",
        "hand-thrown unglazed or rustic clay pottery bowls and amphora",
        "traditional handmade clay pottery craft"
    ],
    "lacquerware": [
        "glossy black, red, and gold-inlaid Vietnamese or East Asian lacquerware box, tray, or painting",
        "polished traditional urushi or son mai lacquerware craft inlaid with eggshell or mother-of-pearl",
        "shiny carved or gilded lacquerware decorative object"
    ],
    "embroidery": [
        "hand-stitched silk or cotton embroidery needlework with floral thread patterns on fabric",
        "traditional hand embroidery hoop or embroidered silk tapestry art",
        "close-up of intricate colorful embroidery stitches on cloth"
    ],
    "woodcarving": [
        "intricately carved wooden relief sculpture, ornate woodcarving panel, or carved timber statue",
        "traditional hand-carved woodcraft with chiselled relief motifs",
        "decorative carved wood artwork showing wood grain and chisel detail"
    ],
    "calligraphy": [
        "traditional brush ink calligraphy characters written gracefully on rice paper or parchment",
        "artistic calligraphy lettering with ink brush or nib pen",
        "East Asian or Western ornamental calligraphy scroll artwork"
    ],
    "sculpture": [
        "a three-dimensional marble, bronze, or stone fine art sculpture statue",
        "museum sculpture artwork carved in stone or cast in bronze",
        "standing 3D figurative or abstract sculpture piece"
    ],
    "weaving": [
        "a traditional wooden handloom weaving colorful brocade or silk textile threads",
        "woven patterned fabric on a loom showing warp and weft threads",
        "close-up of handwoven textile weaving craft"
    ],
    "glassblowing": [
        "an artisan blowing molten glowing glass on a blowpipe in a hot glass studio",
        "molten orange glass being shaped at a glassblowing furnace",
        "handblown glassblowing craft in progress"
    ],
    "silversmithing": [
        "ornate handcrafted silver teapot, tray, filigree silverwork, or chased silverware",
        "intricately hammered and engraved artisan silver vessel",
        "traditional silversmithing metalwork object in shiny sterling silver"
    ],
    "jewelry design": [
        "handcrafted fine art jewelry, gemstone ring, gold brooch, or ornate necklace",
        "artisan designed precious metal and gemstone jewelry piece",
        "intricate goldsmith jewelry design with stones and filigree"
    ],
    "leathercraft": [
        "hand-stitched leather bag, wallet, belt, or tooled leather craft with awl and wax thread",
        "artisan leatherworking tools and vegetable-tanned stitched leather goods",
        "craft of hand-sewing and embossing leather items"
    ],
    "quilting": [
        "a colorful patchwork quilt blanket stitched from geometric fabric scraps",
        "hand-stitched quilted textile wall hanging with patterned patchwork blocks",
        "traditional patchwork quilting craft with visible quilting stitches"
    ],
    "printmaking": [
        "woodblock print, linocut, screenprint, or lithograph printmaking artwork and carved block",
        "traditional woodblock printmaking ukiyo-e or folk print on paper",
        "inked printmaking plate or hand-pulled relief print"
    ],
    "engraving": [
        "detailed copperplate intaglio engraving print or metal plate incised with fine hatched lines",
        "classical fine-line metal engraving print with cross-hatching",
        "artisan engraving metal with a burin graver tool"
    ],
    "mosaic": [
        "a colorful mosaic artwork assembled from thousands of tiny glass, stone, or ceramic tesserae tiles",
        "Byzantine gold mosaic or tiled mosaic mural surface",
        "close-up of patterned mosaic tile craft"
    ],
    "basketry": [
        "handwoven bamboo, rattan, or wicker baskets crafted by traditional basketry",
        "artisan woven cane and bamboo basketwork containers",
        "intricate plaited bamboo basketry craft"
    ],
    "tapestry": [
        "a large woven pictorial wool or silk wall tapestry depicting medieval or floral scenes",
        "ornate handwoven textile tapestry hanging on a wall",
        "historical woven tapestry art with intricate figurative motifs"
    ],
    "gilding": [
        "applying ultra-thin gold leaf sheets onto wood, frame, or statue using gilding craft",
        "ornate gilded gold-leaf frame, altar carving, or gold-leafed surface",
        "craft of gold leaf gilding on decorative art"
    ],
    "stonemasonry": [
        "carved architectural stone blocks, gothic stone gargoyles, or stone mason chiselling granite",
        "traditional stonemasonry stonework and carved stone relief",
        "rough-hewn and dressed stone blocks shaped by stonemasonry"
    ],
    "origami": [
        "folded paper origami crane, animal, or geometric polyhedron made from square paper",
        "Japanese origami paper folding art with crisp creases",
        "intricate folded paper sculpture without cuts"
    ],
    "blacksmithing": [
        "glowing red-hot iron hammered on an anvil with tongs at a blacksmith forge",
        "forged wrought iron gate scrollwork and blacksmithing tools",
        "sparks flying as iron is forged in traditional blacksmithing"
    ],
    "digital art": [
        "a vibrant digital art illustration painted with stylus on a graphics tablet using layered digital brushes",
        "contemporary digital painting concept art with crisp luminous lighting and smooth gradients",
        "modern digital artwork created on computer software, not traditional oil or watercolor on paper"
    ]
}

OOD_ANCHORS = [
    [
        "everyday_photo",
        "a casual smartphone snapshot of food, a meal, a coffee cup, or a restaurant table"
    ],
    [
        "animal_pet",
        "a regular photograph of a pet dog, cat, bird, or wild animal"
    ],
    [
        "vehicle_tech",
        "a photo of a car, motorcycle, smartphone, laptop, keyboard, or electronic gadget"
    ],
    [
        "screenshot_ui",
        "a computer or phone screenshot showing software UI, source code, chat messages, or website"
    ],
    [
        "document_text",
        "a photo or scan of a printed book page, invoice, receipt, or spreadsheet"
    ],
    [
        "selfie_casual",
        "a casual modern smartphone selfie or group photo of people smiling at camera"
    ],
    [
        "real_nature_photo",
        "a real-world DSLR camera photograph of mountains, ocean, or city street, not a painting"
    ],
    [
        "fashion_product",
        "an e-commerce product photo of sneakers, t-shirt, or household plastic item on white background"
    ],
    [
        "diagram_chart",
        "a business bar chart, flowchart diagram, mathematical graph, or map"
    ]
]

def build_prompts_for_label(item: dict) -> list[str]:
    word = item["word"]
    hints = CLASS_VISUAL_HINTS.get(word, [])
    prompts = list(hints)
    prompts.append(f"a photo representing the fine arts and crafts term '{word}' ({item.get('topic_name', '')})")
    if item.get("image_alt"):
        prompts.append(f"visual artwork of {word}")
    return prompts
