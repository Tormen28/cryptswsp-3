"use client";
import React from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Aquí puedes agregar lógica de tema si tienes, por ahora solo retorna los children
  return <>{children}</>;
}
