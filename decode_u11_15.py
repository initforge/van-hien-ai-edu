import re

def re_decode(text):
    if text == 'null': return ''
    try:
        return text.encode('cp1252').decode('utf-8')
    except:
        return text

try:
    with open('p:/edupath_english/audit_output.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    out = []
    record = False
    for line in lines:
        if 'Unit 11' in line: record = True
        if 'Unit 16' in line: break
        
        if record and '[' in line and ']' in line:
            # e.g.: [1021] antibiotic | phonetic: "/├ï┼Æ├â┬ªntiba├ë┬¬├ï╦å├ëΓÇÖt├ë┬¬k/" | meaning: "(n) thu├í┬╗ΓÇÿc kh├â┬íng sinh" | issues: meaning, phonetic
            m = re.search(r'\[(\d+)\] .*?\| phonetic: "(.*?)" \| meaning: "(.*?)"', line)
            if m:
                id_ = m.group(1)
                pho = m.group(2)
                mean = m.group(3)
                
                p = re_decode(pho)
                m_vn = re_decode(mean)
                
                p_esc = p.replace("'", "''")
                m_esc = m_vn.replace("'", "''")
                
                sql = "UPDATE vocabulary SET phonetic = '{}', meaning = '{}' WHERE id = {};".format(p_esc, m_esc, id_)
                out.append(sql)

    out_path = 'p:/edupath_english/api/src/db/seeds/fix_remaining_u11_15.sql'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('-- Fix vocab encoding: Units 11-15\n\n')
        f.write('\n'.join(out) + '\n')
    print('SUCCESS! Wrote 11-15 entries.')
except Exception as e:
    import traceback
    print('ERROR:', e)
    traceback.print_exc()
