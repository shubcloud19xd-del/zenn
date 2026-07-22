const cursorColors = [
  "#f56565", // red
  "#ed8936", // orange
  "#ecc94b", // yellow
  "#48bb78", // green
  "#38b2ac", // teal
  "#4299e1", // blue
  "#667eea", // indigo
  "#9f7aea", // purple
  "#ed64a6", // pink
];

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return cursorColors[Math.abs(hash) % cursorColors.length];
}

export default stringToColor;
