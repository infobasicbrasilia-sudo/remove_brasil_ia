import sys
from rembg import remove
from PIL import Image
import io

if len(sys.argv) != 3:
    print("Uso: python remove_bg.py <input_path> <output_path>")
    sys.exit(1)

input_path = sys.argv[1]
output_path = sys.argv[2]

with open(input_path, 'rb') as i:
    input_data = i.read()
    output_data = remove(input_data)

with open(output_path, 'wb') as o:
    o.write(output_data)

print("Fundo removido com sucesso!")