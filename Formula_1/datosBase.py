import csv
import json

# Función para convertir CSV a JSON
def csv_to_json(csv_file, json_file):
    # Abre el archivo CSV
    with open(csv_file, mode='r', encoding='utf-8') as file:
        # Lee el contenido del archivo CSV
        reader = csv.DictReader(file)

        # Lista para almacenar los datos convertidos
        data = []

        # Convierte cada fila del CSV a un diccionario y agrega a la lista de datos
        for row in reader:
            data.append(row)

    # Escribe los datos convertidos en el archivo JSON
    with open(json_file, mode='w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

# Ruta del archivo CSV
csv_file = r'C:\Users\jesus\Documents\XOLUXIONA\LINEA_VS\Formula_1\data.csv'

# Ruta del archivo JSON de salida
json_file = r'C:\Users\jesus\Documents\XOLUXIONA\LINEA_VS\Formula_1\data_convertido.json'

# Llamada a la función para convertir
csv_to_json(csv_file, json_file)

print(f"El archivo {csv_file} ha sido convertido y guardado en {json_file}")
