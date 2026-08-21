export const journeyStages = [
  {
    "id": "before-realization"
  },
  {
    "id": "questioning"
  },
  {
    "id": "self-recognized"
  },
  {
    "id": "disclosed"
  },
  {
    "id": "transitioning"
  },
  {
    "id": "established"
  }
];

export const experienceFamilies = [
  {
    "id": "body-image-and-self-recognition",
    "experiences": [
      "mirrors-and-photographs-feel-unflattering",
      "unfamiliar-reflection",
      "difficulty-picturing-your-current-body-shape",
      "body-looks-like-the-wrong-gender",
      "self-hatred",
      "feeling-detached-from-the-body",
      "seeing-yourself-shift-toward-recognition",
      "avoiding-your-own-unclothed-body"
    ]
  },
  {
    "id": "bodily-privacy-and-visibility-to-others",
    "experiences": [
      "discomfort-with-your-body-being-seen",
      "feeling-out-of-place-in-gendered-restrooms",
      "covering-the-bare-upper-torso",
      "concealing-chest-development-while-boymoding"
    ]
  },
  {
    "id": "gendered-body-traits-and-changes",
    "experiences": [
      "discomfort-with-sex-characteristics",
      "extreme-body-shape-and-gendered-silhouette",
      "voice-feels-unlike-oneself",
      "body-changes-create-recognition-and-relief"
    ]
  },
  {
    "id": "clothing-and-body-silhouette",
    "experiences": [
      "minimizing-or-binding-an-unwanted-chest",
      "clothing-that-hides-the-body-silhouette",
      "clothing-fit-highlights-body-shape"
    ]
  },
  {
    "id": "hair-and-grooming",
    "experiences": [
      "controlling-gendered-body-hair",
      "hair-carries-unusual-importance"
    ]
  },
  {
    "id": "gender-expression-and-assigned-expectations",
    "experiences": [
      "assigned-gender-presentation-feels-wrong",
      "plain-clothes-over-assigned-gender-beauty",
      "gravitating-away-from-assigned-gender-expectations",
      "relief-from-gender-affirming-expression"
    ]
  },
  {
    "id": "gender-recognition-and-evaluation",
    "experiences": [
      "being-treated-as-the-assigned-gender-feels-wrong",
      "gendered-records-feel-inaccurate",
      "hesitating-over-gender-fields",
      "relief-from-gender-recognition",
      "gender-policing-insults-feel-affirming",
      "assigned-gender-compliments-feel-wrong",
      "belonging-among-peers-of-another-gender",
      "singled-out-around-gendered-privacy",
      "gender-peer-friendship-mistaken-for-romantic-interest",
      "belonging-among-transgender-and-lgbtq-people",
      "separate-online-identity-until-gender-disclosure-feels-safe"
    ]
  },
  {
    "id": "assigned-gender-roles-and-performance",
    "experiences": [
      "assigned-gender-roles-feel-performed",
      "same-gender-friendship-feels-socially-wrong",
      "overperforming-the-assigned-gender"
    ]
  },
  {
    "id": "exploring-gender-through-imagination-and-identification",
    "experiences": [
      "another-gender-in-games-and-imagined-roles",
      "gender-transformation-stories-feel-compelling",
      "identifying-with-characters-of-another-gender",
      "living-through-another-persons-presentation",
      "envy-blends-appearance-identity-and-attraction",
      "attuned-to-gender-variance-in-other-people"
    ]
  },
  {
    "id": "suppressing-or-avoiding-gender-awareness",
    "experiences": [
      "social-withdrawal-reduces-gendered-exposure",
      "staying-busy-to-avoid-gender-feelings"
    ]
  },
  {
    "id": "understanding-gender-across-time",
    "experiences": [
      "grief-for-life-in-the-wrong-gender-role",
      "returning-to-gendered-childhood-interests",
      "fear-of-aging-in-the-assigned-gender",
      "fear-that-transition-began-too-late",
      "recurring-doubt-about-being-trans-enough",
      "gender-feelings-fluctuate-in-intensity",
      "gender-expression-becomes-less-deliberate",
      "moving-forward-after-gender-self-recognition",
      "aligned-with-gender-concerns-before-self-recognition"
    ]
  },
  {
    "id": "gendered-roles-in-intimacy-and-attraction",
    "experiences": [
      "intimacy-when-gendered-roles-align",
      "withdrawing-when-a-promising-date-becomes-real",
      "attraction-to-women-and-the-imposed-male-role"
    ]
  },
  {
    "id": "sexual-responses-and-embodiment",
    "experiences": [
      "libido-or-arousal-feels-alien",
      "libido-changes-make-friendship-with-women-easier",
      "masturbation-that-affirms-a-feminine-self"
    ]
  }
];

export const domains = [
  {
    "id": "body",
    "families": [
      "body-image-and-self-recognition",
      "bodily-privacy-and-visibility-to-others",
      "gendered-body-traits-and-changes"
    ]
  },
  {
    "id": "social",
    "families": [
      "gender-recognition-and-evaluation",
      "assigned-gender-roles-and-performance"
    ]
  },
  {
    "id": "presentation",
    "families": [
      "clothing-and-body-silhouette",
      "hair-and-grooming",
      "gender-expression-and-assigned-expectations"
    ]
  },
  {
    "id": "self-understanding",
    "families": [
      "exploring-gender-through-imagination-and-identification",
      "suppressing-or-avoiding-gender-awareness",
      "understanding-gender-across-time"
    ]
  },
  {
    "id": "sexuality",
    "families": [
      "gendered-roles-in-intimacy-and-attraction",
      "sexual-responses-and-embodiment"
    ]
  }
];

export const experiences = [
  {
    "id": "mirrors-and-photographs-feel-unflattering",
    "stages": ["before-realization","questioning"],
    "family": "body-image-and-self-recognition",
    "domain": "body",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "low-confidence",
      "feeling-ugly",
      "photo-avoidance",
      "self-criticism"
    ],
    "tags": [
      "mirrors",
      "photographs",
      "appearance",
      "confidence",
      "body-image"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Androgenic Puberty",
        "https://genderdysphoria.fyi/en/second-puberty-masc"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ],
      [
        "Gender Congruence and Life Satisfaction Scale",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/",
        "Questionnaire",
        "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."
      ]
    ]
  },
  {
    "id": "self-hatred",
    "stages": ["before-realization","questioning","self-recognized","disclosed","transitioning"],
    "family": "body-image-and-self-recognition",
    "domain": "body",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "self-criticism",
      "feeling-ugly",
      "low-confidence",
      "isolation"
    ],
    "tags": [
      "appearance",
      "body-image",
      "confidence",
      "identity",
      "self-recognition"
    ],
    "reportCount": 5,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Societal Dysphoria",
        "https://genderdysphoria.fyi/en/societal-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Impostor Syndrome",
        "https://genderdysphoria.fyi/en/impostor-syndrome"
      ],
      [
        "Mr. Textured Graphics (@AliasTextured), drawing: two partners walking together, each reading their own appearance through a slur and expecting the pair to be taken for a same-gender couple.",
        "https://x.com/AliasTextured/status/2090517590334492975",
        "Community report"
      ],
      [
        "crawbugz (@crawbugz): I look like this and I say this.",
        "https://x.com/crawbugz/status/2090522955541324102",
        "Community report · reply"
      ],
      [
        "Arctic (@neco_arctic): when I eat lots of yummy treats and food and then take selfies with captions like “I'm ugly and fat and a boy”",
        "https://x.com/neco_arctic/status/2086744881595359695",
        "Community report"
      ],
      [
        "Peevee (@Peevee39525): if im gonna be dysphoric and clocky i dont want to do it alone.",
        "https://x.com/Peevee39525/status/2090534444385853815",
        "Community report · reply"
      ],
      [
        "psychobellum (@psychobellum): this was literally my ex and i until one day we went to an event and the tgirl working doors said “just so you know, this is a *queer* party”",
        "https://x.com/psychobellum/status/2090573745555378458",
        "Community report · reply"
      ]
    ]
  },
  {
    "id": "unfamiliar-reflection",
    "stages": ["before-realization","questioning"],
    "family": "body-image-and-self-recognition",
    "domain": "body",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "unfamiliarity",
      "detachment",
      "disbelief",
      "avoidance"
    ],
    "tags": [
      "mirrors",
      "photographs",
      "self-recognition",
      "depersonalization"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Biochemical Dysphoria",
        "https://genderdysphoria.fyi/en/biochemical-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ]
    ]
  },
  {
    "id": "difficulty-picturing-your-current-body-shape",
    "stages": ["before-realization","questioning"],
    "family": "body-image-and-self-recognition",
    "domain": "body",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "blankness",
      "surprise",
      "outdated-self-image",
      "uncertain-body-awareness"
    ],
    "tags": [
      "body-image",
      "mental-imagery",
      "body-shape",
      "memory",
      "self-recognition",
      "body-ownership"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Biochemical Dysphoria",
        "https://genderdysphoria.fyi/en/biochemical-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ]
    ]
  },
  {
    "id": "avoiding-your-own-unclothed-body",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "body-image-and-self-recognition",
    "domain": "body",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "looking-away",
      "covering-features",
      "dissociation",
      "avoidance"
    ],
    "tags": [
      "own-body",
      "nudity",
      "showering",
      "dressing",
      "body-avoidance"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ]
    ]
  },
  {
    "id": "discomfort-with-your-body-being-seen",
    "stages": ["before-realization","questioning","self-recognized","transitioning"],
    "family": "bodily-privacy-and-visibility-to-others",
    "domain": "body",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "covering-up",
      "privacy",
      "changing-room-avoidance",
      "anxiety"
    ],
    "tags": [
      "own-body",
      "being-seen",
      "nudity",
      "changing-rooms",
      "body-exposure"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "TransNavi: 日常生活で困ったとき",
        "https://transnavi.jp/everyday/"
      ]
    ]
  },
  {
    "id": "feeling-out-of-place-in-gendered-restrooms",
    "stages": ["self-recognized","disclosed","transitioning","established"],
    "family": "bodily-privacy-and-visibility-to-others",
    "domain": "body",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "wrongness",
      "exposure",
      "anxiety",
      "avoidance",
      "relief-in-privacy"
    ],
    "tags": [
      "restrooms",
      "toilets",
      "gender-neutral-facilities",
      "privacy",
      "stalls",
      "public-spaces",
      "avoidance"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "Murchison et al.: Public bathroom avoidance among transgender people",
        "https://pubmed.ncbi.nlm.nih.gov/34595532/",
        "Research study"
      ],
      [
        "Bladder health experiences of sexual and gender minorities",
        "https://pubmed.ncbi.nlm.nih.gov/31480302/",
        "Qualitative study"
      ],
      [
        "Transgender youths’ public-facility use and well-being",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC5685206/",
        "Research study"
      ]
    ]
  },
  {
    "id": "body-looks-like-the-wrong-gender",
    "stages": ["questioning","self-recognized","transitioning"],
    "family": "body-image-and-self-recognition",
    "domain": "body",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "transfeminine",
      "transmasculine",
      "nonbinary"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      },
      {
        "direction": "nonbinary"
      }
    ],
    "responses": [
      "wrongness",
      "distress",
      "looking-away",
      "wish-for-change"
    ],
    "tags": [
      "own-body",
      "body-perception",
      "sex-characteristics",
      "mirrors",
      "gender-incongruence"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ],
      [
        "Utrecht Gender Dysphoria Scale–Gender Spectrum",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7430422/",
        "Questionnaire",
        "An 18-item gender-neutral measure covering affirmed-gender behavior, assigned-gender treatment, identity, and bodily experience."
      ],
      [
        "Gender Congruence and Life Satisfaction Scale",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/",
        "Questionnaire",
        "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."
      ]
    ]
  },
  {
    "id": "covering-the-bare-upper-torso",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "bodily-privacy-and-visibility-to-others",
    "domain": "body",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "transfeminine"
    ],
    "responses": [
      "modesty",
      "covering-up",
      "anxiety",
      "preference-for-full-body-swimwear"
    ],
    "tags": [
      "toplessness",
      "nipples",
      "chest",
      "swimming",
      "boymoding",
      "public-exposure",
      "gendered-social-norms"
    ],
    "reportCount": 20,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "polen (@polen_ball): Did any other trans women/enbies who were raised male have problems going topless as a kid? I remember I always felt extremely uncomfortable wearing just shorts…",
        "https://x.com/polen_ball/status/2089362325619007865",
        "Community report"
      ],
      [
        "TescoPespsi ミヤ (@PespoTeski): I hated not wearing a shirt… I really hate people seeing me wearing anything that isn’t at least a shirt and trousers.",
        "https://x.com/PespoTeski/status/2089364294945112299",
        "Community report · reply"
      ],
      [
        "noinconsistency (@noinconsistency): I used to wear a shirt to the pool that wasn’t even meant for swimming.",
        "https://x.com/noinconsistency/status/2089378128745414777",
        "Community report · reply"
      ],
      [
        "gvttrmvttmvsic (@gvttrmvttmvsic): If I were walking around with a towel on I would have it up to my armpits covering my chest.",
        "https://x.com/gvttrmvttmvsic/status/2089384435737362757",
        "Community report · reply"
      ],
      [
        "Innerste (@Innerste_): I refused to ever go swimming without a shirt.",
        "https://x.com/Innerste_/status/2089363153524072713",
        "Community report · reply"
      ],
      [
        "PiralisArt (@PiralisArt): I feel more comfortable topless today than I did as a kid.",
        "https://x.com/PiralisArt/status/2089363859207237759",
        "Community report · reply"
      ],
      [
        "Asbestosdealer1 (@Asbestosdealer1): I used to love swimming until I turned 13; then I never went again without a swimming shirt on.",
        "https://x.com/Asbestosdealer1/status/2089369646998970724",
        "Community report · reply"
      ],
      [
        "RedPandaVeth (@RedPandaVeth): Before puberty I didn’t care, but after, the idea of being topless was hell, even when I was alone.",
        "https://x.com/RedPandaVeth/status/2089381435052327408",
        "Community report · reply"
      ],
      [
        "neco_arctic (@neco_arctic): I felt intense sensations of shame at the pool and I really couldn’t place why.",
        "https://x.com/neco_arctic/status/2089383389417918816",
        "Community report · reply"
      ],
      [
        "Alcalino (@AlcalinoO_o): I was very uncomfortable going topless, but my parents insisted that I should because that’s what men do.",
        "https://x.com/AlcalinoO_o/status/2089404709903671392",
        "Community report · reply"
      ],
      [
        "AxoLofa (@AxoLofa): I hated it before puberty; after puberty it was over. I still haven’t gone swimming since I was 12.",
        "https://x.com/AxoLofa/status/2089427772963799169",
        "Community report · reply"
      ],
      [
        "gabem (@gabem_p): I was always quick to dry and put my shirt back on after I got out of the water.",
        "https://x.com/gabem_p/status/2089622406654476734",
        "Community report · quote"
      ],
      [
        "Kuiper (@wolfgirldick): I begged my dad for a swim shirt as a kid… I would nearly cry when picked for the skins team.",
        "https://x.com/wolfgirldick/status/2089573863248322771",
        "Community report · quote"
      ],
      [
        "Mega (@Nozomega): When I was younger I always wore a rashguard because I hated going shirtless… I think it was dysphoria too.",
        "https://x.com/Nozomega/status/2089575697316511867",
        "Community report · quote"
      ],
      [
        "gwen (@gwenjamjam): Once I reached around 10 I couldn’t be shirtless… even swimming meant shorts and a shirt.",
        "https://x.com/gwenjamjam/status/2089533059372839278",
        "Community report · quote"
      ],
      [
        "Soonfald (@Soonfald): I always felt exposed without a shirt on… I wasn’t self-conscious about how my chest looked.",
        "https://x.com/Soonfald/status/2089525927256666315",
        "Community report · quote"
      ],
      [
        "Puyo (@Ms_Caskett): When I was younger I hated showing skin… Nowadays I love skirts and short shorts; they feel good.",
        "https://x.com/Ms_Caskett/status/2089556125683253558",
        "Community report · quote"
      ],
      [
        "doodoomrpoopyman on r/MtF: Since I was around six, I never went to the swimming pool without a shirt and felt naked without one.",
        "https://www.reddit.com/r/MtF/comments/1ep0c2l/did_anyone_else_not_like_being_shirtless_pre/",
        "Community report · independent discussion"
      ],
      [
        "lost_and_found_2000 on r/MtF: Going swimming from around age 13 caused anxiety; I covered my shoulders and chest until the last possible moment.",
        "https://www.reddit.com/r/MtF/comments/16mrrzh/were_any_other_of_you_girls_uncomfortable_being/",
        "Community report · independent discussion"
      ],
      [
        "CoolWatermelon123 on r/MtF: At the beach or pool, having to be shirtless or show much skin felt especially uncomfortable.",
        "https://www.reddit.com/r/MtF/comments/vxoyk0/feeling_weirduncomfortable_with_my_body/",
        "Community report · independent discussion"
      ]
    ]
  },
  {
    "id": "concealing-chest-development-while-boymoding",
    "stages": ["transitioning"],
    "family": "bodily-privacy-and-visibility-to-others",
    "domain": "body",
    "types": [
      "dysphoric",
      "euphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "transfeminine"
    ],
    "responses": [
      "joy",
      "anxiety",
      "layering",
      "concealment",
      "protectiveness"
    ],
    "tags": [
      "breasts",
      "chest",
      "boymoding",
      "clothing",
      "silhouette",
      "public-exposure"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "🏳️‍⚧️Tsuki✨ (@PrestonRay83): 去游泳馆换衣服真是尴尬……怎看着像男生又有胸……求求别看了。 Changing at the pool was awkward; people kept looking at someone who appeared male and had breasts.",
        "https://x.com/PrestonRay83/status/2087192200274985246",
        "Community report"
      ]
    ]
  },
  {
    "id": "minimizing-or-binding-an-unwanted-chest",
    "stages": ["questioning","self-recognized","disclosed","transitioning"],
    "family": "clothing-and-body-silhouette",
    "domain": "presentation",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "transmasculine"
    ],
    "responses": [
      "relief",
      "compression",
      "concealment",
      "reduced-body-awareness"
    ],
    "tags": [
      "chest",
      "breasts",
      "binding",
      "compression",
      "silhouette"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ]
    ]
  },
  {
    "id": "discomfort-with-sex-characteristics",
    "stages": ["before-realization","questioning","self-recognized","transitioning"],
    "family": "gendered-body-traits-and-changes",
    "domain": "body",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "wrongness",
      "revulsion",
      "persistent-awareness",
      "wish-for-change"
    ],
    "tags": [
      "puberty",
      "anatomy",
      "chest",
      "genitals",
      "body-hair"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Diagnosing Gender Dysphoria",
        "https://genderdysphoria.fyi/en/diagnoses"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ],
      [
        "WHO ICD-11: Gender incongruence",
        "https://www.who.int/standards/classifications/frequently-asked-questions/gender-incongruence-and-transgender-health-in-the-icd",
        "Diagnostic classification",
        "Describes persistent incongruence with assigned sex and desires to live, be accepted, or align the body with the experienced gender."
      ],
      [
        "MSD Manual: Symptoms and diagnostic criteria",
        "https://www.msdmanuals.com/professional/psychiatric-disorders/gender-incongruence-and-gender-dysphoria/gender-incongruence-and-gender-dysphoria",
        "Clinical manual",
        "Summarizes adult and childhood presentations together with DSM-5-TR and ICD-11 diagnostic features."
      ],
      [
        "Utrecht Gender Dysphoria Scale–Gender Spectrum",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7430422/",
        "Questionnaire",
        "An 18-item gender-neutral measure covering affirmed-gender behavior, assigned-gender treatment, identity, and bodily experience."
      ],
      [
        "Gender Congruence and Life Satisfaction Scale",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/",
        "Questionnaire",
        "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."
      ]
    ]
  },
  {
    "id": "extreme-body-shape-and-gendered-silhouette",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "gendered-body-traits-and-changes",
    "domain": "body",
    "types": [
      "dysphoric",
      "preference",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "control",
      "concealment",
      "longing",
      "relief"
    ],
    "tags": [
      "weight",
      "thinness",
      "fatness",
      "muscularity",
      "body-composition",
      "silhouette",
      "exercise",
      "beauty-standards"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria — extreme exercise",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ]
    ]
  },
  {
    "id": "feeling-detached-from-the-body",
    "stages": ["before-realization","questioning"],
    "family": "body-image-and-self-recognition",
    "domain": "body",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "numbness",
      "neglect",
      "hyperfocus",
      "lack-of-ownership"
    ],
    "tags": [
      "depersonalization",
      "body-ownership",
      "self-care",
      "detachment"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Biochemical Dysphoria",
        "https://genderdysphoria.fyi/en/biochemical-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ]
    ]
  },
  {
    "id": "assigned-gender-presentation-feels-wrong",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "gender-expression-and-assigned-expectations",
    "domain": "presentation",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "restriction",
      "discomfort",
      "self-consciousness",
      "wish-for-another-expression"
    ],
    "tags": [
      "gender-expression",
      "clothing",
      "hair",
      "grooming",
      "mannerisms"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ],
      [
        "MSD Manual: Symptoms and diagnostic criteria",
        "https://www.msdmanuals.com/professional/psychiatric-disorders/gender-incongruence-and-gender-dysphoria/gender-incongruence-and-gender-dysphoria",
        "Clinical manual",
        "Summarizes adult and childhood presentations together with DSM-5-TR and ICD-11 diagnostic features."
      ],
      [
        "Utrecht Gender Dysphoria Scale–Gender Spectrum",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7430422/",
        "Questionnaire",
        "An 18-item gender-neutral measure covering affirmed-gender behavior, assigned-gender treatment, identity, and bodily experience."
      ],
      [
        "Gender Identity/Gender Dysphoria Questionnaire for Adolescents and Adults",
        "https://pubmed.ncbi.nlm.nih.gov/19396705/",
        "Questionnaire",
        "A 27-item dimensional measure of gender identity and gender dysphoria for adolescents and adults."
      ]
    ]
  },
  {
    "id": "plain-clothes-over-assigned-gender-beauty",
    "stages": ["before-realization","questioning"],
    "family": "gender-expression-and-assigned-expectations",
    "domain": "presentation",
    "types": [
      "dysphoric",
      "preference",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "indifference",
      "low-motivation",
      "avoidance",
      "deliberate-plainness"
    ],
    "tags": [
      "plain-clothing",
      "black-clothing",
      "fashion",
      "grooming",
      "appearance",
      "boymoding",
      "girlmoding",
      "beauty-standards"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Biochemical Dysphoria",
        "https://genderdysphoria.fyi/en/biochemical-dysphoria"
      ]
    ]
  },
  {
    "id": "gravitating-away-from-assigned-gender-expectations",
    "stages": ["before-realization"],
    "family": "gender-expression-and-assigned-expectations",
    "domain": "presentation",
    "types": [
      "preference"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "disinterest",
      "rejection",
      "affinity",
      "curiosity"
    ],
    "tags": [
      "toys",
      "play",
      "hobbies",
      "friends",
      "gender-nonconformity",
      "childhood"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Diagnosing Gender Dysphoria",
        "https://genderdysphoria.fyi/en/diagnoses"
      ],
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "WHO ICD-11: Gender incongruence",
        "https://www.who.int/standards/classifications/frequently-asked-questions/gender-incongruence-and-transgender-health-in-the-icd",
        "Diagnostic classification",
        "Describes persistent incongruence with assigned sex and desires to live, be accepted, or align the body with the experienced gender."
      ],
      [
        "MSD Manual: Symptoms in children",
        "https://www.msdmanuals.com/professional/psychiatric-disorders/gender-incongruence-and-gender-dysphoria/gender-incongruence-and-gender-dysphoria",
        "Clinical manual",
        "Describes childhood gender expression, play, clothing preferences, and distress around pubertal change."
      ]
    ]
  },
  {
    "id": "being-treated-as-the-assigned-gender-feels-wrong",
    "stages": ["questioning","self-recognized","disclosed","transitioning","established"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "irritation",
      "hurt",
      "disconnection",
      "withdrawal"
    ],
    "tags": [
      "misgendering",
      "pronouns",
      "name",
      "honorifics",
      "social-roles"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Diagnosing Gender Dysphoria",
        "https://genderdysphoria.fyi/en/diagnoses"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ],
      [
        "MSD Manual: Symptoms and diagnostic criteria",
        "https://www.msdmanuals.com/professional/psychiatric-disorders/gender-incongruence-and-gender-dysphoria/gender-incongruence-and-gender-dysphoria",
        "Clinical manual",
        "Summarizes adult and childhood presentations together with DSM-5-TR and ICD-11 diagnostic features."
      ],
      [
        "Utrecht Gender Dysphoria Scale–Gender Spectrum",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7430422/",
        "Questionnaire",
        "An 18-item gender-neutral measure covering affirmed-gender behavior, assigned-gender treatment, identity, and bodily experience."
      ],
      [
        "Gender Identity/Gender Dysphoria Questionnaire for Adolescents and Adults",
        "https://pubmed.ncbi.nlm.nih.gov/19396705/",
        "Questionnaire",
        "A 27-item dimensional measure of gender identity and gender dysphoria for adolescents and adults."
      ],
      [
        "云欣 Akina (@rainchngshainn): 被 misgender 难受。 Being misgendered hurts.",
        "https://x.com/rainchngshainn/status/2032163575075119343",
        "Community report"
      ]
    ]
  },
  {
    "id": "gendered-records-feel-inaccurate",
    "stages": ["self-recognized","disclosed","transitioning","established"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "privacy",
      "avoidance",
      "vigilance",
      "disconnection"
    ],
    "tags": [
      "personal-information",
      "identity-documents",
      "forms",
      "profiles",
      "name",
      "sex-marker",
      "disclosure"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "TransNavi: 日常生活で困ったとき",
        "https://transnavi.jp/everyday/"
      ]
    ]
  },
  {
    "id": "hesitating-over-gender-fields",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "hesitation",
      "conflict",
      "avoidance",
      "distress"
    ],
    "tags": [
      "forms",
      "sex-marker",
      "assigned-gender",
      "self-recognition",
      "avoidance"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "TransNavi: 日常生活で困ったとき",
        "https://transnavi.jp/everyday/"
      ]
    ]
  },
  {
    "id": "relief-from-gender-recognition",
    "stages": ["questioning","self-recognized","disclosed","transitioning","established"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "euphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "relief",
      "joy",
      "calm",
      "recognition"
    ],
    "tags": [
      "gender-euphoria",
      "pronouns",
      "name",
      "recognition",
      "relief"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ],
      [
        "Gender Congruence and Life Satisfaction Scale",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/",
        "Questionnaire",
        "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."
      ],
      [
        "Gender Euphoria Scale",
        "https://doi.org/10.1080/26895269.2024.2447768",
        "Questionnaire",
        "A 26-item measure organized around social affirmation, self-affirmation, and community connection."
      ],
      [
        "Lily!🏳️‍⚧️🩷🐶 (@GlassLilypad): I got ma’amed when I entered the plane today… I keep getting gendered correctly! I pass! Yay!",
        "https://x.com/GlassLilypad/status/2027289567313764722",
        "Community report"
      ]
    ]
  },
  {
    "id": "gender-policing-insults-feel-affirming",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "dysphoric",
      "euphoric"
    ],
    "directions": [
      "transfeminine",
      "transmasculine"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      }
    ],
    "responses": [
      "mixed-feelings",
      "indifference",
      "private-relief",
      "gender-euphoria"
    ],
    "tags": [
      "harassment",
      "gender-policing",
      "insults",
      "slurs",
      "recognition",
      "assigned-gender-pride",
      "language"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Societal Dysphoria",
        "https://genderdysphoria.fyi/en/societal-dysphoria"
      ]
    ]
  },
  {
    "id": "relief-from-gender-affirming-expression",
    "stages": ["questioning","self-recognized","disclosed","transitioning","established"],
    "family": "gender-expression-and-assigned-expectations",
    "domain": "presentation",
    "types": [
      "euphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "comfort",
      "confidence",
      "recognition",
      "joy"
    ],
    "tags": [
      "gender-euphoria",
      "clothing",
      "hair",
      "appearance",
      "self-recognition"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ],
      [
        "Utrecht Gender Dysphoria Scale–Gender Spectrum",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7430422/",
        "Questionnaire",
        "An 18-item gender-neutral measure covering affirmed-gender behavior, assigned-gender treatment, identity, and bodily experience."
      ],
      [
        "Gender Euphoria Scale",
        "https://doi.org/10.1080/26895269.2024.2447768",
        "Questionnaire",
        "A 26-item measure organized around social affirmation, self-affirmation, and community connection."
      ],
      [
        "haohao的宝宝 (@haohaodebaobao): 留了头发、修眉毛、化妆。很多人说没有男装时好看，开心就好了。 After growing out their hair, shaping their eyebrows, and using makeup, happiness mattered more than looking better in boymode.",
        "https://x.com/haohaodebaobao/status/2056650624377213072",
        "Community report"
      ]
    ]
  },
  {
    "id": "another-gender-in-games-and-imagined-roles",
    "stages": ["before-realization","questioning"],
    "family": "exploring-gender-through-imagination-and-identification",
    "domain": "self-understanding",
    "types": [
      "euphoric",
      "preference"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "comfort",
      "identification",
      "escape",
      "repetition"
    ],
    "tags": [
      "avatars",
      "video-games",
      "role-play",
      "cosplay",
      "online-identity"
    ],
    "reportCount": 4,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "羊毛球 (@ki_3ri): 一个朋友拉着我玩cosplay，我选择了当时比较喜欢的男性角色，以他的形象出门之后一下子就被从未体会过的愉悦冲昏了头脑。 A friend pulled me into cosplay; I picked a male character I liked, and going out in his form left me overwhelmed by a pleasure I had never felt before.",
        "https://x.com/ki_3ri/status/2090489175116251404",
        "Community report"
      ],
      [
        "羊毛球 (@ki_3ri): 我当时还不知道什么是跨性别，只知道自己特别开心，然后我就一直玩cos直到认识了几个神人 I didn't know what transgender meant then; I only knew I was very happy, and I kept doing cosplay until I met a few remarkable people.",
        "https://x.com/ki_3ri/status/2090496684178755903",
        "Community report · reply"
      ],
      [
        "絵空　雫 (@EsoraShizuku): 我也觉得第一次女装cos很开心… My first feminine cosplay felt happy too.",
        "https://x.com/EsoraShizuku/status/2090519237060075757",
        "Community report · reply"
      ],
      [
        "真左要乐奈 (@Pissenlit_AH): 我大概6、7岁的时候我表姐把我扮成女孩子，然后拉去给我妈妈和舅母看...听她们称呼我是女孩子。然后就一发不可收拾了...被愉悦冲昏头脑了 At about six or seven my cousin dressed me as a girl and took me to my mother and aunt, and I heard them call me a girl. After that there was no going back.",
        "https://x.com/Pissenlit_AH/status/2090538615873163367",
        "Community report · reply"
      ]
    ]
  },
  {
    "id": "gender-transformation-stories-feel-compelling",
    "stages": ["before-realization","questioning"],
    "family": "exploring-gender-through-imagination-and-identification",
    "domain": "self-understanding",
    "types": [
      "preference"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "fascination",
      "identification",
      "longing",
      "curiosity"
    ],
    "tags": [
      "transformation-stories",
      "body-change",
      "fantasy",
      "fiction",
      "self-recognition",
      "exploration"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ]
    ]
  },
  {
    "id": "assigned-gender-roles-feel-performed",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "assigned-gender-roles-and-performance",
    "domain": "social",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "effort",
      "distance",
      "masking",
      "exhaustion"
    ],
    "tags": [
      "masking",
      "social-roles",
      "dating",
      "relationships",
      "performance"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Sexual Dysphoria",
        "https://genderdysphoria.fyi/en/sexual-dysphoria"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ],
      [
        "WillowTheFoxΘΔ🏳️‍⚧️ (@Willowfoxxo): I’m so glad I dropped that mask of pretending five years ago. I love being a woman.",
        "https://x.com/Willowfoxxo/status/2037300969327755631",
        "Community report"
      ]
    ]
  },
  {
    "id": "same-gender-friendship-feels-socially-wrong",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "assigned-gender-roles-and-performance",
    "domain": "social",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "transfeminine",
      "transmasculine",
      "nonbinary"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      },
      {
        "direction": "nonbinary"
      }
    ],
    "responses": [
      "embarrassment",
      "guilt",
      "self-consciousness",
      "distance",
      "date-like-feeling"
    ],
    "tags": [
      "friendship",
      "one-to-one-interaction",
      "peer-groups",
      "social-roles",
      "boymoding",
      "girlmoding",
      "dating-scripts",
      "belonging"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Sexual Dysphoria",
        "https://genderdysphoria.fyi/en/sexual-dysphoria"
      ],
      [
        "由依 (@yui_mymelodyy): 女子の友達からお泊まりに誘われて行った時、本当に気まずい。 Being invited to stay over with female friends felt deeply awkward while living as an MtF student.",
        "https://x.com/yui_mymelodyy/status/2043674526517727656",
        "Community report"
      ]
    ]
  },
  {
    "id": "overperforming-the-assigned-gender",
    "stages": ["before-realization","questioning"],
    "family": "assigned-gender-roles-and-performance",
    "domain": "social",
    "types": [
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "overcompensation",
      "control",
      "repression",
      "self-surveillance"
    ],
    "tags": [
      "overcompensation",
      "masking",
      "denial",
      "gender-roles"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ],
      [
        "MSD Manual: Symptoms in adults",
        "https://www.msdmanuals.com/professional/psychiatric-disorders/gender-incongruence-and-gender-dysphoria/gender-incongruence-and-gender-dysphoria",
        "Clinical manual",
        "Describes retrospective avoidance of gender feelings and a reported flight into hypermasculinity among some AMAB adults."
      ]
    ]
  },
  {
    "id": "clothing-that-hides-the-body-silhouette",
    "stages": ["before-realization","questioning","self-recognized","transitioning"],
    "family": "clothing-and-body-silhouette",
    "domain": "presentation",
    "types": [
      "preference",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "safety",
      "concealment",
      "relief",
      "reduced-body-awareness"
    ],
    "tags": [
      "oversized-clothing",
      "hoodies",
      "silhouette",
      "body-shape",
      "coping"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ]
    ]
  },
  {
    "id": "voice-feels-unlike-oneself",
    "stages": ["before-realization","questioning","self-recognized","transitioning"],
    "family": "gendered-body-traits-and-changes",
    "domain": "body",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "jarring-recognition",
      "avoidance",
      "embarrassment",
      "wish-for-change",
      "fear",
      "dread",
      "grief",
      "withdrawal",
      "hopelessness",
      "loss-of-control",
      "urgency"
    ],
    "tags": [
      "voice",
      "recordings",
      "speech",
      "self-recognition",
      "puberty",
      "body-change",
      "anticipation",
      "hrt",
      "avoidance"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ]
    ]
  },
  {
    "id": "grief-for-life-in-the-wrong-gender-role",
    "stages": ["self-recognized","disclosed","transitioning","established"],
    "family": "understanding-gender-across-time",
    "domain": "self-understanding",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "grief",
      "loss",
      "envy",
      "wish-to-recreate-experiences"
    ],
    "tags": [
      "hindsight",
      "grief",
      "childhood",
      "adolescence",
      "missed-experiences"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Existential Dysphoria",
        "https://genderdysphoria.fyi/en/existential-dysphoria"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ]
    ]
  },
  {
    "id": "returning-to-gendered-childhood-interests",
    "stages": ["self-recognized","disclosed","transitioning","established"],
    "family": "understanding-gender-across-time",
    "domain": "self-understanding",
    "types": [
      "dysphoric",
      "euphoric",
      "preference"
    ],
    "directions": [
      "transfeminine",
      "transmasculine",
      "nonbinary"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      },
      {
        "direction": "nonbinary"
      }
    ],
    "responses": [
      "delight",
      "nostalgia",
      "longing",
      "collecting"
    ],
    "tags": [
      "childhood",
      "toys",
      "plush-toys",
      "dolls",
      "colors",
      "childrens-fashion",
      "collecting",
      "missed-experiences"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Existential Dysphoria",
        "https://genderdysphoria.fyi/en/existential-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ]
    ]
  },
  {
    "id": "fear-of-aging-in-the-assigned-gender",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "understanding-gender-across-time",
    "domain": "self-understanding",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "fear",
      "dread",
      "disbelief",
      "future-avoidance"
    ],
    "tags": [
      "aging",
      "future-self",
      "assigned-gender",
      "anticipation",
      "identity"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Existential Dysphoria",
        "https://genderdysphoria.fyi/en/existential-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "Gender Identity/Gender Dysphoria Questionnaire for Adolescents and Adults",
        "https://pubmed.ncbi.nlm.nih.gov/19396705/",
        "Questionnaire",
        "A 27-item dimensional measure of gender identity and gender dysphoria for adolescents and adults."
      ]
    ]
  },
  {
    "id": "fear-that-transition-began-too-late",
    "stages": ["questioning","self-recognized","transitioning"],
    "family": "understanding-gender-across-time",
    "domain": "self-understanding",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "regret",
      "anxiety",
      "hopelessness",
      "urgency"
    ],
    "tags": [
      "delayed-transition",
      "age",
      "puberty",
      "passing",
      "regret",
      "body-changes"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Existential Dysphoria",
        "https://genderdysphoria.fyi/en/existential-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ]
    ]
  },
  {
    "id": "belonging-among-peers-of-another-gender",
    "stages": ["before-realization","questioning","self-recognized","disclosed"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "dysphoric",
      "euphoric",
      "preference"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "belonging",
      "longing",
      "exclusion",
      "recognition"
    ],
    "tags": [
      "friendship",
      "peer-groups",
      "belonging",
      "exclusion",
      "social-gender"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Existential Dysphoria",
        "https://genderdysphoria.fyi/en/existential-dysphoria"
      ],
      [
        "Utrecht Gender Dysphoria Scale–Gender Spectrum",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7430422/",
        "Questionnaire",
        "An 18-item gender-neutral measure covering affirmed-gender behavior, assigned-gender treatment, identity, and bodily experience."
      ],
      [
        "Gender Congruence and Life Satisfaction Scale",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/",
        "Questionnaire",
        "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."
      ],
      [
        "Gender Euphoria Scale",
        "https://doi.org/10.1080/26895269.2024.2447768",
        "Questionnaire",
        "A 26-item measure organized around social affirmation, self-affirmation, and community connection."
      ]
    ]
  },
  {
    "id": "singled-out-around-gendered-privacy",
    "stages": ["disclosed","transitioning","established"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "sadness",
      "rejection",
      "misrecognition",
      "exclusion"
    ],
    "tags": [
      "friendship",
      "peer-groups",
      "exclusion",
      "social-gender",
      "privacy",
      "body-exposure",
      "recognition",
      "restrooms",
      "touch"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "TransNavi: 日常生活で困ったとき",
        "https://transnavi.jp/everyday/"
      ]
    ]
  },
  {
    "id": "belonging-among-transgender-and-lgbtq-people",
    "stages": ["questioning","self-recognized","disclosed","transitioning","established"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "euphoric",
      "preference"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "belonging",
      "relief",
      "familiarity",
      "solidarity",
      "connection"
    ],
    "tags": [
      "transgender-community",
      "lgbtq-community",
      "friendship",
      "peer-support",
      "belonging",
      "boymoding"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "Puckett et al.: Transgender community connectedness and resilience",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7390536/",
        "Research study"
      ],
      [
        "Gender Euphoria Scale",
        "https://doi.org/10.1080/26895269.2024.2447768",
        "Questionnaire"
      ]
    ]
  },
  {
    "id": "gender-peer-friendship-mistaken-for-romantic-interest",
    "stages": ["self-recognized","disclosed","transitioning","established"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "transfeminine",
      "transmasculine"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      }
    ],
    "responses": [
      "misrecognition",
      "wariness",
      "exclusion",
      "loneliness"
    ],
    "tags": [
      "friendship",
      "peer-groups",
      "romantic-assumptions",
      "social-gender",
      "misrecognition"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Existential Dysphoria",
        "https://genderdysphoria.fyi/en/existential-dysphoria"
      ]
    ]
  },
  {
    "id": "moving-forward-after-gender-self-recognition",
    "stages": ["self-recognized","disclosed","transitioning"],
    "family": "understanding-gender-across-time",
    "domain": "self-understanding",
    "types": [
      "euphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "release",
      "energy",
      "continuity",
      "motivation"
    ],
    "tags": [
      "self-recognition",
      "acceptance",
      "relief",
      "life-planning",
      "gender-euphoria"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "Gender Dysphoria Bible: Existential Dysphoria",
        "https://genderdysphoria.fyi/en/existential-dysphoria"
      ],
      [
        "Gender Congruence and Life Satisfaction Scale",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/",
        "Questionnaire",
        "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."
      ],
      [
        "Gender Euphoria Scale",
        "https://doi.org/10.1080/26895269.2024.2447768",
        "Questionnaire",
        "A 26-item measure organized around social affirmation, self-affirmation, and community connection."
      ],
      [
        "さつきぽん (@nishiharasatsuk): 孤独で未来が見えず、耐えるだけの日々だった。今は仲間がいて、ここから始まる未来が見える。 The future once felt invisible; now companionship makes a future beginning here feel possible.",
        "https://x.com/nishiharasatsuk/status/2029529608849379475",
        "Community report"
      ]
    ]
  },
  {
    "id": "clothing-fit-highlights-body-shape",
    "stages": ["before-realization","questioning","self-recognized","transitioning"],
    "family": "clothing-and-body-silhouette",
    "domain": "presentation",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "wrongness",
      "sensory-discomfort",
      "avoidance",
      "relief-with-another-cut"
    ],
    "tags": [
      "clothing-fit",
      "jeans",
      "silhouette",
      "proportions",
      "body-awareness"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ]
    ]
  },
  {
    "id": "controlling-gendered-body-hair",
    "stages": ["before-realization","questioning","self-recognized","transitioning"],
    "family": "hair-and-grooming",
    "domain": "presentation",
    "types": [
      "euphoric",
      "preference",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "relief",
      "compulsion",
      "control",
      "affirmation"
    ],
    "tags": [
      "body-hair",
      "facial-hair",
      "shaving",
      "grooming",
      "presentation"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ]
    ]
  },
  {
    "id": "hair-carries-unusual-importance",
    "stages": ["before-realization","questioning","self-recognized","disclosed","transitioning"],
    "family": "hair-and-grooming",
    "domain": "presentation",
    "types": [
      "euphoric",
      "preference"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "longing",
      "relief",
      "fear",
      "self-recognition"
    ],
    "tags": [
      "hair",
      "haircut",
      "gender-expression",
      "coping"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ]
    ]
  },
  {
    "id": "identifying-with-characters-of-another-gender",
    "stages": ["before-realization","questioning"],
    "family": "exploring-gender-through-imagination-and-identification",
    "domain": "self-understanding",
    "types": [
      "preference"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "identification",
      "longing",
      "comfort",
      "vicarious-experience"
    ],
    "tags": [
      "fiction",
      "film",
      "literature",
      "characters",
      "identification"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ]
    ]
  },
  {
    "id": "aligned-with-gender-concerns-before-self-recognition",
    "stages": ["before-realization"],
    "family": "understanding-gender-across-time",
    "domain": "self-understanding",
    "types": [
      "preference"
    ],
    "directions": [
      "transfeminine",
      "transmasculine"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      }
    ],
    "responses": [
      "empathy",
      "solidarity",
      "belonging",
      "retrospective-recognition"
    ],
    "tags": [
      "advocacy",
      "feminism",
      "gender-politics",
      "belonging",
      "self-recognition"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Existential Dysphoria",
        "https://genderdysphoria.fyi/en/existential-dysphoria"
      ]
    ]
  },
  {
    "id": "living-through-another-persons-presentation",
    "stages": ["before-realization","questioning"],
    "family": "exploring-gender-through-imagination-and-identification",
    "domain": "self-understanding",
    "types": [
      "preference"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "vicarious-joy",
      "longing",
      "expertise",
      "envy"
    ],
    "tags": [
      "shopping",
      "styling",
      "partners",
      "vicarious-experience",
      "clothing"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ]
    ]
  },
  {
    "id": "envy-blends-appearance-identity-and-attraction",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "exploring-gender-through-imagination-and-identification",
    "domain": "self-understanding",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "envy",
      "admiration",
      "attraction",
      "longing",
      "confusion"
    ],
    "tags": [
      "envy",
      "attraction",
      "appearance",
      "identification"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Sexual Dysphoria",
        "https://genderdysphoria.fyi/en/sexual-dysphoria"
      ],
      [
        "てちゃん (@Techan_desu): 性別移行前は女の子が好きと自分がなりたい女の子が混同してるカオスな状態でした。 Before transition, liking girls and wanting to become a girl were all mixed together.",
        "https://x.com/Techan_desu/status/2071867901179760648",
        "Community report"
      ]
    ]
  },
  {
    "id": "attuned-to-gender-variance-in-other-people",
    "stages": ["questioning","self-recognized","transitioning","established"],
    "family": "exploring-gender-through-imagination-and-identification",
    "domain": "self-understanding",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "recognition",
      "familiarity",
      "envy",
      "attraction",
      "hypervigilance",
      "passing-anxiety"
    ],
    "tags": [
      "transgender-recognition",
      "gender-cues",
      "attraction",
      "envy",
      "passing",
      "self-recognition",
      "privacy"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Existential Dysphoria",
        "https://genderdysphoria.fyi/en/existential-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ],
      [
        "Cox et al.: Inferences about sexual orientation and the gaydar myth",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC4731319/",
        "Related research",
        "Research on sexual-orientation inference shows how perceived radar can rely on stereotypes; it does not establish reliable detection of transgender identity."
      ],
      [
        "STRONG cohort: Visual conformity with affirmed gender",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7529975/",
        "Research study"
      ]
    ]
  },
  {
    "id": "social-withdrawal-reduces-gendered-exposure",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "suppressing-or-avoiding-gender-awareness",
    "domain": "self-understanding",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "avoidance",
      "isolation",
      "temporary-relief",
      "loneliness"
    ],
    "tags": [
      "social-withdrawal",
      "isolation",
      "avoidance",
      "coping"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ]
    ]
  },
  {
    "id": "separate-online-identity-until-gender-disclosure-feels-safe",
    "stages": ["before-realization","questioning","self-recognized","disclosed","transitioning"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "dysphoric",
      "euphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "privacy",
      "anxiety",
      "concealment",
      "relief",
      "openness"
    ],
    "tags": [
      "online-identity",
      "privacy",
      "disclosure",
      "voice-chat",
      "names",
      "transition"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ]
    ]
  },
  {
    "id": "staying-busy-to-avoid-gender-feelings",
    "stages": ["before-realization","questioning"],
    "family": "suppressing-or-avoiding-gender-awareness",
    "domain": "self-understanding",
    "types": [
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "distraction",
      "numbing",
      "escape",
      "exhaustion"
    ],
    "tags": [
      "overwork",
      "hobbies",
      "gaming",
      "sleep",
      "coping"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Managed Dysphoria",
        "https://genderdysphoria.fyi/en/managed-dysphoria"
      ]
    ]
  },
  {
    "id": "recurring-doubt-about-being-trans-enough",
    "stages": ["before-realization","questioning","self-recognized","disclosed","transitioning"],
    "family": "understanding-gender-across-time",
    "domain": "self-understanding",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "uncertainty",
      "confusion",
      "self-criticism",
      "fear",
      "disbelief"
    ],
    "tags": [
      "identity",
      "exploration",
      "childhood",
      "gender-incongruence",
      "denial",
      "self-recognition"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Am I Trans?",
        "https://genderdysphoria.fyi/en/am-i-trans"
      ],
      [
        "Gender Dysphoria Bible: Impostor Syndrome",
        "https://genderdysphoria.fyi/en/impostor-syndrome"
      ]
    ]
  },
  {
    "id": "gender-feelings-fluctuate-in-intensity",
    "stages": ["before-realization","questioning","self-recognized","transitioning"],
    "family": "understanding-gender-across-time",
    "domain": "self-understanding",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "fluctuation",
      "uncertainty",
      "temporary-relief",
      "sudden-distress"
    ],
    "tags": [
      "fluctuation",
      "intensity",
      "genderfluidity",
      "daily-variation"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Biochemical Dysphoria",
        "https://genderdysphoria.fyi/en/biochemical-dysphoria"
      ]
    ]
  },
  {
    "id": "gender-expression-becomes-less-deliberate",
    "stages": ["transitioning","established"],
    "family": "understanding-gender-across-time",
    "domain": "self-understanding",
    "types": [
      "adaptation"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "effort",
      "experimentation",
      "familiarity",
      "ease"
    ],
    "tags": [
      "transition",
      "gender-expression",
      "adaptation",
      "passing",
      "social-recognition",
      "preferences",
      "gender-roles"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Presentational Dysphoria",
        "https://genderdysphoria.fyi/en/presentational-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ]
    ]
  },
  {
    "id": "intimacy-when-gendered-roles-align",
    "stages": ["questioning","self-recognized","disclosed","transitioning","established"],
    "family": "gendered-roles-in-intimacy-and-attraction",
    "domain": "sexuality",
    "types": [
      "dysphoric",
      "euphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "disconnection",
      "shame",
      "relief",
      "desire",
      "embodiment"
    ],
    "tags": [
      "intimacy",
      "dating",
      "sexuality",
      "relationships",
      "gender-roles"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Sexual Dysphoria",
        "https://genderdysphoria.fyi/en/sexual-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "Gender Congruence and Life Satisfaction Scale",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/",
        "Questionnaire",
        "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."
      ]
    ]
  },
  {
    "id": "withdrawing-when-a-promising-date-becomes-real",
    "stages": ["before-realization","questioning","self-recognized"],
    "family": "gendered-roles-in-intimacy-and-attraction",
    "domain": "sexuality",
    "types": [
      "dysphoric",
      "avoidance-or-control"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "withdrawal",
      "confusion",
      "avoidance",
      "loss-of-interest"
    ],
    "tags": [
      "dating",
      "romance",
      "mutual-attraction",
      "being-desired",
      "intimacy",
      "assigned-gender-roles"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Sexual Dysphoria",
        "https://genderdysphoria.fyi/en/sexual-dysphoria"
      ],
      [
        "Gender Congruence and Life Satisfaction Scale",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/",
        "Questionnaire",
        "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."
      ]
    ]
  },
  {
    "id": "body-changes-create-recognition-and-relief",
    "stages": ["transitioning","established"],
    "family": "gendered-body-traits-and-changes",
    "domain": "body",
    "types": [
      "euphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "recognition",
      "relief",
      "joy",
      "increased-body-ownership"
    ],
    "tags": [
      "gender-euphoria",
      "body-changes",
      "self-recognition",
      "body-ownership"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ],
      [
        "WHO ICD-11: Gender incongruence",
        "https://www.who.int/standards/classifications/frequently-asked-questions/gender-incongruence-and-transgender-health-in-the-icd",
        "Diagnostic classification",
        "Describes persistent incongruence with assigned sex and desires to live, be accepted, or align the body with the experienced gender."
      ],
      [
        "WPATH Standards of Care, Version 8",
        "https://wpath.org/publications/soc8/",
        "Care standard",
        "Clinical recommendations for assessing gender incongruence and planning gender-affirming care."
      ],
      [
        "Gender Congruence and Life Satisfaction Scale",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/",
        "Questionnaire",
        "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."
      ],
      [
        "ラミー (@rummy_chocolove): Started HRT at 29. It’s not even my face—my expressions changed, and that’s what I’m super happy about.",
        "https://x.com/rummy_chocolove/status/2044032358467416508",
        "Community report"
      ]
    ]
  },
  {
    "id": "seeing-yourself-shift-toward-recognition",
    "stages": ["transitioning","established"],
    "family": "body-image-and-self-recognition",
    "domain": "body",
    "types": [
      "euphoric"
    ],
    "directions": [
      "cross-directional"
    ],
    "responses": [
      "alienation",
      "surprise",
      "recognition",
      "joy"
    ],
    "tags": [
      "mirrors",
      "photographs",
      "gender-euphoria",
      "self-recognition"
    ],
    "reportCount": 1,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Biochemical Dysphoria",
        "https://genderdysphoria.fyi/en/biochemical-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "さつきぽん (@nishiharasatsuk): 移行前は写真を見るたび苦しくなって消していた。今は望んだ姿や笑顔を残したくて、少しずつ自分の姿を好きになれている。 Before transition, photographs were painful; now they preserve a wanted appearance and a growing fondness for it.",
        "https://x.com/nishiharasatsuk/status/2067216940440211610",
        "Community report"
      ]
    ]
  },
  {
    "id": "libido-or-arousal-feels-alien",
    "stages": ["before-realization","questioning","self-recognized","transitioning"],
    "family": "sexual-responses-and-embodiment",
    "domain": "sexuality",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "transfeminine",
      "transmasculine",
      "nonbinary"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      },
      {
        "direction": "nonbinary"
      }
    ],
    "responses": [
      "revulsion",
      "shame",
      "loss-of-control",
      "body-alienation",
      "avoidance"
    ],
    "tags": [
      "libido",
      "arousal",
      "genital-response",
      "body-reaction",
      "sexuality"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Sexual Dysphoria",
        "https://genderdysphoria.fyi/en/sexual-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Physical Dysphoria",
        "https://genderdysphoria.fyi/en/physical-dysphoria"
      ]
    ]
  },
  {
    "id": "libido-changes-make-friendship-with-women-easier",
    "stages": ["transitioning"],
    "family": "sexual-responses-and-embodiment",
    "domain": "sexuality",
    "types": [
      "euphoric"
    ],
    "directions": [
      "transfeminine"
    ],
    "responses": [
      "relief",
      "ease",
      "reduced-pressure",
      "friendship",
      "gender-euphoria"
    ],
    "tags": [
      "libido-changes",
      "hrt",
      "female-friends",
      "friendship",
      "sexual-desire",
      "transfeminine"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Sexual Dysphoria",
        "https://genderdysphoria.fyi/en/sexual-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "UCSF Gender Affirming Health Program: Feminizing hormone therapy",
        "https://transcare.ucsf.edu/guidelines/feminizing-hormone-therapy",
        "Clinical guideline"
      ],
      [
        "ENIGI study: Sexual desire changes after hormone treatment",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC7207496/",
        "Research study"
      ]
    ]
  },
  {
    "id": "attraction-to-women-and-the-imposed-male-role",
    "stages": ["before-realization","questioning","self-recognized","disclosed","transitioning","established"],
    "family": "gendered-roles-in-intimacy-and-attraction",
    "domain": "sexuality",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "transfeminine",
      "transmasculine",
      "nonbinary"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      },
      {
        "direction": "nonbinary"
      }
    ],
    "responses": [
      "guilt",
      "shame",
      "self-monitoring",
      "misrecognition",
      "relief"
    ],
    "tags": [
      "attraction",
      "sexual-roles",
      "relationships",
      "sexuality",
      "misrecognition"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Sexual Dysphoria",
        "https://genderdysphoria.fyi/en/sexual-dysphoria"
      ]
    ]
  },
  {
    "id": "assigned-gender-compliments-feel-wrong",
    "stages": ["before-realization","questioning","self-recognized","disclosed","transitioning","established"],
    "family": "gender-recognition-and-evaluation",
    "domain": "social",
    "types": [
      "dysphoric"
    ],
    "directions": [
      "transfeminine",
      "transmasculine",
      "nonbinary"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      },
      {
        "direction": "nonbinary"
      }
    ],
    "responses": [
      "discomfort",
      "deflation",
      "irritation",
      "feeling-unseen"
    ],
    "tags": [
      "compliments",
      "handsome",
      "pretty",
      "beautiful",
      "gendered-language",
      "social-recognition"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Social Dysphoria",
        "https://genderdysphoria.fyi/en/social-dysphoria"
      ],
      [
        "TransNavi: 性別違和を知る",
        "https://transnavi.jp/dysphoria/"
      ]
    ]
  },
  {
    "id": "masturbation-that-affirms-a-feminine-self",
    "stages": ["before-realization","questioning","self-recognized","disclosed","transitioning","established"],
    "family": "sexual-responses-and-embodiment",
    "domain": "sexuality",
    "types": [
      "dysphoric",
      "euphoric",
      "preference"
    ],
    "directions": [
      "transfeminine",
      "transmasculine",
      "nonbinary"
    ],
    "variations": [
      {
        "direction": "transfeminine"
      },
      {
        "direction": "transmasculine"
      },
      {
        "direction": "nonbinary"
      }
    ],
    "responses": [
      "comfort",
      "embodiment",
      "pleasure",
      "gender-euphoria",
      "sexual-role-dysphoria",
      "avoidance"
    ],
    "tags": [
      "pornography",
      "sexual-media",
      "fantasy",
      "masturbation",
      "partnered-sex",
      "penetration",
      "touch",
      "anatomy",
      "sexual-role"
    ],
    "reportCount": 0,
    "reactionCount": 0,
    "sources": [
      [
        "Gender Dysphoria Bible: Sexual Dysphoria",
        "https://genderdysphoria.fyi/en/sexual-dysphoria"
      ],
      [
        "Gender Dysphoria Bible: Euphoria",
        "https://genderdysphoria.fyi/en/euphoria"
      ],
      [
        "Gender Euphoria Scale",
        "https://doi.org/10.1080/26895269.2024.2447768",
        "Questionnaire"
      ],
      [
        "Sexual behavior and sexual health of transgender adults before treatment",
        "https://pmc.ncbi.nlm.nih.gov/articles/PMC8118227/",
        "Research study"
      ],
      [
        "Transfeminine adolescents’ online sexual experiences",
        "https://www.frontiersin.org/journals/reproductive-health/articles/10.3389/frph.2022.1034747/full",
        "Qualitative study"
      ]
    ]
  }
];
