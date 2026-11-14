import json, urllib.request, re, os

def get(url):
    with urllib.request.urlopen(url, timeout=40) as r:
        return json.load(r)

DIA = set(range(0x064B, 0x0660)) | {0x0670, 0x0653, 0x0654, 0x0655, 0x06D6, 0x06ED} | set(range(0x0610, 0x061B)) | set(range(0x06D6, 0x06EE))

def is_dia(c):
    return ord(c) in DIA or ord(c) in (0x0651, 0x0640)

def norm_char(c):
    if c in ("\u0671", "\u0623", "\u0625", "\u0622"):
        return "\u0627"
    return c

def skel_map(t):
    """returns skeleton string + list of original indices per skeleton char"""
    chars, idx = [], []
    for i, c in enumerate(t):
        if is_dia(c) or c.isspace():
            continue
        chars.append(norm_char(c))
        idx.append(i)
    return "".join(chars), idx

def clean(t):
    return t.replace("\ufeff", "").replace("\u200f", "").strip()

def strip_basmala(t):
    t = clean(t)
    sk, idx = skel_map(t)
    key = "\u0628\u0633\u0645\u0627\u0644\u0644\u0647\u0627\u0644\u0631\u062d\u0645\u0646\u0627\u0644\u0631\u062d\u064a\u0645"  # بسم الله الرحمن الرحيم
    if sk.startswith(key):
        cut = idx[len(key) - 1] + 1
        while cut < len(t) and is_dia(t[cut]):
            cut += 1
        return t[cut:].strip()
    return t

def pretty_name(n):
    n = n.replace("\ufeff", "")
    out = []
    for c in n:
        if is_dia(c):
            continue
        out.append("\u0627" if c == "\u0671" else c)
    name = re.sub(r"^\u0633\u0648\u0631\u0629\s*", "", "".join(out)).strip()
    return name

surahs = {}

# Fatiha (juz 1) — the very first thing a child learns
f = get("https://api.alquran.cloud/v1/surah/1/quran-uthmani")["data"]
surahs[1] = {"number": 1, "name": f["name"], "englishName": f["englishName"],
                  "ayahCount": f["numberOfAyahs"], "juz": 1,
                  "ayahs": [{"n": a["numberInSurah"], "g": a["number"], "text": a["text"]} for a in f["ayahs"]]}

for juz in (30, 29):
    d = get(f"https://api.alquran.cloud/v1/juz/{juz}/quran-uthmani")["data"]
    for a in d["ayahs"]:
        sn = a["surah"]["number"]
        if sn not in surahs:
            surahs[sn] = {"number": sn, "name": a["surah"]["name"], "englishName": a["surah"]["englishName"],
                          "ayahCount": a["surah"]["numberOfAyahs"], "juz": juz, "ayahs": []}
        surahs[sn]["ayahs"].append({"n": a["numberInSurah"], "g": a["number"], "text": a["text"]})

out = []
for sn in sorted(surahs):
    s = surahs[sn]
    ayahs = []
    for a in sorted(s["ayahs"], key=lambda x: x["n"]):
        txt = clean(a["text"])
        if a["n"] == 1 and sn != 1:
            txt = strip_basmala(txt)
        ayahs.append({"n": a["n"], "text": txt,
                      "audio": f"https://cdn.islamic.network/quran/audio/128/ar.alafasy/{a['g']}.mp3"})
    name = pretty_name(s["name"])
    out.append({"n": sn, "name": name, "en": s["englishName"], "count": len(ayahs),
                "juz": 1 if sn == 1 else s["juz"], "ayahs": ayahs})

# sanity checks
assert len(out) == 49, len(out)          # 37 (juz30) + 11 (juz29) + Fatiha
assert out[0]["n"] == 1 and out[0]["count"] == 7
assert any(x["n"] == 114 and x["count"] == 6 for x in out)
assert any(x["n"] == 67 and x["count"] == 30 for x in out)
j30 = [x for x in out if x["juz"] == 30]
assert len(j30) == 37, len(j30)

js = "/* بيانات القرآن — مولّدة آلياً من api.alquran.cloud (نص عثماني) — لا تُعدّل يدوياً */\n"
js += "window.QURAN = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
open("app/js/quran-data.js", "w", encoding="utf-8").write(js)
print("surahs:", len(out), "bytes:", os.path.getsize("app/js/quran-data.js"))
print([x["n"] for x in out])
