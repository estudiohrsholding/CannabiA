import os
import sys
import argparse

def consolidate_files(root_dir, output_file, extensions=None, exclude_dirs=None, exclude_files=None):
    """
    Recorre el directorio raíz y sus subdirectorios, consolidando el contenido de los
    archivos especificados en un único archivo de texto.

    Args:
        root_dir (str): La ruta al directorio raíz a escanear.
        output_file (str): La ruta al archivo de texto de salida.
        extensions (list, optional): Extensiones de archivo a incluir. Si es None, incluye todos.
        exclude_dirs (list, optional): Nombres de directorios a excluir.
        exclude_files (list, optional): Nombres de archivos a excluir.
    """
    if extensions is None: extensions = []
    if exclude_dirs is None: exclude_dirs = []
    if exclude_files is None: exclude_files = []

    # Añadimos el propio archivo de salida a la lista de exclusión
    abs_output_file = os.path.abspath(output_file)
    exclude_files.append(os.path.basename(abs_output_file))

    try:
        with open(output_file, 'w', encoding='utf-8', errors='ignore') as outfile:
            for dirpath, dirnames, filenames in os.walk(root_dir, topdown=True):
                # Exclusión de directorios
                dirnames[:] = [d for d in dirnames if d not in exclude_dirs]

                for filename in filenames:
                    # Comprobación de exclusión de archivos
                    if filename in exclude_files:
                        continue
                    
                    file_path = os.path.join(dirpath, filename)
                    
                    # Filtrado por extensión
                    if not extensions or any(filename.endswith(ext) for ext in extensions):
                        try:
                            outfile.write(f"\n{'='*50}\n")
                            outfile.write(f"RUTA DEL ARCHIVO: {os.path.relpath(file_path, root_dir)}\n")
                            outfile.write(f"{'='*50}\n\n")

                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                                content = infile.read()
                                outfile.write(content)
                                outfile.write('\n')

                        except Exception as e:
                            print(f"ADVERTENCIA: No se pudo procesar el archivo {file_path}. Error: {e}")

        print(f"✅ ¡Proceso completado! Archivos consolidados en: {output_file}")

    except IOError as e:
        print(f"CRÍTICO: Error al escribir en el archivo de salida {output_file}. Error: {e}")
    except Exception as e:
        print(f"CRÍTICO: Ha ocurrido un error inesperado. Error: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description="Consolida archivos de la carpeta actual y subcarpetas en un único archivo de texto.",
        formatter_class=argparse.RawTextHelpFormatter
    )

    # --- CAMBIO PRINCIPAL: El argumento 'output_file' ahora es OPCIONAL ---
    # nargs='?': Significa que el argumento puede aparecer 0 o 1 vez.
    # default=None: Si no aparece, su valor será None.
    parser.add_argument("output_file", nargs='?', default=None,
                        help="Nombre opcional del archivo de salida. Si no se especifica, se genera uno automáticamente.")
    
    parser.add_argument("-e", "--extensions", nargs='+',
                        help="Lista de extensiones a incluir (ej. py txt md). Si no se especifica, se incluyen todos.")
    
    parser.add_argument("-x", "--exclude", nargs='+',
                        default=['.git', '__pycache__', 'node_modules', '.vscode', 'venv'],
                        help="Directorios a excluir (por defecto: .git __pycache__ node_modules .vscode venv).")

    args = parser.parse_args()

    # Determinar el directorio de ejecución
    current_script_path = os.path.abspath(sys.argv[0])
    script_directory = os.path.dirname(current_script_path)
    script_filename = os.path.basename(current_script_path)
    
    # --- LÓGICA PARA EL NOMBRE DE ARCHIVO AUTOMÁTICO ---
    if args.output_file is None:
        # Usamos el nombre de la carpeta actual para el archivo de salida
        folder_name = os.path.basename(script_directory)
        output_filename = f"{folder_name}_consolidado.txt"
    else:
        output_filename = args.output_file

    print(f"ℹ️  Directorio de trabajo: {script_directory}")
    print(f"ℹ️  Archivo de salida: {output_filename}")
    
    # Lista de archivos a excluir siempre: el propio script
    files_to_exclude = [script_filename]

    if args.extensions:
        formatted_extensions = [f".{ext.lstrip('.')}" for ext in args.extensions]
    else:
        formatted_extensions = None

    consolidate_files(
        root_dir=script_directory,
        output_file=output_filename,
        extensions=formatted_extensions,
        exclude_dirs=args.exclude,
        exclude_files=files_to_exclude
    )