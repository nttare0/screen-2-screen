// A locally drawn browser surface for the explicit preview. It never represents a remote stream.
export type DemoPage = 'Overview' | 'Projects' | 'Activity' | 'Files'

const pages: DemoPage[] = ['Overview', 'Projects', 'Activity', 'Files']
const projects = [
  { name: 'Website redesign', tag: 'Design', progress: 72, color: '#d9e8ff', accent: '#6c91d9', due: 'Nov 18' },
  { name: 'Brand guidelines', tag: 'Brand', progress: 46, color: '#f6e4d3', accent: '#cf9470', due: 'Nov 22' },
  { name: 'Mobile application', tag: 'Product', progress: 88, color: '#dceedd', accent: '#78aa8b', due: 'Nov 15' },
  { name: 'Q4 campaign', tag: 'Marketing', progress: 31, color: '#e9e0f5', accent: '#a18ac6', due: 'Nov 28' },
]

export class DemoSurface {
  page: DemoPage = 'Overview'
  cursor: { x: number; y: number } | null = null
  private clickAt = 0
  private clickPoint = { x: 0, y: 0 }

  click(x: number, y: number) {
    this.clickPoint = { x, y }
    this.clickAt = performance.now()
    if (x >= 28 && x <= 208) {
      const index = Math.floor((y - 186) / 48)
      if (index >= 0 && index < pages.length && (y - 186) % 48 < 40) {
        this.page = pages[index]
        return true
      }
    }
    return false
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save()
    ctx.scale(width / 1600, height / 900)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1600, 900)
    this.browserChrome(ctx)
    this.sidebar(ctx)
    ctx.save()
    ctx.translate(252, 88)
    if (this.page === 'Overview') this.overview(ctx)
    else if (this.page === 'Projects') this.projectPage(ctx)
    else if (this.page === 'Activity') this.activity(ctx)
    else this.files(ctx)
    ctx.restore()
    const age = performance.now() - this.clickAt
    if (age < 450) {
      ctx.beginPath()
      ctx.arc(this.clickPoint.x, this.clickPoint.y, 8 + age / 22, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(43, 122, 85, ${0.5 * (1 - age / 450)})`
      ctx.lineWidth = 2
      ctx.stroke()
    }
    if (this.cursor) this.pointer(ctx, this.cursor.x, this.cursor.y)
    ctx.restore()
  }

  private browserChrome(ctx: CanvasRenderingContext2D) {
    rect(ctx, 0, 0, 1600, 64, '#eef1f4', 0)
    for (let i = 0; i < 3; i++) circle(ctx, 26 + i * 20, 32, 5, ['#e5968f', '#e6c276', '#8fc6a0'][i])
    rect(ctx, 92, 14, 250, 38, '#ffffff', 9)
    text(ctx, 'Forma — Studio workspace', 112, 38, 13, '#46515c', 500)
    text(ctx, '+', 362, 39, 20, '#8a949e')
    rect(ctx, 420, 15, 760, 34, '#ffffff', 8)
    circle(ctx, 442, 32, 6, '#8db99d')
    text(ctx, 'app.forma.design / workspace', 460, 37, 13, '#6b7680')
    text(ctx, '⋮', 1560, 39, 22, '#6b7680')
    line(ctx, 0, 64, 1600, 64, '#dfe4e9')
  }

  private sidebar(ctx: CanvasRenderingContext2D) {
    rect(ctx, 0, 64, 228, 836, '#f7f8fa', 0)
    line(ctx, 228, 64, 228, 900, '#e6e9ed')
    rect(ctx, 28, 96, 30, 30, '#244d3b', 8)
    text(ctx, 'f', 38, 118, 21, '#ffffff', 700)
    text(ctx, 'Forma', 70, 118, 22, '#25312b', 700, 'display')
    text(ctx, 'WORKSPACE', 30, 166, 10, '#98a1aa', 600)
    pages.forEach((page, i) => {
      const y = 186 + i * 48
      const active = page === this.page
      if (active) rect(ctx, 20, y, 188, 40, '#e5eee8', 8)
      circle(ctx, 42, y + 20, 6, active ? '#357b58' : '#a4adb6')
      text(ctx, page, 62, y + 25, 14, active ? '#285b42' : '#68737e', active ? 600 : 400)
    })
    text(ctx, 'YOUR TEAM', 30, 424, 10, '#98a1aa', 600)
    ;['Alex Morgan', 'Jamie Chen', 'Sam Rivera'].forEach((name, i) => {
      circle(ctx, 42, 458 + i * 40, 11, ['#c9d9ef', '#ecd7c5', '#d7e6cf'][i])
      text(ctx, initials(name), 35, 462 + i * 40, 8, '#53616a', 600)
      text(ctx, name, 62, 463 + i * 40, 12, '#68737e')
    })
    rect(ctx, 20, 792, 188, 76, '#edf1f4', 10)
    text(ctx, 'Studio plan', 34, 818, 12, '#46515c', 600)
    text(ctx, '8 of 12 seats in use', 34, 840, 11, '#8a949e')
  }

  private header(ctx: CanvasRenderingContext2D, title: string, subtitle: string) {
    text(ctx, title, 32, 66, 29, '#26322c', 700, 'display')
    text(ctx, subtitle, 32, 94, 13, '#89939c')
    rect(ctx, 1080, 40, 210, 38, '#ffffff', 8)
    strokeRect(ctx, 1080, 40, 210, 38, '#e0e5e9', 8)
    text(ctx, 'November 2026', 1104, 64, 12, '#64706b', 500)
    circle(ctx, 1264, 59, 13, '#d9e7df')
    text(ctx, 'AM', 1256, 63, 8, '#456953', 600)
  }

  private overview(ctx: CanvasRenderingContext2D) {
    this.header(ctx, 'Good morning, Alex', 'Here’s what’s happening across your studio today.')
    const stats = [
      ['Active projects', '12', '+2 this month'],
      ['Tasks completed', '84%', '+12% this week'],
      ['Team members', '8', '4 online now'],
    ]
    stats.forEach(([label, value, note], i) => {
      const x = 32 + i * 426
      card(ctx, x, 130, 402, 118)
      text(ctx, label, x + 22, 162, 12, '#89939c', 500)
      text(ctx, value, x + 22, 207, 31, '#26322c', 700, 'display')
      text(ctx, note, x + 22, 230, 11, '#639477')
      rect(ctx, x + 330, 158, 46, 46, '#f0f5f2', 12)
      circle(ctx, x + 353, 181, 10, '#9fc6ad')
    })
    text(ctx, 'Recent projects', 32, 294, 17, '#26322c', 650, 'display')
    text(ctx, 'View all →', 1220, 294, 12, '#6a8f78', 500)
    projects.slice(0, 2).forEach((p, i) => this.projectCard(ctx, 32 + i * 640, 316, 616, p))
    text(ctx, 'This week’s activity', 32, 624, 17, '#26322c', 650, 'display')
    card(ctx, 32, 646, 1258, 142)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const values = [42, 68, 51, 88, 73, 36, 58]
    days.forEach((day, i) => {
      const x = 72 + i * 172
      rect(ctx, x, 742 - values[i] * 0.65, 66, values[i] * 0.65, i === 3 ? '#6fa487' : '#dce9e1', 5)
      text(ctx, day, x + 22, 770, 10, '#98a1aa')
    })
  }

  private projectPage(ctx: CanvasRenderingContext2D) {
    this.header(ctx, 'Projects', 'A little progress, every day.')
    projects.forEach((p, i) => this.projectCard(ctx, 32 + (i % 2) * 640, 140 + Math.floor(i / 2) * 312, 616, p))
  }

  private projectCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, p: (typeof projects)[number]) {
    card(ctx, x, y, w, 268)
    ctx.save()
    roundedPath(ctx, x + 12, y + 12, w - 24, 138, 9)
    ctx.clip()
    const gradient = ctx.createLinearGradient(x, y, x + w, y + 150)
    gradient.addColorStop(0, p.color)
    gradient.addColorStop(1, '#ffffff')
    ctx.fillStyle = gradient
    ctx.fillRect(x + 12, y + 12, w - 24, 138)
    circle(ctx, x + w * 0.68, y + 64, 72, p.accent)
    ctx.globalAlpha = 0.45
    circle(ctx, x + w * 0.82, y + 142, 92, p.accent)
    ctx.globalAlpha = 1
    rect(ctx, x + 44, y + 44, 142, 78, '#ffffff', 10)
    rect(ctx, x + 60, y + 62, 70, 7, p.accent, 3)
    rect(ctx, x + 60, y + 78, 104, 5, '#dfe5e9', 3)
    rect(ctx, x + 60, y + 92, 86, 5, '#dfe5e9', 3)
    ctx.restore()
    text(ctx, p.name, x + 22, y + 180, 16, '#26322c', 650, 'display')
    chip(ctx, x + 22, y + 196, p.tag)
    text(ctx, `Due ${p.due}`, x + w - 94, y + 211, 10, '#98a1aa')
    rect(ctx, x + 22, y + 238, w - 104, 6, '#edf1f4', 3)
    rect(ctx, x + 22, y + 238, (w - 104) * (p.progress / 100), 6, '#83b397', 3)
    text(ctx, `${p.progress}%`, x + w - 62, y + 245, 11, '#6a8f78', 600)
  }

  private activity(ctx: CanvasRenderingContext2D) {
    this.header(ctx, 'Activity', 'The latest updates from everyone in your studio.')
    const rows = [
      ['Jamie Chen', 'completed the homepage wireframes', '12 minutes ago'],
      ['Sam Rivera', 'uploaded Brand assets v2.zip', '38 minutes ago'],
      ['Riley Park', 'left feedback on Mobile application', '1 hour ago'],
      ['Alex Morgan', 'created the Q4 campaign project', '2 hours ago'],
      ['Jamie Chen', 'moved Website redesign to In review', 'Yesterday'],
    ]
    rows.forEach(([name, action, when], i) => {
      const y = 140 + i * 112
      card(ctx, 32, y, 1258, 92)
      circle(ctx, 76, y + 46, 19, ['#c9d9ef', '#ecd7c5', '#e3d7ef', '#d7e6cf'][i % 4])
      text(ctx, initials(name), 66, y + 50, 10, '#53616a', 600)
      text(ctx, name, 112, y + 38, 14, '#26322c', 600)
      text(ctx, action, 112, y + 62, 12, '#89939c')
      text(ctx, when, 1110, y + 49, 11, '#98a1aa')
    })
  }

  private files(ctx: CanvasRenderingContext2D) {
    this.header(ctx, 'Files', 'Everything the team is working from.')
    card(ctx, 32, 140, 1258, 620)
    text(ctx, 'Name', 64, 178, 11, '#98a1aa', 600)
    text(ctx, 'Owner', 720, 178, 11, '#98a1aa', 600)
    text(ctx, 'Modified', 1030, 178, 11, '#98a1aa', 600)
    line(ctx, 32, 196, 1290, 196, '#edf1f4')
    const rows = [
      ['Project brief.md', 'Alex Morgan', 'Today'],
      ['Design tokens.json', 'Jamie Chen', 'Today'],
      ['Research notes.txt', 'Sam Rivera', 'Yesterday'],
      ['Launch checklist.csv', 'Riley Park', 'Nov 10'],
    ]
    rows.forEach(([name, owner, when], i) => {
      const y = 222 + i * 92
      rect(ctx, 64, y, 34, 40, '#edf3ef', 6)
      text(ctx, '≡', 75, y + 26, 18, '#7fa78c')
      text(ctx, name, 116, y + 25, 14, '#46515c', 500)
      text(ctx, owner, 720, y + 25, 12, '#89939c')
      text(ctx, when, 1030, y + 25, 12, '#89939c')
      line(ctx, 64, y + 62, 1258, y + 62, '#f0f2f4')
    })
  }

  private pointer(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save()
    ctx.translate(x, y)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, 19)
    ctx.lineTo(5, 14)
    ctx.lineTo(9, 22)
    ctx.lineTo(13, 20)
    ctx.lineTo(9, 12)
    ctx.lineTo(16, 12)
    ctx.closePath()
    ctx.fillStyle = '#2f7d55'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.fill()
    ctx.stroke()
    rect(ctx, 17, 18, 38, 19, '#2f7d55', 5)
    text(ctx, 'You', 25, 31, 10, '#ffffff', 600)
    ctx.restore()
  }
}

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, r: number) {
  roundedPath(ctx, x, y, w, h, r)
  ctx.fillStyle = color
  ctx.fill()
}
function strokeRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  r: number,
) {
  roundedPath(ctx, x, y, w, h, r)
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.stroke()
}
function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.stroke()
}
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}
function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 400,
  family = 'sans',
) {
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px ${family === 'display' ? '"Manrope Variable"' : '"Inter Variable"'}, sans-serif`
  ctx.fillText(value, x, y)
}
function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  rect(ctx, x, y, w, h, '#ffffff', 12)
  strokeRect(ctx, x, y, w, h, '#e3e8eb', 12)
}
function chip(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  rect(ctx, x, y, 66, 22, '#f0f4f1', 6)
  text(ctx, label, x + 10, y + 15, 10, '#6a8f78', 500)
}
function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}
