import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const DECISION_LABELS = {
  allow: 'Accepted',
  deny: 'Rejected',
  flag: 'Under Review',
}

const DECISION_COLORS = {
  allow: [22, 163, 74],    // green
  deny: [220, 38, 38],     // red
  flag: [217, 119, 6],     // amber
}

const HEADER_COLOR = [30, 41, 59]    // slate-800
const ACCENT_COLOR = [79, 110, 247]  // brand indigo

/** Draws the report header with logo-like badge */
function drawHeader(doc, title, subtitle, filterLabel) {
  const pageW = doc.internal.pageSize.getWidth()

  // Top accent bar
  doc.setFillColor(...ACCENT_COLOR)
  doc.rect(0, 0, pageW, 7, 'F')

  // Title block
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...HEADER_COLOR)
  doc.text('PolicyEngine', 14, 20)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('AI-Powered Policy Evaluation System', 14, 27)

  // Right side: filter badge
  const badgeColor = DECISION_COLORS[filterLabel] || ACCENT_COLOR
  doc.setFillColor(...badgeColor)
  doc.roundedRect(pageW - 58, 13, 44, 11, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(DECISION_LABELS[filterLabel] || 'All Results', pageW - 36, 20.5, { align: 'center' })

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(14, 33, pageW - 14, 33)

  // Report title
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...HEADER_COLOR)
  doc.text(title, 14, 42)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(subtitle, 14, 49)

  // Generated at
  const now = new Date().toLocaleString()
  doc.setFontSize(8)
  doc.text(`Generated: ${now}`, pageW - 14, 49, { align: 'right' })

  return 56 // next Y position
}

/** Footer on every page */
function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(...ACCENT_COLOR)
    doc.rect(0, pageH - 7, pageW, 7, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255)
    doc.text('PolicyEngine Confidential Report', 14, pageH - 2)
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 2, { align: 'right' })
  }
}

/**
 * Download PDF for SINGLE evaluation result (EvaluatePage)
 * @param {object} result - evaluation result object
 * @param {string} filterType - 'allow' | 'deny' | 'flag' | 'all'
 * @param {object} inputData - original input fields
 */
export function downloadSingleResultPDF(result, filterType, inputData = {}) {
  if (!result) return

  const decision = result.final_decision
  if (filterType !== 'all' && decision !== filterType) {
    return { skipped: true }
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  const decLabel = DECISION_LABELS[decision] || decision.toUpperCase()
  let startY = drawHeader(
    doc,
    `Policy Evaluation Report — ${decLabel}`,
    `Policy: ${result.policy_name}`,
    filterType === 'all' ? decision : filterType
  )

  // Decision summary card
  const cardColor = DECISION_COLORS[decision] || ACCENT_COLOR
  doc.setFillColor(cardColor[0], cardColor[1], cardColor[2], 0.08)
  doc.setFillColor(
    Math.round(cardColor[0] * 0.12 + 243),
    Math.round(cardColor[1] * 0.12 + 243),
    Math.round(cardColor[2] * 0.12 + 240)
  )
  doc.roundedRect(14, startY, pageW - 28, 22, 3, 3, 'F')
  doc.setDrawColor(...cardColor)
  doc.setLineWidth(0.8)
  doc.roundedRect(14, startY, pageW - 28, 22, 3, 3, 'S')

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...cardColor)
  doc.text(decLabel, 22, startY + 9)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`${result.rules_matched} of ${result.rules_total} rules matched`, 22, startY + 16)
  doc.text(`${result.execution_time_ms}ms execution time`, pageW - 22, startY + 16, { align: 'right' })

  startY += 28

  // Input Data table
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...HEADER_COLOR)
  doc.text('Input Data', 14, startY)
  startY += 4

  const inputRows = Object.entries(inputData).map(([k, v]) => [k, String(v)])
  if (inputRows.length > 0) {
    autoTable(doc, {
      startY,
      head: [['Field', 'Value']],
      body: inputRows,
      theme: 'grid',
      headStyles: { fillColor: ACCENT_COLOR, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: HEADER_COLOR },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    })
    startY = doc.lastAutoTable.finalY + 8
  }

  // Rule Breakdown table
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...HEADER_COLOR)
  doc.text('Rule Breakdown', 14, startY)
  startY += 4

  const ruleRows = (result.results || []).map(r => [
    r.rule_name,
    r.matched ? '✓ Passed' : '✗ Failed',
    r.matched ? (r.actions_triggered || []).join(', ').toUpperCase() : '—',
    (r.conditions_evaluated || [])
      .map(c => `${c.field} ${c.operator} ${c.expected} → ${c.actual ?? 'null'} (${c.passed ? 'pass' : 'fail'})`)
      .join('\n'),
  ])

  autoTable(doc, {
    startY,
    head: [['Rule', 'Status', 'Actions', 'Conditions']],
    body: ruleRows,
    theme: 'grid',
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: {
        cellWidth: 22,
        fontStyle: 'bold',
      },
      2: { cellWidth: 28 },
      3: { cellWidth: 'auto' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const val = data.cell.raw
        if (val && val.includes('✓')) {
          doc.setTextColor(22, 163, 74)
        } else {
          doc.setTextColor(220, 38, 38)
        }
      }
    },
  })

  addFooter(doc)
  const filename = `policy_${decision}_${Date.now()}.pdf`
  doc.save(filename)
  return { saved: filename }
}

/**
 * Download PDF for BULK evaluation results (BulkEvaluatePage / EvaluationsPage)
 * @param {Array}  rows       - array of row objects with _result field (BulkEvaluatePage) OR plain eval objects
 * @param {string} filterType - 'allow' | 'deny' | 'flag' | 'all'
 * @param {Array}  headers    - CSV header columns (optional, for bulk)
 * @param {string} policyName - policy name label
 * @param {boolean} isBulk   - true for BulkEvaluatePage, false for EvaluationsPage history
 */
export function downloadBulkResultPDF(rows, filterType, headers = [], policyName = '', isBulk = true) {
  // Filter rows
  const filtered = rows.filter(r => {
    const dec = isBulk ? r._result?.final_decision : r.final_decision
    return dec && (filterType === 'all' || dec === filterType)
  })

  if (!filtered.length) return { empty: true }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const filterLabel = filterType === 'all' ? 'all' : filterType
  const decLabel = filterType === 'all' ? 'All Results' : DECISION_LABELS[filterType] || filterType

  let startY = drawHeader(
    doc,
    `Bulk Evaluation Report — ${decLabel}`,
    policyName ? `Policy: ${policyName}  ·  ${filtered.length} records` : `${filtered.length} records`,
    filterLabel
  )

  // Summary bar
  const allowC = filtered.filter(r => (isBulk ? r._result?.final_decision : r.final_decision) === 'allow').length
  const denyC  = filtered.filter(r => (isBulk ? r._result?.final_decision : r.final_decision) === 'deny').length
  const flagC  = filtered.filter(r => (isBulk ? r._result?.final_decision : r.final_decision) === 'flag').length
  const pageW = doc.internal.pageSize.getWidth()

  // mini stat boxes
  const statBoxes = [
    { label: 'Accepted', val: allowC, color: DECISION_COLORS.allow },
    { label: 'Rejected', val: denyC,  color: DECISION_COLORS.deny },
    { label: 'Under Review', val: flagC, color: DECISION_COLORS.flag },
    { label: 'Total', val: filtered.length, color: ACCENT_COLOR },
  ]
  const boxW = 38, boxH = 14, boxGap = 6
  const totalBoxW = statBoxes.length * boxW + (statBoxes.length - 1) * boxGap
  let bx = (pageW - totalBoxW) / 2
  statBoxes.forEach(b => {
    doc.setFillColor(b.color[0], b.color[1], b.color[2])
    doc.roundedRect(bx, startY, boxW, boxH, 2, 2, 'F')
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(String(b.val), bx + boxW / 2, startY + 7, { align: 'center' })
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(b.label, bx + boxW / 2, startY + 12, { align: 'center' })
    bx += boxW + boxGap
  })
  startY += boxH + 8

  // Build table
  let tableHead, tableBody
  if (isBulk) {
    const dataHeaders = headers.length ? headers : Object.keys(filtered[0]).filter(k => !k.startsWith('_'))
    tableHead = [[...dataHeaders, 'Decision', 'Rules', 'Time (ms)']]
    tableBody = filtered.map(row => {
      const dec = row._result?.final_decision || ''
      return [
        ...dataHeaders.map(h => String(row[h] ?? '—')),
        DECISION_LABELS[dec] || dec.toUpperCase(),
        `${row._result?.rules_matched ?? ''}/${row._result?.rules_total ?? ''}`,
        String(row._result?.execution_time_ms ?? '—'),
      ]
    })
  } else {
    // EvaluationsPage history
    tableHead = [['Date', 'Policy', 'Decision', 'Rules Matched', 'Time (ms)', 'Evaluated By']]
    tableBody = filtered.map(ev => [
      new Date(ev.evaluated_at).toLocaleString(),
      ev.policy_name,
      DECISION_LABELS[ev.final_decision] || ev.final_decision.toUpperCase(),
      `${ev.rules_matched}/${ev.rules_total}`,
      String(ev.execution_time_ms),
      ev.evaluated_by,
    ])
  }

  // Color rows by decision
  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: HEADER_COLOR },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const decisionCol = isBulk ? headers.length : 2
      // color the decision cell
      const decCell = data.row.cells[decisionCol]
      const decText = decCell?.raw || ''
      if (decText.includes('Accept')) {
        data.row.cells[decisionCol].styles.textColor = [22, 163, 74]
        data.row.cells[decisionCol].styles.fontStyle = 'bold'
      } else if (decText.includes('Reject')) {
        data.row.cells[decisionCol].styles.textColor = [220, 38, 38]
        data.row.cells[decisionCol].styles.fontStyle = 'bold'
      } else if (decText.includes('Review')) {
        data.row.cells[decisionCol].styles.textColor = [217, 119, 6]
        data.row.cells[decisionCol].styles.fontStyle = 'bold'
      }
    },
  })

  addFooter(doc)
  const filename = `bulk_${filterType}_${Date.now()}.pdf`
  doc.save(filename)
  return { saved: filename }
}
