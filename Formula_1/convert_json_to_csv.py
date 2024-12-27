import json
import pandas as pd

# Cargar el archivo JSON
with open('data.json', 'r', encoding='utf-8') as file:
    json_data = json.load(file)

# Extraer los datos del JSON
data = json_data["filas a programar"]

# Crear un DataFrame de pandas
df = pd.DataFrame(data)

# Guardar el archivo en formato CSV
df.to_csv('output.csv', index=False, encoding='utf-8')

# Guardar el archivo en formato Excel
df.to_excel('output.xlsx', index=False, engine='openpyxl')

print("Conversión completada. Se generaron los archivos 'output.csv' y 'output.xlsx'.")
