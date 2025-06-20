import time

import pygame
import pygame.midi


def print_devices():
    for i in range(pygame.midi.get_count()):
        device_info = pygame.midi.get_device_info(i)
        nombre = device_info[1].decode("utf-8")
        entrada = device_info[2]
        salida = device_info[3]
        print(f"ID: {i}")
        print(f"Nombre: {nombre}")
        print(f"Entrada: {entrada}")
        print(f"Salida: {salida}")
        print("-------------------------")


def main():
    pygame.init()
    pygame.midi.init()

    print("Dispositivos MIDI disponibles:")
    print_devices()

    try:
        device_id = int(
            input("Ingrese el ID del dispositivo MIDI que desea monitorear: ")
        )
        input_device = pygame.midi.Input(device_id)

        print("Monitoreando mensajes MIDI. Presione Ctrl+C para salir.")

        while True:
            if input_device.poll():
                eventos = input_device.read(1)
                for evento in eventos:
                    mensaje = evento[0]
                    timestamp = evento[1]

                    status = mensaje[0]
                    data1 = mensaje[1] if len(mensaje) > 1 else None
                    data2 = mensaje[2] if len(mensaje) > 2 else None

                    # Mensajes CC (Control Change)
                    if 176 <= status <= 191:
                        canal = status - 176
                        cc_num = data1
                        valor = data2
                        print(f"Canal MIDI: {canal+1}, CC: {cc_num}, Valor: {valor}")
                    # Note On
                    elif 144 <= status <= 159:
                        canal = status - 144
                        nota = data1
                        velocidad = data2
                        print(
                            f"Canal MIDI: {canal+1}, Note ON, Nota: {nota}, Velocidad: {velocidad}"
                        )
                    # Note Off
                    elif 128 <= status <= 143:
                        canal = status - 128
                        nota = data1
                        velocidad = data2
                        print(
                            f"Canal MIDI: {canal+1}, Note OFF, Nota: {nota}, Velocidad: {velocidad}"
                        )
                    # Program Change
                    elif 192 <= status <= 207:
                        canal = status - 192
                        programa = data1
                        print(f"Canal MIDI: {canal+1}, Program Change: {programa}")
                    # Pitch Bend
                    elif 224 <= status <= 239:
                        canal = status - 224
                        lsb = data1
                        msb = data2
                        print(
                            f"Canal MIDI: {canal+1}, Pitch Bend, LSB: {lsb}, MSB: {msb}"
                        )
                    # Otros mensajes
                    else:
                        print(f"Mensaje MIDI desconocido: {mensaje}")

            time.sleep(0.001)  # Pequeña pausa para no saturar el CPU

    except KeyboardInterrupt:
        print("\nPrograma terminado por el usuario")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        if "input_device" in locals():
            input_device.close()
        pygame.midi.quit()
        pygame.quit()


if __name__ == "__main__":
    main()
