const WHO_ICD = "https://www.who.int/standards/classifications/frequently-asked-questions/gender-incongruence-and-transgender-health-in-the-icd";
const MSD = "https://www.msdmanuals.com/professional/psychiatric-disorders/gender-incongruence-and-gender-dysphoria/gender-incongruence-and-gender-dysphoria";
const SOC8 = "https://wpath.org/publications/soc8/";
const UGDS_GS = "https://pmc.ncbi.nlm.nih.gov/articles/PMC7430422/";
const GCLS = "https://pmc.ncbi.nlm.nih.gov/articles/PMC6831013/";
const GIDYQ_AA = "https://pubmed.ncbi.nlm.nih.gov/19396705/";
const GENDER_EUPHORIA_SCALE = "https://doi.org/10.1080/26895269.2024.2447768";

const WHO_SOURCE = ["WHO ICD-11: Gender incongruence", WHO_ICD, "Diagnostic classification", "Describes persistent incongruence with assigned sex and desires to live, be accepted, or align the body with the experienced gender."];
const MSD_SOURCE = ["MSD Manual: Symptoms and diagnostic criteria", MSD, "Clinical manual", "Summarizes adult and childhood presentations together with DSM-5-TR and ICD-11 diagnostic features."];
const SOC8_SOURCE = ["WPATH Standards of Care, Version 8", SOC8, "Care standard", "Clinical recommendations for assessing gender incongruence and planning gender-affirming care."];
const UGDS_SOURCE = ["Utrecht Gender Dysphoria Scale–Gender Spectrum", UGDS_GS, "Questionnaire", "An 18-item gender-neutral measure covering affirmed-gender behavior, assigned-gender treatment, identity, and bodily experience."];
const GCLS_SOURCE = ["Gender Congruence and Life Satisfaction Scale", GCLS, "Questionnaire", "Covers genitalia, chest, other sex characteristics, social gender recognition, intimacy, psychological functioning, and life satisfaction."];
const GIDYQ_SOURCE = ["Gender Identity/Gender Dysphoria Questionnaire for Adolescents and Adults", GIDYQ_AA, "Questionnaire", "A 27-item dimensional measure of gender identity and gender dysphoria for adolescents and adults."];
const EUPHORIA_SOURCE = ["Gender Euphoria Scale", GENDER_EUPHORIA_SCALE, "Questionnaire", "A 26-item measure organized around social affirmation, self-affirmation, and community connection."];

export const referenceSources = {
  "Discomfort with sex characteristics": [
    WHO_SOURCE,
    MSD_SOURCE,
    UGDS_SOURCE,
    GCLS_SOURCE,
  ],
  "Distress when your own body looks male or female": [
    UGDS_SOURCE,
    GCLS_SOURCE,
  ],
  "Feeling ugly or unphotogenic in mirrors and photographs": [
    GCLS_SOURCE,
  ],
  "Discomfort being treated as the assigned gender": [
    MSD_SOURCE,
    UGDS_SOURCE,
    GIDYQ_SOURCE,
  ],
  "Relief when one’s gender is recognized": [
    GCLS_SOURCE,
    EUPHORIA_SOURCE,
  ],
  "Discomfort presenting as the assigned gender": [
    MSD_SOURCE,
    UGDS_SOURCE,
    GIDYQ_SOURCE,
  ],
  "Gravitating away from assigned-gender expectations": [
    WHO_SOURCE,
    ["MSD Manual: Symptoms in children", MSD, "Clinical manual", "Describes childhood gender expression, play, clothing preferences, and distress around pubertal change."],
  ],
  "Overperforming the assigned gender": [
    ["MSD Manual: Symptoms in adults", MSD, "Clinical manual", "Describes retrospective avoidance of gender feelings and a reported flight into hypermasculinity among some AMAB adults."],
  ],
  "Body changes can create recognition and relief": [
    WHO_SOURCE,
    SOC8_SOURCE,
    GCLS_SOURCE,
  ],
  "Relief from gender-affirming expression": [
    UGDS_SOURCE,
    EUPHORIA_SOURCE,
  ],
  "Fear of growing older in the assigned gender": [
    GIDYQ_SOURCE,
  ],
  "Wanting to belong among peers of another gender": [
    UGDS_SOURCE,
    GCLS_SOURCE,
    EUPHORIA_SOURCE,
  ],
  "Feeling able to move forward after recognizing your gender": [
    GCLS_SOURCE,
    EUPHORIA_SOURCE,
  ],
  "Intimacy feels different when gendered roles align": [
    GCLS_SOURCE,
  ],
  "Withdrawing when a promising date becomes real": [
    GCLS_SOURCE,
  ],
};
