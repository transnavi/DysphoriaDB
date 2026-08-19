"""Find gender-experience reports in local X and Telegram archives."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
import urllib.error
import urllib.request
import zipfile
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from bs4 import BeautifulSoup
from collectors.private_storage import ensure_private_path, write_private_text


STATUS_ID = re.compile(r"(?:x|twitter|fxtwitter|fixupx)\.com/(?:i/web/|[^/]+/)?status/(\d+)", re.I)
MINER_VERSION = "0.1.0"
GENDER_CONTEXT = re.compile(
    r"(?:\btrans(?:gender|fem(?:inine)?|masc(?:uline)?)?\b|\bmt[fx]\b|\bft[mo]\b|\bamab\b|\bafab\b|"
    r"non-?binary|gender|dysphori|euphori|boymod|girlmod|\bhrt\b|"
    r"トランス|性別|性自認|性同一|性違和|女装|男装|男娘|薬娘|药娘|藥娘|"
    r"跨女|跨男|性别|性別|性別移行|性転換|性转|性轉|女体化|男体化|性别焦虑|性別違和)",
    re.I,
)

PATTERNS: dict[str, list[str]] = {
    "Feeling ugly or unphotogenic in mirrors and photographs": [
        r"(?:mirror|selfie|photo(?:graph)?|鏡|写真|自拍|镜子).{0,80}(?:ugly|unattractive|hate|avoid|醜|丑|嫌|苦手|自信)",
        r"(?:ugly|unattractive|醜|丑|自信).{0,80}(?:mirror|selfie|photo|鏡|写真|自拍|镜子)",
    ],
    "Your reflection feels unfamiliar": [
        r"(?:mirror|reflection|photo|鏡|写真|镜子).{0,80}(?:stranger|not me|unfamiliar|recognize|別人|自分.*ない|不像自己|陌生)",
    ],
    "Avoiding seeing your own unclothed body": [
        r"(?:naked|nude|shower|undress|裸|シャワー|着替|裸体|洗澡).{0,80}(?:avoid|hate|look away|cover|見たく|嫌|不看|遮)",
    ],
    "Discomfort with other people seeing your body": [
        r"(?:seen naked|see me naked|changing room|locker room|見られ.{0,20}(?:裸|身体|体)|被看.{0,20}(?:裸体|身体)).{0,80}(?:hate|avoid|uncomfortable|嫌|避|不舒服)",
    ],
    "Feeling out of place in gendered restrooms": [
        r"(?:restroom|bathroom|toilet|washroom|loo).{0,100}(?:wrong|uncomfortable|dysphori|anxi|unsafe|out of place).{0,80}(?:gender|men.s|women.s|male|female|trans)?",
        r"(?:men.s|women.s|male|female|assigned.gender).{0,60}(?:restroom|bathroom|toilet|washroom).{0,100}(?:wrong|uncomfortable|dysphori|anxi|unsafe|avoid)",
        r"(?:gender.neutral|all.gender|unisex|family|single.occupancy).{0,40}(?:restroom|bathroom|toilet).{0,100}(?:prefer|seek|find|relief|safe|comfortable|wish)",
        r"(?:restroom|bathroom|toilet|washroom).{0,100}(?:stall|cubicle|private).{0,80}(?:hide|avoid|talk|conversation|eye contact|expos|voice|body)",
        r"(?:hold it|delay urinat|avoid).{0,80}(?:public )?(?:restroom|bathroom|toilet|washroom).{0,100}(?:trans|gender|dysphori|unsafe|harass)",
        r"(?:トイレ|便所|化粧室).{0,100}(?:性別|男性用|女性用|多目的|ジェンダーレス).{0,80}(?:違和感|居づら|怖|避け|個室|隠|話さ)",
        r"(?:厕所|廁所|洗手间|洗手間).{0,100}(?:性别|性別|男厕|男廁|女厕|女廁|无性别|無性別).{0,80}(?:不对劲|不對勁|不自在|害怕|回避|隔间|隔間|隐藏|隱藏)",
    ],
    "Distress when your own body looks male or female": [
        r"(?:my body|自分の身体|自分の体|自己的身体).{0,100}(?:male|female|man|woman|男|女).{0,80}(?:wrong|hate|distress|嫌|違和|痛苦)",
    ],
    "Wanting to cover the bare upper torso despite being treated as male": [
        r"(?:topless|bare chest|shirtless|nipple|上半身裸|上裸|赤膊|トップレス|乳首).{0,100}(?:uncomfortable|hate|cover|embarrass|嫌|隠|尴尬|遮|不舒服)",
        r"(?:full.?body swimsuit|one.?piece swimsuit|全身.*水着|连体泳衣)",
    ],
    "Concealing chest development while boymoding": [
        r"(?:boymod|男装|boy mode|药娘|藥娘).{0,100}(?:breast|boob|chest|胸|おっぱい).{0,60}(?:hide|conceal|隠|遮|見ら|被看)",
        r"(?:breast|boob|chest|胸|おっぱい).{0,100}(?:boymod|男装|boy mode|药娘|藥娘)",
    ],
    "Minimizing or binding an unwanted chest": [
        r"(?:bind(?:er|ing)?|胸オペ|ナベシャツ|束胸|壓胸|压胸|compress).{0,80}(?:chest|breast|胸)?",
    ],
    "Preferring clothing that hides the body’s silhouette": [
        r"(?:baggy|oversi[sz]ed|hoodie|loose cloth|大きい服|オーバーサイズ|パーカー|宽松|寬鬆).{0,100}(?:body|shape|silhouette|hide|体|身体|隠|身材|遮)",
        r"(?:hide|conceal|隠|遮).{0,80}(?:body shape|silhouette|胸|体型|身材).{0,80}(?:cloth|shirt|hoodie|服|衣)",
    ],
    "Clothing fit makes body shape more noticeable": [
        r"(?:jeans|shirt|dress|suit|clothes|ジーンズ|スーツ|服|牛仔裤|衣服).{0,100}(?:fit|shape|body|wrong|似合|体型|身材|不合)",
    ],
    "Discomfort with sex characteristics": [
        r"(?:dysphori|性別違和|性别焦虑|性別焦慮).{0,100}(?:body|chest|breast|genital|period|hair|身体|胸|性器|月経|体毛|身体|生殖器|月经)",
        r"(?:hate|wrong|remove|嫌|消した|切り|厌恶|不要).{0,80}(?:breast|penis|genital|period|beard|胸|性器|月経|髭|阴茎|月经|胡子)",
    ],
    "Feeling detached from the body": [
        r"(?:body|self|身体|自分|自己).{0,80}(?:detached|depersonal|not mine|robot|zombie|現実感|自分じゃ|解离|不像自己|麻木)",
    ],
    "The voice feels unlike oneself": [
        r"(?:my voice|own voice|voice recording|自分の声|声の録音|自己的声音|声音录音).{0,80}(?:hate|dysphori|wrong|not mine|record|嫌|違和|自分じゃ|讨厌|焦虑|不像自己)",
        r"(?:hate|dysphori|wrong|not mine|嫌|違和|自分じゃ|讨厌|焦虑|不像自己).{0,60}(?:my voice|own voice|自分の声|自己的声音)",
    ],
    "Controlling gendered body hair": [
        r"(?:body hair|facial hair|beard|髭|体毛|ひげ|胡子|体毛).{0,80}(?:shav|remove|hate|grow|剃|脱毛|嫌|刮|脱毛|留)",
    ],
    "Discomfort presenting as the assigned gender": [
        r"(?:masculine|feminine|manly|girly|男らし|女らし|男性的|女性化|阳刚|女性化).{0,80}(?:hate|forced|wrong|嫌|強制|違和|讨厌|被迫)",
    ],
    "Relief from gender-affirming expression": [
        r"(?:dress|skirt|makeup|suit|服|スカート|メイク|女装|男装|裙|化妆).{0,80}(?:euphori|happy|right|comfort|嬉|楽|落ち着|开心|舒服)",
    ],
    "Hair length or hairstyle carries unusual importance": [
        r"(?:hair|髪|发型|頭髮).{0,80}(?:grow|long|short|cut|伸ば|長髪|短髪|切り|留长|剪短).{0,80}(?:gender|trans|girl|boy|女|男|性別|性别)",
    ],
    "Discomfort being treated as the assigned gender": [
        r"(?:misgender|pronoun|deadname|sir|ma'am|he/him|she/her|代名詞|呼ば|君|ちゃん|误称|称呼).{0,80}(?:hate|hurt|wrong|dysphori|嫌|違和|傷|讨厌|难受)",
    ],
    "Gendered records can feel like inaccurate personal information": [
        r"(?:identification|passport|document|record|form|profile|personal information).{0,100}(?:deadname|sex marker|gender marker|wrong gender|wrong name|inaccurate|not me)",
        r"(?:身分証|戸籍|書類|フォーム|プロフィール|個人情報).{0,100}(?:性別|名前|戸籍名|写真).{0,60}(?:違|間違|嫌|出したく|見せたく)",
        r"(?:身份证|护照|证件|档案|表格|个人信息).{0,100}(?:性别|名字|照片).{0,60}(?:错误|不对|讨厌|不想出示|不像自己)",
    ],
    "Relief when your gender is recognized": [
        r"(?:gendered correctly|right pronoun|chosen name|called me (?:a )?(?:girl|boy|woman|man)|正しい性別|女の子.*呼|男の子.*呼|正确称呼|叫我女生|叫我男生).{0,80}(?:happy|euphori|嬉|喜|开心)?",
    ],
    "Assigned-gender compliments feel uncomfortable": [
        r"(?:handsome|manly|pretty|beautiful|girly|ladylike|ハンサム|男らしい|可愛い|美人|帅|漂亮|可爱).{0,80}(?:hate|wrong|uncomfortable|dysphori|嫌|違和|讨厌|不舒服)",
    ],
    "Choosing another gender in games and imagined roles": [
        r"(?:avatar|character|video game|ゲーム|キャラ|アバター|游戏|角色).{0,100}(?:other gender|opposite sex|girl character|boy character|異性|女キャラ|男キャラ|女性角色|男性角色)",
    ],
    "Gender transformation stories feel unusually compelling": [
        r"(?:gender transformation|sex change|body swap|turn(?:ed|ing)? into (?:a )?(?:girl|boy|woman|man)).{0,100}(?:fantasy|story|fiction|content|fascinat|obsess|love|wish|want)",
        r"(?:fascinat|obsess|love|wish|want).{0,100}(?:gender transformation|sex change|body swap|turn(?:ed|ing)? into (?:a )?(?:girl|boy|woman|man))",
        r"(?:性転換|女体化|男体化|TSコンテンツ).{0,80}(?:興味|好き|惹かれ|夢中|何度|憧)",
        r"(?:性转|性轉|女体化|男体化|身体交换).{0,80}(?:兴趣|喜欢|着迷|反复|向往)",
    ],
    "Envy blends appearance, identity, and attraction": [
        r"(?:want to be her|want to be him|be with her|be with him|gender envy).{0,100}(?:girl|woman|boy|man|her|him|gender)",
        r"(?:女の子|女性|男の子|男性).{0,60}(?:好き|惹かれ|付き合いたい).{0,80}(?:なりたい|羨ま|自分も).{0,60}(?:混同|分から|区別|同時)",
        r"(?:女孩|女人|男孩|男人|她|他).{0,60}(?:喜欢|吸引|想交往).{0,80}(?:想成为|羡慕|自己也想).{0,60}(?:混淆|分不清|同时)",
    ],
    "Overperforming the assigned gender": [
        r"(?:hypermasculin|hyperfeminin|denial beard|男らしく.*頑張|女らしく.*頑張|过度男性化|过度女性化)",
    ],
    "Libido or involuntary arousal feels alien or unwanted": [
        r"(?:libido|sex drive|erection|arousal|性欲|勃起|リビドー|性欲|勃起).{0,100}(?:hate|unwanted|dysphori|disgust|嫌|違和|気持ち悪|讨厌|恶心)",
    ],
    "Attraction to women feels contaminated by an imposed male role": [
        r"(?:male gaze|predator|objectify|creep|男性の目|男性目線|加害者|男凝|凝视).{0,100}(?:woman|women|girl|女性|女)",
    ],
    "Sexual experiences that affirm a feminine sense of self": [
        r"(?:masturbat|jerk off|オナニ|自慰|手淫).{0,100}(?:like a (?:girl|woman)|female way|feminine|女の子|女性として|像女生|女性方式)",
        r"(?:porn|pornography|sexual media).{0,160}(?:identify with|imagine (?:myself|being)|perspective|point of view|viewpoint).{0,80}(?:woman|female|feminine|her)",
        r"(?:identify with|imagine (?:myself|being)|perspective|point of view|viewpoint).{0,100}(?:woman|female|feminine|her).{0,160}(?:porn|pornography|sexual media)",
        r"(?:penetrat|insertive|top(?:ping)?).{0,120}(?:hate|dislike|avoid|wrong|alien|dysphori|uncomfortable|distress)",
        r"(?:hate|dislike|avoid|wrong|alien|dysphori|uncomfortable|distress).{0,120}(?:penetrat|insertive|top(?:ping)?)",
        r"(?:sex|sexual|intimacy|partner).{0,120}(?:as a woman|treated as a woman|female perspective|feminine role).{0,100}(?:right|affirm|comfortable|present|pleasur|euphori)",
        r"(?:ポルノ|性的コンテンツ).{0,120}(?:女性の視点|女性に自分を重ね|女性として|女性の身体|女性の役割)",
        r"(?:挿入|挿入する役割).{0,100}(?:嫌|避け|違和|苦痛|ディスフォリア)",
        r"(?:色情|成人视频|性内容).{0,120}(?:女性视角|代入女性|想象自己是女性|女性身体|女性角色)",
        r"(?:插入|插入方).{0,100}(?:讨厌|回避|不适|疏离|性别焦虑)",
    ],
    "Gender-related feelings fluctuate in intensity": [
        r"(?:dysphori|gender feeling|性別違和|性别焦虑).{0,100}(?:some days|fluctuat|comes and goes|日によ|波|时有时无|有时)",
    ],
    "Difficulty picturing or remembering your current body shape": [
        r"(?:can(?:not|'t)|could(?: not|n't)|hard to|difficult).{0,50}(?:picture|imagine|remember).{0,50}(?:my|own).{0,20}(?:body|shape)",
        r"(?:自分の|自己的).{0,20}(?:体|身体|体型|身材).{0,40}(?:想像でき|思い出せ|イメージでき|无法想象|想不起来|记不清)",
    ],
    "Wanting an extreme body shape to change a gendered silhouette": [
        r"(?:want|wish|try|trying).{0,40}(?:very|extremely|super)?\s*(?:thin|skinny|fat|muscular|bulky|slight).{0,100}(?:gender|masculin|feminin|man|woman|boy|girl|body|shape)",
        r"(?:男らし|女らし|男性的|女性的|男っぽ|女っぽ|男性化|女性化).{0,80}(?:痩せ|太り|筋肉|細く|瘦|胖|肌肉)",
    ],
    "Choosing plain clothes over improving an assigned-gender appearance": [
        r"(?:before transition|pre-?transition|boymod|girlmod).{0,120}(?:plain|boring|black|same clothes|no fashion|didn't care.{0,20}(?:clothes|appearance))",
        r"(?:男装|女装|移行前|出柜前|转变前).{0,100}(?:黒い服|地味|無難|服に興味|不打扮|黑色|朴素|随便穿)",
    ],
    "Gravitating away from assigned-gender expectations": [
        r"(?:as a (?:kid|child)|childhood|growing up).{0,100}(?:boys?' toys|girls?' toys|dolls?|barbie|action figures?|dress up).{0,80}(?:liked|wanted|hated|never)",
        r"(?:子供|子ども|幼少|小时候|童年).{0,100}(?:男の子向け|女の子向け|人形|おもちゃ|芭比|娃娃|男孩子|女孩子).{0,80}(?:好き|嫌|欲し|喜欢|讨厌|想要)",
    ],
    "Gender-policing insults can feel unexpectedly affirming": [
        r"(?:called|told).{0,40}(?:girl|boy|girly|sissy|effeminate|mannish|not a (?:real )?(?:man|woman)).{0,60}(?:insult|mock|teas|but i liked|didn't mind|blush|euphori|happy)",
        r"(?:娘娘腔|女々しい|男らしくない|女らしくない|不像男人|不像女人|不男不女).{0,80}(?:嬉|悪くな|嫌じゃ|开心|高兴|不生气|性別|trans|跨)",
    ],
    "Assigned-gender social roles feel performed": [
        r"\b(?:pretend(?:ing|ed)?|perform(?:ing|ed)?|act(?:ing|ed)?|mask(?:ing|ed)?)\b.{0,50}(?:as )?(?:a )?(?:man|woman|boy|girl|male|female).{0,80}(?:exhaust|fake|role|wrong|not me|wasn't me|didn't fit)",
        r"(?:dropped|remove|shed|took off).{0,30}(?:the |my )?mask.{0,80}(?:pretend|man|woman|boy|girl|male|female|gender)",
        r"(?:男|女|男性|女性).{0,30}(?:演じ|振る舞|役割|仮面|扮演|假装|角色).{0,60}(?:疲|違和|假的|累|不适)",
    ],
    "Being treated as same-gender friends can feel socially wrong": [
        r"(?:group of men|group of women|all[- ]male|all[- ]female|one of the (?:boys|girls)|with the bros).{0,100}(?:out of place|awkward|wrong|different|uncomfortable)",
        r"(?:sleepover|staying over|alone with).{0,80}(?:male friend|female friend|guy friend|girl friend).{0,80}(?:awkward|wrong|date|guilt|embarrass)",
        r"(?:男子だけ|女子だけ|男だけ|女だけ|男子グループ|女子グループ|男友達|女友達|お泊まり).{0,100}(?:気まず|違和|恥ずか|罪悪感|デート|居づら)",
        r"(?:全是男|全是女|男性朋友|女性朋友|兄弟|姐妹|过夜).{0,100}(?:尴尬|不自在|不对劲|约会|羞耻|内疚)",
    ],
    "Grief for experiences lived in the wrong gender role": [
        r"(?:missed|lost|never got).{0,50}(?:childhood|youth|teenage years|growing up).{0,80}(?:girl|boy|woman|man|gender|trans)",
        r"(?:女の子|男の子|女性|男性).{0,40}(?:として).{0,40}(?:子供時代|青春|学生生活|経験).{0,60}(?:失|できな|欲しか)",
        r"(?:错过|失去|没有).{0,50}(?:女孩|男孩|女生|男生).{0,50}(?:童年|青春|学生时代|成长)",
    ],
    "Returning to gendered childhood interests later in life": [
        r"(?:adult|grown up|later in life).{0,100}(?:barbie|dolls?|plush|stuffed animals?|pink|boys?' toys|girls?' toys).{0,80}(?:buy|collect|love|wanted|never allowed)",
        r"(?:大人|成人|长大).{0,100}(?:ぬいぐるみ|人形|バービー|ピンク|子供服|毛绒|娃娃|芭比|粉色).{0,80}(?:集め|買|好き|欲しか|收集|买|喜欢|想要)",
    ],
    "Fear of growing older in the assigned gender": [
        r"(?:grow(?:ing)? (?:up|old)|become|turn into).{0,30}(?:an? )?(?:old man|old woman|man|woman).{0,80}(?:fear|terr|hate|rather die|can't imagine|dread)",
        r"(?:おじさん|おばさん|男になる|女になる|男性になる|女性になる).{0,80}(?:怖|嫌|死に|想像でき|不安)",
        r"(?:变成|成为|长成).{0,30}(?:男人|女人|老头|老太太).{0,80}(?:害怕|恐惧|不想|无法想象|宁愿死)",
    ],
    "Fear that transition began too late": [
        r"(?:too late|started late|should have started|wish i started|wish i had started).{0,100}(?:transition|hrt|hormone|puberty)",
        r"(?:transition|hrt|hormone|puberty).{0,100}(?:too late|started late|irreversible|hopeless|never pass)",
        r"(?:移行|HRT|ホルモン|治療).{0,100}(?:遅すぎ|遅かった|もっと早く|手遅れ|間に合わ|パスでき)",
        r"(?:转变|激素|荷尔蒙|荷爾蒙|治疗|治療).{0,100}(?:太晚|更早|来不及|無法挽回|无法挽回|不能pass)",
    ],
    "Wanting to belong among peers of another gender": [
        r"(?:want|wish|long).{0,40}(?:one of the girls|one of the boys|belong with (?:girls|boys|women|men)|included with (?:girls|boys|women|men))",
        r"(?:girls|boys|women|men).{0,60}(?:excluded|left out|wouldn't let me|didn't see me).{0,50}(?:gender|trans|girl|boy|woman|man)?",
        r"(?:going out|went out|hanging out|outing|trip|shopping|meal).{0,100}(?:group of (?:women|men|girls|boys)|with (?:women|men|girls|boys)).{0,100}(?:euphori|affirm|felt right|one of them|belong)",
        r"(?:group of (?:women|men|girls|boys)|with (?:women|men|girls|boys)).{0,100}(?:going out|went out|hanging out|outing|trip|shopping|meal).{0,100}(?:euphori|affirm|felt right|one of them|belong)",
        r"(?:女子|男子|女性|男性).{0,40}(?:仲間|輪|グループ|友達).{0,60}(?:入り|混ざり|排除|羨ま|居場所)",
        r"(?:女生|男生|女性|男性).{0,40}(?:圈子|群体|朋友|姐妹|兄弟).{0,60}(?:加入|融入|排除|羡慕|归属)",
    ],
    "Finding belonging among transgender and other LGBTQ+ people": [
        r"(?:trans|transgender|transfem|transmasc|lgbtq?|queer).{0,50}(?:group|friends|community|people).{0,100}(?:belong|relief|at home|connected|unified|euphori)",
        r"(?:belong|relief|at home|connected|unified|euphori).{0,100}(?:trans|transgender|transfem|transmasc|lgbtq?|queer).{0,50}(?:group|friends|community|people)",
        r"(?:many|most|all).{0,50}(?:friends|people around me).{0,80}(?:trans|transgender|lgbtq?|queer|gay|bisexual|sexual minorit)",
        r"(?:boymod|girlmod|closeted|questioning).{0,120}(?:trans|transgender|transfem|transmasc|lgbtq?|queer).{0,50}(?:group|friends|community).{0,100}(?:belong|relief|at home|connected|unified)",
        r"(?:トランス|LGBTQ|クィア|性的少数者).{0,50}(?:仲間|友達|コミュニティ|グループ).{0,100}(?:居場所|一体感|安心|つながり|仲間意識)",
        r"(?:跨性别|跨性別|LGBTQ|酷儿|酷兒|性少数|性少數).{0,50}(?:朋友|社群|群体|群體|圈子).{0,100}(?:归属|歸屬|一体感|一體感|安心|联系|聯繫)",
    ],
    "Seeking friendship with gender peers is mistaken for romantic interest": [
        r"(?:friend|friendship|platonic).{0,80}(?:women|woman|girls|girl|men|man|boys|boy).{0,100}(?:flirt|romantic|sexual|hitting on|pursu|interest|guarded|wary|cautious)",
        r"(?:women|woman|girls|girl|men|man|boys|boy).{0,80}(?:think|assume|treat|read|see).{0,80}(?:flirt|romantic|sexual|hitting on|pursu|interest).{0,100}(?:friend|friendship|platonic)",
        r"(?:women|woman|girls|girl|men|man|boys|boy).{0,80}(?:think|assume|treat|read|see).{0,100}(?:friend|friendship|platonic).{0,80}(?:flirt|romantic|sexual|hitting on|pursu|interest)",
        r"(?:女性|女子|女友達|男性|男子|男友達).{0,80}(?:恋愛|性的|ナンパ|口説|好意).{0,80}(?:誤解|警戒|身構|距離|友達)",
        r"(?:女性|女生|女朋友|男性|男生|男朋友).{0,80}(?:恋爱|性|搭讪|追求|好感).{0,80}(?:误会|警惕|防备|保持距离|朋友)",
    ],
    "Feeling able to move forward after recognizing your gender": [
        r"(?:came out|accepted|realized|transition).{0,100}(?:life (?:started|began|moving)|finally living|energy|motivation|future|move forward)",
        r"(?:性別|トランス|女|男).{0,40}(?:認め|気づ|自覚|カミングアウト|移行).{0,100}(?:人生.*始|前に進|生き始|元気|やる気|未来)",
        r"(?:性别|跨性别|跨女|跨男).{0,40}(?:接受|意识到|出柜|转变).{0,100}(?:人生.*开始|继续前进|活起来|动力|未来)",
    ],
    "Identifying strongly with characters of another gender": [
        r"(?:identify|relate).{0,50}(?:character|hero|protagonist).{0,60}(?:girl|woman|boy|man|gender)",
        r"(?:女キャラ|男キャラ|女性キャラ|男性キャラ|女主人公|男主人公).{0,80}(?:共感|自分を重ね|感情移入|同一視)",
        r"(?:女性角色|男性角色|女主角|男主角).{0,80}(?:共鸣|代入|认同|像自己)",
    ],
    "Feeling aligned with a gender’s concerns before recognizing it as your own": [
        r"(?:feminis|women['’]s rights|women['’]s issues|men['’]s rights|men['’]s issues).{0,120}(?:before|long before).{0,80}(?:realized|knew|understood|came out).{0,50}(?:trans|woman|man|girl|boy)",
        r"(?:before|long before).{0,80}(?:realized|knew|understood|came out).{0,50}(?:trans|woman|man|girl|boy).{0,120}(?:feminis|women['’]s rights|women['’]s issues|men['’]s rights|men['’]s issues)",
        r"(?:felt|feel).{0,50}(?:connected|aligned|belong|personal).{0,50}(?:women|men|girls|boys).{0,120}(?:before|long before).{0,80}(?:realized|knew|understood|came out)",
        r"(?:フェミニスト|フェミニズム|女性問題|男性問題|女性の権利|男性の生きづらさ).{0,120}(?:トランス|自分.*(?:女性|男性)|性自認).{0,80}(?:気づく前|分かる前|自覚.*前)",
        r"(?:女权|女性主义|女性權利|女性权利|男性议题|男性議題).{0,120}(?:跨性别|跨性別|自己是女人|自己是男人).{0,80}(?:意识到之前|意識到之前|明白之前)",
    ],
    "Living through another person’s presentation": [
        r"(?:shop|clothes|style|makeup).{0,50}(?:girlfriend|wife|boyfriend|husband|partner).{0,80}(?:vicarious|through (?:her|him|them)|wish i could|for myself)",
        r"(?:彼女|妻|彼氏|夫|パートナー).{0,50}(?:服|化粧|メイク|買い物|コーデ).{0,80}(?:代わり|自分も|羨ま|着せ)",
        r"(?:女友|妻子|男友|丈夫|伴侣).{0,50}(?:衣服|化妆|打扮|购物).{0,80}(?:替自己|羡慕|代偿|想穿)",
    ],
    "Feeling unusually attuned to gender variance in other people": [
        r"(?:trans radar|transdar|clock|spot|detect|tell).{0,100}(?:trans|transgender|transfem|transmasc|gender variant|gender nonconforming)",
        r"(?:trans|transgender|transfem|transmasc|gender variant|gender nonconforming).{0,100}(?:radar|clock|spot|detect|could tell|sense)",
        r"(?:met|saw|noticed).{0,80}(?:trans|transgender|transfem|transmasc|gender[- ]nonconforming).{0,100}(?:attract|envy|familiar|similar|same|drawn|couldn.t explain)",
        r"(?:notice|spot|clock|detect).{0,80}(?:trans|transgender|transfem|transmasc).{0,100}(?:never pass|transition impossible|too obvious|always be clocked)",
        r"(?:トランス|性別違和|ジェンダー).{0,80}(?:見抜|気づ|察知|分かる|似ている|同じ).{0,100}(?:惹かれ|羨ま|親近感|移行.*無理|パス.*無理)",
        r"(?:跨性别|跨性別|性别气质|性別氣質).{0,80}(?:看出|认出|認出|察觉|察覺|相似|一样|一樣).{0,100}(?:吸引|羡慕|羨慕|亲近感|親近感|无法过关|無法過關)",
    ],
    "Social withdrawal reduces gendered exposure": [
        r"(?:avoid|stopped|quit).{0,40}(?:socializing|going out|people|parties|photos|dating).{0,100}(?:gender|body|appearance|dysphori|misgender|trans)",
        r"(?:性別|身体|見た目|男|女).{0,50}(?:見られ|扱われ|写真).{0,80}(?:引きこも|人を避け|外出.*避|会わな)",
        r"(?:性别|身体|外表|男人|女人).{0,50}(?:被看|被当作|照片).{0,80}(?:宅|躲避人|不出门|不见人)",
    ],
    "Keeping an online identity separate until gender disclosure feels safe": [
        r"(?:online|internet|account|profile|username|voice chat|discord).{0,100}(?:hide|conceal|private|secret|anonymous|avoid|wouldn.t share).{0,80}(?:gender|sex|voice|name|pronouns?|appearance|photo)",
        r"(?:gender|sex|voice|name|pronouns?|appearance|photo).{0,80}(?:hide|conceal|private|secret|anonymous|avoid|wouldn.t share).{0,100}(?:online|internet|account|profile|friend|discord)",
        r"(?:close|closest|best).{0,30}(?:online )?friend.{0,100}(?:hide|conceal|never told|wouldn.t share|kept private).{0,60}(?:gender|voice|name|pronouns?|appearance)",
        r"(?:after|since).{0,40}(?:gender transition|transitioning|came out|voice training|name change).{0,120}(?:online|account|profile|identity).{0,80}(?:real name|link|connect|open|comfortable|relief)",
        r"(?:オンライン|ネット|アカウント|プロフィール|ユーザー名|通話).{0,100}(?:性別|声|名前|代名詞|容姿|写真).{0,80}(?:隠|秘密|非公開|匿名|避け|教えな)",
        r"(?:网络|網路|账号|帳號|个人资料|個人資料|用户名|用戶名|语音|語音).{0,100}(?:性别|性別|声音|名字|代词|代詞|外貌|照片).{0,80}(?:隐藏|隱藏|保密|匿名|回避|不告诉|不告訴)",
    ],
    "Constant activity keeps gender feelings out of awareness": [
        r"(?:kept|keep|stayed|stay).{0,30}(?:busy|working|gaming|distracted).{0,100}(?:gender|dysphori|trans|avoid thinking|not think)",
        r"(?:忙しく|仕事|ゲーム|趣味).{0,80}(?:性別|違和|トランス).{0,80}(?:考えない|忘れ|紛らわ|逃げ)",
        r"(?:忙|工作|游戏|爱好).{0,80}(?:性别|焦虑|跨性别).{0,80}(?:不去想|忘记|逃避|转移注意)",
    ],
    "Gender expression becomes less deliberate over time": [
        r"(?:early|first).{0,30}(?:transition|came out).{0,100}(?:very|hyper|extremely).{0,20}(?:feminin|masculin|girly|manly).{0,120}(?:later|now|eventually|relax|less)",
        r"(?:gendered correctly|passing|pass).{0,80}(?:doesn't|does not|no longer).{0,80}(?:euphori|matter|effort|try|presentation)",
        r"(?:移行初期|出柜初期|刚开始转变).{0,100}(?:女らし|男らし|女性化|男性化|很女性|很男性).{0,100}(?:今|后来|现在|慣れ|放松|自然|気にしな)",
    ],
    "Intimacy feels different when gendered roles align": [
        r"(?:sex|intimacy|dating|relationship).{0,100}(?:as a (?:woman|man|girl|boy)|treated as (?:a )?(?:woman|man)|right gender).{0,80}(?:better|right|comfortable|euphori|finally)",
        r"(?:女性|男性|女|男).{0,30}(?:として).{0,60}(?:恋愛|交際|デート|セックス|性行為).{0,80}(?:自然|楽|嬉|しっくり)",
        r"(?:女人|男人|女生|男生).{0,30}(?:身份|角色).{0,60}(?:恋爱|约会|性爱|亲密).{0,80}(?:自然|舒服|开心|正确)",
    ],
    "Relief when libido changes make friendship with women easier": [
        r"(?:hrt|hormones?|estrogen|anti-?androgen).{0,80}(?:decreas|lower|quieter|chang).{0,50}(?:libido|sex drive|sexual desire).{0,120}(?:friendship|female friends?|women friends?).{0,80}(?:easier|relief|comfortable|calm)",
        r"(?:hrt|hormones?|estrogen|anti-?androgen).{0,100}(?:libido|sex drive|sexual desire).{0,100}(?:decreas|lower|quieter|chang).{0,120}(?:friendship|female friends?|women friends?).{0,80}(?:easier|relief|comfortable|calm)",
        r"(?:libido|sex drive|sexual desire).{0,100}(?:interfere|hinder|difficult|hard|intrusive).{0,100}(?:friend|friendship|women|female friends?)",
        r"(?:HRT|ホルモン|エストロゲン|抗アンドロゲン).{0,100}(?:性欲|リビドー).{0,100}(?:減|弱|変化).{0,120}(?:女友達|女性との友情|友人関係).{0,80}(?:楽|安心|維持|続け)",
        r"(?:HRT|激素|雌激素|抗雄激素).{0,100}(?:性欲).{0,100}(?:降低|减少|減少|变化|變化).{0,120}(?:女性朋友|和女性的友谊|和女性的友誼).{0,80}(?:轻松|輕鬆|安心|维持|維持)",
    ],
    "Withdrawing when a promising date becomes real": [
        r"(?:date|dating|relationship|crush).{0,100}(?:liked|good|mutual|liked me back).{0,80}(?:left|ran|ghost|withdrew|lost interest|panic).{0,80}(?:gender|role|body|why)?",
        r"(?:デート|交際|恋愛|好きな人).{0,100}(?:うまく|両思い|好かれ).{0,80}(?:逃げ|断|冷め|怖く|理由.*分から)",
        r"(?:约会|交往|恋爱|喜欢的人).{0,100}(?:顺利|互相喜欢|喜欢我).{0,80}(?:逃跑|退出|拒绝|失去兴趣|不知道为什么)",
    ],
    "Body changes can create recognition and relief": [
        r"(?:hrt|hormones?|transition).{0,100}(?:body|skin|face|chest|voice|hair|shape).{0,100}(?:finally mine|feels right|recognize|happy|euphori|comfortable)",
        r"(?:HRT|ホルモン|性別移行).{0,100}(?:身体|肌|顔|胸|声|髪|体型).{0,100}(?:自分.*感じ|しっくり|嬉|安心|好き)",
        r"(?:HRT|激素|性别转变).{0,100}(?:身体|皮肤|脸|胸|声音|头发|身材).{0,100}(?:像自己|正确|开心|舒服|喜欢)",
    ],
    "Seeing yourself can shift from alienation to recognition": [
        r"(?:before|used to).{0,60}(?:hate|avoid|couldn't look).{0,30}(?:mirror|photo|selfie).{0,120}(?:now|after transition|hrt).{0,60}(?:love|like|recognize|happy|take photos)",
        r"(?:移行前|以前|从前).{0,60}(?:鏡|写真|自拍|镜子).{0,60}(?:嫌|苦手|讨厌|不看).{0,120}(?:今|現在|现在|移行後|转变后).{0,60}(?:好き|撮り|喜欢|爱拍)",
    ],
}

COMPILED = {title: [re.compile(pattern, re.I | re.S) for pattern in patterns] for title, patterns in PATTERNS.items()}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def telegram_export_fingerprint(directory: Path) -> dict[str, Any]:
    digest = hashlib.sha256()
    files = sorted(directory.glob("messages*.html"))
    for path in files:
        digest.update(path.name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(bytes.fromhex(sha256_file(path)))
    return {"fileCount": len(files), "contentHash": digest.hexdigest()}


def load_archive_array(archive: zipfile.ZipFile, name: str) -> list[dict[str, Any]]:
    raw = archive.read(name).decode("utf-8")
    start = raw.find("[")
    if start < 0:
        raise ValueError(f"No JSON array in {name}")
    return json.loads(raw[start:])


def telegram_status_ids(directory: Path) -> set[str]:
    ids: set[str] = set()
    for path in sorted(directory.glob("messages*.html")):
        soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
        for link in soup.select("div.message a[href]"):
            match = STATUS_ID.search(link.get("href", ""))
            if match:
                ids.add(match.group(1))
    return ids


def matches(text: str) -> list[str]:
    clean = html.unescape(text)
    if not GENDER_CONTEXT.search(clean):
        return []
    return [title for title, patterns in COMPILED.items() if any(pattern.search(clean) for pattern in patterns)]


def fetch_x_metadata(post_id: str) -> tuple[str, dict[str, str] | None]:
    request = urllib.request.Request(
        f"https://api.fxtwitter.com/i/status/{post_id}",
        headers={"Accept": "application/json", "User-Agent": "GenderExperienceIndex/0.1"},
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.load(response)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return post_id, None
    tweet = payload.get("tweet")
    if payload.get("code") != 200 or not isinstance(tweet, dict):
        return post_id, None
    if str(tweet.get("id") or "") != post_id:
        return post_id, None
    author = tweet.get("author") or {}
    return post_id, {
        "author": str(author.get("name") or author.get("screen_name") or "X user"),
        "handle": str(author.get("screen_name") or ""),
        "text": str(tweet.get("text") or ""),
        "provider": "fxtwitter",
        "hydratedAt": datetime.now(tz=UTC).isoformat(timespec="seconds"),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--x-archive", type=Path, required=True)
    parser.add_argument("--telegram", type=Path, required=True)
    parser.add_argument(
        "--data-dir", type=Path, default=Path(".private-research/mined")
    )
    parser.add_argument("--hydrate-samples", action="store_true")
    parser.add_argument("--hydrate-telegram", action="store_true")
    parser.add_argument(
        "--acknowledge-third-party-disclosure",
        action="store_true",
        help=(
            "Confirm that hydration sends IDs selected from private archives "
            "to the public metadata provider"
        ),
    )
    parser.add_argument("--max-hydrate", type=int, default=500)
    args = parser.parse_args()
    if (
        args.hydrate_samples or args.hydrate_telegram
    ) and not args.acknowledge_third_party_disclosure:
        parser.error(
            "hydration discloses the selected private-archive post IDs to a "
            "third-party provider; pass --acknowledge-third-party-disclosure"
        )
    ensure_private_path(args.data_dir)
    args.data_dir.mkdir(parents=True, exist_ok=True)
    started_at = datetime.now(tz=UTC).isoformat(timespec="microseconds")
    run_id = f"run:archive-miner:{started_at.replace(':', '-')}"
    x_archive_hash = sha256_file(args.x_archive)
    telegram_fingerprint = telegram_export_fingerprint(args.telegram)

    telegram_ids = telegram_status_ids(args.telegram)
    metadata_path = args.data_dir / "x-metadata.json"
    metadata: dict[str, dict[str, str]] = {}
    if metadata_path.exists():
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))

    if args.hydrate_telegram:
        missing_telegram = sorted(
            (post_id for post_id in telegram_ids if post_id not in metadata),
            key=int,
            reverse=True,
        )[:args.max_hydrate]
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(fetch_x_metadata, post_id) for post_id in missing_telegram]
            for future in as_completed(futures):
                post_id, item = future.result()
                if item:
                    metadata[post_id] = item
        write_private_text(
            metadata_path,
            json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        )
    records: dict[str, dict[str, Any]] = {}

    with zipfile.ZipFile(args.x_archive) as archive:
        for wrapper in load_archive_array(archive, "data/like.js"):
            item = wrapper["like"]
            post_id = str(item["tweetId"])
            records[post_id] = {
                "id": post_id,
                "url": item.get("expandedUrl") or f"https://x.com/i/status/{post_id}",
                "text": html.unescape(item.get("fullText", "")),
                "collections": ["x_like"],
            }

        for wrapper in load_archive_array(archive, "data/tweets.js"):
            item = wrapper["tweet"]
            post_id = str(item["id_str"])
            record = records.setdefault(
                post_id,
                {
                    "id": post_id,
                    "url": f"https://x.com/i/status/{post_id}",
                    "text": html.unescape(item.get("full_text", "")),
                    "collections": [],
                },
            )
            record["collections"].append("x_authored")

    for post_id in telegram_ids:
        item = metadata.get(post_id, {})
        record = records.setdefault(
            post_id,
            {
                "id": post_id,
                "url": f"https://x.com/i/status/{post_id}",
                "text": item.get("text", ""),
                "collections": [],
            },
        )
        if item.get("text"):
            record["text"] = item["text"]
        record["collections"].append("telegram_saved")

    relevant: list[dict[str, Any]] = []
    counts: dict[str, set[str]] = defaultdict(set)
    for record in records.values():
        claim_matches = matches(record["text"])
        if not claim_matches:
            continue
        record["matches"] = claim_matches
        record["collections"] = sorted(set(record["collections"]))
        relevant.append(record)
        for title in claim_matches:
            counts[title].add(record["id"])

    relevant.sort(key=lambda record: int(record["id"]), reverse=True)
    ranking = [
        {"title": title, "reportCount": len(post_ids)}
        for title, post_ids in sorted(counts.items(), key=lambda item: (-len(item[1]), item[0]))
    ]
    sample_ids: dict[str, list[str]] = defaultdict(list)
    for record in relevant:
        for title in record["matches"]:
            if len(sample_ids[title]) < 5:
                sample_ids[title].append(record["id"])

    if args.hydrate_samples:
        missing = sorted({post_id for ids in sample_ids.values() for post_id in ids if post_id not in metadata})
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(fetch_x_metadata, post_id) for post_id in missing]
            for future in as_completed(futures):
                post_id, item = future.result()
                if item:
                    metadata[post_id] = item
        write_private_text(
            metadata_path,
            json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        )

    record_by_id = {record["id"]: record for record in relevant}
    samples: dict[str, list[dict[str, str]]] = defaultdict(list)
    for title, ids in sample_ids.items():
        for post_id in ids:
            item = metadata.get(post_id, {})
            source_text = item.get("text") or record_by_id[post_id]["text"]
            excerpt = re.sub(r"\s+", " ", re.sub(r"https?://\S+", "", source_text)).strip()
            if len(excerpt) > 120:
                excerpt = excerpt[:117].rstrip() + "…"
            samples[title].append({
                "url": record_by_id[post_id]["url"],
                "author": item.get("author") or "X user",
                "handle": item.get("handle") or "",
                "excerpt": excerpt,
            })

    write_private_text(
        args.data_dir / "x-relevant.jsonl",
        "".join(
            json.dumps(record, ensure_ascii=False) + "\n" for record in relevant
        ),
    )
    write_private_text(
        args.data_dir / "ranking.json",
        json.dumps(ranking, ensure_ascii=False, indent=2) + "\n",
    )
    write_private_text(
        args.data_dir / "candidate-samples.json",
        json.dumps(samples, ensure_ascii=False, indent=2) + "\n",
    )

    completed_at = datetime.now(tz=UTC).isoformat(timespec="microseconds")
    pattern_hash = hashlib.sha256(
        json.dumps(PATTERNS, ensure_ascii=False, sort_keys=True).encode("utf-8")
    ).hexdigest()
    manifest = {
        "schemaVersion": "0.1.0",
        "id": run_id,
        "collector": "private_archive_miner",
        "collectorVersion": MINER_VERSION,
        "startedAt": started_at,
        "completedAt": completed_at,
        "inputs": {
            "xArchive": {
                "name": args.x_archive.name,
                "contentHash": x_archive_hash,
                "size": args.x_archive.stat().st_size,
            },
            "telegramExport": telegram_fingerprint,
        },
        "matcher": {"patternHash": pattern_hash, "experienceCount": len(PATTERNS)},
        "hydration": {
            "provider": "fxtwitter",
            "telegramRequested": args.hydrate_telegram,
            "samplesRequested": args.hydrate_samples,
            "maximum": args.max_hydrate,
        },
        "results": {
            "xRecords": len(records),
            "telegramStatusLinks": len(telegram_ids),
            "relevantPosts": len(relevant),
            "rankedExperiences": len(ranking),
        },
    }
    write_private_text(
        args.data_dir / "runs" / f"{started_at.replace(':', '-')}.json",
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    )

    print(json.dumps({
        "xRecords": len(records),
        "telegramStatusLinks": len(telegram_ids),
        "relevantPosts": len(relevant),
        "rankedExperiences": len(ranking),
        "top": ranking[:10],
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
