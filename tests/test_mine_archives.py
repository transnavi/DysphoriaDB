import re
from pathlib import Path

from scripts.mine_archives import PATTERNS, matches


def test_experience_copy_addresses_the_reader_directly() -> None:
    source = Path("data/source/claims.js").read_text(encoding="utf-8")
    detached_reader_terms = re.compile(
        r"\b(?:someone|a person|the person|some people|the individual)\b|\bone[’']s\b",
        re.IGNORECASE,
    )
    assert detached_reader_terms.findall(source) == []


def test_every_published_claim_has_archive_patterns() -> None:
    source = Path("data/source/claim-slugs.js").read_text(encoding="utf-8")
    titles = set(re.findall(r'^\s+"([^"]+)":', source, re.MULTILINE))
    assert titles == set(PATTERNS)


def test_gender_policing_insult_with_affirming_response() -> None:
    text = "I am transfem. Someone called me a girl as an insult, but I liked it."
    assert "Gender-policing insults can feel unexpectedly affirming" in matches(text)


def test_assigned_gender_friendship_mismatch() -> None:
    text = "As a trans woman, being in an all-male group always felt awkward and wrong."
    assert "Being treated as same-gender friends can feel socially wrong" in matches(text)


def test_fear_of_assigned_gender_aging() -> None:
    text = "Before I knew I was trans, I could not imagine growing old as a man and dreaded it."
    assert "Fear of growing older in the assigned gender" in matches(text)


def test_gendered_record_feels_inaccurate() -> None:
    text = "My trans profile still shows the wrong gender marker and feels inaccurate."
    assert "Gendered records can feel like inaccurate personal information" in matches(text)


def test_hesitating_over_a_gender_field() -> None:
    text = "Before I knew I was trans, I would hesitate over the gender field, choose female first, then change it back to my assigned gender."
    assert "Hesitating when asked to state your gender" in matches(text)


def test_gender_transformation_story_interest() -> None:
    text = "I am trans and loved gender transformation stories long before I understood why."
    assert "Gender transformation stories feel unusually compelling" in matches(text)


def test_fear_that_transition_started_too_late() -> None:
    text = "I am trans and feared HRT was too late for me to ever pass."
    assert "Fear that transition began too late" in matches(text)


def test_transfeminine_friendship_is_read_as_romantic_pursuit() -> None:
    text = "As a transfeminine person, women sometimes assume my attempts at platonic friendship are romantic interest."
    assert "Seeking friendship with gender peers is mistaken for romantic interest" in matches(text)


def test_transmasculine_friendship_is_read_as_romantic_availability() -> None:
    text = "As a transmasculine person, men treated my attempts at platonic friendship as romantic interest."
    assert "Seeking friendship with gender peers is mistaken for romantic interest" in matches(text)


def test_group_outing_with_gender_peers_feels_euphoric() -> None:
    text = "As a trans woman, going out with a group of women and being treated as one of them felt euphoric."
    assert "Wanting to belong among peers of another gender" in matches(text)


def test_singled_out_while_a_bride_changes() -> None:
    text = "我是跨女。新娘换衣服时，其他伴娘都可以留下，就把我一个人赶出去了。"
    assert "Being excluded from privacy and closeness despite verbal gender recognition" in matches(text)


def test_excluded_from_toilet_and_home_visits() -> None:
    text = "My friends say they accept my gender as a trans man. They avoid sharing the men's restroom, inviting me home, or being alone with me."
    assert "Being excluded from privacy and closeness despite verbal gender recognition" in matches(text)


def test_touch_avoided_despite_gender_recognition() -> None:
    text = "They recognize my gender and use my pronouns. They hug every other woman while avoiding touch with me because I am trans."
    assert "Being excluded from privacy and closeness despite verbal gender recognition" in matches(text)


def test_lower_libido_makes_friendship_with_women_easier() -> None:
    text = "As a trans woman, HRT lowered my libido and made friendship with women easier and more comfortable."
    assert "Relief when libido changes make friendship with women easier" in matches(text)


def test_celibacy_used_to_control_alien_desire() -> None:
    text = "As a trans woman, I forced myself to be celibate and avoid romance because desire made me feel guilty and unworthy."
    assert "Libido or involuntary arousal feels alien or unwanted" in matches(text)


def test_belonging_in_a_transfeminine_group_while_boymoding() -> None:
    text = "I was boymoding when I joined a transfeminine group and felt a strong sense of belonging, even though we had little in common."
    assert "Finding belonging among transgender and other LGBTQ+ people" in matches(text)


def test_subjective_transgender_radar_and_passing_anxiety() -> None:
    text = "As a trans woman, I feel like I can spot other transgender people easily, and that makes me fear I will always be clocked."
    assert "Feeling unusually attuned to gender variance in other people" in matches(text)


def test_unexplained_attraction_precedes_self_recognition() -> None:
    text = "Before I knew I was trans, I met a gender-nonconforming woman and felt strangely drawn to her without knowing why."
    assert "Feeling unusually attuned to gender variance in other people" in matches(text)


def test_feminism_precedes_transfeminine_self_recognition() -> None:
    text = "I was a feminist and felt women's issues were personal long before I realized I was a trans woman."
    assert "Feeling aligned with a gender’s concerns before recognizing it as your own" in matches(text)


def test_alignment_precedes_transmasculine_self_recognition() -> None:
    text = "Long before I knew I was a trans man, I felt personally aligned with men's issues."
    assert "Feeling aligned with a gender’s concerns before recognizing it as your own" in matches(text)


def test_gendered_details_are_hidden_from_close_online_friends() -> None:
    text = "As a trans person, I kept my gender and voice private from even my closest online friends."
    assert "Keeping an online identity separate until gender disclosure feels safe" in matches(text)


def test_assigned_gender_restroom_feels_wrong() -> None:
    text = "As a trans woman, the men's restroom I always used began to feel wrong, and I preferred gender-neutral bathrooms."
    assert "Feeling out of place in gendered restrooms" in matches(text)


def test_hiding_in_a_private_restroom_stall() -> None:
    text = "As a trans man in a public restroom, I hide in a private stall and avoid conversation so nobody notices my body or voice."
    assert "Feeling out of place in gendered restrooms" in matches(text)


def test_online_identity_opens_after_transition() -> None:
    text = "After gender transition, I felt comfortable connecting my online profile to my real name."
    assert "Keeping an online identity separate until gender disclosure feels safe" in matches(text)


def test_female_viewpoint_in_pornography_affirms_transfeminine_self() -> None:
    text = "As a trans woman, I identify with the woman's perspective in pornography and imagine myself as her."
    assert "Sexual experiences can affirm your gendered sense of self" in matches(text)


def test_insertive_role_feels_dysphoric() -> None:
    text = "As a trans woman, penetrating a partner feels dysphoric and alien to me."
    assert "Sexual experiences can affirm your gendered sense of self" in matches(text)


def test_masculine_fantasy_affirms_transmasculine_self() -> None:
    text = "As a trans man, sexual fantasy feels affirming when I imagine myself in a masculine role."
    assert "Sexual experiences can affirm your gendered sense of self" in matches(text)


def test_neutral_language_affirms_nonbinary_intimacy() -> None:
    text = "As a nonbinary person, intimacy with gender-neutral terms feels comfortable and affirming."
    assert "Sexual experiences can affirm your gendered sense of self" in matches(text)


def test_unrelated_fashion_post_is_ignored() -> None:
    assert matches("New fashion guide: browse clothes, makeup, and styling tips.") == []
