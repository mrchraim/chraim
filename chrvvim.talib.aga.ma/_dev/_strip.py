# -*- coding: utf-8 -*-
import os, re
p = os.path.join(os.path.dirname(__file__), 'app.js')
with open(p, 'r', encoding='utf-8') as f:
    s = f.read()
s2 = re.sub(r"(?<=(?:ar|fr|en):')\s*✅\s*", '', s)
s2 = s2.replace(" ✅'", "'").replace("✅'", "'")
if s2 != s:
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s2)
    print('changed')
else:
    print('nochange')
