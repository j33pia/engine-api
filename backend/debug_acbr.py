
import ctypes
import os

print("--- Python ACBrLib Tester ---")
print(f"CWD: {os.getcwd()}")

lib_path = "/app/acbrlib/x64/libacbrnfe64.so"
config_path = "/tmp/acbr-21025760000123.ini"
enc_key = ""

print(f"Loading library: {lib_path}")
try:
    # Explicitly load dependencies if needed (OpenSSL)
    # ctypes.CDLL("/usr/lib/x86_64-linux-gnu/libssl.so.1.1", mode=ctypes.RTLD_GLOBAL)
    
    acbr = ctypes.CDLL(lib_path)
    print("Library loaded successfully.")
except Exception as e:
    print(f"Failed to load library: {e}")
    exit(1)

# Define function signature
# NFE_Inicializar(const char* eArqConfig, const char* eChaveCrypt)
acbr.NFE_Inicializar.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
acbr.NFE_Inicializar.restype = ctypes.c_int

print(f"Calling NFE_Inicializar with: {config_path}")
ret = acbr.NFE_Inicializar(config_path.encode('utf-8'), enc_key.encode('utf-8'))

print(f"Return Code: {ret}")

if ret != 0:
    print("Initialization Failed.")
    # Try to get last error
    # NFE_UltimoRetorno(char* sMensagem, int* esTamanho)
    acbr.NFE_UltimoRetorno.argtypes = [ctypes.c_char_p, ctypes.POINTER(ctypes.c_int)]
    acbr.NFE_UltimoRetorno.restype = ctypes.c_int
    
    buffer = ctypes.create_string_buffer(4096)
    size = ctypes.c_int(4096)
    
    acbr.NFE_UltimoRetorno(buffer, ctypes.byref(size))
    print(f"Last Error Message: {buffer.value.decode('utf-8', errors='ignore')}")
else:
    print("Initialization Success!")
    acbr.NFE_Finalizar()
