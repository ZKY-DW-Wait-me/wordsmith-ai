export interface GuardReport {
  removedStyleTags: number
  removedStylesheetLinks: number
  convertedUnits: number
  enforcedBodyStyle: boolean
  tablesProcessed: number
  mathMlNodesRemoved: number
}

export interface GuardResult {
  html: string
  report: GuardReport
}

/** 排版配置：守卫层据此强制套用到 body 与段落，使其符合 Word 粘贴标准 */
export interface GuardTypography {
  fontFamily: string
  fontSizePt: number
  fontFamilyWestern?: string
  lineHeightMode?: 'multiple' | 'fixed'
  lineHeightValue?: number
  letterSpacingPt?: number
  paragraphSpaceBeforePt?: number
  paragraphSpaceAfterPt?: number
  firstLineIndentValue?: number
  firstLineIndentUnit?: 'char' | 'pt'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  color?: string
}

