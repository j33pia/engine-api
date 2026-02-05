#!/usr/bin/env python3
"""
Minimal ACBrLib test to get exact error code and message
"""
import ctypes
import os

lib_path = "/app/acbrlib/x64/libacbrnfe64.so"
ini_path = "/tmp/acbr-21025760000123.ini"

print(f"Loading library: {lib_path}")
print(f"INI file: {ini_path}")
print(f"INI exists: {os.path.exists(ini_path)}")

# Load library
acbr = ctypes.CDLL(lib_path)

# Define function signatures
acbr.NFE_Inicializar.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
acbr.NFE_Inicializar.restype = ctypes.c_int

acbr.NFE_UltimoRetorno.argtypes = [ctypes.c_char_p, ctypes.POINTER(ctypes.c_int)]
acbr.NFE_UltimoRetorno.restype = ctypes.c_int

# Try to initialize
print("\n=== Calling NFE_Inicializar ===")
ret = acbr.NFE_Inicializar(ini_path.encode('utf-8'), b"")
print(f"NFE_Inicializar return code: {ret}")

# Get last error message
if ret != 0:
    buffer = ctypes.create_string_buffer(9096)
    buffer_len = ctypes.c_int(9096)
    acbr.NFE_UltimoRetorno(buffer, ctypes.byref(buffer_len))
    error_msg = buffer.value.decode('utf-8', errors='ignore')
    print(f"\n=== ERROR MESSAGE ===")
    print(error_msg)
else:
    print("\n=== SUCCESS ===")
    print("Library initialized successfully!")
