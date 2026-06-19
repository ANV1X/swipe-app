import os
import re

with open('swipe-backend.txt', 'r', encoding='utf-8') as f:
    content = f.read()

parts = re.split(r'=== (.+?) ===', content)

# Убираем первый пустой элемент
if parts and not parts[0].strip():
    parts = parts[1:]

for i in range(0, len(parts), 2):
    if i + 1 >= len(parts):
        break
    path = parts[i].strip()
    code = parts[i + 1].strip()
    if not path:
        continue
    # Удаляем возможный BOM
    path = path.replace('\ufeff', '')
    dirname = os.path.dirname(path)
    if dirname:
        os.makedirs(dirname, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)

print("✅ Все файлы успешно созданы!")