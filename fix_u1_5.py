import sys, re

def fix(text):
    if text == 'null': return ''
    try:
        return text.encode('cp437').decode('utf-8')
    except Exception as e:
        try:
            return text.encode('windows-1252').decode('utf-8')
        except:
            return text

try:
    with open('p:/edupath_english/audit_output.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
except Exception as e:
    print('error', e)
    sys.exit(1)

out = []
unit = 0
for line in lines:
    m = re.search(r'Unit (\d+)', line)
    if m:
        unit = int(m.group(1))

    if 1 <= unit <= 5:
        m2 = re.search(r'\[(\d+)\].*?phonetic: "(.*?)".*?meaning: "(.*?)"', line)
        if m2:
            id_val = m2.group(1)
            phonetic = m2.group(2)
            meaning = m2.group(3)
            
            p = fix(phonetic)
            m = fix(meaning)
            
            p = p.replace("'", "''")
            m = m.replace("'", "''")
            out.append(f"UPDATE vocabulary SET phonetic = '{p}', meaning = '{m}' WHERE id = {id_val};")

with open('p:/edupath_english/api/src/db/seeds/fix_remaining_u1_5.sql', 'w', encoding='utf-8') as fp:
    fp.write("-- Fix vocab encoding: Units 1-5\n")
    fp.write('\n'.join(out))
    fp.write('\n')
print(f"Generated {len(out)} statements.")
