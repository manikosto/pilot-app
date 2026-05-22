export interface PaletteColor {
  id: string;
  label: string;
  hexValue: string;
}

export const TASK_CARD_PALETTE: PaletteColor[] = [
  { id: "white", label: "Default", hexValue: "#ffffff" },
  { id: "red", label: "Red", hexValue: "#FCA5A5" },
  { id: "orange", label: "Orange", hexValue: "#FDBA74" },
  { id: "yellow", label: "Yellow", hexValue: "#FDE047" },
  { id: "green", label: "Green", hexValue: "#86EFAC" },
  { id: "teal", label: "Teal", hexValue: "#5EEAD4" },
  { id: "blue", label: "Blue", hexValue: "#93C5FD" },
  { id: "purple", label: "Purple", hexValue: "#C4B5FD" },
];
