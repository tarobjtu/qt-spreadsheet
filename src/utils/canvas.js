export function font(style1 = {}, style2 = {}) {
  const style = { ...style1, ...style2 }
  const { bold, italic, fontSize, fontFamily } = style
  return `${italic ? 'italic' : ''} ${bold ? 'bold' : ''} ${fontSize}px ${fontFamily}`
}

export default {
  font,
}
