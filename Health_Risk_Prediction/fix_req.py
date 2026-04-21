import pathlib
p = pathlib.Path('requirements.txt')
data = p.read_text(encoding='utf-16le')
data = data.replace('jose', 'python-jose[cryptography]')
p.write_text(data, encoding='utf-8')
