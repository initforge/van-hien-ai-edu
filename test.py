with open('p:/edupath_english/audit_output.txt', 'rb') as f:
    lines = f.readlines()
b = lines[7]
print(b)
s = b.decode('utf-8')

# Try different encodings
def try_decode(text):
    for enc in ['cp437', 'cp1252', 'cp850', 'latin1']:
        try:
            r = text.encode(enc).decode('utf-8')
            print(f'{enc}:', repr(r))
        except:
             try:
                 r = text.encode(enc).decode('utf-8', errors='replace')
                 print(f'{enc} (replace):', repr(r))
             except: pass

import re
m = re.search(r'meaning: "(.*?)"', s)
if m:
    meaning = m.group(1)
    print("meaning:", meaning)
    try_decode(meaning)
    
    # What if it was double-encoded?
    for enc1 in ['cp437', 'cp1252', 'latin1']:
        for enc2 in ['cp437', 'cp1252', 'latin1']:
            try:
                b1 = meaning.encode(enc1)
                s1 = b1.decode('utf-8')
                b2 = s1.encode(enc2)
                s2 = b2.decode('utf-8')
                print(f'{enc1} -> utf8 -> {enc2} -> utf8:', s2)
            except: pass
