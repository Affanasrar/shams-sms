// app/api/admin/reports/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import prisma from '@/lib/prisma'
import { AttendanceReport } from '@/components/pdf'

export async function POST(request: NextRequest) {
  try {
    const { type, data, formatId } = await request.json()

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
    }

    // Get report format settings
    let format
    if (formatId && formatId !== 'default') {
      format = await prisma.reportFormat.findUnique({
        where: { id: formatId }
      })
    }

    if (!format) {
      // Use default format
      format = {
        id: 'default',
        reportType: 'ATTENDANCE',
        name: 'Default Attendance Report',
        showLogo: false,
        logoPosition: 'header',
        headerText: null,
        footerText: null,
        titleFontSize: 24,
        titleFontFamily: 'Helvetica-Bold',
        subtitleFontSize: 18,
        subtitleFontFamily: 'Helvetica-Bold',
        bodyFontSize: 12,
        bodyFontFamily: 'Helvetica',
        primaryColor: '#1f2937',
        secondaryColor: '#374151',
        accentColor: '#3b82f6',
        backgroundColor: '#ffffff',
        pageOrientation: 'landscape',
        pageSize: 'A4',
        marginTop: 30,
        marginBottom: 30,
        marginLeft: 20,
        marginRight: 20,
        showGeneratedDate: true,
        showPageNumbers: true,
        showInstitutionInfo: true,
        institutionName: 'SHAMS COMMERCIAL INSTITUTE',
        institutionAddress: null,
        institutionPhone: null,
        institutionEmail: null,
        monthlyShowStudentDetails: true,
        monthlyShowPaymentHistory: true,
        studentShowFeeBreakdown: true,
        studentShowPaymentTimeline: true,
        courseShowStudentList: true,
        overallShowCharts: true,
        overallShowMonthlyTrends: true
      }
    }

    let pdfComponent

    switch (type) {
      case 'attendance':
        pdfComponent = <AttendanceReport data={data} generatedAt={new Date()} format={format} />
        break
      default:
        return NextResponse.json({ error: 'Unsupported report type' }, { status: 400 })
    }

    const buffer = await renderToBuffer(pdfComponent)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="report.pdf"'
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}