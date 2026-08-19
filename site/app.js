import { evidenceRanking, evidenceSamples } from "./approved-evidence.js";
import { claimSlugs } from "./claim-slugs.js";
import { referenceSources } from "./reference-sources.js";
import "./styles.css";

const GDB = "https://genderdysphoria.fyi/en";
const TRANSNAVI = "https://transnavi.jp/dysphoria/";

const claims = [
  {
    title: "Feeling ugly or unphotogenic in mirrors and photographs",
    summary: "A person may consistently dislike how they look, avoid photographs, and feel unattractive or unconfident regardless of how other people evaluate their appearance.",
    responses: ["low confidence", "feeling ugly", "photo avoidance", "self-criticism"],
    tags: ["mirrors", "photographs", "appearance", "confidence", "body image"],
    sources: [
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "The person in the mirror feels unfamiliar",
    summary: "A reflection, photograph, or recording may look like another person or fail to produce an ordinary sense of recognizing oneself.",
    responses: ["unfamiliarity", "detachment", "disbelief", "avoidance"],
    tags: ["mirrors", "photographs", "self-recognition", "depersonalization"],
    sources: [
      ["Gender Dysphoria Bible: Biochemical Dysphoria", `${GDB}/biochemical-dysphoria`],
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
    ],
  },
  {
    title: "Difficulty picturing or remembering your current body shape",
    summary: "The internal image of one’s body may feel vague, absent, outdated, or shaped differently from the body that appears in a mirror or photograph, making current proportions difficult to recall or imagine.",
    responses: ["blankness", "surprise", "outdated self-image", "uncertain body awareness"],
    tags: ["body image", "mental imagery", "body shape", "memory", "self-recognition", "body ownership"],
    patterns: [
      ["Vague or absent image", "Trying to picture the body can produce little detail or no stable image."],
      ["Outdated body image", "The remembered body may reflect an earlier stage of puberty, transition, weight, or presentation."],
      ["Unexpected reflection", "A mirror, photograph, or fitted garment may reveal proportions that do not match the internal image."],
      ["Different imagined shape", "The body may be imagined with curves, proportions, or sex characteristics that differ from its current form."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Biochemical Dysphoria", `${GDB}/biochemical-dysphoria`],
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
    ],
  },
  {
    title: "Avoiding seeing your own unclothed body",
    summary: "Seeing your own body while showering, changing clothes, or looking in a mirror can prompt you to look away, cover particular features, or finish quickly.",
    responses: ["looking away", "covering features", "dissociation", "avoidance"],
    tags: ["own body", "nudity", "showering", "dressing", "body avoidance"],
    sources: [
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Discomfort with other people seeing your body",
    summary: "Being seen undressed or in revealing clothing can feel intensely exposing, leading to covering up, avoiding changing rooms, or hiding particular parts of your body.",
    responses: ["covering up", "privacy", "changing-room avoidance", "anxiety"],
    tags: ["own body", "being seen", "nudity", "changing rooms", "body exposure"],
    sources: [
      ["TransNavi: 日常生活で困ったとき", "https://transnavi.jp/everyday/"],
    ],
  },
  {
    title: "Distress when your own body looks male or female",
    summary: "Looking at your own body can bring distress when its shape or sex characteristics make it appear male or female in a way that feels wrong.",
    responses: ["wrongness", "distress", "looking away", "wish for change"],
    tags: ["own body", "body perception", "sex characteristics", "mirrors", "gender incongruence"],
    variations: [
      { direction: "Transfeminine-associated", text: "Seeing a male-looking body when looking at yourself can feel painful or alien." },
      { direction: "Transmasculine-associated", text: "Seeing a female-looking body when looking at yourself can feel painful or alien." },
    ],
    sources: [
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Wanting to cover the bare upper torso despite being treated as male",
    summary: "Going topless can feel exposing or socially wrong even when other people permit or expect it, with particular discomfort around the nipples, chest, or being seen.",
    responses: ["modesty", "covering up", "anxiety", "preference for full-body swimwear"],
    tags: ["toplessness", "nipples", "chest", "swimming", "boymoding", "public exposure", "gendered social norms"],
    patterns: [
      ["Childhood onset", "Some people remember the discomfort from early childhood, before they had language for gender dysphoria."],
      ["Puberty onset", "Others describe being comfortable earlier and becoming unable to go topless around puberty."],
      ["Weaker over time", "Some people report that the feeling became less intense through familiarity or habituation while remaining present."],
      ["Persistent discomfort", "Other reports describe the discomfort continuing into adulthood or becoming stronger."],
      ["Ways of covering", "Swim shirts, rash guards, ordinary T-shirts, towels held above the chest, and avoiding swimming recur across reports."],
      ["Several possible influences", "Weight, body image, teasing, gynecomastia, sensory discomfort, and modesty can overlap with gender-related discomfort."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
    ],
  },
  {
    title: "Concealing chest development while boymoding",
    summary: "A developing chest may feel affirming in private while creating anxiety about visibility through shirts, changing clothes, swimming, or being seen by people who expect a male body.",
    responses: ["joy", "anxiety", "layering", "concealment", "protectiveness"],
    tags: ["breasts", "chest", "boymoding", "clothing", "silhouette", "public exposure"],
    sources: [
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
    ],
  },
  {
    title: "Minimizing or binding an unwanted chest",
    summary: "Compression, layering, posture, or clothing may be used to reduce the outline and physical awareness of breasts or chest tissue.",
    responses: ["relief", "compression", "concealment", "reduced body awareness"],
    tags: ["chest", "breasts", "binding", "compression", "silhouette"],
    sources: [
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
    ],
  },
  {
    title: "Discomfort with sex characteristics",
    summary: "Primary or secondary sex characteristics can feel unwanted, alien, overly noticeable, or difficult to acknowledge, especially during puberty or other bodily changes.",
    responses: ["wrongness", "revulsion", "persistent awareness", "wish for change"],
    tags: ["puberty", "anatomy", "chest", "genitals", "body hair"],
    patterns: [
      ["Anticipating puberty", "Learning that the voice, body shape, hair, chest, or genitals will change can bring fear or grief before the changes begin."],
      ["Changes during puberty", "A developing trait may feel like the loss of a familiar body or of a future that once seemed possible."],
      ["Persistent awareness", "A particular trait can repeatedly draw attention even when it causes little practical difficulty."],
      ["Avoidance", "A person may avoid touching, naming, seeing, or discussing the trait."],
      ["Praise and attention", "Positive comments about appearance, height, or athletic potential can draw more attention to a trait that already feels uncomfortable."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
      ["Gender Dysphoria Bible: Diagnosing Gender Dysphoria", `${GDB}/diagnoses`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Wanting an extreme body shape to change a gendered silhouette",
    summary: "A person may want to become very thin, fat, muscular, or slight because body composition can obscure unwanted traits, move away from an assigned-gender beauty standard, or create a silhouette that feels easier to inhabit.",
    responses: ["control", "concealment", "longing", "relief"],
    tags: ["weight", "thinness", "fatness", "muscularity", "body composition", "silhouette", "exercise", "beauty standards"],
    patterns: [
      ["Thinness", "A thinner body may be imagined as reducing curves, bulk, or other strongly gendered features."],
      ["Fatness", "A larger body may be imagined as softening outlines, redistributing attention, or obscuring particular features."],
      ["Muscularity", "Greater muscularity may feel affirming, may conceal other traits, or may serve as an intensified assigned-gender performance."],
      ["Less muscularity", "Avoiding muscle or wishing for a slighter build may reduce an unwanted masculine silhouette."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Managed Dysphoria — extreme exercise", `${GDB}/managed-dysphoria`],
    ],
  },
  {
    title: "Feeling detached from the body",
    summary: "The body may feel like an object being operated, a stranger’s body, or something that is difficult to care about or maintain.",
    responses: ["numbness", "neglect", "hyperfocus", "lack of ownership"],
    tags: ["depersonalization", "body ownership", "self-care", "detachment"],
    sources: [
      ["Gender Dysphoria Bible: Biochemical Dysphoria", `${GDB}/biochemical-dysphoria`],
      ["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`],
    ],
  },
  {
    title: "Discomfort presenting as the assigned gender",
    summary: "Clothing, hairstyles, grooming, mannerisms, or other forms of expression associated with one’s assigned gender can feel imposed or personally wrong.",
    responses: ["restriction", "discomfort", "self-consciousness", "wish for another expression"],
    tags: ["gender expression", "clothing", "hair", "grooming", "mannerisms"],
    patterns: [
      ["Ordinary gendered items", "Shorts, shoes, shirts, underwear, or grooming products can feel wrong because their styling signals an unwanted gender."],
      ["A delayed explanation", "The discomfort may first be attributed to fit, appearance, or personal taste. Its gendered pattern can become clear later."],
      ["More neutral alternatives", "Unisex, plain, or differently gendered items may feel easier to wear even when the practical differences are small."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Choosing plain clothes over improving an assigned-gender appearance",
    summary: "A person may care about fashion, visual design, or other people’s style while choosing plain, dark, quick, or deliberately unremarkable clothing and grooming for themselves because becoming more attractive in the assigned-gender role feels unrewarding or wrong.",
    responses: ["indifference", "low motivation", "avoidance", "deliberate plainness"],
    tags: ["plain clothing", "black clothing", "fashion", "grooming", "appearance", "boymoding", "girlmoding", "beauty standards"],
    sources: [
      ["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`],
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
      ["Gender Dysphoria Bible: Biochemical Dysphoria", `${GDB}/biochemical-dysphoria`],
    ],
  },
  {
    title: "Gravitating away from assigned-gender expectations",
    summary: "Toys, games, hobbies, play roles, friendships, or activities expected for one’s assigned gender may feel unappealing, while other forms of play and expression feel more natural.",
    responses: ["disinterest", "rejection", "affinity", "curiosity"],
    tags: ["toys", "play", "hobbies", "friends", "gender nonconformity", "childhood"],
    sources: [
      ["Gender Dysphoria Bible: Diagnosing Gender Dysphoria", `${GDB}/diagnoses`],
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
    ],
  },
  {
    title: "Discomfort being treated as the assigned gender",
    summary: "Gendered names, pronouns, honorifics, groupings, expectations, or forms of address can produce discomfort even before its cause is understood.",
    responses: ["irritation", "hurt", "disconnection", "withdrawal"],
    tags: ["misgendering", "pronouns", "name", "honorifics", "social roles"],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["Gender Dysphoria Bible: Diagnosing Gender Dysphoria", `${GDB}/diagnoses`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Gendered records can feel like inaccurate personal information",
    summary: "A name, photograph, sex marker, title, or gendered history in a form or account can feel inaccurate, making routine identification and disclosure unusually tense.",
    responses: ["privacy", "avoidance", "vigilance", "disconnection"],
    tags: ["personal information", "identity documents", "forms", "profiles", "name", "sex marker", "disclosure"],
    patterns: [
      ["Documents and accounts", "Identification, school or workplace records, medical forms, and online profiles may repeat an unwanted name, marker, or title."],
      ["Routine disclosure", "Introductions, registrations, and identity checks can feel exposing because they ask the person to present details that do not feel accurate."],
      ["Privacy and avoidance", "A person may reveal less information, postpone paperwork, or avoid settings where the record will be read aloud or compared with their appearance."],
      ["Correction brings relief", "Updating a name, photograph, marker, or form of address can make ordinary administrative tasks feel more manageable."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["TransNavi: 日常生活で困ったとき", "https://transnavi.jp/everyday/"],
    ],
  },
  {
    title: "Relief when one’s gender is recognized",
    summary: "A fitting name, pronoun, form of address, or social role can bring relief, happiness, calm, or an unexpectedly strong sense of being seen.",
    responses: ["relief", "joy", "calm", "recognition"],
    tags: ["gender euphoria", "pronouns", "name", "recognition", "relief"],
    patterns: [
      ["Names and forms of address", "A fitting name, pronoun, kinship term, or gendered title can produce an unexpectedly strong response."],
      ["Accidental recognition", "Being read as one’s gender can feel affirming even when the other person arrived at it by accident, ambiguity, or a mistaken assumption."],
      ["Being recognized online", "An avatar, voice, profile, or ordinary interaction may allow others to read the person in a way that feels natural."],
      ["Being included socially", "Recognition can come through being welcomed into a gendered group or activity without having to explain oneself."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Gender-policing insults can feel unexpectedly affirming",
    summary: "Harassment aimed at someone for failing assigned-gender expectations may land differently from how the aggressor intends. The hostility can hurt while the gendered implication brings private relief, recognition, or euphoria.",
    responses: ["mixed feelings", "indifference", "private relief", "gender euphoria"],
    tags: ["harassment", "gender policing", "insults", "slurs", "recognition", "assigned-gender pride", "language"],
    patterns: [
      ["The intended injury misses", "Being told that one is insufficiently masculine or feminine may cause little damage to the assigned-gender pride the insult was meant to target."],
      ["Hostile recognition", "Words intended as contempt may also imply that the person resembles, belongs to, or is moving toward their experienced gender."],
      ["Mixed response", "Fear, humiliation, anger, amusement, relief, and euphoria can occur together or change with the situation."],
      ["Later reinterpretation", "A person may only understand years later why a gendered insult felt less painful or more memorable than expected."],
      ["Language and culture", "The exact implication varies across languages, communities, and local ideas about masculinity, femininity, sexuality, and gender nonconformity."],
    ],
    variations: [
      { direction: "Transfeminine-associated", text: "Terms meaning girly, effeminate, sissy, not a man, 娘娘腔, or 女々しい, along with homophobic slurs aimed at feminine men, may feel unexpectedly neutral or affirming." },
      { direction: "Transmasculine-associated", text: "Terms meaning mannish, unfeminine, tomboyish, or not a woman may feel unexpectedly neutral or affirming." },
    ],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["Gender Dysphoria Bible: Societal Dysphoria", `${GDB}/societal-dysphoria`],
    ],
  },
  {
    title: "Relief from gender-affirming expression",
    summary: "Clothing, hair, makeup, grooming, movement, or styling that fits one’s gender can create comfort and make the reflected self feel more recognizable.",
    responses: ["comfort", "confidence", "recognition", "joy"],
    tags: ["gender euphoria", "clothing", "hair", "appearance", "self-recognition"],
    sources: [
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Choosing another gender in games and imagined roles",
    summary: "Avatars, role-playing, cosplay, fiction, or online identities can provide a recurring way to inhabit a gender different from the assigned one.",
    responses: ["comfort", "identification", "escape", "repetition"],
    tags: ["avatars", "video games", "role-play", "cosplay", "online identity"],
    patterns: [
      ["Childhood pretend play", "A child may repeatedly want a family role, character, or social position associated with another gender."],
      ["Games and avatars", "Choosing a character of another gender may feel more comfortable, interesting, or personally meaningful."],
      ["Online identity", "Profiles, names, icons, and voice chat can become a sustained place to live socially in another gender."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`],
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
    ],
  },
  {
    title: "Gender transformation stories feel unusually compelling",
    summary: "Stories, images, or fantasies about changing gender or developing different sex characteristics may hold recurring interest before a person understands why.",
    responses: ["fascination", "identification", "longing", "curiosity"],
    tags: ["transformation stories", "body change", "fantasy", "fiction", "self-recognition", "exploration"],
    patterns: [
      ["A complete transformation", "A sudden or gradual change into another gender can feel absorbing, comforting, or personally significant."],
      ["One changing trait", "Stories about a voice, chest, genitals, hair, or body shape changing may carry the same appeal."],
      ["Recurring private interest", "The person may repeatedly seek the theme while treating it as curiosity, fantasy, or a niche preference."],
      ["Later reinterpretation", "Gender self-recognition can clarify why the theme felt more personal than other fiction."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`],
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
    ],
  },
  {
    title: "Assigned-gender social roles feel performed",
    summary: "Socializing, dating, friendship, or intimacy in the expected gender role can feel rehearsed, effortful, false, or emotionally distant.",
    responses: ["effort", "distance", "masking", "exhaustion"],
    tags: ["masking", "social roles", "dating", "relationships", "performance"],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["Gender Dysphoria Bible: Sexual Dysphoria", `${GDB}/sexual-dysphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Being treated as same-gender friends can feel socially wrong",
    summary: "A cis person of one’s assigned gender may understand an interaction as ordinary same-gender friendship, while the trans or nonbinary person experiences a differently gendered social situation. Being alone together or included in an all-men or all-women group can then bring embarrassment, guilt, vigilance, or an unexplained date-like feeling.",
    responses: ["embarrassment", "guilt", "self-consciousness", "distance", "date-like feeling"],
    tags: ["friendship", "one-to-one interaction", "peer groups", "social roles", "boymoding", "girlmoding", "dating scripts", "belonging"],
    patterns: [
      ["Two readings of the same interaction", "The friend may experience an ordinary same-gender bond while the trans person internally experiences a woman-with-man, man-with-woman, or otherwise differently gendered encounter."],
      ["A date-like feeling without attraction", "Being alone together can feel unusually intimate, improper, or similar to dating even when neither person is pursuing a relationship."],
      ["Feeling distinct within the group", "In an all-men or all-women setting, the person may feel conspicuously different despite behaving like everyone else and being accepted as part of the group."],
      ["Unexplained guilt or embarrassment", "The mismatch may create a sense of crossing an unnamed social boundary, concealing something important, or occupying a place that does not fit."],
      ["Orientation does not determine the response", "The feeling can occur with people outside one’s pattern of attraction because it concerns social gender and relationship framing."],
    ],
    variations: [
      { direction: "Transfeminine-associated", text: "A cis man may treat a boymoding transfeminine person as one of the bros, while she experiences herself as a woman alone with a man or as the only woman in a male group." },
      { direction: "Transmasculine-associated", text: "A cis woman may treat a girlmoding transmasculine person as another woman, while he experiences himself as a man alone with a woman or as the only man in a female group." },
      { direction: "Nonbinary-associated", text: "A binary peer group may treat a nonbinary person as an ordinary member of the assigned-gender group, while the person experiences their presence and relationships through a different social position." },
    ],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["Gender Dysphoria Bible: Sexual Dysphoria", `${GDB}/sexual-dysphoria`],
    ],
  },
  {
    title: "Overperforming the assigned gender",
    summary: "Some people intensify masculinity or femininity associated with their assigned gender in an attempt to suppress recurring gender feelings or make the role feel convincing.",
    responses: ["overcompensation", "control", "repression", "self-surveillance"],
    tags: ["overcompensation", "masking", "denial", "gender roles"],
    sources: [
      ["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`],
    ],
  },
  {
    title: "Preferring clothing that hides the body’s silhouette",
    summary: "Loose, oversized, layered, soft, or baggy clothing—often hoodies and sweatpants—can feel safer because it keeps fabric from outlining unwanted body characteristics.",
    responses: ["safety", "concealment", "relief", "reduced body awareness"],
    tags: ["oversized clothing", "hoodies", "silhouette", "body shape", "coping"],
    sources: [
      ["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`],
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
    ],
  },
  {
    title: "The voice feels unlike oneself",
    summary: "Speaking or hearing a recording can feel jarring when vocal pitch, resonance, speech patterns, or gendered interpretation conflict with one’s sense of self.",
    responses: ["jarring recognition", "avoidance", "embarrassment", "wish for change"],
    tags: ["voice", "recordings", "speech", "self-recognition"],
    sources: [
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Grief for experiences lived in the wrong gender role",
    summary: "Looking back can bring grief about childhood, adolescence, relationships, ceremonies, or ordinary experiences that felt unavailable in one’s gender.",
    responses: ["grief", "loss", "envy", "wish to recreate experiences"],
    tags: ["hindsight", "grief", "childhood", "adolescence", "missed experiences"],
    patterns: [
      ["Childhood and school life", "Friendships, uniforms, play, school events, and ordinary growing-up experiences may feel missing or misremembered."],
      ["Relationships", "A person may grieve friendships, romance, or family roles they could not experience in a fitting gender."],
      ["Trying to recover an experience", "Clothing, celebrations, photographs, or shared activities may be used to revisit something that felt unavailable earlier."],
      ["Late recognition", "Understanding the pattern later can bring regret about years spent adapting to an unwanted role."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Existential Dysphoria", `${GDB}/existential-dysphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Returning to gendered childhood interests later in life",
    summary: "Toys, colors, clothes, decorations, or hobbies associated with one’s gender may hold unusual appeal later in life, especially when they were wanted and unavailable during childhood.",
    responses: ["delight", "nostalgia", "longing", "collecting"],
    tags: ["childhood", "toys", "plush toys", "dolls", "colors", "children’s fashion", "collecting", "missed experiences"],
    patterns: [
      ["Missed access", "Family rules, embarrassment, bullying, or gendered marketing may have kept a wanted item or activity out of reach."],
      ["Returning later", "Buying, collecting, wearing, or displaying these things later can provide a delayed version of the childhood experience."],
      ["Gender affirmation", "The item may affirm a gendered sense of self as well as satisfy an aesthetic preference."],
      ["Several possible meanings", "Gender, nostalgia, comfort, collecting, and ordinary personal taste can all contribute to the attachment."],
    ],
    variations: [
      { direction: "Transfeminine-associated", text: "Plush toys, dolls such as Barbie, pink or cute items, accessories, and girls’ or children’s fashion may become especially appealing." },
      { direction: "Transmasculine-associated", text: "Items marketed to boys, action toys, vehicles, sports or adventure themes, and boys’ clothing may become especially appealing." },
    ],
    sources: [
      ["Gender Dysphoria Bible: Existential Dysphoria", `${GDB}/existential-dysphoria`],
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
    ],
  },
  {
    title: "Fear of growing older in the assigned gender",
    summary: "Imagining a future as an older man or woman of the assigned gender can feel frightening, unbearable, or impossible to identify with.",
    responses: ["fear", "dread", "disbelief", "future avoidance"],
    tags: ["aging", "future self", "assigned gender", "anticipation", "identity"],
    patterns: [
      ["A gendered future self", "The distress may center on becoming an older man or woman and the gendered life attached to that future."],
      ["Future avoidance", "Long-term plans can feel unreal or difficult to make when every available future assumes the assigned gender."],
      ["Further masculinization or feminization", "Expected changes in voice, hair, face, body composition, or social role may intensify the fear."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Existential Dysphoria", `${GDB}/existential-dysphoria`],
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
    ],
  },
  {
    title: "Fear that transition began too late",
    summary: "Starting transition after puberty or later in adulthood can bring anxiety that earlier bodily changes have placed desired embodiment or social recognition out of reach.",
    responses: ["regret", "anxiety", "hopelessness", "urgency"],
    tags: ["delayed transition", "age", "puberty", "passing", "regret", "body changes"],
    patterns: [
      ["Traits that feel fixed", "Height, skeletal frame, voice, hair, facial features, or other changes may be experienced as permanent barriers."],
      ["Hopelessness causes delay", "Low expectations about transition can postpone action and deepen later regret."],
      ["Relief mixed with grief", "Transition may improve daily life while grief about timing and unchanged traits remains active."],
      ["Recognition anxiety", "Fear may center on whether other people will ever recognize the person’s gender consistently."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Existential Dysphoria", `${GDB}/existential-dysphoria`],
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
    ],
  },
  {
    title: "Wanting to belong among peers of another gender",
    summary: "Friendship groups associated with another gender may feel like the place where a person expects to belong, making gender-based exclusion especially painful.",
    responses: ["belonging", "longing", "exclusion", "recognition"],
    tags: ["friendship", "peer groups", "belonging", "exclusion", "social gender"],
    patterns: [
      ["Ordinary friendship", "The longing may concern everyday conversation and companionship without romantic or sexual interest."],
      ["Being kept outside", "Exclusion can hurt because it confirms that others place the person in an unwanted gender category."],
      ["Being welcomed", "Inclusion as an ordinary member of the group can create recognition and ease."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["Gender Dysphoria Bible: Existential Dysphoria", `${GDB}/existential-dysphoria`],
    ],
  },
  {
    title: "Seeking friendship with gender peers is mistaken for romantic interest",
    summary: "Attempts to build ordinary friendships with people of one’s gender can be interpreted as romantic or sexual interest when others perceive the person as another gender.",
    responses: ["misrecognition", "wariness", "exclusion", "loneliness"],
    tags: ["friendship", "peer groups", "romantic assumptions", "social gender", "misrecognition"],
    patterns: [
      ["Ordinary friendship", "The person may want conversation, companionship, and the everyday camaraderie shared among gender peers."],
      ["Romantic assumptions", "Others may read friendliness or an attempt at closeness through the romantic role associated with the gender they perceive."],
      ["Across sexual orientations", "The experience can occur regardless of the person’s sexual orientation or attraction to the people involved."],
      ["Barriers to peer belonging", "Romantic assumptions can prevent the ordinary peer relationship the person hoped to form."],
    ],
    variations: [
      { direction: "Transfeminine-associated", text: "Friendship toward women may be read as male romantic or sexual pursuit, leading to caution or distance." },
      { direction: "Transmasculine-associated", text: "Friendship toward men may be read as female romantic or sexual availability, leading to flirting, pursuit, or different treatment." },
    ],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["Gender Dysphoria Bible: Existential Dysphoria", `${GDB}/existential-dysphoria`],
    ],
  },
  {
    title: "Feeling able to move forward after recognizing your gender",
    summary: "Recognizing or accepting one’s gender can bring release, increased energy, and renewed interest in plans, relationships, or self-expression.",
    responses: ["release", "energy", "continuity", "motivation"],
    tags: ["self-recognition", "acceptance", "relief", "life planning", "gender euphoria"],
    patterns: [
      ["A release of effort", "Dropping an assigned-gender performance can free attention and energy that had been spent maintaining it."],
      ["Life feels continuous", "Past experiences and the present may begin to form a more coherent personal history."],
      ["Earlier distress becomes legible", "Depression, avoidance, body discomfort, or relationship difficulties may acquire a clearer explanation in hindsight."],
      ["Plans become imaginable", "Appearance, relationships, creative work, and longer-term plans may start to feel personally relevant."],
      ["Grief alongside relief", "Relief can coexist with sadness about delayed recognition or missed time."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
      ["Gender Dysphoria Bible: Existential Dysphoria", `${GDB}/existential-dysphoria`],
    ],
  },
  {
    title: "Clothing fit makes body shape more noticeable",
    summary: "Cuts designed around masculine or feminine proportions can intensify awareness of the waist, hips, chest, shoulders, crotch, or overall silhouette.",
    responses: ["wrongness", "sensory discomfort", "avoidance", "relief with another cut"],
    tags: ["clothing fit", "jeans", "silhouette", "proportions", "body awareness"],
    sources: [["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`]],
  },
  {
    title: "Controlling gendered body hair",
    summary: "Shaving, growing, refusing to shave, or meticulously grooming facial and body hair can become a repeated way to reduce discomfort or control presentation.",
    responses: ["relief", "compulsion", "control", "affirmation"],
    tags: ["body hair", "facial hair", "shaving", "grooming", "presentation"],
    sources: [
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
      ["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`],
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
    ],
  },
  {
    title: "Hair length or hairstyle carries unusual importance",
    summary: "Growing, cutting, or styling hair can feel like a rare available route toward gender expression, sometimes accompanied by elaborate practical excuses.",
    responses: ["longing", "relief", "fear", "self-recognition"],
    tags: ["hair", "haircut", "gender expression", "coping"],
    patterns: [
      ["Growing or preserving length", "Hair length may become one of the few controllable ways to move toward a desired appearance."],
      ["An early moment of euphoria", "Seeing or feeling a more fitting length or style can produce a memorable sense of recognition before the person has language for it."],
      ["Difficulty stating the request", "A person may know the style they want yet struggle to describe it to a barber, stylist, or family member."],
      ["A gendered result", "A technically good haircut can still feel upsetting when it is praised in an unwanted gendered way."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`],
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
    ],
  },
  {
    title: "Identifying strongly with characters of another gender",
    summary: "Characters who share one’s experienced gender or break expected gender roles may feel unusually relatable, important, or emotionally absorbing.",
    responses: ["identification", "longing", "comfort", "vicarious experience"],
    tags: ["fiction", "film", "literature", "characters", "identification"],
    sources: [["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`]],
  },
  {
    title: "Feeling aligned with a gender’s concerns before recognizing it as your own",
    summary: "Before recognizing their gender, a person may feel a personal stake in the experiences, rights, or social treatment of people of that gender and understand the sense of belonging only in hindsight.",
    responses: ["empathy", "solidarity", "belonging", "retrospective recognition"],
    tags: ["advocacy", "feminism", "gender politics", "belonging", "self-recognition"],
    patterns: [
      ["Personal resonance", "Accounts of another gender’s experiences may feel personally relevant before the person understands why."],
      ["Advocacy and solidarity", "The person may become invested in rights, social issues, or advocacy associated with that gender."],
      ["Recognition in hindsight", "Recognizing one’s gender can give an earlier sense of identification or belonging a clearer context."],
      ["Empathy across genders", "Feminism, advocacy, and empathy are common across genders; this experience includes an additional sense of personal identification or belonging."],
    ],
    variations: [
      { direction: "Transfeminine-associated", text: "An AMAB person may identify strongly with women’s perspectives or feminism and later understand that investment as partly connected to being a woman." },
      { direction: "Transmasculine-associated", text: "An AFAB person may identify strongly with boys’ or men’s perspectives and later understand that investment as partly connected to being a man." },
    ],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["Gender Dysphoria Bible: Existential Dysphoria", `${GDB}/existential-dysphoria`],
    ],
  },
  {
    title: "Living through another person’s presentation",
    summary: "Shopping, styling, or choosing clothes for a partner or friend can provide indirect access to forms of gender expression that feel unavailable personally.",
    responses: ["vicarious joy", "longing", "expertise", "envy"],
    tags: ["shopping", "styling", "partners", "vicarious experience", "clothing"],
    sources: [["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`]],
  },
  {
    title: "Envy blends appearance, identity, and attraction",
    summary: "Admiration or attraction toward another person can be difficult to separate from wanting their body, clothing, social position, or way of being gendered.",
    responses: ["envy", "admiration", "attraction", "longing", "confusion"],
    tags: ["envy", "attraction", "appearance", "identification"],
    sources: [
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
      ["Gender Dysphoria Bible: Sexual Dysphoria", `${GDB}/sexual-dysphoria`],
    ],
  },
  {
    title: "Social withdrawal reduces gendered exposure",
    summary: "Avoiding gatherings, relationships, photographs, or public attention can reduce situations where the body, name, presentation, or assigned social role becomes salient.",
    responses: ["avoidance", "isolation", "temporary relief", "loneliness"],
    tags: ["social withdrawal", "isolation", "avoidance", "coping"],
    sources: [["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`]],
  },
  {
    title: "Keeping an online identity separate until gender disclosure feels safe",
    summary: "A person may conceal their gender, voice, name, appearance, or preferences online, even from close friends, and later feel relief in connecting that identity with their offline self after recognition or transition.",
    responses: ["privacy", "anxiety", "concealment", "relief", "openness"],
    tags: ["online identity", "privacy", "disclosure", "voice chat", "names", "transition"],
    patterns: [
      ["A minimally gendered presence", "Usernames, profiles, avatars, pronouns, and personal details may be chosen to reveal little about gender."],
      ["Voice and image avoidance", "Voice chat, video calls, photographs, and recordings may be avoided because they expose gendered characteristics."],
      ["Privacy with close friends", "Long-standing online friends may know little about the person’s name, voice, appearance, or gender."],
      ["Separate identities", "Accounts and social circles may be kept apart to prevent online activity from being connected with the person’s offline identity."],
      ["Openness after recognition or transition", "A fitting name, voice, appearance, or social role can make sharing profiles and connecting identities feel safer and more comfortable."],
      ["Privacy and safety", "Online privacy can protect against harassment, outing, and unwanted traceability. The gender-related experience centers recurring concern about exposing gendered information."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
      ["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`],
    ],
  },
  {
    title: "Constant activity keeps gender feelings out of awareness",
    summary: "Work, hobbies, games, media, cleaning, sleep, or substance use can fill idle time and postpone attention to recurring gender-related feelings.",
    responses: ["distraction", "numbing", "escape", "exhaustion"],
    tags: ["overwork", "hobbies", "gaming", "sleep", "coping"],
    sources: [["Gender Dysphoria Bible: Managed Dysphoria", `${GDB}/managed-dysphoria`]],
  },
  {
    title: "Gender-related feelings fluctuate in intensity",
    summary: "The same mirror image, body feature, social interaction, or form of address may feel manageable on one day and sharply distressing or affirming on another.",
    responses: ["fluctuation", "uncertainty", "temporary relief", "sudden distress"],
    tags: ["fluctuation", "intensity", "genderfluidity", "daily variation"],
    sources: [["Gender Dysphoria Bible: Biochemical Dysphoria", `${GDB}/biochemical-dysphoria`]],
  },
  {
    title: "Gender expression becomes less deliberate over time",
    summary: "Early in transition, a person may closely follow gendered norms to affirm themselves, learn unfamiliar forms of presentation, or help other people recognize their gender. As recognition and familiarity increase, expression may become more relaxed and personal.",
    responses: ["effort", "experimentation", "familiarity", "ease"],
    tags: ["transition", "gender expression", "adaptation", "passing", "social recognition", "preferences", "gender roles"],
    patterns: [
      ["Strong early conformity", "Clothing, makeup, voice, posture, mannerisms, or social roles may initially lean toward highly recognizable femininity, masculinity, or androgyny."],
      ["Learning through emphasis", "Deliberate practice can help a person explore what feels right and learn skills they had little chance to develop earlier."],
      ["Recognition and safety", "Clear gender cues may reduce misgendering or make identity easier to communicate during an uncertain period."],
      ["Increasing ease", "Expression can require less monitoring as it becomes familiar and other people recognize the person more consistently."],
      ["Preferences may shift", "Styles or roles that once felt essential may lose importance, while casual, mixed, or gender-nonconforming preferences become easier to follow."],
      ["Ordinary variation", "Over time, preferences may resemble the broad range found among cis peers of the same gender, including little interest in gendered presentation."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Presentational Dysphoria", `${GDB}/presentational-dysphoria`],
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
    ],
  },
  {
    title: "Intimacy feels different when gendered roles align",
    summary: "Attraction, dating, touch, sex, or partnership can feel uncomfortable under an assigned-gender role and comfortable or exciting when one’s gender is recognized.",
    responses: ["disconnection", "shame", "relief", "desire", "embodiment"],
    tags: ["intimacy", "dating", "sexuality", "relationships", "gender roles"],
    sources: [
      ["Gender Dysphoria Bible: Sexual Dysphoria", `${GDB}/sexual-dysphoria`],
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
    ],
  },
  {
    title: "Withdrawing when a promising date becomes real",
    summary: "Someone may want companionship and enjoy a date, then abruptly disengage when mutual interest makes being desired, touched, partnered, or expected to act in an assigned-gender role feel wrong for reasons they cannot yet explain.",
    responses: ["withdrawal", "confusion", "avoidance", "loss of interest"],
    tags: ["dating", "romance", "mutual attraction", "being desired", "intimacy", "assigned-gender roles"],
    patterns: [
      ["Interest before reciprocation", "Attraction or anticipation can feel comfortable until the other person responds romantically."],
      ["Leaving a good situation", "The person may step away despite liking the date and seeing no obvious problem with the other person."],
      ["Assigned-gender expectations", "Being cast as a boyfriend, girlfriend, man, or woman in the relationship can make the next step feel alien."],
      ["Body and intimacy becoming salient", "The prospect of touch, sex, or being closely seen may bring previously diffuse discomfort into focus."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Sexual Dysphoria", `${GDB}/sexual-dysphoria`],
    ],
  },
  {
    title: "Body changes can create recognition and relief",
    summary: "Changes in shape, skin, hair, voice, chest, or other characteristics may make the body feel more familiar, inhabitable, or personally meaningful.",
    responses: ["recognition", "relief", "joy", "increased body ownership"],
    tags: ["gender euphoria", "body changes", "self-recognition", "body ownership"],
    patterns: [
      ["Small changes are noticeable", "Skin texture, scent, facial shape, hair, chest tissue, or sexual response can matter before other people notice a difference."],
      ["A more familiar reflection", "The face or body may begin to look recognizable even while some traits remain distressing."],
      ["Greater care for the body", "A growing sense of ownership can make grooming, clothing, movement, or health feel personally worthwhile."],
      ["Uneven timing", "Different traits change at different rates, producing relief, impatience, and uncertainty during the same period."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
    ],
  },
  {
    title: "Seeing oneself can shift from alienation to recognition",
    summary: "A reflection or photograph that once felt alien may become recognizable or joyful when presentation or the body aligns more closely with one’s gender.",
    responses: ["alienation", "surprise", "recognition", "joy"],
    tags: ["mirrors", "photographs", "gender euphoria", "self-recognition"],
    sources: [
      ["Gender Dysphoria Bible: Biochemical Dysphoria", `${GDB}/biochemical-dysphoria`],
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
    ],
  },
  {
    title: "Libido or involuntary arousal feels alien or unwanted",
    summary: "Sexual drive, spontaneous arousal, or visible genital response can feel intrusive, upsetting, or disconnected from one’s actual wishes and sense of self.",
    responses: ["revulsion", "shame", "loss of control", "body alienation", "avoidance"],
    tags: ["libido", "arousal", "genital response", "body reaction", "sexuality"],
    patterns: [
      ["Desire feels wrongly gendered", "Sexual desire may be interpreted through an unwanted masculine, feminine, or anatomical role."],
      ["Deliberate suppression", "A person may avoid initiating, expressing attraction, or acting on consensual desire because the expected role feels wrong."],
      ["Desire and body response diverge", "Attraction may feel genuine while arousal, genital response, or the role attached to it feels alien."],
      ["A change can bring relief", "Changes in libido or spontaneous arousal during transition may reduce a repeated source of distress."],
    ],
    sources: [
      ["Gender Dysphoria Bible: Sexual Dysphoria", `${GDB}/sexual-dysphoria`],
      ["Gender Dysphoria Bible: Physical Dysphoria", `${GDB}/physical-dysphoria`],
    ],
  },
  {
    title: "Attraction to women feels contaminated by an imposed male role",
    summary: "A transfeminine person may genuinely be attracted to women while feeling guilt, shame, or disgust when friendship and attraction are interpreted through male libido or the male gaze.",
    responses: ["guilt", "shame", "fear of objectifying", "self-monitoring", "relief in a sapphic role"],
    tags: ["gynephilia", "female friends", "male gaze", "libido", "sapphic attraction", "sexual roles"],
    sources: [["Gender Dysphoria Bible: Sexual Dysphoria", `${GDB}/sexual-dysphoria`]],
  },
  {
    title: "Assigned-gender compliments feel uncomfortable",
    summary: "Praise can feel unpleasant or alienating when it celebrates traits associated with the gender assigned to a person rather than the gender they experience.",
    responses: ["discomfort", "deflation", "irritation", "feeling unseen"],
    variations: [
      { direction: "Transfeminine-associated", text: "Compliments such as handsome, manly, or a fine young man may feel wrong." },
      { direction: "Transmasculine-associated", text: "Compliments such as pretty, beautiful, cute, girly, or ladylike may feel wrong." },
    ],
    tags: ["compliments", "handsome", "pretty", "beautiful", "gendered language", "social recognition"],
    sources: [
      ["Gender Dysphoria Bible: Social Dysphoria", `${GDB}/social-dysphoria`],
      ["TransNavi: 性別違和を知る", TRANSNAVI],
    ],
  },
  {
    title: "Preferring masturbation that affirms a feminine sense of self",
    summary: "Some transfeminine people prefer fantasies, language, touch, positions, toys, or ways of understanding their anatomy that let them experience masturbation from a feminine or female perspective.",
    responses: ["relief", "embodiment", "pleasure", "gender euphoria", "avoidance of male-coded methods"],
    tags: ["masturbation", "solitary sexuality", "fantasy", "touch", "anatomy", "sexual role"],
    sources: [
      ["Gender Dysphoria Bible: Sexual Dysphoria", `${GDB}/sexual-dysphoria`],
      ["Gender Dysphoria Bible: Euphoria", `${GDB}/euphoria`],
    ],
  },
];


const experienceTypes = {
  Dysphoric: [
    "Feeling ugly or unphotogenic in mirrors and photographs",
    "The person in the mirror feels unfamiliar",
    "Difficulty picturing or remembering your current body shape",
    "Avoiding seeing your own unclothed body",
    "Discomfort with other people seeing your body",
    "Distress when your own body looks male or female",
    "Wanting to cover the bare upper torso despite being treated as male",
    "Concealing chest development while boymoding",
    "Minimizing or binding an unwanted chest",
    "Discomfort with sex characteristics",
    "Wanting an extreme body shape to change a gendered silhouette",
    "Feeling detached from the body",
    "Discomfort presenting as the assigned gender",
    "Choosing plain clothes over improving an assigned-gender appearance",
    "Discomfort being treated as the assigned gender",
    "Gendered records can feel like inaccurate personal information",
    "Gender-policing insults can feel unexpectedly affirming",
    "Assigned-gender compliments feel uncomfortable",
    "Assigned-gender social roles feel performed",
    "Being treated as same-gender friends can feel socially wrong",
    "The voice feels unlike oneself",
    "Grief for experiences lived in the wrong gender role",
    "Returning to gendered childhood interests later in life",
    "Fear of growing older in the assigned gender",
    "Fear that transition began too late",
    "Wanting to belong among peers of another gender",
    "Seeking friendship with gender peers is mistaken for romantic interest",
    "Clothing fit makes body shape more noticeable",
    "Envy blends appearance, identity, and attraction",
    "Social withdrawal reduces gendered exposure",
    "Keeping an online identity separate until gender disclosure feels safe",
    "Gender-related feelings fluctuate in intensity",
    "Intimacy feels different when gendered roles align",
    "Withdrawing when a promising date becomes real",
    "Libido or involuntary arousal feels alien or unwanted",
    "Attraction to women feels contaminated by an imposed male role",
  ],
  Euphoric: [
    "Concealing chest development while boymoding",
    "Relief when one’s gender is recognized",
    "Gender-policing insults can feel unexpectedly affirming",
    "Relief from gender-affirming expression",
    "Controlling gendered body hair",
    "Hair length or hairstyle carries unusual importance",
    "Choosing another gender in games and imagined roles",
    "Intimacy feels different when gendered roles align",
    "Body changes can create recognition and relief",
    "Seeing oneself can shift from alienation to recognition",
    "Returning to gendered childhood interests later in life",
    "Wanting to belong among peers of another gender",
    "Feeling able to move forward after recognizing your gender",
    "Keeping an online identity separate until gender disclosure feels safe",
    "Preferring masturbation that affirms a feminine sense of self",
  ],
  Preference: [
    "Gravitating away from assigned-gender expectations",
    "Preferring clothing that hides the body’s silhouette",
    "Wanting an extreme body shape to change a gendered silhouette",
    "Choosing plain clothes over improving an assigned-gender appearance",
    "Controlling gendered body hair",
    "Hair length or hairstyle carries unusual importance",
    "Choosing another gender in games and imagined roles",
    "Gender transformation stories feel unusually compelling",
    "Identifying strongly with characters of another gender",
    "Feeling aligned with a gender’s concerns before recognizing it as your own",
    "Living through another person’s presentation",
    "Returning to gendered childhood interests later in life",
    "Wanting to belong among peers of another gender",
    "Preferring masturbation that affirms a feminine sense of self",
  ],
  "Avoidance or control": [
    "Avoiding seeing your own unclothed body",
    "Discomfort with other people seeing your body",
    "Distress when your own body looks male or female",
    "Wanting to cover the bare upper torso despite being treated as male",
    "Concealing chest development while boymoding",
    "Minimizing or binding an unwanted chest",
    "Wanting an extreme body shape to change a gendered silhouette",
    "Feeling detached from the body",
    "Overperforming the assigned gender",
    "Preferring clothing that hides the body’s silhouette",
    "Choosing plain clothes over improving an assigned-gender appearance",
    "Controlling gendered body hair",
    "Social withdrawal reduces gendered exposure",
    "Keeping an online identity separate until gender disclosure feels safe",
    "Gendered records can feel like inaccurate personal information",
    "Fear that transition began too late",
    "Being treated as same-gender friends can feel socially wrong",
    "Withdrawing when a promising date becomes real",
    "Constant activity keeps gender feelings out of awareness",
  ],
  Adaptation: [
    "Gender expression becomes less deliberate over time",
  ],
};

const experienceFamilies = [
  {
    title: "Body image and self-recognition",
    titles: [
      "Feeling ugly or unphotogenic in mirrors and photographs",
      "The person in the mirror feels unfamiliar",
      "Difficulty picturing or remembering your current body shape",
      "Distress when your own body looks male or female",
      "Feeling detached from the body",
      "Seeing oneself can shift from alienation to recognition",
      "Avoiding seeing your own unclothed body",
    ],
  },
  {
    title: "Bodily privacy and visibility to others",
    titles: [
      "Discomfort with other people seeing your body",
      "Wanting to cover the bare upper torso despite being treated as male",
      "Concealing chest development while boymoding",
    ],
  },
  {
    title: "Gendered body traits and changes",
    titles: [
      "Discomfort with sex characteristics",
      "Wanting an extreme body shape to change a gendered silhouette",
      "The voice feels unlike oneself",
      "Body changes can create recognition and relief",
    ],
  },
  {
    title: "Clothing and body silhouette",
    titles: [
      "Minimizing or binding an unwanted chest",
      "Preferring clothing that hides the body’s silhouette",
      "Clothing fit makes body shape more noticeable",
    ],
  },
  {
    title: "Hair and grooming",
    titles: [
      "Controlling gendered body hair",
      "Hair length or hairstyle carries unusual importance",
    ],
  },
  {
    title: "Gender expression and assigned expectations",
    titles: [
      "Discomfort presenting as the assigned gender",
      "Choosing plain clothes over improving an assigned-gender appearance",
      "Gravitating away from assigned-gender expectations",
      "Relief from gender-affirming expression",
    ],
  },
  {
    title: "Gender recognition and evaluation",
    titles: [
      "Discomfort being treated as the assigned gender",
      "Gendered records can feel like inaccurate personal information",
      "Relief when one’s gender is recognized",
      "Gender-policing insults can feel unexpectedly affirming",
      "Assigned-gender compliments feel uncomfortable",
      "Wanting to belong among peers of another gender",
      "Seeking friendship with gender peers is mistaken for romantic interest",
      "Keeping an online identity separate until gender disclosure feels safe",
    ],
  },
  {
    title: "Assigned-gender roles and performance",
    titles: [
      "Assigned-gender social roles feel performed",
      "Being treated as same-gender friends can feel socially wrong",
      "Overperforming the assigned gender",
    ],
  },
  {
    title: "Exploring gender through imagination and identification",
    titles: [
      "Choosing another gender in games and imagined roles",
      "Gender transformation stories feel unusually compelling",
      "Identifying strongly with characters of another gender",
      "Living through another person’s presentation",
      "Envy blends appearance, identity, and attraction",
    ],
  },
  {
    title: "Suppressing or avoiding gender awareness",
    titles: [
      "Social withdrawal reduces gendered exposure",
      "Constant activity keeps gender feelings out of awareness",
    ],
  },
  {
    title: "Understanding gender across time",
    titles: [
      "Grief for experiences lived in the wrong gender role",
      "Returning to gendered childhood interests later in life",
      "Fear of growing older in the assigned gender",
      "Fear that transition began too late",
      "Gender-related feelings fluctuate in intensity",
      "Gender expression becomes less deliberate over time",
      "Feeling able to move forward after recognizing your gender",
      "Feeling aligned with a gender’s concerns before recognizing it as your own",
    ],
  },
  {
    title: "Gendered roles in intimacy and attraction",
    titles: [
      "Intimacy feels different when gendered roles align",
      "Withdrawing when a promising date becomes real",
      "Attraction to women feels contaminated by an imposed male role",
    ],
  },
  {
    title: "Sexual responses and embodiment",
    titles: [
      "Libido or involuntary arousal feels alien or unwanted",
      "Preferring masturbation that affirms a feminine sense of self",
    ],
  },
];

const domains = [
  {
    title: "Body",
    families: [
      "Body image and self-recognition",
      "Bodily privacy and visibility to others",
      "Gendered body traits and changes",
    ],
  },
  {
    title: "Social",
    families: [
      "Gender recognition and evaluation",
      "Assigned-gender roles and performance",
    ],
  },
  {
    title: "Presentation",
    families: [
      "Clothing and body silhouette",
      "Hair and grooming",
      "Gender expression and assigned expectations",
    ],
  },
  {
    title: "Self-understanding",
    families: [
      "Exploring gender through imagination and identification",
      "Suppressing or avoiding gender awareness",
      "Understanding gender across time",
    ],
  },
  {
    title: "Sexuality",
    families: [
      "Gendered roles in intimacy and attraction",
      "Sexual responses and embodiment",
    ],
  },
];

const transfeminineAssociated = new Set([
  "Wanting to cover the bare upper torso despite being treated as male",
  "Concealing chest development while boymoding",
  "Libido or involuntary arousal feels alien or unwanted",
  "Attraction to women feels contaminated by an imposed male role",
  "Preferring masturbation that affirms a feminine sense of self",
]);
const transmasculineAssociated = new Set(["Minimizing or binding an unwanted chest"]);

for (const claim of claims) {
  claim.slug = claimSlugs[claim.title];
  if (!claim.slug) throw new Error(`Missing slug for: ${claim.title}`);
  claim.family = experienceFamilies.find((family) => family.titles.includes(claim.title))?.title ?? "Other experiences";
  claim.domain = domains.find((domain) => domain.families.includes(claim.family))?.title ?? "Other";
  claim.types = Object.entries(experienceTypes)
    .filter(([, titles]) => titles.includes(claim.title))
    .map(([type]) => type);
  claim.directions = claim.variations
    ? claim.variations.map((variation) => variation.direction)
    : transfeminineAssociated.has(claim.title)
    ? ["Transfeminine-associated"]
    : transmasculineAssociated.has(claim.title)
      ? ["Transmasculine-associated"]
      : ["Cross-directional"];
  claim.reportCount = evidenceRanking[claim.title] ?? 0;
  for (const source of (referenceSources[claim.title] ?? [])) {
    if (!claim.sources.some(([, existingUrl]) => existingUrl === source[1])) claim.sources.push(source);
  }
  for (const sample of (evidenceSamples[claim.title] ?? [])) {
    if (!claim.sources.some(([, existingUrl]) => existingUrl === sample.url)) {
      const author = sample.handle ? `${sample.author} (@${sample.handle})` : sample.author;
      const relation = sample.relation ? ` · ${sample.relation}` : "";
      claim.sources.push([`${author}: ${sample.excerpt}`, sample.url, `Community report${relation}`]);
    }
  }
}

const cards = document.querySelector("#cards");
const search = document.querySelector("#search");
const count = document.querySelector("#result-count");
const empty = document.querySelector("#empty");
const domainTabs = document.querySelector("#domain-tabs");
const activeFiltersElement = document.querySelector("#active-filters");
const browseView = document.querySelector("#browse-view");
const detailView = document.querySelector("#experience-detail");
const intro = document.querySelector(".intro");
const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector("#theme-color");
const themePreference = matchMedia("(prefers-color-scheme: dark)");
const themeStorageKey = "gender-experience-theme";
let activeDomain = "All";
const activeFilters = new Set();
const closedFamilies = new Set();

function savedTheme() {
  try {
    const value = localStorage.getItem(themeStorageKey);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme, save = false) {
  document.documentElement.dataset.theme = theme;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `Use ${nextTheme} theme`;
  themeToggle.setAttribute("aria-label", label);
  themeToggle.title = label;
  themeColor.content = theme === "dark" ? "#1a1624" : "#fffdf8";
  if (save) {
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }
}

function sourceKind(source) {
  if (source[2]) return source[2];
  if (source[1].includes("genderdysphoria.fyi") || source[1].includes("transnavi.jp")) return "Community reference";
  if (source[1].includes("x.com/") || source[1].includes("reddit.com/")) return "Community report";
  return "Reference";
}

function renderSourceItem(source, detailed = false) {
  const [label, url] = source;
  return `<li><span class="source-kind">${sourceKind(source)}</span><a href="${url}" target="_blank" rel="noreferrer">${label} ↗</a>${detailed && source[3] ? `<span class="source-note">${source[3]}</span>` : ""}</li>`;
}

function renderTag(group, value, className, categoryLabel) {
  const key = filterKey(group, value);
  return `<button type="button" class="category-tag ${className}" data-filter-group="${group}" data-filter-value="${value}" data-category-label="${categoryLabel}" aria-label="${value}; ${categoryLabel}" aria-pressed="${activeFilters.has(key)}">${value}</button>`;
}

function renderTabs() {
  domainTabs.innerHTML = ["All", ...domains.map((domain) => domain.title)].map((title) => `
    <button type="button" data-domain="${title}" aria-pressed="${title === activeDomain}">${title}</button>
  `).join("");
}

function filterKey(group, value) {
  return `${group}:${value}`;
}

function claimHasFilter(claim, key) {
  const [group, value] = key.split(":", 2);
  if (group === "type") return claim.types.includes(value);
  if (group === "population") return claim.directions.some((direction) => direction.replace("-associated", "") === value);
  return claim.tags.includes(value);
}

function renderActiveFilters() {
  if (activeFilters.size === 0) {
    activeFiltersElement.innerHTML = "";
    return;
  }
  activeFiltersElement.innerHTML = `
    <span>Filtered by</span>
    ${[...activeFilters].map((key) => {
      const [, value] = key.split(":", 2);
      return `<button type="button" data-remove-filter="${key}">${value} ×</button>`;
    }).join("")}
    <button class="clear-filters" type="button" data-clear-filters>Clear</button>
  `;
}

function renderCards() {
  const query = search.value.trim().toLocaleLowerCase();
  const visible = claims.filter((claim) => {
    const searchable = [claim.title, claim.summary, claim.family, ...claim.types, ...claim.directions, ...claim.responses, ...claim.tags, ...(claim.variations ?? []).map((variation) => variation.text)]
      .join(" ")
      .toLocaleLowerCase();
    return searchable.includes(query)
      && (activeDomain === "All" || claim.domain === activeDomain)
      && [...activeFilters].every((key) => claimHasFilter(claim, key));
  });

  const renderClaim = (claim) => {
    const tone = claim.types.includes("Dysphoric") && claim.types.includes("Euphoric")
      ? "mixed"
      : (claim.types[0] ?? "neutral").toLowerCase().replaceAll(" ", "-");
    return `
    <article class="card tone-${tone}" title="${claim.types.join(" · ")}">
      <h3><a class="claim-link" href="/experience/${claim.slug}/">${claim.title}</a></h3>
      <p class="summary">${claim.summary}</p>
      ${claim.reportCount ? `<p class="report-count">${claim.reportCount} reviewed ${claim.reportCount === 1 ? "report" : "reports"}</p>` : ""}
      ${claim.variations ? `<ul class="variations">${claim.variations.map((variation) => `<li><strong>${variation.direction.replace("-associated", "")}:</strong> ${variation.text}</li>`).join("")}</ul>` : ""}
      <div class="categories" aria-label="Tags">
        ${claim.types.map((type) => renderTag("type", type, `type-${type.toLowerCase().replaceAll(" ", "-")}`, "Experience type")).join("")}
        ${claim.directions.filter((direction) => direction !== "Cross-directional").map((direction) => renderTag("population", direction.replace("-associated", ""), "population-tag", "Population")).join("")}
        ${claim.tags.map((tag) => renderTag("topic", tag, "topic-tag", "Topic")).join("")}
      </div>
      <details class="sources">
        <summary>${claim.sources.length} ${claim.sources.length === 1 ? "source" : "sources"}</summary>
        <ul class="source-list">
          ${claim.sources.map(renderSourceItem).join("")}
        </ul>
      </details>
    </article>
  `;
  };

  const familyScore = (familyTitle) => visible
    .filter((claim) => claim.family === familyTitle)
    .reduce((total, claim) => total + claim.reportCount, 0);
  const renderFamily = (family) => {
    const familyClaims = visible
      .filter((claim) => claim.family === family.title)
      .sort((a, b) => b.reportCount - a.reportCount);
    if (familyClaims.length === 0) return "";
    return `
      <details class="experience-group" data-family="${family.title}" ${closedFamilies.has(family.title) ? "" : "open"}>
        <summary><h2>${family.title}</h2></summary>
        <div class="group-grid">${familyClaims.map(renderClaim).join("")}</div>
      </details>
    `;
  };

  const rankedDomains = [...domains].sort((a, b) => {
    const domainScore = (domain) => domain.families.reduce((total, family) => total + familyScore(family), 0);
    return domainScore(b) - domainScore(a);
  });

  cards.innerHTML = rankedDomains.map((domain) => {
    if (activeDomain !== "All" && domain.title !== activeDomain) return "";
    const families = domain.families
      .map((title) => experienceFamilies.find((family) => family.title === title))
      .filter(Boolean)
      .sort((a, b) => familyScore(b.title) - familyScore(a.title));
    const content = families.map(renderFamily).join("");
    if (!content) return "";
    return `
      <section class="domain-section">
        ${activeDomain === "All" ? `<h2 class="domain-title">${domain.title}</h2>` : ""}
        <div class="domain-content">${content}</div>
      </section>
    `;
  }).join("");

  cards.querySelectorAll(".experience-group").forEach((group) => {
    group.addEventListener("toggle", () => {
      if (group.open) closedFamilies.delete(group.dataset.family);
      else closedFamilies.add(group.dataset.family);
    });
  });

  count.textContent = `${visible.length} ${visible.length === 1 ? "experience" : "experiences"}`;
  empty.textContent = "No experiences match this search.";
  empty.hidden = visible.length !== 0;
}

function renderDetail(claim) {
  const related = claims.filter((candidate) => candidate.family === claim.family && candidate !== claim);
  detailView.innerHTML = `
    <a class="detail-back" href="/">← All experiences</a>
    <article>
      <div class="detail-context">
        <span>${claim.domain}</span>
        <span>${claim.family}</span>
      </div>
      <h1>${claim.title}</h1>
      <p class="detail-summary">${claim.summary}</p>
      ${claim.reportCount ? `<p class="report-count">${claim.reportCount} reviewed ${claim.reportCount === 1 ? "report" : "reports"}</p>` : ""}
      <div class="categories detail-tags" aria-label="Tags">
        ${claim.types.map((type) => renderTag("type", type, `type-${type.toLowerCase().replaceAll(" ", "-")}`, "Experience type")).join("")}
        ${claim.directions.filter((direction) => direction !== "Cross-directional").map((direction) => renderTag("population", direction.replace("-associated", ""), "population-tag", "Population")).join("")}
        ${claim.tags.map((tag) => renderTag("topic", tag, "topic-tag", "Topic")).join("")}
      </div>
      ${claim.patterns ? `
        <section class="detail-section">
          <h3>Reported variations</h3>
          <dl class="pattern-list">
            ${claim.patterns.map(([title, text]) => `<div><dt>${title}</dt><dd>${text}</dd></div>`).join("")}
          </dl>
        </section>
      ` : ""}
      ${claim.variations ? `
        <section class="detail-section">
          <h3>Population variations</h3>
          <ul class="detail-variations">${claim.variations.map((variation) => `<li><strong>${variation.direction.replace("-associated", "")}:</strong> ${variation.text}</li>`).join("")}</ul>
        </section>
      ` : ""}
      <section class="detail-section">
        <h3>Sources</h3>
        <ul class="detail-source-list">${claim.sources.map((source) => renderSourceItem(source, true)).join("")}</ul>
      </section>
      ${related.length ? `
        <section class="detail-section">
          <h3>Related experiences</h3>
          <ul class="related-list">${related.map((item) => `<li><a href="/experience/${item.slug}/">${item.title}</a></li>`).join("")}</ul>
        </section>
      ` : ""}
    </article>
  `;
}

function renderRoute() {
  const match = window.location.pathname.match(/^\/experience\/([^/]+)\/?$/)
    ?? window.location.hash.match(/^#\/experience\/([^/]+)$/);
  const claim = match ? claims.find((item) => item.slug === decodeURIComponent(match[1])) : null;
  if (claim) {
    browseView.hidden = true;
    intro.hidden = true;
    detailView.hidden = false;
    renderDetail(claim);
    document.title = `${claim.title} — Gender Experience Index`;
    return;
  }
  browseView.hidden = false;
  intro.hidden = false;
  detailView.hidden = true;
  document.title = "Gender Experience Index";
}

search.addEventListener("input", renderCards);
domainTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-domain]");
  if (!button) return;
  activeDomain = button.dataset.domain;
  renderTabs();
  renderCards();
});
cards.addEventListener("click", (event) => {
  const tag = event.target.closest("[data-filter-group]");
  if (!tag) return;
  const key = filterKey(tag.dataset.filterGroup, tag.dataset.filterValue);
  activeFilters.has(key) ? activeFilters.delete(key) : activeFilters.add(key);
  renderActiveFilters();
  renderCards();
});
detailView.addEventListener("click", (event) => {
  const tag = event.target.closest("[data-filter-group]");
  if (!tag) return;
  activeFilters.add(filterKey(tag.dataset.filterGroup, tag.dataset.filterValue));
  renderActiveFilters();
  renderCards();
  window.history.pushState(null, "", "/");
  renderRoute();
});
activeFiltersElement.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-filter]");
  if (remove) activeFilters.delete(remove.dataset.removeFilter);
  if (event.target.closest("[data-clear-filters]")) activeFilters.clear();
  renderActiveFilters();
  renderCards();
});
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
});
themePreference.addEventListener("change", (event) => {
  if (!savedTheme()) applyTheme(event.matches ? "dark" : "light");
});
window.addEventListener("storage", (event) => {
  if (event.key !== themeStorageKey) return;
  const theme = event.newValue === "light" || event.newValue === "dark"
    ? event.newValue
    : (themePreference.matches ? "dark" : "light");
  applyTheme(theme);
});
applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
renderTabs();
renderActiveFilters();
renderCards();
renderRoute();
window.addEventListener("hashchange", () => {
  renderRoute();
  window.scrollTo({ top: 0, behavior: "instant" });
});
window.addEventListener("popstate", () => {
  renderRoute();
  window.scrollTo({ top: 0, behavior: "instant" });
});
