import sys, re

def decode_vn(text):
    if text == "null": return text
    # The text was written via temp_vocab.txt using python's repr(), then lit-eval might be better if needed.
    # Actually wait, let's just attempt fixing by utf-8 decode.
    try:
        return text.encode('cp1252').decode('utf-8')
    except:
        pass
    try:
        return text.encode('latin1').decode('utf-8')
    except:
        pass
    return text

with open('p:/literature_platform/temp_vocab.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in lines:
    line = line.strip()
    if not line.startswith("'["): continue
    # Ex: '[107] admire | phonetic: "/├ëΓäód├ï╦åma├ë┬¬├ëΓäór/" | meaning: "ng├å┬░├í┬╗┬íng m├í┬╗Γäó" | issues: meaning, phonetic'
    # Use re to extract id, word, meaning
    m = re.match(r"^\'\[(\d+)\] (.*?) \| phonetic: \"(.*?)\" \| meaning: \"(.*?)\" \| issues:", line)
    if m:
        id_ = m.group(1)
        word = m.group(2)
        meaning = m.group(4)
        dec_meaning = decode_vn(meaning)
        # Double encoded check
        if '├' in dec_meaning or '├' in dec_meaning:
            try:
                dec_meaning = dec_meaning.encode('cp1252').decode('utf-8')
            except:
                pass
        print(f"{id_}|{word}|{dec_meaning}")
    else:
        # maybe no single quote
        pass
